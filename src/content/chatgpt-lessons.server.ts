import { chatgptLessonId, chatgptLevels } from "./chatgpt-levels.server";
import type { LessonBody } from "./lessons";

/**
 * Every ChatGPT course lesson body, keyed by lesson id.
 *
 * This used to assemble sixty bodies from task specs through one shared
 * wrapper. Each level now carries authored lessons and this only flattens them.
 */
export const chatgptLessonBodies: Record<string, LessonBody> = Object.fromEntries(
  chatgptLevels.flatMap((level) =>
    level.lessons.map((lesson) => [chatgptLessonId(level.id, lesson.slug), lesson.body] as const),
  ),
);
