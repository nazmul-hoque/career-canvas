import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { Database } from "bun:sqlite";

import {
  careerPaths,
  courseLessons,
  courses,
  findLesson,
  movedLessonEntries,
  pathCourses,
} from "../src/content/curriculum";
import { sqlDataset, SQL_DATASETS } from "../src/content/datasets/sql";
import { bodies, getLessonBody } from "../src/content/lesson-bodies.server";
import { renderManifest } from "../src/content/lesson-manifest.server";
import { ATTESTED_XP } from "../src/content/gamification";
import {
  isCoursePublished,
  isLessonAssessed,
  isLessonLive,
  isQuestion,
  questionsWithScenario,
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

  /**
   * A body with no slot on any roadmap is unreachable: no page links to it, it
   * earns nothing, and every other check here still passes. Easy to cause by
   * renaming a module or forgetting the curriculum edit.
   */
  test("has a place on some course's roadmap", () => {
    const onRoadmap = new Set(courses.flatMap((c) => courseLessons(c).map((l) => l.id)));
    const unreachable = Object.keys(bodies).filter((id) => !onRoadmap.has(id));
    expect(unreachable).toEqual([]);
  });

  test("self-attested lessons never pay more than unchecked work is worth", () => {
    for (const [id, body] of Object.entries(bodies)) {
      if (body.attested) expect(body.xp).toBeLessThanOrEqual(ATTESTED_XP);
      expect(isReviewable(body)).toBe(isLessonAssessed(id) && lessonQuestionCount(id) > 0);
    }
  });
});

