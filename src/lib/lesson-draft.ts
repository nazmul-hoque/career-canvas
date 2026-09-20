export interface LessonDraft {
  code: string;
  answers: Record<string, string | number>;
}

export function draftKey(userId: string, courseId: string, lessonId: string) {
  return `ascent:draft:v1:${encodeURIComponent(userId)}:${encodeURIComponent(courseId)}:${encodeURIComponent(lessonId)}`;
}

export function parseDraft(raw: string | null): LessonDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (
      typeof value?.code !== "string" ||
      !value.answers ||
      typeof value.answers !== "object" ||
      Array.isArray(value.answers)
    )
      return null;
    if (
      !Object.values(value.answers).every(
        (answer) =>
          typeof answer === "string" || (typeof answer === "number" && Number.isFinite(answer)),
      )
    )
      return null;
    return { code: value.code, answers: value.answers };
  } catch {
    return null;
  }
}
