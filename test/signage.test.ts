import { describe, expect, it } from "vitest";
import { todayInNewYork } from "../src/date";
import { renderStaticSignage, renderStaticUnavailable } from "../src/signage";
import type { CourtSheet } from "../src/types";

// Synthetic fixture — small enough to eyeball, but exercises every cell kind
// the real Chelsea court sheet produces: reserved (multi-player), open,
// null (not offered), event/league entry, and a block booking. A slot at
// midnight guarantees at least one row is always "current" for a
// today-dated sheet, regardless of the wall-clock time the tests run at.
function makeSheet(date: string): CourtSheet {
  return {
    date,
    fetchedAt: new Date().toISOString(),
    facilities: [
      {
        name: "South",
        courts: ["Court 1", "Court 2", "Court 3"],
        slots: [
          {
            time: "12:00 AM",
            cells: [
              { players: [], text: "", reserved: false },
              null,
              { players: [], text: "", reserved: false },
            ],
          },
          {
            time: "07:00 AM",
            cells: [
              { players: ["JUDY NICOLETTI", "DAN COSTANZA"], text: "JUDY NICOLETTI, DAN COSTANZA", reserved: true },
              null,
              { players: [], text: "", reserved: false },
            ],
          },
          {
            time: "08:00 AM",
            cells: [
              {
                players: ["INTRA-MATCH 4.0 WOMENS ADULT"],
                text: "INTRA-MATCH 4.0 WOMENS ADULT",
                reserved: true,
              },
              {
                players: ["* Round Robin", "* Round Robin"],
                text: "* Round Robin, * Round Robin",
                reserved: true,
              },
              { players: [], text: "", reserved: false },
            ],
          },
        ],
      },
      {
        name: "North",
        courts: ["Court 1", "Court 2"],
        slots: [
          {
            time: "07:00 AM",
            cells: [{ players: ["MARY SMITH"], text: "MARY SMITH", reserved: true }, null],
          },
        ],
      },
    ],
  };
}

describe("renderStaticSignage", () => {
  it("contains only the optional live-clock script (core renders server-side)", () => {
    const html = renderStaticSignage(makeSheet(todayInNewYork()), {
      screen: "south",
      refreshSeconds: 20,
      showAll: true,
      stale: false,
    });
    expect(html.toLowerCase().split("<script").length - 1).toBe(1);
    expect(html).toContain('id="liveclock"');
    // the grid itself must be fully server-rendered, never script-built
    expect(html).toContain('class="grid"');
  });

  it("renders grid markup with courts and time slots", () => {
    const html = renderStaticSignage(makeSheet(todayInNewYork()), {
      screen: "south",
      refreshSeconds: 20,
      showAll: true,
      stale: false,
    });
    expect(html).toContain('class="grid"');
    // splitTime strips the leading zero, matching the client's rendering ("07:00 AM" -> "7:00").
    expect(html).toContain("7:00");
    expect(html).toContain("8:00");
    expect(html).toContain('<div class="hcell">1</div>');
  });

  it("shortens player names to last name, title-cased", () => {
    const html = renderStaticSignage(makeSheet(todayInNewYork()), {
      screen: "south",
      refreshSeconds: 20,
      showAll: true,
      stale: false,
    });
    expect(html).toContain("Nicoletti");
    expect(html).toContain("Costanza");
    expect(html).not.toContain("JUDY NICOLETTI");
  });

  it("marks the current slot with .now for a today-dated sheet", () => {
    const html = renderStaticSignage(makeSheet(todayInNewYork()), {
      screen: "south",
      refreshSeconds: 20,
      showAll: true,
      stale: false,
    });
    expect(html).toContain('class="tcell now"');
  });

  it("does not mark any slot .now for a non-today sheet", () => {
    const html = renderStaticSignage(makeSheet("2020-01-01"), {
      screen: "south",
      refreshSeconds: 20,
      showAll: true,
      stale: false,
    });
    expect(html).not.toContain('class="tcell now"');
  });

  it("renders event and block-booking cells with distinct classes", () => {
    const html = renderStaticSignage(makeSheet(todayInNewYork()), {
      screen: "south",
      refreshSeconds: 20,
      showAll: true,
      stale: false,
    });
    expect(html).toContain("cell-event");
    expect(html).toContain("event-line");
    expect(html).toContain("cell-block");
    expect(html).toContain("block-label");
    expect(html).toContain("Round Robin");
  });

  it("renders unoffered slots with the cell-null hatch class", () => {
    const html = renderStaticSignage(makeSheet(todayInNewYork()), {
      screen: "south",
      refreshSeconds: 20,
      showAll: true,
      stale: false,
    });
    expect(html).toContain("cell-null");
  });

  it("includes a meta refresh, no rotation dots, and the stale chip when requested", () => {
    const html = renderStaticSignage(makeSheet(todayInNewYork()), {
      screen: "northwest",
      refreshSeconds: 300,
      showAll: false,
      stale: true,
    });
    expect(html).toMatch(/<meta http-equiv="refresh" content="300">/);
    expect(html).toContain("OLDER DATA");
    expect(html).not.toContain("ftr-dots");
    expect(html).not.toContain('class="dot');
    expect(html.toLowerCase().split("<script").length - 1).toBe(1); // clock only
  });

  it("renders the North & West screen side-by-side even when West data is missing", () => {
    const html = renderStaticSignage(makeSheet(todayInNewYork()), {
      screen: "northwest",
      refreshSeconds: 20,
      showAll: true,
      stale: false,
    });
    expect(html).toContain("NORTH");
    expect(html).toContain("WEST");
    expect(html).toContain("No West court data.");
    expect(html).toContain("Smith");
  });
});

describe("renderStaticUnavailable", () => {
  it("renders the error page with the error code and a 60s refresh", () => {
    const html = renderStaticUnavailable({ errorCode: "SITE_DOWN", refreshSeconds: 60 });
    expect(html.toLowerCase().split("<script").length - 1).toBe(1); // clock only
    expect(html).toContain("Court sheet unavailable");
    expect(html).toContain("SITE_DOWN");
    expect(html).toMatch(/<meta http-equiv="refresh" content="60">/);
  });
});
