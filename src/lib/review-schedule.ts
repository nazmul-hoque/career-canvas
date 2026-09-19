/**
 * Spaced repetition scheduling — SM-2 with the parts that need per-item
 * difficulty ratings removed, because a lesson quiz is pass/fail and asking a
 * learner to grade their own recall is a question most people answer wrongly.
 *
 * Correct → the gap widens by a fixed factor. Wrong → back to tomorrow, and the
 * widening starts again slightly slower for that item. Pure and testable: no
 * clock inside, callers pass the day.
 */

export interface ReviewState {
  intervalDays: number;
  /** Consecutive correct reviews. */
  streak: number;
  lapses: number;
}

export interface ScheduledReview extends ReviewState {
  dueOn: string;
}

/** The first few gaps, in days, before the multiplier takes over. */
const LADDER = [1, 3, 7, 16];
const GROWTH = 2.2;
/** Beyond three months a "review" is really a re-read; the lesson is there for that. */
const MAX_INTERVAL_DAYS = 90;

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nextReview(state: ReviewState, correct: boolean, today: string): ScheduledReview {
  if (!correct) {
    return {
      intervalDays: 1,
      streak: 0,
      lapses: state.lapses + 1,
      dueOn: addDays(today, 1),
    };
  }

  const streak = state.streak + 1;
  const laddered = LADDER[streak - 1];
  const grown = Math.round(Math.max(state.intervalDays, 1) * GROWTH);
  // A lapsed item climbs the same ladder but never jumps straight back to its
  // old interval — that is the whole point of a lapse.
  const intervalDays = Math.min(MAX_INTERVAL_DAYS, laddered ?? grown);

  return { intervalDays, streak, lapses: state.lapses, dueOn: addDays(today, intervalDays) };
}

/** The item a freshly completed lesson gets: first check-in tomorrow. */
export const initialReview = (today: string): ScheduledReview => ({
  intervalDays: 1,
  streak: 0,
  lapses: 0,
  dueOn: addDays(today, 1),
});
