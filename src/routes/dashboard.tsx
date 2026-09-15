import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Flame,
  Zap,
  Trophy,
  ArrowRight,
  Target,
  CalendarCheck,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressRing } from "@/components/common/ProgressRing";
import { AchievementIcon } from "@/components/common/AchievementIcon";
import { EmptyState } from "@/components/common/StatPill";
import { useSession } from "@/hooks/useAuth";
import { useAchievements, useActivity, useProfile, useProgress, useLeaderboard } from "@/hooks/useLearner";
import {
  careerPaths,
  courseById,
  courseLessons,
  courses,
  pathById,
} from "@/content/curriculum";
import { achievements, DAILY_XP_GOAL, levelFromXp, levelTitle, WEEKLY_XP_GOAL } from "@/content/gamification";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your learning dashboard — Ascent" },
      {
        name: "description",
        content:
          "Your streak, XP, next lesson and weekly progress in one view. Pick up your roadmap exactly where you stopped.",
      },
      { property: "og:title", content: "Your learning dashboard — Ascent" },
      { property: "og:description", content: "Streak, XP, next lesson and weekly progress in one view." },
    ],
  }),
  component: Dashboard,
});

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function lastSevenDays() {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function Dashboard() {
  const { user, isLoading } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: progress = [] } = useProgress();
  const { data: activity = [] } = useActivity();
  const { data: earned = [] } = useAchievements();
  const { data: board = [] } = useLeaderboard();

  if (isLoading || (user && profileLoading)) {
    return (
      <AppShell>
        <div className="grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={cn("h-48 rounded-[18px]", i === 0 && "lg:col-span-2 h-64")} />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title="Sign in to see your dashboard"
          description="Your streak, XP and roadmap live in your account. Creating one takes about twenty seconds."
          action={
            <Button asChild className="mt-2">
              <Link to="/auth">Create a free account</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const xp = profile?.xp ?? 0;
  const { level, intoLevel: into, needed: span } = levelFromXp(xp);
  const path = pathById(profile?.career_path ?? "frontend") ?? careerPaths[0]!;
  const pathCourseList = path.courseIds.map(courseById).filter(Boolean) as ReturnType<typeof courseById>[];
  const totalLessons = pathCourseList.reduce((n, c) => n + (c ? courseLessons(c).length : 0), 0);
  const doneIds = new Set(progress.map((p) => p.lesson_id));
  const doneInPath = pathCourseList.reduce(
    (n, c) => n + (c ? courseLessons(c).filter((l) => doneIds.has(l.id)).length : 0),
    0,
  );
  const pathPercent = totalLessons ? (doneInPath / totalLessons) * 100 : 0;

  // next lesson = first incomplete lesson in the path
  let nextCourseId: string | null = null;
  let nextLesson: { id: string; title: string; minutes: number; type: string } | null = null;
  for (const c of pathCourseList) {
    if (!c) continue;
    const lesson = courseLessons(c).find((l) => !doneIds.has(l.id));
    if (lesson) {
      nextCourseId = c.id;
      nextLesson = lesson;
      break;
    }
  }

  const upcoming = nextCourseId
    ? courseLessons(courseById(nextCourseId)!)
        .filter((l) => !doneIds.has(l.id))
        .slice(1, 5)
    : [];

  const byDay = new Map(activity.map((a) => [a.day, a.xp]));
  const week = lastSevenDays().map((d, i) => ({
    day: dayLabels[(new Date(d).getDay() + 6) % 7] ?? dayLabels[i]!,
    xp: byDay.get(d) ?? 0,
  }));
  const weekXp = week.reduce((n, d) => n + d.xp, 0);
  const todayXp = week[6]?.xp ?? 0;
  const maxDay = Math.max(50, ...week.map((d) => d.xp));

  const rank = board.findIndex((r) => r.id === user.id);
  const earnedKeys = earned.map((e) => e.achievement_key);
  const recentAchievements = earned
    .map((e) => achievements.find((a) => a.key === e.achievement_key))
    .filter(Boolean)
    .slice(0, 3);

  const recommended = courses
    .filter((c) => c.careers.includes(path.id) && !doneIds.has(courseLessons(c)[0]?.id ?? ""))
    .slice(0, 3);

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{levelTitle(level)} · Level {level}</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {greeting()}, {profile?.display_name?.split(" ")[0] ?? "learner"}.
          </h1>
          <p className="mt-1.5 text-chalk">
            {todayXp >= DAILY_XP_GOAL
              ? "Daily goal already cleared. Anything else today is a bonus."
              : `${DAILY_XP_GOAL - todayXp} XP left to keep your streak alive today.`}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-ember/10 px-4 py-2 font-display text-sm font-bold text-ember">
            <Flame className="size-4" /> {profile?.streak_current ?? 0} day streak
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 font-display text-sm font-bold text-brand">
            <Zap className="size-4" /> {xp.toLocaleString()} XP
          </span>
        </div>
      </header>

      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        {/* Continue learning */}
        <section className="ink-surface diagonals relative overflow-hidden rounded-[18px] p-7 text-white lg:col-span-2">
          <p className="eyebrow text-white/60">Continue where you stopped</p>
          {nextLesson && nextCourseId ? (
            <>
              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{nextLesson.title}</h2>
              <p className="mt-1.5 text-sm text-white/70">
                {courseById(nextCourseId)?.title} · {nextLesson.minutes} min · {nextLesson.type}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/learn/$courseId/$lessonId" params={{ courseId: nextCourseId, lessonId: nextLesson.id }}>
                    Resume lesson <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Link
                  to="/paths/$pathId"
                  params={{ pathId: path.id }}
                  className="text-sm font-semibold text-white/80 underline-offset-4 hover:underline"
                >
                  View {path.name} roadmap
                </Link>
              </div>
              <div className="mt-7 flex items-center gap-4">
                <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-700"
                    style={{ width: `${pathPercent}%` }}
                  />
                </div>
                <span className="font-display text-sm font-bold">
                  {doneInPath}/{totalLessons} lessons
                </span>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 font-display text-2xl font-bold">Path complete. Genuinely.</h2>
              <p className="mt-1.5 text-sm text-white/70">
                Every lesson in {path.name} is done. Claim your certificate or start a second path.
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-6">
                <Link to="/certificate/$pathId" params={{ pathId: path.id }}>
                  View certificate
                </Link>
              </Button>
            </>
          )}
        </section>

        {/* Level ring */}
        <section className="card-surface flex flex-col items-center justify-center p-7">
          <ProgressRing
            percent={(into / span) * 100}
            size={168}
            label={`L${level}`}
            sublabel={`${into}/${span} XP`}
          />
          <p className="mt-4 text-center text-sm font-semibold text-foreground">{levelTitle(level)}</p>
          <p className="text-center text-xs text-chalk">{span - into} XP to level {level + 1}</p>
        </section>

        {/* Today's task */}
        <section className="card-surface p-6">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-brand" />
            <p className="eyebrow">Today's recommended task</p>
          </div>
          {nextLesson && nextCourseId ? (
            <>
              <h3 className="mt-3 font-display text-lg font-semibold">{nextLesson.title}</h3>
              <p className="mt-1 text-sm text-chalk">
                A {nextLesson.minutes}-minute {nextLesson.type} block — enough to hold the streak on a busy day.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link to="/learn/$courseId/$lessonId" params={{ courseId: nextCourseId, lessonId: nextLesson.id }}>
                  Start now
                </Link>
              </Button>
            </>
          ) : (
            <p className="mt-3 text-sm text-chalk">Nothing queued. Pick a new course from the catalog.</p>
          )}
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-chalk">
              <span>Daily goal</span>
              <span>
                {todayXp}/{DAILY_XP_GOAL} XP
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-brand transition-all duration-700"
                style={{ width: `${Math.min(100, (todayXp / DAILY_XP_GOAL) * 100)}%` }}
              />
            </div>
          </div>
        </section>

        {/* Weekly activity */}
        <section className="card-surface p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="size-4 text-brand" />
              <p className="eyebrow">This week</p>
            </div>
            <span className="font-display text-sm font-bold">
              {weekXp}/{WEEKLY_XP_GOAL} XP
            </span>
          </div>
          <div className="mt-6 flex h-32 items-end gap-2">
            {week.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all duration-700",
                      d.xp > 0 ? "bg-brand" : "bg-line",
                    )}
                    style={{ height: `${Math.max(4, (d.xp / maxDay) * 100)}%` }}
                    title={`${d.xp} XP`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-chalk">{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Achievements + rank */}
        <section className="card-surface p-6">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-ember" />
            <p className="eyebrow">Recent achievements</p>
          </div>
          {recentAchievements.length ? (
            <ul className="mt-4 space-y-3">
              {recentAchievements.map((a) => (
                <li key={a!.key} className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-ember/10 text-ember">
                    <AchievementIcon icon={a!.icon} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{a!.name}</span>
                    <span className="block text-xs text-chalk">{a!.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-chalk">
              Nothing yet. Finishing one lesson unlocks your first badge — it takes about ten minutes.
            </p>
          )}
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-chalk">Leaderboard position</span>
            <Link to="/leaderboard" className="font-display text-sm font-bold text-brand hover:underline">
              {rank >= 0 ? `#${rank + 1}` : "Unranked"}
            </Link>
          </div>
          <p className="mt-2 text-xs text-chalk">
            {earnedKeys.length} of {achievements.length} badges earned
          </p>
        </section>

        {/* Upcoming lessons */}
        <section className="card-surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-brand" />
              <p className="eyebrow">Upcoming in {nextCourseId ? courseById(nextCourseId)?.title : path.name}</p>
            </div>
            <Link to="/learn" className="text-sm font-semibold text-brand hover:underline">
              Browse catalog
            </Link>
          </div>
          {upcoming.length ? (
            <ul className="mt-4 divide-y divide-border">
              {upcoming.map((l) => (
                <li key={l.id}>
                  <Link
                    to="/learn/$courseId/$lessonId"
                    params={{ courseId: nextCourseId!, lessonId: l.id }}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-brand"
                  >
                    <span className="text-sm font-semibold">{l.title}</span>
                    <span className="shrink-0 text-xs text-chalk">
                      {l.type} · {l.minutes} min
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-chalk">Course finished — choose your next one from the catalog.</p>
          )}
        </section>

        {/* Recommended */}
        <section className="card-surface p-6">
          <p className="eyebrow">Recommended for {path.name}</p>
          <ul className="mt-4 space-y-3">
            {recommended.map((c) => (
              <li key={c.id}>
                <Link
                  to="/courses/$courseId"
                  params={{ courseId: c.id }}
                  className="block rounded-xl border border-border p-3 transition-all hover:-translate-y-0.5 hover:border-brand/40"
                >
                  <span className="block text-sm font-semibold">{c.title}</span>
                  <span className="block text-xs text-chalk">
                    {c.level} · {c.hours}h · ★ {c.rating}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
