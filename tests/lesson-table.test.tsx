import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonTable } from "../src/components/learn/LessonTable";

const block = {
  kind: "table" as const,
  caption: "Two payments",
  columns: ["id", "status", "amount"],
  rows: [
    [7, "**succeeded**", 154],
    [16, "succeeded", null],
  ],
};

describe("LessonTable", () => {
  test("prints cells verbatim: a value is data, not formatting", () => {
    const html = renderToStaticMarkup(<LessonTable block={block} />);
    expect(html).toContain("**succeeded**");
    expect(html).not.toContain("<strong>");
  });

  test("shows a missing value as NULL, the way the query reported it", () => {
    expect(renderToStaticMarkup(<LessonTable block={block} />)).toContain(">NULL</td>");
  });

  test("right-aligns a column only when every value in it is a number", () => {
    const html = renderToStaticMarkup(<LessonTable block={block} />);
    const headers = [...html.matchAll(/<th[^>]*class="([^"]*)"[^>]*>(\w+)<\/th>/g)];
    const aligned = Object.fromEntries(headers.map((m) => [m[2], m[1]!.includes("text-right")]));
    expect(aligned).toEqual({ id: true, status: false, amount: true });
  });

  test("folds behind its caption, with the row count, when collapsed", () => {
    const html = renderToStaticMarkup(<LessonTable block={{ ...block, collapsed: true }} />);
    expect(html).toStartWith("<details");
    expect(html).not.toContain("<details open");
    expect(html).toContain("Two payments");
    expect(html).toContain("2 rows");
    expect(renderToStaticMarkup(<LessonTable block={block} />)).not.toContain("<details");
  });

  test("offers the query a table came from, folded", () => {
    const query = "SELECT id, status, amount FROM payments WHERE id IN (7, 16)";
    const html = renderToStaticMarkup(
      <LessonTable block={{ ...block, source: { query, dataset: "payments" } }} />,
    );
    expect(html).toContain(query);
    expect(html).toContain("The query</summary>");
  });

  test("keeps a query back when it would give a challenge away", () => {
    const query = "SELECT id, status, amount FROM payments WHERE id IN (7, 16)";
    const html = renderToStaticMarkup(
      <LessonTable block={{ ...block, source: { query, hideQuery: true } }} />,
    );
    expect(html).not.toContain(query);
  });
});
