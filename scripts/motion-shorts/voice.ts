/**
 * Narration for both kinds of Shorts: one line of text → one cached audio file.
 *
 * The real voice is ElevenLabs, keyed by ELEVENLABS_API_KEY in .env.local
 * (never .env, which is committed); ELEVENLABS_VOICE_ID picks the voice and
 * defaults to "George". `draft` uses macOS `say` instead: free, for checking
 * timing. Audio is cached in shorts/.voice-cache by engine and text, so a
 * re-render never pays for the same line twice.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const ROOT = new URL("../..", import.meta.url).pathname;
const CACHE = join(ROOT, "shorts", ".voice-cache");

export function envLocal(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  return (
    line
      ?.slice(name.length + 1)
      .trim()
      .replace(/^["']|["']$/g, "") || undefined
  );
}

const API_KEY = envLocal("ELEVENLABS_API_KEY");
const VOICE = envLocal("ELEVENLABS_VOICE_ID") ?? "JBFqnCBsd6RMkjVDRZzb";
const MODEL = "eleven_multilingual_v2";

/** Throws before any work starts, rather than one line into a render. */
export function requireVoice(draft: boolean) {
  if (!draft && !API_KEY)
    throw new Error("No ELEVENLABS_API_KEY in .env.local. Add it, or render with --draft.");
}

export function duration(file: string): number {
  const p = Bun.spawnSync([
    "ffprobe",
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    file,
  ]);
  const d = Number(p.stdout.toString().trim());
  if (!Number.isFinite(d) || d <= 0) throw new Error(`Can't read the length of ${file}`);
  return d;
}

/** One narrated line as an audio file, generated once and cached. */
export async function voice(text: string, draft: boolean): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const engine = draft ? "say" : `el-${VOICE}-${MODEL}`;
  const key = createHash("sha256").update(`${engine}\n${text}`).digest("hex").slice(0, 20);
  const file = join(CACHE, `${key}.${draft ? "m4a" : "mp3"}`);
  if (existsSync(file)) return file;

  if (draft) {
    const aiff = join(CACHE, `${key}.aiff`);
    const say = Bun.spawnSync(["say", "-v", "Samantha", "-r", "185", "-o", aiff, text]);
    if (say.exitCode !== 0) throw new Error(`say failed: ${say.stderr.toString()}`);
    Bun.spawnSync(["ffmpeg", "-y", "-loglevel", "error", "-i", aiff, file]);
    rmSync(aiff, { force: true });
    return file;
  }

  requireVoice(draft);
  const request = () =>
    fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.25,
          use_speaker_boost: true,
        },
      }),
    });
  // A dropped connection is worth one retry; a refusal (quota, key) is not.
  const res = await request().catch(() => request());
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}
