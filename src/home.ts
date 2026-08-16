// Mobile-first "Home" landing page for SCHH Tennis — club conditions,
// announcements, and the bottom tab-bar navigation. Visual language matches
// src/page.ts exactly (light theme, green accents, system font stack,
// max-width 560px centered column).
import { ANALYTICS_TAG } from "./analytics";

export const HOME_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>SCHH Tennis — Home</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎾</text></svg>">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#1f5c2c">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="SCHH Tennis">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
${ANALYTICS_TAG}
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
  .hdr-sub-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    font-size: 0.85rem;
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
  main {
    padding: 12px 16px 24px;
    min-height: 40vh;
    /* room for the fixed bottom tab bar plus the iOS home-indicator inset */
    padding-bottom: calc(104px + env(safe-area-inset-bottom));
  }
  .status {
    padding: 40px 20px;
    text-align: center;
    color: var(--muted);
    font-size: 0.95rem;
  }
  .error-page {
    padding: 48px 20px;
    text-align: center;
  }
  .error-page h2 {
    margin: 0 0 8px;
    font-size: 1.1rem;
    color: var(--text);
  }
  .error-page p {
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
  .card {
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--bg);
    padding: 14px 16px;
    margin: 0 0 14px;
  }
  .card.conditions-card {
    background: var(--green-tint);
    border-color: var(--reserved-border);
  }
  .conditions-card h2 {
    margin: 0 0 6px;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--green-dark);
  }
  .conditions-card p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.45;
    color: var(--text);
    white-space: pre-line;
  }
  .empty-note {
    margin: 0;
    font-size: 0.9rem;
    color: var(--muted);
  }
  .section-heading {
    margin: 4px 0 10px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .slide-card {
    padding: 12px 12px 14px;
  }
  .slide-title {
    margin: 0 0 8px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text);
  }
  .slide-card img {
    display: block;
    width: 100%;
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
  .conditions-card p.club-date {
    margin: 0 0 8px;
    font-weight: 700;
    color: var(--green-dark);
    font-size: 0.95rem;
  }
  .conditions-card p.club-status {
    margin: 12px 0;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.4;
    color: var(--text);
  }
  .conditions-card p.club-note {
    margin: 18px 0 0;
    font-size: 0.8rem;
    font-weight: 500;
    line-height: 1.5;
    color: var(--muted);
  }
  .club-card { padding-top: 4px; }
  .club-para {
    margin: 10px 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--text);
  }
  .club-para a { color: var(--green-dark); font-weight: 600; }
  .club-headline {
    margin-top: 16px;
    font-weight: 700;
    color: var(--green-dark);
    font-size: 0.82rem;
    letter-spacing: 0.03em;
  }
  .cta-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    margin: 14px 0;
    padding: 10px 16px;
    background: var(--green);
    color: #fff;
    font-size: 0.95rem;
    font-weight: 700;
    text-decoration: none;
    border-radius: 10px;
  }
  .cta-btn:active { background: var(--green-dark); }
  .cta-icon { font-size: 1.1rem; }
  .cta-ext { font-size: 0.8rem; opacity: 0.85; }
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
  footer {
    padding: 16px;
    text-align: center;
    color: var(--muted);
    font-size: 0.75rem;
  }
</style>
</head>
<body>
<div id="stickyTop">
  <header>
    <div class="hdr-title-row">
      <h1>SCHH Tennis</h1>
    </div>
    <div class="hdr-sub-row">
      <span class="hdr-updated" id="updatedLabel"></span>
    </div>
    <div class="banner" id="staleBanner" style="display:none">Showing older information — the reservation site couldn't be reached.</div>
  </header>
</div>
<main id="main">
  <div class="status" id="status">Loading&hellip;</div>
  <div id="content" style="display:none">
    <div class="card conditions-card" id="conditionsCard"></div>
    <div id="slidesSection"></div>
  </div>
