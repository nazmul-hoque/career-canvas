/**
 * What the onboarding answers actually change.
 *
 * Onboarding collects a goal, a starting level, a career path and weekly hours.
 * Only the path used to be read anywhere, which made the other three questions
 * theatre. Each one now has a stated, checkable effect:
 *
 *   goal            → what the dashboard pushes you toward next
 *   experience      → where we suggest you start on a roadmap
 *   hours_per_week  → your daily and weekly XP goals (see gamification.ts)
 *   career_path     → the roadmap itself (unchanged)
 *
 * If you add an option here, give it a real consequence or leave it out of
 * onboarding.
 */

export type GoalId = "first-job" | "switch" | "level-up" | "projects" | "fun";
export type ExperienceId = "none" | "some" | "working" | "pro";

export interface GoalShape {
  /** Shown on the dashboard so the learner can see their answer being used. */
  label: string;
  /** One line explaining what we changed because of it. */
  effect: string;
  /** What the dashboard's secondary call to action points at. */
  emphasis: "projects" | "lessons" | "community";
}

const GOALS: Record<GoalId, GoalShape> = {
  "first-job": {
    label: "Getting your first tech job",
    effect: "Portfolio projects are pushed alongside lessons — hiring managers read those.",
    emphasis: "projects",
  },
  switch: {
    label: "Changing careers",
    effect: "Projects sit next to lessons so you have proof of work, not just progress.",
    emphasis: "projects",
  },
  "level-up": {
    label: "Improving your current skills",
    effect: "Practice and challenge lessons come first; concept-only blocks are de-emphasised.",
    emphasis: "lessons",
  },
  projects: {
    label: "Building projects",
    effect: "Project briefs lead, lessons support them.",
    emphasis: "projects",
  },
  fun: {
    label: "Learning for the enjoyment of it",
    effect: "Short sessions and the streak matter more than volume — your goals are modest.",
    emphasis: "community",
  },
};

export interface ExperienceShape {
  label: string;
  /**
   * How many modules we suggest skipping past on a roadmap. A suggestion only:
   * nothing is marked complete and no XP is granted for lessons not done.
   */
  suggestedSkipModules: number;
  effect: string;
}

const EXPERIENCE: Record<ExperienceId, ExperienceShape> = {
  none: {
    label: "Complete beginner",
    suggestedSkipModules: 0,
    effect: "We start you at lesson one and keep the pace gentle.",
  },
  some: {
    label: "Some exposure",
    suggestedSkipModules: 0,
    effect: "We start at the beginning, but expect you to move quickly through the first module.",
  },
  working: {
    label: "Working knowledge",
    suggestedSkipModules: 1,
    effect: "We suggest starting from the second module and using the first as a check.",
  },
  pro: {
    label: "Professional",
    suggestedSkipModules: 2,
    effect: "We suggest skipping the fundamentals and taking the placement check instead.",
  },
};

export const goalShape = (goal: string | null | undefined): GoalShape | null =>
  goal && goal in GOALS ? GOALS[goal as GoalId] : null;

export const experienceShape = (experience: string | null | undefined): ExperienceShape | null =>
  experience && experience in EXPERIENCE ? EXPERIENCE[experience as ExperienceId] : null;

/** True when we'd rather show a project than the next lesson as the second CTA. */
export const prefersProjects = (goal: string | null | undefined): boolean =>
  goalShape(goal)?.emphasis === "projects";
