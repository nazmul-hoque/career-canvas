/**
 * Real Python execution, in the learner's own browser.
 *
 * CPython compiled to WebAssembly (Pyodide) runs in a Blob worker so a runaway
 * loop freezes nothing and can be killed by terminating the worker. The worker
 * source is a string on purpose: it keeps Pyodide out of the bundle and out of
 * package.json — it is fetched from a CDN the first time a learner runs Python,
 * then cached by the browser.
 *
 * Everything here is best-effort. If the CDN is blocked, the runtime fails to
 * boot, or execution overruns, the caller falls back to the source-pattern
 * simulation and says so in the UI rather than pretending the code ran.
 */

const PYODIDE_BASE =
  (typeof import.meta !== "undefined"
    ? (import.meta.env?.["VITE_PYODIDE_URL"] as string | undefined)
    : undefined) ?? "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/";

/** First run pays for the WASM download; later runs are warm. */
const BOOT_TIMEOUT_MS = 45_000;
const RUN_TIMEOUT_MS = 15_000;

export interface PythonRunOutcome {
  logs: string[];
  error: string | null;
  results: boolean[];
}

interface WorkerReply {
  id: number;
  ok: boolean;
  /** Present when ok. */
  outcome?: PythonRunOutcome;
  /** Present when the worker itself failed (boot, import, internal error). */
  fatal?: string;
}

/**
 * The driver runs user code in its own namespace, captures stdout, then
 * evaluates each test as a Python expression against that namespace. A test
 * that raises counts as failed — the same contract the JavaScript runner uses.
 */
const WORKER_SOURCE = String.raw`
let pyodideReady = null;

async function boot(base) {
  if (!pyodideReady) {
    importScripts(base + "pyodide.js");
    pyodideReady = self.loadPyodide({ indexURL: base });
  }
  return pyodideReady;
}

const DRIVER = [
  'import io, json, sys, traceback',
  'payload = json.loads(__ascent_payload)',
  'namespace = {"__name__": "__main__"}',
  'buffer = io.StringIO()',
  'stdout, stderr = sys.stdout, sys.stderr',
  'sys.stdout = sys.stderr = buffer',
  'error = None',
  'try:',
  '    exec(payload["code"], namespace)',
  'except BaseException:',
  '    lines = traceback.format_exc().strip().splitlines()',
  '    error = lines[-1] if lines else "Your code raised an error."',
  'finally:',
  '    sys.stdout, sys.stderr = stdout, stderr',
  'results = []',
  'for expression in payload["tests"]:',
  '    if error is not None:',
  '        results.append(False)',
  '        continue',
  '    try:',
  '        results.append(bool(eval(expression, namespace)))',
  '    except BaseException:',
  '        results.append(False)',
  'json.dumps({',
  '    "logs": buffer.getvalue().splitlines(),',
  '    "error": error,',
  '    "results": results,',
  '})',
].join("\n");

self.onmessage = async (event) => {
  const { id, base, code, tests } = event.data;
  try {
    const pyodide = await boot(base);
    pyodide.globals.set("__ascent_payload", JSON.stringify({ code, tests }));
    const raw = pyodide.runPython(DRIVER);
    self.postMessage({ id, ok: true, outcome: JSON.parse(raw) });
  } catch (error) {
    self.postMessage({ id, ok: false, fatal: String(error && error.message ? error.message : error) });
  }
};
`;

let worker: Worker | null = null;
let workerUrl: string | null = null;
let nextId = 1;

function ensureWorker(): Worker {
  if (worker) return worker;
  workerUrl = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
  worker = new Worker(workerUrl);
  return worker;
}

/** A worker that has gone wrong is never reused — Pyodide state may be torn. */
function killWorker() {
  worker?.terminate();
  worker = null;
  if (workerUrl) URL.revokeObjectURL(workerUrl);
  workerUrl = null;
}

let booted = false;

export function pythonRuntimeAvailable(): boolean {
  return (
    typeof window !== "undefined" && typeof Worker !== "undefined" && typeof Blob !== "undefined"
  );
}

/** True once a real interpreter has answered at least once this session. */
export function pythonRuntimeBooted(): boolean {
  return booted;
}

/**
 * Resolves to null when the runtime could not be used at all, which is the
 * caller's signal to fall back rather than to show the learner an error.
 */
export async function runPythonInPyodide(
  code: string,
  expressions: string[],
): Promise<PythonRunOutcome | null> {
  if (!pythonRuntimeAvailable()) return null;

  const id = nextId++;
  const timeoutMs = booted ? RUN_TIMEOUT_MS : BOOT_TIMEOUT_MS;

  try {
    const instance = ensureWorker();

    const outcome = await new Promise<PythonRunOutcome | null>((resolve) => {
      const timer = setTimeout(() => {
        cleanup();
        // A hung interpreter is the learner's infinite loop far more often than
        // it is our bug, so this reads as an error rather than a fallback.
        killWorker();
        resolve({
          logs: [],
          error: `Your code was still running after ${Math.round(timeoutMs / 1000)}s and was stopped. Check for a loop that never ends.`,
          results: expressions.map(() => false),
        });
      }, timeoutMs);

      function cleanup() {
        clearTimeout(timer);
        instance.removeEventListener("message", onMessage);
        instance.removeEventListener("error", onError);
      }

      function onMessage(event: MessageEvent<WorkerReply>) {
        if (event.data.id !== id) return;
        cleanup();
        if (event.data.ok && event.data.outcome) {
          booted = true;
          resolve(event.data.outcome);
        } else {
          killWorker();
          resolve(null);
        }
      }

      function onError() {
        cleanup();
        killWorker();
        resolve(null);
      }

      instance.addEventListener("message", onMessage);
      instance.addEventListener("error", onError);
      instance.postMessage({ id, base: PYODIDE_BASE, code, tests: expressions });
    });

    return outcome;
  } catch {
    killWorker();
    return null;
  }
}
