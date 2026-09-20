import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { Database } from "bun:sqlite";

import { careerPaths, courseLessons, courses, pathCourses } from "../src/content/curriculum";
import { SHOP_SQL } from "../src/content/datasets/shop";
import { bodies, getLessonBody } from "../src/content/lesson-bodies.server";
import { renderManifest } from "../src/content/lesson-manifest.server";
import { ATTESTED_XP } from "../src/content/gamification";
import {
  isCoursePublished,
  isLessonAssessed,
  isLessonLive,
  isQuestion,
  lessonShape,
  lessonQuestionCount,
  isPathPublished,
  liveMinutes,
  liveLessons,
  nextLiveLesson,
  pathLiveLessons,
  toPublicBody,
} from "../src/content/lessons";
import { allPathCompletions, certificateId, pathCompletion } from "../src/lib/certificates";
import { isReviewable } from "../src/lib/lesson-grading";
import { claudeCourse } from "../src/content/claude-course";
import { claudeModules } from "../src/content/claude-course.gen";
import { claudeLevels, claudeModulesFromLevels } from "../src/content/claude-levels.server";

/**
 * The rule these protect: a lesson exists only if someone wrote it. Filler used
 * to fill the gaps and pay out XP for it, which certified nothing. If one of
 * these fails, the platform has started claiming credit for unwritten work.
 */

const liveIds = () => new Set(courses.flatMap(liveLessons).map((l) => l.id));

describe("every authored lesson", () => {
  /**
   * The gap `attested` exists to close: a lesson that asks nothing and runs
   * nothing is either self-attested on purpose or missing its question, and
   * those look identical from the outside. Declaring it means the second case
   * fails here instead of quietly dropping out of certificate eligibility.
   */
  test("either assesses something or says it is self-attested", () => {
    for (const [id, body] of Object.entries(bodies)) {
      const asks =
        body.blocks.some((block) => block.kind === "challenge") ||
        body.blocks.some(isQuestion).valueOf();
      if (!asks && !body.attested) {
        throw new Error(
          `${id} asks no question and runs no challenge, but isn't marked attested. ` +
            "Add a question, add a challenge, or set attested: true.",
        );
      }
      expect(isLessonAssessed(id)).toBe(!body.attested);
    }
  });

  test("self-attested lessons never pay more than unchecked work is worth", () => {
    for (const [id, body] of Object.entries(bodies)) {
      if (body.attested) expect(body.xp).toBeLessThanOrEqual(ATTESTED_XP);
      expect(isReviewable(body)).toBe(isLessonAssessed(id) && lessonQuestionCount(id) > 0);
    }
  });
});

describe("Claude operator course", () => {
  test("contains the promised 172 tasks in the exact level split", () => {
    expect(claudeLevels.map((level) => level.tasks.length)).toEqual([20, 32, 35, 25, 35, 25]);
    expect(courseLessons(claudeCourse)).toHaveLength(172);
  });

  test("every task has a unique id and an authored body", () => {
    const lessons = courseLessons(claudeCourse);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(172);

    for (const lesson of lessons) {
      const body = getLessonBody(claudeCourse.id, lesson.id);
      expect(body).not.toBeNull();
      expect(body?.summary.trim().length).toBeGreaterThan(20);
      // The mission, the evidence to keep, and the level's safety note.
      expect(body?.blocks.length).toBeGreaterThanOrEqual(3);
    }
  });

  test("the committed course skeleton matches the authored levels", () => {
    expect(claudeModules).toEqual(claudeModulesFromLevels());
  });

  /**
   * The course is done in the learner's own tools, so nothing in it can be
   * marked. That has to stay true in the data, not just in the prose: the
   * moment one of these tasks asks a gradable question it starts paying review
   * XP and counting towards a certificate for work nobody checked.
   */
  test("tasks are self-attested: nothing is graded, so nothing is certified", () => {
    const lessons = courseLessons(claudeCourse);

    for (const lesson of lessons) {
      const body = getLessonBody(claudeCourse.id, lesson.id)!;
      expect(body.blocks.some((block) => block.kind === "mcq" || block.kind === "fill")).toBe(
        false,
      );
      expect(body.blocks.some((block) => block.kind === "challenge")).toBe(false);
      expect(isLessonAssessed(lesson.id)).toBe(false);
      expect(isReviewable(body)).toBe(false);
    }

    const path = careerPaths.find((p) => p.id === "claude-operator")!;
    const everyLessonDone = new Set(pathLiveLessons(path).map((l) => l.id));
    const completion = pathCompletion(path, everyLessonDone);
    expect(completion.percent).toBe(100);
    expect(completion.credential).toBe("self-directed");
  });

  test("self-reported tasks stay a small fraction of the catalog's XP", () => {
    const claudeXp = courseLessons(claudeCourse).reduce(
      (sum, lesson) => sum + (bodies[lesson.id]?.xp ?? 0),
      0,
    );
    const assessedXp = Object.entries(bodies)
      .filter(([id]) => isLessonAssessed(id))
      .reduce((sum, [, body]) => sum + body.xp, 0);

    for (const lesson of courseLessons(claudeCourse)) {
      expect(bodies[lesson.id]?.xp).toBe(15);
    }
    expect(claudeXp).toBeLessThan(assessedXp / 2);
  });

  test("no task prose reaches the client course module", () => {
    const clientSource = readFileSync(
      new URL("../src/content/claude-course.gen.ts", import.meta.url),
      "utf8",
    );
    // A phrase that only ever appears in an authored mission.
    expect(clientSource).not.toContain("Keep this evidence");
    for (const level of claudeLevels) {
      expect(clientSource).not.toContain(level.guide);
      expect(clientSource).not.toContain(level.safety);
      for (const task of level.tasks) expect(clientSource).not.toContain(task.mission);
    }
  });

  test("the course and its path are discoverable", () => {
    expect(courses.some((course) => course.id === claudeCourse.id)).toBe(true);
    expect(
      careerPaths.some(
        (path) => path.id === "claude-operator" && path.courseIds.includes(claudeCourse.id),
      ),
    ).toBe(true);
  });
});

