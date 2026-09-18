-- Web push reminders.
--
-- Email reaches a learner at their desk; the streak breaks wherever they are.
-- A push subscription is one browser on one device that agreed to be notified,
-- so a learner can have several, and each can die on its own (permission
-- revoked, browser data cleared) — the job deletes those when the push service
-- says 404/410.

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  -- The push service URL is the identity of a subscription. Unique so that a
  -- shared browser that signs in as someone else moves to them rather than
  -- notifying both.
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_success_at TIMESTAMPTZ
);

-- Written through server functions only: the endpoint is a capability to
-- notify a device, and upserting it across accounts needs the service role.
-- The learner may see which of their own devices are subscribed.
GRANT SELECT ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_subscriptions_read_own" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX push_subscriptions_user_idx ON public.push_subscriptions (user_id);

-- The send ledger now records which channel a nudge went out on. The daily
-- dedupe is per channel, so the database still refuses a second push or a
-- second email of the same kind on the same day.
ALTER TABLE public.reengagement_sends ADD COLUMN channel TEXT NOT NULL DEFAULT 'email';
ALTER TABLE public.reengagement_sends DROP CONSTRAINT IF EXISTS reengagement_sends_user_id_kind_day_key;
ALTER TABLE public.reengagement_sends ADD CONSTRAINT reengagement_sends_user_kind_day_channel_key
  UNIQUE (user_id, kind, day, channel);
