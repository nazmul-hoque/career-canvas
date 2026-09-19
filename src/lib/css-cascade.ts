/**
 * Which CSS declaration wins for an element — the cascade, computed the same
 * way in every environment.
 *
 * The HTML & CSS challenges grade what the learner wrote: the structure of the
 * page and the rule that applies to each element at a given viewport width
 * (importance, specificity, source order, inheritance, @media, and the common
 * shorthands). Real pixel layout is left to the browser's Preview; it can't be
 * reproduced outside one, and a test that passes in one engine and fails in
 * another would be worse than no test.
 *
 * Values are returned as written (lower-cased, whitespace collapsed), because
 * that is what a learner can see and fix — not a browser's resolved pixels.
 */

export interface Declaration {
  prop: string;
  value: string;
  important: boolean;
}

export interface Rule {
  selectors: string[];
  declarations: Declaration[];
  /** The @media condition the rule sits inside, if any. */
  media: string | null;
  order: number;
}

const normalise = (v: string) => v.trim().replace(/\s+/g, " ").toLowerCase();

export function parseDeclarations(block: string): Declaration[] {
  const out: Declaration[] = [];
  for (const part of splitTopLevel(block, ";")) {
    const colon = part.indexOf(":");
    if (colon === -1) continue;
    const prop = part.slice(0, colon).trim().toLowerCase();
    let value = part.slice(colon + 1).trim();
    if (!prop || !value) continue;
    const important = /!\s*important\s*$/i.test(value);
    if (important) value = value.replace(/!\s*important\s*$/i, "").trim();
    out.push({ prop, value: normalise(value), important });
  }
  return out;
}

/** Splits on `sep` outside parentheses and quotes (so `url(a;b)` survives). */
function splitTopLevel(text: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = "";
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === sep && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/** Parses a stylesheet into rules, one level of @media deep; other at-rules are skipped. */
export function parseCss(css: string, startOrder = 0): Rule[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: Rule[] = [];
  let order = startOrder;

  function walk(source: string, media: string | null) {
    let i = 0;
    while (i < source.length) {
      const open = source.indexOf("{", i);
      if (open === -1) break;
      const prelude = source.slice(i, open).trim();
      // Find the matching close brace.
      let depth = 1;
      let j = open + 1;
      while (j < source.length && depth > 0) {
        if (source[j] === "{") depth++;
        else if (source[j] === "}") depth--;
        j++;
      }
      const body = source.slice(open + 1, j - 1);
      if (prelude.startsWith("@media")) {
        const condition = normalise(prelude.slice("@media".length));
        walk(body, media ? `${media} and ${condition}` : condition);
      } else if (prelude.startsWith("@")) {
        // @font-face, @keyframes, @supports…: not part of these lessons.
      } else if (prelude) {
        rules.push({
          selectors: splitTopLevel(prelude, ",")
            .map((s) => s.trim())
            .filter(Boolean),
          declarations: parseDeclarations(body),
          media,
          order: order++,
        });
      }
      i = j;
    }
  }

  walk(text, null);
  return rules;
}

// ─── Specificity ───────────────────────────────────────────────────────────

export type Specificity = [number, number, number];

/** (ids, classes/attributes/pseudo-classes, elements/pseudo-elements). */
export function specificity(selector: string): Specificity {
  let s = selector;
  let a = 0;
  let b = 0;
  let c = 0;
  // :where() adds nothing; :is()/:not()/:has() add their most specific argument.
  s = s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, "");
  s = s.replace(/:(is|not|has)\(((?:[^()]|\([^()]*\))*)\)/g, (_, _name, inner: string) => {
    const best = splitTopLevel(inner, ",")
      .map((x) => specificity(x))
      .sort(compareSpecificity)
      .at(-1) ?? [0, 0, 0];
    a += best[0];
    b += best[1];
    c += best[2];
    return "";
  });
  s = s.replace(/\[[^\]]*\]/g, () => {
    b++;
    return "";
  });
  s = s.replace(/::[\w-]+(\([^)]*\))?/g, () => {
    c++;
    return "";
  });
  s = s.replace(/:[\w-]+(\([^)]*\))?/g, () => {
    b++;
    return "";
  });
  s = s.replace(/#[\w-]+/g, () => {
    a++;
    return "";
  });
  s = s.replace(/\.[\w-]+/g, () => {
    b++;
    return "";
  });
  for (const token of s.split(/[\s>+~]+/)) {
    if (/^[a-z][\w-]*$/i.test(token)) c++;
  }
  return [a, b, c];
}

