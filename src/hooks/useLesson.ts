import { useQuery } from "@tanstack/react-query";
import { getLessonFn } from "@/lib/lessons.functions";

/**
 * A lesson as the browser may see it — no answers, explanations or solutions.
 * Lesson content is the same for everyone, so it isn't keyed by user.
 */
export function usePublicLesson(courseId: string | undefined, lessonId: string | undefined) {
  return useQuery({
    queryKey: ["lesson", courseId, lessonId],
    queryFn: () => getLessonFn({ data: { courseId: courseId!, lessonId: lessonId! } }),
    enabled: Boolean(courseId && lessonId),
    staleTime: Infinity,
  });
}
