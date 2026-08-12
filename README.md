# schh-tennis

A Cloudflare Worker that displays the current day's Sun City Hilton Head tennis court sheet, scraped from the Chelsea Reservations site.

**Live:** https://schh-tennis.ron-f9a.workers.dev

## How it works

```
browser ──> Worker ──> Workers KV (cache, 15-min freshness)
                └────> hiltheadct.chelseareservations.com (WebForms login + Display postback)
```

- `GET /` — mobile-friendly page: one grid per facility (South / North / West), courts × times.
- `GET /api/courtsheet` — parsed JSON for today (America/New_York). Scrapes on cache miss; serves the last good sheet with `stale: true` if the site is unreachable.
- `GET /api/raw` — raw scraped HTML, only when `DEBUG=true` (local debugging of markup drift).
- A cron trigger (every 15 min, ~7am–9pm ET) pre-warms the cache so visitors rarely wait on a scrape.

Scrape flow (see `test/fixtures/FINDINGS.md` for full details): GET `/login.aspx` → extract `__VIEWSTATE`/`__EVENTVALIDATION` tokens → POST credentials with `btnTennis` → GET `TNReviewCourtSheet.aspx` (a selection form) → POST it back with today's `ddlPlaydate`, all facility checkboxes, and `btnDisplay=Display` → parse the `GridView2` table.

## Source layout

| File | Responsibility |
|---|---|
| `src/index.ts` | Routing + `scheduled` cron handler |
| `src/chelsea.ts` | Login/session/postback flow (manual redirects, cookie jar) |
| `src/parse.ts` | GridView HTML → `CourtSheet` JSON (pure, fixture-tested) |
| `src/cache.ts` | KV policy: 15-min freshness, stale-while-error fallback |
| `src/page.ts` | Inline frontend (no framework) |
| `src/date.ts` | America/New_York date handling |
| `scripts/capture-fixture.mjs` | Re-capture real HTML fixtures when the site's markup changes |

## Development

```sh
npm install
cp .dev.vars.example .dev.vars   # fill in CHELSEA_MEMBER / CHELSEA_PASSWORD
npm test                          # vitest (fixture-based, no network)
npm run typecheck
npm run dev                       # wrangler dev — hits the real site
```

## Deployment

```sh
npx wrangler kv namespace create COURT_CACHE   # once; id goes in wrangler.jsonc
npx wrangler secret put CHELSEA_MEMBER
npx wrangler secret put CHELSEA_PASSWORD
npm run deploy
```

## When the site's markup changes

The parser throws `PARSE_FAILED` (the page then serves stale data with a banner). Re-capture fixtures with `node --env-file=.dev.vars scripts/capture-fixture.mjs`, inspect the new HTML in `test/fixtures/`, and adjust `src/parse.ts` + tests.

**Note:** captured fixture HTML contains real member names, so `test/fixtures/*.html` is gitignored. On a fresh clone, run the capture script above once before `npm test` (the parser tests read the fixture; without it they are skipped/fail).
