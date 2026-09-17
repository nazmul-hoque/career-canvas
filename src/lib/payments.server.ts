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
