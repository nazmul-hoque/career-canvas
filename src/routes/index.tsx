import { seoHead, SITE_URL, SITE_DESCRIPTION } from "@/lib/seo";
import { AuthLink } from "@/components/common/AuthLink";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Flame, MessageCircle, Play, Trophy, X, Zap } from "lucide-react";
import { AppHeader, SiteFooter } from "@/components/layout/AppShell";
import { StatPill } from "@/components/common/StatPill";
import { Button } from "@/components/ui/button";
import { careerPaths, courses, pathCourses, pathWeeks } from "@/content/curriculum";
import { liveLessonCount, pathLiveLessonCount } from "@/content/lessons";
import { projects } from "@/content/projects";
import { cn, plural } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () =>
    seoHead({
      path: "/",
      title: "Ascent | Learn Coding, Data, Design & AI",
      description:
        "Learn coding, data, design and AI through interactive career paths. Practice with hands-on challenges, get AI mentor feedback and build portfolio projects.",
      schema: [
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Ascent",
          url: SITE_URL,
        },
        { "@type": "WebSite", name: "Ascent", url: SITE_URL, description: SITE_DESCRIPTION },
      ],
    }),
  component: Landing,
});

const featured = [
  ...careerPaths.filter((p) => p.popular),
  ...careerPaths.filter((p) => !p.popular),
].slice(0, 3);

const pillars = [
  {
    icon: Code2,
    title: "Most lessons end with an exercise",
    body: "You write the code in the browser and tests run against it. To finish the lesson, the tests have to pass.",
  },
  {
    icon: MessageCircle,
    title: "Wrong answers come with a reason",
    body: "Pick the wrong option in a quiz and you're told why that option fails. You still have to work out the right one yourself.",
  },
  {
    icon: Trophy,
    title: "You can ask the mentor",
    body: "The AI mentor reads the code you're stuck on and asks you questions that lead you to the bug. The free plan includes ten messages a month.",
  },
];

const steps = [
  {
    n: "1",
    title: "Choose a path",
    body: `There are ${careerPaths.length}. Each one lists its courses week by week, so you can see how long it will take.`,
  },
  {
    n: "2",
    title: "Do a lesson",
    body: "Most take ten to twenty minutes. Its questions come back for review the next day, then at longer gaps each time you get them right.",
  },
  {
    n: "3",
    title: "Build a project",
    body: "Each project has a brief and a list of requirements. You submit your work and get feedback on it.",
  },
  {
    n: "4",
    title: "Get the certificate",
    body: "Once you finish a path, you get a certificate with an ID. Anyone can check it on the verify page.",
  },
];

