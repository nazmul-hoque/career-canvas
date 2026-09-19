import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Lightbulb,
  Lock,
  Sparkles,
  MessageSquare,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { MentorPanel } from "@/components/learn/MentorPanel";
import { InlineText } from "@/components/learn/InlineText";
import { CodeChallenge } from "@/components/learn/CodeChallenge";
import { courseById, courseLessons, type Course, type LessonMeta } from "@/content/curriculum";
import {
  isLessonLive,
  nextLiveLesson,
  type PublicLessonBlock,
  type PublicLessonBody,
} from "@/content/lessons";
import { checkAnswerFn, getLessonFn, type CheckAnswerResult } from "@/lib/lessons.functions";
import { useProgress, useCompleteLesson } from "@/hooks/useLearner";
import { useSession } from "@/hooks/useAuth";
import type { RunResult } from "@/lib/code-runner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";
import { isLessonUnlocked } from "@/lib/entitlements";
import { useEntitlements } from "@/hooks/useEntitlements";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/$courseId/$lessonId")({
  loader: async ({ params }) => {
    const course = courseById(params.courseId);
    const lesson = course ? courseLessons(course).find((l) => l.id === params.lessonId) : undefined;
    if (!course || !lesson) throw notFound();
    // Comes from the server without its answer key; see lessons.functions.ts.
    const body = await getLessonFn({ data: { courseId: course.id, lessonId: lesson.id } });
    // `body` is null for lessons nobody has written yet — the route renders a
    // "coming soon" state for those instead of pretending they are teachable.
    return { course, lesson, body };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Lesson unavailable — Ascent" }, { name: "robots", content: "noindex" }],
      };
    }
    if (!loaderData.body) {
      return {
        meta: [
          { title: `${loaderData.lesson.title} — coming soon — Ascent` },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: `${loaderData.lesson.title} — ${loaderData.course.title} — Ascent` },
        { name: "description", content: loaderData.body.summary },
        { property: "og:title", content: `${loaderData.lesson.title} — Ascent` },
        { property: "og:description", content: loaderData.body.summary },
      ],
    };
  },
  notFoundComponent: LessonMissing,
  errorComponent: LessonMissing,
  component: LessonRoute,
});

function LessonMissing() {
  return (
    <AppShell>
      <div className="card-surface p-10 text-center">
        <h1 className="font-display text-2xl font-bold">That lesson isn't available</h1>
        <p className="mt-2 text-sm text-chalk">Pick it back up from the catalog.</p>
        <Button asChild className="mt-6">
          <Link to="/learn">Back to catalog</Link>
        </Button>
      </div>
    </AppShell>
  );
}

function LessonRoute() {
  const { course, lesson, body } = Route.useLoaderData();
  const { entitlements, trialUsed } = useEntitlements();

  if (!body) return <LessonComingSoon course={course} lesson={lesson} />;
  if (!isLessonUnlocked(course, lesson.id, entitlements)) {
    return <LessonLocked course={course} lesson={lesson} trialUsed={trialUsed} />;
  }
  return <LessonWorkspace course={course} lesson={lesson} body={body} />;
}

