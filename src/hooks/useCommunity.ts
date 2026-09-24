import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useAuth";
import { rankTrending, TRENDING_WINDOW_DAYS } from "@/lib/community-feed";

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

export function useManagePost(postId: string) {
  const { user } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input:
        | { action: "edit"; title: string; body: string }
        | { action: "delete" }
        | { action: "report"; reason: string },
    ) => {
      if (!user) throw new Error("Sign in to manage discussions.");
      if (input.action === "report") {
        const reason = input.reason.trim();
        if (reason.length < 10 || reason.length > 2000)
          throw new Error("Describe the issue in 10–2000 characters.");
        const { error } = await supabase
          .from("community_reports")
          .insert({ post_id: postId, reporter_id: user.id, reason });
        if (error && error.code !== "23505")
          throw new Error("Your report could not be saved. Try again.");
        return input.action;
      }
      if (
        input.action === "edit" &&
        (!input.title.trim() ||
          !input.body.trim() ||
          input.title.length > 200 ||
          input.body.length > 10000)
      )
        throw new Error("Add a title (up to 200 characters) and post (up to 10,000 characters).");
      const query =
        input.action === "delete"
          ? supabase.from("community_posts").delete()
          : supabase
              .from("community_posts")
              .update({ title: input.title.trim(), body: input.body.trim() });
      const { data, error } = await query.eq("id", postId).eq("user_id", user.id).select("id");
      if (error || !data?.length)
        throw new Error("This post could not be changed. It may have been removed.");
      return input.action;
    },
    onSuccess: (action) => {
      void qc.invalidateQueries({ queryKey: ["community", "posts"] });
      toast.success(
        action === "report"
          ? "Report recorded for moderation"
          : action === "delete"
            ? "Post deleted"
            : "Post updated",
      );
    },
    onError: (error) => toast.error(error.message),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community", "comments", postId] });
      // Replies count towards trending.
      qc.invalidateQueries({ queryKey: trendingKey });
    },
    onError: () => toast.error("We could not add that comment."),
  });
}

/**
 * Likes are rows in `post_likes`, one per (post, learner), with a trigger keeping
 * `community_posts.likes` in step. They used to live in localStorage, which made
 * them per-browser and invisible to the person who wrote the post.
 *
 * Seeded example posts live in src/content/community.ts rather than the
 * database, so they carry a static count and cannot be liked — the same
 * read-only treatment their comment threads already get.
 */
export function useMyLikes() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["community", "likes", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return ((data ?? []) as { post_id: string }[]).map((r) => r.post_id);
    },
  });
}

export function useToggleLike() {
  const { user } = useSession();
  const qc = useQueryClient();
  const key = ["community", "likes", user?.id];

  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (!user) throw new Error("Not signed in");
      if (liked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });
        // Double-click racing the optimistic update — the row is already there.
        if (error && error.code !== "23505") throw error;
      }
    },
    onMutate: async ({ postId, liked }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<string[]>(key) ?? [];
      qc.setQueryData<string[]>(
        key,
        liked ? previous.filter((id) => id !== postId) : [...previous, postId],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      qc.setQueryData(key, context?.previous ?? []);
      toast.error("We could not save that like.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["community", "posts"] });
    },
  });
}

// Both sit under ["community", "posts"] so every write that already refreshes the
// feed (post, delete, like, admin moderation) refreshes these too. The object
// segment keeps them from colliding with a topic id.
const postCountKey = ["community", "posts", { summary: "count" }] as const;
const trendingKey = ["community", "posts", { summary: "trending" }] as const;

/** How many real posts exist, across every topic — what decides whether examples show. */
export function useRealPostCount() {
  return useQuery({
    queryKey: postCountKey,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("community_posts")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export interface TrendingPost {
  id: string;
  title: string;
  author: string;
  likes: number;
  replies: number;
  createdAt: string;
}

/** Real posts from the trending window with their reply counts, ranked by `rankTrending`. */
export function useTrendingPosts() {
  return useQuery({
    queryKey: trendingKey,
    queryFn: async (): Promise<TrendingPost[]> => {
      const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 86_400_000).toISOString();
      const { data, error } = await supabase
        .from("community_posts")
        .select("id, user_id, title, likes, created_at")
        .gte("created_at", since)
        .order("likes", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = data ?? [];
      if (!rows.length) return [];

      const ids = rows.map((r) => r.id);
      const [{ data: comments, error: commentsError }, { data: profiles }] = await Promise.all([
        supabase.from("post_comments").select("post_id").in("post_id", ids),
        supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", [...new Set(rows.map((r) => r.user_id))]),
      ]);
      if (commentsError) throw commentsError;

      const replies = new Map<string, number>();
      for (const c of comments ?? []) replies.set(c.post_id, (replies.get(c.post_id) ?? 0) + 1);
      const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

      return rankTrending(
        rows.map((r) => ({
          id: r.id,
          title: r.title,
          author: names.get(r.user_id) ?? "Learner",
          likes: r.likes,
          replies: replies.get(r.id) ?? 0,
          createdAt: r.created_at,
        })),
      );
    },
  });
}
