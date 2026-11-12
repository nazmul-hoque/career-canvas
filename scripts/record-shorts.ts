/**
 * Records the YouTube Shorts screen captures: a lesson at phone size
 * (1080×1920), code typed into the editor, Run pressed, answers picked.
 *
 *   bun run shorts:record               # all scenes, against the live site
 *   bun run shorts:record 1 8           # only scenes 1 and 8
 *   bun run shorts:record --base http://localhost:8080
 *   bun run shorts:record --draft       # macOS `say` instead of ElevenLabs, to check timing
 *
 * Writes shorts/<n>-<slug>.mp4 (gitignored), narrated, captioned and ending on
 * the Ascent card. Needs Chrome and ffmpeg, and ELEVENLABS_API_KEY in
 * .env.local for the real voice (see motion-shorts/voice.ts).
 *
 * Narration drives the pace: a `say` step shows its caption and holds the
 * page until the line is spoken, or, with `wait: false`, lets the next steps
 * (typing, a git command) play under it. Every line is generated before Chrome
 * starts, so its length is known and nothing waits on the network on camera.
 *
 * It drives the page as a signed-out visitor, the way a viewer arriving from
 * the video would see it. The code typed for a SQL fix is the lesson's own
 * solution, read from the bodies, so a video can't drift from the lesson.
 *
 * Chrome's screencast only sends a frame when the screen changes, so each frame
 * is held until the next one arrives. Waits we don't want on camera (Pyodide
 * booting on the first SQL or Python run, a page settling) are cut, leaving a
 * short beat so the cut doesn't jump.
 */
import { linkSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getLessonBody } from "../src/content/lesson-bodies.server";
import { duration, requireVoice, voice } from "./motion-shorts/voice";

type Step =
  | { do: "focus"; on: "editor" | "output" | "terminal" | { question: string } }
  | { do: "hold"; ms: number }
  | { do: "type"; text: string; cps?: number }
  | { do: "replace"; text: string; cps?: number }
  | { do: "run" }
  | { do: "git"; command: string }
  | { do: "answer"; question: string; option: string }
  | { do: "say"; text: string; caption: string; wait?: boolean }
  | { do: "end" };

type Scene = { n: number; slug: string; course: string; lesson: string; steps: Step[] };

const solution = (course: string, lesson: string): string => {
  const challenge = getLessonBody(course, lesson)?.blocks.find((b) => b.kind === "challenge");
  if (!challenge || challenge.kind !== "challenge") throw new Error(`${lesson} has no challenge`);
  return challenge.solution;
};

const CART_FIX = `function cartTotal(items) {
  return items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
}

const items = [
  { price: 9.99, quantity: 2 },
  { price: 24.5, quantity: 1 },
];

console.log(cartTotal(items));`;

const say = (text: string, caption: string, wait = true): Step => ({
  do: "say",
  text,
  caption,
  wait,
});
const END_LINE = "Try this lesson free, at ascent dot withcloud dot io.";

