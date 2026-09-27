/**
 * A practice model of git for the Git course's sandbox challenges.
 *
 * It is not git. It models the commands the course teaches — commits, the
 * index, branches, merges with real three-way conflicts, rebase, reset, stash,
 * reflog, a remote and a teammate who pushes to it — closely enough that what a
 * learner types here works the same way in a real terminal. Messages are
 * copied from git 2.40, and `scripts/verify-git-sandbox.ts` replays every
 * challenge through real git to check the two agree.
 *
 * It is deterministic and has no dependencies, on purpose: the page runs it
 * for instant feedback, and `completeLessonFn` replays the learner's
 * transcript through the same code on the server, so a git challenge is graded
 * there rather than taken on the browser's word. Cloudflare Workers can't run
 * git or `eval`, which rules out both alternatives.
 *
 * A transcript is plain text, one command per line, exactly as typed. Saving a
 * file from the editor adds `@write <path> <json string>`. Setup scripts may
 * also use `@teammate <command>`, which runs in a second clone of the remote.
 */

// ---------------------------------------------------------------------------
// Model

export type Tree = Record<string, string>;

export interface Commit {
  id: string;
  parents: string[];
  tree: Tree;
  message: string;
  seq: number;
}

type Head = { branch: string } | { detached: string };

interface Stash {
  base: string;
  branch: string;
  message: string;
  index: Tree;
  work: Tree;
  untracked: Tree;
}

type Op =
  | { kind: "merge"; mergeHead: string; message: string }
  | {
      kind: "rebase";
      branch: string | null;
      origHead: string;
      onto: string;
      todo: string[];
      done: string[];
      current: string | null;
      action: string;
    }
  | { kind: "cherry-pick"; commit: string }
  | { kind: "revert"; commit: string; message: string };

export interface Repo {
  initialized: boolean;
  work: Tree;
  index: Tree;
  head: Head;
  branches: Record<string, string>;
  upstream: Record<string, string>;
  remoteRefs: Record<string, string>;
  hasOrigin: boolean;
  reflog: { id: string; message: string }[];
  stash: Stash[];
  conflicts: Record<string, true>;
  op: Op | null;
  config: Record<string, string>;
  previous: string | null;
}

export interface World {
  commits: Record<string, Commit>;
  remote: { url: string; branches: Record<string, string> };
  me: Repo;
  teammate: Repo | null;
  config: Record<string, string>;
  seq: number;
}

export interface LineResult {
  output: string;
  ok: boolean;
  /** `clear` was typed: the terminal empties its scrollback. */
  clear?: true;
}

class GitError extends Error {}
const fail = (message: string): never => {
  throw new GitError(message);
};

export const SANDBOX_DIR = "~/shop";

function emptyRepo(): Repo {
  return {
    initialized: false,
    work: {},
    index: {},
    head: { branch: "main" },
    branches: {},
    upstream: {},
    remoteRefs: {},
    hasOrigin: false,
    reflog: [],
    stash: [],
    conflicts: {},
    op: null,
    config: {},
    previous: null,
  };
}

export function createWorld(): World {
  return {
    commits: {},
    remote: { url: "", branches: {} },
    me: emptyRepo(),
    teammate: null,
    // What the course's first lesson has every learner set once.
    config: {
      "user.name": "You",
      "user.email": "you@example.com",
      "init.defaultbranch": "main",
      "pull.rebase": "false",
    },
    seq: 0,
  };
}

// ---------------------------------------------------------------------------
// Hashing: ids only need to be stable and look like git's.

function fnv(text: string, seed: number): string {
  let h = 0x811c9dc5 ^ seed;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function hash40(text: string): string {
  return [1, 2, 3, 4, 5].map((seed) => fnv(text, seed * 0x9e3779b1)).join("");
}

const short = (id: string) => id.slice(0, 7);
const blobId = (content: string | undefined) =>
  content === undefined ? "0000000" : short(hash40(`blob\0${content}`));

function serialiseTree(tree: Tree): string {
  return Object.keys(tree)
    .sort()
    .map((path) => `${path}\0${tree[path]}`)
    .join("\0\0");
}

const sameTree = (a: Tree, b: Tree) => serialiseTree(a) === serialiseTree(b);
const subject = (message: string) => message.split("\n")[0] ?? "";

// ---------------------------------------------------------------------------
// Commits and history

function makeCommit(world: World, parents: string[], tree: Tree, message: string): Commit {
  world.seq += 1;
  const id = hash40(`${parents.join(",")}\n${serialiseTree(tree)}\n${message}\n${world.seq}`);
  const commit: Commit = { id, parents, tree: { ...tree }, message, seq: world.seq };
  world.commits[id] = commit;
  return commit;
}

function getCommit(world: World, id: string): Commit {
  const commit = world.commits[id];
  if (!commit) return fail(`fatal: bad object ${id}`);
  return commit;
}

function ancestors(world: World, id: string | undefined): Set<string> {
  const seen = new Set<string>();
  const stack = id ? [id] : [];
  while (stack.length) {
    const next = stack.pop()!;
    if (seen.has(next)) continue;
    seen.add(next);
    stack.push(...(world.commits[next]?.parents ?? []));
  }
  return seen;
}

const isAncestor = (world: World, maybe: string, of: string) => ancestors(world, of).has(maybe);

function mergeBase(world: World, a: string, b: string): string | null {
  const fromA = ancestors(world, a);
  let best: Commit | null = null;
  for (const id of ancestors(world, b)) {
    if (!fromA.has(id)) continue;
    const commit = world.commits[id]!;
    if (!best || commit.seq > best.seq) best = commit;
  }
  return best?.id ?? null;
}

/** Commits reachable from `from` but not from `not`, oldest first. */
function commitsBetween(world: World, from: string, not: string | null): Commit[] {
  const exclude = not ? ancestors(world, not) : new Set<string>();
  return [...ancestors(world, from)]
    .filter((id) => !exclude.has(id))
    .map((id) => world.commits[id]!)
    .sort((x, y) => x.seq - y.seq);
}

// ---------------------------------------------------------------------------
// The repository's view of itself

function headId(repo: Repo): string | undefined {
  return "detached" in repo.head ? repo.head.detached : repo.branches[repo.head.branch];
}

function headTree(world: World, repo: Repo): Tree {
  const id = headId(repo);
  return id ? getCommit(world, id).tree : {};
}

function currentBranch(repo: Repo): string | null {
  return "branch" in repo.head ? repo.head.branch : null;
}

function logReflog(repo: Repo, message: string) {
  const id = headId(repo);
  if (id) repo.reflog.push({ id, message });
}

function configValue(world: World, repo: Repo, key: string): string | undefined {
  const k = key.toLowerCase();
  return repo.config[k] ?? world.config[k];
}

function ignorePatterns(repo: Repo): string[] {
  return (repo.work[".gitignore"] ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]");
  return new RegExp(`^${escaped}$`);
}

function isIgnored(repo: Repo, path: string): boolean {
  const parts = path.split("/");
  return ignorePatterns(repo).some((raw) => {
    const dirOnly = raw.endsWith("/");
    const anchored = raw.startsWith("/");
    const pattern = raw.replace(/^\//, "").replace(/\/$/, "");
    const re = globToRegExp(pattern);
    if (pattern.includes("/") || anchored) {
      // Matches the path itself, or any directory prefix of it.
      for (let i = 1; i <= parts.length; i++) {
        const prefix = parts.slice(0, i).join("/");
        if (re.test(prefix) && (i < parts.length || !dirOnly)) return true;
      }
      return false;
    }
    // A bare name matches at any depth: a file, or a directory above the file.
    return parts.some((part, i) => re.test(part) && (i < parts.length - 1 || !dirOnly));
  });
}

interface StatusEntry {
  path: string;
  staged: "new file" | "modified" | "deleted" | null;
  unstaged: "modified" | "deleted" | null;
}

function statusOf(world: World, repo: Repo) {
  const head = headTree(world, repo);
  const paths = new Set([
    ...Object.keys(head),
    ...Object.keys(repo.index),
    ...Object.keys(repo.work),
  ]);
  const entries: StatusEntry[] = [];
  const untracked: string[] = [];
  const conflicted: string[] = [];
  for (const path of [...paths].sort()) {
    if (repo.conflicts[path]) {
      conflicted.push(path);
      continue;
    }
    const inHead = head[path];
    const inIndex = repo.index[path];
    const inWork = repo.work[path];
    if (inIndex === undefined && inHead === undefined) {
      if (inWork !== undefined && !isIgnored(repo, path)) untracked.push(path);
      continue;
    }
    const staged =
      inHead === inIndex
        ? null
        : inHead === undefined
          ? "new file"
          : inIndex === undefined
            ? "deleted"
            : "modified";
    const unstaged =
      inIndex === undefined
        ? null
        : inWork === undefined
          ? "deleted"
          : inWork !== inIndex
            ? "modified"
            : null;
    if (inIndex === undefined && inWork !== undefined && !isIgnored(repo, path))
      untracked.push(path);
    if (staged || unstaged) entries.push({ path, staged, unstaged });
  }
  return { entries, untracked, conflicted };
}

/** Tracked paths whose index or working copy differs from HEAD. */
function dirtyPaths(world: World, repo: Repo): string[] {
  const { entries, conflicted } = statusOf(world, repo);
  return [...entries.map((e) => e.path), ...conflicted];
}

/** Untracked directories collapse to `dir/`, as git lists them. */
function collapseUntracked(repo: Repo, paths: string[]): string[] {
  const tracked = new Set(Object.keys(repo.index));
  const out = new Set<string>();
  for (const path of paths) {
    const top = path.split("/")[0]!;
    const dirTracked = [...tracked].some((t) => t.startsWith(`${top}/`));
    out.add(path.includes("/") && !dirTracked ? `${top}/` : path);
  }
  return [...out].sort();
}

// ---------------------------------------------------------------------------
// Line diffs, three-way merges

function splitLines(content: string): { lines: string[]; trailing: boolean } {
  if (content === "") return { lines: [], trailing: false };
  const lines = content.split("\n");
  const trailing = lines[lines.length - 1] === "";
  if (trailing) lines.pop();
  return { lines, trailing };
}

const joinLines = (lines: string[]) => (lines.length ? `${lines.join("\n")}\n` : "");

/** Index pairs of a longest common subsequence. Files here are tiny. */
function lcs(a: string[], b: string[]): [number, number][] {
  const n = a.length;
  const m = b.length;
  const table: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      table[i]![j] =
        a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) i++;
    else j++;
  }
  return pairs;
}

type DiffOp = { type: " " | "-" | "+"; text: string };

function diffLines(a: string[], b: string[]): DiffOp[] {
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  for (const [pi, pj] of [...lcs(a, b), [a.length, b.length] as [number, number]]) {
    while (i < pi) ops.push({ type: "-", text: a[i++]! });
    while (j < pj) ops.push({ type: "+", text: b[j++]! });
    if (pi < a.length && pj < b.length) {
      ops.push({ type: " ", text: a[pi]! });
      i = pi + 1;
      j = pj + 1;
    }
  }
  return ops;
}

function countChanges(before: string | undefined, after: string | undefined) {
  const ops = diffLines(splitLines(before ?? "").lines, splitLines(after ?? "").lines);
  return {
    added: ops.filter((o) => o.type === "+").length,
    removed: ops.filter((o) => o.type === "-").length,
  };
}

