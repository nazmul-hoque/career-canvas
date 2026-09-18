-- Ready-to-paste queries for public.analytics_events.
-- Run these in the Supabase SQL editor (the table is write-only to the app; only
-- the service role can read it).

-- 1. ACTIVATION — of everyone who signed up, how many finished onboarding, and
--    how many completed a first lesson? This is the number that decides whether
--    the product works at all.
WITH signups AS (
  SELECT id AS user_id, created_at FROM auth.users
),
onboarded AS (
  SELECT DISTINCT user_id FROM public.analytics_events WHERE name = 'onboarding_completed'
),
first_lesson AS (
  SELECT DISTINCT user_id FROM public.analytics_events WHERE name = 'lesson_completed'
)
SELECT
  count(*)                                              AS signed_up,
  count(*) FILTER (WHERE o.user_id IS NOT NULL)         AS onboarded,
  count(*) FILTER (WHERE f.user_id IS NOT NULL)         AS completed_a_lesson,
  round(100.0 * count(*) FILTER (WHERE f.user_id IS NOT NULL) / nullif(count(*), 0), 1)
                                                        AS activation_pct
FROM signups s
LEFT JOIN onboarded o USING (user_id)
LEFT JOIN first_lesson f USING (user_id);

-- 2. LESSON FUNNEL — started vs completed, per lesson. A lesson with a wide gap
--    is either too hard, badly explained, or has a broken challenge.
SELECT
  props ->> 'course_id'                                        AS course_id,
  props ->> 'lesson_id'                                        AS lesson_id,
  count(*) FILTER (WHERE name = 'lesson_started')              AS started,
  count(*) FILTER (WHERE name = 'lesson_completed')            AS completed,
  round(
    100.0 * count(*) FILTER (WHERE name = 'lesson_completed')
    / nullif(count(*) FILTER (WHERE name = 'lesson_started'), 0), 1
  )                                                            AS completion_pct
FROM public.analytics_events
WHERE name IN ('lesson_started', 'lesson_completed')
GROUP BY 1, 2
ORDER BY started DESC;

-- 3. D1 / D7 RETENTION — of people who signed up on a given day, how many came
--    back the next day and a week later? Streaks are the retention mechanic, so
--    this is how you find out whether they work.
WITH cohort AS (
  SELECT id AS user_id, date_trunc('day', created_at) AS signup_day FROM auth.users
),
activity AS (
  SELECT DISTINCT user_id, date_trunc('day', created_at) AS active_day
  FROM public.analytics_events
  WHERE user_id IS NOT NULL
)
SELECT
  c.signup_day::date,
  count(DISTINCT c.user_id)                                                   AS cohort_size,
  count(DISTINCT a1.user_id)                                                  AS returned_d1,
  count(DISTINCT a7.user_id)                                                  AS returned_d7
FROM cohort c
LEFT JOIN activity a1 ON a1.user_id = c.user_id AND a1.active_day = c.signup_day + interval '1 day'
LEFT JOIN activity a7 ON a7.user_id = c.user_id AND a7.active_day = c.signup_day + interval '7 days'
GROUP BY 1
ORDER BY 1 DESC;

-- 4. WHAT TO WRITE NEXT — unwritten lessons ranked by how many people tried to
--    open them. Demand, measured instead of guessed.
SELECT
  props ->> 'course_id'  AS course_id,
  props ->> 'lesson_id'  AS lesson_id,
  count(*)               AS attempts,
  count(DISTINCT coalesce(user_id::text, anon_id)) AS people
FROM public.analytics_events
WHERE name = 'lesson_coming_soon_viewed'
GROUP BY 1, 2
ORDER BY people DESC, attempts DESC
LIMIT 25;

