// Mobile-first frontend page for SCHH Tennis court sheet viewer.
// Vertical, list-based layout — no horizontal scrolling on any screen size.
export const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>SCHH Tennis — Court Sheet</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎾</text></svg>">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#1f5c2c">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="SCHH Tennis">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<style>
  :root {
    --green: #2f7a3d;
    --green-dark: #1f5c2c;
    --green-tint: #eaf3ea;
    --bg: #ffffff;
    --bg-alt: #f6f7f6;
    --text: #1c1f1c;
    --muted: #6b756c;
    --border: #e0e3e0;
    --reserved-border: #bfdcc4;
    --event-bg: rgba(47, 122, 61, 0.1);
    --event-border: #bfdcc4;
    --stale-bg: #fff8e1;
    --stale-border: #f0c948;
    --stale-text: #6b5900;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    max-width: 100%;
    overflow-x: hidden;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    max-width: 560px;
    margin: 0 auto;
  }
  #stickyTop {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }
  header {
    padding: 12px 16px 8px;
  }
  .hdr-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  header h1 {
    margin: 0 0 2px;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--green-dark);
    letter-spacing: -0.01em;
  }
  .reserve-link {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 4px 12px;
    border: 1px solid var(--reserved-border);
    border-radius: 8px;
    background: var(--green-tint);
    color: var(--green-dark);
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }
  .reserve-link:active { background: var(--bg-alt); }
  .hdr-date-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    font-size: 0.85rem;
  }
  .hdr-date-row .hdr-date {
    font-weight: 600;
    color: var(--text);
  }
  .hdr-date-row .hdr-updated {
    color: var(--muted);
  }
  .banner {
    margin: 8px 0 0;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.82rem;
    background: var(--stale-bg);
    border: 1px solid var(--stale-border);
    color: var(--stale-text);
  }
  .daynav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 8px 16px;
  }
  .nav-btn {
    min-width: 44px;
    min-height: 44px;
    flex: 0 0 44px;
    border: 1px solid var(--border);
    background: var(--bg);
    border-radius: 8px;
    font-size: 1.2rem;
    line-height: 1;
    color: var(--green-dark);
    cursor: pointer;
  }
  .nav-btn:active { background: var(--bg-alt); }
  .nav-btn.is-hidden { visibility: hidden; }
  .daynav-label {
    flex: 1;
    font-weight: 700;
    font-size: 0.95rem;
    text-align: center;
    color: var(--text);
    min-width: 0;
  }
  .tabs {
    display: flex;
    margin: 0 16px 10px;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    background: var(--bg-alt);
  }
  .tab-btn {
    flex: 1;
    min-height: 44px;
    border: none;
    background: transparent;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
    padding: 0 4px;
  }
  .tab-btn + .tab-btn { border-left: 1px solid var(--border); }
  .tab-btn.active {
    background: var(--green);
    color: #fff;
  }
  main {
    padding: 4px 0 24px;
    min-height: 40vh;
  }
  .install-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 10px 16px 0;
    padding: 10px 12px;
    background: var(--green);
    border-radius: 12px;
    color: #fff;
    text-decoration: none;
  }
  .install-banner:active { background: var(--green-dark); }
  .ib-icon { font-size: 1.6rem; flex: 0 0 auto; }
  .ib-text { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.3; }
  .ib-text b { font-size: 0.92rem; }
  .ib-sub { font-size: 0.76rem; opacity: 0.85; }
  .ib-close {
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    border: none;
    background: rgba(255,255,255,0.15);
    border-radius: 50%;
    color: #fff;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
  }
  .status {
    padding: 40px 20px;
    text-align: center;
    color: var(--muted);
    font-size: 0.95rem;
  }
  .error-page, .unavailable-page {
    padding: 48px 20px;
    text-align: center;
  }
  .error-page h2, .unavailable-page h2 {
    margin: 0 0 8px;
    font-size: 1.1rem;
    color: var(--text);
  }
  .error-page p, .unavailable-page p {
    margin: 0 0 4px;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .error-code {
    display: inline-block;
    margin-top: 6px;
    font-size: 0.75rem;
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 6px;
  }
  button.action-btn {
    margin-top: 16px;
    min-height: 44px;
    padding: 8px 20px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    background: var(--green);
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }
  button.action-btn:active { background: var(--green-dark); }
  .facility-heading {
    margin: 14px 16px 0;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .slot {
    border-bottom: 1px solid var(--border);
  }
  .slot.is-now {
    background: var(--green-tint);
  }
  .slot.is-past {
    opacity: 0.5;
  }
  .slot-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 12px 16px 6px;
  }
  .slot-time {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--green-dark);
  }
  .now-pill {
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--green);
    color: #fff;
    padding: 2px 8px;
    border-radius: 10px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 6px 16px;
    border-top: 1px solid var(--border);
  }
  .badge {
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--bg-alt);
    border: 1px solid var(--reserved-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.78rem;
    color: var(--green-dark);
  }
  .row-event .badge {
    background: var(--event-bg);
    border-color: var(--event-border);
  }
  .row-text {
    font-size: 0.88rem;
    color: var(--text);
    line-height: 1.3;
  }
  .row-event .row-text {
    color: var(--green-dark);
    font-weight: 600;
  }
  .slot-open {
    padding: 6px 16px 14px;
    font-size: 0.82rem;
    color: var(--muted);
    border-top: 1px solid var(--border);
  }
  footer {
    padding: 16px 16px calc(92px + env(safe-area-inset-bottom));
    text-align: center;
    color: var(--muted);
    font-size: 0.75rem;
  }
  #tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    display: flex;
    max-width: 560px;
    margin: 0 auto;
    background: var(--bg);
    border-top: 1px solid var(--border);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 62px;
    padding: 10px 4px 8px;
    text-decoration: none;
    color: var(--muted);
  }
  .tab-item:active { background: var(--bg-alt); }
  .tab-item.active { color: var(--green-dark); }
  .tab-icon { font-size: 1.7rem; line-height: 1; }
  .tab-label { font-size: 0.8rem; font-weight: 600; line-height: 1; display: flex; align-items: center; gap: 3px; }
  .tab-ext { font-size: 0.72rem; }
