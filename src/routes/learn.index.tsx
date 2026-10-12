import { seoHead } from "@/lib/seo";
import { useEffect, useMemo, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Clock, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  courses,
  courseLessons,
  careerPaths,
  unitWords,
  type SkillLevel,
} from "@/content/curriculum";
import {
  formatMinutes,
  liveChallengeCount,
  liveLessonCount,
  liveMinutes,
  isCoursePublished,
} from "@/content/lessons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/StatPill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/")({
  head: () =>
    seoHead({
      path: "/learn",
      title: "Interactive Coding, Data & AI Courses | Ascent",
      description:
        "Browse interactive courses in JavaScript, React, Python, SQL, data analytics, UX design and generative AI. Find courses by skill, level and career.",
    }),
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    q?: string;
    level?: SkillLevel | "All";
    career?: string;
    sort?: "recommended" | "written";
    availability?: "all" | "complete" | "live";
    duration?: "all" | "short" | "medium" | "long";
    focus?: boolean;
  } => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    level: levels.includes(search["level"] as SkillLevel) ? (search["level"] as SkillLevel) : "All",
    career: careerPaths.some((p) => p.id === search["career"]) ? String(search["career"]) : "all",
    sort: search["sort"] === "written" ? "written" : "recommended",
    availability:
      search["availability"] === "complete"
        ? "complete"
        : search["availability"] === "live"
          ? "live"
          : "all",
    duration:
      search["duration"] === "short"
        ? "short"
        : search["duration"] === "medium"
          ? "medium"
          : search["duration"] === "long"
            ? "long"
            : "all",
    focus: search["focus"] === true || search["focus"] === "true",
  }),
  component: Catalog,
});

// Only levels some course actually has: an Advanced chip that always returns
// nothing reads as a broken filter, not as a promise.
const allLevels: SkillLevel[] = ["Beginner", "Intermediate", "Advanced"];
const levels: (SkillLevel | "All")[] = [
  "All",
  ...allLevels.filter((l) => courses.some((c) => c.level === l)),
];
const sorts = [
  { id: "recommended", label: "Featured" },
  { id: "written", label: "Most lessons available" },
] as const;

