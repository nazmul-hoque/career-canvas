import { useMutation } from "@tanstack/react-query";
import { useSession } from "./useAuth";
import { reportLessonProblemFn, type LessonReportInput } from "@/lib/lesson-reports.functions";

export function useReportLessonProblem() {
  const { user } = useSession();
  return useMutation({
    mutationFn: (input: LessonReportInput) => {
      if (!user) throw new Error("Sign in to report a problem.");
      return reportLessonProblemFn({ data: input });
    },
  });
}
