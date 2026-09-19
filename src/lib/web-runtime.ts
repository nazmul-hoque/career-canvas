/**
 * Runs an HTML & CSS challenge.
 *
 * The learner writes a whole page (markup plus a <style> block). It's parsed
 * with the browser's own HTML parser (DOMParser), and the tests — JavaScript
 * expressions — check its structure and, through css-cascade.ts, which CSS
 * declaration applies to an element at a given viewport width. The Preview
 * renders the same page in a sandboxed frame so the learner sees the real
 * layout; grading never depends on pixel measurements.
 *
 * Test helpers:
 *   $(selector) / $$(selector)       first match / all matches in the page
 *   style(target, prop, width=1280)  the winning declared value, e.g. "grid"
 *   declared(prop)                   every value the stylesheet gives prop
 *   media()                          every @media condition used
 *   labelOf(field)                   the text of the label a form field has
 *   text(el)                         its text, whitespace collapsed
 *   source                           the page as written
 */
import { cascadedValue, parseCss, type Rule } from "./css-cascade";

export interface WebTestSpec {
  name: string;
  expression: string;
}

export interface WebRunOutcome {
  logs: string[];
  error: string | null;
  results: { passed: boolean; detail: string | null }[];
}

const collapse = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();

export function parsePage(source: string) {
  const doc = new DOMParser().parseFromString(source, "text/html");
  let order = 0;
  const rules: Rule[] = [];
  for (const style of Array.from(doc.querySelectorAll("style"))) {
    const parsed = parseCss(style.textContent ?? "", order);
    order += parsed.length;
    rules.push(...parsed);
  }
  return { doc, rules };
}

/** The label text a form control has: <label for>, a wrapping <label>, or aria-label. */
function labelOf(doc: Document, el: Element | null): string | null {
  if (!el) return null;
  const aria = el.getAttribute("aria-label");
  if (aria?.trim()) return collapse(aria);
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => doc.getElementById(id)?.textContent ?? "")
      .join(" ");
    if (collapse(text)) return collapse(text);
  }
  const id = el.getAttribute("id");
  if (id) {
    const forLabel = Array.from(doc.querySelectorAll("label")).find(
      (l) => l.getAttribute("for") === id,
    );
    if (forLabel && collapse(forLabel.textContent)) return collapse(forLabel.textContent);
  }
  const wrapping = el.closest("label");
  if (wrapping && collapse(wrapping.textContent)) return collapse(wrapping.textContent);
  return null;
}

/** A short outline of the page for the Output panel: the element tree, tags and classes. */
function outline(doc: Document): string[] {
  const lines: string[] = [];
  const walk = (el: Element, depth: number) => {
    if (lines.length > 60) return;
    const tag = el.tagName.toLowerCase();
    if (tag === "style" || tag === "script" || tag === "meta" || tag === "link") return;
    const id = el.id ? `#${el.id}` : "";
    const cls = el.classList.length ? `.${Array.from(el.classList).join(".")}` : "";
    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent ?? "")
      .join(" ");
    const snippet = collapse(own);
    lines.push(
      `${"  ".repeat(depth)}<${tag}${id}${cls}>${snippet ? ` ${snippet.slice(0, 40)}` : ""}`,
    );
    for (const child of Array.from(el.children)) walk(child, depth + 1);
  };
  walk(doc.body, 0);
  return lines;
}

export function runWebChallenge(source: string, tests: WebTestSpec[]): WebRunOutcome {
  let page: ReturnType<typeof parsePage>;
  try {
    page = parsePage(source);
  } catch (error) {
    return {
      logs: [],
      error: `The page couldn't be read: ${(error as Error).message}`,
      results: tests.map(() => ({ passed: false, detail: null })),
    };
  }
  const { doc, rules } = page;

  const resolve = (target: Element | string | null): Element | null =>
    typeof target === "string" ? doc.querySelector(target) : target;

  const helpers = {
    $: (selector: string) => doc.querySelector(selector),
    $$: (selector: string) => Array.from(doc.querySelectorAll(selector)),
    style: (target: Element | string | null, prop: string, width = 1280) => {
      const el = resolve(target);
      if (!el)
        throw new Error(
          `Couldn't find ${typeof target === "string" ? `"${target}"` : "that element"} on the page.`,
        );
      return cascadedValue(el, prop, rules, width);
    },
    declared: (prop: string) =>
      rules.flatMap((r) => r.declarations.filter((d) => d.prop === prop).map((d) => d.value)),
    media: () => [...new Set(rules.map((r) => r.media).filter((m): m is string => Boolean(m)))],
    labelOf: (target: Element | string | null) => labelOf(doc, resolve(target)),
    text: (target: Element | string | null) => collapse(resolve(target)?.textContent),
    source,
  };

  const results = tests.map((t) => {
    try {
      const fn = new Function(...Object.keys(helpers), `return (${t.expression});`);
      return { passed: fn(...Object.values(helpers)) === true, detail: null };
    } catch (error) {
      return { passed: false, detail: (error as Error).message };
    }
  });

  return { logs: outline(doc), error: null, results };
}
