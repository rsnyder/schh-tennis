import { describe, expect, it } from "vitest";
import { HOME_HTML } from "../src/home";

describe("HOME_HTML", () => {
  it("is a well-formed self-contained HTML document", () => {
    expect(HOME_HTML.startsWith("<!doctype html>")).toBe(true);
    expect(HOME_HTML.trim().endsWith("</html>")).toBe(true);
    expect(HOME_HTML).toContain('<meta name="robots" content="noindex">');
    expect(HOME_HTML).toContain('<meta name="viewport"');
    expect(HOME_HTML).toContain("🎾");
  });

  it("matches page.ts's PWA head bits exactly", () => {
    expect(HOME_HTML).toContain('<link rel="manifest" href="/manifest.webmanifest">');
    expect(HOME_HTML).toContain('<meta name="theme-color" content="#1f5c2c">');
    expect(HOME_HTML).toContain('<meta name="mobile-web-app-capable" content="yes">');
    expect(HOME_HTML).toContain('<meta name="apple-mobile-web-app-capable" content="yes">');
    expect(HOME_HTML).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">');
    expect(HOME_HTML).toContain('navigator.serviceWorker.register("/sw.js")');
  });

  it("matches page.ts's visual language (green accents, system font stack, 560px column)", () => {
    expect(HOME_HTML).toContain("#2f7a3d");
    expect(HOME_HTML).toContain("#1f5c2c");
    expect(HOME_HTML).toContain("-apple-system, BlinkMacSystemFont");
    expect(HOME_HTML).toContain("max-width: 560px");
  });

  it("has no external resources besides the analytics beacon and hotlinked images", () => {
    expect(HOME_HTML).not.toMatch(/<link[^>]+rel=["']stylesheet["']/);
    // The Cloudflare Web Analytics beacon is the one sanctioned external script.
    const externalScripts = HOME_HTML.match(/<script[^>]+src="([^"]+)"/g) ?? [];
    expect(externalScripts).toEqual([
      '<script defer src="https://static.cloudflareinsights.com/beacon.min.js"',
    ]);
    expect(HOME_HTML).toContain("https://hiltheadct.chelseareservations.com/tennis/TNwelcome2.aspx");
  });

  it("fetches /api/welcome, never caches it, and refetches every 2 minutes while visible", () => {
    expect(HOME_HTML).toContain('"/api/welcome"');
    expect(HOME_HTML).toContain('cache: "no-store"');
    expect(HOME_HTML).toContain("REFRESH_MS = 2 * 60 * 1000");
    expect(HOME_HTML).toContain('document.visibilityState === "visible"');
  });

  it("computes the updated time in America/New_York", () => {
    expect(HOME_HTML).toContain('timeZone: "America/New_York"');
  });

  it("shows the stale banner copy", () => {
    expect(HOME_HTML).toContain("Showing older information");
  });

  it("escapes dynamic text", () => {
    expect(HOME_HTML).toContain("function escapeHtml(s)");
  });

  it("only hotlinks https:// image sources", () => {
    expect(HOME_HTML).toContain("function isSafeImageUrl(u)");
    expect(HOME_HTML).toContain('u.indexOf("https://") === 0');
  });

  it("renders the bottom tab bar with Home active, Court Sheet, and Reserve", () => {
    expect(HOME_HTML).toContain('id="tabbar"');
    expect(HOME_HTML).toContain('class="tab-item active" href="/"');
    expect(HOME_HTML).toContain('href="/courts"');
    expect(HOME_HTML).toContain(
      'href="https://hiltheadct.chelseareservations.com/tennis/TNwelcome2.aspx" target="_blank" rel="noopener"',
    );
    expect(HOME_HTML).toContain("env(safe-area-inset-bottom)");
  });
});

// ---- Pure-logic mirrors of the inline <script> helpers, unit-tested directly ----
// (Same approach as test/signage.test.ts: re-implement the small pure
// functions so the formatting rules get direct coverage independent of the
// HTML string.)

function isSafeImageUrl(u: unknown): boolean {
  return typeof u === "string" && u.indexOf("https://") === 0;
}

function titleCaseHeading(s: string): string {
  const str = String(s || "");
  if (str !== str.toUpperCase() || !/[A-Z]/.test(str)) return str;
  return str.toLowerCase().replace(/(^|\s)([a-z])/g, (_m, sp, ch) => sp + ch.toUpperCase());
}

describe("isSafeImageUrl", () => {
  it("allows https:// URLs", () => {
    expect(isSafeImageUrl("https://hiltheadct.chelseareservations.com/images/Slides/Club_News.jpg")).toBe(true);
  });

  it("rejects http://, data:, javascript:, and non-string values", () => {
    expect(isSafeImageUrl("http://example.com/x.jpg")).toBe(false);
    expect(isSafeImageUrl("data:image/svg+xml,<svg/>")).toBe(false);
    expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeImageUrl(undefined)).toBe(false);
    expect(isSafeImageUrl(null)).toBe(false);
  });
});

describe("titleCaseHeading", () => {
  it("title-cases an ALL CAPS heading", () => {
    expect(titleCaseHeading("WELCOME")).toBe("Welcome");
    expect(titleCaseHeading("COURT CLOSURE NOTICE")).toBe("Court Closure Notice");
  });

  it("leaves already mixed-case headings untouched", () => {
    expect(titleCaseHeading("Welcome Back")).toBe("Welcome Back");
    expect(titleCaseHeading("Court Sheet")).toBe("Court Sheet");
  });

  it("handles empty input", () => {
    expect(titleCaseHeading("")).toBe("");
  });
});
