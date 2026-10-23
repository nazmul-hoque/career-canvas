-- "Report a problem" from inside a lesson.
--
-- Written only by reportLessonProblemFn (service role), which caps how many a
-- learner can file a day; the browser may read back its own reports and
-- nothing else. The code and last test run are captured with the report rather
-- than described by the learner, because a grader bug can't be reproduced from
-- "my solution was right".

CREATE TABLE public.lesson_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  lesson_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('grader', 'content', 'broken', 'other')),
  -- A grader report can stand on its captured code alone; anything else needs words.
  message text NOT NULL CHECK (
    length(message) <= 2000 AND (kind = 'grader' OR length(trim(message)) >= 10)
  ),
  code text CHECK (length(code) <= 50000),
  -- The last run, the learner's own answers and verdicts, browser and viewport.
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lesson_reports_status_idx ON public.lesson_reports (status, created_at DESC);
CREATE INDEX lesson_reports_reporter_idx ON public.lesson_reports (reporter_id, created_at DESC);
ALTER TABLE public.lesson_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lesson_reports FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.lesson_reports TO authenticated;
GRANT ALL ON public.lesson_reports TO service_role;
CREATE POLICY lesson_reports_read_own ON public.lesson_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