-- 5. WHERE PEOPLE GET STUCK — challenge runs that failed, by challenge. A high
--    runs-per-solver number means the exercise or its tests need work.
SELECT
  props ->> 'title'                                      AS challenge,
  count(*)                                               AS runs,
  count(*) FILTER (WHERE (props ->> 'passed')::boolean)  AS passing_runs,
  count(DISTINCT coalesce(user_id::text, anon_id))       AS people,
  round(
    count(*)::numeric
    / nullif(count(DISTINCT coalesce(user_id::text, anon_id)), 0), 1
  )                                                      AS runs_per_person
FROM public.analytics_events
WHERE name = 'challenge_run'
GROUP BY 1
ORDER BY runs_per_person DESC;

-- 6. MENTOR USAGE — the feature Pro is sold on. Sessions per learner and how
--    often it is opened after an error, which is the case it claims to serve.
SELECT
  count(*)                                                  AS messages,
  count(DISTINCT user_id)                                   AS learners,
  count(*) FILTER (WHERE (props ->> 'after_error')::boolean) AS after_an_error,
  round(count(*)::numeric / nullif(count(DISTINCT user_id), 0), 1) AS messages_per_learner
FROM public.analytics_events
WHERE name = 'mentor_message_sent';

-- 7. CHECKOUT FUNNEL — pricing views to started to completed, by plan. Every
--    completion is currently a mock payment (props ->> 'mock' = 'true').
SELECT
  count(*) FILTER (WHERE name = 'pageview' AND path = '/pricing') AS pricing_views,
  count(*) FILTER (WHERE name = 'checkout_started')               AS started,
  count(*) FILTER (WHERE name = 'checkout_completed')             AS completed
FROM public.analytics_events;

-- 8. RETENTION OF KNOWLEDGE — does spaced review work here? The share of
--    reviews answered correctly, by how long the gap was. If the 16-day column
--    collapses, the intervals are widening faster than people can hold on.
SELECT
  (props ->> 'interval_days')::int                                       AS interval_days,
  count(*)                                                               AS reviews,
  count(*) FILTER (WHERE (props ->> 'correct')::boolean)                 AS correct,
  round(
    100.0 * count(*) FILTER (WHERE (props ->> 'correct')::boolean) / count(*),
    1
  )                                                                      AS pct_correct
FROM public.analytics_events
WHERE name = 'review_completed'
GROUP BY 1
ORDER BY 1;

-- 9. DOES THE NUDGE WORK? — for each re-engagement nudge, whether that learner
--    completed a lesson in the following 48 hours. Compare the streak nudge's
--    rate against the dormant ones, and push against email, before spending
--    anything on either. Sends from before push existed have no channel: email.
WITH sends AS (
  SELECT user_id, props ->> 'kind' AS kind, coalesce(props ->> 'channel', 'email') AS channel,
         created_at
  FROM public.analytics_events
  WHERE name = 'reengagement_sent'
)
SELECT
  s.kind,
  s.channel,
  count(*)                                       AS sent,
  count(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM public.analytics_events e
      WHERE e.user_id = s.user_id
        AND e.name = 'lesson_completed'
        AND e.created_at BETWEEN s.created_at AND s.created_at + interval '48 hours'
    )
  )                                              AS returned_within_48h,
  count(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM public.analytics_events u
      WHERE u.user_id = s.user_id
        AND u.name = 'reengagement_unsubscribed'
        AND u.created_at >= s.created_at
    )
  )                                              AS unsubscribed_after
FROM sends s
GROUP BY 1, 2
ORDER BY sent DESC;

-- 10. PYTHON, FOR REAL? — how often the WebAssembly interpreter failed to load
--     and the runner fell back to reading source instead of running it. A rising
--     simulated share means learners are being told their code passed when it
--     was never executed.
SELECT
  props ->> 'engine'                          AS engine,
  count(*)                                    AS runs,
  count(DISTINCT user_id)                     AS learners
FROM public.analytics_events
WHERE name = 'challenge_run'
GROUP BY 1
ORDER BY runs DESC;
