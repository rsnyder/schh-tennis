// The /tv digital-signage page (also served at /tv/static for the URLs
// already configured on the TVs).
//
// Architecture: server-rendered core with progressive enhancement. The Worker
// renders the complete grid — layout, name/event formatting, font sizing — at
// request time, and the page auto-updates purely via <meta http-equiv=
// "refresh"> (data refresh when pinned, screen rotation when not). It is
// fully functional with JavaScript disabled; the single small <script> is an
// optional enhancement (live clock) that no-JS viewers simply never see.
import { version as APP_VERSION } from "../package.json";
import { todayInNewYork } from "./date";
import type { CourtSheet, Facility, FacilityCell, FacilitySlot } from "./types";

export type StaticScreen = "south" | "northwest";

export interface RenderStaticSignageOptions {
  screen: StaticScreen;
  /** Seconds until the page's <meta refresh> reloads (same URL). */
  refreshSeconds: number;
  /** Disables the hide-past-slots filter (?all=1). */
  showAll: boolean;
  /** Shows the "OLDER DATA" chip. */
  stale: boolean;
  /** Simulated "now" in minutes-since-midnight ET (?time= preview tool). */
  nowMinOverride?: number;
}

export interface RenderStaticUnavailableOptions {
  errorCode?: string;
  refreshSeconds: number;
}

const STALE_MINUTES_CUTOFF = 90;
const MAX_NAME_CHARS = 12;

/* ------------------------------------------------------------------ */
/* America/New_York time helpers (never trust the runtime's local tz) */
/* ------------------------------------------------------------------ */

function nyPartsMap(date: Date): Record<string, string> {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) map[part.type] = part.value;
  return map;
}

function nyMinutesSinceMidnight(date: Date): number {
  const p = nyPartsMap(date);
  const h = parseInt(p.hour, 10) % 24;
  const m = parseInt(p.minute, 10);
  return h * 60 + m;
}

function nyUpdatedLabel(iso: string): string {
  try {
    const dt = new Date(iso);
    const t = dt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    });
    return "As of " + t;
  } catch {
    return "";
  }
}

// sheet.date is "YYYY-MM-DD". Split it by hand rather than doing
// `new Date("YYYY-MM-DD")` (which parses as UTC midnight and can render as
// the previous day once formatted in a US timezone).
function nyDateLabel(ymd: string): string {
  const parts = String(ymd).split("-");
  if (parts.length !== 3) return String(ymd);
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/* slot time parsing / filtering                                      */
/* ------------------------------------------------------------------ */

function slotMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(t).trim());
  if (!m) return null;
  let h = parseInt(m[1], 10) % 12;
  const mi = parseInt(m[2], 10);
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + mi;
}

function splitTime(t: string): { hm: string; ap: string } {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(t).trim());
  if (!m) return { hm: String(t), ap: "" };
  const hour = parseInt(m[1], 10);
  return { hm: hour + ":" + m[2], ap: m[3].toUpperCase() };
}

function filterSlots(slots: FacilitySlot[], nowMin: number, showAll: boolean): FacilitySlot[] {
  if (showAll) return slots;
  const cutoff = nowMin - STALE_MINUTES_CUTOFF;
  return slots.filter((s) => {
    const mins = slotMinutes(s.time);
    return mins === null || mins >= cutoff;
  });
}

/* ------------------------------------------------------------------ */
/* player name / event formatting (mirrors the client JS in signage.ts) */
/* ------------------------------------------------------------------ */

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}

