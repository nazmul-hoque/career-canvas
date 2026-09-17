import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CheckCircle2, Clock, Award } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { pathById, pathCourses, pathLessonCount, courseLessons } from "@/content/curriculum";
import { projectById } from "@/content/projects";
import { useProgress } from "@/hooks/useLearner";
import { ProgressRing } from "@/components/common/ProgressRing";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/paths/$pathId")({
  loader: ({ params }) => {
    const path = pathById(params.pathId);
    if (!path) throw notFound();
    return { path };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Path unavailable — Ascent" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.path.name} path — Ascent` },
        { name: "description", content: loaderData.path.overview },
        { property: "og:title", content: `${loaderData.path.name} path — Ascent` },
        { property: "og:description", content: loaderData.path.overview },
      ],
    };
  },
  notFoundComponent: PathMissing,
  errorComponent: PathMissing,
  component: PathDetail,
});

function PathMissing() {
  return (
    <AppShell>
      <div className="card-surface p-10 text-center">
        <h1 className="font-display text-2xl font-bold">That path isn't available</h1>
        <Button asChild className="mt-6">
          <Link to="/paths">See all paths</Link>
        </Button>
      </div>
    </AppShell>
  );
}

function PathDetail() {
  const { path } = Route.useLoaderData();
  const { data: progress = [] } = useProgress();
  const done = new Set(progress.map((p) => p.lesson_id));
  const courses = pathCourses(path);
  const total = pathLessonCount(path);
  const completed = courses.reduce(
    (sum, c) => sum + courseLessons(c).filter((l) => done.has(l.id)).length,
    0,
  );
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const first = courses[0];

  return (
    <AppShell>
      <section className="ink-surface diagonals overflow-hidden rounded-[18px] p-8 text-white sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl">
            <p className="eyebrow text-white/60">Career path · {path.difficulty}</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">{path.name}</h1>
            <p className="mt-3 text-white/75 sm:text-lg">{path.overview}</p>
            <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-white/80">
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" /> ~{path.weeks} weeks
              </span>
              <span>{courses.length} courses</span>
              <span>{total} lessons</span>
            </div>
            {first ? (
              <Button asChild size="lg" variant="secondary" className="mt-7">
                <Link to="/courses/$courseId" params={{ courseId: first.id }}>
                  {completed > 0 ? "Continue path" : "Start this path"}
                </Link>
              </Button>
            ) : null}
          </div>
          <ProgressRing percent={percent} size={132} label={`${percent}%`} sublabel="complete" />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card-surface p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold">The roadmap</h2>
          <ol className="mt-6 space-y-4">
            {courses.map((course, i) => {
              const lessons = courseLessons(course);
              const doneCount = lessons.filter((l) => done.has(l.id)).length;
              const pct = Math.round((doneCount / lessons.length) * 100);
              return (
                <li key={course.id}>
                  <Link
                    to="/courses/$courseId"
                    params={{ courseId: course.id }}
                    className="flex items-center gap-4 rounded-[14px] border border-border p-4 transition-colors hover:border-brand"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary font-display text-sm font-bold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-semibold">{course.title}</span>
                      <span className="block text-sm text-chalk">{course.summary}</span>
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line">
                        <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-chalk">
                      {doneCount}/{lessons.length}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="space-y-6">
          <section className="card-surface p-6">
            <p className="eyebrow">Skills you'll own</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {path.skills.map((s) => (
                <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                  {s}
                </span>
              ))}
            </div>
          </section>

          <section className="card-surface p-6">
            <p className="eyebrow">Portfolio projects</p>
            <ul className="mt-3 space-y-2">
              {path.projectIds.map((id) => {
                const project = projectById(id);
                if (!project) return null;
                return (
                  <li key={id}>
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: id }}
                      className="flex items-start gap-2 text-sm hover:text-brand"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                      {project.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card-surface p-6">
            <p className="eyebrow">Certificate</p>
            <p className="mt-2 text-sm text-chalk">
              Finish every lesson in this path to unlock a verifiable certificate with your name on it.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full" disabled={percent < 100}>
              <Link to="/certificate/$pathId" params={{ pathId: path.id }}>
                <Award className="size-4" /> {percent < 100 ? "Locked" : "View certificate"}
              </Link>
            </Button>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
