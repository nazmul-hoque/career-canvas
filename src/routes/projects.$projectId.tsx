import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Github,
  MessageCircle,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatPill } from "@/components/common/StatPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { toast } from "sonner";
import {
  useProjectMilestones,
  useSubmission,
  useSubmitProject,
  useToggleMilestone,
} from "@/hooks/useProjects";
import { projectById } from "@/content/projects";
import { careerPaths } from "@/content/curriculum";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId")({
  loader: ({ params }) => {
    const project = projectById(params.projectId);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Project unavailable — Ascent" }, { name: "robots", content: "noindex" }],
      };
    }
    const { project } = loaderData;
    return {
      meta: [
        { title: `${project.title} — Ascent` },
        { name: "description", content: project.brief },
        { property: "og:title", content: `${project.title} — Ascent` },
        { property: "og:description", content: project.brief },
      ],
    };
  },
  notFoundComponent: ProjectMissing,
  errorComponent: ProjectMissing,
  component: ProjectDetail,
});

function ProjectMissing() {
  return (
    <AppShell>
      <div className="card-surface p-10 text-center">
        <h1 className="font-display text-2xl font-bold">We could not find that project</h1>
        <p className="mt-2 text-sm text-chalk">The brief may have been renamed.</p>
        <Button asChild className="mt-6">
          <Link to="/projects">All projects</Link>
        </Button>
      </div>
    </AppShell>
  );
}

