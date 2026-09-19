import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useAuth";
import { submitReviewFn } from "@/lib/review.functions";

/**
 * The spaced-review queue.
 *
 * Read-only from the browser — `review_items` grants the learner SELECT and
 * nothing else, because the due date decides when XP is available and would
 * otherwise be the easiest number in the app to move.
 */

export interface ReviewItem {
  id: string;
  course_id: string;
  lesson_id: string;
  due_on: string;
  interval_days: number;
  streak: number;
  lapses: number;
  last_reviewed_at: string | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export function useReviewQueue() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["reviews", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<ReviewItem[]> => {
      const { data, error } = await supabase
        .from("review_items")
        .select("id, course_id, lesson_id, due_on, interval_days, streak, lapses, last_reviewed_at")
        .eq("user_id", user!.id)
        .order("due_on", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReviewItem[];
    },
  });
}

/** Items that are due today or overdue — the only ones worth XP. */
export const dueItems = (items: ReviewItem[]): ReviewItem[] =>
  items.filter((i) => i.due_on <= today());

export function useSubmitReview() {
  const { user } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      courseId: string;
      lessonId: string;
      answers: Record<string, string | number>;
    }) => {
      if (!user) throw new Error("Not signed in");
      return submitReviewFn({ data: args });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["activity", user?.id] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save that review."),
  });
}
