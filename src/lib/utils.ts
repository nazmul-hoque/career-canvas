import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * The right noun for a count: `1 course`, `3 courses`.
 *
 * One definition because "1 courses" reached four surfaces at once — every
 * operator path holds exactly one course, so the hardcoded plural was visible
 * on the landing page, the path index and the path page the moment those
 * paths shipped.
 */
export const plural = (count: number, singular: string, many = `${singular}s`) =>
  count === 1 ? singular : many;
