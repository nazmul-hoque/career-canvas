import type { LessonBody } from "./lessons";
import type { LessonMeta } from "./curriculum";

/**
 * One hand-written lesson of a level-based course, as opposed to a task spec
 * fed through a generated wrapper. Lives in its own module so each level's file
 * can import the type without importing the level list that imports it back.
 */
export type AuthoredLesson = {
  /** Appended to the level id to form the lesson id. */
  slug: string;
  title: string;
  minutes: number;
  type: LessonMeta["type"];
  body: LessonBody;
};