// One scene per script in the Shorts batch, numbered to match it.
const SCENES: Scene[] = [
  {
    n: 1,
    slug: "cart-undefined",
    course: "javascript",
    lesson: "js-debug.fixit",
    steps: [
      { do: "focus", on: "editor" },
      say("This cart total should add up two items. Let's run it.", "Spot the bug"),
      { do: "run" },
      { do: "focus", on: "output" },
      say("Undefined. Pause, and find the bug.", "undefined?! Pause and find it"),
      { do: "focus", on: "editor" },
      say(
        "Curly braces after the arrow make a function body, and a body returns nothing unless you say return.",
        "Braces mean no automatic return",
      ),
      say("Drop the braces, and the sum comes back.", "Drop the braces", false),
      { do: "replace", text: CART_FIX, cps: 45 },
      { do: "run" },
      { do: "focus", on: "output" },
      say(
        "Forty-four forty-eight. Well, almost. Look at all those zeros. That's for part two.",
        "44.48… almost",
      ),
      { do: "end" },
    ],
  },
  ...(
    [
      [
        2,
        "happy-customers",
        "sql",
        "sql-core.subqueries",
        [
          say(
            "We want to thank every customer who never had a refund. Here's the query.",
            "Customers with no refunds",
          ),
          say(
            "Maja had a refund, and she's on the list three times. Pause. What's wrong?",
            "Maja: refunded, and listed 3 times",
          ),
          say(
            "WHERE checks one order at a time. A paid order is never also refunded, so that second check does nothing.",
            "WHERE sees one row at a time",
          ),
          say(
            "Ask about the customer instead: has a paid order, and no refunded one.",
            "Ask about the customer",
            false,
          ),
          say(
            "Five names, no repeats. If you've written the first query, you've shipped this bug.",
            "5 names, no repeats",
          ),
        ],
      ],
      [
        3,
        "seven-orders",
        "sql-analysis",
        "sql-analysis.ctes",
        [
          say(
            "This report counts each customer's orders, and what they spent.",
            "Orders per customer",
          ),
          say(
            "It says Maja placed seven orders. She placed three. Where do the extra four come from?",
            "Maja: 7 orders? She placed 3",
          ),
          say(
            "Joining items gives one row per item, not per order. An order with two items is counted twice, and its shipping charged twice.",
            "One row per item, not per order",
          ),
          say("Total the items per order first, then join.", "Total first, then join", false),
          say(
            "Three orders, five hundred and fifty-seven. Join first, count later, and the numbers are wrong.",
            "Maja: 3 orders, 557",
          ),
        ],
      ],
    ] as const
  ).map(([n, slug, course, lesson, [intro, wrong, why, fix, done]]) => ({
    n,
    slug,
    course,
    lesson,
    steps: [
      { do: "focus", on: "editor" },
      intro,
      { do: "run" },
      { do: "focus", on: "output" },
      wrong,
      { do: "focus", on: "editor" },
      why,
      fix,
      { do: "replace", text: solution(course, lesson), cps: 60 },
      { do: "run" },
      { do: "focus", on: "output" },
      done,
      { do: "end" },
    ] satisfies Step[],
  })),
  ...(
    [
      [
        4,
        "python-basket",
        "python",
        "py-functions.define",
        "basket=[]",
        "['stove']",
        [
          say(
            "Two calls, two different items. What does the second one return? Pause and guess.",
            "What does the 2nd call return?",
          ),
          say("Most people say just stove. Here's why that's wrong.", "Not quite"),
          say(
            "Tent and stove. The default list is made once, when Python reads the def, and every call shares it.",
            "Tent AND stove",
          ),
          say("Default to None, and make a fresh list inside.", "Fix: default to None"),
        ],
      ],
      [
        5,
        "js-sort",
        "javascript",
        "js-data.arrays",
        "[10, 9, 1].sort()",
        "[1, 9, 10]",
        [
          say(
            "Ten, nine, one, sorted. What does JavaScript give you? Comment before the reveal.",
            "[10, 9, 1].sort() = ?",
          ),
          say(
            "Most people pick one, nine, ten. Here's what Ascent tells you when you do.",
            "Not quite",
          ),
          say(
            "Without a comparison function, sort compares text. Ten starts with a one, so it comes before nine.",
            "Sorted as text",
          ),
          say("Pass a minus b, and you get numbers in order.", "Fix: sort((a, b) => a - b)"),
        ],
      ],
      [
        6,
        "fetch-404",
        "javascript",
        "js-async.fetch",
        "404 Not Found",
        "The promise rejects",
        [
          say("The server says 404. Does your catch block run? Pick one.", "404. Does catch run?"),
          say(
            "If you said catch, so did most of us. That's why these errors go unnoticed.",
            "Not quite",
          ),
          say(
            "fetch only rejects when nothing comes back. A 404 is an answer.",
            "A 404 is still a response",
          ),
          say("So check response dot ok yourself. Every time.", "Check response.ok yourself"),
        ],
      ],
      [
        7,
        "count-else",
        "sql-analysis",
        "sql-analysis.conditional",
        "ELSE 0 END",
        "11",
        [
          say(
            "Fifteen orders, eleven paid. What does this count? Pause.",
            "15 orders. 11 paid. COUNT = ?",
          ),
          say("Eleven feels right. It isn't.", "Not 11"),
          say(
            "COUNT doesn't care if the value is one or zero, only that it isn't NULL. ELSE zero hands it fifteen values.",
            "COUNT counts anything not NULL",
          ),
          say("Drop the ELSE, or use SUM, and you get eleven.", "Drop the ELSE, or use SUM"),
        ],
      ],
    ] as const
  ).map(([n, slug, course, lesson, question, wrong, [ask, miss, reveal, fix]]) => ({
    n,
    slug,
    course,
    lesson,
    steps: [
      { do: "focus", on: { question } },
      ask,
      { do: "answer", question, option: wrong },
      miss,
      { do: "answer", question, option: rightOption(course, lesson, question) },
      reveal,
      fix,
      { do: "end" },
    ] satisfies Step[],
  })),
  {
    n: 8,
    slug: "git-wrong-branch",
    course: "git",
    lesson: "git-rescue.wrong-branch",
    steps: [
      { do: "focus", on: "terminal" },
      say(
        "You just committed to main. It should have been on a feature branch.",
        "Committed to main by mistake",
        false,
      ),
      { do: "git", command: "git log --oneline" },
      say("Good news: it isn't pushed yet. Three commands.", "Not pushed = fixable", false),
      { do: "git", command: "git status" },
      say("One: make the branch right here. It gets your commit.", "1. Branch here", false),
      { do: "git", command: "git switch -c feature/discount" },
      say("Two: go back to main.", "2. Back to main", false),
      { do: "git", command: "git switch main" },
      say("Three: put main back where GitHub has it.", "3. Reset main", false),
      { do: "git", command: "git reset --hard origin/main" },
      say("Your commit is on the branch, and main is clean. Nothing lost.", "Nothing lost", false),
      { do: "git", command: "git log --oneline --all" },
      { do: "hold", ms: 1500 },
      { do: "end" },
    ],
  },
  {
    n: 9,
    slug: "git-reflog",
    course: "git",
    lesson: "git-rescue.reflog",
    steps: [
      { do: "focus", on: "terminal" },
      say(
        "I reset away a commit, then deleted a branch. Both gone, right?",
        "Reset. Deleted. Gone?",
        false,
      ),
      { do: "git", command: "git log --oneline" },
      say(
        "Git keeps a diary. The reflog lists everywhere HEAD has been.",
        "Git keeps a diary",
        false,
      ),
      { do: "git", command: "git reflog" },
      say(
        "There's the wishlist commit, and the coupon commit from before the reset.",
        "Both commits are still here",
      ),
      say("Put the branch back on its commit.", "1. Put the branch back", false),
      { do: "git", command: "git branch feature/wishlist HEAD@{1}" },
      say("Then move main back to before the reset.", "2. Move main back", false),
      { do: "git", command: "git reset --hard HEAD@{4}" },
      say("Both back. Learn it before you need it.", "Both back", false),
      { do: "git", command: "git log --oneline --all" },
      { do: "hold", ms: 1500 },
      { do: "end" },
    ],
  },
  {
    n: 10,
    slug: "payments-reconcile",
    course: "sql-analysis",
    lesson: "sql-quality.checks",
    steps: [
      { do: "focus", on: "editor" },
      say(
        "Our card provider's export doesn't match our orders. First, look at the status column.",
        "The bank and our orders disagree",
        false,
      ),
      {
        do: "replace",
        text: "SELECT '[' || status || ']' AS status, COUNT(*) AS n\nFROM payments\nGROUP BY status;",
        cps: 30,
      },
      { do: "run" },
      { do: "focus", on: "output" },
      say(
        "Succeeded, written three ways: with a capital S, and with a trailing space. An exact match misses them.",
        '"succeeded", spelled 3 ways',
      ),
      { do: "focus", on: "editor" },
      say(
        "And joining items and payments together doubles the money. So total each side on its own, clean the status, and keep orders with no payment at all.",
        "Total each side. Clean the status.",
        false,
      ),
      { do: "replace", text: solution("sql-analysis", "sql-quality.checks"), cps: 70 },
      { do: "run" },
      { do: "focus", on: "output" },
      say(
        "Four real problems: one customer charged twice, one seventeen dollars short, and two never charged at all.",
        "4 real problems",
      ),
      { do: "end" },
    ],
  },
];

