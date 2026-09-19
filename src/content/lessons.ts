import {
  courseLessons,
  pathCourses,
  type CareerPath,
  type Course,
  type LessonMeta,
} from "./curriculum";
import { lessonManifest } from "./lesson-manifest.gen";

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
      explanation: string;
    }
  | {
      kind: "challenge";
      id: string;
      title: string;
      prompt: string;
      language: "javascript" | "python";
      starter: string;
      hint: string;
      solution: string;
      tests: { name: string; expression: string }[];
    };

export interface LessonBody {
  summary: string;
  xp: number;
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
  | Omit<Extract<LessonBlock, { kind: "fill" }>, "answer" | "explanation">
  | Omit<Extract<LessonBlock, { kind: "challenge" }>, "solution">;

/** A public question — what the learner answers, without what counts as right. */
export type PublicGradableBlock = Extract<PublicLessonBlock, { kind: "mcq" | "fill" }>;

export interface PublicLessonBody {
  summary: string;
  xp: number;
  blocks: PublicLessonBlock[];
}

export function toPublicBlock(block: LessonBlock): PublicLessonBlock {
  switch (block.kind) {
    case "mcq": {
      const { answer: _answer, explanation: _explanation, ...rest } = block;
      return rest;
    }
    case "fill": {
      const { answer: _answer, explanation: _explanation, ...rest } = block;
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
  blocks: body.blocks.map(toPublicBlock),
});

/** The facts about a lesson that pages outside the lesson itself need. */
export interface LessonManifestEntry {
  challenge: boolean;
  questions: number;
}

export const manifestEntry = (body: LessonBody): LessonManifestEntry => ({
  challenge: body.blocks.some((b) => b.kind === "challenge"),
  questions: body.blocks.filter((b) => b.kind === "mcq" || b.kind === "fill").length,
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

export const liveLessons = (course: Course): LessonMeta[] =>
  courseLessons(course).filter((l) => isLessonLive(l.id));

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
