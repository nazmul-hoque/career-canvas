import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, CreditCard, Loader2, Lock, Minus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { StatPill } from "@/components/common/StatPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useLearner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Ascent" },
      {
        name: "description",
        content:
          "Free, Pro and Lifetime plans. All courses, unlimited practice, the AI mentor, portfolio projects and certificates — monthly or yearly.",
      },
      { property: "og:title", content: "Pricing — Ascent" },
      {
        property: "og:description",
        content: "Start free. Upgrade when the AI mentor starts paying for itself.",
      },
    ],
  }),
  component: Pricing,
});

type PlanId = "free" | "pro" | "lifetime";

interface Plan {
  id: PlanId;
  name: string;
  blurb: string;
  monthly: number | null;
  yearly: number | null;
  once: number | null;
  features: string[];
  missing: string[];
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    blurb: "Enough to find out whether this actually suits how you learn.",
    monthly: 0,
    yearly: 0,
    once: null,
    features: [
      "First module of every course",
      "10 practice tasks a month",
      "Streaks, XP and levels",
      "Basic progress tracking",
      "Community access",
    ],
    missing: ["AI mentor", "Portfolio projects", "Certificates"],
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "Everything unlocked, including the mentor that makes challenges survivable.",
    monthly: 19,
    yearly: 168,
    once: null,
    recommended: true,
    features: [
      "All 15 courses, every module",
      "Unlimited practice and challenges",
      "AI mentor on every lesson",
      "All 8 portfolio projects with feedback",
      "Career path certificates",
      "Public portfolio profile",
      "Priority community answers",
    ],
    missing: [],
  },
  {
    id: "lifetime",
    name: "Lifetime",
    blurb: "One payment. Everything now, and everything we add later.",
    monthly: null,
    yearly: null,
    once: 449,
    features: [
      "Everything in Pro, permanently",
      "All future courses and paths",
      "Unlimited AI mentor usage",
      "All projects and certificates",
      "Early access to new paths",
    ],
    missing: [],
  },
];

const comparison: {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  lifetime: string | boolean;
}[] = [
  { label: "Courses", free: "First module", pro: "All 15", lifetime: "All + future" },
  { label: "Practice tasks", free: "10 / month", pro: "Unlimited", lifetime: "Unlimited" },
  { label: "Coding challenges", free: "Limited", pro: "Unlimited", lifetime: "Unlimited" },
  { label: "AI mentor", free: false, pro: true, lifetime: true },
  { label: "Portfolio projects", free: false, pro: true, lifetime: true },
  { label: "Project feedback", free: false, pro: true, lifetime: true },
  { label: "Certificates", free: false, pro: true, lifetime: true },
  { label: "Public profile", free: false, pro: true, lifetime: true },
  { label: "Community", free: true, pro: true, lifetime: true },
  { label: "Leaderboard", free: true, pro: true, lifetime: true },
];

