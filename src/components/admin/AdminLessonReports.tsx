import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { QueryError } from "@/components/common/QueryError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminLessonReports, useAdminSetLessonReportStatus } from "@/hooks/useAdmin";
import type { AdminLessonReport } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";
import { formatDate } from "./format";

const STATUSES = ["open", "resolved", "dismissed"] as const;
type ReportStatus = (typeof STATUSES)[number];

const KIND_LABELS: Record<string, string> = {
  grader: "Marked wrong",
  content: "Lesson content",
  broken: "Page broken",
  other: "Other",
};

export function AdminLessonReports() {
  const [status, setStatus] = useState<ReportStatus>("open");
  const reports = useAdminLessonReports(status);
  const setReport = useAdminSetLessonReportStatus();

  if (reports.isError) {
    return (
      <QueryError
        title="Couldn't load lesson reports"
        retry={reports.refetch}
        busy={reports.isFetching}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Lesson reports</h2>
          <p className="text-sm text-chalk">
            Sent from inside lessons, with the learner's code and last run attached.
          </p>
        </div>
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

      {!reports.data ? (
        <Skeleton className="h-32 w-full" />
      ) : reports.data.length === 0 ? (
        <p className="card-surface px-5 py-8 text-center text-sm text-chalk">
          No {status} lesson reports.
        </p>
      ) : (
        <ul className="space-y-3">
          {reports.data.map((report) => (
            <li key={report.id} className="card-surface min-w-0 space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{KIND_LABELS[report.kind] ?? report.kind}</Badge>
                {report.openOnLesson > 1 ? (
                  <Badge variant="destructive">{report.openOnLesson} open on this lesson</Badge>
                ) : null}
                <span className="flex items-center gap-1 text-xs text-chalk">
                  <Flag className="size-3.5" />
                  {report.reporter} · {formatDate(report.createdAt)}
                </span>
              </div>
              <div>
                <Link
                  to="/learn/$courseId/$lessonId"
                  params={{ courseId: report.courseId, lessonId: report.lessonId }}
                  className="font-semibold text-brand hover:underline"
                >
                  {report.lessonTitle}
                </Link>
                <p className="text-xs text-chalk">
                  {report.courseTitle} · <code>{report.lessonId}</code>
                </p>
              </div>
              {report.message ? (
                <p className="whitespace-pre-wrap text-sm">“{report.message}”</p>
              ) : (
                <p className="text-sm text-chalk">No message; the attachments are the report.</p>
              )}
              <ReportEvidence report={report} />
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter((s) => s !== status).map((next) => (
                  <Button
                    key={next}
                    size="sm"
                    variant={next === "resolved" ? "outline" : "ghost"}
                    disabled={setReport.isPending}
                    onClick={() => setReport.mutate({ reportId: report.id, status: next })}
                  >
                    {next === "resolved"
                      ? "Mark resolved"
                      : next === "dismissed"
                        ? "Dismiss"
                        : "Reopen"}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReportEvidence({ report }: { report: AdminLessonReport }) {
  const { run } = report;
  const answered = Object.entries(report.answers);
  return (
    <div className="space-y-2 text-sm">
      {run ? (
        <div className="rounded-lg border border-border p-3">
          <p className="font-semibold">
            Last run: {run.tests.filter((t) => t.passed).length} of {run.tests.length} tests passed
            <span className="font-normal text-chalk"> · {run.engine}</span>
          </p>
          {run.error ? (
            <p className="mt-1 font-mono text-xs text-destructive">{run.error}</p>
          ) : null}
          <ul className="mt-2 space-y-0.5">
            {run.tests.map((t, i) => (
              <li key={i} className={cn("text-xs", t.passed ? "text-chalk" : "text-destructive")}>
                {t.passed ? "✓" : "✗"} {t.name}
                {t.detail ? (
                  <span className="block pl-4 font-mono text-chalk">{t.detail}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {report.code ? (
        <details className="rounded-lg border border-border">
          <summary className="cursor-pointer px-3 py-2 font-semibold">Their code</summary>
          <pre className="max-h-96 overflow-auto rounded-b-lg bg-ink p-3 font-mono text-xs leading-5 text-white/90">
            {report.code}
          </pre>
        </details>
      ) : null}
      {answered.length ? (
        <p className="text-xs text-chalk">
          Answers:{" "}
          {answered
            .map(([id, value]) => {
              const verdict = report.verdicts[id];
              const mark = verdict === undefined ? "" : verdict ? " ✓" : " ✗";
              // An mcq answer is an option index; show it 1-based as it appears on screen.
              const shown = typeof value === "number" ? `option ${value + 1}` : `"${value}"`;
              return `${id} = ${shown}${mark}`;
            })
            .join(" · ")}
        </p>
      ) : null}
      <p className="text-xs text-chalk">
        {report.solved ? "Challenge solved · " : ""}
        {report.viewport} · {report.userAgent}
      </p>
    </div>
  );
}
