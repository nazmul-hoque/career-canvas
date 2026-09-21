import { claudeLessonId, claudeLevels } from "./claude-levels.server";
import type { LessonBody } from "./lessons";

/**
 * Every Claude course lesson body, keyed by lesson id.
 *
 * This used to assemble bodies from task specs, giving all 172 of them the same
 * teach → do → prove wrapper. That wrapper is why three quarters of any page
 * repeated the page before it, and it is gone: each level now carries authored
 * lessons, and this only flattens them.
 */
export const claudeLessonBodies: Record<string, LessonBody> = Object.fromEntries(
  claudeLevels.flatMap((level) =>
    level.lessons.map((lesson) => [claudeLessonId(level.id, lesson.slug), lesson.body] as const),
  ),
);
