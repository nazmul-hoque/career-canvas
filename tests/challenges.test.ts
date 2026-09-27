import { describe, expect, test } from "bun:test";
import { registerHappyDom } from "./happy-dom";

/**
 * Every challenge whose engine runs in-process: the reference solution passes
 * every test and the starter fails at least one, through the same `runCode` a
 * learner's browser uses. `bun run lessons:verify` checks the same thing, but
 * only when someone remembers to run it; this keeps a broken JavaScript, DOM,
 * web, React or Excel challenge from passing the suite.
 *
 * Not here: Python and SQL need python3 (lessons:verify), TypeScript has
 * typescript-course.test.ts, and git has git-sandbox.test.ts.
 */
registerHappyDom();

const { runCode } = await import("../src/lib/code-runner");
const { bodies } = await import("../src/content/lesson-bodies.server");

const IN_PROCESS = new Set(["javascript", "dom", "web", "react", "excel"]);

// Bun's runner fails the running test on any promise rejection nobody catches,
// before a process or window handler sees it. That is the rule a solution
// should meet, but an unfinished starter may break it on purpose: this one's
// missing error handling is the lesson, so its stand-in's 503 escapes an
// effect. Its starter is still checked by `bun run lessons:verify`.
const STARTER_LEAKS_BY_DESIGN = new Set(["react-data.fetch"]);

const challenges = Object.entries(bodies).flatMap(([id, body]) =>
  body.blocks.flatMap((block) =>
    block.kind === "challenge" && IN_PROCESS.has(block.language) ? [{ id, block }] : [],
  ),
);

describe("in-process challenges", () => {
  test("there are some, so a renamed language can't silently empty this file", () => {
    expect(challenges.length).toBeGreaterThan(40);
  });

  for (const { id, block } of challenges) {
    const context = { sheet: block.sheet, html: block.html, dataset: block.dataset };

    test(`${id} (${block.language}): the solution passes and the starter needs work`, async () => {
      const solution = await runCode(block.language, block.solution, block.tests, context);
      expect(solution.error).toBeNull();
      expect(solution.tests.filter((t) => !t.passed).map((t) => t.name)).toEqual([]);
      expect(solution.passed).toBe(true);

      if (STARTER_LEAKS_BY_DESIGN.has(id)) return;
      const starter = await runCode(block.language, block.starter, block.tests, context);
      expect(starter.passed).toBe(false);
    });
  }
});
