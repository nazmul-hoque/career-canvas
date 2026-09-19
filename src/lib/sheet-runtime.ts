/**
 * Runs an Excel for Analysts challenge.
 *
 * The learner writes one line per formula: a cell and the formula for it, or a
 * range and the formula for its top-left cell, which is then filled across the
 * range the way Excel's fill handle does (relative references move, `$` parts
 * stay):
 *
 *   G2:G13  =E2*F2
 *   I2      =SUM(G2:G13)
 *
 * Tests are JavaScript expressions that read the calculated sheet — ideally by
 * behaviour, e.g. `valueWith("C7", { G1: 0.5 }) === 45` proves a result follows
 * its input rather than a number typed into the formula.
 */
import { SHEETS } from "@/content/datasets/sheets";
import {
  CircularReferenceError,
  FormulaError,
  Sheet,
  XlError,
  compileFormula,
  normaliseFormula,
  numberToCol,
  numberToText,
  parseRef,
  refKey,
  shiftFormula,
  type CellInput,
  type Value,
  isFormulaText,
} from "./sheet-engine";
import { cellsInRange } from "./sheet-refs";
import { errorMessage, evalTests, type EngineOutcome, type TestSpec } from "./runtime-shared";

interface Entry {
  line: number;
  from: string;
  to: string;
  formula: string;
}

const LINE = /^([A-Za-z]{1,3}\d+)(?::([A-Za-z]{1,3}\d+))?\s*(=.*)$/;

/** Reads the learner's lines. Blank lines and lines starting with # are skipped. */
export function parseEntries(code: string): Entry[] {
  const entries: Entry[] = [];
  code.split("\n").forEach((raw, i) => {
    const text = raw.trim();
    if (!text || text.startsWith("#")) return;
    const m = LINE.exec(text);
    if (!m) {
      throw new FormulaError(
        `Line ${i + 1}: start with a cell (or range) and then the formula, like "G2 =E2*F2".`,
      );
    }
    const formula = m[3]!.trim();
    // "G2 =" is a placeholder the learner hasn't filled in yet.
    if (formula === "=") return;
    entries.push({
      line: i + 1,
      from: m[1]!.toUpperCase(),
      to: (m[2] ?? m[1]!).toUpperCase(),
      formula,
    });
  });
  return entries;
}

/** The challenge's sheet with the learner's formulas written (and filled) into it. */
export function buildSheet(sheetName: string, code: string): Sheet {
  const data = SHEETS[sheetName];
  if (!data) throw new Error(`There's no sheet called "${sheetName}".`);
  const sheet = new Sheet(Object.entries(data.cells));
  for (const entry of parseEntries(code)) {
    try {
      compileFormula(entry.formula);
    } catch (error) {
      throw new FormulaError(`Line ${entry.line} (${entry.from}): ${(error as Error).message}`);
    }
    const a = parseRef(entry.from)!;
    for (const { col, row } of cellsInRange(a, parseRef(entry.to)!).flat()) {
      const key = refKey(col, row);
      const existing = data.cells[key];
      if (existing !== undefined && existing !== null) {
        throw new FormulaError(
          `Line ${entry.line}: ${key} already holds data ("${String(existing)}"). Write formulas into the empty cells.`,
        );
      }
      sheet.set(key, shiftFormula(entry.formula, row - a.row, col - a.col));
    }
  }
  return sheet;
}

const shown = (v: Value): string => {
  if (v instanceof XlError) return v.code;
  if (v === null) return "";
  if (typeof v === "number") return numberToText(Math.round(v * 1e6) / 1e6);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return v;
};

/** The used part of the sheet as a text grid, for the Output panel. */
function renderGrid(sheet: Sheet): string[] {
  const refs = sheet.keys().map((k) => parseRef(k)!);
  const maxCol = Math.max(...refs.map((r) => r.col));
  const maxRow = Math.max(...refs.map((r) => r.row));
  const rows: string[][] = [["", ...Array.from({ length: maxCol }, (_, c) => numberToCol(c + 1))]];
  for (let r = 1; r <= maxRow; r++) {
    const row = [String(r)];
    for (let c = 1; c <= maxCol; c++) {
      const text = shown(sheet.value(refKey(c, r)));
      row.push(text.length > 14 ? `${text.slice(0, 13)}…` : text);
    }
    rows.push(row);
  }
  const widths = rows[0]!.map((_, c) => Math.max(...rows.map((row) => row[c]!.length)));
  return rows.map((row) =>
    row
      .map((cell, c) => cell.padEnd(widths[c]!))
      .join("  ")
      .trimEnd(),
  );
}

/** What a cell holds, as tests see it: errors become their code, e.g. "#N/A". */
const plain = (v: Value): CellInput | string => (v instanceof XlError ? v.code : v);

function rangeKeys(range: string): string[] {
  const [from = "", to = from] = range.toUpperCase().split(":");
  const a = parseRef(from);
  const b = parseRef(to);
  if (!a || !b) throw new Error(`"${range}" isn't a cell or range.`);
  return cellsInRange(a, b)
    .flat()
    .map(({ col, row }) => refKey(col, row));
}

export function runSheetChallenge(
  code: string,
  sheetName: string,
  tests: TestSpec[],
): EngineOutcome {
  const failAll = (error: string): EngineOutcome => ({
    logs: [],
    error,
    results: tests.map(() => ({ passed: false, detail: null })),
  });

  let sheet: Sheet;
  let logs: string[];
  try {
    sheet = buildSheet(sheetName, code);
    logs = renderGrid(sheet);
  } catch (error) {
    if (error instanceof CircularReferenceError) {
      return failAll(`Circular reference: ${error.message} A formula can't use its own result.`);
    }
    return failAll((error as Error).message);
  }

  const problems = [...sheet.problems].map(([cell, why]) => `${cell}: ${why}`);

  const helpers = {
    value: (ref: string) => plain(sheet.value(ref)),
    values: (range: string) => rangeKeys(range).map((k) => plain(sheet.value(k))),
    valueWith: (ref: string, overrides: Record<string, CellInput>) =>
      plain(sheet.withOverrides(overrides).value(ref)),
    formula: (ref: string) => {
      const raw = sheet.raw(ref);
      return isFormulaText(raw) ? normaliseFormula(raw) : null;
    },
    near: (actual: unknown, expected: number, tolerance = 1e-9) =>
      typeof actual === "number" && Math.abs(actual - expected) <= tolerance,
    nearAll: (actual: unknown[], expected: (number | string)[], tolerance = 1e-9) =>
      actual.length === expected.length &&
      actual.every((a, i) => {
        const e = expected[i]!;
        return typeof e === "number"
          ? typeof a === "number" && Math.abs(a - e) <= tolerance
          : typeof a === "string" && a.toLowerCase() === e.toLowerCase();
      }),
  };

  const results = evalTests(helpers, tests, (error) =>
    error instanceof CircularReferenceError
      ? `Circular reference: ${error.message}`
      : errorMessage(error),
  );

  return { logs, error: problems.length ? problems.join("\n") : null, results };
}
