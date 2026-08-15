# schh-tennis

A Cloudflare Worker that displays the current day's Sun City Hilton Head tennis court sheet, scraped from the Chelsea Reservations site.

**Live:** https://schh-tennis.pages.dev (primary, via Cloudflare Pages) · https://schh-tennis.ron-f9a.workers.dev (Worker deployment: runs the cron pre-warm, doubles as fallback origin)

## How it works

```
browser ──> Worker ──> Workers KV (cache, 15-min freshness)
                └────> hiltheadct.chelseareservations.com (WebForms login + Display postback)
```

- `GET /` — phone-optimized landing page: the club's welcome message and announcement images scraped from the Chelsea welcome page (`/api/welcome`, cached 5 minutes), with a bottom tab bar (Home · Court Sheet · Reserve). This is the page the signage QR code points to.
- `GET /courts` — the court sheet: facility tabs (South / North / West), a vertical time-slot list with full player names, open-court summaries, day navigation (‹ ›), and a "Now" highlight that auto-scrolls to the current slot. It's an installable PWA (manifest + minimal service worker + app icons at `/manifest.webmanifest`, `/sw.js`, `/icons/*`): "Add to Home Screen" gives an app icon, splash screen, and standalone (no browser chrome) presentation. Data always comes from the network; the service worker only keeps the shell available offline.
- `GET /api/courtsheet` — parsed JSON for today (America/New_York). Scrapes on cache miss; serves the last good sheet with `stale: true` if the site is unreachable.
- `GET /api/raw` — raw scraped HTML, only when `DEBUG=true` (local debugging of markup drift).
- `GET /tv` — digital-signage view for the 65" 4K outdoor TVs (dark, large type, last-name-only, no interaction). Server-rendered core: the Worker builds the full grid per request and the page self-refreshes via `<meta refresh>` (20s screen rotation unpinned via time-bucketing, 5-min data refresh pinned), so it works even on viewers without JavaScript; a single optional script adds a live clock when JS is available. `/tv/static` is an alias for TVs already configured with that URL. Rotates South ⇄ North & West every 20s; pin one screen with `?screen=south` or `?screen=northwest`, adjust rotation with `?rotate=NN` (seconds), show the full day (instead of upcoming-only) with `?all=1`, request another offered day with `?date=YYYY-MM-DD` (the site offers today + ~3 days), and simulate a time of day with `?time=16:00` (or `4:00PM`) to preview how the display adapts.

`?date=YYYY-MM-DD` also works on `/` and `/api/courtsheet` (404 `DATE_UNAVAILABLE` when the site doesn't offer that day).
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

Runs as a single Cloudflare Worker (free tier) with a KV namespace, two
secrets, and cron pre-warming — **see [DEPLOYMENT.md](DEPLOYMENT.md)** for the
full environment description, first-time setup, and operations notes. Routine
deploy:

```sh
npm run deploy:all   # Worker (cron + fallback) then Pages (schh-tennis.pages.dev)
```

**Releases are versioned** via the `version` field in `package.json` (single
source of truth, shown in the bottom-right corner of the TV display). Bump it
with each meaningful release — `npm version patch|minor` or edit by hand —
then commit and `npm run deploy:all`.

## When the site's markup changes

The parser throws `PARSE_FAILED` (the page then serves stale data with a banner). Re-capture fixtures with `node --env-file=.dev.vars scripts/capture-fixture.mjs`, inspect the new HTML in `test/fixtures/`, and adjust `src/parse.ts` + tests.

**Note:** captured fixture HTML contains real member names, so `test/fixtures/*.html` is gitignored. On a fresh clone, run the capture script above once before `npm test` (the parser tests read the fixture; without it they are skipped/fail).
