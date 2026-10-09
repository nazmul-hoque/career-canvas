import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** What the learner types to confirm. Checked here too, so no stray call can delete. */
export const DELETE_CONFIRMATION = "DELETE";

/**
 * Self-serve account deletion, as the Privacy Policy promises. Deleting the auth
 * user cascades to the profile, progress, mentor history, posts, submissions,
 * certificates and push subscriptions.
 *
 * Billing goes first: a deleted account doesn't stop Stripe charging the card
 * behind it, and once the account is gone nobody can find the subscription by
 * learner any more. So a paying learner's subscriptions are cancelled before
 * anything is deleted, and if that can't be confirmed, nothing is.
 */
export const deleteAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ confirm: z.literal(DELETE_CONFIRMATION) }).parse(input))
  .handler(async ({ context }): Promise<{ deleted: true }> => {
    const userId = z.string().uuid().parse(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // The last admin deleting themselves would leave nobody able to grant the
    // role back; admins are removed by hand, with the service role.
    const { data: admin } = await supabaseAdmin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (admin) {
      throw new Error(
        "Admin accounts can't be deleted here. Remove the admin role in Supabase (admin_users) first.",
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw new Error("Your account couldn't be checked. Please try again.");

    const { paymentsProvider, cancelSubscriptionsFor } = await import("@/lib/payments.server");
    // Lifetime was a one-time payment and a trial never had a card, so only Pro
    // has anything still billing.
    if (paymentsProvider() === "stripe" && profile?.plan === "pro") {
      const cancelled = await cancelSubscriptionsFor(userId);
      if (cancelled === 0) {
        throw new Error(
          "We couldn't find your subscription to cancel it, so your account hasn't been deleted. If you subscribed in the last few minutes, try again shortly; otherwise email us and we'll sort it out.",
        );
      }
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Your account couldn't be deleted. Please try again.");
    return { deleted: true };
  });
