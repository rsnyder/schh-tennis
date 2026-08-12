import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCourtSheet, refreshCourtSheet } from "../src/cache";
import { CourtSheet, ScrapeError } from "../src/types";

vi.mock("../src/chelsea", () => ({
  fetchCourtSheetHtml: vi.fn(),
}));
vi.mock("../src/parse", () => ({
  parseCourtSheet: vi.fn(),
}));

import { fetchCourtSheetHtml } from "../src/chelsea";
import { parseCourtSheet } from "../src/parse";

const mockedFetch = vi.mocked(fetchCourtSheetHtml);
const mockedParse = vi.mocked(parseCourtSheet);

/** A minimal in-memory stand-in for KVNamespace, cast as `any` at call sites. */
function makeKv(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    _store: store,
  };
}

function makeEnv(kv: ReturnType<typeof makeKv>) {
  return {
    COURT_CACHE: kv as any,
    CHELSEA_MEMBER: "member",
    CHELSEA_PASSWORD: "password",
    DEBUG: "false",
  } as any;
}

function makeCtx(): ExecutionContext {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  } as unknown as ExecutionContext;
}

function sheet(overrides: Partial<CourtSheet> = {}): CourtSheet {
  return {
    date: "2026-08-12",
    facilities: [],
    fetchedAt: new Date().toISOString(),
    ...overrides,
  };
}

const NOW = new Date("2026-08-12T16:00:00.000Z"); // noon in America/New_York (EDT)
const KEY = "courtsheet:2026-08-12";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  mockedFetch.mockReset();
  mockedParse.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getCourtSheet", () => {
  it("returns a fresh cached entry without scraping", async () => {
    const fresh = sheet({ fetchedAt: new Date(NOW.getTime() - 5 * 60 * 1000).toISOString() });
    const kv = makeKv({ [KEY]: JSON.stringify(fresh) });
    const env = makeEnv(kv);

    const result = await getCourtSheet(env, makeCtx());

    expect(result).toEqual({ data: fresh, stale: false });
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("scrapes and returns fresh data when the cached entry is expired", async () => {
    const old = sheet({ fetchedAt: new Date(NOW.getTime() - 20 * 60 * 1000).toISOString() });
    const kv = makeKv({ [KEY]: JSON.stringify(old) });
    const env = makeEnv(kv);

    const fresh = sheet({ fetchedAt: NOW.toISOString() });
    mockedFetch.mockResolvedValue("<html></html>");
    mockedParse.mockReturnValue(fresh);

    const result = await getCourtSheet(env, makeCtx());

    expect(result).toEqual({ data: fresh, stale: false });
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(kv._store.get(KEY)).toBe(JSON.stringify(fresh));
  });

  it("falls back to stale data with an error code when the scrape fails and an old entry exists", async () => {
    const old = sheet({ fetchedAt: new Date(NOW.getTime() - 20 * 60 * 1000).toISOString() });
    const kv = makeKv({ [KEY]: JSON.stringify(old) });
    const env = makeEnv(kv);

    mockedFetch.mockRejectedValue(new ScrapeError("SITE_DOWN", "site is down"));

    const result = await getCourtSheet(env, makeCtx());

    expect(result).toEqual({ data: old, stale: true, error: "SITE_DOWN" });
  });

  it("returns no data with an error code when the scrape fails and no entry exists", async () => {
    const kv = makeKv();
    const env = makeEnv(kv);

    mockedFetch.mockRejectedValue(new ScrapeError("LOGIN_FAILED", "bad credentials"));

    const result = await getCourtSheet(env, makeCtx());

    expect(result).toEqual({ data: null, stale: false, error: "LOGIN_FAILED" });
  });
});

describe("refreshCourtSheet", () => {
  it("scrapes, parses, and stores the result in KV with a 3-day ttl", async () => {
    const kv = makeKv();
    const env = makeEnv(kv);
    const fresh = sheet({ fetchedAt: NOW.toISOString() });
    mockedFetch.mockResolvedValue("<html></html>");
    mockedParse.mockReturnValue(fresh);

    const result = await refreshCourtSheet(env);

    expect(result).toEqual(fresh);
    expect(kv.put).toHaveBeenCalledWith(KEY, JSON.stringify(fresh), { expirationTtl: 259200 });
  });
});
