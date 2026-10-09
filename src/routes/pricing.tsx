import { seoHead } from "@/lib/seo";
import { QueryError } from "@/components/common/QueryError";
import { liveLessonCount } from "@/content/lessons";
import { AuthLink } from "@/components/common/AuthLink";
import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, CreditCard, Loader2, Lock, Minus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import {
  billingModeFn,
  billingPortalFn,
  startCheckoutFn,
  startTrialFn,
  switchToFreeFn,
} from "@/lib/billing.functions";
import { TRIAL_DAYS } from "@/lib/entitlements";
import { REFUND_DAYS } from "@/lib/company";
import { useEntitlements } from "@/hooks/useEntitlements";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/hooks/useLearner";
import { cn } from "@/lib/utils";
import { courses } from "@/content/curriculum";

export const Route = createFileRoute("/pricing")({
  head: () =>
    seoHead({
      path: "/pricing",
      title: "Ascent Pricing \u2014 Free, Pro & Lifetime Plans",
      description:
        "Compare Ascent Free, Pro and Lifetime plans for interactive learning, AI mentor support, portfolio projects and certificates. Start learning for free.",
    }),
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    plan?: "pro" | "lifetime";
    interval?: "monthly" | "yearly";
    checkout?: "success" | "cancelled";
  } => ({
    ...(search["plan"] === "pro" || search["plan"] === "lifetime" ? { plan: search["plan"] } : {}),
    ...(search["interval"] === "monthly" || search["interval"] === "yearly"
      ? { interval: search["interval"] }
      : {}),
    ...(search["checkout"] === "success" || search["checkout"] === "cancelled"
      ? { checkout: search["checkout"] }
      : {}),
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
      "10 AI mentor messages a month",
      "Streaks, XP and levels",
      "Basic progress tracking",
      "Community access",
      "Public profile with publication controls",
    ],
    missing: ["Mentor beyond 10 messages", "Portfolio projects", "Certificates"],
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
      `All ${courses.length} courses, every module`,
      "Unlimited practice and challenges",
      "AI mentor — 500 messages a month",
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
      "AI mentor — 500 messages a month, forever",
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
  {
    label: "Courses",
    free: "First module",
    pro: `All ${courses.length}`,
    lifetime: "All + future",
  },
  { label: "Practice tasks", free: "10 / month", pro: "Unlimited", lifetime: "Unlimited" },
  { label: "Coding challenges", free: "Limited", pro: "Unlimited", lifetime: "Unlimited" },
  { label: "AI mentor", free: "10 / month", pro: "500 / month", lifetime: "500 / month" },
  { label: "Portfolio projects", free: false, pro: true, lifetime: true },
  { label: "Project feedback", free: false, pro: true, lifetime: true },
  { label: "Certificates", free: false, pro: true, lifetime: true },
  { label: "Public profile", free: true, pro: true, lifetime: true },
  { label: "Community", free: true, pro: true, lifetime: true },
  { label: "Leaderboard", free: true, pro: true, lifetime: true },
];

function Pricing() {
  const { user } = useSession();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const billing = useQuery({ queryKey: ["billing-mode"], queryFn: () => billingModeFn() });
  const demo = billing.data?.provider === "mock";
  const profileQuery = useProfile();
  const { data: profile } = profileQuery;
  const qc = useQueryClient();
  const { trialing, trialUsed, trialDaysLeft } = useEntitlements();
  const [busy, setBusy] = useState(false);
  const [yearly, setYearly] = useState(search.interval !== "monthly");
  const [checkout, setCheckout] = useState<Plan | null>(() =>
    search.plan ? (plans.find((p) => p.id === search.plan) ?? null) : null,
  );
  const [stage, setStage] = useState<"form" | "processing" | "done">("form");

  const currentPlan = user ? ((profile?.plan ?? "free") as PlanId) : null;

  function priceOf(plan: Plan) {
    if (plan.once !== null) return { amount: plan.once, suffix: "once" };
    if (plan.monthly === 0) return { amount: 0, suffix: "forever" };
    return yearly
      ? { amount: Math.round((plan.yearly ?? 0) / 12), suffix: "per month, billed yearly" }
      : { amount: plan.monthly ?? 0, suffix: "per month" };
  }

  const refreshProfile = () => qc.invalidateQueries({ queryKey: ["profile", user?.id] });

  async function manageBilling() {
    setBusy(true);
    try {
      const result = await billingPortalFn();
      window.location.href = result.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Billing could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  async function beginTrial() {
    if (!user) {
      void navigate({ to: "/auth", search: { mode: "signup", returnTo: "/pricing" } });
      return;
    }
    setBusy(true);
    try {
      await startTrialFn();
      await refreshProfile();
      toast.success(`${TRIAL_DAYS} days of Pro, on the house`, {
        description: "No card needed. It drops back to Free on its own.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not start your trial.");
    } finally {
      setBusy(false);
    }
  }

  function startCheckout(plan: Plan) {
    if (!user) {
      void navigate({
        to: "/auth",
        search: {
          mode: "signup",
          returnTo: `/pricing?plan=${plan.id}&interval=${yearly ? "yearly" : "monthly"}`,
        },
      });
      return;
    }
    if (!demo && currentPlan && currentPlan !== "free") {
      void manageBilling();
      return;
    }
    if (plan.id === "free") {
      setBusy(true);
      switchToFreeFn()
        .then(refreshProfile)
        .then(() => toast.success("Switched to Free"))
        .catch(() => toast.error("We could not change your plan. Try again in a moment."))
        .finally(() => setBusy(false));
      return;
    }
    track("checkout_started", {
      plan: plan.id,
      billing: plan.once ? "once" : yearly ? "yearly" : "monthly",
    });
    setStage("form");
    setCheckout(plan);
  }

  async function confirmCheckout() {
    if (!checkout || !billing.data) return;
    if (!demo && currentPlan && currentPlan !== "free") {
      await manageBilling();
      return;
    }
    if (!user) {
      startCheckout(checkout);
      return;
    }
    setStage("processing");
    try {
      // With PAYMENTS_PROVIDER=stripe this returns a hosted checkout URL; in
      // mock mode the server has already applied the plan.
      const result = await startCheckoutFn({
        data: {
          plan: checkout.id === "lifetime" ? "lifetime" : "pro",
          interval: checkout.once ? "once" : yearly ? "yearly" : "monthly",
        },
      });

      if (result.kind === "redirect") {
        window.location.href = result.url;
        return;
      }

      await refreshProfile();
      track("checkout_completed", {
        plan: checkout.id,
        billing: checkout.once ? "once" : yearly ? "yearly" : "monthly",
        mock: true,
      });
      setStage("done");
      toast.success(`You're on ${checkout.name}`, {
        description: "No card was charged — this is a demo checkout.",
      });
    } catch (error) {
      setStage("form");
      toast.error(
        error instanceof Error ? error.message : "We could not start checkout. Try again shortly.",
      );
    }
  }

  return (
    <AppShell>
      {billing.isError ? (
        <QueryError
          title="Checkout availability could not be loaded"
          retry={() => billing.refetch()}
          busy={billing.isFetching}
        />
      ) : null}
      {profileQuery.isError ? (
        <QueryError
          title="Your current plan could not be loaded"
          retry={() => profileQuery.refetch()}
        />
      ) : null}
      {search.checkout === "success" ? (
        <p role="status" className="mb-5 rounded-xl bg-brand/10 p-4">
          Payment submitted. Your plan will update after payment confirmation.{" "}
          <button className="underline" onClick={() => void refreshProfile()}>
            Refresh plan status
          </button>
        </p>
      ) : null}
      {search.checkout === "cancelled" ? (
        <p role="status" className="mb-5 rounded-xl bg-secondary p-4">
          Checkout cancelled. You can continue on your current plan.
        </p>
      ) : null}
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Start free. Upgrade when the mentor starts earning its keep.
        </h1>
        <p className="mt-3 text-chalk">
          Free has no time limit. An optional Pro trial lasts 14 days, needs no card, and returns to
          Free automatically.
        </p>
      </header>

      {user && !trialUsed ? (
        <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-3 rounded-2xl bg-brand/10 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-foreground">
            Try Pro free for {TRIAL_DAYS} days — no card, cancels itself.
          </p>
          <Button size="sm" onClick={beginTrial} disabled={busy}>
            Start free trial
          </Button>
        </div>
      ) : null}
      {trialing ? (
        <div className="mx-auto mt-6 max-w-2xl rounded-2xl bg-ember/10 px-5 py-4 text-center text-sm font-semibold text-ember">
          {trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"} left of your Pro trial.
        </div>
      ) : null}

      <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-chalk">
        {courses.filter((course) => liveLessonCount(course) > 0).length} courses have lessons
        available today. Planned lessons are labeled in each curriculum. All prices are USD.
      </p>
      {user && !demo && currentPlan !== "free" ? (
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={manageBilling} disabled={busy || !billing.data}>
            Manage billing or cancel
          </Button>
          <p className="mt-2 text-xs text-chalk">
            Manage renewal and cancellation securely in Stripe. Access changes after confirmation
            from Stripe.
          </p>
        </div>
      ) : null}
      {/* Billing toggle */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full bg-card p-1 ring-1 ring-border">
          <button
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              !yearly ? "bg-ink text-white" : "text-chalk hover:text-foreground",
            )}
          >
            Monthly
          </button>
          <button
            aria-pressed={yearly}
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
                    ${price.amount} USD
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
                disabled={
                  isCurrent ||
                  busy ||
                  !billing.data ||
                  profileQuery.isLoading ||
                  profileQuery.isError
                }
                onClick={() => startCheckout(plan)}
              >
                {isCurrent
                  ? "Your current plan"
                  : plan.id === "free"
                    ? user
                      ? demo
                        ? "Switch to Free"
                        : "Manage cancellation"
                      : "Start free"
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
            <AuthLink mode="signup">Start free</AuthLink>
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
        open={Boolean(checkout) && Boolean(user)}
        onOpenChange={(open) => {
          if (!open && stage !== "processing") setCheckout(null);
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
                  {demo
                    ? "Demo checkout: no payment or card details are required."
                    : "Continue to secure Stripe checkout to review the final amount and enter payment details. No payment is taken on this screen."}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl bg-secondary p-4 ring-1 ring-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-chalk">
                    {checkout?.name}
                    {checkout?.once ? " · one-time" : yearly ? " · yearly" : " · monthly"}
                  </span>
                  <span className="font-display text-lg font-bold">
                    ${checkout?.once ?? (yearly ? checkout?.yearly : checkout?.monthly)} USD
                  </span>
                </div>
              </div>

              <p className="text-sm text-chalk">
                {checkout?.once
                  ? "One payment for access while Ascent operates."
                  : `Pro renews ${yearly ? "yearly" : "monthly"} until cancelled.`}{" "}
                {demo
                  ? "This demo changes your account access only."
                  : "Review any applicable tax and the total on Stripe before paying."}
              </p>
              <p className="text-sm text-chalk">
                Free retains your completed lessons and issued certificates. New Pro lessons and
                project submissions require paid access or an active trial.
              </p>
              <p className="text-sm text-chalk">
                Full refund within {REFUND_DAYS} days of any payment, no questions asked. See the{" "}
                <Link to="/terms" className="font-semibold text-foreground hover:underline">
                  Terms of Service
                </Link>
                .
              </p>

              <Button
                size="lg"
                className="w-full"
                onClick={confirmCheckout}
                disabled={stage === "processing" || !billing.data || billing.isError}
              >
                {stage === "processing" ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 size-4" />{" "}
                    {demo ? "Activate demo plan" : "Continue to Stripe"}
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-chalk">
                {demo
                  ? "Demo only — nothing will be charged."
                  : "Payment details are entered only on Stripe."}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
