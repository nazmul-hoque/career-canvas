import { seoHead, breadcrumbs } from "@/lib/seo";
import { useMemo } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  FolderGit2,
  Layers,
  PlayCircle,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressRing } from "@/components/common/ProgressRing";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useAuth";
import {
  useProfile,
  useProgress,
  useUpdateProfile,
  useUnlockAchievement,
} from "@/hooks/useLearner";
import {
  courseLessons,
  pathById,
  pathCourses,
  pathWeeks,
  unitWords,
  unitWordsForCourses,
  type LessonMeta,
} from "@/content/curriculum";
import { experienceShape } from "@/content/personalisation";
import { formatMinutes, isLessonLive, liveLessons, liveMinutes } from "@/content/lessons";
import { projectById } from "@/content/projects";
import { pathCompletion, type CredentialState } from "@/lib/certificates";
import { track } from "@/lib/analytics";
import { cn, plural } from "@/lib/utils";

export const Route = createFileRoute("/paths/$pathId")({
  loader: ({ params }) => {
    const path = pathById(params.pathId);
    if (!path) throw notFound();
    return { path };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Path unavailable — Ascent" }, { name: "robots", content: "noindex" }],
      };
    }
    const { path } = loaderData;
    return seoHead({
      path: `/paths/${path.id}`,
      title: `${path.name} career path — Ascent`,
      description: path.overview,
      schema: [
        breadcrumbs([
          { name: "Home", path: "/" },
          { name: "Career paths", path: "/paths" },
          { name: path.name, path: `/paths/${path.id}` },
        ]),
      ],
    });
  },
  notFoundComponent: PathMissing,
  errorComponent: PathMissing,
  component: PathDetail,
});

function PathMissing() {
  return (
    <AppShell>
      <div className="card-surface p-10 text-center">
        <h1 className="font-display text-2xl font-bold">We could not find that career path</h1>
        <p className="mt-2 text-sm text-chalk">It may have been renamed since you last looked.</p>
        <Button asChild className="mt-6">
          <Link to="/paths">All career paths</Link>
        </Button>
      </div>
    </AppShell>
  );
}

const typeIcon: Record<LessonMeta["type"], typeof BookOpen> = {
  concept: BookOpen,
  practice: Wrench,
  challenge: Code2,
  project: PlayCircle,
};

