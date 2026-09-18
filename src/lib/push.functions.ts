import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Registering a browser for push reminders.
 *
 * Server-side because the endpoint is unique across accounts: a shared laptop
 * that signs in as someone else must move its subscription to them, and only
 * the service role can take a row over from another user.
 */

const subscriptionSchema = z.object({
  // Push services are always https; anything else is not a subscription.
  endpoint: z.string().url().startsWith("https://").max(1000),
  keys: z.object({
    p256dh: z.string().min(40).max(200),
    auth: z.string().min(8).max(64),
  }),
  userAgent: z.string().max(300).optional(),
});

export const savePushSubscriptionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => subscriptionSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        user_agent: data.userAgent ?? null,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePushSubscriptionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ endpoint: z.string().max(1000) }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Scoped to the caller: knowing an endpoint is not a licence to remove it.
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", data.endpoint)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Sends one notification to the caller's own devices, so a learner can see the
 * permission actually worked instead of finding out the evening their streak
 * breaks.
 */
export const sendTestPushFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ delivered: number; devices: number }> => {
    const { vapidConfig, sendPush } = await import("@/lib/web-push.server");
    const config = vapidConfig();
    if (!config) throw new Error("Push notifications aren't set up on this server yet.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", context.userId)
      .limit(10);
    if (error) throw new Error(error.message);

    const { appUrl } = await import("@/lib/email.server");
    let delivered = 0;
    for (const row of rows ?? []) {
      const outcome = await sendPush(
        row,
        {
          title: "Reminders are on",
          body: "This is what a streak reminder looks like. You'll get at most one a day.",
          url: `${appUrl()}/dashboard`,
          tag: "test",
        },
        config,
      );
      if (outcome.delivered) delivered += 1;
      if (outcome.gone) await supabaseAdmin.from("push_subscriptions").delete().eq("id", row.id);
    }
    return { delivered, devices: rows?.length ?? 0 };
  });
