-- Submission is private by default, including existing work. Publishing is an
-- explicit server action; public readers receive only the chosen case study.
ALTER TABLE public.project_submissions
  ADD COLUMN is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN public_summary text NOT NULL DEFAULT '';

DROP POLICY IF EXISTS project_submissions_read ON public.project_submissions;
REVOKE ALL ON public.project_submissions FROM anon;
REVOKE INSERT, UPDATE ON public.project_submissions FROM authenticated;

-- Deliberately owner-executed: underlying rows are private. A fixed filter and
-- column projection expose no submission notes or feedback, even to logged-in readers.
CREATE VIEW public.public_portfolio_projects WITH (security_barrier = true) AS
  SELECT user_id, project_id, status, repo_url, live_url, public_summary, is_published
  FROM public.project_submissions WHERE is_published = true;
REVOKE ALL ON public.public_portfolio_projects FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_portfolio_projects TO anon, authenticated;
GRANT ALL ON public.public_portfolio_projects TO service_role;

CREATE TABLE public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 10 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, reporter_id)
);
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_reports FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.community_reports TO authenticated;
GRANT ALL ON public.community_reports TO service_role;
CREATE POLICY reports_insert_own ON public.community_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND status = 'open');
CREATE POLICY reports_read_own ON public.community_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
