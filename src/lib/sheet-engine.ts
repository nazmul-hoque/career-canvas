/**
 * A small spreadsheet formula engine for the Excel for Analysts challenges.
 *
 * It implements the subset analysts use every day — arithmetic, comparisons,
 * `&`, ranges, relative/absolute references with fill-down and fill-across,
 * and the functions listed in FUNCTIONS — with Excel's semantics for them:
 * operator precedence (including `-2^2 = 4`), criteria strings (">="&H1,
 * wildcards), case-insensitive text matching, error values and how they
 * propagate. It is not Excel, and the UI says so; anything outside the subset
 * returns #NAME? rather than a guess.
 *
 * Pure and dependency-free, so it runs the same in the browser and in tests.
 */

export type ErrorCode = "#N/A" | "#DIV/0!" | "#VALUE!" | "#REF!" | "#NAME?" | "#NUM!";

export class XlError {
  constructor(readonly code: ErrorCode) {}
  toString() {
    return this.code;
  }
}

export type Scalar = number | string | boolean | null;
export type Value = Scalar | XlError;
/** A 2-D block of values, row-major, as a range evaluates to. */
interface RangeValue {
  kind: "range";
  rows: Value[][];
}
type Evaluated = Value | RangeValue;

const isError = (v: unknown): v is XlError => v instanceof XlError;
const isRange = (v: Evaluated): v is RangeValue =>
  typeof v === "object" && v !== null && !isError(v) && (v as RangeValue).kind === "range";

// ─── References ────────────────────────────────────────────────────────────

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

function formatRef(r: CellRef) {
  return `${r.absCol ? "$" : ""}${numberToCol(r.col)}${r.absRow ? "$" : ""}${r.row}`;
}

// ─── Tokens ────────────────────────────────────────────────────────────────

type Token =
  | { t: "num"; v: number; start: number; end: number }
  | { t: "str"; v: string; start: number; end: number }
  | { t: "ref"; v: CellRef; start: number; end: number }
  | { t: "err"; v: ErrorCode; start: number; end: number }
  | { t: "name"; v: string; start: number; end: number }
  | { t: "op"; v: string; start: number; end: number };

const ERROR_LITERALS: ErrorCode[] = ["#DIV/0!", "#VALUE!", "#REF!", "#NAME?", "#NUM!", "#N/A"];

export class FormulaError extends Error {}

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    const start = i;
    if (ch === '"') {
      let v = "";
      i++;
      for (;;) {
        if (i >= src.length) throw new FormulaError("A text value is missing its closing quote.");
        if (src[i] === '"') {
          if (src[i + 1] === '"') {
            v += '"';
            i += 2;
            continue;
          }
          i++;
          break;
        }
        v += src[i++];
      }
      tokens.push({ t: "str", v, start, end: i });
      continue;
    }
    if (ch === "#") {
      const lit = ERROR_LITERALS.find((e) => src.startsWith(e, i));
      if (!lit) throw new FormulaError(`Unexpected "#" at position ${i + 1}.`);
      i += lit.length;
      tokens.push({ t: "err", v: lit, start, end: i });
      continue;
    }
    const num = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
    if (num) {
      i += num[0].length;
      tokens.push({ t: "num", v: Number(num[0]), start, end: i });
      continue;
    }
    const word = /^\$?[A-Za-z_][A-Za-z0-9_.]*\$?\d*/.exec(src.slice(i));
    if (word) {
      const text = word[0];
      i += text.length;
      const ref = parseRef(text);
      if (ref) tokens.push({ t: "ref", v: ref, start, end: i });
      else tokens.push({ t: "name", v: text.toUpperCase(), start, end: i });
      continue;
    }
    const two = src.slice(i, i + 2);
    if (two === "<=" || two === ">=" || two === "<>") {
      i += 2;
      tokens.push({ t: "op", v: two, start, end: i });
      continue;
    }
    if ("+-*/^&=<>(),:%".includes(ch)) {
      i++;
      tokens.push({ t: "op", v: ch, start, end: i });
      continue;
    }
    throw new FormulaError(`Unexpected "${ch}" at position ${i + 1}.`);
  }
  return tokens;
}

// ─── Parser ────────────────────────────────────────────────────────────────

