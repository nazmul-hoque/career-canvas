import { chatgptLevels, chatgptTaskId } from "./chatgpt-levels.server";
import { ATTESTED_XP } from "./gamification";
import type { LessonBody } from "./lessons";

// Work happens in the learner's own account. Completion is self-attested,
// matching the Claude course; it must not count as assessed certification.
export const chatgptLessonBodies: Record<string, LessonBody> = Object.fromEntries(
  chatgptLevels.flatMap((level) =>
    level.tasks.map((task, index) => {
      const blocks: LessonBody["blocks"] = [
        { kind: "text", body: `${level.guide} **Your task:** ${task.mission}` },
      ];
      if (task.example) {
        blocks.push({
          kind: "code",
          language: "text",
          caption: "Starting point — adapt this practice example",
          code: task.example,
        });
      }
      blocks.push(
        {
          kind: "callout",
          body: `**Do it now.** Work in your own ChatGPT account using fictional or public material. Keep this evidence: ${task.evidence}`,
        },
        { kind: "text", body: `**Safety check:** ${level.safety}` },
        { kind: "code", language: "text", caption: "Official reference", code: level.reference },
      );
      return [
        chatgptTaskId(level.id, index),
        { summary: task.mission, attested: true, xp: ATTESTED_XP, blocks },
      ];
    }),
  ),
);
