/**
 * The Claude course as the browser sees it: the metadata a catalog card needs,
 * and a module skeleton generated from the server-only authored specs in
 * `claude-levels.server.ts`. No task prose reaches the client bundle.
 */
import type { Course } from "./curriculum";
import { claudeModules } from "./claude-course.gen";

export const claudeCourse: Course = {
  id: "claude-operator",
  title: "Claude Operator: Prompt to Autonomy",
  skill: "Claude",
  level: "Beginner",
  recommended: true,
  sectionLabel: "levels",
  summary: `${claudeModules.reduce((n, m) => n + m.lessons.length, 0)} lessons from your first prompt to safe, autonomous Claude workflows, each with work to do in your own terminal.`,
  description:
    "Learn Claude by doing the work yourself. Start with ordinary questions, move into Claude Code and connected tools, then build subagents, reusable skills, permission boundaries, and bounded autonomous workflows, all explained in everyday language.",
  skills: [
    "Prompting",
    "Claude Code CLI",
    "MCP tools",
    "Subagents",
    "Custom skills",
    "Permissions",
    "Safe autonomy",
  ],
  careers: ["claude-operator", "ai"],
  modules: claudeModules,
};
