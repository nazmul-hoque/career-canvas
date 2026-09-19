import { describe, expect, test } from "bun:test";

import {
  CircularReferenceError,
  Sheet,
  XlError,
  normaliseFormula,
  shiftFormula,
  type CellInput,
} from "../src/lib/sheet-engine";

/**
 * The spreadsheet engine behind the Excel challenges. Each expectation is what
 * Excel itself returns; if one of these fails, the engine has drifted from the
 * product the lessons teach.
 */

const sheet = (cells: Record<string, CellInput>) => new Sheet(Object.entries(cells));
const calc = (formula: string, cells: Record<string, CellInput> = {}) =>
  sheet({ ...cells, Z99: formula }).value("Z99");
const code = (v: unknown) => (v instanceof XlError ? v.code : v);

describe("operators", () => {
  test("precedence, including Excel's -2^2 = 4", () => {
    expect(calc("=1+2*3")).toBe(7);
    expect(calc("=(1+2)*3")).toBe(9);
    expect(calc("=-2^2")).toBe(4);
    expect(calc("=2^3^2")).toBe(64);
    expect(calc("=50%")).toBe(0.5);
    expect(calc("=1+2&3")).toBe("33");
  });

  test("comparisons and text", () => {
    expect(calc('="apple"="APPLE"')).toBe(true);
    expect(calc("=2<10")).toBe(true);
    expect(calc('="2"<"10"')).toBe(false);
    expect(calc('=1<"a"')).toBe(true);
    expect(calc('="Total: "&0.1+0.2')).toBe("Total: 0.3");
  });

  test("errors", () => {
    expect(code(calc("=1/0"))).toBe("#DIV/0!");
    expect(code(calc('=1+"x"'))).toBe("#VALUE!");
    expect(code(calc("=NOPE(1)"))).toBe("#NAME?");
    expect(code(calc("=A1+1", { A1: "=1/0" }))).toBe("#DIV/0!");
    expect(calc("=A1+1", { A1: "5" })).toBe(6);
  });
});

describe("functions", () => {
  const cells = { A1: 10, A2: 20, A3: "text", A4: null, A5: true, A6: 0 };

  test("aggregates skip text, booleans and blanks inside ranges", () => {
    expect(calc("=SUM(A1:A6)", cells)).toBe(30);
    expect(calc("=AVERAGE(A1:A6)", cells)).toBe(10);
    expect(calc("=COUNT(A1:A6)", cells)).toBe(3);
    expect(calc("=COUNTA(A1:A6)", cells)).toBe(5);
    expect(calc("=COUNTBLANK(A1:A6)", cells)).toBe(1);
    expect(calc("=MAX(A1:A6)", cells)).toBe(20);
    expect(calc("=MIN(A1:A6)", cells)).toBe(0);
    expect(calc('=SUM(1,TRUE,"2")')).toBe(4);
    expect(code(calc("=AVERAGE(A3:A4)", cells))).toBe("#DIV/0!");
  });

  test("ROUND rounds half away from zero, like Excel", () => {
    expect(calc("=ROUND(2.675,2)")).toBe(2.68);
    expect(calc("=ROUND(-2.5,0)")).toBe(-3);
    expect(calc("=ROUND(1234.5,-2)")).toBe(1200);
  });

  test("IF, IFERROR, AND, OR", () => {
    expect(calc('=IF(A1>5,"big","small")', { A1: 9 })).toBe("big");
    expect(calc("=IF(FALSE,1)")).toBe(false);
    expect(calc('=IFERROR(1/0,"none")')).toBe("none");
    expect(calc("=AND(1,TRUE)")).toBe(true);
    expect(calc("=OR(0,FALSE)")).toBe(false);
  });

  test("text functions", () => {
    expect(calc('=TRIM("  a   b ")')).toBe("a b");
    expect(calc('=LEFT("Trail",3)&RIGHT("Shoes",2)')).toBe("Traes");
    expect(calc('=LEN("héllo")')).toBe(5);
    expect(calc('=CONCAT("a",1,TRUE)')).toBe("a1TRUE");
  });
});

