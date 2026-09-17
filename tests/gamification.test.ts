import { describe, expect, test } from "bun:test";

import {
  DAILY_XP_GOAL,
  dailyXpGoal,
  levelFromXp,
  levelTitle,
  weeklyXpGoal,
} from "../src/content/gamification";

describe("levelFromXp", () => {
  test("a new learner is level 1 with nothing banked", () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, intoLevel: 0, needed: 400 });
  });

  test("the first level costs exactly 400 XP", () => {
    expect(levelFromXp(399).level).toBe(1);
    expect(levelFromXp(400).level).toBe(2);
  });

  test("each level costs more than the last", () => {
    const second = levelFromXp(400).needed;
    const third = levelFromXp(400 + second).needed;
    expect(third).toBeGreaterThan(second);
  });

  test("progress within a level is reported against that level's own cost", () => {
    const { intoLevel, needed, percent } = levelFromXp(500);
    expect(intoLevel).toBe(100);
    expect(percent).toBe(Math.round((100 / needed) * 100));
  });

  test("never reports more progress than a level holds", () => {
    for (const xp of [0, 1, 399, 400, 1234, 99_999]) {
      const { intoLevel, needed, percent } = levelFromXp(xp);
      expect(intoLevel).toBeLessThan(needed);
      expect(percent).toBeLessThanOrEqual(100);
      expect(percent).toBeGreaterThanOrEqual(0);
    }
  });

  test("titles climb and never come back down", () => {
    const levels = [1, 4, 5, 8, 9, 13, 14, 19, 20, 40];
    const titles = levels.map(levelTitle);
    expect(new Set(titles).size).toBeGreaterThan(1);
    expect(titles.at(-1)).toBe("Summit");
  });
});

describe("goals sized from onboarding", () => {
  test("no answer falls back to the documented default", () => {
    expect(dailyXpGoal(null)).toBe(DAILY_XP_GOAL);
    expect(dailyXpGoal(undefined)).toBe(DAILY_XP_GOAL);
    expect(dailyXpGoal(0)).toBe(DAILY_XP_GOAL);
  });

  test("more hours means a bigger goal", () => {
    const goals = [3, 5, 8, 12, 20].map(dailyXpGoal);
    for (let i = 1; i < goals.length; i++) {
      expect(goals[i]!).toBeGreaterThan(goals[i - 1]!);
    }
  });

  test("the smallest answer still leaves one lesson able to clear the day", () => {
    // Live lessons are worth 110-140 XP; a goal above that would mean the
    // daily target quietly competes with the streak.
    expect(dailyXpGoal(3)).toBeLessThanOrEqual(110);
    expect(dailyXpGoal(3)).toBeGreaterThanOrEqual(60);
  });

  test("the daily goal is roughly a seventh of the weekly one", () => {
    for (const hours of [3, 5, 8, 12, 20]) {
      const daily = dailyXpGoal(hours);
      const weekly = weeklyXpGoal(hours);
      expect(Math.abs(daily - weekly / 7)).toBeLessThanOrEqual(10);
    }
  });
});