function PathDetail() {
  const { path } = Route.useLoaderData();
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { data: progress = [] } = useProgress();
  const updateProfile = useUpdateProfile();
  const unlock = useUnlockAchievement();

  const done = useMemo(() => new Set(progress.map((p) => p.lesson_id)), [progress]);
  const courses = pathCourses(path);
  const words = unitWordsForCourses(courses);
  const { total, live, completed, percent, credential } = pathCompletion(path, done);

  // One paragraph and one caption per credential state; the bar is the same in
  // every arm, so it is rendered once below rather than copied into each.
  const certificateCopy: Record<CredentialState, { blurb: string; caption: string }> = {
    eligible: {
      blurb: `Every ${words.singular} on this path is complete. Your certificate is ready.`,
      caption: "",
    },
    "self-directed": {
      blurb: `This path is self-directed: the work happens in your own tools and nothing on it is marked, so it doesn't carry a certificate. A credential we can't check isn't worth carrying. Your progress still builds your streak and XP.`,
      caption: `${completed} of ${live} ${words.plural} done`,
    },
    unwritten: {
      blurb: `This path is still being written — ${live} of its ${total} ${words.plural} are live. No certificate is issued for a roadmap that isn't finished, so keep going and we'll open this the moment the last one lands.`,
      caption: `${completed} of ${live} live ${words.plural} done`,
    },
    "in-progress": {
      blurb: `Finish all ${total} ${words.plural} to unlock a certificate with a verifiable ID you can put on LinkedIn.`,
      caption: `${live - completed} ${words.plural} remaining`,
    },
  };
  const certificate = certificateCopy[credential];
  const isCurrent = profile?.career_path === path.id;
  const experience = experienceShape(profile?.experience);

  // Early exit rather than building a wrapper for every live lesson on the path
  // (172 of them on claude-operator) to return the first one.
  const nextLesson = useMemo(() => {
    for (const course of courses) {
      for (const lesson of liveLessons(course)) {
        if (!done.has(lesson.id)) return { course, lesson };
      }
    }
    return undefined;
  }, [courses, done]);

  function choosePath() {
    if (!user) return;
    updateProfile.mutate(
      { career_path: path.id },
      {
        onSuccess: () => {
          track("path_chosen", { path_id: path.id, live_lessons: live, total_lessons: total });
          toast.success(`${path.name} is now your path`, {
            description: "Your dashboard will follow this roadmap from here.",
          });
          unlock.mutate("path-chosen");
        },
        onError: () => toast.error("We could not save that. Try again in a moment."),
      },
    );
  }

  return (
    <AppShell>
      {/* Hero */}
      <div className="ink-surface diagonals overflow-hidden rounded-[22px] px-6 py-10 sm:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Link
              to="/paths"
              /* inline-flex so the coarse-pointer tap-target floor in styles.css applies:
                 an inline box ignores min-height, and this is a standalone control. */
              className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.15em] text-white/50 hover:text-white"
            >
              ← All career paths
            </Link>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {path.name}
            </h1>
            <p className="mt-1 font-medium text-brand">{path.tagline}</p>
            <p className="mt-4 leading-relaxed text-white/70">{path.overview}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                <Layers className="size-3.5" /> {courses.length} {plural(courses.length, "course")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                <BookOpen className="size-3.5" /> {live} of {total}{" "}
                {plural(total, words.singular, words.plural)} live
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                <Clock className="size-3.5" /> ~{pathWeeks(path, profile?.hours_per_week)}{" "}
                {plural(pathWeeks(path, profile?.hours_per_week), "week")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                {path.difficulty}
              </span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {nextLesson ? (
                <Button asChild size="lg">
                  <Link
                    to="/learn/$courseId/$lessonId"
                    params={{ courseId: nextLesson.course.id, lessonId: nextLesson.lesson.id }}
                  >
                    {completed > 0 ? "Continue path" : "Start the path"}
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link to="/certificates/$pathId" params={{ pathId: path.id }}>
                    <Award className="mr-1.5 size-4" /> View your certificate
                  </Link>
                </Button>
              )}
              {user && !isCurrent ? (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={choosePath}
                  disabled={updateProfile.isPending}
                  className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  {updateProfile.isPending ? "Saving…" : "Make this my path"}
                </Button>
              ) : null}
              {isCurrent ? (
                <span className="inline-flex items-center gap-2 self-center rounded-full bg-brand/20 px-4 py-2 text-sm font-semibold text-brand">
                  <CheckCircle2 className="size-4" /> This is your current path
                </span>
              ) : null}
            </div>

            {/* The onboarding "where are you starting from?" answer, used. */}
            {experience && completed === 0 ? (
              <p className="mt-4 max-w-xl text-sm text-white/70">
                {experience.effect}{" "}
                <Link
                  to="/placement/$pathId"
                  params={{ pathId: path.id }}
                  className="font-semibold text-brand underline-offset-4 hover:underline"
                >
                  Take the placement check
                </Link>{" "}
                — it awards nothing and marks nothing complete, it only suggests a starting module.
              </p>
            ) : null}
          </div>

          <div className="shrink-0 lg:pl-8">
            <div className="rounded-[20px] bg-white/5 p-5 ring-1 ring-white/10">
              <ProgressRing
                percent={percent}
                size={168}
                sublabel={`${completed} of ${live} lessons`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">What you'll be able to do</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {path.skills.map((s) => (
            <span
              key={s}
              className="rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold text-foreground ring-1 ring-border"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Roadmap */}
        <section>
          <h2 className="font-display text-xl font-bold">The roadmap</h2>
          <p className="mt-1 text-sm text-chalk">
            In order. Each course assumes the one above it is behind you.
          </p>

          <ol className="mt-4 space-y-4">
            {courses.map((course, i) => {
              const lessons = courseLessons(course);
              const written = liveLessons(course);
              const courseDone = written.filter((l) => done.has(l.id)).length;
              const coursePercent = written.length
                ? Math.round((courseDone / written.length) * 100)
                : 0;
              const finished = written.length > 0 && coursePercent === 100;

              return (
                <li key={course.id} className="card-surface p-5">
                  <div className="flex items-start gap-4">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl font-display text-sm font-bold",
                        finished
                          ? "bg-brand text-brand-foreground"
                          : "bg-secondary text-chalk ring-1 ring-border",
                      )}
                    >
                      {finished ? <CheckCircle2 className="size-4" /> : i + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          to="/courses/$courseId"
                          params={{ courseId: course.id }}
                          className="font-display text-lg font-bold hover:text-brand"
                        >
                          {course.title}
                        </Link>
                        <span className="text-xs font-semibold text-chalk">
                          {written.length} of {lessons.length}{" "}
                          {plural(
                            lessons.length,
                            unitWords(course).singular,
                            unitWords(course).plural,
                          )}{" "}
                          live
                          {written.length ? ` · ${formatMinutes(liveMinutes(course))}` : ""}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-chalk">{course.summary}</p>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-brand transition-all duration-700"
                          style={{ width: `${coursePercent}%` }}
                        />
                      </div>

                      <ul className="mt-3 space-y-1.5">
                        {course.modules.map((mod) => (
                          <li key={mod.id} className="flex items-center gap-2 text-sm">
                            <span className="text-chalk">{mod.title}</span>
                            <span className="ml-auto flex items-center gap-1">
                              {mod.lessons.map((l) => {
                                const Icon = typeIcon[l.type];
                                return (
                                  <Icon
                                    key={l.id}
                                    className={cn(
                                      "size-3.5",
                                      !isLessonLive(l.id)
                                        ? "text-chalk/15"
                                        : done.has(l.id)
                                          ? "text-brand"
                                          : "text-chalk/40",
                                    )}
                                  />
                                );
                              })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Side: projects + certificate */}
        <aside className="space-y-5">
          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <FolderGit2 className="size-4 text-brand" /> Portfolio projects
            </h2>
            <p className="mt-1 text-sm text-chalk">
              Build these as you go. They are what you send to a hiring manager.
            </p>
            <ul className="mt-4 space-y-3">
              {path.projectIds.map((id) => {
                const project = projectById(id);
                if (!project) return null;
                return (
                  <li key={id}>
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: project.id }}
                      className="block rounded-xl bg-secondary p-3.5 ring-1 ring-border transition-colors hover:ring-brand/40"
                    >
                      <div className="font-semibold">{project.title}</div>
                      <div className="mt-0.5 text-xs text-chalk">
                        {project.difficulty} · ~{project.hours}h
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            className={cn("card-surface p-5", credential === "eligible" && "ring-2 ring-brand")}
          >
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Award className="size-4 text-ember" /> Certificate
            </h2>
            <p className="mt-1 text-sm text-chalk">{certificate.blurb}</p>
            {credential === "eligible" ? (
              <Button asChild className="mt-4 w-full">
                <Link to="/certificates/$pathId" params={{ pathId: path.id }}>
                  Open certificate
                </Link>
              </Button>
            ) : (
              <>
                <div className="mt-4 text-sm font-semibold text-chalk">{certificate.caption}</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-ember transition-all duration-700"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </>
            )}
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
