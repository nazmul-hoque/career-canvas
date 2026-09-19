/**
 * Regenerates src/content/lesson-manifest.gen.ts from the authored lessons:
 *
 *   bun run lessons:manifest
 *
 * The browser can't import the lessons themselves (they carry the answer key),
 * so this is how it learns which lessons exist. tests/lessons.test.ts fails when
 * the two drift apart.
 */
import { renderManifest } from "../src/content/lesson-manifest.server";

await Bun.write(
  new URL("../src/content/lesson-manifest.gen.ts", import.meta.url),
  renderManifest(),
);
console.log("Wrote src/content/lesson-manifest.gen.ts");
