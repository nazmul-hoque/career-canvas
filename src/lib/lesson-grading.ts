/**
 * Answer checking, in one place.
 *
 * Both the lesson completion path and the spaced-review path re-check answers
 * against the authored lesson body on the server. Keeping the rule here means
 * there is exactly one definition of "got it right" — and one thing to test.
 *
 * Pure: no database, no request context.
 */
import type { LessonBlock, LessonBody } from "@/content/lessons";

export type Answers = Record<string, string | number>;

/** Blocks a learner can get right or wrong. Text and code blocks are not graded. */
export type GradableBlock = Extract<LessonBlock, { kind: "mcq" } | { kind: "fill" }>;

export const gradableBlocks = (body: LessonBody): GradableBlock[] =>
  body.blocks.filter((b): b is GradableBlock => b.kind === "mcq" || b.kind === "fill");

export function isBlockCorrect(block: GradableBlock, answers: Answers): boolean {
  const given = answers[block.id];
  if (block.kind === "mcq") return given === block.answer;
  // Fill-in answers are compared loosely on case and surrounding space, and
  // strictly on everything else — "N * 2" is the same answer as "n * 2", but
  // "n*2" is a different string a learner did not type.
  return (
    String(given ?? "")
      .trim()
      .toLowerCase() === block.answer.trim().toLowerCase()
  );
}

export interface GradeResult {
  ok: boolean;
  /** Learner-facing explanation of the first failure, if any. */
  reason: string | null;
  wrongBlockIds: string[];
}

/**
 * Completion grading: every question right, and any coding challenge passed.
 * `challengeSolved` is still the client's word — the runner is a browser
 * sandbox — but the XP amount and everything else is not.
 */
export function gradeLesson(
  body: LessonBody,
  answers: Answers,
  challengeSolved: boolean,
): GradeResult {
  const wrongBlockIds = gradableBlocks(body)
    .filter((block) => !isBlockCorrect(block, answers))
    .map((block) => block.id);

  if (wrongBlockIds.length) {
    return {
      ok: false,
      reason: "Finish the questions in the lesson before completing it.",
      wrongBlockIds,
    };
  }

  if (body.blocks.some((b) => b.kind === "challenge") && !challengeSolved) {
    return {
      ok: false,
      reason: "Pass the challenge tests before completing this lesson.",
      wrongBlockIds: [],
    };
  }

  return { ok: true, reason: null, wrongBlockIds: [] };
}

/** Review grading: the questions only. A review never re-runs the challenge. */
export function gradeReview(body: LessonBody, answers: Answers): GradeResult {
  const blocks = gradableBlocks(body);
  if (!blocks.length) {
    return { ok: false, reason: "This lesson has no questions to review.", wrongBlockIds: [] };
  }

  const wrongBlockIds = blocks
    .filter((block) => !isBlockCorrect(block, answers))
    .map((block) => block.id);

  return {
    ok: wrongBlockIds.length === 0,
    reason: wrongBlockIds.length ? "Not quite — this one comes back tomorrow." : null,
    wrongBlockIds,
  };
}

/** A lesson is only worth reviewing if it asked the learner something. */
export const isReviewable = (body: LessonBody): boolean => gradableBlocks(body).length > 0;