function Pricing() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [yearly, setYearly] = useState(true);
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [stage, setStage] = useState<"form" | "processing" | "done">("form");

  const currentPlan = user ? ((profile?.plan ?? "free") as PlanId) : null;

  function priceOf(plan: Plan) {
    if (plan.once !== null) return { amount: plan.once, suffix: "once" };
    if (plan.monthly === 0) return { amount: 0, suffix: "forever" };
    return yearly
      ? { amount: Math.round((plan.yearly ?? 0) / 12), suffix: "per month, billed yearly" }
      : { amount: plan.monthly ?? 0, suffix: "per month" };
  }

  function startCheckout(plan: Plan) {
    if (!user) {
      toast.info("Create an account first", { description: "Takes about twenty seconds." });
      return;
    }
    if (plan.id === "free") {
      updateProfile.mutate(
        { plan: "free" },
        { onSuccess: () => toast.success("Switched to Free") },
      );
      return;
    }
    setStage("form");
    setCheckout(plan);
  }

  function confirmCheckout() {
    if (!checkout) return;
    setStage("processing");
    // Mock payment. Replace this timeout with a real Stripe/Paddle session.
    window.setTimeout(() => {
      updateProfile.mutate(
        { plan: checkout.id },
        {
          onSuccess: () => {
            setStage("done");
            toast.success(`You're on ${checkout.name}`, {
              description: "No card was charged — this is a demo checkout.",
            });
          },
          onError: () => {
            setStage("form");
            toast.error("We could not update your plan. Try again in a moment.");
          },
        },
      );
    }, 1400);
  }

  return (
    <AppShell>
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Start free. Upgrade when the mentor starts earning its keep.
        </h1>
        <p className="mt-3 text-chalk">
          No trial countdown, no card to cancel. The free plan stays useful — it just stops before
          the parts that cost us money to run.
        </p>
      </header>

      {/* Billing toggle */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full bg-card p-1 ring-1 ring-border">
          <button
            onClick={() => setYearly(false)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              !yearly ? "bg-ink text-white" : "text-chalk hover:text-foreground",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              yearly ? "bg-ink text-white" : "text-chalk hover:text-foreground",
            )}
          >
            Yearly
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                yearly ? "bg-brand text-brand-foreground" : "bg-brand/10 text-brand",
              )}
            >
              Save 26%
            </span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="mt-8 grid items-start gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = priceOf(plan);
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "card-surface flex flex-col p-7",
                plan.recommended && "ring-2 ring-brand lg:-mt-3 lg:pb-10 lg:pt-10",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">{plan.name}</h2>
                {plan.recommended ? (
                  <StatPill tone="brand">
                    <Sparkles className="size-3" /> Recommended
                  </StatPill>
                ) : null}
                {isCurrent ? <StatPill>Current</StatPill> : null}
              </div>

              <p className="mt-2 text-sm leading-relaxed text-chalk">{plan.blurb}</p>

              <div className="mt-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-bold tracking-tight">
                    ${price.amount}
                  </span>
                  <span className="text-sm font-semibold text-chalk">{price.suffix}</span>
                </div>
                {plan.id === "pro" && yearly ? (
                  <p className="mt-1 text-xs text-chalk">${plan.yearly} billed once a year</p>
                ) : null}
              </div>

              <Button
                className="mt-6 w-full"
                size="lg"
                variant={plan.recommended ? "default" : "outline"}
                disabled={isCurrent || updateProfile.isPending}
                onClick={() => startCheckout(plan)}
              >
                {isCurrent
                  ? "Your current plan"
                  : plan.id === "free"
                    ? "Switch to Free"
                    : `Get ${plan.name}`}
              </Button>

              <ul className="mt-7 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span>{f}</span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-chalk/70">
                    <Minus className="mt-0.5 size-4 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {!user ? (
        <div className="card-surface mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-sm text-chalk">
            Create a free account first — you can upgrade from inside the app any time.
          </p>
          <Button asChild size="sm">
            <Link to="/auth">Start free</Link>
          </Button>
        </div>
      ) : null}

      {/* Comparison */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold tracking-tight">Line by line</h2>
        <div className="card-surface mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-chalk">
                  Feature
                </th>
                {plans.map((p) => (
                  <th
                    key={p.id}
                    className={cn(
                      "px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider",
                      p.recommended ? "text-brand" : "text-chalk",
                    )}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5 text-sm font-semibold">{row.label}</td>
                  {(["free", "pro", "lifetime"] as const).map((key) => {
                    const v = row[key];
                    return (
                      <td key={key} className="px-5 py-3.5 text-center text-sm">
                        {v === true ? (
                          <Check className="mx-auto size-4 text-brand" />
                        ) : v === false ? (
                          <Minus className="mx-auto size-4 text-chalk/40" />
                        ) : (
                          <span className="text-chalk">{v}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-12 grid gap-5 md:grid-cols-2">
        {[
          {
            q: "Is the free plan time-limited?",
            a: "No. It's feature-limited, not trial-limited. You can stay on it indefinitely and still keep your streak, XP and community access.",
          },
          {
            q: "What does the AI mentor actually do?",
            a: "It reads your submitted code, points at the line that's wrong and asks you a question about it. It won't hand you the answer — that's the point.",
          },
          {
            q: "Do I keep my certificates if I downgrade?",
            a: "Yes. Certificates are issued against lessons you completed, and completed lessons don't expire.",
          },
          {
            q: "Is Lifetime really lifetime?",
            a: "For as long as Ascent runs, including paths we haven't built yet. It's the right call if you expect to be learning here for more than two years.",
          },
        ].map((item) => (
          <div key={item.q} className="card-surface p-6">
            <h3 className="font-display text-lg font-bold">{item.q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-chalk">{item.a}</p>
          </div>
        ))}
      </section>

      {/* Mock checkout */}
      <Dialog
        open={Boolean(checkout)}
        onOpenChange={(open) => {
          if (!open) setCheckout(null);
        }}
      >
        <DialogContent>
          {stage === "done" ? (
            <div className="py-4 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/12 text-brand">
                <Check className="size-6" />
              </div>
              <DialogHeader className="mt-4">
                <DialogTitle className="text-center">You're on {checkout?.name}</DialogTitle>
                <DialogDescription className="text-center">
                  Nothing was charged — this is a demo checkout. Every course, project and the AI
                  mentor are unlocked on your account.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 flex justify-center gap-2">
                <Button asChild>
                  <Link to="/dashboard">Back to dashboard</Link>
                </Button>
                <Button variant="outline" onClick={() => setCheckout(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Checkout — {checkout?.name}</DialogTitle>
                <DialogDescription>
                  This is a mock checkout. No payment is processed and no card details are stored or
                  sent anywhere.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl bg-secondary p-4 ring-1 ring-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-chalk">
                    {checkout?.name}
                    {checkout?.once ? " · one-time" : yearly ? " · yearly" : " · monthly"}
                  </span>
                  <span className="font-display text-lg font-bold">
                    ${checkout?.once ?? (yearly ? checkout?.yearly : checkout?.monthly)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="card">Card number</Label>
                  <div className="relative mt-1.5">
                    <CreditCard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-chalk" />
                    <Input
                      id="card"
                      className="pl-9"
                      placeholder="4242 4242 4242 4242"
                      disabled={stage === "processing"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="exp">Expiry</Label>
                    <Input
                      id="exp"
                      className="mt-1.5"
                      placeholder="12 / 30"
                      disabled={stage === "processing"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      className="mt-1.5"
                      placeholder="123"
                      disabled={stage === "processing"}
                    />
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={confirmCheckout}
                disabled={stage === "processing"}
              >
                {stage === "processing" ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 size-4" /> Complete demo purchase
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-chalk">
                Demo only — type anything you like in the fields above.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