describe("Claude operator course", () => {
  test("contains the promised levels and lesson split", () => {
    expect(claudeLevels.map((level) => level.lessons.length)).toEqual([6, 9, 9, 8, 10, 9]);
    expect(courseLessons(claudeCourse)).toHaveLength(51);
  });

  test("every lesson has a unique id and an authored body", () => {
    const lessons = courseLessons(claudeCourse);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(51);

    for (const lesson of lessons) {
      const body = getLessonBody(claudeCourse.id, lesson.id);
      expect(body).not.toBeNull();
      expect(body?.summary.trim().length).toBeGreaterThan(20);
      expect(body?.blocks.length).toBeGreaterThanOrEqual(3);
    }
  });

  test("the committed course skeleton matches the authored levels", () => {
    expect(claudeModules).toEqual(claudeModulesFromLevels());
  });

  /**
   * Every level ends in a capstone that happens in the learner's own tools, and
   * those stay unmarked: no question, no challenge, no review item, capped XP.
   * The moment a capstone asks a gradable question it starts paying review XP
   * for work nobody checked.
   */
  test("capstones are self-attested and graded nowhere", () => {
    const attested = courseLessons(claudeCourse).filter(
      (lesson) => getLessonBody(claudeCourse.id, lesson.id)!.attested,
    );
    expect(attested.length).toBe(6);
    expect(attested.every((lesson) => lesson.id.endsWith(".capstone"))).toBe(true);

    for (const lesson of attested) {
      const body = getLessonBody(claudeCourse.id, lesson.id)!;
      expect(body.blocks.some((block) => isQuestion(block))).toBe(false);
      expect(body.blocks.some((block) => block.kind === "challenge")).toBe(false);
      expect(isLessonAssessed(lesson.id)).toBe(false);
      expect(isReviewable(body)).toBe(false);
      expect(body.xp).toBe(ATTESTED_XP);
    }
  });

  /**
   * The point of the rewrite: a path made only of self-attested work can never
   * certify, so `pathCompletion` returned "self-directed" for ever.
   */
  test("the taught lessons are assessed, which lets the path certify", () => {
    const graded = claudeLevels.flatMap((level) =>
      level.lessons.filter((lesson) => !lesson.body.attested),
    );
    expect(graded.length).toBe(45);

    for (const lesson of graded) {
      expect(lesson.body.xp).toBeGreaterThan(ATTESTED_XP);
      const questions = lesson.body.blocks.filter((block) => isQuestion(block));
      expect(questions.length).toBeGreaterThanOrEqual(1);
      for (const block of lesson.body.blocks) {
        if (block.kind === "mcq") {
          expect(block.options.length).toBeGreaterThanOrEqual(3);
          expect(block.explanation.length).toBeGreaterThan(40);
        }
        if (block.kind === "fill") {
          expect(block.answer.trim().length).toBeGreaterThan(0);
          expect(block.explanation.length).toBeGreaterThan(40);
        }
      }
    }

    for (const level of claudeLevels) {
      const ids = level.lessons
        .filter((lesson) => !lesson.body.attested)
        .map((lesson) => `${level.id}.${lesson.slug}`);
      expect(ids.every((id) => isLessonAssessed(id))).toBe(true);
    }

    // Guessing one letter every time must not pass. Counting distinct answers
    // isn't enough: the first draft of this course used all four and still had
    // B correct on 64 of 89 questions, so the bar is the most common option's
    // share, not its existence.
    const answers = graded.flatMap((lesson) =>
      lesson.body.blocks.flatMap((block) => (block.kind === "mcq" ? [block.answer] : [])),
    );
    expect(new Set(answers).size).toBe(4);
    const commonest = Math.max(...[0, 1, 2, 3].map((i) => answers.filter((a) => a === i).length));
    expect(commonest / answers.length).toBeLessThan(0.35);

    const path = careerPaths.find((p) => p.id === "claude-operator")!;
    const everyLessonDone = new Set(pathLiveLessons(path).map((l) => l.id));
    const completion = pathCompletion(path, everyLessonDone);
    expect(completion.percent).toBe(100);
    expect(completion.credential).toBe("eligible");
  });

  test("self-reported work stays a small fraction of the catalog's XP", () => {
    const attestedXp = Object.entries(bodies)
      .filter(([, body]) => body.attested)
      .reduce((sum, [, body]) => sum + body.xp, 0);
    const assessedXp = Object.entries(bodies)
      .filter(([id]) => isLessonAssessed(id))
      .reduce((sum, [, body]) => sum + body.xp, 0);

    expect(attestedXp).toBeLessThan(assessedXp / 2);
  });

  test("no lesson prose or answer reaches the client course module", () => {
    const clientSource = readFileSync(
      new URL("../src/content/claude-course.gen.ts", import.meta.url),
      "utf8",
    );
    for (const level of claudeLevels) {
      for (const lesson of level.lessons) {
        expect(clientSource).not.toContain(lesson.body.summary);
        for (const block of lesson.body.blocks) {
          if (block.kind === "mcq") {
            expect(clientSource).not.toContain(block.question);
            expect(clientSource).not.toContain(block.explanation);
          }
          if (block.kind === "fill") {
            expect(clientSource).not.toContain(block.prompt);
            expect(clientSource).not.toContain(block.explanation);
          }
          if (block.kind === "text" || block.kind === "callout") {
            expect(clientSource).not.toContain(block.body);
          }
        }
      }
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
    lessonCount: 17,
    minMinutes: 330,
    lastLessonId: "js-project.catalog",
    minFills: 6,
    order: [
      ["js-basics.functions", "js-basics.strings"],
      ["js-basics.strings", "js-basics.checkpoint"],
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

// Authors put the right answer second without meaning to. On 2026-09-27 eleven
// courses leant on one letter, and JavaScript's was B for 23 of 27 questions,
// so always answering B scored 85%. No position may beat an even split by more
// than one question.
describe.each(courses.map((course) => [course.id, course] as const))(
  "%s multiple-choice answers",
  (_id, course) => {
    test("don't favour one position", () => {
      const answers = courseLessons(course).flatMap((lesson) =>
        (getLessonBody(course.id, lesson.id)?.blocks ?? []).flatMap((block) =>
          block.kind === "mcq" ? [block.answer] : [],
        ),
      );
      if (answers.length === 0) return;
      const commonest = Math.max(...[0, 1, 2, 3].map((i) => answers.filter((a) => a === i).length));
      expect(commonest).toBeLessThanOrEqual(Math.ceil(answers.length / 4) + 1);
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
describe("questions shown outside their lesson", () => {
  test("carry the code block they were written against", () => {
    const body = bodies["git-start.remotes"]!;
    const [push, status, clone] = questionsWithScenario(toPublicBody(body).blocks);
    expect(push?.scenario?.caption).toBe("Scenario: you try to push");
    expect(status?.scenario?.caption).toBe("Scenario: after git fetch");
    expect(clone?.scenario).toBeUndefined();
  });
});

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
 * Every SQL challenge must run against its dataset. This catches a broken
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
    test(`${id}: solution and starter run on its dataset`, () => {
      const db = new Database(":memory:");
      db.exec(sqlDataset(b.dataset).sql);
      expect(() => db.query(b.solution).all()).not.toThrow();
      // An empty-editor starter (checkpoints, capstones) is only a comment; the
      // runner answers that with "Write a query first." rather than running it.
      if (b.starter.replace(/--.*$/gm, "").trim()) {
        expect(() => db.query(b.starter).all()).not.toThrow();
      }
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

/**
 * A redirect that points at a lesson which later moves again, or that shadows a
 * lesson still at its old address, sends the learner somewhere wrong silently.
 */
describe("moved lessons", () => {
  for (const [from, to] of movedLessonEntries()) {
    test(`${from} redirects to a live lesson`, () => {
      const [courseId = "", lessonId = ""] = from.split("/");
      expect(findLesson(courseId, lessonId)).toBeNull();
      expect(findLesson(to.courseId, to.lessonId)).not.toBeNull();
      expect(getLessonBody(to.courseId, to.lessonId)).not.toBeNull();
    });
  }
});

/**
 * The stores data is generated, so a harmless-looking edit to the generator
 * silently rewrites every number a lesson quotes. These pin its totals and the
 * awkward cases the date lessons are built on.
 */
describe("stores dataset", () => {
  const db = new Database(":memory:");
  db.exec(SQL_DATASETS.stores.sql);
  const one = <T>(sql: string) => Object.values(db.query(sql).get() as object)[0] as T;

  test("totals are unchanged", () => {
    expect(
      db
        .query(
          "SELECT store_id, COUNT(*) AS n, SUM(orders) AS o, SUM(revenue) AS r FROM daily_sales GROUP BY store_id",
        )
        .all(),
    ).toEqual([
      { store_id: 1, n: 728, o: 12346, r: 766062 },
      { store_id: 2, n: 621, o: 7893, r: 586288 },
      { store_id: 3, n: 262, o: 2720, r: 201753 },
    ]);
  });

  test("closed days have no row; the snow day has a zero row", () => {
    expect(
      one<number>(
        "SELECT COUNT(*) FROM daily_sales WHERE store_id = 2 AND strftime('%w', day) = '0'",
      ),
    ).toBe(0);
    expect(
      one<number>(
        "SELECT COUNT(*) FROM daily_sales WHERE store_id > 1 AND substr(day, 6) IN ('12-25', '12-26', '01-01')",
      ),
    ).toBe(0);
    expect(
      one<number>(
        "SELECT COUNT(*) FROM daily_sales WHERE store_id = 1 AND day BETWEEN '2025-06-10' AND '2025-06-12'",
      ),
    ).toBe(0);
    expect(
      db
        .query("SELECT orders, revenue FROM daily_sales WHERE store_id = 2 AND day = '2025-01-08'")
        .get(),
    ).toEqual({ orders: 0, revenue: 0 });
  });

  test("Harrogate starts on its opening day, and every other day sold something", () => {
    expect(one<string>("SELECT MIN(day) FROM daily_sales WHERE store_id = 3")).toBe("2025-04-12");
    expect(one<number>("SELECT COUNT(*) FROM daily_sales WHERE orders = 0")).toBe(1);
  });
});

/**
 * The payments export is dirty on purpose, and the data-quality lesson quotes
 * each fault. Cleaning one up by accident would leave the lesson describing
 * a problem that isn't there.
 */
describe("payments dataset", () => {
  const db = new Database(":memory:");
  db.exec(SQL_DATASETS.payments.sql);
  const all = (sql: string) => db.query(sql).values();

  test("still carries every fault the lesson teaches", () => {
    expect(all("SELECT DISTINCT status FROM payments ORDER BY status")).toEqual([
      ["Succeeded"],
      ["failed"],
      ["refunded"],
      ["succeeded"],
      ["succeeded "],
    ]);
    expect(
      all(
        "SELECT order_id FROM payments GROUP BY order_id, created_at, amount, status HAVING COUNT(*) > 1",
      ),
    ).toEqual([[106]]);
    expect(
      all(
        "SELECT p.id FROM payments AS p LEFT JOIN orders AS o ON o.id = p.order_id WHERE o.id IS NULL",
      ),
    ).toEqual([[17]]);
    expect(all("SELECT id FROM payments WHERE amount IS NULL")).toEqual([[16]]);
    expect(
      all("SELECT id FROM payments WHERE created_at NOT GLOB '[0-9][0-9][0-9][0-9]-*'"),
    ).toEqual([[10]]);
    expect(all("SELECT SUM(amount) FROM payments WHERE LOWER(TRIM(status)) = 'succeeded'")).toEqual(
      [[1655]],
    );
  });
});
