# Administration guide

Written for whoever looks after this site, including people who aren't
programmers. For the big picture read the [README](../README.md) first.

Sections 1–4 need only a web browser. Anything that needs a developer is marked
**(developer)**.

---

## 1. Handoff checklist (new maintainer)

Work through this once when taking over. Nothing here is urgent as long as the
site keeps running, but item 1 is the only way it keeps running.

- [ ] **Chelsea login.** Decide which Chelsea member account the site should use
      and put its details into Cloudflare (§3). Use an account that will not be
      closed or have its password forced to change when its owner moves away,
      ideally one the club has agreed to dedicate to this purpose.
- [ ] **Cloudflare access.** Make sure you can sign in to the Cloudflare account
      that hosts the site (currently Ron Snyder's). Either have the owner add
      you as a member (Cloudflare dashboard → Manage Account → Members), or
      have the project redeployed into a new account (see
      [DEPLOYMENT.md](DEPLOYMENT.md), "First-time setup on a new account").
      *Note: the free usage analytics (§5) belong to the account it was created
      under and will be lost on a move unless re-created.*
- [ ] **GitHub access.** Make sure you can see
      https://github.com/rsnyder/schh-tennis (it is public, but you'll need
      write access to make changes).
- [ ] **A developer on call.** Someone able to run the commands in
      [DEPLOYMENT.md](DEPLOYMENT.md) when a fix is needed (§4, "Site shows older
      data"). They need Node.js 22 and the repository on their computer.
- [ ] **CourtReserve plan.** Find out the date Chelsea is being switched off and
      who is deciding what replaces this site (README §7).
- [ ] **TV and QR code.** Note that the QR code on the TV display is an image of
      `schh-tennis.pages.dev`. It only needs to change if that address changes.
- [ ] **Record where you keep the new Chelsea password** (a password manager
      shared with your backup person).

## 2. Is it working? A 2-minute check

1. Open https://schh-tennis.pages.dev/courts on a phone or computer.
2. Does it show today's date and a list of names?
   - **Yes, no yellow banner:** healthy.
   - **Yellow banner / "OLDER DATA":** the site is showing a saved copy because
     it couldn't get a new one. See §4.
   - **Error / blank:** see §4.
3. Open https://schh-tennis.pages.dev/tv to preview the TV display.
4. Optional: compare with the real Chelsea court sheet to confirm they agree.

The About page (https://schh-tennis.pages.dev/about) shows the **version
number** of what is currently deployed.

## 3. Updating the Chelsea login

Do this when the Chelsea password changes, the old account is closed, or you are
switching to a different member account.

The login is stored in **two places in Cloudflare, and both must be updated**:
the scheduled refresher (a *Worker*) and the public site (a *Pages* project).
Each holds two values:

| Name | Value |
|---|---|
| `CHELSEA_MEMBER` | the Chelsea username / member ID |
| `CHELSEA_PASSWORD` | the Chelsea password |

### Using the Cloudflare website (no coding)

1. Sign in at https://dash.cloudflare.com and open **Workers & Pages**.
2. You will see two items named **schh-tennis**: a *Worker* and a *Pages*
   project. Do steps 3–5 for **each**.
3. Open it → **Settings** → **Variables and Secrets**.
4. Edit `CHELSEA_MEMBER` and `CHELSEA_PASSWORD` to the new values (type the
   value in fully; secrets can't be viewed, only replaced) and **Save**.
5. **Pages only:** secret changes take effect on the *next deployment*. Under
   **Deployments**, open the latest deployment's "⋯" menu and choose **Retry
   deployment** (or ask a developer to run `npm run deploy:all`).
6. Wait about 15 minutes (or until the next refresh) and run the check in §2.

### Using the command line **(developer)**

```sh
npx wrangler secret put CHELSEA_MEMBER
npx wrangler secret put CHELSEA_PASSWORD
npx wrangler pages secret put CHELSEA_MEMBER --project-name schh-tennis
npx wrangler pages secret put CHELSEA_PASSWORD --project-name schh-tennis
npm run deploy:all
```

For local development, also update `CHELSEA_MEMBER` / `CHELSEA_PASSWORD` in
`.dev.vars` (this file is never committed to GitHub).

### If the new login doesn't work

The account must be a normal Chelsea member who can see the tennis court sheet.
First confirm you can sign in on the Chelsea site by hand with the same details.
Chelsea may lock an account after repeated failed attempts, so don't retry many
times; stop, and fix the credential first.

## 4. When something looks wrong

| What you see | Likely cause | What to do |
|---|---|---|
| Yellow "older data" banner, only for a short time | Chelsea briefly unreachable | Nothing; it recovers by itself |
| Banner for hours, and Chelsea's own site is **down** | Chelsea outage | Nothing; wait |
| Banner persists, Chelsea works, **and the password was recently changed** | Stored login is out of date | §3 |
| Banner persists, Chelsea works, password unchanged | Chelsea changed its page layout, or began blocking automated logins | **(developer)** see "Parser fixes" in [TECHNICAL.md](TECHNICAL.md) |
| Empty sheet for a day in the future | Chelsea only offers today plus ~3 days | Expected |
| TV shows old content | The TV's browser/player has stopped refreshing | Restart the Sylvox player (or reload its page from the Sylvox management console), or power-cycle it |
| Everything is down/404 | Cloudflare problem or the project was deleted | Check https://www.cloudflarestatus.com, then the Cloudflare dashboard |

To inspect what is happening, the Cloudflare dashboard → Workers & Pages →
schh-tennis → **Logs / Metrics** shows requests, errors and the scheduled
refreshes. **(developer)** `npx wrangler tail` streams logs live.

The site is designed to degrade gracefully: an outage shows the last good data,
not a broken page, and **no member data or money is at risk** because the site is
read-only and holds no personal information beyond the names already on the
public court sheet.

## 5. Routine and occasional tasks

| Task | How |
|---|---|
| See who is using the site | Cloudflare dashboard → Analytics & Logs → Web Analytics (counts page views only; no cookies, no personal tracking). TV displays are deliberately not counted. |
| Change TV rotation timing or pin one screen | Add options to the TV's URL, e.g. `/tv?screen=south` or `/tv?rotate=30`. Full list in [TECHNICAL.md](TECHNICAL.md). |
| Change wording (welcome text, About page, etc.) | **(developer)** edit the file in `src/`, bump `version` in `package.json`, `npm run deploy:all` |
| Roll back a bad release | **(developer)** `npx wrangler rollback` (see [DEPLOYMENT.md](DEPLOYMENT.md)) |
| Shut it down | Delete the *Worker* and the *Pages* project in the Cloudflare dashboard. There is nothing else to clean up apart from the stored cache (KV namespace `COURT_CACHE`). |

## 6. Who and what to contact

Fill these in when handing off:

| Role | Name / contact |
|---|---|
| Current maintainer | |
| Backup maintainer / developer | |
| Club sponsor for the project (tennis committee) | |
| Chelsea / CourtReserve administrator at the club | |
| Where the Chelsea login is stored | |
| Cloudflare account owner | |
