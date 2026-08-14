import { describe, expect, it } from "vitest";
import { SIGNAGE_HTML } from "../src/signage";

describe("SIGNAGE_HTML", () => {
  it("is a well-formed self-contained HTML document", () => {
    expect(SIGNAGE_HTML.startsWith("<!doctype html>")).toBe(true);
    expect(SIGNAGE_HTML.trim().endsWith("</html>")).toBe(true);
    expect(SIGNAGE_HTML).toContain('<meta name="robots" content="noindex">');
    expect(SIGNAGE_HTML).toContain('<meta name="viewport"');
    expect(SIGNAGE_HTML).toContain("🎾");
  });

  it("has no external resource references (aside from the inline SVG namespace URI)", () => {
    const withoutSvgNamespace = SIGNAGE_HTML.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, "");
    expect(withoutSvgNamespace).not.toMatch(/https?:\/\//);
    expect(SIGNAGE_HTML).not.toMatch(/<link[^>]+rel=["']stylesheet["']/);
    expect(SIGNAGE_HTML).not.toMatch(/<script[^>]+src=/);
  });

  it("declares both signage screens and query-param handling", () => {
    expect(SIGNAGE_HTML).toContain("SOUTH COURTS");
    expect(SIGNAGE_HTML).toContain("NORTH & WEST COURTS");
    expect(SIGNAGE_HTML).toContain("__SIGNAGE_PARAMS__");
    expect(SIGNAGE_HTML).toContain('"south"');
    expect(SIGNAGE_HTML).toContain('"northwest"');
  });

  it("fetches the courtsheet API and never caches it", () => {
    expect(SIGNAGE_HTML).toContain('"/api/courtsheet"');
    expect(SIGNAGE_HTML).toContain('cache: "no-store"');
  });

  it("computes time in America/New_York, never trusting device tz", () => {
    expect(SIGNAGE_HTML).toContain('timeZone: "America/New_York"');
    expect(SIGNAGE_HTML).not.toContain("new Date().getHours()");
  });

  it("reloads once daily at 4:00 AM ET", () => {
    expect(SIGNAGE_HTML).toContain("RELOAD_AT_MINUTE = 4 * 60");
    expect(SIGNAGE_HTML).toContain("window.location.reload()");
  });

  it("escapes dynamic text", () => {
    expect(SIGNAGE_HTML).toContain("function escapeHtml(s)");
  });
});

// ---- Player-name / block-booking formatting logic, mirrored from src/signage.ts ----
// (The real logic lives inside the inline <script>; these are the same pure
// functions re-implemented so the formatting rules have direct unit coverage.)

function titleCaseWord(w: string): string {
  if (!w) return w;
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

const MAX_NAME_CHARS = 12;
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

function isBlockBooking(players: string[]): boolean {
  if (!players || players.length < 2) return false;
  return players.every((p) => p === players[0]);
}

function blockLabel(text: string): string {
  const t = String(text);
  return t.indexOf("* ") === 0 ? t.slice(2) : t;
}

function slotMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(t).trim());
  if (!m) return null;
  let h = parseInt(m[1], 10) % 12;
  const mi = parseInt(m[2], 10);
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + mi;
}

describe("shortenName", () => {
  it("keeps only the title-cased last name", () => {
    expect(shortenName("JUDY NICOLETTI")).toBe("Nicoletti");
    expect(shortenName("DAN COSTANZA")).toBe("Costanza");
  });

  it("title-cases single-token names as-is", () => {
    expect(shortenName("MADONNA")).toBe("Madonna");
  });

  it("keeps multi-word last names for 3+ token names", () => {
    expect(shortenName("MARY JANE SMITH")).toBe("Jane Smith");
  });

  it("ellipsizes surnames longer than 12 characters", () => {
    expect(shortenName("KAATJE VANBREDAKOLF")).toBe("Vanbredakolf");
    expect(shortenName("ANGELA BOSSU WOLFE")).toBe("Bossu Wolfe");
    expect(shortenName("JOHN VANDERWATERINGEN")).toBe("Vanderwater…");
  });
});

describe("isBlockBooking / blockLabel", () => {
  it("detects identical multi-player entries as a block booking", () => {
    const players = ["* Round Robin", "* Round Robin", "* Round Robin", "* Round Robin"];
    expect(isBlockBooking(players)).toBe(true);
    expect(blockLabel(players[0])).toBe("Round Robin");
  });

  it("does not treat distinct players as a block booking", () => {
    expect(isBlockBooking(["DONALD KRAFT", "JANICE SCULLY"])).toBe(false);
  });

  it("does not treat a single player as a block booking", () => {
    expect(isBlockBooking(["DAN COSTANZA"])).toBe(false);
  });

  it("leaves labels without a leading '* ' unchanged", () => {
    expect(blockLabel("Court Maintenance")).toBe("Court Maintenance");
  });
});

describe("slotMinutes", () => {
  it("parses zero-padded AM/PM times", () => {
    expect(slotMinutes("07:30 AM")).toBe(7 * 60 + 30);
    expect(slotMinutes("12:00 PM")).toBe(12 * 60);
    expect(slotMinutes("08:30 PM")).toBe(20 * 60 + 30);
  });

  it("returns null for unparseable input", () => {
    expect(slotMinutes("garbage")).toBeNull();
  });
});
