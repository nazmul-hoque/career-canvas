/**
 * Execution service for the in-lesson code challenges.
 *
 * JavaScript runs in a sandboxed function with console.log captured. Python
 * runs for real on CPython-in-WebAssembly (see python-runtime.ts) — and when
 * that runtime cannot be reached, falls back to the old source-pattern
 * simulation, which reports itself as simulated so the UI never claims code ran
 * that did not.
 *
 * `RunResult` is the contract the lesson UI depends on: swap any engine for a
 * network call without changing the shape.
 */
import { runPythonInPyodide } from "./python-runtime";

export interface TestResult {
  name: string;
  passed: boolean;
}

/** Which engine produced a result — the UI is honest about simulated runs. */
export type RunEngine = "javascript" | "python" | "python-simulated";

export interface RunResult {
  logs: string[];
  error: string | null;
  tests: TestResult[];
  passed: boolean;
  durationMs: number;
  engine: RunEngine;
}

export interface TestSpec {
  name: string;
  /** An expression in the challenge's own language, evaluated after the user code. */
  expression: string;
}

function runJavaScript(code: string, tests: TestSpec[]): RunResult {
  const logs: string[] = [];
  const started = performance.now();
  const capture = (...args: unknown[]) =>
    logs.push(
      args
        .map((a) => {
          if (typeof a === "string") return a;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(" "),
    );

  let error: string | null = null;
  const results: TestResult[] = [];

  try {
    const body = `${code}\n;return [${tests.map((t) => `(() => { try { return Boolean(${t.expression}); } catch (e) { return false; } })()`).join(",")}];`;
    const fn = new Function("console", body) as (c: { log: typeof capture }) => boolean[];
    const outcomes = fn({ log: capture }) ?? [];
    tests.forEach((t, i) => results.push({ name: t.name, passed: Boolean(outcomes[i]) }));
  } catch (e) {
    error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    tests.forEach((t) => results.push({ name: t.name, passed: false }));
  }

  return {
    logs,
    error,
    tests: results,
    passed: results.length > 0 && results.every((r) => r.passed) && !error,
    durationMs: Math.round(performance.now() - started),
    engine: "javascript",
  };
}

/**
 * Last resort only. It reads the source instead of running it, so it can be
 * fooled by a comment — which is exactly why results carry the engine that
 * produced them and the UI labels these runs.
 */
function runPythonSimulated(code: string, tests: TestSpec[], started: number): RunResult {
  const logs: string[] = [];
  const printed = code.match(/print\((.*)\)/g) ?? [];
  printed.forEach((line) => {
    const inner = line.slice(6, -1).trim();
    logs.push(inner.replace(/^["']|["']$/g, ""));
  });
  if (logs.length === 0) logs.push("(no output)");

  // Test expressions are written for a real interpreter, so the best this can
  // do is look for the identifiers they mention.
  const normalised = code.replace(/\s+/g, " ");
  const results = tests.map((t) => {
    const identifiers = t.expression.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
    return {
      name: t.name,
      passed: identifiers.length > 0 && identifiers.some((id) => normalised.includes(id)),
    };
  });

  const error = /\bpass\s*$/.test(code.trim()) ? "Your function still contains only `pass`." : null;

  return {
    logs,
    error,
    tests: results,
    passed: results.length > 0 && results.every((r) => r.passed) && !error,
    durationMs: Math.round(performance.now() - started),
    engine: "python-simulated",
  };
}

async function runPython(code: string, tests: TestSpec[]): Promise<RunResult> {
  const started = performance.now();
  const outcome = await runPythonInPyodide(
    code,
    tests.map((t) => t.expression),
  );

  if (!outcome) return runPythonSimulated(code, tests, started);

  const results = tests.map((t, i) => ({ name: t.name, passed: Boolean(outcome.results[i]) }));
  return {
    logs: outcome.logs.length ? outcome.logs : ["(no output)"],
    error: outcome.error,
    tests: results,
    passed: results.length > 0 && results.every((r) => r.passed) && !outcome.error,
    durationMs: Math.round(performance.now() - started),
    engine: "python",
  };
}

export async function runCode(
  language: "javascript" | "python",
  code: string,
  tests: TestSpec[],
): Promise<RunResult> {
  if (language === "python") return runPython(code, tests);
  // JavaScript is fast enough to finish before the spinner paints; the small
  // delay keeps the running state visible rather than flickering.
  await new Promise((r) => setTimeout(r, 250));
  return runJavaScript(code, tests);
}