/** The right option's text, so a scene can't reveal anything the lesson doesn't. */
function rightOption(course: string, lesson: string, question: string): string {
  const block = getLessonBody(course, lesson)?.blocks.find(
    (b) => b.kind === "mcq" && b.question.includes(question),
  );
  if (!block || block.kind !== "mcq") throw new Error(`${lesson}: no question with "${question}"`);
  const option = block.options[block.answer];
  if (option === undefined) throw new Error(`${lesson}: answer index out of range`);
  return (typeof option === "string" ? option : option.text).replace(/`/g, "");
}

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const draft = args.includes("--draft");
const baseFlag = args.indexOf("--base");
const BASE = baseFlag >= 0 ? args[baseFlag + 1]! : "https://ascent.withcloud.io";
const wanted = new Set(
  args.filter((a, i) => /^\d+$/.test(a) && args[i - 1] !== "--base").map(Number),
);
const OUT = new URL("../shorts/", import.meta.url).pathname;

const CHROME =
  process.env["CHROME_PATH"] ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The few fields of CDP's replies and events this script reads. */
type CdpResult = {
  targetId?: string;
  sessionId?: string;
  exceptionDetails?: { exception?: { description?: string } };
  result?: { value?: unknown };
};
type CdpMessage = {
  id?: number;
  method?: string;
  sessionId?: string;
  error?: { message: string };
  result?: CdpResult;
  params?: { data?: string; sessionId?: number };
};

class Cdp {
  private id = 0;
  private pending = new Map<number, (msg: CdpMessage) => void>();
  private listeners: ((msg: CdpMessage) => void)[] = [];
  sessionId: string | undefined;
  private constructor(private ws: WebSocket) {
    ws.onmessage = (e) => {
      const msg = JSON.parse(String(e.data)) as CdpMessage;
      if (msg.id !== undefined) this.pending.get(msg.id)?.(msg);
      else for (const l of this.listeners) l(msg);
    };
  }
  static async connect(url: string) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    return new Cdp(ws);
  }
  /** `session: null` addresses the browser itself rather than the current page. */
  send(
    method: string,
    params: object = {},
    session: string | null = this.sessionId ?? null,
  ): Promise<CdpResult> {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, sessionId: session ?? undefined }));
    return new Promise((resolve, reject) =>
      this.pending.set(id, (msg) =>
        msg.error
          ? reject(new Error(`${method}: ${msg.error.message}`))
          : resolve(msg.result ?? {}),
      ),
    );
  }
  on(listener: (msg: CdpMessage) => void) {
    this.listeners.push(listener);
  }
  close() {
    this.ws.close();
  }
}

async function evaluate<T>(cdp: Cdp, fn: string): Promise<T> {
  const r = await cdp.send("Runtime.evaluate", {
    expression: `(async () => { ${fn} })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? fn);
  return r.result?.value as T;
}

