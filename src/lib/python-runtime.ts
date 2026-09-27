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

/**
 * Booting and fetching packages is timed separately from the learner's code.
 * scikit-learn alone is ~24 MB (scipy is most of it) and took 23s cold on a
 * fast connection, so loading gets a generous limit; the run itself gets the
 * short one that catches a loop that never ends.
 */
const LOAD_TIMEOUT_MS = 90_000;
const RUN_TIMEOUT_MS = 15_000;

export interface PythonRunOutcome {
  logs: string[];
  error: string | null;
  results: boolean[];
}

/** Pyodide's package names, e.g. ["scikit-learn", "scipy", "numpy", …]. */
export type PythonProgress = { stage: "loading"; packages: string[] };

interface WorkerReply {
  id: number;
  /** A progress report; the final reply has no phase. */
  phase?: "loading" | "running";
  packages?: string[];
  ok?: boolean;
  /** Present when ok. */
  outcome?: PythonRunOutcome;
  /** Present when the worker itself failed (boot, import, internal error). */
  fatal?: string;
}

/**
 * The driver runs user code in its own namespace, captures stdout (exposed to
 * tests as `__stdout__`), then evaluates each test as a Python expression
 * against that namespace. A test
 * that raises counts as failed — the same contract the JavaScript runner uses.
 */
/**
 * The Python side of every run, exported so the lesson verifier runs exactly
 * this under local python3. It runs the code in a fresh namespace and a fresh
 * working directory, captures stdout (exposed to tests as `__stdout__`), then
 * evaluates each test as a Python expression against that namespace.
 */
export const PYTHON_DRIVER = [
  "import io, json, os, shutil, sys, tempfile, traceback",
  "payload = json.loads(__ascent_payload)",
  "# Each run starts in an empty working directory, so a file written by an",
  "# earlier run (the interpreter is reused) can never satisfy a test.",
  "home = os.getcwd()",
  "workdir = tempfile.mkdtemp()",
  "os.chdir(workdir)",
  'namespace = {"__name__": "__main__"}',
  "buffer = io.StringIO()",
  "stdout, stderr = sys.stdout, sys.stderr",
  "sys.stdout = sys.stderr = buffer",
  "error = None",
  "try:",
  '    exec(payload["code"], namespace)',
  "except BaseException:",
  "    lines = traceback.format_exc().strip().splitlines()",
  '    error = lines[-1] if lines else "Your code raised an error."',
  "finally:",
  "    sys.stdout, sys.stderr = stdout, stderr",
  "# What the program printed, so a test can check output as well as values.",
  'namespace["__stdout__"] = buffer.getvalue()',
  "results = []",
  'for expression in payload["tests"]:',
  "    if error is not None:",
  "        results.append(False)",
  "        continue",
  "    try:",
  "        results.append(bool(eval(expression, namespace)))",
  "    except BaseException:",
  "        results.append(False)",
  "os.chdir(home)",
  "shutil.rmtree(workdir, ignore_errors=True)",
  "__ascent_result = json.dumps({",
  '    "logs": buffer.getvalue().splitlines(),',
  '    "error": error,',
  '    "results": results,',
  "})",
  "__ascent_result",
].join("\n");

/**
 * The worker runs as a string, so neither TypeScript nor ESLint looks inside
 * it: a module constant referenced here is simply undefined at runtime, and the
 * failure surfaces as "the engine couldn't load". Exported so a test can check
 * that every identifier it uses is one it declares.
 */
export const WORKER_SOURCE = String.raw`
let pyodideReady = null;

async function boot(base) {
  if (!pyodideReady) {
    importScripts(base + "pyodide.js");
    pyodideReady = self.loadPyodide({ indexURL: base });
  }
  return pyodideReady;
}

const DRIVER = ${JSON.stringify(PYTHON_DRIVER)};

self.onmessage = async (event) => {
  const { id, base, code, tests } = event.data;
  try {
    const pyodide = await boot(base);
    // Stdlib modules Pyodide ships separately (sqlite3 for the SQL course) and
    // packages like numpy or scikit-learn are fetched from the same CDN the
    // first time code imports them. The page is told what is downloading so it
    // can say so, rather than show a spinner for half a minute.
    await pyodide.loadPackagesFromImports(code, {
      messageCallback: (message) => {
        const loading = /^Loading (.+)$/.exec(message);
        if (loading) self.postMessage({ id, phase: "loading", packages: loading[1].split(", ") });
      },
    });
    // Everything from here on is the learner's code, so the page switches to
    // the run timeout: a slow download must never read as an infinite loop.
    self.postMessage({ id, phase: "running" });
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

let booted = false;

/** A worker that has gone wrong is never reused — Pyodide state may be torn. */
function killWorker() {
  worker?.terminate();
  worker = null;
  booted = false;
  if (workerUrl) URL.revokeObjectURL(workerUrl);
  workerUrl = null;
}

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
  onProgress?: (progress: PythonProgress) => void,
): Promise<PythonRunOutcome | null> {
  if (!pythonRuntimeAvailable()) return null;

  const id = nextId++;

  try {
    const instance = ensureWorker();

    const outcome = await new Promise<PythonRunOutcome | null>((resolve) => {
      let timer = setTimeout(onLoadTimeout, LOAD_TIMEOUT_MS);

      // The interpreter or a package didn't arrive in time. That is the
      // runtime failing, not the learner's code, so the caller falls back
      // rather than blaming a loop.
      function onLoadTimeout() {
        cleanup();
        console.warn(`[pyodide] still loading after ${LOAD_TIMEOUT_MS / 1000}s`);
        killWorker();
        resolve(null);
      }

      function onRunTimeout() {
        cleanup();
        // A hung interpreter is the learner's infinite loop far more often than
        // it is our bug, so this reads as an error rather than a fallback.
        killWorker();
        resolve({
          logs: [],
          error: `Your code was still running after ${RUN_TIMEOUT_MS / 1000}s and was stopped. Check for a loop that never ends.`,
          results: expressions.map(() => false),
        });
      }

      function cleanup() {
        clearTimeout(timer);
        instance.removeEventListener("message", onMessage);
        instance.removeEventListener("error", onError);
      }

      function onMessage(event: MessageEvent<WorkerReply>) {
        const reply = event.data;
        if (reply.id !== id) return;
        if (reply.phase === "loading") {
          onProgress?.({ stage: "loading", packages: reply.packages ?? [] });
          return;
        }
        if (reply.phase === "running") {
          clearTimeout(timer);
          timer = setTimeout(onRunTimeout, RUN_TIMEOUT_MS);
          return;
        }
        cleanup();
        if (reply.ok && reply.outcome) {
          booted = true;
          resolve(reply.outcome);
        } else {
          // A fatal is the runtime failing, not the learner's code. The caller
          // can only report "it could not load", so without this the console is
          // the one place a real defect is distinguishable from a blocked CDN.
          if (reply.fatal) console.warn("[pyodide] worker failed:", reply.fatal);
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
