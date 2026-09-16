import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, FolderGit2, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatPill, EmptyState } from "@/components/common/StatPill";
import { useSubmissions } from "@/hooks/useLearner";
import { careerPaths, type SkillLevel } from "@/content/curriculum";
import { projects } from "@/content/projects";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Portfolio projects — Ascent" },
      {
        name: "description",
        content:
          "Eight real project briefs — landing page, e-commerce storefront, analytics dashboard, 2048, weather app, AI assistant and more — with requirements, milestones and feedback.",
      },
      { property: "og:title", content: "Portfolio projects — Ascent" },
      {
        property: "og:description",
        content: "Build work you can show, with a brief and requirements like a real ticket.",
      },
    ],
  }),
  component: Projects,
});

const levels: (SkillLevel | "All")[] = ["All", "Beginner", "Intermediate", "Advanced"];

function Projects() {
  const [level, setLevel] = useState<(typeof levels)[number]>("All");
  const [career, setCareer] = useState("all");
  const { data: submissions = [] } = useSubmissions();

  const byProject = useMemo(() => {
    const map = new Map<string, { status: string }>();
    for (const s of submissions as { project_id: string; status: string }[]) {
      map.set(s.project_id, { status: s.status });
    }
    return map;
  }, [submissions]);

  const list = projects.filter(
    (p) =>
      (level === "All" || p.difficulty === level) &&
      (career === "all" || p.careers.includes(career)),
  );

  const completed = projects.filter((p) => byProject.get(p.id)?.status === "approved").length;

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Projects</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Briefs, not tutorials.
          </h1>
          <p className="mt-2 text-chalk">
            Each project reads like a ticket: what to build, what it must do, how it gets judged. No
            step-by-step to copy.
          </p>
        </div>
        {submissions.length > 0 ? (
          <div className="card-surface px-5 py-3">
            <div className="font-display text-2xl font-bold">
              {completed}
              <span className="text-chalk">/{projects.length}</span>
            </div>
            <div className="text-xs font-semibold text-chalk">approved</div>
          </div>
        ) : null}
      </header>

      <div className="card-surface mt-7 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">
          {levels.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                level === l
                  ? "bg-brand text-brand-foreground"
                  : "bg-secondary text-chalk ring-1 ring-border hover:text-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <button
            onClick={() => setCareer("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              career === "all"
                ? "bg-ink text-white"
                : "bg-secondary text-chalk ring-1 ring-border hover:text-foreground",
            )}
          >
            Every path
          </button>
          {careerPaths.map((p) => (
            <button
              key={p.id}
              onClick={() => setCareer(p.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                career === p.id
                  ? "bg-ink text-white"
                  : "bg-secondary text-chalk ring-1 ring-border hover:text-foreground",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<FolderGit2 className="size-5" />}
            title="No projects match those filters"
            description="Try widening the difficulty or picking a different career path."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((project) => {
            const submission = byProject.get(project.id);
            return (
              <Link
                key={project.id}
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className="card-surface group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div
                  className={cn(
                    "holdmark relative h-28",
                    project.accent === "brand" && "bg-brand",
                    project.accent === "ember" && "bg-ember",
                    project.accent === "ink" && "bg-ink",
                  )}
                >
                  {submission ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink">
                      {submission.status === "approved" ? (
                        <>
                          <CheckCircle2 className="size-3 text-brand" /> Approved
                        </>
                      ) : (
                        <>
                          <Loader2 className="size-3" /> In review
                        </>
                      )}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-lg font-bold leading-snug">{project.title}</h2>
                  <p className="mt-0.5 text-sm font-medium text-chalk">{project.tagline}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-chalk">{project.brief}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-chalk ring-1 ring-border"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
                    <StatPill tone="brand">{project.difficulty}</StatPill>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-chalk">
                      <Clock className="size-3.5" /> ~{project.hours}h
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