async function waitFor(cdp: Cdp, condition: string, what: string, timeout = 60_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const met = await evaluate<boolean>(cdp, `return Boolean(${condition});`).catch(() => false);
    if (met) return;
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${what}`);
}

// Page-side helpers, installed once per scene.
const HELPERS = `
window.__q = {
  editor: () => document.querySelector('textarea[aria-label="Code editor"]'),
  terminal: () => document.querySelector('input[aria-label="Command"]'),
  output: () => {
    const ed = window.__q.editor();
    let el = ed;
    while (el && !el.querySelector('[role="status"][aria-live="polite"]')) el = el.parentElement;
    return el?.querySelector('[role="status"][aria-live="polite"]') ?? null;
  },
  question: (text) => [...document.querySelectorAll('p.eyebrow')]
    .filter((p) => p.textContent === 'Check yourself')
    .map((p) => p.parentElement)
    .find((card) => card.textContent.replace(/\`/g, '').includes(text)) ?? null,
  runButton: () => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Run'),
  center: (el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' }),
};
// The caption and end card belong to the video, not the app, so they're
// styled here rather than with the app's tokens.
window.__caption = (text) => {
  let el = document.getElementById('__caption');
  if (!el) {
    el = document.createElement('div');
    el.id = '__caption';
    document.body.append(el);
  }
  el.textContent = text;
  el.animate([{ opacity: 0, transform: 'translate(-50%, 8px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 220, easing: 'ease-out' });
};
window.__end = () => {
  document.getElementById('__caption')?.remove();
  const el = document.createElement('div');
  el.id = '__end';
  el.innerHTML = '<img src="/favicon.svg" alt=""><b>Ascent</b><span>Try this lesson free</span><i>ascent.withcloud.io</i><small></small>';
  el.querySelector('small').textContent = document.querySelector('h1')?.textContent ?? '';
  document.body.append(el);
};
// The floating Mentor button sits over the Run and Submit buttons on a phone.
addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = \`
    button.fixed.bottom-24 { display: none !important; }
    #__caption { position: fixed; left: 50%; bottom: 92px; transform: translateX(-50%); z-index: 9999;
      max-width: 88%; width: max-content; padding: 10px 18px; border-radius: 14px; text-align: center;
      background: rgba(13, 17, 19, 0.9); color: #fff; font: 700 21px/1.25 system-ui, sans-serif;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); }
    #__end { position: fixed; inset: 0; z-index: 10000; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 10px; background: #0d1113; color: #fff;
      font-family: system-ui, sans-serif; animation: __in 0.45s ease-out; }
    #__end img { width: 96px; height: 96px; border-radius: 22px; margin-bottom: 6px; }
    #__end b { font-size: 40px; letter-spacing: -0.02em; }
    #__end span { font-size: 18px; color: #b8c2c0; }
    #__end i { font-style: normal; font-weight: 700; font-size: 20px; color: #0d1113;
      background: #34c48b; padding: 10px 22px; border-radius: 999px; margin-top: 6px; }
    #__end small { font-size: 13px; color: #7f8b89; margin-top: 4px; max-width: 80%; text-align: center; }
    @keyframes __in { from { opacity: 0; transform: scale(0.96); } }
  \`;
  document.head.append(style);
});
`;

const FPS = 30;
const LEAD = 0.2; // silence before a line
const GAP = 0.45; // air after it, before the next thing happens

type Voiced = Map<string, { audio: string; length: number }>;

/** What a scene's narration has done so far, on the wall clock. */
type Narration = { voiced: Voiced; lines: { t: number; audio: string }[]; until: number };

const now = () => Date.now() / 1000;
const quiet = (n: Narration) => sleep(Math.max(0, n.until - now()) * 1000);

async function runStep(
  cdp: Cdp,
  step: Step,
  cut: (fn: () => Promise<void>) => Promise<void>,
  narration: Narration,
) {
  switch (step.do) {
    case "say": {
      // One line at a time: the next waits for the last to finish.
      await quiet(narration);
      const line = narration.voiced.get(step.text)!;
      if (step.caption) await evaluate(cdp, `window.__caption(${JSON.stringify(step.caption)});`);
      narration.lines.push({ t: now() + LEAD, audio: line.audio });
      narration.until = now() + LEAD + line.length + GAP;
      return step.wait === false ? undefined : quiet(narration);
    }
    case "end": {
      await quiet(narration);
      await evaluate(cdp, `window.__end();`);
      await sleep(400);
      return runStep(cdp, { do: "say", text: END_LINE, caption: "" }, cut, narration);
    }
    case "hold":
      return sleep(step.ms);
    case "focus": {
      const target =
        typeof step.on === "string"
          ? `window.__q.${step.on}()`
          : `window.__q.question(${JSON.stringify(step.on.question)})`;
      // A question card is pinned to the top, under the header, so the note
      // that appears below it on Check stays clear of the bottom nav.
      const place =
        typeof step.on === "string"
          ? "window.__q.center(el);"
          : "el.style.scrollMarginTop = '64px'; el.scrollIntoView({ block: 'start', behavior: 'smooth' });";
      await evaluate(cdp, `const el = ${target}; if (!el) throw new Error("not found"); ${place}`);
      return sleep(900);
    }
    case "replace":
      // Select all, then a real Backspace, so React sees the clear as an edit.
      await evaluate(cdp, `const ed = window.__q.editor(); ed.focus(); ed.select();`);
      await sleep(500);
      await cdp.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Backspace",
        code: "Backspace",
        windowsVirtualKeyCode: 8,
      });
      await cdp.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "Backspace",
        code: "Backspace",
        windowsVirtualKeyCode: 8,
      });
      await sleep(400);
      return typeText(cdp, step.text, step.cps ?? 35);
    case "type":
      await evaluate(cdp, `window.__q.editor().focus();`);
      return typeText(cdp, step.text, step.cps ?? 35);
    case "run": {
      await evaluate(cdp, `window.__q.runButton().click();`);
      await sleep(500);
      // The first SQL/Python run boots Pyodide: seconds nobody wants to watch.
      const finished = () =>
        waitFor(
          cdp,
          `!window.__q.runButton()?.disabled && !window.__q.output()?.textContent.includes('Run your code to see')`,
          "the run to finish",
          90_000,
        );
      // A cold engine download can outlast the page's load timeout. That's the
      // network, not the lesson, so run again off camera rather than film it.
      await cut(async () => {
        await finished();
        for (let i = 0; i < 2; i++) {
          const failed = await evaluate<boolean>(
            cdp,
            `return window.__q.output()?.textContent.includes("couldn't load") ?? false;`,
          );
          if (!failed) return;
          await evaluate(cdp, `window.__q.runButton().click();`);
          await sleep(500);
          await finished();
        }
      });
      return sleep(400);
    }
    case "git": {
      await evaluate(cdp, `const t = window.__q.terminal(); t.focus(); window.__q.center(t);`);
      await typeText(cdp, step.command, 22);
      await sleep(300);
      for (const type of ["keyDown", "keyUp"] as const)
        await cdp.send("Input.dispatchKeyEvent", {
          type,
          key: "Enter",
          code: "Enter",
          windowsVirtualKeyCode: 13,
          ...(type === "keyDown" ? { text: "\r" } : {}),
        });
      await sleep(600);
      await evaluate(cdp, `window.__q.center(window.__q.terminal());`);
      return sleep(1800);
    }
    case "answer": {
      const picked = await evaluate<boolean>(
        cdp,
        `const card = window.__q.question(${JSON.stringify(step.question)});
         if (!card) return false;
         const want = ${JSON.stringify(step.option)};
         const btn = [...card.querySelectorAll('button')].find((b) => b.textContent.replace(/\`/g, '').includes(want));
         if (!btn) return false;
         btn.click();
         return true;`,
      );
      if (!picked) throw new Error(`No option "${step.option}" under "${step.question}"`);
      await sleep(1200);
      await evaluate(
        cdp,
        `const card = window.__q.question(${JSON.stringify(step.question)});
         [...card.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Check answer')?.click();`,
      );
      await cut(() => sleep(1500));
      await evaluate(
        cdp,
        `const card = window.__q.question(${JSON.stringify(step.question)}); card.style.scrollMarginTop = '64px'; card.scrollIntoView({ block: 'start', behavior: 'smooth' });`,
      );
      return sleep(700);
    }
  }
}

