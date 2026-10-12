import { CodeEditor } from "./CodeEditor";
import { useEffect, useId, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  Eye,
  ChevronDown,
} from "lucide-react";
import {
  packageLoadingMessage,
  runCode,
  type ChallengeLanguage,
  type RunEngine,
  type RunResult,
} from "@/lib/code-runner";
import { numberToCol, parseRef } from "@/lib/sheet-refs";
import { sqlDataset, type SqlDataset } from "@/content/datasets/sql";
import { SHEETS } from "@/content/datasets/sheets";
import { InlineText } from "@/components/learn/InlineText";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** What ran the code, said honestly under the test results. */
const ENGINE_LABELS: Partial<Record<RunEngine, string>> = {
  typescript: "TypeScript transpiled and run in this page",
  python: "CPython (WebAssembly)",
  sql: "SQLite (WebAssembly)",
  react: "React, rendered in this page",
  excel: "Spreadsheet engine (an Excel-compatible subset)",
  web: "Checks the page structure and which CSS rules apply",
  dom: "Your script, run against a fresh copy of the page",
};

/** Shown while an engine that downloads on first use is starting. */
const STARTING_MESSAGES: Partial<Record<ChallengeLanguage, string>> = {
  typescript: "Starting the TypeScript compiler. The first run loads it in your browser.",
  python: "Starting Python. The first run downloads the interpreter.",
  sql: "Starting the database. The first run downloads it.",
};

const PANEL_HEADER =
  "flex items-center gap-2 border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-chalk";

interface Props {
  title: string;
  prompt: string;
  language: ChallengeLanguage;
  /** Excel challenges: the sheet the formulas are written into. */
  sheet?: string | undefined;
  /** DOM challenges: the page markup the script runs against. */
  html?: string | undefined;
  /** SQL challenges: the database the query runs against. */
  dataset?: SqlDataset | undefined;
  starter: string;
  hint: string;
  tests: { name: string; expression: string }[];
  code: string;
  onCodeChange: (code: string) => void;
  onResult: (result: RunResult) => void;
  onSolved: () => void;
  solved: boolean;
}

