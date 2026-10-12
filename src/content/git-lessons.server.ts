import type { LessonBody } from "./lessons";

/**
 * Authored Git course lessons. Answer keys stay server-side.
 *
 * Every terminal transcript here was captured from a real git 2.40 session,
 * hint text included, so a learner comparing it with their own screen sees
 * the same words.
 */
/** Sandbox scripts: one command per line, a file's contents written in as JSON. */
const write = (path: string, content: string) => `@write ${path} ${JSON.stringify(content)}`;
const script = (...lines: string[]) => lines.join("\n");

const CART = `export function total(items) {
  return items.reduce((sum, i) => sum + i.price, 0);
}
`;

/** The shop most scenarios start from: one commit, already pushed to GitHub. */
const SHOP = [
  "git init",
  write("index.html", "<h1>Shop</h1>\n"),
  write("src/cart.js", CART),
  "git add .",
  'git commit -m "Add cart page"',
  "git remote add origin git@github.com:you/shop.git",
  "git push -u origin main",
];

export const gitLessonBodies: Record<string, LessonBody> = {
  "git-start.why": {
    summary: "What git does for you, how it differs from GitHub, and setting it up once.",
    xp: 90,
    blocks: [
      {
        kind: "text",
        body: "Without version control, a project's history ends up in file names: `report_final.docx`, `report_final_v2.docx`, `report_final_v2_REALLY.docx`. None of them say what changed or why, and when two people edit the same file, one of them quietly loses their work.",
      },
      {
        kind: "text",
        body: "Git fixes this for a whole folder at once. That folder becomes a **repository**, and every time you save a **commit** (a snapshot of the folder), git records who made it, when, and a message saying why. You keep one copy of each file, and every earlier version stays one command away.",
      },
      {
        kind: "text",
        body: "**Git and GitHub are different things.** Git is a program on your computer, and everything in the first few lessons works offline. GitHub is a website that hosts a copy of your repository so other people can see it and work on it. You send your commits there with `push` and bring other people's back with `pull`. GitLab and Bitbucket do the same job.",
      },
      {
        kind: "code",
        language: "bash",
        caption: "Check git is installed, then set it up (once per computer)",
        code: `git --version\n# git version 2.46.0  (any 2.28 or later works for this course)\n\ngit config --global user.name "Alex Rivera"\ngit config --global user.email "alex@example.com"\ngit config --global init.defaultBranch main\ngit config --global pull.rebase false`,
      },
      {
        kind: "callout",
        body: "Every commit is stamped with that name and email, and GitHub uses the email to link commits to your account. Use the same email you sign up to GitHub with. `init.defaultBranch` names the first branch of every new repository `main`, as GitHub does; without it, git still calls it `master`. `pull.rebase false` tells `git pull` to merge when your copy and GitHub's have both moved on; without it, modern git stops and asks you to choose. Both keep what you see matching this course.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: a shared folder",
        code: `proposal.docx\nproposal_final.docx\nproposal_final_v2.docx\nproposal_final_v2_SAM_EDITS.docx`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What would git give this team that the folder doesn't?",
        options: [
          "A backup copy in the cloud, so nobody can lose the file",
          "One `proposal.docx`, with each committed version kept, plus who changed it, when and why",
          "Automatic merging, so Sam's edits and yours combine on their own",
          "A lock, so only one person can edit the document at a time",
        ],
        answer: 1,
        explanation:
          "That's what commits give you. A cloud copy is what GitHub adds on top, git never locks files, and it can't merge a binary file like `.docx` line by line. It's at its best with text files such as code.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "You're on a train with no internet. Which of these still works?",
        options: [
          "Nothing works until you're back online",
          "Committing and reading history both work",
          "Reading history works, but committing waits until you're back online",
          "Committing works, but browsing history needs GitHub",
        ],
        answer: 1,
        explanation:
          "Your repository, including its full history, is on your laptop. Only `push` and `pull`, which talk to GitHub, need a connection.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Set the email git stamps on your commits.",
        before: "git config --global user.",
        after: ' "alex@example.com"',
        answer: "email",
        explanation:
          "`user.name` and `user.email` go on every commit you make. `--global` sets them once for every repository on this computer.",
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** install git from git-scm.com if `git --version` doesn't work, then run the four `git config` lines, with your own name and email. Check them with `git config --global --list`.",
      },
    ],
  },
  "git-start.first-repo": {
    summary: "Turn a folder into a repository, make your first commit, and keep secrets out of it.",
    xp: 110,
    blocks: [
      {
        kind: "text",
        body: "`git init` turns the current folder into a repository. It creates a hidden `.git` folder, and that folder *is* the repository: every commit and every branch lives inside it. Your files stay exactly where they were. (Delete `.git` and the history goes with it.)",
      },
      {
        kind: "code",
        language: "bash",
        caption: "A new project, from nothing to first commit",
        code: `mkdir shop && cd shop\ngit init                         # Initialized empty Git repository in .../shop/.git/\necho "<h1>Shop</h1>" > index.html\ngit status                       # index.html is "untracked"\ngit add index.html               # stage it\ngit commit -m "Add home page"    # record the snapshot`,
      },
      {
        kind: "text",
        body: "Git never tracks a new file on its own. A new file is **untracked** until you `git add` it, and a commit only records what's been added (staged). That's deliberate: nothing lands in history unless you chose to put it there.",
      },
      {
        kind: "text",
        body: "Some files should never be committed: passwords and API keys (often in `.env`), downloaded dependencies (`node_modules/`), and build output. List them in a file called `.gitignore` and git will act as if they don't exist. Do it **before** your first `git add .`. Once a file has been committed, it stays in history even after you delete it.",
      },
      {
        kind: "code",
        language: "text",
        caption: ".gitignore",
        code: `.env\nnode_modules/\ndist/\n.DS_Store`,
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: a brand-new repository",
        code: `$ git status\nOn branch main\n\nNo commits yet\n\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n        .env\n        index.html\n\nnothing added to commit but untracked files present (use "git add" to track)`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          'Straight after that `git status`, you run `git commit -m "Add home page"`. What happens?',
        options: [
          "Both files are committed",
          "Only `index.html` is committed, because git skips files that look like secrets",
          "Nothing is committed, because nothing has been staged yet",
          "A commit is made with no files in it",
        ],
        answer: 2,
        explanation:
          "A commit records the staging area, and it's empty. Git says so on the last line: *nothing added to commit*. Run `git add index.html` first.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "`.env` holds your database password. What should you do before your first commit?",
        options: [
          "Commit it. The repository is private, so it's safe",
          "Commit it now and delete it in the next commit",
          "Rename it to `env.txt`",
          "Add `.env` to `.gitignore` so git never tracks it",
        ],
        answer: 3,
        explanation:
          "Private repositories get shared, forked and made public later. Deleting the file in a later commit doesn't help either, because the earlier commit still has it and anyone can check it out. Keep secrets out of history from the start.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "You're inside a new project folder. Turn it into a git repository.",
        before: "git ",
        after: "",
        answer: "init",
        explanation:
          "`git init` creates the `.git` folder that holds the history. Your files aren't tracked until you add them.",
      },
      {
        kind: "challenge",
        id: "sandbox",
        title: "Your first commit, without the secret",
        prompt:
          "This folder has a home page, a stylesheet, and an `.env` holding a database password. It isn't a repository yet. Make it one, and commit the page and the styles without the password ever going into history.",
        language: "git",
        setup: script(
          write("index.html", "<h1>Shop</h1>\n"),
          write("style.css", "h1 { color: teal; }\n"),
          write(".env", "DATABASE_PASSWORD=hunter2\n"),
        ),
        starter: "",
        hint: 'Start with `git init`. Create `.gitignore` before you add anything, with `echo ".env" > .gitignore`, and check that `git status` no longer lists `.env`. Then `git add .` and commit.',
        solution: script(
          "git init",
          'echo ".env" > .gitignore',
          "git add .",
          'git commit -m "Add home page and styles"',
        ),
        tests: [
          { name: "`index.html` is committed", expression: "present HEAD:index.html" },
          { name: "`style.css` is committed", expression: "present HEAD:style.css" },
          { name: "`.gitignore` is committed", expression: "present HEAD:.gitignore" },
          { name: "`.env` is in no commit", expression: "absent HEAD:.env" },
          { name: "Git ignores `.env`", expression: "ignored .env" },
          { name: "Nothing is left uncommitted", expression: "clean" },
        ],
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** make a folder, `git init`, add a `.gitignore` containing `.env`, create an `.env` and an `index.html`, then run `git status`. Only `.gitignore` and `index.html` should appear. Add them, commit, and run `git log` to see your first commit.",
      },
    ],
  },
  "git-start.history": {
    summary: "Read what changed with status, diff and log, and throw away edits you don't want.",
    xp: 110,
    blocks: [
      {
        kind: "text",
        body: "Three commands answer nearly every *what's going on?* question. `git status` tells you which files changed and which are staged. `git diff` shows the changed lines themselves. `git log` shows the commits so far, newest first.",
      },
      {
        kind: "code",
        language: "bash",
        code: `git diff               # changes you haven't staged yet\ngit diff --staged      # changes that will go into the next commit\ngit log --oneline      # one line per commit: short id + subject\ngit show b7a03d1       # everything one commit changed`,
      },
      {
        kind: "text",
        body: "In a diff, lines starting with `-` were removed and lines starting with `+` were added. The lines around them with no sign are unchanged context, there to show you where the change sits. A changed line shows up as a `-` line followed by a `+` line.",
      },
      {
        kind: "text",
        body: "To undo edits you haven't committed, use `git restore <file>`: the file goes back to how it was in the last commit. This one really is permanent, because the discarded edits were never saved anywhere. If you staged something by mistake, `git restore --staged <file>` unstages it and leaves your edits alone.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: you edit cart.js, then run git diff",
        code: `$ git diff\ndiff --git a/src/cart.js b/src/cart.js\nindex 3f1c2a4..9d0b7e1 100644\n--- a/src/cart.js\n+++ b/src/cart.js\n@@ -3,3 +3,3 @@\n function total(items) {\n-  return items.reduce((sum, i) => sum + i.price, 0);\n+  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);\n }`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "You ran plain `git diff` and got the output above. What does it tell you?",
        options: [
          "One line in `total` was edited to multiply by quantity, and the edit is staged for the next commit",
          "A second `return` line was added to `total`, so the function now has two",
          "One line in `total` was edited to multiply by quantity, and the edit isn't staged yet",
          "The edit is already committed, and `git diff` is showing the latest commit",
        ],
        answer: 2,
        explanation:
          "A `-` line followed by a `+` line is one edited line: the old version, then its replacement. Plain `git diff` shows only edits you haven't staged. Staged edits move to `git diff --staged`, and committed ones stop appearing in either.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: history so far",
        code: `$ git log --oneline\ne41f2c9 (HEAD -> main) Show shipping estimate on cart page\nb7a03d1 Fix rounding in cart total\n5c9e8f2 Add cart page`,
      },
      {
        kind: "mcq",
        id: "q2",
        question: 'Which command shows exactly what "Fix rounding in cart total" changed?',
        options: ["`git show b7a03d1`", "`git status`", "`git diff`", "`git restore b7a03d1`"],
        answer: 0,
        explanation:
          "`git show` prints a commit's message and its diff. `git status` and `git diff` only describe what you haven't committed yet.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "You experimented in `config.js` and want the file back exactly as it was in the last commit. Nothing is staged. What do you run?",
        options: [
          "`git log config.js`",
          "`git restore config.js`, knowing the experiment is gone for good",
          "`git diff --staged`",
          "`git commit`, then delete the file",
        ],
        answer: 1,
        explanation:
          "`restore` copies the committed version back over your edits. Those edits were never committed, so git has no copy of them to get back.",
      },
      {
        kind: "challenge",
        id: "sandbox",
        title: "Keep the fix, drop the experiment",
        prompt:
          "You have two uncommitted edits. The one in `src/cart.js` makes the total count quantities, and it's right. The one in `index.html` was an experiment you don't want. Commit the fix on its own, and put `index.html` back the way the last commit had it.",
        language: "git",
        setup: script(
          ...SHOP,
          write("src/cart.js", CART.replace("i.price", "i.price * i.quantity")),
          write("index.html", "<h1>Shop</h1>\n<marquee>SALE SALE SALE</marquee>\n"),
        ),
        starter: "",
        hint: "`git diff` shows both edits. `git restore index.html` puts that file back as it was committed. Then stage `src/cart.js` and commit it.",
        solution: script(
          "git restore index.html",
          "git add src/cart.js",
          'git commit -m "Multiply price by quantity in cart total"',
        ),
        tests: [
          {
            name: "Your latest commit has the quantity fix, and not the experiment",
            expression:
              'contains HEAD:src/cart.js "i.quantity" && excludes HEAD:index.html "marquee"',
          },
          {
            name: "`index.html` is back to its committed version",
            expression: 'excludes index.html "marquee"',
          },
          { name: "Nothing is left uncommitted", expression: "clean" },
        ],
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** in your practice repository, change a line in `index.html` and run `git diff`. Stage it and run `git diff` again (empty) and then `git diff --staged`. Commit it, and find the commit with `git log --oneline` and `git show`.",
      },
    ],
  },
  "git-start.remotes": {
    summary: "Put your repository on GitHub, and keep your copy and everyone else's in step.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "A **remote** is another copy of your repository, usually on GitHub, and by convention it's called `origin`. Nothing moves between your copy and the remote on its own: `push` sends your new commits up, and `pull` brings other people's commits down and merges them into your branch.",
      },
      {
        kind: "code",
        language: "bash",
        caption: "Two ways to start",
        code: `# A project that already exists on GitHub: download it, full history included\ngit clone https://github.com/acme/shop.git\n\n# A repository you started locally: create an empty repo on GitHub, then\ngit remote add origin https://github.com/you/shop.git\ngit push -u origin main   # -u remembers origin/main, so next time it's just \`git push\``,
      },
      {
        kind: "text",
        body: "Your first push asks you to sign in, and your GitHub password won't work: GitHub stopped accepting passwords for git in 2021. If git opens a browser to sign in (Git for Windows does), follow it. Otherwise install the GitHub CLI from cli.github.com and run `gh auth login` once. Choose HTTPS and let it set up git, and every push after that just works.",
      },
      {
        kind: "code",
        language: "text",
        caption: "If your first push fails like this",
        code: `$ git push -u origin main\nerror: src refspec main does not match any\n\n# Your branch is called master (git's old default). Rename it, then push:\n$ git branch -m main\n$ git push -u origin main`,
      },
      {
        kind: "text",
        body: "`git fetch` downloads new commits from the remote but leaves your branch alone. After a fetch, `git status` tells you how far apart you are. `git pull` is a fetch followed by a merge (that's the `pull.rebase false` you set up in the first lesson), and it's what you'll usually run.",
      },
      {
        kind: "text",
        body: "If a teammate pushed since you last pulled, GitHub **rejects** your push, because accepting it would throw their commits away. The fix is always the same: `git pull`, resolve a conflict if there is one, then push again. `git push --force` would get your push through by deleting their work from GitHub. Don't use it on a shared branch.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: you try to push",
        code: `$ git push\nTo github.com:acme/shop.git\n ! [rejected]        main -> main (fetch first)\nerror: failed to push some refs to 'github.com:acme/shop.git'\nhint: Updates were rejected because the remote contains work that you do not\nhint: have locally.`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Your `git push` was rejected with the message above. What do you do?",
        options: [
          "`git push --force`, so your commits go through",
          "Delete your folder and clone the repository again",
          "`git pull`, sort out any conflict, then `git push` again",
          "Make another commit and push that instead",
        ],
        answer: 2,
        explanation:
          "The remote has commits you don't. Pull them in so your branch contains both, then your push goes through without deleting anyone's work.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: after git fetch",
        code: `$ git status\nOn branch main\nYour branch is behind 'origin/main' by 2 commits, and can be fast-forwarded.`,
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "After `git fetch`, `git status` says your branch is behind `origin/main` by 2 commits and can be fast-forwarded. What does that mean?",
        options: [
          "You have 2 commits that GitHub doesn't have yet",
          "GitHub has 2 commits you don't, and `git pull` will bring them in",
          "2 of your commits were lost when you fetched",
          "Your branch and GitHub's have split, so pulling will need a merge commit",
        ],
        answer: 1,
        explanation:
          "*Behind* means the remote is ahead of you. *Can be fast-forwarded* means you have no new commits of your own, so pulling just moves your branch forward, with no merge commit.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Get your own copy of an existing GitHub project, with its full history.",
        before: "git ",
        after: " https://github.com/acme/shop.git",
        answer: "clone",
        explanation:
          "`clone` downloads the whole repository, checks out its main branch, and sets it up as `origin` so `pull` and `push` work straight away.",
      },
      {
        kind: "challenge",
        id: "sandbox",
        title: "Get a rejected push through",
        prompt:
          "You've committed a free-shipping banner, but while you worked a teammate pushed a fix to `main`. Run `git push` and read what happens. Then get your commit onto GitHub without losing theirs.",
        language: "git",
        setup: script(
          ...SHOP,
          `@teammate ${write("src/cart.js", CART.replace("sum + i.price, 0)", "sum + Math.round(i.price * 100), 0) / 100"))}`,
          '@teammate git commit -am "Round prices to cents"',
          "@teammate git push",
          write("index.html", "<h1>Shop</h1>\n<p>Free shipping over $50</p>\n"),
          'git commit -am "Show free-shipping banner"',
        ),
        starter: "",
        hint: "The push is rejected because GitHub has a commit you don't. `git pull` brings it in and merges it with yours; then `git push` again.",
        solution: script("git pull", "git push"),
        tests: [
          {
            name: "GitHub's `main` has your *Show free-shipping banner*",
            expression: 'remote-has main "Show free-shipping banner"',
          },
          {
            name: "…and still has your teammate's *Round prices to cents*",
            expression:
              'remote-has main "Show free-shipping banner" && remote-has main "Round prices to cents"',
          },
          {
            name: "Your `main` and GitHub's are the same commit, with nothing left uncommitted",
            expression: "remote-same main main && clean",
          },
        ],
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** create an empty repository on GitHub (no README), connect your practice repository with `git remote add origin …`, sign in with `gh auth login` if git asks you to, and `git push -u origin main`. Refresh the GitHub page and your commits are there. Then edit a file on GitHub's website, commit it there, and bring it back with `git pull`.",
      },
    ],
  },
  "git-core.commits": {
    summary: "Make commits small enough to review and clear enough to read in a year.",
    xp: 110,
    blocks: [
      {
        kind: "text",
        body: "A commit is a snapshot of your project plus a note explaining it. Git keeps every snapshot, so the history becomes a story of how the code got here. When something breaks six months from now, that story is what you read to find out why a line exists. A good commit does one thing and says why.",
      },
      {
        kind: "text",
        body: "Changes reach a commit in two steps. `git add` moves them into the **staging area**, and `git commit` records whatever is staged. The pause between the two steps is useful: if you fixed a bug and renamed a variable in the same file, `git add -p` lets you stage the fix alone, commit it, and commit the rename separately.",
      },
      {
        kind: "code",
        language: "bash",
        caption: "Stage part of a file, check it, then commit",
        code: `git status              # what changed, and what is staged\ngit add -p src/cart.js  # pick the hunks that belong to this commit\ngit diff --staged       # read exactly what you are about to commit\ngit commit`,
      },
      {
        kind: "text",
        body: "The message has two parts. The subject line is short (about 50 characters) and written as a command: *Fix rounding in cart total*, not *Fixed stuff*. After a blank line, the body explains **why** the change was needed. The diff already shows what changed; nothing else records why.",
      },
      {
        kind: "code",
        language: "text",
        caption: "A message someone can use later",
        code: `Fix rounding in cart total\n\nPrices were summed as floats, so 2 x 9.99 + 24.50 came out as\n44.480000000000004 and failed the equality check at checkout.\nSum in cents and convert once at the end.`,
      },
      {
        kind: "callout",
        body: "Forgot a file or made a typo in the last commit? `git commit --amend` replaces it. Only do this before you push: amending creates a new commit with a new ID, so anyone who already pulled the old one ends up with a history that no longer matches yours.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: you run git status",
        code: `$ git status\nOn branch main\nChanges to be committed:\n        modified:   src/cart.js\n\nChanges not staged for commit:\n        modified:   src/cart.js\n        modified:   README.md`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          'With `git status` showing the above, you run `git commit -m "Fix rounding in cart total"`. What goes into the commit?',
        options: [
          "Only the staged part of `src/cart.js`",
          "Every change to `src/cart.js`, staged or not",
          "Everything listed, including `README.md`",
          "Nothing: you have to run `git add .` first",
        ],
        answer: 0,
        explanation:
          "A commit records the staging area and nothing else. `src/cart.js` appears in both lists because only some of its changes were staged, and the unstaged ones stay in your working copy for a later commit.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "In March a teammate wants to know why the checkout total started rounding differently. Which commit lets them find out without asking you?",
        options: [
          "`Update cart.js to sum in cents`, with no body",
          "`Round cart total in cents`, with no body",
          "`Round cart total in cents`, with a body explaining the float bug it fixes",
          "`Fix bug Sam reported`, with a body linking the chat thread",
        ],
        answer: 2,
        explanation:
          "The diff already shows what changed. Only the message can record why, and a subject line has no room for it: the body is where the float bug goes. A chat link is only as good as the chat, which may be gone by March.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: your log, just before pushing",
        code: `$ git log --oneline\nc4d5e6f (HEAD -> main) Add discount code field\na1b2c3d (origin/main) Fix rounding in cart total\n9e8d7c6 Show free-shipping banner`,
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "You spot a typo in the discount code label. Which commit can you still safely `--amend`?",
        options: [
          "Both of the top two",
          "Neither: amending is never safe",
          "`a1b2c3d`, because it's older",
          "`c4d5e6f` only, because it isn't on `origin` yet",
        ],
        answer: 3,
        explanation:
          "`origin/main` marks what the remote already has, so `a1b2c3d` is shared and rewriting it would break everyone's copy. `c4d5e6f` exists only on your machine.",
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** in your practice repository, make two unrelated changes to one file. Stage just one with `git add -p`, commit it with a subject and a body that says why, then commit the other. `git log` should read as two clear entries.",
      },
    ],
  },
  "git-core.branches": {
    summary: "Work on a branch, bring it back with a merge, and resolve a conflict calmly.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "A branch is only a movable label pointing at a commit. Creating one costs nothing and copies nothing. Working on a branch keeps half-finished work away from `main`, so `main` always stays in a state you could ship.",
      },
      {
        kind: "code",
        language: "bash",
        caption: "Start a branch, work on it, look at the shape of history",
        code: `git switch -c feature/discount-codes   # create the branch and move onto it\n# ...edit, add, commit as usual...\ngit log --oneline --graph --all        # see where each branch points`,
      },
      {
        kind: "text",
        body: "`git merge` brings the branch back in two ways. If `main` has not moved since you branched, Git just slides the `main` label forward to your latest commit. This is called a **fast-forward**, and no new commit is created. If both branches have new commits, Git creates a **merge commit** with two parents, joining the two histories.",
      },
      {
        kind: "code",
        language: "bash",
        code: `git switch main\ngit pull                      # get everyone else's work first\ngit merge feature/discount-codes`,
      },
      {
        kind: "text",
        body: "A **conflict** happens when both branches changed the same lines and Git cannot decide which version should win. It stops, marks the file, and waits for you. Everything between `<<<<<<<` and the divider is your side (`HEAD`), and everything between the divider and `>>>>>>>` is the incoming branch.",
      },
      {
        kind: "code",
        language: "text",
        caption: "What a conflict looks like inside the file",
        code: `<<<<<<< HEAD\nconst FREE_SHIPPING_OVER = 50;\n=======\nconst FREE_SHIPPING_OVER = 75;\n>>>>>>> feature/discount-codes`,
      },
      {
        kind: "text",
        body: "To resolve it, edit the file so it reads the way it should. That might be one side, the other, or a mix of both. Delete all three marker lines, then run `git add` on the file and `git commit` to finish the merge. If you'd rather back out and think first, `git merge --abort` returns everything to how it was before the merge.",
      },
      {
        kind: "callout",
        body: "A conflict isn't an error. It means two people changed the same thing and someone has to decide which version is right. Read both sides before choosing, because the right answer is sometimes a combination of the two.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario A",
        code: `$ git log --oneline --graph --all\n* 7d1e9a0 (feature/discount-codes) Validate discount code format\n* 3c8b2f1 Add discount code field\n* a1b2c3d (HEAD -> main) Fix rounding in cart total`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "With history as in Scenario A, you run `git merge feature/discount-codes` on `main`. What happens?",
        options: [
          "`main` moves to `7d1e9a0`: a fast-forward, with no new commit",
          "Git creates a merge commit with two parents",
          "A conflict, because both branches touched the cart",
          "The two feature commits are copied onto `main` with new IDs",
        ],
        answer: 0,
        explanation:
          "`main` is still at the commit the branch started from, so there's nothing to join. Git just moves the label forward.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario B: someone pushed to main in the meantime",
        code: `$ git log --oneline --graph --all\n* 5e6f7a8 (HEAD -> main) Raise free shipping to 60\n| * 7d1e9a0 (feature/discount-codes) Validate discount code format\n| * 3c8b2f1 Add discount code field\n|/\n* a1b2c3d Fix rounding in cart total`,
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "With history as in Scenario B, what does `git merge feature/discount-codes` on `main` produce?",
        options: [
          "A fast-forward to `7d1e9a0`",
          "It discards `5e6f7a8` to make room for the feature",
          "An error: branches that have diverged can't be merged",
          "A new merge commit whose parents are `5e6f7a8` and `7d1e9a0`",
        ],
        answer: 3,
        explanation:
          "Both branches moved on after `a1b2c3d`, so Git joins them with a commit that has two parents. Neither side's commits are lost.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The merge stops with a conflict in src/config.js",
        code: `<<<<<<< HEAD\nconst FREE_SHIPPING_OVER = 60;\n=======\nconst FREE_SHIPPING_OVER = 50;\nconst DISCOUNT_CODE_PATTERN = /^[A-Z0-9]{6}$/;\n>>>>>>> feature/discount-codes`,
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "`main` raised the threshold to 60 on purpose. Your branch only meant to add the pattern line. What should the file say once you've resolved it?",
        options: [
          "Only the `HEAD` side: threshold 60 and no pattern",
          "Only your side: threshold 50 plus the pattern",
          "Threshold 60 **and** the pattern line, with all three markers removed",
          "Both threshold lines, so nothing is lost",
        ],
        answer: 2,
        explanation:
          "Your branch still has the old threshold only because it started before `main` changed it. Keep the change each side intended: `main`'s 60 and your new line.",
      },
      {
        kind: "code",
        language: "text",
        caption: "After editing the file",
        code: `$ git status\nOn branch main\nYou have unmerged paths.\n  (fix conflicts and run "git commit")\n\nUnmerged paths:\n        both modified:   src/config.js`,
      },
      {
        kind: "mcq",
        id: "q4",
        question: "You've fixed `src/config.js` and saved it. What do you run next?",
        options: [
          "`git add src/config.js`, then `git commit`",
          "`git merge feature/discount-codes` again",
          "`git reset --hard`",
          "Nothing: Git will notice the markers are gone",
        ],
        answer: 0,
        explanation:
          "Staging the file is how you tell Git it's resolved, and the commit records the merge. `git reset --hard` would throw your resolution away. (If you'd rather start over, `git merge --abort` puts everything back as it was.)",
      },
      {
        kind: "challenge",
        id: "sandbox",
        title: "Merge a branch and resolve the conflict",
        prompt:
          "While `feature/discount-codes` added a pattern for discount codes, `main` raised free shipping to 60. Merge the branch into `main`. Both changed the same lines of `src/config.js`, so you'll resolve a conflict: keep `main`'s 60 and the branch's new line.",
        language: "git",
        setup: script(
          "git init",
          write("src/config.js", "const FREE_SHIPPING_OVER = 50;\n"),
          "git add .",
          'git commit -m "Add config"',
          "git switch -c feature/discount-codes",
          write(
            "src/config.js",
            "const FREE_SHIPPING_OVER = 50;\nconst DISCOUNT_CODE_PATTERN = /^[A-Z0-9]{6}$/;\n",
          ),
          'git commit -am "Add discount code pattern"',
          "git switch main",
          write("src/config.js", "const FREE_SHIPPING_OVER = 60;\n"),
          'git commit -am "Raise free shipping to 60"',
        ),
        starter: "",
        hint: "`git merge feature/discount-codes` stops with a conflict. Open `src/config.js` under Files, make it say what it should, delete the three marker lines and save. Then `git add src/config.js` and `git commit`.",
        solution: script(
          "git merge feature/discount-codes",
          write(
            "src/config.js",
            "const FREE_SHIPPING_OVER = 60;\nconst DISCOUNT_CODE_PATTERN = /^[A-Z0-9]{6}$/;\n",
          ),
          "git add src/config.js",
          "git commit",
        ),
        tests: [
          {
            name: "`main` includes *Add discount code pattern*",
            expression: 'has main "Add discount code pattern"',
          },
          { name: "`main` ends in a merge commit", expression: "parents main 2" },
          {
            name: "The merged `src/config.js` keeps the threshold of 60 and the pattern line",
            expression:
              'parents main 2 && contains main:src/config.js "FREE_SHIPPING_OVER = 60;" && contains main:src/config.js "DISCOUNT_CODE_PATTERN"',
          },
          {
            name: "…with no conflict markers left in it",
            expression:
              'parents main 2 && excludes main:src/config.js "<<<<<<<" && excludes main:src/config.js ">>>>>>>"',
          },
          { name: "Nothing is left uncommitted", expression: "parents main 2 && clean" },
        ],
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** make a conflict on purpose. On a new branch, change a line and commit. Switch back to `main`, change the same line differently and commit. Merge the branch, resolve the conflict, `git add` and commit, then look at the result with `git log --oneline --graph`.",
      },
    ],
  },
  "git-core.prs": {
    summary:
      "Open a pull request someone can review, and undo a bad merge without rewriting history.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "A pull request asks your team to merge your branch into `main`. It is also where the review happens, so the job is to make reviewing easy. Keep it small, focused on one change, and explained well enough that the reviewer doesn't have to guess what you meant.",
      },
      {
        kind: "code",
        language: "bash",
        caption: "Publish the branch and open the pull request",
        code: `git push -u origin feature/discount-codes   # -u remembers the remote for next time\ngh pr create --fill                         # or open it from the GitHub page`,
      },
      {
        kind: "text",
        body: "A useful description answers three questions: **what** changes, **why** it's needed, and **how you checked it**. Link the issue it closes, and add a screenshot if the UI changes. A 200-line pull request gets a careful review, while a 2,000-line one usually gets a quick glance and an approval.",
      },
      {
        kind: "text",
        body: "Review comments are about the code, not the person. If you're reviewing, ask questions (*what happens if the list is empty?*) and say which comments block the merge and which are optional. If you're the author, reply to every comment, push fixes as new commits so the reviewer can see what changed, and resolve a thread only once the reviewer is satisfied.",
      },
      {
        kind: "text",
        body: "Sometimes a merged change breaks `main` anyway. The fix is not to rewrite shared history, because `git reset` followed by a force-push pulls commits out from under everyone who has already pulled them. Instead, `git revert` creates a **new** commit that undoes the bad one. History stays intact, and you can open a pull request for the revert like any other change.",
      },
      {
        kind: "code",
        language: "bash",
        code: `git log --oneline            # find the commit that broke things, e.g. a1b2c3d\ngit revert a1b2c3d           # new commit that undoes it\ngit revert -m 1 <merge-sha>  # for a merge commit: keep main's side (parent 1)`,
      },
      {
        kind: "callout",
        body: "Use `reset` and `--amend` only on commits nobody else has. Once a commit is shared, undo it with `revert`.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: a pull request waiting for review",
        code: `Title:        Updates\nFiles changed: 41    +1,812  −604\nDescription:  (empty)`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Your pull request, titled *Updates*, changes 41 files and about 2,400 lines, with no description. What would do the most to get it a real review?",
        options: [
          "Add more reviewers, so the work is shared",
          "Keep it as one PR, but write a description of what changes, why, and how it was tested",
          "Ask for a quick approval and promise to fix anything found later",
          "Split it into focused PRs, each saying what changes, why, and how it was tested",
        ],
        answer: 3,
        explanation:
          "A description helps, but nobody reviews 2,400 lines properly in one sitting: they skim and approve. Small PRs, each explained, are the kind that get a real review.",
      },
      {
        kind: "code",
        language: "text",
        caption:
          "Scenario: checkout broke after this merge, and three teammates have already pulled main",
        code: `$ git log --oneline\nf00ba12 (HEAD -> main, origin/main) Merge pull request #42 from feature/discount-codes\n5e6f7a8 Raise free shipping to 60\na1b2c3d Fix rounding in cart total`,
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Pull request #42 broke checkout, and teammates have already pulled `main`. How do you undo it?",
        options: [
          "`git reset --hard 5e6f7a8`, then `git push --force`",
          "`git revert -m 1 f00ba12`, then push the revert (or open a PR for it)",
          "`git commit --amend` to edit the merge",
          "Delete the `feature/discount-codes` branch",
        ],
        answer: 1,
        explanation:
          "`f00ba12` is already shared, so rewriting it would break your teammates' copies. `revert` adds a new commit that undoes it. `-m 1` says to keep `main`'s side, because a merge has two parents.",
      },
      {
        kind: "code",
        language: "text",
        caption: "A review comment on your PR",
        code: `src/discount.js, line 12\n> What happens if code is an empty string?`,
      },
      {
        kind: "mcq",
        id: "q3",
        question: "It turns out an empty code crashes the checkout. What's the best response?",
        options: [
          "Fix it, then squash and force-push so the PR stays one clean commit",
          "Fix it in a new commit and resolve the thread yourself",
          "Reply that empty codes are rare, and open an issue to fix it later",
          "Add a test for the empty case, fix it in a new commit, and reply saying what changed",
        ],
        answer: 3,
        explanation:
          "A new commit shows the reviewer exactly what changed since they last looked, the test stops the bug coming back, and your reply lets them close the thread. Squashing hides what changed, and resolving the thread yourself skips their check.",
      },
      {
        kind: "challenge",
        id: "sandbox",
        title: "Undo a merged pull request",
        prompt:
          "Pull request #42 was merged into `main` and pushed, and it broke checkout. Three teammates have already pulled. Undo it without rewriting history, and push the fix.",
        language: "git",
        setup: script(
          ...SHOP,
          "git switch -c feature/discount-codes",
          write("src/discount.js", "export const PATTERN = /^[A-Z0-9]{6}$/;\n"),
          "git add .",
          'git commit -m "Add discount codes"',
          "git push -u origin feature/discount-codes",
          "git switch main",
          'git merge --no-ff feature/discount-codes -m "Merge pull request #42 from feature/discount-codes"',
          "git push",
        ),
        starter: "",
        hint: "`git log --oneline` shows the merge on top. A merge has two parents, so revert it with `git revert -m 1 HEAD` to keep `main`'s side, then `git push`.",
        solution: script("git revert -m 1 HEAD", "git push"),
        tests: [
          {
            name: "`main` no longer has the pull request's changes",
            expression: "absent main:src/discount.js",
          },
          {
            name: "…and the merge is still in its history",
            expression:
              'absent main:src/discount.js && has main "Merge pull request #42 from feature/discount-codes"',
          },
          {
            name: "GitHub's `main` has your fix, with nothing left uncommitted",
            expression: "absent remote/main:src/discount.js && remote-same main main && clean",
          },
        ],
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** push a branch to your practice repository on GitHub and open a pull request against `main`, with a description that covers what, why and how you tested it. Merge it, then undo it with `git revert -m 1 <merge-sha>` and push the revert.",
      },
    ],
  },
  "git-rescue.stash": {
    summary: "Set unfinished work aside with stash, and bring it back without losing it.",
    xp: 110,
    blocks: [
      {
        kind: "text",
        body: "You're halfway through an edit and suddenly need a clean working copy: to pull a teammate's fix, to switch branches and review something, or to chase an urgent bug. Committing half-done work is one option. `git stash` is the other. It takes your uncommitted changes, staged and unstaged, puts them to one side, and leaves your files exactly as the last commit had them.",
      },
      {
        kind: "code",
        language: "bash",
        code: `git stash          # set aside changes to tracked files
git stash -u       # ...and new, untracked files too
git stash list     # stash@{0}: WIP on main: c000892 Add cart
git stash pop      # bring the latest back and remove it from the list
git stash apply    # bring it back but keep it in the list`,
      },
      {
        kind: "text",
        body: "Two things catch people out. A plain `git stash` leaves new, untracked files where they are, so add `-u` to take those too. And the stash lives only on your machine. It's never pushed, so it's a place to park work for an hour, not a backup.",
      },
      {
        kind: "text",
        body: "Bringing a stash back is a small merge, so it can conflict with what changed in the meantime. When `pop` hits a conflict, git keeps the stash in the list instead of dropping it. Resolve the file as you would any conflict, then remove the stash yourself with `git stash drop`.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: you pull with an edit in progress",
        code: `$ git pull
Updating c000892..01b6abb
error: Your local changes to the following files would be overwritten by merge:
\tcart.js
Please commit your changes or stash them before you merge.
Aborting`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Your `git pull` stopped with the error above, and your `cart.js` edit isn't ready to commit. What do you run?",
        options: [
          "`git stash`, then `git pull`, then `git stash pop`",
          "`git restore cart.js`, then `git pull`",
          '`git commit -am "WIP"`, then `git push`, then `git pull`',
          "`git stash`, then `git pull`, then `git stash drop`",
        ],
        answer: 0,
        explanation:
          "The stash moves your edit aside so the pull can update `cart.js`, and `pop` puts it back on top. `restore` would throw the edit away, `drop` deletes the stash instead of bringing it back, and pushing a WIP commit hands your half-finished work to everyone.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: right after stashing",
        code: `$ git stash
Saved working directory and index state WIP on main: c000892 Add cart
$ git status --short
?? notes.txt`,
      },
      {
        kind: "mcq",
        id: "q2",
        question: "You stashed, yet `git status` still shows `notes.txt`. Why?",
        options: [
          "The stash failed partway through",
          "`notes.txt` is untracked, and a plain `git stash` only takes tracked files",
          "`notes.txt` is listed in `.gitignore`",
          "A stash can only hold one file at a time",
        ],
        answer: 1,
        explanation:
          "`??` marks an untracked file, and a plain `git stash` leaves those alone. `git stash -u` would have taken it too. An ignored file wouldn't appear in `git status` at all.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: bringing the stash back after the pull",
        code: `$ git stash pop
Auto-merging cart.js
CONFLICT (content): Merge conflict in cart.js
...
The stash entry is kept in case you need it again.`,
      },
      {
        kind: "mcq",
        id: "q3",
        question: "`git stash pop` stopped with a conflict. Where is your stashed work now?",
        options: [
          "Gone: the conflict markers in `cart.js` are the only copy",
          "On GitHub, where git backs up stashes",
          "Still in `git stash list`, until you drop it once the file is resolved",
          "Folded into your last commit",
        ],
        answer: 2,
        explanation:
          "Git says so on the last line: when a pop conflicts, the stash is kept. Resolve `cart.js`, then `git stash drop`. Stashes never leave your machine.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Set your changes aside, including a new file you haven't added yet.",
        before: "git stash ",
        after: "",
        answer: "-u",
        accept: ["--include-untracked"],
        explanation:
          "`-u` (`--include-untracked`) takes new files as well as changes to tracked ones.",
      },
      {
        kind: "challenge",
        id: "sandbox",
        title: "Pull without losing your edit",
        prompt:
          "You're halfway through adding a discount function to `src/cart.js`, and a teammate has pushed a rounding fix to the same file. Get their fix into your `main` and carry on with your edit, still uncommitted.",
        language: "git",
        setup: script(
          ...SHOP,
          `@teammate ${write("src/cart.js", CART.replace("sum + i.price, 0)", "sum + Math.round(i.price * 100), 0) / 100"))}`,
          '@teammate git commit -am "Fix rounding in cart total"',
          "@teammate git push",
          write(
            "src/cart.js",
            `${CART}\nexport function applyDiscount(total, code) {\n  // TODO: look up the code\n}\n`,
          ),
        ),
        starter: "",
        hint: "`git pull` refuses because your edit is in the way. `git stash`, then `git pull`, then `git stash pop` to put your edit back on top.",
        solution: script("git stash", "git pull", "git stash pop"),
        tests: [
          {
            name: "Your `main` has your teammate's *Fix rounding in cart total*",
            expression: 'has main "Fix rounding in cart total"',
          },
          {
            name: "`src/cart.js` has their fix and your unfinished edit together",
            expression: 'contains src/cart.js "Math.round" && contains src/cart.js "applyDiscount"',
          },
          {
            name: "…and your edit is still uncommitted",
            expression:
              'has main "Fix rounding in cart total" && excludes HEAD:src/cart.js "applyDiscount" && contains src/cart.js "applyDiscount"',
          },
          {
            name: "The stash is empty and nothing is left conflicted",
            expression: 'has main "Fix rounding in cart total" && stashes 0 && idle',
          },
        ],
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** in your practice repository, edit a file and create a new one. Run `git stash` and check `git status`: the new file is still there. Run `git stash pop`, then try `git stash -u` and see both disappear. Bring them back with `git stash pop`.",
      },
    ],
  },
  "git-rescue.reset": {
    summary:
      "Undo commits you haven't pushed with reset, and know which of its modes deletes work.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "`git restore` undoes edits you haven't committed. `git reset` goes a step further: it moves your branch back to an earlier commit, as if the later ones had never been made. `HEAD~1` means *one commit before where I am*, and `HEAD~3` means three.",
      },
      {
        kind: "text",
        body: "Reset has three modes. They differ only in what happens to the changes from the commits you're undoing. With `--soft` they stay staged, ready to commit again. With `--mixed`, the default, they stay in your files but unstaged. With `--hard` they're thrown away, along with any uncommitted edits you had.",
      },
      {
        kind: "code",
        language: "bash",
        code: `git reset --soft HEAD~1   # undo the commit, keep its changes staged
git reset HEAD~1          # undo the commit, keep its changes unstaged
git reset --hard HEAD~1   # undo the commit and delete its changes`,
      },
      {
        kind: "callout",
        body: "`reset` rewrites history, so the rule from *Pull requests and review* applies: use it only on commits you haven't pushed, and `git revert` the ones you have. `--hard` also deletes uncommitted edits for good, so run `git status` before you use it. (Commits it removes can still be recovered, as the reflog lesson shows.)",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: three commits that should have been one",
        code: `$ git log --oneline
d4e5f6a (HEAD -> feature/coupons) fix typo
c3d4e5f wip 2
b2c3d4e wip
a1b2c3d (origin/main, main) Fix rounding in cart total`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          'None of the top three commits are pushed. You want them to become one commit, *Add coupon field*, with nothing lost. What do you run before `git commit -m "Add coupon field"`?',
        options: [
          "`git reset --hard HEAD~3`",
          "`git reset --soft HEAD~2`",
          "`git revert HEAD~3`",
          "`git reset --soft HEAD~3`",
        ],
        answer: 3,
        explanation:
          "`HEAD~3` is `a1b2c3d`, the commit before all three. `--soft` moves the branch there and leaves every change from the three commits staged, so one commit picks them all up. `HEAD~2` would keep `wip` as its own commit, `--hard` would delete the work, and `revert` adds undo commits instead of removing any.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "You just committed, then noticed `debug.log` went in by accident. The commit isn't pushed. You want the commit gone but every change still in your files, so you can stage it again properly. Which command?",
        options: [
          "`git reset HEAD~1`",
          "`git reset --hard HEAD~1`",
          "`git restore debug.log`",
          "`git revert HEAD`",
        ],
        answer: 0,
        explanation:
          "Plain `reset` is `--mixed`: the commit goes, and its changes stay in your files, unstaged, so you can `git add` only the ones you meant. `--hard` would delete them, `restore` doesn't touch the commit, and `revert` keeps the bad commit in history with an undo on top.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: two files edited, nothing committed",
        code: `$ git status --short
 M src/cart.js
 M src/checkout.js
$ git log --oneline -1
a1b2c3d (HEAD -> main, origin/main) Fix rounding in cart total`,
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "You want to throw away your edits to `src/cart.js` only, and keep the ones to `src/checkout.js`. What do you run?",
        options: [
          "`git reset --hard`",
          "`git reset --hard HEAD~1`",
          "`git restore src/cart.js`",
          "`git stash`",
        ],
        answer: 2,
        explanation:
          "`restore` works on the file you name. `git reset --hard` would discard both files' edits, adding `HEAD~1` would also remove a pushed commit, and `stash` sets both files aside.",
      },
      {
        kind: "challenge",
        id: "sandbox",
        title: "Three commits into one",
        prompt:
          "On `feature/coupons` you made three messy commits: *wip*, *wip 2* and *fix typo*. None are pushed. Turn them into a single commit called *Add coupon field*, keeping all of the work.",
        language: "git",
        setup: script(
          ...SHOP,
          "git switch -c feature/coupons",
          write("src/coupon.js", "export function couponField() {\n"),
          "git add .",
          'git commit -m "wip"',
          write(
            "src/coupon.js",
            "export function couponField() {\n  return '<input name=\"coupon\">';\n}\n",
          ),
          'git commit -am "wip 2"',
          write(
            "src/coupon.js",
            'export function couponField() {\n  return \'<input name="coupon" maxlength="12">\';\n}\n',
          ),
          'git commit -am "fix typo"',
        ),
        starter: "",
        hint: "`git reset --soft HEAD~3` takes the branch back to before the three commits and leaves all their changes staged. Then commit once.",
        solution: script("git reset --soft HEAD~3", 'git commit -m "Add coupon field"'),
        tests: [
          {
            name: "`feature/coupons` is one commit ahead of `main`",
            expression: "ahead feature/coupons main 1",
          },
          {
            name: "That commit is *Add coupon field*",
            expression: 'tip feature/coupons "Add coupon field"',
          },
          {
            name: "It has all the work, including the last fix",
            expression:
              'tip feature/coupons "Add coupon field" && contains feature/coupons:src/coupon.js "maxlength"',
          },
          {
            name: "`main` is untouched and nothing is left uncommitted",
            expression: 'tip feature/coupons "Add coupon field" && same main origin/main && clean',
          },
        ],
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** make three small commits on a practice branch. Run `git reset --soft HEAD~3` and check `git status`: everything is staged. Commit it as one. Then make a throwaway commit and try `git reset HEAD~1` and see the change come back unstaged.",
      },
    ],
  },
  "git-rescue.wrong-branch": {
    summary: "Move a commit made on the wrong branch, and keep work done in detached HEAD.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "The most common slip: you meant to start a branch, forgot, and committed straight onto `main`. If you haven't pushed, it's a quick fix. A branch is just a label, so first create one where you are now (your commits come with it), then move `main` back to where the remote has it. Stash any uncommitted edits first, because `reset --hard` discards them.",
      },
      {
        kind: "code",
        language: "bash",
        caption: "Committed on main, meant for a new branch",
        code: `git switch -c feature/discount   # a new label at your commit, and you're on it
git switch main
git reset --hard origin/main     # main goes back to what GitHub has`,
      },
      {
        kind: "text",
        body: "If the branch you meant already exists, copy the commit over with `git cherry-pick`. It replays one commit onto the branch you're on, as a new commit with a new ID. Then take it off `main` the same way.",
      },
      {
        kind: "code",
        language: "bash",
        caption: "Committed on main, meant for an existing branch",
        code: `git switch feature/discount
git cherry-pick e4f5a6b          # copy that commit here
git switch main
git reset --hard origin/main`,
      },
      {
        kind: "text",
        body: "The other way to end up in the wrong place is **detached HEAD**. Checking out an old commit to look at it (`git switch --detach a1b2c3d`, or `git checkout a1b2c3d`) puts you on no branch at all. Looking around is harmless. Committing there is the trap: those commits belong to no branch, and when you switch away, git warns that you're leaving them behind. Give them a branch before you leave, with `git switch -c <name>`.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: you meant to be on a branch",
        code: `$ git status
On branch main
Your branch is ahead of 'origin/main' by 1 commit.
  (use "git push" to publish your local commits)`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "That commit was meant for a new branch, `feature/discount`, which doesn't exist yet. What moves it there and puts `main` back?",
        options: [
          "`git reset --hard origin/main`, then `git switch -c feature/discount`",
          "`git push`, then open a pull request from `main`",
          "`git revert HEAD`, then `git switch -c feature/discount`",
          "`git switch -c feature/discount`, then `git switch main` and `git reset --hard origin/main`",
        ],
        answer: 3,
        explanation:
          "Create the branch first: it's a label at your commit, so the commit is safe on it. Only then move `main` back. The other way round, `reset` takes the commit off `main` before any branch holds it. Reverting would leave `main` with the commit and its undo, and the new branch would get both.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: leaving detached HEAD",
        code: `$ git switch main
Warning: you are leaving 1 commit behind, not connected to
any of your branches:

  38ddf90 Try new layout

If you want to keep it by creating a new branch, this may be a good time
to do so with:

 git branch <new-branch-name> 38ddf90

Switched to branch 'main'`,
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "You checked out an old commit to try a layout, committed there, then switched to `main` and got this warning. How do you keep that commit?",
        options: [
          "You can't: commits made in detached HEAD are discarded",
          "`git branch try-layout 38ddf90`",
          "`git stash pop`",
          "`git reset --hard 38ddf90`",
        ],
        answer: 1,
        explanation:
          "Git even prints the command. The commit still exists, but no branch points to it, and `git branch` gives it one. `reset --hard 38ddf90` would drag `main` back to the old commit your experiment started from, and nothing was stashed.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "You're in detached HEAD and about to make commits you want to keep. Create a branch here and move onto it.",
        before: "git switch ",
        after: " experiment",
        answer: "-c",
        accept: ["--create"],
        explanation:
          "`switch -c` creates a branch at the current commit and switches to it, so anything you commit next belongs to `experiment`.",
      },
      {
        kind: "challenge",
        id: "sandbox",
        title: "Move a commit off main",
        prompt:
          "You committed *Add discount field* straight onto `main` when it belonged on a new branch, `feature/discount`. It isn't pushed. Put it on that branch, and put `main` back where GitHub has it.",
        language: "git",
        setup: script(
          ...SHOP,
          write("index.html", '<h1>Shop</h1>\n<input name="discount">\n'),
          'git commit -am "Add discount field"',
        ),
        starter: "",
        hint: "Make the branch first, with `git switch -c feature/discount`, so the commit is safe on it. Then `git switch main` and `git reset --hard origin/main`.",
        solution: script(
          "git switch -c feature/discount",
          "git switch main",
          "git reset --hard origin/main",
        ),
        tests: [
          {
            name: "`feature/discount` has *Add discount field*",
            expression: 'has feature/discount "Add discount field"',
          },
          { name: "`main` doesn't", expression: 'lacks main "Add discount field"' },
          {
            name: "`main` is back where GitHub has it, with nothing left uncommitted",
            expression: "same main origin/main && clean",
          },
        ],
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** on `main` in your practice repository, make a commit you haven't pushed. Move it to a new branch with `git switch -c`, then put `main` back with `git reset --hard origin/main`. Check the result with `git log --oneline --graph --all`.",
      },
    ],
  },
  "git-rescue.reflog": {
    summary: "Find commits that seem lost with the reflog, and know what it can't bring back.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "Most *I've lost my work* moments aren't losses. Git keeps a private diary called the **reflog**: every time `HEAD` moves (a commit, a switch, a reset, a merge, a rebase), it writes down where it went. A commit that no branch points to any more still exists, and the reflog still has its ID.",
      },
      {
        kind: "code",
        language: "text",
        code: `$ git reflog
f89a07d HEAD@{0}: reset: moving to HEAD~1
711c658 HEAD@{1}: commit: Add coupon validation
f89a07d HEAD@{2}: commit: Fix rounding
bc674f3 HEAD@{3}: commit (initial): Add cart page`,
      },
      {
        kind: "text",
        body: "Read it from the top: `HEAD@{0}` is now, `HEAD@{1}` is one move ago, and so on. To get back to a moment, point your branch at it with `git reset --hard 711c658`. If you want to look before you leap, put a new branch there first (`git branch rescue 711c658`) and inspect it.",
      },
      {
        kind: "callout",
        body: "The reflog has limits. It's on your machine only, so a fresh clone doesn't have yours. Commits no branch points to are kept for about 30 days by default. And it only knows about commits: edits you never committed, then wiped with `restore` or `reset --hard`, were never in it.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: the wrong flag",
        code: `$ git reset --hard HEAD~1
HEAD is now at f89a07d Fix rounding
$ git reflog -3
f89a07d HEAD@{0}: reset: moving to HEAD~1
711c658 HEAD@{1}: commit: Add coupon validation
f89a07d HEAD@{2}: commit: Fix rounding`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You meant `--soft` and typed `--hard`. The unpushed *Add coupon validation* commit has vanished from `git log`. How do you get it back?",
        options: [
          "`git reset --hard 711c658`",
          "`git revert f89a07d`",
          "`git pull`, since GitHub still has it",
          "You can't: `--hard` deleted it",
        ],
        answer: 0,
        explanation:
          "The commit still exists and the reflog shows its ID, so pointing the branch back at it restores the commit and its files. It was never pushed, so GitHub has nothing to give you, and `revert` would undo *Fix rounding*, a commit you wanted.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: tidying up branches",
        code: `$ git branch -D feature/coupons
Deleted branch feature/coupons (was c88774e).`,
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A minute later you realise that branch had work you never merged. What brings it back?",
        options: [
          "`git switch feature/coupons`",
          "`git restore feature/coupons`",
          "`git branch feature/coupons c88774e`",
          "`git stash pop`",
        ],
        answer: 2,
        explanation:
          "Git printed the ID the branch pointed at. Deleting a branch removes the label, not the commits, so a new label at `c88774e` is the whole branch back. If that message has scrolled away, `git reflog` has the ID too.",
      },
      {
        kind: "mcq",
        id: "q3",
        question: "Which of these can the reflog **not** get back?",
        options: [
          "A commit removed with `git reset --hard`",
          "Edits you never committed, discarded with `git restore`",
          "A branch you deleted with `git branch -D`",
          "The commits you had before a rebase",
        ],
        answer: 1,
        explanation:
          "The reflog records where `HEAD` pointed, and only commits can be pointed at. Every other option was a commit at some moment. Uncommitted edits only ever lived in your files, which is why it pays to commit or stash before anything risky.",
      },
      {
        kind: "challenge",
        id: "sandbox",
        title: "Undo a bad five minutes",
        prompt:
          "You committed *Add coupon validation* on `main`, then wiped it with `git reset --hard HEAD~1`. Then you made `feature/wishlist`, committed *Add wishlist button* on it, went back to `main` and deleted the branch with `git branch -D`. Neither was pushed. Get both back.",
        language: "git",
        setup: script(
          ...SHOP,
          write(
            "src/coupon.js",
            "export const validCoupon = (code) => /^[A-Z0-9]{6}$/.test(code);\n",
          ),
          "git add .",
          'git commit -m "Add coupon validation"',
          "git reset --hard HEAD~1",
          "git switch -c feature/wishlist",
          write("src/wishlist.js", "export const wishlist = [];\n"),
          "git add .",
          'git commit -m "Add wishlist button"',
          "git switch main",
          "git branch -D feature/wishlist",
        ),
        starter: "",
        hint: "`git reflog` lists both commits with their ids. Recreate the branch with `git branch feature/wishlist <id>`, and point `main` back at the other with `git reset --hard <id>`.",
        solution: script("git branch feature/wishlist HEAD@{1}", "git reset --hard HEAD@{4}"),
        tests: [
          {
            name: "`main` has *Add coupon validation* back",
            expression: 'has main "Add coupon validation"',
          },
          {
            name: "`feature/wishlist` exists again, with *Add wishlist button*",
            expression: 'has feature/wishlist "Add wishlist button"',
          },
          {
            name: "…and that commit is still only on its branch",
            expression:
              'has feature/wishlist "Add wishlist button" && lacks main "Add wishlist button"',
          },
          {
            name: "Nothing is left uncommitted",
            expression: 'has main "Add coupon validation" && clean',
          },
        ],
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** make a commit on a practice branch, then remove it with `git reset --hard HEAD~1`. Find it in `git reflog` and bring it back with `git reset --hard <id>`. Then delete a branch with `git branch -D` and restore it from the ID git prints.",
      },
    ],
  },
  "git-rescue.rebase": {
    summary: "Replay a branch onto main with rebase, and the one rule that keeps it safe.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "When `main` moves on while you work on a branch, *Branching and merging* joined the two with a merge commit. `git rebase main` is the other way. It lifts your branch's commits off, moves the branch to the tip of `main`, and replays them one at a time. The result is a straight line, as if you'd started your branch today.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Before: main moved on after you branched",
        code: `* 77a0661 (main) Raise free shipping to 60
| * b5d5efc (HEAD -> feature/discount) Add discount field
|/
* 28a6e49 Add config`,
      },
      {
        kind: "code",
        language: "text",
        caption: "After: git rebase main, on feature/discount",
        code: `* f7f043c (HEAD -> feature/discount) Add discount field
* 77a0661 (main) Raise free shipping to 60
* 28a6e49 Add config`,
      },
      {
        kind: "text",
        body: "Look at the ID: `b5d5efc` became `f7f043c`. Rebase doesn't move commits, it makes new copies and abandons the old ones. That gives you the one rule: **don't rebase commits other people already have.** Their copies still carry the old IDs, and their next pull tangles both versions together. Rebasing your own branch that nobody else works on is fine, even after you've pushed it for a pull request.",
      },
      {
        kind: "text",
        body: "A replayed commit can conflict, just like a merge. Git stops at that commit, and you fix the file, `git add` it, and run `git rebase --continue`. `git rebase --abort` puts everything back as it was before you started. For unpushed work on a shared branch, `git pull --rebase` does the same trick when you pull: your commits go on top of what came down instead of getting a merge commit.",
      },
      {
        kind: "text",
        body: "After rebasing a branch you'd already pushed, a plain `git push` is rejected, because the remote still has the old copies. Git's hint suggests pulling, but here that's wrong: a pull would merge the old copies back in. Use `git push --force-with-lease`. It replaces the remote branch with yours, but refuses if someone else pushed to it since you last fetched, a check that plain `--force` skips.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "With history as in the *Before* graph, you run `git rebase main` on `feature/discount`. What changes?",
        options: [
          "*Add discount field* now sits on top of *Raise free shipping to 60*, with a new ID",
          "A new merge commit joins the two branches",
          "*Add discount field* now sits on top of *Raise free shipping to 60*, still as `b5d5efc`",
          "`main` now includes *Add discount field*",
        ],
        answer: 0,
        explanation:
          "Rebase replays your commit on the new base, and a replayed commit is a new commit, so it gets a new ID. It never creates a merge commit, and it only moves the branch you're on. `main` is untouched.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: a rebase stops",
        code: `$ git rebase main
Auto-merging config.js
CONFLICT (content): Merge conflict in config.js
error: could not apply 64476ac... Add discount code pattern
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".`,
      },
      {
        kind: "mcq",
        id: "q2",
        question: "You've edited `config.js` so it reads the way it should. What next?",
        options: [
          '`git commit -m "Fix conflict"`, then carry on working',
          "`git merge --abort`",
          "`git rebase --skip`",
          "`git add config.js`, then `git rebase --continue`",
        ],
        answer: 3,
        explanation:
          "Staging the file tells git it's resolved, and `--continue` finishes replaying the rest of your commits. `--skip` would drop your *Add discount code pattern* commit entirely, and `merge --abort` is for merges, not rebases.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: pushing your rebased pull request branch",
        code: `$ git push
 ! [rejected]        feature/discount -> feature/discount (non-fast-forward)
error: failed to push some refs to 'github.com:acme/shop.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.g.
hint: 'git pull ...') before pushing again.`,
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "Only you work on `feature/discount`, and you just rebased it onto `main`. What do you run?",
        options: [
          "`git pull`, as the hint says, then push again",
          "`git push --force-with-lease`",
          "Rebase again, then push",
          "`git push --force` to `main` instead",
        ],
        answer: 1,
        explanation:
          "The remote has the old copies of your commits, and you want it to have the new ones. Pulling would merge the old copies back in, so you'd have every commit twice. `--force-with-lease` replaces them, and stops if anyone else has pushed in the meantime.",
      },
      {
        kind: "mcq",
        id: "q4",
        question: "Which of these is safe to rebase?",
        options: [
          "`main`, after teammates have pulled it",
          "A branch you and a teammate both push to",
          "A release branch that other teams build from",
          "Your own feature branch, even after pushing it for a pull request",
        ],
        answer: 3,
        explanation:
          "Rebasing replaces commits. That's harmless when nobody else has the old ones. Everything else on the list is shared, so rebasing it would leave other people holding commits that no longer exist on the remote.",
      },
      {
        kind: "challenge",
        id: "sandbox",
        title: "Rebase your pull request branch",
        prompt:
          "Your branch `feature/discount` is pushed for a pull request, and `main` has moved on since. Bring the branch up to date with `main` as a straight line, with no merge commit, and update GitHub's copy.",
        language: "git",
        setup: script(
          ...SHOP,
          "git switch -c feature/discount",
          write("src/discount.js", "export const PATTERN = /^[A-Z0-9]{6}$/;\n"),
          "git add .",
          'git commit -m "Add discount field"',
          "git push -u origin feature/discount",
          "git switch main",
          write("index.html", "<h1>Shop</h1>\n<p>Free shipping over $60</p>\n"),
          'git commit -am "Raise free shipping to 60"',
          "git push",
          "git switch feature/discount",
        ),
        starter: "",
        hint: "`git rebase main` replays your commit on top of `main`. A plain push is then rejected, because GitHub has the old copy; replace it with `git push --force-with-lease`.",
        solution: script("git rebase main", "git push --force-with-lease"),
        tests: [
          {
            name: "`feature/discount` now includes *Raise free shipping to 60*",
            expression: 'has feature/discount "Raise free shipping to 60"',
          },
          {
            name: "…with no merge commit",
            expression:
              'has feature/discount "Raise free shipping to 60" && linear feature/discount',
          },
          {
            name: "GitHub's `feature/discount` matches yours, and its `main` is untouched",
            expression:
              'remote-has feature/discount "Raise free shipping to 60" && remote-same feature/discount feature/discount && remote-lacks main "Add discount field" && clean',
          },
        ],
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** branch off `main` and commit. Switch back to `main` and commit something else. Return to your branch, run `git rebase main`, and compare `git log --oneline --graph --all` before and after. Note that your commit's ID changed.",
      },
    ],
  },
  "git-rescue.secrets": {
    summary: "Stop tracking a file that shouldn't be in git, and what to do when a secret leaks.",
    xp: 110,
    blocks: [
      {
        kind: "text",
        body: "Two different accidents. The first is a file that's tracked but shouldn't be, like `node_modules/` committed before the `.gitignore` existed. Adding it to `.gitignore` now changes nothing, because `.gitignore` only affects files git isn't tracking yet. You have to untrack it: `git rm --cached` removes it from the repository and leaves it on your disk.",
      },
      {
        kind: "code",
        language: "bash",
        code: `echo "node_modules/" >> .gitignore
git rm -r --cached node_modules   # untrack it; the folder stays on disk
git commit -m "Stop tracking node_modules"`,
      },
      {
        kind: "text",
        body: "The second is a secret: an API key, a password, a `.env` file. If it was pushed, **treat the key as stolen and replace it first**. Revoke it wherever it was issued and make a new one. Automated scanners watch public GitHub for keys, and a leaked one can be in use within minutes, long before you've cleaned up history. Rotating the key is the fix. Removing it from git is tidying up.",
      },
      {
        kind: "text",
        body: "Then take it out of the repository. If it's only in your latest commit and you haven't pushed, `git rm --cached .env`, add `.env` to `.gitignore`, and `git commit --amend`. If it's further back or already pushed, deleting the file in a new commit isn't enough, because earlier commits still hold it. Rewriting all of history takes a tool such as `git filter-repo`, and every collaborator has to re-clone afterwards. That's why rotating comes first.",
      },
      {
        kind: "callout",
        body: "GitHub's push protection may block a push that contains a key it recognises. If it does, it has done you a favour: fix the commit before pushing rather than bypassing the block.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: an ignored folder that still shows up",
        code: `$ cat .gitignore
node_modules/
$ git status --short
 M node_modules/.package-lock.json`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "`node_modules/` is in `.gitignore`, yet git still shows changes inside it. Why, and what's the fix?",
        options: [
          "It was committed earlier, so it's tracked. Untrack it with `git rm -r --cached node_modules` and commit",
          "`.gitignore` isn't committed yet. Commit it and the changes disappear",
          "The pattern is wrong. It should be `node_modules/*`",
          "It was committed earlier, so it's tracked. Delete the folder from your disk and commit",
        ],
        answer: 0,
        explanation:
          "`.gitignore` only stops untracked files from being added, and this folder was already tracked. `rm --cached` untracks it and keeps it on disk. Deleting the folder would untrack it too, but also delete the dependencies your project needs to run.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Ten minutes ago you pushed a commit containing a live Stripe secret key to a public repository. What do you do first?",
        options: [
          "Delete the file in a new commit and push",
          "Make the repository private",
          "Revoke the key in Stripe and issue a new one",
          "Rewrite history with `git filter-repo` and force-push",
        ],
        answer: 2,
        explanation:
          "The key has been public for ten minutes, so assume it's been copied. Only revoking it stops it working. Deleting the file leaves it in history, going private doesn't un-copy it, and rewriting history is the cleanup that comes after, not instead.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "You committed `.env` in your latest commit and haven't pushed. Take it out of the repository but keep it on your disk.",
        before: "git rm ",
        after: " .env",
        answer: "--cached",
        explanation:
          "`--cached` removes the file from what git tracks and leaves your copy alone. Add `.env` to `.gitignore` and run `git commit --amend`, and the commit no longer contains it.",
      },
      {
        kind: "challenge",
        id: "sandbox",
        title: "Stop tracking node_modules",
        prompt:
          "Someone committed `node_modules/` before the project had a `.gitignore`. Stop git tracking it, keep the folder on your disk, and make sure it can't be added again.",
        language: "git",
        setup: script(
          "git init",
          write("package.json", '{ "name": "shop" }\n'),
          write("index.js", "require('lodash');\n"),
          write("node_modules/lodash/index.js", "module.exports = {};\n"),
          "git add .",
          'git commit -m "Add shop"',
          "git remote add origin git@github.com:you/shop.git",
          "git push -u origin main",
        ),
        starter: "",
        hint: 'Add it to `.gitignore` with `echo "node_modules/" >> .gitignore`, untrack it with `git rm -r --cached node_modules`, then stage `.gitignore` and commit.',
        solution: script(
          'echo "node_modules/" >> .gitignore',
          "git rm -r --cached node_modules",
          "git add .gitignore",
          'git commit -m "Stop tracking node_modules"',
        ),
        tests: [
          { name: "`node_modules` is no longer tracked", expression: "untracked node_modules" },
          {
            name: "…but it's still on your disk",
            expression: "untracked node_modules && present node_modules/lodash/index.js",
          },
          {
            name: "Your latest commit no longer contains it",
            expression: "absent HEAD:node_modules",
          },
          {
            name: "A committed `.gitignore` keeps it out",
            expression: 'contains HEAD:.gitignore "node_modules"',
          },
          { name: "Nothing is left uncommitted", expression: "absent HEAD:node_modules && clean" },
        ],
      },
      {
        kind: "callout",
        body: "**Try it on your machine:** in your practice repository, commit a folder called `build/` with a file in it. Add `build/` to `.gitignore` and change the file: `git status` still shows it. Untrack it with `git rm -r --cached build` and commit, then change the file again and see git ignore it.",
      },
    ],
  },
};
