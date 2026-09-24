import { QueryError } from "@/components/common/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminActions } from "@/hooks/useAdmin";
import type { AdminAction } from "@/lib/admin.functions";
import { formatDate } from "./format";

function describe(a: AdminAction): string {
  const d = a.detail;
  switch (a.action) {
    case "set_plan":
      return `changed a learner's plan from ${String(d["from"])} to ${String(d["to"])}`;
    case "suspend_user":
      return "suspended a learner";
    case "unsuspend_user":
      return "lifted a learner's suspension";
    case "delete_user":
      return `deleted the account of ${String(d["display_name"] ?? "a learner")}`;
    case "set_report_status":
      return `marked a report ${String(d["status"])}`;
    case "delete_post":
      return `deleted the post “${String(d["title"] ?? "")}”`;
    case "unpublish_project":
      return "unpublished a portfolio project";
    default:
      return a.action.replaceAll("_", " ");
  }
}

export function AdminLog() {
  const actions = useAdminActions();

  if (actions.isError) {
    return (
      <QueryError title="Couldn't load the log" retry={actions.refetch} busy={actions.isFetching} />
    );
  }
  if (!actions.data) return <Skeleton className="h-40 w-full" />;
  if (actions.data.length === 0) {
    return (
      <p className="card-surface px-5 py-8 text-center text-sm text-chalk">
        No admin actions yet. Every change made from this page is recorded here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-[16px] border border-border bg-card">
      {actions.data.map((a) => (
        <li key={a.id} className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:justify-between">
          <span>
            <span className="font-semibold">{a.admin}</span> {describe(a)}
            <span className="block font-mono text-xs text-chalk">
              {a.targetType} {a.targetId}
            </span>
          </span>
          <span className="shrink-0 text-xs text-chalk">{formatDate(a.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
