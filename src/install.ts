// Installation instructions page (/install) for the SCHH Tennis PWA.
export const INSTALL_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Install SCHH Tennis</title>
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
    padding: 0 16px 32px;
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
  .hero {
    text-align: center;
    padding: 4px 0 18px;
    border-bottom: 1px solid var(--border);
  }
  .hero img {
    width: 84px;
    height: 84px;
    border-radius: 20px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  }
  .hero h1 { margin: 12px 0 4px; font-size: 1.25rem; color: var(--green-dark); }
  .hero p { margin: 0; color: var(--muted); font-size: 0.9rem; line-height: 1.45; }
  #installNowWrap { display: none; margin-top: 14px; }
  button.install-now {
    min-height: 48px;
    padding: 10px 28px;
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    background: var(--green);
    border: none;
    border-radius: 10px;
    cursor: pointer;
  }
  button.install-now:active { background: var(--green-dark); }
  section {
    margin-top: 20px;
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  section.preferred { border-color: var(--green); }
  section h2 {
    margin: 0;
    padding: 14px 16px;
    font-size: 1rem;
    background: var(--bg-alt);
    border-bottom: 1px solid var(--border);
  }
  section.preferred h2 { background: var(--green-tint); color: var(--green-dark); }
  .your-device {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--green);
    color: #fff;
    padding: 2px 8px;
    border-radius: 10px;
    margin-left: 8px;
    vertical-align: 2px;
  }
  ol { margin: 0; padding: 14px 16px 16px 36px; }
  ol li { padding: 6px 0; font-size: 0.92rem; line-height: 1.5; }
  ol li b { color: var(--green-dark); }
  .keycap {
    display: inline-block;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg-alt);
    padding: 0 7px;
    font-size: 0.9em;
  }
  .note {
    margin: 0;
    padding: 0 16px 14px;
    color: var(--muted);
    font-size: 0.8rem;
    line-height: 1.45;
  }
</style>
</head>
<body>
<a class="back" href="/">&lsaquo; Back to court sheet</a>
<div class="hero">
  <img src="/icons/icon-192.png" alt="SCHH Tennis app icon">
  <h1>Install SCHH Tennis</h1>
  <p>Add the court sheet to your home screen — it opens like an app, full screen, one tap away.</p>
  <div id="installNowWrap"><button class="install-now" id="installNowBtn" type="button">Install now</button></div>
</div>

<section id="iosSection">
  <h2>iPhone &amp; iPad (Safari)<span class="your-device" id="iosBadge" style="display:none">Your device</span></h2>
  <ol>
    <li>Open this page in <b>Safari</b> (installing doesn't work from Chrome or other browsers on iPhone).</li>
    <li>Tap the <b>&#8943;</b> three-dot button at the bottom of the screen, then tap <b>Share</b> (the square with an arrow). On iPhones with the older Safari layout, the Share button sits directly at the bottom center instead.</li>
    <li>Scroll down the share menu and tap <b>Add to Home Screen</b>.</li>
    <li>Tap <b>Add</b> in the top-right corner.</li>
  </ol>
  <p class="note">The SCHH Tennis icon appears on your home screen. Opening it shows the court sheet full screen, without Safari's address bar.</p>
</section>

<section id="androidSection">
  <h2>Android (Chrome)<span class="your-device" id="androidBadge" style="display:none">Your device</span></h2>
  <ol>
    <li>Open this page in <b>Chrome</b>.</li>
    <li>Tap the <b>&#8942;</b> menu in the top-right corner.</li>
    <li>Tap <b>Add to Home screen</b> (on some phones it says <b>Install app</b>).</li>
    <li>Confirm with <b>Install</b> or <b>Add</b>.</li>
  </ol>
  <p class="note">Chrome may also show an "Install now" button above, or an install banner on the court sheet page — either does the same thing.</p>
</section>

<script>
(function () {
  "use strict";
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var ios = document.getElementById("iosSection");
  var android = document.getElementById("androidSection");
  if (isIOS) {
    ios.className = "preferred";
    document.getElementById("iosBadge").style.display = "inline-block";
  } else if (/Android/i.test(navigator.userAgent)) {
    android.className = "preferred";
    document.getElementById("androidBadge").style.display = "inline-block";
    android.parentNode.insertBefore(android, ios);
  }

  // One-tap install where the browser offers it (Android Chrome).
  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    document.getElementById("installNowWrap").style.display = "block";
  });
  document.getElementById("installNowBtn").addEventListener("click", function () {
    if (!deferred) return;
    deferred.prompt();
    deferred = null;
    document.getElementById("installNowWrap").style.display = "none";
  });
})();
</script>
</body>
</html>
`;
