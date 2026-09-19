-- Re-engagement email.
--
-- A streak mechanic with no way to reach the learner does not retain anyone:
-- the reminder has to arrive where they are, not where they already stopped
-- going. This adds the consent flag, and a ledger of what was sent so nobody
-- can be mailed the same nudge twice.

-- Opt-out, not opt-in: transactional learning reminders for an account the
-- learner created. Every email carries a signed unsubscribe link that flips it.
ALTER TABLE public.profiles ADD COLUMN email_optin BOOLEAN NOT NULL DEFAULT true;

-- The learner may change their own preference from the app; every other column
-- in this list is unchanged from 20260916200000.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  display_name, bio, avatar_url, career_path, goal, experience, hours_per_week, onboarded,
  email_optin, updated_at
) ON public.profiles TO authenticated;

CREATE TABLE public.reengagement_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  -- 'streak_at_risk' | 'dormant_7d' | 'dormant_30d'
  kind TEXT NOT NULL,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  provider TEXT NOT NULL DEFAULT 'mock',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One nudge of a kind per learner per day, enforced by the database rather
  -- than by the job being careful.
  UNIQUE (user_id, kind, day)
);
-- Server-only: the learner never reads or writes their own send log, and the
-- job runs with the service role.
GRANT ALL ON public.reengagement_sends TO service_role;
ALTER TABLE public.reengagement_sends ENABLE ROW LEVEL SECURITY;

CREATE INDEX reengagement_sends_recent_idx ON public.reengagement_sends (user_id, created_at DESC);
