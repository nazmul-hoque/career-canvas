import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mentorMonthStart } from "@/lib/entitlements";
import { useSession } from "./useAuth";
import { useEntitlements } from "./useEntitlements";

/**
 * Mentor messages left this month, counted the way mentorReplyFn counts them,
 * so a learner sees the allowance before spending it rather than after. Null
 * when there's no limit to show (signed out, still loading, or not enforced).
 */
export function useMentorAllowance() {
  const { user } = useSession();
  const { entitlements, enforced, plan } = useEntitlements();
  const usage = useQuery({
    queryKey: ["mentor-usage", user?.id],
    enabled: Boolean(user) && enforced,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("mentor_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("role", "user")
        .gte("created_at", mentorMonthStart());
      if (error) throw error;
      return count ?? 0;
    },
  });
  if (usage.data === undefined) return null;
  const cap = entitlements.mentorMessagesPerMonth;
  return { cap, remaining: Math.max(0, cap - usage.data), plan };
}
