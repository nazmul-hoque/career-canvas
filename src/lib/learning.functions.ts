import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { careerPaths, findLesson } from "@/content/curriculum";
import { certificateId, pathCompletion } from "@/lib/certificates";
import { entitlementsFor, isLessonUnlocked, planState } from "@/lib/entitlements";
import { ATTESTED_XP, levelFromXp } from "@/content/gamification";
import { isLessonLive } from "@/content/lessons";
import { gradeLesson, isReviewable } from "@/lib/lesson-grading";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/git-sandbox";
import { initialReview } from "@/lib/review-schedule";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * XP, levels, streaks and lesson progress are written here and nowhere else.
 *
 * The browser used to compute them and write them straight to `profiles`, which
 * meant anyone with the console open could set their own XP and top the
 * leaderboard. The client now sends only *which* lesson it finished and the
 * answers it gave; the amount of XP comes from the lesson content on the server,
 * and the accompanying migration revokes the client's write grants on
 * `profiles.xp`, `lesson_progress` and `daily_activity` so this is the only path
 * that can move those numbers.
 */

const completeLessonSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  /** Answers the learner gave, keyed by block id. Re-checked here, not trusted. */
  answers: z.record(z.union([z.string(), z.number()])).default({}),
  /**
   * Whether the coding challenge passed its tests. The runner is a browser
   * sandbox, so this one flag is still the client's word — moving it server-side
   * needs a real execution service. XP amount and eligibility are not.
   */
  challengeSolved: z.boolean().default(false),
  /** A git challenge's transcript. Replayed on the server, so for git the flag above is ignored. */
  transcript: z.string().max(MAX_TRANSCRIPT_CHARS).optional(),
});

export type CompleteLessonResult = {
  firstTime: boolean;
  gained: number;
  newXp: number;
  streak: number;
  leveledUp: boolean;
  level: number;
  newlyUnlocked: string[];
};

const utcDay = () => new Date().toISOString().slice(0, 10);

const monthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
};

const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

