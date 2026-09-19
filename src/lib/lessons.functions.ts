import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { pathById, pathCourses } from "@/content/curriculum";
import {
  isLessonLive,
  toPublicBlock,
  toPublicBody,
  type PublicGradableBlock,
  type PublicLessonBody,
} from "@/content/lessons";
import { gradableBlocks, isBlockCorrect } from "@/lib/lesson-grading";

/**
 * Lesson content, served without its answer key.
 *
 * The authored lessons live in `lesson-bodies.server.ts`, which the client
 * bundle can't import. Everything the browser shows of a lesson comes through
 * here with answers, explanations and reference solutions stripped, and an
 * answer is only ever judged here. An explanation is returned once the learner
 * has it right: on a wrong answer it would give the right one away.
 */

const lessonRef = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
});

export const getLessonFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => lessonRef.parse(input))
  .handler(async ({ data }): Promise<PublicLessonBody | null> => {
    const { getLessonBody } = await import("@/content/lesson-bodies.server");
    const body = getLessonBody(data.courseId, data.lessonId);
    return body ? toPublicBody(body) : null;
  });

const checkAnswerSchema = lessonRef.extend({
  blockId: z.string().min(1),
  answer: z.union([z.string(), z.number()]),
});

export interface CheckAnswerResult {
  correct: boolean;
  /** Only when correct. */
  explanation: string | null;
}

export const checkAnswerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => checkAnswerSchema.parse(input))
  .handler(async ({ data }): Promise<CheckAnswerResult> => {
    const { getLessonBody } = await import("@/content/lesson-bodies.server");
    const body = getLessonBody(data.courseId, data.lessonId);
    const block = body ? gradableBlocks(body).find((b) => b.id === data.blockId) : undefined;
    if (!block) throw new Error("That question doesn't exist.");
    const correct = isBlockCorrect(block, { [block.id]: data.answer });
    return { correct, explanation: correct ? block.explanation : null };
  });

/**
 * Placement questions: the first question of each written lesson on the path,
 * in roadmap order, capped so the check stays short. Keyed by lesson as well as
 * block, because block ids ("q1") repeat across lessons.
 */
const MAX_PLACEMENT_QUESTIONS = 10;

export interface PlacementQuestion {
  key: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  lessonTitle: string;
  block: PublicGradableBlock;
}

async function placementBlocks(pathId: string) {
  const path = pathById(pathId);
  if (!path) return [];
  const { getLessonBody } = await import("@/content/lesson-bodies.server");
  const out = [];
  for (const course of pathCourses(path)) {
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (!isLessonLive(lesson.id)) continue;
        const body = getLessonBody(course.id, lesson.id);
        const block = body ? gradableBlocks(body)[0] : undefined;
        if (!block) continue;
        out.push({ course, module, lesson, block, key: `${lesson.id}:${block.id}` });
      }
    }
  }
  return out.slice(0, MAX_PLACEMENT_QUESTIONS);
}

const pathRef = z.object({ pathId: z.string().min(1) });

export const getPlacementFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => pathRef.parse(input))
  .handler(async ({ data }): Promise<PlacementQuestion[]> =>
    (await placementBlocks(data.pathId)).map(({ course, module, lesson, block, key }) => ({
      key,
      courseId: course.id,
      moduleId: module.id,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      block: toPublicBlock(block) as PublicGradableBlock,
    })),
  );

const gradePlacementSchema = pathRef.extend({
  answers: z.record(z.union([z.string(), z.number()])).default({}),
});

export type PlacementGrades = Record<string, CheckAnswerResult>;

export const gradePlacementFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => gradePlacementSchema.parse(input))
  .handler(async ({ data }): Promise<PlacementGrades> => {
    const grades: PlacementGrades = {};
    for (const { block, key } of await placementBlocks(data.pathId)) {
      const given = data.answers[key];
      const correct = given !== undefined && isBlockCorrect(block, { [block.id]: given });
      grades[key] = { correct, explanation: correct ? block.explanation : null };
    }
    return grades;
  });
