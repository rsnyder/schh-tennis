// Digital-signage view for 65" 4K outdoor TVs (Sylvox), viewed from 2-15 feet.
// Self-contained HTML document — no external resources, no frameworks.
export const SIGNAGE_HTML: string = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>SCHH Tennis — Signage</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎾</text></svg>">
<style>
  :root {
    --bg: #0c120d;
    --bg-alt: #121a14;
    --text: #f2f5f2;
    --muted: #7c8b7e;
    --green: #4caf6d;
    --green-dim: #2f6b45;
    --reserved-bg: rgba(76, 175, 109, 0.14);
    --reserved-border: rgba(76, 175, 109, 0.55);
    --block-bg: rgba(76, 175, 109, 0.24);
    --null-bg: #0a0f0b;
    --null-bg-alt: #0d130f;
    --border: #24312a;
    --stale-text: #ffd766;
    --header-h: 7vh;
    --footer-h: 10vh;
    --cell-font: 2.2vh;
    --time-font: 2.8vh;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
    color: var(--text);
    cursor: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    letter-spacing: 0.02em;
    -webkit-font-smoothing: antialiased;
  }
  header#hdr {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: var(--header-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2vw;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    z-index: 10;
  }
  .hdr-left { display: flex; flex-direction: column; justify-content: center; line-height: 1.15; min-width: 0; }
  .hdr-left .brand { font-size: 1.7vh; font-weight: 700; color: var(--green); letter-spacing: 0.16em; }
  .hdr-left .screen-title { font-size: 2.6vh; font-weight: 700; color: var(--text); letter-spacing: 0.06em; white-space: nowrap; }
  .hdr-center { font-size: 2.6vh; font-weight: 600; color: var(--text); text-align: center; flex: 1; padding: 0 2vw; }
  .hdr-right { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15; }
  .hdr-right .clock { font-size: 3.4vh; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .hdr-right .updated-row { display: flex; align-items: center; gap: 0.6vw; margin-top: 0.3vh; }
  .hdr-right .updated { font-size: 1.4vh; color: var(--muted); white-space: nowrap; }
  .chip-stale {
    font-size: 1.3vh;
    font-weight: 700;
    color: #1c1508;
    background: var(--stale-text);
    padding: 0.2vh 0.9vh;
    border-radius: 1vh;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }
  main#main {
    position: fixed;
    top: var(--header-h);
    left: 0; right: 0; bottom: 0;
    overflow: hidden;
  }
  main#main.with-footer { bottom: var(--footer-h); }
  .screen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    padding: 1.2vh 1.5vw;
    transition: opacity 350ms ease;
  }
  .south-wrap { width: 100%; height: 100%; display: flex; flex-direction: column; }
  .nw-wrap { display: flex; gap: 1.5vw; width: 100%; height: 100%; }
  .nw-col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; }
  .nw-col .facility-title {
    font-size: 2vh;
    font-weight: 700;
    color: var(--green);
    letter-spacing: 0.14em;
    margin-bottom: 0.6vh;
    text-align: center;
    flex-shrink: 0;
  }
  .divider { width: 1px; background: var(--border); flex-shrink: 0; }
  .grid {
    display: grid;
    width: 100%;
    flex: 1;
    min-height: 0;
  }
  .hcell {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6vh;
    font-weight: 700;
    color: var(--muted);
    letter-spacing: 0.05em;
    border-bottom: 2px solid var(--border);
    text-transform: uppercase;
  }
  .tcell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: var(--time-font);
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--bg-alt);
  }
  .tcell .ampm { font-size: 0.42em; font-weight: 600; color: var(--muted); margin-top: 0.2vh; letter-spacing: 0.05em; }
  .cell {
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0.2vh 0.4vw;
    min-width: 0;
    overflow: hidden;
  }
  .cell-open { color: var(--muted); opacity: 0.25; font-size: var(--cell-font); }
  .cell-null {
    background: repeating-linear-gradient(45deg, var(--null-bg), var(--null-bg) 10px, var(--null-bg-alt) 10px, var(--null-bg-alt) 20px);
  }
  .cell-reserved {
    background: var(--reserved-bg);
    border-left: 3px solid var(--reserved-border);
    flex-direction: column;
    gap: 0.15vh;
  }
  .name-flow {
    font-size: var(--cell-font);
    font-weight: 600;
    color: var(--text);
    white-space: normal;
    overflow: hidden;
    line-height: 1.15;
    text-align: center;
    max-width: 100%;
  }
  .cell-block {
    background: var(--block-bg);
    border-left: 3px solid var(--green);
  }
  .block-label {
    font-size: var(--evfont, var(--cell-font));
    font-weight: 700;
    color: var(--green);
    letter-spacing: 0.02em;
    white-space: normal;
    overflow: hidden;
    line-height: 1.15;
    text-align: center;
    max-width: 100%;
  }
  .cell-event {
    background: var(--block-bg);
    border-left: 3px solid var(--green);
    flex-direction: column;
    gap: 0.1vh;
  }
  .event-line {
    font-size: var(--evfont, calc(var(--cell-font) * 0.55));
    font-weight: 600;
    color: var(--green);
    letter-spacing: 0.01em;
    white-space: normal;
    overflow: hidden;
    line-height: 1.1;
    text-align: center;
    max-width: 100%;
  }
  .empty-msg {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3vh;
    color: var(--muted);
    font-weight: 600;
    text-align: center;
  }
  footer#ftr {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    height: var(--footer-h);
    display: flex;
    align-items: center;
    background: var(--bg);
  }
  .ftr-dots {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 1vw;
  }
  .dot { width: 1.1vh; height: 1.1vh; border-radius: 50%; background: var(--border); }
  .dot.active { background: var(--green); }
  .ftr-qr {
    position: absolute;
    right: 1vw;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 0.9vw;
  }
  .qr-caption {
    text-align: right;
    font-size: 1.9vh;
    font-weight: 600;
    color: var(--text);
    line-height: 1.35;
  }
  .qr-caption .qr-url {
    font-size: 1.5vh;
    font-weight: 500;
    color: var(--green);
    letter-spacing: 0.02em;
  }
  .qr-box {
    height: calc(var(--footer-h) - 1.2vh);
    aspect-ratio: 1 / 1;
    background: #ffffff;
    border-radius: 0.6vh;
    overflow: hidden;
  }
  .qr-box svg { display: block; width: 100%; height: 100%; }
  .unavailable {
    position: fixed;
    top: var(--header-h);
    left: 0; right: 0; bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.4vh;
    background: var(--bg);
  }
  .unavailable h2 { font-size: 4vh; margin: 0; color: var(--text); font-weight: 700; }
  .unavailable .code {
    font-size: 1.6vh;
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
</style>
</head>
<body>
<header id="hdr">
  <div class="hdr-left">
    <div class="brand">SCHH TENNIS</div>
    <div class="screen-title" id="screenTitle">&nbsp;</div>
  </div>
  <div class="hdr-center" id="hdrDate">&nbsp;</div>
  <div class="hdr-right">
    <div class="clock" id="clock">&nbsp;</div>
    <div class="updated-row">
      <span class="updated" id="updated"></span>
      <span id="staleChip"></span>
    </div>
  </div>
</header>
<main id="main">
  <div class="screen" id="screen"></div>
</main>
<footer id="ftr">
  <div class="ftr-dots" id="ftrDots" style="display:none">
    <span class="dot" id="dotSouth"></span>
    <span class="dot" id="dotNW"></span>
  </div>
  <div class="ftr-qr">
    <div class="qr-caption">Court sheet on your phone<br><span class="qr-url">schh-tennis.pages.dev</span></div>
    <div class="qr-box"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 37" shape-rendering="crispEdges"><path fill="#ffffff" d="M0 0h37v37H0z"/><path stroke="#000000" d="M4 4.5h7m1 0h2m1 0h2m5 0h1m3 0h7M4 5.5h1m5 0h1m2 0h3m4 0h2m1 0h1m2 0h1m5 0h1M4 6.5h1m1 0h3m1 0h1m2 0h3m1 0h1m1 0h4m3 0h1m1 0h3m1 0h1M4 7.5h1m1 0h3m1 0h1m1 0h2m1 0h1m2 0h3m1 0h1m3 0h1m1 0h3m1 0h1M4 8.5h1m1 0h3m1 0h1m1 0h2m1 0h1m1 0h2m1 0h1m1 0h1m3 0h1m1 0h3m1 0h1M4 9.5h1m5 0h1m1 0h4m1 0h3m3 0h2m1 0h1m5 0h1M4 10.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M12 11.5h1m2 0h1m2 0h1m2 0h2M4 12.5h1m3 0h1m1 0h3m1 0h1m1 0h6m1 0h1m1 0h5m2 0h1M4 13.5h2m5 0h1m2 0h1m11 0h1m1 0h5M4 14.5h3m1 0h1m1 0h1m3 0h1m1 0h4m7 0h1m4 0h1M4 15.5h2m1 0h3m1 0h2m1 0h1m1 0h2m1 0h6m1 0h4m1 0h2M9 16.5h2m3 0h2m1 0h1m3 0h2m1 0h2m5 0h1M4 17.5h3m1 0h2m6 0h3m1 0h3m1 0h9M4 18.5h1m5 0h1m2 0h1m2 0h1m3 0h1m1 0h1m1 0h1m1 0h2m1 0h2m1 0h1M5 19.5h1m1 0h3m2 0h2m4 0h1m2 0h1m1 0h1m1 0h4m2 0h2M6 20.5h1m2 0h3m2 0h1m1 0h6m1 0h1m1 0h1m5 0h1M4 21.5h1m1 0h1m8 0h2m5 0h1m3 0h4m1 0h2M6 22.5h1m3 0h2m4 0h4m1 0h2m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1M6 23.5h1m1 0h1m2 0h1m2 0h1m1 0h2m1 0h3m4 0h2m3 0h2M4 24.5h2m1 0h6m1 0h2m1 0h1m3 0h1m2 0h6m2 0h1M12 25.5h1m1 0h1m1 0h3m1 0h1m1 0h3m3 0h1m3 0h1M4 26.5h7m1 0h3m1 0h1m3 0h5m1 0h1m1 0h3m1 0h1M4 27.5h1m5 0h1m3 0h1m3 0h1m2 0h4m3 0h1m2 0h1M4 28.5h1m1 0h3m1 0h1m1 0h1m1 0h1m2 0h3m1 0h1m1 0h7m1 0h2M4 29.5h1m1 0h3m1 0h1m2 0h1m1 0h1m1 0h1m5 0h1m1 0h1m5 0h1M4 30.5h1m1 0h3m1 0h1m3 0h2m1 0h1m1 0h1m2 0h4m3 0h4M4 31.5h1m5 0h1m3 0h1m2 0h2m2 0h1m2 0h1m3 0h2m1 0h2M4 32.5h7m1 0h1m2 0h5m1 0h2m1 0h1m1 0h1m1 0h1m2 0h1"/></svg></div>
  </div>
</footer>
<div class="unavailable" id="unavailable" style="display:none">
  <h2 id="unavailTitle">Loading&hellip;</h2>
  <div class="code" id="unavailCode"></div>
</div>
<script>
(function () {
  "use strict";

  var REFRESH_MS = 5 * 60 * 1000;
  var RETRY_MS = 60 * 1000;
  var TICK_MS = 60 * 1000;
  var DEFAULT_ROTATE_MS = 20 * 1000;
  var MIN_ROTATE_MS = 5 * 1000;
  var STALE_MINUTES_CUTOFF = 90;
  var RELOAD_AT_MINUTE = 4 * 60; // 4:00 AM ET

  var screenEl = document.getElementById("screen");
  var mainEl = document.getElementById("main");
  var ftrEl = document.getElementById("ftr");
  var dotSouth = document.getElementById("dotSouth");
  var dotNW = document.getElementById("dotNW");
  var screenTitleEl = document.getElementById("screenTitle");
  var hdrDateEl = document.getElementById("hdrDate");
  var clockEl = document.getElementById("clock");
  var updatedEl = document.getElementById("updated");
  var staleChipEl = document.getElementById("staleChip");
  var unavailEl = document.getElementById("unavailable");
  var unavailTitleEl = document.getElementById("unavailTitle");
  var unavailCodeEl = document.getElementById("unavailCode");

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function getParams() {
    if (window.__SIGNAGE_PARAMS__) return window.__SIGNAGE_PARAMS__;
    var sp = new URLSearchParams(window.location.search);
    return {
      screen: sp.get("screen"),
      rotate: sp.get("rotate"),
      all: sp.get("all"),
      date: sp.get("date"),
      time: sp.get("time"),
    };
  }

  var params = getParams();
  var pinnedScreen = (params.screen === "south" || params.screen === "northwest") ? params.screen : null;
  var rotateMs = DEFAULT_ROTATE_MS;
  if (params.rotate) {
    var rSec = parseInt(params.rotate, 10);
    if (!isNaN(rSec)) rotateMs = Math.max(MIN_ROTATE_MS, rSec * 1000);
  }
  // ?date=YYYY-MM-DD requests a specific day from the API.
  var dateParam = params.date && /^\\d{4}-\\d{2}-\\d{2}$/.test(params.date) ? params.date : null;
  // ?time=HH:MM (24h) or h:mmAM/PM simulates "now" — drives the past-slot
  // filter and the header clock, for previewing how the display adapts.
  var simulatedNowMin = parseTimeParam(params.time);
  // The hide-past filter only makes sense for today's sheet.
  var showAll = params.all === "1" || (dateParam !== null && dateParam !== todayNYDateString());

  function parseTimeParam(t) {
    if (!t) return null;
    var s = String(t).trim();
    var ampm = /^(\\d{1,2}):(\\d{2})\\s*(AM|PM)$/i.exec(s);
    if (ampm) {
      var h12 = parseInt(ampm[1], 10) % 12;
      if (/pm/i.test(ampm[3])) h12 += 12;
      return h12 * 60 + parseInt(ampm[2], 10);
    }
    var h24 = /^(\\d{1,2}):(\\d{2})$/.exec(s);
    if (h24) {
      var h = parseInt(h24[1], 10);
      var m = parseInt(h24[2], 10);
      if (h < 24 && m < 60) return h * 60 + m;
    }
    return null;
  }

  var currentScreen = pinnedScreen || "south";
  var lastData = null;
  var lastErrorCode = null;
  var clientStale = false;
  var hasAttemptedFetch = false;

  // ---- America/New_York time helpers (never trust device timezone) ----

  function nyPartsMap(date) {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    var parts = fmt.formatToParts(date);
    var map = {};
    for (var i = 0; i < parts.length; i++) map[parts[i].type] = parts[i].value;
    return map;
  }

  function nyMinutesSinceMidnight(date) {
    var p = nyPartsMap(date);
    var h = parseInt(p.hour, 10) % 24;
    var m = parseInt(p.minute, 10);
    return h * 60 + m;
  }

  function nyClockLabel(date) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York" });
  }

  function nyUpdatedLabel(iso) {
    try {
      var dt = new Date(iso);
      var t = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
      return "Updated " + t;
    } catch (e) {
      return "";
    }
  }

  function nyDateLabel(ymd) {
    var parts = String(ymd).split("-");
    if (parts.length !== 3) return String(ymd);
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    var dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  function todayNYDateString() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  }

  // ---- slot time parsing / filtering ----

  function slotMinutes(t) {
    var m = /^(\\d{1,2}):(\\d{2})\\s*(AM|PM)$/i.exec(String(t).trim());
    if (!m) return null;
    var h = parseInt(m[1], 10) % 12;
    var mi = parseInt(m[2], 10);
    if (/pm/i.test(m[3])) h += 12;
    return h * 60 + mi;
  }

  function splitTime(t) {
    var m = /^(\\d{1,2}):(\\d{2})\\s*(AM|PM)$/i.exec(String(t).trim());
    if (!m) return { hm: String(t), ap: "" };
    var hour = parseInt(m[1], 10);
    return { hm: hour + ":" + m[2], ap: m[3].toUpperCase() };
  }

  function filterSlots(slots, nowMin) {
    if (showAll) return slots;
    var cutoff = nowMin - STALE_MINUTES_CUTOFF;
    return slots.filter(function (s) {
      var mins = slotMinutes(s.time);
      return mins === null || mins >= cutoff;
    });
  }

  // ---- player name formatting ----

  function titleCaseWord(w) {
    if (!w) return w;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }

  // Last name only ("JUDY NICOLETTI" -> "Nicoletti") — conserves width so the
  // auto-scaler can pick a larger font on the 12-column South grid. Extra-long
  // surnames are ellipsized so a single outlier can't drag the global font down.
  var MAX_NAME_CHARS = 12;
  function shortenName(name) {
    var tokens = String(name).trim().split(/\\s+/).filter(function (t) { return t.length > 0; });
    if (tokens.length === 0) return "";
    var out = tokens.length === 1 ? titleCaseWord(tokens[0]) : tokens.slice(1).map(titleCaseWord).join(" ");
    if (out.length > MAX_NAME_CHARS) out = out.slice(0, MAX_NAME_CHARS - 1) + "\\u2026";
    return out;
  }

  // League/event entries ("INTRA-MATCH 4.0 WOMENS ADULT", "USTA-MATCH ...",
  // "SC PATTERSON", "VS", team names) are not person names and must not be
  // initialized. Heuristic: digits, "-MATCH", a bare "VS", or a leading "*".
  function isEventEntry(entry) {
    var s = String(entry).trim();
    return /\\d/.test(s) || /-MATCH/i.test(s) || /^VS\\.?$/i.test(s) || /^Lesson\\b/i.test(s) || s.charAt(0) === "*";
  }

  // Title-case words of 4+ letters ("CALLAWASSIE" -> "Callawassie") but keep
  // short acronyms/numbers ("USTA", "CWD", "4.0", "55+") as-is — lowercase
  // glyphs are narrower, which buys wrap room in tight columns.
  function softenCaps(s) {
    return String(s).split(/\\s+/).map(function (w) {
      return w.length >= 4 && /^[A-Z]+$/.test(w) ? titleCaseWord(w) : w;
    }).join(" ");
  }

  function eventLines(players) {
    var lines = [];
    for (var i = 0; i < players.length; i++) {
      var p = String(players[i]).trim();
      if (!p) continue;
      if (/^VS\\.?$/i.test(p) && lines.length > 0 && i + 1 < players.length) {
        lines[lines.length - 1] += " vs " + softenCaps(String(players[i + 1]).trim());
        i++;
      } else {
        lines.push(softenCaps(p.replace(/-MATCH/i, "")));
      }
    }
    return lines;
  }

  function isBlockBooking(players) {
    if (!players || players.length < 2) return false;
    for (var i = 1; i < players.length; i++) {
      if (players[i] !== players[0]) return false;
    }
    return true;
  }

  function blockLabel(text) {
    var t = String(text);
    if (t.indexOf("* ") === 0) return t.slice(2);
    return t;
  }

  function shortCourtLabel(courtName) {
    var m = /(\\d+)/.exec(String(courtName));
    return m ? m[1] : String(courtName);
  }

  // ---- cell / grid rendering ----

  function cellHtml(cell) {
    if (cell == null) return '<div class="cell cell-null"></div>';
    if (!cell.reserved) return '<div class="cell cell-open">&middot;</div>';
    var players = cell.players || [];
    if (isBlockBooking(players)) {
      return '<div class="cell cell-block"><span class="block-label">' + escapeHtml(blockLabel(players[0])) + "</span></div>";
    }
    var hasEvent = false;
    for (var e = 0; e < players.length; e++) {
      if (isEventEntry(players[e])) { hasEvent = true; break; }
    }
    if (hasEvent) {
      var inner = eventLines(players)
        .map(function (l) { return '<div class="event-line">' + escapeHtml(blockLabel(l)) + "</div>"; })
        .join("");
      return '<div class="cell cell-event">' + inner + "</div>";
    }
    var names = [];
    if (players.length > 0) {
      for (var i = 0; i < players.length; i++) {
        names.push(shortenName(players[i]));
      }
    } else if (cell.text) {
      names.push(cell.text);
    }
    return '<div class="cell cell-reserved"><div class="name-flow">' + escapeHtml(names.join(", ")) + "</div></div>";
  }

  function buildGrid(facility, nowMin) {
    var slots = filterSlots(facility.slots || [], nowMin);
    if ((facility.slots || []).length > 0 && slots.length === 0) {
      return '<div class="empty-msg">Play has ended for today</div>';
    }
    var courts = facility.courts || [];
    // Wide grids (South's 12 courts) give the time column less width so the
    // court columns get more.
    var timePct = courts.length >= 8 ? 5.5 : 10;
    var colTemplate = timePct + "% repeat(" + courts.length + ", 1fr)";
    var rowTemplate = "auto repeat(" + slots.length + ", 1fr)";
    var html = '<div class="grid" data-rows="' + slots.length + '" data-cols="' + courts.length + '" data-timepct="' + timePct + '" style="grid-template-columns:' + colTemplate + ";grid-template-rows:" + rowTemplate + '">';
    html += '<div class="hcell">Time</div>';
    for (var c = 0; c < courts.length; c++) {
      html += '<div class="hcell">' + escapeHtml(shortCourtLabel(courts[c])) + "</div>";
    }
    for (var s = 0; s < slots.length; s++) {
      var slot = slots[s];
      var tp = splitTime(slot.time);
      html += '<div class="tcell">' + escapeHtml(tp.hm) + '<span class="ampm">' + escapeHtml(tp.ap) + "</span></div>";
      var cells = slot.cells || [];
      for (var j = 0; j < courts.length; j++) {
        html += cellHtml(cells[j]);
      }
    }
    html += "</div>";
    return html;
  }

  function findFacility(name) {
    if (!lastData || !lastData.facilities) return null;
    for (var i = 0; i < lastData.facilities.length; i++) {
      if (lastData.facilities[i].name === name) return lastData.facilities[i];
    }
    return null;
  }

  function renderSouthScreen(nowMin) {
    var south = findFacility("South");
    if (!south) return '<div class="empty-msg">No South court data.</div>';
    return '<div class="south-wrap">' + buildGrid(south, nowMin) + "</div>";
  }

  function renderNorthWestScreen(nowMin) {
    var north = findFacility("North");
    var west = findFacility("West");
    var html = '<div class="nw-wrap">';
    html += '<div class="nw-col"><div class="facility-title">NORTH</div>' + (north ? buildGrid(north, nowMin) : '<div class="empty-msg">No North court data.</div>') + "</div>";
    html += '<div class="divider"></div>';
    html += '<div class="nw-col"><div class="facility-title">WEST</div>' + (west ? buildGrid(west, nowMin) : '<div class="empty-msg">No West court data.</div>') + "</div>";
    html += "</div>";
    return html;
  }

  // ---- font auto-scaling ----

  function updateFontScale() {
    var vh = window.innerHeight;
    var grids = screenEl.querySelectorAll(".grid");
    var maxRows = 1;
    for (var i = 0; i < grids.length; i++) {
      var r = parseInt(grids[i].getAttribute("data-rows"), 10) || 1;
      if (r > maxRows) maxRows = r;
    }
    var bodyHeightPx = mainEl.clientHeight;
    var rowHeightPx = bodyHeightPx / (maxRows + 1);
    var minPx = vh * 0.016;
    var maxPx = vh * 0.034;
    var rowBasedMax = rowHeightPx * 0.42;

    // Names render as one wrapping comma-delimited line per cell, so two
    // constraints bound the font: the longest single word must fit the column
    // width, and the cell's total text (wrapped) must fit the cell area.
    // Average glyph width ~0.58em for this stack at weight 600.
    var maxWordChars = 6;
    var maxCellChars = 8;
    var flows = screenEl.querySelectorAll(".name-flow");
    for (var n = 0; n < flows.length; n++) {
      var text = (flows[n].textContent || "").trim();
      if (text.length > maxCellChars) maxCellChars = text.length;
      var words = text.split(/\\s+/);
      for (var w = 0; w < words.length; w++) {
        if (words[w].length > maxWordChars) maxWordChars = words[w].length;
      }
    }
    var widthBasedMax = Infinity;
    for (var g = 0; g < grids.length; g++) {
      var cols = parseInt(grids[g].getAttribute("data-cols"), 10) || 1;
      var timePct = parseFloat(grids[g].getAttribute("data-timepct")) || 10;
      var colWidthPx = (grids[g].clientWidth * (1 - timePct / 100)) / cols - 18;
      var wordMax = colWidthPx / (maxWordChars * 0.58);
      // Area fit: lines(font) = ceil(chars*0.58*font / colWidth), need
      // lines * 1.15 * font <= 0.85 * rowHeight  =>  solve approximately.
      var areaMax = Math.sqrt((colWidthPx * rowHeightPx * 0.85) / (maxCellChars * 0.58 * 1.15));
      var wMax = Math.min(wordMax, areaMax);
      if (wMax < widthBasedMax) widthBasedMax = wMax;
    }

    var fontPx = Math.min(maxPx, rowBasedMax, widthBasedMax);
    if (fontPx < minPx) fontPx = Math.min(minPx, rowBasedMax);
    if (fontPx < 12) fontPx = 12;
    setFonts(fontPx);

    // The char-count estimate can't model word-wrap waste, so verify against
    // the real layout: step the font down until no cell's content overflows.
    var guard = 0;
    while (anyCellOverflows() && fontPx > 10 && guard < 14) {
      fontPx *= 0.93;
      setFonts(fontPx);
      guard++;
    }

    fitSpecialCells();
  }

  // Event/league and block cells carry a title, not names — grow each one's
  // font independently (binary search) to the largest size that still fits its
  // own cell, wrapping as needed.
  function fitSpecialCells() {
    var cells = screenEl.querySelectorAll(".cell-event, .cell-block");
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var lo = 8;
      var hi = Math.max(14, cell.clientHeight * 0.8);
      var best = lo;
      for (var s = 0; s < 7; s++) {
        var mid = (lo + hi) / 2;
        cell.style.setProperty("--evfont", mid + "px");
        if (cellContentFits(cell)) { best = mid; lo = mid; } else { hi = mid; }
      }
      cell.style.setProperty("--evfont", best * 0.97 + "px");
    }
  }

  function cellContentFits(cell) {
    var contentH = 0;
    for (var c = 0; c < cell.children.length; c++) {
      if (cell.children[c].scrollWidth > cell.clientWidth + 1) return false;
      contentH += cell.children[c].scrollHeight;
    }
    return contentH <= cell.clientHeight + 1;
  }

  function setFonts(fontPx) {
    document.documentElement.style.setProperty("--cell-font", fontPx + "px");
    document.documentElement.style.setProperty("--time-font", (fontPx * 1.3) + "px");
  }

  function anyCellOverflows() {
    var cells = screenEl.querySelectorAll(".cell-reserved, .cell-event, .cell-block");
    for (var i = 0; i < cells.length; i++) {
      var content = 0;
      for (var c = 0; c < cells[i].children.length; c++) {
        // scrollHeight, not offsetHeight: the children are themselves
        // overflow:hidden, so offsetHeight reports the clipped height.
        content += cells[i].children[c].scrollHeight;
      }
      if (content > cells[i].clientHeight + 1) return true;
    }
    return false;
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateFontScale, 150);
  });

  // ---- header / body / footer render ----

  function renderHeader() {
    screenTitleEl.textContent = currentScreen === "south" ? "SOUTH COURTS" : "NORTH & WEST COURTS";
    hdrDateEl.textContent = nyDateLabel(lastData && lastData.date ? lastData.date : todayNYDateString());
    updatedEl.textContent = lastData && lastData.fetchedAt ? nyUpdatedLabel(lastData.fetchedAt) : "";
    var showStale = !!(lastData && lastData.stale) || clientStale;
    staleChipEl.innerHTML = showStale ? '<span class="chip-stale">OLDER DATA</span>' : "";
  }

  function renderBodyContent() {
    if (!lastData) {
      mainEl.style.display = "none";
      unavailEl.style.display = "flex";
      unavailTitleEl.textContent = hasAttemptedFetch ? "Court sheet unavailable" : "Loading\\u2026";
      unavailCodeEl.textContent = hasAttemptedFetch && lastErrorCode ? lastErrorCode : "";
      return;
    }
    unavailEl.style.display = "none";
    mainEl.style.display = "block";
    var nowMin = simulatedNowMin !== null ? simulatedNowMin : nyMinutesSinceMidnight(new Date());
    screenEl.innerHTML = currentScreen === "south" ? renderSouthScreen(nowMin) : renderNorthWestScreen(nowMin);
    updateFontScale();
  }

  function renderFooter() {
    // Footer is always visible: it carries the QR code to the phone version.
    // Only the rotation dots hide when a single screen is pinned.
    mainEl.classList.add("with-footer");
    var dotsEl = document.getElementById("ftrDots");
    if (pinnedScreen) {
      dotsEl.style.display = "none";
      return;
    }
    dotsEl.style.display = "flex";
    dotSouth.className = "dot" + (currentScreen === "south" ? " active" : "");
    dotNW.className = "dot" + (currentScreen === "northwest" ? " active" : "");
  }

  function fullRender() {
    renderHeader();
    renderBodyContent();
    renderFooter();
  }

  function updateClock() {
    if (simulatedNowMin !== null) {
      var h = Math.floor(simulatedNowMin / 60);
      var m = simulatedNowMin % 60;
      var ap = h >= 12 ? "PM" : "AM";
      var h12 = h % 12 === 0 ? 12 : h % 12;
      clockEl.textContent = h12 + ":" + (m < 10 ? "0" + m : m) + " " + ap + " (sim)";
      return;
    }
    clockEl.textContent = nyClockLabel(new Date());
  }

  function rotateScreen() {
    currentScreen = currentScreen === "south" ? "northwest" : "south";
    screenEl.style.opacity = "0";
    setTimeout(function () {
      fullRender();
      screenEl.style.opacity = "1";
    }, 350);
  }

  // ---- data fetching ----

  var fetchTimer = null;

  function scheduleNext(delay) {
    if (fetchTimer) clearTimeout(fetchTimer);
    fetchTimer = setTimeout(fetchData, delay);
  }

  function applyFetchSuccess(data) {
    lastData = data;
    lastErrorCode = data && data.error ? data.error : null;
    clientStale = false;
    hasAttemptedFetch = true;
    fullRender();
  }

  function applyFetchFailure(errLabel) {
    lastErrorCode = errLabel;
    clientStale = !!lastData;
    hasAttemptedFetch = true;
    fullRender();
  }

  function fetchData() {
    var apiUrl = "/api/courtsheet" + (dateParam ? "?date=" + encodeURIComponent(dateParam) : "");
    fetch(apiUrl, { cache: "no-store" })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        var data = result.data;
        if (!result.ok || !data || (data.error && !data.facilities)) {
          applyFetchFailure(data && data.error ? data.error : "Unknown error");
          scheduleNext(lastData ? REFRESH_MS : RETRY_MS);
          return;
        }
        applyFetchSuccess(data);
        scheduleNext(REFRESH_MS);
      })
      .catch(function (e) {
        applyFetchFailure(e && e.message ? e.message : "Network error");
        scheduleNext(lastData ? REFRESH_MS : RETRY_MS);
      });
  }

  // ---- daily reload + periodic re-evaluation ----

  function tick() {
    fullRender();
    var nowMin = nyMinutesSinceMidnight(new Date());
    if (nowMin === RELOAD_AT_MINUTE) {
      window.location.reload();
    }
  }

  // ---- boot ----

  fullRender();
  updateClock();
  fetchData();
  setInterval(updateClock, 1000);
  setInterval(tick, TICK_MS);
  if (!pinnedScreen) setInterval(rotateScreen, rotateMs);
})();
</script>
</body>
</html>
`;
