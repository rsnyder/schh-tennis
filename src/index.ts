import { getCourtSheet, getWelcome, refreshCourtSheet } from "./cache";
import { todayInNewYork } from "./date";
import { BARLOW_SC_600_WOFF2_B64 } from "./fonts";
import { fetchCourtSheetHtml } from "./chelsea";
import { HOME_HTML } from "./home";
import { ABOUT_HTML } from "./about";
import { INSTALL_HTML } from "./install";
import { MORE_HTML } from "./more";
import { PAGE_HTML } from "./page";
import {
  APPLE_TOUCH_ICON_B64,
  ICON_192_B64,
  ICON_512_B64,
  ICON_MASKABLE_512_B64,
  MANIFEST_JSON,
  pngFromBase64,
  SERVICE_WORKER_JS,
} from "./pwa";
import { SIGNAGE_HTML } from "./signage";
import { renderStaticSignage, renderStaticUnavailable, StaticScreen } from "./signage-static";
import { ScrapeError } from "./types";

function pngResponse(b64: string): Response {
  return new Response(pngFromBase64(b64), {
    headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" },
  });
}

export interface Env {
  COURT_CACHE: KVNamespace;
  CHELSEA_MEMBER: string;
  CHELSEA_PASSWORD: string;
  DEBUG: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/":
        return new Response(HOME_HTML, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });

      case "/courts":
        return new Response(PAGE_HTML, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });

      case "/api/welcome": {
        const result = await getWelcome(env);
        if (result.data === null && result.error) {
          return Response.json(
            { error: result.error, stale: false },
            { status: 502, headers: { "cache-control": "no-store" } },
          );
        }
        return Response.json(
          { ...result.data, stale: result.stale, ...(result.error ? { error: result.error } : {}) },
          { headers: { "cache-control": "no-store" } },
        );
      }

      case "/tv":
        return new Response(SIGNAGE_HTML, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });

      case "/tv/static": {
        // Server-rendered, script-free variant for viewers (like the Sylvox
        // TV's built-in HTML renderer) that don't execute <script>. Self-
        // refreshes via <meta http-equiv="refresh">.
        const staticDateParam = url.searchParams.get("date");
        if (staticDateParam !== null && !/^\d{4}-\d{2}-\d{2}$/.test(staticDateParam)) {
          return new Response(renderStaticUnavailable({ errorCode: "BAD_DATE", refreshSeconds: 300 }), {
            headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
          });
        }
        const result = await getCourtSheet(env, ctx, staticDateParam ?? undefined);
        if (result.data === null) {
          return new Response(renderStaticUnavailable({ errorCode: result.error, refreshSeconds: 60 }), {
            headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
          });
        }

        const screenParam = url.searchParams.get("screen");
        const pinned = screenParam === "south" || screenParam === "northwest";
        const screen: StaticScreen = pinned
          ? (screenParam as StaticScreen)
          : Math.floor(Date.now() / 1000 / 20) % 2 === 0
            ? "south"
            : "northwest";
        const refreshSeconds = pinned ? 300 : 20;
        // The hide-past filter only makes sense when viewing today's sheet.
        const showAll =
          url.searchParams.get("all") === "1" ||
          (staticDateParam !== null && staticDateParam !== todayInNewYork());

        return new Response(
          renderStaticSignage(result.data, { screen, refreshSeconds, showAll, stale: result.stale }),
          { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
        );
      }

      case "/more":
        return new Response(MORE_HTML, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });

      case "/about":
        return new Response(ABOUT_HTML, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });

      case "/install":
        return new Response(INSTALL_HTML, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });

      case "/manifest.webmanifest":
        return new Response(MANIFEST_JSON, {
          headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600" },
        });

      case "/sw.js":
        // no-cache so service worker updates roll out promptly
        return new Response(SERVICE_WORKER_JS, {
          headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-cache" },
        });

      case "/fonts/barlow-sc-600.woff2":
        return new Response(pngFromBase64(BARLOW_SC_600_WOFF2_B64), {
          headers: { "content-type": "font/woff2", "cache-control": "public, max-age=31536000, immutable" },
        });

      case "/icons/icon-192.png":
        return pngResponse(ICON_192_B64);
      case "/icons/icon-512.png":
        return pngResponse(ICON_512_B64);
      case "/icons/icon-maskable-512.png":
        return pngResponse(ICON_MASKABLE_512_B64);
      case "/icons/apple-touch-icon.png":
        return pngResponse(APPLE_TOUCH_ICON_B64);

      case "/api/courtsheet": {
        const dateParam = url.searchParams.get("date");
        if (dateParam !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
          return Response.json(
            { error: "BAD_DATE", message: "date must be YYYY-MM-DD" },
            { status: 400, headers: { "cache-control": "no-store" } },
          );
        }
        const result = await getCourtSheet(env, ctx, dateParam ?? undefined);
        if (result.data === null && result.error) {
          const status = result.error === "DATE_UNAVAILABLE" ? 404 : 502;
          return Response.json(
            { error: result.error, stale: false },
            { status, headers: { "cache-control": "no-store" } },
          );
        }
        return Response.json(
          { ...result.data, stale: result.stale, ...(result.error ? { error: result.error } : {}) },
          { headers: { "cache-control": "no-store" } },
        );
      }

      case "/api/raw": {
        if (env.DEBUG !== "true") return new Response("Not found", { status: 404 });
        try {
          const html = await fetchCourtSheetHtml({
            member: env.CHELSEA_MEMBER,
            password: env.CHELSEA_PASSWORD,
          });
          return new Response(html, {
            headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
          });
        } catch (error) {
          if (error instanceof ScrapeError) {
            return new Response(`${error.code}: ${error.message}`, {
              status: 502,
              headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
            });
          }
          throw error;
        }
      }

      default:
        return new Response("Not found", { status: 404 });
    }
  },

  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refreshCourtSheet(env).catch(() => {}));
  },
} satisfies ExportedHandler<Env>;
