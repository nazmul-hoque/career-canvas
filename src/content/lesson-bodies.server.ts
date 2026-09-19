import { findLesson } from "./curriculum";
import type { LessonBody } from "./lessons";

/**
 * The authored lessons, answers included. Server-only: the Start plugin refuses
 * to bundle `*.server.*` into the client, which is what keeps the answer key out
 * of the browser. The browser gets `toPublicBody()` through `getLessonFn`, and
 * learns which lessons exist from `lesson-manifest.gen.ts` — regenerate that with
 * `bun run lessons:manifest` after adding or removing a body here.
 */
export const bodies: Record<string, LessonBody> = {
  "js-basics.functions": {
    summary: "Functions package a job so you can run it whenever you need it.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: 'A function is a named recipe. You hand it ingredients (arguments), it does its work, and it hands something back (the return value). If a function does not return anything, calling it gives you `undefined` — one of the most common sources of the dreaded "why is my value empty?" bug.',
      },
      {
        kind: "code",
        language: "javascript",
        caption: "A function with an explicit return",
        code: `function total(price, quantity) {\n  return price * quantity;\n}\n\nconsole.log(total(12, 3)); // 36`,
      },
      {
        kind: "callout",
        body: "Rule of thumb: if you ever write `const x = someFunction()` and `x` is undefined, check whether the function actually returns.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "What does `total(4, 5)` evaluate to if the function body is `price * quantity` with no `return`?",
        options: ["20", "undefined", "NaN", "It throws an error"],
        answer: 1,
        explanation:
          "The multiplication happens, but nothing is handed back, so the call evaluates to undefined.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the arrow function so it hands back the doubled value.",
        before: "const double = (n) => ",
        after: ";",
        answer: "n * 2",
        explanation: "An arrow function with a single expression body returns that expression.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Write a discount helper",
        prompt:
          "Write a function `applyDiscount(price, percent)` that returns the price after the discount. `applyDiscount(200, 25)` should return 150.",
        language: "javascript",
        starter: `function applyDiscount(price, percent) {\n  // your code here\n}\n\nconsole.log(applyDiscount(200, 25));`,
        hint: "A 25% discount means you keep 75% — multiply by (100 - percent) / 100.",
        solution: `function applyDiscount(price, percent) {\n  return price * (100 - percent) / 100;\n}`,
        tests: [
          { name: "applyDiscount(200, 25) === 150", expression: "applyDiscount(200, 25) === 150" },
          { name: "applyDiscount(80, 0) === 80", expression: "applyDiscount(80, 0) === 80" },
          { name: "applyDiscount(50, 100) === 0", expression: "applyDiscount(50, 100) === 0" },
        ],
      },
    ],
  },
  "js-debug.fixit": {
    summary: "Debug a broken cart total by reading the evidence, not by guessing.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "A shopper reports that their cart total is wrong. Before changing a single character, form a theory: what would you *expect* each line to produce, and where does reality first disagree?",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "The bug report",
        code: `Cart: 2 x 9.99, 1 x 24.50\nExpected total: 44.48\nActual total: 0`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "A `reduce` returns 0 for a non-empty array. What is the most likely cause?",
        options: [
          "The array is frozen",
          "The callback does not return the accumulator",
          "reduce cannot be used on objects",
          "The initial value must be omitted",
        ],
        answer: 1,
        explanation:
          "If the callback forgets to return, the accumulator becomes undefined and the result collapses.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Fix the cart total",
        prompt:
          "`cartTotal` should multiply each item's price by its quantity and sum the results. Fix it so `cartTotal(items)` returns 44.48.",
        language: "javascript",
        starter: `function cartTotal(items) {\n  return items.reduce((sum, item) => {\n    sum + item.price * item.quantity;\n  }, 0);\n}\n\nconst items = [\n  { price: 9.99, quantity: 2 },\n  { price: 24.5, quantity: 1 },\n];\n\nconsole.log(cartTotal(items));`,
        hint: "Look at the arrow function body. Is anything actually returned from it?",
        solution: `return items.reduce((sum, item) => sum + item.price * item.quantity, 0);`,
        tests: [
          {
            name: "Totals a two-line cart correctly",
            expression:
              "Math.abs(cartTotal([{price:9.99,quantity:2},{price:24.5,quantity:1}]) - 44.48) < 0.001",
          },
          { name: "An empty cart totals 0", expression: "cartTotal([]) === 0" },
        ],
      },
    ],
  },
  "layout.responsive": {
    summary: "Make a layout that holds together from a phone to a widescreen monitor.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "Responsive layout is less about breakpoints than about letting elements decide their own size. `flex: 1` tells a child to take whatever space is left after its siblings have taken what they need.",
      },
      {
        kind: "code",
        language: "css",
        caption: "The card should fill the leftover space",
        code: `.row {\n  display: flex;\n  gap: 16px;\n}\n\n.card {\n  /* stretch me */\n}`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What does `flex: 1` expand to?",
        options: [
          "flex-grow: 1; flex-shrink: 1; flex-basis: 0%",
          "flex-grow: 1; flex-shrink: 0; flex-basis: auto",
          "width: 100%",
          "flex-basis: 1px",
        ],
        answer: 0,
        explanation:
          "With a basis of 0 the item ignores its content width and shares the free space evenly.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the declaration so the card fills the remaining width.",
        before: ".card { ",
        after: "; }",
        answer: "flex: 1",
        explanation: "flex: 1 is the shorthand for grow 1, shrink 1, basis 0%.",
      },
    ],
  },
  "py-basics.flow": {
    summary: "Branch your program with if, elif and else.",
    xp: 110,
    blocks: [
      {
        kind: "text",
        body: "Python reads conditions top to bottom and stops at the first branch that is true. Order matters: put the most specific condition first, or it will never be reached.",
      },
      {
        kind: "code",
        language: "python",
        code: `score = 87\n\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelse:\n    grade = "C"\n\nprint(grade)  # B`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why must the `>= 90` branch come before `>= 80`?",
        options: [
          "Python sorts conditions automatically",
          "A score of 95 also satisfies >= 80, so the looser branch would win first",
          "elif cannot follow a stricter condition",
          "It does not matter",
        ],
        answer: 1,
        explanation: "Only the first matching branch runs, so looser conditions must come last.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Grade the score",
        prompt:
          "Write a function `grade(score)` returning 'A' for 90+, 'B' for 80-89, and 'C' below 80.",
        language: "python",
        starter: `def grade(score):\n    # your code here\n    pass\n\nprint(grade(87))`,
        hint: "Use if / elif / else and return inside each branch.",
        solution: `def grade(score):\n    if score >= 90:\n        return "A"\n    elif score >= 80:\n        return "B"\n    return "C"`,
        tests: [
          { name: "95 scores an A", expression: 'grade(95) == "A"' },
          { name: "90 is the boundary for an A", expression: 'grade(90) == "A"' },
          { name: "87 scores a B", expression: 'grade(87) == "B"' },
          { name: "Anything under 80 scores a C", expression: 'grade(41) == "C"' },
        ],
      },
    ],
  },
  "py-collections.comprehensions": {
    summary: "Build new lists in one readable line.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "A comprehension is a loop that produces a list. Read it out loud: 'the square of n, for every n in numbers, where n is even'.",
      },
      {
        kind: "code",
        language: "python",
        code: `numbers = [1, 2, 3, 4, 5, 6]\nsquares = [n * n for n in numbers if n % 2 == 0]\nprint(squares)  # [4, 16, 36]`,
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the comprehension that keeps only names longer than three characters.",
        before: "[name for name in names ",
        after: "]",
        answer: "if len(name) > 3",
        explanation: "The filter clause comes after the for clause.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Only the paid orders",
        prompt:
          "Write `paid_totals(orders)` that returns a list of the `total` of every order whose `status` is 'paid'.",
        language: "python",
        starter: `def paid_totals(orders):\n    # your code here\n    pass`,
        hint: 'orders is a list of dicts — loop over it inside square brackets and filter on o["status"].',
        solution: `def paid_totals(orders):\n    return [o["total"] for o in orders if o["status"] == "paid"]`,
        tests: [
          {
            name: "Keeps only the paid orders",
            expression:
              'paid_totals([{"total": 10, "status": "paid"}, {"total": 99, "status": "pending"}]) == [10]',
          },
          {
            name: "Keeps the original order",
            expression:
              'paid_totals([{"total": 5, "status": "paid"}, {"total": 7, "status": "paid"}]) == [5, 7]',
          },
          { name: "An empty list gives an empty list", expression: "paid_totals([]) == []" },
        ],
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
          'You now run `git commit -m "Fix rounding in cart total"`. What goes into the commit?',
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
          "`a91c3e0 Updates`",
          "`a91c3e0 Fix cart.js`",
          "`a91c3e0 Round cart total in cents`, with a body explaining the float bug it fixes",
          "`a91c3e0 Changes after review from Sam`",
        ],
        answer: 2,
        explanation:
          "The diff already shows which file changed. Only the message can record why, and a subject that states the effect is what they'll find when searching the log.",
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
        question: "On `main`, you run `git merge feature/discount-codes`. What happens?",
        options: [
          "Git creates a merge commit with two parents",
          "A conflict, because both branches touched the cart",
          "`main` moves to `7d1e9a0`: a fast-forward, with no new commit",
          "The two feature commits are copied onto `main` with new IDs",
        ],
        answer: 2,
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
        question: "Now what does `git merge feature/discount-codes` produce?",
        options: [
          "A fast-forward to `7d1e9a0`",
          "A new merge commit whose parents are `5e6f7a8` and `7d1e9a0`",
          "It discards `5e6f7a8` to make room for the feature",
          "An error: branches that have diverged can't be merged",
        ],
        answer: 1,
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
        question: "What would do the most to get this a real review?",
        options: [
          "Add more reviewers so someone notices it",
          "Mark it urgent",
          "Approve it yourself, since the tests pass",
          "Split it into focused PRs, each saying what changes, why, and how it was tested",
        ],
        answer: 3,
        explanation:
          "Nobody can review 1,800 unexplained lines properly. They skim and approve. Small, explained PRs are the only kind that get a real review.",
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
        question: "How do you undo pull request #42?",
        options: [
          "`git revert -m 1 f00ba12`, then push the revert (or open a PR for it)",
          "`git reset --hard 5e6f7a8`, then `git push --force`",
          "`git commit --amend` to edit the merge",
          "Delete the `feature/discount-codes` branch",
        ],
        answer: 0,
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
          "Resolve the thread, since it's an edge case",
          "Reply that it works on your machine",
          "Squash everything and force-push a clean version",
          "Add a test for the empty case, fix it in a new commit, and reply saying what changed",
        ],
        answer: 3,
        explanation:
          "A new commit shows the reviewer exactly what changed since they last looked, the test stops the bug coming back, and your reply lets them close the thread.",
      },
    ],
  },
};

export function getLessonBody(courseId: string, lessonId: string): LessonBody | null {
  if (!findLesson(courseId, lessonId)) return null;
  return bodies[lessonId] ?? null;
}
