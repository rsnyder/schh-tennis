/**
 * Scraper for the Chelsea Reservations tennis court sheet (ASP.NET WebForms).
 *
 * The site is a classic WebForms app: the login page carries `__VIEWSTATE`,
 * `__VIEWSTATEGENERATOR` and `__EVENTVALIDATION` hidden fields that must be
 * echoed back verbatim on the login POST, and authentication is carried in
 * cookies (`ASP.NET_SessionId` plus a forms-auth cookie).
 *
 * Every request uses `redirect: "manual"`: the runtime's automatic redirect
 * following does not hand `Set-Cookie` values from one hop to the next, which
 * silently breaks the session handoff. We follow redirects ourselves and merge
 * cookies from every response.
 *
 * Dependency-free by design.
 */
import { ScrapeError } from "./types";

export const CHELSEA_BASE_URL = "https://hiltheadct.chelseareservations.com";
export const LOGIN_PATH = "/login.aspx";
export const COURT_SHEET_PATH = "/tennis/TNReviewCourtSheet.aspx";

/** A plausible desktop browser UA — the site is picky about headless-looking clients. */
export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

const ACCEPT_HTML =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

/** Hidden WebForms fields that must be round-tripped on the login POST. */
const REQUIRED_TOKENS = ["__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION"] as const;

/** Postback bookkeeping fields, echoed back empty when the form doesn't set them. */
const POSTBACK_FIELDS = ["__EVENTTARGET", "__EVENTARGUMENT", "__LASTFOCUS"] as const;

/** Scroll-position fields some renders of the form include; forwarded only if present. */
const SCROLL_FIELDS = ["__SCROLLPOSITIONX", "__SCROLLPOSITIONY"] as const;

/** Facility checkboxes on the selection form, keyed by their `name` attribute. */
const FACILITY_CHECKBOXES = ["cbCourse1", "cbCourse2", "cbCourse3"] as const;

const MAX_REDIRECTS = 5;

export interface ChelseaCredentials {
  member: string;
  password: string;
}

/**
 * Minimal structural view of the parts of `Response` the cookie jar needs.
 * Keeping it structural makes the jar unit-testable without a real Response.
 */
export interface CookieSource {
  headers: {
    getSetCookie?: () => string[];
    get: (name: string) => string | null;
  };
}

/* -------------------------------------------------------------------------- */
/* HTML helpers                                                               */
/* -------------------------------------------------------------------------- */

