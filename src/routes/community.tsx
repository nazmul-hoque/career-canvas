import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Heart, MessageSquare, PenLine, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatPill } from "@/components/common/StatPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSession } from "@/hooks/useAuth";
import { useLeaderboard } from "@/hooks/useLearner";
import {
  useAddComment,
  useComments,
  useCreatePost,
  usePosts,
  readLikes,
  writeLikes,
} from "@/hooks/useCommunity";
import { seedPosts, topics, type SeedPost } from "@/content/community";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — Ascent" },
      {
        name: "description",
        content:
          "Ask questions, share what finally clicked, and read how other learners got unstuck on JavaScript, React, Python, design and the job search.",
      },
      { property: "og:title", content: "Community — Ascent" },
      {
        property: "og:description",
        content: "Questions, answers and progress from people learning the same thing you are.",
      },
    ],
  }),
  component: Community,
});

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/** Live posts and seed posts render through the same shape. */
interface FeedItem {
  id: string;
  author: string;
  initials: string;
  level: number;
  topic: string;
  title: string;
  body: string;
  likes: number;
  ago: string;
  trending: boolean;
  seedComments: SeedPost["comments"];
  live: boolean;
}

function Community() {
  const { user } = useSession();
  const [topic, setTopic] = useState("all");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postTopic, setPostTopic] = useState("general");
  const [likes, setLikes] = useState<Record<string, boolean>>({});

  const { data: livePosts = [], isLoading } = usePosts(topic);
  const { data: board = [] } = useLeaderboard();
  const createPost = useCreatePost();

  useEffect(() => setLikes(readLikes()), []);

  function toggleLike(id: string) {
    setLikes((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      writeLikes(next);
      return next;
    });
  }

  const feed = useMemo<FeedItem[]>(() => {
    const live: FeedItem[] = livePosts.map((p) => ({
      id: p.id,
      author: p.author?.display_name ?? "Learner",
      initials: initialsOf(p.author?.display_name ?? "Learner"),
      level: p.author?.level ?? 1,
      topic: p.topic,
      title: p.title,
      body: p.body,
      likes: p.likes,
      ago: timeAgo(p.created_at),
      trending: false,
      seedComments: [],
      live: true,
    }));

    const seeds: FeedItem[] = seedPosts
      .filter((p) => topic === "all" || p.topic === topic)
      .map((p) => ({
        id: p.id,
        author: p.author,
        initials: p.initials,
        level: p.level,
        topic: p.topic,
        title: p.title,
        body: p.body,
        likes: p.likes,
        ago: p.ago,
        trending: Boolean(p.trending),
        seedComments: p.comments,
        live: false,
      }));

    return [...live, ...seeds];
  }, [livePosts, topic]);

  const trending = seedPosts.filter((p) => p.trending).slice(0, 3);

  return (
    <AppShell>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Community</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Someone else hit this exact error last Tuesday.
          </h1>
          <p className="mt-2 text-chalk">
            Ask the question you think is too basic. It isn't, and the answer helps the next five
            people who search it.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" disabled={!user}>
              <PenLine className="mr-1.5 size-4" /> New post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a discussion</DialogTitle>
              <DialogDescription>
                Include what you tried and what happened — that's what gets a useful reply.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim() || !body.trim()) return;
                createPost.mutate(
                  { title, body, topic: postTopic },
                  {
                    onSuccess: () => {
                      setTitle("");
                      setBody("");
                      setOpen(false);
                    },
                  },
                );
              }}
            >
              <div>
                <Label htmlFor="post-title">Title</Label>
                <Input
                  id="post-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My useEffect runs twice and I can't work out why"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="post-topic">Topic</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {topics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPostTopic(t.id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        postTopic === t.id
                          ? "bg-brand text-brand-foreground"
                          : "bg-secondary text-chalk ring-1 ring-border",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="post-body">Details</Label>
                <Textarea
                  id="post-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="What did you expect, what happened instead, and what have you already ruled out?"
                  className="mt-1.5"
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createPost.isPending || !title.trim() || !body.trim()}
                >
                  {createPost.isPending ? "Posting…" : "Post"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {!user ? (
        <div className="card-surface mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-sm text-chalk">
            Reading is open to everyone. Sign in to post, comment and appear on the leaderboard.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTopic("all")}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                topic === "all"
                  ? "bg-brand text-brand-foreground"
                  : "bg-card text-chalk ring-1 ring-border hover:text-foreground",
              )}
            >
              All
            </button>
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => setTopic(t.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  topic === t.id
                    ? "bg-brand text-brand-foreground"
                    : "bg-card text-chalk ring-1 ring-border hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {isLoading && feed.length === 0
              ? [0, 1, 2].map((i) => (
                  <div key={i} className="card-surface space-y-3 p-5">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ))
              : feed.map((item) => (
                  <PostCard
                    key={item.id}
                    item={item}
                    liked={Boolean(likes[item.id])}
                    onLike={() => toggleLike(item.id)}
                    canComment={Boolean(user)}
                  />
                ))}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <TrendingUp className="size-4 text-ember" /> Trending
            </h2>
            <ul className="mt-3 space-y-3">
              {trending.map((p) => (
                <li key={p.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-semibold leading-snug">{p.title}</p>
                  <p className="mt-1 text-xs text-chalk">
                    {p.author} · {p.likes} likes · {p.comments.length} replies
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="card-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Users className="size-4 text-brand" /> Top learners
              </h2>
              <Link to="/leaderboard" className="text-xs font-semibold text-brand hover:underline">
                Full board
              </Link>
            </div>
            <ul className="mt-3 space-y-2.5">
              {board.slice(0, 5).map((row, i) => {
                const r = row as {
                  id: string;
                  display_name: string;
                  xp: number;
                  level: number;
                  streak_current: number;
                };
                return (
                  <li key={r.id} className="flex items-center gap-3">
                    <span className="w-5 font-mono text-xs font-bold text-chalk">{i + 1}</span>
                    <Avatar className="size-8 border border-border">
                      <AvatarFallback className="bg-ink text-[10px] font-bold text-white">
                        {initialsOf(r.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{r.display_name}</div>
                      <div className="text-xs text-chalk">Level {r.level}</div>
                    </div>
                    <span className="text-xs font-bold text-brand">{r.xp.toLocaleString()}</span>
                  </li>
                );
              })}
              {board.length === 0 ? (
                <li className="text-sm text-chalk">No learners on the board yet. Be first.</li>
              ) : null}
            </ul>
          </section>

          <section className="card-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Flame className="size-4 text-ember" /> House rules
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-chalk">
              <li>Paste the error, not a description of the error.</li>
              <li>Say what you already tried.</li>
              <li>Answer with a question first when someone is close.</li>
              <li>No full solutions on someone else's challenge.</li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function PostCard({
  item,
  liked,
  onLike,
  canComment,
}: {
  item: FeedItem;
  liked: boolean;
  onLike: () => void;
  canComment: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const { data: liveComments = [] } = useComments(item.live && showComments ? item.id : null);
  const addComment = useAddComment(item.id);

  const commentCount = item.live ? liveComments.length : item.seedComments.length;

  return (
    <article className="card-surface p-5">
      <div className="flex items-start gap-3">
        <Avatar className="size-10 border border-border">
          <AvatarFallback className="bg-ink text-xs font-bold text-white">
            {item.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-chalk">
            <span className="font-semibold text-foreground">{item.author}</span>
            <span>Level {item.level}</span>
            <span>·</span>
            <span>{item.ago} ago</span>
            <StatPill className="ml-1">{item.topic}</StatPill>
            {item.trending ? <StatPill tone="ember">Trending</StatPill> : null}
          </div>

          <h3 className="mt-2 font-display text-lg font-bold leading-snug">{item.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-chalk">{item.body}</p>

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={onLike}
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
                liked ? "text-ember" : "text-chalk hover:text-foreground",
              )}
              aria-pressed={liked}
            >
              <Heart className={cn("size-4", liked && "fill-ember")} />
              {item.likes + (liked ? 1 : 0)}
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-chalk transition-colors hover:text-foreground"
            >
              <MessageSquare className="size-4" />
              {commentCount}
            </button>
          </div>

          {showComments ? (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              {(item.live
                ? liveComments.map((c) => ({
                    key: c.id,
                    author: c.author?.display_name ?? "Learner",
                    body: c.body,
                    ago: timeAgo(c.created_at),
                  }))
                : item.seedComments.map((c, i) => ({
                    key: `${item.id}-${i}`,
                    author: c.author,
                    body: c.body,
                    ago: c.ago,
                  }))
              ).map((c) => (
                <div key={c.key} className="rounded-xl bg-secondary p-3.5">
                  <div className="text-xs font-semibold text-foreground">
                    {c.author} <span className="font-normal text-chalk">· {c.ago} ago</span>
                  </div>
                  <p className="mt-1 text-sm text-chalk">{c.body}</p>
                </div>
              ))}

              {commentCount === 0 ? <p className="text-sm text-chalk">No replies yet.</p> : null}

              {item.live && canComment ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!draft.trim()) return;
                    addComment.mutate(draft, { onSuccess: () => setDraft("") });
                  }}
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Add a reply…"
                  />
                  <Button type="submit" size="sm" disabled={addComment.isPending || !draft.trim()}>
                    Reply
                  </Button>
                </form>
              ) : null}

              {!item.live ? (
                <p className="text-xs text-chalk">
                  This is a seeded example thread — replies are shown read-only.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
