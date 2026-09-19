/**
 * Runs every SQL, Python, React, Excel and HTML & CSS challenge the way the browser does: SQL and
 * Python on the local python3 (the same program Pyodide runs; its sqlite3 is
 * the same engine), React through react-runtime.ts itself in a simulated DOM:
 *
 *   bun run lessons:verify
 *
 * The reference solution must pass every test and the starter must fail at
 * least one; otherwise the challenge is unsolvable or already solved. Python
 * solutions are complete programs, so any helpers the tests call (datasets,
 * scripted models) must be in the solution as well as the starter. Run it after
 * changing a challenge or src/content/datasets/shop.ts.
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { bodies } from "../src/content/lesson-bodies.server";
import { sqlProgram } from "../src/lib/code-runner";
import { runSheetChallenge } from "../src/lib/sheet-runtime";

GlobalRegistrator.register();
const { runReactChallenge } = await import("../src/lib/react-runtime");
const { runWebChallenge } = await import("../src/lib/web-runtime");

async function reactResults(code: string, tests: { name: string; expression: string }[]) {
  const run = await runReactChallenge(code, tests);
  return {
    results: run.results.map((r) => r.passed),
    error: run.error ?? run.results.find((r) => r.detail)?.detail ?? "",
  };
}

let failures = 0;
for (const [id, body] of Object.entries(bodies)) {
  for (const block of body.blocks) {
    if (block.kind !== "challenge" || block.language === "javascript") continue;
    const expressions = JSON.stringify(block.tests.map((t) => t.expression));
    for (const [label, code, shouldPass] of [
      ["solution", block.solution, true],
      ["starter", block.starter, false],
    ] as const) {
      if (block.language === "web") {
        const run = runWebChallenge(code, block.tests);
        const results = run.results.map((r) => r.passed);
        const ok = (results.length > 0 && results.every(Boolean) && !run.error) === shouldPass;
        if (!ok) failures++;
        const why = run.error ?? run.results.find((r) => r.detail)?.detail ?? "";
        console.log(
          `${ok ? "ok  " : "FAIL"} ${id} ${label} ${results.map((r) => (r ? "✓" : "✗")).join("")}${!ok && why ? `  ${why}` : ""}`,
        );
        continue;
      }
      if (block.language === "excel") {
        const run = runSheetChallenge(code, block.sheet ?? "", block.tests);
        const results = run.results.map((r) => r.passed);
        const ok = (results.length > 0 && results.every(Boolean) && !run.error) === shouldPass;
        if (!ok) failures++;
        const why = run.error ?? run.results.find((r) => r.detail)?.detail ?? "";
        console.log(
          `${ok ? "ok  " : "FAIL"} ${id} ${label} ${results.map((r) => (r ? "✓" : "✗")).join("")}${!ok && why ? `  ${why}` : ""}`,
        );
        continue;
      }
      if (block.language === "react") {
        const { results, error } = await reactResults(code, block.tests);
        const ok = (results.length > 0 && results.every(Boolean)) === shouldPass;
        if (!ok) failures++;
        console.log(
          `${ok ? "ok  " : "FAIL"} ${id} ${label} ${results.map((r) => (r ? "✓" : "✗")).join("")}${!ok && error ? `  ${error}` : ""}`,
        );
        continue;
      }
      const program = block.language === "sql" ? sqlProgram(code) : code;
      // Mirrors the Pyodide driver: run in a fresh namespace with stdout
      // captured into __stdout__, then evaluate each test in that namespace.
      // A test that raises counts as failed, as it does in the browser.
      const wrapped = [
        "import io, sys, json as _j",
        '_ns = {"__name__": "__main__"}',
        "_buf = io.StringIO()",
        "_real, sys.stdout = sys.stdout, _buf",
        "try:",
        `    exec(compile(_j.loads(${JSON.stringify(JSON.stringify(program))}), "<challenge>", "exec"), _ns)`,
        "finally:",
        "    sys.stdout = _real",
        '_ns["__stdout__"] = _buf.getvalue()',
        "def _safe(e):",
        "    try:",
        "        return bool(eval(e, _ns))",
        "    except BaseException:",
        "        return False",
        `print("__RESULTS__" + _j.dumps([_safe(e) for e in ${expressions}]))`,
      ].join("\n");
      const run = Bun.spawnSync(["python3", "-c", wrapped]);
      const marker = run.stdout.toString().split("__RESULTS__")[1];
      const results: boolean[] = marker ? JSON.parse(marker) : [];
      const passed = results.length === block.tests.length && results.every(Boolean);
      const ok = passed === shouldPass;
      if (!ok) failures++;
      const error = run.stderr.toString().trim().split("\n").at(-1);
      console.log(
        `${ok ? "ok  " : "FAIL"} ${id} ${label} ${results.map((r) => (r ? "✓" : "✗")).join("")}${error ? `  ${error}` : ""}`,
      );
    }
  }
}
await new Promise((resolve) => setTimeout(resolve, 50));
await GlobalRegistrator.unregister();
process.exit(failures ? 1 : 0);