const INPUT_TAG_RE = /<input\b[^>]*>/gi;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Reads a single attribute off one already-isolated tag, quote-style tolerant. */
function readAttribute(tag: string, attribute: string): string | null {
  const re = new RegExp(
    `(?:^|\\s)${escapeRegExp(attribute)}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
    "i",
  );
  const match = re.exec(tag);
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3] ?? null;
}

/** Decodes the handful of entities ASP.NET may emit inside an attribute value. */
function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&amp;/gi, "&");
}

/**
 * Extracts the `value` of a hidden input by its `name`, tolerating any
 * attribute order (`name` before or after `value`) and either quote style.
 *
 * @returns the decoded value, or `null` when no matching input exists.
 */
export function extractHiddenField(html: string, name: string): string | null {
  for (const match of html.matchAll(INPUT_TAG_RE)) {
    const tag = match[0];
    if (readAttribute(tag, "name") !== name) continue;
    const value = readAttribute(tag, "value");
    // A present-but-empty value attribute is legitimate (e.g. a fresh form).
    return value === null ? "" : decodeEntities(value);
  }
  return null;
}

/** Matches an `<option>` tag whose `selected` attribute precedes `value="..."`. */
const SELECTED_THEN_VALUE_RE = /<option\b[^>]*\bselected\b[^>]*\bvalue\s*=\s*"([^"]*)"/i;
/** Matches an `<option>` tag whose `value="..."` attribute precedes `selected`. */
const VALUE_THEN_SELECTED_RE = /<option\b[^>]*\bvalue\s*=\s*"([^"]*)"[^>]*\bselected\b/i;

/**
 * Extracts the `value` of the selected `<option>` inside `<select name="ddlPlaydate">`.
 *
 * The site always renders `value == label` (e.g. `August 12, 2026 - Wednesday`) and
 * quotes the `value` attribute with double quotes, but `selected` may appear before
 * or after `value` depending on how ASP.NET rendered the control.
 *
 * @returns the decoded option value, or `null` when no selected option is found.
 */
export function extractSelectedPlaydate(html: string): string | null {
  const match = SELECTED_THEN_VALUE_RE.exec(html) ?? VALUE_THEN_SELECTED_RE.exec(html);
  return match ? decodeEntities(match[1]) : null;
}

/** Reports whether an `<input name="...">` (of any type) exists in `html`. */
function hasNamedField(html: string, name: string): boolean {
  for (const match of html.matchAll(INPUT_TAG_RE)) {
    if (readAttribute(match[0], "name") === name) return true;
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/* Cookies                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Accumulates cookies across a redirect chain.
 *
 * Only the name/value pair is retained — attributes (Path, HttpOnly, SameSite,
 * Expires) are irrelevant for a single-host, single-run scrape.
 */
export class CookieJar {
  private readonly cookies = new Map<string, string>();

  /** Number of distinct cookies currently held. */
  get size(): number {
    return this.cookies.size;
  }

  /** Cookie names currently held, in insertion order. */
  names(): string[] {
    return [...this.cookies.keys()];
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  has(name: string): boolean {
    return this.cookies.has(name);
  }

  /** Merges raw `Set-Cookie` header values (one entry per header line). */
  mergeSetCookies(setCookieValues: readonly string[]): this {
    for (const raw of setCookieValues) {
      const pair = parseSetCookie(raw);
      if (pair) this.cookies.set(pair.name, pair.value);
    }
    return this;
  }

  /**
   * Merges every `Set-Cookie` header on a response.
   *
   * Uses `getSetCookie()` rather than `get("set-cookie")`: the latter
   * comma-joins multiple cookies into one unparseable string (and cookie
   * values such as `Expires=Mon, 01 Jan ...` contain commas themselves).
   */
  mergeFromResponse(response: CookieSource): this {
    const headers = response.headers;
    if (typeof headers.getSetCookie === "function") {
      return this.mergeSetCookies(headers.getSetCookie());
    }
    const single = headers.get("set-cookie");
    return single ? this.mergeSetCookies([single]) : this;
  }

  /** Serializes as a `Cookie` request header value: `a=1; b=2`. */
  toHeader(): string {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

/**
 * Parses one `Set-Cookie` header value into its name/value pair.
 * Everything after the first `;` (the attributes) is discarded.
 */
export function parseSetCookie(raw: string): { name: string; value: string } | null {
  const pair = raw.split(";", 1)[0];
  if (pair === undefined) return null;
  const eq = pair.indexOf("=");
  if (eq <= 0) return null;
  const name = pair.slice(0, eq).trim();
  const value = pair.slice(eq + 1).trim();
  if (!name) return null;
  return { name, value };
}

/* -------------------------------------------------------------------------- */
/* Fetch plumbing                                                             */
/* -------------------------------------------------------------------------- */

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function looksLikeLoginUrl(location: string): boolean {
  return location.toLowerCase().includes("login");
}

function causeMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Performs a fetch, converting transport-level failures into a SITE_DOWN ScrapeError. */
async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    throw new ScrapeError("SITE_DOWN", `network error requesting ${url}: ${causeMessage(error)}`);
  }
}

function baseHeaders(jar: CookieJar, referer?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: ACCEPT_HTML,
    "Accept-Language": "en-US,en;q=0.9",
  };
  const cookie = jar.toHeader();
  if (cookie) headers["Cookie"] = cookie;
  if (referer) headers["Referer"] = referer;
  return headers;
}

/* -------------------------------------------------------------------------- */
/* Scrape flow                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Logs in as `credentials` and returns the raw HTML of the tennis court sheet.
 *
 * @throws ScrapeError with code:
 *  - `SITE_DOWN` — network failure or 5xx from any hop
 *  - `PARSE_FAILED` — the login page is missing its WebForms tokens
 *  - `LOGIN_FAILED` — the site bounced us back to the login form
 *  - `SESSION_REJECTED` — logged in, but the court sheet redirected to login
 */
export async function fetchCourtSheetHtml(credentials: ChelseaCredentials): Promise<string> {
  const jar = new CookieJar();
  const loginUrl = `${CHELSEA_BASE_URL}${LOGIN_PATH}`;

  /* a. GET the login page: collect the session cookie and the WebForms tokens. */
  const loginPageResponse = await safeFetch(loginUrl, {
    method: "GET",
    redirect: "manual",
    headers: baseHeaders(jar),
  });
  jar.mergeFromResponse(loginPageResponse);

  if (loginPageResponse.status >= 500) {
    throw new ScrapeError(
      "SITE_DOWN",
      `login page returned ${loginPageResponse.status} ${loginPageResponse.statusText}`,
    );
  }

  const loginHtml = await readBody(loginPageResponse, "login page");
  const tokens = new Map<string, string>();
  for (const token of REQUIRED_TOKENS) {
    const value = extractHiddenField(loginHtml, token);
    if (value === null) {
      throw new ScrapeError("PARSE_FAILED", "login page tokens not found");
    }
    tokens.set(token, value);
  }

  /* b. POST the login form. EVENTVALIDATION rejects stray fields, so send only
     the tokens, the two text inputs and the tennis submit button — no
     cbxRemember, and never the golf button. */
  const body = new URLSearchParams();
  for (const [name, value] of tokens) body.set(name, value);
  body.set("UsernameTextBox", credentials.member);
  body.set("PasswordTextBox", credentials.password);
  body.set("btnTennis", "Login Tennis");

  const loginResponse = await safeFetch(loginUrl, {
    method: "POST",
    redirect: "manual",
    headers: {
      ...baseHeaders(jar, loginUrl),
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: CHELSEA_BASE_URL,
    },
    body: body.toString(),
  });
  /* c. Merge cookies before judging the outcome: ASP.NET sets the auth cookie
     on the 302 itself. */
  jar.mergeFromResponse(loginResponse);

  if (loginResponse.status >= 500) {
    throw new ScrapeError(
      "SITE_DOWN",
      `login POST returned ${loginResponse.status} ${loginResponse.statusText}`,
    );
  }

  if (isRedirect(loginResponse.status)) {
    const location = loginResponse.headers.get("location") ?? "";
    if (looksLikeLoginUrl(location)) {
      throw new ScrapeError("LOGIN_FAILED", "credentials rejected");
    }
    // Redirected away from the login page — authenticated.
  } else if (loginResponse.status === 200) {
    const html = await readBody(loginResponse, "login POST response");
    if (html.includes("PasswordTextBox") || html.includes('name="login1"')) {
      throw new ScrapeError("LOGIN_FAILED", "credentials rejected");
    }
    // A 200 without the login form means the site rendered a post-login page.
  } else {
    throw new ScrapeError(
      "LOGIN_FAILED",
      `unexpected login response status ${loginResponse.status}`,
    );
  }

  /* d. GET the court sheet page. This is normally a *selection form*
     (play-date dropdown + facility checkboxes + a Display button), not the
     sheet itself — the real data only comes back from posting that form. */
  const { html: selectionHtml, url: selectionUrl } = await fetchAuthenticatedPage(
    `${CHELSEA_BASE_URL}${COURT_SHEET_PATH}`,
    jar,
    loginUrl,
  );

  const isSelectionForm =
    selectionHtml.includes("ddlPlaydate") && selectionHtml.includes("btnDisplay");
  if (!isSelectionForm) {
    // Tolerate a site that hands back the sheet directly (e.g. a single-facility
    // club with no selection step).
    if (selectionHtml.includes("GridView2")) return selectionHtml;
    throw new ScrapeError(
      "PARSE_FAILED",
      "court sheet page has neither a selection form (ddlPlaydate/btnDisplay) nor a GridView2 table",
    );
  }

  /* e. Build and POST the "Display" postback: the WebForms tokens, the
     preselected play date, every facility checkbox present, and the submit
     button's own name/value pair. Mirrors scripts/capture-fixture.mjs step 4,
     verified working against the live site. */
  const displayBody = new URLSearchParams();
  for (const field of POSTBACK_FIELDS) {
    displayBody.set(field, extractHiddenField(selectionHtml, field) ?? "");
  }
  for (const token of REQUIRED_TOKENS) {
    const value = extractHiddenField(selectionHtml, token);
    if (value === null) {
      throw new ScrapeError("PARSE_FAILED", `court sheet selection form token not found: ${token}`);
    }
    displayBody.set(token, value);
  }
  for (const field of SCROLL_FIELDS) {
    const value = extractHiddenField(selectionHtml, field);
    if (value !== null) displayBody.set(field, value);
  }

  const playDate = extractSelectedPlaydate(selectionHtml);
  if (playDate === null) {
    throw new ScrapeError("PARSE_FAILED", "no selected ddlPlaydate option found");
  }
  displayBody.set("ddlPlaydate", playDate);

  for (const checkbox of FACILITY_CHECKBOXES) {
    if (hasNamedField(selectionHtml, checkbox)) displayBody.set(checkbox, "on");
  }
  displayBody.set("btnDisplay", "Display");

  const displayResponse = await safeFetch(selectionUrl, {
    method: "POST",
    redirect: "manual",
    headers: {
      ...baseHeaders(jar, selectionUrl),
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: CHELSEA_BASE_URL,
    },
    body: displayBody.toString(),
  });
  jar.mergeFromResponse(displayResponse);

  if (displayResponse.status >= 500) {
    throw new ScrapeError(
      "SITE_DOWN",
      `display POST returned ${displayResponse.status} ${displayResponse.statusText}`,
    );
  }

  if (displayResponse.status === 200) {
    return await readBody(displayResponse, "court sheet display POST response");
  }

  if (isRedirect(displayResponse.status)) {
    const location = displayResponse.headers.get("location") ?? "";
    if (!location || looksLikeLoginUrl(location)) {
      throw new ScrapeError(
        "SESSION_REJECTED",
        `display POST redirected to login (${location || "no Location header"})`,
      );
    }
    // Follow exactly one redirect — the site occasionally 302s back to the
    // same page after a postback.
    const followUrl = new URL(location, selectionUrl).toString();
    const followed = await safeFetch(followUrl, {
      method: "GET",
      redirect: "manual",
      headers: baseHeaders(jar, selectionUrl),
    });
    jar.mergeFromResponse(followed);

    if (followed.status >= 500) {
      throw new ScrapeError(
        "SITE_DOWN",
        `display POST redirect target returned ${followed.status} ${followed.statusText}`,
      );
    }
    if (followed.status === 200) {
      return await readBody(followed, "court sheet display redirect target");
    }
    throw new ScrapeError(
      "SESSION_REJECTED",
      `display POST redirect target returned unexpected status ${followed.status}`,
    );
  }

  throw new ScrapeError(
    "SESSION_REJECTED",
    `display POST returned unexpected status ${displayResponse.status}`,
  );
}

/** Follows redirects manually, merging cookies, until an HTML page comes back. */
async function fetchAuthenticatedPage(
  url: string,
  jar: CookieJar,
  referer: string,
): Promise<{ html: string; url: string }> {
  let currentUrl = url;
  let currentReferer = referer;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await safeFetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      headers: baseHeaders(jar, currentReferer),
    });
    jar.mergeFromResponse(response);

    if (response.status >= 500) {
      throw new ScrapeError(
        "SITE_DOWN",
        `court sheet returned ${response.status} ${response.statusText}`,
      );
    }

    if (isRedirect(response.status)) {
      const location = response.headers.get("location") ?? "";
      if (!location || looksLikeLoginUrl(location)) {
        throw new ScrapeError(
          "SESSION_REJECTED",
          `court sheet redirected to login (${location || "no Location header"})`,
        );
      }
      currentReferer = currentUrl;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (response.status === 200) {
      const html = await readBody(response, "court sheet");
      return { html, url: currentUrl };
    }

    throw new ScrapeError(
      "SESSION_REJECTED",
      `court sheet returned unexpected status ${response.status}`,
    );
  }

  throw new ScrapeError("SESSION_REJECTED", `too many redirects fetching ${url}`);
}

/** Reads a response body, mapping stream failures onto SITE_DOWN. */
async function readBody(response: Response, label: string): Promise<string> {
  try {
    return await response.text();
  } catch (error) {
    throw new ScrapeError("SITE_DOWN", `failed reading ${label}: ${causeMessage(error)}`);
  }
}
