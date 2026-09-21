/**
 * Regenerates the files the browser reads instead of the authored content:
 *
 *   bun run lessons:manifest
 *
 * - src/content/lesson-manifest.gen.ts — which lessons exist, and what they ask.
 * - src/content/claude-course.gen.ts   — the Claude roadmap's shape.
 * - src/content/chatgpt-course.gen.ts  — the ChatGPT roadmap's shape.
 *
 * The client can't import either source (they carry the answer key, and in the
 * Claude course's case ~40KB of prose besides), so this is how it learns what
 * is there. tests/lessons.test.ts fails when a committed file drifts.
 */
import prettier from "prettier";

import { renderClaudeModules } from "../src/content/claude-levels.server";
import { renderChatGPTModules } from "../src/content/chatgpt-levels.server";

/**
 * Generated files are linted like any other source, and `renderClaudeModules`
 * builds its body with JSON.stringify — quoted keys, which prettier rejects.
 * Formatting on the way out keeps both outputs lint-clean by construction,
 * rather than depending on someone remembering to run `bun run format` after
 * every regeneration.
 */
async function writeFormatted(url: URL, source: string) {
  const path = new URL(url).pathname;
  const options = await prettier.resolveConfig(path);
  await Bun.write(url, await prettier.format(source, { ...options, filepath: path }));
}

// The course skeleton first, and the manifest renderer only afterwards: reading
// the bodies pulls in the curriculum, which imports the file being written here.
await writeFormatted(
  new URL("../src/content/claude-course.gen.ts", import.meta.url),
  renderClaudeModules(),
);
console.log("Wrote src/content/claude-course.gen.ts");

await writeFormatted(
  new URL("../src/content/chatgpt-course.gen.ts", import.meta.url),
  renderChatGPTModules(),
);
console.log("Wrote src/content/chatgpt-course.gen.ts");

const { renderManifest } = await import("../src/content/lesson-manifest.server");
await writeFormatted(
  new URL("../src/content/lesson-manifest.gen.ts", import.meta.url),
  renderManifest(),
);
console.log("Wrote src/content/lesson-manifest.gen.ts");
