import { useEffect, useRef, useState } from "react";
import { draftKey, parseDraft, type LessonDraft } from "@/lib/lesson-draft";

/** Mounted with a key containing the account and lesson; drafts never cross accounts. */
export function useLessonDraft(
  userId: string | undefined,
  courseId: string,
  lessonId: string,
  starter: string,
) {
  const [draft, setDraft] = useState<LessonDraft>({ code: starter, answers: {} });
  const current = useRef(draft);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Loading draft…");
  const key = userId ? draftKey(userId, courseId, lessonId) : null;

  useEffect(() => {
    try {
      const saved = key ? parseDraft(localStorage.getItem(key)) : null;
      if (saved) {
        current.current = saved;
        setDraft(saved);
      }
      setStatus(
        key
          ? saved
            ? "Draft restored · saved on this device"
            : "Drafts save on this device"
          : "Sign in to save drafts on this device",
      );
    } catch {
      setStatus("Draft storage unavailable. Keep this page open or copy your code.");
    }
    setReady(true);
  }, [key]);

  function update(patch: Partial<LessonDraft>) {
    const next = { ...current.current, ...patch };
    current.current = next;
    setDraft(next);
    if (!key) return;
    try {
      // Save during the edit itself so a quick refresh cannot outrun a debounce.
      localStorage.setItem(key, JSON.stringify(next));
      setStatus("Draft saved on this device");
    } catch {
      setStatus("Draft not saved. Copy your work before leaving this page.");
    }
  }

  return {
    ...draft,
    ready,
    status,
    setCode: (code: string) => update({ code }),
    setAnswers: (answers: LessonDraft["answers"]) => update({ answers }),
  };
}
