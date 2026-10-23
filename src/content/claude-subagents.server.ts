/**
 * Level 4 of the Claude course: delegating to subagents.
 *
 * Twenty-five task specs merged into eight lessons. Frontmatter fields and the
 * agent directory locations are taken from code.claude.com/docs/en/sub-agents
 * rather than recalled.
 */
import type { AuthoredLesson } from "./authored-lesson";
import { ATTESTED_XP } from "./gamification";

const REFERENCE = "Claude Code subagents · https://code.claude.com/docs/en/sub-agents";

export const claudeSubagentsLessons: AuthoredLesson[] = [
  {
    slug: "when-to-delegate",
    title: "What is worth delegating",
    minutes: 18,
    type: "concept",
    body: {
      summary: "The test for a delegable task, and the brief that makes one succeed.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "A subagent is a separate Claude with its own context, its own instructions and its own tool list. It gets the brief you hand it (not your conversation) and hands back a result. That isolation is the entire value and the entire constraint.",
        },
        {
          kind: "text",
          body: "It's valuable because a long investigation can happen without filling your session with the eighty files it read. It's constraining because everything the worker needs must be in the brief. So the test for a delegable task is: **can I state the inputs, the question and the output format without reference to our conversation?** If yes, delegate. If the task only makes sense given three hours of shared context, doing it yourself is faster than explaining it.",
        },
        {
          kind: "text",
          body: "The brief that follows should contain the goal, the paths that matter, the constraints, and the shape of the answer, and nothing else. Overlong delegations are the common beginner error: pasting the whole conversation in the hope that more context helps. It doesn't. It buries the actual question and spends the worker's context on your history rather than on the files it needs to read.",
        },
        {
          kind: "text",
          body: "The other judgement call is **when not to parallelise**. Independent questions run happily side by side. Dependent steps do not: if step two needs step one's answer, running them together means step two guessed. Map the dependencies before you fan out, and keep the dependent chain sequential. Parallelism is a property of the work, not a setting you turn on.",
        },
        {
          kind: "callout",
          body: "**Practice.** Take a real project request and separate one self-contained research task from the work that needs shared context, naming the delegation's inputs and output. Take an overlong delegation brief and cut it to goal, paths, constraints and output format, then check the shorter one still produces the right result. Finally, map a three-step task's dependencies and mark which branch is genuinely safe to run in parallel.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "Which of these is the best candidate for delegation to a subagent?",
          options: [
            {
              text: '"Finish the refactor we\'ve been discussing all afternoon"',
              whyNot:
                '"The refactor we\'ve been discussing" points at a conversation the worker never saw. It would have to guess what you meant.',
            },
            {
              text: '"Decide whether we should migrate off Postgres"',
              whyNot:
                "This is a judgement call that depends on your context and priorities. A worker would come back confident without knowing either.",
            },
            {
              text: '"Fix the bug I described earlier, the way we agreed"',
              whyNot:
                '"The way we agreed" lives in your history, not in the task. The worker can\'t see what was agreed.',
            },
            '"Find every place this repository reads the SESSION_SECRET env var and report the file and line"',
          ],
          answer: 3,
          explanation:
            "It's fully specified in one sentence, the output shape is obvious, and it needs no history. The other three depend on conversation the worker will never see, and would each come back confidently having guessed what you meant.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "Three steps: find the slow query, propose an index, measure the improvement. What's safe to parallelise?",
          options: [
            {
              text: "All three, because they're all about the same query",
              whyNot:
                "Being about the same query is exactly why they can't run together: each one needs what the step before it produced.",
            },
            "None of them: each step needs the previous step's result",
            {
              text: "Steps one and two, since both involve analysis",
              whyNot:
                "You can't propose an index for a query nobody has identified yet. The second step depends on the first.",
            },
            {
              text: "Steps two and three, leaving step one to run first",
              whyNot:
                "You can't measure an improvement before it's been made. The last step needs the index from the one before it.",
            },
          ],
          answer: 1,
          explanation:
            "You can't propose an index for a query you haven't identified, or measure an improvement you haven't made. Running them together produces two workers inventing plausible inputs: fast, parallel, and wrong.",
        },
      ],
    },
  },
  {
    slug: "define-one",
    title: "Defining a subagent: description, tools, model",
    minutes: 20,
    type: "practice",
    body: {
      summary: "Write an agent file whose every field is a decision.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "A subagent is a markdown file with frontmatter. Project agents live in `.claude/agents/`; personal ones in `~/.claude/agents/` and are available across all your projects. The frontmatter configures it; the body becomes its system prompt.",
        },
        {
          kind: "code",
          language: "markdown",
          caption: ".claude/agents/code-reviewer.md",
          code: `---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and
provide specific, actionable feedback on quality, security,
and best practices.`,
        },
        {
          kind: "text",
          body: '**The description is a routing decision, not a label.** It\'s what the main session reads to decide whether to hand work over, so it needs a trigger, a responsibility and an exclusion: *when* to use this agent, *what* it\'s answerable for, and what it should not be used for. "Reviews code" is a label. "Reviews a diff for correctness and security after changes are written; does not write or fix code" routes correctly and, just as importantly, declines correctly.',
        },
        {
          kind: "text",
          body: "**`tools` is the strongest line in the file.** Omit it and the agent inherits the full tool set; list tools and that's all it has. A researcher with `Read, Glob, Grep` cannot edit your files. Not \"has been asked not to\", but *cannot*. Write the list even when it feels redundant, because that's the field that makes a read-only agent actually read-only.",
        },
        {
          kind: "text",
          body: "**`model`** fits the worker to the job: a fast model for mechanical, well-specified work, a stronger one where the reasoning is the deliverable. `inherit` uses the parent session's model. The tradeoff is real in both directions. Running everything on the most capable model is expensive for tasks that are essentially search, and running a subtle architectural review on the cheapest one wastes the whole delegation.",
        },
        {
          kind: "callout",
          body: "**Practice.** Find how your installed version manages agents and see what's already defined. Create a read-only researcher that inspects files and returns evidence without editing. Sharpen its description until it contains a trigger, a responsibility and an exclusion. Give it only the tools its job needs, then confirm an unnecessary write is unavailable to it. Choose its model deliberately and write one sentence on the tradeoff.",
        },
        {
          kind: "fill",
          id: "f1",
          prompt:
            "Complete the frontmatter field that restricts this agent to reading and searching only.",
          before: "---\nname: researcher\ndescription: Investigates and reports, never edits\n",
          after: ": Read, Glob, Grep\n---",
          answer: "tools",
          accept: ["tools"],
          explanation:
            "Omitting `tools` entirely gives the agent the full set. Listing them is what makes the restriction real. The field is the enforcement, and the description is only documentation.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "Which description will route work correctly?",
          options: [
            {
              text: '"A helpful agent for code-related tasks"',
              whyNot:
                '"Code-related tasks" matches almost anything, so this agent would be handed work it shouldn\'t do.',
            },
            {
              text: '"Expert code reviewer with deep knowledge of software engineering"',
              whyNot:
                "This describes expertise, not when to use it or what it won't do. Routing needs a trigger and a boundary.",
            },
            '"Reviews a written diff for correctness and security. Use after code is written. Does not write or fix code; hand fixes back to the caller."',
            {
              text: '"Reviews code thoroughly and carefully"',
              whyNot:
                '"Thoroughly and carefully" says how, not when. Nothing tells the caller what to hand over or what to keep away.',
            },
          ],
          answer: 2,
          explanation:
            "It says when to invoke, what it's responsible for, and what it won't do. The exclusion matters as much as the trigger: without it, this agent gets handed \"fix the bug\" and either refuses confusingly or does something you didn't intend.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "You leave the `tools` field out of an agent definition. What have you configured?",
          options: [
            "An agent with the full tool set, including write and shell access",
            {
              text: "An agent with no tools, which can only reason about what it's told",
              whyNot:
                "Leaving the field out doesn't remove tools. It does the opposite of what most people assume.",
            },
            {
              text: "An agent that asks permission before each tool use",
              whyNot:
                "Omitting the field doesn't add a permission step. It changes which tools the agent gets.",
            },
            {
              text: "An agent with read-only tools by default",
              whyNot:
                'There\'s no read-only default. Leaving the field out is how a "researcher" ends up able to edit files.',
            },
          ],
          answer: 0,
          explanation:
            "Omission means inherit-everything. That's the opposite of what people usually intend when they leave a field blank, and it's how a \"researcher\" ends up able to edit files.",
        },
      ],
    },
  },
  {
    slug: "result-contract",
    title: "A result you can check",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Require a fixed answer shape, then verify one claim before you rely on it.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "A worker's output is only useful if the caller can evaluate it without re-doing the work. That means asking for a fixed shape up front: a **result contract**. Four parts carry almost everything you need.",
        },
        {
          kind: "code",
          language: "text",
          caption: "The contract, stated in the agent's own prompt",
          code: `Always answer in this form:

  CONCLUSION:  one sentence
  EVIDENCE:    file:line references you actually read
  UNCERTAINTY: what you could not confirm, and why
  NEXT STEP:   the single most useful thing to do next

If you cannot support a conclusion with evidence, say so in
CONCLUSION rather than offering your best guess.`,
        },
        {
          kind: "text",
          body: "The `UNCERTAINTY` line is the one people leave out, and it's the one that makes the rest trustworthy. Without a place to put doubt, a worker with an incomplete answer will produce a complete-sounding one. That's not from dishonesty, but because the format demanded a conclusion. Give it somewhere to say \"I couldn't check the mobile client\" and you find out which parts to lean on.",
        },
        {
          kind: "text",
          body: "The `EVIDENCE` line does something else useful: it makes verification cheap. When findings come back with file and line references, checking one is a ten-second job. **Do it.** Pick one load-bearing claim from every delegated result and confirm it yourself before it shapes a decision. It's the same habit as checking a project map, for the same reason. Evidence you never spot-check is decoration.",
        },
        {
          kind: "callout",
          body: "**Practice.** Give your researcher a result contract with conclusion, evidence, uncertainty and next step. Delegate one real architecture question about your project and require file citations. Then take one claim from the result and verify it yourself (confirm it or correct it with evidence), and notice which parts of the report you'd have accepted without checking.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Why does a result contract include a slot for what the worker could not confirm?",
          options: [
            {
              text: "To make reports longer and more thorough",
              whyNot:
                "Length isn't the aim. The slot changes what a worker can honestly hand back when it couldn't finish.",
            },
            "Because a format that only has room for conclusions pressures a worker into producing one",
            {
              text: "Because uncertainty is required for audit purposes",
              whyNot:
                "Audit isn't the reason. Think about what a worker does when the format only has room for a conclusion.",
            },
            {
              text: "To let the worker ask follow-up questions",
              whyNot:
                "The slot isn't for questions; the worker reports and stops. It's there so an unfinished check can be said plainly.",
            },
          ],
          answer: 1,
          explanation:
            'Given a complete-answer-shaped output, an incomplete investigation still fills the shape. An explicit uncertainty field makes "I couldn\'t check this" a valid, expected answer rather than an apparent failure.',
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "A researcher returns five findings, each with file:line evidence. How much should you verify?",
          options: [
            {
              text: "None, because the citations are the verification",
              whyNot:
                "A citation is a lead, not a proof. Until you open it, you don't know that it says what the finding claims.",
            },
            {
              text: "All five, or the delegation saved you nothing",
              whyNot:
                "Checking everything throws away the time you delegated to save. Be selective about which check matters.",
            },
            "At least the one your decision actually rests on",
            {
              text: "A random one, to estimate the overall error rate",
              whyNot:
                "Findings aren't equally important, and one random check says little about the rest. Pick by what your decision depends on.",
            },
          ],
          answer: 2,
          explanation:
            "Verifying everything defeats the purpose; verifying nothing means citations you never tested. Check what's load-bearing. A wrong finding you don't act on costs little, and the one you're about to act on is worth ten seconds.",
        },
      ],
    },
  },
  {
    slug: "specialists",
    title: "Building specialists: tests and documentation",
    minutes: 14,
    type: "practice",
    body: {
      summary: "Two narrow agents that are useful precisely because they can't do everything.",
      xp: 110,
      blocks: [
        {
          kind: "text",
          body: "The pattern generalises: one responsibility, the minimum tools, a fixed output. Two specialists are worth building early because they come up constantly.",
        },
        {
          kind: "text",
          body: "**A test specialist** can read the project and run the test command, but cannot edit production files. That asymmetry is the whole design. It reports exact commands and actual failures rather than quietly adjusting the code until things pass. An agent that can both run tests and edit source will sometimes make a test pass by changing what it tests, which is the single most expensive kind of help.",
        },
        {
          kind: "text",
          body: "**A documentation specialist** identifies gaps and drafts suggestions *in its response*, rather than writing files. Docs are opinionated and cheap to review as text; letting an agent rewrite your README unattended produces a confident document nobody agreed to. Keep the output in the report and merge what you want.",
        },
        {
          kind: "callout",
          body: "**Practice.** Define a test specialist that can inspect and run tests but cannot edit production files, and get a report with exact commands and real failures. Define a documentation specialist that returns a prioritised list of gaps with draft text in its response, and confirm it changed no files.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Why give a test specialist the ability to run tests but not to edit source files?",
          options: [
            {
              text: "Running tests is slower than editing, so the balance is unfair",
              whyNot:
                "Speed has nothing to do with it. The concern is what an agent does when it's asked to get tests passing.",
            },
            {
              text: "Because test runners don't require write access",
              whyNot:
                "Whether the runner needs write access isn't the point. The reason is what an agent able to edit would be tempted to change.",
            },
            {
              text: "To keep the agent's context smaller",
              whyNot:
                "Context size isn't the point. Removing the edit tool changes which outcomes the agent can produce.",
            },
            "So it reports genuine failures instead of making tests pass by changing what they test",
          ],
          answer: 3,
          explanation:
            "Given both abilities and an instruction to get tests passing, weakening an assertion is a valid-looking solution. Removing the edit tool makes the honest report the only available output.",
        },
      ],
    },
  },
  {
    slug: "parallel",
    title: "Running workers in parallel without collisions",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Independent questions, exclusive file ownership, isolated working areas.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "Two researchers asking non-overlapping questions can run at once with no ceremony, because reads don't collide. The moment anything writes, parallelism needs a plan.",
        },
        {
          kind: "text",
          body: "**Exclusive file ownership** is the simplest version. Before fanning out work that edits, write down which agent owns which paths, with no path appearing twice and no ambiguity about who owns a shared file. Two agents editing the same file concurrently produces a result that belongs to neither and reflects whichever finished last.",
        },
        {
          kind: "text",
          body: "**Isolated working areas** are the stronger version, and git already has the mechanism: a worktree is a second checkout of the same repository in its own directory, so two lines of work proceed without touching each other or your main tree. Claude Code can start a session directly in one with `--worktree`, which is how you run two experimental changes and keep the option of discarding either.",
        },
        {
          kind: "code",
          language: "bash",
          caption: "Two experiments, one clean main tree",
          code: `claude --worktree try-fetch
claude --worktree try-axios

# each session works in its own checkout;
# your main working tree stays untouched`,
        },
        {
          kind: "text",
          body: "Whichever you use, integration stays with one owner. Parallel workers propose; a single person or session decides what lands. Skip that and you get two half-integrated changes and no one who can describe the resulting state.",
        },
        {
          kind: "callout",
          body: "**Practice.** Send two genuinely independent questions to two workers at once and confirm neither blocked the other. Draft a file-ownership table for a parallel implementation with no ambiguous paths. Then set up two isolated working areas for two experimental changes and confirm your main tree stayed clean.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Two agents are told to improve error handling in overlapping modules. What happens?",
          options: [
            {
              text: "They coordinate automatically, since they share the repository",
              whyNot:
                "Sharing a repository isn't coordination. Each agent works in its own context and doesn't know what the other did.",
            },
            {
              text: "The second agent waits for the first to finish",
              whyNot:
                "Nothing makes the second one wait. They run at the same time, on the same files.",
            },
            {
              text: "Claude Code refuses to run agents with overlapping scopes",
              whyNot:
                "Nothing stops them. Overlap is allowed, and that's exactly why it's your job to avoid it.",
            },
            "Their edits interleave unpredictably and the last writer wins on shared files",
          ],
          answer: 3,
          explanation:
            "Separate contexts means neither knows what the other did. You get a file reflecting one agent's work, or a mangled blend, and no report describes the result, because each one reports what *it* did.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "What does a git worktree give two parallel experiments?",
          options: [
            {
              text: "A shared branch both can commit to",
              whyNot:
                "A worktree is the opposite of sharing: each one has its own checkout and branch.",
            },
            {
              text: "Automatic merging of both results",
              whyNot:
                "Nothing merges by itself. Combining results is still a decision you make afterwards.",
            },
            {
              text: "A faster clone of the repository",
              whyNot:
                "It isn't a clone at all; it shares the same repository. Its value is isolation, not speed.",
            },
            "A separate checkout each, so neither touches the other or your main working tree",
          ],
          answer: 3,
          explanation:
            "Each worktree is its own directory with its own branch checked out, against the same repository. Either experiment can be thrown away cleanly, which is what makes running both worth doing.",
        },
      ],
    },
  },
  {
    slug: "disagreement",
    title: "Comparing, resolving, and synthesising",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Use multiple workers to surface assumptions, not to hold a vote.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: 'Asking two specialists to analyse the same decision from named perspectives ("argue for keeping this dependency", "argue for removing it") is one of the highest-value uses of delegation. Done well, it surfaces the assumptions each position needs, which is the part you couldn\'t easily produce alone.',
        },
        {
          kind: "text",
          body: "Done badly, it becomes a vote. Two agents agreeing is not evidence: they may share a source, a blind spot, or the framing of your question. **Read the reasoning, not the tally.** What you want from the exercise is a clear view of what would have to be true for each answer to be right.",
        },
        {
          kind: "text",
          body: "When findings actually conflict, resolve by tracing both back to primary evidence. One will usually turn out to rest on something checkable: a file that says what it says, a benchmark that ran, a version that is or isn't installed. Decide on that, and record what remains genuinely uncertain rather than declaring the matter closed.",
        },
        {
          kind: "text",
          body: "Then synthesise **without flattening the disagreement**. A summary that reports three workers' findings as one smooth consensus has destroyed the most valuable information in them. Keep three sections: what they agree on, where they conflict and why, and what you've decided given that.",
        },
        {
          kind: "callout",
          body: "**Practice.** Ask two specialists to analyse one real choice from different named perspectives and compare what assumptions each relies on. Take two conflicting claims and trace both to primary evidence, citing what decided it and what's still uncertain. Then combine three worker reports into one synthesis with agreement, disagreement and decision sections, preserving confidence levels.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Two subagents independently recommend the same library. What have you learned?",
          options: [
            "Less than it appears: they may share a training bias, a source, or your framing",
            {
              text: "That it's the right choice, since independent agreement is strong evidence",
              whyNot:
                "Separate runs aren't independent evidence. They can share the same bias, the same source, or the way you framed the question.",
            },
            {
              text: "That the question was too easy to be worth delegating",
              whyNot:
                "Agreement doesn't tell you the question was easy. It tells you less than it seems to.",
            },
            {
              text: "Nothing at all, since agents always agree",
              whyNot:
                "Agents don't always agree, and agreement isn't worthless. It just isn't as strong as it looks.",
            },
          ],
          answer: 0,
          explanation:
            "Independence of *processes* isn't independence of *priors*. Agreement is worth noticing, but the reasoning is what you evaluate. Two agents can be confidently wrong in exactly the same way.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "Three reports conflict on whether a migration is safe. What does a good synthesis do?",
          options: [
            {
              text: "Report the majority view for a clean recommendation",
              whyNot:
                "A majority vote throws away the disagreement, which is the most useful thing the three reports found.",
            },
            {
              text: "Average the confidence levels into an overall risk score",
              whyNot:
                "Averaging produces a confident number nobody can trace, and hides why the reports disagreed.",
            },
            {
              text: "Ask a fourth agent to break the tie",
              whyNot:
                "A fourth opinion adds noise, not evidence. The conflict itself needs explaining.",
            },
            "State the agreement, state the conflict and its cause, then give a decision with its uncertainty",
          ],
          answer: 3,
          explanation:
            "The conflict is the finding. Majority-voting and averaging both discard it, producing a confident number nobody can trace, and a fourth opinion adds noise rather than evidence.",
        },
      ],
    },
  },
  {
    slug: "bounds",
    title: "Stopping conditions, budgets, and failure",
    minutes: 20,
    type: "practice",
    body: {
      summary:
        "Tell a worker when to stop, cap what it may spend, and make blocked reports useful.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "A worker without a stopping condition keeps going. Not maliciously. It was asked to find something and it hasn't found it, so it looks harder, broadens the search, and burns your budget on a file that isn't there. Every delegation needs three sentences: **when to stop, what not to attempt, and what to report if blocked.**",
        },
        {
          kind: "code",
          language: "text",
          caption: "A brief with an exit",
          code: `Find where rate limiting is implemented.

Stop when: you've found it, or you've checked the middleware,
config and routing layers without finding it.
Do not: modify files, or search node_modules.
If blocked: report what you checked, what you found instead,
and the single next place you'd look.`,
        },
        {
          kind: "text",
          body: "\"If blocked, report what you checked\" converts a failure into information. The difference between a useless blocked report and a useful one is whether it lists the ground already covered. The useful one means you don't repeat it, and often tells you the thing genuinely isn't there, which was a real answer to the question.",
        },
        {
          kind: "text",
          body: "**Budget the fan-out too.** Cap the number of workers and turns for an investigation before you start, and afterwards compare what you got to what it cost. Subagent spend counts toward a run's cost cap, so a parallel investigation is a multiplier in both directions. Some questions are worth three agents; most are worth one, and a habit of spawning a team for everything is expensive in a way that's easy not to notice.",
        },
        {
          kind: "text",
          body: "Finally, keep **review and integration separate**. Have one specialist review a proposed patch against the diff, and let a single owner decide what lands. A reviewer that can also merge its own suggestions isn't a review step; it's a second author.",
        },
        {
          kind: "callout",
          body: "**Practice.** Write a delegation with an explicit stopping condition, an exclusion and a blocked-report format, and confirm the worker stops at the boundary. Cap the workers and turns for one practice investigation and compare cost to value afterwards. Simulate a missing dependency or denied permission and check the blocked report tells you what was attempted. Then have one specialist review a patch while you alone decide whether to integrate it. Finish by defining researcher, tester and reviewer roles for one bounded feature, with an order they run in.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "What makes a blocked report useful rather than just a failure?",
          options: [
            {
              text: "It apologises and suggests trying again",
              whyNot:
                "An apology and a retry leave you exactly where you started. A useful report hands over what the run already learned.",
            },
            {
              text: "It escalates automatically to a more capable model",
              whyNot:
                "Escalating hides what was tried. Before anything else, you want to know what ground was already covered.",
            },
            "It lists what was checked, what was found instead, and where to look next",
            {
              text: "It returns partial results in the normal format",
              whyNot:
                "Partial results in the normal format look like a finished answer. A blocked run should say plainly that it's blocked.",
            },
          ],
          answer: 2,
          explanation:
            "Covered ground is real information. It saves you the repeat search and sometimes answers the question by exhaustion. A report that only says it failed leaves you exactly where you started, minus the cost of the run.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Why not let the reviewing agent apply the fixes it recommends?",
          options: [
            {
              text: "Review agents usually lack write tools anyway",
              whyNot:
                "Some do have write tools. The reason to keep fixes away from them holds either way.",
            },
            {
              text: "Because applying changes requires a different model",
              whyNot:
                "Any model could apply them. The issue is who reviews the change once the reviewer has made it.",
            },
            "Because a reviewer that merges its own suggestions is a second author, and nothing was reviewed",
            {
              text: "Because it would use too much of the run's budget",
              whyNot:
                "Budget isn't the reason. It's about whether the change was ever reviewed by anyone.",
            },
          ],
          answer: 2,
          explanation:
            "Review is only worth something when a different party evaluates the work. Collapse the two roles and the recommendation and the decision come from the same place, which is the situation review exists to avoid.",
        },
      ],
    },
  },
  {
    slug: "capstone",
    title: "Capstone: parallel project audit",
    minutes: 40,
    type: "project",
    body: {
      summary: "Three read-only specialists, one conflict-free synthesis, no unapproved edits.",
      xp: ATTESTED_XP,
      attested: true,
      blocks: [
        {
          kind: "text",
          body: "Audit a practice repository with three specialists running in parallel: one on accessibility, one on test coverage, one on documentation. All three read-only, all three with a result contract, all three with a stopping condition and a budget you set in advance.",
        },
        {
          kind: "text",
          body: "Then do the part that makes it an audit rather than three reports: produce one prioritised plan. Where the workers agree, say so. Where they conflict (and on a real repository at least one pair will), trace it to evidence rather than averaging. Keep confidence levels attached to the items.",
        },
        {
          kind: "callout",
          body: "**Do it now, in your own tools.** Keep this evidence: the three reports with their file citations, the synthesis with its agreement, conflict and decision sections, your declared budget beside what the run actually used, and confirmation that nothing was edited. Verify at least one claim from each report yourself and note which one you'd have accepted unchecked.",
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
