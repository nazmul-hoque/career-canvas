import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MailX, Check } from "lucide-react";
import { z } from "zod";
import { Wordmark } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { unsubscribeFn } from "@/lib/reengagement.functions";

const searchSchema = z.object({
  u: z.string().optional(),
  t: z.string().optional(),
});

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Unsubscribe — Ascent" },
      { name: "description", content: "Stop receiving learning reminders from Ascent." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Unsubscribe,
});

function Unsubscribe() {
  const { u, t } = Route.useSearch();
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const linkComplete = Boolean(u && t);

  async function confirm() {
    if (!u || !t) return;
    setState("working");
    try {
      await unsubscribeFn({ data: { userId: u, token: t } });
      setState("done");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "We couldn't process that. Try again shortly.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <Link to="/">
          <Wordmark />
        </Link>

        <div className="card-surface mt-10 p-8 sm:p-10">
          <div className="grid size-14 place-items-center rounded-2xl bg-secondary text-chalk">
            {state === "done" ? <Check className="size-7" /> : <MailX className="size-7" />}
          </div>

          {state === "done" ? (
            <>
              <h1 className="mt-5 font-display text-2xl font-bold">You're unsubscribed</h1>
              <p className="mt-2 text-sm text-chalk">
                No more learning reminders. Your account, progress and streak are untouched — this
                only stops the email. You can turn reminders back on from your profile whenever you
                want.
              </p>
              <Button asChild className="mt-7">
                <Link to="/dashboard">Back to your dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="mt-5 font-display text-2xl font-bold">
                Stop Ascent's learning reminders?
              </h1>
              <p className="mt-2 text-sm text-chalk">
                {linkComplete
                  ? "You'll still get account email — password resets and receipts — but no streak or roadmap nudges."
                  : "This link is missing part of its address. Open the unsubscribe link from the email again, or turn reminders off from your profile."}
              </p>
              {state === "error" ? (
                <p className="mt-3 text-sm font-semibold text-destructive">{message}</p>
              ) : null}
              <div className="mt-7 flex flex-wrap gap-2">
                <Button onClick={confirm} disabled={!linkComplete || state === "working"}>
                  {state === "working" ? "Working…" : "Yes, unsubscribe me"}
                </Button>
                <Button asChild variant="outline">
                  <Link to="/dashboard">Keep them</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
