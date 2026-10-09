import { seoHead, SITE_URL, SITE_DESCRIPTION } from "@/lib/seo";
import { AuthLink } from "@/components/common/AuthLink";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Code2,
  Flame,
  MessageCircle,
  Play,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { AppHeader, Wordmark } from "@/components/layout/AppShell";
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
      title: "Ascent \u2014 Learn Coding, Data, Design & AI",
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
    title: "You type from lesson one",
    body: "Every module ends in a challenge you have to pass — a browser editor, real tests, a real console. Nothing unlocks because you watched it.",
  },
  {
    icon: MessageCircle,
    title: "An AI mentor that asks first",
    body: "Stuck code gets a question, not a copy-paste answer. It reads your submission, spots the bug and walks you to it.",
  },
  {
    icon: Trophy,
    title: "A portfolio, not a certificate wall",
    body: "Eight real briefs with requirements and milestones. You finish with work you can show, plus the write-up recruiters actually read.",
  },
];

const steps = [
  {
    n: "01",
    title: "Pick a destination",
    body: `${careerPaths.length} career paths, each with a week-by-week roadmap and a clear finish line.`,
  },
  {
    n: "02",
    title: "Learn in short reps",
    body: "Ten-minute lessons that end in a challenge. Daily goal, streak, XP — enough to make you come back.",
  },
  {
    n: "03",
    title: "Build the real thing",
    body: "Portfolio projects with a brief, requirements and milestones. Submit, get feedback, iterate.",
  },
  {
    n: "04",
    title: "Show the evidence",
    body: "A public profile, a project portfolio and a certificate with a verifiable ID.",
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
            <StatPill tone="brand">
              <Sparkles className="size-3.5" />
              {liveCourses} courses live · {totalLessons} hands-on lessons
            </StatPill>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Become job-ready by
              <span className="text-brand"> building</span>, not watching.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-chalk">
              Pick a career path, follow a roadmap that knows what you already finished, and prove
              it with code you wrote yourself. An AI mentor sits beside you the whole way.
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

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-chalk">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-brand" /> No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-brand" /> First module free on every path
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-brand" /> Certificates anyone can verify
              </span>
            </div>
          </div>

          {/* Hero panel — a lesson in progress */}
          <div className="min-w-0 animate-rise lg:justify-self-end">
            <div className="ink-surface diagonals relative w-full overflow-hidden rounded-[22px] p-5 shadow-lift">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                  JavaScript · Challenge
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ember/20 px-3 py-1 text-xs font-bold text-ember">
                  <Flame className="size-3.5" /> 12 day streak
                </span>
              </div>

              <p className="mt-4 font-display text-lg font-semibold text-white">
                Total the cart with reduce
              </p>

              <pre className="mt-3 overflow-x-auto rounded-xl bg-black/35 p-4 font-mono text-[12.5px] leading-6 text-white/85">
                <code>{`const total = cart.reduce(
  (sum, item) => sum + item.price * item.qty,
  0
);`}</code>
              </pre>

              <div className="mt-3 rounded-xl bg-brand/15 p-3 text-[13px] text-white/90 ring-1 ring-brand/30">
                <div className="flex items-center gap-2 font-semibold text-brand">
                  <Check className="size-4" /> 3 / 3 tests passed
                </div>
                <p className="mt-1 text-white/70">
                  +75 XP · Achievement unlocked: First Coding Challenge
                </p>
              </div>

              <div className="mt-3 rounded-xl bg-white/5 p-3 text-[13px] text-white/80 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                  <MessageCircle className="size-3.5" /> AI mentor
                </div>
                <p className="mt-1.5 leading-relaxed">
                  Nice. Before you move on — what happens if <span className="font-mono">cart</span>{" "}
                  is empty? Try it and tell me why that second argument matters.
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
              {careerPaths.length} destinations. One roadmap each.
            </h2>
            <p className="mt-2 text-chalk">
              Every path bundles the courses, the practice and the portfolio pieces a hiring manager
              expects to see — in the order that makes them stick.
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
            Four steps toward skills you can demonstrate.
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
            <p className="eyebrow">Portfolio</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Finish with work, not just a transcript.
            </h2>
            <p className="mt-2 text-chalk">
              Eight briefs with real requirements. Build them, submit them, get feedback, put them
              on a public profile you can link from a CV.
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
            <p className="eyebrow">Momentum</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
              The hard part isn't the syntax. It's tomorrow.
            </h2>
            <p className="mt-3 leading-relaxed text-chalk">
              Streaks, daily goals, XP, levels and achievements exist for one reason: most people
              quit in week three. A 150 XP daily goal is about twenty minutes — small enough to
              keep, big enough to matter.
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
            Your first lesson takes ten minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-chalk">
            Start free, keep the streak, and see where you are in a month. Upgrade only when you
            want the AI mentor on every challenge.
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

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-sm text-sm text-chalk">
              Practice-first learning for people changing what they do for a living.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-chalk">
            <Link to="/learn" className="hover:text-foreground">
              Courses
            </Link>
            <Link to="/paths" className="hover:text-foreground">
              Career paths
            </Link>
            <Link to="/projects" className="hover:text-foreground">
              Projects
            </Link>
            <Link to="/community" className="hover:text-foreground">
              Community
            </Link>
            <Link to="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
