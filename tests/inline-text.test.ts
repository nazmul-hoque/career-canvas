import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { InlineText } from "../src/components/learn/InlineText";

const html = (text: string) => renderToStaticMarkup(createElement(InlineText, { text }));
const codeSpans = (text: string) =>
  [...html(text).matchAll(/<code[^>]*>(.*?)<\/code>/g)].map((m) => m[1]);

describe("inline lesson text", () => {
  test("single backticks are code", () => {
    expect(codeSpans("Use `const` by default")).toEqual(["const"]);
  });

  test("double backticks fence code that contains a backtick", () => {
    expect(codeSpans("Write `` `Hi, ${name}` `` instead.")).toEqual(["`Hi, ${name}`"]);
    expect(codeSpans("the `` !`git diff HEAD` `` line")).toEqual(["!`git diff HEAD`"]);
  });

  test("a lone backtick can be shown as code", () => {
    expect(codeSpans("backticks (`` ` ``, left of 1)")).toEqual(["`"]);
  });

  test("single and double fences mix in one sentence", () => {
    expect(codeSpans("`${ }` inside `` `…` ``")).toEqual(["${ }", "`…`"]);
  });

  test("markup in lesson text stays text", () => {
    expect(html("`<img onerror=x>` and <b>bold</b>")).not.toContain("<b>");
  });
});

describe("code inside bold and emphasis", () => {
  test("renders as code, not as raw backticks", () => {
    const out = html("**`--add-dir`** extends it, and *`null`* is falsy");
    expect(out).toContain("<strong><code");
    expect(out).toContain("<em><code");
    expect(out.replace(/<code[^>]*>.*?<\/code>/g, "")).not.toContain("`");
  });
});

describe("links", () => {
  test("an https link becomes a link that opens in a new tab", () => {
    const out = html(
      "See [narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).",
    );
    expect(out).toContain(
      '<a href="https://www.typescriptlang.org/docs/handbook/2/narrowing.html" target="_blank" rel="noreferrer"',
    );
    expect(out).toContain(">narrowing</a>");
    expect(out).not.toContain("](");
  });

  test("its label can hold code", () => {
    expect(html("[`noUncheckedIndexedAccess`](https://example.com/x)")).toContain("<code");
  });

  test("anything but https stays text", () => {
    for (const url of ["javascript:alert(1)", "http://example.com", "data:text/html,hi"]) {
      expect(html(`[click](${url})`)).not.toContain("<a");
    }
  });
});

describe("long code tokens", () => {
  test("may break, so a JSON string can't widen a quiz option past a phone", () => {
    expect(html('`{"name":"Ada","joined":"2026-01-05T00:00:00.000Z"}`')).toContain(
      "[overflow-wrap:anywhere]",
    );
  });
});
