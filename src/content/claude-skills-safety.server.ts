/**
 * Level 5 of the Claude course: reusable skills, and permissions that fail safe.
 *
 * Thirty-five task specs merged into ten lessons. The permission precedence
 * rules, settings scopes and skill locations here are quoted from
 * code.claude.com — this is the level where a remembered-but-wrong detail
 * would teach someone to write a rule that doesn't do what they think.
 */
import type { ClaudeAuthoredLesson } from "./claude-authored";
import { ATTESTED_XP } from "./gamification";

const REFERENCE = "Claude Code skills · https://code.claude.com/docs/en/skills";
const PERMISSIONS_REFERENCE = "Configure permissions · https://code.claude.com/docs/en/permissions";

export const claudeSkillsSafetyLessons: ClaudeAuthoredLesson[] = [
  {
    slug: "skill-or-memory",
    title: "Skill, project memory, or just a prompt?",
    minutes: 16,
    type: "concept",
    body: {
      summary: "Three places instructions can live, and how to tell which one you need.",
      xp: 120,
      blocks: [
        {
          kind: "text",
          body: "You have three places to put an instruction, and they differ on one axis: **when it applies.**",
        },
        {
          kind: "text",
          body: "**The prompt** is for this request only. **`CLAUDE.md`** is for facts that are true of this project in every session — the package manager, the generated directory, the test command. **A skill** is for a repeatable procedure that applies when a particular kind of request comes up, in any project.",
        },
        {
          kind: "text",
          body: "The test is frequency against scope. Something you'll say once goes in the prompt. Something always true of this codebase goes in `CLAUDE.md` — it loads every session, so it should be short and only contain what's always relevant. Something you do repeatedly, with steps worth getting right each time, is a skill: it loads only when it's needed, which is exactly why a procedure belongs there rather than in a file that's always in context.",
        },
        {
          kind: "text",
          body: "Skills live in `.claude/skills/<name>/SKILL.md` for a project, or `~/.claude/skills/<name>/SKILL.md` for everything you do on this machine — the same project-versus-personal split as subagents.",
        },
        {
          kind: "text",
          body: '**The trigger is the hard part.** A skill\'s description is what decides whether it loads, so it needs both edges: when it applies and when it doesn\'t. "For database things" will fire on a question about which database to choose. "Use when writing or reviewing a SQL migration in this repo; not for query tuning or schema design discussions" fires when it should and stays quiet otherwise.',
        },
        {
          kind: "callout",
          body: "**Practice.** Take four instructions you've given Claude recently and classify each as prompt, CLAUDE.md, or skill, with one reason each. Confirm the two skill directories from your installed version's docs or help. Then write a one-sentence trigger for a practice skill that states both when it should run and when it shouldn't.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            '"Our API error responses always use RFC 7807 problem+json, and here\'s the seven-step checklist for adding a new error type." Where does this belong?',
          options: [
            "The convention in CLAUDE.md; the seven-step checklist as a skill",
            "All of it in CLAUDE.md, since it's a project convention",
            "All of it as a skill, since it contains a procedure",
            "In the prompt each time, since error types are added rarely",
          ],
          answer: 0,
          explanation:
            "The one-line convention is always relevant and cheap to carry. The checklist is only relevant when adding an error type, and a skill loads on demand — putting it in CLAUDE.md spends context in every session to be useful in a few.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Why does a skill description need to say when *not* to use it?",
          options: [
            "To document the skill for other developers",
            "Because Claude Code requires an exclusion field",
            "Because the description decides whether the skill loads, so a broad one fires on adjacent requests",
            "To keep the skill file under the size limit",
          ],
          answer: 2,
          explanation:
            "A skill that loads when it shouldn't injects a procedure into an unrelated conversation and steers the answer. The exclusion is a functional boundary, not documentation.",
        },
      ],
    },
  },
  {
    slug: "first-skill",
    title: "Writing a minimal SKILL.md",
    minutes: 20,
    type: "practice",
    body: {
      summary: "The smallest skill that works, and the two ways it gets invoked.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "A skill is a directory with a `SKILL.md` in it. The frontmatter carries the description that decides when it loads; the body is the instructions Claude follows once it has.",
        },
        {
          kind: "code",
          language: "markdown",
          caption: "~/.claude/skills/summarize-changes/SKILL.md",
          code: `---
description: Summarizes uncommitted changes and flags anything
  risky. Use when the user asks what changed, wants a commit
  message, or asks to review their diff.
---

## Current changes

!\`git diff HEAD\`

## Instructions

Summarize the changes above in two or three bullet points,
then list any risks you notice such as missing error
handling, hardcoded values, or tests that need updating.
If the diff is empty, say there are no uncommitted changes.`,
        },
        {
          kind: "text",
          body: "Two things are worth noticing. The description names the situations that should trigger it, in the words a person would actually use. And the `` !`git diff HEAD` `` line runs a command and substitutes its output *before* Claude sees the skill — so the instructions arrive with the current diff already in them, rather than asking Claude to go and fetch it.",
        },
        {
          kind: "text",
          body: "There are two ways in. **Automatic discovery**: you describe your situation, and the description matches. **Explicit invocation**: you name the skill directly. Test both. If automatic discovery doesn't fire on a request that obviously should match, the description is the thing to fix — and the fix is usually adding the words a person would really use, not making the description longer or more formal.",
        },
        {
          kind: "text",
          body: "Both routes should run the same workflow. If naming the skill gives a noticeably better result than describing the situation, something in the body depends on how it was invoked, and that's a bug you'll hit later when you've forgotten it exists.",
        },
        {
          kind: "callout",
          body: "**Practice.** Build a small skill with valid frontmatter, a clear purpose, its inputs, its steps and its output, and confirm it produces the promised result on a sample request. Trigger it without naming it, by describing your situation the way you naturally would. Then invoke it explicitly by name and compare the two results — they should run the same core workflow.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Your skill doesn't fire when you ask 'can you look over what I've changed?' What's the first thing to fix?",
          options: [
            "Move the skill from the personal directory to the project one",
            "Make the skill's instructions more detailed",
            "Add the phrasings a person would actually use to the description",
            "Invoke it by name instead",
          ],
          answer: 2,
          explanation:
            "Matching happens against the description, so that's where a missed trigger is fixed. The body affects what happens *after* it loads, and invoking by name works around the problem rather than solving it.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "What does a `` !`command` `` line in a SKILL.md do?",
          options: [
            "Tells Claude it may run that command if it decides to",
            "Documents an example command for the user to copy",
            "Registers the command in the skill's allowed tools",
            "Runs the command and replaces the line with its output before Claude reads the skill",
          ],
          answer: 3,
          explanation:
            "It's dynamic context injection — the substitution happens first, so the instructions arrive with real current data inlined. That's different from asking Claude to run something, which it might do differently or skip.",
        },
      ],
    },
  },
  {
    slug: "skill-structure",
    title: "Examples, references, templates, and helpers",
    minutes: 20,
    type: "practice",
    body: {
      summary: "Keep the main file scannable and put the depth where it loads on demand.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "A skill that grows gets worse, because everything in `SKILL.md` loads whenever the skill fires. The craft is deciding what earns a place in the main file and what belongs in a supporting one.",
        },
        {
          kind: "text",
          body: "**One example, chosen carefully.** The same rule as prompting: one representative input and output sets the pattern. The risk specific to skills is overfitting — give a single example with a very particular shape and the skill starts treating its incidentals as requirements. Pair the example with a general rule so the two can be told apart, and test with a case that's meaningfully different.",
        },
        {
          kind: "text",
          body: "**Depth goes in a reference file.** The main file stays scannable, and a linked reference loads only when the work needs it. This is the difference between a skill that costs a little context whenever it fires and one that costs a lot every time to be useful occasionally.",
        },
        {
          kind: "text",
          body: "**A template is a skeleton, not sample content.** Put the stable output structure in the skill and say when to copy it. Two outputs should share the structure without sharing the example's details — if the second one mentions the first one's subject matter, the template has example content baked into it.",
        },
        {
          kind: "text",
          body: "**A helper script is for what shouldn't be improvised.** A deterministic transformation — reformatting, validating, extracting — is better done by code that behaves identically every time than by a model re-deriving it. Document its inputs and outputs, and make sure it fails clearly on bad input rather than silently producing something wrong.",
        },
        {
          kind: "callout",
          body: "**Practice.** Add one representative example to a skill alongside a general rule, then test it on a meaningfully different case to check it didn't overfit. Move the deep guidance into a linked reference and confirm the main file stays scannable. Add a reusable output template and produce two results that share its structure but no sample content. Then add a small deterministic helper for one repetitive transformation, documenting its inputs and outputs and confirming it fails clearly on bad input.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Your skill's one example summarises a Python file. It now writes Python-flavoured summaries of TypeScript files. What happened?",
          options: [
            "The description is too narrow and should mention more languages",
            "The skill needs a second example in another language",
            "The example overfitted: its incidental features were read as requirements",
            "The template was copied instead of the structure",
          ],
          answer: 2,
          explanation:
            "One example teaches the whole pattern, including the parts you didn't mean. The fix is stating the general rule beside it — more examples help, but only once the rule says which features are essential.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "When is a helper script the right choice over instructions?",
          options: [
            "Whenever the skill needs to read a file",
            "When the operation is deterministic and should behave identically every time",
            "When the skill is used by more than one person",
            "When the instructions exceed a page",
          ],
          answer: 1,
          explanation:
            "Deterministic work is exactly what code is for — a validator that behaves the same on every input, every run. Judgement, phrasing and anything context-dependent belongs in the instructions.",
        },
      ],
    },
  },
  {
    slug: "skill-quality",
    title: "Inputs, checks, negative triggers, and review",
    minutes: 20,
    type: "practice",
    body: {
      summary: "Make a skill refuse to guess, prove it's done, and stay in its lane.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: '**Require what you need.** A skill missing a critical input should ask one specific question, not proceed on a plausible default. "Which environment?" is a five-second interruption; a deployment checklist silently run against production because the skill assumed the usual one is a different kind of afternoon.',
        },
        {
          kind: "text",
          body: "**Define what done means.** Add objective checks the skill must run before claiming success — the tests pass, the file parses, the output contains the required sections. Without them, \"done\" is the model's opinion that it has finished, and a skill that reports success it didn't verify is worse than one that reports nothing, because you stop checking.",
        },
        {
          kind: "text",
          body: "**Test the negative triggers.** Write three requests that are *similar to* your skill's territory but shouldn't activate it, and confirm it stays out. This is the test people skip, and over-triggering is the more common failure in practice: a skill that fires on adjacent questions injects a procedure into conversations that didn't want one.",
        },
        {
          kind: "text",
          body: "**Change it like code.** One behaviour at a time, with a note on why and a before/after test. Skills drift — someone adds a clause to fix one case and three other cases change quietly, because nothing here has a type checker.",
        },
        {
          kind: "text",
          body: "**A skill you didn't write is code you're choosing to run.** Before installing a third-party one, read the instructions it will inject, any scripts it ships, whether it reaches the network, and what permissions it expects. \"It's just a markdown file\" is wrong twice over: instructions steer a model that has your tools, and a skill directory can carry scripts.",
        },
        {
          kind: "callout",
          body: "**Practice.** Make a skill require a critical input and return a useful question when it's missing — confirm it refuses to guess. Add objective completion checks and prove a failed check prevents a false success message. Write three near-miss requests and confirm the skill stays out of scope on all three. Change one behaviour with a reviewable diff and a before/after test. Then review a third-party skill's instructions, scripts, network use and permissions, and write a go/no-go.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "Why is over-triggering usually the worse skill failure in practice?",
          options: [
            "It uses more of the context window",
            "A skill that fires on an unrelated request silently injects a procedure and steers the answer",
            "It makes the skill harder to invoke explicitly",
            "It causes Claude Code to load the skill on every session",
          ],
          answer: 1,
          explanation:
            "Under-triggering is visible — you notice nothing happened and invoke it by name. Over-triggering is invisible: you get an answer shaped by instructions you forgot were there, and nothing flags it.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "A skill reports 'All checks passed' but never ran anything. What's the defect?",
          options: [
            "The description is too broad",
            "The skill needs a helper script",
            "The completion message should be more detailed",
            "Success was asserted rather than verified, and you'll stop checking its reports",
          ],
          answer: 3,
          explanation:
            "An unverified success claim is worse than silence: it buys trust it hasn't earned, so the one time it matters you won't look. A completion check makes the claim conditional on something that actually ran.",
        },
      ],
    },
  },
  {
    slug: "precedence",
    title: "How a permission decision is actually made",
    minutes: 20,
    type: "concept",
    body: {
      summary: "Deny, then ask, then allow — and specificity does not break the tie.",
      xp: 150,
      blocks: [
        {
          kind: "text",
          body: "This is the lesson where a wrong assumption costs the most, because a permission rule that doesn't do what you think is worse than no rule: you've stopped watching.",
        },
        {
          kind: "text",
          body: "**Rules are evaluated in order: deny, then ask, then allow. The first match in that order decides, and rule specificity doesn't change the order.**",
        },
        {
          kind: "text",
          body: "That last clause is the one that catches people, because almost every other system you know works the other way. CSS, routing tables, `.gitignore` — the more specific rule usually wins. Here it does not. A broad `Bash(aws *)` deny blocks `aws s3 ls` even when you've explicitly allowed `Bash(aws s3 ls)`. **An allow rule cannot carve an exception out of a deny rule.** The same holds between ask and allow: a matching ask rule prompts even when a more specific allow rule also matches.",
        },
        {
          kind: "code",
          language: "text",
          caption: "Both rules present, one outcome",
          code: `deny:  Bash(aws *)
allow: Bash(aws s3 ls)

$ aws s3 ls    ──▶ DENIED

Deny is checked first and matches. The narrower allow
rule is never reached.`,
        },
        {
          kind: "text",
          body: "Settings come from several files, highest precedence first: **managed settings**, then the **command line**, then **project-local** (`.claude/settings.local.json`), then **shared project** (`.claude/settings.json`), then **user** (`~/.claude/settings.json`). Two consequences worth holding on to. Managed settings outrank the command line — an organisation policy is not something a flag can argue with. And deny rules are evaluated before allow rules *across scopes too*, so a user-level deny blocks a project-level allow, and vice versa.",
        },
        {
          kind: "text",
          body: "Which makes reading a permission prompt a real skill rather than a formality. The prompt names the tool, the exact arguments and the target. Read the arguments — that's where the difference between the command you expected and a similar one lives. \"Allow once\" for the specific thing in front of you is almost always the right answer over a blanket allow you'll forget you granted.",
        },
        {
          kind: "callout",
          body: "**Practice.** Draw the deny/ask/allow order and check it against the official documentation. Build a table of the settings scopes that apply to you, naming who controls each and who inherits it. Then take a real permission prompt and write your decision based on the actual tool, arguments and target rather than the general shape of the request.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Your settings contain `deny: Bash(git push *)` and `allow: Bash(git push origin docs)`. You run `git push origin docs`. What happens?",
          options: [
            "It's allowed — the more specific rule wins",
            "You're prompted, because the rules conflict",
            "It's allowed, because allow rules are evaluated last and override",
            "It's denied — deny is evaluated first and matches",
          ],
          answer: 3,
          explanation:
            "Order beats specificity, and deny comes first. To allow a narrow exception you must narrow the *deny* rule — an allow can never cut a hole in one.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Which has the highest precedence?",
          options: [
            "Managed settings deployed by an organisation",
            "A command-line flag, since it's the most immediate instruction",
            "Project-local settings, since they're closest to the work",
            "Whichever file was modified most recently",
          ],
          answer: 0,
          explanation:
            "Managed settings sit above the command line — otherwise an organisation policy would be a suggestion that any flag could override. Below that: command line, project-local, shared project, then user.",
        },
        {
          kind: "mcq",
          id: "q3",
          question:
            "Your user settings allow a tool. The project's settings deny it. Which applies?",
          options: [
            "The user setting, since it's your machine",
            "The project setting denies it: deny rules from any scope are evaluated before allow rules",
            "Whichever scope is higher in the precedence list, so project-local wins",
            "Neither — conflicting scopes produce a prompt",
          ],
          answer: 1,
          explanation:
            "Deny-before-allow holds across scopes, not just within one file. This is why a project can reliably prevent something no matter what individual developers have configured for themselves.",
        },
      ],
    },
  },
  {
    slug: "rules",
    title: "Writing allow, deny, and path rules",
    minutes: 20,
    type: "practice",
    body: {
      summary: "Scope rules to the narrowest thing that works, and protect your secrets by path.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "Rules name a tool and, in brackets, what it may act on. `Bash(git status)` is one command. `Bash(git *)` is every git command including `push` and `clean`. `Read(./.env)` is one file.",
        },
        {
          kind: "code",
          language: "json",
          caption: "Narrow allows, decisive denies",
          code: `{
  "permissions": {
    "allow": [
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(npm test)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Read(./.env)",
      "Read(./secrets/**)"
    ]
  }
}`,
        },
        {
          kind: "text",
          body: "**Allow the command, not the tool.** `Bash(*)` removes the prompt entirely and with it your last chance to notice something unexpected. A handful of specific patterns covers the commands you run constantly, and everything else still asks — which is the point, because the prompt is doing work precisely on the commands you didn't anticipate.",
        },
        {
          kind: "text",
          body: "**Deny by path for secrets.** A `Read` deny rule on `./.env` or `./secrets/**` stops Claude's file tools reading them at all. Worth doing even on a practice project, because the habit is what transfers. Note a useful asymmetry in how patterns are treated: a deny or ask rule whose path can't be used as a gitignore pattern still guards that exact path, while an allow rule with an unusable pattern approves nothing. Failure leans towards safety.",
        },
        {
          kind: "text",
          body: "Test both directions. A rule you haven't tested is a belief. Confirm the intended command works *and* that a neighbouring risky one doesn't — write the rule, run the thing it should permit, then run the thing it should stop.",
        },
        {
          kind: "callout",
          body: "**Practice.** Write a narrow allow rule for one safe read operation and prove one intended match and one non-match. Scope a shell permission to a single harmless command pattern, then confirm a neighbouring risky command still stops. Add a deny rule for a destructive command and demonstrate the denial safely. Then protect a secret-like practice file by path and confirm its documented example counterpart is still readable.",
        },
        {
          kind: "fill",
          id: "f1",
          prompt:
            "Complete the deny rule that stops Claude's file tools reading the .env in the current directory.",
          before: '"deny": ["',
          after: '(./.env)"]',
          answer: "Read",
          accept: ["Read"],
          explanation:
            "`Read(./.env)` denies the file tools. Paths follow gitignore-style semantics, so a bare `Read(.env)` is equivalent to `Read(**/.env)` and matches at any depth.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "What's wrong with allowing `Bash(git *)` to stop the constant prompting?",
          options: [
            "Nothing — git commands are inherently safe",
            "Wildcards aren't supported in Bash rules",
            "It only works if you also allow the Read tool",
            "It allows `git push`, `git reset --hard` and `git clean -fd` along with `git status`",
          ],
          answer: 3,
          explanation:
            "The wildcard covers the whole command family, including the destructive and the publishing members. Allow the specific commands you run constantly and let the rest keep asking.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "You add a deny rule with a path pattern that isn't valid as a gitignore pattern. What happens?",
          options: [
            "It still guards that exact path — deny and ask rules fail towards safety",
            "The rule is ignored, so the path is unprotected",
            "Claude Code refuses to start until it's fixed",
            "It silently becomes an allow rule",
          ],
          answer: 0,
          explanation:
            "Deny and ask rules still guard the exact path; an *allow* rule with an unusable pattern approves nothing. Both behaviours lean the same way — a malformed rule can't accidentally grant access.",
        },
      ],
    },
  },
  {
    slug: "modes",
    title: "Plan mode, sandboxes, and the skip-permissions trap",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Three boundaries of very different strength, and one that isn't a boundary at all.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "**Plan mode** is a boundary in time: investigate now, implement after approval. Run a real task in it and check the working tree afterwards — a useful plan and an unchanged tree is the outcome you're looking for, and confirming it once is how you learn to trust the mode.",
        },
        {
          kind: "text",
          body: "**Sandboxing** is a boundary in space. Where it's available, Claude Code can run its Bash tool with filesystem and network isolation, so commands operate inside a box rather than on your machine at large. Test it the way you test a permission rule: attempt a harmless out-of-scope write and confirm it's refused while in-scope work still succeeds.",
        },
        {
          kind: "text",
          body: "**And then there's `--dangerously-skip-permissions`.** It's named that for a reason. A narrow allow rule says \"this specific safe thing needn't ask\". Skipping permissions says \"nothing needs to ask\" — including the operations you have never seen, the ones you'd have caught, and the ones an injected instruction produces. It's not a stronger version of an allow rule; it's the absence of the whole system.",
        },
        {
          kind: "text",
          body: "The honest version of the need behind it is \"I'm being prompted constantly and it's breaking my flow\". That's a real problem with a real fix: allow the handful of commands you run every few minutes, by name. Ten minutes writing rules buys you a quiet session that still stops for the unexpected — which is the only part that was ever protecting you.",
        },
        {
          kind: "callout",
          body: "**Practice.** Run a task in plan mode and verify the working tree is unchanged afterwards. Enable or inspect the sandbox boundary available to you and test it with a harmless out-of-scope write. Then write a short scenario-based explanation of why skipping all prompts differs from a narrow allow rule, and name the least-privilege replacement you'd use instead.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "A colleague says skipping permissions is fine because they 'read everything Claude does anyway'. What's the flaw?",
          options: [
            "Reading happens after the action; the prompt is the only point where it can still be stopped",
            "They probably don't read as carefully as they think",
            "It's fine if they're working in a git repository",
            "Skipping permissions also disables the session log",
          ],
          answer: 0,
          explanation:
            "Review after the fact detects; a prompt prevents. For anything reversible that's a survivable trade, and for a deletion, a send or a push it isn't — those are exactly the cases the prompt existed for.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "You're prompted constantly for `npm test` and `git status` and it's breaking your flow. Best fix?",
          options: [
            "Skip permissions for the session and stay alert",
            "Allow `Bash(*)` and rely on reviewing the transcript",
            "Add narrow allow rules for those two specific commands",
            "Work in a sandbox with all prompts disabled",
          ],
          answer: 2,
          explanation:
            "Name the commands that are genuinely routine and let everything else keep asking. The two broad options solve the annoyance by removing the protection, which is solving the wrong problem.",
        },
      ],
    },
  },
  {
    slug: "hooks",
    title: "Hooks are code you are choosing to run",
    minutes: 22,
    type: "practice",
    body: {
      summary: "Shell commands wired to events — powerful, and worth reading before enabling.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "A hook is a shell command Claude Code runs when something happens: before a tool call, after an edit, when a session needs input. They're configured in settings with an event and a matcher deciding which tool calls they apply to.",
        },
        {
          kind: "code",
          language: "json",
          caption: "Format every file after it's edited",
          code: `{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npx prettier --write $FILE" }
        ]
      }
    ]
  }
}`,
        },
        {
          kind: "text",
          body: "**Read a hook before enabling it, especially one you didn't write.** It's a shell command that will run automatically, on your machine, with your permissions. What does it execute, when does it fire, what does it touch, does it reach the network, and what happens when it fails? A hook in a repository you cloned is code you're agreeing to run.",
        },
        {
          kind: "text",
          body: 'The two useful shapes are a **formatting hook** (`PostToolUse`, tidy what was just edited) and a **protective hook** (`PreToolUse`, reject something unsafe). Protective hooks are strong: **a `PreToolUse` hook that exits with code 2 stops the tool call before permission rules are evaluated**, so it blocks even something an allow rule would have permitted. That makes it the right tool for "allow Bash generally, but never these specific commands".',
        },
        {
          kind: "text",
          body: "They don't loosen anything, though. Hook decisions don't bypass permission rules — a matching deny rule still blocks the call, and a matching ask rule still prompts, even if the hook returned `allow`. Hooks can tighten; they can't override a deny.",
        },
        {
          kind: "text",
          body: "**Two failure modes to design out.** Recursion: a formatting hook that edits a file can trigger the event that runs it again, so guard against re-entry or scope the matcher tightly. And noise: a hook that prints its whole output on every edit buries the one message that mattered. Reduce it to an actionable error and the minimum context — a concise failure with a next step is what makes a hook something you keep.",
        },
        {
          kind: "callout",
          body: "**Practice.** Inspect a sample hook's command, trigger, inputs, outputs and failure behaviour, and list every external side effect. Add a bounded formatting hook to a disposable project and confirm it touches only the intended files and surfaces failures. Add a protective hook that rejects one clearly defined unsafe action with a useful message, and check one unsafe test is blocked while a safe one passes. Verify your hook can't retrigger itself indefinitely, then cut its output down to an actionable error with a next step.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "You want to allow Bash broadly but never let a few specific commands run. Which mechanism does that?",
          options: [
            "A narrower allow list that happens to exclude them",
            "A PreToolUse hook that exits with code 2 for those commands",
            "An ask rule for each one",
            "A PostToolUse hook that reverts them",
          ],
          answer: 1,
          explanation:
            "A blocking hook stops the call before permission rules are evaluated, so it applies even where an allow rule would let it through. Excluding from an allow list only means those commands prompt; a PostToolUse revert runs after the damage.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "A PreToolUse hook returns 'allow' for a call that a deny rule matches. What happens?",
          options: [
            "The call is denied: hook decisions don't bypass deny rules",
            "The call proceeds — the hook is closer to the action",
            "The user is prompted to break the tie",
            "The hook's decision applies but is logged as an override",
          ],
          answer: 0,
          explanation:
            "Hooks can tighten but never loosen. Deny and ask rules are evaluated regardless of what a hook returned, which keeps deny-first precedence intact — including denies set in managed settings.",
        },
      ],
    },
  },
  {
    slug: "threat-model",
    title: "Threat-modelling a workflow",
    minutes: 20,
    type: "concept",
    body: {
      summary:
        "Assets, actors, entry points and gates — the reasoning behind every rule in this level.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "Everything so far has been individual controls. A threat model is what tells you which ones you need — five questions, answered for one real workflow.",
        },
        {
          kind: "text",
          body: "**What are the assets?** Source, credentials, customer data, your ability to publish. **Who are the actors?** You, your teammates, anyone who can open a pull request, anyone who can send you an email the workflow reads. **What are the entry points?** Every place text enters: prompts, files, tool results, issues, web pages. **What are the risky actions?** Sends, deletes, publishes, money, anything irreversible. **What are the mitigations?** And for each one: does it prevent, detect, or recover?",
        },
        {
          kind: "text",
          body: "That last distinction is where most designs are thin. Permission rules and allow lists prevent. Logs and metrics detect. Version control, drafts and revocation recover. A workflow with only prevention has no idea when it failed; one with only detection finds out afterwards. You want at least one control in each column for anything that touches the outside world.",
        },
        {
          kind: "text",
          body: "**Untrusted input deserves its own line**, because this is the entry point people forget. Email, documents, issues, web pages and tool results are data. Say so explicitly in your instructions: content from those sources is information to report, never instruction to follow, and anything resembling a command gets quoted back rather than acted on.",
        },
        {
          kind: "text",
          body: 'And put a **human approval gate** in front of the irreversible actions: external communication, money, deletion, publishing. A gate is only real if it\'s specific — the approver sees the exact recipients, the exact change, the evidence behind it. "Proceed?" with no payload is a button people learn to press. The gate is also your backstop when a prevention control fails, which is why the two belong together.',
        },
        {
          kind: "callout",
          body: "**Practice.** Threat-model one real workflow: list assets, actors, entry points, risky actions and mitigations, and mark each mitigation as prevention, detection or recovery. Write instructions that treat email, documents, issues and web content as untrusted data, then feed in a malicious sample and confirm it's quoted or reported rather than followed. Design an approval gate with a named approver and an exact review payload. Then combine a narrow skill, minimum permissions, completion checks and that gate into one shared practice task a teammate could run without inheriting broader access.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "A workflow has tight allow lists, denied secret paths and a sandbox — but no logging. What's missing?",
          options: [
            "Nothing: prevention is the strongest control",
            "Detection — there's no way to know whether a control failed or was bypassed",
            "Recovery, which logging would provide",
            "Nothing, as long as the allow lists are reviewed regularly",
          ],
          answer: 1,
          explanation:
            "Every control is preventive, so the workflow is blind to its own failures. You'd learn something went wrong from its consequences rather than from the system — and you'd have nothing to reconstruct what happened.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "What makes an approval gate real rather than decorative?",
          options: [
            "That it appears before every action the workflow takes",
            "That it requires a second person to approve",
            "That it logs who approved and when",
            "That the approver sees the exact target, change and evidence, so the decision is informed",
          ],
          answer: 3,
          explanation:
            "A gate with no payload becomes a reflex — and a gate on every action guarantees that, by making approval constant. Few gates, each carrying enough detail to actually decide on, is what keeps the decision genuine.",
        },
      ],
    },
  },
  {
    slug: "capstone",
    title: "Capstone: safety review and drill",
    minutes: 45,
    type: "project",
    body: {
      summary: "Audit everything you've configured, then rehearse recovering from a failure.",
      xp: ATTESTED_XP,
      attested: true,
      blocks: [
        {
          kind: "text",
          body: "Audit your practice environment end to end: every skill, every settings scope that applies, every MCP server still connected from Level 3, and every hook. For each one — do you still need it, does it have the narrowest scope that works, and could you explain to someone else why it's there?",
        },
        {
          kind: "text",
          body: "Then run a drill, because a control you've never seen fire is a control you're guessing about. Deliberately trigger a denied action or a failing hook and walk through what happens: what message you get, what state things are left in, and how you recover. Doing this once on purpose is how you find out whether your deny rule actually denies.",
        },
        {
          kind: "callout",
          body: "**Do it now, in your own tools.** Keep this evidence: the audit with a keep/narrow/remove decision per item, the corrected configuration, and a recovery note describing the drill and what you'd do differently. No secrets in any of it — if your notes need a token to make sense, that's a finding in itself.",
        },
        {
          kind: "code",
          language: "text",
          caption: "Official references",
          code: `${REFERENCE}\n${PERMISSIONS_REFERENCE}`,
        },
      ],
    },
  },
];
