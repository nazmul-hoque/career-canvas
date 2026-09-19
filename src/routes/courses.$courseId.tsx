import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Clock, CheckCircle2, PlayCircle, Code2, Wrench, BookOpen, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { courseById, courseLessons } from "@/content/curriculum";
import {
  formatMinutes,
  isLessonLive,
  liveChallengeCount,
  liveLessons,
  liveMinutes,
  nextLiveLesson,
} from "@/content/lessons";
import { isLessonUnlocked } from "@/lib/entitlements";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useProgress } from "@/hooks/useLearner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/courses/$courseId")({
  loader: ({ params }) => {
    const course = courseById(params.courseId);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Course unavailable — Ascent" }, { name: "robots", content: "noindex" }],
      };
    }
    const { course } = loaderData;
    return {
      meta: [
        { title: `${course.title} — Ascent` },
        { name: "description", content: course.summary },
        { property: "og:title", content: `${course.title} — Ascent` },
        { property: "og:description", content: course.summary },
      ],
    };
  },
  notFoundComponent: CourseMissing,
  errorComponent: CourseMissing,
  component: CourseDetail,
});

function CourseMissing() {
  return (
    <AppShell>
      <div className="card-surface p-10 text-center">
        <h1 className="font-display text-2xl font-bold">We could not find that course</h1>
        <p className="mt-2 text-sm text-chalk">
          It may have been renamed. The catalog has everything current.
        </p>
        <Button asChild className="mt-6">
          <Link to="/learn">Back to catalog</Link>
        </Button>
      </div>
    </AppShell>
  );
}

const typeIcon = {
  concept: BookOpen,
  practice: Wrench,
  challenge: Code2,
  project: PlayCircle,
} as const;

function CourseDetail() {
  const { course } = Route.useLoaderData();
  const { data: progress = [] } = useProgress();
  const { entitlements } = useEntitlements();
  const done = new Set(progress.map((p) => p.lesson_id));
  const lessons = courseLessons(course);
  // Written lessons only: unwritten slots stay on the curriculum list as
  // "coming soon" but never inflate a denominator or a percentage.
  const written = liveLessons(course);
  const challenges = liveChallengeCount(course);
  const completed = written.filter((l) => done.has(l.id)).length;
  const percent = written.length ? Math.round((completed / written.length) * 100) : 0;
  const next = nextLiveLesson(course, done) ?? written[0] ?? null;

  return (
    <AppShell>
      <section className="ink-surface diagonals overflow-hidden rounded-[18px] p-8 text-white sm:p-10">
        <div className="max-w-3xl">
          <p className="eyebrow text-white/60">
            {course.skill} · {course.level}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">
            {course.title}
          </h1>
          <p className="mt-3 text-white/75 sm:text-lg">{course.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm font-semibold text-white/80">
            {written.length ? (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" /> {formatMinutes(liveMinutes(course))}
              </span>
            ) : null}
            <span>
              {written.length} of {lessons.length} lessons live
            </span>
            {challenges ? (
              <span>
                {challenges} coding {challenges === 1 ? "challenge" : "challenges"}
              </span>
            ) : null}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {next ? (
              <Button asChild size="lg" variant="secondary">
                <Link
                  to="/learn/$courseId/$lessonId"
                  params={{ courseId: course.id, lessonId: next.id }}
                >
                  {completed > 0 ? "Continue course" : "Start course"}
                </Link>
              </Button>
            ) : (
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80">
                {written.length
                  ? "You've finished every live lesson here"
                  : "No lessons written yet"}
              </span>
            )}
            {completed > 0 ? (
              <span className="text-sm text-white/70">
                {completed}/{written.length} lessons · {percent}% complete
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card-surface p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold">Curriculum</h2>
            <p className="mt-1 text-sm text-chalk">
              {course.modules.length} modules, built to be done in order.
            </p>
            <div className="mt-6 space-y-6">
              {course.modules.map((mod, i) => (
                <div key={mod.id}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-sm font-bold text-brand">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-base font-semibold">{mod.title}</h3>
                      <p className="text-sm text-chalk">{mod.summary}</p>
                    </div>
                  </div>
                  <ul className="mt-3 divide-y divide-border border-y border-border">
                    {mod.lessons.map((l) => {
                      const Icon = typeIcon[l.type];
                      const isDone = done.has(l.id);
                      if (isLessonLive(l.id) && !isLessonUnlocked(course, l.id, entitlements)) {
                        return (
                          <li key={l.id} className="flex items-center gap-3 py-3 text-chalk/70">
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ember/10 text-ember">
                              <Lock className="size-4" />
                            </span>
                            <span className="flex-1 text-sm font-semibold">{l.title}</span>
                            <Link
                              to="/pricing"
                              className="text-xs font-semibold text-ember hover:underline"
                            >
                              Pro
                            </Link>
                          </li>
                        );
                      }
                      if (!isLessonLive(l.id)) {
                        return (
                          <li
                            key={l.id}
                            className="flex items-center gap-3 py-3 text-chalk/60"
                            title="Not written yet"
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary">
                              <Lock className="size-4" />
                            </span>
                            <span className="flex-1 text-sm font-semibold">{l.title}</span>
                            <span className="text-xs">Coming soon</span>
                          </li>
                        );
                      }
                      return (
                        <li key={l.id}>
                          <Link
                            to="/learn/$courseId/$lessonId"
                            params={{ courseId: course.id, lessonId: l.id }}
                            className="flex items-center gap-3 py-3 transition-colors hover:text-brand"
                          >
                            <span
                              className={cn(
                                "grid size-8 shrink-0 place-items-center rounded-lg",
                                isDone ? "bg-brand/10 text-brand" : "bg-secondary text-chalk",
                              )}
                            >
                              {isDone ? (
                                <CheckCircle2 className="size-4" />
                              ) : (
                                <Icon className="size-4" />
                              )}
                            </span>
                            <span className="flex-1 text-sm font-semibold">{l.title}</span>
                            <span className="text-xs text-chalk">
                              {l.type} · {l.minutes} min
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card-surface p-6">
            <p className="eyebrow">Skills you leave with</p>
            <ul className="mt-3 space-y-2">
              {course.skills.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section className="card-surface p-6">
            <p className="eyebrow">Your instructor</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-ink font-display text-sm font-bold text-white">
                {course.instructor.initials}
              </span>
              <span>
                <span className="block text-sm font-semibold">{course.instructor.name}</span>
                <span className="block text-xs text-chalk">{course.instructor.role}</span>
              </span>
            </div>
          </section>

          <section className="card-surface p-6">
            <p className="eyebrow">Progress</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-brand transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-chalk">
              {completed} of {written.length} live lessons complete
              {written.length < lessons.length ? (
                <span className="block text-xs text-chalk/70">
                  {lessons.length - written.length} more lessons are still being written.
                </span>
              ) : null}
            </p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
