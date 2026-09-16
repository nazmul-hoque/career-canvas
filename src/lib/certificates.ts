import { careerPaths, courseLessons, pathCourses, type CareerPath } from "@/content/curriculum";

/**
 * Certificates are derived, not stored. A learner is eligible the moment every
 * lesson in every course of a path is in `lesson_progress`. The ID is a stable
 * hash of (user, path) so the same completion always produces the same
 * certificate number and a shared link keeps working.
 */

export interface PathCompletion {
  path: CareerPath;
  total: number;
  completed: number;
  percent: number;
  eligible: boolean;
}

export function pathCompletion(path: CareerPath, completedLessonIds: Set<string>): PathCompletion {
  const lessons = pathCourses(path).flatMap(courseLessons);
  const total = lessons.length;
  const completed = lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { path, total, completed, percent, eligible: total > 0 && completed === total };
}

export function allPathCompletions(completedLessonIds: Set<string>): PathCompletion[] {
  return careerPaths.map((p) => pathCompletion(p, completedLessonIds));
}

/** Deterministic, non-cryptographic — readable and stable, not a security token. */
function hash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
}

export function certificateId(userId: string, pathId: string): string {
  return `ASC-${pathId.toUpperCase().slice(0, 4)}-${hash(`${userId}:${pathId}`)}`;
}

export function formatCertificateDate(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** The date the final lesson of the path was completed, if we have it. */
export function pathCompletedAt(
  path: CareerPath,
  progress: { lesson_id: string; completed_at: string }[],
): string | null {
  const ids = new Set(
    pathCourses(path)
      .flatMap(courseLessons)
      .map((l) => l.id),
  );
  const dates = progress.filter((p) => ids.has(p.lesson_id)).map((p) => p.completed_at);
  if (!dates.length) return null;
  return dates.sort().at(-1) ?? null;
}
