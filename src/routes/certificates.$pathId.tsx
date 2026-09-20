import { AuthLink } from "@/components/common/AuthLink";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Award, Download, Lock, Printer, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Wordmark } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/StatPill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useSession } from "@/hooks/useAuth";
import { useProfile, useProgress } from "@/hooks/useLearner";
import { pathById, pathCourses } from "@/content/curriculum";
import {
  certificateId,
  formatCertificateDate,
  pathCompletedAt,
  pathCompletion,
  type CredentialState,
} from "@/lib/certificates";

export const Route = createFileRoute("/certificates/$pathId")({
  loader: ({ params }) => {
    const path = pathById(params.pathId);
    if (!path) throw notFound();
    return { path };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Certificate unavailable — Ascent" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: `${loaderData.path.name} certificate — Ascent` },
        {
          name: "description",
          content: `Certificate of completion for the ${loaderData.path.name} career path on Ascent.`,
        },
      ],
    };
  },
  notFoundComponent: CertMissing,
  errorComponent: CertMissing,
  component: Certificate,
});

function CertMissing() {
  return (
    <AppShell>
      <div className="card-surface p-10 text-center">
        <h1 className="font-display text-2xl font-bold">No certificate here</h1>
        <p className="mt-2 text-sm text-chalk">That career path doesn't exist.</p>
        <Button asChild className="mt-6">
          <Link to="/paths">All career paths</Link>
        </Button>
      </div>
    </AppShell>
  );
}

function Certificate() {
  const { path } = Route.useLoaderData();
  const { user, isLoading: sessionLoading } = useSession();
  const { data: profile, isLoading } = useProfile();
  const { data: progress = [] } = useProgress();
  const { entitlements, trialUsed } = useEntitlements();

  // A certificate already issued stays valid forever, even if Pro lapses — the
  // row in issued_certificates is the proof, not the current plan.
  const { data: issuedRecord } = useQuery({
    queryKey: ["issued-certificate", user?.id, path.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("issued_certificates")
        .select("certificate_id, issued_at")
        .eq("user_id", user!.id)
        .eq("path_id", path.id)
        .maybeSingle();
      return (data as { certificate_id: string; issued_at: string } | null) ?? null;
    },
  });

  if (sessionLoading || isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-[460px] w-full rounded-[22px]" />
      </AppShell>
    );
  }

  if (!user || !profile) {
    return (
      <AppShell>
        <EmptyState
          icon={<Award className="size-5" />}
          title="Sign in to view your certificate"
          description="Certificates are issued against your completed lessons, so we need to know who you are."
          action={
            <Button asChild className="mt-2">
              <AuthLink mode="login">Sign in</AuthLink>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const done = new Set(progress.map((p) => p.lesson_id));
  const { completed, total, live, percent, credential } = pathCompletion(path, done);

  if (!issuedRecord && !entitlements.certificates) {
    return (
      <AppShell>
        <div className="card-surface mx-auto max-w-xl p-10 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-ember/10 text-ember">
            <Lock className="size-6" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold">Certificates come with Pro</h1>
          <p className="mt-2 text-sm text-chalk">
            Keep learning on Free as long as you like — a certificate for the {path.name} path is
            part of Pro. Anything you earn while subscribed stays yours if you downgrade later.
          </p>
          <Button asChild className="mt-7">
            <Link to="/pricing">{trialUsed ? "See plans" : "Start your free trial"}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (credential !== "eligible") {
    // One heading and one paragraph per state, so the two can never drift into
    // a title that contradicts the explanation underneath it.
    const locked: Record<Exclude<CredentialState, "eligible">, { title: string; body: string }> = {
      "self-directed": {
        title: "This path doesn't carry a certificate",
        body: `The ${path.name} path is self-directed — the work happens in your own tools and nothing on it is marked. We'll only put our name to a credential we can actually check, so this path issues none. You're at ${completed} of ${live}, and it still builds your streak and XP.`,
      },
      unwritten: {
        title: "This path is still being written",
        body: `${live} of the ${total} lessons on the ${path.name} path are live so far. A certificate that says you completed a path we haven't finished writing wouldn't be worth anything, so this stays locked until the roadmap is complete. You're at ${completed} of ${live} live lessons.`,
      },
      "in-progress": {
        title: "Not yet — but close enough to see it",
        body: `The ${path.name} certificate unlocks when every lesson on the path is complete. You're at ${completed} of ${total}.`,
      },
    };
    const { title, body } = locked[credential];

    return (
      <AppShell>
        <div className="card-surface mx-auto max-w-xl p-10 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-chalk">
            <Lock className="size-6" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-chalk">{body}</p>
          <div className="mx-auto mt-6 h-2 max-w-sm overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-brand transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
          <Button asChild className="mt-7">
            <Link to="/paths/$pathId" params={{ pathId: path.id }}>
              Back to the roadmap
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const id = certificateId(user.id, path.id);
  const issued = formatCertificateDate(issuedRecord?.issued_at ?? pathCompletedAt(path, progress));
  const courseCount = pathCourses(path).length;

  function share() {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => toast.success("Certificate link copied"))
      .catch(() => toast.error("Could not copy the link"));
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            to="/paths/$pathId"
            params={{ pathId: path.id }}
            className="text-sm font-semibold text-chalk hover:text-foreground"
          >
            ← {path.name} roadmap
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={share}>
              <Share2 className="mr-1.5 size-3.5" /> Share
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 size-3.5" /> Print / save as PDF
            </Button>
          </div>
        </div>

        {/* The certificate itself */}
        <article className="mt-5 overflow-hidden rounded-[22px] bg-card p-1.5 shadow-lift print:shadow-none">
          <div className="rounded-[16px] border-2 border-brand/25 px-8 py-12 text-center sm:px-14 sm:py-16">
            <div className="flex justify-center">
              <Wordmark />
            </div>

            <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.25em] text-chalk">
              Certificate of completion
            </p>

            <p className="mt-8 text-sm text-chalk">This certifies that</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              {profile.display_name}
            </h1>

            <p className="mt-8 text-sm text-chalk">has completed the career path</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-brand sm:text-3xl">
              {path.name}
            </h2>

            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-chalk">
              {courseCount} courses and {live} hands-on lessons, including coding challenges,
              debugging exercises and portfolio projects assessed against published requirements.
            </p>

            <div className="mx-auto mt-10 flex max-w-xl flex-wrap justify-center gap-2">
              {path.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border"
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 sm:flex-row sm:text-left">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-chalk">
                  Issued
                </div>
                <div className="mt-0.5 font-semibold">{issued}</div>
              </div>
              <Award className="size-10 text-ember" />
              <div className="sm:text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-chalk">
                  Certificate ID
                </div>
                <div className="mt-0.5 font-mono text-sm font-semibold">{id}</div>
                <div className="mt-1 font-mono text-[10px] text-chalk">Verify at /verify/{id}</div>
              </div>
            </div>
          </div>
        </article>

        <div className="card-surface mt-5 flex flex-wrap items-center justify-between gap-4 p-5 print:hidden">
          <p className="max-w-lg text-sm text-chalk">
            Put the ID on your CV or LinkedIn. Anyone can check it at{" "}
            <span className="font-mono text-foreground">/verify/{id}</span> without an account — the
            answer comes from our issuing record, not from this page.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/verify/$certificateId" params={{ certificateId: id }}>
                <ShieldCheck className="mr-1.5 size-3.5" /> Verification page
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/profile/$userId" params={{ userId: user.id }}>
                <Download className="mr-1.5 size-3.5" /> Public profile
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
