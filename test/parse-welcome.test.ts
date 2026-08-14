import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseClubNews } from "../src/parse-welcome";

// Fixture is gitignored. Regenerate with:
//   node --env-file=.dev.vars scripts/capture-fixture.mjs
const FIXTURE_PATH = path.join(__dirname, "fixtures", "clubnews.html");
if (!existsSync(FIXTURE_PATH)) {
  throw new Error(
    `Missing fixture ${FIXTURE_PATH} — run: node --env-file=.dev.vars scripts/capture-fixture.mjs`,
  );
}
// The club uploads windows-1252-encoded Word HTML.
const FIXTURE_HTML = new TextDecoder("windows-1252").decode(readFileSync(FIXTURE_PATH));
const FETCHED_AT = "2026-08-14T12:00:00.000Z";

describe("parseClubNews (real fixture)", () => {
  const info = parseClubNews(FIXTURE_HTML, FETCHED_AT);

  it("uses the document's first line as the title", () => {
    expect(info.title).toBe("Sun City Hilton Head Tennis");
    expect(info.fetchedAt).toBe(FETCHED_AT);
  });

  it("extracts the dated court conditions", () => {
    const all = info.paragraphs.join(" | ");
    expect(all).toContain("Friday, August 14, 2026");
    expect(all).toContain("South and North Courts are Open");
    expect(all).toContain("West Courts open at 9:00 AM");
  });

  it("keeps announcements and hours", () => {
    const all = info.paragraphs.join(" | ");
    expect(all).toContain("RATINGS CLINIC");
    expect(all).toContain("BALL MACHINE");
    expect(all).toMatch(/7:30am-Noon and 2:00pm-7:00pm/);
  });

  it("drops website-only housekeeping like the Edge cache instructions", () => {
    expect(info.paragraphs.join(" ")).not.toMatch(/browser cache/i);
  });

  it("does not break words split across adjacent Word spans", () => {
    const all = info.paragraphs.join(" | ");
    expect(all).toContain("BALL MACHINE ORIENTATION");
    expect(all).not.toContain("B ALL");
  });

  it("merges Word's mid-sentence paragraph wraps", () => {
    const all = info.paragraphs.join(" | ");
    expect(all).toContain(
      "PLEASE check in with the Logo staff prior to EACH lesson or clinic to ensure that we have the correct information.",
    );
    expect(all).toContain("Saturday, September 12, Court 5 at 2 &amp; 2:30pm");
  });

  it("preserves hyperlinks as vetted anchors", () => {
    const links = info.paragraphs.filter((p) => p.includes("<a "));
    expect(links.length).toBeGreaterThan(0);
    for (const p of links) {
      expect(p).toMatch(/<a href="(https?:|mailto:)[^"]*" target="_blank" rel="noopener">/);
    }
    expect(info.paragraphs.join(" ")).toContain('href="https://sctatennis.com/"');
  });

  it("emits no markup other than anchors (injection safety)", () => {
    for (const p of info.paragraphs) {
      const stripped = p.replace(/<\/?a\b[^>]*>/g, "");
      expect(stripped).not.toMatch(/[<>]/);
    }
  });
});

describe("parseClubNews (lenience & safety)", () => {
  it("handles a document with no paragraphs", () => {
    const info = parseClubNews("<html><body>bare text only</body></html>", FETCHED_AT);
    expect(info.title).toBe("");
    expect(info.paragraphs).toEqual([]);
  });

  it("escapes hostile content and drops unsafe link schemes", () => {
    const html =
      "<body><p>Title.</p><p><script>alert(1)</script>Safe &amp; sound.</p>" +
      '<p><a href="javascript:alert(1)">Click</a> me.</p></body>';
    const info = parseClubNews(html, FETCHED_AT);
    expect(info.title).toBe("Title.");
    expect(info.paragraphs[0]).toBe("Safe &amp; sound.");
    expect(info.paragraphs[1]).toBe("Click me.");
    expect(info.paragraphs.join(" ")).not.toContain("javascript:");
    expect(info.paragraphs.join(" ")).not.toContain("<script");
  });

  it("merges continuation lines but not new sentences/headlines", () => {
    const html =
      "<body><p>HEADLINE</p><p>Some sentence that wraps mid</p><p>stream and continues here.</p>" +
      "<p>NEXT HEADLINE</p></body>";
    const info = parseClubNews(html, FETCHED_AT);
    expect(info.title).toBe("HEADLINE");
    expect(info.paragraphs).toEqual([
      "Some sentence that wraps mid stream and continues here.",
      "NEXT HEADLINE",
    ]);
  });
});
