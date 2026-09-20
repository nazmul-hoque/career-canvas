/**
 * What each plan may do.
 *
 * Shared by client and server: the UI uses it to show locks, the server
 * functions use it to enforce them. The server is the authority — a lock that
 * only exists in the browser is decoration.
 *
 * Enforcement is OFF unless VITE_ENTITLEMENTS_ENABLED (or ENTITLEMENTS_ENABLED
 * on the server) is "true". With only five lessons written, turning it on today
 * would paywall three of them behind a checkout that charges nothing. Flip it
 * when there is enough content for a Free tier to be worth having.
 */
import type { Course } from "@/content/curriculum";

export type PlanId = "free" | "pro" | "lifetime";

/** Card-free trial. 14 days is the self-serve education norm. */
export const TRIAL_DAYS = 14;

export interface Entitlements {
  /** Mentor messages per calendar month. */
  mentorMessagesPerMonth: number;
  /** false → only the first module of each course is open. */
  allModules: boolean;
  /** null → unlimited. Counts completed practice and challenge lessons. */
  practiceTasksPerMonth: number | null;
  projects: boolean;
  certificates: boolean;
}

const PLANS: Record<PlanId, Entitlements> = {
  free: {
    // A taste rather than zero: the pricing page lists the mentor as Pro-only,
    // so this is a deliberate deviation — see IMPLEMENTATION-STATUS.md.
    mentorMessagesPerMonth: 10,
    allModules: false,
    practiceTasksPerMonth: 10,
    projects: false,
    certificates: false,
  },
  pro: {
    mentorMessagesPerMonth: 500,
    allModules: true,
    practiceTasksPerMonth: null,
    projects: true,
    certificates: true,
  },
  lifetime: {
    mentorMessagesPerMonth: 500,
    allModules: true,
    practiceTasksPerMonth: null,
    projects: true,
    certificates: true,
  },
};

const UNRESTRICTED: Entitlements = {
  mentorMessagesPerMonth: PLANS.pro.mentorMessagesPerMonth,
  allModules: true,
  practiceTasksPerMonth: null,
  projects: true,
  certificates: true,
};

/** Reads the same flag on either side of the wire. */
export function entitlementsEnabled(): boolean {
  const fromClient =
    typeof import.meta !== "undefined" ? import.meta.env?.["VITE_ENTITLEMENTS_ENABLED"] : undefined;
  const fromServer =
    typeof process !== "undefined" ? process.env?.["ENTITLEMENTS_ENABLED"] : undefined;
  return String(fromClient ?? fromServer ?? "false").toLowerCase() === "true";
}

export interface PlanState {
  plan: PlanId;
  /** True while a trial is doing the work — the stored plan is still "free". */
  trialing: boolean;
  trialEndsAt: string | null;
  trialUsed: boolean;
}

export function planState(
  profile: { plan?: string | null; trial_ends_at?: string | null } | null | undefined,
  now: Date = new Date(),
): PlanState {
  const stored = (profile?.plan ?? "free") as PlanId;
  const trialEndsAt = profile?.trial_ends_at ?? null;
  const trialing =
    stored === "free" && Boolean(trialEndsAt) && new Date(trialEndsAt!).getTime() > now.getTime();

  return {
    plan: trialing ? "pro" : ["free", "pro", "lifetime"].includes(stored) ? stored : "free",
    trialing,
    trialEndsAt,
    trialUsed: Boolean(trialEndsAt),
  };
}

export function entitlementsFor(plan: PlanId): Entitlements {
  if (!entitlementsEnabled()) return UNRESTRICTED;
  return PLANS[plan] ?? PLANS.free;
}

/** Entitlements as written, ignoring the override flag — for pricing copy. */
export function planFeatures(plan: PlanId): Entitlements {
  return PLANS[plan] ?? PLANS.free;
}

// Indexed per course: the curriculum is static, and the course page asks this
// once per lesson row — a linear scan of the free module made that quadratic.
const freeLessonIdCache = new WeakMap<Course, Set<string>>();

/** The lessons a free plan can open: the first module of the course. */
export function freeLessonIds(course: Course): Set<string> {
  const cached = freeLessonIdCache.get(course);
  if (cached) return cached;
  const ids = new Set((course.modules[0]?.lessons ?? []).map((l) => l.id));
  freeLessonIdCache.set(course, ids);
  return ids;
}

/** Free tier sees the first module of every course and nothing beyond it. */
export function isLessonUnlocked(
  course: Course,
  lessonId: string,
  entitlements: Entitlements,
): boolean {
  if (entitlements.allModules) return true;
  return freeLessonIds(course).has(lessonId);
}

export function trialDaysLeft(trialEndsAt: string | null, now: Date = new Date()): number {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}
