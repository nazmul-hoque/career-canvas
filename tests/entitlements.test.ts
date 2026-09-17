import { beforeEach, afterAll, describe, expect, test } from "bun:test";

import { courses } from "../src/content/curriculum";
import {
  TRIAL_DAYS,
  entitlementsFor,
  isLessonUnlocked,
  planFeatures,
  planState,
  trialDaysLeft,
} from "../src/lib/entitlements";

/**
 * Plan limits are read by both the UI and the server functions, so a mistake
 * here either paywalls a paying learner or gives the store away.
 */

const NOW = new Date("2026-09-16T12:00:00Z");
const original = process.env["ENTITLEMENTS_ENABLED"];

const enforce = (on: boolean) => {
  process.env["ENTITLEMENTS_ENABLED"] = on ? "true" : "false";
};

beforeEach(() => enforce(true));
afterAll(() => {
  if (original === undefined) delete process.env["ENTITLEMENTS_ENABLED"];
  else process.env["ENTITLEMENTS_ENABLED"] = original;
});

describe("the enforcement flag", () => {
  test("everything is unrestricted while enforcement is off", () => {
    enforce(false);
    const free = entitlementsFor("free");
    expect(free.allModules).toBe(true);
    expect(free.practiceTasksPerMonth).toBeNull();
    expect(free.projects).toBe(true);
    expect(free.certificates).toBe(true);
  });

  test("the flag being off does not rewrite what the plans say", () => {
    enforce(false);
    // Pricing copy reads planFeatures, which ignores the override.
    expect(planFeatures("free").allModules).toBe(false);
    expect(planFeatures("free").certificates).toBe(false);
  });

  test("free is actually limited once enforcement is on", () => {
    const free = entitlementsFor("free");
    expect(free.allModules).toBe(false);
    expect(free.certificates).toBe(false);
    expect(free.projects).toBe(false);
    expect(free.practiceTasksPerMonth).toBeGreaterThan(0);
  });

  test("paid plans are not limited", () => {
    for (const plan of ["pro", "lifetime"] as const) {
      const e = entitlementsFor(plan);
      expect(e.allModules).toBe(true);
      expect(e.practiceTasksPerMonth).toBeNull();
      expect(e.projects).toBe(true);
      expect(e.certificates).toBe(true);
    }
  });

  test("an unknown plan is treated as free, never as paid", () => {
    // planState normalises; entitlementsFor is the second line of defence.
    expect(planState({ plan: "enterprise-deluxe" }, NOW).plan).toBe("free");
  });
});

describe("module locking", () => {
  const course = courses[0]!;
  const firstModuleLesson = course.modules[0]!.lessons[0]!.id;
  const laterLesson = course.modules.at(-1)!.lessons.at(-1)!.id;

  test("free sees the first module and nothing past it", () => {
    const free = entitlementsFor("free");
    expect(isLessonUnlocked(course, firstModuleLesson, free)).toBe(true);
    if (course.modules.length > 1) {
      expect(isLessonUnlocked(course, laterLesson, free)).toBe(false);
    }
  });

  test("pro sees everything", () => {
    const pro = entitlementsFor("pro");
    expect(isLessonUnlocked(course, laterLesson, pro)).toBe(true);
  });

  test("a lesson id from another course is not unlocked by accident", () => {
    const other = courses[1];
    if (!other) return;
    expect(
      isLessonUnlocked(course, other.modules[0]!.lessons[0]!.id, entitlementsFor("free")),
    ).toBe(false);
  });
});

describe("trials", () => {
  const future = new Date(NOW.getTime() + 5 * 86_400_000).toISOString();
  const past = new Date(NOW.getTime() - 86_400_000).toISOString();

  test("a live trial is treated as pro without changing the stored plan", () => {
    const state = planState({ plan: "free", trial_ends_at: future }, NOW);
    expect(state.trialing).toBe(true);
    expect(state.plan).toBe("pro");
    expect(entitlementsFor(state.plan).certificates).toBe(true);
  });

  test("an expired trial falls back to free with no cron job needed", () => {
    const state = planState({ plan: "free", trial_ends_at: past }, NOW);
    expect(state.trialing).toBe(false);
    expect(state.plan).toBe("free");
  });

  test("a used trial stays marked as used after it expires", () => {
    expect(planState({ plan: "free", trial_ends_at: past }, NOW).trialUsed).toBe(true);
    expect(planState({ plan: "free", trial_ends_at: null }, NOW).trialUsed).toBe(false);
  });

  test("a paying subscriber is never downgraded by a stale trial date", () => {
    const state = planState({ plan: "pro", trial_ends_at: past }, NOW);
    expect(state.plan).toBe("pro");
    expect(state.trialing).toBe(false);
  });

  test("days left counts down and floors at zero", () => {
    expect(trialDaysLeft(future, NOW)).toBe(5);
    expect(trialDaysLeft(past, NOW)).toBe(0);
    expect(trialDaysLeft(null, NOW)).toBe(0);
  });

  test("a fresh trial is TRIAL_DAYS long", () => {
    const ends = new Date(NOW.getTime() + TRIAL_DAYS * 86_400_000).toISOString();
    expect(trialDaysLeft(ends, NOW)).toBe(TRIAL_DAYS);
  });

  test("a missing profile is free, not a crash", () => {
    expect(planState(null, NOW).plan).toBe("free");
    expect(planState(undefined, NOW).trialing).toBe(false);
  });
});
