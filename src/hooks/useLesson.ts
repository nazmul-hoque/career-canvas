import { queryOptions, useQuery } from "@tanstack/react-query";
import { getLessonFn } from "@/lib/lessons.functions";

/**
 * A lesson as the browser may see it — no answers, explanations or solutions.
 * Content is the same for everyone and changes only with a deploy, so one
 * cached copy serves the lesson page's loader and /review alike.
 */
export const lessonQuery = (courseId: string, lessonId: string) =>
  queryOptions({
    queryKey: ["lesson", courseId, lessonId],
    queryFn: () => getLessonFn({ data: { courseId, lessonId } }),
    staleTime: Infinity,
  });

export function usePublicLesson(courseId: string | undefined, lessonId: string | undefined) {
  return useQuery({
    ...lessonQuery(courseId ?? "", lessonId ?? ""),
    enabled: Boolean(courseId && lessonId),
  });
}
