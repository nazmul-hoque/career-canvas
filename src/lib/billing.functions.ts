import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TRIAL_DAYS, type PlanId } from "@/lib/entitlements";

/**
 * Plan changes. Every one of them lands here, mock or real — the migration
 * revoked the browser's grant on `profiles.plan`, because a column that decides
 * what someone paid for cannot be writable by the person who benefits.
 */

const checkoutSchema = z.object({
  plan: z.enum(["pro", "lifetime"]),
  interval: z.enum(["monthly", "yearly", "once"]),
});

export type CheckoutResult =
  /** Stripe: send the browser to `url`. */
  | { kind: "redirect"; url: string }
  /** Mock: the plan is already applied, show the confirmation dialog. */
  | { kind: "mock"; plan: PlanId };

export const startCheckoutFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const userId = context.userId;
    const { paymentsProvider } = await import("@/lib/payments.server");

    if (paymentsProvider() === "mock") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ plan: data.plan, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw new Error(error.message);
      return { kind: "mock", plan: data.plan };
    }

    const { createCheckoutSession } = await import("@/lib/payments.server");
    const request = getRequest();
    const origin = request ? new URL(request.url).origin : "";
    const email = (context.claims as { email?: string } | undefined)?.email;

    const { url } = await createCheckoutSession({
      userId,
      email,
      plan: data.plan,
      interval: data.interval,
      origin,
    });
    return { kind: "redirect", url };
  });

/** Downgrading to Free needs no checkout, but still goes through the server. */
export const switchToFreeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ plan: PlanId }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ plan: "free", updated_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { plan: "free" };
  });

export type TrialResult = { trialEndsAt: string };

/**
 * Card-free 14-day trial, once per account. `trial_ends_at` doubles as the
 * "already used" marker, so a second attempt is refused rather than silently
 * extending.
 */
export const startTrialFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TrialResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, trial_ends_at")
      .eq("id", context.userId)
      .maybeSingle();

    if (profile?.trial_ends_at) {
      throw new Error("You've already used your free trial.");
    }
    if (profile?.plan && profile.plan !== "free") {
      throw new Error("You're already on a paid plan.");
    }

    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString();
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ trial_ends_at: trialEndsAt, updated_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    return { trialEndsAt };
  });
