-- The SQL course split in two: `sql` is now SQL Foundations (Beginner), and the
-- CTE and window-function lessons moved to a new `sql-analysis` course
-- (Intermediate). Stored rows name a course and a lesson, and the app resolves
-- them with findLesson(course_id, lesson_id), so a row left on the old pair
-- drops out of the review queue, mentor history and the free tier's monthly
-- count. Every table that stores a lesson id is carried across.
--
-- 1. GROUP BY stays in `sql` but its module is now `sql-summary`, so its
--    lesson id changes. No collision: the new id did not exist before.
-- 2. CTEs and window functions keep their lesson ids and change course.

UPDATE public.lesson_progress
  SET lesson_id = 'sql-summary.groupby'
  WHERE lesson_id = 'sql-analysis.groupby';
UPDATE public.review_items
  SET lesson_id = 'sql-summary.groupby'
  WHERE lesson_id = 'sql-analysis.groupby';
UPDATE public.mentor_messages
  SET lesson_id = 'sql-summary.groupby'
  WHERE lesson_id = 'sql-analysis.groupby';

UPDATE public.lesson_progress
  SET course_id = 'sql-analysis'
  WHERE lesson_id IN ('sql-analysis.ctes', 'sql-analysis.windows');
UPDATE public.review_items
  SET course_id = 'sql-analysis'
  WHERE lesson_id IN ('sql-analysis.ctes', 'sql-analysis.windows');
UPDATE public.mentor_messages
  SET course_id = 'sql-analysis'
  WHERE lesson_id IN ('sql-analysis.ctes', 'sql-analysis.windows');
