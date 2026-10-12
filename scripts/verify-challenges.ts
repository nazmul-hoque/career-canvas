/**
 * Runs every challenge's reference solution and starter the way a learner's
 * browser would:
 *
 *   bun run lessons:verify
 *
 * Python and SQL run the real Pyodide driver (PYTHON_DRIVER) under local
 * python3 — its sqlite3 is the same engine — several at a time. Every other
 * language goes through the browser's own `runCode`, in a simulated DOM, so the
 * pass rule is the one learners get. The solution must pass every test and the
 * starter must fail at least one; otherwise the challenge is unsolvable or
 * already solved. Python solutions are complete programs, so any helpers the
 * tests call (datasets, scripted models) must be in the solution as well as
 * the starter.
 *
 * A test's `show` must evaluate on both: in the browser one that raises just
 * leaves the failure unexplained, which nothing else would notice.
 * `--shows` prints what each failing starter test would tell the learner.
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { bodies } from "../src/content/lesson-bodies.server";
import type { LessonBlock } from "../src/content/lessons";
import { pythonTests, sqlProgram } from "../src/lib/code-runner";
import { PYTHON_DRIVER, type PythonTest } from "../src/lib/python-runtime";

GlobalRegistrator.register();
const { runCode } = await import("../src/lib/code-runner");

type Challenge = Extract<LessonBlock, { kind: "challenge" }>;
interface Outcome {
  results: boolean[];
  error: string | null;
  /** Shown when a check fails; for Python, the error is the reason. */
  why?: string | null;
  /** What each failing test would show the learner. */
  details?: (string | null)[];
  /** Tests whose `show` raised. */
  brokenShows?: string[];
}

const SHOW_DETAILS = process.argv.includes("--shows");

/** Each `show`, as a test that passes when it evaluates at all. */
const showChecks = (block: Challenge): PythonTest[] =>
  block.tests.flatMap((t) => (t.show ? [{ expression: `((${t.show}), True)[1]` }] : []));

const PYTHON_CONCURRENCY = 8;

async function runPythonLocally(block: Challenge, code: string): Promise<Outcome> {
  const sql = block.language === "sql";
  const payload = JSON.stringify({
    code: sql ? sqlProgram(code, block.dataset) : code,
    tests: [...pythonTests(block.tests, sql ? "NULL" : undefined), ...showChecks(block)],
  });
  const program = `__ascent_payload = ${JSON.stringify(payload)}\n${PYTHON_DRIVER}\nprint("__RESULT__" + __ascent_result)`;
  const proc = Bun.spawn(["python3", "-c", program], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  await proc.exited;
  const marker = stdout.split("__RESULT__")[1];
  if (!marker) return { results: [], error: stderr.trim().split("\n").at(-1) ?? "no output" };
  const parsed = JSON.parse(marker) as {
    results: { passed: boolean; detail: string | null }[];
    error: string | null;
  };
  const own = parsed.results.slice(0, block.tests.length);
  const shows = parsed.results.slice(block.tests.length);
  const withShow = block.tests.filter((t) => t.show);
  return {
    results: own.map((r) => r.passed),
    error: parsed.error,
    details: own.map((r) => r.detail),
    // A run that errored evaluates nothing, so there is no show to judge.
    brokenShows: parsed.error
      ? []
      : withShow.filter((_, i) => !shows[i]?.passed).map((t) => t.name),
  };
}

async function runInBrowserEngine(block: Challenge, code: string): Promise<Outcome> {
  const run = await runCode(block.language, code, block.tests, {
    sheet: block.sheet,
    html: block.html,
    dataset: block.dataset,
    setup: block.setup,
  });
  // A failing test's detail is shown next to FAIL; it isn't a run error.
  const why = run.tests.find((t) => t.detail)?.detail ?? null;
  return { results: run.tests.map((t) => t.passed), error: run.error, why };
}

/** Runs `jobs` with at most `limit` in flight, keeping their order. */
async function pool<T>(jobs: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const out: T[] = new Array(jobs.length);
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const i = next++;
      out[i] = await jobs[i]!();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker));
  return out;
}

const checks = Object.entries(bodies).flatMap(([id, body]) =>
  body.blocks.flatMap((block) =>
    block.kind !== "challenge"
      ? []
      : ([
          { id, block, label: "solution", code: block.solution, shouldPass: true },
          { id, block, label: "starter", code: block.starter, shouldPass: false },
        ] as const),
  ),
);

const isPython = (b: Challenge) => b.language === "python" || b.language === "sql";
const pythonOutcomes = await pool(
  checks.filter((c) => isPython(c.block)).map((c) => () => runPythonLocally(c.block, c.code)),
  PYTHON_CONCURRENCY,
);

let failures = 0;
let pythonIndex = 0;
for (const check of checks) {
  const outcome = isPython(check.block)
    ? pythonOutcomes[pythonIndex++]!
    : await runInBrowserEngine(check.block, check.code);
  // The browser's rule: every test passed and the run reported no error.
  const passed =
    outcome.results.length === check.block.tests.length &&
    outcome.results.every(Boolean) &&
    !outcome.error;
  // An empty-editor starter is never run in the browser ("Write a query first.").
  const runs = check.code.replace(check.block.language === "sql" ? /--.*$/gm : /#.*$/gm, "").trim();
  const brokenShows = runs ? (outcome.brokenShows ?? []) : [];
  const ok = passed === check.shouldPass && brokenShows.length === 0;
  if (!ok) failures++;
  const marks = outcome.results.map((r) => (r ? "✓" : "✗")).join("");
  console.log(
    `${ok ? "ok  " : "FAIL"} ${check.id} ${check.label} ${marks}${!ok && (outcome.error ?? outcome.why) ? `  ${outcome.error ?? outcome.why}` : ""}`,
  );
  for (const name of brokenShows) console.log(`       show raised: ${name}`);
  if (SHOW_DETAILS && check.label === "starter" && runs) {
    check.block.tests.forEach((t, i) => {
      if (!outcome.results[i] && outcome.details?.[i]) {
        console.log(`       ${t.name}: ${outcome.details[i]}`);
      }
    });
  }
}

await new Promise((resolve) => setTimeout(resolve, 50));
await GlobalRegistrator.unregister();
process.exit(failures ? 1 : 0);