function unifiedDiff(path: string, before: string | undefined, after: string | undefined): string {
  const header = [`diff --git a/${path} b/${path}`];
  if (before === undefined) header.push("new file mode 100644", `index 0000000..${blobId(after)}`);
  else if (after === undefined)
    header.push("deleted file mode 100644", `index ${blobId(before)}..0000000`);
  else header.push(`index ${blobId(before)}..${blobId(after)} 100644`);
  header.push(before === undefined ? "--- /dev/null" : `--- a/${path}`);
  header.push(after === undefined ? "+++ /dev/null" : `+++ b/${path}`);

  const ops = diffLines(splitLines(before ?? "").lines, splitLines(after ?? "").lines);
  const changed = ops.map((o, i) => (o.type === " " ? -1 : i)).filter((i) => i >= 0);
  if (!changed.length) return "";
  const hunks: [number, number][] = [];
  for (const i of changed) {
    const start = Math.max(0, i - 3);
    const end = Math.min(ops.length, i + 4);
    const last = hunks[hunks.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else hunks.push([start, end]);
  }
  const body: string[] = [];
  for (const [start, end] of hunks) {
    let oldLine = 1;
    let newLine = 1;
    for (let k = 0; k < start; k++) {
      if (ops[k]!.type !== "+") oldLine++;
      if (ops[k]!.type !== "-") newLine++;
    }
    const slice = ops.slice(start, end);
    const oldCount = slice.filter((o) => o.type !== "+").length;
    const newCount = slice.filter((o) => o.type !== "-").length;
    const range = (line: number, count: number) =>
      count === 1 ? `${line}` : `${count === 0 ? line - 1 : line},${count}`;
    body.push(`@@ -${range(oldLine, oldCount)} +${range(newLine, newCount)} @@`);
    for (const o of slice) body.push(`${o.type}${o.text}`);
  }
  return [...header, ...body].join("\n");
}

function treeDiff(before: Tree, after: Tree, only?: (path: string) => boolean): string {
  const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  return paths
    .filter((p) => (only ? only(p) : true) && before[p] !== after[p])
    .map((p) => unifiedDiff(p, before[p], after[p]))
    .filter(Boolean)
    .join("\n");
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** The summary under `git commit`: files changed, insertions, deletions, modes. */
function commitSummary(before: Tree, after: Tree): string {
  const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((p) => before[p] !== after[p])
    .sort();
  let added = 0;
  let removed = 0;
  for (const p of paths) {
    const c = countChanges(before[p], after[p]);
    added += c.added;
    removed += c.removed;
  }
  const parts = [plural(paths.length, "file changed", "files changed")];
  if (added || !removed) parts.push(plural(added, "insertion(+)", "insertions(+)"));
  if (removed || !added) parts.push(plural(removed, "deletion(-)", "deletions(-)"));
  const lines = [` ${parts.join(", ")}`];
  for (const p of paths) {
    if (before[p] === undefined) lines.push(` create mode 100644 ${p}`);
    else if (after[p] === undefined) lines.push(` delete mode 100644 ${p}`);
  }
  return lines.join("\n");
}

/** The per-file stat after a fast-forward or merge. */
function diffStat(before: Tree, after: Tree): string {
  const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((p) => before[p] !== after[p])
    .sort();
  if (!paths.length) return "";
  const width = Math.max(...paths.map((p) => p.length));
  const rows = paths.map((p) => {
    const c = countChanges(before[p], after[p]);
    return ` ${p.padEnd(width)} | ${c.added + c.removed} ${"+".repeat(c.added)}${"-".repeat(c.removed)}`;
  });
  return [...rows, commitSummary(before, after)].join("\n");
}

interface MergedFile {
  content: string | undefined;
  conflict: boolean;
}

function mergeFile(
  base: string | undefined,
  ours: string | undefined,
  theirs: string | undefined,
  oursLabel: string,
  theirsLabel: string,
): MergedFile {
  if (ours === theirs) return { content: ours, conflict: false };
  if (base === ours) return { content: theirs, conflict: false };
  if (base === theirs) return { content: ours, conflict: false };
  // One side deleted what the other changed: keep the surviving copy, marked.
  if (ours === undefined || theirs === undefined) {
    return { content: ours ?? theirs, conflict: true };
  }
  const b = splitLines(base ?? "").lines;
  const o = splitLines(ours).lines;
  const t = splitLines(theirs).lines;
  const toOurs = new Map(lcs(b, o));
  const toTheirs = new Map(lcs(b, t));
  const out: string[] = [];
  let conflict = false;
  let bi = 0;
  let oi = 0;
  let ti = 0;
  const same = (x: string[], y: string[]) =>
    x.length === y.length && x.every((line, i) => line === y[i]);
  const chunk = (bEnd: number, oEnd: number, tEnd: number) => {
    const bc = b.slice(bi, bEnd);
    const oc = o.slice(oi, oEnd);
    const tc = t.slice(ti, tEnd);
    if (same(oc, tc) || same(tc, bc)) out.push(...oc);
    else if (same(oc, bc)) out.push(...tc);
    else {
      conflict = true;
      out.push(`<<<<<<< ${oursLabel}`, ...oc, "=======", ...tc, `>>>>>>> ${theirsLabel}`);
    }
  };
  for (let k = 0; k < b.length; k++) {
    const oj = toOurs.get(k);
    const tj = toTheirs.get(k);
    if (oj === undefined || tj === undefined || oj < oi || tj < ti) continue;
    chunk(k, oj, tj);
    out.push(b[k]!);
    bi = k + 1;
    oi = oj + 1;
    ti = tj + 1;
  }
  chunk(b.length, o.length, t.length);
  return { content: joinLines(out), conflict };
}

interface TreeMerge {
  tree: Tree;
  conflicts: string[];
  messages: string[];
}

function mergeTrees(
  base: Tree,
  ours: Tree,
  theirs: Tree,
  oursLabel: string,
  theirsLabel: string,
): TreeMerge {
  const tree: Tree = {};
  const conflicts: string[] = [];
  const messages: string[] = [];
  const paths = [
    ...new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)]),
  ].sort();
  for (const path of paths) {
    const bothChanged =
      ours[path] !== base[path] && theirs[path] !== base[path] && ours[path] !== theirs[path];
    const result = mergeFile(base[path], ours[path], theirs[path], oursLabel, theirsLabel);
    if (bothChanged && ours[path] !== undefined && theirs[path] !== undefined) {
      messages.push(`Auto-merging ${path}`);
    }
    if (result.conflict) {
      conflicts.push(path);
      const kind =
        ours[path] === undefined || theirs[path] === undefined
          ? `CONFLICT (modify/delete): ${path} deleted in ${ours[path] === undefined ? oursLabel : theirsLabel} and modified in ${ours[path] === undefined ? theirsLabel : oursLabel}.`
          : base[path] === undefined
            ? `CONFLICT (add/add): Merge conflict in ${path}`
            : `CONFLICT (content): Merge conflict in ${path}`;
      messages.push(kind);
    }
    if (result.content !== undefined) tree[path] = result.content;
  }
  return { tree, conflicts, messages };
}

// ---------------------------------------------------------------------------
// Revisions

function resolve(world: World, repo: Repo, rev: string): string {
  const found = tryResolve(world, repo, rev);
  if (!found) {
    return fail(
      `fatal: ambiguous argument '${rev}': unknown revision or path not in the working tree.`,
    );
  }
  return found;
}

function tryResolve(world: World, repo: Repo, rev: string): string | null {
  const reflogMatch = /^(HEAD|@)@\{(\d+)\}$/.exec(rev);
  if (reflogMatch) {
    const n = Number(reflogMatch[2]);
    return repo.reflog[repo.reflog.length - 1 - n]?.id ?? null;
  }
  const suffix = /^(.*?)((?:[~^]\d*)+)$/.exec(rev);
  if (suffix && suffix[1]) {
    let id = tryResolve(world, repo, suffix[1]);
    for (const [, op, digits] of suffix[2]!.matchAll(/([~^])(\d*)/g)) {
      if (!id) return null;
      const n = digits === "" ? 1 : Number(digits);
      if (op === "~") {
        for (let k = 0; k < n && id; k++) id = world.commits[id]?.parents[0] ?? null;
      } else {
        id = n === 0 ? id : (world.commits[id]?.parents[n - 1] ?? null);
      }
    }
    return id;
  }
  if (rev === "HEAD" || rev === "@") return headId(repo) ?? null;
  if (repo.branches[rev]) return repo.branches[rev];
  if (rev.startsWith("origin/") && repo.remoteRefs[rev.slice(7)])
    return repo.remoteRefs[rev.slice(7)]!;
  if (rev.startsWith("refs/heads/") && repo.branches[rev.slice(11)])
    return repo.branches[rev.slice(11)]!;
  if (/^[0-9a-f]{4,40}$/.test(rev)) {
    const matches = Object.keys(world.commits).filter((id) => id.startsWith(rev));
    if (matches.length === 1) return matches[0]!;
    if (matches.length > 1) return fail(`error: short object ID ${rev} is ambiguous`);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Moving HEAD and the working tree

/** The working tree after checking out `target`, carrying local edits that don't collide. */
function carryOver(
  world: World,
  repo: Repo,
  target: Tree,
  verb: "checkout" | "merge",
): { work: Tree; index: Tree } {
  const head = headTree(world, repo);
  const blocked = dirtyPaths(world, repo).filter((p) => target[p] !== head[p]);
  if (blocked.length) {
    fail(
      [
        `error: Your local changes to the following files would be overwritten by ${verb}:`,
        ...blocked.map((p) => `\t${p}`),
        `Please commit your changes or stash them before you ${verb === "checkout" ? "switch branches" : "merge"}.`,
        "Aborting",
      ].join("\n"),
    );
  }
  const untrackedClash = Object.keys(target).filter(
    (p) =>
      head[p] === undefined &&
      repo.index[p] === undefined &&
      repo.work[p] !== undefined &&
      repo.work[p] !== target[p],
  );
  if (untrackedClash.length) {
    fail(
      [
        `error: The following untracked working tree files would be overwritten by ${verb}:`,
        ...untrackedClash.map((p) => `\t${p}`),
        `Please move or remove them before you ${verb === "checkout" ? "switch branches" : "merge"}.`,
        "Aborting",
      ].join("\n"),
    );
  }
  const work: Tree = {};
  const index: Tree = {};
  const dirty = new Set(dirtyPaths(world, repo));
  for (const [p, content] of Object.entries(target)) {
    index[p] = content;
    work[p] = content;
  }
  for (const p of dirty) {
    if (repo.index[p] === undefined) delete index[p];
    else index[p] = repo.index[p]!;
    if (repo.work[p] === undefined) delete work[p];
    else work[p] = repo.work[p]!;
  }
  // Untracked files stay where they are.
  for (const [p, content] of Object.entries(repo.work)) {
    if (head[p] === undefined && repo.index[p] === undefined && work[p] === undefined)
      work[p] = content;
  }
  return { work, index };
}

/** `reset --hard`: tracked files match `tree`; untracked files are left alone. */
function hardReset(world: World, repo: Repo, tree: Tree) {
  const head = headTree(world, repo);
  const work: Tree = {};
  for (const [p, content] of Object.entries(repo.work)) {
    const tracked = head[p] !== undefined || repo.index[p] !== undefined;
    if (!tracked && tree[p] === undefined) work[p] = content;
  }
  Object.assign(work, tree);
  repo.work = work;
  repo.index = { ...tree };
  repo.conflicts = {};
}

function setHeadCommit(repo: Repo, id: string) {
  if ("detached" in repo.head) repo.head = { detached: id };
  else repo.branches[repo.head.branch] = id;
}

function trackingLine(world: World, repo: Repo, branch: string): string | null {
  const remoteBranch = repo.upstream[branch];
  if (!remoteBranch) return null;
  const local = repo.branches[branch];
  const remote = repo.remoteRefs[remoteBranch];
  const name = `origin/${remoteBranch}`;
  if (!local) return null;
  if (!remote) return `Your branch is based on '${name}', but the upstream is gone.`;
  const ahead = commitsBetween(world, local, remote).length;
  const behind = commitsBetween(world, remote, local).length;
  if (!ahead && !behind) return `Your branch is up to date with '${name}'.`;
  if (ahead && !behind) {
    return `Your branch is ahead of '${name}' by ${plural(ahead, "commit", "commits")}.\n  (use "git push" to publish your local commits)`;
  }
  if (!ahead) {
    return `Your branch is behind '${name}' by ${plural(behind, "commit", "commits")}, and can be fast-forwarded.\n  (use "git pull" to update your local branch)`;
  }
  return `Your branch and '${name}' have diverged,\nand have ${ahead} and ${behind} different commits each, respectively.\n  (use "git pull" to merge the remote branch into yours)`;
}

// ---------------------------------------------------------------------------
// Arguments

function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let started = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quote) {
      if (ch === quote) quote = null;
      else if (
        ch === "\\" &&
        quote === '"' &&
        i + 1 < line.length &&
        '"\\$`'.includes(line[i + 1]!)
      ) {
        current += line[++i];
      } else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
    } else if (/\s/.test(ch)) {
      if (started) tokens.push(current);
      current = "";
      started = false;
    } else if (ch === ">") {
      if (started) tokens.push(current);
      const op = line[i + 1] === ">" ? ">>" : ">";
      if (op === ">>") i++;
      tokens.push(op);
      current = "";
      started = false;
    } else {
      current += ch;
      started = true;
    }
  }
  if (quote) fail("error: unterminated quote");
  if (started) tokens.push(current);
  return tokens;
}

/** Splits `a && b` outside quotes. */
function splitAnd(line: string): string[] {
  const parts: string[] = [];
  let quote: string | null = null;
  let current = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quote) {
      if (ch === quote) quote = null;
      current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
    } else if (ch === "&" && line[i + 1] === "&") {
      parts.push(current);
      current = "";
      i++;
    } else current += ch;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

interface Parsed {
  flags: Set<string>;
  values: Record<string, string[]>;
  positional: string[];
}

/** Git-style options: `-am "msg"` expands to `-a -m msg`, and `--` ends options. */
function parseArgs(args: string[], takesValue: string[]): Parsed {
  const flags = new Set<string>();
  const values: Record<string, string[]> = {};
  const positional: string[] = [];
  const add = (name: string, value: string) => (values[name] ??= []).push(value);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--") {
      positional.push(...args.slice(i + 1).map((a) => a));
      flags.add("--");
      break;
    }
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      const name = eq === -1 ? arg : arg.slice(0, eq);
      if (eq !== -1) add(name, arg.slice(eq + 1));
      else if (takesValue.includes(name)) {
        const value = args[++i];
        if (value === undefined) fail(`error: option \`${name.slice(2)}' requires a value`);
        add(name, value!);
      } else flags.add(name);
    } else if (arg.startsWith("-") && arg.length > 1 && !/^-\d+$/.test(arg)) {
      const letters = arg.slice(1);
      for (let k = 0; k < letters.length; k++) {
        const name = `-${letters[k]}`;
        if (takesValue.includes(name)) {
          const rest = letters.slice(k + 1);
          const value = rest || args[++i];
          if (value === undefined) fail(`error: switch \`${letters[k]}' requires a value`);
          add(name, value!);
          break;
        }
        flags.add(name);
      }
    } else if (/^-\d+$/.test(arg)) {
      add("-n", arg.slice(1));
    } else positional.push(arg);
  }
  return { flags, values, positional };
}

const has = (p: Parsed, ...names: string[]) => names.some((n) => p.flags.has(n));
const value = (p: Parsed, ...names: string[]) => {
  for (const n of names) {
    const v = p.values[n];
    if (v?.length) return v[v.length - 1];
  }
  return undefined;
};

// ---------------------------------------------------------------------------
// Commands

type Handler = (world: World, repo: Repo, args: string[]) => string;

function requireRepo(repo: Repo) {
  if (!repo.initialized)
    fail("fatal: not a git repository (or any of the parent directories): .git");
}

function commitIndex(
  world: World,
  repo: Repo,
  message: string,
  parents: string[],
  reflogKind: string,
): Commit {
  const commit = makeCommit(world, parents, repo.index, message);
  setHeadCommit(repo, commit.id);
  logReflog(repo, `${reflogKind}: ${subject(message)}`);
  return commit;
}

