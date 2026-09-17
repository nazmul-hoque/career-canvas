import { createFileRoute } from "@tanstack/react-router";
import { Flame, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { leaderboardSeed } from "@/content/community";
import { useLeaderboard, useProfile } from "@/hooks/useLearner";
import { levelTitle } from "@/content/gamification";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Ascent" },
      { name: "description", content: "See who's climbing fastest this season: XP, levels and streaks across the Ascent community." },
      { property: "og:title", content: "Leaderboard — Ascent" },
      { property: "og:description", content: "XP, levels and streaks across the Ascent community." },
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
  isYou?: boolean;
}

function Leaderboard() {
  const { data: live = [] } = useLeaderboard();
  const { data: profile } = useProfile();

  const rows: Row[] = [
    ...leaderboardSeed.map((e, i) => ({ id: `seed-${i}`, ...e })),
    ...live.map((p) => ({
      id: p.id,
      name: p.display_name,
      initials: p.display_name.slice(0, 2).toUpperCase(),
      xp: p.xp,
      level: p.level,
      streak: p.streak_current,
      path: p.career_path ?? "Exploring",
      isYou: profile ? p.id === profile.id : false,
    })),
  ]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 30);

  return (
    <AppShell>
      <header className="max-w-2xl">
        <p className="eyebrow">Leaderboard</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">This season's climbers</h1>
        <p className="mt-3 text-chalk">Ranked by XP earned. Consistency beats intensity — streaks are the real story.</p>
      </header>

      <div className="card-surface mt-8 overflow-hidden">
        <ul className="divide-y divide-border">
          {rows.map((row, i) => (
            <li
              key={row.id}
              className={cn(
                "flex items-center gap-4 px-5 py-4",
                row.isYou && "bg-brand/5",
              )}
            >
              <span
                className={cn(
                  "w-8 shrink-0 font-display text-lg font-bold",
                  i === 0 ? "text-ember" : i < 3 ? "text-brand" : "text-chalk",
                )}
              >
                {i + 1}
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-display text-xs font-bold text-white">
                {row.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">
                  {row.name}
                  {row.isYou ? <span className="ml-2 text-xs font-semibold text-brand">You</span> : null}
                </span>
                <span className="block truncate text-xs text-chalk">
                  Level {row.level} · {levelTitle(row.level)} · {row.path}
                </span>
              </span>
              <span className="hidden items-center gap-1.5 text-sm font-semibold text-ember sm:flex">
                <Flame className="size-4" /> {row.streak}
              </span>
              <span className="w-24 shrink-0 text-right font-display text-sm font-bold">
                {row.xp.toLocaleString()} XP
              </span>
              {i === 0 ? <Trophy className="size-4 shrink-0 text-ember" /> : null}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
