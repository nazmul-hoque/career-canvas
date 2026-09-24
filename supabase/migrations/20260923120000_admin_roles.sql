-- Admin access and the tools behind /admin.
--
-- Being an admin is a row here, written only by the service role (grant one
-- with the snippet at the bottom). The browser may read its own row so the
-- shell knows whether to show the Admin link, but that is display only: every
-- admin server function re-checks this table with the service role before it
-- reads or changes anything.

CREATE TABLE public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  note text,
  granted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
CREATE POLICY admin_users_read_own ON public.admin_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Every admin change is recorded, because most of them (a deleted post, a
-- deleted account) leave nothing else behind to say who did it or why.
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SET NULL so an admin's removal doesn't erase the history of what they did.
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_actions_time_idx ON public.admin_actions (created_at DESC);
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_actions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_actions TO service_role;

-- The user list needs email, which lives in auth.users and which PostgREST
-- can't join or search. Service role only: this reads every learner's address.
CREATE FUNCTION public.admin_user_directory(p_query text, p_limit int, p_offset int)
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  plan text,
  trial_ends_at timestamptz,
  xp int,
  level int,
  streak_current int,
  last_active_day date,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  banned_until timestamptz,
  is_admin boolean,
  total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, u.email::text, p.display_name, p.plan, p.trial_ends_at, p.xp, p.level,
         p.streak_current, p.last_active_day, p.created_at, u.last_sign_in_at, u.banned_until,
         EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = p.id),
         count(*) OVER ()
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE coalesce(p_query, '') = ''
     OR p.display_name ILIKE '%' || p_query || '%'
     OR u.email ILIKE '%' || p_query || '%'
     OR p.id::text = p_query
  ORDER BY p.created_at DESC
  LIMIT least(greatest(p_limit, 1), 100) OFFSET greatest(p_offset, 0);
$$;
REVOKE ALL ON FUNCTION public.admin_user_directory(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_directory(text, int, int) TO service_role;

-- Headline figures and a daily series, in one round trip. Days are UTC, the
-- same day boundary daily_activity uses.
CREATE FUNCTION public.admin_metrics(p_days int)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH days AS (
    SELECT d::date AS day
    FROM generate_series(
      (now() AT TIME ZONE 'utc')::date - (least(greatest(p_days, 7), 180) - 1),
      (now() AT TIME ZONE 'utc')::date,
      interval '1 day'
    ) d
  ),
  signups AS (
    SELECT (created_at AT TIME ZONE 'utc')::date AS day, count(*) AS n
    FROM public.profiles GROUP BY 1
  ),
  completions AS (
    SELECT (completed_at AT TIME ZONE 'utc')::date AS day, count(*) AS n
    FROM public.lesson_progress GROUP BY 1
  ),
  active AS (
    SELECT day, count(DISTINCT user_id) AS n FROM public.daily_activity GROUP BY 1
  )
  SELECT jsonb_build_object(
    'learners', (SELECT count(*) FROM public.profiles),
    'onboarded', (SELECT count(*) FROM public.profiles WHERE onboarded),
    'active7', (SELECT count(*) FROM public.profiles
                WHERE last_active_day > (now() AT TIME ZONE 'utc')::date - 7),
    'active30', (SELECT count(*) FROM public.profiles
                 WHERE last_active_day > (now() AT TIME ZONE 'utc')::date - 30),
    'trialing', (SELECT count(*) FROM public.profiles
                 WHERE plan = 'free' AND trial_ends_at > now()),
    'plans', coalesce((SELECT jsonb_object_agg(plan, n)
                       FROM (SELECT plan, count(*) AS n FROM public.profiles GROUP BY plan) s),
                      '{}'::jsonb),
    'completions', (SELECT count(*) FROM public.lesson_progress),
    'certificates', (SELECT count(*) FROM public.issued_certificates),
    'openReports', (SELECT count(*) FROM public.community_reports WHERE status = 'open'),
    'daily', (SELECT jsonb_agg(jsonb_build_object(
                'day', days.day,
                'signups', coalesce(s.n, 0),
                'completions', coalesce(c.n, 0),
                'active', coalesce(a.n, 0)) ORDER BY days.day)
              FROM days
              LEFT JOIN signups s ON s.day = days.day
              LEFT JOIN completions c ON c.day = days.day
              LEFT JOIN active a ON a.day = days.day)
  );
$$;
REVOKE ALL ON FUNCTION public.admin_metrics(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_metrics(int) TO service_role;

-- Per-course completions for the read-only content view. The curriculum
-- itself is static TypeScript; only the usage lives here.
CREATE FUNCTION public.admin_course_usage()
RETURNS TABLE (course_id text, completions bigint, learners bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT course_id, count(*), count(DISTINCT user_id)
  FROM public.lesson_progress
  GROUP BY course_id;
$$;
REVOKE ALL ON FUNCTION public.admin_course_usage() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_course_usage() TO service_role;

-- To make someone an admin, run as the service role (SQL editor):
--   INSERT INTO public.admin_users (user_id, note)
--   SELECT id, 'founder' FROM auth.users WHERE email = 'you@example.com';
