/**
 * Execution service for the in-lesson code challenges.
 *
 * JavaScript runs in a sandboxed function with console.log captured. Python
 * runs for real on CPython-in-WebAssembly (see python-runtime.ts) — and when
 * that runtime cannot be reached, falls back to the old source-pattern
 * simulation, which reports itself as simulated so the UI never claims code ran
 * that did not. SQL runs on real SQLite inside the same Python runtime, against
 * the shop dataset; it has no simulation — if the engine can't load, it says so.
 *
 * `RunResult` is the contract the lesson UI depends on: swap any engine for a
 * network call without changing the shape.
 */
import { SHOP_SQL } from "@/content/datasets/shop";
import { runPythonInPyodide } from "./python-runtime";

export interface TestResult {
  name: string;
  passed: boolean;
  /** Why it failed, when the engine can say (the React runtime can). */
  detail?: string | undefined;
}

/** Which engine produced a result — the UI is honest about simulated runs. */
export type RunEngine = "javascript" | "python" | "python-simulated" | "sql" | "react" | "excel";

export type ChallengeLanguage = "javascript" | "python" | "sql" | "react" | "excel";

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

/** Longest result the output panel prints; tests still see every row. */
const SQL_PRINT_ROWS = 25;

/**
 * A learner's query, wrapped as a Python program: load the dataset into a fresh
 * in-memory database, run the query, print the result as a table, and leave
 * `rows` (a list of tuples) and `columns` (a list of names) for the tests.
 * Strings cross into Python as JSON literals, which are valid Python strings.
 */
export function sqlProgram(query: string): string {
  return [
    "import json, sqlite3",
    `__db = sqlite3.connect(":memory:")`,
    `__db.executescript(json.loads(${JSON.stringify(JSON.stringify(SHOP_SQL))}))`,
    `__cur = __db.execute(json.loads(${JSON.stringify(JSON.stringify(query))}))`,
    "columns = [d[0] for d in __cur.description] if __cur.description else []",
    "rows = __cur.fetchall()",
    "__cells = [[('NULL' if v is None else str(v)) for v in r] for r in rows]",
    "__widths = [max([len(c)] + [len(r[i]) for r in __cells]) for i, c in enumerate(columns)]",
    "print('  '.join(c.ljust(w) for c, w in zip(columns, __widths)))",
    "print('  '.join('-' * w for w in __widths))",
    `for __r in __cells[:${SQL_PRINT_ROWS}]:`,
    "    print('  '.join(v.ljust(w) for v, w in zip(__r, __widths)))",
    `if len(rows) > ${SQL_PRINT_ROWS}:`,
    `    print(f"... {len(rows) - ${SQL_PRINT_ROWS}} more")`,
    "print(f\"({len(rows)} {'row' if len(rows) == 1 else 'rows'})\")",
  ].join("\n");
}

async function runSql(query: string, tests: TestSpec[]): Promise<RunResult> {
  const started = performance.now();
  const failed = (error: string): RunResult => ({
    logs: [],
    error,
    tests: tests.map((t) => ({ name: t.name, passed: false })),
    passed: false,
    durationMs: Math.round(performance.now() - started),
    engine: "sql",
  });

  if (!query.replace(/--.*$/gm, "").trim()) return failed("Write a query first.");

  const outcome = await runPythonInPyodide(
    sqlProgram(query),
    tests.map((t) => t.expression),
  );
  // No simulation for SQL: guessing a result table from the query text would
  // be exactly the kind of fake run the UI promises never to show.
  if (!outcome) {
    return failed(
      "The SQL engine couldn't load. It runs in your browser and downloads on first use, so check your connection and run again.",
    );
  }

  const results = tests.map((t, i) => ({ name: t.name, passed: Boolean(outcome.results[i]) }));
  return {
    logs: outcome.logs,
    // "sqlite3.OperationalError: no such column: nme" → "no such column: nme"
    error: outcome.error?.replace(/^sqlite3\.\w+:\s*/, "") ?? null,
    tests: results,
    passed: results.length > 0 && results.every((r) => r.passed) && !outcome.error,
    durationMs: Math.round(performance.now() - started),
    engine: "sql",
  };
}

/**
 * React components render for real with the app's own React (react-runtime.ts),
 * loaded on first use so pages without a React challenge never download the
 * JSX compiler.
 */
async function runReact(code: string, tests: TestSpec[]): Promise<RunResult> {
  const started = performance.now();
  let outcome;
  try {
    const { runReactChallenge } = await import("./react-runtime");
    outcome = await runReactChallenge(code, tests);
  } catch {
    outcome = {
      logs: [],
      error: "The React runner couldn't load. Check your connection and run again.",
      results: tests.map(() => ({ passed: false, detail: null })),
    };
  }
  const results = tests.map((t, i) => ({
    name: t.name,
    passed: Boolean(outcome.results[i]?.passed),
    detail: outcome.results[i]?.detail ?? undefined,
  }));
  return {
    logs: outcome.logs,
    error: outcome.error,
    tests: results,
    passed: results.length > 0 && results.every((r) => r.passed) && !outcome.error,
    durationMs: Math.round(performance.now() - started),
    engine: "react",
  };
}

/**
 * Excel challenges run on the dependency-free formula engine in
 * sheet-engine.ts, loaded on first use like the other engines.
 */
async function runExcel(code: string, tests: TestSpec[], sheet: string): Promise<RunResult> {
  const started = performance.now();
  const { runSheetChallenge } = await import("./sheet-runtime");
  const outcome = runSheetChallenge(code, sheet, tests);
  const results = tests.map((t, i) => ({
    name: t.name,
    passed: Boolean(outcome.results[i]?.passed),
    detail: outcome.results[i]?.detail ?? undefined,
  }));
  return {
    logs: outcome.logs,
    error: outcome.error,
    tests: results,
    passed: results.length > 0 && results.every((r) => r.passed) && !outcome.error,
    durationMs: Math.round(performance.now() - started),
    engine: "excel",
  };
}

export async function runCode(
  language: ChallengeLanguage,
  code: string,
  tests: TestSpec[],
  options: { sheet?: string | undefined } = {},
): Promise<RunResult> {
  if (language === "excel") return runExcel(code, tests, options.sheet ?? "");
  if (language === "python") return runPython(code, tests);
  if (language === "sql") return runSql(code, tests);
  if (language === "react") return runReact(code, tests);
  // JavaScript is fast enough to finish before the spinner paints; the small
  // delay keeps the running state visible rather than flickering.
  await new Promise((r) => setTimeout(r, 250));
  return runJavaScript(code, tests);
}
