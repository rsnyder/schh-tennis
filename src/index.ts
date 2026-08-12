import { getCourtSheet, refreshCourtSheet } from "./cache";
import { fetchCourtSheetHtml } from "./chelsea";
import { PAGE_HTML } from "./page";
import { ScrapeError } from "./types";

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
        return new Response(PAGE_HTML, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });

      case "/api/courtsheet": {
        const result = await getCourtSheet(env, ctx);
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
