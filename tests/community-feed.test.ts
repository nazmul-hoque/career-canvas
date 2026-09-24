import { describe, expect, test } from "bun:test";

import {
  EXAMPLES_UNTIL_REAL_POSTS,
  TRENDING_WINDOW_DAYS,
  rankTrending,
  showExamples,
} from "../src/lib/community-feed";

describe("showExamples", () => {
  test("shown until enough real posts exist, then hidden", () => {
    expect(showExamples(0, false)).toBe(true);
    expect(showExamples(EXAMPLES_UNTIL_REAL_POSTS - 1, false)).toBe(true);
    expect(showExamples(EXAMPLES_UNTIL_REAL_POSTS, false)).toBe(false);
    expect(showExamples(500, false)).toBe(false);
  });

  test("hidden while the count loads, so they don't flash in and out", () => {
    expect(showExamples(undefined, false)).toBe(false);
  });

  test("a failed count falls back to the seed", () => {
    expect(showExamples(undefined, true)).toBe(true);
    expect(showExamples(500, true)).toBe(true);
  });
});

describe("rankTrending", () => {
  const now = new Date("2026-09-24T12:00:00Z");
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
  const post = (id: string, likes: number, replies: number, age: number) => ({
    id,
    likes,
    replies,
    createdAt: daysAgo(age),
  });

  test("ranks by likes plus replies", () => {
    const ranked = rankTrending([post("a", 1, 0, 1), post("b", 2, 3, 1), post("c", 4, 0, 1)], now);
    expect(ranked.map((p) => p.id)).toEqual(["b", "c", "a"]);
  });

  test("leaves out posts older than the window", () => {
    const ranked = rankTrending(
      [post("old", 99, 99, TRENDING_WINDOW_DAYS + 1), post("new", 1, 0, 1)],
      now,
    );
    expect(ranked.map((p) => p.id)).toEqual(["new"]);
  });

  test("a post nobody reacted to isn't trending", () => {
    expect(rankTrending([post("quiet", 0, 0, 0)], now)).toEqual([]);
  });

  test("ties go to the newer post, and the list is capped", () => {
    const ranked = rankTrending(
      [post("older", 2, 0, 5), post("newer", 2, 0, 1), post("x", 1, 0, 1), post("y", 1, 0, 2)],
      now,
    );
    expect(ranked.map((p) => p.id)).toEqual(["newer", "older", "x"]);
  });
});
