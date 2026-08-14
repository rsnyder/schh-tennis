import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseWelcome } from "../src/parse-welcome";

// Fixture HTML is gitignored (authenticated content). Regenerate with:
//   node --env-file=.dev.vars scripts/capture-fixture.mjs
const FIXTURE_PATH = path.join(__dirname, "fixtures", "welcome.html");
if (!existsSync(FIXTURE_PATH)) {
  throw new Error(
    `Missing fixture ${FIXTURE_PATH} — run: node --env-file=.dev.vars scripts/capture-fixture.mjs`,
  );
}
const FIXTURE_HTML = readFileSync(FIXTURE_PATH, "utf8");
const FETCHED_AT = "2026-08-14T12:00:00.000Z";

describe("parseWelcome (real fixture)", () => {
  const info = parseWelcome(FIXTURE_HTML, FETCHED_AT);

  it("extracts the club heading and message", () => {
    expect(info.heading).toBe("WELCOME");
    expect(info.message).toBe("Lorem ipsum, or lipsum as it is sometimes known.");
    expect(info.fetchedAt).toBe(FETCHED_AT);
  });

  it("extracts announcement slides with absolute https URLs", () => {
    expect(info.slides).toEqual([
      {
        name: "ClubNews",
        title: "Club News",
        src: "https://hiltheadct.chelseareservations.com/images/Slides/Club_News.jpg",
      },
    ]);
  });
});

describe("parseWelcome (lenience)", () => {
  it("returns empty values for markup without the expected sections", () => {
    const info = parseWelcome("<html><body>nothing here</body></html>", FETCHED_AT);
    expect(info.heading).toBe("");
    expect(info.message).toBe("");
    expect(info.slides).toEqual([]);
  });

  it("skips non-https absolute slide URLs", () => {
    const html =
      "'items':{'0':{'n':'X','s':'http://evil.example/x.jpg','t':'X'},'1':{'n':'Y','s':'../images/ok.jpg','t':'Y'}},'itemsCount':2";
    const info = parseWelcome(html, FETCHED_AT);
    expect(info.slides).toHaveLength(1);
    expect(info.slides[0].src).toBe("https://hiltheadct.chelseareservations.com/images/ok.jpg");
  });
});