function commitLine(repo: Repo, commit: Commit, root: boolean): string {
  const where = "detached" in repo.head ? "detached HEAD" : repo.head.branch;
  return `[${where}${root ? " (root-commit)" : ""} ${short(commit.id)}] ${subject(commit.message)}`;
}

function conflictStop(repo: Repo, conflicts: string[]) {
  repo.conflicts = Object.fromEntries(conflicts.map((p) => [p, true as const]));
}

const git: Record<string, Handler> = {
  init(world, repo) {
    if (repo.initialized) return `Reinitialized existing Git repository in ${SANDBOX_DIR}/.git/`;
    repo.initialized = true;
    repo.head = { branch: configValue(world, repo, "init.defaultBranch") ?? "master" };
    return `Initialized empty Git repository in ${SANDBOX_DIR}/.git/`;
  },

  config(world, repo, args) {
    const p = parseArgs(args, []);
    const [key, val] = p.positional;
    if (has(p, "--list", "-l")) {
      return Object.entries({ ...world.config, ...repo.config })
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");
    }
    if (!key) return fail("usage: git config [--global] <name> [<value>]");
    const target = has(p, "--global") ? world.config : repo.config;
    if (val === undefined) {
      const found = configValue(world, repo, key);
      return found ?? fail("");
    }
    if (!has(p, "--global")) requireRepo(repo);
    target[key.toLowerCase()] = val;
    return "";
  },

  status(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, []);
    const { entries, untracked, conflicted } = statusOf(world, repo);
    if (has(p, "--short", "-s")) {
      return [
        ...conflicted.map((path) => `UU ${path}`),
        ...entries.map((e) => {
          const x =
            e.staged === "new file"
              ? "A"
              : e.staged === "modified"
                ? "M"
                : e.staged === "deleted"
                  ? "D"
                  : " ";
          const y = e.unstaged === "modified" ? "M" : e.unstaged === "deleted" ? "D" : " ";
          return `${x}${y} ${e.path}`;
        }),
        ...collapseUntracked(repo, untracked).map((path) => `?? ${path}`),
      ].join("\n");
    }
    const lines: string[] = [];
    const op = repo.op;
    if (op?.kind === "rebase") {
      lines.push(`interactive rebase in progress; onto ${short(op.onto)}`);
      const pickLine = (id: string) =>
        `   pick ${short(id)} ${subject(getCommit(world, id).message)}`;
      const done = op.done;
      lines.push(
        `Last ${done.length === 1 ? "command" : "commands"} done (${plural(done.length, "command", "commands")} done):`,
        ...done.slice(-2).map(pickLine),
      );
      if (done.length > 2) lines.push("  (see more in file .git/rebase-merge/done)");
      if (op.todo.length) {
        lines.push(
          `Next ${op.todo.length === 1 ? "command" : "commands"} to do (${plural(op.todo.length, "remaining command", "remaining commands")}):`,
          ...op.todo.slice(0, 2).map(pickLine),
          '  (use "git rebase --edit-todo" to view and edit)',
        );
      } else lines.push("No commands remaining.");
      const where = op.branch ? `branch '${op.branch}'` : "detached HEAD";
      lines.push(`You are currently rebasing ${where} on '${short(op.onto)}'.`);
      lines.push(
        conflicted.length
          ? '  (fix conflicts and then run "git rebase --continue")'
          : '  (all conflicts fixed: run "git rebase --continue")',
      );
      lines.push('  (use "git rebase --skip" to skip this patch)');
      lines.push('  (use "git rebase --abort" to check out the original branch)');
      lines.push("");
    } else {
      if ("detached" in repo.head) lines.push(`HEAD detached at ${short(repo.head.detached)}`);
      else lines.push(`On branch ${repo.head.branch}`);
      const branch = currentBranch(repo);
      const tracking = branch ? trackingLine(world, repo, branch) : null;
      if (tracking) lines.push(tracking, "");
      if (!headId(repo)) lines.push("", "No commits yet", "");
      if (op?.kind === "merge") {
        lines.push(
          ...(conflicted.length
            ? [
                "You have unmerged paths.",
                '  (fix conflicts and run "git commit")',
                '  (use "git merge --abort" to abort the merge)',
              ]
            : [
                "All conflicts fixed but you are still merging.",
                '  (use "git commit" to conclude merge)',
              ]),
          "",
        );
      }
      if (op?.kind === "cherry-pick" || op?.kind === "revert") {
        const verb = op.kind;
        lines.push(
          `You are currently ${verb === "revert" ? "reverting" : "cherry-picking"} commit ${short(op.commit)}.`,
          conflicted.length
            ? `  (fix conflicts and run "git ${verb} --continue")`
            : `  (all conflicts fixed: run "git ${verb} --continue")`,
          `  (use "git ${verb} --skip" to skip this patch)`,
          `  (use "git ${verb} --abort" to cancel the ${verb} operation)`,
          "",
        );
      }
    }
    const staged = entries.filter((e) => e.staged);
    const unstaged = entries.filter((e) => e.unstaged);
    const shown = collapseUntracked(repo, untracked);
    const pad = (label: string) => `${label}:`.padEnd(12);
    if (staged.length) {
      lines.push(
        "Changes to be committed:",
        headId(repo)
          ? '  (use "git restore --staged <file>..." to unstage)'
          : '  (use "git rm --cached <file>..." to unstage)',
        ...staged.map((e) => `\t${pad(e.staged!)}${e.path}`),
        "",
      );
    }
    if (conflicted.length) {
      lines.push(
        "Unmerged paths:",
        // Git only offers to unstage when no merge is being concluded.
        ...(op?.kind === "merge" ? [] : ['  (use "git restore --staged <file>..." to unstage)']),
        '  (use "git add <file>..." to mark resolution)',
        ...conflicted.map((path) => `\tboth modified:   ${path}`),
        "",
      );
    }
    if (unstaged.length) {
      const anyDeleted = unstaged.some((e) => e.unstaged === "deleted");
      lines.push(
        "Changes not staged for commit:",
        `  (use "git ${anyDeleted ? "add/rm" : "add"} <file>..." to update what will be committed)`,
        '  (use "git restore <file>..." to discard changes in working directory)',
        ...unstaged.map((e) => `\t${pad(e.unstaged!)}${e.path}`),
        "",
      );
    }
    if (shown.length) {
      lines.push(
        "Untracked files:",
        '  (use "git add <file>..." to include in what will be committed)',
        ...shown.map((path) => `\t${path}`),
        "",
      );
    }
    if (!staged.length) {
      if (unstaged.length || conflicted.length)
        lines.push('no changes added to commit (use "git add" and/or "git commit -a")');
      else if (shown.length) {
        lines.push('nothing added to commit but untracked files present (use "git add" to track)');
      } else if (!headId(repo)) {
        lines.push('nothing to commit (create/copy files and use "git add" to track)');
      } else lines.push("nothing to commit, working tree clean");
    }
    while (lines[lines.length - 1] === "") lines.pop();
    return lines.join("\n");
  },

  add(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, []);
    const all = has(p, "-A", "--all") || p.positional.includes(".");
    const force = has(p, "-f", "--force");
    const specs = p.positional.filter((s) => s !== ".");
    if (!all && !specs.length && !has(p, "-u")) {
      return fail("Nothing specified, nothing added.\nhint: Maybe you wanted to say 'git add .'?");
    }
    const head = headTree(world, repo);
    const candidates = new Set([...Object.keys(repo.work), ...Object.keys(repo.index)]);
    const matches = (path: string, spec: string) =>
      path === spec ||
      path.startsWith(`${spec.replace(/\/$/, "")}/`) ||
      globToRegExp(spec).test(path);
    const ignoredHits: string[] = [];
    const chosen = new Set<string>();
    for (const spec of specs) {
      const hits = [...candidates].filter((path) => matches(path, spec));
      if (!hits.length) return fail(`fatal: pathspec '${spec}' did not match any files`);
      for (const path of hits) {
        const tracked = repo.index[path] !== undefined || head[path] !== undefined;
        if (!tracked && !force && isIgnored(repo, path))
          ignoredHits.push(ignoredPrefix(repo, path));
        else chosen.add(path);
      }
    }
    if (all || has(p, "-u")) {
      for (const path of candidates) {
        const tracked = repo.index[path] !== undefined;
        if (has(p, "-u") && !tracked) continue;
        if (!tracked && isIgnored(repo, path)) continue;
        chosen.add(path);
      }
    }
    if (ignoredHits.length && !chosen.size) {
      return fail(
        [
          "The following paths are ignored by one of your .gitignore files:",
          ...[...new Set(ignoredHits)],
          "hint: Use -f if you really want to add them.",
          "hint: Turn this message off by running",
          'hint: "git config advice.addIgnoredFile false"',
        ].join("\n"),
      );
    }
    for (const path of chosen) {
      if (repo.work[path] === undefined) delete repo.index[path];
      else repo.index[path] = repo.work[path]!;
      delete repo.conflicts[path];
    }
    return "";
  },

  rm(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, []);
    const cached = has(p, "--cached");
    const recursive = has(p, "-r");
    const out: string[] = [];
    const targets: string[] = [];
    for (const spec of p.positional) {
      const clean = spec.replace(/\/$/, "");
      const exact = repo.index[clean] !== undefined;
      const inside = Object.keys(repo.index).filter((path) => path.startsWith(`${clean}/`));
      if (!exact && !inside.length)
        return fail(`fatal: pathspec '${spec}' did not match any files`);
      if (!exact && !recursive)
        return fail(`fatal: not removing '${clean}' recursively without -r`);
      targets.push(...(exact ? [clean] : inside));
    }
    for (const path of targets.sort()) {
      delete repo.index[path];
      if (!cached) delete repo.work[path];
      out.push(`rm '${path}'`);
    }
    return out.join("\n");
  },

  commit(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, ["-m", "--message"]);
    const messages = [...(p.values["-m"] ?? []), ...(p.values["--message"] ?? [])];
    const amend = has(p, "--amend");
    if (Object.keys(repo.conflicts).length) {
      return fail(
        [
          "error: Committing is not possible because you have unmerged files.",
          "hint: Fix them up in the work tree, and then use 'git add/rm <file>'",
          "hint: as appropriate to mark resolution and make a commit.",
          "fatal: Exiting because of an unresolved conflict.",
        ].join("\n"),
      );
    }
    if (has(p, "-a", "--all")) {
      for (const path of Object.keys(repo.index)) {
        if (repo.work[path] === undefined) delete repo.index[path];
        else repo.index[path] = repo.work[path]!;
      }
    }
    const current = headId(repo);
    const op = repo.op;
    const opMessage =
      op?.kind === "merge"
        ? op.message
        : op?.kind === "revert"
          ? op.message
          : op?.kind === "cherry-pick"
            ? getCommit(world, op.commit).message
            : undefined;
    let message = messages.length ? messages.join("\n\n") : undefined;
    if (amend) {
      if (!current) return fail("fatal: You have nothing to amend.");
      const old = getCommit(world, current);
      message ??= has(p, "--no-edit") ? old.message : old.message;
      const commit = makeCommit(world, old.parents, repo.index, message);
      setHeadCommit(repo, commit.id);
      logReflog(repo, `commit (amend): ${subject(message)}`);
      const parentTree = old.parents[0] ? getCommit(world, old.parents[0]).tree : {};
      return `${commitLine(repo, commit, !old.parents.length)}\n${commitSummary(parentTree, commit.tree)}`;
    }
    message ??= opMessage;
    if (message === undefined) {
      return fail(
        'error: this sandbox has no text editor, so give the message on the command line:\n  git commit -m "Describe the change"',
      );
    }
    const before = headTree(world, repo);
    if (sameTree(before, repo.index) && op?.kind !== "merge") {
      const { entries, untracked } = statusOf(world, repo);
      const lines = [
        "detached" in repo.head
          ? `HEAD detached at ${short(repo.head.detached)}`
          : `On branch ${repo.head.branch}`,
      ];
      const branch = currentBranch(repo);
      const tracking = branch ? trackingLine(world, repo, branch) : null;
      if (tracking) lines.push(tracking);
      if (!current) lines.push("", "Initial commit");
      if (entries.some((e) => e.unstaged)) {
        lines.push(
          "",
          "Changes not staged for commit:",
          '  (use "git add <file>..." to update what will be committed)',
          '  (use "git restore <file>..." to discard changes in working directory)',
          ...entries
            .filter((e) => e.unstaged)
            .map((e) => `\t${`${e.unstaged}:`.padEnd(12)}${e.path}`),
          "",
          'no changes added to commit (use "git add" and/or "git commit -a")',
        );
      } else if (untracked.length) {
        lines.push(
          "",
          "Untracked files:",
          '  (use "git add <file>..." to include in what will be committed)',
          ...collapseUntracked(repo, untracked).map((path) => `\t${path}`),
          "",
          'nothing added to commit but untracked files present (use "git add" to track)',
        );
      } else lines.push(...(tracking ? [""] : []), "nothing to commit, working tree clean");
      return fail(lines.join("\n"));
    }
    const parents = current ? [current] : [];
    let kind = current ? "commit" : "commit (initial)";
    if (op?.kind === "merge") {
      parents.push(op.mergeHead);
      kind = "commit (merge)";
    }
    const commit = commitIndex(world, repo, message, parents, kind);
    if (op && op.kind !== "rebase") repo.op = null;
    if (parents.length > 1) return commitLine(repo, commit, false);
    return `${commitLine(repo, commit, !current)}\n${commitSummary(before, commit.tree)}`;
  },

  log(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, ["-n", "--max-count"]);
    const oneline = has(p, "--oneline");
    const graph = has(p, "--graph");
    const limit = Number(value(p, "-n", "--max-count") ?? Infinity);
    const revs = p.positional.filter((a) => tryResolve(world, repo, a));
    const paths = p.positional.filter((a) => !tryResolve(world, repo, a));
    const starts = has(p, "--all")
      ? [headId(repo), ...Object.values(repo.branches), ...Object.values(repo.remoteRefs)]
      : revs.length
        ? revs.map((r) => resolve(world, repo, r))
        : [headId(repo)];
    if (!starts.some(Boolean)) {
      const branch = currentBranch(repo) ?? "HEAD";
      return fail(`fatal: your current branch '${branch}' does not have any commits yet`);
    }
    const reachable = new Set<string>();
    for (const s of starts) if (s) for (const id of ancestors(world, s)) reachable.add(id);
    let commits = [...reachable].map((id) => world.commits[id]!).sort((a, b) => b.seq - a.seq);
    if (paths.length) {
      commits = commits.filter((c) => {
        const parent = c.parents[0] ? world.commits[c.parents[0]]!.tree : {};
        return paths.some((path) => c.tree[path] !== parent[path]);
      });
    }
    commits = commits.slice(0, limit);
    const text = (c: Commit) => {
      const deco = decorations(repo, c.id);
      if (oneline) return [`${short(c.id)}${deco ? ` (${deco})` : ""} ${subject(c.message)}`];
      return [
        `commit ${c.id}${deco ? ` (${deco})` : ""}`,
        ...(c.parents.length > 1 ? [`Merge: ${c.parents.map(short).join(" ")}`] : []),
        `Author: ${configValue(world, repo, "user.name")} <${configValue(world, repo, "user.email")}>`,
        "",
        ...c.message.split("\n").map((l) => `    ${l}`),
        "",
      ];
    };
    if (!graph) return commits.flatMap(text).join("\n").trimEnd();
    return drawGraph(commits, text).join("\n").trimEnd();
  },

  show(world, repo, args) {
    requireRepo(repo);
    const id = resolve(world, repo, args[0] ?? "HEAD");
    const c = getCommit(world, id);
    const deco = decorations(repo, id);
    const parent = c.parents[0] ? getCommit(world, c.parents[0]).tree : {};
    return [
      `commit ${c.id}${deco ? ` (${deco})` : ""}`,
      ...(c.parents.length > 1 ? [`Merge: ${c.parents.map(short).join(" ")}`] : []),
      `Author: ${configValue(world, repo, "user.name")} <${configValue(world, repo, "user.email")}>`,
      "",
      ...c.message.split("\n").map((l) => `    ${l}`),
      "",
      c.parents.length > 1 ? "" : treeDiff(parent, c.tree),
    ]
      .join("\n")
      .trimEnd();
  },

  diff(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, []);
    const revs = p.positional.filter((a) => !p.flags.has("--") && tryResolve(world, repo, a));
    const paths = p.positional.filter((a) => !revs.includes(a));
    const only = paths.length
      ? (path: string) => paths.some((s) => path === s || path.startsWith(`${s}/`))
      : undefined;
    if (has(p, "--staged", "--cached")) return treeDiff(headTree(world, repo), repo.index, only);
    if (revs.length === 2) {
      return treeDiff(
        getCommit(world, resolve(world, repo, revs[0]!)).tree,
        getCommit(world, resolve(world, repo, revs[1]!)).tree,
        only,
      );
    }
    if (revs.length === 1) {
      const base = getCommit(world, resolve(world, repo, revs[0]!)).tree;
      const tracked: Tree = {};
      for (const path of new Set([...Object.keys(base), ...Object.keys(repo.index)])) {
        if (repo.work[path] !== undefined) tracked[path] = repo.work[path]!;
      }
      return treeDiff(base, tracked, only);
    }
    const tracked: Tree = {};
    for (const path of Object.keys(repo.index))
      if (repo.work[path] !== undefined) tracked[path] = repo.work[path]!;
    const unmerged = Object.keys(repo.conflicts);
    const conflictNotes = unmerged.map((path) => `* Unmerged path ${path}`);
    return [
      ...conflictNotes,
      treeDiff(repo.index, tracked, (path) => !repo.conflicts[path] && (!only || only(path))),
    ]
      .filter(Boolean)
      .join("\n");
  },

  branch(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, []);
    const current = currentBranch(repo);
    if (has(p, "-d", "-D", "--delete")) {
      const out: string[] = [];
      for (const name of p.positional) {
        const id = repo.branches[name];
        if (!id) return fail(`error: branch '${name}' not found.`);
        if (name === current)
          return fail(`error: Cannot delete branch '${name}' checked out at '${SANDBOX_DIR}'`);
        const upstream = repo.upstream[name] ? repo.remoteRefs[repo.upstream[name]!] : undefined;
        const mergedInto = upstream ?? headId(repo);
        if (!has(p, "-D") && !(mergedInto && isAncestor(world, id, mergedInto))) {
          return fail(
            `error: The branch '${name}' is not fully merged.\nIf you are sure you want to delete it, run 'git branch -D ${name}'.`,
          );
        }
        delete repo.branches[name];
        delete repo.upstream[name];
        out.push(`Deleted branch ${name} (was ${short(id)}).`);
      }
      return out.join("\n");
    }
    if (has(p, "-m", "-M")) {
      const [a, b] = p.positional;
      const from = b === undefined ? current : a;
      const to = b === undefined ? a : b;
      if (!from || !to) return fail("fatal: branch name required");
      if (repo.branches[to] && !has(p, "-M"))
        return fail(`fatal: A branch named '${to}' already exists.`);
      const id = repo.branches[from];
      if (id) {
        repo.branches[to] = id;
        delete repo.branches[from];
      } else if (from !== current) return fail(`error: refname refs/heads/${from} not found`);
      if (repo.upstream[from]) {
        repo.upstream[to] = repo.upstream[from]!;
        delete repo.upstream[from];
      }
      if (from === current) repo.head = { branch: to };
      return "";
    }
    if (!p.positional.length) {
      const names = Object.keys(repo.branches).sort();
      const lines: string[] = [];
      if ("detached" in repo.head) lines.push(`* (HEAD detached at ${short(repo.head.detached)})`);
      for (const name of names) lines.push(`${name === current ? "*" : " "} ${name}`);
      if (has(p, "-a", "-r")) {
        if (has(p, "-r")) lines.length = 0;
        const prefix = has(p, "-a") ? "remotes/" : "";
        for (const name of Object.keys(repo.remoteRefs).sort())
          lines.push(`  ${prefix}origin/${name}`);
      }
      return lines.join("\n");
    }
    const [name, start] = p.positional;
    if (repo.branches[name!] && !has(p, "-f"))
      return fail(`fatal: a branch named '${name}' already exists`);
    const at = start ? resolve(world, repo, start) : headId(repo);
    if (!at) return fail(`fatal: not a valid object name: '${currentBranch(repo) ?? "HEAD"}'`);
    repo.branches[name!] = at;
    return "";
  },

  switch(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, ["-c", "-C", "--create"]);
    const create = value(p, "-c", "-C", "--create");
    if (create)
      return createAndSwitch(
        world,
        repo,
        create,
        p.positional[0],
        `checkout: moving from ${fromName(repo)} to ${create}`,
      );
    if (has(p, "--detach", "-d")) {
      const target = p.positional[0] ?? "HEAD";
      return detachAt(world, repo, target, false);
    }
    const target = p.positional[0];
    if (!target) return fail("fatal: missing branch or commit argument");
    if (target === "-") {
      if (!repo.previous) return fail("fatal: invalid reference: @{-1}");
      return switchTo(world, repo, repo.previous);
    }
    if (!repo.branches[target]) {
      if (repo.remoteRefs[target]) {
        const out = createAndSwitch(
          world,
          repo,
          target,
          `origin/${target}`,
          `checkout: moving from ${fromName(repo)} to ${target}`,
        );
        repo.upstream[target] = target;
        return `${out}\nbranch '${target}' set up to track 'origin/${target}'.`;
      }
      if (tryResolve(world, repo, target)) {
        return fail(
          `fatal: a branch is expected, got commit '${target}'\nhint: If you want to detach HEAD at the commit, try again with the --detach option.`,
        );
      }
      return fail(`fatal: invalid reference: ${target}`);
    }
    return switchTo(world, repo, target);
  },

  checkout(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, ["-b", "-B"]);
    const create = value(p, "-b", "-B");
    if (create)
      return createAndSwitch(
        world,
        repo,
        create,
        p.positional[0],
        `checkout: moving from ${fromName(repo)} to ${create}`,
      );
    if (p.flags.has("--")) return git["restore"]!(world, repo, p.positional);
    const target = p.positional[0];
    if (!target) return "";
    if (target === "-") {
      if (!repo.previous) return fail("error: pathspec '-' did not match any file(s) known to git");
      return switchTo(world, repo, repo.previous);
    }
    if (repo.branches[target]) return switchTo(world, repo, target);
    if (repo.remoteRefs[target]) return git["switch"]!(world, repo, [target]);
    if (tryResolve(world, repo, target)) return detachAt(world, repo, target, true);
    if (repo.index[target] !== undefined) return git["restore"]!(world, repo, p.positional);
    return fail(`error: pathspec '${target}' did not match any file(s) known to git`);
  },

  restore(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, ["-s", "--source"]);
    const staged = has(p, "--staged", "-S");
    const worktree = has(p, "--worktree", "-W") || !staged;
    const source = value(p, "-s", "--source");
    const sourceTree = source ? getCommit(world, resolve(world, repo, source)).tree : null;
    if (!p.positional.length) return fail("fatal: you must specify path(s) to restore");
    const head = headTree(world, repo);
    const known = new Set([
      ...Object.keys(repo.index),
      ...Object.keys(head),
      ...Object.keys(sourceTree ?? {}),
    ]);
    for (const spec of p.positional) {
      const clean = spec.replace(/\/$/, "");
      const hits = [...known].filter(
        (path) => spec === "." || path === clean || path.startsWith(`${clean}/`),
      );
      if (!hits.length)
        return fail(`error: pathspec '${spec}' did not match any file(s) known to git`);
      for (const path of hits) {
        if (staged) {
          const from = sourceTree ?? head;
          if (from[path] === undefined) delete repo.index[path];
          else repo.index[path] = from[path]!;
        }
        if (worktree) {
          const from = sourceTree ?? (staged ? head : repo.index);
          if (repo.conflicts[path] && !sourceTree) {
            return fail(`error: path '${path}' is unmerged`);
          }
          if (from[path] === undefined) delete repo.work[path];
          else repo.work[path] = from[path]!;
        }
      }
    }
    return "";
  },

  reset(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, []);
    const mode = has(p, "--hard") ? "hard" : has(p, "--soft") ? "soft" : "mixed";
    const [first, ...rest] = p.positional;
    const firstIsRev =
      first !== undefined && !p.flags.has("--") ? Boolean(tryResolve(world, repo, first)) : false;
    const paths = firstIsRev ? rest : p.positional;
    if (paths.length && mode === "mixed") {
      const from = firstIsRev
        ? getCommit(world, resolve(world, repo, first!)).tree
        : headTree(world, repo);
      for (const spec of paths) {
        const hits = [...new Set([...Object.keys(repo.index), ...Object.keys(from)])].filter(
          (path) => spec === "." || path === spec || path.startsWith(`${spec.replace(/\/$/, "")}/`),
        );
        for (const path of hits) {
          if (from[path] === undefined) delete repo.index[path];
          else repo.index[path] = from[path]!;
        }
      }
      return unstagedAfterReset(world, repo);
    }
    if (first !== undefined && !firstIsRev) return resolve(world, repo, first);
    const arg = first ?? "HEAD";
    const target = resolve(world, repo, arg);
    const tree = getCommit(world, target).tree;
    if (mode === "hard") hardReset(world, repo, tree);
    else if (mode === "mixed") repo.index = { ...tree };
    if (mode !== "soft") {
      repo.conflicts = {};
      if (repo.op && repo.op.kind !== "rebase") repo.op = null;
    }
    setHeadCommit(repo, target);
    logReflog(repo, `reset: moving to ${arg}`);
    if (mode === "hard")
      return `HEAD is now at ${short(target)} ${subject(getCommit(world, target).message)}`;
    return mode === "mixed" ? unstagedAfterReset(world, repo) : "";
  },

  merge(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, ["-m"]);
    if (has(p, "--abort")) {
      if (repo.op?.kind !== "merge")
        return fail("fatal: There is no merge to abort (MERGE_HEAD missing).");
      hardReset(world, repo, headTree(world, repo));
      repo.op = null;
      logReflog(repo, "reset: moving to HEAD");
      return "";
    }
    if (has(p, "--continue")) return git["commit"]!(world, repo, []);
    if (repo.op || Object.keys(repo.conflicts).length) {
      return fail(
        [
          "error: Merging is not possible because you have unmerged files.",
          "hint: Fix them up in the work tree, and then use 'git add/rm <file>'",
          "hint: as appropriate to mark resolution and make a commit.",
          "fatal: Exiting because of an unresolved conflict.",
        ].join("\n"),
      );
    }
    const arg = p.positional[0];
    if (!arg) return fail("fatal: No remote for the current branch.");
    const theirs = tryResolve(world, repo, arg);
    if (!theirs) return fail(`merge: ${arg} - not something we can merge`);
    const label = arg.startsWith("origin/")
      ? `remote-tracking branch '${arg}'`
      : repo.branches[arg]
        ? `branch '${arg}'`
        : `commit '${arg}'`;
    const branch = currentBranch(repo);
    const into = branch && branch !== "main" && branch !== "master" ? ` into ${branch}` : "";
    const message = value(p, "-m") ?? `Merge ${label}${into}`;
    return mergeInto(world, repo, theirs, arg, message, `merge ${arg}`, {
      noFf: has(p, "--no-ff"),
      ffOnly: has(p, "--ff-only"),
    });
  },

  rebase(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, []);
    if (has(p, "-i", "--interactive"))
      return fail("error: interactive rebase isn't part of this sandbox.");
    const op = repo.op;
    if (has(p, "--abort")) {
      if (op?.kind !== "rebase") return fail("fatal: No rebase in progress?");
      const tree = getCommit(world, op.origHead).tree;
      hardReset(world, repo, tree);
      if (op.branch) {
        repo.branches[op.branch] = op.origHead;
        repo.head = { branch: op.branch };
      } else repo.head = { detached: op.origHead };
      logReflog(
        repo,
        `${op.action} (abort): returning to ${op.branch ? `refs/heads/${op.branch}` : op.origHead}`,
      );
      repo.op = null;
      return "";
    }
    if (has(p, "--continue")) {
      if (op?.kind !== "rebase") return fail("fatal: No rebase in progress?");
      if (Object.keys(repo.conflicts).length) {
        return fail(
          [
            ...Object.keys(repo.conflicts).map((path) => `${path}: needs merge`),
            "You must edit all merge conflicts and then",
            "mark them as resolved using git add",
          ].join("\n"),
        );
      }
      const pending = dirtyPaths(world, repo).filter(
        (path) => repo.index[path] !== repo.work[path],
      );
      if (pending.length) {
        return fail(
          "error: cannot continue: You have unstaged changes.\nhint: Stage them with 'git add', or stash them.",
        );
      }
      let committed = "";
      if (op.current && !sameTree(headTree(world, repo), repo.index)) {
        const original = getCommit(world, op.current);
        const before = headTree(world, repo);
        const commit = makeCommit(world, [headId(repo)!], repo.index, original.message);
        setHeadCommit(repo, commit.id);
        logReflog(repo, `${op.action} (continue): ${subject(original.message)}`);
        committed = `${commitLine(repo, commit, false)}\n${commitSummary(before, commit.tree)}\n`;
      }
      op.current = null;
      try {
        return committed + continueRebase(world, repo, op);
      } catch (e) {
        if (e instanceof GitError) return fail(committed + e.message);
        throw e;
      }
    }
    if (has(p, "--skip")) {
      if (op?.kind !== "rebase") return fail("fatal: No rebase in progress?");
      hardReset(world, repo, headTree(world, repo));
      op.current = null;
      return continueRebase(world, repo, op);
    }
    if (op) return fail("fatal: It seems that there is already a rebase-merge directory.");
    const arg = p.positional[0];
    if (!arg) {
      const branch = currentBranch(repo);
      const up = branch ? repo.upstream[branch] : undefined;
      if (!up)
        return fail(
          "There is no tracking information for the current branch.\nPlease specify which branch you want to rebase against.",
        );
      return startRebase(world, repo, `origin/${up}`, "rebase");
    }
    return startRebase(world, repo, arg, "rebase");
  },

  "cherry-pick"(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, []);
    const op = repo.op;
    if (has(p, "--abort")) {
      if (op?.kind !== "cherry-pick")
        return fail("error: no cherry-pick or revert in progress\nfatal: cherry-pick failed");
      hardReset(world, repo, headTree(world, repo));
      repo.op = null;
      return "";
    }
    if (has(p, "--continue")) {
      if (op?.kind !== "cherry-pick")
        return fail("error: no cherry-pick or revert in progress\nfatal: cherry-pick failed");
      return git["commit"]!(world, repo, []);
    }
    if (op)
      return fail(
        'error: cherry-pick is already in progress\nhint: try "git cherry-pick (--continue | --abort)"\nfatal: cherry-pick failed',
      );
    const arg = p.positional[0];
    if (!arg) return fail("fatal: empty commit set passed");
    const pick = getCommit(
      world,
      tryResolve(world, repo, arg) ?? fail(`fatal: bad revision '${arg}'`),
    );
    const parent = pick.parents[0] ? getCommit(world, pick.parents[0]).tree : {};
    requireCleanFor(world, repo, pick.tree, parent);
    const before = headTree(world, repo);
    const merged = mergeTrees(
      parent,
      before,
      pick.tree,
      "HEAD",
      `${short(pick.id)} (${subject(pick.message)})`,
    );
    applyMergedTree(repo, merged);
    if (merged.conflicts.length) {
      repo.op = { kind: "cherry-pick", commit: pick.id };
      return fail(
        [
          ...merged.messages,
          `error: could not apply ${short(pick.id)}... ${subject(pick.message)}`,
          "hint: After resolving the conflicts, mark them with",
          'hint: "git add/rm <pathspec>", then run',
          'hint: "git cherry-pick --continue".',
          'hint: You can instead skip this commit with "git cherry-pick --skip".',
          'hint: To abort and get back to the state before "git cherry-pick",',
          'hint: run "git cherry-pick --abort".',
        ].join("\n"),
      );
    }
    const commit = commitIndex(world, repo, pick.message, [headId(repo)!], "cherry-pick");
    return [
      ...merged.messages,
      commitLine(repo, commit, false),
      commitSummary(before, commit.tree),
    ].join("\n");
  },

  revert(world, repo, args) {
    requireRepo(repo);
    const p = parseArgs(args, ["-m", "--mainline"]);
    const op = repo.op;
    if (has(p, "--abort")) {
      if (op?.kind !== "revert")
        return fail("error: no cherry-pick or revert in progress\nfatal: revert failed");
      hardReset(world, repo, headTree(world, repo));
      repo.op = null;
      return "";
    }
    if (has(p, "--continue")) {
      if (op?.kind !== "revert")
        return fail("error: no cherry-pick or revert in progress\nfatal: revert failed");
      return git["commit"]!(world, repo, []);
    }
    const arg = p.positional[0];
    if (!arg) return fail("fatal: empty commit set passed");
    const target = getCommit(
      world,
      tryResolve(world, repo, arg) ?? fail(`fatal: bad revision '${arg}'`),
    );
    const mainline = value(p, "-m", "--mainline");
    if (target.parents.length > 1 && !mainline) {
      return fail(
        `error: commit ${target.id} is a merge but no -m option was given.\nfatal: revert failed`,
      );
    }
    if (target.parents.length < 2 && mainline) {
      return fail(
        `error: mainline was specified but commit ${target.id} is not a merge.\nfatal: revert failed`,
      );
    }
    const parentId = target.parents[mainline ? Number(mainline) - 1 : 0];
    if (mainline && !parentId)
      return fail(
        `error: commit ${target.id} does not have parent ${mainline}\nfatal: revert failed`,
      );
    const parentTree = parentId ? getCommit(world, parentId).tree : {};
    requireCleanFor(world, repo, parentTree, target.tree);
    const message = `Revert "${subject(target.message)}"\n\nThis reverts commit ${target.id}${
      target.parents.length > 1 ? `, reversing\nchanges made to ${parentId}` : ""
    }.`;
    const before = headTree(world, repo);
    const merged = mergeTrees(
      target.tree,
      before,
      parentTree,
      "HEAD",
      `parent of ${short(target.id)} (${subject(target.message)})`,
    );
    applyMergedTree(repo, merged);
    if (merged.conflicts.length) {
      repo.op = { kind: "revert", commit: target.id, message };
      return fail(
        [
          ...merged.messages,
          `error: could not revert ${short(target.id)}... ${subject(target.message)}`,
          "hint: After resolving the conflicts, mark them with",
          'hint: "git add/rm <pathspec>", then run',
          'hint: "git revert --continue".',
          'hint: You can instead skip this commit with "git revert --skip".',
          'hint: To abort and get back to the state before "git revert",',
          'hint: run "git revert --abort".',
        ].join("\n"),
      );
    }
    if (sameTree(before, repo.index)) {
      return fail(
        `On branch ${currentBranch(repo) ?? "HEAD"}\nnothing to commit, working tree clean`,
      );
    }
    const commit = commitIndex(world, repo, message, [headId(repo)!], "revert");
    return [
      ...merged.messages,
      commitLine(repo, commit, false),
      commitSummary(before, commit.tree),
    ].join("\n");
  },

  stash(world, repo, args) {
    requireRepo(repo);
    const [sub, ...rest] = args[0] && !args[0].startsWith("-") ? args : ["push", ...args];
    const p = parseArgs(rest, ["-m", "--message"]);
    const ref = (n: number) => `stash@{${n}}`;
    const pick = () => {
      const arg = p.positional[0];
      const n = arg ? Number(/^(?:stash@\{)?(\d+)\}?$/.exec(arg)?.[1] ?? NaN) : 0;
      const entry = repo.stash[n];
      if (!entry)
        return fail(arg ? `error: ${arg} is not a valid reference` : "No stash entries found.");
      return { n, entry };
    };
    switch (sub) {
      case "push":
      case "save": {
        const head = headId(repo);
        if (!head) return fail("You do not have the initial commit yet");
        if (Object.keys(repo.conflicts).length) {
          return fail(
            `${Object.keys(repo.conflicts)
              .map((path) => `${path}: needs merge`)
              .join("\n")}\nerror: could not write index`,
          );
        }
        const { untracked } = statusOf(world, repo);
        const withUntracked = has(p, "-u", "--include-untracked");
        const dirty = dirtyPaths(world, repo);
        if (!dirty.length && !(withUntracked && untracked.length))
          return "No local changes to save";
        const branch = currentBranch(repo) ?? "(no branch)";
        const tip = getCommit(world, head);
        const message = value(p, "-m", "--message");
        const label = message
          ? `On ${branch}: ${message}`
          : `WIP on ${branch}: ${short(head)} ${subject(tip.message)}`;
        const stashedUntracked: Tree = {};
        if (withUntracked) for (const path of untracked) stashedUntracked[path] = repo.work[path]!;
        const trackedWork: Tree = {};
        for (const path of Object.keys(repo.index))
          if (repo.work[path] !== undefined) trackedWork[path] = repo.work[path]!;
        repo.stash.unshift({
          base: head,
          branch,
          message: label,
          index: { ...repo.index },
          work: trackedWork,
          untracked: stashedUntracked,
        });
        hardReset(world, repo, tip.tree);
        for (const path of Object.keys(stashedUntracked)) delete repo.work[path];
        logReflog(repo, "reset: moving to HEAD");
        return `Saved working directory and index state ${label}`;
      }
      case "list":
        return repo.stash.map((s, i) => `${ref(i)}: ${s.message}`).join("\n");
      case "drop": {
        const { n, entry } = pick();
        repo.stash.splice(n, 1);
        return `Dropped ${p.positional[0] ?? `refs/${ref(n)}`} (${stashId(entry)})`;
      }
      case "clear":
        repo.stash = [];
        return "";
      case "show": {
        const { entry } = pick();
        return treeDiff(getCommit(world, entry.base).tree, entry.work);
      }
      case "apply":
      case "pop": {
        const { n, entry } = pick();
        const clash = Object.keys(entry.untracked).filter((path) => repo.work[path] !== undefined);
        if (clash.length) {
          return fail(
            `${clash.map((path) => `${path} already exists, no checkout`).join("\n")}\nerror: could not restore untracked files from stash`,
          );
        }
        const base = getCommit(world, entry.base).tree;
        const touched = Object.keys({ ...base, ...entry.work }).filter(
          (path) => base[path] !== entry.work[path],
        );
        const dirty = new Set(dirtyPaths(world, repo));
        const blocked = touched.filter((path) => dirty.has(path));
        if (blocked.length) {
          return fail(
            [
              "error: Your local changes to the following files would be overwritten by merge:",
              ...blocked.map((path) => `\t${path}`),
              "Please commit your changes or stash them before you merge.",
              "Aborting",
            ].join("\n"),
          );
        }
        const current = headTree(world, repo);
        const merged = mergeTrees(base, current, entry.work, "Updated upstream", "Stashed changes");
        for (const path of touched) {
          const content = merged.tree[path];
          if (content === undefined) {
            delete repo.work[path];
            delete repo.index[path];
          } else {
            repo.work[path] = content;
            // New files the stash had staged come back staged; edits come back unstaged.
            if (current[path] === undefined && entry.index[path] !== undefined)
              repo.index[path] = content;
          }
        }
        for (const [path, content] of Object.entries(entry.untracked)) repo.work[path] = content;
        const lines: string[] = [...merged.messages];
        if (merged.conflicts.length) {
          conflictStop(repo, merged.conflicts);
          const status = git["status"]!(world, repo, []);
          lines.push(status, "The stash entry is kept in case you need it again.");
          return fail(lines.join("\n"));
        }
        lines.push(git["status"]!(world, repo, []));
        if (sub === "pop") {
          repo.stash.splice(n, 1);
          lines.push(`Dropped ${p.positional[0] ?? `refs/${ref(n)}`} (${stashId(entry)})`);
        }
        return lines.join("\n");
      }
      default:
        return fail(`error: unknown subcommand: \`${sub}'`);
    }
  },

  reflog(world, repo, args) {
    requireRepo(repo);
    const rest = args[0] === "show" ? args.slice(1) : args;
    const p = parseArgs(rest, ["-n", "--max-count"]);
    const limit = Number(value(p, "-n", "--max-count") ?? Infinity);
    return [...repo.reflog]
      .reverse()
      .slice(0, limit)
      .map((entry, i) => `${short(entry.id)} HEAD@{${i}}: ${entry.message}`)
      .join("\n");
  },

  remote(world, repo, args) {
    requireRepo(repo);
    const [sub, name, url] = args;
    if (sub === "add") {
      if (repo.hasOrigin) return fail(`error: remote ${name} already exists.`);
      if (name !== "origin")
        return fail("error: this sandbox has one remote, and it's called origin.");
      if (!url) return fail("usage: git remote add <name> <url>");
      repo.hasOrigin = true;
      if (!world.remote.url) world.remote.url = url;
      return "";
    }
    if (!repo.hasOrigin) return "";
    if (sub === "-v")
      return `origin\t${world.remote.url} (fetch)\norigin\t${world.remote.url} (push)`;
    return "origin";
  },

  fetch(world, repo) {
    requireRepo(repo);
    requireOrigin(repo);
    return fetchInto(world, repo);
  },

  pull(world, repo, args) {
    requireRepo(repo);
    requireOrigin(repo);
    const p = parseArgs(args, []);
    const branch = currentBranch(repo);
    if (!branch)
      return fail(
        "You are not currently on a branch.\nPlease specify which branch you want to merge with.",
      );
    const fetched = fetchInto(world, repo);
    const remoteBranch = p.positional[1] ?? repo.upstream[branch];
    const out: string[] = fetched ? [fetched] : [];
    const print = (text: string) => [...out, text].filter(Boolean).join("\n");
    if (!remoteBranch) {
      return fail(
        print(
          [
            "There is no tracking information for the current branch.",
            "Please specify which branch you want to merge with.",
            "",
            `    git branch --set-upstream-to=origin/<branch> ${branch}`,
          ].join("\n"),
        ),
      );
    }
    const theirs = repo.remoteRefs[remoteBranch];
    if (!theirs) return fail(print(`fatal: couldn't find remote ref ${remoteBranch}`));
    const ours = headId(repo);
    const rebase = has(p, "--rebase", "-r")
      ? true
      : has(p, "--no-rebase")
        ? false
        : configValue(world, repo, "pull.rebase");
    try {
      if (ours && isAncestor(world, theirs, ours)) return print("Already up to date.");
      const canFf = !ours || isAncestor(world, ours, theirs);
      if (rebase === true || rebase === "true") {
        if (canFf)
          return print(
            mergeInto(world, repo, theirs, `origin/${remoteBranch}`, "", "pull", { ffOnly: true }),
          );
        return print(startRebase(world, repo, theirs, "pull --rebase", `origin/${remoteBranch}`));
      }
      if (rebase === undefined && !canFf) {
        return fail(
          print(
            [
              "hint: You have divergent branches and need to specify how to reconcile them.",
              "hint: You can do so by running one of the following commands sometime before",
              "hint: your next pull:",
              "hint: ",
              "hint:   git config pull.rebase false  # merge",
              "hint:   git config pull.rebase true   # rebase",
              "hint:   git config pull.ff only       # fast-forward only",
              "hint: ",
              'hint: You can replace "git config" with "git config --global" to set a default',
              "hint: preference for all repositories. You can also pass --rebase, --no-rebase,",
              "hint: or --ff-only on the command line to override the configured default per",
              "hint: invocation.",
              "fatal: Need to specify how to reconcile divergent branches.",
            ].join("\n"),
          ),
        );
      }
      const url = displayUrl(world.remote.url);
      return print(
        mergeInto(
          world,
          repo,
          theirs,
          theirs,
          `Merge branch '${remoteBranch}' of ${url}`,
          "pull",
          {},
        ),
      );
    } catch (e) {
      if (e instanceof GitError) return fail(print(e.message));
      throw e;
    }
  },

  push(world, repo, args) {
    requireRepo(repo);
    if (!repo.hasOrigin) return fail("fatal: No configured push destination.");
    const p = parseArgs(args, []);
    const setUpstream = has(p, "-u", "--set-upstream");
    const force = has(p, "-f", "--force");
    const lease = has(p, "--force-with-lease");
    const current = currentBranch(repo);
    const [remoteName, spec] = p.positional;
    if (remoteName && remoteName !== "origin")
      return fail(`fatal: '${remoteName}' does not appear to be a git repository`);
    let local: string;
    let remoteBranch: string;
    if (spec) {
      const [l, r] = spec.includes(":") ? spec.split(":") : [spec, spec];
      local = l === "HEAD" ? (current ?? "HEAD") : l!;
      remoteBranch = r === "HEAD" ? (current ?? "HEAD") : r!;
    } else {
      if (!current) return fail("fatal: You are not currently on a branch.");
      const up = repo.upstream[current];
      if (!up && !remoteName) {
        return fail(
          [
            `fatal: The current branch ${current} has no upstream branch.`,
            "To push the current branch and set the remote as upstream, use",
            "",
            `    git push --set-upstream origin ${current}`,
            "",
            "To have this happen automatically for branches without a tracking",
            "upstream, see 'push.autoSetupRemote' in 'git help config'.",
          ].join("\n"),
        );
      }
      local = current;
      remoteBranch = up ?? current;
    }
    const id = resolve(world, repo, local).toString();
    const remoteTip = world.remote.branches[remoteBranch];
    const url = world.remote.url;
    const lines = [`To ${url}`];
    const pad = (s: string) => s.padEnd(18);
    if (remoteTip === id) {
      if (setUpstream) repo.upstream[local] = remoteBranch;
      repo.remoteRefs[remoteBranch] = id;
      return "Everything up-to-date";
    }
    const fastForward = !remoteTip || isAncestor(world, remoteTip, id);
    if (!fastForward && lease && repo.remoteRefs[remoteBranch] !== remoteTip) {
      lines.push(
        ` ! ${pad("[rejected]")}${local} -> ${remoteBranch} (stale info)`,
        `error: failed to push some refs to '${url}'`,
      );
      return fail(lines.join("\n"));
    }
    if (!fastForward && !force && !lease) {
      const known = repo.remoteRefs[remoteBranch] === remoteTip;
      lines.push(
        ` ! ${pad("[rejected]")}${local} -> ${remoteBranch} (${known ? "non-fast-forward" : "fetch first"})`,
        `error: failed to push some refs to '${url}'`,
        ...(known
          ? [
              "hint: Updates were rejected because the tip of your current branch is behind",
              "hint: its remote counterpart. Integrate the remote changes (e.g.",
              "hint: 'git pull ...') before pushing again.",
              "hint: See the 'Note about fast-forwards' in 'git push --help' for details.",
            ]
          : [
              "hint: Updates were rejected because the remote contains work that you do",
              "hint: not have locally. This is usually caused by another repository pushing",
              "hint: to the same ref. You may want to first integrate the remote changes",
              "hint: (e.g., 'git pull ...') before pushing again.",
              "hint: See the 'Note about fast-forwards' in 'git push --help' for details.",
            ]),
      );
      return fail(lines.join("\n"));
    }
    if (!remoteTip) lines.push(` * ${pad("[new branch]")}${local} -> ${remoteBranch}`);
    else if (fastForward)
      lines.push(`   ${short(remoteTip)}..${short(id)}  ${local} -> ${remoteBranch}`);
    else
      lines.push(
        ` + ${short(remoteTip)}...${short(id)} ${local} -> ${remoteBranch} (forced update)`,
      );
    world.remote.branches[remoteBranch] = id;
    repo.remoteRefs[remoteBranch] = id;
    if (setUpstream) {
      repo.upstream[local] = remoteBranch;
      lines.push(`branch '${local}' set up to track 'origin/${remoteBranch}'.`);
    }
    return lines.join("\n");
  },

  clone() {
    return fail(
      "This sandbox already has your repository in it, so there's nothing to clone here.",
    );
  },
};