type Node =
  | { k: "num"; v: number }
  | { k: "str"; v: string }
  | { k: "bool"; v: boolean }
  | { k: "err"; v: ErrorCode }
  | { k: "ref"; v: CellRef }
  | { k: "range"; from: CellRef; to: CellRef }
  | { k: "call"; name: string; args: Node[] }
  | { k: "unary"; op: string; arg: Node }
  | { k: "percent"; arg: Node }
  | { k: "bin"; op: string; l: Node; r: Node };

// Excel's precedence, lowest first. Negation binds tighter than ^ (-2^2 = 4).
const BINARY: Record<string, number> = {
  "=": 1,
  "<>": 1,
  "<": 1,
  ">": 1,
  "<=": 1,
  ">=": 1,
  "&": 2,
  "+": 3,
  "-": 3,
  "*": 4,
  "/": 4,
  "^": 5,
};
const UNARY_PRECEDENCE = 6;

function parse(tokens: Token[]): Node {
  let pos = 0;
  const peek = () => tokens[pos];
  const isOp = (v: string) => {
    const tok = peek();
    return tok?.t === "op" && tok.v === v;
  };
  const expect = (v: string) => {
    if (!isOp(v)) throw new FormulaError(`Expected "${v}".`);
    pos++;
  };

  function primary(): Node {
    const tok = tokens[pos++];
    if (!tok) throw new FormulaError("The formula ends too early.");
    if (tok.t === "num") return { k: "num", v: tok.v };
    if (tok.t === "str") return { k: "str", v: tok.v };
    if (tok.t === "err") return { k: "err", v: tok.v };
    if (tok.t === "ref") {
      if (isOp(":")) {
        pos++;
        const end = tokens[pos++];
        if (end?.t !== "ref") throw new FormulaError("A range needs a cell after the colon.");
        return { k: "range", from: tok.v, to: end.v };
      }
      return { k: "ref", v: tok.v };
    }
    if (tok.t === "name") {
      if (isOp("(")) {
        pos++;
        const args: Node[] = [];
        if (!isOp(")")) {
          for (;;) {
            args.push(expression(0));
            if (isOp(",")) {
              pos++;
              continue;
            }
            break;
          }
        }
        expect(")");
        return { k: "call", name: tok.v, args };
      }
      if (tok.v === "TRUE" || tok.v === "FALSE") return { k: "bool", v: tok.v === "TRUE" };
      return { k: "err", v: "#NAME?" };
    }
    if (tok.v === "(") {
      const inner = expression(0);
      expect(")");
      return inner;
    }
    if (tok.v === "-" || tok.v === "+") {
      return { k: "unary", op: tok.v, arg: expression(UNARY_PRECEDENCE) };
    }
    throw new FormulaError(`Unexpected "${tok.v}".`);
  }

  function expression(minPrecedence: number): Node {
    let left = primary();
    for (;;) {
      if (isOp("%")) {
        pos++;
        left = { k: "percent", arg: left };
        continue;
      }
      const tok = peek();
      if (tok?.t !== "op") break;
      const prec = BINARY[tok.v];
      if (prec === undefined || prec < minPrecedence) break;
      pos++;
      // Left-associative for everything, including ^ (Excel: 2^3^2 = 64).
      const right = expression(prec + 1);
      left = { k: "bin", op: tok.v, l: left, r: right };
    }
    return left;
  }

  const tree = expression(0);
  if (pos < tokens.length) throw new FormulaError(`Unexpected "${String(tokens[pos]!.v)}".`);
  return tree;
}

/** Compiles "=..." (the leading = is optional). */
export function compileFormula(formula: string): Node {
  const body = formula.trim().replace(/^=/, "");
  if (!body.trim()) throw new FormulaError("The formula is empty.");
  return parse(tokenize(body));
}

/**
 * Copies a formula from one cell to another the way Excel's fill does:
 * relative parts of each reference move by the offset, `$` parts stay put, and
 * a reference pushed off the sheet becomes #REF!.
 */
export function shiftFormula(formula: string, dRow: number, dCol: number): string {
  const body = formula.trim().replace(/^=/, "");
  const tokens = tokenize(body);
  let out = "";
  let last = 0;
  for (const tok of tokens) {
    if (tok.t !== "ref") continue;
    out += body.slice(last, tok.start);
    const r = tok.v;
    const moved = {
      ...r,
      col: r.absCol ? r.col : r.col + dCol,
      row: r.absRow ? r.row : r.row + dRow,
    };
    out += moved.col < 1 || moved.row < 1 ? "#REF!" : formatRef(moved);
    last = tok.end;
  }
  return `=${out}${body.slice(last)}`;
}

