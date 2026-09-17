import { useState } from "react";
import { Play, RotateCcw, Lightbulb, CheckCircle2, XCircle, Loader2, Terminal } from "lucide-react";
import { runCode, type RunResult } from "@/lib/code-runner";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  prompt: string;
  language: "javascript" | "python";
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

  async function handleRun(submit: boolean) {
    setRunning(true);
    const res = await runCode(language, code, tests);
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
        <p className="mt-1 text-sm text-chalk">{prompt}</p>
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
                    <li
                      key={t.name}
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        t.passed ? "text-brand" : "text-destructive",
                      )}
                    >
                      {t.passed ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <XCircle className="size-4" />
                      )}
                      {t.name}
                    </li>
                  ))}
                </ul>
                <p className="pt-1 font-sans text-xs text-chalk">
                  Finished in {result.durationMs}ms
                  {result.engine === "python" ? " · CPython (WebAssembly)" : null}
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
          {hint}
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
        {running && language === "python" ? (
          <span className="text-sm text-chalk">
            Starting Python — the first run downloads the interpreter.
          </span>
        ) : null}
      </div>
    </div>
  );
}
