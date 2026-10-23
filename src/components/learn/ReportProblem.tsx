import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useReportLessonProblem } from "@/hooks/useLessonReports";
import { track } from "@/lib/analytics";
import type { RunResult } from "@/lib/code-runner";
import type { LessonReportInput, LessonReportKind } from "@/lib/lesson-reports.functions";

const KINDS: { value: LessonReportKind; label: string }[] = [
  { value: "grader", label: "My answer is marked wrong, but I think it's right" },
  { value: "content", label: "Something in the lesson is wrong or unclear" },
  { value: "broken", label: "Something on the page doesn't work" },
  { value: "other", label: "Something else" },
];

/** What the learner has on screen, captured when they send, not when they open the dialog. */
export interface LessonSnapshot {
  code: string | null;
  lastRun: RunResult | null;
  answers: Record<string, number | string>;
  verdicts: Record<string, boolean>;
  solved: boolean;
}

export function ReportProblem({
  courseId,
  lessonId,
  snapshot,
}: {
  courseId: string;
  lessonId: string;
  snapshot: () => LessonSnapshot;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<LessonReportKind>("grader");
  const [message, setMessage] = useState("");
  const report = useReportLessonProblem();
  const needsWords = kind !== "grader";
  const tooShort = needsWords && message.trim().length < 10;

  function openWith(value: boolean) {
    if (report.isPending) return;
    if (value) {
      // A failed run is the likeliest reason to be here; otherwise start neutral.
      const run = snapshot().lastRun;
      setKind(run && !run.passed ? "grader" : "content");
    }
    setOpen(value);
  }

  function send() {
    const now = snapshot();
    const input: LessonReportInput = {
      courseId,
      lessonId,
      kind,
      message: message.trim(),
      code: now.code,
      run: now.lastRun
        ? {
            engine: now.lastRun.engine,
            passed: now.lastRun.passed,
            error: now.lastRun.error?.slice(0, 2000) ?? null,
            tests: now.lastRun.tests.slice(0, 50).map((t) => ({
              name: t.name.slice(0, 300),
              passed: t.passed,
              detail: t.detail?.slice(0, 500) ?? null,
            })),
          }
        : null,
      answers: now.answers,
      verdicts: now.verdicts,
      solved: now.solved,
      userAgent: navigator.userAgent.slice(0, 400),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
    report.mutate(input, {
      onSuccess: () => {
        track("lesson_problem_reported", { course_id: courseId, lesson_id: lessonId, kind });
        toast.success("Thanks. Your report is with the team.");
        setMessage("");
        setOpen(false);
      },
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : "Your report could not be sent. Try again.",
        ),
    });
  }

  const preview = open ? snapshot() : null;
  const attached = [
    preview?.code ? "your code" : null,
    preview?.lastRun
      ? `your last run (${preview.lastRun.tests.filter((t) => t.passed).length} of ${preview.lastRun.tests.length} tests passed)`
      : null,
    preview && Object.keys(preview.answers).length ? "the answers you picked" : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <Dialog open={open} onOpenChange={openWith}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="-ml-3 text-chalk">
          <Flag className="size-4" /> Report a problem
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Report a problem with this lesson</DialogTitle>
        <DialogDescription>
          {attached.length
            ? `We'll attach ${listed(attached)}, so we can see exactly what you saw.`
            : "Tell us what went wrong and we'll look into it."}
        </DialogDescription>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!tooShort) send();
          }}
        >
          <RadioGroup
            value={kind}
            onValueChange={(value) => setKind(value as LessonReportKind)}
            aria-label="What kind of problem?"
          >
            {KINDS.map((k) => (
              <div key={k.value} className="flex items-start gap-2">
                <RadioGroupItem value={k.value} id={`report-${k.value}`} className="mt-0.5" />
                <Label htmlFor={`report-${k.value}`} className="font-normal leading-snug">
                  {k.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="space-y-2">
            <Label htmlFor="report-message">
              {needsWords ? "What happened?" : "Anything to add? (optional)"}
            </Label>
            <Textarea
              id="report-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder={
                needsWords
                  ? "What did you expect, and what did you see instead?"
                  : "Why you think your answer is right, if it isn't obvious."
              }
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={report.isPending || tooShort}>
              {report.isPending ? "Sending…" : "Send report"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={report.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const listed = (items: string[]) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
