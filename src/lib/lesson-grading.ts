/**
 * Answer checking, in one place.
 *
 * Both the lesson completion path and the spaced-review path re-check answers
 * against the authored lesson body on the server. Keeping the rule here means
 * there is exactly one definition of "got it right" — and one thing to test.
 *
 * Pure: no database, no request context.
 */
import { isQuestion, optionWhyNot, type LessonBlock, type LessonBody } from "@/content/lessons";
import { runGitChallenge } from "@/lib/git-sandbox";

export type Answers = Record<string, string | number>;

/** Blocks a learner can get right or wrong. Text and code blocks are not graded. */
export type GradableBlock = Extract<LessonBlock, { kind: "mcq" } | { kind: "fill" }>;

export const gradableBlocks = (body: LessonBody): GradableBlock[] => body.blocks.filter(isQuestion);

/**
 * Fill-in answers are code, and in code spacing around punctuation carries no
 * meaning: `flex :1`, `flex:1` and `flex: 1` are the same declaration, and
 * `n*2` is `n * 2`. So case and spacing are normalised away, except the single
 * space that separates two words (`if len` must not become `iflen`). A trailing
 * `;` is dropped because fill fields usually sit right before one.
 */
export function normaliseFill(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/;+$/, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([^\w\s])\s*/g, "$1")
    .trim();
}

export function isBlockCorrect(block: GradableBlock, answers: Answers): boolean {
  const given = answers[block.id];
  if (block.kind === "mcq") return given === block.answer;
  const typed = normaliseFill(String(given ?? ""));
  if (!typed) return false;
  return [block.answer, ...(block.accept ?? [])].some((ok) => normaliseFill(ok) === typed);
}

/**
 * Why the option a learner picked is wrong, if its author said. Null for a
 * right pick, an option with no note, or a fill: the note is about the mistake
 * in that one option, so it can be shown while the learner can still try again.
 */
export function whyNotFor(block: GradableBlock, given: string | number | undefined): string | null {
  if (block.kind !== "mcq" || typeof given !== "number" || given === block.answer) return null;
  return optionWhyNot(block.options[given]);
}

export interface AnswerVerdict {
  correct: boolean;
  /** Only when correct: on a wrong answer it would give the right one away. */
  explanation: string | null;
  /** Only when wrong, and only for the option picked. */
  whyNot: string | null;
}

export function answerVerdict(
  block: GradableBlock,
  given: string | number | undefined,
): AnswerVerdict {
  const correct = given !== undefined && isBlockCorrect(block, { [block.id]: given });
  return {
    correct,
    explanation: correct ? block.explanation : null,
    whyNot: correct ? null : whyNotFor(block, given),
  };
}

export interface GradeResult {
  ok: boolean;
  /** Learner-facing explanation of the first failure, if any. */
  reason: string | null;
  wrongBlockIds: string[];
}

/**
 * Completion grading: every question right, and any coding challenge passed.
 * For most languages `challengeSolved` is still the client's word — the runner
 * is a browser sandbox. A git challenge is different: its engine is plain
 * TypeScript, so the learner's transcript is replayed here and the flag is
 * ignored.
 */
export function gradeLesson(
  body: LessonBody,
  answers: Answers,
  challengeSolved: boolean,
  transcript?: string | undefined,
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

  const challenge = body.blocks.find((b) => b.kind === "challenge");
  const solved =
    challenge?.language === "git"
      ? gitChallengePassed(challenge, transcript ?? "")
      : challengeSolved;
  if (challenge && !solved) {
    return {
      ok: false,
      reason: "Pass the challenge tests before completing this lesson.",
      wrongBlockIds: [],
    };
  }

  return { ok: true, reason: null, wrongBlockIds: [] };
}

function gitChallengePassed(
  challenge: Extract<LessonBlock, { kind: "challenge" }>,
  transcript: string,
): boolean {
  const run = runGitChallenge(challenge.setup ?? "", transcript, challenge.tests);
  return !run.error && run.results.length > 0 && run.results.every((r) => r.passed);
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
    reason: wrongBlockIds.length ? "Not quite. This one comes back tomorrow." : null,
    wrongBlockIds,
  };
}

/** A lesson is only worth reviewing if it asked the learner something. */
export const isReviewable = (body: LessonBody): boolean => gradableBlocks(body).length > 0;
