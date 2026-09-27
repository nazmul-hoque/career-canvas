import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Circle, FileText, GitBranch, Lightbulb, RotateCcw } from "lucide-react";
import {
  buildWorld,
  evaluateCheck,
  runLine,
  splitScript,
  viewOf,
  type GraphNode,
  type SandboxView,
  type World,
} from "@/lib/git-sandbox";
import type { RunResult } from "@/lib/code-runner";
import { InlineText } from "@/components/learn/InlineText";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  prompt: string;
  /** The script that builds the scenario. */
  setup: string;
  hint: string;
  tests: { name: string; expression: string }[];
  /** The transcript so far: one command per line, as typed. */
  code: string;
  onCodeChange: (code: string) => void;
  onResult: (result: RunResult) => void;
  onSolved: () => void;
  solved: boolean;
}

interface Entry {
  prompt: string;
  line: string;
  output: string;
  ok: boolean;
}

/** Replays the scenario and a transcript, keeping the prompt each command was typed at. */
function rebuild(setup: string, transcript: string): { world: World; entries: Entry[] } {
  const world = buildWorld(setup);
  const entries: Entry[] = [];
  for (const line of splitScript(transcript)) {
    if (!line.trim()) continue;
    const prompt = viewOf(world).prompt;
    const result = runLine(world, line);
    if (result.clear) entries.length = 0;
    else entries.push({ prompt, line, output: result.output, ok: result.ok });
  }
  return { world, entries };
}

/** A file saved from the editor is recorded as `@write`; show it as what it did. */
function displayLine(line: string): string {
  const write = /^@write\s+(\S+)\s/.exec(line);
  return write ? `(saved ${write[1]} in the editor)` : line;
}

