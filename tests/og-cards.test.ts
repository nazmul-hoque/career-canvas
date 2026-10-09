import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { ogCards, ogFingerprint } from "../src/lib/og-cards";

const dir = new URL("../public/og/", import.meta.url).pathname;

/**
 * The share images are rendered ahead of time, so nothing else notices when a
 * course is renamed or added and its picture still says the old thing — the
 * link preview on LinkedIn would quietly disagree with the page. Re-render with
 * `bun run og:images` when one of these fails.
 */
describe("share images", () => {
  const fingerprints = JSON.parse(readFileSync(dir + "fingerprints.json", "utf8")) as Record<
    string,
    string
  >;

  test("every course and path has one, rendered from its current words", () => {
    const stale = ogCards()
      .filter(
        (card) => !existsSync(dir + card.file) || fingerprints[card.file] !== ogFingerprint(card),
      )
      .map((card) => card.file);
    expect(stale).toEqual([]);
  });

  test("no image is left over from a course or path that no longer exists", () => {
    const expected = new Set([...ogCards().map((card) => card.file), "fingerprints.json"]);
    expect(readdirSync(dir).filter((file) => !expected.has(file))).toEqual([]);
  });
});
