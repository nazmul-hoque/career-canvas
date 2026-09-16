import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useAuth";
import { achievementByKey } from "@/content/gamification";
import { projectById } from "@/content/projects";

export interface Submission {
  id: string;
  user_id: string;
  project_id: string;
  repo_url: string | null;
  live_url: string | null;
  notes: string | null;
  status: string;
  feedback: string | null;
  created_at: string;
}

export function useSubmission(projectId: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["submission", user?.id, projectId],
    enabled: Boolean(user),
    queryFn: async (): Promise<Submission | null> => {
      const { data, error } = await supabase
        .from("project_submissions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return (data as Submission) ?? null;
    },
  });
}

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

export function useSubmitProject(projectId: string) {
  const { user } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { repo_url: string; live_url: string; notes: string }) => {
      if (!user) throw new Error("Not signed in");
      const feedback = mockProjectFeedback(projectId, input.notes);

      const { data: existing } = await supabase
        .from("project_submissions")
        .select("id")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .maybeSingle();

      const row = {
        user_id: user.id,
        project_id: projectId,
        repo_url: input.repo_url || null,
        live_url: input.live_url || null,
        notes: input.notes || null,
        status: "submitted",
        feedback,
      };

      if (existing) {
        const { error } = await supabase
          .from("project_submissions")
          .update(row)
          .eq("id", (existing as { id: string }).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_submissions").insert(row);
        if (error) throw error;
      }

      const { data: has } = await supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", user.id)
        .eq("achievement_key", "project-complete")
        .maybeSingle();
      let unlocked = false;
      if (!has) {
        await supabase
          .from("user_achievements")
          .insert({ user_id: user.id, achievement_key: "project-complete" });
        unlocked = true;
      }

      return { feedback, unlocked, firstTime: !existing };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["submission", user?.id, projectId] });
      qc.invalidateQueries({ queryKey: ["submissions", user?.id] });
      qc.invalidateQueries({ queryKey: ["achievements", user?.id] });
      toast.success(result.firstTime ? "Project submitted" : "Submission updated", {
        description: "Your mentor review is below.",
      });
      if (result.unlocked) {
        const a = achievementByKey("project-complete");
        if (a) toast.success(`Achievement unlocked: ${a.name}`, { description: a.description });
      }
    },
    onError: () => toast.error("We could not save that submission. Try again in a moment."),
  });
}
