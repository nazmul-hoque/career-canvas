-- Plan enforcement, trials, and certificates that survive a downgrade.

-- A card-free trial: `trial_ends_at` in the future means the learner gets Pro
-- while `plan` stays 'free'. Non-null also means the trial has been used, so
-- nobody gets a second one.
ALTER TABLE public.profiles ADD COLUMN trial_ends_at TIMESTAMPTZ;

-- `plan` is money. It was client-writable only because checkout was a mock
-- dialog; now every plan change goes through a server function (mock mode
-- included), so the browser loses the grant either way.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  display_name, bio, avatar_url, career_path, goal, experience, hours_per_week, onboarded,
  updated_at
) ON public.profiles TO authenticated;
-- INSERT keeps its column list from 20260916120000 minus `plan`, for the same
-- reason: a fresh row must never arrive pre-upgraded.
REVOKE INSERT ON public.profiles FROM authenticated;
GRANT INSERT (
  id, display_name, bio, avatar_url, career_path, goal, experience, hours_per_week, onboarded
) ON public.profiles TO authenticated;

-- A certificate is earned, not rented. Once issued it stays valid even if the
-- subscription lapses, so issuance is recorded rather than recomputed from the
-- learner's current plan.
CREATE TABLE public.issued_certificates (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  path_id TEXT NOT NULL,
  certificate_id TEXT NOT NULL,
  plan_at_issue TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, path_id)
);
-- Public read: a certificate nobody else can verify is not a credential.
GRANT SELECT ON public.issued_certificates TO anon, authenticated;
GRANT ALL ON public.issued_certificates TO service_role;
ALTER TABLE public.issued_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issued_certificates_read" ON public.issued_certificates FOR SELECT USING (true);

CREATE INDEX issued_certificates_lookup_idx ON public.issued_certificates (certificate_id);
