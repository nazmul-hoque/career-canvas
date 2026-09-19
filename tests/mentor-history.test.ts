import { describe, expect, test } from "bun:test";

import { courseLessons, courses } from "../src/content/curriculum";
import { isLessonLive } from "../src/content/lessons";
import {
  HISTORY_BUDGET,
  summariseLearnerHistory,
  type HistoryReviewRow,
} from "../src/lib/mentor-history";

const TODAY = "2026-09-17";

const live = courses.flatMap((c) =>
  courseLessons(c)
    .filter((l) => isLessonLive(l.id))
    .map((l) => ({ courseId: c.id, lessonId: l.id, title: l.title })),
);
const unwritten = courses.flatMap((c) =>
  courseLessons(c)
    .filter((l) => !isLessonLive(l.id))
    .map((l) => ({ courseId: c.id, lessonId: l.id })),
);

const [current, a, b, c] = live as [
  (typeof live)[number],
  (typeof live)[number],
  (typeof live)[number],
  (typeof live)[number],
];

const review = (
  lesson: { courseId: string; lessonId: string },
  over: Partial<HistoryReviewRow>,
) => ({
  course_id: lesson.courseId,
  lesson_id: lesson.lessonId,
  lapses: 0,
  streak: 0,
  due_on: TODAY,
  ...over,
});

describe("summariseLearnerHistory", () => {
  test("needs at least four live lessons to exercise", () => {
    expect(live.length).toBeGreaterThanOrEqual(4);
  });

  test("a brand-new learner costs no tokens", () => {
    expect(
      summariseLearnerHistory({
        currentLessonId: current.lessonId,
        progress: [],
        reviews: [],
        today: TODAY,
      }),
    ).toBeNull();
  });

  test("names what the learner keeps forgetting, worst first", () => {
    const summary = summariseLearnerHistory({
      currentLessonId: current.lessonId,
      progress: [],
      reviews: [review(a, { lapses: 1 }), review(b, { lapses: 3 })],
      today: TODAY,
    })!;
    expect(summary).toContain("Keeps forgetting");
    expect(summary.indexOf(b.title)).toBeLessThan(summary.indexOf(a.title));
    expect(summary).toContain("missed 3 times");
    expect(summary).toContain("missed once");
  });

  test("flags the current lesson when it is one they keep missing", () => {
    const summary = summariseLearnerHistory({
      currentLessonId: current.lessonId,
      progress: [
        { course_id: current.courseId, lesson_id: current.lessonId, completed_at: "2026-09-01" },
      ],
      reviews: [review(current, { lapses: 2 })],
      today: TODAY,
    })!;
    expect(summary).toContain("revisiting");
    expect(summary).toContain("this lesson, missed 2 times");
  });

  test("only well-recalled, never-missed lessons count as solid", () => {
    const summary = summariseLearnerHistory({
      currentLessonId: current.lessonId,
      progress: [],
      reviews: [
        review(a, { streak: 3 }),
        review(b, { streak: 3, lapses: 1 }),
        review(c, { streak: 1 }),
      ],
      today: TODAY,
    })!;
    const solidLine = summary.split("\n").find((l) => l.includes("Recalls reliably"))!;
    expect(solidLine).toContain(a.title);
    expect(solidLine).not.toContain(b.title);
    expect(solidLine).not.toContain(c.title);
  });

  test("recent lessons are newest first and exclude the one open now", () => {
    const summary = summariseLearnerHistory({
      currentLessonId: current.lessonId,
      progress: [
        { course_id: a.courseId, lesson_id: a.lessonId, completed_at: "2026-09-10T10:00:00Z" },
        { course_id: b.courseId, lesson_id: b.lessonId, completed_at: "2026-09-12T10:00:00Z" },
      ],
      reviews: [],
      today: TODAY,
    })!;
    expect(summary).not.toContain("revisiting");
    expect(summary.indexOf(b.title)).toBeLessThan(summary.indexOf(a.title));
  });

  test("rows for unwritten lessons say nothing", () => {
    const filler = unwritten[0]!;
    expect(
      summariseLearnerHistory({
        currentLessonId: current.lessonId,
        progress: [{ course_id: filler.courseId, lesson_id: filler.lessonId, completed_at: TODAY }],
        reviews: [review(filler, { lapses: 5 })],
        today: TODAY,
      }),
    ).toBeNull();
  });

  test("a pile of overdue reviews is mentioned, a couple is not", () => {
    const few = summariseLearnerHistory({
      currentLessonId: current.lessonId,
      progress: [],
      reviews: [review(a, { due_on: "2026-09-01" }), review(b, { due_on: "2026-09-01" })],
      today: TODAY,
    });
    expect(few).toBeNull();

    const many = summariseLearnerHistory({
      currentLessonId: current.lessonId,
      progress: [],
      reviews: [a, b, c].map((l) => review(l, { due_on: "2026-09-01" })),
      today: TODAY,
    })!;
    expect(many).toContain("3 overdue reviews");
  });

  test("never exceeds the budget", () => {
    const summary = summariseLearnerHistory({
      currentLessonId: current.lessonId,
      progress: live.map((l, i) => ({
        course_id: l.courseId,
        lesson_id: l.lessonId,
        completed_at: `2026-09-${String(10 + i).padStart(2, "0")}`,
      })),
      reviews: live.map((l, i) => review(l, { lapses: i + 1, due_on: "2026-01-01" })),
      today: TODAY,
    })!;
    expect(summary.length).toBeLessThanOrEqual(HISTORY_BUDGET);
  });
});