function stashId(entry: Stash): string {
  return hash40(`stash\0${entry.message}\0${serialiseTree(entry.work)}`);
}

function unstagedAfterReset(world: World, repo: Repo): string {
  const lines = Object.keys(repo.index)
    .filter((path) => repo.work[path] !== repo.index[path])
    .sort()
    .map((path) => `${repo.work[path] === undefined ? "D" : "M"}\t${path}`);
  return lines.length ? `Unstaged changes after reset:\n${lines.join("\n")}` : "";
}

function requireOrigin(repo: Repo) {
  if (!repo.hasOrigin) {
    fail(
      "fatal: 'origin' does not appear to be a git repository\nfatal: Could not read from remote repository.\n\nPlease make sure you have the correct access rights\nand the repository exists.",
    );
  }
}

function requireCleanFor(world: World, repo: Repo, a: Tree, b: Tree) {
  const touched = new Set(Object.keys({ ...a, ...b }).filter((path) => a[path] !== b[path]));
  const blocked = dirtyPaths(world, repo).filter((path) => touched.has(path));
  if (blocked.length) {
    fail(
      [
        "error: Your local changes to the following files would be overwritten by merge:",
        ...blocked.map((path) => `\t${path}`),
        "Please commit your changes or stash them before you merge.",
        "Aborting",
      ].join("\n"),
    );
  }
}

