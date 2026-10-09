/**
 * Payments, behind the same kind of seam as the mentor providers.
 *
 *   PAYMENTS_PROVIDER=mock    (default) no money moves; the server marks the
 *                             plan as bought so the rest of the app can be
 *                             exercised end to end
 *   PAYMENTS_PROVIDER=stripe  real Stripe Checkout + webhook
 *
 * Server-only: reads secret keys. Import with `await import(...)` inside a
 * handler, never at module top level in anything the client can reach.
 */
import type { PlanId } from "@/lib/entitlements";

export type Interval = "monthly" | "yearly" | "once";

export function paymentsProvider(): "mock" | "stripe" {
  const choice = (process.env["PAYMENTS_PROVIDER"] || "mock").toLowerCase();
  if (choice === "stripe") return "stripe";
  if (choice === "mock" || choice === "") return "mock";
  throw new Error(`Unknown PAYMENTS_PROVIDER "${choice}". Use mock or stripe.`);
}

function stripeSecret(): string {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("PAYMENTS_PROVIDER=stripe but STRIPE_SECRET_KEY is not set.");
  return key;
}

function priceIdFor(plan: PlanId, interval: Interval): string {
  const name =
    plan === "lifetime"
      ? "STRIPE_PRICE_LIFETIME"
      : interval === "yearly"
        ? "STRIPE_PRICE_PRO_YEARLY"
        : "STRIPE_PRICE_PRO_MONTHLY";
  const price = process.env[name];
  if (!price) throw new Error(`Missing ${name} — create the price in Stripe and set it in .env.`);
  return price;
}

