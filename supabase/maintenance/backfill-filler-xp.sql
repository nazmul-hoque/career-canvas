-- Historical filler-XP cleanup. NOT A MIGRATION — deliberately.
--
-- This file lives outside supabase/migrations/ so that `supabase db push` can
-- never run it by accident. It deletes rows and rewrites XP; that is a decision,
-- not a schema change.
--
-- The problem it fixes: before the filler-lesson removal, every roadmap slot
-- awarded XP whether or not anyone had written the lesson. Those completions are
-- still in `lesson_progress`, still counted in `profiles.xp`, and still ranking
-- people on the leaderboard for work that does not exist.
--
-- Skip this entirely if the database has no real learners — it is only worth
-- running where the inflated numbers are somebody's actual account.
--
-- HOW TO RUN
--   1. Take a backup. Supabase dashboard → Database → Backups.
--   2. Run STEP 0 alone and read the output. If it reports 0 rows, stop: there
--      is nothing to clean and the rest of the script is a no-op with risk.
--   3. Paste the live lesson ids into STEP 1 (see the note there — the list has
--      to come from the code, because the database has never known which
--      lessons were written).
--   4. Run steps 1-4 inside the transaction. COMMIT only if step 4 looks right.

-- ---------------------------------------------------------------------------
-- STEP 0 — what would change (read-only, safe to run any time)
-- ---------------------------------------------------------------------------
-- Replace the id list first, then:
--
-- SELECT count(*) AS doomed_rows,
--        count(DISTINCT user_id) AS affected_learners,
--        coalesce(sum(xp_earned), 0) AS xp_to_remove
-- FROM public.lesson_progress
-- WHERE lesson_id <> ALL (ARRAY[ /* live ids */ ]::text[]);

BEGIN;

-- ---------------------------------------------------------------------------
-- STEP 1 — the lessons that actually exist
-- ---------------------------------------------------------------------------
-- There is no table of live lessons: "live" means "has an authored body in
-- src/content/lessons.ts". Generate the list from the code rather than typing
-- it by hand, so this can be re-run as more lessons get written:
--
--   bun -e 'import("./src/content/lessons.ts").then(m => console.log(
--     Object.keys((m as any).bodies ?? {}).map(id => `    (${JSON.stringify(id)})`).join(",\n")))'
--
-- (If `bodies` is not exported, add a temporary export or paste the keys.)
CREATE TEMP TABLE live_lessons (lesson_id TEXT PRIMARY KEY) ON COMMIT DROP;

INSERT INTO live_lessons (lesson_id) VALUES
  ('js-basics.functions'),
  ('js-debug.fixit'),
  ('layout.responsive'),
  ('py-basics.flow'),
  ('py-collections.comprehensions')
  -- ← keep this list in step with src/content/lessons.ts before running
;

-- ---------------------------------------------------------------------------
-- STEP 2 — drop progress for lessons that were never written
-- ---------------------------------------------------------------------------
DELETE FROM public.lesson_progress p
WHERE NOT EXISTS (SELECT 1 FROM live_lessons l WHERE l.lesson_id = p.lesson_id);

-- Review items inherit the same fate: nothing to review in an unwritten lesson.
DELETE FROM public.review_items r
WHERE NOT EXISTS (SELECT 1 FROM live_lessons l WHERE l.lesson_id = r.lesson_id);

-- ---------------------------------------------------------------------------
-- STEP 3 — recompute XP, level and daily activity from what remains
-- ---------------------------------------------------------------------------
-- The level curve lives in src/content/gamification.ts (400 XP for level 2,
-- each step 15% larger). This reproduces it in SQL so the two cannot drift
-- apart silently — if you change the curve, change it here too.
CREATE OR REPLACE FUNCTION pg_temp.level_from_xp(total INT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  lvl INT := 1;
  remaining NUMERIC := total;
  need NUMERIC := 400;
BEGIN
  WHILE remaining >= need LOOP
    remaining := remaining - need;
    lvl := lvl + 1;
    need := round(need * 1.15);
  END LOOP;
  RETURN lvl;
END;
$$;

WITH totals AS (
  SELECT p.id,
         coalesce((SELECT sum(xp_earned) FROM public.lesson_progress lp WHERE lp.user_id = p.id), 0)::int AS real_xp
  FROM public.profiles p
)
UPDATE public.profiles p
SET xp = t.real_xp,
    level = pg_temp.level_from_xp(t.real_xp),
    updated_at = now()
FROM totals t
WHERE t.id = p.id AND p.xp <> t.real_xp;

-- daily_activity is rebuilt from the surviving completions. Reviews also write
-- to this table, so anything not explained by a completion is left alone rather
-- than zeroed: this only lowers days that were inflated by filler.
WITH real_days AS (
  SELECT user_id,
         (completed_at AT TIME ZONE 'utc')::date AS day,
         sum(xp_earned)::int AS xp
  FROM public.lesson_progress
  GROUP BY 1, 2
)
UPDATE public.daily_activity d
SET xp = LEAST(d.xp, r.xp)
FROM real_days r
WHERE d.user_id = r.user_id AND d.day = r.day AND d.xp > r.xp;

DELETE FROM public.daily_activity d
WHERE NOT EXISTS (
  SELECT 1 FROM public.lesson_progress lp
  WHERE lp.user_id = d.user_id AND (lp.completed_at AT TIME ZONE 'utc')::date = d.day
)
AND NOT EXISTS (
  SELECT 1 FROM public.review_items ri
  WHERE ri.user_id = d.user_id AND ri.last_reviewed_at IS NOT NULL
);

-- ---------------------------------------------------------------------------
-- STEP 4 — certificates issued against filler
-- ---------------------------------------------------------------------------
-- A certificate for a path that was never fully written should not exist. These
-- are listed rather than deleted: revoking someone's credential is a decision
-- for a human, not a script. Review the output and delete by hand if needed.
SELECT c.user_id, c.path_id, c.certificate_id, c.issued_at
FROM public.issued_certificates c
ORDER BY c.issued_at;

-- Check the numbers, then:
-- COMMIT;
ROLLBACK;
