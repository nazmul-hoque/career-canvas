/**
 * TypeScript challenge compiler.
 *
 * Challenges run entirely in the learner's browser. Sucrase removes TypeScript
 * syntax, then the existing JavaScript runner executes the result and checks
 * its behaviour. This is deliberately described as transpilation in the UI:
 * runtime tests prove behaviour, while the lesson's questions teach the static
 * guarantees a real `tsc` or editor supplies.
 */
import { transform } from "sucrase";
import { stripModuleSyntax } from "./runtime-shared";

export function compileTypeScript(source: string): string {
  const prepared = stripModuleSyntax(source, {
    importError: (statement) =>
      `Imports are not available in this exercise: ${statement}. Everything needed is already in the editor.`,
  });

  return transform(prepared, {
    transforms: ["typescript"],
    production: true,
  }).code;
}