/** The formula with spacing removed and names upper-cased, for display and comparison. */
export function normaliseFormula(formula: string): string {
  const body = formula.trim().replace(/^=/, "");
  return `=${tokenize(body)
    .map((tok) => {
      if (tok.t === "str") return `"${tok.v.replace(/"/g, '""')}"`;
      if (tok.t === "ref") return formatRef(tok.v);
      if (tok.t === "num") return String(tok.v);
      return String(tok.v);
    })
    .join("")}`;
}

// ─── Coercion and comparison ───────────────────────────────────────────────

function toNumber(v: Value): number | XlError {
  if (isError(v)) return v;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v === null || v === "") return 0;
  const n = Number(v.trim());
  return v.trim() !== "" && Number.isFinite(n) ? n : new XlError("#VALUE!");
}

/** Numbers as Excel shows them in text: 15 significant digits, no float noise. */
export function numberToText(n: number): string {
  return String(Number(n.toPrecision(15)));
}

function toText(v: Value): string | XlError {
  if (isError(v)) return v;
  if (v === null) return "";
  if (typeof v === "number") return numberToText(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return v;
}

function toBool(v: Value): boolean | XlError {
  if (isError(v)) return v;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (v === null) return false;
  const upper = v.toUpperCase();
  if (upper === "TRUE") return true;
  if (upper === "FALSE") return false;
  return new XlError("#VALUE!");
}

/** Excel orders numbers < text < booleans; text compares without case. */
function compare(a: Value, b: Value): number {
  if (a === null) a = typeof b === "string" ? "" : typeof b === "boolean" ? false : 0;
  if (b === null) b = typeof a === "string" ? "" : typeof a === "boolean" ? false : 0;
  const rank = (v: Value) => (typeof v === "number" ? 0 : typeof v === "string" ? 1 : 2);
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "string" && typeof b === "string") {
    const x = a.toLowerCase();
    const y = b.toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  }
  return Number(a) - Number(b);
}

function wildcardRegex(pattern: string): RegExp {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]!;
    if (ch === "~" && i + 1 < pattern.length) {
      re += pattern[++i]!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    } else if (ch === "*") re += ".*";
    else if (ch === "?") re += ".";
    else re += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`, "is");
}

/** Builds the test a *IFS criterion describes: 5, "Apparel", ">=100", "<>", "Wool*". */
function criterion(c: Value): (v: Value) => boolean {
  if (isError(c)) return () => false;
  if (typeof c === "number") return (v) => typeof v === "number" && v === c;
  if (typeof c === "boolean") return (v) => v === c;
  if (c === null) return (v) => v === null || v === "";
  const m = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(c)!;
  const op = m[1] ?? "=";
  const operand = m[2]!;
  const numeric = operand.trim() !== "" && Number.isFinite(Number(operand));
  if (operand === "") {
    if (op === "=") return (v) => v === null || v === "";
    if (op === "<>") return (v) => !(v === null || v === "");
  }
  if (numeric) {
    const n = Number(operand);
    return (v) => {
      if (typeof v !== "number") return op === "<>";
      switch (op) {
        case "=":
          return v === n;
        case "<>":
          return v !== n;
        case "<":
          return v < n;
        case "<=":
          return v <= n;
        case ">":
          return v > n;
        default:
          return v >= n;
      }
    };
  }
  if (op === "=" || op === "<>") {
    const re = wildcardRegex(operand);
    return (v) => {
      const matched = typeof v === "string" && re.test(v);
      return op === "=" ? matched : !matched;
    };
  }
  return (v) => {
    if (typeof v !== "string") return false;
    const cmp = compare(v, operand);
    return op === "<" ? cmp < 0 : op === "<=" ? cmp <= 0 : op === ">" ? cmp > 0 : cmp >= 0;
  };
}

// ─── Sheet ─────────────────────────────────────────────────────────────────

export type CellInput = Scalar;

export class CircularReferenceError extends Error {}

/**
 * A sheet of literal values and formulas. Cells are evaluated on demand and
 * cached; `withOverrides` gives a copy with some inputs replaced, which is how
 * tests check that a result really depends on its inputs.
 */
