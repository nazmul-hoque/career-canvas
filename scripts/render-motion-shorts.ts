/**
 * Renders Shorts 11–20: motion-graphics versions of the ten lessons in the
 * screen-recorded Shorts, narrated by ElevenLabs.
 *
 *   bun run shorts:motion            # all ten
 *   bun run shorts:motion 11 15      # just these
 *   bun run shorts:motion --draft    # macOS `say` instead of ElevenLabs: free, for checking timing
 *
 * Writes shorts/<n>-<slug>.mp4. Needs Chrome and ffmpeg, and for the real
 * voice ELEVENLABS_API_KEY in .env.local (never .env, which is committed).
 * ELEVENLABS_VOICE_ID picks the voice; the default is "George".
 *
 * Narration drives timing: each beat lasts as long as its line, plus a little
 * air, and never less than its animations need. Generated audio is cached in
 * shorts/.voice-cache by voice and text, so re-rendering after a visual change
 * doesn't pay for the same line twice.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Kit, STAGE_CSS, type Short } from "./motion-shorts/kit";
import { SHORTS } from "./motion-shorts/scenes";
import { ROOT, duration, requireVoice, voice as speak } from "./motion-shorts/voice";

const OUT = join(ROOT, "shorts");
const FPS = 30;
const LEAD = 0.25; // silence before each line
const TAIL = 0.55; // air after it

const args = process.argv.slice(2);
const draft = args.includes("--draft");
const wanted = new Set(args.filter((a) => /^\d+$/.test(a)).map(Number));
const voice = (text: string) => speak(text, draft);

type Timed = { start: number; length: number; audio: string };

async function plan(short: Short): Promise<{ timed: Timed[]; total: number }> {
  const timed: Timed[] = [];
  let t = 0;
  for (const beat of short.beats) {
    const audio = await voice(beat.say);
    // Build once at time 0 just to learn how long the animations run.
    const probe = new Kit(0);
    beat.body(probe);
    const length = Math.max(LEAD + duration(audio) + TAIL, probe.end + 0.6, 2.2);
    timed.push({ start: t, length, audio });
    t += length;
  }
  return { timed, total: t };
}

function page(short: Short, timed: Timed[], total: number): string {
  const fonts = `file://${join(ROOT, "public/fonts")}`;
  const logo = `data:image/svg+xml;base64,${readFileSync(join(ROOT, "public/favicon.svg")).toString("base64")}`;
  // Each beat is shown from its start to its end. `forwards`, not `both`: a
  // backwards fill would show every beat at once before its turn.
  const window = (i: number) => {
    const { start, length } = timed[i]!;
    const last = i === timed.length - 1;
    return `animation:show 0.001s linear ${start}s forwards${last ? "" : `,hide 0.001s linear ${(start + length).toFixed(3)}s forwards`}`;
  };
  const bgs = short.beats
    .map((b, i) => `<div class="bg ${b.theme}" style="${window(i)}"></div>`)
    .join("");
  const beats = short.beats
    .map((b, i) => {
      const k = new Kit(timed[i]!.start);
      const body = b.body(k).replaceAll('src="LOGO"', `src="${logo}"`);
      return `<div class="beat theme-${b.theme}" style="${window(i)}">
        <div class="chipbar"><span class="topic">${b.chip}</span></div>
        <div class="stage">${body}</div>
        <div class="caption" style="animation:${k.anim("rise", 0.05, 0.45)}">${b.caption}</div>
      </div>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${STAGE_CSS(fonts)}</style></head>
<body style="--total:${total}s">
<div class="layer">${bgs}</div>
<div class="layer"><div class="blob teal"></div><div class="blob red"></div></div>
<div class="layer">${beats}</div>
<div class="track"><div class="fill"></div></div>
<script>
window.__seek = async (ms) => {
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
};
</script></body></html>`;
}

// --- Chrome over CDP -------------------------------------------------------

type Msg = { id?: number; result?: Record<string, unknown>; error?: { message: string } };

async function chrome(work: string) {
  const port = 9600 + Math.floor(Math.random() * 300);
  const bin =
    process.env["CHROME_PATH"] ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const proc = Bun.spawn(
    [
      bin,
      "--headless=new",
      `--user-data-dir=${join(work, "profile")}`,
      `--remote-debugging-port=${port}`,
      "--allow-file-access-from-files",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdout: "ignore", stderr: "ignore" },
  );
  let target = "";
  for (let i = 0; i < 60 && !target; i++) {
    target = await fetch(`http://127.0.0.1:${port}/json/list`)
      .then((r) => r.json() as Promise<{ type: string; webSocketDebuggerUrl: string }[]>)
      .then((list) => list.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? "")
      .catch(() => "");
    if (!target) await Bun.sleep(200);
  }
  if (!target) throw new Error("Chrome didn't start");
  const ws = new WebSocket(target);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let id = 0;
  const pending = new Map<number, (m: Msg) => void>();
  ws.onmessage = (e) => {
    const m = JSON.parse(String(e.data)) as Msg;
    if (m.id !== undefined) pending.get(m.id)?.(m);
  };
  const send = (method: string, params: object = {}) =>
    new Promise<Record<string, unknown>>((resolve, reject) => {
      const n = ++id;
      pending.set(n, (m) =>
        m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result ?? {}),
      );
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  return { send, close: () => (ws.close(), proc.kill()) };
}

async function render(short: Short, work: string, cdp: Awaited<ReturnType<typeof chrome>>) {
  const { timed, total } = await plan(short);
  const dir = join(work, `s${short.n}`);
  mkdirSync(dir, { recursive: true });
  const html = join(dir, "stage.html");
  writeFileSync(html, page(short, timed, total));

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1080,
    height: 1920,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send("Page.navigate", { url: `file://${html}` });
  await Bun.sleep(300);
  await cdp.send("Runtime.evaluate", {
    expression: "document.fonts.ready.then(() => true)",
    awaitPromise: true,
  });
  await Bun.sleep(200);

  const frames = Math.ceil(total * FPS);
  for (let f = 0; f < frames; f++) {
    await cdp.send("Runtime.evaluate", {
      expression: `window.__seek(${((f / FPS) * 1000).toFixed(2)})`,
      awaitPromise: true,
    });
    const shot = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 90 });
    writeFileSync(
      join(dir, `${String(f).padStart(5, "0")}.jpg`),
      Buffer.from(String(shot["data"]), "base64"),
    );
    if (f % 150 === 0) process.stdout.write(".");
  }

  // Each line placed at its beat's start, all mixed onto one track.
  const inputs = timed.flatMap((b) => ["-i", b.audio]);
  const delays = timed
    .map((b, i) => `[${i + 1}:a]adelay=${Math.round((b.start + LEAD) * 1000)}:all=1[a${i}]`)
    .join(";");
  const mix = `${delays};${timed.map((_, i) => `[a${i}]`).join("")}amix=inputs=${timed.length}:normalize=0,apad,atrim=0:${total.toFixed(3)},loudnorm=I=-14:TP=-1.5:LRA=11[aout]`;
  const out = join(OUT, `${short.n}-${short.slug}.mp4`);
  const ff = Bun.spawnSync([
    "ffmpeg",
    "-y",
    "-loglevel",
    "error",
    "-framerate",
    String(FPS),
    "-i",
    join(dir, "%05d.jpg"),
    ...inputs,
    "-filter_complex",
    mix,
    "-map",
    "0:v",
    "-map",
    "[aout]",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "44100",
    "-movflags",
    "+faststart",
    "-shortest",
    out,
  ]);
  if (ff.exitCode !== 0) throw new Error(`ffmpeg: ${ff.stderr.toString()}`);
  rmSync(dir, { recursive: true, force: true });
  return { out, total };
}

async function main() {
  const shorts = SHORTS.filter((s) => wanted.size === 0 || wanted.has(s.n));
  if (shorts.length === 0) throw new Error(`No Short numbered ${[...wanted].join(", ")}`);
  requireVoice(draft);
  mkdirSync(OUT, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), "ascent-motion-"));
  const cdp = await chrome(work);
  let failed = 0;
  try {
    for (const short of shorts) {
      process.stdout.write(`Short ${short.n} (${short.slug}) `);
      try {
        const { out, total } = await render(short, work, cdp);
        console.log(
          ` ✓ ${out.replace(ROOT, "")} · ${total.toFixed(1)}s${draft ? " · DRAFT VOICE" : ""}`,
        );
      } catch (error) {
        failed++;
        console.log(` ✗ ${error instanceof Error ? error.message : error}`);
      }
    }
  } finally {
    cdp.close();
    rmSync(work, { recursive: true, force: true });
  }
  if (failed) process.exitCode = 1;
}

await main();
