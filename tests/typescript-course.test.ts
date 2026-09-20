import { describe, expect, test } from "bun:test";
import ts from "typescript";
import { courseLessons, courses } from "../src/content/curriculum";
import { getLessonBody } from "../src/content/lesson-bodies.server";
import { typescriptLessonBodies } from "../src/content/typescript-lessons.server";
import { runCode } from "../src/lib/code-runner";

const course = courses.find((item) => item.id === "typescript")!;
const lessons = courseLessons(course);
const challenges = Object.entries(typescriptLessonBodies).flatMap(([id, body]) =>
  body.blocks.flatMap((block) => (block.kind === "challenge" ? [{ id, block }] : [])),
);

// These snippets are checked, never executed. An unused expect-error catches
// signatures that accidentally widen to any or stop rejecting invalid states.
const contracts: Record<string, string> = {
  "ts-core.annotate": `
const invoice: Invoice = { id: "a", subtotal: 5 };
const amount: number = invoiceTotal(invoice);
// @ts-expect-error: ids are readonly
invoice.id = "b";
// @ts-expect-error: subtotal is numeric
invoiceTotal({ id: "a", subtotal: "5" });`,
  "ts-core.nullable": `
const label: string | undefined = preferenceLabel([], "a");
// @ts-expect-error: a lookup can be missing
const definite: string = preferenceLabel([], "a");`,
  "ts-core.unions": `
paymentMessage({ status: "pending" });
// @ts-expect-error: successful payments require a receipt
paymentMessage({ status: "success", amount: 5 });`,
  "ts-core.checkpoint": `
shipmentAction({ id: "a", status: "queued" });
// @ts-expect-error: delivery requires a recipient
shipmentAction({ id: "a", status: "delivered" });`,
  "ts-apps.generics": `
const firstName: string | undefined = first(["Ada"]);
const resultName: string = unwrapOr({ ok: true, data: "Ada" }, "fallback");
const indexed = indexBy([{ id: "a", score: 5 }]);
const score: number | undefined = indexed.a?.score;
// @ts-expect-error: generic results retain their element type
const wrong: number = unwrapOr({ ok: true, data: "Ada" }, "fallback");
// @ts-expect-error: first retains absence
const definite: string = first(["Ada"]);
// @ts-expect-error: ids must be strings
indexBy([{ id: 1 }]);`,
  "ts-apps.utilities": `
const patch: ProfilePatch = { name: "Ada" };
// @ts-expect-error: privilege fields are not editable
const forbidden: ProfilePatch = { admin: true };
// @ts-expect-error: exact optional types require omission, not undefined
const ambiguous: ProfilePatch = { bio: undefined };`,
  "ts-apps.props": `
activateRow({ id: "a", mode: "select", onSelect: (id: string) => {} });
// @ts-expect-error: select mode requires its callback
activateRow({ id: "a", mode: "select" });
// @ts-expect-error: read mode forbids selection
activateRow({ id: "a", mode: "read", onSelect: () => {} });`,
  "ts-boundaries.unknown": `
const raw: unknown = {};
const product: Product | undefined = parseProduct(raw);
// @ts-expect-error: parsing can fail
const trusted: Product = parseProduct(raw);`,
  "ts-boundaries.async": `
const task: Promise<LabelResult> = loadLabels(async () => null);
declare const result: LabelResult;
if (result.ok) { const labels: string[] = result.labels; }
// @ts-expect-error: failure has no labels
result.labels;
// @ts-expect-error: transport must be asynchronous
loadLabels(() => []);`,
  "ts-boundaries.checkpoint": `
const result: ImportResult = importAccounts([]);
if (result.ok) { const accounts: Account[] = result.accounts; }
// @ts-expect-error: failure has no accounts
result.accounts;`,
  "ts-quality.contracts": `
const score: number = selectField({ score: 5 }, "score");
const name: string = selectField({ name: "Ada" }, "name");
// @ts-expect-error: keys must exist
selectField({ score: 5 }, "missing");
// @ts-expect-error: the selected field retains its exact type
const wrong: string = selectField({ score: 5 }, "score");`,
  "ts-project.release": `
const result: ReleaseResult = planRelease([]);
if (result.ok) { const total: number = result.totalPoints; }
// @ts-expect-error: failures have no total
result.totalPoints;
// @ts-expect-error: ready tickets require points
const invalid: Ticket = { id: "a", status: "ready" };`,
};

describe("TypeScript course", () => {
  // Lesson count, ordering, sparse checkpoints and the capstone are covered by
  // the LEARNING_DESIGNS table in lessons.test.ts. What is left here is what
  // only this course has: reference solutions that must survive strict tsc.
  test("every lesson's body is reachable through the shared merge point", () => {
    expect(new Set(lessons.map((lesson) => lesson.id))).toEqual(
      new Set(Object.keys(typescriptLessonBodies)),
    );
    for (const lesson of lessons) {
      const body = getLessonBody(course.id, lesson.id)!;
      expect(body.blocks.filter((block) => block.kind === "challenge")).toHaveLength(1);
      expect(
        body.blocks.filter((block) => block.kind === "mcq" || block.kind === "fill").length,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  for (const { id, block } of challenges) {
    test(`${id}: solution passes and starter needs work`, async () => {
      const solution = await runCode("typescript", block.solution, block.tests);
      expect(solution.error).toBeNull();
      expect(solution.tests.filter((result) => !result.passed)).toEqual([]);
      expect(solution.passed).toBe(true);
      const starter = await runCode("typescript", block.starter, block.tests);
      expect(starter.passed).toBe(false);
    });
  }

  test("every reference solution and its positive/negative contracts pass strict TypeScript", () => {
    const options: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      noEmit: true,
      types: [],
      skipLibCheck: true,
    };
    const sources = new Map(
      challenges.map(({ id, block }) => [
        ts.sys.resolvePath(`__course_typechecks__/${id}.ts`),
        `${block.solution}\n${contracts[id] ?? ""}\nexport {};`,
      ]),
    );
    const host = ts.createCompilerHost(options);
    const originalGetSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      const source = sources.get(fileName);
      return source === undefined
        ? originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile)
        : ts.createSourceFile(fileName, source, languageVersion, true);
    };
    const program = ts.createProgram([...sources.keys()], options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    expect(
      ts.formatDiagnostics(diagnostics, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => "\n",
      }),
    ).toBe("");
  });
});