export class Sheet {
  private readonly cells = new Map<string, CellInput>();
  private readonly cache = new Map<string, Value>();
  private readonly evaluating = new Set<string>();
  /** Why a cell shows #NAME?/#VALUE! when the formula itself is the problem. */
  readonly problems = new Map<string, string>();

  constructor(entries: Iterable<[string, CellInput]> = []) {
    for (const [key, value] of entries) this.set(key, value);
  }

  set(key: string, value: CellInput) {
    this.cells.set(key.toUpperCase(), value);
    this.cache.clear();
  }

  raw(key: string): CellInput {
    return this.cells.get(key.toUpperCase()) ?? null;
  }

  isFormula(key: string) {
    const raw = this.raw(key);
    return typeof raw === "string" && raw.startsWith("=");
  }

  keys() {
    return [...this.cells.keys()];
  }

  withOverrides(overrides: Record<string, CellInput>): Sheet {
    const copy = new Sheet(this.cells.entries());
    for (const [key, value] of Object.entries(overrides)) copy.set(key, value);
    return copy;
  }

  value(key: string): Value {
    const k = key.toUpperCase();
    const cached = this.cache.get(k);
    if (cached !== undefined) return cached;
    const raw = this.cells.get(k) ?? null;
    if (!(typeof raw === "string" && raw.startsWith("="))) return raw;
    if (this.evaluating.has(k)) throw new CircularReferenceError(`${k} depends on itself.`);
    this.evaluating.add(k);
    try {
      let result: Value;
      try {
        const out = this.evaluate(compileFormula(raw));
        result = isRange(out) ? this.single(out) : out;
      } catch (error) {
        if (error instanceof CircularReferenceError) throw error;
        if (error instanceof FormulaError) this.problems.set(k, error.message);
        result = new XlError(error instanceof FormulaError ? "#NAME?" : "#VALUE!");
      }
      this.cache.set(k, result);
      return result;
    } finally {
      this.evaluating.delete(k);
    }
  }

  private single(range: RangeValue): Value {
    const only = range.rows.length === 1 && range.rows[0]!.length === 1;
    return only ? range.rows[0]![0]! : new XlError("#VALUE!");
  }

  private range(from: CellRef, to: CellRef): RangeValue {
    const [c1, c2] = [Math.min(from.col, to.col), Math.max(from.col, to.col)];
    const [r1, r2] = [Math.min(from.row, to.row), Math.max(from.row, to.row)];
    const rows: Value[][] = [];
    for (let r = r1; r <= r2; r++) {
      const row: Value[] = [];
      for (let c = c1; c <= c2; c++) row.push(this.value(refKey(c, r)));
      rows.push(row);
    }
    return { kind: "range", rows };
  }

  private scalar(node: Node): Value {
    const v = this.evaluate(node);
    return isRange(v) ? this.single(v) : v;
  }

  private evaluate(node: Node): Evaluated {
    switch (node.k) {
      case "num":
        return node.v;
      case "str":
        return node.v;
      case "bool":
        return node.v;
      case "err":
        return new XlError(node.v);
      case "ref":
        return this.value(refKey(node.v.col, node.v.row));
      case "range":
        return this.range(node.from, node.to);
      case "percent": {
        const n = toNumber(this.scalar(node.arg));
        return isError(n) ? n : n / 100;
      }
      case "unary": {
        const n = toNumber(this.scalar(node.arg));
        if (isError(n)) return n;
        return node.op === "-" ? -n : n;
      }
      case "bin":
        return this.binary(node.op, this.scalar(node.l), this.scalar(node.r));
      case "call":
        return this.call(node.name, node.args);
    }
  }

  private binary(op: string, a: Value, b: Value): Value {
    if (isError(a)) return a;
    if (isError(b)) return b;
    if (op === "&") {
      const x = toText(a);
      const y = toText(b);
      if (isError(x)) return x;
      if (isError(y)) return y;
      return x + y;
    }
    if (["=", "<>", "<", ">", "<=", ">="].includes(op)) {
      const c = compare(a, b);
      return op === "="
        ? c === 0
        : op === "<>"
          ? c !== 0
          : op === "<"
            ? c < 0
            : op === ">"
              ? c > 0
              : op === "<="
                ? c <= 0
                : c >= 0;
    }
    const x = toNumber(a);
    const y = toNumber(b);
    if (isError(x)) return x;
    if (isError(y)) return y;
    switch (op) {
      case "+":
        return x + y;
      case "-":
        return x - y;
      case "*":
        return x * y;
      case "/":
        return y === 0 ? new XlError("#DIV/0!") : x / y;
      default: {
        const p = Math.pow(x, y);
        return Number.isFinite(p) ? p : new XlError("#NUM!");
      }
    }
  }

