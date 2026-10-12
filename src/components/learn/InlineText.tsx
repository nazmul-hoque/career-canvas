import { Fragment } from "react";

// Lesson copy is authored as plain strings in src/content/lessons.ts. This reads
// the marks authors actually use — `code`, **bold**, *emphasis* and
// [links](https://…) — and nothing else, so a stray character can never inject
// markup. Code that itself contains a backtick (a template literal, a shell
// `!`cmd``) is fenced with two, as in Markdown: `` `Hi, ${name}` ``.
const TOKEN = /(\[[^\]\n]+\]\(https:\/\/[^\s)]+\)|``.+?``|`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;

// Only https: a `javascript:` or `data:` address in lesson text must never
// become something a learner can click, so anything else stays plain text.
const LINK = /^\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)$/;

/** Markdown's rule: one space inside each fence is padding, so `` ` `` is a lone backtick. */
function doubleFenced(part: string): string | null {
  if (!part.startsWith("``") || !part.endsWith("``") || part.length <= 4) return null;
  const inner = part.slice(2, -2);
  return inner.startsWith(" ") && inner.endsWith(" ") && inner.trim() ? inner.slice(1, -1) : inner;
}

export function InlineText({ text }: { text: string }) {
  return <>{marks(text)}</>;
}

function marks(text: string) {
  return text.split(TOKEN).map((part, i) => {
    const link = LINK.exec(part);
    if (link) {
      return (
        <a
          key={i}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-brand underline underline-offset-2 [overflow-wrap:anywhere]"
        >
          {marks(link[1]!)}
        </a>
      );
    }
    const code =
      doubleFenced(part) ??
      (part.startsWith("`") && part.endsWith("`") && part.length > 2 ? part.slice(1, -1) : null);
    if (code !== null) {
      // A long token with nowhere to break (a JSON string, a URL) would
      // otherwise push a quiz option, and the page, wider than a phone.
      // `anywhere` rather than `break-word`: only it lowers the min-content
      // width, which is what lets a flex item holding it shrink.
      return (
        <code
          key={i}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em] text-foreground [overflow-wrap:anywhere]"
        >
          {code}
        </code>
      );
    }
    // Bold and emphasis can hold code (**`--add-dir`** names a flag), so their
    // insides go through the same reading. They can't hold each other, which
    // keeps this one level deep.
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{marks(part.slice(2, -2))}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{marks(part.slice(1, -1))}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
