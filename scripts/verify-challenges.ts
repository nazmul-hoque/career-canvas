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
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { bodies } from "../src/content/lesson-bodies.server";
import type { LessonBlock } from "../src/content/lessons";
import { sqlProgram } from "../src/lib/code-runner";
import { PYTHON_DRIVER } from "../src/lib/python-runtime";

GlobalRegistrator.register();
const { runCode } = await import("../src/lib/code-runner");

type Challenge = Extract<LessonBlock, { kind: "challenge" }>;
interface Outcome {
  results: boolean[];
  error: string | null;
  /** Shown when a check fails; for Python, the error is the reason. */
  why?: string | null;
}

const PYTHON_CONCURRENCY = 8;

async function runPythonLocally(block: Challenge, code: string): Promise<Outcome> {
  const payload = JSON.stringify({
    code: block.language === "sql" ? sqlProgram(code, block.dataset) : code,
    tests: block.tests.map((t) => t.expression),
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
  const parsed = JSON.parse(marker) as { results: boolean[]; error: string | null };
  return { results: parsed.results, error: parsed.error };
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
  const ok = passed === check.shouldPass;
  if (!ok) failures++;
  const marks = outcome.results.map((r) => (r ? "✓" : "✗")).join("");
  console.log(
    `${ok ? "ok  " : "FAIL"} ${check.id} ${check.label} ${marks}${!ok && (outcome.error ?? outcome.why) ? `  ${outcome.error ?? outcome.why}` : ""}`,
  );
}

await new Promise((resolve) => setTimeout(resolve, 50));
await GlobalRegistrator.unregister();
process.exit(failures ? 1 : 0);
