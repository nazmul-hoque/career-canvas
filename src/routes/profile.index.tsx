import { QueryError } from "@/components/common/QueryError";
import { AuthLink } from "@/components/common/AuthLink";
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  BookCheck,
  Check,
  Flame,
  FolderGit2,
  Pencil,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { StatPill, EmptyState } from "@/components/common/StatPill";
import { AchievementIcon } from "@/components/common/AchievementIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  useAchievements,
  useProfile,
  useProgress,
  useSubmissions,
  useUpdateProfile,
} from "@/hooks/useLearner";
import { achievements, levelFromXp, levelTitle } from "@/content/gamification";
import { courses, courseLessons, pathById } from "@/content/curriculum";
import { isCoursePublished } from "@/content/lessons";
import { projectById } from "@/content/projects";
import { allPathCompletions } from "@/lib/certificates";
import { cn, plural } from "@/lib/utils";

export const Route = createFileRoute("/profile/")({
  head: () => ({
    meta: [
      { title: "Your profile — Ascent" },
      {
        name: "description",
        content:
          "Your XP, level, streak, completed courses, achievements, certificates and portfolio.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function initialsOf(name?: string | null) {
  if (!name) return "AS";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProfilePage() {
  const { user, isLoading: sessionLoading } = useSession();
  const profileQuery = useProfile();
  const { data: profile, isLoading } = profileQuery;
  const progressQuery = useProgress();
  const { data: progress = [] } = progressQuery;
  const achievementsQuery = useAchievements();
  const { data: earned = [] } = achievementsQuery;
  const submissionsQuery = useSubmissions();
  const { data: submissions = [] } = submissionsQuery;
  const updateProfile = useUpdateProfile();
  const push = usePushNotifications();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name);
    setBio(profile.bio ?? "");
  }, [profile]);

  if (sessionLoading || isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-48 w-full rounded-[22px]" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  const pageQueries = [profileQuery, progressQuery, achievementsQuery, submissionsQuery];
  const failedQueries = pageQueries.filter((query) => query.isError);
  if (user && failedQueries.length)
    return (
      <AppShell>
        <QueryError
          title="We couldn't load your profile"
          busy={failedQueries.some((q) => q.isFetching)}
          retry={() => Promise.all(failedQueries.map((q) => q.refetch()))}
        />
      </AppShell>
    );
  if (user && pageQueries.some((query) => query.isLoading))
    return (
      <AppShell>
        <p role="status">Loading your saved progress…</p>
      </AppShell>
    );
  if (user && !profile)
    return (
      <AppShell>
        <QueryError title="Your profile isn't available yet" retry={() => profileQuery.refetch()} />
      </AppShell>
    );

  if (!user || !profile) {
    return (
      <AppShell>
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title="Sign in to see your profile"
          description="Your XP, streak, certificates and portfolio all live here once you have an account."
          action={
            <Button asChild className="mt-2">
              <AuthLink mode="signup">Sign in or start free</AuthLink>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const done = new Set(progress.map((p) => p.lesson_id));
  const earnedKeys = new Set(earned.map((e) => e.achievement_key));
  const level = levelFromXp(profile.xp);
  const path = profile.career_path ? pathById(profile.career_path) : null;

  // Only a fully written course can be "completed" — otherwise finishing the one
  // live lesson of a 12-lesson course would put the whole skill list on a public
  // profile.
  const completedCourses = courses.filter((c) => {
    const lessons = courseLessons(c);
    return lessons.length > 0 && isCoursePublished(c) && lessons.every((l) => done.has(l.id));
  });

  const certificates = allPathCompletions(done).filter((c) => c.credential === "eligible");

  const skills = [...new Set(completedCourses.flatMap((c) => c.skills))];

  const myProjects = (
    submissions as {
      project_id: string;
      status: string;
      is_published: boolean;
      live_url: string | null;
    }[]
  )
    .map((s) => ({ ...s, project: projectById(s.project_id) }))
    .filter((s) => s.project);

  function save() {
    updateProfile.mutate(
      { display_name: name.trim() || "Learner", bio: bio.trim() || null },
      {
        onSuccess: () => {
          toast.success("Profile updated");
          setEditing(false);
        },
        onError: () => toast.error("We could not save that. Try again in a moment."),
      },
    );
  }

  function share() {
    const url = `${window.location.origin}/profile/${user!.id}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Public profile link copied"))
      .catch(() => toast.error("Could not copy the link"));
  }

  return (
    <AppShell>
      {/* Header */}
      <section className="ink-surface diagonals overflow-hidden rounded-[22px] px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar className="size-20 border-2 border-white/20">
              <AvatarFallback className="bg-white/10 text-xl font-bold text-white">
                {initialsOf(profile.display_name)}
              </AvatarFallback>
            </Avatar>

            {editing ? (
              <div className="w-full max-w-md space-y-3">
                <div>
                  <Label htmlFor="name" className="text-white/70">
                    Display name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label htmlFor="bio" className="text-white/70">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="What you're working toward, in one or two lines."
                    className="mt-1.5 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={save} disabled={updateProfile.isPending}>
                    <Check className="mr-1.5 size-4" />
                    {updateProfile.isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-white">
                  {profile.display_name}
                </h1>
                <p className="mt-1 text-sm font-semibold text-brand">
                  Level {level.level} · {levelTitle(level.level)}
                  {path ? ` · ${path.name}` : ""}
                </p>
                <p className="mt-3 max-w-xl leading-relaxed text-white/70">
                  {profile.bio ?? "No bio yet. Add a line about what you're working toward."}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                    className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="mr-1.5 size-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={share}
                    className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <Share2 className="mr-1.5 size-3.5" /> Share
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6 lg:text-right">
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
              <div className="text-[11px] text-white/40">best {profile.streak_best}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                Lessons
              </div>
              <div className="font-display text-2xl font-bold text-white">{progress.length}</div>
            </div>
          </div>
        </div>

        {/* Level bar */}
        <div className="mt-7">
          <div className="flex items-center justify-between text-xs font-semibold text-white/60">
            <span>Level {level.level}</span>
            <span>
              {level.intoLevel} / {level.needed} XP to level {level.level + 1}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand transition-all duration-700"
              style={{ width: `${level.percent}%` }}
            />
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <p className="text-sm text-chalk">
            Your public profile includes your name, bio, learning stats, achievements, and only the
            projects you publish.{" "}
            <Link
              to="/profile/$userId"
              params={{ userId: user.id }}
              search={{ preview: true }}
              className="font-semibold text-brand underline"
            >
              Preview your portfolio
            </Link>
          </p>
          {/* Portfolio */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                <FolderGit2 className="size-4 text-brand" /> Portfolio
              </h2>
              <Link to="/projects" className="text-sm font-semibold text-brand hover:underline">
                Browse briefs
              </Link>
            </div>

            {myProjects.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<FolderGit2 className="size-5" />}
                  title="Nothing shipped yet"
                  description="Submitted projects are private until you choose to publish them from the project page."
                  action={
                    <Button asChild size="sm" className="mt-2">
                      <Link to="/projects">Pick a project</Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {myProjects.map((s) => (
                  <Link
                    key={s.project_id}
                    to="/projects/$projectId"
                    params={{ projectId: s.project_id }}
                    className="card-surface overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div
                      className={cn(
                        "holdmark h-20",
                        s.project!.accent === "brand" && "bg-brand",
                        s.project!.accent === "ember" && "bg-ember",
                        s.project!.accent === "ink" && "bg-ink",
                      )}
                    />
                    <div className="p-4">
                      <div className="font-display font-bold leading-snug">{s.project!.title}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <StatPill tone={s.status === "approved" ? "brand" : "neutral"}>
                          {s.is_published ? "Public" : "Private draft"}
                        </StatPill>
                        <span className="text-xs text-chalk">{s.project!.difficulty}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Completed courses */}
          <section>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <BookCheck className="size-4 text-brand" /> Completed courses
            </h2>
            {completedCourses.length === 0 ? (
              <p className="mt-3 text-sm text-chalk">
                Finish every lesson in a course and it lands here. You're {progress.length}{" "}
                {plural(progress.length, "lesson")} in.
              </p>
            ) : (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {completedCourses.map((c) => (
                  <li key={c.id}>
                    <Link
                      to="/courses/$courseId"
                      params={{ courseId: c.id }}
                      className="flex items-center gap-3 rounded-xl bg-card p-3.5 ring-1 ring-border transition-colors hover:ring-brand/40"
                    >
                      <Check className="size-4 shrink-0 text-brand" />
                      <span className="text-sm font-semibold">{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Skills */}
          {skills.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-bold">Skills evidenced</h2>
              <p className="mt-1 text-sm text-chalk">Drawn from courses you actually finished.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold ring-1 ring-border"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          {/* Certificates */}
          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Award className="size-4 text-ember" /> Certificates
            </h2>
            {certificates.length === 0 ? (
              <p className="mt-2 text-sm text-chalk">
                Complete every lesson on a career path to earn one.{" "}
                <Link to="/paths" className="font-semibold text-brand hover:underline">
                  See paths
                </Link>
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {certificates.map((c) => (
                  <li key={c.path.id}>
                    <Link
                      to="/certificates/$pathId"
                      params={{ pathId: c.path.id }}
                      className="flex items-center justify-between rounded-xl bg-ember/10 px-3.5 py-3 text-sm font-semibold ring-1 ring-ember/20 transition-colors hover:ring-ember/50"
                    >
                      {c.path.name}
                      <Award className="size-4 text-ember" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Achievements */}
          <section className="card-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Achievements</h2>
              <span className="text-xs font-semibold text-chalk">
                {earnedKeys.size} / {achievements.length}
              </span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {achievements.map((a) => {
                const has = earnedKeys.has(a.key);
                return (
                  <li key={a.key} className={cn("flex items-start gap-3", !has && "opacity-45")}>
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-xl",
                        has ? "bg-brand/12 text-brand" : "bg-secondary text-chalk",
                      )}
                    >
                      <AchievementIcon icon={a.icon} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{a.name}</div>
                      <div className="text-xs text-chalk">{a.description}</div>
                    </div>
                    <span className="ml-auto shrink-0 text-xs font-bold text-chalk">+{a.xp}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Stats */}
          <section className="card-surface p-5">
            <h2 className="font-display text-lg font-bold">Learning statistics</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-chalk">Lessons completed</dt>
                <dd className="font-bold">{progress.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-chalk">Courses finished</dt>
                <dd className="font-bold">{completedCourses.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-chalk">Projects submitted</dt>
                <dd className="font-bold">{myProjects.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-chalk">
                  <Zap className="size-3.5" /> Total XP
                </dt>
                <dd className="font-bold text-brand">{profile.xp.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-chalk">
                  <Flame className="size-3.5" /> Best streak
                </dt>
                <dd className="font-bold text-ember">{profile.streak_best} days</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-chalk">Plan</dt>
                <dd>
                  <Link to="/pricing">
                    <StatPill tone={profile.plan === "free" ? "neutral" : "brand"}>
                      {profile.plan}
                    </StatPill>
                  </Link>
                </dd>
              </div>
            </dl>
          </section>

          {/* Email reminders */}
          <section className="card-surface p-5">
            <h2 className="font-display text-lg font-bold">Learning reminders</h2>
            <p className="mt-1.5 text-sm text-chalk">
              A nudge on the day your streak is about to break, and a note if you've been away a
              week. Never more than one a day, and never marketing.
            </p>
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-4">
              <span className="text-sm font-semibold">
                {profile.email_optin ? "Email reminders are on" : "Email reminders are off"}
              </span>
              <Switch
                checked={profile.email_optin}
                disabled={updateProfile.isPending}
                onCheckedChange={(checked) =>
                  updateProfile.mutate(
                    { email_optin: checked },
                    {
                      onSuccess: () => toast.success(checked ? "Reminders on" : "Reminders off"),
                      onError: () => toast.error("Could not change that. Try again in a moment."),
                    },
                  )
                }
              />
            </label>
            <PushReminderToggle push={push} />
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function PushReminderToggle({ push }: { push: ReturnType<typeof usePushNotifications> }) {
  // Not offered at all until the server has VAPID keys — a switch that can
  // never work is worse than no switch.
  if (push.isLoading || !push.state || push.state === "unconfigured") return null;

  const busy = push.enable.isPending || push.disable.isPending;
  const note =
    push.state === "unsupported"
      ? "This browser can't receive push notifications. On iPhone, add Ascent to your home screen first."
      : push.state === "denied"
        ? "Notifications are blocked for this site. Allow them in your browser settings to turn this on."
        : "On a device with push on, reminders arrive there instead of by email.";

  return (
    <div className="mt-4 border-t border-border pt-4">
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span className="text-sm font-semibold">
          {push.state === "on" ? "Push on this device" : "Push on this device is off"}
        </span>
        <Switch
          checked={push.state === "on"}
          disabled={busy || push.state === "unsupported" || push.state === "denied"}
          onCheckedChange={(checked) =>
            (checked ? push.enable : push.disable).mutate(undefined, {
              onSuccess: () => toast.success(checked ? "Push reminders on" : "Push reminders off"),
              onError: (error) =>
                toast.error(error instanceof Error ? error.message : "Could not change that."),
            })
          }
        />
      </label>
      <p className="mt-1.5 text-xs text-chalk">{note}</p>
      {push.state === "on" ? (
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          disabled={push.test.isPending}
          onClick={() =>
            push.test.mutate(undefined, {
              onSuccess: ({ delivered }) =>
                delivered > 0
                  ? toast.success("Sent — it should appear in a few seconds")
                  : toast.error("The push service didn't accept it. Try turning push off and on."),
              onError: (error) =>
                toast.error(error instanceof Error ? error.message : "Could not send a test."),
            })
          }
        >
          {push.test.isPending ? "Sending…" : "Send a test"}
        </Button>
      ) : null}
    </div>
  );
}
