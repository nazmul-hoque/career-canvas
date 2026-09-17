import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Star, Clock, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  courses,
  courseLessons,
  courseTaskCount,
  careerPaths,
  type SkillLevel,
} from "@/content/curriculum";
import { liveLessonCount } from "@/content/lessons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/StatPill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/")({
  head: () => ({
    meta: [
      { title: "Course catalog — Ascent" },
      {
        name: "description",
        content:
          "Browse interactive courses in JavaScript, React, Python, SQL, data analytics, UX design and generative AI. Filter by skill, level and career.",
      },
      { property: "og:title", content: "Course catalog — Ascent" },
      {
        property: "og:description",
        content:
          "Interactive, practice-first courses across engineering, data, design and product.",
      },
    ],
  }),
  component: Catalog,
});

const levels: (SkillLevel | "All")[] = ["All", "Beginner", "Intermediate", "Advanced"];
const sorts = [
  { id: "recommended", label: "Recommended" },
  { id: "popular", label: "Most popular" },
  { id: "short", label: "Shortest first" },
  { id: "rating", label: "Highest rated" },
] as const;

function Catalog() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<(typeof levels)[number]>("All");
  const [career, setCareer] = useState<string>("all");
  const [sort, setSort] = useState<(typeof sorts)[number]["id"]>("recommended");

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
      return matchesQuery && matchesLevel && matchesCareer;
    });
    list = [...list].sort((a, b) => {
      if (sort === "popular") return b.popularity - a.popularity;
      if (sort === "short") return a.hours - b.hours;
      if (sort === "rating") return b.rating - a.rating;
      return Number(b.recommended) - Number(a.recommended) || b.popularity - a.popularity;
    });
    return list;
  }, [query, level, career, sort]);

  return (
    <AppShell>
      <header className="max-w-2xl">
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Fifteen courses. Every one of them makes you type.
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a skill — React, SQL, Figma…"
              className="pl-9"
              aria-label="Search courses"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {levels.map((l) => (
              <button
                key={l}
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

      <p className="mt-5 text-sm text-chalk">
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
                  setQuery("");
                  setLevel("All");
                  setCareer("all");
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
                    Recommended
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 font-display text-lg font-bold group-hover:text-brand">
                {c.title}
              </h2>
              <p className="mt-1.5 flex-1 text-sm text-chalk">{c.summary}</p>
              <div className="mt-5 flex items-center gap-4 text-xs font-semibold text-chalk">
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 fill-ember text-ember" /> {c.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> {c.hours}h
                </span>
                <span>
                  {liveLessonCount(c)} of {courseLessons(c).length} lessons live
                </span>
                <span>{courseTaskCount(c)} tasks</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
