import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, CalendarClock, Check, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/StatPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useAuth";
import { dueItems, useReviewQueue, useSubmitReview, type ReviewItem } from "@/hooks/useReviews";
import { findLesson } from "@/content/curriculum";
import { isQuestion, lessonQuestionCount, type PublicGradableBlock } from "@/content/lessons";
import { lessonQuery, usePublicLesson } from "@/hooks/useLesson";
import type { SubmitReviewResult } from "@/lib/review.functions";
import { InlineText } from "@/components/learn/InlineText";
import { cn } from "@/lib/utils";

/**
 * Spaced review.
 *
 * "Job-ready" used to rest on a single pass through each lesson. This is the
 * second pass, and the third, at widening intervals — the questions you already
 * answered, coming back on the day you are most likely to have started
 * forgetting them.
 *
 * Grading happens on the server (src/lib/review.functions.ts). What's here is
 * immediate feedback, which is a different thing from the score that counts.
 */
export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Daily review — Ascent" },
      {
        name: "description",
        content:
          "Revisit what you've already learned on a spaced schedule. Questions come back just before you'd forget them, and keep your streak alive.",
      },
      { property: "og:title", content: "Daily review — Ascent" },
      {
        property: "og:description",
        content: "Spaced review of lessons you've completed — the second pass that makes it stick.",
      },
    ],
  }),
  component: Review,
});

interface Card {
  item: ReviewItem;
  courseTitle: string;
  lessonTitle: string;
}

type Feedback = SubmitReviewResult["feedback"][string];