export function CodeChallenge({
  title,
  prompt,
  language,
  sheet,
  html,
  dataset,
  starter,
  hint,
  tests,
  code,
  onCodeChange,
  onResult,
  onSolved,
  solved,
}: Props) {
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  // Set while a run is downloading a large package, replacing the starting line.
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [beforeReset, setBeforeReset] = useState<string | null>(null);
  // The code the preview shows: what was last run, not every keystroke.
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  // Only matters when the challenge is too narrow to sit beside its output:
  // the output is then a drawer under the editor, shut until the first run.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"preview" | "tests">("tests");
  const drawer = useRef<HTMLDivElement>(null);
  const drawerToggle = useRef<HTMLButtonElement>(null);
  const outputId = useId();
  const hasPreview = previewCode !== null;

  async function handleRun(submit: boolean) {
    setRunning(true);
    if (language === "react" || language === "web" || language === "dom") setPreviewCode(code);
    // Some engines finish before the spinner paints; a short minimum keeps the
    // running state visible instead of flickering.
    const [res] = await Promise.all([
      runCode(language, code, tests, { sheet, html, dataset }, (progress) =>
        setLoadingMessage(packageLoadingMessage(progress)),
      ),
      new Promise((resolve) => setTimeout(resolve, 250)),
    ]);
    setResult(res);
    onResult(res);
    setRunning(false);
    setLoadingMessage(null);
    setDrawerOpen(true);
    // A failure needs its message; a pass is best seen in the page it drew.
    setDrawerTab(res.passed ? "preview" : "tests");
    // The toggle is only visible in the stacked layout, so this leaves the
    // side-by-side one where it is.
    if (drawerToggle.current?.offsetParent) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() =>
        drawer.current?.scrollIntoView({ block: "nearest", behavior: smooth ? "smooth" : "auto" }),
      );
    }
    track("challenge_run", {
      title,
      language,
      submitted: submit,
      passed: res.passed,
      failed_tests: res.tests.filter((t) => !t.passed).length,
      errored: Boolean(res.error),
      engine: res.engine,
    });
    if (submit && res.passed) onSolved();
  }

  return (
    <div className="@container overflow-hidden rounded-[16px] border border-border">
      <div className="border-b border-border bg-secondary/60 px-5 py-4">
        <p className="eyebrow">Coding challenge</p>
        <h3 className="mt-1 font-display text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm text-chalk">
          <InlineText text={prompt} />
        </p>
        {language === "excel" && sheet ? <SheetPreview name={sheet} /> : null}
        {language === "dom" && html ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-chalk">The page your script works on</p>
            <pre className="mt-1.5 max-h-48 overflow-auto rounded-lg bg-background px-3 py-2 font-mono text-[12px] leading-5 text-chalk">
              {html}
            </pre>
          </div>
        ) : null}
        {language === "sql" ? (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-background px-3 py-2 font-mono text-[12px] leading-5 text-chalk">
            {sqlDataset(dataset).schema}
          </pre>
        ) : null}
      </div>

      {/* Split on the challenge's own width, not the screen's: beside the
          lesson list and the mentor, a laptop leaves it too narrow to halve. */}
      <div className="grid @3xl:grid-cols-2">
        <div className="bg-ink">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">
              {language}
            </span>
            <div className="flex gap-1">
              {beforeReset !== null ? (
                <button
                  className="rounded px-2 py-1 text-xs text-white"
                  onClick={() => {
                    onCodeChange(beforeReset);
                    setBeforeReset(null);
                  }}
                >
                  Undo reset
                </button>
              ) : null}
              <button
                onClick={() => {
                  setBeforeReset(code);
                  onCodeChange(starter);
                  setResult(null);
                  setPreviewCode(null);
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white/60 transition-colors hover:text-white"
              >
                <RotateCcw className="size-3" /> Reset
              </button>
              <button
                aria-expanded={showHint}
                onClick={() => setShowHint((v) => !v)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white/60 transition-colors hover:text-white"
              >
                <Lightbulb className="size-3" /> Hint
              </button>
            </div>
          </div>
          <CodeEditor value={code} onChange={onCodeChange} />
        </div>

        <div
          ref={drawer}
          className="flex flex-col border-t border-border @3xl:border-l @3xl:border-t-0"
        >
          <button
            ref={drawerToggle}
            aria-expanded={drawerOpen}
            aria-controls={outputId}
            onClick={() => setDrawerOpen((v) => !v)}
            className={cn(PANEL_HEADER, "w-full justify-between hover:text-foreground @3xl:hidden")}
          >
            <span className="flex items-center gap-2">
              <Terminal className="size-3.5" /> Output
              <span className="font-normal normal-case tracking-normal">
                · {outputSummary(result)}
              </span>
            </span>
            <ChevronDown
              className={cn("size-4 transition-transform", drawerOpen && "rotate-180")}
            />
          </button>

          <div
            id={outputId}
            className={cn(
              "flex-1 flex-col @3xl:flex",
              drawerOpen ? "flex animate-in fade-in slide-in-from-top-2" : "hidden",
            )}
          >
            {hasPreview ? (
              <div
                role="tablist"
                className="flex gap-1 border-b border-border px-3 py-1.5 @3xl:hidden"
              >
                {(["preview", "tests"] as const).map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={drawerTab === tab}
                    onClick={() => setDrawerTab(tab)}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-semibold",
                      drawerTab === tab
                        ? "bg-secondary text-foreground"
                        : "text-chalk hover:text-foreground",
                    )}
                  >
                    {tab === "preview" ? "Preview" : "Tests"}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Hidden with CSS rather than unmounted, so switching tabs doesn't
                reload the preview, and the wide layout shows both at once. */}
            <div className={cn(drawerTab !== "preview" && "hidden @3xl:block")}>
              {language === "react" && previewCode !== null ? (
                <ReactPreview code={previewCode} />
              ) : null}
              {language === "web" && previewCode !== null ? (
                <PagePreview html={previewCode} />
              ) : null}
              {language === "dom" && previewCode !== null ? (
                <DomPreview code={previewCode} html={html ?? ""} />
              ) : null}
            </div>

            <div
              className={cn(
                "flex flex-1 flex-col",
                hasPreview && drawerTab !== "tests" && "hidden @3xl:flex",
              )}
            >
              <div className={cn(PANEL_HEADER, "hidden @3xl:flex")}>
                <Terminal className="size-3.5" /> Output
              </div>
              <div
                role="status"
                aria-live="polite"
                className="flex-1 space-y-3 overflow-y-auto p-4 font-mono text-[13px]"
              >
                {!result ? (
                  <p className="text-chalk">Run your code to see output and test results.</p>
                ) : (
                  <>
                    {result.logs.map((l, i) => (
                      <p key={i} className="whitespace-pre-wrap text-foreground">
                        {l}
                      </p>
                    ))}
                    {result.error ? (
                      <p className="whitespace-pre-wrap text-destructive">{result.error}</p>
                    ) : null}
                    <ul className="space-y-1.5 pt-2 font-sans">
                      {result.tests.map((t) => (
                        <li key={t.name} className="text-sm">
                          <span
                            className={cn(
                              "flex items-center gap-2",
                              t.passed ? "text-brand" : "text-destructive",
                            )}
                          >
                            {t.passed ? (
                              <CheckCircle2 className="size-4 shrink-0" />
                            ) : (
                              <XCircle className="size-4 shrink-0" />
                            )}
                            {t.name}
                          </span>
                          {!t.passed && t.detail ? (
                            <span className="ml-6 block text-xs text-chalk">{t.detail}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    <p className="pt-1 font-sans text-xs text-chalk">
                      Finished in {result.durationMs}ms
                      {ENGINE_LABELS[result.engine] ? ` · ${ENGINE_LABELS[result.engine]}` : null}
                    </p>
                    {result.engine === "python-simulated" ? (
                      <p className="font-sans text-xs text-ember">
                        The Python runtime could not be loaded, so these results come from reading
                        your code rather than running it. Check your connection and run again for a
                        real result.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showHint ? (
        <div className="border-t border-border bg-ember/5 px-5 py-3 text-sm text-foreground">
          <span className="font-semibold text-ember">Hint · </span>
          <InlineText text={hint} />
        </div>
      ) : null}

      <p className="px-5 pt-3 text-xs text-chalk">
        Run to try your code. Submit to check your solution, then Complete the lesson to save
        progress.
      </p>
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-4">
        <Button variant="outline" onClick={() => handleRun(false)} disabled={running}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Run
        </Button>
        <Button onClick={() => handleRun(true)} disabled={running || solved}>
          {solved ? "Solved" : "Submit solution"}
        </Button>
        {solved ? (
          <span className="text-sm font-semibold text-brand">All tests green. Nice work.</span>
        ) : null}
        {running && (loadingMessage ?? STARTING_MESSAGES[language]) ? (
          <span role="status" className="text-sm text-chalk">
            {loadingMessage ?? STARTING_MESSAGES[language]}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** The collapsed drawer's one line: enough to know whether to open it. */
function outputSummary(result: RunResult | null): string {
  if (!result) return "Run your code to see results";
  if (result.error) return "Error";
  const passed = result.tests.filter((t) => t.passed).length;
  return `${passed} of ${result.tests.length} tests passed`;
}

/**
 * The learner's `App`, rendered by the real React in its own root. Each run
 * mounts into a fresh element, because a root can't be created on a container
 * another root still owns.
 */
function ReactPreview({ code }: { code: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unmount = () => {};
    setError(null);
    import("@/lib/react-runtime")
      .then(({ mountPreview }) => {
        if (cancelled || !host.current) return;
        unmount = mountPreview(code, host.current, (message) => {
          if (!cancelled) setError(message);
        });
      })
      .catch(() => setError("The preview couldn't load. Check your connection and run again."));
    return () => {
      cancelled = true;
      unmount();
    };
  }, [code]);

  return (
    <PreviewPanel>
      {error ? <p className="px-4 pt-3 font-mono text-[13px] text-destructive">{error}</p> : null}
      <div ref={host} className="challenge-preview max-h-72 overflow-y-auto p-4 text-sm" />
    </PreviewPanel>
  );
}

/** The starting sheet as a grid, with row numbers and column letters. */
function SheetPreview({ name }: { name: string }) {
  const data = SHEETS[name];
  if (!data) return null;
  const refs = Object.keys(data.cells).map((key) => parseRef(key)!);
  const maxCol = Math.max(...refs.map((r) => r.col));
  const maxRow = Math.max(...refs.map((r) => r.row));
  const letters = Array.from({ length: maxCol }, (_, i) => numberToCol(i + 1));

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-chalk">{data.title}</p>
      <div className="mt-1.5 max-h-64 overflow-auto rounded-lg border border-border bg-background">
        <table className="w-max border-collapse font-mono text-[11px]">
          <thead>
            <tr>
              <th className="sticky top-0 bg-secondary px-2 py-1" />
              {letters.map((l) => (
                <th
                  key={l}
                  className="sticky top-0 bg-secondary px-2 py-1 font-semibold text-chalk"
                >
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRow }, (_, r) => (
              <tr key={r}>
                <td className="bg-secondary px-2 py-0.5 text-right text-chalk">{r + 1}</td>
                {letters.map((l) => {
                  const v = data.cells[`${l}${r + 1}`];
                  return (
                    <td key={l} className="border-l border-t border-border px-2 py-0.5">
                      {v === undefined || v === null ? "" : String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * The learner's page, rendered for real by this browser. The frame is fully
 * sandboxed (no scripts, no same-origin access), so a page can't reach the
 * app. The width toggle is how responsive lessons show both layouts.
 */
function PagePreview({ html }: { html: string }) {
  const [width, setWidth] = useState<"phone" | "desktop">("desktop");
  return (
    <PreviewPanel
      actions={
        <span className="flex gap-1 normal-case tracking-normal">
          {(["phone", "desktop"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setWidth(w)}
              className={cn(
                "rounded-md px-2 py-0.5 font-semibold",
                width === w ? "bg-secondary text-foreground" : "text-chalk hover:text-foreground",
              )}
            >
              {w === "phone" ? "Phone · 375px" : "Desktop"}
            </button>
          ))}
        </span>
      }
    >
      <div className="flex justify-center overflow-x-auto bg-secondary/40 p-2">
        <iframe
          title="Page preview"
          sandbox=""
          srcDoc={html}
          className="h-72 rounded-md border border-border bg-background"
          style={{ width: width === "phone" ? 375 : "100%" }}
        />
      </div>
    </PreviewPanel>
  );
}

/**
 * The page with the learner's script running, to try by hand. `allow-scripts`
 * without `allow-same-origin` gives the frame an opaque origin: the script
 * runs, but it can't read the app, its storage or its cookies.
 */
function DomPreview({ code, html }: { code: string; html: string }) {
  const [doc, setDoc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    import("@/lib/dom-runtime")
      .then(({ previewDocument }) => {
        if (!cancelled) setDoc(previewDocument(code, html));
      })
      .catch(() => setDoc(null));
    return () => {
      cancelled = true;
    };
  }, [code, html]);

  return (
    <PreviewPanel title="Preview · try it">
      <div className="bg-secondary/40 p-2">
        {doc ? (
          <iframe
            title="Page preview"
            sandbox="allow-scripts"
            srcDoc={doc}
            className="h-56 w-full rounded-md border border-border bg-background"
          />
        ) : null}
      </div>
    </PreviewPanel>
  );
}

/** The frame every preview shares: a titled header, optional controls, the body. */
function PreviewPanel({
  title = "Preview",
  actions,
  children,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border">
      <div className={cn(PANEL_HEADER, "justify-between")}>
        <span className="flex items-center gap-2">
          <Eye className="size-3.5" /> {title}
        </span>
        {actions}
      </div>
      {children}
    </div>
  );
}
