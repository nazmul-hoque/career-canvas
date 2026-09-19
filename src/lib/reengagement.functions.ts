import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Unsubscribe, authenticated by a signed token rather than by a session — the
 * whole point is that it works from an email client where nobody is logged in.
 *
 * POST, not GET: mail clients and security scanners follow links in emails
 * before a human ever clicks them, so an unsubscribe that acted on page load
 * would silently opt people out.
 */

const unsubscribeSchema = z.object({
  userId: z.string().uuid(),
  token: z.string().min(8).max(64),
});

export const unsubscribeFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => unsubscribeSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { verifyToken, unsubscribePayload } = await import("@/lib/signing.server");
    const valid = await verifyToken(unsubscribePayload(data.userId), data.token).catch(() => false);
    if (!valid)
      throw new Error("That unsubscribe link is not valid. Try the link in a newer email.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ email_optin: false })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("analytics_events").insert({
      user_id: data.userId,
      name: "reengagement_unsubscribed",
      props: {},
    });

    return { ok: true };
  });
