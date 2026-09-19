-- Two pieces of state that were never actually stored:
--   * project milestones lived in React state and cleared on every reload
--   * post likes lived in localStorage, so they were per-browser and invisible
--     to everyone else, including the person whose post was liked

-- Milestones: one row per ticked milestone. Row-per-tick instead of an array
-- column so two tabs can't overwrite each other's progress.
CREATE TABLE public.project_milestones (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  milestone_index INT NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id, milestone_index)
);
GRANT SELECT, INSERT, DELETE ON public.project_milestones TO authenticated;
GRANT ALL ON public.project_milestones TO service_role;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_milestones_own" ON public.project_milestones FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Likes: a real row per (post, learner). Seeded example posts live in
-- src/content/community.ts rather than the database, so they are read-only in
-- the UI and the foreign key here stays honest.
CREATE TABLE public.post_likes (
  post_id UUID NOT NULL REFERENCES public.community_posts ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX post_likes_user_idx ON public.post_likes (user_id);
GRANT SELECT ON public.post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_likes_read" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert_own" ON public.post_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete_own" ON public.post_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- community_posts.likes becomes a derived counter kept by this trigger, so the
-- feed still reads one column instead of aggregating on every render.
CREATE OR REPLACE FUNCTION public.sync_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_posts p
     SET likes = (SELECT count(*) FROM public.post_likes l WHERE l.post_id = p.id)
   WHERE p.id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_post_like_count() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER post_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_post_like_count();

-- The counter is derived now, so an author may edit their post's text but not
-- its like count.
REVOKE UPDATE ON public.community_posts FROM authenticated;
GRANT UPDATE (title, body, topic) ON public.community_posts TO authenticated;
