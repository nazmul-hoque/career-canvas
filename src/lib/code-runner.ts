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
import {
  captureConsole,
  errorMessage,
  withTimeout,
  type EngineOutcome,
  type TestSpec,
} from "./runtime-shared";

export type { TestSpec } from "./runtime-shared";

export interface TestResult {
  name: string;
  passed: boolean;
  /** Why it failed, when the engine can say (the React runtime can). */
  detail?: string | undefined;
}

export const CHALLENGE_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "sql",
  "react",
  "excel",
  "web",
  "dom",
] as const;

export type ChallengeLanguage = (typeof CHALLENGE_LANGUAGES)[number];

/** Which engine produced a result — the UI is honest about simulated runs. */
export type RunEngine = ChallengeLanguage | "python-simulated";

export interface RunResult {
  logs: string[];
  error: string | null;
  tests: TestResult[];
  passed: boolean;
  durationMs: number;
  engine: RunEngine;
}

/** Everything an engine's outcome needs to become the RunResult the UI shows. */
function toRunResult(
  engine: RunEngine,
  tests: TestSpec[],
  outcome: EngineOutcome,
  started: number,
): RunResult {
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
    engine,
  };
}

const failedOutcome = (tests: TestSpec[], error: string): EngineOutcome => ({
  logs: [],
  error,
  results: tests.map(() => ({ passed: false, detail: null })),
});

/** Per-test time limit, so a test awaiting a promise that never settles still fails. */
const JS_TEST_TIMEOUT_MS = 3_000;

/**
 * Runs the learner's code and the tests in one async scope, so tests can call
 * the learner's functions and `await` them. A test that throws or rejects has
 * failed, and its message is shown, which says far more than a red cross.
 */
export async function runJavaScript(code: string, tests: TestSpec[]): Promise<RunResult> {
  const started = performance.now();
  return toRunResult("javascript", tests, await runJavaScriptOutcome(code, tests), started);
}

/** The JavaScript core, shared with any engine that compiles down to JavaScript. */
async function runJavaScriptOutcome(code: string, tests: TestSpec[]): Promise<EngineOutcome> {
  const logs: string[] = [];
  const checks = tests
    .map(
      (t) => `async () => {
  try {
    return { ok: Boolean(await (${t.expression})) };
  } catch (e) {
    return { ok: false, detail: e && e.message ? e.name + ": " + e.message : String(e) };
  }
}`,
    )
    .join(",\n");
  const body = `return (async () => {\n${code}\n;return [${checks}];\n})();`;

  try {
    const fn = new Function("console", body) as (
      c: ReturnType<typeof captureConsole>,
    ) => Promise<(() => Promise<{ ok: boolean; detail?: string }>)[]>;
    const runners = await fn(captureConsole(logs));
    const results: EngineOutcome["results"] = [];
    for (const run of runners) {
      const outcome = await withTimeout(run(), JS_TEST_TIMEOUT_MS, () => ({
        ok: false,
        detail: "The test timed out: is a promise never resolving?",
      }));
      results.push({ passed: outcome.ok, detail: outcome.detail ?? null });
    }
    return { logs, error: null, results };
  } catch (e) {
    return { ...failedOutcome(tests, errorMessage(e, true)), logs };
  }
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

  return toRunResult(
    "python",
    tests,
    {
      logs: outcome.logs.length ? outcome.logs : ["(no output)"],
      error: outcome.error,
      results: outcome.results.map((passed) => ({ passed, detail: null })),
    },
    started,
  );
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
  const failed = (error: string) => toRunResult("sql", tests, failedOutcome(tests, error), started);

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

  return toRunResult(
    "sql",
    tests,
    {
      logs: outcome.logs,
      // "sqlite3.OperationalError: no such column: nme" → "no such column: nme"
      error: outcome.error?.replace(/^sqlite3\.\w+:\s*/, "") ?? null,
      results: outcome.results.map((passed) => ({ passed, detail: null })),
    },
    started,
  );
}

/** What a challenge needs besides its code: Excel's sheet, the DOM lessons' markup. */
export interface ChallengeContext {
  sheet?: string | undefined;
  html?: string | undefined;
}

type EngineRun = (
  code: string,
  tests: TestSpec[],
  context: ChallengeContext,
) => Promise<EngineOutcome>;

/**
 * The engines that load on first use, so a page without that kind of challenge
 * never downloads its runtime (the JSX compiler, the formula engine…). Each
 * entry only loads and runs; `runCode` handles a failed load, and anything the
 * engine throws, the same way for all of them.
 */
const LAZY_ENGINES: Record<
  "typescript" | "react" | "excel" | "web" | "dom",
  () => Promise<EngineRun>
> = {
  typescript: async () => {
    const { compileTypeScript } = await import("./typescript-runtime");
    return (code, tests) => runJavaScriptOutcome(compileTypeScript(code), tests);
  },
  react: async () => {
    const { runReactChallenge } = await import("./react-runtime");
    return (code, tests) => runReactChallenge(code, tests);
  },
  excel: async () => {
    const { runSheetChallenge } = await import("./sheet-runtime");
    return async (code, tests, context) => runSheetChallenge(code, context.sheet ?? "", tests);
  },
  web: async () => {
    const { runWebChallenge } = await import("./web-runtime");
    return async (code, tests) => runWebChallenge(code, tests);
  },
  dom: async () => {
    const { runDomChallenge } = await import("./dom-runtime");
    return (code, tests, context) => runDomChallenge(code, context.html ?? "", tests);
  },
};

export async function runCode(
  language: ChallengeLanguage,
  code: string,
  tests: TestSpec[],
  context: ChallengeContext = {},
): Promise<RunResult> {
  if (language === "javascript") return runJavaScript(code, tests);
  if (language === "python") return runPython(code, tests);
  if (language === "sql") return runSql(code, tests);

  const started = performance.now();
  let run: EngineRun;
  try {
    run = await LAZY_ENGINES[language]();
  } catch {
    return toRunResult(
      language,
      tests,
      failedOutcome(tests, "This runner couldn't load. Check your connection and run again."),
      started,
    );
  }
  try {
    return toRunResult(language, tests, await run(code, tests, context), started);
  } catch (e) {
    // Whatever the engine threw — a compile error in the learner's source, a
    // runtime that fell over — is the learner's result, not a crash.
    return toRunResult(language, tests, failedOutcome(tests, errorMessage(e, true)), started);
  }
}