</style>
</head>
<body>
<div id="stickyTop">
  <header>
    <div class="hdr-title-row">
      <h1>SCHH Tennis &mdash; Court Sheet</h1>
    </div>
    <div class="hdr-date-row">
      <span class="hdr-date" id="dateLabel">Loading&hellip;</span>
      <span class="hdr-updated" id="updatedLabel"></span>
    </div>
    <div class="banner" id="staleBanner" style="display:none">Showing older data — the reservation site couldn't be reached.</div>
  </header>
  <div class="daynav" id="daynav">
    <button class="nav-btn" id="prevDayBtn" type="button" aria-label="Previous day">&lsaquo;</button>
    <span class="daynav-label" id="dayLabel">Today</span>
    <button class="nav-btn" id="nextDayBtn" type="button" aria-label="Next day">&rsaquo;</button>
  </div>
  <div class="tabs" id="tabs" style="display:none"></div>
</div>
<a class="install-banner" id="installBanner" href="/install" style="display:none">
  <span class="ib-icon">&#128242;</span>
  <span class="ib-text"><b>Install this app on your phone</b><span class="ib-sub">Home-screen icon &middot; opens full screen &middot; free</span></span>
  <button class="ib-close" id="installDismiss" type="button" aria-label="Dismiss">&times;</button>
</a>
<main id="main">
  <div class="status" id="status">Loading&hellip;</div>
  <div id="slotList"></div>
</main>
<footer>Chelsea SCHH &middot; unofficial court sheet viewer</footer>
<nav id="tabbar" aria-label="Primary">
  <a class="tab-item" href="/">
    <span class="tab-icon" aria-hidden="true">&#127968;</span>
    <span class="tab-label">Home</span>
  </a>
  <a class="tab-item active" href="/courts" aria-current="page">
    <span class="tab-icon" aria-hidden="true">&#128203;</span>
    <span class="tab-label">Court Sheet</span>
  </a>
  <a class="tab-item" href="https://hiltheadct.chelseareservations.com/tennis/TNwelcome2.aspx" target="_blank" rel="noopener">
    <span class="tab-icon" aria-hidden="true">&#127934;</span>
    <span class="tab-label">Reserve <span class="tab-ext">&#8599;</span></span>
  </a>
  <a class="tab-item" href="/more">
    <span class="tab-icon" aria-hidden="true">&#8943;</span>
    <span class="tab-label">More</span>
  </a>
