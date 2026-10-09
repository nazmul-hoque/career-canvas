/**
 * Renders a 1200×630 share image for every course and path:
 *
 *   bun run og:images
 *
 * Writes public/og/<kind>-<id>.jpg and public/og/fingerprints.json, which
 * tests/og-cards.test.ts compares against the current curriculum. Rendering
 * happens here, not at request time, because the Cloudflare build has no
 * browser and an image library would be a large dependency for ~30 pictures.
 *
 * Needs Chrome or Chromium. Set CHROME_PATH if it isn't in the usual place.
 * Fonts load from Google Fonts, so it needs the network too.
 */
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ogCards, ogFingerprint, type OgCard } from "../src/lib/og-cards";

const OUT = new URL("../public/og/", import.meta.url).pathname;

function findChrome(): string {
  const candidates = [
    process.env["CHROME_PATH"],
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    Bun.which("google-chrome"),
    Bun.which("chromium"),
    Bun.which("chromium-browser"),
  ];
  const found = candidates.find((path) => path && Bun.file(path).size > 0);
  if (!found) throw new Error("No Chrome found. Set CHROME_PATH to a Chrome or Chromium binary.");
  return found;
}

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Colours are the Ascent tokens from src/styles.css, written out because this
// page is rendered on its own, outside the app's stylesheet.
function cardHtml(card: OgCard): string {
  const titleSize = card.title.length > 30 ? 64 : card.title.length > 20 ? 76 : 88;
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Manrope:wght@500;600;700&display=block" rel="stylesheet">
<style>
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:oklch(0.168 0.011 265);color:#fff;font-family:Manrope,sans-serif;position:relative}
.lines{position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0 1px,transparent 1px 22px)}
.glow{position:absolute;right:-180px;top:-220px;width:720px;height:720px;border-radius:50%;background:radial-gradient(circle,oklch(0.705 0.136 165.5 / .32),transparent 65%)}
.wrap{position:absolute;inset:64px 80px;display:flex;flex-direction:column}
.mark{display:flex;align-items:center;gap:14px}
.sq{width:48px;height:48px;border-radius:14px;background:oklch(0.705 0.136 165.5);display:grid;place-items:center;font:700 24px "Space Grotesk"}
.name{font:700 28px "Space Grotesk";letter-spacing:-.02em}
.eyebrow{margin-top:auto;font:700 22px Manrope;letter-spacing:.08em;text-transform:uppercase;color:oklch(0.705 0.136 165.5)}
h1{font:700 ${titleSize}px/1.04 "Space Grotesk";letter-spacing:-.035em;margin:14px 0 0;max-width:1000px}
p{margin:20px 0 0;font:500 26px/1.35 Manrope;color:rgba(255,255,255,.66);max-width:960px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tags{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.tag{font:600 19px Manrope;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.85)}
</style></head><body><div class="lines"></div><div class="glow"></div>
<div class="wrap">
<div class="mark"><div class="sq">A</div><div class="name">Ascent</div></div>
<div class="eyebrow">${escape(card.eyebrow)}</div>
<h1>${escape(card.title)}</h1>
<p>${escape(card.subtitle)}</p>
<div class="tags">${card.tags.map((t) => `<span class="tag">${escape(t)}</span>`).join("")}</div>
</div></body></html>`;
}

async function render(chrome: string, dir: string, card: OgCard) {
  const html = join(dir, card.file.replace(/\.jpg$/, ".html"));
  writeFileSync(html, cardHtml(card));
  // Chrome picks the image format from the extension; JPEG is a third of PNG's size here.
  const out = join(dir, card.file.replace(/\.jpg$/, ".jpeg"));
  const proc = Bun.spawn(
    [
      chrome,
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--virtual-time-budget=5000",
      "--window-size=1200,630",
      `--screenshot=${out}`,
      `file://${html}`,
    ],
    { stdout: "ignore", stderr: "ignore" },
  );
  if ((await proc.exited) !== 0 || Bun.file(out).size === 0) {
    throw new Error(`Chrome failed to render ${card.file}`);
  }
  await Bun.write(join(OUT, card.file), Bun.file(out));
}

const chrome = findChrome();
const dir = mkdtempSync(join(tmpdir(), "ascent-og-"));
const cards = ogCards();

// A few at a time: one Chrome per card, and thirty at once is unkind to a laptop.
for (let i = 0; i < cards.length; i += 4) {
  await Promise.all(cards.slice(i, i + 4).map((card) => render(chrome, dir, card)));
}

const keep = new Set([...cards.map((c) => c.file), "fingerprints.json"]);
for (const file of readdirSync(OUT)) {
  if (!keep.has(file)) rmSync(join(OUT, file));
}

const fingerprints = Object.fromEntries(cards.map((c) => [c.file, ogFingerprint(c)]));
writeFileSync(join(OUT, "fingerprints.json"), JSON.stringify(fingerprints, null, 2) + "\n");
rmSync(dir, { recursive: true, force: true });
console.log(`Rendered ${cards.length} share images to public/og/`);
