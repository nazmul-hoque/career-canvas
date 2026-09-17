import { careerPaths, courseLessons, pathCourses, type CareerPath } from "@/content/curriculum";
import { isPathPublished, pathLiveLessons } from "@/content/lessons";

/**
 * Certificates are derived, not stored. The ID is a stable hash of (user, path)
 * so the same completion always produces the same certificate number and a
 * shared link keeps working.
 *
 * Eligibility deliberately requires two things: the path is fully written
 * (`isPathPublished`) AND every one of its lessons is in `lesson_progress`.
 * A path with unwritten lessons issues no certificate at all — a credential for
 * a half-published roadmap is worth less than no credential.
 */

export interface PathCompletion {
  path: CareerPath;
  /** Lessons on the roadmap, written or not. */
  total: number;
  /** Lessons actually written and openable. */
  live: number;
  /** Live lessons the learner has finished. */
  completed: number;
  /** Progress against what exists, not against what is planned. */
  percent: number;
  published: boolean;
  eligible: boolean;
}

export function pathCompletion(path: CareerPath, completedLessonIds: Set<string>): PathCompletion {
  const total = pathCourses(path).flatMap(courseLessons).length;
  const live = pathLiveLessons(path);
  const completed = live.filter((l) => completedLessonIds.has(l.id)).length;
  const percent = live.length ? Math.round((completed / live.length) * 100) : 0;
  const published = isPathPublished(path);
  return {
    path,
    total,
    live: live.length,
    completed,
    percent,
    published,
    eligible: published && live.length > 0 && completed === live.length,
  };
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