  // ─── Functions ─────────────────────────────────────────────────────────

  /**
   * Numbers for SUM-like functions. Inside a range, only numbers count (text,
   * booleans and blanks are skipped); a value typed straight into the
   * arguments is converted. Errors anywhere propagate.
   */
  private numbers(args: Node[]): number[] | XlError {
    const out: number[] = [];
    for (const arg of args) {
      const v = this.evaluate(arg);
      if (isRange(v)) {
        for (const cell of v.rows.flat()) {
          if (isError(cell)) return cell;
          if (typeof cell === "number") out.push(cell);
        }
      } else {
        if (v === null) continue;
        const n = toNumber(v);
        if (isError(n)) return n;
        out.push(n);
      }
    }
    return out;
  }

  private asRange(node: Node): RangeValue | XlError {
    const v = this.evaluate(node);
    if (isRange(v)) return v;
    if (isError(v)) return v;
    return { kind: "range", rows: [[v]] };
  }

  private ifs(args: Node[], offset: number): boolean[] | XlError {
    let mask: boolean[] | null = null;
    let shape: string | null = null;
    for (let i = offset; i + 1 < args.length; i += 2) {
      const range = this.asRange(args[i]!);
      if (isError(range)) return range;
      const test = criterion(this.scalar(args[i + 1]!));
      const size = `${range.rows.length}x${range.rows[0]?.length ?? 0}`;
      if (shape && size !== shape) return new XlError("#VALUE!");
      shape = size;
      const cells = range.rows.flat();
      const hits = cells.map((c) => test(c));
      mask = mask ? mask.map((m, j) => m && hits[j]!) : hits;
    }
    if ((args.length - offset) % 2 !== 0 || !mask) return new XlError("#VALUE!");
    return mask;
  }

