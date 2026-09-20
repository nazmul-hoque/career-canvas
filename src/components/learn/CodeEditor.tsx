import { useRef } from "react";
import { codeTokens } from "@/lib/code-tokens";

export function CodeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useRef<HTMLTextAreaElement>(null);
  const highlight = useRef<HTMLPreElement>(null);
  const numbers = useRef<HTMLDivElement>(null);
  function indent() {
    const el = editor.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    onChange(`${value.slice(0, start)}  ${value.slice(start)}`);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 2, end + 2);
    });
  }
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-white/70">
        <span>Tab moves to the next control. Drag the corner to resize.</span>
        <button
          type="button"
          className="shrink-0 rounded border border-white/30 px-3 py-2"
          onClick={indent}
        >
          Insert indent
        </button>
      </div>
      <div className="flex font-mono text-[13px] leading-6">
        <div
          aria-hidden="true"
          className="relative w-10 shrink-0 overflow-hidden border-r border-white/10 text-right text-white/50"
        >
          <div ref={numbers} className="absolute inset-x-0 top-4">
            {value.split("\n").map((_, i) => (
              <div className="pr-2" key={i}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <pre
            aria-hidden="true"
            ref={highlight}
            className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre p-4 font-mono text-[13px] leading-6"
          >
            {codeTokens(value).map((token, i) => (
              <span className={token.color} key={i}>
                {token.text}
              </span>
            ))}
            {"\n"}
          </pre>
          <textarea
            ref={editor}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Code editor"
            className="code-editor relative block h-72 min-h-72 w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-6 text-transparent caret-white selection:bg-blue-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
            onScroll={(e) => {
              if (highlight.current) {
                highlight.current.scrollTop = e.currentTarget.scrollTop;
                highlight.current.scrollLeft = e.currentTarget.scrollLeft;
              }
              if (numbers.current)
                numbers.current.style.transform = `translateY(-${e.currentTarget.scrollTop}px)`;
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const el = e.currentTarget;
              const start = el.selectionStart;
              const line = value.slice(0, start).split("\n").at(-1) ?? "";
              const indentation = line.match(/^\s*/)?.[0] ?? "";
              if (!indentation) return;
              e.preventDefault();
              const insert = `\n${indentation}`;
              onChange(value.slice(0, start) + insert + value.slice(el.selectionEnd));
              requestAnimationFrame(() =>
                el.setSelectionRange(start + insert.length, start + insert.length),
              );
            }}
          />
        </div>
      </div>
    </>
  );
}
