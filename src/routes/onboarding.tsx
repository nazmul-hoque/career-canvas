import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useLearner";
import { careerPaths } from "@/content/curriculum";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Personalise your roadmap — Ascent" },
      {
        name: "description",
        content: "Answer four quick questions and Ascent builds a learning plan around your goal, level and weekly time.",
      },
      { property: "og:title", content: "Personalise your roadmap — Ascent" },
      { property: "og:description", content: "Four questions, one roadmap built around your goal." },
    ],
  }),
  component: Onboarding,
});

const goals = [
  { id: "first-job", label: "Get my first tech job", note: "Portfolio-first roadmap with interview prep" },
  { id: "switch", label: "Change careers", note: "Fastest credible route from where you are now" },
  { id: "level-up", label: "Improve my current skills", note: "Deeper practice on the parts you already touch" },
  { id: "projects", label: "Build projects", note: "Heavier on briefs, lighter on theory" },
  { id: "fun", label: "Learn for fun", note: "Short sessions, no pressure, keep the streak" },
];

const levels = [
  { id: "none", label: "Complete beginner", note: "I have never written code" },
  { id: "some", label: "Some exposure", note: "Tutorials, a course or two" },
  { id: "working", label: "Working knowledge", note: "I build things, with a lot of searching" },
  { id: "pro", label: "Professional", note: "I do this at work already" },
];

const hours = [3, 5, 8, 12, 20];

function OptionCard({
  selected,
  title,
  note,
  onClick,
}: {
  selected: boolean;
  title: string;
  note?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-all",
        selected
          ? "border-brand shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_18%,transparent)]"
          : "border-border hover:-translate-y-0.5 hover:border-brand/40",
      )}
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border",
          selected ? "border-brand bg-brand text-brand-foreground" : "border-border",
        )}
      >
        {selected ? <Check className="size-3" /> : null}
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        {note ? <span className="block text-xs text-chalk">{note}</span> : null}
      </span>
    </button>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const { user, isLoading } = useSession();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [weekly, setWeekly] = useState<number | null>(null);

  if (!isLoading && !user) {
    return (
      <Shell>
        <div className="card-surface p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Create an account first</h1>
          <p className="mt-2 text-sm text-chalk">Your roadmap is saved to your profile, so we need you signed in.</p>
          <Button asChild className="mt-6">
            <Link to="/auth">Sign in or sign up</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const steps = [
    {
      title: "What do you want to achieve?",
      subtitle: "This sets the shape of your roadmap, not just the content.",
      valid: Boolean(goal),
      body: (
        <div className="grid gap-3">
          {goals.map((g) => (
            <OptionCard key={g.id} selected={goal === g.id} title={g.label} note={g.note} onClick={() => setGoal(g.id)} />
          ))}
        </div>
      ),
    },
    {
      title: "Where are you starting from?",
      subtitle: "Be honest — we adjust pacing, not respect.",
      valid: Boolean(experience),
      body: (
        <div className="grid gap-3">
          {levels.map((l) => (
            <OptionCard
              key={l.id}
              selected={experience === l.id}
              title={l.label}
              note={l.note}
              onClick={() => setExperience(l.id)}
            />
          ))}
        </div>
      ),
    },
    {
      title: "Which career are you aiming at?",
      subtitle: "You can switch later without losing progress.",
      valid: Boolean(path),
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          {careerPaths.map((p) => (
            <OptionCard key={p.id} selected={path === p.id} title={p.name} note={p.tagline} onClick={() => setPath(p.id)} />
          ))}
        </div>
      ),
    },
    {
      title: "How many hours a week can you really give?",
      subtitle: "We size your daily goal from this. Under-promise and keep the streak.",
      valid: Boolean(weekly),
      body: (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {hours.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setWeekly(h)}
              className={cn(
                "rounded-2xl border bg-card px-4 py-6 text-center transition-all",
                weekly === h
                  ? "border-brand shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_18%,transparent)]"
                  : "border-border hover:-translate-y-0.5 hover:border-brand/40",
              )}
            >
              <span className="block font-display text-2xl font-bold">{h}</span>
              <span className="text-xs text-chalk">hours / week</span>
            </button>
          ))}
        </div>
      ),
    },
  ];

  const current = steps[step]!;

  async function finish() {
    try {
      await update.mutateAsync({
        goal,
        experience,
        career_path: path,
        hours_per_week: weekly,
        onboarded: true,
        display_name: profile?.display_name ?? "Learner",
      });
      toast.success("Roadmap ready", { description: "Your dashboard is personalised." });
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Could not save your answers. Try again.");
    }
  }

  return (
    <Shell>
      <div className="mb-8">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-brand" : "bg-line")}
            />
          ))}
        </div>
        <p className="eyebrow mt-3">
          Step {step + 1} of {steps.length}
        </p>
      </div>

      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{current.title}</h1>
      <p className="mt-2 text-chalk">{current.subtitle}</p>

      <div className="mt-8 animate-rise">{current.body}</div>

      <div className="mt-10 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        {step === steps.length - 1 ? (
          <Button onClick={finish} disabled={!current.valid || update.isPending} size="lg">
            {update.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Build my roadmap
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!current.valid} size="lg">
            Continue
          </Button>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-10">
          <Wordmark />
        </div>
        {children}
      </div>
    </div>
  );
}