function applyMergedTree(repo: Repo, merged: TreeMerge) {
  const conflicted = new Set(merged.conflicts);
  const untracked: Tree = {};
  for (const [path, content] of Object.entries(repo.work)) {
    if (repo.index[path] === undefined) untracked[path] = content;
  }
  const index: Tree = {};
  for (const [path, content] of Object.entries(merged.tree)) {
    // A conflicted path keeps our version in the index until it's resolved.
    if (conflicted.has(path)) {
      if (repo.index[path] !== undefined) index[path] = repo.index[path]!;
    } else index[path] = content;
  }
  repo.index = index;
  repo.work = { ...untracked, ...merged.tree };
  conflictStop(repo, merged.conflicts);
}

function fromName(repo: Repo): string {
  return "detached" in repo.head ? repo.head.detached : repo.head.branch;
}

function orphanWarning(world: World, repo: Repo, leaving: string, target: string): string | null {
  const reachable = new Set<string>();
  for (const id of [...Object.values(repo.branches), ...Object.values(repo.remoteRefs), target]) {
    for (const a of ancestors(world, id)) reachable.add(a);
  }
  const lost = commitsBetween(world, leaving, null)
    .filter((c) => !reachable.has(c.id))
    .reverse();
  if (!lost.length) return null;
  const n = lost.length;
  return [
    `Warning: you are leaving ${plural(n, "commit", "commits")} behind, not connected to`,
    `any of your branches:`,
    "",
    ...lost.slice(0, 4).map((c) => `  ${short(c.id)} ${subject(c.message)}`),
    "",
    "If you want to keep it by creating a new branch, this may be a good time",
    "to do so with:",
    "",
    ` git branch <new-branch-name> ${short(lost[0]!.id)}`,
    "",
  ].join("\n");
}

