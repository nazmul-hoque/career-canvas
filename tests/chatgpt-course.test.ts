import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { chatgptCourse } from "../src/content/chatgpt-course";
import { chatgptModules } from "../src/content/chatgpt-course.gen";
import { chatgptLevels, chatgptModulesFromLevels } from "../src/content/chatgpt-levels.server";
import { careerPaths, courseLessons, courses } from "../src/content/curriculum";
import { getLessonBody } from "../src/content/lesson-bodies.server";
import { ATTESTED_XP } from "../src/content/gamification";
import {
  isCoursePublished,
  isLessonAssessed,
  isLessonLive,
  isPathPublished,
  isQuestion,
  pathLiveLessons,
} from "../src/content/lessons";
import { pathCompletion } from "../src/lib/certificates";
import { isReviewable } from "../src/lib/lesson-grading";

describe("ChatGPT operator course", () => {
  test("is discoverable, fully live, and ends every level in a capstone", () => {
    expect(courses).toContain(chatgptCourse);
    expect(isCoursePublished(chatgptCourse)).toBe(true);
    const lessons = courseLessons(chatgptCourse);
    expect(lessons).toHaveLength(24);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(24);
    expect(chatgptCourse.modules).toHaveLength(6);

    for (const module of chatgptCourse.modules) {
      expect(module.lessons.at(-1)?.type).toBe("project");
      expect(module.lessons.at(-1)!.minutes).toBeGreaterThan(module.lessons[0]!.minutes);
    }

    for (const lesson of lessons) {
      expect(isLessonLive(lesson.id)).toBe(true);
      const body = getLessonBody(chatgptCourse.id, lesson.id)!;
      expect(body).toBeTruthy();
      expect(body.summary.length).toBeGreaterThan(30);
      // Lesson ids are namespaced per course, so one course's id must not
      // resolve against the other's bodies.
      expect(getLessonBody("claude-operator", lesson.id)).toBeNull();
    }
  });

  test("keeps generated metadata current without shipping prose or answers", () => {
    expect(chatgptModules).toEqual(chatgptModulesFromLevels());
    const source = readFileSync(
      new URL("../src/content/chatgpt-course.gen.ts", import.meta.url),
      "utf8",
    );
    for (const level of chatgptLevels) {
      for (const lesson of level.lessons) {
        expect(source).not.toContain(lesson.body.summary);
        for (const block of lesson.body.blocks) {
          if (block.kind === "mcq") {
            expect(source).not.toContain(block.question);
            expect(source).not.toContain(block.explanation);
          }
          if (block.kind === "text" || block.kind === "callout") {
            expect(source).not.toContain(block.body);
          }
        }
      }
    }
  });

  /**
   * The six capstones are build work in the learner's own account, so nothing
   * there can be marked. They keep the evidence callout the whole course is
   * written around, and they stay out of every assessed denominator.
   */
  test("capstones are self-attested and graded nowhere", () => {
    const attested = courseLessons(chatgptCourse).filter(
      (lesson) => getLessonBody(chatgptCourse.id, lesson.id)!.attested,
    );
    expect(attested.length).toBe(6);
    expect(attested.every((lesson) => lesson.id.endsWith(".capstone"))).toBe(true);

    for (const lesson of attested) {
      const body = getLessonBody(chatgptCourse.id, lesson.id)!;
      expect(body.xp).toBe(ATTESTED_XP);
      expect(body.blocks.some((block) => isQuestion(block))).toBe(false);
      expect(body.blocks.some((block) => block.kind === "challenge")).toBe(false);
      expect(isLessonAssessed(lesson.id)).toBe(false);
      expect(isReviewable(body)).toBe(false);
      expect(
        body.blocks.some(
          (block) => block.kind === "callout" && block.body.includes("Keep this evidence:"),
        ),
      ).toBe(true);
    }
  });

  test("the taught lessons are assessed, which lets the path certify", () => {
    const graded = chatgptLevels.flatMap((level) =>
      level.lessons.filter((lesson) => !lesson.body.attested),
    );
    expect(graded.length).toBe(18);

    for (const lesson of graded) {
      expect(lesson.body.xp).toBeGreaterThan(ATTESTED_XP);
      expect(lesson.body.blocks.filter((block) => isQuestion(block)).length).toBeGreaterThanOrEqual(
        2,
      );
      for (const block of lesson.body.blocks) {
        if (block.kind !== "mcq") continue;
        expect(block.options.length).toBeGreaterThanOrEqual(3);
        expect(block.explanation.length).toBeGreaterThan(40);
      }
    }

    for (const level of chatgptLevels) {
      for (const lesson of level.lessons.filter((l) => !l.body.attested)) {
        expect(isLessonAssessed(`${level.id}.${lesson.slug}`)).toBe(true);
      }
    }

    // Always guessing the same letter must not pass. The share matters, not
    // just the spread: the first draft used all four options and still had B
    // correct on 61% of questions.
    const answers = graded.flatMap((lesson) =>
      lesson.body.blocks.flatMap((block) => (block.kind === "mcq" ? [block.answer] : [])),
    );
    expect(new Set(answers).size).toBe(4);
    const commonest = Math.max(...[0, 1, 2, 3].map((i) => answers.filter((a) => a === i).length));
    expect(commonest / answers.length).toBeLessThan(0.35);

    const path = careerPaths.find((candidate) => candidate.id === "chatgpt-operator")!;
    expect(isPathPublished(path)).toBe(true);
    expect(path.courseIds).toContain(chatgptCourse.id);
    const completed = new Set(pathLiveLessons(path).map((lesson) => lesson.id));
    const completion = pathCompletion(path, completed);
    expect(completion.percent).toBe(100);
    expect(completion.credential).toBe("eligible");
  });
});