function ProjectDetail() {
  const { project } = Route.useLoaderData();
  const { user } = useSession();
  const { data: submission, isLoading } = useSubmission(project.id);
  const { entitlements, trialUsed } = useEntitlements();
  const submit = useSubmitProject(project.id);

  const [repo, setRepo] = useState("");
  const [live, setLive] = useState("");
  const [notes, setNotes] = useState("");
  const { data: milestones = [] } = useProjectMilestones(project.id);
  const toggleMilestoneMutation = useToggleMilestone(project.id);

  useEffect(() => {
    if (!submission) return;
    setRepo(submission.repo_url ?? "");
    setLive(submission.live_url ?? "");
    setNotes(submission.notes ?? "");
  }, [submission]);

  const toggleMilestone = (i: number) => {
    if (!user) {
      toast.error("Sign in to keep track of your milestones");
      return;
    }
    toggleMilestoneMutation.mutate({ index: i, checked: !milestones.includes(i) });
  };

  const canSubmit = Boolean(notes.trim()) && !submit.isPending;

  return (
    <AppShell>
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-chalk hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All projects
      </Link>

      <div
        className={cn(
          "holdmark mt-4 overflow-hidden rounded-[22px] px-6 py-10 sm:px-10",
          project.accent === "brand" && "bg-brand",
          project.accent === "ember" && "bg-ember",
          project.accent === "ink" && "ink-surface",
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/60">
          Portfolio brief
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {project.title}
        </h1>
        <p className="mt-1 font-medium text-white/80">{project.tagline}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
            {project.difficulty}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
            <Clock className="size-3.5" /> ~{project.hours} hours
          </span>
          {submission ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink">
              <CheckCircle2 className="size-3.5 text-brand" /> Submitted
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="card-surface p-6">
            <h2 className="font-display text-xl font-bold">The brief</h2>
            <p className="mt-2 leading-relaxed text-chalk">{project.brief}</p>
          </section>

          <section className="card-surface p-6">
            <h2 className="font-display text-xl font-bold">Requirements</h2>
            <p className="mt-1 text-sm text-chalk">
              All of these have to be true before you call it done.
            </p>
            <ul className="mt-4 space-y-2.5">
              {project.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-sm">
                  <Target className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card-surface p-6">
            <h2 className="font-display text-xl font-bold">Milestones</h2>
            <p className="mt-1 text-sm text-chalk">
              Tick these off as you go — it's only for your own sense of pace, and they're saved to
              your account.
            </p>
            <ol className="mt-4 space-y-2">
              {project.milestones.map((m, i) => {
                const checked = milestones.includes(i);
                return (
                  <li key={m}>
                    <button
                      onClick={() => toggleMilestone(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-colors ring-1",
                        checked
                          ? "bg-brand/10 text-brand ring-brand/25"
                          : "bg-secondary text-foreground ring-border hover:ring-brand/30",
                      )}
                    >
                      {checked ? (
                        <CheckCircle2 className="size-4 shrink-0" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-chalk" />
                      )}
                      <span className="font-mono text-xs text-chalk">{i + 1}</span>
                      {m}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Submission */}
          <section className="card-surface p-6" id="submit">
            <h2 className="font-display text-xl font-bold">Submit your work</h2>
            <p className="mt-1 text-sm text-chalk">
              Links are optional. The notes are not — explain your decisions and your mentor reviews
              those, the same way a reviewer would.
            </p>

            {!user ? (
              <div className="mt-5 rounded-xl bg-secondary p-5 text-center ring-1 ring-border">
                <p className="text-sm text-chalk">
                  Sign in to submit this project and keep the feedback.
                </p>
                <Button asChild className="mt-3">
                  <Link to="/auth">Sign in</Link>
                </Button>
              </div>
            ) : isLoading ? (
              <div className="mt-5 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : !entitlements.projects ? (
              <div className="mt-5 rounded-2xl bg-ember/10 p-5 text-center">
                <p className="text-sm font-semibold text-foreground">
                  Portfolio projects are part of Pro
                </p>
                <p className="mt-1.5 text-sm text-chalk">
                  The brief and milestones stay open on Free — submitting for review, and the
                  feedback that comes back, come with Pro.
                </p>
                <Button asChild className="mt-4">
                  <Link to="/pricing">{trialUsed ? "See plans" : "Start your free trial"}</Link>
                </Button>
              </div>
            ) : (
              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!canSubmit) return;
                  submit.mutate({ repo_url: repo, live_url: live, notes });
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="repo">Repository URL</Label>
                    <Input
                      id="repo"
                      value={repo}
                      onChange={(e) => setRepo(e.target.value)}
                      placeholder="https://github.com/you/project"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="live">Live URL</Label>
                    <Input
                      id="live"
                      value={live}
                      onChange={(e) => setLive(e.target.value)}
                      placeholder="https://your-project.vercel.app"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">
                    Notes <span className="font-normal text-chalk">— what you built and why</span>
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    placeholder="Which requirements did you meet, what did you decide against, and what would you do next with another day?"
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" disabled={!canSubmit}>
                  {submit.isPending
                    ? "Sending for review…"
                    : submission
                      ? "Resubmit for review"
                      : "Submit for review"}
                </Button>
              </form>
            )}

            {submission?.feedback ? (
              <div className="mt-6 rounded-xl bg-brand/8 p-5 ring-1 ring-brand/20">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand">
                  <MessageCircle className="size-3.5" /> Mentor review
                </div>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
                  {submission.feedback.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card-surface p-5">
            <h2 className="font-display text-lg font-bold">Skills practiced</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-chalk ring-1 ring-border"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>

          <section className="card-surface p-5">
            <h2 className="font-display text-lg font-bold">Counts toward</h2>
            <ul className="mt-3 space-y-2">
              {project.careers.map((id) => {
                const path = careerPaths.find((p) => p.id === id);
                if (!path) return null;
                return (
                  <li key={id}>
                    <Link
                      to="/paths/$pathId"
                      params={{ pathId: path.id }}
                      className="flex items-center justify-between rounded-xl bg-secondary px-3.5 py-3 text-sm font-semibold ring-1 ring-border transition-colors hover:ring-brand/40"
                    >
                      {path.name}
                      <ExternalLink className="size-3.5 text-chalk" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {submission ? (
            <section className="card-surface p-5">
              <h2 className="font-display text-lg font-bold">Your submission</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-chalk">Status</dt>
                  <dd>
                    <StatPill tone="brand">{submission.status}</StatPill>
                  </dd>
                </div>
                {submission.repo_url ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-chalk">Repo</dt>
                    <dd className="min-w-0">
                      <a
                        href={submission.repo_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 truncate font-semibold text-brand hover:underline"
                      >
                        <Github className="size-3.5 shrink-0" /> View
                      </a>
                    </dd>
                  </div>
                ) : null}
                {submission.live_url ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-chalk">Live</dt>
                    <dd className="min-w-0">
                      <a
                        href={submission.live_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 truncate font-semibold text-brand hover:underline"
                      >
                        <ExternalLink className="size-3.5 shrink-0" /> Open
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}
