-- Spaced review.
--
-- "Job-ready" used to rest on a single pass through each lesson. A lesson you
-- answered once in March is not knowledge you have in June. Every completed
-- lesson gets a review item; answering its questions again on a widening
-- schedule is what turns a pass into retention.
--
-- Scheduling is SM-2 in its simplest honest form: correct → interval grows,
-- wrong → back to one day. The server owns every field, because the due date is
-- the thing a learner would otherwise be tempted to edit, and because reviews
-- pay XP.

CREATE TABLE public.review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  due_on DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  interval_days INT NOT NULL DEFAULT 1,
  -- How many times this lesson has been reviewed correctly in a row.
  streak INT NOT NULL DEFAULT 0,
  lapses INT NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

-- Read-only to the learner: they see what is due, the server decides when.
GRANT SELECT ON public.review_items TO authenticated;
GRANT ALL ON public.review_items TO service_role;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_items_read_own" ON public.review_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX review_items_due_idx ON public.review_items (user_id, due_on);