function switchTo(world: World, repo: Repo, branch: string): string {
  const current = currentBranch(repo);
  if (current === branch) return `Already on '${branch}'`;
  if (repo.op)
    return fail(
      `fatal: cannot switch branch while ${repo.op.kind === "rebase" ? "rebasing" : repo.op.kind === "merge" ? "merging" : repo.op.kind === "revert" ? "reverting" : "cherry-picking"}\nConsider "git ${repo.op.kind} --abort".`,
    );
  const target = repo.branches[branch]!;
  const next = carryOver(world, repo, getCommit(world, target).tree, "checkout");
  const leaving = "detached" in repo.head ? repo.head.detached : null;
  const warning = leaving ? orphanWarning(world, repo, leaving, target) : null;
  const from = fromName(repo);
  repo.previous = current ?? repo.previous;
  repo.work = next.work;
  repo.index = next.index;
  repo.head = { branch };
  logReflog(repo, `checkout: moving from ${from} to ${branch}`);
  const tracking = trackingLine(world, repo, branch);
  const changed = statusOf(world, repo).entries.map((e) => `M\t${e.path}`);
  return [warning, ...changed, `Switched to branch '${branch}'`, tracking]
    .filter(Boolean)
    .join("\n");
}

function createAndSwitch(
  world: World,
  repo: Repo,
  name: string,
  start: string | undefined,
  reflog: string,
): string {
  if (repo.branches[name]) return fail(`fatal: a branch named '${name}' already exists`);
  if (repo.op)
    return fail(
      `fatal: cannot switch branch while ${repo.op.kind === "rebase" ? "rebasing" : "merging"}`,
    );
  const at = start ? resolve(world, repo, start) : headId(repo);
  const current = currentBranch(repo);
  if (!at) {
    // An unborn branch just gets renamed.
    repo.head = { branch: name };
    return `Switched to a new branch '${name}'`;
  }
  const next = carryOver(world, repo, getCommit(world, at).tree, "checkout");
  repo.previous = current ?? repo.previous;
  repo.branches[name] = at;
  repo.work = next.work;
  repo.index = next.index;
  repo.head = { branch: name };
  logReflog(repo, reflog);
  return `Switched to a new branch '${name}'`;
}

function detachAt(world: World, repo: Repo, arg: string, advice: boolean): string {
  const id = resolve(world, repo, arg);
  const next = carryOver(world, repo, getCommit(world, id).tree, "checkout");
  const from = fromName(repo);
  const leaving = "detached" in repo.head ? repo.head.detached : null;
  const warning = leaving && leaving !== id ? orphanWarning(world, repo, leaving, id) : null;
  const current = currentBranch(repo);
  repo.previous = current ?? repo.previous;
  repo.work = next.work;
  repo.index = next.index;
  repo.head = { detached: id };
  logReflog(repo, `checkout: moving from ${from} to ${arg}`);
  const c = getCommit(world, id);
  if (!current || !advice)
    return [warning, `HEAD is now at ${short(id)} ${subject(c.message)}`]
      .filter(Boolean)
      .join("\n");
  return [
    `Note: switching to '${arg}'.`,
    "",
    "You are in 'detached HEAD' state. You can look around, make experimental",
    "changes and commit them, and you can discard any commits you make in this",
    "state without impacting any branches by switching back to a branch.",
    "",
    "If you want to create a new branch to retain commits you create, you may",
    "do so (now or later) by using -c with the switch command. Example:",
    "",
    "  git switch -c <new-branch-name>",
    "",
    "Or undo this operation with:",
    "",
    "  git switch -",
    "",
    "Turn off this advice by setting config variable advice.detachedHead to false",
    "",
    `HEAD is now at ${short(id)} ${subject(c.message)}`,
  ].join("\n");
}

