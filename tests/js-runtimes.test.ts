import { afterAll, describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

/**
 * The JavaScript and DOM challenge runners. Both run the learner's code and the
 * tests in one async scope; a test that throws reports why.
 */
GlobalRegistrator.register();
afterAll(async () => {
  await new Promise((r) => setTimeout(r, 20));
  await GlobalRegistrator.unregister();
});

const { runJavaScript } = await import("../src/lib/code-runner");
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
