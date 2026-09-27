import { Fragment } from "react";

// Lesson copy is authored as plain strings in src/content/lessons.ts. This reads
// the three marks authors actually use — `code`, **bold**, *emphasis* — and
// nothing else, so a stray character can never inject markup. Code that itself
// contains a backtick (a template literal, a shell `!`cmd``) is fenced with two,
// as in Markdown: `` `Hi, ${name}` ``.
const TOKEN = /(``.+?``|`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;

/** Markdown's rule: one space inside each fence is padding, so `` ` `` is a lone backtick. */
function doubleFenced(part: string): string | null {
  if (!part.startsWith("``") || !part.endsWith("``") || part.length <= 4) return null;
  const inner = part.slice(2, -2);
  return inner.startsWith(" ") && inner.endsWith(" ") && inner.trim() ? inner.slice(1, -1) : inner;
}

export function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        const code =
          doubleFenced(part) ??
          (part.startsWith("`") && part.endsWith("`") && part.length > 2
            ? part.slice(1, -1)
            : null);
        if (code !== null) {
          return (
            <code
              key={i}
              className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em] text-foreground"
            >
              {code}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
