import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { projectById } from "@/content/projects";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { entitlementsFor, planState } from "@/lib/entitlements";
import { mockProjectFeedback } from "@/lib/project-feedback";
import { projectUrl, publicationSchema } from "@/lib/project-publication";

/**
 * Portfolio projects are a paid feature, so the submission itself has to be
 * refused server-side — hiding the button would stop nobody with a console open.
 */

const submitSchema = z.object({
  projectId: z.string().min(1),
  repoUrl: projectUrl.default(""),
  liveUrl: projectUrl.default(""),
  notes: z.string().trim().min(1).max(20_000),
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
      // Updating private work must never silently replace a public case study.
      is_published: false,
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

export const publishProjectFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => publicationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: submission, error } = await supabaseAdmin
      .from("project_submissions")
      .select("id, repo_url, live_url")
      .eq("user_id", context.userId)
      .eq("project_id", data.projectId)
      .single();
    if (error || !submission) throw new Error("Your submission could not be loaded. Try again.");
    if (data.published && !submission.repo_url && !submission.live_url)
      throw new Error("Add a repository or live project link before publishing.");
    if (
      data.published &&
      (!projectUrl.safeParse(submission.repo_url ?? "").success ||
        !projectUrl.safeParse(submission.live_url ?? "").success)
    )
      throw new Error("Update your project links to valid HTTP or HTTPS URLs before publishing.");
    const { error: updateError } = await supabaseAdmin
      .from("project_submissions")
      .update({ is_published: data.published, public_summary: data.summary })
      .eq("id", submission.id)
      .eq("user_id", context.userId);
    if (updateError) throw new Error("Publication could not be saved. Try again.");
    return { published: data.published };
  });