function mergeInto(
  world: World,
  repo: Repo,
  theirs: string,
  label: string,
  message: string,
  reflog: string,
  options: { noFf?: boolean; ffOnly?: boolean },
): string {
  const ours = headId(repo);
  const theirsTree = getCommit(world, theirs).tree;
  if (ours && isAncestor(world, theirs, ours)) return "Already up to date.";
  if (!ours || (isAncestor(world, ours, theirs) && !options.noFf)) {
    const before = headTree(world, repo);
    const updating = `Updating ${ours ? short(ours) : "0000000"}..${short(theirs)}`;
    let next: { work: Tree; index: Tree };
    try {
      next = carryOver(world, repo, theirsTree, "merge");
    } catch (e) {
      if (e instanceof GitError) return fail(`${updating}\n${e.message}`);
      throw e;
    }
    repo.work = next.work;
    repo.index = next.index;
    setHeadCommit(repo, theirs);
    logReflog(repo, `${reflog}: Fast-forward`);
    return [updating, "Fast-forward", diffStat(before, theirsTree)].filter(Boolean).join("\n");
  }
  if (options.ffOnly) return fail("fatal: Not possible to fast-forward, aborting.");
  const base = mergeBase(world, ours, theirs);
  const baseTree = base ? getCommit(world, base).tree : {};
  const oursTree = headTree(world, repo);
  requireCleanFor(
    world,
    repo,
    oursTree,
    (() => {
      const merged = mergeTrees(baseTree, oursTree, theirsTree, "HEAD", label);
      return merged.tree;
    })(),
  );
  const merged = mergeTrees(baseTree, oursTree, theirsTree, "HEAD", label);
  applyMergedTree(repo, merged);
  if (merged.conflicts.length) {
    repo.op = { kind: "merge", mergeHead: theirs, message };
    return fail(
      [
        ...merged.messages,
        "Automatic merge failed; fix conflicts and then commit the result.",
      ].join("\n"),
    );
  }
  const commit = makeCommit(world, [ours, theirs], repo.index, message);
  setHeadCommit(repo, commit.id);
  logReflog(repo, `${reflog}: Merge made by the 'ort' strategy.`);
  return [...merged.messages, "Merge made by the 'ort' strategy.", diffStat(oursTree, commit.tree)]
    .filter(Boolean)
    .join("\n");
}

function startRebase(world: World, repo: Repo, arg: string, action: string, shownAs = arg): string {
  const onto = resolve(world, repo, arg);
  const { entries } = statusOf(world, repo);
  if (entries.some((e) => e.unstaged)) {
    return fail(
      "error: cannot rebase: You have unstaged changes.\nerror: Please commit or stash them.",
    );
  }
  if (entries.some((e) => e.staged)) {
    return fail(
      "error: cannot rebase: Your index contains uncommitted changes.\nerror: Please commit or stash them.",
    );
  }
  const head = headId(repo);
  if (!head) return fail("fatal: no commits to rebase");
  const branch = currentBranch(repo);
  const base = mergeBase(world, head, onto);
  if (base === onto) return `Current branch ${branch ?? "HEAD"} is up to date.`;
  const todo = commitsBetween(world, head, onto)
    .filter((c) => c.parents.length < 2)
    .map((c) => c.id);
  const next = carryOver(world, repo, getCommit(world, onto).tree, "checkout");
  repo.work = next.work;
  repo.index = next.index;
  repo.head = { detached: onto };
  logReflog(repo, `${action} (start): checkout ${action === "pull --rebase" ? onto : shownAs}`);
  const op: Extract<Op, { kind: "rebase" }> = {
    kind: "rebase",
    branch,
    origHead: head,
    onto,
    todo,
    done: [],
    current: null,
    action,
  };
  repo.op = op;
  return continueRebase(world, repo, op);
}

function continueRebase(world: World, repo: Repo, op: Extract<Op, { kind: "rebase" }>): string {
  while (op.todo.length) {
    const id = op.todo.shift()!;
    op.done.push(id);
    const pick = getCommit(world, id);
    const parent = pick.parents[0] ? getCommit(world, pick.parents[0]).tree : {};
    const ours = headTree(world, repo);
    const merged = mergeTrees(
      parent,
      ours,
      pick.tree,
      "HEAD",
      `${short(pick.id)} (${subject(pick.message)})`,
    );
    if (merged.conflicts.length) {
      applyMergedTree(repo, merged);
      op.current = id;
      return fail(
        [
          ...merged.messages,
          `error: could not apply ${short(pick.id)}... ${subject(pick.message)}`,
          "hint: Resolve all conflicts manually, mark them as resolved with",
          'hint: "git add/rm <conflicted_files>", then run "git rebase --continue".',
          'hint: You can instead skip this commit: run "git rebase --skip".',
          'hint: To abort and get back to the state before "git rebase", run "git rebase --abort".',
          `Could not apply ${short(pick.id)}... ${subject(pick.message)}`,
        ].join("\n"),
      );
    }
    if (sameTree(merged.tree, ours)) continue;
    repo.index = { ...merged.tree };
    for (const path of Object.keys({ ...ours, ...merged.tree })) {
      if (merged.tree[path] === undefined) delete repo.work[path];
      else repo.work[path] = merged.tree[path]!;
    }
    const commit = makeCommit(world, [headId(repo)!], merged.tree, pick.message);
    repo.head = { detached: commit.id };
    logReflog(repo, `${op.action} (pick): ${subject(pick.message)}`);
  }
  const tip = headId(repo)!;
  if (op.branch) {
    repo.branches[op.branch] = tip;
    repo.head = { branch: op.branch };
  }
  logReflog(
    repo,
    `${op.action} (finish): returning to ${op.branch ? `refs/heads/${op.branch}` : tip}`,
  );
  repo.op = null;
  return `Successfully rebased and updated ${op.branch ? `refs/heads/${op.branch}` : "detached HEAD"}.`;
}

function fetchInto(world: World, repo: Repo): string {
  const lines: string[] = [];
  const names = Object.keys(world.remote.branches).sort();
  const width = Math.max(10, ...names.map((n) => n.length));
  for (const name of names) {
    const tip = world.remote.branches[name]!;
    const known = repo.remoteRefs[name];
    if (known === tip) continue;
    const range = !known
      ? ` * ${"[new branch]".padEnd(18)}`
      : isAncestor(world, known, tip)
        ? `   ${short(known)}..${short(tip)}  `
        : ` + ${short(known)}...${short(tip)} `;
    lines.push(
      `${range}${name.padEnd(width)} -> origin/${name}${known && !isAncestor(world, known, tip) ? "  (forced update)" : ""}`,
    );
    repo.remoteRefs[name] = tip;
  }
  const url = world.remote.url;
  return lines.length ? [`From ${displayUrl(url)}`, ...lines].join("\n") : "";
}

/** How git names a remote in "From …" and in pull merge messages. */
function displayUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^git@/, "")
    .replace(/\.git$/, "");
}

/** The ignored path git reports: the highest ignored directory, or the file itself. */
function ignoredPrefix(repo: Repo, path: string): string {
  const parts = path.split("/");
  for (let i = 1; i < parts.length; i++) {
    const prefix = parts.slice(0, i).join("/");
    if (isIgnored(repo, `${prefix}/x`)) return prefix;
  }
  return path;
}

function decorations(repo: Repo, id: string): string {
  const parts: string[] = [];
  const current = currentBranch(repo);
  if ("detached" in repo.head && repo.head.detached === id) parts.push("HEAD");
  if (current && repo.branches[current] === id) parts.push(`HEAD -> ${current}`);
  for (const name of Object.keys(repo.branches).sort()) {
    if (name !== current && repo.branches[name] === id) parts.push(name);
  }
  for (const name of Object.keys(repo.remoteRefs).sort()) {
    if (repo.remoteRefs[name] === id) parts.push(`origin/${name}`);
  }
  return parts.join(", ");
}

/**
 * Git's `--topo-order`, which `--graph` implies: newest first, but one line of
 * history at a time, and after a merge its second parent's line first.
 */
function topoOrder(commits: Commit[]): Commit[] {
  const inSet = new Map(commits.map((c) => [c.id, c]));
  const children = new Map<string, number>();
  for (const c of commits) {
    for (const p of c.parents) if (inSet.has(p)) children.set(p, (children.get(p) ?? 0) + 1);
  }
  const stack = commits.filter((c) => !children.get(c.id)).sort((x, y) => x.seq - y.seq);
  const out: Commit[] = [];
  while (stack.length) {
    const c = stack.pop()!;
    out.push(c);
    for (const p of c.parents) {
      if (!inSet.has(p)) continue;
      const left = children.get(p)! - 1;
      children.set(p, left);
      if (left === 0) stack.push(inSet.get(p)!);
    }
  }
  return out;
}

