import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useAuth";

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  body: string;
  topic: string;
  likes: number;
  created_at: string;
  author: { display_name: string; level: number } | null;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: { display_name: string } | null;
}

export function usePosts(topic: string) {
  return useQuery({
    queryKey: ["community", "posts", topic],
    queryFn: async (): Promise<CommunityPost[]> => {
      let q = supabase
        .from("community_posts")
        .select("id, user_id, title, body, topic, likes, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (topic !== "all") q = q.eq("topic", topic);

      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as Omit<CommunityPost, "author">[];
      if (!rows.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, level")
        .in("id", [...new Set(rows.map((r) => r.user_id))]);

      const byId = new Map(
        ((profiles ?? []) as { id: string; display_name: string; level: number }[]).map((p) => [
          p.id,
          { display_name: p.display_name, level: p.level },
        ]),
      );
      return rows.map((r) => ({ ...r, author: byId.get(r.user_id) ?? null }));
    },
  });
}

export function useComments(postId: string | null) {
  return useQuery({
    queryKey: ["community", "comments", postId],
    enabled: Boolean(postId),
    queryFn: async (): Promise<PostComment[]> => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, post_id, user_id, body, created_at")
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Omit<PostComment, "author">[];
      if (!rows.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", [...new Set(rows.map((r) => r.user_id))]);
      const byId = new Map(
        ((profiles ?? []) as { id: string; display_name: string }[]).map((p) => [
          p.id,
          { display_name: p.display_name },
        ]),
      );
      return rows.map((r) => ({ ...r, author: byId.get(r.user_id) ?? null }));
    },
  });
}

export function useCreatePost() {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; body: string; topic: string }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        title: input.title,
        body: input.body,
        topic: input.topic,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community", "posts"] });
      toast.success("Posted to the community");
    },
    onError: () => toast.error("We could not post that. Try again in a moment."),
  });
}

export function useAddComment(postId: string) {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("post_comments")
        .insert({ post_id: postId, user_id: user.id, body });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community", "comments", postId] }),
    onError: () => toast.error("We could not add that comment."),
  });
}

/**
 * Likes are a plain counter on the row, and RLS only lets an author update their
 * own post — so a like on someone else's post is kept per-browser for now. Moving
 * this to a `post_likes` table with its own policy is the next step.
 */
const LIKE_KEY = "ascent.likes";

export function readLikes(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LIKE_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function writeLikes(next: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LIKE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — likes just don't persist */
  }
}
