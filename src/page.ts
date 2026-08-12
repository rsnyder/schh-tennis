// Frontend page for SCHH Tennis court sheet viewer.
export const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>SCHH Tennis — Court Sheet</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎾</text></svg>">
<style>
  :root {
    --green: #2f7a3d;
    --green-dark: #1f5c2c;
    --bg: #ffffff;
    --bg-alt: #f6f7f6;
    --text: #1c1f1c;
    --muted: #6b756c;
    --border: #e0e3e0;
    --reserved-bg: #eaf3ea;
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
  }
  header {
    padding: 14px 16px 10px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
  }
  header h1 {
    margin: 0 0 2px;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--green-dark);
    letter-spacing: -0.01em;
  }
  .subline {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .subline .date {
    font-weight: 600;
    color: var(--text);
  }
  main {
    padding: 12px 0 32px;
  }
  .banner {
    margin: 0 16px 12px;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    background: var(--stale-bg);
    border: 1px solid var(--stale-border);
    color: var(--stale-text);
  }
  .status {
    padding: 40px 20px;
    text-align: center;
    color: var(--muted);
    font-size: 0.95rem;
  }
  .error-page {
    padding: 60px 20px;
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
  button.retry {
    margin-top: 16px;
    padding: 8px 18px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    background: var(--green);
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  button.retry:hover { background: var(--green-dark); }
  .table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 0 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    min-width: 560px;
    font-size: 0.82rem;
  }
  thead th {
    position: sticky;
    top: 0;
    background: var(--bg-alt);
    z-index: 1;
    border-bottom: 1px solid var(--border);
  }
  th, td {
    padding: 7px 8px;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--border);
  }
  th.court-col, td.court-col {
    text-align: left;
  }
  th.time-col, td.time-col {
    position: sticky;
    left: 0;
    background: var(--bg);
    font-weight: 600;
    z-index: 1;
    border-right: 1px solid var(--border);
  }
  thead th.time-col {
    z-index: 2;
    background: var(--bg-alt);
  }
  tbody tr:nth-child(even) td.time-col {
    background: var(--bg-alt);
  }
  td.cell-reserved {
    background: var(--reserved-bg);
    border-left: 2px solid var(--reserved-border);
    font-weight: 500;
    color: var(--text);
    white-space: normal;
    max-width: 160px;
  }
  td.cell-open {
    color: var(--muted);
    font-weight: 400;
  }
  td.cell-null {
    background: repeating-linear-gradient(
      45deg,
      var(--bg-alt),
      var(--bg-alt) 6px,
      var(--bg) 6px,
      var(--bg) 12px
    );
  }
  h2.facility-heading {
    margin: 22px 16px 8px;
    font-size: 1rem;
    font-weight: 700;
    color: var(--green-dark);
  }
  h2.facility-heading:first-of-type {
    margin-top: 4px;
  }
  footer {
    padding: 16px;
    text-align: center;
    color: var(--muted);
    font-size: 0.75rem;
  }
</style>
</head>
<body>
<header>
  <h1>SCHH Tennis — Court Sheet</h1>
  <div class="subline" id="subline">
    <span class="date">Loading…</span>
  </div>
</header>
<main id="main">
  <div class="status" id="status">Loading…</div>
</main>
<footer>Chelsea SCHH &middot; unofficial court sheet viewer</footer>
<script>
(function () {
  "use strict";

  var REFRESH_MS = 5 * 60 * 1000;
  var mainEl = document.getElementById("main");
  var sublineEl = document.getElementById("subline");

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function formatDateLocal(ymd) {
    var parts = String(ymd).split("-");
    if (parts.length !== 3) return ymd;
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    var dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
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

  function setSubline(dateStr, fetchedAt) {
    sublineEl.innerHTML = "";
    if (dateStr) {
      var dateSpan = document.createElement("span");
      dateSpan.className = "date";
      dateSpan.textContent = formatDateLocal(dateStr);
      sublineEl.appendChild(dateSpan);
    }
    if (fetchedAt) {
      var updSpan = document.createElement("span");
      updSpan.className = "updated";
      updSpan.textContent = formatUpdated(fetchedAt);
      sublineEl.appendChild(updSpan);
    }
  }

  function renderLoading() {
    mainEl.innerHTML = '<div class="status">Loading…</div>';
  }

  function renderErrorPage(err) {
    sublineEl.innerHTML = '<span class="date">&nbsp;</span>';
    var html = '' +
      '<div class="error-page">' +
      '<h2>Court sheet unavailable right now</h2>' +
      '<p>We could not reach the reservation site. Please try again shortly.</p>' +
      (err ? '<div class="error-code">' + escapeHtml(err) + '</div>' : '') +
      '<div><button class="retry" id="retryBtn">Retry</button></div>' +
      '</div>';
    mainEl.innerHTML = html;
    var btn = document.getElementById("retryBtn");
    if (btn) btn.addEventListener("click", function () { load(); });
  }

  function renderFacility(facility) {
    var courts = facility.courts || [];
    var slots = facility.slots || [];

    var html = '<h2 class="facility-heading">' + escapeHtml(facility.name || "") + '</h2>';
    html += '<div class="table-wrap"><table><thead><tr>';
    html += '<th class="time-col">Time</th>';
    for (var i = 0; i < courts.length; i++) {
      html += '<th class="court-col">' + escapeHtml(courts[i]) + '</th>';
    }
    html += '</tr></thead><tbody>';

    for (var s = 0; s < slots.length; s++) {
      var slot = slots[s];
      html += '<tr><td class="time-col">' + escapeHtml(slot.time) + '</td>';
      var cells = slot.cells || [];
      for (var j = 0; j < courts.length; j++) {
        var cell = cells[j];
        if (cell == null) {
          html += '<td class="cell-null"></td>';
        } else if (cell.reserved) {
          html += '<td class="cell-reserved">' + escapeHtml(cell.text || "") + '</td>';
        } else {
          html += '<td class="cell-open">—</td>';
        }
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function renderSheet(data) {
    setSubline(data.date, data.fetchedAt);

    var html = "";
    if (data.stale) {
      html += '<div class="banner">Showing older data — the reservation site couldn\\'t be reached.</div>';
    }

    var facilities = data.facilities || [];
    for (var f = 0; f < facilities.length; f++) {
      html += renderFacility(facilities[f]);
    }

    if (!facilities.length) {
      html += '<div class="status">No court data for today.</div>';
    }

    mainEl.innerHTML = html;
  }

  function load() {
    renderLoading();
    fetch("/api/courtsheet", { cache: "no-store" })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        var data = result.data;
        if (!result.ok || !data || (data.error && !data.facilities)) {
          renderErrorPage(data && data.error ? data.error : "Unknown error");
          return;
        }
        renderSheet(data);
      })
      .catch(function (e) {
        renderErrorPage(e && e.message ? e.message : "Network error");
      });
  }

  document.addEventListener("visibilitychange", function () {
    // no-op hook point; interval below checks visibility at fire time
  });

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
