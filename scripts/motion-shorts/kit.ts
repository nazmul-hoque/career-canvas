/**
 * The building blocks of a motion Short: each returns HTML whose animations
 * are CSS keyframes with absolute delays. The renderer pauses every animation
 * and sets its currentTime frame by frame, so a frame is a pure function of
 * time: nothing depends on how fast Chrome happens to run.
 *
 * Everything is laid out for a 1080×1920 canvas at 1 CSS px per pixel.
 */

export type Theme = "dark" | "light";

export interface Beat {
  /** The small label top left, like the reference's topic chip. */
  chip: string;
  theme: Theme;
  /** The big line at the bottom: short, readable with the sound off. */
  caption: string;
  /** What the narrator says. The beat lasts at least as long as this. */
  say: string;
  /** Builds the beat's content; `k` knows when the beat starts. */
  body: (k: Kit) => string;
}

export interface Short {
  n: number;
  slug: string;
  lesson: { course: string; id: string; title: string };
  beats: Beat[];
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const KEYWORDS =
  "function|return|const|let|await|async|try|catch|throw|new|if|def|None|SELECT|FROM|WHERE|AND|OR|NOT|EXISTS|JOIN|LEFT|ON|AS|GROUP|BY|ORDER|WITH|SUM|COUNT|CASE|WHEN|THEN|ELSE|END|COALESCE|LOWER|TRIM|is";
const TOKEN = new RegExp(
  `(//.*$|--.*$|#.*$)|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')|\\b(\\d+(?:\\.\\d+)?)\\b|\\b(${KEYWORDS})\\b`,
  "g",
);

/** Just enough colour to read code at a glance; not a real highlighter. */
function highlight(line: string): string {
  let out = "";
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    out += esc(line.slice(last, m.index));
    const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "n" : "k";
    out += `<span class="t${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(line.slice(last));
}

export class Kit {
  /** Latest moment, relative to the beat, that any animation here ends. */
  end = 0;
  constructor(readonly T: number) {}

  /** An `animation:` value starting `at` seconds into the beat. */
  anim(name: string, at: number, dur = 0.5, ease = "cubic-bezier(.2,.8,.2,1)", fill = "both") {
    this.end = Math.max(this.end, at + dur);
    return `${name} ${dur}s ${ease} ${(this.T + at).toFixed(3)}s ${fill}`;
  }

  /** Entrance for a block; a negative `at` means "already there". */
  private enter(at: number, kind = "rise") {
    return at < 0 ? "" : `animation:${this.anim(kind, at, 0.55)};`;
  }

  code(
    lines: string[],
    o: {
      at?: number;
      label?: string;
      /** Type the lines in from this moment, at `cps` characters a second. */
      typeAt?: number;
      cps?: number;
      marks?: { line: number; at: number; kind: "bad" | "good" }[];
      size?: number;
    } = {},
  ) {
    const at = o.at ?? 0;
    const cps = o.cps ?? 28;
    let typed = 0;
    const rows = lines.map((line, i) => {
      const marks = (o.marks ?? [])
        .filter((m) => m.line === i)
        .map((m) =>
          this.anim(m.kind === "bad" ? "markBad" : "markGood", m.at, 0.4, "ease", "forwards"),
        );
      let text = `<span class="ln-t">${highlight(line) || " "}</span>`;
      if (o.typeAt !== undefined) {
        const start = o.typeAt + typed / cps + i * 0.12;
        const dur = Math.max(0.05, line.length / cps);
        typed += line.length;
        text = `<span class="ln-t typing" style="--n:${line.length}ch;animation:${this.anim(`type`, start, dur, `steps(${Math.max(1, line.length)})`)}">${highlight(line) || " "}</span>`;
      }
      return `<div class="ln" style="${marks.length ? `animation:${marks.join(",")}` : ""}"><span class="ln-n">${i + 1}</span>${text}</div>`;
    });
    return `<div class="card code" style="${this.enter(at)}${o.size ? `font-size:${o.size}px` : ""}">
      ${o.label ? `<div class="card-h"><span class="dots"><i></i><i></i><i></i></span>${esc(o.label)}</div>` : ""}
      <div class="code-b">${rows.join("")}</div></div>`;
  }

  /** Console output and test results, each row arriving at its own time. */
  output(
    rows: { text: string; kind: "log" | "pass" | "fail" | "big"; at: number }[],
    o: { at?: number; label?: string } = {},
  ) {
    const items = rows
      .map((r) => {
        const icon =
          r.kind === "pass"
            ? `<b class="ic ok">✓</b>`
            : r.kind === "fail"
              ? `<b class="ic no">✕</b>`
              : "";
        return `<div class="out ${r.kind}" style="animation:${this.anim("rise", r.at, 0.4)}">${icon}<span>${esc(r.text)}</span></div>`;
      })
      .join("");
    return `<div class="card output" style="${this.enter(o.at ?? 0)}"><div class="card-h">›_ ${esc(o.label ?? "Output")}</div>${items}</div>`;
  }

  table(
    columns: string[],
    rows: (string | number)[][],
    o: {
      at?: number;
      stagger?: number;
      marks?: { row: number; at: number; kind: "bad" | "good" | "dim" }[];
      label?: string;
    } = {},
  ) {
    const at = o.at ?? 0;
    const head = columns.map((c) => `<th>${esc(c)}</th>`).join("");
    const body = rows
      .map((r, i) => {
        const fx = [
          at < 0 ? "" : this.anim("rise", at + 0.15 + i * (o.stagger ?? 0.08), 0.35),
          ...(o.marks ?? [])
            .filter((m) => m.row === i)
            .map((m) =>
              this.anim(
                m.kind === "bad" ? "rowBad" : m.kind === "good" ? "rowGood" : "rowDim",
                m.at,
                0.35,
                "ease",
                "forwards",
              ),
            ),
        ].filter(Boolean);
        return `<tr style="${fx.length ? `animation:${fx.join(",")}` : ""}">${r.map((c) => `<td>${esc(String(c))}</td>`).join("")}</tr>`;
      })
      .join("");
    return `<div class="card tbl" style="${this.enter(at)}">${o.label ? `<div class="card-h">${esc(o.label)}</div>` : ""}<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  /**
   * A multiple-choice question as the lesson shows it. Each pick marks its
   * option and shows the lesson's own note; a later pick dims the earlier one.
   */
  options(
    items: string[],
    picks: { option: number; at: number; right: boolean; note: string }[],
    o: { at?: number; question?: string } = {},
  ) {
    const at = o.at ?? 0;
    const opts = items
      .map((text, i) => {
        const fx: string[] = [at < 0 ? "" : this.anim("rise", at + 0.1 + i * 0.12, 0.4)];
        picks.forEach((p, j) => {
          if (p.option === i)
            fx.push(this.anim(p.right ? "optRight" : "optWrong", p.at, 0.35, "ease", "forwards"));
          const next = picks[j + 1];
          if (p.option === i && !p.right && next)
            fx.push(this.anim("optDim", next.at, 0.35, "ease", "forwards"));
        });
        return `<div class="opt" style="animation:${fx.filter(Boolean).join(",")}"><b>${String.fromCharCode(65 + i)}</b><span>${highlight(text)}</span></div>`;
      })
      .join("");
    const notes = picks
      .map((p, j) => {
        const next = picks[j + 1];
        const fx = [this.anim("rise", p.at + 0.35, 0.4)];
        if (next) fx.push(this.anim("vanish", next.at, 0.2, "ease", "forwards"));
        return `<div class="note ${p.right ? "ok" : "no"}" style="animation:${fx.join(",")}"><b>${p.right ? "Correct." : "Not quite."}</b> ${esc(p.note)}</div>`;
      })
      .join("");
    return `<div class="card mcq" style="${this.enter(at)}">${o.question ? `<div class="q">${highlight(o.question)}</div>` : ""}${opts}<div class="notes">${notes}</div></div>`;
  }

  /** A big number or phrase; `swap` crosses it out and brings in the real one. */
  stat(
    value: string,
    o: {
      at?: number;
      label?: string;
      tone?: "bad" | "good" | "plain";
      swap?: { to: string; at: number };
    } = {},
  ) {
    const at = o.at ?? 0;
    const swap = o.swap
      ? `<span class="stat-v new" style="animation:${this.anim("pop", o.swap.at + 0.2, 0.5)}">${esc(o.swap.to)}</span>`
      : "";
    const strike = o.swap
      ? `animation:${this.anim("strike", o.swap.at, 0.35, "ease", "forwards")}`
      : "";
    return `<div class="stat ${o.tone ?? "plain"}" style="${this.enter(at, "pop")}">
      ${o.label ? `<div class="stat-l">${esc(o.label)}</div>` : ""}
      <div class="stat-row"><span class="stat-v old" style="${strike}">${esc(value)}</span>${swap}</div></div>`;
  }

  badge(text: string, at: number, tone: "brand" | "red" | "ink" = "ink") {
    return `<div class="badge ${tone}" style="animation:${this.anim("pop", at, 0.5)}">${esc(text)}</div>`;
  }

  /** A terminal: each command is typed, then its output appears. */
  terminal(
    entries: { cmd?: string; out?: string[]; at: number; mark?: number[] }[],
    o: { at?: number } = {},
  ) {
    const rows = entries
      .map((e) => {
        let html = "";
        let t = e.at;
        if (e.cmd !== undefined) {
          const dur = e.at < 0 ? 0 : Math.max(0.2, e.cmd.length / 22);
          const typing =
            e.at < 0
              ? ""
              : `style="--n:${e.cmd.length}ch;animation:${this.anim("type", t, dur, `steps(${Math.max(1, e.cmd.length)})`)}"`;
          html += `<div class="sh" ${e.at < 0 ? "" : `style="animation:${this.anim("appear", t, 0.01)}"`}><span class="ps">$</span> <span class="ln-t ${e.at < 0 ? "" : "typing"}" ${typing}>${esc(e.cmd)}</span></div>`;
          t += dur + 0.3;
        }
        (e.out ?? []).forEach((line, i) => {
          const marked = e.mark?.includes(i);
          const fx = [e.at < 0 ? "" : this.anim("appear", t + i * 0.05, 0.15)];
          if (marked) fx.push(this.anim("markGood", t + 0.8, 0.4, "ease", "forwards"));
          html += `<div class="so" style="animation:${fx.filter(Boolean).join(",")}">${esc(line) || " "}</div>`;
        });
        return html;
      })
      .join("");
    return `<div class="card term" style="${this.enter(o.at ?? 0)}"><div class="card-h"><span class="dots"><i></i><i></i><i></i></span>~/shop</div><div class="term-b">${rows}</div></div>`;
  }

  /**
   * Commits top to bottom (newest first) with branch labels beside them. A
   * label can slide to another commit, which is how a reset or a new branch
   * reads at a glance.
   */
  graph(
    commits: { hash: string; msg: string; at?: number }[],
    labels: {
      text: string;
      row: number;
      /** Column on the label line; keep a branch in the same column across beats. */
      col: number;
      tone: "head" | "branch" | "remote";
      at?: number;
      moveTo?: { row: number; at: number };
    }[],
    o: { at?: number } = {},
  ) {
    const ROW = 160;
    const nodes = commits
      .map((c, i) => {
        const fx = c.at === undefined ? "" : `animation:${this.anim("pop", c.at, 0.45)}`;
        return `<div class="gc" style="top:${i * ROW}px;${fx}"><i></i><code>${esc(c.hash)}</code><span>${esc(c.msg)}</span></div>`;
      })
      .join("");
    const pills = labels
      .map((l) => {
        const fx = [l.at === undefined ? "" : this.anim("pop", l.at, 0.45)];
        let move = "";
        if (l.moveTo) {
          move = `--dy:${(l.moveTo.row - l.row) * ROW}px;`;
          fx.push(this.anim("slide", l.moveTo.at, 0.7, "cubic-bezier(.6,0,.2,1)", "forwards"));
        }
        const anim = fx.filter(Boolean);
        return `<div class="gl ${l.tone}" style="top:${l.row * ROW + 118}px;left:${148 + l.col * 300}px;${move}${anim.length ? `animation:${anim.join(",")}` : ""}">${esc(l.text)}</div>`;
      })
      .join("");
    return `<div class="card graph" style="${this.enter(o.at ?? 0)}height:${commits.length * ROW + 30}px"><div class="g-line" style="height:${(commits.length - 1) * ROW}px"></div>${nodes}<div class="g-labels">${pills}</div></div>`;
  }

  /** Side-by-side labels for "compared as text" style explanations. */
  chips(items: { text: string; tone?: "bad" | "good" | "plain" }[], at: number) {
    return `<div class="chips">${items
      .map(
        (c, i) =>
          `<span class="chip ${c.tone ?? "plain"}" style="animation:${this.anim("pop", at + i * 0.15, 0.45)}">${esc(c.text)}</span>`,
      )
      .join("")}</div>`;
  }

  /** Free text inside the content area. */
  text(html: string, at: number, cls = "lead") {
    return `<div class="${cls}" style="animation:${this.anim("rise", at, 0.5)}">${html}</div>`;
  }

  row(...parts: string[]) {
    return `<div class="hrow">${parts.join("")}</div>`;
  }
}

export const STAGE_CSS = (fonts: string) => `
@font-face{font-family:SG;font-weight:300 700;src:url("${fonts}/space-grotesk-latin.woff2") format("woff2")}
@font-face{font-family:MR;font-weight:200 800;src:url("${fonts}/manrope-latin.woff2") format("woff2")}
@font-face{font-family:JB;font-weight:100 800;src:url("${fonts}/jetbrains-mono-latin.woff2") format("woff2")}
:root{--brand:oklch(0.705 0.136 165.5);--red:#e5484d;--lime:#b9f563;--ink:#11151b;--paper:#eef3f1}
*{box-sizing:border-box}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}
body{font-family:MR,sans-serif;-webkit-font-smoothing:antialiased}
/* JetBrains Mono joins => and -> into arrows; beginners should see what they'd type. The font
   shorthand on each block resets font-variant-ligatures, but not this. */
*{font-feature-settings:"liga" 0,"calt" 0}
.layer{position:absolute;inset:0}
.bg{position:absolute;inset:0;opacity:0}
.bg.light{background:var(--paper)}
.bg.dark{background:#0c0f13}
.bg::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(127,140,150,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(127,140,150,.09) 1px,transparent 1px);background-size:72px 72px}
.blob{position:absolute;border-radius:50%;filter:blur(90px);opacity:.55}
.blob.teal{width:620px;height:620px;background:var(--brand);left:-180px;top:180px;animation:drift1 14s ease-in-out infinite alternate}
.blob.red{width:560px;height:560px;background:var(--red);right:-160px;bottom:240px;opacity:.38;animation:drift2 17s ease-in-out infinite alternate}
.beat{position:absolute;inset:0;opacity:0}
.theme-light{color:var(--ink)}
.theme-dark{color:#f3f5f7}
.chipbar{position:absolute;left:64px;top:84px;right:64px}
.topic{display:inline-flex;align-items:center;gap:14px;padding:12px 26px;border-radius:999px;font:700 30px MR;backdrop-filter:blur(8px)}
.theme-light .topic{background:rgba(255,255,255,.7);border:1px solid rgba(17,21,27,.08)}
.theme-dark .topic{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1)}
.topic::before{content:"";width:14px;height:14px;border-radius:50%;background:var(--red)}
.track{position:absolute;left:64px;right:64px;top:196px;height:6px;border-radius:9px;background:rgba(127,140,150,.25);overflow:hidden}
.fill{height:100%;width:100%;transform-origin:left;background:linear-gradient(90deg,var(--brand),var(--red));animation:grow var(--total) linear 0s both}
.stage{position:absolute;left:64px;right:64px;top:250px;height:1060px;display:flex;flex-direction:column;justify-content:center;gap:34px}
.caption{position:absolute;left:90px;right:90px;top:1370px;text-align:center;font:700 66px/1.18 SG;letter-spacing:-.02em}
.card{border-radius:30px;overflow:hidden;box-shadow:0 30px 70px -30px rgba(0,0,0,.45)}
.theme-light .card{background:#fff;border:1px solid rgba(17,21,27,.08)}
.theme-dark .card{background:#161b22;border:1px solid rgba(255,255,255,.08)}
.card-h{display:flex;align-items:center;gap:16px;padding:20px 28px;font:600 26px JB;opacity:.6;border-bottom:1px solid rgba(127,140,150,.18)}
.dots{display:inline-flex;gap:8px}.dots i{width:13px;height:13px;border-radius:50%;background:rgba(127,140,150,.45)}
.code{background:#0f1319 !important;color:#e8edf2;font:500 30px/1.62 JB;border:1px solid rgba(255,255,255,.08) !important}
.code-b{padding:20px 0}
.ln{display:flex;padding:0 28px;border-left:6px solid transparent}
.ln-n{width:46px;flex:none;opacity:.32;text-align:right;margin-right:26px}
.ln-t{white-space:pre}
.typing{display:inline-block;overflow:hidden;vertical-align:top;width:var(--n)}
.tk{color:#ff7b9c}.ts{color:#b9f563}.tn{color:#7fd4ff}.tc{color:#7d8794;font-style:italic}
.output{font:500 30px/1.5 JB;padding-bottom:16px}
.out{display:flex;align-items:center;gap:18px;padding:10px 28px}
.out.big span{font:700 52px JB;color:var(--lime)}
.theme-light .out.big span{color:var(--ink)}
.out.fail span{color:var(--red)}
.ic{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;font:800 24px MR;color:#fff;flex:none}
.ic.ok{background:var(--brand)}.ic.no{background:var(--red)}
.tbl table{width:100%;border-collapse:collapse;font:500 30px JB}
.tbl th{text-align:left;padding:16px 28px;font:700 24px MR;letter-spacing:.06em;text-transform:uppercase;opacity:.55}
.tbl td{padding:12px 28px;border-top:1px solid rgba(127,140,150,.16);white-space:pre}
.mcq{padding:30px 30px 26px}
.q{font:700 36px/1.35 SG;margin:0 6px 24px}
.q .tk,.q .ts,.q .tn{font-family:JB;font-size:32px}
.opt{display:flex;align-items:center;gap:22px;padding:22px 26px;margin-top:16px;border-radius:22px;border:2px solid rgba(127,140,150,.25);font:600 32px/1.3 MR}
.opt b{display:grid;place-items:center;width:52px;height:52px;flex:none;border-radius:50%;border:2px solid currentColor;font:800 24px MR;opacity:.7}
.theme-dark .opt .tk{color:#ff7b9c}.theme-light .opt .tk{color:#c2185b}
.theme-light .opt .ts{color:#2e7d32}.theme-light .opt .tn{color:#0277bd}
.notes{position:relative;min-height:10px}
.note{margin-top:22px;padding:22px 26px;border-radius:20px;font:500 29px/1.42 MR}
.note b{font-weight:800}
.note.no{background:rgba(229,72,77,.12)}.note.no b{color:var(--red)}
.note.ok{background:rgba(32,178,140,.14)}.note.ok b{color:var(--brand)}
.notes .note+.note{position:absolute;left:0;right:0;top:0}
.stat{align-self:center;text-align:center}
.stat-l{font:700 30px MR;letter-spacing:.08em;text-transform:uppercase;opacity:.6;margin-bottom:10px}
.stat-row{display:flex;gap:40px;justify-content:center;align-items:baseline}
.stat-v{font:700 150px/1 SG;letter-spacing:-.04em;position:relative}
.stat.bad .stat-v.old{color:var(--red)}.stat.good .stat-v{color:var(--brand)}
.stat-v.new{color:var(--brand)}
.stat-v.old::after{content:"";position:absolute;left:-6%;right:-6%;top:52%;height:12px;border-radius:9px;background:var(--red);transform:scaleX(var(--s,0));transform-origin:left}
.badge{align-self:center;padding:22px 44px;border-radius:999px;font:800 40px SG;letter-spacing:-.01em}
.badge.ink{background:var(--ink);color:#fff}.theme-dark .badge.ink{background:#fff;color:var(--ink)}
.badge.red{background:var(--red);color:#fff}.badge.brand{background:var(--brand);color:#05140f}
.term{background:#0f1319 !important;color:#e8edf2;border:1px solid rgba(255,255,255,.08) !important}
.term-b{padding:22px 30px 26px;font:500 27px/1.55 JB}
.sh .ps{color:var(--brand);font-weight:800}
.so{color:#b7c0ca;white-space:pre-wrap;border-left:6px solid transparent;padding-left:10px;margin-left:-16px}
.graph{position:relative;padding:36px 40px}
.g-line{position:absolute;left:70px;top:72px;width:6px;border-radius:9px;background:rgba(127,140,150,.4)}
.gc{position:absolute;left:52px;right:30px;display:flex;align-items:center;gap:26px;height:72px;margin-top:36px;font:600 31px MR}
.gc i{width:42px;height:42px;border-radius:50%;background:var(--brand);border:7px solid #fff;box-shadow:0 0 0 3px var(--brand);flex:none}
.theme-dark .gc i{border-color:#161b22}
.gc code{font:600 27px JB;opacity:.55}
.g-labels{position:absolute;inset:0;pointer-events:none}
.gl{position:absolute;padding:8px 20px;border-radius:999px;font:700 25px JB;transform:translateY(0)}
.gl.head{background:var(--brand);color:#05140f}.gl.branch{background:var(--lime);color:#11151b}.gl.remote{background:rgba(127,140,150,.25)}
.chips{display:flex;gap:22px;justify-content:center;flex-wrap:wrap}
.chip{padding:22px 34px;border-radius:24px;font:700 46px JB;background:rgba(127,140,150,.16)}
.chip.bad{background:rgba(229,72,77,.16);color:var(--red)}.chip.good{background:rgba(32,178,140,.16);color:var(--brand)}
.lead{font:600 40px/1.35 MR;text-align:center;opacity:.85}
.hrow{display:flex;gap:26px;align-items:stretch}.hrow>*{flex:1}
.end{align-items:center;text-align:center}
.end img{width:260px;height:260px;border-radius:64px;box-shadow:0 40px 90px -30px rgba(0,0,0,.6)}
.end .name{font:700 92px SG;letter-spacing:-.03em;margin-top:20px}
.end .try{font:600 40px MR;opacity:.75;margin-top:6px}
.end .url{margin-top:34px;padding:24px 46px;border-radius:999px;background:var(--brand);color:#05140f;font:800 44px SG}
.end .lesson{margin-top:30px;font:600 30px MR;opacity:.6}
@keyframes rise{from{opacity:0;transform:translateY(34px)}to{opacity:1;transform:none}}
@keyframes pop{0%{opacity:0;transform:scale(.6)}70%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
@keyframes appear{from{opacity:0}to{opacity:1}}
@keyframes vanish{to{opacity:0}}
@keyframes type{from{width:0}to{width:var(--n)}}
@keyframes markBad{to{background:rgba(229,72,77,.22);border-left-color:var(--red)}}
@keyframes markGood{to{background:rgba(32,178,140,.22);border-left-color:var(--brand)}}
@keyframes rowBad{to{background:rgba(229,72,77,.18);color:var(--red)}}
@keyframes rowGood{to{background:rgba(32,178,140,.18)}}
@keyframes rowDim{to{opacity:.28}}
@keyframes optWrong{to{border-color:var(--red);background:rgba(229,72,77,.12)}}
@keyframes optRight{to{border-color:var(--brand);background:rgba(32,178,140,.16)}}
@keyframes optDim{to{opacity:.4;border-color:rgba(127,140,150,.25);background:transparent}}
@keyframes strike{to{--s:1;opacity:.5}}
@keyframes slide{to{transform:translateY(var(--dy))}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes drift1{to{transform:translate(220px,260px) scale(1.15)}}
@keyframes drift2{to{transform:translate(-200px,-240px) scale(.9)}}
@keyframes show{from{opacity:1}to{opacity:1}}
@keyframes hide{to{opacity:0}}
@property --s{syntax:"<number>";inherits:true;initial-value:0}
`;
