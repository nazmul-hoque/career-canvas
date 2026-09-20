import { AuthLink } from "@/components/common/AuthLink";
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Flame, Medal, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatPill } from "@/components/common/StatPill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useAuth";
import { useLeaderboard, useProfile } from "@/hooks/useLearner";
import { levelTitle } from "@/content/gamification";
import { leaderboardSeed } from "@/content/community";
import { pathById } from "@/content/curriculum";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Ascent" },
      {
        name: "description",
        content:
          "Where you stand this week: XP, level and streak across every learner on Ascent. Ranked by experience earned.",
      },
      { property: "og:title", content: "Leaderboard — Ascent" },
      {
        property: "og:description",
        content: "XP, level and streak rankings across every learner.",
      },
    ],
  }),
  component: Leaderboard,
});

interface Row {
  id: string;
  name: string;
  initials: string;
  xp: number;
  level: number;
  streak: number;
  path: string;
  live: boolean;
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

/** Anything not backed by a real account says so, everywhere it appears. */
function SampleBadge() {
  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-chalk ring-1 ring-border">
      Sample
    </span>
  );
}

function Leaderboard() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { data: live = [], isLoading } = useLeaderboard();
  const [scope, setScope] = useState<"all" | "path">("all");
  // Seeded example learners make an empty board look alive, but ranking real
  // people against fictional ones is a lie the moment there are real people.
  // They are labelled wherever they appear, excluded from your rank, and hidden
  // by default as soon as the board can stand on its own.
  const [showSamples, setShowSamples] = useState(true);
  const enoughRealLearners = live.length >= 8;
  const samplesVisible = showSamples && !enoughRealLearners;

  const rows = useMemo<Row[]>(() => {
    const liveRows: Row[] = (
      live as {
        id: string;
        display_name: string;
        xp: number;
        level: number;
        streak_current: number;
        career_path: string | null;
      }[]
    ).map((r) => ({
      id: r.id,
      name: r.display_name,
      initials: initialsOf(r.display_name),
      xp: r.xp,
      level: r.level,
      streak: r.streak_current,
      path: r.career_path ? (pathById(r.career_path)?.name ?? "—") : "—",
      live: true,
    }));

    const seedRows: Row[] = leaderboardSeed.map((r) => ({
      id: `seed-${r.name}`,
      name: r.name,
      initials: r.initials,
      xp: r.xp,
      level: r.level,
      streak: r.streak,
      path: r.path,
      live: false,
    }));

    const merged = [...liveRows, ...(samplesVisible ? seedRows : [])].sort((a, b) => b.xp - a.xp);
    if (scope === "all") return merged;
    const myPath = profile?.career_path ? pathById(profile.career_path)?.name : null;
    if (!myPath) return merged;
    return merged.filter((r) => r.path === myPath);
  }, [live, profile?.career_path, scope, samplesVisible]);

  // Your rank is against real learners only — a sample row must never push a
  // real person down a place.
  const myRank = rows.filter((r) => r.live).findIndex((r) => r.id === user?.id);
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Leaderboard</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ranked by work done, not time spent.
          </h1>
          <p className="mt-2 text-chalk">
            XP comes from finished lessons and passed challenges, and it is written by the server
            against the lesson you finished — there is no way to farm it from a console.
          </p>
          {samplesVisible ? (
            <p className="mt-2 text-sm text-chalk">
              While the board fills up it includes {leaderboardSeed.length} sample learners, marked{" "}
              <span className="font-semibold text-foreground">Sample</span>. They never affect your
              rank, and they disappear once eight real learners are ranked.{" "}
              <button
                onClick={() => setShowSamples(false)}
                className="font-semibold text-brand hover:underline"
              >
                Hide them now
              </button>
            </p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setScope("all")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              scope === "all"
                ? "bg-brand text-brand-foreground"
                : "bg-card text-chalk ring-1 ring-border hover:text-foreground",
            )}
          >
            Everyone
          </button>
          <button
            onClick={() => setScope("path")}
            disabled={!profile?.career_path}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40",
              scope === "path"
                ? "bg-brand text-brand-foreground"
                : "bg-card text-chalk ring-1 ring-border hover:text-foreground",
            )}
          >
            My path
          </button>
        </div>
      </header>

      {/* Your standing */}
      {user && profile ? (
        <div className="ink-surface diagonals mt-7 flex flex-wrap items-center justify-between gap-6 rounded-[22px] px-6 py-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 border-2 border-white/20">
              <AvatarFallback className="bg-white/10 text-sm font-bold text-white">
                {initialsOf(profile.display_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-display text-xl font-bold text-white">
                {profile.display_name}
              </div>
              <div className="text-sm text-white/60">
                Level {profile.level} · {levelTitle(profile.level)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                Rank
              </div>
              <div className="font-display text-2xl font-bold text-white">
                {myRank >= 0 ? `#${myRank + 1}` : "—"}
              </div>
            </div>
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
      ) : null}

      {isLoading && rows.length === 0 ? (
        <div className="mt-7 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {podium.map((row, i) => (
              <div
                key={row.id}
                className={cn(
                  "card-surface flex flex-col items-center p-6 text-center",
                  i === 0 && "sm:order-2 sm:scale-105 ring-2 ring-ember/40",
                  i === 1 && "sm:order-1",
                  i === 2 && "sm:order-3",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-full",
                    i === 0 && "bg-ember/15 text-ember",
                    i === 1 && "bg-secondary text-chalk",
                    i === 2 && "bg-secondary text-chalk",
                  )}
                >
                  {i === 0 ? <Crown className="size-4" /> : <Medal className="size-4" />}
                </span>
                <Avatar className="mt-3 size-16 border border-border">
                  <AvatarFallback className="bg-ink text-sm font-bold text-white">
                    {row.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-3 flex items-center gap-2 font-display text-lg font-bold">
                  {row.name}
                  {row.live ? null : <SampleBadge />}
                </div>
                <div className="text-xs text-chalk">{row.path}</div>
                <div className="mt-3 flex items-center gap-3 text-sm font-bold">
                  <span className="inline-flex items-center gap-1 text-brand">
                    <Zap className="size-3.5" /> {row.xp.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-ember">
                    <Flame className="size-3.5" /> {row.streak}
                  </span>
                </div>
                <StatPill className="mt-3">Level {row.level}</StatPill>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card-surface mt-5 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-chalk">
                    #
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-chalk">
                    Learner
                  </th>
                  <th className="hidden px-5 py-3 text-xs font-semibold uppercase tracking-wider text-chalk md:table-cell">
                    Path
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-chalk">
                    XP
                  </th>
                  <th className="hidden px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-chalk sm:table-cell">
                    Streak
                  </th>
                </tr>
              </thead>
              <tbody>
                {rest.map((row, i) => {
                  const isMe = row.id === user?.id;
                  return (
                    <tr
                      key={row.id}
                      className={cn("border-b border-border last:border-0", isMe && "bg-brand/8")}
                    >
                      <td className="px-5 py-3.5 font-mono text-sm font-bold text-chalk">
                        {i + 4}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 border border-border">
                            <AvatarFallback className="bg-ink text-[10px] font-bold text-white">
                              {row.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              {row.name}
                              {isMe ? <span className="text-xs text-brand">You</span> : null}
                              {row.live ? null : <SampleBadge />}
                            </div>
                            <div className="text-xs text-chalk">
                              Level {row.level} · {levelTitle(row.level)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-3.5 text-sm text-chalk md:table-cell">
                        {row.path}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-bold text-brand">
                        {row.xp.toLocaleString()}
                      </td>
                      <td className="hidden px-5 py-3.5 text-right text-sm font-bold text-ember sm:table-cell">
                        {row.streak}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!user ? (
        <div className="card-surface mt-5 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="inline-flex items-center gap-2 text-sm text-chalk">
            <Trophy className="size-4 text-ember" />
            Create an account to appear here and start earning XP.
          </p>
          <AuthLink
            mode="signup"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Start free
          </AuthLink>
        </div>
      ) : null}
    </AppShell>
  );
}