function Review() {
  const { user, isLoading: sessionLoading } = useSession();
  const { data: items = [], isLoading } = useReviewQueue();
  const submit = useSubmitReview();

  // Reviewed items are held locally as well as removed by the refetch: the
  // queue is re-read after every answer, and an index into a shrinking list is
  // how you end up asking the same question twice.
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [outcome, setOutcome] = useState<{
    correct: boolean;
    gained: number;
    dueOn: string;
    feedback: SubmitReviewResult["feedback"];
  } | null>(null);

  const cards = useMemo<Card[]>(() => {
    return dueItems(items)
      .filter((item) => !reviewed.includes(item.id))
      .map((item) => {
        const found = findLesson(item.course_id, item.lesson_id);
        if (!found || !lessonQuestionCount(item.lesson_id)) return null;
        return { item, courseTitle: found.course.title, lessonTitle: found.lesson.title };
      })
      .filter((c): c is Card => Boolean(c));
  }, [items, reviewed]);

  // The questions arrive without their answers; those come back from the
  // server with the grade.
  const { data: currentBody, isLoading: bodyLoading } = usePublicLesson(
    cards[0]?.item.course_id,
    cards[0]?.item.lesson_id,
  );

  // Fetch the next card's questions while this one is being answered, so
  // moving on doesn't flash the loading skeleton.
  const queryClient = useQueryClient();
  const nextCard = cards[1]?.item;
  useEffect(() => {
    if (nextCard)
      void queryClient.prefetchQuery(lessonQuery(nextCard.course_id, nextCard.lesson_id));
  }, [queryClient, nextCard]);
  const blocks = (currentBody?.blocks ?? []).filter(isQuestion);

  const upcoming = items.filter((i) => i.due_on > new Date().toISOString().slice(0, 10));

  if (sessionLoading || (user && isLoading) || (cards.length > 0 && bodyLoading)) {
    return (
      <AppShell>
        <Skeleton className="h-[420px] w-full rounded-[22px]" />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <EmptyState
          icon={<Brain className="size-5" />}
          title="Sign in to review"
          description="Your review schedule is built from the lessons you've finished, so it lives in your account."
          action={
            <Button asChild className="mt-2">
              <Link to="/auth">Sign in</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const card = cards[0];
  const position = reviewed.length + 1;
  const total = cards.length + reviewed.length;

  if (!card) {
    return (
      <AppShell>
        <header className="max-w-2xl">
          <p className="eyebrow">Daily review</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {reviewed.length
              ? "Review done for today."
              : items.length
                ? "Nothing due today."
                : "Your review queue starts with your first lesson."}
          </h1>
          <p className="mt-2 text-chalk">
            {reviewed.length
              ? `${reviewed.length} ${reviewed.length === 1 ? "lesson" : "lessons"} revisited. The next ones are scheduled below — coming back early doesn't pay XP, and doesn't help you remember either.`
              : items.length
                ? "Reviews come back on a widening schedule — a day, then three, then a week. Coming back early doesn't pay XP, and doesn't help you remember either."
                : "Finish a lesson with questions in it and it joins this queue, first check-in tomorrow."}
          </p>
        </header>

        {upcoming.length ? (
          <div className="card-surface mt-7 p-6">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-brand" />
              <p className="eyebrow">Scheduled</p>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {upcoming.slice(0, 8).map((item) => {
                const found = findLesson(item.course_id, item.lesson_id);
                return (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm font-semibold">
                      {found?.lesson.title ?? item.lesson_id}
                    </span>
                    <span className="shrink-0 text-xs text-chalk">
                      due {item.due_on} · every {item.interval_days}d
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <Button asChild className="mt-7">
          <Link to="/dashboard">Back to your dashboard</Link>
        </Button>
      </AppShell>
    );
  }

  const answered =
    blocks.length > 0 && blocks.every((b) => answers[b.id] !== undefined && answers[b.id] !== "");

  async function check() {
    if (!card) return;
    try {
      const result = await submit.mutateAsync({
        courseId: card.item.course_id,
        lessonId: card.item.lesson_id,
        answers,
      });
      setOutcome({
        correct: result.correct,
        gained: result.gained,
        dueOn: result.dueOn,
        feedback: result.feedback,
      });
      if (result.correct && result.gained > 0) {
        toast.success(`+${result.gained} XP`, { description: `Back on ${result.dueOn}.` });
      }
    } catch {
      /* useSubmitReview surfaces the error */
    }
  }

  function next() {
    if (card) setReviewed((r) => [...r, card.item.id]);
    setOutcome(null);
    setAnswers({});
  }

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Daily review</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {cards.length} {cards.length === 1 ? "lesson" : "lessons"} left to review
          </h1>
          <p className="mt-2 text-chalk">
            Answer from memory — the lesson is one click away, but looking it up teaches you less
            than getting it wrong does. A review holds your streak just like a lesson.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 font-display text-sm font-bold text-brand">
          <Brain className="size-4" /> {position} / {total}
        </span>
      </header>

      <div className="card-surface mt-7 p-6 sm:p-8">
        <p className="eyebrow">{card.courseTitle}</p>
        <h2 className="mt-1 font-display text-xl font-bold">{card.lessonTitle}</h2>
        <p className="mt-1 text-xs text-chalk">
          Last seen{" "}
          {card.item.last_reviewed_at
            ? new Date(card.item.last_reviewed_at).toLocaleDateString()
            : "when you completed it"}
          {card.item.lapses > 0 ? ` · slipped ${card.item.lapses}×` : null}
        </p>

        <div className="mt-6 space-y-5">
          {blocks.map((block) => (
            <Question
              key={block.id}
              block={block}
              value={answers[block.id]}
              feedback={outcome?.feedback[block.id]}
              onChange={(value) => setAnswers((a) => ({ ...a, [block.id]: value }))}
            />
          ))}
        </div>

        {outcome ? (
          <div
            className={cn(
              "mt-6 flex flex-wrap items-center gap-3 rounded-2xl p-4",
              outcome.correct ? "bg-brand/8" : "bg-destructive/8",
            )}
          >
            <span
              className={cn(
                "grid size-9 place-items-center rounded-xl",
                outcome.correct ? "bg-brand/15 text-brand" : "bg-destructive/15 text-destructive",
              )}
            >
              {outcome.correct ? <Check className="size-4" /> : <X className="size-4" />}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {outcome.correct ? "Still there." : "Gone fuzzy — that's what this is for."}
              </p>
              <p className="text-xs text-chalk">
                {outcome.gained > 0 ? `+${outcome.gained} XP · ` : "No XP this time · "}
                next due {outcome.dueOn}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link
                  to="/learn/$courseId/$lessonId"
                  params={{ courseId: card.item.course_id, lessonId: card.item.lesson_id }}
                >
                  <RotateCcw className="mr-1.5 size-3.5" /> Reread the lesson
                </Link>
              </Button>
              <Button size="sm" onClick={next}>
                {cards.length > 1 ? (
                  "Next lesson"
                ) : (
                  <>
                    <Sparkles className="mr-1.5 size-3.5" /> Finish
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button className="mt-6" onClick={check} disabled={!answered || submit.isPending}>
            {submit.isPending ? "Checking…" : "Check my answer"}
          </Button>
        )}
      </div>
    </AppShell>
  );
}

function Question({
  block,
  value,
  feedback,
  onChange,
}: {
  block: PublicGradableBlock;
  value: string | number | undefined;
  /** Present once graded — the only time the answer is known here. */
  feedback: Feedback | undefined;
  onChange: (value: string | number) => void;
}) {
  const locked = Boolean(feedback);
  if (block.kind === "mcq") {
    return (
      <div className="rounded-[14px] border border-border p-5">
        <p className="font-semibold">
          <InlineText text={block.question} />
        </p>
        <div className="mt-4 space-y-2">
          {block.options.map((option, i) => (
            <button
              key={option}
              disabled={locked}
              onClick={() => onChange(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                value === i
                  ? "border-brand bg-brand/5 font-semibold"
                  : "border-border hover:bg-secondary",
                feedback && i === feedback.answer && "border-brand bg-brand/10",
              )}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-[11px] font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <InlineText text={option} />
            </button>
          ))}
        </div>
        {feedback ? (
          <p className="mt-3 text-sm text-chalk">
            <InlineText text={feedback.explanation} />
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-border p-5">
      <p className="font-semibold">
        <InlineText text={block.prompt} />
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-4 py-3 font-mono text-[13px] text-white/90">
        <span>{block.before}</span>
        <Input
          value={String(value ?? "")}
          disabled={locked}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Your answer"
          className="h-8 w-40 border-white/20 bg-white/10 font-mono text-white placeholder:text-white/40"
        />
        <span>{block.after}</span>
      </div>
      {feedback ? (
        <p className="mt-3 text-sm text-chalk">
          Answer: <span className="font-mono font-semibold">{feedback.answer}</span> —{" "}
          <InlineText text={feedback.explanation} />
        </p>
      ) : null}
    </div>
  );
}
