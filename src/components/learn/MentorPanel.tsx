import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { suggestedPrompts, type MentorContext, type MentorMessage } from "@/lib/mentor";
import { mentorReplyFn } from "@/lib/mentor.functions";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { track } from "@/lib/analytics";
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
  const [remaining, setRemaining] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const { user } = useSession();

  // Conversations persist per lesson, so a learner can come back to how they got
  // unstuck last time.
  const { data: saved } = useQuery({
    queryKey: ["mentor", user?.id, context.lessonId],
    enabled: Boolean(user && context.lessonId),
    queryFn: async (): Promise<MentorMessage[]> => {
      const { data, error } = await supabase
        .from("mentor_messages")
        .select("id, role, content, created_at")
        .eq("user_id", user!.id)
        .eq("lesson_id", context.lessonId!)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (
        (data ?? []) as { id: string; role: string; content: string; created_at: string }[]
      ).map((row) => ({
        id: row.id,
        role: row.role === "mentor" ? ("mentor" as const) : ("user" as const),
        content: row.content,
        at: new Date(row.created_at).getTime(),
      }));
    },
  });

  // Replay the saved thread once, keeping the local intro at the top.
  useEffect(() => {
    if (!saved?.length) return;
    setMessages((current) => (current.length > 1 ? current : [current[0]!, ...saved]));
  }, [saved]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    if (!context.courseId || !context.lessonId) return;
    if (messages.length === 1) onFirstMessage?.();
    const userMsg: MentorMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      at: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    track("mentor_message_sent", {
      lesson: context.lessonTitle ?? null,
      course: context.courseTitle ?? null,
      turn: messages.length,
      has_code: Boolean(context.code?.trim()),
      after_error: Boolean(context.lastError),
    });

    try {
      const result = await mentorReplyFn({
        data: {
          courseId: context.courseId,
          lessonId: context.lessonId,
          question: trimmed,
          failedAttempts: context.failedAttempts ?? 0,
          code: context.code,
          language: context.language,
          lastError: context.lastError ?? null,
          failingTests: context.failingTests ?? [],
        },
      });
      setRemaining(result.remaining);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "mentor", content: result.reply, at: Date.now() },
      ]);
    } catch (error) {
      // Quota exhausted, misconfigured provider, network — say it in the thread
      // rather than a toast the learner might miss mid-conversation.
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "mentor",
          content:
            error instanceof Error
              ? error.message
              : "I couldn't reach my brain just then. Try again in a moment.",
          at: Date.now(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className={cn("card-surface flex h-full flex-col overflow-hidden", className)}>
      <header className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <span className="grid size-8 place-items-center rounded-xl bg-brand/10 text-brand">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="text-sm font-bold">AI Mentor</p>
          <p className="text-[11px] text-chalk">
            {remaining !== null && remaining <= 5
              ? `${remaining} messages left this month`
              : "Knows what lesson you're on"}
          </p>
        </div>
      </header>

      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              m.role === "mentor" ? "bg-secondary text-foreground" : "ml-auto bg-ink text-white",
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
              disabled={!user || thinking}
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
            placeholder={user ? "Ask anything about this lesson…" : "Sign in to ask your mentor"}
            disabled={!user}
            aria-label="Message the AI mentor"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!user || thinking || !input.trim()}
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
