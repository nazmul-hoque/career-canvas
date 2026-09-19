-- Persisted mentor conversations.
--
-- The mentor used to be a scripted function whose chat vanished on navigation.
-- With a real model behind it, two things change: the conversation is worth
-- keeping (it is the learner's record of how they got unstuck), and each message
-- costs money, so usage has to be countable per plan.

CREATE TABLE public.mentor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'mentor')),
  content TEXT NOT NULL,
  -- Which model answered, for cost attribution and for debugging a bad reply.
  provider TEXT,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX mentor_messages_quota_idx ON public.mentor_messages (user_id, created_at DESC);
CREATE INDEX mentor_messages_thread_idx ON public.mentor_messages (user_id, lesson_id, created_at);

-- Read-only to the learner. The monthly quota is counted from these rows, so
-- letting the client insert or delete them would let anyone reset their own
-- allowance — writes go through the server function only.
GRANT SELECT ON public.mentor_messages TO authenticated;
GRANT ALL ON public.mentor_messages TO service_role;
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mentor_messages_read_own" ON public.mentor_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
