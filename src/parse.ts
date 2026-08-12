/**
 * Parser for the Chelsea Reservations tennis court sheet (`GridView2` table).
 *
 * The sheet is a flat table with one row per (time, facility, court) combo
 * that the site chose to schedule — it is NOT a full cross-product of every
 * time and every court. Missing combos become `null` cells in the output so
 * the frontend can distinguish "not offered at this time" from "offered but
 * open".
 *
 * Dependency-free by design, matching src/chelsea.ts.
 */
import { CourtSheet, Facility, FacilityCell, FacilitySlot, ScrapeError } from "./types";

/** Facilities are rendered in this fixed order; anything unexpected is appended. */
const FACILITY_ORDER = ["South", "North", "West"];

/** Matches the GridView2 table, tolerating attribute order around `id="GridView2"`. */
const GRIDVIEW_RE = /<table\b[^>]*\bid=["']GridView2["'][^>]*>([\s\S]*?)<\/table>/i;
const ROW_RE = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
const CELL_RE = /<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi;

/** Strips tags, decodes the handful of entities the sheet emits, and trims. */
function cleanCell(rawInner: string): string {
  const withoutTags = rawInner.replace(/<[^>]*>/g, "");
  const decoded = withoutTags
    .replace(/&nbsp;/gi, "")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&amp;/gi, "&");
  return decoded.trim();
}

function extractCells(rowHtml: string): string[] {
  const cells: string[] = [];
  CELL_RE.lastIndex = 0;
  for (const match of rowHtml.matchAll(CELL_RE)) {
    cells.push(cleanCell(match[1]));
  }
  return cells;
}

interface ParsedRow {
  time: string;
  facility: string;
  court: string;
  players: string[];
}

/** Parses `h:mm AM/PM` into minutes-since-midnight for chronological sort. */
function timeToMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = parseInt(match[1], 10) % 12;
  const minute = parseInt(match[2], 10);
  if (/pm/i.test(match[3])) hour += 12;
  return hour * 60 + minute;
}

/** Strips leading zeros from a court number, e.g. "01" -> "1". */
function normalizeCourtNumber(raw: string): string {
  const stripped = raw.replace(/^0+(?=\d)/, "");
  return stripped.length ? stripped : raw;
}

export function parseCourtSheet(html: string, dateISO: string, fetchedAt: string): CourtSheet {
  const tableMatch = GRIDVIEW_RE.exec(html);
  if (!tableMatch) {
    throw new ScrapeError("PARSE_FAILED", "GridView2 not found");
  }
  const tableInner = tableMatch[1];

  ROW_RE.lastIndex = 0;
  const rowMatches = [...tableInner.matchAll(ROW_RE)];
  if (rowMatches.length === 0) {
    throw new ScrapeError("PARSE_FAILED", "GridView2 has no rows");
  }

  const headerCells = extractCells(rowMatches[0][1]);
  const headerText = headerCells.join("|");
  if (!headerCells.some((c) => /time/i.test(c)) || !headerCells.some((c) => /facility/i.test(c))) {
    throw new ScrapeError(
      "PARSE_FAILED",
      `GridView2 header does not look right (expected Time & Facility columns, got "${headerText}")`,
    );
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < rowMatches.length; i++) {
    const cells = extractCells(rowMatches[i][1]);
    if (cells.length !== 7) continue; // skip anything that isn't a data row
    const [time, facility, court, p1, p2, p3, p4] = cells;
    if (!time || !facility || !court) continue;
    const players = [p1, p2, p3, p4].filter((p) => p.length > 0);
    rows.push({ time, facility, court, players });
  }

  if (rows.length === 0) {
    throw new ScrapeError("PARSE_FAILED", "GridView2 has a header but no data rows");
  }

  // Group rows by facility, preserving per-facility court and time sets.
  const byFacility = new Map<string, ParsedRow[]>();
  for (const row of rows) {
    const list = byFacility.get(row.facility);
    if (list) list.push(row);
    else byFacility.set(row.facility, [row]);
  }

  const facilityNames = [
    ...FACILITY_ORDER.filter((name) => byFacility.has(name)),
    ...[...byFacility.keys()].filter((name) => !FACILITY_ORDER.includes(name)),
  ];

  const facilities: Facility[] = facilityNames.map((name) => {
    const facilityRows = byFacility.get(name)!;

    const courtSet = new Set<string>();
    const timeSet = new Set<string>();
    for (const row of facilityRows) {
      courtSet.add(row.court);
      timeSet.add(row.time);
    }

    const courtsSorted = [...courtSet].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const timesSorted = [...timeSet].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    const courtLabels = courtsSorted.map((c) => `Court ${normalizeCourtNumber(c)}`);

    const cellByKey = new Map<string, FacilityCell>();
    for (const row of facilityRows) {
      const cell: FacilityCell = {
        players: row.players,
        text: row.players.join(", "),
        reserved: row.players.length > 0,
      };
      cellByKey.set(`${row.time}|${row.court}`, cell);
    }

    const slots: FacilitySlot[] = timesSorted.map((time) => ({
      time,
      cells: courtsSorted.map((court) => cellByKey.get(`${time}|${court}`) ?? null),
    }));

    return { name, courts: courtLabels, slots };
  });

  return { date: dateISO, facilities, fetchedAt };
}