/**
 * Every rewritten course owes the same four things: a teaching order, realistic
 * scope, active assessment in every lesson, and checkpoints whose starters are
 * sparse enough that passing them shows transfer rather than editing. One table
 * so a fifth course is a row, not another copy of these three tests.
 */
const LEARNING_DESIGNS = [
  {
    courseId: "python",
    lessonCount: 15,
    minMinutes: 240,
    lastLessonId: "py-project.inventory",
    minFills: 6,
    /** [taught first, relies on it] */
    order: [
      ["py-basics.functions", "py-basics.flow"],
      ["py-collections.lists", "py-collections.loops"],
    ],
    /** [checkpoint body, what a sparse starter must not hand the learner] */
    sparse: [
      ["py-basics.checkpoint", "def "],
      ["py-collections.checkpoint", "def "],
    ],
  },
  {
    courseId: "html-css",
    lessonCount: 15,
    minMinutes: 300,
    lastLessonId: "html-project.trail-guide",
    minFills: 6,
    order: [
      ["css-core.selectors", "css-core.cascade"],
      ["css-core.accessibility", "css-core.checkpoint"],
    ],
    sparse: [
      ["html-basics.checkpoint", "<html"],
      ["html-project.trail-guide", "<style"],
    ],
  },
  {
    courseId: "javascript",
    lessonCount: 16,
    minMinutes: 330,
    lastLessonId: "js-project.catalog",
    minFills: 6,
    order: [
      ["js-basics.conditionals", "js-basics.checkpoint"],
      ["js-data.transform", "js-data.checkpoint"],
      ["js-browser.run", "js-dom.select"],
    ],
    sparse: [
      ["js-basics.checkpoint", "function "],
      ["js-data.checkpoint", "function "],
      ["js-dom.checkpoint", "addEventListener"],
      ["js-project.catalog", "addEventListener"],
    ],
  },
  {
    courseId: "typescript",
    lessonCount: 12,
    minMinutes: 330,
    lastLessonId: "ts-project.release",
    minFills: 10,
    order: [
      ["ts-core.nullable", "ts-core.checkpoint"],
      ["ts-apps.generics", "ts-apps.utilities"],
      ["ts-boundaries.unknown", "ts-boundaries.checkpoint"],
    ],
    sparse: [
      ["ts-core.checkpoint", "function "],
      ["ts-boundaries.checkpoint", "function "],
      ["ts-project.release", "function "],
    ],
  },
  {
    courseId: "react",
    lessonCount: 14,
    minMinutes: 350,
    lastLessonId: "react-project.support",
    minFills: 5,
    order: [
      ["react-core.state", "react-core.checkpoint"],
      ["react-hooks.effect", "react-hooks.reducer"],
      ["react-data.fetch", "react-data.checkpoint"],
      ["react-quality.accessibility", "react-project.support"],
    ],
    sparse: [
      ["react-core.checkpoint", "function InventoryApp"],
      ["react-data.checkpoint", "function OrderDashboard"],
      ["react-quality.testing", "function QuantityPicker"],
      ["react-project.support", "function SupportDesk"],
    ],
  },
] as const;

