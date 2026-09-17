import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Compass, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pathById, pathCourses, type Course, type ModuleMeta } from "@/content/curriculum";
import { getLessonBody, isLessonLive } from "@/content/lessons";
import { gradableBlocks, isBlockCorrect, type GradableBlock } from "@/lib/lesson-grading";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Placement check.
 *
 * It answers one question — "where should I start?" — and does nothing else. It
 * awards no XP, marks no lesson complete and writes nothing to the database,
 * because a placement test that granted progress would be a way to buy a
 * certificate with twelve lucky guesses.
 *
 * The questions are the real ones from lessons that exist. Nothing is generated.
 */
export const Route = createFileRoute("/placement/$pathId")({
  loader: ({ params }) => {
    const path = pathById(params.pathId);
    if (!path) throw notFound();
    return { path };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.path.name} placement check — Ascent` : "Placement check",
      },
      {
        name: "description",
        content: loaderData
          ? `Answer a few real questions from the ${loaderData.path.name} roadmap and find out which module to start from.`
          : "Find out where to start on an Ascent roadmap.",
      },
    ],
  }),
  notFoundComponent: () => (
    <AppShell>
      <div className="card-surface p-10 text-center">
        <h1 className="font-display text-2xl font-bold">No such career path</h1>
        <Button asChild className="mt-6">
          <Link to="/paths">All career paths</Link>
        </Button>
      </div>
    </AppShell>
  ),
  component: Placement,
});

interface Question {
  block: GradableBlock;
  course: Course;
  module: ModuleMeta;
  lessonTitle: string;
}

/** One question per live lesson, in roadmap order, capped so this stays short. */
const MAX_QUESTIONS = 10;

function buildQuestions(courses: Course[]): Question[] {
  const out: Question[] = [];
  for (const course of courses) {
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (!isLessonLive(lesson.id)) continue;
        const body = getLessonBody(course.id, lesson.id);
        if (!body) continue;
        const block = gradableBlocks(body)[0];
        if (!block) continue;
        out.push({ block, course, module, lessonTitle: lesson.title });
      }
    }
  }
  return out.slice(0, MAX_QUESTIONS);
}

function Placement() {
  const { path } = Route.useLoaderData();
  const courses = pathCourses(path);
  const questions = useMemo(() => buildQuestions(courses), [courses]);

  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);

  const answeredAll = questions.every(
    (q) => answers[q.block.id] !== undefined && answers[q.block.id] !== "",
  );

  const graded = questions.map((q) => ({ ...q, correct: isBlockCorrect(q.block, answers) }));
  const score = graded.filter((g) => g.correct).length;

  // The recommendation is the earliest module holding a question you missed.
  // Getting everything right recommends the module after the last one covered —
  // never "skip the path", because the questions only cover what is written.
  const firstMissed = graded.find((g) => !g.correct);
  const recommendedCourse = firstMissed?.course ?? graded.at(-1)?.course ?? courses[0];
  const recommendedModule = firstMissed?.module ?? graded.at(-1)?.module;
  const startLesson = recommendedModule?.lessons[0];

  if (!questions.length) {
    return (
      <AppShell>
        <div className="card-surface mx-auto max-w-xl p-10 text-center">
          <h1 className="font-display text-2xl font-bold">Not enough written lessons yet</h1>
          <p className="mt-2 text-sm text-chalk">
            A placement check only asks questions from lessons that exist, and the {path.name}{" "}
            roadmap doesn't have enough of them written yet. Start at the beginning — you'll move
            fast through anything you already know.
          </p>
          <Button asChild className="mt-7">
            <Link to="/paths/$pathId" params={{ pathId: path.id }}>
              Open the roadmap
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="max-w-2xl">
        <p className="eyebrow">Placement check</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Where should you start on {path.name}?
        </h1>
        <p className="mt-2 text-chalk">
          {questions.length} real questions from the roadmap. Nothing here is marked complete and no
          XP is awarded — the only output is a suggested starting point. Guessing costs you nothing
          except a worse suggestion.
        </p>
      </header>

      <div className="card-surface mt-7 space-y-5 p-6 sm:p-8">
        {questions.map((q, i) => {
          const locked = submitted;
          const value = answers[q.block.id];
          const correct = isBlockCorrect(q.block, answers);
          return (
            <div key={q.block.id} className="rounded-[14px] border border-border p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">
                  {i + 1} / {questions.length} · {q.course.title}
                </p>
                {locked ? (
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      correct ? "text-brand" : "text-destructive",
                    )}
                  >
                    {correct ? <Check className="size-4" /> : <X className="size-4" />}
                  </span>
                ) : null}
              </div>

              {q.block.kind === "mcq" ? (
                <>
                  <p className="mt-2 font-semibold">{q.block.question}</p>
                  <div className="mt-4 space-y-2">
                    {q.block.options.map((option, oi) => (
                      <button
                        key={option}
                        disabled={locked}
                        onClick={() => setAnswers((a) => ({ ...a, [q.block.id]: oi }))}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                          value === oi
                            ? "border-brand bg-brand/5 font-semibold"
                            : "border-border hover:bg-secondary",
                          locked && oi === q.block.answer && "border-brand bg-brand/10",
                        )}
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-[11px] font-bold">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 font-semibold">{q.block.prompt}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-4 py-3 font-mono text-[13px] text-white/90">
                    <span>{q.block.before}</span>
                    <Input
                      value={String(value ?? "")}
                      disabled={locked}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.block.id]: e.target.value }))}
                      aria-label="Your answer"
                      className="h-8 w-40 border-white/20 bg-white/10 font-mono text-white placeholder:text-white/40"
                    />
                    <span>{q.block.after}</span>
                  </div>
                </>
              )}

              {locked ? <p className="mt-3 text-sm text-chalk">{q.block.explanation}</p> : null}
            </div>
          );
        })}

        {!submitted ? (
          <Button
            disabled={!answeredAll}
            onClick={() => {
              setSubmitted(true);
              track("placement_completed", {
                path_id: path.id,
                score,
                questions: questions.length,
              });
            }}
          >
            {answeredAll ? "See where to start" : "Answer every question first"}
          </Button>
        ) : null}
      </div>

      {submitted ? (
        <div className="card-surface mt-5 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-brand" />
            <p className="eyebrow">Your suggested start</p>
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold">
            {score} of {questions.length} right
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-chalk">
            {firstMissed ? (
              <>
                The first thing you missed comes from{" "}
                <span className="font-semibold text-foreground">{recommendedModule?.title}</span> in{" "}
                {recommendedCourse?.title}. That's where the roadmap stops being revision for you —
                start there, and treat anything earlier as optional.
              </>
            ) : (
              <>
                You answered everything correctly, so the written part of this roadmap is revision.
                Start from{" "}
                <span className="font-semibold text-foreground">{recommendedModule?.title}</span>{" "}
                and move fast — nothing is marked complete on your account, because answering ten
                questions is not the same as doing the work.
              </>
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {recommendedCourse && startLesson ? (
              <Button asChild>
                <Link
                  to="/learn/$courseId/$lessonId"
                  params={{ courseId: recommendedCourse.id, lessonId: startLesson.id }}
                >
                  Start at {recommendedModule?.title}
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/paths/$pathId" params={{ pathId: path.id }}>
                See the whole roadmap
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
