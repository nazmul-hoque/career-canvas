import { projectById } from "@/content/projects";

/**
 * Mock reviewer. Swap the body of this function for a real LLM call — the shape
 * (submission in, markdown-ish feedback string out) is what the UI depends on.
 */
export function mockProjectFeedback(projectId: string, notes: string): string {
  const project = projectById(projectId);
  const req = project?.requirements ?? [];
  const mentioned = req.filter((r) =>
    r
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .some((w) => notes.toLowerCase().includes(w)),
  );
  const missing = req.filter((r) => !mentioned.includes(r));

  const lines: string[] = [];
  lines.push(
    mentioned.length
      ? `You've covered ${mentioned.length} of the ${req.length} requirements in your write-up — good, that's the part reviewers read first.`
      : `Start your notes with which requirements you met. Reviewers look for that before they open the repo.`,
  );
  if (missing.length) {
    lines.push(
      `I can't tell from your notes how you handled: ${missing.slice(0, 2).join("; ")}. Add a sentence on each — if you skipped one, say why. A deliberate omission reads better than a silent one.`,
    );
  }
  lines.push(
    `Two questions before you call it done: what breaks if the data is empty, and what would you change if this had to serve ten times the traffic? Write the answers in your README — that's the paragraph that gets you the interview.`,
  );
  return lines.join("\n\n");
}

/**
 * Ticked milestones, one row each. These used to live in component state, which
 * meant every reload wiped the learner's sense of where they were in a project.
 */
