import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Flag } from "lucide-react";
import { QueryError } from "@/components/common/QueryError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { projectById } from "@/content/projects";
import {
  useAdminDeletePost,
  useAdminModeration,
  useAdminSetReportStatus,
  useAdminUnpublishProject,
} from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import { formatDate } from "./format";

const STATUSES = ["open", "resolved", "dismissed"] as const;
type ReportStatus = (typeof STATUSES)[number];

export function AdminModeration() {
  const [status, setStatus] = useState<ReportStatus>("open");
  const moderation = useAdminModeration(status);
  const setReport = useAdminSetReportStatus();
  const unpublish = useAdminUnpublishProject();

  if (moderation.isError) {
    return (
      <QueryError
        title="Couldn't load moderation"
        retry={moderation.refetch}
        busy={moderation.isFetching}
      />
    );
  }

  const data = moderation.data;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Reports</h2>
          <div
            role="tablist"
            aria-label="Report status"
            className="flex gap-1 rounded-lg bg-secondary p-1"
          >
            {STATUSES.map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-semibold capitalize",
                  status === s
                    ? "bg-card text-foreground shadow-card"
                    : "text-chalk hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {!data ? (
          <Skeleton className="h-32 w-full" />
        ) : data.reports.length === 0 ? (
          <p className="card-surface px-5 py-8 text-center text-sm text-chalk">
            No {status} reports.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.reports.map((report) => (
              <li key={report.id} className="card-surface space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-chalk">
                  <Flag className="size-3.5 text-destructive" />
                  Reported by {report.reporter} · {formatDate(report.createdAt)}
                </div>
                <p className="text-sm">“{report.reason}”</p>
                {report.post ? (
                  <div className="rounded-lg border border-border p-3">
                    <p className="font-semibold">{report.post.title}</p>
                    <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-chalk">
                      {report.post.body}
                    </p>
                    <p className="mt-2 text-xs text-chalk">by {report.post.author}</p>
                  </div>
                ) : (
                  <p className="text-sm text-chalk">The reported post has been deleted.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {report.post ? (
                    <DeletePostButton postId={report.post.id} title={report.post.title} />
                  ) : null}
                  {status !== "resolved" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={setReport.isPending}
                      onClick={() => setReport.mutate({ reportId: report.id, status: "resolved" })}
                    >
                      Mark resolved
                    </Button>
                  ) : null}
                  {status !== "dismissed" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={setReport.isPending}
                      onClick={() => setReport.mutate({ reportId: report.id, status: "dismissed" })}
                    >
                      Dismiss
                    </Button>
                  ) : null}
                  {status !== "open" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={setReport.isPending}
                      onClick={() => setReport.mutate({ reportId: report.id, status: "open" })}
                    >
                      Reopen
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold">Recent posts</h2>
        {!data ? (
          <Skeleton className="h-32 w-full" />
        ) : data.posts.length === 0 ? (
          <p className="card-surface px-5 py-8 text-center text-sm text-chalk">
            No learner posts yet. The sample posts on /community are seed content and can't be
            moderated here.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-[16px] border border-border bg-card">
            {data.posts.map((post) => (
              <li key={post.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {post.title}
                    {post.openReports ? (
                      <Badge variant="destructive">
                        {post.openReports} open {post.openReports === 1 ? "report" : "reports"}
                      </Badge>
                    ) : null}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-chalk">{post.body}</p>
                  <p className="mt-1 text-xs text-chalk">
                    {post.author} · {post.topic} · {post.likes} likes · {formatDate(post.createdAt)}
                  </p>
                </div>
                <DeletePostButton postId={post.id} title={post.title} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold">Public portfolio projects</h2>
          <p className="text-sm text-chalk">
            Unpublishing hides the case study from public profiles. The learner's submission stays,
            and they can publish it again.
          </p>
        </div>
        {!data ? (
          <Skeleton className="h-24 w-full" />
        ) : data.projects.length === 0 ? (
          <p className="card-surface px-5 py-8 text-center text-sm text-chalk">
            No projects are published.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-[16px] border border-border bg-card">
            {data.projects.map((project) => (
              <li key={project.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {projectById(project.projectId)?.title ?? project.projectId}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-chalk">
                    {project.summary || "No summary."}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-chalk">
                    <Link
                      to="/profile/$userId"
                      params={{ userId: project.authorId }}
                      className="hover:text-foreground"
                    >
                      {project.author}
                    </Link>
                    {project.liveUrl ? <ExternalUrl href={project.liveUrl} label="Live" /> : null}
                    {project.repoUrl ? <ExternalUrl href={project.repoUrl} label="Repo" /> : null}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={unpublish.isPending}
                  onClick={() => unpublish.mutate({ submissionId: project.id })}
                >
                  Unpublish
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ExternalUrl({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label} <ExternalLink className="size-3" />
    </a>
  );
}

function DeletePostButton({ postId, title }: { postId: string; title: string }) {
  const deletePost = useAdminDeletePost();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" disabled={deletePost.isPending}>
          Delete post
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The post, its comments, likes and reports are removed for everyone. The admin log keeps
            its title and author.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => deletePost.mutate({ postId })}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