async function typeText(cdp: Cdp, text: string, cps: number) {
  // insertText, not key events: Enter in the editor auto-indents, which would
  // double the indentation already in the text.
  for (const ch of text) {
    await cdp.send("Input.insertText", { text: ch });
    await sleep((1000 / cps) * (0.6 + Math.random() * 0.8));
  }
}

async function record(cdp: Cdp, scene: Scene, work: string, voiced: Voiced): Promise<string> {
  const target = await cdp.send("Target.createTarget", { url: "about:blank" }, null);
  const { sessionId } = await cdp.send(
    "Target.attachToTarget",
    { targetId: target.targetId, flatten: true },
    null,
  );
  cdp.sessionId = sessionId;
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    // 480 CSS px at 2.25× is 1080 wide: still the phone layout, but wide enough
    // that a line of the fixes isn't cut off at the editor's edge.
    width: 480,
    height: 854,
    deviceScaleFactor: 2.25,
    mobile: true,
  });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: "light" }],
  });

  const url = `${BASE}/learn/${scene.course}/${scene.lesson}`;
  // Installed before navigating: evaluated after, it can land on about:blank
  // while the navigation is still committing, and vanish with it.
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: HELPERS });
  await cdp.send("Page.navigate", { url });
  await waitFor(
    cdp,
    `location.href.startsWith(${JSON.stringify(BASE)}) && document.readyState === 'complete'`,
    "the page to load",
  );
  const editorish =
    scene.steps[0]?.do === "focus" && typeof scene.steps[0].on !== "string"
      ? `window.__q.question(${JSON.stringify(scene.steps[0].on.question)})`
      : `window.__q.editor() || window.__q.terminal()`;
  await waitFor(cdp, editorish, "the lesson to become interactive", 30_000).catch(async () => {
    const text = await evaluate<string>(cdp, `return document.body.innerText.slice(0, 300);`);
    throw new Error(`${url} isn't interactive for a guest. Page says:\n${text}`);
  });
  await sleep(1500);

  const narration: Narration = { voiced, lines: [], until: 0 };
  // The opening scroll happens off camera, so the video starts on the lesson.
  const [opening, ...steps] = scene.steps;
  if (opening?.do === "focus") await runStep(cdp, opening, async (fn) => fn(), narration);
  else if (opening) steps.unshift(opening);

  const frames: { t: number; data: string }[] = [];
  const cuts: [number, number][] = [];
  cdp.on((msg) => {
    if (msg.method !== "Page.screencastFrame" || msg.sessionId !== sessionId) return;
    frames.push({ t: Date.now() / 1000, data: msg.params?.data ?? "" });
    void cdp.send("Page.screencastFrameAck", { sessionId: msg.params?.sessionId });
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 92,
    maxWidth: 1080,
    maxHeight: 1920,
  });
  await sleep(800);

  const cut = async (fn: () => Promise<void>) => {
    // Keep a beat of the wait, and never cut into a line still being spoken.
    const start = Math.max(now() + 0.6, narration.until);
    await fn();
    const end = now();
    if (end > start) cuts.push([start, end]);
  };
  for (const step of steps) await runStep(cdp, step, cut, narration);
  await quiet(narration);
  await sleep(300);
  await cdp.send("Page.stopScreencast");
  const stoppedAt = Date.now() / 1000;
  await cdp.send("Target.closeTarget", { targetId: target.targetId }, null);

  return assemble(scene, frames, cuts, stoppedAt, work, narration.lines);
}

