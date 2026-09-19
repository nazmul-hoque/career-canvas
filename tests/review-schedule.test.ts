import { describe, expect, test } from "bun:test";

import { addDays, initialReview, nextReview } from "../src/lib/review-schedule";

const TODAY = "2026-09-16";

describe("addDays", () => {
  test("moves forward without drifting", () => {
    expect(addDays(TODAY, 1)).toBe("2026-09-17");
    expect(addDays(TODAY, 0)).toBe(TODAY);
  });

  test("crosses month and year boundaries", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  test("handles a leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("nextReview", () => {
  test("a completed lesson comes back tomorrow", () => {
    const first = initialReview(TODAY);
    expect(first.dueOn).toBe("2026-09-17");
    expect(first.intervalDays).toBe(1);
    expect(first.streak).toBe(0);
  });

  test("correct answers widen the gap", () => {
    let state = initialReview(TODAY);
    const intervals: number[] = [];
    for (let i = 0; i < 5; i++) {
      state = nextReview(state, true, TODAY);
      intervals.push(state.intervalDays);
    }
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]!).toBeGreaterThan(intervals[i - 1]!);
    }
  });

  test("the due date matches the interval", () => {
    const state = nextReview(initialReview(TODAY), true, TODAY);
    expect(state.dueOn).toBe(addDays(TODAY, state.intervalDays));
  });

  test("a wrong answer sends it back to tomorrow and counts a lapse", () => {
    let state = initialReview(TODAY);
    for (let i = 0; i < 3; i++) state = nextReview(state, true, TODAY);
    expect(state.intervalDays).toBeGreaterThan(1);

    const lapsed = nextReview(state, false, TODAY);
    expect(lapsed.intervalDays).toBe(1);
    expect(lapsed.dueOn).toBe("2026-09-17");
    expect(lapsed.streak).toBe(0);
    expect(lapsed.lapses).toBe(state.lapses + 1);
  });

  test("a lapsed item climbs the ladder again rather than jumping back", () => {
    let state = initialReview(TODAY);
    for (let i = 0; i < 4; i++) state = nextReview(state, true, TODAY);
    const before = state.intervalDays;

    state = nextReview(state, false, TODAY);
    state = nextReview(state, true, TODAY);
    expect(state.intervalDays).toBeLessThan(before);
  });

  test("intervals never run away", () => {
    let state = initialReview(TODAY);
    for (let i = 0; i < 40; i++) state = nextReview(state, true, TODAY);
    expect(state.intervalDays).toBeLessThanOrEqual(90);
  });

  test("lapses are remembered across correct answers", () => {
    let state = nextReview(initialReview(TODAY), false, TODAY);
    state = nextReview(state, true, TODAY);
    expect(state.lapses).toBe(1);
  });
});
