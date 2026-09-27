import type { LessonBody } from "./lessons";

/**
 * Authored Git course lessons. Answer keys stay server-side. The first two
 * modules still live in the lesson-bodies.server.ts backlog.
 *
 * Every terminal transcript here was captured from a real git 2.40 session,
 * hint text included, so a learner comparing it with their own screen sees
 * the same words.
 */
export const gitLessonBodies: Record<string, LessonBody> = {
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
          "`git reset --hard HEAD~1`",
          "`git reset HEAD~1`",
          "`git restore debug.log`",
          "`git revert HEAD`",
        ],
        answer: 1,
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
          "`git restore src/cart.js`",
          "`git reset --hard`",
          "`git reset --hard HEAD~1`",
          "`git stash`",
        ],
        answer: 0,
        explanation:
          "`restore` works on the file you name. `git reset --hard` would discard both files' edits, adding `HEAD~1` would also remove a pushed commit, and `stash` sets both files aside.",
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
          "`git switch -c feature/discount`, then `git switch main` and `git reset --hard origin/main`",
          "`git revert HEAD`, then `git switch -c feature/discount`",
        ],
        answer: 2,
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
          "`git stash pop`",
          "`git reset --hard 38ddf90`",
          "`git branch try-layout 38ddf90`",
        ],
        answer: 3,
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
          "`git add config.js`, then `git rebase --continue`",
          "`git merge --abort`",
          "`git rebase --skip`",
        ],
        answer: 1,
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
          "Rebase again, then push",
          "`git push --force` to `main` instead",
          "`git push --force-with-lease`",
        ],
        answer: 3,
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
        kind: "callout",
        body: "**Try it on your machine:** in your practice repository, commit a folder called `build/` with a file in it. Add `build/` to `.gitignore` and change the file: `git status` still shows it. Untrack it with `git rm -r --cached build` and commit, then change the file again and see git ignore it.",
      },
    ],
  },
};