describe.each(LEARNING_DESIGNS)(
  "$courseId learning design",
  ({ courseId, lessonCount, minMinutes, lastLessonId, minFills, order, sparse }) => {
    const course = courses.find((item) => item.id === courseId)!;
    const lessons = courseLessons(course);

    test("teaches each idea before the lesson that relies on it", () => {
      const ids = lessons.map((lesson) => lesson.id);
      for (const [taught, relies] of order) {
        expect(ids.indexOf(taught)).toBeGreaterThanOrEqual(0);
        expect(ids.indexOf(taught)).toBeLessThan(ids.indexOf(relies));
      }
    });

    test("has realistic scope and active assessment in every lesson", () => {
      expect(lessons).toHaveLength(lessonCount);
      expect(liveMinutes(course)).toBeGreaterThanOrEqual(minMinutes);

      for (const lesson of lessons) {
        const body = getLessonBody(course.id, lesson.id);
        expect(body?.blocks.some((block) => block.kind === "challenge")).toBe(true);
        expect(body?.blocks.some((block) => block.kind === "mcq" || block.kind === "fill")).toBe(
          true,
        );
      }
    });

    test("ends with an independent capstone reached through sparse checkpoints", () => {
      expect(lessons.at(-1)?.id).toBe(lastLessonId);

      for (const [id, forbidden] of sparse) {
        const challenge = bodies[id]!.blocks.find((block) => block.kind === "challenge");
        expect(challenge?.kind).toBe("challenge");
        if (challenge?.kind === "challenge") expect(challenge.starter).not.toContain(forbidden);
      }

      const fills = lessons.flatMap((lesson) =>
        bodies[lesson.id]!.blocks.filter((block) => block.kind === "fill"),
      );
      expect(fills.length).toBeGreaterThanOrEqual(minFills);
    });
  },
);

describe("live vs unwritten lessons", () => {
  test("a lesson is live exactly when it has an authored body", () => {
    for (const course of courses) {
      for (const lesson of courseLessons(course)) {
        expect(isLessonLive(lesson.id)).toBe(getLessonBody(course.id, lesson.id) !== null);
      }
    }
  });

  test("unwritten lessons return no body rather than generated filler", () => {
    for (const course of courses) {
      for (const lesson of courseLessons(course)) {
        if (isLessonLive(lesson.id)) continue;
        expect(getLessonBody(course.id, lesson.id)).toBeNull();
      }
    }
  });

  test("live lessons are a subset of the roadmap, never an addition to it", () => {
    for (const course of courses) {
      const all = courseLessons(course).map((l) => l.id);
      for (const lesson of liveLessons(course)) expect(all).toContain(lesson.id);
    }
  });

  test("a course counts as published only when every one of its lessons is written", () => {
    for (const course of courses) {
      expect(isCoursePublished(course)).toBe(
        liveLessons(course).length === courseLessons(course).length,
      );
    }
  });

  test("nextLiveLesson never hands back an unwritten slot", () => {
    for (const course of courses) {
      const next = nextLiveLesson(course, new Set());
      if (next) expect(isLessonLive(next.id)).toBe(true);
    }
  });

  test("nextLiveLesson skips what is already done", () => {
    const course = courses.find((c) => liveLessons(c).length >= 1);
    if (!course) return;
    const first = liveLessons(course)[0]!;
    expect(nextLiveLesson(course, new Set([first.id]))?.id).not.toBe(first.id);
  });
});

describe("path completion", () => {
  test("progress is measured against what exists, not what is planned", () => {
    for (const path of careerPaths) {
      const done = liveIds();
      const result = pathCompletion(path, done);
      expect(result.completed).toBe(pathLiveLessons(path).length);
      expect(result.percent).toBe(result.live ? 100 : 0);
      // total counts the whole roadmap, including unwritten slots
      expect(result.total).toBeGreaterThanOrEqual(result.live);
    }
  });

  test("an unfinished path is never eligible for a certificate", () => {
    for (const path of careerPaths) {
      expect(pathCompletion(path, new Set()).credential).not.toBe("eligible");
    }
  });

  test("finishing every live lesson is not enough while the path is unwritten", () => {
    for (const path of careerPaths) {
      const result = pathCompletion(path, liveIds());
      if (result.published) continue;
      expect(result.completed).toBe(result.live);
      expect(result.credential).not.toBe("eligible");
    }
  });

  test("eligibility requires the path to be published", () => {
    for (const completion of allPathCompletions(liveIds())) {
      if (completion.eligible) {
        expect(completion.published).toBe(true);
        expect(isPathPublished(completion.path)).toBe(true);
        expect(completion.live).toBeGreaterThan(0);
      }
    }
  });

  test("a path with no courses is never publishable", () => {
    for (const path of careerPaths) {
      if (pathCourses(path).length === 0) expect(isPathPublished(path)).toBe(false);
    }
  });
});

