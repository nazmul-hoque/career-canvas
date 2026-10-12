import { ChevronRight } from "lucide-react";
import type { ReadingBlock } from "@/content/lessons";
import { cn } from "@/lib/utils";

type TableBlock = Extract<ReadingBlock, { kind: "table" }>;

/**
 * A small table of figures or rows in a lesson. Cells are data, not copy, so
 * they're printed verbatim rather than read for marks: a value holding a `*`
 * or a backtick is what the query returned, not formatting.
 */
export function LessonTable({ block }: { block: TableBlock }) {
  const { columns, rows, caption, collapsed, source } = block;
  // A column is numeric when every value in it is, so ids and totals line up
  // on the right; one text cell makes the whole column read as text.
  const numeric = columns.map((_, c) =>
    rows.every((row) => row[c] === null || typeof row[c] === "number"),
  );

  // Only the table scrolls sideways; the query under it wraps to the card, or a
  // wide table would push half of it out of view on a phone.
  const grid = (
    <>
      <div className="overflow-x-auto">
        <table aria-label={caption} className="w-full border-collapse font-mono text-[13px]">
          <thead>
            <tr>
              {columns.map((column, c) => (
                <th
                  key={c}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap border-b border-border px-3 py-2 text-[11px] first:pl-4 last:pr-4 font-semibold uppercase tracking-wider text-chalk",
                    numeric[c] ? "text-right" : "text-left",
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-b border-border last:border-0">
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className={cn(
                      "whitespace-nowrap px-3 py-1.5 tabular-nums first:pl-4 last:pr-4",
                      numeric[c] && "text-right",
                      cell === null && "text-chalk",
                    )}
                  >
                    {cell === null ? "NULL" : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Folded: the rows are what the reader came for, and a query under
          every table turns a short lesson back into a long one. */}
      {source && !source.hideQuery ? (
        <details className="group/query border-t border-border bg-muted/50">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2 text-xs text-chalk hover:text-foreground [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-3.5 shrink-0 transition-transform group-open/query:rotate-90" />
            The query
          </summary>
          <pre className="whitespace-pre-wrap px-4 pb-3 font-mono text-[12px] leading-5 text-chalk">
            {source.query}
          </pre>
        </details>
      ) : null}
    </>
  );

  if (collapsed) {
    return (
      <details className="group overflow-hidden rounded-[14px] border border-border">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold hover:bg-secondary [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 shrink-0 text-chalk transition-transform group-open:rotate-90" />
          <span>{caption ?? "See the data"}</span>
          <span className="ml-auto whitespace-nowrap font-normal text-chalk">
            {rows.length} {rows.length === 1 ? "row" : "rows"}
          </span>
        </summary>
        <div className="border-t border-border">{grid}</div>
      </details>
    );
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border">
      {caption ? (
        <div className="border-b border-border px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-chalk">
          {caption}
        </div>
      ) : null}
      {grid}
    </div>
  );
}
