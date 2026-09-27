/**
 * Checks the git sandbox against real git:
 *
 *   bun run git:verify
 *
 * Every git challenge's setup plus its reference solution, and a set of extra
 * scenarios below, run twice: through `src/lib/git-sandbox.ts` and through the
 * git on this machine, in a temp directory with a bare "origin" and a second
 * clone for `@teammate`. After each line the two must agree on whether the
 * command succeeded; at the end they must agree on HEAD, every branch and
 * remote branch (compared by the shape of history, since ids differ), the
 * working tree, the index, conflicted paths, the stash and the reflog.
 *
 * Needs `git` on PATH. It is not part of `bun test` for that reason.
 */
import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { bodies } from "../src/content/lesson-bodies.server";
import {
  buildWorld,
  createWorld,
  runLine,
  splitScript,
  type Repo,
  type World,
} from "../src/lib/git-sandbox";

interface Scenario {
  name: string;
  setup: string;
  transcript: string;
}

const REMOTE_URL = "git@github.com:you/shop.git";

/** Extra behaviour the challenges don't reach, each checked against real git. */
const EXTRA: Scenario[] = [
  {
    name: "status, add, commit, amend",
    setup: "git init",
    transcript: [
      'echo "<h1>Shop</h1>" > index.html',
      "git status",
      'git commit -m "Nothing staged"',
      "git add index.html",
      'git commit -m "Add home page"',
      'echo "<p>Hi</p>" >> index.html',
      'git commit -am "Add greeting"',
      'echo "x" > notes.txt',
      "git add notes.txt",
      'git commit --amend -m "Add greeting and notes"',
      "git log --oneline",
    ].join("\n"),
  },
  {
    name: "gitignore and rm --cached",
    setup: [
      "git init",
      '@write app.js "console.log(1)\\n"',
      '@write node_modules/lib/index.js "module.exports = 1\\n"',
      "git add .",
      'git commit -m "Add app"',
    ].join("\n"),
    transcript: [
      'echo "node_modules/" > .gitignore',
      '@write node_modules/lib/index.js "module.exports = 2\\n"',
      "git status",
      "git rm -r --cached node_modules",
      "git add .gitignore",
      'git commit -m "Stop tracking node_modules"',
      '@write node_modules/lib/index.js "module.exports = 3\\n"',
      "git status",
      "git add node_modules/lib/index.js",
    ].join("\n"),
  },
  {
    name: "reset modes and reflog",
    setup: [
      "git init",
      '@write a.txt "1\\n"',
      "git add .",
      'git commit -m "One"',
      '@write a.txt "1\\n2\\n"',
      'git commit -am "Two"',
      '@write a.txt "1\\n2\\n3\\n"',
      'git commit -am "Three"',
    ].join("\n"),
    transcript: [
      "git reset --soft HEAD~1",
      'git commit -m "Three again"',
      "git reset HEAD~1",
      "git status --short",
      "git reset --hard",
      "git reset --hard HEAD@{2}",
      "git reflog",
      "git log --oneline",
    ].join("\n"),
  },
  {
    name: "branch, fast-forward, merge commit, conflict, abort",
    setup: [
      "git init",
      '@write config.js "const FREE = 50;\\nconst TAX = 0.2;\\n"',
      "git add .",
      'git commit -m "Add config"',
    ].join("\n"),
    transcript: [
      "git switch -c feature",
      '@write config.js "const FREE = 50;\\nconst TAX = 0.25;\\n"',
      'git commit -am "Raise tax"',
      "git switch main",
      "git merge feature",
      "git switch feature",
      '@write config.js "const FREE = 75;\\nconst TAX = 0.25;\\n"',
      'git commit -am "Raise free shipping to 75"',
      "git switch main",
      '@write config.js "const FREE = 60;\\nconst TAX = 0.25;\\n"',
      'git commit -am "Raise free shipping to 60"',
      "git merge feature",
      "git status",
      "git merge --abort",
      "git merge feature",
      '@write config.js "const FREE = 60;\\nconst TAX = 0.25;\\n"',
      "git add config.js",
      "git commit --no-edit",
      "git branch -d feature",
      "git log --oneline --graph --all",
    ].join("\n"),
  },
  {
    name: "clean three-way merge on different lines",
    setup: [
      "git init",
      '@write f.txt "a\\nb\\nc\\nd\\ne\\n"',
      "git add .",
      'git commit -m "Base"',
      "git switch -c other",
      '@write f.txt "A\\nb\\nc\\nd\\ne\\n"',
      'git commit -am "Upper a"',
      "git switch main",
      '@write f.txt "a\\nb\\nc\\nd\\nE\\n"',
      'git commit -am "Upper e"',
    ].join("\n"),
    transcript: "git merge other\ncat f.txt",
  },
  {
    name: "detached HEAD and orphan warning",
    setup: [
      "git init",
      '@write a.txt "1\\n"',
      "git add .",
      'git commit -m "One"',
      '@write a.txt "2\\n"',
      'git commit -am "Two"',
    ].join("\n"),
    transcript: [
      "git switch --detach HEAD~1",
      '@write b.txt "new\\n"',
      "git add b.txt",
      'git commit -m "Experiment"',
      "git switch main",
      "git branch keep HEAD@{1}",
      "git switch keep",
      "git checkout main",
      "git switch -",
    ].join("\n"),
  },
  {
    name: "stash push, pop, conflict, untracked",
    setup: [
      "git init",
      '@write cart.js "line1\\nline2\\nline3\\n"',
      "git add .",
      'git commit -m "Add cart"',
    ].join("\n"),
    transcript: [
      "git stash",
      '@write cart.js "MINE\\nline2\\nline3\\n"',
      '@write notes.txt "todo\\n"',
      "git stash",
      "git status --short",
      "git stash list",
      "git stash pop",
      "git stash -u",
      "git status --short",
      '@write cart.js "THEIRS\\nline2\\nline3\\n"',
      'git commit -am "Change line one"',
      "git stash pop",
      "git status --short",
      "git stash list",
    ].join("\n"),
  },
  {
    name: "remote: push, rejected, fetch, pull merge",
    setup: [
      "git init",
      '@write cart.js "a\\nb\\nc\\n"',
      "git add .",
      'git commit -m "Add cart"',
      `git remote add origin ${REMOTE_URL}`,
      "git push -u origin main",
      '@teammate @write cart.js "a\\nb\\nC\\n"',
      '@teammate git commit -am "Their change"',
      "@teammate git push",
    ].join("\n"),
    transcript: [
      '@write cart.js "A\\nb\\nc\\n"',
      'git commit -am "My change"',
      "git push",
      "git fetch",
      "git status",
      "git push",
      "git pull",
      "git log --oneline --graph",
      "git push",
      "git status",
    ].join("\n"),
  },
  {
    name: "pull with local edits, and a new branch pushed",
    setup: [
      "git init",
      '@write cart.js "line1\\nline2\\n"',
      "git add .",
      'git commit -m "Add cart"',
      `git remote add origin ${REMOTE_URL}`,
      "git push -u origin main",
      '@teammate @write cart.js "THEIRS\\nline2\\n"',
      '@teammate git commit -am "Their change"',
      "@teammate git push",
    ].join("\n"),
    transcript: [
      '@write cart.js "MINE\\nline2\\n"',
      "git pull",
      "git stash",
      "git pull",
      "git stash pop",
      "git switch -c feature/x",
      "git push",
      "git push -u origin feature/x",
      "git branch -a",
    ].join("\n"),
  },
  {
    name: "rebase with a conflict, continue, force-with-lease",
    setup: [
      "git init",
      '@write config.js "const FREE = 50;\\n"',
      "git add .",
      'git commit -m "Add config"',
      `git remote add origin ${REMOTE_URL}`,
      "git push -u origin main",
      "git switch -c feature",
      '@write discount.js "export const PATTERN = /x/;\\n"',
      "git add .",
      'git commit -m "Add discount pattern"',
      '@write config.js "const FREE = 75;\\n"',
      'git commit -am "Raise free shipping to 75"',
      "git push -u origin feature",
      "git switch main",
      '@write config.js "const FREE = 60;\\n"',
      'git commit -am "Raise free shipping to 60"',
      "git push",
      "git switch feature",
    ].join("\n"),
    transcript: [
      "git rebase main",
      "git status",
      "git rebase --continue",
      '@write config.js "const FREE = 70;\\n"',
      "git add config.js",
      "git rebase --continue",
      "git log --oneline",
      "git push",
      "git push --force-with-lease",
      "git reflog",
    ].join("\n"),
  },
  {
    name: "cherry-pick and revert",
    setup: [
      "git init",
      '@write a.txt "1\\n"',
      "git add .",
      'git commit -m "One"',
      "git switch -c side",
      '@write b.txt "b\\n"',
      "git add .",
      'git commit -m "Add b"',
      "git switch main",
    ].join("\n"),
    transcript: [
      "git cherry-pick side",
      "git revert HEAD",
      "git log --oneline",
      "git revert HEAD~5",
    ].join("\n"),
  },
];

