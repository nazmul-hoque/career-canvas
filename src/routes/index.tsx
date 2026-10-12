import { seoHead, SITE_URL, SITE_DESCRIPTION } from "@/lib/seo";
import { AuthLink } from "@/components/common/AuthLink";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, X } from "lucide-react";
import { AppHeader, SiteFooter } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { careerPaths, courses, pathWeeks } from "@/content/curriculum";
import { liveLessonCount, pathLiveLessonCount } from "@/content/lessons";
import { projects } from "@/content/projects";

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

function Landing() {
  // Count what a visitor can actually sit down and do today, not the roadmap we
  // intend to write. Advertising planned lessons as delivered ones is the same
  // lie the generated filler lessons used to tell.
  const totalLessons = courses.reduce((sum, c) => sum + liveLessonCount(c), 0);
  const liveCourses = courses.filter((c) => liveLessonCount(c) > 0).length;

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader />

      <section className="mx-auto max-w-[1100px] px-4 pb-14 pt-14 sm:px-6 lg:pt-20">
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
          Learn to code by writing code, and find out why it broke.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-chalk">
          {totalLessons} lessons across {liveCourses} courses so far, in programming, data, design
          and AI. Most of them end with code you write in the browser, checked by real tests. We're
          still writing the rest, and the roadmap shows which ones are coming.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button asChild size="lg" className="h-12 px-6 text-base">
            <AuthLink mode="signup">
              Start free <ArrowRight className="ml-1 size-4" />
            </AuthLink>
          </Button>
          <Link to="/learn" className="font-medium text-brand underline-offset-4 hover:underline">
            or browse the catalog
          </Link>
        </div>
        <p className="mt-4 text-sm text-chalk">
          No card needed. The first module of every path is free.
        </p>
      </section>

      {/* Quoted from js-basics.values, the first JavaScript lesson. Keep it in step with
          that lesson, and never show its solution or its right answers here, since this
          page ships to the browser. */}
      <section className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          What a lesson looks like
        </h2>
        <p className="mt-2 max-w-2xl text-chalk">
          These are three moments from the first lesson of JavaScript From Zero,{" "}
          <Link
            to="/learn/$courseId/$lessonId"
            params={{ courseId: "javascript", lessonId: "js-basics.values" }}
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            which you can open
          </Link>{" "}
          without an account.
        </p>

        <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
          <Moment note="Lessons are written, not filmed, so you read at your own pace and can copy anything.">
            <p className="leading-relaxed">
              <strong>Decimals are approximate.</strong>{" "}
              <code className="rounded bg-muted px-1 font-mono text-[0.9em]">0.1 + 0.2</code> is{" "}
              <code className="rounded bg-muted px-1 font-mono text-[0.9em] [overflow-wrap:anywhere]">
                0.30000000000000004
              </code>
              .
            </p>
          </Moment>
          <Moment note="Most lessons end with an exercise. Tests run in your browser, and the lesson isn't done until they pass. This is a first try that doesn't.">
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-[13px] leading-6">
              <code>{`function roundToCent(amount) {
  return amount.toFixed(2);
}`}</code>
            </pre>
            <ul className="mt-3 space-y-1 text-sm">
              <li className="flex items-start gap-2">
                <X className="mt-0.5 size-4 shrink-0 text-ember" /> Rounds to the nearest cent
              </li>
              <li className="flex items-start gap-2">
                <X className="mt-0.5 size-4 shrink-0 text-ember" /> Returns a number, not text
              </li>
            </ul>
          </Moment>
          <Moment note="Pick a wrong answer and you're told why it's wrong. Which one is right, you still have to work out.">
            <p className="text-sm text-chalk">
              <code className="font-mono">const n = Number("12 apples");</code> Which check tells
              you the conversion failed?
            </p>
            <p className="mt-2 font-mono text-sm">n === NaN</p>
            <p className="mt-1 text-sm leading-relaxed">
              NaN isn't equal to anything, itself included, so this is false even when{" "}
              <code className="font-mono">n</code> is NaN.
            </p>
          </Moment>
        </div>

        <p className="mt-6 max-w-2xl leading-relaxed text-chalk">
          A day later, the lesson's questions come back for review, and then at longer gaps each
          time you get them right. If you're stuck on an exercise, the AI mentor reads your code and
          asks you questions until you find the bug yourself. Free accounts get ten mentor messages
          a month. One lesson or one review a day keeps your streak going.
        </p>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Career paths</h2>
        <p className="mt-2 max-w-2xl text-chalk">
          A path is a set of courses in the order we'd take them. Some are further along than
          others, so each one says how many lessons are ready today.
        </p>
        <ul className="mt-5 divide-y divide-border border-y border-border">
          {careerPaths.map((path) => (
            <li key={path.id}>
              <Link
                to="/paths/$pathId"
                params={{ pathId: path.id }}
                className="group flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="font-display text-lg font-semibold group-hover:text-brand sm:w-64 sm:shrink-0">
                  {path.name}
                </span>
                <span className="flex-1 text-sm text-chalk">{path.tagline}</span>
                <span className="text-sm text-chalk sm:text-right">
                  {path.difficulty}, about {pathWeeks(path)} weeks, {pathLiveLessonCount(path)}{" "}
                  lessons ready
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Projects</h2>
        <p className="mt-2 max-w-2xl text-chalk">
          Each project is a brief with a list of requirements. You build it on your own machine,
          submit it with notes on your decisions, and get feedback on the write-up. Finished
          projects go on your public profile. Projects are part of Pro.
        </p>
        <ul className="mt-5 grid gap-x-10 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id} className="border-b border-border py-4">
              <Link
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className="group block"
              >
                <span className="font-semibold group-hover:text-brand">{project.title}</span>
                <span className="mt-0.5 block text-sm text-chalk">
                  {project.tagline}. {project.difficulty}, about {project.hours} hours.
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 pb-20 pt-10 sm:px-6">
        <div className="border-t border-border pt-10">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            The first lesson takes about ten minutes.
          </h2>
          <p className="mt-2 max-w-2xl text-chalk">
            The free plan covers the first module of every path. Pro adds the rest of the lessons,
            the projects, certificates and more time with the mentor.{" "}
            <Link
              to="/pricing"
              className="font-medium text-brand underline-offset-4 hover:underline"
            >
              Compare plans
            </Link>
          </p>
          <Button asChild size="lg" className="mt-6 h-12 px-6 text-base">
            <AuthLink mode="signup">
              Create a free account <ArrowRight className="ml-1 size-4" />
            </AuthLink>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/** One excerpt from the lesson, with a note beside it on wide screens and under it on a phone. */
function Moment({ note, children }: { note: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 p-5 md:grid-cols-[1fr_17rem] md:gap-8">
      <div className="min-w-0">{children}</div>
      <p className="text-sm leading-relaxed text-chalk md:border-l md:border-border md:pl-6">
        {note}
      </p>
    </div>
  );
}
