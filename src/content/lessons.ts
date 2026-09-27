import {
  courseLessons,
  pathCourses,
  type CareerPath,
  type Course,
  type LessonMeta,
} from "./curriculum";
import { lessonManifest } from "./lesson-manifest.gen";
import type { ChallengeLanguage } from "@/lib/code-runner";
import type { SqlDataset } from "./datasets/sql";

export type LessonBlock =
  | { kind: "text"; body: string }
  | { kind: "callout"; body: string }
  | { kind: "code"; language: string; code: string; caption?: string }
  | {
      kind: "mcq";
      id: string;
      question: string;
      options: string[];
      answer: number;
      explanation: string;
    }
  | {
      kind: "fill";
      id: string;
      prompt: string;
      before: string;
      after: string;
      answer: string;
      /** Other answers that are equally right (spacing and case never matter). */
      accept?: string[] | undefined;
      explanation: string;
    }
  | {
      kind: "challenge";
      id: string;
      title: string;
      prompt: string;
      language: ChallengeLanguage;
      /** Excel challenges only: which sheet in datasets/sheets.ts to start from. */
      sheet?: string | undefined;
      /** DOM challenges only: the fixed page markup the learner's script works on. */
      html?: string | undefined;
      /** SQL challenges only: which database in datasets/sql.ts to run against (default shop). */
      dataset?: SqlDataset | undefined;
      starter: string;
      hint: string;
      solution: string;
      tests: { name: string; expression: string }[];
    };

export interface LessonBody {
  summary: string;
  xp: number;
  /**
   * The learner does this one in their own tools and tells us it's done. Must
   * be declared, not inferred: a lesson that asks nothing because its author
   * forgot the question looks identical to one that asks nothing on purpose,
   * and only the second should quietly stop counting towards a certificate.
   */
  attested?: true;
  blocks: LessonBlock[];
}

/**
 * What the browser is allowed to see of a lesson: every answer, explanation and
 * reference solution removed. Challenge `tests` stay because the runner executes
 * them in the browser — they say what the code must do, not how.
 */
export type PublicLessonBlock =
  | Extract<LessonBlock, { kind: "text" | "callout" | "code" }>
  | Omit<Extract<LessonBlock, { kind: "mcq" }>, "answer" | "explanation">
  | Omit<Extract<LessonBlock, { kind: "fill" }>, "answer" | "accept" | "explanation">
  | Omit<Extract<LessonBlock, { kind: "challenge" }>, "solution">;

/** A public question — what the learner answers, without what counts as right. */
export type PublicGradableBlock = Extract<PublicLessonBlock, { kind: "mcq" | "fill" }>;

export interface PublicLessonBody {
  summary: string;
  xp: number;
  attested?: true;
  blocks: PublicLessonBlock[];
}

export function toPublicBlock(block: LessonBlock): PublicLessonBlock {
  switch (block.kind) {
    case "mcq": {
      const { answer: _answer, explanation: _explanation, ...rest } = block;
      return rest;
    }
    case "fill": {
      const { answer: _answer, accept: _accept, explanation: _explanation, ...rest } = block;
      return rest;
    }
    case "challenge": {
      const { solution: _solution, ...rest } = block;
      return rest;
    }
    default:
      return block;
  }
}

export const toPublicBody = (body: LessonBody): PublicLessonBody => ({
  summary: body.summary,
  xp: body.xp,
  ...(body.attested ? { attested: true as const } : {}),
  blocks: body.blocks.map(toPublicBlock),
});

/** A question block, full or public: the blocks a learner answers. */
export const isQuestion = <B extends { kind: string }>(
  block: B,
): block is Extract<B, { kind: "mcq" | "fill" }> => block.kind === "mcq" || block.kind === "fill";

/**
 * Each question with the code block directly above it, if any. Questions are
 * written against that block ("What does this mean?"), so anywhere a question
 * is shown away from its lesson — /review — it has to travel with it.
 */
export function questionsWithScenario<B extends { kind: string }>(blocks: B[]) {
  return blocks.flatMap((block, i) => {
    if (!isQuestion(block)) return [];
    const prev = blocks[i - 1];
    const scenario = prev?.kind === "code" ? (prev as Extract<B, { kind: "code" }>) : undefined;
    return [{ question: block, scenario }];
  });
}

/** The facts about a lesson that pages outside the lesson itself need. */
export interface LessonManifestEntry {
  challenge: boolean;
  questions: number;
  /** Present only when true, to keep the generated file readable. */
  attested?: true;
}

