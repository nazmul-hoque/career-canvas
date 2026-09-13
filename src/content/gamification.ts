export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
}

export const achievements: Achievement[] = [
  { key: "first-lesson", name: "First Lesson", description: "You finished your very first lesson.", icon: "Sparkles", xp: 50 },
  { key: "first-challenge", name: "First Coding Challenge", description: "You passed a coding challenge.", icon: "Code2", xp: 75 },
  { key: "ten-lessons", name: "10 Lessons Completed", description: "Ten lessons behind you.", icon: "BookCheck", xp: 120 },
  { key: "streak-7", name: "7 Day Streak", description: "A full week without missing a day.", icon: "Flame", xp: 100 },
  { key: "streak-30", name: "30 Day Streak", description: "A month of showing up.", icon: "Mountain", xp: 300 },
  { key: "xp-1000", name: "1,000 XP", description: "You crossed a thousand experience points.", icon: "Zap", xp: 100 },
  { key: "debug-master", name: "Debugging Master", description: "You fixed a broken program on your own.", icon: "Bug", xp: 150 },
  { key: "project-complete", name: "Project Completed", description: "A real project submitted to your portfolio.", icon: "Trophy", xp: 250 },
  { key: "mentor-chat", name: "Asked for Help", description: "You used the AI mentor — smart move.", icon: "MessageCircle", xp: 30 },
  { key: "path-chosen", name: "Path Chosen", description: "You committed to a career path.", icon: "Compass", xp: 40 },
];

export const achievementByKey = (key: string) => achievements.find((a) => a.key === key);

/** Level curve: level n requires 400 * n XP in total steps that grow gently. */
export function levelFromXp(xp: number) {
  let level = 1;
  let remaining = xp;
  let need = 400;
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = Math.round(need * 1.15);
  }
  return { level, intoLevel: remaining, needed: need, percent: Math.round((remaining / need) * 100) };
}

export const levelTitle = (level: number) => {
  if (level >= 20) return "Summit";
  if (level >= 14) return "Ridge Runner";
  if (level >= 9) return "Climber";
  if (level >= 5) return "Scrambler";
  return "Base Camp";
};

export const DAILY_XP_GOAL = 150;
export const WEEKLY_XP_GOAL = 800;
