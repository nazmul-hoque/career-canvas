import { claudeLevels, claudeTaskId } from "./claude-levels.server";
import { ATTESTED_XP } from "./gamification";
import type { LessonBody } from "./lessons";

/**
 * Bodies for the 172 authored task specs in `claude-levels.server.ts`. The
 * mission, evidence, example and level guardrails are all authored; this only
 * gives each task the same teach → do → prove presentation.
 *
 * These are self-attested: the work happens in the learner's own tools, so
 * there is nothing here a server can mark. They deliberately ask no question
 * and run no challenge, which is what makes them unassessed everywhere it
 * matters — no review item is filed, and a path made only of them can never
 * issue a certificate (see `isLessonAssessed`). They used to carry a generated
 * multiple-choice question whose right answer was always the first option; a
 * template that grades itself certifies nothing.
 */
export const claudeLessonBodies: Record<string, LessonBody> = Object.fromEntries(
  claudeLevels.flatMap((level) =>
    level.tasks.map((task, taskIndex) => {
      const id = claudeTaskId(level.id, taskIndex);
      const blocks: LessonBody["blocks"] = [
        {
          kind: "text",
          body: `${level.guide} **Your task:** ${task.mission}`,
        },
      ];

      if (task.example) {
        blocks.push({
          kind: "code",
          // Declared language wins; the sniff is only still here so the Level 1
          // and 2 examples that predate the field keep their highlighting.
          language:
            task.exampleLanguage ??
            (task.example.startsWith("claude") || task.example === "pwd" ? "bash" : "text"),
          caption: "Starting point — adapt it to your own safe practice setup",
          code: task.example,
        });
      }

      blocks.push(
        {
          kind: "callout",
          body: `**Do it now.** Work in a disposable or non-sensitive practice space. Keep this evidence: ${task.evidence}`,
        },
        {
          kind: "text",
          body: `**Safety check:** ${level.safety}`,
        },
        {
          kind: "code",
          language: "text",
          caption: "Official reference",
          code: level.reference,
        },
      );

      return [
        id,
        {
          summary: task.mission,
          attested: true,
          xp: ATTESTED_XP,
          blocks,
        },
      ];
    }),
  ),
);