/** `--graph`: one lane per line of history, drawn the way git draws simple shapes. */
function drawGraph(commits: Commit[], text: (c: Commit) => string[]): string[] {
  const out: string[] = [];
  let lanes: string[] = [];
  const row = (marks: string[]) => marks.join(" ").trimEnd();
  for (const c of topoOrder(commits)) {
    // Lanes waiting for the same commit join before it is drawn.
    const waiting = lanes.map((l, i) => (l === c.id ? i : -1)).filter((i) => i >= 0);
    if (waiting.length > 1) {
      const keep = waiting[0]!;
      const joins = waiting.slice(1);
      out.push(row(lanes.map((_, i) => (joins.includes(i) ? "/" : "|"))).replace(/\| \//g, "|/"));
      lanes = lanes.filter((_, i) => !joins.includes(i));
      void keep;
    }
    let col = lanes.indexOf(c.id);
    if (col === -1) {
      lanes.push(c.id);
      col = lanes.length - 1;
    }
    const merge = c.parents.length > 1;
    const [first, ...body] = text(c);
    out.push(`${row(lanes.map((_, i) => (i === col ? "*" : "|")))}${merge ? "  " : ""} ${first}`);
    const next = [...lanes];
    const [p1, p2] = c.parents;
    if (p1) next[col] = p1;
    else next.splice(col, 1);
    if (merge && p2 && !next.includes(p2)) next.splice(col + 1, 0, p2);
    for (const line of body) out.push(`${row(next.map(() => "|"))} ${line}`.trimEnd());
    if (merge && p2 && next[col + 1] === p2 && !lanes.includes(p2)) {
      out.push(row(next.map((_, i) => (i === col + 1 ? "\\" : "|"))).replace(/\| \\/g, "|\\"));
    }
    lanes = next;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The shell around git

function shell(world: World, repo: Repo, tokens: string[]): LineResult {
  const [cmd, ...args] = tokens;
  switch (cmd) {
    case "ls": {
      const all = args.includes("-a") || args.includes("-la") || args.includes("-al");
      const dir = args.find((a) => !a.startsWith("-"))?.replace(/\/$/, "");
      const prefix = dir ? `${dir}/` : "";
      const names = new Set<string>();
      for (const path of Object.keys(repo.work)) {
        if (!path.startsWith(prefix)) continue;
        const rest = path.slice(prefix.length);
        const [head, ...more] = rest.split("/");
        names.add(more.length ? `${head}/` : head!);
      }
      if (dir && !names.size) return { output: `ls: ${dir}: No such file or directory`, ok: false };
      if (all && !dir && repo.initialized) names.add(".git/");
      return {
        output: [...names]
          .filter((n) => all || !n.startsWith("."))
          .sort()
          .join("  "),
        ok: true,
      };
    }
    case "cat": {
      const out: string[] = [];
      for (const path of args) {
        const content = repo.work[path];
        if (content === undefined) {
          const isDir = Object.keys(repo.work).some((p) =>
            p.startsWith(`${path.replace(/\/$/, "")}/`),
          );
          return {
            output: `cat: ${path}: ${isDir ? "Is a directory" : "No such file or directory"}`,
            ok: false,
          };
        }
        out.push(content.replace(/\n$/, ""));
      }
      return { output: out.join("\n"), ok: true };
    }
    case "echo": {
      const redirect = args.findIndex((a) => a === ">" || a === ">>");
      const words = redirect === -1 ? args : args.slice(0, redirect);
      const line = `${words.join(" ")}\n`;
      if (redirect === -1) return { output: line.trimEnd(), ok: true };
      const path = args[redirect + 1];
      if (!path) return { output: "sh: syntax error near unexpected token `newline'", ok: false };
      repo.work[path] = args[redirect] === ">>" ? (repo.work[path] ?? "") + line : line;
      return { output: "", ok: true };
    }
    case "touch":
      for (const path of args) repo.work[path] ??= "";
      return { output: "", ok: true };
    case "rm": {
      const recursive = args.some((a) => /^-[a-z]*r/.test(a));
      for (const path of args.filter((a) => !a.startsWith("-"))) {
        const clean = path.replace(/\/$/, "");
        if (repo.work[clean] !== undefined) delete repo.work[clean];
        else {
          const inside = Object.keys(repo.work).filter((p) => p.startsWith(`${clean}/`));
          if (!inside.length)
            return { output: `rm: ${path}: No such file or directory`, ok: false };
          if (!recursive) return { output: `rm: ${path}: is a directory`, ok: false };
          for (const p of inside) delete repo.work[p];
        }
      }
      return { output: "", ok: true };
    }
    case "mkdir":
      return { output: "", ok: true };
    case "pwd":
      return { output: `/home/you/shop`, ok: true };
    case "clear":
      return { output: "", ok: true, clear: true };
    case "help":
      return { output: HELP, ok: true };
    default:
      return { output: `sh: ${cmd}: command not found`, ok: false };
  }
}

export const SUPPORTED_GIT_COMMANDS = [
  "init",
  "status",
  "add",
  "rm",
  "commit",
  "log",
  "show",
  "diff",
  "branch",
  "switch",
  "checkout",
  "restore",
  "reset",
  "merge",
  "rebase",
  "cherry-pick",
  "revert",
  "stash",
  "reflog",
  "remote",
  "fetch",
  "pull",
  "push",
  "config",
];

const HELP = [
  "This is a practice model of git, not git itself. It understands:",
  `  git ${SUPPORTED_GIT_COMMANDS.join(", ")}`,
  '  ls, cat, echo "text" > file, echo "text" >> file, touch, rm, clear',
  "To change a file, open it from the file list and save, or use echo.",
].join("\n");

/** Runs one line against `world`. Setup scripts may use `@teammate` and `@write`; learners only `@write`. */
export function runLine(world: World, line: string, options: { setup?: boolean } = {}): LineResult {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return { output: "", ok: true };
  let repo = world.me;
  let rest = trimmed;
  if (rest.startsWith("@teammate ")) {
    if (!options.setup) return { output: "sh: @teammate: command not found", ok: false };
    repo = teammate(world);
    rest = rest.slice("@teammate ".length).trim();
  }
  if (rest.startsWith("@write ")) {
    const match = /^@write\s+(\S+)\s+(.*)$/s.exec(rest);
    if (!match) return { output: "@write: expected a path and a JSON string", ok: false };
    let content: unknown;
    try {
      content = JSON.parse(match[2]!);
    } catch {
      return { output: "@write: the content isn't a JSON string", ok: false };
    }
    if (typeof content !== "string")
      return { output: "@write: the content isn't a JSON string", ok: false };
    repo.work[match[1]!] = content;
    return { output: "", ok: true };
  }
  if (rest.startsWith("@"))
    return { output: `sh: ${rest.split(/\s/)[0]}: command not found`, ok: false };
  const outputs: string[] = [];
  let clear: true | undefined;
  for (const part of splitAnd(rest)) {
    let tokens: string[];
    try {
      tokens = tokenize(part);
    } catch (e) {
      return { output: [...outputs, (e as Error).message].join("\n"), ok: false };
    }
    if (!tokens.length) continue;
    if (tokens[0] !== "git") {
      const r = shell(world, repo, tokens);
      if (r.clear) clear = true;
      if (r.output) outputs.push(r.output);
      if (!r.ok) return { output: outputs.join("\n"), ok: false };
      continue;
    }
    const [sub, ...args] = tokens.slice(1);
    if (!sub || sub === "help" || sub === "--help") {
      outputs.push(HELP);
      continue;
    }
    const handler = git[sub];
    if (!handler || !Object.hasOwn(git, sub)) {
      outputs.push(
        `git ${sub} isn't part of this practice sandbox. It understands: ${SUPPORTED_GIT_COMMANDS.join(", ")}.`,
      );
      return { output: outputs.join("\n"), ok: false };
    }
    try {
      const out = handler(world, repo, args);
      if (out) outputs.push(out);
    } catch (e) {
      if (!(e instanceof GitError)) throw e;
      if (e.message) outputs.push(e.message);
      return { output: outputs.join("\n"), ok: false };
    }
  }
  return { output: outputs.join("\n"), ok: true, ...(clear ? { clear } : {}) };
}

function teammate(world: World): Repo {
  if (world.teammate) return world.teammate;
  const repo = emptyRepo();
  repo.initialized = true;
  repo.hasOrigin = true;
  repo.remoteRefs = { ...world.remote.branches };
  const main = world.remote.branches["main"] ? "main" : Object.keys(world.remote.branches)[0];
  if (main) {
    const id = world.remote.branches[main]!;
    repo.branches[main] = id;
    repo.upstream[main] = main;
    repo.head = { branch: main };
    repo.work = { ...getCommit(world, id).tree };
    repo.index = { ...repo.work };
    repo.reflog.push({ id, message: `clone: from ${world.remote.url}` });
  }
  world.teammate = repo;
  return repo;
}

// ---------------------------------------------------------------------------
// Scripts, transcripts and checks

export const splitScript = (script: string) => script.split("\n").map((l) => l.replace(/\r$/, ""));

/** Builds the scenario. A setup line may fail on purpose (a rejected push); that's part of the story. */
export function buildWorld(setup: string): World {
  const world = createWorld();
  for (const line of splitScript(setup)) runLine(world, line, { setup: true });
  return world;
}

export interface ReplayEntry {
  line: string;
  result: LineResult;
}

export function replay(
  setup: string,
  transcript: string,
): { world: World; entries: ReplayEntry[] } {
  const world = buildWorld(setup);
  const entries: ReplayEntry[] = [];
  for (const line of splitScript(transcript)) {
    if (!line.trim()) continue;
    entries.push({ line, result: runLine(world, line) });
  }
  return { world, entries };
}

/** Limits on what a server replays: generous for a lesson, small for a Worker. */
export const MAX_TRANSCRIPT_LINES = 400;
export const MAX_TRANSCRIPT_CHARS = 60_000;

export interface CheckResult {
  passed: boolean;
  detail: string | null;
}

function messagesIn(world: World, id: string | undefined): string[] {
  return id ? [...ancestors(world, id)].map((c) => subject(world.commits[c]!.message)) : [];
}

/**
 * A check is one line: a verb and its arguments. They describe the result, never
 * the commands, so any route that gets there passes.
 */
export function evaluateCheck(world: World, expression: string): CheckResult {
  // `a && b`: both must hold. Lets a goal carry the guard it depends on, so a
  // goal is never already met before the learner has done anything.
  const parts = expression.split(" && ");
  if (parts.length > 1) {
    for (const part of parts) {
      const result = evaluateCheck(world, part);
      if (!result.passed) return result;
    }
    return { passed: true, detail: null };
  }
  const repo = world.me;
  const [verb, ...args] = tokenize(expression);
  const rev = (r: string) => tryResolve(world, repo, r) ?? undefined;
  const at = (spec: string): { tree: Tree; label: string } | null => {
    const [where, path] = spec.includes(":")
      ? [spec.slice(0, spec.indexOf(":")), spec.slice(spec.indexOf(":") + 1)]
      : ["work", spec];
    if (where === "work") return { tree: repo.work, label: path! };
    if (where === "index") return { tree: repo.index, label: path! };
    if (where.startsWith("remote/")) {
      const id = world.remote.branches[where.slice(7)];
      return id ? { tree: world.commits[id]!.tree, label: path! } : null;
    }
    const id = rev(where);
    return id ? { tree: world.commits[id]!.tree, label: path! } : null;
  };
  const ok = (passed: boolean, detail: string): CheckResult => ({
    passed,
    detail: passed ? null : detail,
  });
  const a = args[0] ?? "";
  const b = args[1] ?? "";
  switch (verb) {
    case "on":
      return ok(currentBranch(repo) === a, `HEAD isn't on ${a}`);
    case "exists":
      return ok(Boolean(repo.branches[a]), `There's no branch called ${a}`);
    case "missing":
      return ok(!repo.branches[a], `${a} still exists`);
    case "has":
      return ok(messagesIn(world, rev(a)).includes(b), `${a} doesn't contain "${b}"`);
    case "lacks":
      return ok(!messagesIn(world, rev(a)).includes(b), `${a} still contains "${b}"`);
    case "tip": {
      const id = rev(a);
      return ok(
        Boolean(id) && subject(world.commits[id!]!.message) === b,
        `${a}'s latest commit isn't "${b}"`,
      );
    }
    case "same":
      return ok(Boolean(rev(a)) && rev(a) === rev(b), `${a} and ${b} point at different commits`);
    case "parents": {
      const id = rev(a);
      return ok(
        Boolean(id) && world.commits[id!]!.parents.length === Number(b),
        `${a} doesn't have ${b} parent(s)`,
      );
    }
    case "linear": {
      const id = rev(a);
      return ok(
        Boolean(id) && [...ancestors(world, id)].every((c) => world.commits[c]!.parents.length < 2),
        `${a}'s history has a merge commit`,
      );
    }
    case "ahead": {
      const from = rev(a);
      const base = rev(b);
      const n = from && base ? commitsBetween(world, from, base).length : -1;
      return ok(n === Number(args[2]), `${a} isn't ${args[2]} commit(s) ahead of ${b}`);
    }
    case "contains": {
      const place = at(a);
      return ok(
        Boolean(place) && (place!.tree[place!.label] ?? "").includes(b),
        `${a} doesn't contain "${b}"`,
      );
    }
    case "excludes": {
      const place = at(a);
      return ok(
        Boolean(place) && !(place!.tree[place!.label] ?? "").includes(b),
        `${a} still contains "${b}"`,
      );
    }
    case "exact": {
      const place = at(a);
      return ok(
        Boolean(place) && place!.tree[place!.label] === b.replace(/\\n/g, "\n"),
        `${a} isn't what it should be`,
      );
    }
    case "present": {
      const place = at(a);
      return ok(Boolean(place) && place!.tree[place!.label] !== undefined, `${a} doesn't exist`);
    }
    case "absent": {
      const place = at(a);
      const prefix = `${place?.label.replace(/\/$/, "")}/`;
      return ok(
        Boolean(place) &&
          place!.tree[place!.label] === undefined &&
          !Object.keys(place!.tree).some((p) => p.startsWith(prefix)),
        `${a} is still there`,
      );
    }
    case "clean": {
      const { entries, untracked, conflicted } = statusOf(world, repo);
      return ok(
        !entries.length && !untracked.length && !conflicted.length,
        "The working tree isn't clean",
      );
    }
    case "idle":
      return ok(
        !repo.op && !Object.keys(repo.conflicts).length,
        `A ${repo.op?.kind ?? "merge"} is still in progress`,
      );
    case "stashes":
      return ok(
        repo.stash.length === Number(a),
        `There ${repo.stash.length === 1 ? "is 1 stash" : `are ${repo.stash.length} stashes`}`,
      );
    case "ignored":
      return ok(isIgnored(repo, a), `${a} isn't ignored`);
    case "untracked":
      return ok(
        repo.index[a] === undefined &&
          !Object.keys(repo.index).some((p) => p.startsWith(`${a.replace(/\/$/, "")}/`)),
        `${a} is still tracked`,
      );
    case "tracked":
      return ok(repo.index[a] !== undefined, `${a} isn't tracked`);
    case "remote-has": {
      return ok(
        messagesIn(world, world.remote.branches[a]).includes(b),
        `origin's ${a} doesn't contain "${b}"`,
      );
    }
    case "remote-lacks":
      return ok(
        !messagesIn(world, world.remote.branches[a]).includes(b),
        `origin's ${a} still contains "${b}"`,
      );
    case "remote-same":
      return ok(
        Boolean(world.remote.branches[a]) && world.remote.branches[a] === rev(b),
        `origin's ${a} isn't where ${b} is`,
      );
    case "remote-linear": {
      const id = world.remote.branches[a];
      return ok(
        Boolean(id) && [...ancestors(world, id)].every((c) => world.commits[c]!.parents.length < 2),
        `origin's ${a} has a merge commit`,
      );
    }
    default:
      throw new Error(`Unknown sandbox check: ${verb}`);
  }
}

/** The shape every challenge engine hands back (runtime-shared's EngineOutcome). */
export function runGitChallenge(
  setup: string,
  transcript: string,
  tests: { name: string; expression: string }[],
): { logs: string[]; error: string | null; results: { passed: boolean; detail: string | null }[] } {
  if (
    transcript.length > MAX_TRANSCRIPT_CHARS ||
    splitScript(transcript).length > MAX_TRANSCRIPT_LINES
  ) {
    return {
      logs: [],
      error: "That session is too long to check. Reset the sandbox and try again.",
      results: tests.map(() => ({ passed: false, detail: null })),
    };
  }
  const { world } = replay(setup, transcript);
  return {
    logs: [],
    error: null,
    results: tests.map((t) => evaluateCheck(world, t.expression)),
  };
}

// ---------------------------------------------------------------------------
// What the UI draws

export interface GraphNode {
  id: string;
  short: string;
  subject: string;
  parents: string[];
  refs: string[];
  head: boolean;
  onRemoteOnly: boolean;
}

export interface SandboxView {
  prompt: string;
  nodes: GraphNode[];
  files: {
    path: string;
    status: "clean" | "modified" | "staged" | "new" | "untracked" | "conflict" | "ignored";
  }[];
  op: string | null;
  stashes: number;
}

export function viewOf(world: World): SandboxView {
  const repo = world.me;
  const tips = [
    headId(repo),
    ...Object.values(repo.branches),
    ...Object.values(repo.remoteRefs),
  ].filter(Boolean) as string[];
  const reachable = new Set<string>();
  for (const t of tips) for (const id of ancestors(world, t)) reachable.add(id);
  const head = headId(repo);
  const nodes = [...reachable]
    .map((id) => world.commits[id]!)
    .sort((a, b) => b.seq - a.seq)
    .map((c) => {
      const refs: string[] = [];
      for (const [name, id] of Object.entries(repo.branches)) if (id === c.id) refs.push(name);
      for (const [name, id] of Object.entries(repo.remoteRefs))
        if (id === c.id) refs.push(`origin/${name}`);
      return {
        id: c.id,
        short: short(c.id),
        subject: subject(c.message),
        parents: c.parents.filter((p) => reachable.has(p)),
        refs: refs.sort(),
        head: c.id === head,
        onRemoteOnly:
          !ancestors(world, head).has(c.id) &&
          !Object.values(repo.branches).some((b) => ancestors(world, b).has(c.id)),
      };
    });
  const { entries, untracked, conflicted } = statusOf(world, repo);
  const byPath = new Map(entries.map((e) => [e.path, e]));
  const files = Object.keys(repo.work)
    .sort()
    .map((path) => {
      const entry = byPath.get(path);
      const status = conflicted.includes(path)
        ? "conflict"
        : untracked.includes(path)
          ? "untracked"
          : repo.index[path] === undefined && headTree(world, repo)[path] === undefined
            ? "ignored"
            : entry?.unstaged
              ? "modified"
              : entry?.staged === "new file"
                ? "new"
                : entry?.staged
                  ? "staged"
                  : "clean";
      return { path, status } as SandboxView["files"][number];
    });
  const where = "detached" in repo.head ? short(repo.head.detached) : repo.head.branch;
  const op = repo.op
    ? repo.op.kind === "rebase"
      ? "REBASING"
      : repo.op.kind === "merge"
        ? "MERGING"
        : repo.op.kind.toUpperCase()
    : null;
  return {
    prompt: repo.initialized ? `shop (${where}${op ? `|${op}` : ""})` : "shop",
    nodes,
    files,
    op,
    stashes: repo.stash.length,
  };
}
