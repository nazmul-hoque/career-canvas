import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { askMentor, suggestedPrompts, type MentorContext, type MentorMessage } from "@/lib/mentor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function MentorPanel({
  context,
  onFirstMessage,
  className,
}: {
  context: MentorContext;
  onFirstMessage?: () => void;
  className?: string;
}) {
  const [messages, setMessages] = useState<MentorMessage[]>([
    {
      id: "intro",
      role: "mentor",
      content: `I'm your mentor for ${context.lessonTitle ?? "this lesson"}. I won't hand you answers — I'll ask the question you're missing. Stuck, curious, or want your code reviewed? Start anywhere.`,
      at: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    if (messages.length === 1) onFirstMessage?.();
    const userMsg: MentorMessage = { id: crypto.randomUUID(), role: "user", content: trimmed, at: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    const reply = await askMentor(trimmed, context, messages);
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "mentor", content: reply, at: Date.now() }]);
    setThinking(false);
  }

  return (
    <div className={cn("card-surface flex h-full flex-col overflow-hidden", className)}>
      <header className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <span className="grid size-8 place-items-center rounded-xl bg-brand/10 text-brand">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="text-sm font-bold">AI Mentor</p>
          <p className="text-[11px] text-chalk">Knows what lesson you're on</p>
        </div>
      </header>

      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              m.role === "mentor"
                ? "bg-secondary text-foreground"
                : "ml-auto bg-ink text-white",
            )}
          >
            {m.content}
          </div>
        ))}
        {thinking ? (
          <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-chalk">
            <Loader2 className="size-3.5 animate-spin" /> Thinking it through…
          </div>
        ) : null}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {suggestedPrompts(context).map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={thinking}
              className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-chalk transition-colors hover:text-foreground disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this lesson…"
            aria-label="Message the AI mentor"
          />
          <Button type="submit" size="icon" disabled={thinking || !input.trim()} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
