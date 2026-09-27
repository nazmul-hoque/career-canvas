import { describe, expect, test } from "bun:test";

import { bodies } from "../src/content/lesson-bodies.server";
import type { LessonBlock } from "../src/content/lessons";
import { gradeLesson } from "../src/lib/lesson-grading";
import {
  MAX_TRANSCRIPT_LINES,
  buildWorld,
  evaluateCheck,
  replay,
  runGitChallenge,
  runLine,
} from "../src/lib/git-sandbox";

type Challenge = Extract<LessonBlock, { kind: "challenge" }>;

const gitChallenges = Object.entries(bodies).flatMap(([id, body]) =>
  body.blocks.flatMap((block) =>
    block.kind === "challenge" && block.language === "git" ? [{ id, block, body }] : [],
  ),
);

const passes = (block: Challenge, transcript: string) => {
  const run = runGitChallenge(block.setup ?? "", transcript, block.tests);
  return !run.error && run.results.every((r) => r.passed);
};

const failing = (block: Challenge, transcript: string) =>
  runGitChallenge(block.setup ?? "", transcript, block.tests)
    .results.map((r, i) => (r.passed ? null : block.tests[i]!.name))
    .filter(Boolean);

describe("git challenges", () => {
  test("there are some", () => {
    expect(gitChallenges.length).toBeGreaterThanOrEqual(10);
  });

  test.each(gitChallenges.map((c) => [c.id, c.block] as const))(
    "%s: the solution meets every goal and an empty session doesn't",
    (_id, block) => {
      expect(failing(block, block.solution)).toEqual([]);
      expect(passes(block, "")).toBe(false);
      expect(block.starter).toBe("");
    },
  );

  test.each(gitChallenges.map((c) => [c.id, c.block] as const))(
    "%s: every setup line runs, bar the ones that fail on purpose",
    (_id, block) => {
      const world = buildWorld("");
      const failures = (block.setup ?? "")
        .split("\n")
        .filter((line) => line.trim() && !runLine(world, line, { setup: true }).ok);
      expect(failures).toEqual([]);
    },
  );

  // A tick is progress. A goal that's true before the learner types anything
  // (a guard like "main is untouched") has to ride along with the step it guards.
  test.each(gitChallenges.map((c) => [c.id, c.block] as const))(
    "%s: no goal is met before the learner starts",
    (_id, block) => {
      const met = runGitChallenge(block.setup ?? "", "", block.tests)
        .results.map((r, i) => (r.passed ? block.tests[i]!.name : null))
        .filter(Boolean);
      expect(met).toEqual([]);
    },
  );

  const byId = (id: string) => gitChallenges.find((c) => c.id === id)!.block;

  test("force-pushing over a teammate's work doesn't pass", () => {
    expect(passes(byId("git-start.remotes"), "git push --force")).toBe(false);
  });

  test("merging main into a pull request branch isn't a rebase", () => {
    const block = byId("git-rescue.rebase");
    expect(passes(block, "git merge main\ngit push")).toBe(false);
  });

  test("resetting main before making the branch loses the commit", () => {
    const block = byId("git-rescue.wrong-branch");
    expect(passes(block, "git reset --hard origin/main\ngit switch -c feature/discount")).toBe(
      false,
    );
  });

  test("resetting a pushed merge away and force-pushing doesn't count as undoing it", () => {
    const block = byId("git-core.prs");
    expect(passes(block, "git reset --hard HEAD~1\ngit push --force")).toBe(false);
  });

  test("a conflict left unresolved fails", () => {
    const block = byId("git-core.branches");
    expect(
      passes(block, "git merge feature/discount-codes\ngit add src/config.js\ngit commit"),
    ).toBe(false);
  });

  test("a different route to the same result passes: learners aren't marked on commands", () => {
    // Recover with the ids the reflog prints, as a learner would.
    const block = byId("git-rescue.reflog");
    const { world } = replay(block.setup ?? "", "");
    const log = runLine(world, "git reflog").output.split("\n");
    const idOf = (message: string) => log.find((l) => l.endsWith(message))!.split(" ")[0]!;
    const transcript = [
      `git reset --hard ${idOf("commit: Add coupon validation")}`,
      `git branch feature/wishlist ${idOf("commit: Add wishlist button")}`,
    ].join("\n");
    expect(passes(block, transcript)).toBe(true);
  });

  test("every check expression is one the engine understands", () => {
    const world = buildWorld("git init");
    for (const { block } of gitChallenges) {
      for (const t of block.tests) expect(() => evaluateCheck(world, t.expression)).not.toThrow();
    }
  });
});

