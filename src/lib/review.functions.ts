import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { findLesson } from "@/content/curriculum";
import { isLessonLive } from "@/content/lessons";
import { levelFromXp } from "@/content/gamification";
import { gradableBlocks, gradeReview } from "@/lib/lesson-grading";
import { nextReview } from "@/lib/review-schedule";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Grading a spaced review.
 *
 * Same rule as lesson completion: the client sends which lesson and what it
 * answered, the server re-checks against the authored body and decides the
 * reward. Reviews pay a fraction of the lesson's XP — enough to be worth doing,
 * never enough to make re-answering four old questions a better deal than
 * learning something new.
 *
 * A review also holds the streak. Recall is work; a learner who reviewed today
 * did not skip today.
 */

const submitReviewSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  answers: z.record(z.union([z.string(), z.number()])).default({}),
});

export interface SubmitReviewResult {
  correct: boolean;
  gained: number;
  newXp: number;
  level: number;
  streak: number;
  /** ISO date the item is next due. */
  dueOn: string;
  intervalDays: number;
  wrongBlockIds: string[];
  /**
   * The right answer and why, per question — sent only now, after grading. The
   * review page never holds the answer key while the learner is still answering.
   */
  feedback: Record<string, { answer: string | number; explanation: string }>;
}

/** A review is worth a fifth of the lesson, rounded to something tidy. */
const REVIEW_XP_SHARE = 0.2;
const MAX_REVIEW_XP = 40;

const utcDay = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

export const submitReviewFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => submitReviewSchema.parse(input))
  .handler(async ({ data, context }): Promise<SubmitReviewResult> => {
    const { courseId, lessonId, answers } = data;
    const userId = context.userId;

    if (!findLesson(courseId, lessonId) || !isLessonLive(lessonId)) {
      throw new Error("That lesson isn't published, so there is nothing to review.");
    }
    const { getLessonBody } = await import("@/content/lesson-bodies.server");
    const body = getLessonBody(courseId, lessonId);
    if (!body) throw new Error("That lesson isn't published, so there is nothing to review.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: item } = await supabaseAdmin
      .from("review_items")
      .select("id, interval_days, streak, lapses, due_on")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (!item) throw new Error("That lesson isn't in your review queue.");

    const current = item as {
      id: string;
      interval_days: number;
      streak: number;
      lapses: number;
      due_on: string;
    };

    const day = utcDay();
    // Reviewing early is allowed, but it must not pay: the schedule is the
    // product, and a learner who grinds the same card ten times learns nothing.
    const dueYet = current.due_on <= day;

    const graded = gradeReview(body, answers);
    const scheduled = nextReview(
      {
        intervalDays: current.interval_days,
        streak: current.streak,
        lapses: current.lapses,
      },
      graded.ok,
      day,
    );

    await supabaseAdmin
      .from("review_items")
      .update({
        interval_days: scheduled.intervalDays,
        streak: scheduled.streak,
        lapses: scheduled.lapses,
        due_on: scheduled.dueOn,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", current.id);

    const reward =
      graded.ok && dueYet
        ? Math.min(MAX_REVIEW_XP, Math.round((body.xp * REVIEW_XP_SHARE) / 5) * 5)
        : 0;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("xp, streak_current, streak_best, last_active_day")
      .eq("id", userId)
      .maybeSingle();

    const previousXp = (profile?.xp as number | undefined) ?? 0;
    const newXp = previousXp + reward;

    let streak = (profile?.streak_current as number | undefined) ?? 0;
    const last = (profile?.last_active_day as string | null | undefined) ?? null;
    if (reward > 0) {
      if (!last) streak = 1;
      else {
        const gap = daysBetween(last, day);
        if (gap === 1) streak += 1;
        else if (gap > 1) streak = 1;
        else streak = Math.max(streak, 1);
      }
    }

    if (reward > 0) {
      await supabaseAdmin
        .from("profiles")
        .update({
          xp: newXp,
          level: levelFromXp(newXp).level,
          streak_current: streak,
          streak_best: Math.max(streak, (profile?.streak_best as number | undefined) ?? 0),
          last_active_day: day,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      const { data: act } = await supabaseAdmin
        .from("daily_activity")
        .select("id, xp")
        .eq("user_id", userId)
        .eq("day", day)
        .maybeSingle();
      if (act) {
        await supabaseAdmin
          .from("daily_activity")
          .update({ xp: (act as { xp: number }).xp + reward })
          .eq("id", (act as { id: string }).id);
      } else {
        await supabaseAdmin.from("daily_activity").insert({ user_id: userId, day, xp: reward });
      }
    }

    await supabaseAdmin.from("analytics_events").insert({
      user_id: userId,
      name: "review_completed",
      props: {
        course_id: courseId,
        lesson_id: lessonId,
        correct: graded.ok,
        early: !dueYet,
        xp: reward,
        interval_days: scheduled.intervalDays,
      },
    });

    return {
      correct: graded.ok,
      gained: reward,
      newXp,
      level: levelFromXp(newXp).level,
      streak,
      dueOn: scheduled.dueOn,
      intervalDays: scheduled.intervalDays,
      wrongBlockIds: graded.wrongBlockIds,
      feedback: Object.fromEntries(
        gradableBlocks(body).map((block) => [
          block.id,
          {
            answer: block.answer,
            explanation: block.explanation,
          },
        ]),
      ),
    };
  });