function Landing() {
  // Count what a visitor can actually sit down and do today, not the roadmap we
  // intend to write. Advertising planned lessons as delivered ones is the same
  // lie the generated filler lessons used to tell.
  const totalLessons = courses.reduce((sum, c) => sum + liveLessonCount(c), 0);
  const liveCourses = courses.filter((c) => liveLessonCount(c) > 0).length;

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader />

      {/* Hero */}
      {/* min-w-0 on both columns: grid items default to min-width:auto, so the panel's
          min-content width stretched the shared column and the section's overflow-hidden
          silently clipped the headline and CTAs on any viewport under 430px. */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
          <div className="min-w-0 animate-rise">
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Learn to code by writing code, and find out <span className="text-brand">why</span> it
              broke.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-chalk">
              {totalLessons} lessons across {liveCourses} courses so far, in programming, data,
              design and AI. Most of them end with code you write in the browser, checked by real
              tests. We're still writing the rest, and the roadmap shows which ones are coming.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <AuthLink mode="signup">
                  Start free <ArrowRight className="ml-1 size-4" />
                </AuthLink>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link to="/learn">
                  <Play className="mr-1 size-4" /> Browse the catalog
                </Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-chalk">
              No card needed. The first module of every path is free.
            </p>
          </div>

          {/* Hero panel: quoted from js-basics.values, the first JavaScript lesson. Keep it
              in step with that lesson, and never show its solution or its right answers
              here, since this page ships to the browser. */}
          <div className="min-w-0 animate-rise lg:justify-self-end">
            <div className="ink-surface diagonals relative w-full overflow-hidden rounded-[22px] p-5 shadow-lift">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                  JavaScript From Zero · Lesson 1
                </span>
                <Link
                  to="/learn/$courseId/$lessonId"
                  params={{ courseId: "javascript", lessonId: "js-basics.values" }}
                  className="text-xs font-semibold text-white/60 underline underline-offset-2 hover:text-white"
                >
                  Open this lesson
                </Link>
              </div>

              <p className="mt-4 font-display text-lg font-semibold text-white">
                A first try at "Safe line totals"
              </p>

              <pre className="mt-3 overflow-x-auto rounded-xl bg-black/35 p-4 font-mono text-[12.5px] leading-6 text-white/85">
                <code>{`function roundToCent(amount) {
  return amount.toFixed(2);
}`}</code>
              </pre>

              <div className="mt-3 space-y-1.5 rounded-xl bg-ember/10 p-3 text-[13px] text-white/85 ring-1 ring-ember/30">
                <div className="flex items-start gap-2">
                  <X className="mt-0.5 size-4 shrink-0 text-ember" /> Rounds to the nearest cent
                </div>
                <div className="flex items-start gap-2">
                  <X className="mt-0.5 size-4 shrink-0 text-ember" /> Returns a number, not text
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-white/5 p-3 text-[13px] text-white/80 ring-1 ring-white/10">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Same lesson, a quiz answer that's wrong
                </div>
                <p className="mt-1.5 font-mono text-[12.5px] text-white/90">
                  const n = Number("12 apples"); n === NaN
                </p>
                <p className="mt-1.5 leading-relaxed">
                  NaN isn't equal to anything, itself included, so this is false even when{" "}
                  <span className="font-mono">n</span> is NaN.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="card-surface p-6">
              <div className="grid size-11 place-items-center rounded-2xl bg-brand/10 text-brand">
                <p.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-chalk">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Career paths */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="eyebrow">Career paths</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Pick a path
            </h2>
            <p className="mt-2 text-chalk">
              Each path puts its courses and projects in the order we'd learn them in. Some paths
              are further along than others, and each card says how many lessons are ready.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/paths">
              See all {careerPaths.length} paths <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {featured.map((path) => (
            <Link
              key={path.id}
              to="/paths/$pathId"
              params={{ pathId: path.id }}
              className="card-surface group flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <StatPill tone="brand">{path.difficulty}</StatPill>
                <span className="text-xs font-semibold text-chalk">~{pathWeeks(path)} weeks</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{path.name}</h3>
              <p className="mt-0.5 text-sm font-medium text-brand">{path.tagline}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-chalk">{path.overview}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-chalk">
                <span>
                  {pathCourses(path).length} {plural(pathCourses(path).length, "course")} ·{" "}
                  {pathLiveLessonCount(path)} {plural(pathLiveLessonCount(path), "lesson")} live
                </span>
                <ArrowRight className="size-4 text-brand transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="ink-surface holdmark overflow-hidden rounded-[22px] px-6 py-12 sm:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
            How it works
          </p>
          <h2 className="mt-1 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How a path works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n}>
                <span className="font-mono text-sm font-bold text-brand">{s.n}</span>
                <h3 className="mt-2 font-display text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="eyebrow">Projects</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Something to show at the end
            </h2>
            <p className="mt-2 text-chalk">
              {projects.length} project briefs, each with requirements and milestones. Finished
              projects go on your public profile, which you can link from a CV.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/projects">
              All projects <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.slice(0, 4).map((project) => (
            <Link
              key={project.id}
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="card-surface group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div
                className={cn(
                  "holdmark h-24",
                  project.accent === "brand" && "bg-brand",
                  project.accent === "ember" && "bg-ember",
                  project.accent === "ink" && "bg-ink",
                )}
              />
              <div className="p-5">
                <h3 className="font-display text-base font-bold leading-snug">{project.title}</h3>
                <p className="mt-1 text-sm text-chalk">{project.tagline}</p>
                <p className="mt-4 text-xs font-semibold text-chalk">
                  {project.difficulty} · ~{project.hours}h
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Gamification strip */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="card-surface grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div className="max-w-2xl">
            <p className="eyebrow">Streaks</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
              A little each day adds up
            </h2>
            <p className="mt-3 leading-relaxed text-chalk">
              One lesson or one review a day keeps your streak going. There's also a daily XP goal,
              sized from the hours a week you tell us you have. The default, 150 XP, is about twenty
              minutes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-ember/10 px-5 py-4 ring-1 ring-ember/20">
              <Flame className="size-5 text-ember" />
              <div className="mt-2 font-display text-2xl font-bold">Streaks</div>
              <div className="text-xs font-semibold text-chalk">Daily + best</div>
            </div>
            <div className="rounded-2xl bg-brand/10 px-5 py-4 ring-1 ring-brand/20">
              <Zap className="size-5 text-brand" />
              <div className="mt-2 font-display text-2xl font-bold">XP</div>
              <div className="text-xs font-semibold text-chalk">Levels & titles</div>
            </div>
            <div className="rounded-2xl bg-secondary px-5 py-4 ring-1 ring-border">
              <Trophy className="size-5 text-foreground" />
              <div className="mt-2 font-display text-2xl font-bold">10</div>
              <div className="text-xs font-semibold text-chalk">Achievements</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-4 pb-20 pt-6 sm:px-6">
        <div className="card-surface p-10 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            The first lesson takes about ten minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-chalk">
            The free plan covers the first module of every path. Pro adds the rest of the lessons,
            the projects, certificates and more time with the mentor.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-7 text-base">
              <AuthLink mode="signup">
                Create a free account <ArrowRight className="ml-1 size-4" />
              </AuthLink>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
              <Link to="/pricing">Compare plans</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
