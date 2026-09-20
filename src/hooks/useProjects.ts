import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useAuth";
import { achievementByKey } from "@/content/gamification";
import { publishProjectFn, submitProjectFn } from "@/lib/projects.functions";
import { track } from "@/lib/analytics";

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
  is_published: boolean;
  public_summary: string;
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

export function useProjectMilestones(projectId: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["project-milestones", user?.id, projectId],
    enabled: Boolean(user),
    queryFn: async (): Promise<number[]> => {
      const { data, error } = await supabase
        .from("project_milestones")
        .select("milestone_index")
        .eq("user_id", user!.id)
        .eq("project_id", projectId);
      if (error) throw error;
      return ((data ?? []) as { milestone_index: number }[]).map((r) => r.milestone_index);
    },
  });
}

export function useToggleMilestone(projectId: string) {
  const { user } = useSession();
  const qc = useQueryClient();
  const key = ["project-milestones", user?.id, projectId];

  return useMutation({
    mutationFn: async ({ index, checked }: { index: number; checked: boolean }) => {
      if (!user) throw new Error("Not signed in");
      if (checked) {
        const { error } = await supabase
          .from("project_milestones")
          .insert({ user_id: user.id, project_id: projectId, milestone_index: index });
        // A double-click can race the optimistic update into a duplicate key.
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("project_milestones")
          .delete()
          .eq("user_id", user.id)
          .eq("project_id", projectId)
          .eq("milestone_index", index);
        if (error) throw error;
      }
    },
    onMutate: async ({ index, checked }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<number[]>(key) ?? [];
      qc.setQueryData<number[]>(
        key,
        checked ? [...previous, index] : previous.filter((i) => i !== index),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      qc.setQueryData(key, context?.previous ?? []);
      toast.error("We could not save that tick. Try again in a moment.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useSubmitProject(projectId: string) {
  const { user } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { repo_url: string; live_url: string; notes: string }) => {
      if (!user) throw new Error("Not signed in");
      // Server-side: the Pro gate and the review both live there now.
      const result = await submitProjectFn({
        data: {
          projectId,
          repoUrl: input.repo_url,
          liveUrl: input.live_url,
          notes: input.notes,
        },
      });

      track("project_submitted", {
        project_id: projectId,
        first_time: result.firstTime,
        has_repo: Boolean(input.repo_url),
        has_live_url: Boolean(input.live_url),
        notes_length: input.notes.trim().length,
      });

      return result;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["submission", user?.id, projectId] });
      qc.invalidateQueries({ queryKey: ["submissions", user?.id] });
      qc.invalidateQueries({ queryKey: ["public-submissions", user?.id] });
      qc.invalidateQueries({ queryKey: ["achievements", user?.id] });
      toast.success(result.firstTime ? "Project submitted" : "Submission updated", {
        description: "Automated feedback on your write-up is below. Code has not been reviewed.",
      });
      if (result.unlockedAchievement) {
        const a = achievementByKey("project-complete");
        if (a) toast.success(`Achievement unlocked: ${a.name}`, { description: a.description });
      }
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "We could not save that submission."),
  });
}

export function usePublishProject(projectId: string) {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { published: boolean; summary: string }) =>
      publishProjectFn({ data: { projectId, ...input } }),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ["submission", user?.id, projectId] });
      void qc.invalidateQueries({ queryKey: ["submissions", user?.id] });
      void qc.invalidateQueries({ queryKey: ["public-submissions", user?.id] });
      toast.success(result.published ? "Project published" : "Project is private");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not change publication."),
  });
}