function Catalog() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const query = search.q ?? "";
  const level = search.level ?? "All";
  const career = search.career ?? "all";
  const sort = search.sort ?? "recommended";
  const availability = search.availability ?? "all";
  const duration = search.duration ?? "all";
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (search.focus) input.current?.focus();
  }, [search.focus]);
  const update = (patch: Partial<typeof search>) =>
    void navigate({
      to: "/learn",
      search: { ...search, ...patch },
      replace: true,
      resetScroll: false,
    });
  const setQuery = (q: string) => update({ q });
  const setLevel = (value: typeof level) => update({ level: value });
  const setCareer = (value: string) => update({ career: value });
  const setSort = (value: typeof sort) => update({ sort: value });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = courses.filter((c) => {
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.skill.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q));
      const matchesLevel = level === "All" || c.level === level;
      const matchesCareer = career === "all" || c.careers.includes(career);
      const live = liveLessonCount(c);
      const available =
        availability === "all" || (availability === "complete" ? isCoursePublished(c) : live > 0);
      const minutes = liveMinutes(c);
      const matchesDuration =
        duration === "all" ||
        (live > 0 &&
          (duration === "short"
            ? minutes <= 120
            : duration === "medium"
              ? minutes > 120 && minutes <= 600
              : minutes > 600));
      return matchesQuery && matchesLevel && matchesCareer && available && matchesDuration;
    });
    list = [...list].sort((a, b) => {
      const written = liveLessonCount(b) - liveLessonCount(a);
      if (sort === "written") return written;
      return Number(b.recommended) - Number(a.recommended) || written;
    });
    return list;
  }, [query, level, career, sort, availability, duration]);

  return (
    <AppShell>
      <header className="max-w-2xl">
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {courses.length} courses. Every one of them makes you do the work.
        </h1>
        <p className="mt-2 text-chalk">
          Each course mixes short explanations with challenges you have to pass. No passive video
          marathons.
        </p>
      </header>

      <div className="card-surface mt-7 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-chalk" />
            <Input
              ref={input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a skill: React, SQL, Figma…"
              className="pl-9"
              aria-label="Search courses"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {levels.map((l) => (
              <button
                key={l}
                aria-pressed={level === l}
                onClick={() => setLevel(l)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
                  level === l
                    ? "bg-ink text-white"
                    : "bg-secondary text-chalk hover:text-foreground",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-chalk">
            <SlidersHorizontal className="size-3.5" /> Career
          </span>
          <button
            aria-pressed={career === "all"}
            onClick={() => setCareer("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              career === "all" ? "bg-brand/10 text-brand" : "text-chalk hover:text-foreground",
            )}
          >
            All
          </button>
          {careerPaths.map((p) => (
            <button
              key={p.id}
              aria-pressed={career === p.id}
              onClick={() => setCareer(p.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold",
                career === p.id ? "bg-brand/10 text-brand" : "text-chalk hover:text-foreground",
              )}
            >
              {p.name}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-2">
            {sorts.map((s) => (
              <button
                key={s.id}
                aria-pressed={sort === s.id}
                onClick={() => setSort(s.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  sort === s.id
                    ? "bg-secondary text-foreground"
                    : "text-chalk hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="text-sm font-semibold">
          Availability
          <select
            className="ml-2 rounded-lg border bg-card p-2"
            value={availability}
            onChange={(e) => update({ availability: e.target.value as typeof availability })}
          >
            <option value="all">All roadmaps</option>
            <option value="live">Has live lessons</option>
            <option value="complete">Fully available</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Available lesson time
          <select
            className="ml-2 rounded-lg border bg-card p-2"
            value={duration}
            onChange={(e) => update({ duration: e.target.value as typeof duration })}
          >
            <option value="all">Any duration</option>
            <option value="short">Up to 2 hours</option>
            <option value="medium">2–10 hours</option>
            <option value="long">Over 10 hours</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-sm text-chalk">
        Featured courses are editorial picks. Free includes the first module; later modules require
        Pro.
      </p>
      <p role="status" className="mt-5 text-sm text-chalk">
        {results.length} course{results.length === 1 ? "" : "s"}
      </p>

      {results.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Search className="size-5" />}
            title="Nothing matches that yet"
            description="Try a broader search term, or clear the level and career filters."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  update({
                    q: "",
                    level: "All",
                    career: "all",
                    availability: "all",
                    duration: "all",
                  });
                }}
              >
                Clear filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((c) => (
            <Link
              key={c.id}
              to="/courses/$courseId"
              params={{ courseId: c.id }}
              className="card-surface group flex flex-col p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-chalk">
                  {c.level}
                </span>
                {c.recommended ? (
                  <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-bold text-brand">
                    Featured
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-xs font-semibold text-chalk">
                {isCoursePublished(c)
                  ? "Fully available"
                  : liveLessonCount(c) > 0
                    ? "Partially available"
                    : "Coming soon"}{" "}
                · Free first module
              </p>
              <h2 className="mt-4 font-display text-lg font-bold group-hover:text-brand">
                {c.title}
              </h2>
              <p className="mt-1.5 flex-1 text-sm text-chalk">{c.summary}</p>
              <div className="mt-5 flex items-center gap-4 text-xs font-semibold text-chalk">
                {liveLessonCount(c) ? (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" /> {formatMinutes(liveMinutes(c))}
                  </span>
                ) : null}
                <span>
                  {liveLessonCount(c)} of {courseLessons(c).length} {unitWords(c).plural} live
                </span>
                {liveChallengeCount(c) ? <span>{liveChallengeCount(c)} challenges</span> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
