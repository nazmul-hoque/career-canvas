import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { seedPosts, topics } from "@/content/community";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Community — Ascent" },
      { name: "description", content: "Ask questions, share wins and unblock each other. Real answers from people a few steps ahead of you." },
      { property: "og:title", content: "Community — Ascent" },
      { property: "og:description", content: "Ask questions, share wins and unblock each other." },
    ],
  }),
  component: Community,
});

interface DbPost {
  id: string;
  user_id: string;
  title: string;
  body: string;
  topic: string;
  likes: number;
  created_at: string;
}

function useCommunityPosts() {
  return useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("id, user_id, title, body, topic, likes, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as DbPost[];
    },
  });
}

function Community() {
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: posts = [], isLoading } = useCommunityPosts();

  const [topic, setTopic] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postTopic, setPostTopic] = useState("general");
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const combined = [
    ...posts.map((p) => ({
      id: p.id,
      author: "Ascent learner",
      initials: "AL",
      level: 1,
      topic: p.topic,
      title: p.title,
      body: p.body,
      likes: p.likes,
      comments: [] as { author: string; initials: string; body: string; ago: string }[],
      ago: "just now",
      trending: false,
    })),
    ...seedPosts,
  ].filter((p) => topic === "all" || p.topic === topic);

  const trending = seedPosts.filter((p) => p.trending);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Sign in to post");
      navigate({ to: "/auth" });
      return;
    }
    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      title,
      body,
      topic: postTopic,
    });
    setPosting(false);
    if (error) {
      toast.error("Couldn't post that", { description: error.message });
      return;
    }
    setTitle("");
    setBody("");
    qc.invalidateQueries({ queryKey: ["community-posts"] });
    toast.success("Posted to the community");
  }

  return (
    <AppShell>
      <header className="max-w-2xl">
        <p className="eyebrow">Community</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">Nobody climbs alone</h1>
        <p className="mt-3 text-chalk">Post a blocker, share a win, or answer someone a step behind you.</p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <section className="card-surface p-5">
            <form onSubmit={createPost} className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind?"
                required
                aria-label="Post title"
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add the detail — code, error message, what you already tried."
                rows={3}
                required
                aria-label="Post body"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPostTopic(t.id)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                        postTopic === t.id ? "bg-ink text-white" : "bg-secondary text-chalk",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <Button type="submit" disabled={posting}>
                  {posting ? <Loader2 className="size-4 animate-spin" /> : null} Post
                </Button>
              </div>
            </form>
          </section>

          <div className="flex flex-wrap gap-1.5">
            {[{ id: "all", label: "All" }, ...topics].map((t) => (
              <button
                key={t.id}
                onClick={() => setTopic(t.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                  topic === t.id ? "bg-ink text-white" : "bg-secondary text-chalk hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="card-surface h-32 animate-pulse" />
          ) : (
            combined.map((post) => (
              <article key={post.id} className="card-surface p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-ink text-xs font-bold text-white">
                    {post.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{post.author}</span>
                    <span className="block text-xs text-chalk">
                      Level {post.level} · {post.ago}
                    </span>
                  </span>
                  <span className="ml-auto rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-chalk">
                    {post.topic}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-lg font-bold">{post.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-chalk">{post.body}</p>

                <div className="mt-4 flex items-center gap-5 text-sm font-semibold text-chalk">
                  <button
                    onClick={() => setLiked((l) => ({ ...l, [post.id]: !l[post.id] }))}
                    className={cn("flex items-center gap-1.5 transition-colors", liked[post.id] && "text-ember")}
                  >
                    <Heart className={cn("size-4", liked[post.id] && "fill-ember")} />
                    {post.likes + (liked[post.id] ? 1 : 0)}
                  </button>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="size-4" /> {post.comments.length}
                  </span>
                </div>

                {post.comments.length ? (
                  <ul className="mt-4 space-y-3 border-t border-border pt-4">
                    {post.comments.map((c, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-bold">
                          {c.initials}
                        </span>
                        <span className="text-sm">
                          <span className="font-semibold">{c.author}</span>{" "}
                          <span className="text-xs text-chalk">{c.ago}</span>
                          <span className="mt-0.5 block text-chalk">{c.body}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))
          )}
        </div>

        <aside className="space-y-5">
          <section className="card-surface p-6">
            <p className="eyebrow flex items-center gap-1.5">
              <TrendingUp className="size-3.5" /> Trending
            </p>
            <ul className="mt-3 space-y-3">
              {trending.map((p) => (
                <li key={p.id} className="text-sm">
                  <span className="block font-semibold leading-snug">{p.title}</span>
                  <span className="block text-xs text-chalk">
                    {p.likes} likes · {p.comments.length} replies
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="card-surface p-6">
            <p className="eyebrow">House rules</p>
            <ul className="mt-3 space-y-2 text-sm text-chalk">
              <li>Post the error, not just "it doesn't work".</li>
              <li>Answer one question for every one you ask.</li>
              <li>No spoilers on challenge solutions — hints only.</li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
