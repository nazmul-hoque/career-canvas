import {
  careerPaths,
  courseLessons,
  pathCourses,
  type CareerPath,
  type LessonMeta,
} from "@/content/curriculum";
import { isLessonAssessed, isPathPublished, pathLiveLessons } from "@/content/lessons";

/**
 * Certificates are derived, not stored. The ID is a stable hash of (user, path)
 * so the same completion always produces the same certificate number and a
 * shared link keeps working.
 *
 * Eligibility deliberately requires three things: the path is fully written
 * (`isPathPublished`), every one of its lessons is in `lesson_progress`, AND at
 * least one of those lessons was actually assessed. A path with unwritten
 * lessons issues no certificate at all — a credential for a half-published
 * roadmap is worth less than no credential — and neither does a path of purely
 * self-attested work, where the only evidence is the learner's own word.
 */

/**
 * Why a path does or doesn't award a certificate. The routes render this rather
 * than re-deriving it from `published`/`assessable`/`completed`: the rule has
 * one home, and a new state makes the `switch` in each route fail to compile
 * instead of silently falling through to the wrong paragraph.
 */
export type CredentialState =
  /** Written, finished, and some of it was actually marked. */
  | "eligible"
  /** Nothing on the path is marked, so there is no credential to earn. */
  | "self-directed"
  /** Still being written — a certificate for a half-published roadmap is worth less than none. */
  | "unwritten"
  /** Earnable, not yet earned. */
  | "in-progress";

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
  credential: CredentialState;
}

/**
 * Everything about a path that doesn't depend on the learner. The curriculum
 * and the manifest are both frozen after import, but `pathCompletion` runs
 * eight times per profile render and once per path on every lesson completion,
 * and each of these walks every lesson on the path.
 */
interface PathFacts {
  total: number;
  live: LessonMeta[];
  published: boolean;
  /** Does anything on this path get marked? If not, it can never certify. */
  assessable: boolean;
}

const pathFactsCache = new WeakMap<CareerPath, PathFacts>();

function pathFacts(path: CareerPath): PathFacts {
  const cached = pathFactsCache.get(path);
  if (cached) return cached;
  const live = pathLiveLessons(path);
  const facts: PathFacts = {
    total: pathCourses(path).flatMap(courseLessons).length,
    live,
    published: isPathPublished(path),
    assessable: live.some((l) => isLessonAssessed(l.id)),
  };
  pathFactsCache.set(path, facts);
  return facts;
}

export function pathCompletion(path: CareerPath, completedLessonIds: Set<string>): PathCompletion {
  const { total, live, published, assessable } = pathFacts(path);
  const completed = live.filter((l) => completedLessonIds.has(l.id)).length;
  const percent = live.length ? Math.round((completed / live.length) * 100) : 0;
  const finished = live.length > 0 && completed === live.length;

  const credential: CredentialState = !assessable
    ? "self-directed"
    : !published
      ? "unwritten"
      : finished
        ? "eligible"
        : "in-progress";

  return { path, total, live: live.length, completed, percent, published, credential };
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
