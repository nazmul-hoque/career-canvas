import type { CellInput } from "@/lib/sheet-engine";

/**
 * The worksheets the Excel for Analysts challenges start from. Same outdoor
 * shop as the SQL course, laid out the way an analyst would receive it. Lessons
 * quote totals from these sheets, so a change here means re-running
 * `bun run lessons:verify`.
 */

export interface SheetData {
  /** Shown above the editor. */
  title: string;
  cells: Record<string, CellInput>;
}

/** Lays rows out from A1 (or `origin`), so sheets read like the grid they are. */
function grid(rows: CellInput[][], origin = "A1"): Record<string, CellInput> {
  const m = /^([A-Z]+)(\d+)$/.exec(origin)!;
  const startCol = m[1]!.charCodeAt(0) - 64;
  const startRow = Number(m[2]);
  const cells: Record<string, CellInput> = {};
  rows.forEach((row, r) =>
    row.forEach((value, c) => {
      if (value !== null) cells[`${String.fromCharCode(64 + startCol + c)}${startRow + r}`] = value;
    }),
  );
  return cells;
}

const LINES: CellInput[][] = [
  ["Order", "Month", "Category", "Product", "Qty", "Unit price"],
  [101, "Jan", "Footwear", "Trail Runner Shoes", 1, 120],
  [101, "Jan", "Apparel", "Wool Socks", 2, 24],
  [102, "Jan", "Apparel", "Rain Shell Jacket", 1, 180],
  [104, "Jan", "Gear", "Headlamp", 1, 35],
  [104, "Jan", "Gear", "Water Bottle", 2, 20],
  [105, "Feb", "Gear", "Trekking Poles", 1, 90],
  [106, "Feb", "Apparel", "Merino Base Layer", 2, 65],
  [108, "Feb", "Gear", "Headlamp", 1, 35],
  [109, "Feb", "Footwear", "Trail Runner Shoes", 1, 108],
  [110, "Mar", "Apparel", "Wool Socks", 3, 24],
  [112, "Mar", "Apparel", "Rain Shell Jacket", 1, 162],
  [114, "Mar", "Footwear", "Trail Runner Shoes", 1, 120],
];

/** The order lines with their totals already in column G. */
const LINES_WITH_TOTALS: Record<string, CellInput> = {
  ...grid(LINES),
  G1: "Total",
  ...Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [`G${i + 2}`, `=E${i + 2}*F${i + 2}`]),
  ),
};

export const SHEETS: Record<string, SheetData> = {
  lines: {
    title: "Order lines, Q1",
    cells: {
      ...grid(LINES),
      G1: "Total",
      ...grid(
        [["Summary"], ["Revenue"], ["Average line"], ["Largest line"], ["Lines"], ["Target 1,000"]],
        "H1",
      ),
    },
  },

  pricing: {
    title: "Price list",
    cells: {
      ...grid([
        ["Product", "List price", "Sale price", "Price incl. VAT"],
        ["Trail Runner Shoes", 120],
        ["Rain Shell Jacket", 180],
        ["Merino Base Layer", 65],
        ["Headlamp", 35],
        ["Water Bottle", 20],
        ["Trekking Poles", 90],
      ]),
      ...grid(
        [
          ["Discount", 0.1],
          ["VAT", 0.25],
        ],
        "F1",
      ),
    },
  },

  conditional: {
    title: "Order lines, Q1, with totals",
    cells: {
      ...LINES_WITH_TOTALS,
      ...grid(
        [
          ["Question", "Answer"],
          ["Apparel revenue", null],
          ["Lines in Feb", null],
          ["Apparel revenue in Mar", null],
          ["Lines at or above the threshold", null],
          ["Revenue for the chosen category", null],
          ["Threshold", 100],
          ["Category", "Footwear"],
        ],
        "I1",
      ),
    },
  },

  lookup: {
    title: "Order lines and the product table",
    cells: {
      ...grid([
        ["Line", "Product code", "Qty", "Unit price", "Category"],
        [1, "SHO-120", 1],
        [2, "SOC-024", 2],
        [3, "HEA-035", 1],
        [4, "XXX-999", 1],
        [5, "SHE-180", 1],
        [6, "bot-020", 3],
      ]),
      ...grid(
        [
          ["Code", "Category", "Price"],
          ["SHO-120", "Footwear", 120],
          ["SHE-180", "Apparel", 180],
          ["SOC-024", "Apparel", 24],
          ["HEA-035", "Gear", 35],
          ["BOT-020", "Gear", 20],
          ["POL-090", "Gear", 90],
        ],
        "H1",
      ),
    },
  },

  pivot: {
    title: "Order lines, Q1, and an empty summary grid",
    cells: {
      ...LINES_WITH_TOTALS,
      ...grid(
        [
          ["Revenue", "Jan", "Feb", "Mar", "Total"],
          ["Apparel"],
          ["Footwear"],
          ["Gear"],
          ["Total"],
          [],
          [null, null, null, "Check"],
        ],
        "I1",
      ),
    },
  },
};
