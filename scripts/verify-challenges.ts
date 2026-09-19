/**
 * Runs every SQL and Python challenge on the local python3 — the same program
 * the browser runs on Pyodide (its sqlite3 is the same engine):
 *
 *   bun run lessons:verify
 *
 * The reference solution must pass every test and the starter must fail at
 * least one; otherwise the challenge is unsolvable or already solved. Python
 * solutions are complete programs, so any helpers the tests call (datasets,
 * scripted models) must be in the solution as well as the starter. Run it after
 * changing a challenge or src/content/datasets/shop.ts.
 */
import { bodies } from "../src/content/lesson-bodies.server";
import { sqlProgram } from "../src/lib/code-runner";

let failures = 0;
for (const [id, body] of Object.entries(bodies)) {
  for (const block of body.blocks) {
    if (block.kind !== "challenge" || block.language === "javascript") continue;
    const expressions = JSON.stringify(block.tests.map((t) => t.expression));
    for (const [label, code, shouldPass] of [
      ["solution", block.solution, true],
      ["starter", block.starter, false],
    ] as const) {
      const program = block.language === "sql" ? sqlProgram(code) : code;
      // A test that raises counts as failed, as it does in the browser runner.
      const wrapped = [
        program,
        "import json as _j",
        "def _safe(e):",
        "    try:",
        "        return bool(eval(e, globals()))",
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
process.exit(failures ? 1 : 0);
