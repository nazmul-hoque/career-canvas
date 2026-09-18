import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { findLesson } from "@/content/curriculum";
import { getLessonBody } from "@/content/lessons";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { entitlementsFor, planState } from "@/lib/entitlements";
import { scriptedMentorReply, type MentorContext } from "@/lib/mentor";
import { summariseLearnerHistory } from "@/lib/mentor-history";

/**
 * The AI mentor.
 *
 * Runs server-side for three reasons: the model API key never belongs in a
 * browser bundle, each reply costs money so usage has to be metered per plan,
 * and the lesson's authored content makes a far better system prompt than
 * anything the client could be trusted to send.
 *
 * With no MENTOR_PROVIDER configured it falls back to the scripted mentor, so
 * the app still works out of the box — see src/lib/mentor-providers.server.ts.
 */

/** Turns of history sent back to the model. Older turns stay in the database. */
const HISTORY_TURNS = 12;

/** Progress and review rows read to summarise the learner's history. */
const HISTORY_ROWS = 200;

/** Failed challenge runs before the mentor may show a worked solution. */
const REVEAL_AFTER_ATTEMPTS = 3;

const mentorReplySchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  question: z.string().min(1).max(2000),
  /**
   * Failed challenge runs in this sitting. Client-reported on purpose: it only
   * decides when the mentor stops withholding the answer, and completing the
   * lesson still requires passing the tests.
   */
  failedAttempts: z.number().int().min(0).max(100).default(0),
  code: z.string().max(20_000).optional(),
  language: z.string().max(40).optional(),
  lastError: z.string().max(2000).nullable().optional(),
  failingTests: z.array(z.string().max(200)).max(20).default([]),
});

export type MentorReply = {
  reply: string;
  provider: string;
  remaining: number;
};

function monthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function buildSystemPrompt(input: {
  courseTitle: string;
  lessonTitle: string;
  lessonSummary: string;
  lessonText: string;
  mayReveal: boolean;
  language?: string | undefined;
  learnerHistory: string | null;
}): string {
  return [
    "You are the AI mentor inside Ascent, an interactive platform where people learn to code by doing.",
    "",
    `The learner is working through "${input.lessonTitle}" in the course "${input.courseTitle}".`,
    `Lesson summary: ${input.lessonSummary}`,
    "",
    "Lesson material the learner has in front of them:",
    input.lessonText,
    "",
    ...(input.learnerHistory
      ? [
          "What you know about this learner from their progress and reviews:",
          input.learnerHistory,
          "Use it only where it helps — connect to something they keep forgetting, or build on something they know. Never recite it back to them.",
          "",
        ]
      : []),
    "How to teach:",
    "- Be Socratic. Ask the question the learner is missing rather than handing over the answer.",
    "- One idea per reply. Two or three short paragraphs at most, no lecture.",
    "- When they share code, point at the specific line and ask what they expect it to produce.",
    "- When they hit an error, read it with them: what was it trying to do, and to what value?",
    "- Never be discouraging. Being stuck is the normal state of learning to program.",
    input.mayReveal
      ? `- They have failed this challenge at least ${REVEAL_AFTER_ATTEMPTS} times. Stop withholding: show a worked solution, explain each line, and then ask one question that checks they understood it rather than copied it.`
      : "- Do not give the complete solution yet, however directly they ask. Give the next step, a hint, or a question that unblocks them.",
    input.language ? `- Their code is ${input.language}.` : "",
    "",
    "Answer in plain prose. Use short code snippets only when they clarify the point.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Lesson prose, trimmed to what is useful as context. */
function lessonTextFor(courseId: string, lessonId: string): string {
  const body = getLessonBody(courseId, lessonId);
  if (!body) return "";
  return body.blocks
    .map((block) => {
      if (block.kind === "text" || block.kind === "callout") return block.body;
      if (block.kind === "code") return `Example (${block.language}):\n${block.code}`;
      if (block.kind === "challenge") return `Challenge: ${block.title}\n${block.prompt}`;
      return "";
    })
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 6000);
}

export const mentorReplyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => mentorReplySchema.parse(input))
  .handler(async ({ data, context }): Promise<MentorReply> => {
    const userId = context.userId;
    const found = findLesson(data.courseId, data.lessonId);
    if (!found) throw new Error("That lesson doesn't exist.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, trial_ends_at")
      .eq("id", userId)
      .maybeSingle();

    // Allowances live in one place: src/lib/entitlements.ts.
    const cap = entitlementsFor(planState(profile).plan).mentorMessagesPerMonth;

    const { count: usedThisMonth } = await supabaseAdmin
      .from("mentor_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "user")
      .gte("created_at", monthStart());

    const used = usedThisMonth ?? 0;
    if (used >= cap) {
      throw new Error(
        `You've used all ${cap} mentor messages on your plan this month. They reset on the 1st.`,
      );
    }

    const { data: priorRows } = await supabaseAdmin
      .from("mentor_messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("lesson_id", data.lessonId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_TURNS);

    const history = ((priorRows ?? []) as { role: string; content: string }[])
      .reverse()
      .map((row) => ({
        role: row.role === "mentor" ? ("assistant" as const) : ("user" as const),
        content: row.content,
      }));

    // What the learner is looking at right now — appended to their question so
    // the model sees the code and the error without a second round trip.
    const situation = [
      data.code?.trim() ? `My current code:\n\`\`\`\n${data.code.trim()}\n\`\`\`` : "",
      data.lastError ? `The error I'm getting: ${data.lastError}` : "",
      data.failingTests.length ? `Failing tests: ${data.failingTests.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const userContent = situation ? `${data.question}\n\n${situation}` : data.question;

    const { getMentorProvider } = await import("@/lib/mentor-providers.server");
    const provider = getMentorProvider();

    let reply: string;
    if (provider) {
      // Only fetched when a model will read it — the scripted mentor ignores it.
      const [{ data: progressRows }, { data: reviewRows }] = await Promise.all([
        supabaseAdmin
          .from("lesson_progress")
          .select("course_id, lesson_id, completed_at")
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })
          .limit(HISTORY_ROWS),
        supabaseAdmin
          .from("review_items")
          .select("course_id, lesson_id, lapses, streak, due_on")
          .eq("user_id", userId)
          .limit(HISTORY_ROWS),
      ]);
      const learnerHistory = summariseLearnerHistory({
        currentLessonId: data.lessonId,
        progress: progressRows ?? [],
        reviews: reviewRows ?? [],
        today: new Date().toISOString().slice(0, 10),
      });

      const system = buildSystemPrompt({
        courseTitle: found.course.title,
        lessonTitle: found.lesson.title,
        lessonSummary: getLessonBody(data.courseId, data.lessonId)?.summary ?? "",
        lessonText: lessonTextFor(data.courseId, data.lessonId),
        mayReveal: data.failedAttempts >= REVEAL_AFTER_ATTEMPTS,
        language: data.language,
        learnerHistory,
      });
      reply = await provider.complete({
        system,
        messages: [...history, { role: "user", content: userContent }],
      });
    } else {
      // No model configured — the scripted mentor keeps the feature usable.
      const ctx: MentorContext = {
        lessonTitle: found.lesson.title,
        courseTitle: found.course.title,
        code: data.code,
        language: data.language,
        lastError: data.lastError ?? null,
        failingTests: data.failingTests,
      };
      reply = await scriptedMentorReply(data.question, ctx);
    }

    if (!reply.trim()) {
      throw new Error("The mentor came back empty-handed. Try asking again.");
    }

    await supabaseAdmin.from("mentor_messages").insert([
      {
        user_id: userId,
        course_id: data.courseId,
        lesson_id: data.lessonId,
        role: "user",
        content: data.question,
      },
      {
        user_id: userId,
        course_id: data.courseId,
        lesson_id: data.lessonId,
        role: "mentor",
        content: reply,
        provider: provider?.name ?? "scripted",
        model: provider?.model ?? null,
      },
    ]);

    return {
      reply,
      provider: provider?.name ?? "scripted",
      remaining: Math.max(0, cap - used - 1),
    };
  });