export const manifestEntry = (body: LessonBody): LessonManifestEntry => ({
  challenge: body.blocks.some((b) => b.kind === "challenge"),
  questions: body.blocks.filter(isQuestion).length,
  ...(body.attested ? { attested: true as const } : {}),
});

/**
 * Only lessons with an authored body are "live". Everything else on a roadmap is
 * unwritten and stays that way until someone writes it: it cannot be opened,
 * awards no XP, counts in no progress denominator, and blocks the certificate
 * for its path. Generated filler used to fill these slots and pay out XP, which
 * quietly certified nothing. The browser knows which lessons are live from the
 * generated manifest, never from the bodies themselves.
 */
export const isLessonLive = (lessonId: string) => lessonId in lessonManifest;

/** How many questions a lesson asks — 0 for an unwritten one, which can't be reviewed. */
export const lessonQuestionCount = (lessonId: string) => lessonManifest[lessonId]?.questions ?? 0;

/**
 * Whether anything a learner does in this lesson is actually checked. A lesson
 * marked `attested` is not: the work happens in the learner's own tools and the
 * platform only has their word for it. That is a fine way to teach, but it is
 * not evidence, so it earns no certificate — see `pathCompletion`.
 *
 * A lesson that asks nothing and declares nothing is an authoring mistake, not
 * a third category; `tests/lessons.test.ts` fails on it rather than letting it
 * slip silently out of the certificate denominator.
 */
export const isLessonAssessed = (lessonId: string) => {
  const entry = lessonManifest[lessonId];
  return Boolean(entry && !entry.attested);
};

/**
 * What the learner is actually handed when they open this lesson.
 *
 * Read from the manifest, never from `LessonMeta.type`. The declared type is
 * authored intent and drifts: 131 of the catalog's lessons disagree with their
 * own body, including every Claude Operator task, which is typed `"challenge"`
 * and has no code runner at all. A `type` that decided an icon put a wrench on
 * a lesson with an editor and an editor on a lesson that asks you to go and do
 * something in your own terminal. `type` still describes the lesson for
 * analytics; it no longer decides what the reader is promised.
 */
export type LessonShape = "unwritten" | "attested" | "challenge" | "questions" | "reading";

export const lessonShape = (lessonId: string): LessonShape => {
  const entry = lessonManifest[lessonId];
  if (!entry) return "unwritten";
  if (entry.attested) return "attested";
  if (entry.challenge) return "challenge";
  if (entry.questions > 0) return "questions";
  return "reading";
};

/**
 * Cached per course: the curriculum and the manifest are both static, and the
 * catalog re-derives this on every keystroke for every course — which now means
 * walking a 172-lesson course to render one badge.
 */
const liveLessonCache = new WeakMap<Course, LessonMeta[]>();

export const liveLessons = (course: Course): LessonMeta[] => {
  const cached = liveLessonCache.get(course);
  if (cached) return cached;
  const live = courseLessons(course).filter((l) => isLessonLive(l.id));
  liveLessonCache.set(course, live);
  return live;
};

export const liveLessonCount = (course: Course) => liveLessons(course).length;

export const isCoursePublished = (course: Course) =>
  liveLessonCount(course) === courseLessons(course).length;

export const pathLiveLessons = (path: CareerPath): LessonMeta[] =>
  pathCourses(path).flatMap(liveLessons);

export const pathLiveLessonCount = (path: CareerPath) => pathLiveLessons(path).length;

/** A path can only issue a certificate once every lesson in it is written. */
export const isPathPublished = (path: CareerPath) => {
  const list = pathCourses(path);
  return list.length > 0 && list.every(isCoursePublished);
};

// Course figures are derived from what is written, never authored. Courses
// used to carry a hand-typed rating, learner count and length ("8 hours" for a
// course with nothing in it), which a real learner reads as fact.

/** Estimated minutes to work through the written lessons. */
export const liveMinutes = (course: Course) =>
  liveLessons(course).reduce((sum, lesson) => sum + lesson.minutes, 0);

/** Written lessons with a coding challenge the runner actually checks. */
export const liveChallengeCount = (course: Course) =>
  liveLessons(course).filter((lesson) => lessonManifest[lesson.id]?.challenge).length;

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** First live lesson in the course the learner has not finished yet. */
export const nextLiveLesson = (course: Course, done: Set<string>) =>
  liveLessons(course).find((l) => !done.has(l.id)) ?? null;