// ---------------------------------------------------------------------------
// Real git

const root = mkdtempSync(join(tmpdir(), "git-sandbox-"));
const home = join(root, "home");
mkdirSync(home);
writeFileSync(
  join(home, ".gitconfig"),
  "[user]\n\tname = You\n\temail = you@example.com\n[init]\n\tdefaultBranch = main\n[pull]\n\trebase = false\n[advice]\n\tdetachedHead = true\n",
);
const env = {
  ...process.env,
  HOME: home,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_EDITOR: "true",
  GIT_TERMINAL_PROMPT: "0",
  LC_ALL: "C",
};

const SHOW_OUTPUTS = process.argv.includes("--outputs");

function sh(cwd: string, command: string) {
  const proc = Bun.spawnSync(["sh", "-c", command], { cwd, env, stdout: "pipe", stderr: "pipe" });
  return {
    ok: proc.exitCode === 0,
    out: `${proc.stdout.toString()}${proc.stderr.toString()}`.trim(),
  };
}

function runReal(scenario: Scenario, dir: string) {
  const origin = join(dir, "origin.git");
  const me = join(dir, "me");
  const mate = join(dir, "teammate");
  mkdirSync(me, { recursive: true });
  sh(dir, `git init -q --bare -b main ${origin}`);
  const oks: boolean[] = [];
  const outs: string[] = [];
  const run = (line: string): { ok: boolean; out: string } => {
    let cwd = me;
    let rest = line.trim();
    if (!rest || rest.startsWith("#")) return { ok: true, out: "" };
    if (rest.startsWith("@teammate ")) {
      if (!statSync(mate, { throwIfNoEntry: false })) sh(dir, `git clone -q ${origin} teammate`);
      cwd = mate;
      rest = rest.slice(10).trim();
    }
    if (rest.startsWith("@write ")) {
      const m = /^@write\s+(\S+)\s+(.*)$/s.exec(rest)!;
      const file = join(cwd, m[1]!);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.parse(m[2]!) as string);
      return { ok: true, out: "" };
    }
    // Some commands open an editor in real git where the sandbox, which has
    // none, takes the default message — make real git take it too.
    const command = rest
      .replaceAll(REMOTE_URL, origin)
      .replace(/^git merge (?!--)/, "git merge --no-edit ")
      .replace(/^git revert (?!--)/, "git revert --no-edit ")
      .replace(/^git rebase --continue$/, "GIT_EDITOR=true git rebase --continue");
    const r = sh(cwd, command);
    return {
      ok: r.ok,
      out: r.out
        .replaceAll(origin, REMOTE_URL)
        .replaceAll(origin.replace(/\.git$/, ""), "github.com:you/shop"),
    };
  };
  for (const line of splitScript(scenario.setup)) run(line);
  for (const line of splitScript(scenario.transcript)) {
    if (!line.trim()) continue;
    const r = run(line);
    oks.push(r.ok);
    outs.push(r.out);
  }
  return { oks, outs, me, origin };
}