export function GitSandbox({
  title,
  prompt,
  setup,
  hint,
  tests,
  code,
  onCodeChange,
  onResult,
  onSolved,
  solved,
}: Props) {
  // The transcript is the source of truth; the world is rebuilt from it once,
  // then advanced one command at a time.
  const initial = useMemo(() => rebuild(setup, code), [setup]); // eslint-disable-line react-hooks/exhaustive-deps
  const world = useRef<World>(initial.world);
  const [entries, setEntries] = useState<Entry[]>(initial.entries);
  const [view, setView] = useState<SandboxView>(() => viewOf(initial.world));
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>(() =>
    splitScript(code).filter((l) => l.trim() && !l.startsWith("@")),
  );
  const [historyAt, setHistoryAt] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editing, setEditing] = useState<{ path: string; content: string } | null>(null);
  const [panel, setPanel] = useState<"graph" | "files">("graph");
  const [checks, setChecks] = useState(() =>
    tests.map((t) => evaluateCheck(initial.world, t.expression)),
  );
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transcript = useRef(code);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [entries]);

  const passed = checks.length > 0 && checks.every((c) => c.passed);

  function asRunResult(results: typeof checks): RunResult {
    return {
      logs: [],
      error: null,
      tests: tests.map((t, i) => ({
        name: t.name,
        passed: Boolean(results[i]?.passed),
        detail: results[i]?.detail ?? undefined,
      })),
      passed: results.every((r) => r.passed),
      durationMs: 0,
      engine: "git",
    };
  }

  function record(line: string) {
    const promptBefore = viewOf(world.current).prompt;
    const result = runLine(world.current, line);
    transcript.current = transcript.current ? `${transcript.current}\n${line}` : line;
    onCodeChange(transcript.current);
    if (result.clear) setEntries([]);
    else {
      setEntries((e) => [
        ...e,
        { prompt: promptBefore, line, output: result.output, ok: result.ok },
      ]);
    }
    setView(viewOf(world.current));
    const next = tests.map((t) => evaluateCheck(world.current, t.expression));
    setChecks(next);
    const nowPassed = next.length > 0 && next.every((c) => c.passed);
    // Every change to the transcript un-solves the lesson, so a passing state
    // re-reports itself after each command; only the transition is an event.
    if (nowPassed) onSolved();
    if (nowPassed && !passed) {
      onResult(asRunResult(next));
      track("challenge_run", {
        title,
        language: "git",
        submitted: true,
        passed: true,
        failed_tests: 0,
        errored: false,
        engine: "git",
      });
    }
  }

  function submit() {
    const line = input.trim();
    if (!line) return;
    if (line.startsWith("@")) {
      setEntries((e) => [
        ...e,
        {
          prompt: view.prompt,
          line,
          output: `sh: ${line.split(/\s/)[0]}: command not found`,
          ok: false,
        },
      ]);
      setInput("");
      return;
    }
    setHistory((h) => [...h, line]);
    setHistoryAt(null);
    setInput("");
    record(line);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const at = historyAt === null ? history.length - 1 : Math.max(0, historyAt - 1);
      setHistoryAt(at);
      setInput(history[at] ?? "");
    } else if (e.key === "ArrowDown" && historyAt !== null) {
      e.preventDefault();
      const at = historyAt + 1;
      if (at >= history.length) {
        setHistoryAt(null);
        setInput("");
      } else {
        setHistoryAt(at);
        setInput(history[at] ?? "");
      }
    }
  }

  function reset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    const fresh = rebuild(setup, "");
    world.current = fresh.world;
    transcript.current = "";
    onCodeChange("");
    setEntries([]);
    setView(viewOf(fresh.world));
    setChecks(tests.map((t) => evaluateCheck(fresh.world, t.expression)));
    setEditing(null);
    track("challenge_run", {
      title,
      language: "git",
      submitted: false,
      passed: false,
      failed_tests: tests.length,
      errored: false,
      engine: "git",
    });
  }

  /** Counts as an attempt for the mentor, like pressing Run on a code challenge. */
  function checkWork() {
    const result = asRunResult(checks);
    onResult(result);
    if (result.passed && !solved) onSolved();
    track("challenge_run", {
      title,
      language: "git",
      submitted: true,
      passed: result.passed,
      failed_tests: result.tests.filter((t) => !t.passed).length,
      errored: false,
      engine: "git",
    });
  }

  function openFile(path: string) {
    setEditing({ path, content: world.current.me.work[path] ?? "" });
    setPanel("files");
  }

  function saveFile() {
    if (!editing) return;
    const content =
      editing.content.endsWith("\n") || editing.content === ""
        ? editing.content
        : `${editing.content}\n`;
    record(`@write ${editing.path} ${JSON.stringify(content)}`);
    setEditing(null);
    inputRef.current?.focus();
  }

  return (
    <div className="@container overflow-hidden rounded-[16px] border border-border">
      <div className="border-b border-border bg-secondary/60 px-5 py-4">
        <p className="eyebrow">Git sandbox</p>
        <h3 className="mt-1 font-display text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm text-chalk">
          <InlineText text={prompt} />
        </p>
        <ul className="mt-3 space-y-1.5" aria-label="What to achieve">
          {tests.map((t, i) => {
            const ok = checks[i]?.passed;
            return (
              <li key={t.name} className="flex items-start gap-2 text-sm">
                {ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" aria-label="Done" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-chalk" aria-label="Not yet" />
                )}
                <span className={cn(ok && "text-chalk")}>
                  <InlineText text={t.name} />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid @3xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        {/* Terminal */}
        <div className="flex min-w-0 flex-col border-b border-border @3xl:border-r @3xl:border-b-0">
          <div
            ref={scroller}
            onClick={() => inputRef.current?.focus()}
            className="h-[380px] overflow-y-auto bg-ink p-4 font-mono text-[12.5px] leading-5 text-white/90"
            role="log"
            aria-live="polite"
            aria-label="Terminal output"
          >
            {!entries.length ? (
              <p className="text-white/50">
                Your repository is ready. Start with{" "}
                <span className="text-white/80">git status</span> or{" "}
                <span className="text-white/80">git log --oneline --graph --all</span>. Type{" "}
                <span className="text-white/80">help</span> for what this sandbox understands.
              </p>
            ) : null}
            {entries.map((entry, i) => (
              <div key={i} className="mb-1">
                <p className="break-all">
                  <span className="text-white/50">{entry.prompt} $</span> {displayLine(entry.line)}
                </p>
                {entry.output ? (
                  <pre
                    className={cn(
                      "whitespace-pre-wrap break-words",
                      entry.ok ? "text-white/75" : "text-ember",
                    )}
                  >
                    {entry.output}
                  </pre>
                ) : null}
              </div>
            ))}
            <label className="flex items-center gap-2">
              <span className="shrink-0 text-white/50">{view.prompt} $</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                aria-label="Command"
                className="min-w-0 flex-1 bg-transparent text-white outline-none"
              />
            </label>
          </div>
          <p className="border-t border-border px-4 py-2 text-[11px] leading-4 text-chalk">
            A practice model of git, not git itself: it runs the commands this course teaches and
            prints git&apos;s own messages. When you finish, your commands are replayed on our
            server to check the result.
          </p>
        </div>

        {/* Graph and files */}
        <div className="flex min-w-0 flex-col">
          <div
            className="flex items-center gap-1 border-b border-border px-2 py-1.5"
            role="tablist"
          >
            {(
              [
                ["graph", "History", GitBranch],
                ["files", "Files", FileText],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                role="tab"
                aria-selected={panel === id}
                onClick={() => setPanel(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
                  panel === id
                    ? "bg-secondary text-foreground"
                    : "text-chalk hover:bg-secondary/60",
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
            {view.op ? (
              <span className="ml-auto rounded-md bg-ember/10 px-2 py-1 font-mono text-[10px] font-bold text-ember">
                {view.op}
              </span>
            ) : null}
            {view.stashes ? (
              <span
                className={cn(
                  "rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold text-chalk",
                  !view.op && "ml-auto",
                )}
              >
                {view.stashes} stashed
              </span>
            ) : null}
          </div>
          <div className="h-[380px] overflow-auto">
            {panel === "graph" ? (
              <CommitGraph nodes={view.nodes} />
            ) : editing ? (
              <div className="flex h-full flex-col p-3">
                <p className="mb-2 font-mono text-xs font-semibold">{editing.path}</p>
                <textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  spellCheck={false}
                  aria-label={`Contents of ${editing.path}`}
                  className="min-h-0 flex-1 resize-none rounded-lg border border-border bg-background p-3 font-mono text-[12.5px] leading-5 outline-none focus:border-brand"
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={saveFile}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <FileList files={view.files} onOpen={openFile} />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        <Button size="sm" onClick={checkWork} disabled={solved}>
          {solved ? "Solved" : "Check my work"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowHint((s) => !s)}>
          <Lightbulb className="size-4" /> Hint
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="size-4" /> {confirmReset ? "Reset? Click again" : "Start over"}
        </Button>
        {passed ? (
          <span className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-brand">
            <CheckCircle2 className="size-4" /> Every goal met
          </span>
        ) : null}
      </div>
      {showHint ? (
        <p className="border-t border-border bg-secondary/40 px-5 py-3 text-sm">
          <InlineText text={hint} />
        </p>
      ) : null}
    </div>
  );
}

const STATUS_LABEL: Record<SandboxView["files"][number]["status"], string | null> = {
  clean: null,
  modified: "modified",
  staged: "staged",
  new: "new, staged",
  untracked: "untracked",
  conflict: "conflict",
  ignored: "ignored",
};

function FileList({
  files,
  onOpen,
}: {
  files: SandboxView["files"];
  onOpen: (path: string) => void;
}) {
  if (!files.length) {
    return <p className="p-4 text-sm text-chalk">No files yet.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {files.map((file) => {
        const label = STATUS_LABEL[file.status];
        return (
          <li key={file.path}>
            <button
              onClick={() => onOpen(file.path)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left font-mono text-[12.5px] hover:bg-secondary/60"
            >
              <FileText className="size-3.5 shrink-0 text-chalk" />
              <span className="min-w-0 flex-1 truncate">{file.path}</span>
              {label ? (
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 font-sans text-[10px] font-semibold",
                    file.status === "conflict"
                      ? "bg-destructive/10 text-destructive"
                      : file.status === "ignored"
                        ? "bg-secondary text-chalk"
                        : "bg-brand/10 text-brand",
                  )}
                >
                  {label}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
      <li className="px-4 py-2.5 text-[11px] text-chalk">
        Click a file to edit it. To make a new one, use{" "}
        <code className="font-mono">echo "text" &gt; name</code> in the terminal.
      </li>
    </ul>
  );
}

const ROW = 34;
const LANE = 18;

/** Newest first, one lane per line of history, like `git log --graph`. */
function layout(nodes: GraphNode[]) {
  const lanes: (string | null)[] = [];
  const at = new Map<string, { row: number; lane: number }>();
  nodes.forEach((node, row) => {
    let lane = lanes.indexOf(node.id);
    if (lane === -1) {
      lane = lanes.indexOf(null);
      if (lane === -1) lane = lanes.push(null) - 1;
    }
    for (let i = 0; i < lanes.length; i++) if (lanes[i] === node.id) lanes[i] = null;
    at.set(node.id, { row, lane });
    const [first, ...rest] = node.parents;
    if (first && !lanes.includes(first)) lanes[lane] = first;
    for (const p of rest) {
      if (lanes.includes(p)) continue;
      const free = lanes.indexOf(null);
      if (free === -1) lanes.push(p);
      else lanes[free] = p;
    }
  });
  const width = Math.max(1, ...[...at.values()].map((p) => p.lane + 1));
  return { at, width };
}

function CommitGraph({ nodes }: { nodes: GraphNode[] }) {
  if (!nodes.length) {
    return <p className="p-4 text-sm text-chalk">No commits yet.</p>;
  }
  const { at, width } = layout(nodes);
  const x = (lane: number) => 14 + lane * LANE;
  const y = (row: number) => 18 + row * ROW;
  const textX = x(width - 1) + 16;
  // Sized to the longest line, so a long message scrolls the panel instead of
  // being cut off at the SVG's edge. 11px monospace is about 6.7px a character.
  const longest = Math.max(
    ...nodes.map(
      (n) =>
        n.short.length +
        (n.head ? 5 : 0) +
        n.refs.reduce((sum, ref) => sum + ref.length + 3, 0) +
        n.subject.length +
        1,
    ),
  );
  return (
    <svg
      role="img"
      aria-label="Commit history"
      width={Math.ceil(textX + longest * 6.7 + 12)}
      height={y(nodes.length - 1) + 20}
      className="block"
    >
      {nodes.flatMap((node) => {
        const from = at.get(node.id)!;
        return node.parents.map((parent) => {
          const to = at.get(parent);
          if (!to) return null;
          const x1 = x(from.lane);
          const y1 = y(from.row);
          const x2 = x(to.lane);
          const y2 = y(to.row);
          const d =
            x1 === x2
              ? `M${x1},${y1} L${x2},${y2}`
              : `M${x1},${y1} C${x1},${y1 + ROW * 0.8} ${x2},${y1 + ROW * 0.2} ${x2},${y1 + ROW} L${x2},${y2}`;
          return (
            <path
              key={`${node.id}-${parent}`}
              d={d}
              fill="none"
              strokeWidth={2}
              className={cn(node.onRemoteOnly ? "stroke-chalk/40" : "stroke-brand/60")}
            />
          );
        });
      })}
      {nodes.map((node) => {
        const p = at.get(node.id)!;
        const refs = node.refs;
        return (
          <g key={node.id}>
            <circle
              cx={x(p.lane)}
              cy={y(p.row)}
              r={node.head ? 6 : 5}
              strokeWidth={2}
              className={cn(
                node.onRemoteOnly ? "fill-background stroke-chalk" : "fill-brand stroke-brand",
                node.head && "stroke-foreground",
              )}
            />
            <text x={textX} y={y(p.row) + 4} className="fill-foreground font-mono text-[11px]">
              <tspan className="fill-chalk">{node.short}</tspan>
              {node.head ? <tspan className="fill-ember font-bold"> HEAD</tspan> : null}
              {refs.map((ref) => (
                <tspan
                  key={ref}
                  className={cn(
                    ref.startsWith("origin/") ? "fill-chalk" : "fill-brand",
                    "font-semibold",
                  )}
                >
                  {` [${ref}]`}
                </tspan>
              ))}
              <tspan className="fill-foreground">{` ${node.subject}`}</tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}
