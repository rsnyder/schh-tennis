# SCHH Tennis Court Sheet

A small website that shows today's Sun City Hilton Head tennis court sheet on the
big outdoor TVs at the courts, and in a friendly, phone-sized format for members.

**Live:** https://schh-tennis.pages.dev

> **If you are taking over this project, start with
> [docs/ADMINISTRATION.md](docs/ADMINISTRATION.md)** — it is written for
> non-programmers and covers the handoff checklist, updating the Chelsea login,
> and what to do when something looks wrong.

---

## 1. What this is and why it exists

Court reservations at the club are made on the **Chelsea Reservations** website.
Chelsea is dated, requires a login, and is awkward on a phone. The courts had no
good way to show the day's schedule on the new outdoor TVs, and members could not
easily answer simple questions like "who is playing at 9 on North?" or "is there
an open court this afternoon?".

This project solves that by **reading the court sheet from Chelsea every few
minutes and re-presenting it**. Its primary goal is to show the current court
reservations on the **new outdoor TVs** at the courts. A phone-friendly app grew
out of the same plumbing and is now a useful second audience:

| Audience | What they get | Address |
|---|---|---|
| The TVs at the courts (shown through the Sylvox digital signage players) | Large-type, last-name-only schedule that rotates between facilities, no interaction needed | `/tv` |
| Members on phones | Club welcome message + announcements, a clean court sheet by facility (South / North / West), open-court summaries, install-to-home-screen app | `/` and `/courts` |
| Members who want to book | A "Reserve" button that sends them to the real Chelsea site | tab bar |

It is **read-only**. Nobody books through this site and it never changes
anything in Chelsea; it only displays what Chelsea already shows.

## 2. Features

### TV display (the primary goal)

**This is what the project was built for:** a way to display the current court
reservations on the new outdoor TVs at the courts. Everything else in the
project — the scheduled refresh, the Chelsea login and reader, the saved copy —
is the "plumbing" that makes that display possible.

**Built for the Sylvox players.** The display was developed for the **Sylvox
Digital Signage Player** devices that drive the new pair of outdoor TVs at the
courts. The Sylvox player is a small Android box that turns an ordinary HDMI
display into a remotely managed digital sign; it is aimed at businesses, clubs,
restaurants, churches and community centers rather than home streaming. The
player is pointed at the page's web address and shows it full screen, and the
club manages what each TV shows from the Sylvox management side.

**Not Sylvox-specific.** The court display itself is an ordinary web page
(`/tv`). Anything that can show a full-screen web page — a different signage
player, a smart TV browser, a Chromecast/Fire stick, a PC — can display it by
being given the same address. Nothing in this project talks to or depends on
Sylvox; replacing the player does not require code changes.

In practice the player simply loads https://schh-tennis.pages.dev/tv. Nobody
needs to touch the TVs.

| Feature | What it means |
|---|---|
| **Automatic rotation** | Alternates between a **South** screen (12 courts) and a combined **North + West** screen. South is shown twice as long (about 40 s vs 20 s) because it has the most courts to read. |
| **Near-real-time updates** | A refresh loop reloads the page on each rotation and re-reads the data, so the display tracks the booking sheet within minutes (the underlying data is re-read from Chelsea at least every 15 minutes; see §3). |
| **Built for distance reading** | Dark background, very large type, **last names only**, and font sizes that auto-fit to each cell. Designed for 65" 4K screens. |
| **Upcoming-focused** | Slots that ended more than ~90 minutes ago are dropped, so the screen always shows what's current and what's next rather than the whole day. |
| **Open courts are obvious** | Open slots are faint; booked slots stand out; the current slot is emphasized. |
| **Events and blocks labelled** | Clinics, leagues and lessons are shown with a short readable label rather than as player names. |
| **Live clock and date** | The header shows the date and the current time. |
| **QR code** | A QR code and caption invite members to scan and add the phone app. |
| **"Older data" chip** | If Chelsea can't be reached, an **OLDER DATA** chip appears while still showing the last known schedule. |
| **Very resilient** | The display is built so the core view works even on a TV browser with JavaScript disabled or very limited; the clock is the only optional extra. |
| **Version number** | Shown in a corner so you can tell at a glance which release a TV is displaying. |
| **Adjustable by web address** | Add options to the address — e.g. `/tv?screen=south` to pin one screen, `/tv?rotate=30` to slow the rotation, `/tv?all=1` to show the whole day, `/tv?time=16:00` to preview how it looks at another time. Details in [docs/TECHNICAL.md](docs/TECHNICAL.md). |