</nav>
<script>
(function () {
  "use strict";

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  }

  // Install banner: prominent until dismissed, never shown once the app is
  // actually installed (standalone display mode).
  (function () {
    var standalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
    var dismissed = false;
    try { dismissed = localStorage.getItem("schh-install-dismissed") === "1"; } catch (e) {}
    var banner = document.getElementById("installBanner");
    if (!standalone && !dismissed) banner.style.display = "flex";
    document.getElementById("installDismiss").addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      try { localStorage.setItem("schh-install-dismissed", "1"); } catch (err) {}
      banner.style.display = "none";
    });
  })();

  var REFRESH_MS = 5 * 60 * 1000;
  var STALE_MINUTES_CUTOFF = 90;
  var FACILITY_STORAGE_KEY = "schh-tennis-facility";

  var mainEl = document.getElementById("main");
  var statusEl = document.getElementById("status");
  var slotListEl = document.getElementById("slotList");
  var dateLabelEl = document.getElementById("dateLabel");
  var updatedLabelEl = document.getElementById("updatedLabel");
  var staleBannerEl = document.getElementById("staleBanner");
  var daynavEl = document.getElementById("daynav");
  var prevDayBtn = document.getElementById("prevDayBtn");
  var nextDayBtn = document.getElementById("nextDayBtn");
  var dayLabelEl = document.getElementById("dayLabel");
  var tabsEl = document.getElementById("tabs");
  var stickyTopEl = document.getElementById("stickyTop");

  // ---- generic helpers ----

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  // ---- date helpers (local components only — never UTC parse) ----

  function todayNY() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  }

  function ymdParts(ymd) {
    var parts = String(ymd).split("-");
    return { y: parseInt(parts[0], 10), m: parseInt(parts[1], 10), d: parseInt(parts[2], 10) };
  }

  function ymdToLocalDate(ymd) {
    var p = ymdParts(ymd);
    return new Date(p.y, p.m - 1, p.d);
  }

  function dateToYmd(dt) {
    return dt.getFullYear() + "-" + pad2(dt.getMonth() + 1) + "-" + pad2(dt.getDate());
  }

  function addDays(ymd, delta) {
    var dt = ymdToLocalDate(ymd);
    dt.setDate(dt.getDate() + delta);
    return dateToYmd(dt);
  }

  function formatDateLong(ymd) {
    var dt = ymdToLocalDate(ymd);
    return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  function formatDateShort(ymd) {
    var dt = ymdToLocalDate(ymd);
    return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function formatUpdated(iso) {
    try {
      var dt = new Date(iso);
      var t = dt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
      });
      return "Updated " + t;
    } catch (e) {
      return "";
    }
  }

  // ---- America/New_York "now" helpers ----

  function nyMinutesSinceMidnight(date) {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    var parts = fmt.formatToParts(date);
    var map = {};
    for (var i = 0; i < parts.length; i++) map[parts[i].type] = parts[i].value;
    var h = parseInt(map.hour, 10) % 24;
    var m = parseInt(map.minute, 10);
    return h * 60 + m;
  }

  // ---- slot time parsing / formatting ----

  function slotMinutes(t) {
    var m = /^(\\d{1,2}):(\\d{2})\\s*(AM|PM)$/i.exec(String(t).trim());
    if (!m) return null;
    var h = parseInt(m[1], 10) % 12;
    var mi = parseInt(m[2], 10);
    if (/pm/i.test(m[3])) h += 12;
    return h * 60 + mi;
  }

  function formatSlotTime(t) {
    var m = /^(\\d{1,2}):(\\d{2})\\s*(AM|PM)$/i.exec(String(t).trim());
    if (!m) return String(t);
    var h = parseInt(m[1], 10);
    return h + ":" + m[2] + " " + m[3].toUpperCase();
  }

  function courtNumber(courtName) {
    var m = /(\\d+)/.exec(String(courtName));
    return m ? m[1] : String(courtName);
  }

  // ---- player / event text formatting ----

  function titleCaseFull(name) {
    return String(name).trim().split(/\\s+/).filter(function (w) { return w.length > 0; }).map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(" ");
  }

  // League/event/lesson entries are not person names. Heuristic: any digit,
  // "-MATCH", a bare "VS", a leading "*", or "Lesson" at the start.
  function isEventEntry(entry) {
    var s = String(entry).trim();
    return /\\d/.test(s) || /-MATCH/i.test(s) || /^VS\\.?$/i.test(s) || /^Lesson\\b/i.test(s) || s.charAt(0) === "*";
  }

  function stripStar(s) {
    return s.indexOf("* ") === 0 ? s.slice(2) : s;
  }

  // Builds a single green-accented label for an event/lesson/league cell:
  // joins "X","VS","Y" style pairs into "X vs Y", strips leading "* ", and
  // collapses an all-identical entry list (e.g. four "* Round Robin" players)
  // down to one label instead of repeating it.
  function buildEventLabel(players) {
    var lines = [];
    for (var i = 0; i < players.length; i++) {
      var p = String(players[i]).trim();
      if (!p) continue;
      if (/^VS\\.?$/i.test(p) && lines.length > 0 && i + 1 < players.length) {
        lines[lines.length - 1] += " vs " + stripStar(String(players[i + 1]).trim());
        i++;
      } else {
        lines.push(stripStar(p));
      }
    }
    if (lines.length === 0) return "";
    var allSame = true;
    for (var j = 1; j < lines.length; j++) {
      if (lines[j] !== lines[0]) { allSame = false; break; }
    }
    return allSame ? lines[0] : lines.join(", ");
  }

  function cellEntries(cell) {
    if (cell.players && cell.players.length) return cell.players;
    if (cell.text) return [cell.text];
    return [];
  }

  function buildNameList(entries) {
    return entries.map(titleCaseFull).join(", ");
  }

  function rowHtml(courtLabel, cell) {
    var entries = cellEntries(cell);
    var hasEvent = false;
    for (var i = 0; i < entries.length; i++) {
      if (isEventEntry(entries[i])) { hasEvent = true; break; }
    }
    var label = hasEvent ? buildEventLabel(entries) : buildNameList(entries);
    var rowClass = hasEvent ? "row row-event" : "row row-reserved";
    return '<div class="' + rowClass + '"><span class="badge">' + escapeHtml(courtLabel) + '</span><span class="row-text">' + escapeHtml(label) + "</span></div>";
  }

  // ---- slot list rendering ----

  function nearestSlotIndex(slots, nowMin) {
    var bestIdx = -1;
    var bestDiff = Infinity;
    for (var i = 0; i < slots.length; i++) {
      var m = slotMinutes(slots[i].time);
      if (m === null) continue;
      var diff = Math.abs(m - nowMin);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }
    return bestIdx;
  }

  function buildSlotHtml(slot, idx, courts, isToday, nowMin, nearestIdx) {
    var cells = slot.cells || [];
    var reservedRows = "";
    var openCourts = [];
    for (var j = 0; j < courts.length; j++) {
      var cell = cells[j];
      if (cell == null) continue;
      var label = courtNumber(courts[j]);
      if (cell.reserved) {
        reservedRows += rowHtml(label, cell);
      } else {
        openCourts.push(label);
      }
    }

    var mins = slotMinutes(slot.time);
    var isNow = isToday && idx === nearestIdx;
    var isPast = isToday && mins !== null && nowMin - mins > STALE_MINUTES_CUTOFF;
    var classes = "slot" + (isNow ? " is-now" : "") + (isPast ? " is-past" : "");

    var html = '<section class="' + classes + '" data-idx="' + idx + '">';
    html += '<div class="slot-head"><span class="slot-time">' + escapeHtml(formatSlotTime(slot.time)) + "</span>";
    if (isNow) html += '<span class="now-pill">Now</span>';
    html += "</div>";
    html += reservedRows;
    if (openCourts.length) {
      html += '<div class="slot-open">Open: ' + escapeHtml(openCourts.join(", ")) + "</div>";
    }
    html += "</section>";
    return html;
  }

  function renderSlotList(facility, isToday) {
    var slots = facility.slots || [];
    var courts = facility.courts || [];
    var nowMin = isToday ? nyMinutesSinceMidnight(new Date()) : null;
    var nearestIdx = isToday ? nearestSlotIndex(slots, nowMin) : -1;

    var html = "";
    for (var i = 0; i < slots.length; i++) {
      html += buildSlotHtml(slots[i], i, courts, isToday, nowMin, nearestIdx);
    }
    slotListEl.innerHTML = html || '<div class="status">No time slots for this facility.</div>';
    return nearestIdx;
  }

  function scrollSlotIntoView(idx) {
    if (idx < 0) return;
    var el = slotListEl.querySelector('.slot[data-idx="' + idx + '"]');
    if (!el) return;
    el.scrollIntoView({ block: "start" });
    var offset = (stickyTopEl ? stickyTopEl.offsetHeight : 0) + 8;
    window.scrollBy(0, -offset);
  }

  // ---- app state ----

  var searchParams = new URLSearchParams(window.location.search);
  var rawDateParam = searchParams.get("date");
  var dateParamValid = !!(rawDateParam && /^\\d{4}-\\d{2}-\\d{2}$/.test(rawDateParam));
  var requestedDate = dateParamValid ? rawDateParam : todayNY();
  var isToday = requestedDate === todayNY();

  var currentData = null;
  var activeFacility = null;
  var hasAutoScrolled = false;

  function readStoredFacility() {
    try {
      return window.localStorage.getItem(FACILITY_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeFacility(name) {
    try {
      window.localStorage.setItem(FACILITY_STORAGE_KEY, name);
    } catch (e) {
      // ignore (private browsing / storage disabled)
    }
  }

  // ---- day navigation (full navigation via location.search) ----

  function navigateToDate(ymd) {
    window.location.search = "?date=" + encodeURIComponent(ymd);
  }

  function renderDayNav() {
    dayLabelEl.textContent = isToday ? "Today" : formatDateShort(requestedDate);
    if (isToday) {
      prevDayBtn.classList.add("is-hidden");
      prevDayBtn.disabled = true;
    } else {
      prevDayBtn.classList.remove("is-hidden");
      prevDayBtn.disabled = false;
    }
  }

  prevDayBtn.addEventListener("click", function () {
    if (isToday) return;
    navigateToDate(addDays(requestedDate, -1));
  });
  nextDayBtn.addEventListener("click", function () {
    navigateToDate(addDays(requestedDate, 1));
  });

  // ---- header ----

  function renderHeader(fetchedAt, stale) {
    dateLabelEl.textContent = formatDateLong(requestedDate);
    updatedLabelEl.textContent = fetchedAt ? formatUpdated(fetchedAt) : "";
    staleBannerEl.style.display = stale ? "block" : "none";
  }

  // ---- facility tabs ----

  function renderTabs(facilities) {
    if (!facilities || !facilities.length) {
      tabsEl.style.display = "none";
      tabsEl.innerHTML = "";
      return;
    }
    var names = facilities.map(function (f) { return f.name; });
    if (!activeFacility || names.indexOf(activeFacility) === -1) {
      var stored = readStoredFacility();
      activeFacility = stored && names.indexOf(stored) !== -1 ? stored : names[0];
    }
    var html = "";
    for (var i = 0; i < facilities.length; i++) {
      var name = facilities[i].name;
      var cls = "tab-btn" + (name === activeFacility ? " active" : "");
      html += '<button type="button" class="' + cls + '" data-facility="' + escapeHtml(name) + '">' + escapeHtml(name) + "</button>";
    }
    tabsEl.innerHTML = html;
    tabsEl.style.display = "flex";

    var btns = tabsEl.querySelectorAll(".tab-btn");
    for (var b = 0; b < btns.length; b++) {
      btns[b].addEventListener("click", function () {
        var name = this.getAttribute("data-facility");
        if (name === activeFacility) return;
        activeFacility = name;
        storeFacility(name);
        renderTabActiveStates();
        renderActiveFacility(false);
      });
    }
  }

  function renderTabActiveStates() {
    var btns = tabsEl.querySelectorAll(".tab-btn");
    for (var i = 0; i < btns.length; i++) {
      var name = btns[i].getAttribute("data-facility");
      btns[i].classList.toggle("active", name === activeFacility);
    }
  }

  function renderActiveFacility(allowAutoScroll) {
    if (!currentData || !currentData.facilities || !currentData.facilities.length) return;
    var facility = null;
    for (var i = 0; i < currentData.facilities.length; i++) {
      if (currentData.facilities[i].name === activeFacility) { facility = currentData.facilities[i]; break; }
    }
    if (!facility) facility = currentData.facilities[0];
    var nearestIdx = renderSlotList(facility, isToday);
    if (allowAutoScroll && !hasAutoScrolled && isToday && nearestIdx >= 0) {
      hasAutoScrolled = true;
      window.requestAnimationFrame(function () { scrollSlotIntoView(nearestIdx); });
    }
  }

  // ---- page states ----

  function showStatusOnly(html) {
    slotListEl.innerHTML = "";
    statusEl.innerHTML = html;
    statusEl.style.display = "block";
  }

  function hideStatus() {
    statusEl.style.display = "none";
    statusEl.innerHTML = "";
  }

  function renderSuccess(data) {
    currentData = data;
    renderHeader(data.fetchedAt, !!data.stale);
    renderTabs(data.facilities || []);
    if (!data.facilities || !data.facilities.length) {
      showStatusOnly("No court data for this day.");
      return;
    }
    hideStatus();
    renderActiveFacility(true);
  }

  function renderUnavailable() {
    currentData = null;
    renderHeader(null, false);
    tabsEl.style.display = "none";
    tabsEl.innerHTML = "";
    var html = '' +
      '<div class="unavailable-page">' +
      "<h2>No court sheet available for this day yet</h2>" +
      "<p>Check back later, or head back to today's sheet.</p>" +
      '<div><button class="action-btn" id="backTodayBtn">Back to Today</button></div>' +
      "</div>";
    showStatusOnly(html);
    var btn = document.getElementById("backTodayBtn");
    if (btn) btn.addEventListener("click", function () { window.location.search = ""; });
  }

  function renderErrorPage(err) {
    currentData = null;
    renderHeader(null, false);
    tabsEl.style.display = "none";
    tabsEl.innerHTML = "";
    var html = '' +
      '<div class="error-page">' +
      "<h2>Court sheet unavailable right now</h2>" +
      "<p>We could not reach the reservation site. Please try again shortly.</p>" +
      (err ? '<div class="error-code">' + escapeHtml(err) + "</div>" : "") +
      '<div><button class="action-btn" id="retryBtn">Retry</button></div>' +
      "</div>";
    showStatusOnly(html);
    var btn = document.getElementById("retryBtn");
    if (btn) btn.addEventListener("click", function () { load(); });
  }

  // ---- data fetching ----

  function load() {
    var apiUrl = "/api/courtsheet" + (dateParamValid ? "?date=" + encodeURIComponent(rawDateParam) : "");
    fetch(apiUrl, { cache: "no-store" })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        var data = result.data;
        if (!result.ok || !data || (data.error && !data.facilities)) {
          var code = data && data.error ? data.error : "UNKNOWN";
          if (code === "DATE_UNAVAILABLE") {
            renderUnavailable();
          } else {
            renderErrorPage(code);
          }
          return;
        }
        renderSuccess(data);
      })
      .catch(function (e) {
        renderErrorPage(e && e.message ? e.message : "Network error");
      });
  }

  renderDayNav();
  load();
  setInterval(function () {
    if (document.visibilityState === "visible") {
      load();
    }
  }, REFRESH_MS);
})();
</script>
</body>
</html>
`;
