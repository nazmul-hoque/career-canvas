-- XP, levels, streaks and lesson progress are written by the server function in
-- src/server/learning.functions.ts (service role) and by nothing else.
--
-- Until now the browser computed those numbers and wrote them using the
-- learner's own grants, so anyone with the console open could set their own XP
-- and top the leaderboard. Revoking the write grants is what actually closes
-- that hole — moving the arithmetic to the server only matters if the client
-- can no longer bypass it.

-- profiles: the learner keeps editing their own profile, minus the gamification
-- columns. Column-level grants also mean an INSERT can never seed a starting XP —
-- xp, level and the streak columns fall back to their defaults.
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
GRANT INSERT (
  id, display_name, bio, avatar_url, career_path, goal, experience, hours_per_week, onboarded, plan
) ON public.profiles TO authenticated;
GRANT UPDATE (
  display_name, bio, avatar_url, career_path, goal, experience, hours_per_week, onboarded, plan,
  updated_at
) ON public.profiles TO authenticated;
-- `plan` stays client-writable only because checkout is still the mock dialog in
-- src/routes/pricing.tsx. Real payments move it to the server with the rest.

-- lesson_progress and daily_activity: the owner reads them, the service role
-- writes them. The existing RLS policies still scope reads to auth.uid().
REVOKE INSERT, UPDATE, DELETE ON public.lesson_progress FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.daily_activity FROM authenticated;

-- user_achievements stays client-writable on purpose: badges carry no XP and do
-- not affect rank, and two of them ("path-chosen", "mentor-chat") are UI events
-- the server cannot verify. Lock it down when achievements start paying out XP.