### Mobile app (a by-product that proved its worth)

Once the plumbing for the TV display was in place, a simple **experimental**
mobile app was built on top of it, since the same data was already available.
It was meant as a trial, but since release it has proven **reliable and
useful**, and it is a good base for further development. For a maintainer: the
TV display is the thing to protect; the mobile app is the natural place to add
new member-facing features.


Open https://schh-tennis.pages.dev in any phone browser. It can also be
**installed to the home screen** so it opens like a regular app (instructions
are built into the app under *More → Install on your phone*; no app store, no
account, no cost).

| Feature | What it means for a member |
|---|---|
| **Court sheet for all three facilities** | Tabs for **South**, **North** and **West** show every time slot with the names of the players booked on each court. Full names are shown. |
| **Court status at a glance** | Each slot shows which courts are booked and which are **open**; an "Open: …" line lists the free courts, so "is anything free at 2pm?" is a quick answer. |
| **Clinics, leagues and events** | Blocked-out sessions (e.g. round robins, lessons, league matches) appear with their label and are visually distinct from regular bookings. |
| **"Now" marker and auto-scroll** | Opens at the current time slot, which is highlighted with a **Now** badge; earlier slots are dimmed. |
| **Day navigation** | ‹ › arrows move between today and the following days Chelsea offers (about 3 days ahead). |
| **Stays current by itself** | Re-checks for new data every 5 minutes while the app is open (only while the app is on screen, not in the background). |
| **Remembers your facility** | Reopens on the facility tab you used last. |
| **Home page: club news and court conditions** | The club's daily bulletin (conditions, announcements) from the Chelsea site is shown on the home page, refreshed every 5 minutes. |
| **Book via "Reserve"** | A tab-bar button opens the official Chelsea site to make or change reservations. (The app itself is read-only.) |
| **Still useful when things go wrong** | If Chelsea can't be reached, the last good sheet is shown with a yellow **"older data"** banner instead of an error screen. |
| **Install-to-home-screen / app feel** | Installable app with icon and full-screen launch, large touch targets, works on iPhone and Android. |
| **About page with version number** | *More → About* explains where the data comes from and shows which version is running (useful when reporting a problem). |

### Behind the scenes

| Capability | Notes |
|---|---|
| **Free to run** | Cloudflare free tier; no servers or paid services. |
| **Fast for everyone** | Everyone reads a shared saved copy, so a hundred people looking at once cause no extra load on Chelsea. |
| **Gentle on Chelsea** | About 4 logins an hour during the day, only between ~7 am and 9 pm. |
| **Read-only and private** | No bookings, no member accounts, no personal data stored. Usage statistics use Cloudflare's cookieless page-view counter (mobile pages only; the TVs are not counted). |
| **Eastern-time aware** | "Today" and "now" always mean Hilton Head local time, regardless of where the viewer or server is. |
| **Machine-readable data** | The same data is available as JSON at `/api/courtsheet` for any future tool. |

## 3. How it works (the 60-second version)

```
   Phones, TVs (via Sylvox
   signage players)
        │
        ▼
 schh-tennis.pages.dev   ◄──────  Cloudflare (free hosting)
        │                              │
        │ asks for today's sheet       │ every 15 min, 7am–9pm:
        ▼                              ▼ refresh in the background
   Saved copy (cache) ◄─────── Logs in to Chelsea as a member,
   "fresh" for 15 min          reads the court sheet, saves a copy
                                       │
                                       ▼
                         hiltheadct.chelseareservations.com
```

1. A scheduled job logs in to Chelsea with a **member username and password**,
   reads the day's court sheet, and saves a copy.
2. Phones and TVs are served from that saved copy, so they are fast and Chelsea
   isn't hit for every view.
3. If Chelsea is down or changes its layout, the site keeps showing the **last
   good copy** with an "older data" warning rather than going blank.

There is no server to maintain and no database. It runs on Cloudflare's **free
tier**, and the cost to operate is $0. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the technical inventory.

## 4. The things that matter for ownership

| Item | Where it lives | Why you care |
|---|---|---|
| **Chelsea login** (member ID + password) | Stored as secrets in Cloudflare (two places: the Worker and the Pages project) and in a local `.dev.vars` file for developers | The site stops updating if this login stops working. **Must be replaced on handoff.** |
| **Cloudflare account** | Currently Ron Snyder's account | Owns the hosting, the cache, the secrets, the usage analytics. Needs to be transferred or recreated on handoff. |
| **Source code** | GitHub: https://github.com/rsnyder/schh-tennis | Needed to change anything or redeploy. |
| **Address `schh-tennis.pages.dev`** | Cloudflare Pages | The QR code on the TVs is a picture of this address. Changing the address means re-making the QR code (see below). |

