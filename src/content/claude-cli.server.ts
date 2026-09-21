/**
 * Level 2 of the Claude course: Claude Code in a terminal.
 *
 * Thirty-two task specs merged into nine lessons. Flags, subcommands and
 * permission-mode names are checked against code.claude.com rather than
 * recalled — a course that teaches a flag that no longer exists is worse than
 * one that teaches nothing.
 */
import type { AuthoredLesson } from "./authored-lesson";
import { ATTESTED_XP } from "./gamification";

const REFERENCE = "Claude Code CLI reference · https://code.claude.com/docs/en/cli-reference";

export const claudeCliLessons: AuthoredLesson[] = [
  {
    slug: "first-session",
    title: "Install, check, and open your first session",
    minutes: 20,
    type: "practice",
    body: {
      summary: "Get Claude Code running in a folder where mistakes are cheap.",
      xp: 120,
      blocks: [
        {
          kind: "text",
          body: "Claude Code runs in a terminal, and it works inside **the folder you launch it from**. That sentence is the whole mental model for this level: the directory is the boundary. Start it in your home folder and it can see everything you own; start it in a scratch project and that project is its world.",
        },
        {
          kind: "text",
          body: "So the first habit is the practice folder. Make a throwaway directory with a few files you would not mind losing, and `cd` into it before you type `claude`. Everything in this level is safe to do there and nowhere else — not because Claude is reckless, but because you are about to be, and learning where the edges are is the point.",
        },
        {
          kind: "code",
          language: "bash",
          caption: "Check where you are, then install and verify",
          code: `pwd                    # which folder am I in?
mkdir -p ~/claude-practice && cd ~/claude-practice

claude --version       # confirms the install
claude doctor          # diagnoses a broken or partial setup`,
        },
        {
          kind: "text",
          body: "Install from Anthropic's own setup page for your operating system. This is worth being fussy about: an agent that can read your files and run commands is exactly the thing an attacker would like you to install from a stranger's copy-pasted script. `claude doctor` is the diagnostic to run when something behaves oddly later — it checks the installation and reports what is wrong rather than leaving you guessing.",
        },
        {
          kind: "text",
          body: "Signing in decides **which account gets billed and which organisation's policies apply**. If you have both a personal account and a work one, the difference matters before you start pasting anything work-related into a session.",
        },
        {
          kind: "text",
          body: 'Then start a session with `claude` and, before asking for a single edit, ask what it can see. A first session that begins "what files are in this folder, and what does this project appear to do?" tells you whether the boundary is where you think it is.',
        },
        {
          kind: "callout",
          body: "**Practice.** Open a terminal and name the shell and folder your prompt is showing. Create a disposable practice project and `cd` into it. Install from the official page, run `claude --version` and `claude doctor`, and record anything the check flags. Sign in with the account you intend to use. Start a session and ask what it can see before requesting any change. Then run `claude --help` and find the flags for print mode, model choice and continuing a session — you'll use all three in this level.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "You keep your side projects in ~/projects and your notes in ~/Documents. You start Claude with `cd ~ && claude`. What have you done?",
          options: [
            "Nothing unusual — Claude only reads files you mention",
            "Started a session with no working directory until you name one",
            "Given the session your whole home folder as its working directory, notes and all",
            "Limited Claude to ~/projects, since that's where the code is",
          ],
          answer: 2,
          explanation:
            "The launch directory is the working directory, and everything beneath it is in scope. That's why the practice habit is to `cd` into a small folder first — the boundary is set by where you start, not by what you ask about.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "What is `claude doctor` for?",
          options: [
            "Asking Claude to diagnose a bug in your code",
            "Checking your code for security problems",
            "Repairing a corrupted git repository",
            "Diagnosing your Claude Code installation and setup",
          ],
          answer: 3,
          explanation:
            "It's a health check on the tool itself, not on your project. Reach for it when Claude Code is behaving strangely — a wrong install path or a stale version explains a surprising number of odd sessions.",
        },
      ],
    },
  },
  {
    slug: "explore-before-changing",
    title: "Ask before you edit",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Use read-only questions to build an accurate picture before anything changes.",
      xp: 120,
      blocks: [
        {
          kind: "text",
          body: 'The most useful thing Claude Code does in an unfamiliar project is not write code. It\'s answer "what is this?" — and it can do that without changing a byte. Read-only work is free in the sense that matters: nothing needs reviewing, nothing needs undoing.',
        },
        {
          kind: "text",
          body: "Ask for a map first. The top-level files, the likely entry point, where configuration lives, and the command that runs the tests. Then **check the map against the filesystem yourself**. This is not a ritual — it's how you calibrate. A project map that gets the test command wrong tells you something useful about how much to trust the next answer.",
        },
        {
          kind: "text",
          body: 'When you have a specific question, point at a specific file. "What does `src/auth/session.ts` do when the token has expired?" beats "how does auth work", because the narrow question has a verifiable answer: you can open the file and see.',
        },
        {
          kind: "code",
          language: "text",
          caption: "An error report with enough context to diagnose",
          code: `I ran: npm run build
I expected: a clean build, like yesterday
I got:

  TS2345: Argument of type 'string | undefined' is not
  assignable to parameter of type 'string'.
    at src/config.ts:42

Diagnose this before proposing a fix. Tell me what you're
confident about and what you're guessing.`,
        },
        {
          kind: "text",
          body: 'Three parts do the work there: the command, the expectation, and the actual output. Most unhelpful debugging sessions are unhelpful because only the third was supplied — without the expectation, Claude has to guess what "working" meant, and without the command it has to guess how you got there.',
        },
        {
          kind: "text",
          body: "Asking for a **diagnosis before a fix** is the other half. A fix arrives as a change you now have to evaluate; a diagnosis arrives as a claim you can check. When the diagnosis is wrong you have learned something cheaply, which is not true of a wrong fix you accepted.",
        },
        {
          kind: "callout",
          body: "**Practice.** In your practice project, ask Claude to describe the top-level files, the likely entry point and the test command without editing anything — then verify each claim against the filesystem. Ask one focused question about one small file and confirm the answer by reading it. Finally, take a real error, supply the command, the expectation and the output, and ask for a diagnosis that separates evidence from guesses.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Claude tells you the project's tests run with `npm test`, but the package.json has no test script. What's the useful conclusion?",
          options: [
            "Claude is unreliable and shouldn't be used on this project",
            "The project is misconfigured and needs a test script",
            "A plausible default got filled in for a gap, so verify the other claims in that map too",
            "The answer was a hallucination, so the session should be restarted",
          ],
          answer: 2,
          explanation:
            "`npm test` is the most common answer to that question, which is exactly why it appears when the real answer isn't there. One checkable claim failing is a calibration signal for the rest of the map — that's why you check the map.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Why ask for a diagnosis before a fix?",
          options: [
            "Diagnoses are faster to produce than fixes",
            "It avoids using up the session's context",
            "A diagnosis is a claim you can check; a fix is a change you have to evaluate",
            "Claude writes better code when it explains the problem first",
          ],
          answer: 2,
          explanation:
            'Checking "the config type allows undefined but the function requires a string" is quick and decisive. Evaluating a diff means reconstructing the reasoning anyway — and a wrong fix you accept is far more expensive than a wrong claim you reject.',
        },
      ],
    },
  },
  {
    slug: "context",
    title: "Managing a session's context",
    minutes: 16,
    type: "practice",
    body: {
      summary: "When to stay in a session, when to start fresh, and what compaction costs.",
      xp: 110,
      blocks: [
        {
          kind: "text",
          body: "A session accumulates. Everything you've asked, every file that's been read, every command's output stays in view — which is what makes follow-up questions work. You can say \"now do the same for the other handler\" and it knows what \"the same\" means. Re-pasting the context every time is the beginner's tax, and staying in one session is how you stop paying it.",
        },
        {
          kind: "text",
          body: "The same accumulation is a liability when you change subject. Switch from a CSS bug to a database migration in the same session and the earlier material is still there, quietly shaping answers — the model has been primed to think in terms of a problem you have finished with. **A new topic deserves a new session.** It costs you one command and removes a whole class of confusing answer.",
        },
        {
          kind: "text",
          body: "For long work on one topic there's a middle option: compaction, which summarises the conversation so far and continues with the summary in place of the transcript. It buys room, and it is lossy by definition. After compacting, ask Claude to restate the current goal and constraints — if the restatement has drifted, correct it immediately rather than discovering the drift three edits later.",
        },
        {
          kind: "callout",
          body: "**Find the commands in your own install.** Interactive commands change more often than flags do. Type `/help` inside a session and read the list your version prints, rather than trusting a command name you read somewhere — including here.",
        },
        {
          kind: "callout",
          body: "**Practice.** Hold one session across a two-turn exchange where the follow-up clearly relies on what came before. Then switch to an unrelated task and deliberately start fresh, noticing what you no longer have to explain — and what you no longer have to undo. On a long session, run your version's compaction command and check that the goal survived it.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "You've spent an hour on a failing test. Now you want help naming some CSS variables. What's the better move?",
          options: [
            "Stay in the session — more context always helps Claude understand your project",
            "Start a fresh session, so an hour of test debugging doesn't colour an unrelated question",
            "Compact the session first, then ask",
            "Ask in the same session but tell Claude to ignore everything above",
          ],
          answer: 1,
          explanation:
            "Unrelated context doesn't help; it biases. Compacting keeps a summary of the irrelevant work, and \"ignore everything above\" doesn't remove it from view. The clean boundary is a new session.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "After compacting a long session, why restate the goal?",
          options: [
            "Compaction clears the working directory",
            "It's required before Claude will continue",
            "Compaction replaces the transcript with a summary, so detail can be lost",
            "It resets the model to its default behaviour",
          ],
          answer: 2,
          explanation:
            "A summary is smaller than what it summarises, and the constraint that gets dropped is usually the one you stopped repeating because it was obvious. Checking the restatement catches the drift while it's still cheap.",
        },
      ],
    },
  },
  {
    slug: "plan-and-review",
    title: "Plan first, then review the diff",
    minutes: 20,
    type: "practice",
    body: {
      summary: "Separate deciding what to do from doing it, and never accept an unread change.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "For anything beyond a one-line change, split the work in two: decide what should happen, then let it happen. Claude Code has a **plan mode** for exactly this — it investigates and proposes without touching files. You can start a session in it with `--permission-mode plan`, or switch modes inside a session.",
        },
        {
          kind: "code",
          language: "bash",
          caption: "Start read-only, decide, then act",
          code: `claude --permission-mode plan`,
        },
        {
          kind: "text",
          body: 'A plan worth approving names the files it will touch, the check it will run afterwards, and what it is unsure about. A plan that says "I\'ll refactor the auth module and improve error handling" has told you nothing you can evaluate — send it back and ask which files.',
        },
        {
          kind: "text",
          body: "Then review the diff. Not the description of the diff — the diff. The failure mode here is social rather than technical: a confident summary of a change is pleasant to read and reviewing the change is work, so the summary quietly becomes the thing you approve. Read what actually changed, and if it's larger than the plan said, that discrepancy is the most interesting thing on your screen.",
        },
        {
          kind: "text",
          body: "Finish by running the project's own checks — the narrowest relevant one, not the whole suite. \"Run the tests for the file you changed\" is a tighter loop than a full CI run, and a failure points somewhere specific. The project's existing test command is the authority on whether the change worked; Claude's opinion that it looks correct is not.",
        },
        {
          kind: "callout",
          body: "**Practice.** Take a small change in your practice project and get a read-only plan first, with files, checks and risks named. Approve it, let one disposable file change, then inspect the diff and write one sentence describing what actually changed. Ask Claude to find and run the narrowest relevant check, and record the exact command and its result.",
        },
        {
          kind: "fill",
          id: "f1",
          prompt: "Start a session that investigates but cannot edit until you approve a plan.",
          before: "claude --permission-mode ",
          after: "",
          answer: "plan",
          accept: ["plan"],
          explanation:
            "`--permission-mode` also accepts `default`, `acceptEdits`, `auto`, `dontAsk` and `bypassPermissions`. `plan` is the read-only one: investigation happens, edits wait.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "The plan named two files. The diff touches five, and the extra three are 'related cleanups'. What should you do?",
          options: [
            "Accept it — cleanups are an improvement and the tests pass",
            "Accept the change but ask for the cleanups to be a separate commit",
            "Accept it if the three extra files are small",
            "Reject or revert it: the change exceeded what you approved, and passing tests don't tell you what else moved",
          ],
          answer: 3,
          explanation:
            "You approved a scope. Work outside it hasn't been reviewed by anyone, and a green test suite only says nothing you already test for broke. The discrepancy is the signal — treat it as one.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Which of these is a plan you can actually evaluate?",
          options: [
            '"Edit src/auth/session.ts to return null on expiry, update its two callers in src/api/, then run npm test -- session. Unsure whether the mobile client relies on the throw."',
            '"Refactor the session module and improve error handling"',
            '"Fix the bug properly this time, with tests"',
            '"Make the changes we discussed and verify them"',
          ],
          answer: 0,
          explanation:
            "It names the files, the behaviour change, the check, and the thing it isn't sure about — so you can disagree with it specifically. The others describe an intention, which you can only approve or not on faith.",
        },
      ],
    },
  },
  {
    slug: "print-mode",
    title: "One-shot answers: print mode and pipes",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Use Claude as a command in a pipeline, not only as a conversation.",
      xp: 120,
      blocks: [
        {
          kind: "text",
          body: "Not every question deserves a session. `--print` (or `-p`) sends one prompt, prints the answer and exits — which makes Claude Code an ordinary command, and ordinary commands compose.",
        },
        {
          kind: "code",
          language: "bash",
          caption: "One-shot, piped, and machine-readable",
          code: `claude -p "What does the --add-dir flag do?"

printf 'one\\ntwo\\n' | claude -p "Turn this into a checklist"

claude -p "List this project's entry points" --output-format json`,
        },
        {
          kind: "text",
          body: "Piping is where this earns its place: anything your shell can produce, Claude can read. A log excerpt, a diff, a CSV sample. Keep what you pipe small and non-sensitive — a pipeline makes it very easy to send a great deal more than you intended, and `cat .env | claude -p ...` is a mistake you only get to make once.",
        },
        {
          kind: "text",
          body: "`--output-format json` returns a structured result instead of prose, so another program can consume it. Inspect what your installed version actually returns before you build on it: fields differ between versions, and a script that assumes a field that isn't there fails at the least convenient moment.",
        },
        {
          kind: "callout",
          body: "**Practice.** Send a one-shot question that exits after printing. Pipe a small, safe local text sample into print mode and ask for a transformation. Then run a one-shot query with JSON output and pass it through another command — `jq` or a formatter — to confirm it parses, noting which fields your version returns.",
        },
        {
          kind: "fill",
          id: "f1",
          prompt: "Ask one question and exit, without opening an interactive session.",
          before: "claude ",
          after: ' "What does this project do?"',
          answer: "-p",
          accept: ["-p", "--print"],
          explanation:
            "`-p` is the short form of `--print`. It's what turns Claude Code into something you can put in a pipeline or a script.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "Why inspect the JSON fields your own installed version returns?",
          options: [
            "The shape can differ between versions, so a script built on a remembered field can break",
            "JSON output is experimental and may be wrong",
            "The fields are different for every prompt",
            "JSON output is slower and should be used sparingly",
          ],
          answer: 0,
          explanation:
            "You're building an integration against a contract, so read the contract from the version you actually run. This is the same instinct as checking `--help` on your install rather than trusting a flag you saw in a blog post.",
        },
      ],
    },
  },
  {
    slug: "sessions",
    title: "Continue, resume, and choose a model",
    minutes: 14,
    type: "practice",
    body: {
      summary: "Pick up the right past session, and pick the model on purpose.",
      xp: 110,
      blocks: [
        {
          kind: "text",
          body: "Sessions outlive the terminal window. `--continue` picks up the most recent one; `--resume` lets you choose from earlier sessions. The difference matters more than it looks: \"most recent\" is a guess about which conversation you mean, and it's wrong exactly when you've been working on two things.",
        },
        {
          kind: "code",
          language: "bash",
          caption: "Carry on, or choose deliberately",
          code: `claude --continue        # the latest session
claude --resume          # choose from earlier sessions
claude --model sonnet    # start on a specific model`,
        },
        {
          kind: "text",
          body: 'Whichever you use, open with a question rather than an instruction: *"what are we working on, and what\'s left?"* A session that restates the goal correctly is one you can trust to continue; a session that restates it wrongly has just saved you from acting on a misunderstanding.',
        },
        {
          kind: "text",
          body: "`--model` chooses the model for the session. The honest rule is to fit it to the task: a fast model is right for mechanical, well-specified work, and a more capable one earns its cost on ambiguous problems where being wrong is expensive. Choosing by habit means paying more than you need for simple things, or less than you should for hard ones.",
        },
        {
          kind: "callout",
          body: "**Practice.** Leave a session, continue it, and ask Claude to restate the current goal. Then find and resume a *specific* earlier session rather than assuming the latest is the one you want, noting its id and checking the restatement. Start a practice session with an explicit model and confirm the session reports the model you chose.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "You spent the morning on a migration and the afternoon on a CSS bug. Next day you run `claude --continue` and ask it to keep going. What happens?",
          options: [
            "Claude asks which of the two sessions you meant",
            "Both sessions are merged so nothing is lost",
            "You resume the migration, because it was the larger task",
            "You resume the CSS session, because it was the most recent — which may not be what you wanted",
          ],
          answer: 3,
          explanation:
            "`--continue` means most recent, not most important — and it won't ask. `--resume` is the deliberate choice, which is why the habit of asking it to restate the goal catches the mistake before you act on it.",
        },
      ],
    },
  },
  {
    slug: "scope-a-run",
    title: "Bounding a run: directories, tools, and turns",
    minutes: 20,
    type: "practice",
    body: {
      summary: "Give a run exactly the reach it needs and no more.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "Everything so far assumed you're watching. Once a run is unattended — a script, a scheduled job, anything non-interactive — the bounds have to be in the command instead of in your judgement. There are three worth knowing.",
        },
        {
          kind: "code",
          language: "bash",
          caption: "Reach, tools, and a ceiling on effort",
          code: `claude --add-dir ../shared          # one extra folder, not the whole disk

claude --allowedTools Read,Grep     # a read-only investigation
claude --disallowedTools Edit,Write # or block what isn't needed

claude -p "audit the config" --max-turns 5`,
        },
        {
          kind: "text",
          body: "**`--add-dir`** extends the working directory to a named folder — the right tool when a task genuinely spans two projects. Add the one folder you need, not its parent. Note that it grants file access; it doesn't pull in most `.claude/` configuration from that directory.",
        },
        {
          kind: "text",
          body: "**`--allowedTools` and `--disallowedTools`** decide which tools exist for the run. An allow list is the stronger statement: `Read,Grep` describes an investigation that *cannot* edit, which is a different kind of promise from an investigation that has simply been asked not to. Reach for the allow list when you can name what's needed, and the deny list when you only want to remove something specific.",
        },
        {
          kind: "text",
          body: "**`--max-turns`** caps how many agentic turns a print-mode run may take. It's the ceiling that stops a confused run from continuing indefinitely — the loop that can't find the file and keeps looking. `--verbose` is the companion for when a run does something surprising and you need to see why.",
        },
        {
          kind: "callout",
          body: "**Practice.** Grant access to exactly one additional safe folder and confirm nothing broader came with it. Run a read-only exercise with an explicit allow list, then repeat it with a deny rule blocking a tool the exercise doesn't need, and watch a denied action get refused while safe work continues. Bound a non-interactive practice run with `--max-turns` and observe how it stops. Turn on `--verbose` for one harmless run and name one thing it revealed.",
        },
        {
          kind: "fill",
          id: "f1",
          prompt: "Cap an unattended print-mode run at five agentic turns.",
          before: 'claude -p "summarise the config" --',
          after: " 5",
          answer: "max-turns",
          accept: ["max-turns"],
          explanation:
            "`--max-turns` applies to print mode and exits with an error when the limit is reached. It's the difference between a run that stops and a run that keeps trying.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Why is `--allowedTools Read,Grep` a stronger guarantee than asking Claude not to edit anything?",
          options: [
            "The edit tools aren't available to the run at all, so it can't edit even if it misreads the instruction",
            "It's faster, because fewer tools are loaded",
            "It makes Claude more careful about the files it reads",
            "It produces a log of every tool that was considered",
          ],
          answer: 0,
          explanation:
            "An instruction is something to be interpreted; an allow list is something to be enforced. For unattended runs that difference is the whole point, because there's no one watching to catch the misinterpretation.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "A task needs to read one file from a sibling project. Which is the right scope?",
          options: [
            "`--add-dir ..` so both projects are covered",
            "`--add-dir ../that-project`, naming just the folder needed",
            "Start Claude in the shared parent directory instead",
            "Copy the file into the current project first",
          ],
          answer: 1,
          explanation:
            "The first and third both hand over every sibling project at once. Copying works but leaves a stale duplicate to go wrong later. Name the one folder — the flag takes multiple paths when you genuinely need more.",
        },
      ],
    },
  },
  {
    slug: "project-guidance",
    title: "CLAUDE.md, diffs, and safe commits",
    minutes: 20,
    type: "practice",
    body: {
      summary: "Write down what a session can't guess, and keep publishing a human decision.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "Every session starts knowing nothing about your project's conventions. A `CLAUDE.md` at the project root is where you stop re-explaining them: the commands that actually work, the conventions that aren't visible in a single file, and the boundaries that matter.",
        },
        {
          kind: "code",
          language: "markdown",
          caption: "Short, specific, and true",
          code: `# Project notes

- Package manager is pnpm. \`npm install\` will produce a
  second lockfile and break CI.
- \`pnpm test\` runs unit tests; \`pnpm test:e2e\` needs a
  running database and is not part of the normal loop.
- \`src/generated/\` is code-generated. Edit the schema in
  \`schema.prisma\` instead.`,
        },
        {
          kind: "text",
          body: 'Notice what those lines have in common: each one prevents a specific, plausible mistake, and each is *verifiably true today*. That\'s the bar. A guidance file full of aspirations — "write clean, well-tested code" — costs context and prevents nothing. And it contains no secrets: this file is read by every session and usually committed to the repository.',
        },
        {
          kind: "text",
          body: "The other habit worth building is asking Claude to explain a diff. Make a small change yourself, then ask what it does and what might break. You're using it as a reviewer rather than an author, and it's a good one — it will mention the caller you forgot. Check the explanation against the actual diff, the same as always.",
        },
        {
          kind: "text",
          body: "**Publishing stays yours.** Running the checks and drafting a commit message is work worth delegating; `git push` is not. The distinction isn't about capability, it's about reversibility — a local commit is a thing you can amend, and a pushed commit is a thing other people have. Keep the irreversible step behind a human.",
        },
        {
          kind: "text",
          body: "Which leads to the last skill of this level: recovering. Ask for a harmless bad edit on purpose, stop, look at what changed, and restore just that. Doing it once deliberately, in a folder where it doesn't matter, is how you learn that the answer is a narrow targeted revert and never a broad destructive command typed in a hurry.",
        },
        {
          kind: "callout",
          body: "**Practice.** Write a short CLAUDE.md for your practice project with verified commands, real conventions and no secrets. Make a tiny tracked change yourself and ask Claude to explain the diff and its side effects, checking the explanation against the diff. Have it run checks and draft a commit message without publishing anything. Then request a harmless bad edit, stop, inspect and restore only that change.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "Which line earns its place in a CLAUDE.md?",
          options: [
            '"Always write clean, maintainable, well-tested code"',
            '"Package manager is pnpm — `npm install` creates a second lockfile and breaks CI"',
            '"This project uses modern JavaScript and follows best practices"',
            '"Be careful when editing files in the src directory"',
          ],
          answer: 1,
          explanation:
            "It's specific, checkable, and prevents a mistake that would otherwise be made repeatedly. The other three are either universally agreed or too vague to change a decision, and they consume context in every session to do it.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "You're happy for Claude to run tests and write commit messages. Why keep `git push` out of that?",
          options: [
            "Pushing requires credentials Claude shouldn't have",
            "Pushed commits are visible to others and far harder to walk back than local ones",
            "Push operations are slow and waste session time",
            "Commit messages are drafts, but pushes are final for git",
          ],
          answer: 1,
          explanation:
            "The line is reversibility, not capability. A local commit can be amended or reset in private; once it's on a shared branch, other people's work and CI are built on it. Same reasoning applies to sends, deletes and publishes throughout this course.",
        },
      ],
    },
  },
  {
    slug: "capstone",
    title: "Capstone: terminal research brief",
    minutes: 30,
    type: "project",
    body: {
      summary: "Use a real session to produce an onboarding brief you've verified line by line.",
      xp: ATTESTED_XP,
      attested: true,
      blocks: [
        {
          kind: "text",
          body: "Pick a practice repository you did not write — a small open-source project is ideal — and use Claude Code to produce the onboarding brief you'd want if you were joining it on Monday: what it does, how it's laid out, how to run it, how to test it, and the three things that would surprise a newcomer.",
        },
        {
          kind: "text",
          body: "Use the level as a sequence. Start read-only and map the project. Ask focused questions about the files that look load-bearing. Stay in one session while the subject holds, and start a new one when it doesn't. Keep the run scoped to the folder you're studying. Then write the brief to a single file, ask Claude to explain the diff, and run whatever checks the project has.",
        },
        {
          kind: "callout",
          body: "**Do it now, in your own tools.** The brief only counts if you checked it. Keep this evidence: the file itself, a note of at least one claim you verified against the source and at least one you had to correct, the exact commands you ran, and the reviewed diff. Nothing is graded here — but a brief you didn't verify is precisely the artefact this level exists to stop you shipping.",
        },
        {
          kind: "code",
          language: "text",
          caption: "Official reference",
          code: REFERENCE,
        },
      ],
    },
  },
];