  private call(name: string, args: Node[]): Evaluated {
    const need = (min: number, max = min) => {
      if (args.length < min || args.length > max) {
        const count = min === max ? `${min}` : `${min} to ${max}`;
        throw new FormulaError(
          `${name} takes ${count} argument${max === 1 ? "" : "s"}, not ${args.length}.`,
        );
      }
    };
    const nums = () => this.numbers(args);

    switch (name) {
      case "SUM": {
        const n = nums();
        return isError(n) ? n : n.reduce((a, b) => a + b, 0);
      }
      case "AVERAGE": {
        const n = nums();
        if (isError(n)) return n;
        return n.length ? n.reduce((a, b) => a + b, 0) / n.length : new XlError("#DIV/0!");
      }
      case "MIN":
      case "MAX": {
        const n = nums();
        if (isError(n)) return n;
        if (!n.length) return 0;
        return name === "MIN" ? Math.min(...n) : Math.max(...n);
      }
      case "COUNT":
      case "COUNTA":
      case "COUNTBLANK": {
        let count = 0;
        for (const arg of args) {
          const v = this.evaluate(arg);
          const cells = isRange(v) ? v.rows.flat() : [v];
          for (const c of cells) {
            const blank = c === null || c === "";
            if (name === "COUNT" && typeof c === "number") count++;
            else if (name === "COUNTA" && c !== null) count++;
            else if (name === "COUNTBLANK" && blank) count++;
          }
        }
        return count;
      }
      case "ROUND": {
        need(2);
        const n = toNumber(this.scalar(args[0]!));
        const d = toNumber(this.scalar(args[1]!));
        if (isError(n)) return n;
        if (isError(d)) return d;
        const f = 10 ** Math.trunc(d);
        // Half away from zero, as Excel does; the nudge absorbs binary noise
        // so 2.675 rounds to 2.68 rather than 2.67.
        return (Math.sign(n) * Math.round(Math.abs(n) * f * (1 + 1e-12))) / f;
      }
      case "ABS": {
        need(1);
        const n = toNumber(this.scalar(args[0]!));
        return isError(n) ? n : Math.abs(n);
      }
      case "IF": {
        need(2, 3);
        const cond = toBool(this.scalar(args[0]!));
        if (isError(cond)) return cond;
        if (cond) return this.scalar(args[1]!);
        return args[2] ? this.scalar(args[2]) : false;
      }
      case "IFERROR": {
        need(2);
        const v = this.scalar(args[0]!);
        return isError(v) ? this.scalar(args[1]!) : v;
      }
      case "AND":
      case "OR": {
        const flags: boolean[] = [];
        for (const arg of args) {
          const v = this.evaluate(arg);
          for (const c of isRange(v) ? v.rows.flat() : [v]) {
            if (c === null && isRange(v)) continue;
            const b = toBool(c);
            if (isError(b)) return b;
            flags.push(b);
          }
        }
        if (!flags.length) return new XlError("#VALUE!");
        return name === "AND" ? flags.every(Boolean) : flags.some(Boolean);
      }
      case "NOT": {
        need(1);
        const b = toBool(this.scalar(args[0]!));
        return isError(b) ? b : !b;
      }
      case "SUMIF":
      case "COUNTIF":
      case "AVERAGEIF": {
        need(2, name === "COUNTIF" ? 2 : 3);
        // SUMIF(range, criteria, [sum_range]) → SUMIFS(sum_range, range, criteria)
        const reordered = name === "COUNTIF" ? args : [args[2] ?? args[0]!, args[0]!, args[1]!];
        return this.call(
          name === "SUMIF" ? "SUMIFS" : name === "COUNTIF" ? "COUNTIFS" : "AVERAGEIFS",
          reordered,
        );
      }
      case "SUMIFS":
      case "AVERAGEIFS": {
        if (args.length < 3)
          throw new FormulaError(
            `${name} needs a range to add up and at least one range/criteria pair.`,
          );
        const target = this.asRange(args[0]!);
        if (isError(target)) return target;
        const mask = this.ifs(args, 1);
        if (isError(mask)) return mask;
        const cells = target.rows.flat();
        if (cells.length !== mask.length) return new XlError("#VALUE!");
        const picked: number[] = [];
        for (let i = 0; i < cells.length; i++) {
          if (!mask[i]) continue;
          const c = cells[i]!;
          if (isError(c)) return c;
          if (typeof c === "number") picked.push(c);
        }
        const sum = picked.reduce((a, b) => a + b, 0);
        if (name === "SUMIFS") return sum;
        return picked.length ? sum / picked.length : new XlError("#DIV/0!");
      }
      case "COUNTIFS": {
        if (args.length < 2)
          throw new FormulaError("COUNTIFS needs at least one range/criteria pair.");
        const mask = this.ifs(args, 0);
        return isError(mask) ? mask : mask.filter(Boolean).length;
      }
      case "XLOOKUP": {
        need(3, 6);
        const needle = this.scalar(args[0]!);
        if (isError(needle)) return needle;
        const lookup = this.asRange(args[1]!);
        const result = this.asRange(args[2]!);
        if (isError(lookup)) return lookup;
        if (isError(result)) return result;
        const mode = args[4] ? toNumber(this.scalar(args[4])) : 0;
        if (isError(mode)) return mode;
        if (mode !== 0)
          throw new FormulaError("Only exact-match XLOOKUP (match_mode 0) is supported here.");
        const keys = lookup.rows.flat();
        const vertical = lookup.rows.length > 1 || lookup.rows[0]!.length === 1;
        const index = keys.findIndex((k) => k !== null && !isError(k) && compare(k, needle) === 0);
        if (index === -1) return args[3] ? this.scalar(args[3]) : new XlError("#N/A");
        const picked = vertical ? result.rows[index]?.[0] : result.rows[0]?.[index];
        return picked === undefined ? new XlError("#VALUE!") : picked;
      }
      case "VLOOKUP": {
        need(3, 4);
        const needle = this.scalar(args[0]!);
        if (isError(needle)) return needle;
        const table = this.asRange(args[1]!);
        if (isError(table)) return table;
        const col = toNumber(this.scalar(args[2]!));
        if (isError(col)) return col;
        if (col < 1) return new XlError("#VALUE!");
        if (col > (table.rows[0]?.length ?? 0)) return new XlError("#REF!");
        const approximate = args[3] ? toBool(this.scalar(args[3])) : true;
        if (isError(approximate)) return approximate;
        let hit = -1;
        for (let r = 0; r < table.rows.length; r++) {
          const key = table.rows[r]![0]!;
          if (key === null || isError(key)) continue;
          const c = compare(key, needle);
          if (approximate) {
            // Assumes the first column is sorted: take the last key <= the value.
            if (c <= 0) hit = r;
            else break;
          } else if (c === 0) {
            hit = r;
            break;
          }
        }
        return hit === -1 ? new XlError("#N/A") : table.rows[hit]![Math.trunc(col) - 1]!;
      }
      case "MATCH": {
        need(2, 3);
        const needle = this.scalar(args[0]!);
        const list = this.asRange(args[1]!);
        if (isError(needle)) return needle;
        if (isError(list)) return list;
        const type = args[2] ? toNumber(this.scalar(args[2])) : 1;
        if (isError(type)) return type;
        const keys = list.rows.flat();
        if (type === 0) {
          const i = keys.findIndex((k) => k !== null && !isError(k) && compare(k, needle) === 0);
          return i === -1 ? new XlError("#N/A") : i + 1;
        }
        let hit = -1;
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i]!;
          if (k === null || isError(k)) continue;
          const c = compare(k, needle);
          if (type > 0 ? c <= 0 : c >= 0) hit = i;
          else break;
        }
        return hit === -1 ? new XlError("#N/A") : hit + 1;
      }
      case "INDEX": {
        need(2, 3);
        const table = this.asRange(args[0]!);
        if (isError(table)) return table;
        const r = toNumber(this.scalar(args[1]!));
        const c = args[2] ? toNumber(this.scalar(args[2])) : 1;
        if (isError(r)) return r;
        if (isError(c)) return c;
        // A single row indexed by one number reads across it.
        const oneRow = table.rows.length === 1 && !args[2];
        const row = oneRow ? table.rows[0] : table.rows[r - 1];
        const cell = oneRow ? row?.[r - 1] : row?.[c - 1];
        return cell === undefined ? new XlError("#REF!") : cell;
      }
      case "LEN":
      case "UPPER":
      case "LOWER":
      case "TRIM": {
        need(1);
        const t = toText(this.scalar(args[0]!));
        if (isError(t)) return t;
        if (name === "LEN") return t.length;
        if (name === "UPPER") return t.toUpperCase();
        if (name === "LOWER") return t.toLowerCase();
        return t.trim().replace(/ +/g, " ");
      }
      case "LEFT":
      case "RIGHT": {
        need(1, 2);
        const t = toText(this.scalar(args[0]!));
        const n = args[1] ? toNumber(this.scalar(args[1])) : 1;
        if (isError(t)) return t;
        if (isError(n)) return n;
        if (n < 0) return new XlError("#VALUE!");
        return name === "LEFT" ? t.slice(0, n) : n === 0 ? "" : t.slice(-n);
      }
      case "CONCAT": {
        let out = "";
        for (const arg of args) {
          const v = this.evaluate(arg);
          for (const c of isRange(v) ? v.rows.flat() : [v]) {
            const t = toText(c);
            if (isError(t)) return t;
            out += t;
          }
        }
        return out;
      }
      case "ISBLANK":
        need(1);
        return this.scalar(args[0]!) === null;
      case "ISNUMBER":
        need(1);
        return typeof this.scalar(args[0]!) === "number";
      case "ISERROR":
        need(1);
        return isError(this.scalar(args[0]!));
      default:
        return new XlError("#NAME?");
    }
  }
}

/** Every function the engine understands — shown to learners. */
export const FUNCTIONS = [
  "SUM",
  "AVERAGE",
  "MIN",
  "MAX",
  "COUNT",
  "COUNTA",
  "COUNTBLANK",
  "ROUND",
  "ABS",
  "IF",
  "IFERROR",
  "AND",
  "OR",
  "NOT",
  "SUMIF",
  "SUMIFS",
  "COUNTIF",
  "COUNTIFS",
  "AVERAGEIF",
  "AVERAGEIFS",
  "XLOOKUP",
  "VLOOKUP",
  "INDEX",
  "MATCH",
  "LEN",
  "UPPER",
  "LOWER",
  "TRIM",
  "LEFT",
  "RIGHT",
  "CONCAT",
  "ISBLANK",
  "ISNUMBER",
  "ISERROR",
];
