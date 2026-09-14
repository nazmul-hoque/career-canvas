import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useAuth";
import { levelFromXp, achievementByKey } from "@/content/gamification";

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
}

export interface ProgressRow {
  lesson_id: string;
  course_id: string;
  xp_earned: number;
  completed_at: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

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

export function useUpdateProfile() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
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
  xp: number;
  isChallenge?: boolean;
}

export function useCompleteLesson() {
  const { user } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, lessonId, xp, isChallenge }: CompleteArgs) => {
      if (!user) throw new Error("Not signed in");

      const { data: existing } = await supabase
        .from("lesson_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      const firstTime = !existing;
      if (firstTime) {
        const { error } = await supabase.from("lesson_progress").insert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          xp_earned: xp,
        });
        if (error) throw error;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, streak_current, streak_best, last_active_day")
        .eq("id", user.id)
        .maybeSingle();

      const day = today();
      const gained = firstTime ? xp : 0;
      const newXp = (profile?.xp ?? 0) + gained;
      const previousLevel = levelFromXp(profile?.xp ?? 0).level;
      const nextLevel = levelFromXp(newXp).level;

      let streak = profile?.streak_current ?? 0;
      const last = profile?.last_active_day ?? null;
      if (!last) streak = 1;
      else {
        const gap = daysBetween(last, day);
        if (gap === 1) streak += 1;
        else if (gap > 1) streak = 1;
        else streak = Math.max(streak, 1);
      }

      await supabase
        .from("profiles")
        .update({
          xp: newXp,
          level: nextLevel,
          streak_current: streak,
          streak_best: Math.max(streak, profile?.streak_best ?? 0),
          last_active_day: day,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (gained > 0) {
        const { data: act } = await supabase
          .from("daily_activity")
          .select("id, xp")
          .eq("user_id", user.id)
          .eq("day", day)
          .maybeSingle();
        if (act) {
          await supabase
            .from("daily_activity")
            .update({ xp: act.xp + gained })
            .eq("id", act.id);
        } else {
          await supabase.from("daily_activity").insert({ user_id: user.id, day, xp: gained });
        }
      }

      const { count } = await supabase
        .from("lesson_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const unlocks: string[] = [];
      if ((count ?? 0) >= 1) unlocks.push("first-lesson");
      if ((count ?? 0) >= 10) unlocks.push("ten-lessons");
      if (isChallenge) unlocks.push("first-challenge");
      if (newXp >= 1000) unlocks.push("xp-1000");
      if (streak >= 7) unlocks.push("streak-7");
      if (streak >= 30) unlocks.push("streak-30");
      if (lessonId === "js-debug.fixit") unlocks.push("debug-master");

      const newlyUnlocked: string[] = [];
      for (const key of unlocks) {
        const { data: has } = await supabase
          .from("user_achievements")
          .select("id")
          .eq("user_id", user.id)
          .eq("achievement_key", key)
          .maybeSingle();
        if (!has) {
          await supabase.from("user_achievements").insert({ user_id: user.id, achievement_key: key });
          newlyUnlocked.push(key);
        }
      }

      return {
        firstTime,
        gained,
        newXp,
        streak,
        leveledUp: nextLevel > previousLevel,
        level: nextLevel,
        newlyUnlocked,
      };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["progress", user?.id] });
      qc.invalidateQueries({ queryKey: ["activity", user?.id] });
      qc.invalidateQueries({ queryKey: ["achievements", user?.id] });
      result.newlyUnlocked.forEach((key) => {
        const a = achievementByKey(key);
        if (a) toast.success(`Achievement unlocked: ${a.name}`, { description: a.description });
      });
    },
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