export const completeLessonFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => completeLessonSchema.parse(input))
  .handler(async ({ data, context }): Promise<CompleteLessonResult> => {
    const { courseId, lessonId, answers, challengeSolved, transcript } = data;
    const userId = context.userId;

    const found = findLesson(courseId, lessonId);
    if (!found || !isLessonLive(lessonId)) {
      throw new Error("That lesson isn't published yet, so it can't be completed.");
    }

    const { getLessonBody } = await import("@/content/lesson-bodies.server");
    const body = getLessonBody(courseId, lessonId);
    if (!body) throw new Error("That lesson isn't published yet, so it can't be completed.");

    // Re-check every answer against the authored body. A completion is only
    // worth XP if the work was actually done. The rule itself lives in
    // lesson-grading.ts, shared with the spaced-review path.
    const graded = gradeLesson(body, answers, challengeSolved, transcript);
    if (!graded.ok) throw new Error(graded.reason ?? "That lesson isn't finished yet.");

    const hasChallenge = body.blocks.some((b) => b.kind === "challenge");
    // Unchecked work is capped here, not trusted from the body: nothing else
    // stops an authored lesson paying a full lesson's XP for a task the learner
    // simply said they did.
    const xp = body.attested ? Math.min(body.xp, ATTESTED_XP) : body.xp;

    // Service-role client: the learner's own grants no longer allow these writes.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("xp, streak_current, streak_best, last_active_day, plan, trial_ends_at")
      .eq("id", userId)
      .maybeSingle();

    // Plan gates, enforced here because a lock that only exists in the UI is
    // decoration. No-ops entirely while ENTITLEMENTS_ENABLED is off.
    const state = planState(profile);
    const entitlements = entitlementsFor(state.plan);

    if (!isLessonUnlocked(found.course, lessonId, entitlements)) {
      throw new Error("That lesson is part of Pro. Upgrade or start your free trial to open it.");
    }

    const { data: existing } = await supabaseAdmin
      .from("lesson_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    // Free tier's monthly practice allowance. Concept lessons are never counted.
    if (
      !existing &&
      entitlements.practiceTasksPerMonth !== null &&
      found.lesson.type !== "concept"
    ) {
      const { data: monthRows } = await supabaseAdmin
        .from("lesson_progress")
        .select("lesson_id, course_id")
        .eq("user_id", userId)
        .gte("completed_at", monthStart());

      const usedTasks = ((monthRows ?? []) as { lesson_id: string; course_id: string }[]).filter(
        (row) => {
          const meta = findLesson(row.course_id, row.lesson_id);
          return meta && meta.lesson.type !== "concept";
        },
      ).length;

      if (usedTasks >= entitlements.practiceTasksPerMonth) {
        throw new Error(
          `Free covers ${entitlements.practiceTasksPerMonth} practice tasks a month and you've used them all. They reset on the 1st.`,
        );
      }
    }

    const firstTime = !existing;
    if (firstTime) {
      const { error } = await supabaseAdmin.from("lesson_progress").insert({
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        xp_earned: xp,
      });
      if (error) throw new Error(error.message);
    }

    const day = utcDay();

    // Knowing it once is not knowing it. Every completed lesson that asked a
    // question joins the review queue, first check-in tomorrow.
    if (firstTime && isReviewable(body)) {
      const scheduled = initialReview(day);
      await supabaseAdmin.from("review_items").upsert(
        {
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          due_on: scheduled.dueOn,
          interval_days: scheduled.intervalDays,
          streak: scheduled.streak,
          lapses: scheduled.lapses,
        },
        { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
      );
    }

    const gained = firstTime ? xp : 0;
    const previousXp = profile?.xp ?? 0;
    const newXp = previousXp + gained;
    const previousLevel = levelFromXp(previousXp).level;
    const nextLevel = levelFromXp(newXp).level;

    let streak = profile?.streak_current ?? 0;
    const last = profile?.last_active_day ?? null;
    if (!last) streak = 1;
    else {
      const gap = daysBetween(last, day);
      if (gap === 1) streak += 1;
      else if (gap > 1) streak = 1;
      else streak = Math.max(streak, 1);
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        xp: newXp,
        level: nextLevel,
        streak_current: streak,
        streak_best: Math.max(streak, profile?.streak_best ?? 0),
        last_active_day: day,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (gained > 0) {
      const { data: act } = await supabaseAdmin
        .from("daily_activity")
        .select("id, xp")
        .eq("user_id", userId)
        .eq("day", day)
        .maybeSingle();
      if (act) {
        await supabaseAdmin
          .from("daily_activity")
          .update({ xp: act.xp + gained })
          .eq("id", act.id);
      } else {
        await supabaseAdmin.from("daily_activity").insert({ user_id: userId, day, xp: gained });
      }
    }

    const { count } = await supabaseAdmin
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const unlocks: string[] = [];
    if ((count ?? 0) >= 1) unlocks.push("first-lesson");
    if ((count ?? 0) >= 10) unlocks.push("ten-lessons");
    if (hasChallenge) unlocks.push("first-challenge");
    if (newXp >= 1000) unlocks.push("xp-1000");
    if (streak >= 7) unlocks.push("streak-7");
    if (streak >= 30) unlocks.push("streak-30");
    if (lessonId === "js-debug.fixit") unlocks.push("debug-master");

    const newlyUnlocked: string[] = [];
    for (const key of unlocks) {
      const { data: has } = await supabaseAdmin
        .from("user_achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("achievement_key", key)
        .maybeSingle();
      if (!has) {
        await supabaseAdmin
          .from("user_achievements")
          .insert({ user_id: userId, achievement_key: key });
        newlyUnlocked.push(key);
      }
    }

    // A certificate is recorded the moment it is earned, so that it survives a
    // later downgrade — see issued_certificates in 20260916200000.
    if (firstTime && entitlements.certificates) {
      const { data: allProgress } = await supabaseAdmin
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId);
      const done = new Set(
        ((allProgress ?? []) as { lesson_id: string }[]).map((r) => r.lesson_id),
      );

      const { certificatePayload, signToken } = await import("@/lib/signing.server");

      for (const path of careerPaths) {
        if (pathCompletion(path, done).credential !== "eligible") continue;

        const { data: already } = await supabaseAdmin
          .from("issued_certificates")
          .select("user_id")
          .eq("user_id", userId)
          .eq("path_id", path.id)
          .maybeSingle();
        if (already) continue;

        // issued_at is stamped here rather than by the column default because
        // it is part of what the signature covers — see signing.server.ts.
        const issuedAt = new Date().toISOString();
        const id = certificateId(userId, path.id);
        const signature = await signToken(
          certificatePayload({ certificateId: id, userId, pathId: path.id, issuedAt }),
        );

        await supabaseAdmin.from("issued_certificates").insert({
          user_id: userId,
          path_id: path.id,
          certificate_id: id,
          plan_at_issue: state.plan,
          issued_at: issuedAt,
          signature,
        });
      }
    }

    // Recorded here rather than in the browser: completion is the one funnel step
    // that must not be inflatable from a console.
    await supabaseAdmin.from("analytics_events").insert({
      user_id: userId,
      name: "lesson_completed",
      props: {
        course_id: courseId,
        lesson_id: lessonId,
        xp: gained,
        first_time: firstTime,
        has_challenge: hasChallenge,
        streak,
      },
    });

    return {
      firstTime,
      gained,
      newXp,
      streak,
      leveledUp: nextLevel > previousLevel,
      level: nextLevel,
      newlyUnlocked,
    };
  });