function realState(me: string, origin: string) {
  const git = (cmd: string, cwd = me) => sh(cwd, cmd).out;
  const branch = sh(me, "git symbolic-ref -q --short HEAD");
  const commits = new Map<string, { parents: string[]; subject: string }>();
  // Pull merges are named after the remote's URL, which here is a temp path.
  const fromPath = (subject: string) =>
    subject.replace(origin.replace(/\.git$/, ""), "github.com:you/shop");
  for (const line of git("git log --all --format='%H%x09%P%x09%s' 2>/dev/null").split("\n")) {
    if (!line) continue;
    const [id, parents, subject] = line.split("\t");
    commits.set(id!, {
      parents: parents ? parents.split(" ") : [],
      subject: fromPath(subject ?? ""),
    });
  }
  for (const line of git(
    `git --git-dir ${origin} log --all --format='%H%x09%P%x09%s' 2>/dev/null`,
  ).split("\n")) {
    if (!line) continue;
    const [id, parents, subject] = line.split("\t");
    commits.set(id!, {
      parents: parents ? parents.split(" ") : [],
      subject: fromPath(subject ?? ""),
    });
  }
  const canon = canonicaliser((id) => commits.get(id));
  const refs = (cmd: string, cwd = me) =>
    Object.fromEntries(
      git(cmd, cwd)
        .split("\n")
        .filter(Boolean)
        .map((l) => l.split(" "))
        .filter(([name]) => !name!.endsWith("/HEAD") && name !== "origin")
        .map(([name, id]) => [name!, canon(id!)]),
    );
  const headCommit = sh(me, "git rev-parse -q --verify HEAD");
  const work: Record<string, string> = {};
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      if (entry === ".git") continue;
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else work[relative(me, full)] = readFileSync(full, "utf8");
    }
  };
  walk(me);
  const index: Record<string, string> = {};
  const conflicts = git("git diff --name-only --diff-filter=U").split("\n").filter(Boolean).sort();
  for (const line of git("git ls-files -s").split("\n").filter(Boolean)) {
    const [meta, path] = line.split("\t");
    const [, blob, stage] = meta!.split(" ");
    if (stage === "0" || stage === "2") index[path!] = git(`git cat-file -p ${blob}`) + "\n";
  }
  return {
    head: branch.ok
      ? `branch ${branch.out}`
      : headCommit.ok
        ? `detached ${canon(headCommit.out)}`
        : "unborn",
    branches: refs("git for-each-ref --format='%(refname:short) %(objectname)' refs/heads"),
    tracking: refs("git for-each-ref --format='%(refname:short) %(objectname)' refs/remotes"),
    remote: refs("git for-each-ref --format='%(refname:short) %(objectname)' refs/heads", origin),
    work,
    index: normaliseIndex(index, work),
    conflicts,
    stash: git("git stash list").split("\n").filter(Boolean).length,
    reflog: git("git reflog --format='%gs' 2>/dev/null").split("\n").filter(Boolean).map(scrubIds),
  };
}

