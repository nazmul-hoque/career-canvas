import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { projects } from "@/content/projects";
import { useSubmissions } from "@/hooks/useLearner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Portfolio projects — Ascent" },
      { name: "description", content: "Build real, reviewable projects: landing pages, dashboards, games and AI apps — each with a brief and feedback." },
      { property: "og:title", content: "Portfolio projects — Ascent" },
      { property: "og:description", content: "Build real, reviewable projects with briefs, milestones and feedback." },
    ],
  }),
  component: ProjectsIndex,
});

const accentClass = {
  brand: "bg-brand/10 text-brand",
  ember: "bg-ember/10 text-ember",
  ink: "bg-ink/5 text-ink",
} as const;

function ProjectsIndex() {
  const { data: submissions = [] } = useSubmissions();
  const submitted = new Set(submissions.map((s) => s.project_id));

  return (
    <AppShell>
      <header className="max-w-2xl">
        <p className="eyebrow">Projects</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Proof beats certificates. Build the proof.
        </h1>
        <p className="mt-3 text-chalk">
          Each project comes with a client-style brief, hard requirements and milestones. Submit a repo and get
          structured feedback.
        </p>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="card-surface group flex flex-col p-6 transition-transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", accentClass[project.accent])}>
                {project.difficulty}
              </span>
              {submitted.has(project.id) ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-brand">
                  <CheckCircle2 className="size-3.5" /> Submitted
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 font-display text-lg font-bold leading-snug">{project.title}</h2>
            <p className="mt-1 text-sm text-chalk">{project.tagline}</p>
            <p className="mt-3 flex-1 text-sm text-chalk">{project.brief}</p>
            <div className="mt-5 flex items-center justify-between text-xs font-semibold text-chalk">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" /> ~{project.hours} hours
              </span>
              <ArrowRight className="size-4 text-brand transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
