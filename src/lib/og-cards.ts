import { careerPaths, courses } from "../content/curriculum";

/**
 * What each course and path share image says. `bun run og:images` renders
 * these to public/og/ and records a fingerprint of each; tests/og-cards.test.ts
 * fails when a card's words change and nobody re-rendered, the way the lesson
 * manifest does. Only words that change when the content is edited on purpose
 * go on a card — no lesson counts or hours, which would drift silently.
 */
export interface OgCard {
  file: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  tags: string[];
}

export function ogCards(): OgCard[] {
  return [
    ...courses.map((course) => ({
      file: ogFile("course", course.id),
      eyebrow: `Course · ${course.level}`,
      title: course.title,
      subtitle: course.summary,
      tags: course.skills.slice(0, 5),
    })),
    ...careerPaths.map((path) => ({
      file: ogFile("path", path.id),
      eyebrow: `Career path · ${path.difficulty}`,
      title: path.name,
      subtitle: path.overview,
      tags: path.skills.slice(0, 5),
    })),
  ];
}

export const ogFile = (kind: "course" | "path", id: string) => `${kind}-${id}.jpg`;

/** FNV-1a: stable across runtimes, and only ever compared with itself. */
export function ogFingerprint(card: OgCard): string {
  const text = JSON.stringify([card.eyebrow, card.title, card.subtitle, card.tags]);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
