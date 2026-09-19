import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";

import { careerPaths, courseLessons, courses, pathCourses } from "../src/content/curriculum";
import { SHOP_SQL } from "../src/content/datasets/shop";
import { bodies, getLessonBody } from "../src/content/lesson-bodies.server";
import { renderManifest } from "../src/content/lesson-manifest.server";
import {
  isCoursePublished,
  isLessonLive,
  isPathPublished,
  liveLessons,
  nextLiveLesson,
  pathLiveLessons,
  toPublicBody,
} from "../src/content/lessons";
import { allPathCompletions, certificateId, pathCompletion } from "../src/lib/certificates";

/**
 * The rule these protect: a lesson exists only if someone wrote it. Filler used
 * to fill the gaps and pay out XP for it, which certified nothing. If one of
 * these fails, the platform has started claiming credit for unwritten work.
 */

const liveIds = () => new Set(courses.flatMap(liveLessons).map((l) => l.id));

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
      expect(pathCompletion(path, new Set()).eligible).toBe(false);
    }
  });

  test("finishing every live lesson is not enough while the path is unwritten", () => {
    for (const path of careerPaths) {
      const result = pathCompletion(path, liveIds());
      if (result.published) continue;
      expect(result.completed).toBe(result.live);
      expect(result.eligible).toBe(false);
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
 * its (Python) tests is checked by `bun run lessons:verify-sql`.
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
