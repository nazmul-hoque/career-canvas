import { describe, expect, test } from "bun:test";
import { registerHappyDom } from "./happy-dom";

/**
 * The JavaScript and DOM challenge runners. Both run the learner's code and the
 * tests in one async scope; a test that throws reports why.
 */
registerHappyDom();

const { runCode, runJavaScript } = await import("../src/lib/code-runner");
const { runDomChallenge, previewDocument } = await import("../src/lib/dom-runtime");

describe("javascript runner", () => {
  test("sync and async tests, with a reason for failures", async () => {
    const code = `
function add(a, b) { return a + b; }
const later = (v) => new Promise((resolve) => setTimeout(() => resolve(v), 5));
console.log("hi");`;
    const run = await runJavaScript(code, [
      { name: "sync", expression: "add(2, 3) === 5" },
      { name: "await", expression: "await later(7) === 7" },
      { name: "throws", expression: "missing() === 1" },
    ]);
    expect(run.error).toBeNull();
    expect(run.logs).toEqual(["hi"]);
    expect(run.tests.map((t) => t.passed)).toEqual([true, true, false]);
    expect(run.tests[2]?.detail).toContain("ReferenceError");
  });

  test("a syntax error fails everything with a message", async () => {
    const run = await runJavaScript("function (", [{ name: "x", expression: "true" }]);
    expect(run.error).toContain("SyntaxError");
    expect(run.passed).toBe(false);
  });
});

describe("typescript runner", () => {
  test("transpiles annotations, interfaces, unions and generics before running tests", async () => {
    const run = await runCode(
      "typescript",
      `interface Named { name: string }
type Input = Named | string;
function label(value: Input): string {
  return typeof value === "string" ? value : value.name;
}
function first<T>(items: T[]): T | undefined { return items[0]; }`,
      [
        { name: "narrows a union", expression: `label({ name: "Ada" }) === "Ada"` },
        { name: "keeps a generic value", expression: `first([3, 4]) === 3` },
      ],
    );

    expect(run.engine).toBe("typescript");
    expect(run.error).toBeNull();
    expect(run.tests.every((test) => test.passed)).toBe(true);
  });

  test("reports TypeScript syntax errors without crashing", async () => {
    const run = await runCode("typescript", "const value: = 2", [
      { name: "never runs", expression: "true" },
    ]);
    expect(run.engine).toBe("typescript");
    expect(run.error).toBeTruthy();
    expect(run.passed).toBe(false);
  });
});

describe("dom runner", () => {
  const html = `<button id="plus">+</button><output id="n">0</output>
<form id="f"><input id="name"><button>Go</button></form><p id="out"></p>`;
  const code = `
let n = 0;
document.querySelector("#plus").addEventListener("click", () => {
  n += 1;
  document.querySelector("#n").textContent = String(n);
});
document.querySelector("#f").addEventListener("submit", (e) => {
  e.preventDefault();
  document.querySelector("#out").textContent = "Hi " + document.querySelector("#name").value;
});`;

  test("clicks, typing and submits reach the learner's listeners", async () => {
    const run = await runDomChallenge(code, html, [
      { name: "click", expression: `(click($("#plus")), click($("#plus")), text("#n") === "2")` },
      {
        name: "submit",
        expression: `(fill($("#name"), "Ada"), submit($("#f")), text("#out") === "Hi Ada")`,
      },
      { name: "missing", expression: `(click($("#nope")), true)` },
    ]);
    expect(run.results.map((r) => r.passed)).toEqual([true, true, false]);
    expect(run.results[2]?.detail).toContain("isn't on the page");
  });

  test("the learner's code never touches the real document", async () => {
    document.body.innerHTML = '<p id="real">untouched</p>';
    await runDomChallenge(`document.body.innerHTML = "wiped";`, "<p>fixture</p>", []);
    expect(document.querySelector("#real")?.textContent).toBe("untouched");
  });

  test("the preview escapes a closing script tag in the code", () => {
    expect(previewDocument('const s = "</script>";', "<p></p>")).not.toContain('"</script>"');
  });
});

/**
 * The Pyodide worker is built from a string, so nothing else in the toolchain
 * looks inside it — TypeScript and ESLint both see an opaque template literal.
 * A rename that crosses that boundary compiles, lints, and then fails at
 * runtime with "the engine couldn't load".
 *
 * That is not hypothetical: `be9b275` renamed the module constant `DRIVER` to
 * `PYTHON_DRIVER` so the lesson verifier could import it, and the rename also
 * rewrote the call site inside the worker, where the local is still `DRIVER`.
 * Every Python run fell back to the simulation and every SQL run — which has no
 * fallback by design — told the learner to check their connection.
 */
const { WORKER_SOURCE } = await import("../src/lib/python-runtime");

describe("the Pyodide worker source is self-contained", () => {
  test("every constant it references is one it declares", () => {
    const declared = new Set(
      [...WORKER_SOURCE.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)].map(
        (m) => m[1],
      ),
    );
    // Only executable code: prose in a comment and the driver inside its string
    // literal are not references to anything.
    const code = WORKER_SOURCE.replace(/\/\/[^\n]*/g, " ").replace(/"(?:[^"\\]|\\.)*"/g, '""');
    const globals = new Set(["JSON", "URL"]);
    const used = new Set([...code.matchAll(/\b([A-Z][A-Z0-9_]{2,})\b/g)].map((m) => m[1]!));

    const undeclared = [...used].filter((name) => !declared.has(name) && !globals.has(name));
    expect(undeclared).toEqual([]);
  });

  test("it still carries the driver it runs", () => {
    expect(WORKER_SOURCE).toContain("runPython(DRIVER)");
    expect(WORKER_SOURCE).toContain("__ascent_result");
  });
});
