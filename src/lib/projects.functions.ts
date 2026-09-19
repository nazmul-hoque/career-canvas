import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { projectById } from "@/content/projects";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { entitlementsFor, planState } from "@/lib/entitlements";
import { mockProjectFeedback } from "@/lib/project-feedback";

/**
 * Portfolio projects are a paid feature, so the submission itself has to be
 * refused server-side — hiding the button would stop nobody with a console open.
 */

const submitSchema = z.object({
  projectId: z.string().min(1),
  repoUrl: z.string().max(500).default(""),
  liveUrl: z.string().max(500).default(""),
  notes: z.string().min(1).max(20_000),
});

export type SubmitProjectResult = {
  feedback: string;
  firstTime: boolean;
  unlockedAchievement: boolean;
};

export const submitProjectFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data, context }): Promise<SubmitProjectResult> => {
    const userId = context.userId;
    if (!projectById(data.projectId)) throw new Error("That project doesn't exist.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, trial_ends_at")
      .eq("id", userId)
      .maybeSingle();

    if (!entitlementsFor(planState(profile).plan).projects) {
      throw new Error(
        "Portfolio projects are part of Pro. Start your free trial to submit this one.",
      );
    }

    const feedback = mockProjectFeedback(data.projectId, data.notes);

    const { data: existing } = await supabaseAdmin
      .from("project_submissions")
      .select("id")
      .eq("user_id", userId)
      .eq("project_id", data.projectId)
      .maybeSingle();

    const row = {
      user_id: userId,
      project_id: data.projectId,
      repo_url: data.repoUrl || null,
      live_url: data.liveUrl || null,
      notes: data.notes || null,
      status: "submitted",
      feedback,
    };

    if (existing) {
      const { error } = await supabaseAdmin
        .from("project_submissions")
        .update(row)
        .eq("id", (existing as { id: string }).id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("project_submissions").insert(row);
      if (error) throw new Error(error.message);
    }

    const { data: hasAchievement } = await supabaseAdmin
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_key", "project-complete")
      .maybeSingle();

    let unlockedAchievement = false;
    if (!hasAchievement) {
      await supabaseAdmin
        .from("user_achievements")
        .insert({ user_id: userId, achievement_key: "project-complete" });
      unlockedAchievement = true;
    }

    return { feedback, firstTime: !existing, unlockedAchievement };
  });