/** Written, but beyond the first module — Free stops here. */
function LessonLocked({
  course,
  lesson,
  trialUsed,
}: {
  course: Course;
  lesson: LessonMeta;
  trialUsed: boolean;
}) {
  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <Link
          to="/courses/$courseId"
          params={{ courseId: course.id }}
          className="eyebrow flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3" /> {course.title}
        </Link>
        <div className="card-surface mt-5 p-8 text-center sm:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ember/10 px-3 py-1 text-xs font-semibold text-ember">
            <Lock className="size-3.5" /> Pro lesson
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {lesson.title}
          </h1>
          <p className="mt-3 text-sm text-chalk">
            Free covers the first module of every course. The rest of {course.title} — along with
            the mentor, portfolio projects and certificates — comes with Pro.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to="/pricing">
                {trialUsed ? "See plans" : "Start your free trial"}{" "}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/courses/$courseId" params={{ courseId: course.id }}>
                Back to the course
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/**
 * The lesson exists on the roadmap but nobody has written it yet. It awards no
 * XP and cannot be completed — saying so plainly beats generating filler.
 */
function LessonComingSoon({ course, lesson }: { course: Course; lesson: LessonMeta }) {
  const { data: progress = [] } = useProgress();

  // Demand signal: which unwritten lessons people actually try to open decides
  // what gets written next.
  useEffect(() => {
    track("lesson_coming_soon_viewed", { course_id: course.id, lesson_id: lesson.id });
  }, [course.id, lesson.id]);

  const done = new Set(progress.map((p) => p.lesson_id));
  const next = nextLiveLesson(course, done);

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <Link
          to="/courses/$courseId"
          params={{ courseId: course.id }}
          className="eyebrow flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3" /> {course.title}
        </Link>
        <div className="card-surface mt-5 p-8 text-center sm:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-chalk">
            <Lock className="size-3.5" /> Coming soon
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {lesson.title}
          </h1>
          <p className="mt-3 text-sm text-chalk">
            This lesson is on the {course.title} roadmap but hasn't been written yet. It doesn't
            award XP and doesn't count towards your progress or a certificate — we'd rather leave
            the slot visibly empty than fill it with something that teaches you nothing.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {next ? (
              <Button asChild>
                <Link
                  to="/learn/$courseId/$lessonId"
                  params={{ courseId: course.id, lessonId: next.id }}
                >
                  Go to the next live lesson <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/courses/$courseId" params={{ courseId: course.id }}>
                Back to the course
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function LessonWorkspace({
  course,
  lesson,
  body,
}: {
  course: Course;
  lesson: LessonMeta;
  body: PublicLessonBody;
}) {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: progress = [] } = useProgress();
  const complete = useCompleteLesson();

  const lessons = courseLessons(course);
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const done = new Set(progress.map((p) => p.lesson_id));
  const isDone = done.has(lesson.id);
  // Skip past anything unwritten — sending someone to a "coming soon" screen as
  // their reward for finishing a lesson is a dead end.
  const next = nextLiveLesson(course, new Set([...done, lesson.id]));

  const challenge = body.blocks.find((b) => b.kind === "challenge");
  const [code, setCode] = useState(challenge?.kind === "challenge" ? challenge.starter : "");
  const [lastRun, setLastRun] = useState<RunResult | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  // Only the server knows the answers, so a question is done when it said so.
  const [results, setResults] = useState<Record<string, CheckAnswerResult>>({});
  const [checking, setChecking] = useState<string | null>(null);
  const [mentorOpen, setMentorOpen] = useState(false);

  useEffect(() => {
    track("lesson_started", {
      course_id: course.id,
      lesson_id: lesson.id,
      type: lesson.type,
      xp: body.xp,
    });
  }, [course.id, lesson.id, lesson.type, body.xp]);

  const quizBlocks = body.blocks.filter((b) => b.kind === "mcq" || b.kind === "fill");
  const quizDone = quizBlocks.every((b) => "id" in b && results[b.id]?.correct);

  function answer(blockId: string, value: number | string) {
    if (results[blockId]?.correct) return;
    setAnswers((a) => ({ ...a, [blockId]: value }));
    // A new attempt clears the old verdict, so "Not quite" doesn't linger.
    setResults(({ [blockId]: _stale, ...rest }) => rest);
  }

  async function check(blockId: string) {
    const given = answers[blockId];
    if (given === undefined || given === "") return;
    setChecking(blockId);
    try {
      const result = await checkAnswerFn({
        data: { courseId: course.id, lessonId: lesson.id, blockId, answer: given },
      });
      setResults((r) => ({ ...r, [blockId]: result }));
    } catch {
      toast.error("Couldn't check that answer. Try again.");
    } finally {
      setChecking(null);
    }
  }
  const canFinish = quizDone && (!challenge || solved);

  const mentorContext = useMemo(
    () => ({
      courseId: course.id,
      lessonId: lesson.id,
      failedAttempts,
      lessonTitle: lesson.title,
      courseTitle: course.title,
      code: challenge ? code : undefined,
      language: challenge?.kind === "challenge" ? challenge.language : undefined,
      lastError: lastRun?.error ?? null,
      failingTests: lastRun?.tests.filter((t) => !t.passed).map((t) => t.name) ?? [],
    }),
    [course.id, lesson.id, lesson.title, course.title, code, challenge, lastRun, failedAttempts],
  );

  async function finish() {
    if (!user) {
      toast.error("Sign in to save your progress");
      navigate({ to: "/auth" });
      return;
    }
    // Already banked — the button is just "next" at this point. Re-submitting
    // would fail the server's answer check on a revisit.
    if (!isDone) {
      try {
        const res = await complete.mutateAsync({
          courseId: course.id,
          lessonId: lesson.id,
          answers,
          challengeSolved: solved,
        });
        if (res.firstTime) {
          toast.success(`+${res.gained} XP`, {
            description: res.leveledUp
              ? `Level up! You're now level ${res.level}.`
              : `${res.streak} day streak going.`,
          });
        }
      } catch {
        // The mutation's onError already surfaced why; stay on the lesson.
        return;
      }
    }
    if (next) {
      navigate({
        to: "/learn/$courseId/$lessonId",
        params: { courseId: course.id, lessonId: next.id },
      });
    } else {
      navigate({ to: "/courses/$courseId", params: { courseId: course.id } });
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[250px_1fr_340px]">
        {/* Roadmap */}
        <aside className="card-surface hidden max-h-[calc(100vh-7rem)] overflow-y-auto p-5 xl:sticky xl:top-24 xl:block">
          <Link
            to="/courses/$courseId"
            params={{ courseId: course.id }}
            className="eyebrow flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3" /> {course.title}
          </Link>
          <div className="mt-5 space-y-5">
            {course.modules.map((mod) => (
              <div key={mod.id}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-chalk">
                  {mod.title}
                </p>
                <ul className="mt-2 space-y-0.5">
                  {mod.lessons.map((l) => {
                    const active = l.id === lesson.id;
                    if (!isLessonLive(l.id)) {
                      return (
                        <li
                          key={l.id}
                          className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm text-chalk/60"
                          title="Not written yet"
                        >
                          <Lock className="mt-0.5 size-4 shrink-0 opacity-40" />
                          <span className="leading-snug">{l.title}</span>
                        </li>
                      );
                    }
                    return (
                      <li key={l.id}>
                        <Link
                          to="/learn/$courseId/$lessonId"
                          params={{ courseId: course.id, lessonId: l.id }}
                          className={cn(
                            "flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                            active
                              ? "bg-brand/10 font-semibold text-brand"
                              : "text-chalk hover:bg-secondary",
                          )}
                        >
                          {done.has(l.id) ? (
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                          ) : (
                            <Circle className="mt-0.5 size-4 shrink-0 opacity-40" />
                          )}
                          <span className="leading-snug">{l.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Lesson */}
        <article className="min-w-0 space-y-6">
          <header className="card-surface p-6 sm:p-8">
            <p className="eyebrow">
              Lesson {index + 1} of {lessons.length} · {lesson.minutes} min · {body.xp} XP
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-4xl">
              {lesson.title}
            </h1>
            <p className="mt-2 text-chalk">{body.summary}</p>
          </header>

          <div className="card-surface space-y-6 p-6 sm:p-8">
            {body.blocks.map((block, i) => (
              <Block
                key={i}
                block={block}
                answers={answers}
                results={results}
                checking={checking}
                onAnswer={answer}
                onCheck={check}
                code={code}
                setCode={setCode}
                solved={solved}
                onSolved={() => {
                  setSolved(true);
                  toast.success("Challenge solved");
                }}
                onResult={(result) => {
                  setLastRun(result);
                  // Counts toward the mentor's three-strikes rule: after three
                  // failed runs it stops withholding the solution.
                  if (!result.passed) setFailedAttempts((n) => n + 1);
                }}
              />
            ))}
          </div>

          <div className="card-surface flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-chalk">
              {isDone
                ? "You've already completed this lesson — revisit it any time."
                : canFinish
                  ? "Everything checks out. Bank the XP."
                  : "Finish the questions and challenge to unlock completion."}
            </p>
            <Button onClick={finish} disabled={!canFinish || complete.isPending} size="lg">
              {isDone ? "Next lesson" : `Complete · +${body.xp} XP`}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </article>

        {/* Mentor */}
        <div className="hidden xl:sticky xl:top-24 xl:block xl:h-[calc(100vh-7rem)]">
          <MentorPanel context={mentorContext} />
        </div>
      </div>

      {/* Mobile mentor */}
      <button
        onClick={() => {
          track("mentor_opened", { lesson: lesson.title, surface: "mobile" });
          setMentorOpen(true);
        }}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg xl:hidden"
      >
        <Sparkles className="size-4" /> Mentor
      </button>
      {mentorOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background p-3 xl:hidden">
          <button
            onClick={() => setMentorOpen(false)}
            className="mb-2 self-end rounded-full bg-secondary p-2"
            aria-label="Close mentor"
          >
            <X className="size-4" />
          </button>
          <MentorPanel context={mentorContext} className="flex-1" />
        </div>
      ) : null}
    </AppShell>
  );
}

interface BlockProps {
  block: PublicLessonBlock;
  answers: Record<string, number | string>;
  results: Record<string, CheckAnswerResult>;
  checking: string | null;
  onAnswer: (blockId: string, value: number | string) => void;
  onCheck: (blockId: string) => void;
  code: string;
  setCode: (c: string) => void;
  solved: boolean;
  onSolved: () => void;
  onResult: (r: RunResult) => void;
}

function Block({
  block,
  answers,
  results,
  checking,
  onAnswer,
  onCheck,
  code,
  setCode,
  solved,
  onSolved,
  onResult,
}: BlockProps) {
  if (block.kind === "text") {
    return (
      <p className="text-[15px] leading-7 text-foreground">
        <InlineText text={block.body} />
      </p>
    );
  }

  if (block.kind === "callout") {
    return (
      <div className="flex gap-3 rounded-[14px] border border-ember/25 bg-ember/5 p-4">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-ember" />
        <p className="text-sm leading-6">
          <InlineText text={block.body} />
        </p>
      </div>
    );
  }

  if (block.kind === "code") {
    return (
      <div className="overflow-hidden rounded-[14px] bg-ink">
        <div className="border-b border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white/50">
          {block.caption ?? block.language}
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-white/90">
          {block.code}
        </pre>
      </div>
    );
  }

  if (block.kind === "mcq") {
    const picked = answers[block.id];
    const result = results[block.id];
    const correct = result?.correct === true;
    return (
      <div className="rounded-[14px] border border-border p-5">
        <p className="eyebrow">Check yourself</p>
        <p className="mt-2 font-semibold">
          <InlineText text={block.question} />
        </p>
        <div className="mt-4 space-y-2">
          {block.options.map((opt, i) => (
            <button
              key={opt}
              onClick={() => onAnswer(block.id, i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                picked === i
                  ? "border-brand bg-brand/5 font-semibold"
                  : "border-border hover:bg-secondary",
                correct && picked === i && "border-brand bg-brand/10",
                result && !correct && picked === i && "border-destructive bg-destructive/5",
              )}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-[11px] font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <InlineText text={opt} />
            </button>
          ))}
        </div>
        {result ? (
          <p className={cn("mt-3 text-sm", correct ? "text-brand" : "text-destructive")}>
            {correct ? "Correct. " : "Not quite. Have another look and pick again."}
            {result.explanation ? (
              <span className="text-foreground">
                <InlineText text={result.explanation} />
              </span>
            ) : null}
          </p>
        ) : (
          <Button
            variant="outline"
            className="mt-4"
            disabled={picked === undefined || checking === block.id}
            onClick={() => onCheck(block.id)}
          >
            {checking === block.id ? "Checking…" : "Check answer"}
          </Button>
        )}
      </div>
    );
  }

  if (block.kind === "fill") {
    const value = String(answers[block.id] ?? "");
    const result = results[block.id];
    const correct = result?.correct === true;
    return (
      <div className="rounded-[14px] border border-border p-5">
        <p className="eyebrow">Fill the gap</p>
        <p className="mt-2 font-semibold">
          <InlineText text={block.prompt} />
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-4 py-3 font-mono text-[13px] text-white/90">
          <span>{block.before}</span>
          <Input
            value={value}
            onChange={(e) => onAnswer(block.id, e.target.value)}
            disabled={correct}
            aria-label="Your answer"
            className="h-8 w-40 border-white/20 bg-white/10 font-mono text-white placeholder:text-white/40"
          />
          <span>{block.after}</span>
        </div>
        {result ? (
          <p className={cn("mt-3 text-sm", correct ? "text-brand" : "text-destructive")}>
            {correct ? "That's it. " : "Try again."}
            {result.explanation ? (
              <span className="text-foreground">
                <InlineText text={result.explanation} />
              </span>
            ) : null}
          </p>
        ) : null}
        <Button
          variant="outline"
          className="mt-4"
          disabled={!value.trim() || correct || checking === block.id}
          onClick={() => onCheck(block.id)}
        >
          {checking === block.id ? "Checking…" : "Check answer"}
        </Button>
      </div>
    );
  }

  return (
    <CodeChallenge
      title={block.title}
      prompt={block.prompt}
      language={block.language}
      starter={block.starter}
      hint={block.hint}
      tests={block.tests}
      code={code}
      onCodeChange={setCode}
      onResult={onResult}
      onSolved={onSolved}
      solved={solved}
    />
  );
}

void MessageSquare;