/** Stripe's API is form-encoded, including nested keys like line_items[0][price]. */
async function stripePost(path: string, form: Record<string, string>): Promise<unknown> {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${stripeSecret()}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form).toString(),
  });
  if (!response.ok) {
    throw new Error(`Stripe ${path} returned ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function stripeGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1/${path}?${new URLSearchParams(params)}`, {
    headers: { authorization: `Bearer ${stripeSecret()}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Billing is temporarily unavailable. Please try again.");
  return response.json() as Promise<T>;
}

/**
 * Cancels, immediately, every live subscription checkout created for this
 * learner — `createCheckoutSession` writes their id into the subscription's
 * metadata. Returns how many it cancelled.
 *
 * Search is eventually consistent (Stripe: usually under a minute, up to an
 * hour in an outage), so finding none is not proof there are none. The caller
 * decides what that means for a learner whose plan says they're paying.
 */
export async function cancelSubscriptionsFor(userId: string): Promise<number> {
  // https://docs.stripe.com/api/subscriptions/search — userId is a validated
  // uuid, so it can't break out of the quoted query value.
  const found = await stripeGet<{ data: { id: string; status: string }[] }>(
    "subscriptions/search",
    { query: `metadata['user_id']:'${userId}'`, limit: "100" },
  );
  const live = found.data.filter(
    (s) => s.status !== "canceled" && s.status !== "incomplete_expired",
  );
  for (const subscription of live) {
    // https://docs.stripe.com/api/subscriptions/cancel
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription.id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${stripeSecret()}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Your subscription couldn't be cancelled. Please try again.");
  }
  return live.length;
}

/** Email narrows the lookup; a server-authored account reference proves ownership. */
export async function createBillingPortal(input: {
  userId: string;
  email: string;
  origin: string;
}): Promise<{ url: string }> {
  const customers = await stripeGet<{ data: { id: string }[] }>("customers", {
    email: input.email,
    limit: "100",
  });
  for (const customer of customers.data) {
    let cursor = "";
    for (let page = 0; page < 10; page++) {
      const sessions = await stripeGet<{
        data: { id: string; client_reference_id: string | null }[];
        has_more: boolean;
      }>("checkout/sessions", {
        customer: customer.id,
        status: "complete",
        limit: "100",
        ...(cursor ? { starting_after: cursor } : {}),
      });
      if (sessions.data.some((session) => session.client_reference_id === input.userId)) {
        // https://docs.stripe.com/api/customer_portal/sessions/create
        const portal = (await stripePost("billing_portal/sessions", {
          customer: customer.id,
          return_url: `${input.origin}/pricing`,
        })) as { url?: string };
        if (!portal.url) throw new Error("Billing did not return a management link. Try again.");
        return { url: portal.url };
      }
      if (!sessions.has_more || !sessions.data.length) break;
      cursor = sessions.data.at(-1)!.id;
    }
  }
  throw new Error(
    "No Stripe billing account was found for this sign-in. Use the billing link in your payment receipt if your billing email has changed.",
  );
}

export async function createCheckoutSession(input: {
  userId: string;
  email: string | undefined;
  plan: PlanId;
  interval: Interval;
  origin: string;
}): Promise<{ url: string }> {
  const lifetime = input.plan === "lifetime";
  const payload = await stripePost("checkout/sessions", {
    mode: lifetime ? "payment" : "subscription",
    "line_items[0][price]": priceIdFor(input.plan, input.interval),
    "line_items[0][quantity]": "1",
    success_url: `${input.origin}/pricing?checkout=success`,
    cancel_url: `${input.origin}/pricing?checkout=cancelled`,
    // Both are echoed back on the webhook — client_reference_id survives even
    // when metadata does not.
    client_reference_id: input.userId,
    "metadata[user_id]": input.userId,
    "metadata[plan]": input.plan,
    ...(!lifetime ? { "subscription_data[metadata][user_id]": input.userId } : {}),
    ...(input.email ? { customer_email: input.email } : {}),
  });

  const url = (payload as { url?: string }).url;
  if (!url) throw new Error("Stripe did not return a checkout URL.");
  return { url };
}

/** Constant-time compare — a fast-exit comparison leaks the signature by timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  // Web Crypto rather than node:crypto — this has to run on the worker target too.
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifies the Stripe signature and applies the plan change. Returns the HTTP
 * response to send back — Stripe retries anything that isn't 2xx.
 */
export async function handleStripeWebhook(request: Request): Promise<Response> {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) return new Response("Webhook secret not configured", { status: 500 });

  const signatureHeader = request.headers.get("stripe-signature") ?? "";
  const body = await request.text();

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((piece) => {
      const [k, ...rest] = piece.split("=");
      return [k?.trim() ?? "", rest.join("=")];
    }),
  );
  const timestamp = parts["t"];
  const provided = parts["v1"];
  if (!timestamp || !provided) return new Response("Bad signature header", { status: 400 });

  // Reject replays of an old, validly-signed body.
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    return new Response("Signature timestamp out of tolerance", { status: 400 });
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${body}`);
  if (!timingSafeEqual(expected, provided)) {
    return new Response("Signature mismatch", { status: 400 });
  }

  const event = JSON.parse(body) as {
    type: string;
    data: { object: Record<string, unknown> };
  };
  const object = event.data.object;
  const metadata = (object["metadata"] ?? {}) as Record<string, string>;
  const userId = (object["client_reference_id"] as string) || metadata["user_id"];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  switch (event.type) {
    case "checkout.session.completed": {
      if (!userId) return new Response("No user reference on session", { status: 400 });
      const plan = (metadata["plan"] as PlanId) || "pro";
      await supabaseAdmin
        .from("profiles")
        .update({ plan, updated_at: new Date().toISOString() })
        .eq("id", userId);
      break;
    }
    case "customer.subscription.deleted": {
      // Lapsed subscription drops to Free. Certificates already issued stay
      // valid — they live in issued_certificates, not in the plan.
      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "free", updated_at: new Date().toISOString() })
          .eq("id", userId);
      }
      break;
    }
    default:
      // Everything else is acknowledged and ignored, so Stripe stops retrying.
      break;
  }

  return new Response("ok", { status: 200 });
}
