#!/usr/bin/env node
/**
 * Captures real HTML fixtures from the Chelsea Reservations site.
 *
 *   node --env-file=.dev.vars scripts/capture-fixture.mjs
 *
 * Writes:
 *   test/fixtures/login.html
 *   test/fixtures/courtsheet-<YYYY-MM-DD>.html
 *
 * This deliberately reimplements the scrape flow with plain `fetch` rather than
 * importing src/chelsea.ts, so it runs under bare Node with no build step.
 * Node >= 20 supports both `redirect: "manual"` and `headers.getSetCookie()`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://hiltheadct.chelseareservations.com";
const LOGIN_URL = `${BASE}/login.aspx`;
const COURT_SHEET_URL = `${BASE}/tennis/TNReviewCourtSheet.aspx`;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";
const ACCEPT_HTML =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
const TOKENS = ["__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION"];

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_DIR = path.join(REPO_ROOT, "test", "fixtures");

/** @type {Map<string, string>} */
const cookies = new Map();

function mergeCookies(response) {
  for (const raw of response.headers.getSetCookie()) {
    const pair = raw.split(";", 1)[0] ?? "";
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    if (name) cookies.set(name, pair.slice(eq + 1).trim());
  }
}

function cookieHeader() {
  return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
}

function headers(extra = {}) {
  const base = {
    "User-Agent": USER_AGENT,
    Accept: ACCEPT_HTML,
    "Accept-Language": "en-US,en;q=0.9",
    ...extra,
  };
  const cookie = cookieHeader();
  if (cookie) base.Cookie = cookie;
  return base;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readAttribute(tag, attribute) {
  const re = new RegExp(
    `(?:^|\\s)${escapeRegExp(attribute)}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
    "i",
  );
  const m = re.exec(tag);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? null;
}

/** Attribute-order-tolerant hidden-input reader (mirrors src/chelsea.ts). */
function extractHiddenField(html, name) {
  for (const match of html.matchAll(/<input\b[^>]*>/gi)) {
    if (readAttribute(match[0], "name") !== name) continue;
    const value = readAttribute(match[0], "value");
    return value === null ? "" : value.replace(/&amp;/gi, "&");
  }
  return null;
}

function todayInNewYork() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

async function main() {
  const member = process.env.CHELSEA_MEMBER;
  const password = process.env.CHELSEA_PASSWORD;
  if (!member || !password) {
    fail(
      "CHELSEA_MEMBER and CHELSEA_PASSWORD must be set.\n" +
        "       Put them in .dev.vars and run:\n" +
        "       node --env-file=.dev.vars scripts/capture-fixture.mjs",
    );
  }

  await mkdir(FIXTURE_DIR, { recursive: true });

  // 1. Login page.
  const loginPageResponse = await fetch(LOGIN_URL, {
    method: "GET",
    redirect: "manual",
    headers: headers(),
  });
  mergeCookies(loginPageResponse);
  console.log(
    `login page fetched: ${loginPageResponse.status} ${loginPageResponse.statusText}, cookies: ${
      [...cookies.keys()].join(", ") || "(none)"
    }`,
  );
  if (loginPageResponse.status !== 200) {
    fail(`expected 200 from ${LOGIN_URL}, got ${loginPageResponse.status}`);
  }

  const loginHtml = await loginPageResponse.text();
  const loginPath = path.join(FIXTURE_DIR, "login.html");
  await writeFile(loginPath, loginHtml, "utf8");
  console.log(`wrote ${loginPath} (${loginHtml.length} bytes)`);

  const body = new URLSearchParams();
  for (const token of TOKENS) {
    const value = extractHiddenField(loginHtml, token);
    if (value === null) fail(`login page token not found: ${token}`);
    body.set(token, value);
    console.log(`token found: ${token} (${value.length} chars)`);
  }
  body.set("UsernameTextBox", member);
  body.set("PasswordTextBox", password);
  body.set("btnTennis", "Login Tennis");

  // 2. Login POST — tokens + credentials + the tennis button only.
  const loginResponse = await fetch(LOGIN_URL, {
    method: "POST",
    redirect: "manual",
    headers: headers({
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: LOGIN_URL,
      Origin: BASE,
    }),
    body: body.toString(),
  });
  mergeCookies(loginResponse);
  const location = loginResponse.headers.get("location");
  console.log(
    `login POST: ${loginResponse.status} ${loginResponse.statusText}, Location: ${
      location ?? "(none)"
    }, cookies: ${[...cookies.keys()].join(", ")}`,
  );

  if (loginResponse.status === 200) {
    const html = await loginResponse.text();
    if (html.includes("PasswordTextBox") || html.includes('name="login1"')) {
      fail("credentials rejected (login form re-rendered)");
    }
  } else if (location && location.toLowerCase().includes("login")) {
    fail("credentials rejected (redirected back to login)");
  } else if (loginResponse.status >= 400) {
    fail(`unexpected login response status ${loginResponse.status}`);
  }

  // 2b. Welcome page (court conditions + announcements).
  const welcomeResponse = await fetch(`${BASE}/tennis/TNwelcome2.aspx`, {
    method: "GET",
    redirect: "manual",
    headers: headers({ Referer: LOGIN_URL }),
  });
  mergeCookies(welcomeResponse);
  if (welcomeResponse.status === 200) {
    const welcomeHtml = await welcomeResponse.text();
    const welcomePath = path.join(FIXTURE_DIR, "welcome.html");
    await writeFile(welcomePath, welcomeHtml, "utf8");
    console.log(`wrote ${welcomePath} (${welcomeHtml.length} bytes)`);
  } else {
    console.log(`welcome page returned ${welcomeResponse.status} — skipping fixture`);
  }

  // 3. Authenticated court sheet, following redirects by hand.
  let url = COURT_SHEET_URL;
  let referer = LOGIN_URL;
  let sheetHtml = null;
  for (let hop = 0; hop < 6 && sheetHtml === null; hop++) {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: headers({ Referer: referer }),
    });
    mergeCookies(response);
    if (response.status === 200) {
      sheetHtml = await response.text();
      break;
    }
    const next = response.headers.get("location");
    console.log(`court sheet hop ${hop}: ${response.status} -> ${next ?? "(no Location)"}`);
    if (!next) fail(`court sheet returned ${response.status} with no Location header`);
    if (next.toLowerCase().includes("login")) fail("session rejected — redirected to login");
    referer = url;
    url = new URL(next, url).toString();
  }
  if (sheetHtml === null) fail("could not reach the court sheet (too many redirects)");

  console.log(`court sheet fetched: ${sheetHtml.length} bytes from ${url}`);
  const sheetPath = path.join(FIXTURE_DIR, `courtsheet-${todayInNewYork()}.html`);
  await writeFile(sheetPath, sheetHtml, "utf8");
  console.log(`wrote ${sheetPath}`);

  // 4. The page is a selection form (ddlPlaydate + facility checkboxes +
  //    btnDisplay). POST it back to get the actual sheet for today.
  const displayBody = new URLSearchParams();
  for (const token of ["__EVENTTARGET", "__EVENTARGUMENT", "__LASTFOCUS", ...TOKENS]) {
    const value = extractHiddenField(sheetHtml, token);
    if (value === null) {
      if (TOKENS.includes(token)) fail(`court sheet page token not found: ${token}`);
      continue;
    }
    displayBody.set(token, value);
  }
  const selected =
    /<option[^>]*\bselected\b[^>]*\bvalue="([^"]*)"/i.exec(sheetHtml) ??
    /<option[^>]*\bvalue="([^"]*)"[^>]*\bselected\b/i.exec(sheetHtml);
  if (!selected) fail("no selected ddlPlaydate option found on court sheet page");
  const playDate = selected[1].replace(/&amp;/gi, "&");
  displayBody.set("ddlPlaydate", playDate);
  for (const cb of ["cbCourse1", "cbCourse2", "cbCourse3"]) {
    if (sheetHtml.includes(`name="${cb}"`)) displayBody.set(cb, "on");
  }
  displayBody.set("btnDisplay", "Display");
  console.log(`posting Display for playdate: ${playDate}`);

  const displayResponse = await fetch(url, {
    method: "POST",
    redirect: "manual",
    headers: headers({
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: url,
      Origin: BASE,
    }),
    body: displayBody.toString(),
  });
  mergeCookies(displayResponse);
  let displayHtml;
  if (displayResponse.status === 200) {
    displayHtml = await displayResponse.text();
  } else {
    const next = displayResponse.headers.get("location");
    console.log(`display POST: ${displayResponse.status} -> ${next ?? "(no Location)"}`);
    if (!next) fail(`display POST returned ${displayResponse.status} with no Location`);
    if (next.toLowerCase().includes("login")) fail("session rejected on display POST");
    const followed = await fetch(new URL(next, url).toString(), {
      method: "GET",
      redirect: "manual",
      headers: headers({ Referer: url }),
    });
    if (followed.status !== 200) fail(`display redirect target returned ${followed.status}`);
    displayHtml = await followed.text();
  }
  console.log(`display sheet fetched: ${displayHtml.length} bytes`);
  const displayPath = path.join(FIXTURE_DIR, `courtsheet-display-${todayInNewYork()}.html`);
  await writeFile(displayPath, displayHtml, "utf8");
  console.log(`wrote ${displayPath}`);
}

main().catch((error) => {
  fail(error?.stack ?? String(error));
});
