/**
 * The pieces every challenge engine shares: the test and outcome shapes, a
 * captured console, whitespace collapsing, per-test timeouts, evaluating test
 * expressions against a set of helpers, and a form control's accessible name.
 * One definition each, so a `console.warn` or a label reads the same whichever
 * engine ran it.
 */

export interface TestSpec {
  name: string;
  /** An expression (or, for React, an async function body) in the challenge's terms. */
  expression: string;
}

/** What every engine hands back before code-runner turns it into a RunResult. */
export interface EngineOutcome {
  logs: string[];
  error: string | null;
  results: { passed: boolean; detail: string | null }[];
}

export const collapseWhitespace = (text: string | null | undefined) =>
  (text ?? "").replace(/\s+/g, " ").trim();

export const errorMessage = (error: unknown, withName = false): string =>
  error instanceof Error
    ? withName
      ? `${error.name}: ${error.message}`
      : error.message
    : typeof error === "string"
      ? error
      : "Something threw.";

/** A console whose output lands in `logs`, as the Output panel shows it. */
export function captureConsole(logs: string[]) {
  const format = (args: unknown[]) =>
    args
      .map((a) => {
        if (typeof a === "string") return a;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(" ");
  return {
    log: (...args: unknown[]) => logs.push(format(args)),
    info: (...args: unknown[]) => logs.push(format(args)),
    warn: (...args: unknown[]) => logs.push(`warning: ${format(args)}`),
    error: (...args: unknown[]) => logs.push(`error: ${format(args)}`),
  };
}

/** Settles with `promise`, or with `fallback` after `ms`; the timer never outlives the race. */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: () => T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve, reject) => {
        // A fallback may throw (React's does); that must reject, not escape the timer.
        timer = setTimeout(() => {
          try {
            resolve(fallback());
          } catch (error) {
            reject(error);
          }
        }, ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Evaluates each test expression with `helpers` in scope. A test passes only if
 * it returns exactly `true`; one that throws fails with its message as detail.
 */
export function evalTests(
  helpers: Record<string, unknown>,
  tests: TestSpec[],
  describe: (error: unknown) => string = errorMessage,
): EngineOutcome["results"] {
  const names = Object.keys(helpers);
  const values = Object.values(helpers);
  return tests.map((t) => {
    try {
      const fn = new Function(...names, `return (${t.expression});`);
      return { passed: fn(...values) === true, detail: null };
    } catch (error) {
      return { passed: false, detail: describe(error) };
    }
  });
}

/**
 * A form control's accessible name as far as the challenges need it:
 * aria-label, aria-labelledby, a <label for>, then a wrapping <label>.
 * `fallbackToText` adds what buttons and links use: an input button's value,
 * then the element's own text.
 */
export function accessibleName(el: Element, fallbackToText: boolean): string | null {
  const doc = el.ownerDocument;
  const aria = collapseWhitespace(el.getAttribute("aria-label"));
  if (aria) return aria;
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = collapseWhitespace(
      labelledBy
        .split(/\s+/)
        .map((id) => doc.getElementById(id)?.textContent ?? "")
        .join(" "),
    );
    if (text) return text;
  }
  const id = el.getAttribute("id");
  if (id) {
    const forLabel = Array.from(doc.querySelectorAll("label")).find(
      (label) => label.getAttribute("for") === id,
    );
    const text = collapseWhitespace(forLabel?.textContent);
    if (text) return text;
  }
  const wrapping = el.closest("label");
  if (wrapping && wrapping !== el) {
    const text = collapseWhitespace(wrapping.textContent);
    if (text) return text;
  }
  if (!fallbackToText) return null;
  const type = el.getAttribute("type");
  if (el.tagName === "INPUT" && (type === "submit" || type === "button")) {
    return collapseWhitespace((el as HTMLInputElement).value);
  }
  return collapseWhitespace(el.textContent);
}