function titleCaseWord(w: string): string {
  if (!w) return w;
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

// Last name only ("JUDY NICOLETTI" -> "Nicoletti") — conserves width so the
// font-size estimate can pick a larger font on the 12-column South grid.
// Extra-long surnames are ellipsized so a single outlier can't drag the
// global font down.
function shortenName(name: string): string {
  const tokens = String(name)
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return "";
  let out = tokens.length === 1 ? titleCaseWord(tokens[0]) : tokens.slice(1).map(titleCaseWord).join(" ");
  if (out.length > MAX_NAME_CHARS) out = out.slice(0, MAX_NAME_CHARS - 1) + "…";
  return out;
}

// League/event entries ("INTRA-MATCH 4.0 WOMENS ADULT", "USTA-MATCH ...",
// "SC PATTERSON", "VS", team names) are not person names and must not be
// initialized. Heuristic: digits, "-MATCH", a bare "VS", "Lesson", or a
// leading "*".
function isEventEntry(entry: string): boolean {
  const s = String(entry).trim();
  return /\d/.test(s) || /-MATCH/i.test(s) || /^VS\.?$/i.test(s) || /^Lesson\b/i.test(s) || s.charAt(0) === "*";
}

// Title-case words of 4+ letters ("CALLAWASSIE" -> "Callawassie") but keep
// short acronyms/numbers ("USTA", "CWD", "4.0", "55+") as-is — lowercase
// glyphs are narrower, which buys wrap room in tight columns.
function softenCaps(s: string): string {
  return String(s)
    .split(/\s+/)
    .map((w) => (w.length >= 4 && /^[A-Z]+$/.test(w) ? titleCaseWord(w) : w))
    .join(" ");
}

function eventLines(players: string[]): string[] {
  const lines: string[] = [];
  for (let i = 0; i < players.length; i++) {
    const p = String(players[i]).trim();
    if (!p) continue;
    if (/^VS\.?$/i.test(p) && lines.length > 0 && i + 1 < players.length) {
      lines[lines.length - 1] += " vs " + softenCaps(String(players[i + 1]).trim());
      i++;
    } else {
      lines.push(softenCaps(p.replace(/-MATCH/i, "")));
    }
  }
  return lines;
}

function isBlockBooking(players: string[]): boolean {
  if (!players || players.length < 2) return false;
  return players.every((p) => p === players[0]);
}

function blockLabel(text: string): string {
  const t = String(text);
  return t.indexOf("* ") === 0 ? t.slice(2) : t;
}

function shortCourtLabel(courtName: string): string {
  const m = /(\d+)/.exec(String(courtName));
  return m ? m[1] : String(courtName);
}

/* ------------------------------------------------------------------ */
/* cell / grid rendering                                              */
/* ------------------------------------------------------------------ */

interface CellRender {
  html: string;
  /** Joined shortened-name text for a plain reserved cell — used only for server-side font-size estimation. */
  flowText: string | null;
}

/** Known grid geometry, available on the second render pass once fonts are estimated. */
interface EventFit {
  colWidthVh: number;
  rowHeightVh: number;
  cellFontVh: number;
}

/**
 * Sizes an event/block label to its own cell: short labels ("Lesson - Dale",
 * "Round Robin") render at name-size, long league text wraps smaller. Mirrors
 * the JS version's per-cell fitting, as an estimate.
 */
function fitEventFontVh(lines: string[], fit: EventFit): number {
  let maxWord = 3;
  let totalChars = 0;
  for (const l of lines) {
    totalChars += l.length + 1;
    for (const w of l.split(/\s+/)) maxWord = Math.max(maxWord, w.length);
  }
  const wordMax = fit.colWidthVh / (maxWord * 0.6);
  const areaMax = Math.sqrt(
    (fit.colWidthVh * fit.rowHeightVh * 0.75) / (Math.max(totalChars, 4) * 0.6 * 1.15),
  );
  // Cap on the ROW height, not the name font: a short label like
  // "Lesson - Dale" should fill its cell even when long name lists have
  // forced the global name font small.
  const cap = fit.rowHeightVh * 0.42;
  const f = Math.min(cap, wordMax, areaMax) * 0.85;
  return Math.max(fit.cellFontVh * 0.5, f);
}

function eventStyle(lines: string[], fit: EventFit | null): string {
  if (!fit) return "";
  return ` style="font-size:${fitEventFontVh(lines, fit).toFixed(2)}vh"`;
}

function renderCell(cell: FacilityCell | null, extraClass: string, fit: EventFit | null): CellRender {
  const x = extraClass || "";
  if (cell == null) return { html: `<div class="cell cell-null${x}"></div>`, flowText: null };
  if (!cell.reserved) return { html: `<div class="cell cell-open${x}">&middot;</div>`, flowText: null };
  const players = cell.players || [];
  if (isBlockBooking(players)) {
    const label = blockLabel(players[0]);
    return {
      html: `<div class="cell cell-block${x}"><span class="block-label"${eventStyle([label], fit)}>${escapeHtml(label)}</span></div>`,
      flowText: null,
    };
  }
  if (players.some(isEventEntry)) {
    const lines = eventLines(players).map(blockLabel);
    const style = eventStyle(lines, fit);
    const inner = lines.map((l) => `<div class="event-line"${style}>${escapeHtml(l)}</div>`).join("");
    return { html: `<div class="cell cell-event${x}">${inner}</div>`, flowText: null };
  }
  const names: string[] = [];
  if (players.length > 0) {
    for (const p of players) names.push(shortenName(p));
  } else if (cell.text) {
    names.push(cell.text);
  }
  const flowText = names.join(", ");
  let style = "";
  if (fit) {
    // Per-cell fit via greedy word-wrap simulation (words can't split at wrap,
    // so pure char-count models over-promise for long surnames). Walk font
    // candidates downward from the global size; keep the first that fits.
    const words = flowText.split(" ");
    const fits = (f: number): boolean => {
      // Deliberately pessimistic glyph width: per-cell shrink should err
      // small (a slightly small outlier cell beats a clipped name).
      const capacity = fit.colWidthVh / (0.62 * f); // chars per line
      let lines = 1;
      let used = 0;
      for (const w of words) {
        const need = (used === 0 ? 0 : 1) + w.length;
        if (used + need <= capacity) {
          used += need;
        } else {
          lines++;
          used = w.length;
        }
      }
      return lines * 1.25 * f <= 0.88 * fit.rowHeightVh;
    };
    let cellVh = fit.cellFontVh;
    while (cellVh > fit.cellFontVh * 0.55 && !fits(cellVh)) cellVh *= 0.94;
    // Safety net: if reality still overflows the estimate, truncate the last
    // line cleanly with an ellipsis instead of chopping glyphs. The clamp's
    // bound (0.92) is looser than the fit solver's (0.88), so it never bites
    // on cells the solver already fitted.
    const clampLines = Math.max(1, Math.floor((0.92 * fit.rowHeightVh) / (1.25 * cellVh)));
    const decl =
      (cellVh < fit.cellFontVh - 0.01 ? `font-size:${cellVh.toFixed(2)}vh;` : "") +
      `-webkit-line-clamp:${clampLines}`;
    style = ` style="${decl}"`;
  }
  return {
    html: `<div class="cell cell-reserved${x}"><div class="name-flow"${style}>${escapeHtml(flowText)}</div></div>`,
    flowText,
  };
}

interface GridRender {
  html: string;
  rows: number;
  courts: number;
  flowTexts: string[];
}

function buildGrid(facility: Facility, nowMin: number, showAll: boolean, isToday: boolean, fit: EventFit | null = null): GridRender {
  const slots = filterSlots(facility.slots || [], nowMin, showAll);
  if ((facility.slots || []).length > 0 && slots.length === 0) {
    return { html: '<div class="empty-msg">Play has ended for today</div>', rows: 0, courts: 0, flowTexts: [] };
  }
  const courts = facility.courts || [];
  // The time column sizes to its content — a fixed percentage overflows into
  // the first court column when few rows make the time font large.
  const colTemplate = `max-content repeat(${courts.length}, 1fr)`;
  const rowTemplate = `auto repeat(${slots.length}, 1fr)`;
  let html = `<div class="grid" data-rows="${slots.length}" data-cols="${courts.length}" style="grid-template-columns:${colTemplate};grid-template-rows:${rowTemplate}">`;
  html += '<div class="hcell"></div>';
  for (const c of courts) html += `<div class="hcell">${escapeHtml(shortCourtLabel(c))}</div>`;

  // Highlight the slot currently in play: the latest one that has started.
  // (Only meaningful when the sheet being shown is today's.)
  let nowIdx = -1;
  if (isToday) {
    for (let n = 0; n < slots.length; n++) {
      const mins = slotMinutes(slots[n].time);
      if (mins !== null && mins <= nowMin) nowIdx = n;
    }
  }

  const flowTexts: string[] = [];
  for (let s = 0; s < slots.length; s++) {
    const slot = slots[s];
    const tp = splitTime(slot.time);
    const now = s === nowIdx ? " now" : "";
    html += `<div class="tcell${now}">${escapeHtml(tp.hm)}<span class="ampm">${escapeHtml(tp.ap)}</span></div>`;
    const cells = slot.cells || [];
    for (let j = 0; j < courts.length; j++) {
      const r = renderCell(cells[j] ?? null, now, fit);
      html += r.html;
      if (r.flowText) flowTexts.push(r.flowText);
    }
  }
  html += "</div>";
  return { html, rows: slots.length, courts: courts.length, flowTexts };
}

/* ------------------------------------------------------------------ */
/* font-size estimation (no measure-and-shrink loop is possible without JS) */
/* ------------------------------------------------------------------ */

// The Sylvox TV panel is a 16:9 display; express all layout math in "vh"
// units (viewport height = 100 units) so the estimate doesn't depend on a
// real pixel viewport. 1vw = (16/9) vh at that aspect ratio.
const VW_PER_VH = 16 / 9;
const VIEWPORT_WIDTH_VH = 100 * VW_PER_VH; // ~177.78
const HEADER_H_VH = 9.5;
const FOOTER_H_VH = 0;
const SCREEN_H_PADDING_VH = 2 * 1.5 * VW_PER_VH; // .screen { padding: 1.2vh 1.5vw }
const SCREEN_V_PADDING_VH = 2 * 1.2;
const NW_GAP_VH = 1.5 * VW_PER_VH; // .nw-wrap { gap: 1.5vw }
const NW_TITLE_H_VH = 3; // .facility-title: ~2vh font + 0.6vh margin + line-height overhead

const MIN_FONT_VH = 1.6;
const MAX_FONT_VH = 3.4;
const TIME_FONT_MAX_VH = 3.0; // times need less prominence than names on sparse grids
const FONT_SAFETY_FACTOR = 1.0; // hardware-validated: per-cell fit + line-clamp nets handle the margin // no client-side measure-and-shrink loop, so bias small
const EVENT_FONT_FACTOR = 0.62; // flat factor for event/block-cell text in place of per-cell fitting

interface GridDims {
  courts: number;
  widthVh: number;
}

interface FontEstimate {
  cellFontVh: number;
  timeFontVh: number;
  evFontVh: number;
}

function estimateFontSizes(rows: number, grids: GridDims[], gridHeightVh: number, flowTexts: string[]): FontEstimate {
  const rowHeightVh = gridHeightVh / (rows + 1); // +1 for the header ("Time"/court label) row
  const rowBasedMaxVh = rowHeightVh * 0.42;

  // Names render as one wrapping comma-delimited line per cell, so two
  // constraints bound the font: the longest single word must fit the column
  // width, and the cell's total text (wrapped) must fit the cell area.
  // Average glyph width ~0.53em for Barlow Semi Condensed at weight 600.
  let maxWordChars = 6;
  for (const text of flowTexts) {
    for (const w of text.split(/\s+/)) {
      if (w.length > maxWordChars) maxWordChars = w.length;
    }
  }
  // Size the shared font for TYPICAL cells (85th percentile by length); the
  // few outlier cells (four long surnames) get a per-cell shrink instead of
  // dragging the whole grid down.
  const lengths = flowTexts.map((t) => t.length).sort((a, b) => a - b);
  const maxCellChars = Math.max(8, lengths.length ? lengths[Math.min(lengths.length - 1, Math.floor(lengths.length * 0.85))] : 8);

  // The time column's width depends on the time font, and the time font
  // depends on the chosen cell font — iterate the coupled estimate a few
  // times rather than solving it in closed form.
  let timeFontVh = MAX_FONT_VH;
  let cellFontVh = MAX_FONT_VH;
  for (let iter = 0; iter < 3; iter++) {
    let widthBasedMaxVh = Infinity;
    for (const g of grids) {
      if (g.courts <= 0) continue;
      const timeColVh = 3.2 * timeFontVh;
      const colWidthVh = Math.max(0.5, (g.widthVh - timeColVh) / g.courts);
      const wordMaxVh = colWidthVh / (maxWordChars * 0.53);
      // Area fit: lines(font) ~= ceil(chars*0.53*font / colWidth), need
      // lines * 1.15 * font <= 0.85 * rowHeight => solve approximately.
      const areaMaxVh = Math.sqrt((colWidthVh * rowHeightVh * 0.85) / (maxCellChars * 0.53 * 1.15));
      const wMax = Math.min(wordMaxVh, areaMaxVh);
      if (wMax < widthBasedMaxVh) widthBasedMaxVh = wMax;
    }
    cellFontVh = Math.min(MAX_FONT_VH, rowBasedMaxVh, widthBasedMaxVh);
    if (cellFontVh < MIN_FONT_VH) cellFontVh = Math.min(MIN_FONT_VH, rowBasedMaxVh);
    timeFontVh = Math.min(cellFontVh * 1.3, TIME_FONT_MAX_VH);
  }

  const safeCellFontVh = cellFontVh * FONT_SAFETY_FACTOR;
  const safeTimeFontVh = Math.min(safeCellFontVh * 1.3, TIME_FONT_MAX_VH);
  const evFontVh = safeCellFontVh * EVENT_FONT_FACTOR;
  return { cellFontVh: safeCellFontVh, timeFontVh: safeTimeFontVh, evFontVh };
}

function contentDims(): { widthVh: number; heightVh: number } {
  return {
    widthVh: VIEWPORT_WIDTH_VH - SCREEN_H_PADDING_VH,
    heightVh: 100 - HEADER_H_VH - FOOTER_H_VH - SCREEN_V_PADDING_VH,
  };
}

/* ------------------------------------------------------------------ */
/* screen assembly                                                    */
/* ------------------------------------------------------------------ */

interface ScreenRender extends FontEstimate {
  bodyHtml: string;
}

function findFacility(sheet: CourtSheet, name: string): Facility | null {
  return sheet.facilities.find((f) => f.name === name) ?? null;
}

function renderSouthScreen(sheet: CourtSheet, nowMin: number, showAll: boolean, isToday: boolean): ScreenRender {
  const south = findFacility(sheet, "South");
  const { widthVh, heightVh } = contentDims();
  if (!south) {
    return {
      bodyHtml: '<div class="south-wrap"><div class="empty-msg">No South court data.</div></div>',
      ...estimateFontSizes(0, [], heightVh, []),
    };
  }
  const grid = buildGrid(south, nowMin, showAll, isToday);
  const grids: GridDims[] = grid.courts > 0 ? [{ courts: grid.courts, widthVh }] : [];
  const est = estimateFontSizes(grid.rows, grids, heightVh, grid.flowTexts);
  // Second pass with known geometry so event/block cells get per-cell fonts.
  const fit: EventFit | null = grid.courts > 0
    ? {
        colWidthVh: (widthVh - 3.2 * est.timeFontVh) / grid.courts,
        rowHeightVh: heightVh / (grid.rows + 1),
        cellFontVh: est.cellFontVh,
      }
    : null;
  const fitted = buildGrid(south, nowMin, showAll, isToday, fit);
  return { bodyHtml: `<div class="south-wrap">${fitted.html}</div>`, ...est };
}

function renderNorthWestScreen(sheet: CourtSheet, nowMin: number, showAll: boolean, isToday: boolean): ScreenRender {
  const north = findFacility(sheet, "North");
  const west = findFacility(sheet, "West");
  const { widthVh: totalWidthVh, heightVh: baseHeightVh } = contentDims();
  const colWidthVh = (totalWidthVh - NW_GAP_VH) / 2;
  const heightVh = baseHeightVh - NW_TITLE_H_VH;

  const northGrid = north ? buildGrid(north, nowMin, showAll, isToday) : null;
  const westGrid = west ? buildGrid(west, nowMin, showAll, isToday) : null;

  const rows = Math.max(
    northGrid && northGrid.courts > 0 ? northGrid.rows : 0,
    westGrid && westGrid.courts > 0 ? westGrid.rows : 0,
  );
  const grids: GridDims[] = [];
  if (northGrid && northGrid.courts > 0) grids.push({ courts: northGrid.courts, widthVh: colWidthVh });
  if (westGrid && westGrid.courts > 0) grids.push({ courts: westGrid.courts, widthVh: colWidthVh });
  const flowTexts = [...(northGrid?.flowTexts ?? []), ...(westGrid?.flowTexts ?? [])];
  const est = estimateFontSizes(rows, grids, heightVh, flowTexts);

  const fitFor = (g: GridRender | null): EventFit | null =>
    g && g.courts > 0
      ? {
          colWidthVh: (colWidthVh - 3.2 * est.timeFontVh) / g.courts,
          rowHeightVh: heightVh / (g.rows + 1),
          cellFontVh: est.cellFontVh,
        }
      : null;
  const northHtml =
    north && northGrid
      ? buildGrid(north, nowMin, showAll, isToday, fitFor(northGrid)).html
      : '<div class="empty-msg">No North court data.</div>';
  const westHtml =
    west && westGrid
      ? buildGrid(west, nowMin, showAll, isToday, fitFor(westGrid)).html
      : '<div class="empty-msg">No West court data.</div>';
  const bodyHtml =
    '<div class="nw-wrap">' +
    `<div class="nw-col"><div class="facility-title">NORTH</div>${northHtml}</div>` +
    '<div class="divider"></div>' +
    `<div class="nw-col"><div class="facility-title">WEST</div>${westHtml}</div>` +
    "</div>";
  return { bodyHtml, ...est };
}

/* ------------------------------------------------------------------ */
/* document shell                                                     */
/* ------------------------------------------------------------------ */

const HEADER_QR_HTML = `<div class="qr-caption">Add court sheet app to your phone<br><span class="qr-url">schh-tennis.pages.dev</span></div>
    <div class="qr-box"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 37" shape-rendering="crispEdges"><path fill="#ffffff" d="M0 0h37v37H0z"/><path stroke="#000000" d="M4 4.5h7m1 0h2m1 0h2m5 0h1m3 0h7M4 5.5h1m5 0h1m2 0h3m4 0h2m1 0h1m2 0h1m5 0h1M4 6.5h1m1 0h3m1 0h1m2 0h3m1 0h1m1 0h4m3 0h1m1 0h3m1 0h1M4 7.5h1m1 0h3m1 0h1m1 0h2m1 0h1m2 0h3m1 0h1m3 0h1m1 0h3m1 0h1M4 8.5h1m1 0h3m1 0h1m1 0h2m1 0h1m1 0h2m1 0h1m1 0h1m3 0h1m1 0h3m1 0h1M4 9.5h1m5 0h1m1 0h4m1 0h3m3 0h2m1 0h1m5 0h1M4 10.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M12 11.5h1m2 0h1m2 0h1m2 0h2M4 12.5h1m3 0h1m1 0h3m1 0h1m1 0h6m1 0h1m1 0h5m2 0h1M4 13.5h2m5 0h1m2 0h1m11 0h1m1 0h5M4 14.5h3m1 0h1m1 0h1m3 0h1m1 0h4m7 0h1m4 0h1M4 15.5h2m1 0h3m1 0h2m1 0h1m1 0h2m1 0h6m1 0h4m1 0h2M9 16.5h2m3 0h2m1 0h1m3 0h2m1 0h2m5 0h1M4 17.5h3m1 0h2m6 0h3m1 0h3m1 0h9M4 18.5h1m5 0h1m2 0h1m2 0h1m3 0h1m1 0h1m1 0h1m2 0h2m1 0h1M5 19.5h1m1 0h3m2 0h2m4 0h1m2 0h1m1 0h1m1 0h4m2 0h2M6 20.5h1m2 0h3m2 0h1m1 0h6m1 0h1m1 0h1m5 0h1M4 21.5h1m1 0h1m8 0h2m5 0h1m3 0h4m1 0h2M6 22.5h1m3 0h2m4 0h4m1 0h2m1 0h1m1 0h1m1 0h1m1 0h1M6 23.5h1m1 0h1m2 0h1m2 0h1m1 0h2m1 0h3m4 0h2m3 0h2M4 24.5h2m1 0h6m1 0h2m1 0h1m3 0h1m2 0h6m2 0h1M12 25.5h1m1 0h1m1 0h3m1 0h1m1 0h3m3 0h1m3 0h1M4 26.5h7m1 0h3m1 0h1m3 0h5m1 0h1m1 0h3m1 0h1M4 27.5h1m5 0h1m3 0h1m3 0h1m2 0h4m3 0h1m2 0h1M4 28.5h1m1 0h3m1 0h1m1 0h1m1 0h1m2 0h3m1 0h1m1 0h7m1 0h2M4 29.5h1m1 0h3m1 0h1m2 0h1m1 0h1m1 0h1m5 0h1m1 0h1m5 0h1M4 30.5h1m1 0h3m1 0h1m3 0h2m1 0h1m1 0h1m2 0h4m3 0h4M4 31.5h1m5 0h1m3 0h1m2 0h2m2 0h1m2 0h1m3 0h2m1 0h2M4 32.5h7m1 0h1m2 0h5m1 0h2m1 0h1m1 0h1m1 0h1m2 0h1"/></svg></div>`;

function css(f: FontEstimate): string {
  return `
  @font-face {
    font-family: "Barlow Semi Condensed";
    src: url("/fonts/barlow-sc-600.woff2") format("woff2");
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }
  :root {
    --bg: #0c120d;
    --bg-alt: #121a14;
    --text: #f2f5f2;
    --muted: #7c8b7e;
    --green: #4caf6d;
    --green-dim: #2f6b45;
    --reserved-bg: rgba(76, 175, 109, 0.14);
    --reserved-border: rgba(76, 175, 109, 0.55);
    --block-bg: rgba(76, 175, 109, 0.24);
    --null-bg: #0a0f0b;
    --null-bg-alt: #0d130f;
    --border: #24312a;
    --stale-text: #ffd766;
    --header-h: 9.5vh;
    --footer-h: 10vh;
    --cell-font: ${f.cellFontVh.toFixed(2)}vh;
    --time-font: ${f.timeFontVh.toFixed(2)}vh;
    --evfont: ${f.evFontVh.toFixed(2)}vh;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
    color: var(--text);
    cursor: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: 0.02em;
    -webkit-font-smoothing: antialiased;
  }
  header#hdr {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: var(--header-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2vw;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    z-index: 10;
  }
  .hdr-left { display: flex; flex-direction: column; justify-content: center; line-height: 1.15; min-width: 0; }
  .hdr-left .brand { font-size: 1.7vh; font-weight: 700; color: var(--green); letter-spacing: 0.16em; }
  .hdr-left .screen-title { font-size: 2.6vh; font-weight: 700; color: var(--text); letter-spacing: 0.06em; white-space: nowrap; }
  .hdr-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4vh; padding: 0 1vw; min-width: 0; }
  .hdr-center .hdr-date { font-size: 2.8vh; font-weight: 700; color: var(--text); white-space: nowrap; }
  .hdr-center .updated-row { display: flex; align-items: center; gap: 0.6vw; }
  .hdr-center .updated { font-size: 2.2vh; font-weight: 600; color: #b9c4bb; white-space: nowrap; }
  .hdr-center .liveclock { font-size: 2.2vh; font-weight: 700; color: var(--text); white-space: nowrap; font-variant-numeric: tabular-nums; }
  .hdr-center .liveclock:empty { display: none; }
  .hdr-center .liveclock:not(:empty)::after { content: "·"; margin-left: 0.6vw; color: #7c8b7e; font-weight: 400; }
  .hdr-right { display: flex; align-items: center; gap: 1vw; line-height: 1.15; }
  .hdr-flags { display: flex; flex-direction: column; gap: 0.5vh; align-items: flex-end; }
  .qr-caption { text-align: right; font-size: 1.5vh; font-weight: 600; color: var(--text); line-height: 1.35; }
  .qr-caption .qr-url { font-size: 1.4vh; font-weight: 500; color: var(--green); letter-spacing: 0.02em; }
  .qr-box { height: calc(var(--header-h) - 1.8vh); aspect-ratio: 1 / 1; background: #ffffff; border-radius: 0.6vh; overflow: hidden; }
  .qr-box svg { display: block; width: 100%; height: 100%; }
  .chip-stale {
    font-size: 1.3vh;
    font-weight: 700;
    color: #1c1508;
    background: var(--stale-text);
    padding: 0.2vh 0.9vh;
    border-radius: 1vh;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }
  main#main {
    position: fixed;
    top: var(--header-h);
    left: 0; right: 0; bottom: 0;
    overflow: hidden;
  }
  .screen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    padding: 1.2vh 1.5vw;
  }
  .south-wrap { width: 100%; height: 100%; display: flex; flex-direction: column; }
  .nw-wrap { display: flex; gap: 1.5vw; width: 100%; height: 100%; }
  .nw-col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; }
  .nw-col .facility-title {
    font-size: 2vh;
    font-weight: 700;
    color: var(--green);
    letter-spacing: 0.14em;
    margin-bottom: 0.6vh;
    text-align: center;
    flex-shrink: 0;
  }
  .divider { width: 1px; background: var(--border); flex-shrink: 0; }
  .grid {
    display: grid;
    width: 100%;
    flex: 1;
    min-height: 0;
  }
  .hcell {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.4vh;
    font-weight: 700;
    color: #b9c4bb;
    letter-spacing: 0.05em;
    border-bottom: 2px solid var(--border);
    text-transform: uppercase;
  }
  .tcell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: var(--time-font);
    padding: 0 0.6vw;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--bg-alt);
  }
  .tcell .ampm { font-size: 0.42em; font-weight: 600; color: var(--muted); margin-top: 0.2vh; letter-spacing: 0.05em; }
  /* current-time row band */
  .tcell.now {
    background: var(--green);
    color: #08120b;
  }
  .tcell.now .ampm { color: #08120b; opacity: 0.75; }
  .cell.now {
    border-top: 2px solid var(--green);
    border-bottom: 2px solid var(--green);
  }
  .cell-open.now { opacity: 0.6; }
  .cell {
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0.1vh 0.15vw;
    min-width: 0;
    overflow: hidden;
  }
  .cell-open { color: var(--muted); opacity: 0.25; font-size: var(--cell-font); }
  .cell-null {
    background: repeating-linear-gradient(45deg, var(--null-bg), var(--null-bg) 10px, var(--null-bg-alt) 10px, var(--null-bg-alt) 20px);
  }
  .cell-reserved {
    background: var(--reserved-bg);
    border-left: 3px solid var(--reserved-border);
    flex-direction: column;
    gap: 0.15vh;
  }
  .name-flow {
    font-family: "Barlow Semi Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    font-size: var(--cell-font);
    font-weight: 600;
    color: var(--text);
    white-space: normal;
    overflow: hidden;
    line-height: 1.15;
    text-align: center;
    max-width: 100%;
  }
  .cell-block {
    background: var(--block-bg);
    border-left: 3px solid var(--green);
  }
  .block-label {
    font-size: var(--evfont, var(--cell-font));
    font-weight: 700;
    color: var(--green);
    letter-spacing: 0.02em;
    white-space: normal;
    overflow: hidden;
    line-height: 1.15;
    text-align: center;
    max-width: 100%;
  }
  .cell-event {
    background: var(--block-bg);
    border-left: 3px solid var(--green);
    flex-direction: column;
    gap: 0.1vh;
  }
  .event-line {
    font-size: var(--evfont, calc(var(--cell-font) * 0.55));
    font-weight: 600;
    color: var(--green);
    letter-spacing: 0.01em;
    white-space: normal;
    overflow: hidden;
    line-height: 1.1;
    text-align: center;
    max-width: 100%;
  }
  .app-version {
    position: fixed;
    right: 0.4vw;
    bottom: 0.4vh;
    z-index: 40;
    font-size: 1.2vh;
    color: #3d4f42;
    letter-spacing: 0.04em;
  }
  .empty-msg {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3vh;
    color: var(--muted);
    font-weight: 600;
    text-align: center;
  }
  footer#ftr {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    height: var(--footer-h);
    display: flex;
    align-items: center;
    background: var(--bg);
  }
  .ftr-qr {
    position: absolute;
    right: 1vw;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 0.9vw;
  }
  .qr-caption {
    text-align: right;
    font-size: 1.9vh;
    font-weight: 600;
    color: var(--text);
    line-height: 1.35;
  }
  .qr-caption .qr-url {
    font-size: 1.5vh;
    font-weight: 500;
    color: var(--green);
    letter-spacing: 0.02em;
  }
  .qr-box {
    height: calc(var(--footer-h) - 1.2vh);
    aspect-ratio: 1 / 1;
    background: #ffffff;
    border-radius: 0.6vh;
    overflow: hidden;
  }
  .qr-box svg { display: block; width: 100%; height: 100%; }
  .unavailable {
    position: fixed;
    top: var(--header-h);
    left: 0; right: 0; bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.4vh;
    background: var(--bg);
  }
  .unavailable h2 { font-size: 4vh; margin: 0; color: var(--text); font-weight: 700; }
  .unavailable .code {
    font-size: 1.6vh;
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }`;
}

// Optional enhancement: a live America/New_York clock next to the "As of"
// stamp. The page is fully functional without it — no-JS viewers just don't
// get a clock. Interval is coarse (15s) since only h:mm is shown, and the
// meta refresh replaces the page frequently anyway.
const CLOCK_SCRIPT = `<script>(function(){var el=document.getElementById("liveclock");if(!el)return;function tick(){try{el.textContent=new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:"America/New_York"});}catch(e){}}tick();setInterval(tick,15000);})();</script>`;

function renderDocument(opts: { refreshSeconds: number; font: FontEstimate; headerHtml: string; bodyHtml: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="${opts.refreshSeconds}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>SCHH Tennis — Signage</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎾</text></svg>">
<style>${css(opts.font)}
</style>
</head>
<body>
<header id="hdr">
${opts.headerHtml}
</header>
${opts.bodyHtml}
<div class="app-version">v${APP_VERSION}</div>
${CLOCK_SCRIPT}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* exports                                                            */
/* ------------------------------------------------------------------ */

/** Renders the complete, server-rendered, script-free signage HTML document for one screen. */
export function renderStaticSignage(sheet: CourtSheet, opts: RenderStaticSignageOptions): string {
  const now = new Date();
  const nowMin = opts.nowMinOverride ?? nyMinutesSinceMidnight(now);
  const isToday = sheet.date === todayInNewYork(now);

  const screenRender =
    opts.screen === "south"
      ? renderSouthScreen(sheet, nowMin, opts.showAll, isToday)
      : renderNorthWestScreen(sheet, nowMin, opts.showAll, isToday);

  const screenTitle = opts.screen === "south" ? "SOUTH COURTS" : "NORTH & WEST COURTS";
  const dateLabel = nyDateLabel(sheet.date);
  const updatedLabel = sheet.fetchedAt ? nyUpdatedLabel(sheet.fetchedAt) : "";
  const staleChip = opts.stale ? '<span class="chip-stale">OLDER DATA</span>' : "";

  const headerHtml = `  <div class="hdr-left">
    <div class="brand">SCHH TENNIS</div>
    <div class="screen-title">${escapeHtml(screenTitle)}</div>
  </div>
  <div class="hdr-center">
    <div class="hdr-date">${escapeHtml(dateLabel)}</div>
    <div class="updated-row">
      <span class="liveclock" id="liveclock"></span>
      <span class="updated">${escapeHtml(updatedLabel)}</span>
      ${staleChip}
    </div>
  </div>
  <div class="hdr-right">
    ${HEADER_QR_HTML}
  </div>`;

  const bodyHtml = `<main id="main">
  <div class="screen">${screenRender.bodyHtml}</div>
</main>`;

  return renderDocument({
    refreshSeconds: opts.refreshSeconds,
    font: screenRender,
    headerHtml,
    bodyHtml,
  });
}

const DEFAULT_FONT: FontEstimate = { cellFontVh: 2.2, timeFontVh: 2.86, evFontVh: 1.36 };

/** Renders the static "court sheet unavailable" fallback page (no cached data to show at all). */
export function renderStaticUnavailable(opts: RenderStaticUnavailableOptions): string {
  const headerHtml = `  <div class="hdr-left">
    <div class="brand">SCHH TENNIS</div>
  </div>`;

  const bodyHtml = `<div class="unavailable">
  <h2>Court sheet unavailable</h2>
  <div class="code">${opts.errorCode ? escapeHtml(opts.errorCode) : ""}</div>
</div>`;

  return renderDocument({
    refreshSeconds: opts.refreshSeconds,
    font: DEFAULT_FONT,
    headerHtml,
    bodyHtml,
  });
}