Everything else is in the code and is reproducible from the repository.

## 5. Ongoing administration

Normal day-to-day, **nothing is required** — it updates itself. The occasional
tasks are:

| When | What | Effort |
|---|---|---|
| Chelsea password changes, or the account is closed | Update the stored Chelsea login (see ADMINISTRATION.md §3) | 5 min, no coding |
| Site shows "older data" for more than a few hours | Check whether Chelsea itself is down; if not, Chelsea may have changed its layout and the reader needs a small fix | Developer, 1–2 hours typically |
| Club wants different TV timings / screens | Adjustable by URL options, no code change (see TECHNICAL.md, `/tv`) | Minutes |
| Club wants wording/branding changes | Edit text in `src/about.ts`, `src/home.ts`, etc., then deploy | Developer |
| Annual sanity check | Confirm the Chelsea login still works and the deploy tooling still runs | 15 min |

Cloudflare's free-tier limits are far above this site's usage (a few thousand
requests a day against a 100,000/day allowance), so cost and capacity are not
concerns at the current scale.

## 6. Enhancements: where things would change

The code is deliberately split so that **only one part knows about Chelsea**:

| Part | Files | Depends on Chelsea? |
|---|---|---|
| Reader (login + scrape + parse) | `src/chelsea.ts`, `src/parse.ts`, `src/parse-welcome.ts` | **Yes — the only part** |
| Shared data shape | `src/types.ts` (`CourtSheet`) | No |
| Saved-copy/caching | `src/cache.ts` | No |
| Phone pages, TV page, app install | `src/page.ts`, `src/home.ts`, `src/signage.ts`, `src/pwa.ts`, … | No (except the "Reserve" link URL) |

Common enhancement requests and where they go:

- **New TV layout / timing** — `src/signage.ts`
- **New page or info on the phone site** — `src/home.ts`, `src/more.ts`, `src/about.ts`
- **A new data source** — write a new reader that produces a `CourtSheet`
  (`src/types.ts`); the rest of the site does not change.

Details for developers are in [docs/TECHNICAL.md](docs/TECHNICAL.md).

## 7. Important: this is tailored to Chelsea, which is being replaced

This solution exists **because of the way the current Chelsea Reservations
system works**. Chelsea offers no public interface for schedule data, so this
project signs in as a member and reads the same web page a person would see.
That is inherently fragile: it depends on Chelsea's page layout and login
process staying the same.

**The club's Chelsea system is scheduled to be replaced by CourtReserve.** When
that happens, there are two possible paths:

1. **Retire this project.** CourtReserve may provide the capabilities this
   project was built to supply (a phone-friendly schedule view and/or
   display-board/TV output). If it does, the simplest outcome is to adopt those
   and shut this site down. *Someone should evaluate this before any new work is
   put into this project.*
2. **Adapt this project to CourtReserve.** If CourtReserve does not cover the
   need (for example, the rotating TV display), this site can keep being used
   with a **new reader that gets data through the CourtReserve API** instead of
   scraping Chelsea. CourtReserve's API is an official, supported interface, so
   this would be *more* robust than the current approach. The work is limited to
   the reader (§6): replace `src/chelsea.ts`/`src/parse.ts` with a CourtReserve
   client that outputs the same `CourtSheet` data, update the "Reserve" link
   (three files; search for `chelseareservations`), and re-capture test data.
   Requires API credentials from the club's CourtReserve administrator.

Until the cut-over, **the current Chelsea login must stay valid** or the site
will go stale. Once Chelsea is switched off, this site will stop updating and
should either be adapted (path 2) or taken down (path 1) at the same time, so
members are not shown a frozen schedule. A decision on this should be made as
part of the CourtReserve migration plan.

## 8. Documentation map

| Document | For | Contents |
|---|---|---|
| **README.md** (this file) | Everyone | Purpose, architecture, ownership, future |
| [docs/ADMINISTRATION.md](docs/ADMINISTRATION.md) | Maintainers, including non-technical | Handoff checklist, updating the Chelsea login, troubleshooting, what to check |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Technical maintainers | Cloudflare resources, deploy/rollback, setup on a new account |
| [docs/TECHNICAL.md](docs/TECHNICAL.md) | Developers | Routes, scrape flow, source layout, local development, parser maintenance |
| `test/fixtures/FINDINGS.md` | Developers | Notes on Chelsea's page structure |
