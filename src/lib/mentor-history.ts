/**
 * What the mentor knows about a learner beyond the lesson in front of them.
 *
 * "You struggled with reduce last week" is the difference between a tutor and a
 * search box — but every character here is paid for on every message, so the
 * summary is a few short lines under a hard budget, built only from signals
 * that change how a reply should be written:
 *
 *   - lessons missed on review (review_items.lapses) — what they keep forgetting
 *   - lessons recalled correctly several times in a row — what can be leaned on
 *   - what they finished recently — what "we covered this" can point at
 *   - whether they are revisiting this lesson rather than meeting it fresh
 *
 * Pure: no database, no request context. The server function fetches the rows.
 */
import { findLesson } from "@/content/curriculum";
import { isLessonLive } from "@/content/lessons";

export interface HistoryProgressRow {
  course_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface HistoryReviewRow {
  course_id: string;
  lesson_id: string;
  lapses: number;
  streak: number;
  due_on: string;
}

/** Upper bound on the summary, in characters (~300 tokens). */
export const HISTORY_BUDGET = 1200;

const RECENT_LIMIT = 5;
const STRUGGLE_LIMIT = 4;
const SOLID_LIMIT = 3;
/** Correct recalls in a row before a lesson counts as something to build on. */
const SOLID_STREAK = 2;

function titleOf(courseId: string, lessonId: string): string | null {
  // Rows for lessons that are no longer written (old filler) say nothing true
  // about what the learner knows.
  if (!isLessonLive(lessonId)) return null;
  const found = findLesson(courseId, lessonId);
  return found ? `"${found.lesson.title}" (${found.course.title})` : null;
}

export function summariseLearnerHistory(input: {
  currentLessonId: string;
  progress: HistoryProgressRow[];
  reviews: HistoryReviewRow[];
  today: string;
}): string | null {
  const { currentLessonId, progress, reviews, today } = input;
  const lines: string[] = [];

  const revisiting = progress.some((p) => p.lesson_id === currentLessonId);
  if (revisiting) {
    lines.push("- They have completed this lesson before and are revisiting it.");
  }

  const struggles = reviews
    .filter((r) => r.lapses > 0)
    .sort((a, b) => b.lapses - a.lapses || a.due_on.localeCompare(b.due_on))
    .map((r) => {
      const title = titleOf(r.course_id, r.lesson_id);
      if (!title) return null;
      const times = r.lapses === 1 ? "once" : `${r.lapses} times`;
      return r.lesson_id === currentLessonId
        ? `${title} — this lesson, missed ${times}`
        : `${title} — missed ${times}`;
    })
    .filter((t): t is string => Boolean(t))
    .slice(0, STRUGGLE_LIMIT);
  if (struggles.length) {
    lines.push(`- Keeps forgetting on review: ${struggles.join("; ")}.`);
  }

  const solid = reviews
    .filter((r) => r.streak >= SOLID_STREAK && r.lapses === 0 && r.lesson_id !== currentLessonId)
    .sort((a, b) => b.streak - a.streak)
    .map((r) => titleOf(r.course_id, r.lesson_id))
    .filter((t): t is string => Boolean(t))
    .slice(0, SOLID_LIMIT);
  if (solid.length) {
    lines.push(`- Recalls reliably, safe to build on: ${solid.join("; ")}.`);
  }

  const recent = [...progress]
    .filter((p) => p.lesson_id !== currentLessonId)
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
    .map((p) => titleOf(p.course_id, p.lesson_id))
    .filter((t): t is string => Boolean(t))
    .slice(0, RECENT_LIMIT);
  if (recent.length) {
    lines.push(`- Finished recently, newest first: ${recent.join("; ")}.`);
  }

  const overdue = reviews.filter((r) => r.due_on < today).length;
  if (overdue >= 3) {
    lines.push(`- Has ${overdue} overdue reviews, so older material may be rusty.`);
  }

  if (!lines.length) return null;

  let summary = lines.join("\n");
  if (summary.length > HISTORY_BUDGET) {
    // Lines are in priority order, so dropping from the end loses the least.
    while (lines.length > 1 && lines.join("\n").length > HISTORY_BUDGET) lines.pop();
    summary = lines.join("\n").slice(0, HISTORY_BUDGET);
  }
  return summary;
}
