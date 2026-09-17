import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Ascent" },
      { name: "description", content: "Free to start. Pro unlocks every course, unlimited practice, the AI mentor, projects and certificates." },
      { property: "og:title", content: "Pricing — Ascent" },
      { property: "og:description", content: "Free to start. Pro unlocks everything. Lifetime pays once." },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    id: "free",
    name: "Base camp",
    blurb: "Get moving today, no card needed.",
    monthly: 0,
    yearly: 0,
    features: [
      "3 courses of your choice",
      "10 practice tasks per month",
      "Basic progress tracking",
      "Community access (read only)",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "Everything you need to get job-ready.",
    monthly: 19,
    yearly: 182,
    recommended: true,
    features: [
      "Every course and career path",
      "Unlimited practice and challenges",
      "AI Mentor on every lesson",
      "All portfolio projects with reviews",
      "Certificates for completed paths",
      "Full community and leaderboard",
    ],
  },
  {
    id: "lifetime",
    name: "Lifetime",
    blurb: "One payment. Everything, forever.",
    monthly: 399,
    yearly: 399,
    features: [
      "All current and future courses",
      "Unlimited AI Mentor usage",
      "Every project and certificate",
      "Priority project reviews",
      "Lifetime updates",
    ],
  },
];

function Pricing() {
  const [yearly, setYearly] = useState(true);
  const [checkout, setCheckout] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const plan = plans.find((p) => p.id === checkout);

  async function pay() {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setProcessing(false);
    setCheckout(null);
    toast.success("Demo checkout complete", {
      description: "No payment was taken — this flow is a mock for now.",
    });
  }

  return (
    <AppShell>
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Pay for the climb, not the brochure
        </h1>
        <p className="mt-3 text-chalk">Cancel whenever. Your progress, projects and certificates stay yours.</p>

        <div className="mt-7 inline-flex items-center gap-1 rounded-full bg-secondary p-1">
          {[
            { id: false, label: "Monthly" },
            { id: true, label: "Yearly · save 20%" },
          ].map((opt) => (
            <button
              key={String(opt.id)}
              onClick={() => setYearly(opt.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                yearly === opt.id ? "bg-background shadow-sm" : "text-chalk",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {plans.map((p) => {
          const price = p.id === "lifetime" ? p.monthly : yearly ? Math.round(p.yearly / 12) : p.monthly;
          return (
            <section
              key={p.id}
              className={cn(
                "flex flex-col p-7",
                p.recommended ? "ink-surface rounded-[18px] text-white" : "card-surface",
              )}
            >
              {p.recommended ? (
                <span className="mb-4 self-start rounded-full bg-ember px-2.5 py-1 text-[11px] font-bold text-white">
                  Most chosen
                </span>
              ) : null}
              <h2 className="font-display text-xl font-bold">{p.name}</h2>
              <p className={cn("mt-1 text-sm", p.recommended ? "text-white/70" : "text-chalk")}>{p.blurb}</p>
              <p className="mt-6 font-display text-4xl font-bold">
                ${price}
                <span className={cn("text-base font-semibold", p.recommended ? "text-white/60" : "text-chalk")}>
                  {p.id === "lifetime" ? " once" : "/mo"}
                </span>
              </p>
              {p.id !== "lifetime" && yearly && p.yearly > 0 ? (
                <p className={cn("mt-1 text-xs", p.recommended ? "text-white/60" : "text-chalk")}>
                  ${p.yearly} billed yearly
                </p>
              ) : null}
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={cn("mt-0.5 size-4 shrink-0", p.recommended ? "text-brand" : "text-brand")} />
                    {f}
                  </li>
                ))}
              </ul>
              {p.id === "free" ? (
                <Button asChild variant="outline" className="mt-7">
                  <Link to="/auth">Start free</Link>
                </Button>
              ) : (
                <Button
                  className="mt-7"
                  variant={p.recommended ? "secondary" : "default"}
                  onClick={() => setCheckout(p.id)}
                >
                  Choose {p.name}
                </Button>
              )}
            </section>
          );
        })}
      </div>

      <Dialog open={Boolean(checkout)} onOpenChange={(open) => !open && setCheckout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout · {plan?.name}</DialogTitle>
            <DialogDescription>
              This is a demo. No card is charged and nothing is stored.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name on card" />
            <Input placeholder="4242 4242 4242 4242" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="MM / YY" />
              <Input placeholder="CVC" />
            </div>
          </div>
          <Button onClick={pay} disabled={processing} className="w-full">
            {processing ? <Loader2 className="size-4 animate-spin" /> : null}
            Pay {plan?.id === "lifetime" ? "$399" : yearly ? `$${plan?.yearly}` : `$${plan?.monthly}`}
          </Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
