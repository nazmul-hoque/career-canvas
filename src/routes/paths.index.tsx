import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Layers } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { careerPaths, pathCourses, pathLessonCount } from "@/content/curriculum";

export const Route = createFileRoute("/paths/")({
  head: () => ({
    meta: [
      { title: "Career paths — Ascent" },
      { name: "description", content: "Structured roadmaps that take you from first line of code to job-ready, one practical step at a time." },
      { property: "og:title", content: "Career paths — Ascent" },
      { property: "og:description", content: "Structured roadmaps that take you from first line of code to job-ready." },
    ],
  }),
  component: PathsIndex,
});

function PathsIndex() {
  return (
    <AppShell>
      <header className="max-w-2xl">
        <p className="eyebrow">Career paths</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Pick a summit. We'll handle the route.
        </h1>
        <p className="mt-3 text-chalk">
          Every path is ordered: courses, practice tasks and portfolio projects that build on each other until you have
          work worth showing an employer.
        </p>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {careerPaths.map((path) => (
          <Link
            key={path.id}
            to="/paths/$pathId"
            params={{ pathId: path.id }}
            className="card-surface group flex flex-col p-6 transition-transform hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-bold leading-snug">{path.name}</h2>
              {path.popular ? (
                <span className="rounded-full bg-ember/10 px-2.5 py-1 text-[11px] font-bold text-ember">Popular</span>
              ) : null}
            </div>
            <p className="mt-2 flex-1 text-sm text-chalk">{path.tagline}</p>
            <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-chalk">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" /> {path.weeks} weeks
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="size-3.5" /> {pathCourses(path).length} courses
              </span>
              <span>{pathLessonCount(path)} lessons</span>
            </div>
            <span className="mt-5 flex items-center gap-1.5 text-sm font-bold text-brand">
              View roadmap
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
