// "More" page (/more) — link hub reached from the fourth tab. Future links
// (settings, feedback, etc.) get added to the list here.
export const MORE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>More — SCHH Tennis</title>
<link rel="icon" href="/icons/icon-192.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#1f5c2c">
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
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; max-width: 100%; overflow-x: hidden; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    max-width: 560px;
    margin: 0 auto;
    padding: 0 16px calc(104px + env(safe-area-inset-bottom));
  }
  header { padding: 14px 0 10px; }
  header h1 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--green-dark); }
  .link-list {
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    margin-top: 6px;
  }
  .link-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 10px 14px;
    text-decoration: none;
    color: var(--text);
    background: var(--bg);
  }
  .link-row + .link-row { border-top: 1px solid var(--border); }
  .link-row:active { background: var(--bg-alt); }
  .link-emoji { font-size: 1.4rem; flex: 0 0 auto; }
  .link-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .link-text b { font-size: 0.95rem; }
  .link-sub { font-size: 0.78rem; color: var(--muted); }
  .link-chev { color: var(--muted); font-size: 1.1rem; }
  #tabbar {
    position: fixed;
    left: 0; right: 0; bottom: 0;
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
<header><h1>More</h1></header>
<div class="link-list">
  <a class="link-row" href="/about">
    <span class="link-emoji">&#8505;&#65039;</span>
    <span class="link-text"><b>About this app</b><span class="link-sub">What it is and where the information comes from</span></span>
    <span class="link-chev">&rsaquo;</span>
  </a>
  <a class="link-row" href="/install">
    <span class="link-emoji">&#128242;</span>
    <span class="link-text"><b>Install on your phone</b><span class="link-sub">Add a home-screen icon &mdash; opens like an app</span></span>
    <span class="link-chev">&rsaquo;</span>
  </a>
</div>

<nav id="tabbar" aria-label="Primary">
  <a class="tab-item" href="/">
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
  <a class="tab-item active" href="/more" aria-current="page">
    <span class="tab-icon" aria-hidden="true">&#8943;</span>
    <span class="tab-label">More</span>
  </a>
</nav>
</body>
</html>
`;
