import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { QueryError } from "@/components/common/QueryError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { findLesson, pathById } from "@/content/curriculum";
import { projectById } from "@/content/projects";
import {
  useAdminDeleteUser,
  useAdminSetPlan,
  useAdminSetSuspended,
  useAdminUserDetail,
  useAdminUsers,
} from "@/hooks/useAdmin";
import type { AdminUserRow } from "@/lib/admin.functions";
import { formatCount, formatDate } from "./format";

const PLANS = ["free", "pro", "lifetime"] as const;
type Plan = (typeof PLANS)[number];
const isPlan = (value: string): value is Plan => (PLANS as readonly string[]).includes(value);

export function AdminUsers() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(input.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [input]);

  const users = useAdminUsers(query, page);
  const rows = users.data?.rows ?? [];
  const total = users.data?.total ?? 0;
  const pageSize = users.data?.pageSize ?? 25;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  // Looked up from the current page so the sheet shows the row's latest state after an action.
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-chalk" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search name, email or user id"
            aria-label="Search learners"
            className="pl-9"
          />
        </div>
        <p className="text-sm text-chalk">
          {users.isLoading
            ? "Loading…"
            : `${formatCount(total)} ${total === 1 ? "learner" : "learners"}`}
        </p>
      </div>

      {users.isError ? (
        <QueryError title="Couldn't load learners" retry={users.refetch} busy={users.isFetching} />
      ) : (
        <div className="card-surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Level</TableHead>
                <TableHead className="text-right">XP</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(row.id)}
                    >
                      <TableCell>
                        <button
                          className="text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(row.id);
                          }}
                        >
                          <span className="flex items-center gap-1.5 font-semibold">
                            {row.displayName}
                            {row.isAdmin ? (
                              <ShieldCheck className="size-3.5 text-brand" aria-label="Admin" />
                            ) : null}
                          </span>
                          <span className="block text-xs text-chalk">{row.email}</span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <PlanBadge row={row} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.level}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(row.xp)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(row.lastActiveDay)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        {row.suspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <span className="text-sm text-chalk">Active</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              {!users.isLoading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-chalk">
                    {query ? `No learners match “${query}”.` : "No learners yet."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" /> Previous
          </Button>
          <span className="text-sm text-chalk">
            Page {page + 1} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected ? <UserDetail row={selected} onDeleted={() => setSelectedId(null)} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PlanBadge({ row }: { row: AdminUserRow }) {
  const trialing =
    row.plan === "free" && row.trialEndsAt !== null && Date.parse(row.trialEndsAt) > Date.now();
  if (trialing) return <Badge variant="outline">Trial</Badge>;
  return (
    <Badge variant={row.plan === "free" ? "secondary" : "default"} className="capitalize">
      {row.plan}
    </Badge>
  );
}

function UserDetail({ row, onDeleted }: { row: AdminUserRow; onDeleted: () => void }) {
  const detail = useAdminUserDetail(row.id);
  const setPlan = useAdminSetPlan();
  const setSuspended = useAdminSetSuspended();
  const deleteUser = useAdminDeleteUser();
  const [plan, setPlanDraft] = useState<Plan>(isPlan(row.plan) ? row.plan : "free");

  useEffect(() => setPlanDraft(isPlan(row.plan) ? row.plan : "free"), [row.plan]);

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          {row.displayName}
          {row.isAdmin ? <Badge variant="outline">Admin</Badge> : null}
          {row.suspended ? <Badge variant="destructive">Suspended</Badge> : null}
        </SheetTitle>
        <SheetDescription>{row.email}</SheetDescription>
      </SheetHeader>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Fact label="Level" value={`${row.level} · ${formatCount(row.xp)} XP`} />
        <Fact label="Streak" value={`${row.streak} days`} />
        <Fact label="Joined" value={formatDate(row.createdAt)} />
        <Fact label="Last signed in" value={formatDate(row.lastSignInAt)} />
        <Fact label="Last active" value={formatDate(row.lastActiveDay)} />
        <Fact
          label="Lessons completed"
          value={detail.data ? formatCount(detail.data.lessonsCompleted) : "…"}
        />
        <Fact label="Community posts" value={detail.data ? formatCount(detail.data.posts) : "…"} />
        <Fact
          label="Mentor messages"
          value={detail.data ? formatCount(detail.data.mentorMessages) : "…"}
        />
      </dl>

      <Link
        to="/profile/$userId"
        params={{ userId: row.id }}
        className="inline-block text-sm font-semibold text-brand hover:underline"
      >
        Open public profile
      </Link>

      <section className="space-y-2">
        <h3 className="eyebrow">Plan</h3>
        <div className="flex gap-2">
          <Select value={plan} onValueChange={(v) => isPlan(v) && setPlanDraft(v)}>
            <SelectTrigger className="w-40" aria-label="Plan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANS.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={plan === row.plan || setPlan.isPending}
            onClick={() => setPlan.mutate({ userId: row.id, plan })}
          >
            {setPlan.isPending ? "Saving…" : "Save plan"}
          </Button>
        </div>
        <p className="text-xs text-chalk">
          Changes access only. With Stripe payments on, it doesn't create, change or cancel a
          subscription, and Stripe's next webhook for this learner will set the plan back.
        </p>
      </section>

      {detail.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : detail.isError ? (
        <QueryError
          title="Couldn't load activity"
          retry={detail.refetch}
          busy={detail.isFetching}
        />
      ) : detail.data ? (
        <>
          <section className="space-y-2">
            <h3 className="eyebrow">Recent lessons</h3>
            {detail.data.recentLessons.length ? (
              <ul className="space-y-1.5 text-sm">
                {detail.data.recentLessons.map((l) => (
                  <li key={l.lessonId} className="flex justify-between gap-3">
                    <span className="truncate">
                      {findLesson(l.courseId, l.lessonId)?.lesson.title ?? l.lessonId}
                    </span>
                    <span className="shrink-0 text-chalk">{formatDate(l.completedAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-chalk">No lessons completed yet.</p>
            )}
          </section>

          {detail.data.submissions.length ? (
            <section className="space-y-2">
              <h3 className="eyebrow">Projects</h3>
              <ul className="space-y-1.5 text-sm">
                {detail.data.submissions.map((s) => (
                  <li key={s.id} className="flex justify-between gap-3">
                    <span className="truncate">
                      {projectById(s.projectId)?.title ?? s.projectId}
                    </span>
                    <span className="shrink-0 text-chalk">
                      {s.status}
                      {s.published ? " · public" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {detail.data.certificates.length ? (
            <section className="space-y-2">
              <h3 className="eyebrow">Certificates</h3>
              <ul className="space-y-1.5 text-sm">
                {detail.data.certificates.map((c) => (
                  <li key={c.certificateId} className="flex justify-between gap-3">
                    <Link
                      to="/verify/$certificateId"
                      params={{ certificateId: c.certificateId }}
                      className="truncate text-brand hover:underline"
                    >
                      {pathById(c.pathId)?.name ?? c.pathId}
                    </Link>
                    <span className="shrink-0 text-chalk">{formatDate(c.issuedAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}

      {row.isAdmin ? (
        <p className="rounded-lg border border-border p-3 text-sm text-chalk">
          This account is an admin, so it can't be suspended or deleted here. Remove its row from{" "}
          <code>admin_users</code> first.
        </p>
      ) : (
        <section className="space-y-3 border-t border-border pt-5">
          <h3 className="eyebrow">Account</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={setSuspended.isPending}
              onClick={() => setSuspended.mutate({ userId: row.id, suspended: !row.suspended })}
            >
              {row.suspended ? "Lift suspension" : "Suspend sign-in"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleteUser.isPending}>
                  Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {row.displayName}'s account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes their sign-in, progress, XP, projects, posts and
                    certificates. Issued certificates will stop verifying. This can't be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteUser.mutate({ userId: row.id }, { onSuccess: onDeleted })}
                  >
                    Delete permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p className="text-xs text-chalk">
            A suspended learner can't sign in, and a session they already have ends within the hour,
            when its token next needs refreshing. Their data and public profile stay as they are.
          </p>
        </section>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 px-3 py-2">
      <dt className="text-xs text-chalk">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
