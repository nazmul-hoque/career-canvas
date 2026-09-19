-- A minimal first-party event log. No vendor, no SDK, no cookie banner: one
-- append-only table the app writes to and only the service role can read.
--
-- Until now nothing about how people used Ascent was measurable — activation,
-- the lesson funnel and D1/D7 retention were all guesswork. Ready-made queries
-- for those live in supabase/analytics-queries.sql.

CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Null for signed-out visitors; SET NULL on delete so the funnel survives an
  -- account deletion without keeping a pointer to the person.
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  -- Per-browser id, so a visitor's pre-signup steps join to their signup.
  anon_id TEXT,
  name TEXT NOT NULL,
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX analytics_events_name_time_idx ON public.analytics_events (name, created_at DESC);
CREATE INDEX analytics_events_user_time_idx ON public.analytics_events (user_id, created_at DESC);
CREATE INDEX analytics_events_anon_time_idx ON public.analytics_events (anon_id, created_at DESC);

-- Write-only from the app: everyone may append, nobody may read back. Without
-- this asymmetry the table would be a log of every learner's activity readable
-- by every other learner.
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_events_append" ON public.analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
