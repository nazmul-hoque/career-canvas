import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

/**
 * Payment webhooks are handled here rather than as a server function: they are
 * signed POSTs from Stripe, not browser RPCs, so they must skip CSRF and auth
 * middleware entirely.
 */
const WEBHOOK_PATHS = new Set(["/api/webhooks/stripe"]);

/**
 * Scheduled jobs land here for the same reason webhooks do: they are called by
 * a scheduler, not a browser, and authenticate with a shared secret instead of
 * a session. Point any cron at:
 *
 *   POST /api/cron/reengagement        Authorization: Bearer $CRON_SECRET
 *   POST /api/cron/reengagement?dry=1  same, but sends nothing and reports
 */
const CRON_PATHS = new Set(["/api/cron/reengagement"]);

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      const { pathname } = url;
      if (WEBHOOK_PATHS.has(pathname)) {
        if (request.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }
        const { handleStripeWebhook } = await import("./lib/payments.server");
        return await handleStripeWebhook(request);
      }

      if (CRON_PATHS.has(pathname)) {
        if (request.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }
        const { cronSecretMatches, runReengagement } = await import("./lib/reengagement.server");
        if (!cronSecretMatches(request.headers.get("authorization"))) {
          // Also 401s when CRON_SECRET is unset — an unguarded job endpoint is
          // a way for anyone to make us mail our own users.
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const report = await runReengagement({ dryRun: url.searchParams.get("dry") === "1" });
          return new Response(JSON.stringify(report, null, 2), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          // A scheduler reads status codes and logs, not HTML error pages.
          console.error(error);
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