describe("conditional aggregation", () => {
  const data = {
    A1: "Apparel",
    B1: 48,
    C1: "Jan",
    A2: "Gear",
    B2: 35,
    C2: "Jan",
    A3: "Apparel",
    B3: 130,
    C3: "Feb",
    A4: "apparel",
    B4: 72,
    C4: "Mar",
    A5: "Gear",
    B5: "n/a",
    C5: "Mar",
    D1: 100,
  };

  test("criteria: text is case-insensitive, numbers compare, text in the sum range is skipped", () => {
    expect(calc('=SUMIFS(B1:B5,A1:A5,"Apparel")', data)).toBe(250);
    expect(calc('=SUMIFS(B1:B5,A1:A5,"Gear")', data)).toBe(35);
    expect(calc('=COUNTIFS(B1:B5,">=48")', data)).toBe(3);
    expect(calc('=COUNTIFS(B1:B5,">="&D1)', data)).toBe(1);
    expect(calc('=SUMIFS(B1:B5,A1:A5,"Apparel",C1:C5,"Mar")', data)).toBe(72);
    expect(calc('=AVERAGEIFS(B1:B5,A1:A5,"Apparel")', data)).toBeCloseTo(83.333, 3);
  });

  test("wildcards, not-equal and blanks", () => {
    expect(calc('=COUNTIF(A1:A5,"App*")', data)).toBe(3);
    expect(calc('=COUNTIF(A1:A5,"<>Gear")', data)).toBe(3);
    expect(calc('=COUNTIF(A1:A3,"")', { A1: 1, A2: null, A3: "" })).toBe(2);
    expect(calc('=SUMIF(A1:A5,"Gear",B1:B5)', data)).toBe(35);
  });

  test("mismatched range sizes are #VALUE!", () => {
    expect(code(calc('=SUMIFS(B1:B4,A1:A5,"Gear")', data))).toBe("#VALUE!");
  });
});

describe("lookups", () => {
  const table = {
    A1: "SHO-120",
    B1: "Footwear",
    C1: 120,
    A2: "SHE-180",
    B2: "Apparel",
    C2: 180,
    A3: "BOT-020",
    B3: "Gear",
    C3: 20,
  };

  test("XLOOKUP: exact, case-insensitive, with an if-not-found value", () => {
    expect(calc('=XLOOKUP("bot-020",A1:A3,C1:C3)', table)).toBe(20);
    expect(code(calc('=XLOOKUP("NOPE",A1:A3,C1:C3)', table))).toBe("#N/A");
    expect(calc('=XLOOKUP("NOPE",A1:A3,C1:C3,"Not found")', table)).toBe("Not found");
  });

  test("VLOOKUP: FALSE is exact; the default TRUE is approximate and assumes sorted keys", () => {
    expect(calc('=VLOOKUP("SHE-180",A1:C3,2,FALSE)', table)).toBe("Apparel");
    expect(code(calc('=VLOOKUP("NOPE",A1:C3,2,FALSE)', table))).toBe("#N/A");
    expect(code(calc('=VLOOKUP("SHE-180",A1:C3,4,FALSE)', table))).toBe("#REF!");
    const bands = { A1: 0, B1: "small", A2: 50, B2: "medium", A3: 200, B3: "large" };
    expect(calc("=VLOOKUP(120,A1:B3,2)", bands)).toBe("medium");
    // Unsorted keys + approximate match: an answer, no error, and wrong.
    expect(calc('=VLOOKUP("SHE-180",A1:C3,3)', table)).not.toBe(180);
  });

  test("INDEX and MATCH", () => {
    expect(calc('=INDEX(C1:C3,MATCH("BOT-020",A1:A3,0))', table)).toBe(20);
    expect(calc("=INDEX(A1:C3,2,3)", table)).toBe(180);
    expect(code(calc("=INDEX(A1:C3,9,1)", table))).toBe("#REF!");
  });
});

describe("filling formulas", () => {
  test("relative parts move, $ parts stay", () => {
    expect(shiftFormula("=B2*$F$1", 3, 0)).toBe("=B5*$F$1");
    expect(shiftFormula("=SUMIFS($G$2:$G$13,$C$2:$C$13,$I2,$B$2:$B$13,J$1)", 2, 1)).toBe(
      "=SUMIFS($G$2:$G$13,$C$2:$C$13,$I4,$B$2:$B$13,K$1)",
    );
    expect(shiftFormula('="B2"&B2', 1, 0)).toBe('="B2"&B3');
    expect(shiftFormula("=A1", -1, 0)).toBe("=#REF!");
  });

  test("normalising removes spacing and case differences", () => {
    expect(normaliseFormula("= sum( b2 : b5 ) * $f$1")).toBe("=SUM(B2:B5)*$F$1");
  });
});

describe("sheet", () => {
  test("overrides recompute dependants without touching the original", () => {
    const s = sheet({ A1: 2, A2: 3, A3: "=A1*A2" });
    expect(s.value("A3")).toBe(6);
    expect(s.withOverrides({ A1: 10 }).value("A3")).toBe(30);
    expect(s.value("A3")).toBe(6);
  });

  test("circular references are reported, not looped", () => {
    expect(() => sheet({ A1: "=A2", A2: "=A1" }).value("A1")).toThrow(CircularReferenceError);
  });

  test("a formula problem is explained", () => {
    const s = sheet({ A1: "=ROUND(1)" });
    expect(code(s.value("A1"))).toBe("#NAME?");
    expect(s.problems.get("A1")).toContain("ROUND takes 2 arguments");
  });
});
