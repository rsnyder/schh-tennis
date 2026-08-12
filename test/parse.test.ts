import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCourtSheet } from "../src/parse";
import { ScrapeError } from "../src/types";

// Fixture HTML is gitignored (contains real member names). Regenerate with:
//   node --env-file=.dev.vars scripts/capture-fixture.mjs
const FIXTURE_PATH = path.join(
  __dirname,
  "fixtures",
  "courtsheet-display-2026-08-12.html",
);
if (!existsSync(FIXTURE_PATH)) {
  throw new Error(
    `Missing fixture ${FIXTURE_PATH} — run: node --env-file=.dev.vars scripts/capture-fixture.mjs`,
  );
}
const FIXTURE_HTML = readFileSync(FIXTURE_PATH, "utf8");

const DATE_ISO = "2026-08-12";
const FETCHED_AT = "2026-08-12T12:00:00.000Z";

describe("parseCourtSheet (real fixture)", () => {
  const sheet = parseCourtSheet(FIXTURE_HTML, DATE_ISO, FETCHED_AT);

  it("carries through the date and fetchedAt untouched", () => {
    expect(sheet.date).toBe(DATE_ISO);
    expect(sheet.fetchedAt).toBe(FETCHED_AT);
  });

  it("has exactly 3 facilities in the order South, North, West", () => {
    expect(sheet.facilities.map((f) => f.name)).toEqual(["South", "North", "West"]);
  });

  it("South has 12 courts and 14 time slots", () => {
    const south = sheet.facilities.find((f) => f.name === "South")!;
    expect(south.courts).toHaveLength(12);
    expect(south.slots).toHaveLength(14);
    expect(south.courts[0]).toBe("Court 1");
    expect(south.courts).toContain("Court 12");
  });

  it("North has 4 courts and 9 time slots", () => {
    const north = sheet.facilities.find((f) => f.name === "North")!;
    expect(north.courts).toHaveLength(4);
    expect(north.slots).toHaveLength(9);
  });

  it("West has 3 courts and 8 time slots", () => {
    const west = sheet.facilities.find((f) => f.name === "West")!;
    expect(west.courts).toHaveLength(3);
    expect(west.slots).toHaveLength(8);
  });

  it("parses a known reserved cell (North Court 1 @ 07:30 AM)", () => {
    const north = sheet.facilities.find((f) => f.name === "North")!;
    const slot = north.slots.find((s) => s.time === "07:30 AM")!;
    const courtIdx = north.courts.indexOf("Court 1");
    const cell = slot.cells[courtIdx];
    expect(cell).not.toBeNull();
    expect(cell!.reserved).toBe(true);
    expect(cell!.players).toHaveLength(4);
    expect(cell!.players).toContain("JUDY NICOLETTI");
    expect(cell!.text).toContain("JUDY NICOLETTI");
  });

  it("parses '* Round Robin' block rows as reserved with that text", () => {
    const south = sheet.facilities.find((f) => f.name === "South")!;
    const slot = south.slots.find((s) => s.time === "07:30 AM")!;
    const courtIdx = south.courts.indexOf("Court 1");
    const cell = slot.cells[courtIdx];
    expect(cell).not.toBeNull();
    expect(cell!.reserved).toBe(true);
    expect(cell!.players).toEqual(["* Round Robin", "* Round Robin", "* Round Robin", "* Round Robin"]);
    expect(cell!.text).toBe("* Round Robin, * Round Robin, * Round Robin, * Round Robin");
  });

  it("parses a known open cell (North Court 4 @ 07:30 AM)", () => {
    const north = sheet.facilities.find((f) => f.name === "North")!;
    const slot = north.slots.find((s) => s.time === "07:30 AM")!;
    const courtIdx = north.courts.indexOf("Court 4");
    const cell = slot.cells[courtIdx];
    expect(cell).not.toBeNull();
    expect(cell!.reserved).toBe(false);
    expect(cell!.players).toEqual([]);
    expect(cell!.text).toBe("");
  });

  it("has null cells for South (only 109 of 168 time*court combos are present)", () => {
    const south = sheet.facilities.find((f) => f.name === "South")!;
    let present = 0;
    let nullCount = 0;
    for (const slot of south.slots) {
      for (const cell of slot.cells) {
        if (cell === null) nullCount++;
        else present++;
      }
    }
    expect(south.slots.length * south.courts.length).toBe(168);
    expect(present).toBe(109);
    expect(nullCount).toBe(168 - 109);
  });

  it("North and West are complete grids (no null cells)", () => {
    for (const name of ["North", "West"]) {
      const facility = sheet.facilities.find((f) => f.name === name)!;
      for (const slot of facility.slots) {
        for (const cell of slot.cells) {
          expect(cell).not.toBeNull();
        }
      }
    }
  });

  it("sorts each facility's times chronologically", () => {
    for (const facility of sheet.facilities) {
      const times = facility.slots.map((s) => s.time);
      const sorted = [...times].sort((a, b) => {
        const parse = (t: string) => {
          const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t)!;
          let h = parseInt(m[1], 10) % 12;
          if (/pm/i.test(m[3])) h += 12;
          return h * 60 + parseInt(m[2], 10);
        };
        return parse(a) - parse(b);
      });
      expect(times).toEqual(sorted);
    }
  });
});

describe("parseCourtSheet (error handling)", () => {
  it("throws PARSE_FAILED for mangled/empty HTML", () => {
    expect(() => parseCourtSheet("", DATE_ISO, FETCHED_AT)).toThrow(ScrapeError);
    try {
      parseCourtSheet("<html><body>nope</body></html>", DATE_ISO, FETCHED_AT);
      throw new Error("expected parseCourtSheet to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ScrapeError);
      expect((error as ScrapeError).code).toBe("PARSE_FAILED");
    }
  });

  it("throws PARSE_FAILED when the table is present but the header has drifted", () => {
    const html = `
      <table id="GridView2">
        <tr><th>Foo</th><th>Bar</th></tr>
        <tr><td>a</td><td>b</td></tr>
      </table>
    `;
    try {
      parseCourtSheet(html, DATE_ISO, FETCHED_AT);
      throw new Error("expected parseCourtSheet to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ScrapeError);
      expect((error as ScrapeError).code).toBe("PARSE_FAILED");
    }
  });
});