describe("certificate ids", () => {
  test("the same learner and path always produce the same id", () => {
    const a = certificateId("user-1", "frontend");
    const b = certificateId("user-1", "frontend");
    expect(a).toBe(b);
  });

  test("different learners get different ids for the same path", () => {
    expect(certificateId("user-1", "frontend")).not.toBe(certificateId("user-2", "frontend"));
  });

  test("different paths get different ids for the same learner", () => {
    expect(certificateId("user-1", "frontend")).not.toBe(certificateId("user-1", "backend"));
  });

  test("ids are printable and carry the path", () => {
    const id = certificateId("user-1", "frontend");
    expect(id).toMatch(/^ASC-[A-Z0-9]{1,4}-[A-Z0-9]{7}$/);
  });
});

/**
 * The answer key stays on the server. The browser learns which lessons exist
 * from a generated manifest and sees lessons only through toPublicBody; if any
 * of these fail, answers can reach the page source or the client bundle.
 */
describe("answer key", () => {
  test("the committed manifest matches the authored lessons", async () => {
    const committed = await Bun.file(
      new URL("../src/content/lesson-manifest.gen.ts", import.meta.url),
    ).text();
    // Run `bun run lessons:manifest` when this fails.
    expect(committed).toBe(renderManifest());
  });

  test("a public lesson carries no answers, explanations or solutions", () => {
    for (const body of Object.values(bodies)) {
      const json = JSON.stringify(toPublicBody(body));
      for (const block of body.blocks) {
        if (block.kind === "mcq" || block.kind === "fill") {
          expect(json).not.toContain(JSON.stringify(block.explanation));
        }
        if (block.kind === "challenge") expect(json).not.toContain(JSON.stringify(block.solution));
      }
      for (const block of toPublicBody(body).blocks) {
        expect(block).not.toHaveProperty("answer");
        expect(block).not.toHaveProperty("accept");
        expect(block).not.toHaveProperty("explanation");
        expect(block).not.toHaveProperty("solution");
      }
    }
  });

  test("nothing that reaches the browser imports the bodies statically", async () => {
    const glob = new Bun.Glob("src/**/*.{ts,tsx}");
    const offenders: string[] = [];
    for await (const file of glob.scan(".")) {
      if (file.includes(".server.")) continue;
      const text = await Bun.file(file).text();
      // `await import(...)` inside a server handler is the allowed form.
      if (/^import[^;]*lesson-(bodies|manifest)\.server/m.test(text)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});

/**
 * Every SQL challenge must run against the shop dataset. This catches a broken
 * query or a dataset edit that removes a column; whether the solution passes
 * its (Python) tests is checked by `bun run lessons:verify`.
 */
describe("sql challenges", () => {
  const challenges = Object.entries(bodies).flatMap(([id, body]) =>
    body.blocks.flatMap((b) => (b.kind === "challenge" && b.language === "sql" ? [{ id, b }] : [])),
  );

  test("there are SQL challenges to check", () => {
    expect(challenges.length).toBeGreaterThan(0);
  });

  for (const { id, b } of challenges) {
    test(`${id}: solution and starter run on the shop dataset`, () => {
      const db = new Database(":memory:");
      db.exec(SHOP_SQL);
      expect(() => db.query(b.solution).all()).not.toThrow();
      expect(() => db.query(b.starter).all()).not.toThrow();
      db.close();
    });
  }
});

/**
 * The course page draws a lesson's icon from its shape, so a wrong shape is a
 * promise broken before the learner clicks. This guards the read itself: the
 * shape must come from the body, not from the authored `type`, which disagrees
 * with the body on 131 lessons and is kept only for analytics.
 */
describe("lessonShape", () => {
  const every = courses.flatMap((c) => c.modules.flatMap((m) => m.lessons));

  test("every lesson in the catalog has a written body", () => {
    const unwritten = every.filter((l) => lessonShape(l.id) === "unwritten");
    expect(unwritten.map((l) => l.id)).toEqual([]);
  });

  test("shape follows the body, not the declared type", () => {
    for (const [id, body] of Object.entries(bodies)) {
      const shape = lessonShape(id);
      if (body.attested) expect(shape).toBe("attested");
      else if (body.blocks.some((b) => b.kind === "challenge")) expect(shape).toBe("challenge");
      else expect(shape).toBe("questions");
    }
  });

  test("a lesson that was never written reports unwritten", () => {
    expect(lessonShape("html-basics.retired-slot")).toBe("unwritten");
  });
});