// ---------------------------------------------------------------------------
// The sandbox

function simState(world: World) {
  const repo: Repo = world.me;
  const canon = canonicaliser((id) => {
    const c = world.commits[id];
    return c ? { parents: c.parents, subject: c.message.split("\n")[0] ?? "" } : undefined;
  });
  const map = (refs: Record<string, string>, prefix = "") =>
    Object.fromEntries(Object.entries(refs).map(([name, id]) => [`${prefix}${name}`, canon(id)]));
  const head =
    "detached" in repo.head
      ? `detached ${canon(repo.head.detached)}`
      : repo.branches[repo.head.branch]
        ? `branch ${repo.head.branch}`
        : "unborn";
  return {
    head:
      head === "unborn" && "branch" in repo.head && repo.initialized
        ? `branch ${repo.head.branch}`
        : head,
    branches: map(repo.branches),
    tracking: map(repo.remoteRefs, "origin/"),
    remote: map(world.remote.branches),
    work: { ...repo.work },
    index: normaliseIndex({ ...repo.index }, repo.work),
    conflicts: Object.keys(repo.conflicts).sort(),
    stash: repo.stash.length,
    reflog: [...repo.reflog].reverse().map((e) => scrubIds(e.message)),
  };
}

// ---------------------------------------------------------------------------
// Comparison

