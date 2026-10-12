import type { Course } from "./curriculum";
import { chatgptModules } from "./chatgpt-course.gen";

export const chatgptCourse: Course = {
  id: "chatgpt-operator",
  title: "ChatGPT Operator: Prompt to Autonomy",
  skill: "ChatGPT",
  level: "Beginner",
  recommended: true,
  sectionLabel: "levels",
  summary: `${chatgptModules.reduce((n, m) => n + m.lessons.length, 0)} lessons from your first prompt to verified, repeatable ChatGPT workflows, each with work to do in your own account.`,
  description:
    "Learn ChatGPT by doing the work yourself. Write clearer prompts, organise context, verify research, analyse files, build reusable workflows, and practise bounded automation. Each level ends with a practical capstone. Use your own ChatGPT account; tool availability depends on your plan and workspace, with manual alternatives included.",
  skills: [
    "Prompting",
    "Context design",
    "Research",
    "Data analysis",
    "Reusable workflows",
    "Connected tools",
    "Safe autonomy",
  ],
  careers: ["chatgpt-operator", "ai"],
  modules: chatgptModules,
};
