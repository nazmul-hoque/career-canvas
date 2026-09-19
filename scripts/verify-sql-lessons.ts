/**
 * Runs every SQL challenge through the exact program the browser runs, on the
 * local python3 (its sqlite3 is the same engine Pyodide ships):
 *
 *   bun run lessons:verify-sql
 *
 * The reference solution must pass every test and the starter must fail at
 * least one — otherwise the challenge is either unsolvable or already solved.
 * Run it after changing an SQL lesson or src/content/datasets/shop.ts.
 */
import { bodies } from "../src/content/lesson-bodies.server";
import { sqlProgram } from "../src/lib/code-runner";

let failures = 0;
for (const [id, body] of Object.entries(bodies)) {
  for (const block of body.blocks) {
    if (block.kind !== "challenge" || block.language !== "sql") continue;
    const expressions = JSON.stringify(block.tests.map((t) => t.expression));
    for (const [label, code, shouldPass] of [
      ["solution", block.solution, true],
      ["starter", block.starter, false],
    ] as const) {
      const program = `${sqlProgram(code)}\nimport json as _j\nprint("__RESULTS__" + _j.dumps([bool(eval(e)) for e in ${expressions}]))`;
      const run = Bun.spawnSync(["python3", "-c", program]);
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
