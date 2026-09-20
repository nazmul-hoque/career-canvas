import { QueryError } from "@/components/common/QueryError";
import { useSession } from "@/hooks/useAuth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, BookCheck, Flame, FolderGit2, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatPill, EmptyState } from "@/components/common/StatPill";
import { AchievementIcon } from "@/components/common/AchievementIcon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAchievements } from "@/hooks/useLearner";
import { achievements, levelFromXp, levelTitle } from "@/content/gamification";
import { pathById } from "@/content/curriculum";
import { projectById } from "@/content/projects";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile/$userId")({
  head: () => ({
    meta: [
      { title: "Learner profile — Ascent" },
      {
        name: "description",
        content:
          "A public learner profile: level, streak, achievements and shipped portfolio projects.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { preview?: boolean } => ({
    preview: search["preview"] === true || search["preview"] === "true",
  }),
  component: PublicProfile,
});

interface PublicProfileRow {
  id: string;
  display_name: string;
  bio: string | null;
  career_path: string | null;
  xp: number;
  level: number;
  streak_current: number;
  streak_best: number;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PublicProfile() {
  const { userId } = Route.useParams();
  const { user, isLoading: sessionLoading } = useSession();
  const { preview: requestedPreview } = Route.useSearch();
  const preview = requestedPreview && user?.id === userId;

  const profileQuery = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async (): Promise<PublicProfileRow | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, bio, career_path, xp, level, streak_current, streak_best")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as PublicProfileRow) ?? null;
    },
  });

  const { data: profile, isLoading } = profileQuery;
  const projectsQuery = useQuery({
    queryKey: ["public-submissions", userId, preview ? user?.id : "public"],
    enabled: !sessionLoading,
    queryFn: async () => {
      const columns = "project_id, status, live_url, repo_url, public_summary, is_published";
      const query = preview
        ? supabase.from("project_submissions").select(columns)
        : supabase.from("public_portfolio_projects").select(columns);
      const { data, error } = await query.eq("user_id", userId);
      if (error) throw error;
      return (data ?? []) as {
        public_summary: string;
        is_published: boolean;
        project_id: string;
        status: string;
        live_url: string | null;
        repo_url: string | null;
      }[];
    },
  });

  const { data: submissions = [] } = projectsQuery;
  const achievementsQuery = useAchievements(userId);
  const { data: earned = [] } = achievementsQuery;
  const failedQueries = [profileQuery, projectsQuery, achievementsQuery].filter((q) => q.isError);
  if (failedQueries.length)
    return (
      <AppShell>
        <QueryError
          title="This portfolio could not be loaded"
          retry={() => Promise.all(failedQueries.map((q) => q.refetch()))}
        />
      </AppShell>
    );

  if (isLoading || sessionLoading || projectsQuery.isLoading || achievementsQuery.isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-44 w-full rounded-[22px]" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <EmptyState
          icon={<FolderGit2 className="size-5" />}
          title="No learner here"
          description="That profile doesn't exist, or the link is out of date."
          action={
            <Button asChild size="sm" className="mt-2">
              <Link to="/leaderboard">See the leaderboard</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const level = levelFromXp(profile.xp);
  const path = profile.career_path ? pathById(profile.career_path) : null;
  const earnedKeys = new Set(earned.map((e) => e.achievement_key));
  const shipped = submissions
    .map((s) => ({ ...s, project: projectById(s.project_id) }))
    .filter((s) => s.project);

  return (
    <AppShell>
      {preview ? (
        <p role="status" className="mb-5 rounded-xl bg-ember/10 p-4">
          Private preview: includes unpublished drafts. Visitors see only projects you publish. Your
          name, bio, learning stats, and achievements are public.{" "}
          <Link
            to="/profile/$userId"
            params={{ userId }}
            search={{ preview: false }}
            className="underline"
          >
            View published portfolio
          </Link>
        </p>
      ) : null}
      <section className="ink-surface diagonals overflow-hidden rounded-[22px] px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <Avatar className="size-20 border-2 border-white/20">
              <AvatarFallback className="bg-white/10 text-xl font-bold text-white">
                {initialsOf(profile.display_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white">
                {profile.display_name}
              </h1>
              <p className="mt-1 text-sm font-semibold text-brand">
                Level {level.level} · {levelTitle(level.level)}
                {path ? ` · ${path.name}` : ""}
              </p>
              {profile.bio ? (
                <p className="mt-3 max-w-xl leading-relaxed text-white/70">{profile.bio}</p>
              ) : null}
            </div>
          </div>

          <div className="flex gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                XP
              </div>
              <div className="font-display text-2xl font-bold text-brand">
                {profile.xp.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                Streak
              </div>
              <div className="font-display text-2xl font-bold text-ember">
                {profile.streak_current}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <FolderGit2 className="size-4 text-brand" /> Portfolio projects
          </h2>
          {shipped.length === 0 ? (
            <p className="mt-3 text-sm text-chalk">Nothing published yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {shipped.map((s) => (
                <div key={s.project_id} className="card-surface overflow-hidden">
                  <div
                    className={cn(
                      "holdmark h-20",
                      s.project!.accent === "brand" && "bg-brand",
                      s.project!.accent === "ember" && "bg-ember",
                      s.project!.accent === "ink" && "bg-ink",
                    )}
                  />
                  <div className="p-4">
                    <div className="font-display font-bold leading-snug">{s.project!.title}</div>
                    <p className="mt-1 text-sm text-chalk">{s.project!.tagline}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm">
                      {s.public_summary || "Add a case study before publishing."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <StatPill tone={s.status === "approved" ? "brand" : "neutral"}>
                        {s.is_published ? "Published by learner" : "Private draft"}
                      </StatPill>
                      {s.live_url ? (
                        <a
                          href={s.live_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs font-semibold text-brand hover:underline"
                        >
                          Live
                        </a>
                      ) : null}
                      {s.repo_url ? (
                        <a
                          href={s.repo_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs font-semibold text-brand hover:underline"
                        >
                          Code
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Award className="size-4 text-ember" /> Achievements
            </h2>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {achievements.map((a) => {
                const has = earnedKeys.has(a.key);
                return (
                  <span
                    key={a.key}
                    title={`${a.name} — ${a.description}`}
                    className={cn(
                      "grid aspect-square place-items-center rounded-xl",
                      has ? "bg-brand/12 text-brand" : "bg-secondary text-chalk opacity-40",
                    )}
                  >
                    <AchievementIcon icon={a.icon} />
                  </span>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-chalk">
              {earnedKeys.size} of {achievements.length} unlocked
            </p>
          </section>

          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <BookCheck className="size-4 text-brand" /> Stats
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-chalk">
                  <Zap className="size-3.5" /> Total XP
                </dt>
                <dd className="font-bold text-brand">{profile.xp.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-chalk">
                  <Flame className="size-3.5" /> Best streak
                </dt>
                <dd className="font-bold text-ember">{profile.streak_best} days</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-chalk">Published projects</dt>
                <dd className="font-bold">{shipped.length}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