</main>
<nav id="tabbar" aria-label="Primary">
  <a class="tab-item active" href="/" aria-current="page">
    <span class="tab-icon" aria-hidden="true">&#127968;</span>
    <span class="tab-label">Home</span>
  </a>
  <a class="tab-item" href="/courts">
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
<footer>Chelsea SCHH &middot; unofficial court sheet viewer</footer>
<script>
(function () {
  "use strict";

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  }

  var REFRESH_MS = 2 * 60 * 1000;

  var mainEl = document.getElementById("main");
  var statusEl = document.getElementById("status");
  var contentEl = document.getElementById("content");
  var conditionsCardEl = document.getElementById("conditionsCard");
  var slidesSectionEl = document.getElementById("slidesSection");
  var updatedLabelEl = document.getElementById("updatedLabel");
  var staleBannerEl = document.getElementById("staleBanner");

  // ---- generic helpers ----

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function isSafeImageUrl(u) {
    return typeof u === "string" && u.indexOf("https://") === 0;
  }

  // Title-case an ALL CAPS heading (e.g. "WELCOME" -> "Welcome"); leaves
  // already mixed-case headings untouched.
  function titleCaseHeading(s) {
    var str = String(s || "");
    if (str !== str.toUpperCase() || !/[A-Z]/.test(str)) return str;
    return str.toLowerCase().replace(/(^|\\s)([a-z])/g, function (m, sp, ch) {
      return sp + ch.toUpperCase();
    });
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

  // ---- page states ----

  function showStatusOnly(html) {
    contentEl.style.display = "none";
    statusEl.innerHTML = html;
    statusEl.style.display = "block";
  }

  function hideStatus() {
    statusEl.style.display = "none";
    statusEl.innerHTML = "";
    contentEl.style.display = "block";
  }

  function renderHeader(fetchedAt, stale) {
    updatedLabelEl.textContent = fetchedAt ? formatUpdated(fetchedAt) : "";
    staleBannerEl.style.display = stale ? "block" : "none";
  }

  function renderConditions(heading, message, hasSlides) {
    var hasHeading = !!(heading && String(heading).trim());
    var hasMessage = !!(message && String(message).trim());
    if (!hasMessage && !hasSlides) {
      conditionsCardEl.innerHTML =
        (hasHeading ? "<h2>" + escapeHtml(titleCaseHeading(heading)) + "</h2>" : "") +
        '<p class="empty-note">No announcements right now.</p>';
      return;
    }
    var html = "";
    if (hasHeading) html += "<h2>" + escapeHtml(titleCaseHeading(heading)) + "</h2>";
    if (hasMessage) html += "<p>" + escapeHtml(message) + "</p>";
    conditionsCardEl.innerHTML = html;
  }

  // Court status lines ("South and North Courts are Open") get the prominent
  // treatment; other card lines (the check-in note) are supporting text.
  function isStatusLine(p) {
    var t = String(p).replace(/<[^>]+>/g, "");
    return /courts?\\b/i.test(t) && /(open|clos)/i.test(t);
  }

  // Heuristic: the document opens with a date line followed by the day's
  // court conditions; announcements follow. The first paragraph that is
  // ALL-CAPS-ish (a shouted headline like "RATINGS CLINIC") marks the switch.
  function looksLikeHeadline(text) {
    var plain = String(text).replace(/<[^>]+>/g, "");
    var letters = plain.replace(/[^A-Za-z]/g, "");
    if (letters.length < 4) return false;
    var upper = plain.replace(/[^A-Z]/g, "");
    return upper.length / letters.length > 0.8;
  }

  function renderSuccess(data) {
    renderHeader(data.fetchedAt, !!data.stale);
    hideStatus();
    var paragraphs = data.paragraphs || [];

    // Paragraphs come pre-sanitized from our API (escaped text + vetted
    // anchors only) — injected as-is by design.
    var splitAt = paragraphs.length;
    for (var i = 1; i < paragraphs.length; i++) {
      if (looksLikeHeadline(paragraphs[i])) { splitAt = i; break; }
    }

    var card = "<h2>" + escapeHtml(data.title || "Welcome") + "</h2>";
    if (paragraphs.length === 0) {
      card += '<p class="empty-note">No announcements right now.</p>';
    } else {
      if (paragraphs[0]) card += '<p class="club-date">' + paragraphs[0] + "</p>";
      for (var c = 1; c < splitAt; c++) {
        card += '<p class="' + (isStatusLine(paragraphs[c]) ? "club-status" : "club-note") + '">' + paragraphs[c] + "</p>";
      }
    }
    conditionsCardEl.innerHTML = card;

    var rest = paragraphs.slice(splitAt);
    if (!rest.length) {
      slidesSectionEl.innerHTML = "";
      return;
    }
    var html = '<div class="section-heading">Announcements</div><div class="card club-card">';
    for (var a = 0; a < rest.length; a++) {
      var cta = ctaFromParagraph(rest[a]);
      if (cta) {
        html += cta;
        continue;
      }
      html += '<p class="club-para' + (looksLikeHeadline(rest[a]) ? " club-headline" : "") + '">' + rest[a] + "</p>";
    }
    html += "</div>";
    slidesSectionEl.innerHTML = html;
  }

  // "** View Tennis Programs/Clinics by clicking here **" deserves better than
  // fine print: pull the link out and render it as a proper button.
  function ctaFromParagraph(p) {
    if (!/programs\\s*[/]\\s*clinics/i.test(p)) return null;
    var m = /<a href="(https:[^"]+)"[^>]*>/i.exec(p);
    if (!m) return null;
    return '<a class="cta-btn" href="' + m[1] + '" target="_blank" rel="noopener">' +
      '<span class="cta-icon">&#127934;</span>View Tennis Programs &amp; Clinics<span class="cta-ext">&#8599;</span></a>';
  }

  function renderErrorPage(err) {
    renderHeader(null, false);
    var html = '' +
      '<div class="error-page">' +
      "<h2>Club news unavailable right now</h2>" +
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
    fetch("/api/welcome", { cache: "no-store" })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        var data = result.data;
        // Hard failure (see /api/welcome contract): HTTP 502 with no
        // "title" field at all — distinct from a successful-but-stale
        // response, which still carries title/paragraphs.
        if (!result.ok || !data || data.title === undefined) {
          var code = data && data.error ? data.error : "UNKNOWN";
          renderErrorPage(code);
          return;
        }
        renderSuccess(data);
      })
      .catch(function (e) {
        renderErrorPage(e && e.message ? e.message : "Network error");
      });
  }

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
