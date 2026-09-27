import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { QueryError } from "@/components/common/QueryError";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound, redirect, useNavigate } from "@tanstack/react-router";
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
import { GitSandbox } from "@/components/learn/GitSandbox";
import {
  courseById,
  courseLessons,
  movedLesson,
  unitWords,
  type Course,
  type LessonMeta,
} from "@/content/curriculum";
import {
  isQuestion,
  isLessonLive,
  nextLiveLesson,
  type PublicLessonBlock,
  type PublicLessonBody,
} from "@/content/lessons";
import { checkAnswerFn, checkAnswersFn, type CheckAnswerResult } from "@/lib/lessons.functions";
import { lessonQuery } from "@/hooks/useLesson";
import { useProgress, useCompleteLesson } from "@/hooks/useLearner";
import { useSession } from "@/hooks/useAuth";
import type { RunResult } from "@/lib/code-runner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";
import { isLessonUnlocked } from "@/lib/entitlements";
import { useEntitlements } from "@/hooks/useEntitlements";
import { cn } from "@/lib/utils";
import { useLessonDraft } from "@/hooks/useLessonDraft";

export const Route = createFileRoute("/learn/$courseId/$lessonId")({
  loader: async ({ params, context }) => {
    const course = courseById(params.courseId);
    const lesson = course ? courseLessons(course).find((l) => l.id === params.lessonId) : undefined;
    if (!course || !lesson) {
      const moved = movedLesson(params.courseId, params.lessonId);
      if (moved)
        throw redirect({ to: "/learn/$courseId/$lessonId", params: moved, statusCode: 301 });
      throw notFound();
    }
    // Comes from the server without its answer key; see lessons.functions.ts.
    const body = await context.queryClient.ensureQueryData(lessonQuery(course.id, lesson.id));
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
  errorComponent: ({ reset }) => (
    <AppShell>
      <QueryError title="The lesson could not be loaded" retry={reset} />
    </AppShell>
  ),
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
  const { user, isLoading: sessionLoading } = useSession();
  const { entitlements, trialUsed } = useEntitlements();

  if (!body) return <LessonComingSoon course={course} lesson={lesson} />;
  if (!isLessonUnlocked(course, lesson.id, entitlements)) {
    return <LessonLocked course={course} lesson={lesson} trialUsed={trialUsed} />;
  }
  if (sessionLoading)
    return (
      <AppShell>
        <p role="status">Loading your workspace…</p>
      </AppShell>
    );
  return (
    <LessonWorkspace
      key={`${user?.id ?? "guest"}:${lesson.id}`}
      course={course}
      lesson={lesson}
      body={body}
    />
  );
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
  const progressQuery = useProgress();
  const { data: progress = [] } = progressQuery;

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
  const progressQuery = useProgress();
  const { data: progress = [] } = progressQuery;
  const complete = useCompleteLesson();

  const lessons = courseLessons(course);
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const done = new Set(progress.map((p) => p.lesson_id));
  const isDone = done.has(lesson.id);
  // Skip past anything unwritten — sending someone to a "coming soon" screen as
  // their reward for finishing a lesson is a dead end.
  const next = nextLiveLesson(course, new Set([...done, lesson.id]));
  const words = unitWords(course);

  const challenge = body.blocks.find((b) => b.kind === "challenge");
  const {
    code,
    setCode: saveCode,
    answers,
    setAnswers,
    ready: draftReady,
    status: draftStatus,
  } = useLessonDraft(
    user?.id,
    course.id,
    lesson.id,
    challenge?.kind === "challenge" ? challenge.starter : "",
  );
  function setCode(value: string) {
    saveCode(value);
    setSolved(false);
  }
  const [lastRun, setLastRun] = useState<RunResult | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  // Only the server knows the answers, so a question is done when it said so.
  const [results, setResults] = useState<Record<string, CheckAnswerResult>>({});
  const [checking, setChecking] = useState<string | null>(null);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    track("lesson_started", {
      course_id: course.id,
      lesson_id: lesson.id,
      type: lesson.type,
      xp: body.xp,
    });
  }, [course.id, lesson.id, lesson.type, body.xp]);

  const quizIds = body.blocks.filter(isQuestion).map((b) => b.id);
  const unanswered = quizIds.filter((id) => String(answers[id] ?? "").trim() === "").length;
  const wrong = quizIds.filter((id) => results[id] && !results[id].correct).length;

  function answer(blockId: string, value: number | string) {
    if (results[blockId]?.correct) return;
    setAnswers({ ...answers, [blockId]: value });
    // A new attempt clears the old verdict, so "Not quite" doesn't linger.
    setResults(({ [blockId]: _stale, ...rest }) => rest);
  }

  async function check(blockId: string): Promise<CheckAnswerResult | null> {
    const given = answers[blockId];
    if (given === undefined || given === "") return null;
    setChecking(blockId);
    try {
      const result = await checkAnswerFn({
        data: { courseId: course.id, lessonId: lesson.id, blockId, answer: given },
      });
      setResults((r) => ({ ...r, [blockId]: result }));
      return result;
    } catch {
      toast.error("Couldn't check that answer. Try again.");
      return null;
    } finally {
      setChecking(null);
    }
  }

  // Choosing an answer is enough to finish: Complete checks anything not yet
  // checked. It used to wait for every question's own Check button, and a
  // selected-but-unchecked answer left the button disabled with no hint why.
  const canFinish = unanswered === 0 && wrong === 0 && (!challenge || solved);
  // Declared by the lesson, not inferred from its emptiness — see LessonBody.
  const selfAttested = body.attested === true;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const status = (() => {
    if (isDone) return `You've already completed this ${words.singular} — revisit it any time.`;
    // Second, not last: a self-attested lesson has no questions and no
    // challenge, so every test below it is necessarily false anyway.
    if (selfAttested) return "Nothing here is marked for you — mark it done once you've done it.";
    if (unanswered > 0)
      return `${plural(unanswered, "question still needs", "questions still need")} an answer.`;
    if (wrong > 0)
      return `${plural(wrong, "answer isn't", "answers aren't")} right yet. Have another look.`;
    if (challenge && !solved) return "Pass the challenge to finish.";
    return "Everything's answered. Complete checks it and banks the XP.";
  })();

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
      const unchecked = quizIds.filter((id) => !results[id]);
      if (unchecked.length) {
        let verdicts: Record<string, CheckAnswerResult>;
        try {
          verdicts = await checkAnswersFn({
            data: {
              courseId: course.id,
              lessonId: lesson.id,
              answers: Object.fromEntries(unchecked.map((id) => [id, answers[id]!])),
            },
          });
        } catch {
          toast.error("Couldn't check your answers. Try again.");
          return;
        }
        setResults((r) => ({ ...r, ...verdicts }));
        const misses = unchecked.filter((id) => !verdicts[id]?.correct).length;
        if (misses) {
          toast.error(
            `${plural(misses, "answer isn't", "answers aren't")} right yet — it's marked above.`,
          );
          return;
        }
      }
      try {
        const res = await complete.mutateAsync({
          courseId: course.id,
          lessonId: lesson.id,
          answers,
          challengeSolved: solved,
          transcript:
            challenge?.kind === "challenge" && challenge.language === "git" ? code : undefined,
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

  if (user && progressQuery.isError)
    return (
      <AppShell>
        <QueryError
          title="Your saved progress could not be loaded"
          retry={() => progressQuery.refetch()}
        />
      </AppShell>
    );
  if (user && progressQuery.isLoading)
    return (
      <AppShell>
        <p role="status">Loading saved progress…</p>
      </AppShell>
    );

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 xl:hidden">
        <Link
          to="/courses/$courseId"
          params={{ courseId: course.id }}
          className="text-sm font-semibold text-brand"
        >
          {course.title}
        </Link>
        <Sheet open={outlineOpen} onOpenChange={setOutlineOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">Course outline</Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetTitle>Course outline</SheetTitle>
            <SheetDescription className="mb-5">
              Choose a lesson. Your draft stays on this device.
            </SheetDescription>
            <LessonOutline
              course={course}
              lessonId={lesson.id}
              done={done}
              onNavigate={() => setOutlineOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
      <p role="status" className="mb-3 text-xs text-chalk">
        {draftStatus}
      </p>
      <fieldset disabled={!draftReady} className="min-w-0">
        <div className="grid gap-6 xl:grid-cols-[250px_1fr_340px]">
          {/* Roadmap */}
          <aside className="card-surface hidden max-h-[calc(100vh-7rem)] overflow-y-auto p-5 xl:sticky xl:top-24 xl:block">
            <LessonOutline course={course} lessonId={lesson.id} done={done} />
          </aside>

          {/* Lesson */}
          <article className="min-w-0 space-y-6">
            <header className="card-surface p-6 sm:p-8">
              <p className="eyebrow">
                {words.singularTitle} {index + 1} of {lessons.length} · {lesson.minutes} min ·{" "}
                {body.xp} XP
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
                    // A git sandbox reports "still solved" after each command.
                    if (!solved) toast.success("Challenge solved");
                    setSolved(true);
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
              <p className="text-sm text-chalk">{status}</p>
              <Button
                onClick={finish}
                disabled={(!isDone && !canFinish) || complete.isPending || checking !== null}
                size="lg"
              >
                {isDone ? "Next lesson" : `Complete · +${body.xp} XP`}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </article>

          {/* Mentor */}
          <div className="hidden xl:sticky xl:top-24 xl:block xl:h-[calc(100vh-7rem)]">
            {wide ? <MentorPanel context={mentorContext} /> : null}
          </div>
        </div>
      </fieldset>
      {!wide ? (
        <Sheet open={mentorOpen} onOpenChange={setMentorOpen}>
          <SheetTrigger asChild>
            <button
              onClick={() => track("mentor_opened", { lesson: lesson.title, surface: "mobile" })}
              className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg"
            >
              <Sparkles className="size-4" /> Mentor
            </button>
          </SheetTrigger>
          <SheetContent className="flex h-dvh w-full flex-col p-3 pt-12 sm:max-w-lg">
            <SheetTitle className="sr-only">Lesson mentor</SheetTitle>
            <SheetDescription className="sr-only">
              Ask about this lesson. Press Escape to return to your work.
            </SheetDescription>
            <MentorPanel context={mentorContext} className="min-h-0 flex-1" />
          </SheetContent>
        </Sheet>
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
              <span className="flex-1">
                <InlineText text={opt} />
              </span>
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
        {/* Inline flow, not flex: the gap must sit inside the code and keep its newlines and
            indentation, or the snippet stops reading as one statement. */}
        <div className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-ink px-4 py-3 font-mono text-[13px] leading-9 text-white/90">
          {block.before}
          <Input
            value={value}
            onChange={(e) => onAnswer(block.id, e.target.value)}
            disabled={correct}
            aria-label="Your answer"
            style={{ width: `calc(${Math.max(value.length, 8)}ch + 1.5rem)` }}
            className="mx-0.5 inline-block h-8 max-w-full border-white/20 bg-white/10 px-2 align-middle font-mono text-[13px] text-white placeholder:text-white/40 md:text-[13px]"
          />
          {block.after}
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

  if (block.language === "git") {
    return (
      <GitSandbox
        title={block.title}
        prompt={block.prompt}
        setup={block.setup ?? ""}
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

  return (
    <CodeChallenge
      title={block.title}
      prompt={block.prompt}
      language={block.language}
      sheet={block.sheet}
      html={block.html}
      dataset={block.dataset}
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

function LessonOutline({
  course,
  lessonId,
  done,
  onNavigate,
}: {
  course: Course;
  lessonId: string;
  done: Set<string>;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Course lessons">
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
            <p className="text-[11px] font-bold uppercase tracking-wider text-chalk">{mod.title}</p>
            <ul className="mt-2 space-y-0.5">
              {mod.lessons.map((l) => {
                const active = l.id === lessonId;
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
                      aria-current={active ? "step" : undefined}
                      onClick={onNavigate}
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
    </nav>
  );
}