function canonicaliser(lookup: (id: string) => { parents: string[]; subject: string } | undefined) {
  const memo = new Map<string, string>();
  const canon = (id: string): string => {
    if (memo.has(id)) return memo.get(id)!;
    const c = lookup(id);
    const text = c ? `${c.subject}(${c.parents.map(canon).join(",")})` : `?${id.slice(0, 7)}`;
    memo.set(id, text);
    return text;
  };
  return canon;
}

// `git cat-file -p` drops the final newline that `sh` trimmed; compare files by
// their lines rather than their last byte.
function normaliseIndex(index: Record<string, string>, _work: Record<string, string>) {
  return Object.fromEntries(Object.entries(index).map(([k, v]) => [k, v.replace(/\n+$/, "")]));
}

const scrubIds = (text: string) => text.replace(/\b[0-9a-f]{7,40}\b/g, "<id>");
const indent = (text: string) =>
  text
    .split("\n")
    .map((l) => `    | ${l}`)
    .join("\n");

function compare(a: unknown, b: unknown, path = ""): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b as object)]);
    return [...keys].flatMap((k) =>
      compare((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`),
    );
  }
  return [`${path}\n      git:     ${JSON.stringify(a)}\n      sandbox: ${JSON.stringify(b)}`];
}

// ---------------------------------------------------------------------------

const challengeScenarios: Scenario[] = Object.entries(bodies).flatMap(([id, body]) =>
  body.blocks.flatMap((block) =>
    block.kind === "challenge" && block.language === "git"
      ? [{ name: `${id} (solution)`, setup: block.setup ?? "", transcript: block.solution }]
      : [],
  ),
);

let failures = 0;
for (const [i, scenario] of [...challengeScenarios, ...EXTRA].entries()) {
  const dir = join(root, `s${i}`);
  mkdirSync(dir);
  const real = runReal(scenario, dir);
  const world = buildWorld(scenario.setup);
  const simOks: boolean[] = [];
  const simOuts: string[] = [];
  const lines = splitScript(scenario.transcript).filter((l) => l.trim());
  for (const line of lines) {
    const r = runLine(world, line);
    simOks.push(r.ok);
    simOuts.push(r.output);
  }
  const problems: string[] = [];
  lines.forEach((line, k) => {
    if (real.oks[k] !== simOks[k]) {
      problems.push(
        `line ${k + 1} \`${line}\`: git ${real.oks[k] ? "succeeded" : "failed"}, sandbox ${simOks[k] ? "succeeded" : "failed"}`,
      );
    }
  });
  problems.push(...compare(realState(real.me, real.origin), simState(world)));
  if (problems.length) failures++;
  console.log(`${problems.length ? "FAIL" : "ok  "} ${scenario.name}`);
  for (const p of problems) console.log(`    ${p}`);
  // Printed text isn't a failure (ids and hints differ in small ways), but
  // `--outputs` shows every difference for a person to judge.
  if (SHOW_OUTPUTS) {
    lines.forEach((line, k) => {
      const a = scrubIds(real.outs[k] ?? "");
      const b = scrubIds(simOuts[k] ?? "");
      if (a !== b) console.log(`  $ ${line}\n  --- git\n${indent(a)}\n  --- sandbox\n${indent(b)}`);
    });
  }
}

rmSync(root, { recursive: true, force: true });
void createWorld;
process.exit(failures ? 1 : 0);
