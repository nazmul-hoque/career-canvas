import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Layers, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatPill } from "@/components/common/StatPill";
import { useProfile, useProgress } from "@/hooks/useLearner";
import { careerPaths, pathCourses, pathLessonCount, type SkillLevel } from "@/content/curriculum";
import { liveLessons, pathLiveLessonCount } from "@/content/lessons";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/paths/")({
  head: () => ({
    meta: [
      { title: "Career paths — Ascent" },
      {
        name: "description",
        content:
          "Seven structured career paths: frontend, full-stack, Python, data analyst, UX/UI, product management and AI. Each with a roadmap, projects and a certificate.",
      },
      { property: "og:title", content: "Career paths — Ascent" },
      {
        property: "og:description",
        content: "Roadmaps that bundle the courses, practice and portfolio work each role expects.",
      },
    ],
  }),
  component: Paths,
});

const levels: (SkillLevel | "All")[] = ["All", "Beginner", "Intermediate", "Advanced"];

function Paths() {
  const [level, setLevel] = useState<(typeof levels)[number]>("All");
  const { data: profile } = useProfile();
  const { data: progress = [] } = useProgress();
  const done = useMemo(() => new Set(progress.map((p) => p.lesson_id)), [progress]);

  const list = careerPaths.filter((p) => level === "All" || p.difficulty === level);

  return (
    <AppShell>
      <header className="max-w-2xl">
        <p className="eyebrow">Career paths</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Pick the destination. We'll handle the order.
        </h1>
        <p className="mt-2 text-chalk">
          A path is a sequence, not a playlist. Courses, practice and portfolio projects arranged so
          each one earns the next.
        </p>
      </header>

      <div className="mt-7 flex flex-wrap gap-2">
        {levels.map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              level === l
                ? "bg-brand text-brand-foreground"
                : "bg-card text-chalk ring-1 ring-border hover:text-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((path) => {
          const pCourses = pathCourses(path);
          // `total` counts written lessons; `planned` is the whole roadmap. Progress
          // is always measured against what a learner can actually do today.
          const total = pathLiveLessonCount(path);
          const planned = pathLessonCount(path);
          const completed = pCourses.reduce(
            (sum, c) => sum + liveLessons(c).filter((l) => done.has(l.id)).length,
            0,
          );
          const percent = total ? Math.round((completed / total) * 100) : 0;
          const current = profile?.career_path === path.id;

          return (
            <Link
              key={path.id}
              to="/paths/$pathId"
              params={{ pathId: path.id }}
              className={cn(
                "card-surface group flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-lift",
                current && "ring-2 ring-brand",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatPill tone="brand">{path.difficulty}</StatPill>
                {path.popular ? (
                  <StatPill tone="ember">
                    <Sparkles className="size-3" /> Popular
                  </StatPill>
                ) : null}
                {current ? <StatPill>Your path</StatPill> : null}
              </div>

              <h2 className="mt-4 font-display text-xl font-bold">{path.name}</h2>
              <p className="mt-0.5 text-sm font-medium text-brand">{path.tagline}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-chalk">{path.overview}</p>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {path.skills.slice(0, 5).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-chalk ring-1 ring-border"
                  >
                    {s}
                  </span>
                ))}
                {path.skills.length > 5 ? (
                  <span className="px-1 py-1 text-[11px] font-semibold text-chalk">
                    +{path.skills.length - 5}
                  </span>
                ) : null}
              </div>

              {completed > 0 ? (
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-chalk">
                      {completed} / {total} lessons
                    </span>
                    <span className="text-brand">{percent}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-chalk">
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="size-3.5" /> {pCourses.length} courses
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {path.weeks}w
                  </span>
                  <span className={cn(total < planned && "text-ember")}>
                    {total} / {planned} lessons live
                  </span>
                </span>
                <ArrowRight className="size-4 text-brand transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
