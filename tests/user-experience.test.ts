import { describe, expect, test } from "bun:test";
import { isAuthCallback, safeReturnTo } from "../src/lib/auth-navigation";
import { parseSearchWith } from "@tanstack/router-core";
import { draftKey, parseDraft } from "../src/lib/lesson-draft";
import { projectUrl, publicationSchema } from "../src/lib/project-publication";
import { codeTokens } from "../src/lib/code-tokens";

/**
 * The OAuth callback lands on `/auth?complete=…`, and whether the page then
 * sends the learner on is decided by reading that flag back out of the URL.
 * It is parsed by the router's default `JSON.parse` search parser before the
 * route sees it, which is the step the original check missed.
 */
describe("auth callback flag survives the URL round trip", () => {
  // The parser `createRouter` uses when no custom one is supplied.
  const parse = parseSearchWith(JSON.parse);
  const flagIn = (query: string) =>
    isAuthCallback((parse(query) as Record<string, unknown>)["complete"]);

  test("a real callback URL is recognised", () => {
    // What the app sends today, and what is still sitting in already-delivered
    // confirmation emails.
    expect(flagIn("?complete=true&returnTo=%2Fdashboard")).toBe(true);
    expect(flagIn("?complete=1&returnTo=%2Fdashboard")).toBe(true);
  });

  test("`1` arrives as a number, not a string", () => {
    // The specific reason a signed-in learner sat on the login page: this is a
    // number, so a check for `true` or `"1"` read every callback as false.
    expect((parse("?complete=1") as Record<string, unknown>)["complete"]).toBe(1);
  });

  test("an ordinary visit to the login page is not a callback", () => {
    expect(flagIn("?mode=login")).toBe(false);
    expect(flagIn("?complete=false")).toBe(false);
    expect(flagIn("?complete=0")).toBe(false);
    expect(flagIn("")).toBe(false);
  });
});

describe("authentication return destinations", () => {
  test("preserves lesson, plan, filters and fragment", () => {
    for (const path of [
      "/learn/javascript/js-1.intro",
      "/pricing?plan=pro&interval=yearly",
      "/projects/dashboard#submit",
    ])
      expect(safeReturnTo(path)).toBe(path);
  });
  test("rejects external destinations and auth loops", () => {
    for (const path of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "/auth?returnTo=/auth",
      "/onboarding",
      "/reset-password",
      "/\nevil.example",
      null,
    ])
      expect(safeReturnTo(path)).toBe("/dashboard");
  });
});

describe("lesson drafts", () => {
  test("isolates accounts, courses, and lessons", () => {
    expect(
      new Set([
        draftKey("alice", "js", "one"),
        draftKey("bob", "js", "one"),
        draftKey("alice", "python", "one"),
        draftKey("alice", "js", "two"),
      ]).size,
    ).toBe(4);
    expect(draftKey("a:b", "c", "d")).not.toBe(draftKey("a", "b:c", "d"));
  });
  test("restores code and zero-valued answers but never completion claims", () => {
    expect(
      parseDraft(
        JSON.stringify({ code: "return 2;", answers: { q1: 0, q2: "hello" }, solved: true }),
      ),
    ).toEqual({ code: "return 2;", answers: { q1: 0, q2: "hello" } });
  });
  test("damaged storage cannot break the workspace", () => {
    for (const raw of [
      null,
      "{",
      "null",
      "[]",
      '{"code":12,"answers":{}}',
      '{"code":"x","answers":{"q":{}}}',
      '{"code":"x","answers":[]}',
    ])
      expect(parseDraft(raw)).toBeNull();
  });
});

describe("portfolio publishing", () => {
  test("requires a case study only when publishing", () => {
    expect(
      publicationSchema.safeParse({ projectId: "p", published: false, summary: "" }).success,
    ).toBe(true);
    expect(
      publicationSchema.safeParse({ projectId: "p", published: true, summary: "   " }).success,
    ).toBe(false);
    expect(
      publicationSchema.safeParse({
        projectId: "p",
        published: true,
        summary: "Built an accessible weather dashboard with empty states.",
      }).success,
    ).toBe(true);
  });
  test("rejects executable and credential-bearing project URLs", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,hello",
      "https://user:secret@example.com",
      "example.com",
    ])
      expect(projectUrl.safeParse(url).success).toBe(false);
    for (const url of ["", "https://example.com/project", "http://localhost:3000"])
      expect(projectUrl.safeParse(url).success).toBe(true);
  });
});

test("syntax coloring preserves learner source exactly, including markup", () => {
  for (const source of [
    'const name = "<script>alert(1)</script>";\n// hello',
    "def total():\n  return 12",
    "<h1>Hello</h1>",
    "SELECT * FROM items;",
    "\n\n",
  ])
    expect(
      codeTokens(source)
        .map((token) => token.text)
        .join(""),
    ).toBe(source);
});
