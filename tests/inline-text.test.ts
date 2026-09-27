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
