import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Zap, Award, Layers } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useProfile, useProgress, useAchievements, useSubmissions } from "@/hooks/useLearner";
import { useSession } from "@/hooks/useAuth";
import { achievements, levelFromXp, levelTitle } from "@/content/gamification";
import { courses, courseById, courseLessons, pathById } from "@/content/curriculum";
import { projectById } from "@/content/projects";
import { AchievementIcon } from "@/components/common/AchievementIcon";
import { ProgressRing } from "@/components/common/ProgressRing";
import { EmptyState } from "@/components/common/StatPill";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Ascent" },
      { name: "description", content: "Your XP, streak, completed courses, achievements and portfolio projects in one place." },
      { property: "og:title", content: "Your profile — Ascent" },
      { property: "og:description", content: "XP, streak, achievements and portfolio projects." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isLoading } = useSession();
  const { data: profile } = useProfile();
  const { data: progress = [] } = useProgress();
  const { data: earned = [] } = useAchievements();
  const { data: submissions = [] } = useSubmissions();

  if (!isLoading && !user) {
    return (
      <AppShell>
        <div className="card-surface mx-auto max-w-md p-10 text-center">
          <h1 className="font-display text-2xl font-bold">Sign in to see your profile</h1>
          <Button asChild className="mt-6">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const xp = profile?.xp ?? 0;
  const { level, percent } = levelFromXp(xp);
  const done = new Set(progress.map((p) => p.lesson_id));
  const earnedKeys = new Set(earned.map((e) => e.achievement_key));
  const path = profile?.career_path ? pathById(profile.career_path) : undefined;

  const completedCourses = courses.filter((c) => {
    const lessons = courseLessons(c);
    return lessons.length > 0 && lessons.every((l) => done.has(l.id));
  });
  const inProgress = courses.filter((c) => {
    const lessons = courseLessons(c);
    const n = lessons.filter((l) => done.has(l.id)).length;
    return n > 0 && n < lessons.length;
  });

  return (
    <AppShell>
      <section className="card-surface flex flex-wrap items-center gap-6 p-6 sm:p-8">
        <span className="grid size-20 shrink-0 place-items-center rounded-full bg-ink font-display text-2xl font-bold text-white">
          {(profile?.display_name ?? "A").slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{profile?.display_name ?? "Learner"}</h1>
          <p className="mt-1 text-sm text-chalk">
            Level {level} · {levelTitle(level)}
            {path ? ` · ${path.name}` : ""}
          </p>
          {profile?.bio ? <p className="mt-2 max-w-xl text-sm text-chalk">{profile.bio}</p> : null}
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            <span className="flex items-center gap-1.5">
              <Zap className="size-4 text-brand" /> {xp.toLocaleString()} XP
            </span>
            <span className="flex items-center gap-1.5">
              <Flame className="size-4 text-ember" /> {profile?.streak_current ?? 0} day streak
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="size-4 text-chalk" /> {progress.length} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="size-4 text-chalk" /> {earned.length} achievements
            </span>
          </div>
        </div>
        <ProgressRing percent={percent} size={96} label={`L${level}`} sublabel="level" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card-surface p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold">Courses</h2>
            {completedCourses.length === 0 && inProgress.length === 0 ? (
              <EmptyState
                title="No courses started yet"
                body="Pick something from the catalog and your progress will show up here."
              />
            ) : (
              <div className="mt-5 space-y-3">
                {[...inProgress, ...completedCourses].map((c) => {
                  const lessons = courseLessons(c);
                  const n = lessons.filter((l) => done.has(l.id)).length;
                  const pct = Math.round((n / lessons.length) * 100);
                  return (
                    <Link
                      key={c.id}
                      to="/courses/$courseId"
                      params={{ courseId: c.id }}
                      className="block rounded-[14px] border border-border p-4 transition-colors hover:border-brand"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{c.title}</span>
                        <span className="text-xs font-semibold text-chalk">{pct}%</span>
                      </div>
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line">
                        <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card-surface p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold">Portfolio</h2>
            {submissions.length === 0 ? (
              <EmptyState
                title="No projects submitted"
                body="Finished projects and their reviews appear here for anyone you share your profile with."
              />
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {submissions.map((s) => {
                  const project = projectById(s.project_id);
                  return (
                    <Link
                      key={s.id}
                      to="/projects/$projectId"
                      params={{ projectId: s.project_id }}
                      className="rounded-[14px] border border-border p-4 transition-colors hover:border-brand"
                    >
                      <span className="block font-semibold">{project?.title ?? s.project_id}</span>
                      <span className="mt-1 block text-xs font-semibold text-brand">{s.status}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card-surface p-6">
            <p className="eyebrow">Achievements</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {achievements.map((a) => {
                const has = earnedKeys.has(a.key);
                return (
                  <div
                    key={a.key}
                    className={cn(
                      "rounded-[14px] border p-3 text-center",
                      has ? "border-brand/30 bg-brand/5" : "border-border opacity-50",
                    )}
                  >
                    <AchievementIcon
                      name={a.icon}
                      className={cn("mx-auto size-5", has ? "text-brand" : "text-chalk")}
                    />
                    <span className="mt-2 block text-xs font-bold leading-tight">{a.name}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {path ? (
            <section className="card-surface p-6">
              <p className="eyebrow">Career path</p>
              <p className="mt-2 font-display text-lg font-bold">{path.name}</p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link to="/paths/$pathId" params={{ pathId: path.id }}>
                  View roadmap
                </Link>
              </Button>
            </section>
          ) : null}

          <section className="card-surface p-6">
            <p className="eyebrow">Statistics</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-chalk">Best streak</dt>
                <dd className="font-semibold">{profile?.streak_best ?? 0} days</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-chalk">Lessons completed</dt>
                <dd className="font-semibold">{progress.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-chalk">Courses finished</dt>
                <dd className="font-semibold">{completedCourses.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-chalk">Plan</dt>
                <dd className="font-semibold capitalize">{profile?.plan ?? "free"}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

void courseById;
