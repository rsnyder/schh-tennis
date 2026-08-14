import { fetchClubNewsHtml, fetchCourtSheetHtml } from "./chelsea";
import { todayInNewYork } from "./date";
import type { Env } from "./index";
import { parseCourtSheet } from "./parse";
import { parseClubNews } from "./parse-welcome";
import { CourtSheet, ScrapeError, WelcomeInfo } from "./types";

export interface CourtSheetResult {
  data: CourtSheet | null;
  stale: boolean;
  error?: string;
}

/** A cache entry is fresh for this long after it was scraped. */
export const FRESH_TTL_MS = 15 * 60 * 1000;

/** KV entries expire after this long so stale rows don't accumulate forever. */
const KV_EXPIRATION_TTL_SECONDS = 3 * 24 * 60 * 60;

function kvKey(dateISO: string): string {
  return `courtsheet:${dateISO}`;
}

function isFresh(sheet: CourtSheet, now: number): boolean {
  const fetchedAt = Date.parse(sheet.fetchedAt);
  if (Number.isNaN(fetchedAt)) return false;
  return now - fetchedAt < FRESH_TTL_MS;
}

function errorCode(error: unknown): string {
  if (error instanceof ScrapeError) return error.code;
  return "SITE_DOWN";
}

/** Scrapes the live court sheet for `dateISO` (default: today), parses it, and writes it to KV. */
export async function refreshCourtSheet(env: Env, dateISO?: string): Promise<CourtSheet> {
  const target = dateISO ?? todayInNewYork();
  const html = await fetchCourtSheetHtml(
    { member: env.CHELSEA_MEMBER, password: env.CHELSEA_PASSWORD },
    // Omit the target for today so the flow keeps working even if the site's
    // option-label format drifts (the form preselects today).
    target === todayInNewYork() ? undefined : target,
  );
  const sheet = parseCourtSheet(html, target, new Date().toISOString());
  await env.COURT_CACHE.put(kvKey(target), JSON.stringify(sheet), {
    expirationTtl: KV_EXPIRATION_TTL_SECONDS,
  });
  return sheet;
}

/**
 * Returns the court sheet for `dateISO` (default: today), preferring a fresh
 * cache entry, falling back to a live scrape, and finally to a stale cache
 * entry when the scrape fails.
 */
export async function getCourtSheet(
  env: Env,
  ctx: ExecutionContext,
  dateISO?: string,
): Promise<CourtSheetResult> {
  const target = dateISO ?? todayInNewYork();
  const key = kvKey(target);

  const existingRaw = await env.COURT_CACHE.get(key);
  const existing: CourtSheet | null = existingRaw ? (JSON.parse(existingRaw) as CourtSheet) : null;

  if (existing && isFresh(existing, Date.now())) {
    return { data: existing, stale: false };
  }

  try {
    const sheet = await refreshCourtSheet(env, target);
    return { data: sheet, stale: false };
  } catch (error) {
    const code = errorCode(error);
    if (existing) {
      return { data: existing, stale: true, error: code };
    }
    return { data: null, stale: false, error: code };
  }
}

/* ------------------------- welcome page (5-min TTL) ------------------------ */

export interface WelcomeResult {
  data: WelcomeInfo | null;
  stale: boolean;
  error?: string;
}

/** Conditions/announcements change frequently — much shorter freshness window. */
export const WELCOME_FRESH_TTL_MS = 5 * 60 * 1000;

const WELCOME_KV_KEY = "welcome";
const WELCOME_KV_EXPIRATION_TTL_SECONDS = 24 * 60 * 60;

function isWelcomeFresh(info: WelcomeInfo, now: number): boolean {
  const fetchedAt = Date.parse(info.fetchedAt);
  if (Number.isNaN(fetchedAt)) return false;
  return now - fetchedAt < WELCOME_FRESH_TTL_MS;
}

/** Fetches the club news document (public, no login), parses it, writes it to KV. */
export async function refreshWelcome(env: Env): Promise<WelcomeInfo> {
  const html = await fetchClubNewsHtml();
  const info = parseClubNews(html, new Date().toISOString());
  await env.COURT_CACHE.put(WELCOME_KV_KEY, JSON.stringify(info), {
    expirationTtl: WELCOME_KV_EXPIRATION_TTL_SECONDS,
  });
  return info;
}

/**
 * Returns the welcome info (club message + announcement slides), fresh within
 * 5 minutes, falling back to a live scrape and then to a stale cache entry.
 */
export async function getWelcome(env: Env): Promise<WelcomeResult> {
  const existingRaw = await env.COURT_CACHE.get(WELCOME_KV_KEY);
  const existing: WelcomeInfo | null = existingRaw
    ? (JSON.parse(existingRaw) as WelcomeInfo)
    : null;

  if (existing && isWelcomeFresh(existing, Date.now())) {
    return { data: existing, stale: false };
  }

  try {
    const info = await refreshWelcome(env);
    return { data: info, stale: false };
  } catch (error) {
    const code = errorCode(error);
    if (existing) {
      return { data: existing, stale: true, error: code };
    }
    return { data: null, stale: false, error: code };
  }
}
