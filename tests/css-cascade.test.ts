import { describe, expect, test } from "bun:test";
import { registerHappyDom } from "./happy-dom";

import { mediaMatches, parseCss, specificity } from "../src/lib/css-cascade";

/**
 * The cascade behind the HTML & CSS challenges. Each expectation is what the
 * CSS specification (and so every browser) decides; the selector matching
 * itself is the DOM's own `Element.matches`.
 */
registerHappyDom();

const { runWebChallenge, parsePage } = await import("../src/lib/web-runtime");
const { cascadedValue } = await import("../src/lib/css-cascade");

function valueOf(html: string, selector: string, prop: string, width = 1280) {
  const { doc, rules } = parsePage(html);
  return cascadedValue(doc.querySelector(selector)!, prop, rules, width);
}

describe("specificity", () => {
  test("counts ids, classes/attributes/pseudo-classes and elements", () => {
    expect(specificity("#nav a")).toEqual([1, 0, 1]);
    expect(specificity(".card .price")).toEqual([0, 2, 0]);
    expect(specificity("ul li:first-child")).toEqual([0, 1, 2]);
    expect(specificity('input[type="email"]')).toEqual([0, 1, 1]);
    expect(specificity("p::first-line")).toEqual([0, 0, 2]);
    expect(specificity("*")).toEqual([0, 0, 0]);
    expect(specificity(":where(.a) p")).toEqual([0, 0, 1]);
    expect(specificity(":is(#x, .y) p")).toEqual([1, 0, 1]);
    expect(specificity("a:not(.external)")).toEqual([0, 1, 1]);
  });
});

describe("the cascade", () => {
  const page = (css: string, body = '<main id="m"><p class="price sale" style="">x</p></main>') =>
    `<style>${css}</style>${body}`;

  test("specificity beats order; order breaks ties", () => {
    expect(valueOf(page("#m p { color: grey } .sale { color: red }"), "p", "color")).toBe("grey");
    expect(valueOf(page(".price { color: grey } .sale { color: red }"), "p", "color")).toBe("red");
  });

  test("!important beats specificity, and inline styles beat rules", () => {
    expect(
      valueOf(page("#m p { color: grey } .sale { color: red !important }"), "p", "color"),
    ).toBe("red");
    expect(
      valueOf(
        page(".sale { color: red }", '<p class="sale" style="color: blue">x</p>'),
        "p",
        "color",
      ),
    ).toBe("blue");
  });

  test("inherited properties come from the parent; others don't", () => {
    expect(valueOf(page("main { color: navy; padding: 2rem }"), "p", "color")).toBe("navy");
    expect(valueOf(page("main { color: navy; padding: 2rem }"), "p", "padding-top")).toBeNull();
  });

  test("shorthands and longhands compete in the cascade", () => {
    expect(valueOf(page(".sale { padding: 1rem 2rem }"), "p", "padding-left")).toBe("2rem");
    expect(
      valueOf(page(".sale { padding: 1rem } .sale { padding-top: 0 }"), "p", "padding-top"),
    ).toBe("0");
    expect(valueOf(page(".sale { flex: 1 }"), "p", "flex-basis")).toBe("0%");
    expect(valueOf(page(".sale { flex: 1 1 240px }"), "p", "flex-basis")).toBe("240px");
    expect(valueOf(page(".sale { gap: 1rem 2rem }"), "p", "column-gap")).toBe("2rem");
  });

  test("@media rules apply only at matching widths", () => {
    const css = ".sale { display: block } @media (min-width: 48rem) { .sale { display: flex } }";
    expect(valueOf(page(css), "p", "display", 375)).toBe("block");
    expect(valueOf(page(css), "p", "display", 1024)).toBe("flex");
  });

  test("comments, @font-face and invalid selectors are ignored, not fatal", () => {
    const css =
      "/* note */ @font-face { font-family: X } p:nope( { color: red } .sale { color: teal }";
    expect(valueOf(page(css), "p", "color")).toBe("teal");
  });
});

describe("media queries", () => {
  test("min-width, max-width, em, ranges, and alternatives", () => {
    expect(mediaMatches("(min-width: 768px)", 1024)).toBe(true);
    expect(mediaMatches("(min-width: 48em)", 700)).toBe(false);
    expect(mediaMatches("screen and (max-width: 600px)", 375)).toBe(true);
    expect(mediaMatches("(width >= 40rem)", 640)).toBe(true);
    expect(mediaMatches("print, (min-width: 1px)", 10)).toBe(true);
    expect(mediaMatches("(prefers-reduced-motion: reduce)", 1024)).toBe(false);
  });

  test("parseCss nests one level of @media", () => {
    const rules = parseCss(
      "@media (min-width: 40rem) { .a { color: red } .b { color: blue } } .c { color: green }",
    );
    expect(rules.map((r) => r.media)).toEqual(["(min-width: 40rem)", "(min-width: 40rem)", null]);
  });
});

describe("web runtime", () => {
  test("structure, labels and styles through the test helpers", () => {
    const html = `<style>.nav { display: flex; justify-content: space-between }</style>
      <nav class="nav"><a href="/">Home</a></nav>
      <label for="e">Email</label><input id="e" type="email">
      <label>Name <input name="n"></label>`;
    const run = runWebChallenge(html, [
      { name: "flex", expression: 'style(".nav", "display") === "flex"' },
      { name: "for-label", expression: 'labelOf("#e") === "Email"' },
      { name: "wrapping label", expression: 'labelOf("[name=n]") === "Name"' },
      { name: "missing", expression: 'style(".nope", "display") === "flex"' },
    ]);
    expect(run.results.map((r) => r.passed)).toEqual([true, true, true, false]);
    expect(run.results[3]?.detail).toContain("Couldn't find");
  });
});