export function compareSpecificity(x: Specificity, y: Specificity): number {
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

// ─── Media queries ─────────────────────────────────────────────────────────

const toPx = (value: number, unit: string) =>
  unit === "em" || unit === "rem" ? value * 16 : value;

/** Evaluates width-based media queries: `(min-width: 48rem)`, `screen and (max-width: 600px)`, commas. */
export function mediaMatches(query: string, width: number): boolean {
  return query.split(",").some((alternative) => {
    const q = alternative.trim();
    if (/^not\b/.test(q)) return false;
    const parts = q.split(/\s+and\s+/);
    return parts.every((part) => {
      const p = part.trim().replace(/^only\s+/, "");
      if (p === "all" || p === "screen" || p === "") return true;
      if (p === "print") return false;
      const m = /^\(\s*(min|max)-width\s*:\s*([\d.]+)(px|em|rem)\s*\)$/.exec(p);
      if (m) {
        const px = toPx(Number(m[2]), m[3]!);
        return m[1] === "min" ? width >= px : width <= px;
      }
      const range = /^\(\s*width\s*(>=|<=|>|<)\s*([\d.]+)(px|em|rem)\s*\)$/.exec(p);
      if (range) {
        const px = toPx(Number(range[2]), range[3]!);
        return range[1] === ">="
          ? width >= px
          : range[1] === "<="
            ? width <= px
            : range[1] === ">"
              ? width > px
              : width < px;
      }
      // prefers-color-scheme, prefers-reduced-motion, orientation…: not the default.
      return false;
    });
  });
}

// ─── Shorthands ────────────────────────────────────────────────────────────

const SIDES = ["top", "right", "bottom", "left"] as const;

function boxSides(value: string): Record<(typeof SIDES)[number], string> {
  const v = splitTopLevel(value, " ")
    .map((x) => x.trim())
    .filter(Boolean);
  const [t = "", r = t, b = t, l = r] = v;
  return { top: t, right: r, bottom: b, left: l };
}

function flexParts(value: string): { grow: string; shrink: string; basis: string } {
  if (value === "none") return { grow: "0", shrink: "0", basis: "auto" };
  if (value === "auto") return { grow: "1", shrink: "1", basis: "auto" };
  const v = value.split(" ");
  const isNumber = (x: string | undefined) => x !== undefined && /^[\d.]+$/.test(x);
  if (v.length === 1)
    return isNumber(v[0])
      ? { grow: v[0]!, shrink: "1", basis: "0%" }
      : { grow: "1", shrink: "1", basis: v[0]! };
  if (v.length === 2) {
    return isNumber(v[1])
      ? { grow: v[0]!, shrink: v[1]!, basis: "0%" }
      : { grow: v[0]!, shrink: "1", basis: v[1]! };
  }
  return { grow: v[0]!, shrink: v[1]!, basis: v[2]! };
}

/** For a longhand, the shorthand that can also set it and how to read it out. */
function shorthandFor(
  prop: string,
): { name: string; pick: (value: string) => string | undefined } | null {
  for (const box of ["margin", "padding"]) {
    const side = SIDES.find((s) => prop === `${box}-${s}`);
    if (side) return { name: box, pick: (v) => boxSides(v)[side] };
  }
  if (prop === "flex-grow") return { name: "flex", pick: (v) => flexParts(v).grow };
  if (prop === "flex-shrink") return { name: "flex", pick: (v) => flexParts(v).shrink };
  if (prop === "flex-basis") return { name: "flex", pick: (v) => flexParts(v).basis };
  if (prop === "row-gap") return { name: "gap", pick: (v) => v.split(" ")[0] };
  if (prop === "column-gap")
    return { name: "gap", pick: (v) => v.split(" ")[1] ?? v.split(" ")[0] };
  return null;
}

// ─── The cascade ───────────────────────────────────────────────────────────

const INHERITED = new Set([
  "color",
  "font",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "visibility",
  "list-style",
  "list-style-type",
]);

interface Candidate {
  value: string;
  important: boolean;
  inline: boolean;
  specificity: Specificity;
  order: number;
}

function safeMatches(el: Element, selector: string): boolean {
  try {
    return el.matches(selector);
  } catch {
    return false;
  }
}

/**
 * The declared value of `prop` that wins for `el` at a viewport `width`, or
 * null if nothing sets it (inherited properties fall back to the parent's).
 */
export function cascadedValue(
  el: Element,
  prop: string,
  rules: Rule[],
  width: number,
): string | null {
  const name = prop.toLowerCase();
  const shorthand = shorthandFor(name);
  const candidates: Candidate[] = [];

  const consider = (decl: Declaration, spec: Specificity, order: number, inline: boolean) => {
    let value: string | undefined;
    if (decl.prop === name) value = decl.value;
    else if (shorthand && decl.prop === shorthand.name) value = shorthand.pick(decl.value);
    if (value === undefined) return;
    candidates.push({ value, important: decl.important, inline, specificity: spec, order });
  };

  for (const rule of rules) {
    if (rule.media && !mediaMatches(rule.media, width)) continue;
    const matching = rule.selectors.filter((s) => safeMatches(el, s));
    if (!matching.length) continue;
    const spec = matching.map(specificity).sort(compareSpecificity).at(-1)!;
    for (const decl of rule.declarations) consider(decl, spec, rule.order, false);
  }
  const inlineStyle = el.getAttribute("style");
  if (inlineStyle) {
    for (const decl of parseDeclarations(inlineStyle))
      consider(decl, [0, 0, 0], Number.MAX_SAFE_INTEGER, true);
  }

  if (candidates.length) {
    candidates.sort(
      (x, y) =>
        Number(x.important) - Number(y.important) ||
        Number(x.inline) - Number(y.inline) ||
        compareSpecificity(x.specificity, y.specificity) ||
        x.order - y.order,
    );
    const winner = candidates.at(-1)!.value;
    if (winner !== "inherit") return winner;
  }
  if ((INHERITED.has(name) || candidates.at(-1)?.value === "inherit") && el.parentElement) {
    return cascadedValue(el.parentElement, name, rules, width);
  }
  return null;
}
