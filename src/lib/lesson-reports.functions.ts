import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { findLesson } from "@/content/curriculum";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * "Report a problem" from inside a lesson. The report carries what the learner
 * had on screen (their code, the last run, their own answers) so a grader bug
 * can be replayed instead of argued about. Nothing here is the answer key: the
 * browser only ever had the public body.
 */

/** Enough for a bad day with a broken course; not enough to flood the queue. */
const REPORTS_PER_DAY = 10;

export const LESSON_REPORT_KINDS = ["grader", "content", "broken", "other"] as const;
export type LessonReportKind = (typeof LESSON_REPORT_KINDS)[number];

const lessonReportSchema = z
  .object({
    courseId: z.string().min(1).max(100),
    lessonId: z.string().min(1).max(200),
    kind: z.enum(LESSON_REPORT_KINDS),
    message: z.string().trim().max(2000),
    code: z.string().max(50_000).nullable(),
    run: z
      .object({
        engine: z.string().max(40),
        passed: z.boolean(),
        error: z.string().max(2000).nullable(),
        tests: z
          .array(
            z.object({
              name: z.string().max(300),
              passed: z.boolean(),
              detail: z.string().max(500).nullable(),
            }),
          )
          .max(50),
      })
      .nullable(),
    answers: z.record(z.string().max(100), z.union([z.number(), z.string().max(500)])),
    verdicts: z.record(z.string().max(100), z.boolean()),
    solved: z.boolean(),
    userAgent: z.string().max(400),
    viewport: z.string().max(40),
  })
  // Mirrors the table's check, so the learner gets a sentence instead of a 23514.
  .refine((r) => r.kind === "grader" || r.message.length >= 10, {
    message: "Tell us a little more: at least 10 characters.",
    path: ["message"],
  });

export type LessonReportInput = z.input<typeof lessonReportSchema>;

export const reportLessonProblemFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => lessonReportSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    if (!findLesson(data.courseId, data.lessonId)) throw new Error("That lesson doesn't exist.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from("lesson_reports")
      .select("id", { count: "exact", head: true })
      .eq("reporter_id", context.userId)
      .gte("created_at", since);
    if (countError) throw new Error("Your report could not be sent. Try again.");
    if ((count ?? 0) >= REPORTS_PER_DAY) {
      throw new Error("You've sent a lot of reports today. Thank you; we'll read them first.");
    }

    const { data: row, error } = await supabaseAdmin
      .from("lesson_reports")
      .insert({
        reporter_id: context.userId,
        course_id: data.courseId,
        lesson_id: data.lessonId,
        kind: data.kind,
        message: data.message,
        code: data.code,
        context: {
          run: data.run,
          answers: data.answers,
          verdicts: data.verdicts,
          solved: data.solved,
          userAgent: data.userAgent,
          viewport: data.viewport,
        },
      })
      .select("id")
      .single();
    if (error || !row) {
      console.error("[lesson-reports] insert failed", error?.message);
      throw new Error("Your report could not be sent. Try again.");
    }
    return { id: row.id };
  });