/**
 * Frames + cut intervals + narration → an mp4. Each output frame, 30 a second,
 * shows the latest capture at or before its moment, so the picture keeps the
 * wall clock's pace and the narration, placed on the same clock, stays in sync.
 */
function assemble(
  scene: Scene,
  frames: { t: number; data: string }[],
  cuts: [number, number][],
  stoppedAt: number,
  work: string,
  narration: Narration["lines"],
): string {
  if (frames.length === 0) throw new Error(`Scene ${scene.n}: no frames captured`);
  const removedBefore = (t: number) =>
    cuts.reduce((sum, [a, b]) => sum + (t >= b ? b - a : t > a ? t - a : 0), 0);
  const inCut = (t: number) => cuts.some(([a, b]) => t > a && t < b);
  const kept = frames.filter((f) => !inCut(f.t));
  // Wall-clock time → time in the cut video.
  const first = kept[0]!.t - removedBefore(kept[0]!.t);
  const at = (t: number) => Math.max(0, t - removedBefore(t) - first);
  const total = at(stoppedAt);

  const dir = join(work, `scene-${scene.n}`);
  mkdirSync(dir, { recursive: true });
  const captures = kept.map((f, i) => {
    const file = join(dir, `c${i}.jpg`);
    writeFileSync(file, Buffer.from(f.data, "base64"));
    return { at: at(f.t), file };
  });
  // Hard links, not copies: a held frame costs nothing however long it's held.
  let c = 0;
  const count = Math.ceil(total * FPS);
  for (let i = 0; i < count; i++) {
    while (captures[c + 1] && captures[c + 1]!.at <= i / FPS) c++;
    linkSync(captures[c]!.file, join(dir, `${String(i).padStart(5, "0")}.jpg`));
  }

  const inputs = narration.flatMap((l) => ["-i", l.audio]);
  const delays = narration
    .map((l, i) => `[${i + 1}:a]adelay=${Math.round(at(l.t) * 1000)}:all=1[a${i}]`)
    .join(";");
  const mix = `${delays};${narration.map((_, i) => `[a${i}]`).join("")}amix=inputs=${narration.length}:normalize=0,apad,atrim=0:${total.toFixed(3)},loudnorm=I=-14:TP=-1.5:LRA=11[aout]`;

  const out = join(OUT, `${String(scene.n).padStart(2, "0")}-${scene.slug}.mp4`);
  const ffmpeg = Bun.spawnSync([
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
    `[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=white,format=yuv420p[vout];${mix}`,
    "-map",
    "[vout]",
    "-map",
    "[aout]",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "44100",
    "-movflags",
    "+faststart",
    out,
  ]);
  if (ffmpeg.exitCode !== 0) throw new Error(`ffmpeg failed: ${ffmpeg.stderr.toString()}`);
  return out;
}

