import { describe, expect, test } from "bun:test";

import type { LessonBody } from "../src/content/lessons";
import {
  answerVerdict,
  gradableBlocks,
  gradeLesson,
  gradeReview,
  isBlockCorrect,
  isReviewable,
  normaliseFill,
  whyNotFor,
} from "../src/lib/lesson-grading";

/**
 * This is the rule that decides whether XP is paid out. It runs on the server
 * against the authored lesson, so a learner cannot name their own reward — but
 * only if it actually rejects wrong answers.
 */

const body = (blocks: LessonBody["blocks"]): LessonBody => ({ summary: "", xp: 100, blocks });

const mcq = {
  kind: "mcq" as const,
  id: "q1",
  question: "?",
  options: ["a", "b", "c"],
  answer: 1,
  explanation: "",
};

const fill = {
  kind: "fill" as const,
  id: "f1",
  prompt: "",
  before: "",
  after: "",
  answer: "n * 2",
  explanation: "",
};

const challenge = {
  kind: "challenge" as const,
  id: "c1",
  title: "",
  prompt: "",
  language: "javascript" as const,
  starter: "",
  hint: "",
  solution: "",
  tests: [],
};

describe("gradeLesson", () => {
  test("accepts a fully correct submission", () => {
    const result = gradeLesson(body([mcq, fill]), { q1: 1, f1: "n * 2" }, false);
    expect(result.ok).toBe(true);
    expect(result.wrongBlockIds).toEqual([]);
  });

  test("rejects a wrong multiple choice answer", () => {
    const result = gradeLesson(body([mcq]), { q1: 0 }, false);
    expect(result.ok).toBe(false);
    expect(result.wrongBlockIds).toEqual(["q1"]);
    expect(result.reason).toBeTruthy();
  });

  test("rejects a missing answer rather than treating it as correct", () => {
    expect(gradeLesson(body([mcq]), {}, false).ok).toBe(false);
    expect(gradeLesson(body([fill]), {}, false).ok).toBe(false);
  });

  test("an mcq answer is compared by index, not by string", () => {
    // "1" from a form input must not pass as index 1.
    expect(gradeLesson(body([mcq]), { q1: "1" }, false).ok).toBe(false);
  });

  test("fill answers ignore case and spacing, but not what was written", () => {
    expect(gradeLesson(body([fill]), { f1: "  N * 2 " }, false).ok).toBe(true);
    expect(gradeLesson(body([fill]), { f1: "n*2" }, false).ok).toBe(true);
    expect(gradeLesson(body([fill]), { f1: "n  *2;" }, false).ok).toBe(true);
    expect(gradeLesson(body([fill]), { f1: "n * 3" }, false).ok).toBe(false);
    expect(gradeLesson(body([fill]), { f1: "n2" }, false).ok).toBe(false);
    expect(gradeLesson(body([fill]), { f1: "  " }, false).ok).toBe(false);
  });

  test("a lesson with a challenge is not complete until the challenge passes", () => {
    expect(gradeLesson(body([mcq, challenge]), { q1: 1 }, false).ok).toBe(false);
    expect(gradeLesson(body([mcq, challenge]), { q1: 1 }, true).ok).toBe(true);
  });

  test("text and code blocks are not gradable", () => {
    const lesson = body([
      { kind: "text", body: "hello" },
      { kind: "code", language: "js", code: "1" },
      mcq,
    ]);
    expect(gradableBlocks(lesson)).toHaveLength(1);
    expect(gradeLesson(lesson, { q1: 1 }, false).ok).toBe(true);
  });

  test("a lesson with no questions and no challenge is complete on arrival", () => {
    expect(gradeLesson(body([{ kind: "text", body: "hello" }]), {}, false).ok).toBe(true);
  });

  test("every wrong block is reported, not just the first", () => {
    const result = gradeLesson(body([mcq, fill]), { q1: 0, f1: "wrong" }, false);
    expect(result.wrongBlockIds).toEqual(["q1", "f1"]);
  });
});

describe("gradeReview", () => {
  test("the challenge is not re-run during a review", () => {
    expect(gradeReview(body([mcq, challenge]), { q1: 1 }).ok).toBe(true);
  });

  test("a lesson with nothing to ask cannot be reviewed", () => {
    const lesson = body([{ kind: "text", body: "hello" }]);
    expect(isReviewable(lesson)).toBe(false);
    expect(gradeReview(lesson, {}).ok).toBe(false);
  });

  test("a wrong answer fails the review", () => {
    expect(gradeReview(body([mcq]), { q1: 2 }).ok).toBe(false);
  });
});

/**
 * A wrong pick may be told why that option fails, never what the right one is:
 * the learner is still answering. These pin which note goes back, and when none
 * does.
 */
describe("answerVerdict", () => {
  const noted = {
    ...mcq,
    explanation: "b, because b.",
    options: [{ text: "a", whyNot: "a fails because a." }, "b", "c"],
  };

  test("a wrong pick gets its own option's note and no explanation", () => {
    expect(answerVerdict(noted, 0)).toEqual({
      correct: false,
      explanation: null,
      whyNot: "a fails because a.",
    });
  });

  test("a wrong pick whose option has no note gets nothing", () => {
    expect(answerVerdict(noted, 2)).toEqual({ correct: false, explanation: null, whyNot: null });
  });

  test("a right pick gets the explanation and no note", () => {
    expect(answerVerdict(noted, 1)).toEqual({
      correct: true,
      explanation: "b, because b.",
      whyNot: null,
    });
  });

  test("a note is only ever read for the option picked", () => {
    expect(whyNotFor(noted, undefined)).toBeNull();
    expect(whyNotFor(noted, "0")).toBeNull();
    expect(whyNotFor(noted, 7)).toBeNull();
    expect(whyNotFor(fill, "n")).toBeNull();
  });

  test("a noted option is graded by position like any other", () => {
    expect(isBlockCorrect({ ...noted, answer: 0 }, { q1: 0 })).toBe(true);
  });
});

describe("isBlockCorrect", () => {
  test("index 0 is a real answer, not a missing one", () => {
    const first = { ...mcq, answer: 0 };
    expect(isBlockCorrect(first, { q1: 0 })).toBe(true);
    expect(isBlockCorrect(first, {})).toBe(false);
  });
});

describe("fill normalisation", () => {
  test("spacing around punctuation never matters; a space between words does", () => {
    expect(normaliseFill("flex :1")).toBe(normaliseFill("flex: 1"));
    expect(normaliseFill("flex:1;")).toBe(normaliseFill("flex: 1"));
    expect(normaliseFill("IF  LEN(name)>3")).toBe(normaliseFill("if len(name) > 3"));
    expect(normaliseFill("iflen(name)>3")).not.toBe(normaliseFill("if len(name) > 3"));
  });

  test("a block can accept other equally right answers", () => {
    const flex = { ...fill, answer: "flex: 1", accept: ["flex: 1 1 0%"] };
    expect(gradeLesson(body([flex]), { f1: "flex:1 1 0%" }, false).ok).toBe(true);
    expect(gradeLesson(body([flex]), { f1: "flex: 2" }, false).ok).toBe(false);
  });
});
