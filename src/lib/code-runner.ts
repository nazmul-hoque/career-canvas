/**
 * Mock execution service.
 *
 * JavaScript runs for real in a sandboxed function with console.log captured.
 * Python is simulated (source-pattern checks) until a real execution API is
 * wired in. Swap `runCode` for a network call to keep the rest of the app
 * unchanged — the return shape is the contract.
 */

export interface TestResult {
  name: string;
  passed: boolean;
}

export interface RunResult {
  logs: string[];
  error: string | null;
  tests: TestResult[];
  passed: boolean;
  durationMs: number;
}

export interface TestSpec {
  name: string;
  /** JS: an expression evaluated after the user code. Python: a substring that must appear. */
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
    // eslint-disable-next-line no-new-func
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
  };
}

function runPythonMock(code: string, tests: TestSpec[]): RunResult {
  const started = performance.now();
  const logs: string[] = [];
  const printed = code.match(/print\((.*)\)/g) ?? [];
  printed.forEach((line) => {
    const inner = line.slice(6, -1).trim();
    logs.push(inner.replace(/^["']|["']$/g, ""));
  });
  if (logs.length === 0) logs.push("(no output)");

  const normalised = code.replace(/\s+/g, " ");
  const results = tests.map((t) => ({
    name: t.name,
    passed: normalised.includes(t.expression.replace(/\s+/g, " ")),
  }));

  const error = /pass\s*$/.test(code.trim()) ? "Your function still contains only `pass`." : null;

  return {
    logs,
    error,
    tests: results,
    passed: results.every((r) => r.passed) && !error,
    durationMs: Math.round(performance.now() - started),
  };
}

export async function runCode(
  language: "javascript" | "python",
  code: string,
  tests: TestSpec[],
): Promise<RunResult> {
  // Simulated latency so loading states are exercised; replace with a fetch later.
  await new Promise((r) => setTimeout(r, 450));
  return language === "python" ? runPythonMock(code, tests) : runJavaScript(code, tests);
}
