/**
 * First-party event tracking.
 *
 * `track()` is fire-and-forget: it never throws, never blocks a click, and
 * no-ops during SSR. Nothing in the product should ever fail because analytics
 * failed — a dropped event is always cheaper than a broken interaction.
 *
 * Events are appended to `public.analytics_events`, which the app can write but
 * not read; query them with the service role (see supabase/analytics-queries.sql).
 *
 * Trust model: these are client-side writes, so the numbers are honest about
 * real usage but not tamper-proof. `lesson_completed` is the exception — the
 * server records that one itself in src/lib/learning.functions.ts, so the
 * completion funnel can't be inflated from a console.
 */
import { supabase } from "@/integrations/supabase/client";

export const ANON_ID_KEY = "ascent.aid";

export type EventName =
  | "pageview"
  | "signed_up"
  | "signed_in"
  | "onboarding_completed"
  | "path_chosen"
  | "lesson_started"
  | "lesson_coming_soon_viewed"
  | "challenge_run"
  | "mentor_opened"
  | "mentor_message_sent"
  | "project_submitted"
  | "checkout_started"
  | "checkout_completed"
  | "placement_completed"
  | "push_enabled"
  | "push_disabled"
  // Written server-side only (reengagement.server.ts, review.functions.ts);
  // listed here so the event vocabulary lives in one place.
  | "review_completed"
  | "reengagement_sent"
  | "reengagement_unsubscribed";

type Props = Record<string, string | number | boolean | null>;

function anonId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = window.localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    // Private mode or storage disabled — the event still lands, just without a
    // thread back to this visitor's earlier steps.
    return null;
  }
}

export function track(name: EventName, props: Props = {}): void {
  if (typeof window === "undefined") return;

  void (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      await supabase.from("analytics_events").insert({
        user_id: data.session?.user.id ?? null,
        anon_id: anonId(),
        name,
        props,
        path: window.location.pathname,
      });
    } catch {
      /* analytics must never surface to the learner */
    }
  })();
}
