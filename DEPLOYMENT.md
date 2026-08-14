# Deployment environment

Everything runs as a single **Cloudflare Worker** on the free tier — there is no
server, container, or database to maintain. This doc describes what exists in
Cloudflare, how it gets there, and how to operate it.

## Topology

```
Sylvox TVs / phones / browsers
        │  https
        ▼
Cloudflare Worker "schh-tennis"          ← src/index.ts bundle (wrangler/esbuild)
   ├── serves  /            (mobile page, src/page.ts)
   ├── serves  /tv          (signage page, src/signage.ts)
   ├── serves  /api/courtsheet, /api/raw
   ├── reads/writes ──► Workers KV "COURT_CACHE"   (parsed sheets, keyed by date)
   └── scrapes ───────► hiltheadct.chelseareservations.com  (IIS/ASP.NET WebForms)
```

## Cloudflare resources

| Resource | Value |
|---|---|
| Account | Ron@snyderjr.com's Account (`f9a486f2c4e5234040005c2d2f9a4b97`) |
| Worker name | `schh-tennis` |
| Public URL | https://schh-tennis.ron-f9a.workers.dev (workers.dev subdomain; no custom domain, no Cloudflare zone) |
| KV namespace | `COURT_CACHE`, id `faab90773def4eccb5039f963c15a563`, bound as `env.COURT_CACHE` |
| Secrets | `CHELSEA_MEMBER`, `CHELSEA_PASSWORD` (Chelsea member login; encrypted at rest, set via `wrangler secret put`, never in git) |
| Plain vars | `DEBUG` = `"false"` in production (gates `/api/raw`) |
| Cron triggers | `*/15 11-23 * * *` and `0,15,30,45 0-1 * * *` (UTC) — pre-warms today's cache every 15 min, ~7am–9pm ET |
| Plan | Workers Free (100k req/day, KV 100k reads / 1k writes per day). Expected load is a few thousand requests/day and ~60 KV writes/day — far under limits. |

`wrangler.jsonc` in the repo root is the source of truth for all of the above
except secrets. `compatibility_date` is `2025-08-01`.

## How deploys work

Deploys are manual, from a developer machine — there is no CI/CD:

```sh
npx wrangler login     # once per machine; OAuth in browser, token stored in
                       # ~/Library/Preferences/.wrangler/config/default.toml
npm run deploy         # = wrangler deploy: bundles src/, uploads, activates
```

A deploy is atomic and takes effect within seconds (individual edge instances
can serve the previous version for a few seconds after upload — retry before
diagnosing). Each deploy gets a version ID; `npx wrangler deployments list`
shows history and `npx wrangler rollback` reverts to a prior version. Built
with wrangler 4.x (4.122.0 at time of writing) under Node 22.

### First-time setup on a new account

1. `npx wrangler login`
2. `npx wrangler kv namespace create COURT_CACHE` → paste the new id into `wrangler.jsonc`
3. `npx wrangler secret put CHELSEA_MEMBER` and `... CHELSEA_PASSWORD`
4. `npm run deploy`

## Local development

- Copy `.dev.vars.example` → `.dev.vars` (gitignored) and fill in credentials;
  `DEBUG=true` there enables the `/api/raw` debug route locally.
- `npm run dev` (wrangler dev) runs the Worker at `http://localhost:8787` with a
  **local KV simulation** — it does not touch the production namespace, but it
  does scrape the real Chelsea site.
- `npm test` / `npm run typecheck` need no credentials (fixture-based), but the
  parser tests read `test/fixtures/*.html`, which is gitignored — regenerate
  fixtures once per clone with `node --env-file=.dev.vars scripts/capture-fixture.mjs`.

## Operations

- **Logs:** `npx wrangler tail` streams live request/exception logs; the
  Cloudflare dashboard (Workers & Pages → schh-tennis) shows metrics, cron
  history, and KV contents.
- **Site down / markup drift:** the Worker serves the last good sheet with
  `stale: true` (yellow banner / OLDER DATA chip on the pages). Parser drift
  throws `PARSE_FAILED` — recapture fixtures, fix `src/parse.ts`, redeploy.
- **Rotating the Chelsea password:** update it on the Chelsea site, then
  `npx wrangler secret put CHELSEA_PASSWORD` and re-deploy is *not* required —
  secret changes restart the Worker automatically.
- **Kill switch:** `npx wrangler delete` removes the Worker (KV data persists
  until the namespace is deleted separately).

## External dependency & etiquette

The only upstream is the Chelsea Reservations site. Every scrape performs a
fresh WebForms login (new `ASP.NET_SessionId`), a Display postback, and reads
one page (~100 KB). Caching + cron keep this to ~4 logins/hour during the day.
If the club ever objects or the site adds bot protection, the cron schedule in
`wrangler.jsonc` is the throttle to adjust first.

## Git

GitHub: https://github.com/rsnyder/schh-tennis (public), branch `main`.
Pushes do **not** deploy — deploys are always explicit `wrangler deploy` runs.
Nothing secret lives in the repo: credentials are in Worker secrets/.dev.vars,
and member-name-bearing fixtures are gitignored.
