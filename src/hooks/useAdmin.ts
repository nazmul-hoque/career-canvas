import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useAuth";
import {
  adminActionsFn,
  adminCourseUsageFn,
  adminDeletePostFn,
  adminDeleteUserFn,
  adminListUsersFn,
  adminMetricsFn,
  adminModerationFn,
  adminSetPlanFn,
  adminSetReportStatusFn,
  adminSetSuspendedFn,
  adminUnpublishProjectFn,
  adminUserDetailFn,
} from "@/lib/admin.functions";

/**
 * Whether to show admin UI. Reads the learner's own `admin_users` row, which is
 * all RLS lets them see — and all this decides is what to render. The server
 * functions behind every admin action check again for themselves.
 */
export function useIsAdmin() {
  const { user } = useSession();
  const query = useQuery({
    queryKey: ["admin", "self", user?.id],
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      // A missing table (migration not applied) reads as "not an admin", not an error page.
      if (error) return false;
      return Boolean(data);
    },
  });
  return { isAdmin: query.data ?? false, isLoading: query.isLoading };
}

const errorToast = (fallback: string) => (error: unknown) =>
  toast.error(error instanceof Error ? error.message : fallback);

export function useAdminUsers(query: string, page: number) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["admin", "users", user?.id, query, page],
    enabled: Boolean(user),
    placeholderData: keepPreviousData,
    queryFn: () => adminListUsersFn({ data: { query, page } }),
  });
}

export function useAdminUserDetail(userId: string | null) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["admin", "user", user?.id, userId],
    enabled: Boolean(user && userId),
    queryFn: () => adminUserDetailFn({ data: { userId: userId! } }),
  });
}

export function useAdminModeration(reportStatus: "open" | "resolved" | "dismissed") {
  const { user } = useSession();
  return useQuery({
    queryKey: ["admin", "moderation", user?.id, reportStatus],
    enabled: Boolean(user),
    queryFn: () => adminModerationFn({ data: { reportStatus } }),
  });
}

export function useAdminMetrics(days: number) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["admin", "metrics", user?.id, days],
    enabled: Boolean(user),
    queryFn: () => adminMetricsFn({ data: { days } }),
  });
}

export function useAdminCourseUsage() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["admin", "course-usage", user?.id],
    enabled: Boolean(user),
    queryFn: () => adminCourseUsageFn(),
  });
}

export function useAdminActions() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["admin", "actions", user?.id],
    enabled: Boolean(user),
    queryFn: () => adminActionsFn(),
  });
}

/** Every admin write invalidates the whole admin cache: the lists overlap. */
function useAdminMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  messages: { success: string; failure: string },
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(messages.success);
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["community"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: errorToast(messages.failure),
  });
}

export const useAdminSetPlan = () =>
  useAdminMutation(
    (args: { userId: string; plan: "free" | "pro" | "lifetime" }) => adminSetPlanFn({ data: args }),
    { success: "Plan updated.", failure: "Could not change the plan." },
  );

export const useAdminSetSuspended = () =>
  useAdminMutation(
    (args: { userId: string; suspended: boolean }) => adminSetSuspendedFn({ data: args }),
    { success: "Account updated.", failure: "Could not update the account." },
  );

export const useAdminDeleteUser = () =>
  useAdminMutation((args: { userId: string }) => adminDeleteUserFn({ data: args }), {
    success: "Account deleted.",
    failure: "Could not delete the account.",
  });

export const useAdminSetReportStatus = () =>
  useAdminMutation(
    (args: { reportId: string; status: "open" | "resolved" | "dismissed" }) =>
      adminSetReportStatusFn({ data: args }),
    { success: "Report updated.", failure: "Could not update the report." },
  );

export const useAdminDeletePost = () =>
  useAdminMutation((args: { postId: string }) => adminDeletePostFn({ data: args }), {
    success: "Post deleted.",
    failure: "Could not delete the post.",
  });

export const useAdminUnpublishProject = () =>
  useAdminMutation((args: { submissionId: string }) => adminUnpublishProjectFn({ data: args }), {
    success: "Project removed from the public portfolio.",
    failure: "Could not unpublish it.",
  });