describe("the server grades a git challenge from the transcript", () => {
  const { body, block } = gitChallenges.find((c) => c.id === "git-rescue.wrong-branch")!;
  const answers = Object.fromEntries(
    body.blocks.flatMap((b) =>
      b.kind === "mcq" ? [[b.id, b.answer]] : b.kind === "fill" ? [[b.id, b.answer]] : [],
    ),
  );

  test("the browser saying it's solved isn't enough", () => {
    expect(gradeLesson(body, answers, true, "").ok).toBe(false);
    expect(gradeLesson(body, answers, true, undefined).ok).toBe(false);
  });

  test("a transcript that does the work passes, whatever the flag says", () => {
    expect(gradeLesson(body, answers, false, block.solution).ok).toBe(true);
  });
});

describe("the engine", () => {
  test("replaying a transcript gives the same ids every time", () => {
    const setup = byIdSetup();
    const a = runLine(replay(setup, "git log --oneline").world, "git log --oneline").output;
    const b = runLine(replay(setup, "git log --oneline").world, "git log --oneline").output;
    expect(a).toBe(b);
  });

  test("a learner can't run setup-only commands", () => {
    const world = buildWorld("git init");
    expect(runLine(world, "@teammate git push").ok).toBe(false);
    expect(runLine(world, '@write a.txt "hi\\n"').ok).toBe(true);
  });

  test("an overlong session is refused, not replayed", () => {
    const transcript = Array.from({ length: MAX_TRANSCRIPT_LINES + 1 }, () => "git status").join(
      "\n",
    );
    expect(
      runGitChallenge("git init", transcript, [{ name: "x", expression: "clean" }]).error,
    ).not.toBeNull();
  });

  test("a pull on diverged branches needs pull.rebase set, as in real git", () => {
    const setup = [
      "git init",
      '@write a.txt "1\\n"',
      "git add .",
      'git commit -m "One"',
      "git remote add origin git@github.com:you/shop.git",
      "git push -u origin main",
      '@teammate @write b.txt "2\\n"',
      "@teammate git add .",
      '@teammate git commit -m "Two"',
      "@teammate git push",
      '@write c.txt "3\\n"',
      "git add .",
      'git commit -m "Three"',
    ].join("\n");
    const unset = buildWorld(setup);
    runLine(unset, "git config --global --unset-all pull.rebase");
    delete unset.config["pull.rebase"];
    const refused = runLine(unset, "git pull");
    expect(refused.ok).toBe(false);
    expect(refused.output).toContain("fatal: Need to specify how to reconcile divergent branches.");

    const configured = buildWorld(setup);
    expect(runLine(configured, "git pull").ok).toBe(true);
  });

  test("changes on separate lines merge cleanly; the same line conflicts", () => {
    const base = [
      "git init",
      '@write f.txt "a\\nb\\nc\\nd\\n"',
      "git add .",
      'git commit -m "Base"',
      "git switch -c other",
    ];
    const clean = buildWorld(
      [
        ...base,
        '@write f.txt "A\\nb\\nc\\nd\\n"',
        'git commit -am "A"',
        "git switch main",
        '@write f.txt "a\\nb\\nc\\nD\\n"',
        'git commit -am "D"',
      ].join("\n"),
    );
    expect(runLine(clean, "git merge other").ok).toBe(true);
    expect(clean.me.work["f.txt"]).toBe("A\nb\nc\nD\n");

    const clash = buildWorld(
      [
        ...base,
        '@write f.txt "X\\nb\\nc\\nd\\n"',
        'git commit -am "X"',
        "git switch main",
        '@write f.txt "Y\\nb\\nc\\nd\\n"',
        'git commit -am "Y"',
      ].join("\n"),
    );
    const result = runLine(clash, "git merge other");
    expect(result.ok).toBe(false);
    expect(clash.me.work["f.txt"]).toBe("<<<<<<< HEAD\nY\n=======\nX\n>>>>>>> other\nb\nc\nd\n");
  });
});

function byIdSetup() {
  return gitChallenges.find((c) => c.id === "git-rescue.reflog")!.block.setup ?? "";
}
