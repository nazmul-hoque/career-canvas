/**
 * Cell references: "B7", "$G$1", column letters and numbers. Split from the
 * formula engine so the challenge UI can draw a sheet's grid without loading
 * the engine itself.
 */

export interface CellRef {
  col: number; // 1-based
  row: number; // 1-based
  absCol: boolean;
  absRow: boolean;
}

export function colToNumber(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

export function numberToCol(n: number): string {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const REF = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/;

export function parseRef(text: string): CellRef | null {
  const m = REF.exec(text);
  if (!m) return null;
  const row = Number(m[4]);
  if (row < 1) return null;
  return { absCol: m[1] === "$", col: colToNumber(m[2]!), absRow: m[3] === "$", row };
}

export const refKey = (col: number, row: number) => `${numberToCol(col)}${row}`;

/** Every cell of the rectangle between two references, row by row. */
export function cellsInRange(from: CellRef, to: CellRef): { col: number; row: number }[][] {
  const rows: { col: number; row: number }[][] = [];
  for (let row = Math.min(from.row, to.row); row <= Math.max(from.row, to.row); row++) {
    const cells: { col: number; row: number }[] = [];
    for (let col = Math.min(from.col, to.col); col <= Math.max(from.col, to.col); col++) {
      cells.push({ col, row });
    }
    rows.push(cells);
  }
  return rows;
}
