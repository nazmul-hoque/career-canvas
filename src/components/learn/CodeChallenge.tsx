import { useEffect, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  Eye,
} from "lucide-react";
import { runCode, type ChallengeLanguage, type RunResult } from "@/lib/code-runner";
import { SHOP_SCHEMA } from "@/content/datasets/shop";
import { SHEETS } from "@/content/datasets/sheets";
import { InlineText } from "@/components/learn/InlineText";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  prompt: string;
  language: ChallengeLanguage;
  /** Excel challenges: the sheet the formulas are written into. */
  sheet?: string | undefined;
  /** DOM challenges: the page markup the script runs against. */
  html?: string | undefined;
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
  const [showHint, setShowHint] = useState(false);
  // The code the preview shows: what was last run, not every keystroke.
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  async function handleRun(submit: boolean) {
    setRunning(true);
    if (language === "react" || language === "web" || language === "dom") setPreviewCode(code);
    const res = await runCode(language, code, tests, { sheet, html });
    setResult(res);
    onResult(res);
    setRunning(false);
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
    <div className="overflow-hidden rounded-[16px] border border-border">
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
            {SHOP_SCHEMA}
          </pre>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="bg-ink">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">
              {language}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onCodeChange(starter);
                  setResult(null);
                  setPreviewCode(null);
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white/60 transition-colors hover:text-white"
              >
                <RotateCcw className="size-3" /> Reset
              </button>
              <button
                onClick={() => setShowHint((v) => !v)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white/60 transition-colors hover:text-white"
              >
                <Lightbulb className="size-3" /> Hint
              </button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            spellCheck={false}
            aria-label="Code editor"
            className="h-72 w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-6 text-white/90 outline-none"
          />
        </div>

        <div className="flex flex-col border-t border-border lg:border-l lg:border-t-0">
          {language === "react" && previewCode !== null ? (
            <ReactPreview code={previewCode} />
          ) : null}
          {language === "web" && previewCode !== null ? <PagePreview html={previewCode} /> : null}
          {language === "dom" && previewCode !== null ? (
            <DomPreview code={previewCode} html={html ?? ""} />
          ) : null}
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-chalk">
            <Terminal className="size-3.5" /> Output
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 font-mono text-[13px]">
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
                  {result.engine === "python" ? " · CPython (WebAssembly)" : null}
                  {result.engine === "sql" ? " · SQLite (WebAssembly)" : null}
                  {result.engine === "react" ? " · React, rendered in this page" : null}
                  {result.engine === "excel"
                    ? " · Spreadsheet engine (an Excel-compatible subset)"
                    : null}
                  {result.engine === "web"
                    ? " · Checks the page structure and which CSS rules apply"
                    : null}
                </p>
                {result.engine === "python-simulated" ? (
                  <p className="font-sans text-xs text-ember">
                    The Python runtime could not be loaded, so these results come from reading your
                    code rather than running it. Check your connection and run again for a real
                    result.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {showHint ? (
        <div className="border-t border-border bg-ember/5 px-5 py-3 text-sm text-foreground">
          <span className="font-semibold text-ember">Hint · </span>
          <InlineText text={hint} />
        </div>
      ) : null}

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
        {running && (language === "python" || language === "sql") ? (
          <span className="text-sm text-chalk">
            {language === "sql"
              ? "Starting the database — the first run downloads it."
              : "Starting Python — the first run downloads the interpreter."}
          </span>
        ) : null}
      </div>
    </div>
  );
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
    <div className="border-b border-border">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-chalk">
        <Eye className="size-3.5" /> Preview
      </div>
      {error ? <p className="px-4 pt-3 font-mono text-[13px] text-destructive">{error}</p> : null}
      <div ref={host} className="challenge-preview max-h-72 overflow-y-auto p-4 text-sm" />
    </div>
  );
}

/** The starting sheet as a grid, with row numbers and column letters. */
function SheetPreview({ name }: { name: string }) {
  const data = SHEETS[name];
  if (!data) return null;
  const keys = Object.keys(data.cells);
  const colOf = (key: string) => key.replace(/\d+$/, "");
  const rowOf = (key: string) => Number(key.replace(/^[A-Z]+/, ""));
  const toNumber = (letters: string) =>
    [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
  const maxCol = Math.max(...keys.map((k) => toNumber(colOf(k))));
  const maxRow = Math.max(...keys.map(rowOf));
  const letters = Array.from({ length: maxCol }, (_, i) => String.fromCharCode(65 + i));

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
    <div className="border-b border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-chalk">
        <span className="flex items-center gap-2">
          <Eye className="size-3.5" /> Preview
        </span>
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
      </div>
      <div className="flex justify-center overflow-x-auto bg-secondary/40 p-2">
        <iframe
          title="Page preview"
          sandbox=""
          srcDoc={html}
          className="h-72 rounded-md border border-border bg-background"
          style={{ width: width === "phone" ? 375 : "100%" }}
        />
      </div>
    </div>
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
    <div className="border-b border-border">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-chalk">
        <Eye className="size-3.5" /> Preview · try it
      </div>
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
    </div>
  );
}
