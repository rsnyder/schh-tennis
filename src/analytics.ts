// Usage analytics: Cloudflare Web Analytics (free, cookieless page views).
//
// Set CF_BEACON_TOKEN to the token from the Cloudflare dashboard (Analytics &
// Logs -> Web Analytics -> the site's snippet, the "token" value inside
// data-cf-beacon). While it is empty, no tracking script is emitted anywhere.
//
// Scope: the mobile pages only (/, /courts, /more, /about, /install) — the
// TV signage is deliberately untracked (it would register a "view" every
// meta-refresh, drowning real usage in noise).
const CF_BEACON_TOKEN = "f1964275f0a942f4a5d524b02e35bab0";

export const ANALYTICS_TAG = CF_BEACON_TOKEN
  ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${CF_BEACON_TOKEN}"}'></script>`
  : "";
