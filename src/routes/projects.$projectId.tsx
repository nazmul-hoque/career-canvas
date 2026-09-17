import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Clock, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { projectById } from "@/content/projects";
import { useSubmissions } from "@/hooks/useLearner";
import { useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/projects/$projectId")({
  loader: ({ params }) => {
    const project = projectById(params.projectId);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Project unavailable — Ascent" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.project.title} — Ascent` },
        { name: "description", content: loaderData.project.brief },
        { property: "og:title", content: `${loaderData.project.title} — Ascent` },
        { property: "og:description", content: loaderData.project.brief },
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
        <h1 className="font-display text-2xl font-bold">That project isn't available</h1>
        <Button asChild className="mt-6">
          <Link to="/projects">All projects</Link>
        </Button>
      </div>
    </AppShell>
  );
}

const mockFeedback = (notes: string) =>
  `Strong submission. Your structure matches the brief and the milestones are visible in the commit history.${
    notes.trim() ? " Thanks for the notes — they made the review faster." : ""
  } Two things to push further: tighten the empty and error states, and add a short README explaining the decisions you made and why. Hiring managers read that first.`;

function ProjectDetail() {
  const { project } = Route.useLoaderData();
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: submissions = [] } = useSubmissions();
  const existing = submissions.find((s) => s.project_id === project.id);

  const [repo, setRepo] = useState(existing?.repo_url ?? "");
  const [live, setLive] = useState(existing?.live_url ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Sign in to submit your project");
      navigate({ to: "/auth" });
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user.id,
      project_id: project.id,
      repo_url: repo || null,
      live_url: live || null,
      notes: notes || null,
      status: "reviewed",
      feedback: mockFeedback(notes),
    };
    const { error } = existing
      ? await supabase.from("project_submissions").update(payload).eq("id", existing.id)
      : await supabase.from("project_submissions").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("We couldn't save that", { description: error.message });
      return;
    }
    qc.invalidateQueries({ queryKey: ["submissions", user.id] });
    toast.success("Submitted — your review is ready below");
  }

  return (
    <AppShell>
      <section className="ink-surface diagonals overflow-hidden rounded-[18px] p-8 text-white sm:p-10">
        <p className="eyebrow text-white/60">Portfolio project · {project.difficulty}</p>
        <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">{project.title}</h1>
        <p className="mt-3 max-w-2xl text-white/75 sm:text-lg">{project.brief}</p>
        <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-white/80">
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" /> ~{project.hours} hours
          </span>
          <span>{project.milestones.length} milestones</span>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card-surface p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold">Requirements</h2>
            <ul className="mt-4 space-y-2.5">
              {project.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                  {r}
                </li>
              ))}
            </ul>

            <h3 className="mt-8 font-display text-lg font-bold">Milestones</h3>
            <ol className="mt-4 space-y-3">
              {project.milestones.map((m, i) => (
                <li key={m} className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-secondary font-display text-xs font-bold">
                    {i + 1}
                  </span>
                  {m}
                </li>
              ))}
            </ol>
          </section>

          <section className="card-surface p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold">Submit your work</h2>
            <p className="mt-1 text-sm text-chalk">Drop a repository link and a live URL. Feedback arrives instantly.</p>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="repo" className="mb-1.5 block text-sm font-semibold">
                  Repository URL
                </label>
                <Input id="repo" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="https://github.com/you/project" />
              </div>
              <div>
                <label htmlFor="live" className="mb-1.5 block text-sm font-semibold">
                  Live URL
                </label>
                <Input id="live" value={live} onChange={(e) => setLive(e.target.value)} placeholder="https://your-project.app" />
              </div>
              <div>
                <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold">
                  Anything you want reviewed closely?
                </label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {existing ? "Resubmit" : "Submit for review"}
              </Button>
            </form>

            {existing?.feedback ? (
              <div className="mt-6 rounded-[14px] border border-brand/25 bg-brand/5 p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-brand">
                  <Sparkles className="size-4" /> Mentor review
                </p>
                <p className="mt-2 text-sm leading-6">{existing.feedback}</p>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card-surface p-6">
            <p className="eyebrow">Skills practised</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.skills.map((s) => (
                <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                  {s}
                </span>
              ))}
            </div>
          </section>
          <section className="card-surface p-6">
            <p className="eyebrow">Status</p>
            <p className="mt-2 text-sm font-semibold">
              {existing ? "Reviewed" : "Not started"}
            </p>
            <p className="mt-1 text-sm text-chalk">
              {existing
                ? "You can resubmit any time — the newest version is what shows on your profile."
                : "Submissions appear on your public profile once reviewed."}
            </p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
