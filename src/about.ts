// About page (/about) — placeholder copy, to be refined later.
import { version as APP_VERSION } from "../package.json";

export const ABOUT_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>About — SCHH Tennis</title>
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
  a.back {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--green-dark);
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;
  }
  .hero { text-align: center; padding: 4px 0 16px; }
  .hero img { width: 72px; height: 72px; border-radius: 18px; box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
  .hero h1 { margin: 10px 0 2px; font-size: 1.25rem; color: var(--green-dark); }
  .hero .tagline { margin: 0; color: var(--muted); font-size: 0.85rem; }
  .hero .version { margin: 6px 0 0; color: var(--muted); font-size: 0.72rem; letter-spacing: 0.03em; }
  section { margin-top: 18px; }
  section h2 {
    margin: 0 0 6px;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }
  section p { margin: 0 0 10px; font-size: 0.92rem; line-height: 1.55; }
  section a { color: var(--green-dark); font-weight: 600; }
  .fineprint { margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.75rem; line-height: 1.5; }
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
<a class="back" href="/more">&lsaquo; More</a>
<div class="hero">
  <img src="/icons/icon-192.png" alt="SCHH Tennis app icon">
  <h1>SCHH Tennis</h1>
  <p class="tagline">Court sheets and club news for Sun City Hilton Head tennis</p>
  <p class="version">Version ${APP_VERSION}</p>
</div>

<section>
  <h2>What this is</h2>
  <p>SCHH Tennis puts the day's court sheet, court conditions, and club announcements in your pocket. See who's playing where, check whether the courts are open, and find upcoming clinics and events.</p>
  <p>The same information powers the display boards at the courts, so what you see here always matches what's posted at the facilities.</p>
</section>

<section>
  <h2>Where the information comes from</h2>
  <p>Court sheets and announcements are drawn from the club's Chelsea Reservations system and the daily conditions bulletin maintained by the Logo Building staff. Information refreshes automatically throughout the day.</p>
  <p>To book a court, use the Reserve tab &mdash; reservations are always made through the official <a href="https://hiltheadct.chelseareservations.com/tennis/TNwelcome2.aspx" target="_blank" rel="noopener">Chelsea Reservations site</a> with your own member login.</p>
</section>

<section>
  <h2>Questions or ideas?</h2>
  <p>This app is a community project and a work in progress. Suggestions, corrections, and feature ideas are welcome &mdash; <a href="mailto:ron@snyderjr.com">send us a note</a>.</p>
</section>

<p class="fineprint">SCHH Tennis is an unofficial companion app created by and for Sun City Hilton Head residents. It is not affiliated with Chelsea Information Systems or the Sun City Hilton Head Community Association. Court availability and club information are provided as-is; the official reservation system is authoritative.</p>

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
