/**
 * Runs a JavaScript-and-the-DOM challenge.
 *
 * The challenge supplies a fixed piece of markup; the learner supplies the
 * script. Both go into a fresh, inert document (`createHTMLDocument`), never the
 * app's own page, and the learner's code sees that document as `document`.
 * Tests act like a user — click, type, submit — and read the result, so any
 * working implementation passes. The Preview runs the same page with scripts
 * in a sandboxed frame for the learner to try by hand.
 *
 * Test helpers: document, $, $$, click(el), fill(el, value), submit(form),
 * text(el). Tests are expressions and may `await`. Each test runs on a fresh page.
 */

import {
  captureConsole,
  collapseWhitespace as collapse,
  errorMessage,
  withTimeout,
  type EngineOutcome,
  type TestSpec,
} from "./runtime-shared";

const TEST_TIMEOUT_MS = 3_000;

export async function runDomChallenge(
  code: string,
  html: string,
  tests: TestSpec[],
): Promise<EngineOutcome> {
  const logs: string[] = [];
  const console = captureConsole(logs);

  // Every test gets a fresh page with the script freshly run, so no test sees
  // the clicks of the one before it and the order of tests never matters.
  const freshPage = () => {
    const doc = document.implementation.createHTMLDocument("challenge");
    doc.body.innerHTML = html;
    return doc;
  };

  const helpersFor = (doc: Document) => ({
    document: doc,
    console,
    $: (selector: string) => doc.querySelector(selector),
    $$: (selector: string) => Array.from(doc.querySelectorAll(selector)),
    click: (el: Element | null) => {
      if (!el) throw new Error("click(): that element isn't on the page.");
      (el as HTMLElement).click();
    },
    fill: (el: Element | null, value: string) => {
      if (!el) throw new Error("fill(): that field isn't on the page.");
      const input = el as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    submit: (form: Element | null) => {
      if (!form) throw new Error("submit(): that form isn't on the page.");
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    },
    text: (el: Element | string | null) =>
      collapse((typeof el === "string" ? doc.querySelector(el) : el)?.textContent),
  });

  const run = async (
    expression: string | null,
  ): Promise<{ ok: boolean; detail?: string } | { crashed: string }> => {
    const helpers = helpersFor(freshPage());
    const check =
      expression === null
        ? "return { ok: true };"
        : `try {
  return { ok: Boolean(await (${expression})) };
} catch (e) {
  return { ok: false, detail: e && e.message ? e.message : String(e) };
}`;
    let fn: (...args: unknown[]) => Promise<{ ok: boolean; detail?: string }>;
    try {
      fn = new Function(
        ...Object.keys(helpers),
        `return (async () => {\n${code}\n;\n${check}\n})();`,
      ) as typeof fn;
    } catch (e) {
      return { crashed: errorMessage(e, true) };
    }
    try {
      return await withTimeout(fn(...Object.values(helpers)), TEST_TIMEOUT_MS, () => ({
        ok: false,
        detail: "The test timed out.",
      }));
    } catch (e) {
      // The learner's script itself threw while setting up the page.
      return { crashed: errorMessage(e, true) };
    }
  };

  // Run the script once on its own first, so its console output and any error
  // it throws are reported once rather than once per test.
  const setup = await run(null);
  if ("crashed" in setup) {
    return {
      logs,
      error: setup.crashed,
      results: tests.map(() => ({ passed: false, detail: null })),
    };
  }
  const logsFromSetup = logs.length;

  const results: EngineOutcome["results"] = [];
  for (const t of tests) {
    const outcome = await run(t.expression);
    results.push(
      "crashed" in outcome
        ? { passed: false, detail: outcome.crashed }
        : { passed: outcome.ok, detail: outcome.detail ?? null },
    );
  }
  return { logs: logs.slice(0, logsFromSetup), error: null, results };
}

/** The page for the Preview: markup plus the learner's script, run in a sandbox. */
export function previewDocument(code: string, html: string): string {
  // A literal "</script>" in the learner's code would end the script tag early.
  const safe = code.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
body { font-family: system-ui, sans-serif; padding: 1rem; line-height: 1.5; }
button { padding: 0.25rem 0.75rem; }
</style></head><body>${html}<script>${safe}</script></body></html>`;
}
