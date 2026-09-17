import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useAuth";
import { achievementByKey } from "@/content/gamification";
import { completeLessonFn } from "@/lib/learning.functions";

export interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  career_path: string | null;
  goal: string | null;
  experience: string | null;
  hours_per_week: number | null;
  onboarded: boolean;
  xp: number;
  level: number;
  streak_current: number;
  streak_best: number;
  last_active_day: string | null;
  plan: string;
  /** Learning reminders. Opt-out; the unsubscribe link in every email flips it. */
  email_optin: boolean;
}

export interface ProgressRow {
  lesson_id: string;
  course_id: string;
  xp_earned: number;
  completed_at: string;
}

export function useProfile() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useProgress() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["progress", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<ProgressRow[]> => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id, course_id, xp_earned, completed_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as ProgressRow[];
    },
  });
}

export function useActivity() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["activity", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_activity")
        .select("day, xp")
        .eq("user_id", user!.id)
        .order("day", { ascending: true })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as { day: string; xp: number }[];
    },
  });
}

export function useAchievements(userId?: string) {
  const { user } = useSession();
  const id = userId ?? user?.id;
  return useQuery({
    queryKey: ["achievements", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_key, earned_at")
        .eq("user_id", id!)
        .order("earned_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as { achievement_key: string; earned_at: string }[];
    },
  });
}

export function useSubmissions(userId?: string) {
  const { user } = useSession();
  const id = userId ?? user?.id;
  return useQuery({
    queryKey: ["submissions", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_submissions")
        .select("*")
        .eq("user_id", id!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Fields a learner may write about themselves. xp, level and the streak columns
 * are deliberately absent — those are server-authored, and the matching
 * migration revokes the client's grant on them.
 */
export type EditableProfile = Pick<
  Profile,
  | "display_name"
  | "bio"
  | "avatar_url"
  | "career_path"
  | "goal"
  | "experience"
  | "hours_per_week"
  | "onboarded"
  | "email_optin"
>;

export function useUpdateProfile() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<EditableProfile>) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });
}

export function useUnlockAchievement() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", user.id)
        .eq("achievement_key", key)
        .maybeSingle();
      if (data) return false;
      const { error } = await supabase
        .from("user_achievements")
        .insert({ user_id: user.id, achievement_key: key });
      if (error) throw error;
      return true;
    },
    onSuccess: (unlocked, key) => {
      if (!unlocked) return;
      const a = achievementByKey(key);
      if (a) toast.success(`Achievement unlocked: ${a.name}`, { description: a.description });
      qc.invalidateQueries({ queryKey: ["achievements", user?.id] });
    },
  });
}

interface CompleteArgs {
  courseId: string;
  lessonId: string;
  /** Answers given, keyed by block id — re-checked on the server. */
  answers: Record<string, string | number>;
  challengeSolved: boolean;
}

/**
 * Completion is a server call. XP, level, streak and the progress row are all
 * derived and written in `src/lib/learning.functions.ts` from the lesson's
 * authored body — the client cannot name its own reward.
 */
export function useCompleteLesson() {
  const { user } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: CompleteArgs) => {
      if (!user) throw new Error("Not signed in");
      return completeLessonFn({ data: args });
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["progress", user?.id] });
      qc.invalidateQueries({ queryKey: ["activity", user?.id] });
      qc.invalidateQueries({ queryKey: ["achievements", user?.id] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      result.newlyUnlocked.forEach((key) => {
        const a = achievementByKey(key);
        if (a) toast.success(`Achievement unlocked: ${a.name}`, { description: a.description });
      });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "We could not save that. Try again in a moment.",
      ),
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, xp, level, streak_current, career_path")
        .order("xp", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });
}