async function main() {
  const scenes = SCENES.filter((s) => wanted.size === 0 || wanted.has(s.n));
  if (scenes.length === 0) throw new Error(`No scene numbered ${[...wanted].join(", ")}`);
  requireVoice(draft);
  mkdirSync(OUT, { recursive: true });

  const voiced: Voiced = new Map();
  const texts = new Set([
    END_LINE,
    ...scenes.flatMap((s) => s.steps.flatMap((st) => (st.do === "say" ? [st.text] : []))),
  ]);
  process.stdout.write(`Narration (${texts.size} lines)… `);
  for (const text of texts) {
    const audio = await voice(text, draft);
    voiced.set(text, { audio, length: duration(audio) });
  }
  console.log("✓");

  const work = mkdtempSync(join(tmpdir(), "ascent-shorts-"));
  const port = 9300 + Math.floor(Math.random() * 500);
  // Its own profile: with the user's Chrome open, a shared profile makes the launch hang.
  const chrome = Bun.spawn(
    [
      CHROME,
      "--headless=new",
      `--user-data-dir=${join(work, "profile")}`,
      `--remote-debugging-port=${port}`,
      "--hide-scrollbars",
      "--mute-audio",
      "about:blank",
    ],
    { stdout: "ignore", stderr: "ignore" },
  );
  try {
    let wsUrl = "";
    for (let i = 0; i < 50 && !wsUrl; i++) {
      wsUrl = await fetch(`http://127.0.0.1:${port}/json/version`)
        .then((r) => r.json() as Promise<{ webSocketDebuggerUrl: string }>)
        .then((v) => v.webSocketDebuggerUrl)
        .catch(() => "");
      if (!wsUrl) await sleep(200);
    }
    if (!wsUrl)
      throw new Error("Chrome didn't start. Set CHROME_PATH if it isn't in /Applications.");
    const cdp = await Cdp.connect(wsUrl);
    let failed = 0;
    for (const scene of scenes) {
      process.stdout.write(`Scene ${scene.n} (${scene.slug})… `);
      try {
        const out = await record(cdp, scene, work, voiced);
        console.log(`✓ ${out.replace(process.cwd() + "/", "")}`);
      } catch (error) {
        failed++;
        console.log(`✗ ${error instanceof Error ? error.message : error}`);
      }
    }
    cdp.close();
    if (failed) process.exitCode = 1;
  } finally {
    chrome.kill();
    rmSync(work, { recursive: true, force: true });
  }
}

await main();
