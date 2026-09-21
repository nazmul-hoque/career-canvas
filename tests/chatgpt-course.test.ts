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
  pathLiveLessons,
} from "../src/content/lessons";
import { pathCompletion } from "../src/lib/certificates";
import { isReviewable } from "../src/lib/lesson-grading";

describe("ChatGPT operator course", () => {
  test("is discoverable with every task live and every level ending in a capstone", () => {
    expect(courses).toContain(chatgptCourse);
    expect(isCoursePublished(chatgptCourse)).toBe(true);
    const lessons = courseLessons(chatgptCourse);
    expect(lessons).toHaveLength(60);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(60);
    expect(chatgptCourse.modules).toHaveLength(6);
    for (const module of chatgptCourse.modules) {
      expect(module.lessons.at(-1)?.type).toBe("project");
      expect(module.lessons.at(-1)!.minutes).toBeGreaterThan(module.lessons[0].minutes);
    }
    for (const lesson of lessons) {
      expect(isLessonLive(lesson.id)).toBe(true);
      const body = getLessonBody(chatgptCourse.id, lesson.id)!;
      expect(body).toBeTruthy();
      expect(body.summary.length).toBeGreaterThan(30);
      expect(
        body.blocks.some(
          (block) => block.kind === "callout" && block.body.includes("Keep this evidence:"),
        ),
      ).toBe(true);
      expect(getLessonBody("claude-operator", lesson.id)).toBeNull();
    }
  });

  test("keeps generated metadata current without shipping task prose", () => {
    expect(chatgptModules).toEqual(chatgptModulesFromLevels());
    const source = readFileSync(
      new URL("../src/content/chatgpt-course.gen.ts", import.meta.url),
      "utf8",
    );
    for (const level of chatgptLevels) {
      expect(source).not.toContain(level.guide);
      for (const task of level.tasks) expect(source).not.toContain(task.mission);
    }
  });

  test("completion earns self-directed progress, not an assessed credential", () => {
    for (const lesson of courseLessons(chatgptCourse)) {
      const body = getLessonBody(chatgptCourse.id, lesson.id)!;
      expect(body.attested).toBe(true);
      expect(body.xp).toBe(ATTESTED_XP);
      expect(isLessonAssessed(lesson.id)).toBe(false);
      expect(isReviewable(body)).toBe(false);
    }
    const path = careerPaths.find((candidate) => candidate.id === "chatgpt-operator")!;
    expect(isPathPublished(path)).toBe(true);
    expect(path.courseIds).toContain(chatgptCourse.id);
    const completed = new Set(pathLiveLessons(path).map((lesson) => lesson.id));
    const completion = pathCompletion(path, completed);
    expect(completion.percent).toBe(100);
    expect(completion.credential).toBe("self-directed");
  });
});
