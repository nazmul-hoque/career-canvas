/**
 * The authored Claude course: every task's mission, evidence and example, plus
 * the guidance, safety note and official reference for each level.
 *
 * Server-only, for the same reason the lesson bodies are. The browser needs a
 * task's id, title, length and type to draw the roadmap; it never needs the
 * prose, which is ~40KB and would otherwise sit in the main client chunk on the
 * first-paint path of every route that imports the curriculum. The client-safe
 * skeleton is generated from this file into `claude-course.gen.ts` — regenerate
 * it with `bun run lessons:manifest`.
 */
import { claudePromptingLessons, type ClaudeAuthoredLesson } from "./claude-prompting.server";
import type { LessonMeta, ModuleMeta } from "./curriculum";

export type ClaudeTaskSpec = {
  title: string;
  mission: string;
  evidence: string;
  example?: string;
  /**
   * How to highlight the example. Declared rather than sniffed: the old
   * heuristic asked whether the example started with "claude", which was true
   * of every example the CLI level happened to have and of none of the
   * settings, skill and hook snippets the later levels need. A JSON block that
   * renders as plain text is the same defect as an unhighlighted code sample
   * anywhere else — it just took until Level 5 to show up.
   */
  exampleLanguage?: string;
};

/**
 * A level is either *templated* — a list of task specs that all render through
 * the same teach/do/prove wrapper — or *authored*, a handful of real lessons
 * written out in full with their own questions.
 *
 * Templated is what the whole course started as, and it is why Level 1 is being
 * rewritten: the wrapper repeats the level's guide, safety note and reference
 * on every page, so a twenty-task level shipped the same three paragraphs
 * twenty times to deliver twenty new sentences. The union keeps both forms
 * legal during the migration, and makes a half-converted level fail to compile
 * rather than silently render both.
 */
export type ClaudeLevelDefinition = ClaudeTemplatedLevel | ClaudeAuthoredLevel;

export type ClaudeAuthoredLevel = {
  id: string;
  title: string;
  summary: string;
  lessons: ClaudeAuthoredLesson[];
  tasks?: never;
};

export type ClaudeTemplatedLevel = {
  id: string;
  title: string;
  summary: string;
  /** How long an ordinary task in this level takes. */
  minutes: number;
  /**
   * The last task of every level is a capstone, and a capstone is not the same
   * size as the tasks that led to it — "build a workflow that gathers inputs,
   * proposes work, verifies it and stops on budget" is not fifteen minutes.
   * Priced separately so the roadmap's total is an estimate someone could
   * actually plan around.
   */
  capstoneMinutes: number;
  taskType: LessonMeta["type"];
  guide: string;
  safety: string;
  reference: string;
  tasks: ClaudeTaskSpec[];
  lessons?: never;
};

const task = (
  title: string,
  mission: string,
  evidence: string,
  example?: string,
  exampleLanguage?: string,
): ClaudeTaskSpec => ({
  title,
  mission,
  evidence,
  ...(example === undefined ? {} : { example }),
  ...(exampleLanguage === undefined ? {} : { exampleLanguage }),
});

/**
 * The one definition of a task's lesson id. The course modules and the authored
 * bodies in `claude-lessons.server.ts` both derive their keys from it, so a
 * task cannot go dark because two copies of the formula drifted apart.
 */
export const claudeTaskId = (levelId: string, index: number) =>
  `${levelId}.${String(index + 1).padStart(2, "0")}`;

/**
 * An authored lesson is keyed by a slug rather than a position, because merging
 * twenty tasks into six lessons renumbers everything after the first change and
 * a positional id would quietly point at different content each time.
 */
export const claudeLessonId = (levelId: string, slug: string) => `${levelId}.${slug}`;

export const claudeLevels: ClaudeLevelDefinition[] = [
  {
    id: "claude-prompting",
    title: "Level 1 · Basic Prompting",
    summary: "Ask useful questions, shape the answer, and check it before you use it.",
    lessons: claudePromptingLessons,
  },
  {
    id: "claude-cli",
    title: "Level 2 · Claude CLI",
    summary: "Work with Claude Code in a terminal, from a first session to repeatable commands.",
    minutes: 10,
    capstoneMinutes: 30,
    taskType: "practice",
    guide:
      "Claude Code works inside the folder you launch it from. Begin with read-only questions, inspect proposed changes, and run the project's own checks before accepting work.",
    safety:
      "Commands can change or delete files. Read permission prompts, keep backups or version control, and never use skip-permission flags as a beginner shortcut.",
    reference: "Claude Code documentation · https://code.claude.com/docs/en/overview",
    tasks: [
      task(
        "Meet the terminal",
        "Open a terminal and identify the prompt, the command line, and command output.",
        "A note naming the shell and the folder shown by the prompt.",
        "pwd",
      ),
      task(
        "Navigate to a safe practice folder",
        "Create or choose a disposable practice project and move into it before starting Claude.",
        "The terminal prints the intended practice-folder path.",
        "pwd",
      ),
      task(
        "Install from the official source",
        "Follow Anthropic's current setup page for your operating system and avoid copied third-party installers.",
        "The installed version prints successfully.",
        "claude --version",
      ),
      task(
        "Run the health check",
        "Use Claude Code's diagnostic command and resolve or record anything it flags.",
        "A clean result or a note describing the remaining warning.",
        "claude doctor",
      ),
      task(
        "Sign in deliberately",
        "Authenticate with the account or enterprise provider you intend to use and recognize where billing belongs.",
        "Claude starts under the expected account without exposing a credential.",
      ),
      task(
        "Start your first session",
        "Launch Claude inside the practice folder and ask what it can see before requesting any edits.",
        "A session that correctly identifies the current folder.",
        "claude",
      ),
      task(
        "Read built-in help",
        "Open CLI help and find the flags for print mode, model choice, and continuing a session.",
        "Three flag names copied from your installed version.",
        "claude --help",
      ),
      task(
        "Map a project before changing it",
        "Ask Claude to describe the top-level files, likely entry point, and available test command without editing.",
        "A project map you verified against the filesystem.",
      ),
      task(
        "Point Claude at a file",
        "Ask a focused question about one small file and verify the answer against the file itself.",
        "The file name, question, and one verified observation.",
      ),
      task(
        "Paste an error with context",
        "Provide an error, the command that caused it, and what you expected; ask for diagnosis before a fix.",
        "A diagnosis that distinguishes evidence from guesses.",
      ),
      task(
        "Use follow-up questions",
        "Stay in one session and refine an answer instead of repeating all context in a new session.",
        "A two-turn exchange where the follow-up clearly uses prior context.",
      ),
      task(
        "Clear unrelated context",
        "Start fresh when switching to an unrelated task so old assumptions do not leak into the new one.",
        "A new session or cleared context with a focused request.",
      ),
      task(
        "Compact a long session",
        "Use the installed interactive help to find and run the context-compaction command, then verify the goal survived.",
        "A compacted session that still states the current task correctly.",
      ),
      task(
        "Ask for a plan first",
        "Enter plan mode or explicitly request a read-only plan for a small change before authorizing edits.",
        "A plan naming files, checks, and risks without file changes.",
      ),
      task(
        "Review a proposed edit",
        "Let Claude change one disposable file, then inspect the diff before deciding whether to keep it.",
        "A reviewed diff and a sentence explaining the change.",
      ),
      task(
        "Run the project's checks",
        "Ask Claude to discover and run the narrowest relevant test or validation command.",
        "The exact command and its pass/fail result.",
      ),
      task(
        "Use print mode once",
        "Send a one-shot question that exits after printing the answer.",
        "One terminal command and its captured response.",
        'claude -p "Summarize this project in three bullets"',
      ),
      task(
        "Pipe safe text into Claude",
        "Pipe a small local, non-sensitive text sample into print mode and request a transformation.",
        "The pipeline and transformed output.",
        "printf 'one\\ntwo\\n' | claude -p \"Turn this into a checklist\"",
        "bash",
      ),
      task(
        "Request JSON output",
        "Run a one-shot query with JSON output and inspect which fields your installed version returns.",
        "Valid JSON parsed or formatted by another command.",
        'claude -p --output-format json "Name the current folder"',
      ),
      task(
        "Continue the latest session",
        "Leave a session, then continue it and ask Claude to restate the current goal.",
        "The continued session recalls the relevant goal.",
        "claude --continue",
      ),
      task(
        "Resume a chosen session",
        "Find and resume a specific earlier session instead of assuming the latest one is correct.",
        "The chosen session ID and a correct restatement of its task.",
        "claude --resume",
      ),
      task(
        "Choose a model intentionally",
        "Inspect the available model option and start a practice session with an appropriate supported alias or full model name.",
        "The session reports the model you selected.",
        "claude --model sonnet",
      ),
      task(
        "Add one extra directory",
        "Grant access to one additional safe folder for a cross-folder read task and confirm no broader path was added.",
        "A command scoped to exactly the two intended folders.",
        "claude --add-dir ../shared",
      ),
      task(
        "Turn on verbose diagnostics",
        "Use verbose output on a harmless one-shot request and identify one extra diagnostic it reveals.",
        "A note explaining when verbose mode would help.",
        'claude -p --verbose "List the project languages"',
      ),
      task(
        "Bound an agentic run",
        "Limit a non-interactive practice run to a small number of turns and observe how it stops.",
        "A bounded run that cannot continue indefinitely.",
        'claude -p --max-turns 3 "Inspect the project and suggest one improvement"',
      ),
      task(
        "Allow only a narrow tool set",
        "Run a read-only exercise with an explicit allow list rather than granting every tool.",
        "The allow list contains only tools the exercise needs.",
        "claude --allowedTools Read,Grep",
      ),
      task(
        "Block a risky tool",
        "Use the deny option to prevent a tool or shell pattern that the exercise does not need.",
        "A denied action is refused while safe work still succeeds.",
        "claude --disallowedTools Edit,Write",
      ),
      task(
        "Write useful project guidance",
        "Create a short CLAUDE.md in the practice project with verified commands, conventions, and boundaries.",
        "A concise guidance file containing no secrets or invented commands.",
      ),
      task(
        "Ask Claude to explain a diff",
        "Make a tiny tracked change yourself and ask Claude to explain the diff and possible side effects.",
        "An explanation you checked against the actual diff.",
      ),
      task(
        "Prepare a commit without publishing",
        "Ask Claude to run checks and draft a commit message, but do not let it push or publish anything.",
        "Passing checks and a truthful draft commit message.",
      ),
      task(
        "Recover from a wrong turn",
        "Intentionally request a harmless bad edit, stop, inspect what changed, and restore only that practice change.",
        "The folder returns to its known-good state without broad destructive commands.",
      ),
      task(
        "Capstone: terminal research brief",
        "Use Claude Code to inspect a practice repository and produce a verified onboarding brief in one saved file.",
        "The brief cites real files and commands, passes a manual accuracy check, and has a reviewed diff.",
      ),
    ],
  },
  {
    id: "claude-tools",
    title: "Level 3 · Tools",
    summary: "Connect Claude to outside services with MCP while keeping access narrow and visible.",
    minutes: 12,
    capstoneMinutes: 45,
    taskType: "challenge",
    guide:
      "MCP servers expose external data and actions as tools. A connection is not automatically trustworthy: verify the provider, inspect its tools, choose the smallest scope, and test reads before writes.",
    safety:
      "Third-party MCP servers can see the data you authorize. Prefer official or organization-approved providers, review OAuth scopes, keep secrets out of config files, and require confirmation for sends, edits, deletes, or invites.",
    reference: "Claude Code MCP guide · https://code.claude.com/docs/en/mcp",
    tasks: [
      task(
        "Understand the MCP trust boundary",
        "Draw how Claude, an MCP server, and an outside service exchange requests and data.",
        "A three-part diagram marking where credentials and user data travel.",
      ),
      task(
        "Inventory existing connections",
        "List configured MCP servers and identify their scope before adding anything.",
        "A table of server name, provider, scope, and purpose.",
        "claude mcp list",
      ),
      task(
        "Choose a trustworthy provider",
        "Evaluate one connector using ownership, documentation, requested scopes, maintenance, and removal instructions.",
        "A written go/no-go decision supported by those five checks.",
      ),
      task(
        "Pick local, project, or user scope",
        "Choose the narrowest configuration scope for a sample integration and explain who will inherit it.",
        "A scope choice that matches the intended users and projects.",
      ),
      task(
        "Add a harmless practice server",
        "Connect an approved read-only or local practice MCP server using its current official instructions.",
        "The server appears in the MCP list and exposes only expected tools.",
      ),
      task(
        "Inspect tools before using them",
        "Review the connected server's tool names and distinguish reads from writes.",
        "A read/write inventory with risky actions highlighted.",
      ),
      task(
        "Keep secrets out of version control",
        "Configure credentials through the provider's supported secure flow and check that no token entered a tracked file.",
        "A clean diff and a successful authenticated connection.",
      ),
      task(
        "Test read before write",
        "Run a harmless read and verify the returned record in the source service.",
        "One source item matches Claude's result.",
      ),
      task(
        "Remove a connection cleanly",
        "Disconnect the practice server and confirm both access and stored authorization are gone where applicable.",
        "The server no longer lists and a tool call no longer works.",
      ),
      task(
        "Connect Notion safely",
        "Connect an approved Notion MCP endpoint and share only a practice page or workspace area.",
        "Claude can see the practice page and not an unrelated private page.",
      ),
      task(
        "Find a Notion page",
        "Ask Claude to locate a page by a distinctive phrase and return its title and last edited context.",
        "The result matches the source page.",
      ),
      task(
        "Summarize Notion without inventing",
        "Summarize a practice page and require unknown owners or dates to remain unknown.",
        "A summary whose facts can all be traced to the page.",
      ),
      task(
        "Create a Notion draft",
        "Create a clearly labeled draft page from safe notes without publishing or notifying anyone.",
        "A draft in the intended parent with the expected fields.",
      ),
      task(
        "Update one Notion field",
        "Change one low-risk property on a practice item after previewing the intended write.",
        "Only the approved property changed.",
      ),
      task(
        "Build a Notion meeting workflow",
        "Turn practice notes into decisions and actions, then write them to a sandbox page after confirmation.",
        "A source-linked summary and confirmed write with no invented assignees.",
      ),
      task(
        "Prepare Figma Dev Mode",
        "Use Figma's current official setup to expose a practice design through its approved MCP server.",
        "Claude connects to the intended local or hosted Figma endpoint.",
      ),
      task(
        "Read a selected Figma frame",
        "Ask Claude to describe hierarchy, spacing, typography, and component names in one selected frame.",
        "A description checked against the visible frame.",
      ),
      task(
        "Extract design tokens",
        "Collect colors, type styles, spacing, and radii from a practice frame without treating one-off values as system tokens.",
        "A token draft with source locations and uncertainties.",
      ),
      task(
        "Map Figma components to code",
        "Match three design components to existing code components before proposing anything new.",
        "A mapping table with reuse, adapt, or create decisions.",
      ),
      task(
        "Implement one Figma component",
        "Ask Claude to implement one small component from the selected design, then inspect it visually and in code.",
        "A reviewed diff and side-by-side visual check.",
      ),
      task(
        "Check design fidelity",
        "Ask Claude to list observable mismatches rather than claiming a pixel-perfect result.",
        "A prioritized mismatch list with at least one manual observation.",
      ),
      task(
        "Connect Gmail with least privilege",
        "Choose an approved Gmail connector and authorize only the account and scopes required for a practice read task.",
        "The connection can read the intended test message and cannot send without separate approval.",
      ),
      task(
        "Search a narrow mail window",
        "Find test messages using sender, subject, and date constraints so unrelated mail stays out of context.",
        "A small result set matching the same search in Gmail.",
      ),
      task(
        "Summarize an email thread",
        "Summarize a test thread into decisions, requests, and unanswered questions without drafting a reply yet.",
        "A traceable summary with quoted details kept minimal.",
      ),
      task(
        "Draft but do not send",
        "Create a reply draft with recipients, claims, and attachments listed for review.",
        "A draft clearly marked unsent and checked against the thread.",
      ),
      task(
        "Require confirmation before send",
        "Attempt a practice send workflow and keep the final send action behind an explicit human confirmation.",
        "The message remains a draft until you approve the exact recipients and body.",
      ),
      task(
        "Connect Calendar narrowly",
        "Authorize an approved calendar connector to a dedicated practice calendar where possible.",
        "Claude can access the practice calendar without unnecessary account scopes.",
      ),
      task(
        "Read calendar availability",
        "Ask for open times in a bounded date range and timezone; verify against the calendar UI.",
        "A shortlist with timezone and conflicts correctly handled.",
      ),
      task(
        "Draft a calendar event",
        "Prepare title, time, timezone, attendees, location, and agenda without creating the event.",
        "A complete preview with no invites sent.",
      ),
      task(
        "Create an event after review",
        "Approve one event on the practice calendar only after checking every field.",
        "Exactly one event exists with the reviewed details.",
      ),
      task(
        "Handle a timezone edge case",
        "Plan a sample meeting across two timezones around a daylight-saving boundary.",
        "Both local times are verified with an authoritative timezone source.",
      ),
      task(
        "Chain tools with checkpoints",
        "Read safe notes, draft an action list, and prepare calendar items while pausing before every external write.",
        "A workflow log showing each read, draft, approval, and write.",
      ),
      task(
        "Detect a prompt-injection attempt",
        "Place an obviously malicious instruction inside practice tool data and confirm Claude treats it as data, not authority.",
        "The hidden instruction is ignored and reported without executing it.",
      ),
      task(
        "Audit and revoke access",
        "Review every course connection, remove unused ones, and revoke stale authorizations in the source services.",
        "A final inventory containing only actively needed connections.",
      ),
      task(
        "Capstone: cross-tool weekly review",
        "Build a review that reads bounded test data from mail, calendar, Notion, and Figma, then proposes actions without silently writing anything.",
        "A verified weekly brief, an approval queue, and a record of the scopes used.",
      ),
    ],
  },
  {
    id: "claude-subagents",
    title: "Level 4 · Subagents",
    summary: "Delegate focused work to specialist Claude workers and combine their results.",
    minutes: 12,
    capstoneMinutes: 40,
    taskType: "challenge",
    guide:
      "A subagent should have one bounded responsibility, only the tools it needs, and a result format the parent can evaluate. Parallel work helps only when tasks are independent.",
    safety:
      "More agents multiply access, cost, and mistakes. Do not give every worker write or shell access; avoid overlapping edits and keep one owner for final integration.",
    reference: "Claude Code subagents · https://code.claude.com/docs/en/sub-agents",
    tasks: [
      task(
        "Spot a delegable task",
        "Take a project request and separate one self-contained research task from work that needs shared context.",
        "A delegation boundary with clear inputs and output.",
      ),
      task(
        "Open the agent manager",
        "Use your installed Claude Code help to find the supported agent-management command or interface.",
        "The available agents and their scopes are visible.",
      ),
      task(
        "Create a read-only researcher",
        "Define a specialist whose job is to inspect files and return evidence without editing.",
        "An agent definition with a focused description and no write tools.",
      ),
      task(
        "Write a precise description",
        "Improve an agent description so Claude knows when to delegate and when not to.",
        "A description containing trigger, responsibility, and exclusion.",
      ),
      task(
        "Choose the minimum tools",
        "Give a specialist only the read/search tools needed for its job.",
        "The agent succeeds while an unnecessary write attempt is unavailable or denied.",
      ),
      task(
        "Choose a model for the job",
        "Select a supported model setting based on task complexity, latency, and cost instead of habit.",
        "A model choice with a one-sentence tradeoff.",
      ),
      task(
        "Give an agent a result contract",
        "Require findings in a consistent format: conclusion, evidence, uncertainty, and next step.",
        "A result that the parent can compare without reformatting.",
      ),
      task(
        "Delegate one repository question",
        "Have the researcher answer one architecture question and cite the files it inspected.",
        "A concise answer with valid file evidence.",
      ),
      task(
        "Verify a subagent result",
        "Check one claim from the worker yourself before using it in a decision.",
        "The claim is confirmed or corrected with evidence.",
      ),
      task(
        "Create a test specialist",
        "Define an agent that can inspect and run tests but cannot edit production files.",
        "A test report with exact commands and failures.",
      ),
      task(
        "Create a documentation specialist",
        "Define an agent that identifies documentation gaps and drafts suggestions in its response.",
        "A prioritized doc-gap list without unapproved file changes.",
      ),
      task(
        "Pass only needed context",
        "Rewrite an overlong delegation so it includes the goal, relevant paths, constraints, and output—nothing else.",
        "A shorter brief that still produces the right result.",
      ),
      task(
        "Run two independent researchers",
        "Send separate, non-overlapping questions to two workers at the same time.",
        "Two results produced without shared-file conflicts.",
      ),
      task(
        "Know when not to parallelize",
        "Identify dependencies in a three-step task and keep dependent steps sequential.",
        "A small dependency map with the safe parallel branch marked.",
      ),
      task(
        "Compare competing recommendations",
        "Ask two specialists to analyze the same choice from different named perspectives.",
        "A comparison that exposes assumptions rather than voting blindly.",
      ),
      task(
        "Resolve contradictory findings",
        "Trace two conflicting agent claims back to primary evidence and decide which holds.",
        "A resolution citing the decisive evidence and remaining uncertainty.",
      ),
      task(
        "Prevent overlapping edits",
        "Assign exclusive file ownership for a sample parallel implementation.",
        "A file-ownership table with no ambiguous paths.",
      ),
      task(
        "Use worktrees or isolated copies",
        "Set up isolated working areas for two experimental changes without touching the main working tree.",
        "Two named work areas and a clean main tree.",
      ),
      task(
        "Set a stopping condition",
        "Tell a worker when to stop, what not to attempt, and what to report if blocked.",
        "The worker stops at the boundary and reports the blocker.",
      ),
      task(
        "Budget agent effort",
        "Cap the number of workers or turns for a practice investigation and compare cost to value.",
        "A run log that stayed inside the declared budget.",
      ),
      task(
        "Handle a failed worker",
        "Simulate a missing dependency or denied permission and have the agent return a useful blocked report.",
        "A report with attempted checks, evidence, and a safe next action.",
      ),
      task(
        "Synthesize without hiding disagreement",
        "Combine three worker reports while preserving conflicts and confidence levels.",
        "One synthesis with agreement, disagreement, and decision sections.",
      ),
      task(
        "Review before integrating",
        "Have one specialist review a proposed patch while a single owner decides and applies changes.",
        "Review findings tied to diff lines and an explicit integration decision.",
      ),
      task(
        "Build a small agent team",
        "Define researcher, tester, and reviewer roles for one bounded practice feature.",
        "Three narrow definitions and an orchestration sequence.",
      ),
      task(
        "Capstone: parallel project audit",
        "Run a read-only accessibility, testing, and documentation audit in parallel, then create one prioritized plan.",
        "Three evidence-based reports, a conflict-free synthesis, and no unapproved edits.",
      ),
    ],
  },
  {
    id: "claude-skills-safety",
    title: "Level 5 · Skills & Safety",
    summary: "Package repeatable expertise into skills and design permissions that fail safely.",
    minutes: 13,
    capstoneMinutes: 45,
    taskType: "challenge",
    guide:
      "Skills are reusable instructions and supporting resources, usually centered on a SKILL.md file. Keep the trigger narrow, load details progressively, and test the skill against both intended and unintended requests.",
    safety:
      "Permissions are part of the product, not an obstacle. Default-deny risky actions, scope allow rules tightly, inspect hooks as executable code, and never hide destructive behavior inside a skill.",
    reference: "Claude Code skills and settings · https://code.claude.com/docs/en/skills",
    tasks: [
      task(
        "Distinguish skills from project memory",
        "Decide whether four sample instructions belong in CLAUDE.md, a reusable skill, or the current prompt.",
        "A classification with one reason per item.",
      ),
      task(
        "Find skill locations",
        "Use current docs or built-in help to identify personal and project skill directories.",
        "The two supported locations from your installed version.",
      ),
      task(
        "Define a narrow skill trigger",
        "Write a one-sentence description that clearly says when a practice skill should and should not run.",
        "A trigger with positive and negative boundaries.",
      ),
      task(
        "Create a minimal SKILL.md",
        "Build a small skill with valid frontmatter, purpose, inputs, steps, and output.",
        "The skill loads and produces the promised output on a sample request.",
      ),
      task(
        "Test automatic discovery",
        "Phrase a request that should trigger the skill without naming it directly.",
        "Claude selects the skill and explains the match through its behavior.",
      ),
      task(
        "Test explicit invocation",
        "Invoke the practice skill by its supported name and compare the result with automatic discovery.",
        "Both paths use the same core workflow.",
      ),
      task(
        "Add an example without overfitting",
        "Provide one representative input/output example while keeping the rules general.",
        "The skill handles both the example and a meaningfully different case.",
      ),
      task(
        "Move detail into a reference file",
        "Keep SKILL.md concise and place optional deep guidance in a linked reference.",
        "The main skill stays scannable and the reference loads only when needed.",
      ),
      task(
        "Add a reusable template",
        "Put a stable output skeleton in the skill and tell Claude when to copy it.",
        "Two outputs share the structure without copying sample content.",
      ),
      task(
        "Add a helper script safely",
        "Use a deterministic local helper for one repetitive transformation and document its inputs and outputs.",
        "The helper handles a valid sample and fails clearly on bad input.",
      ),
      task(
        "Validate skill inputs",
        "Require necessary inputs and return a helpful question when any are missing.",
        "The skill refuses to guess a critical missing value.",
      ),
      task(
        "Define a completion check",
        "Add objective checks the skill must run before claiming success.",
        "A failed check prevents a false success message.",
      ),
      task(
        "Test a negative trigger",
        "Try three similar requests that should not activate the skill.",
        "The skill stays out of scope on all three.",
      ),
      task(
        "Version a skill change",
        "Change one behavior, record why, and keep the diff reviewable.",
        "A small diff with a before/after test.",
      ),
      task(
        "Review a third-party skill",
        "Inspect an external skill's instructions, scripts, network use, and permissions before installing it.",
        "A risk review and a go/no-go decision.",
      ),
      task(
        "Understand permission precedence",
        "Map how deny, ask, and allow rules interact in the current Claude Code settings.",
        "A precedence diagram checked against official documentation.",
        `{
  "permissions": {
    "deny": ["Bash(aws *)"],
    "ask": ["Bash(git push *)"],
    "allow": ["Bash(aws s3 ls)", "Bash(git status *)"]
  }
}`,
        "json",
      ),
      task(
        "Locate settings scopes",
        "Identify user, project, local, and managed settings applicable to your environment.",
        "A scope table explaining who controls and inherits each one.",
        `Highest wins. A key set above overrides the same key below.

  1  managed-settings.json         your organization (path varies by OS)
  2  claude --settings '{...}'     this session only
  3  .claude/settings.local.json   you, this project (gitignored)
  4  .claude/settings.json         everyone in this project (checked in)
  5  ~/.claude/settings.json       you, every project`,
        "text",
      ),
      task(
        "Write a read-only allow rule",
        "Allow one safe read operation narrowly and confirm unrelated operations still prompt or fail.",
        "One intended match and one proven non-match.",
        `{
  "permissions": {
    "allow": ["Read(./docs/**)"]
  }
}`,
        "json",
      ),
      task(
        "Write a command-specific rule",
        "Scope a shell permission to one harmless command pattern instead of all shell access.",
        "The intended command works and a neighboring risky command does not.",
        `{
  "permissions": {
    "allow": ["Bash(git status *)", "Bash(git log *)"]
  }
}`,
        "json",
      ),
      task(
        "Add a deny rule",
        "Block a destructive command or sensitive path in the practice configuration.",
        "A safe test demonstrates the denial without damaging data.",
        `{
  "permissions": {
    "deny": ["Bash(rm *)", "Bash(git push *)", "Edit(./.git/**)"]
  }
}`,
        "json",
      ),
      task(
        "Protect environment files",
        "Prevent Claude from reading common secret files while leaving documented sample files accessible.",
        "A secret-like practice file is denied and its example counterpart is readable.",
        `{
  "permissions": {
    "deny": ["Read(.env)", "Read(.env.local)", "Read(./secrets/**)"]
  }
}`,
        "json",
      ),
      task(
        "Review a permission prompt",
        "Read the tool name, exact arguments, target, and side effects before choosing allow once or deny.",
        "A written decision based on the actual requested action.",
      ),
      task(
        "Use plan mode as a boundary",
        "Run a task in plan mode and verify that investigation happens without implementation.",
        "A useful plan and an unchanged working tree.",
        `claude --permission-mode plan`,
        "bash",
      ),
      task(
        "Use sandboxing where available",
        "Enable or inspect the supported sandbox boundary and test it on a harmless out-of-scope write.",
        "The boundary blocks the write while in-scope work remains possible.",
        `{
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "allowWrite": ["/tmp/practice"]
    }
  }
}`,
        "json",
      ),
      task(
        "Avoid the skip-permissions trap",
        "Explain why bypassing all prompts is different from a narrow allow rule and name a safer alternative.",
        "A scenario-based explanation with a least-privilege replacement.",
      ),
      task(
        "Read a hook before enabling it",
        "Inspect a sample hook command, trigger, inputs, outputs, and failure behavior.",
        "A hook review that identifies every external side effect.",
        `Answer all six from the hook's definition and its script, before you enable it.

trigger   PostToolUse, matcher "Edit|Write"  — every file edit, nothing else
command   "$CLAUDE_PROJECT_DIR"/.claude/hooks/check.sh
stdin     JSON: tool_name, tool_input, cwd, permission_mode
          (PostToolUse also receives tool_result)
exit 0    success — stdout reaches only the debug log unless it is JSON
exit 2    blocks the action — stderr becomes the reason Claude is given
timeout   set it explicitly; on timeout the hook is cancelled and its output
          discarded, so a hook you rely on must finish well inside it`,
        "text",
      ),
      task(
        "Create a formatting hook",
        "Add a bounded post-edit hook for a disposable project using an existing formatter.",
        "The hook formats only intended files and surfaces failures.",
        `{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write",
            "timeout": 30
          }
        ]
      }
    ]
  }
}`,
        "json",
      ),
      task(
        "Create a protective hook",
        "Add a hook that rejects a clearly defined unsafe practice action with a useful message.",
        "One unsafe test is blocked and one safe action passes.",
        `#!/bin/bash
# .claude/hooks/protect-files.sh
# Register as a PreToolUse hook with matcher "Edit|Write".

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
FILE_PATH="\${FILE_PATH//\\\\//}"          # normalise Windows separators

for pattern in ".env" "package-lock.json" ".git/"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    # Exit 2 blocks the call and stderr is the only thing Claude is told, so
    # name what was refused and what to do instead.
    echo "Blocked: $FILE_PATH matches '$pattern'. Practise on a copy in /tmp/practice." >&2
    exit 2
  fi
done

exit 0`,
        "bash",
      ),
      task(
        "Prevent recursive hooks",
        "Check that a hook's own actions cannot retrigger it indefinitely.",
        "A bounded run with a documented recursion guard.",
      ),
      task(
        "Keep hook output useful",
        "Reduce a noisy hook to actionable errors and the minimum context Claude needs.",
        "A concise failure message with a next step.",
      ),
      task(
        "Threat-model a workflow",
        "List assets, actors, entry points, risky actions, and mitigations for one Claude workflow.",
        "A threat model containing prevention, detection, and recovery controls.",
      ),
      task(
        "Defend against tool-data injection",
        "Write instructions that treat email, documents, issues, and web content as untrusted data.",
        "A malicious sample is quoted or reported, never followed.",
      ),
      task(
        "Design a human approval gate",
        "Place explicit review before external communication, money movement, deletion, or publishing.",
        "A workflow diagram with named approver and exact review payload.",
      ),
      task(
        "Build a safe team skill",
        "Combine a narrow skill, minimum permissions, checks, and an approval gate for a shared practice task.",
        "A teammate can run it without receiving broader access.",
      ),
      task(
        "Capstone: safety review and drill",
        "Audit the practice project's skills, settings, MCP servers, and hooks, then rehearse recovery from one denied or failed action.",
        "An audit report, corrected configuration, and a recovery note with no secrets.",
      ),
    ],
  },
  {
    id: "claude-autonomy",
    title: "Level 6 · Autonomy",
    summary: "Build bounded, observable workflows that can run without constant supervision.",
    minutes: 15,
    capstoneMinutes: 60,
    taskType: "project",
    guide:
      "Autonomy is a controlled loop: receive a goal, inspect state, choose an action, verify the result, and stop. Reliable systems have budgets, idempotency, observability, approval gates, and an easy kill switch.",
    safety:
      "Never make a workflow autonomous before it is safe when attended. Start in read-only dry-run mode, use test accounts, cap time and spend, and keep irreversible or public actions behind human approval.",
    reference: "Claude Code CLI reference · https://code.claude.com/docs/en/cli-reference",
    tasks: [
      task(
        "Choose an autonomy-worthy job",
        "Score a recurring task by frequency, clarity, reversibility, risk, and verification cost.",
        "A decision to automate, assist, or leave manual with reasons.",
      ),
      task(
        "Write a machine-checkable goal",
        "Replace a vague objective with inputs, constraints, success checks, and a stop condition.",
        "A goal another operator could evaluate without asking what 'done' means.",
      ),
      task(
        "Build a read-only dry run",
        "Make the first version inspect state and propose actions without changing anything.",
        "A dry-run report and an unchanged target system.",
      ),
      task(
        "Use structured output",
        "Return a stable JSON result with status, evidence, proposed actions, and errors.",
        "Output that validates against your documented shape.",
      ),
      task(
        "Bound turns and runtime",
        "Set explicit turn and time limits for a non-interactive practice run.",
        "A run that stops within both limits and reports incomplete work honestly.",
      ),
      task(
        "Set a cost budget",
        "Choose a per-run and per-day budget with behavior for approaching or exceeding it.",
        "A budget policy and a simulated budget-stop event.",
      ),
      task(
        "Make the workflow idempotent",
        "Run the same practice job twice without creating duplicate files, messages, or records.",
        "The second run makes no unintended additional change.",
      ),
      task(
        "Checkpoint durable state",
        "Record what was attempted, completed, and still pending so a later run can resume safely.",
        "A small state record that survives process restart.",
      ),
      task(
        "Resume after interruption",
        "Stop a run between steps and restart it from the last verified checkpoint.",
        "The resumed run neither repeats a completed side effect nor skips pending work.",
      ),
      task(
        "Classify retryable failures",
        "Separate transient errors from permission, validation, and logic errors; retry only the transient kind.",
        "A retry table with limits and backoff.",
      ),
      task(
        "Add exponential backoff",
        "Simulate rate limits and delay bounded retries instead of hammering the service.",
        "A log showing increasing waits and a final stop.",
      ),
      task(
        "Validate every side effect",
        "After each practice write, read back the result and compare it with the requested state.",
        "A verification record for each changed item.",
      ),
      task(
        "Create an approval queue",
        "Collect proposed high-impact actions into a reviewable queue rather than executing them.",
        "Each queue item shows target, exact change, evidence, and risk.",
      ),
      task(
        "Add a kill switch",
        "Provide one documented way to stop new work and prevent queued writes immediately.",
        "A drill where the switch stops the next action.",
      ),
      task(
        "Log decisions, not secrets",
        "Capture timestamp, goal, action, result, and error while redacting credentials and sensitive payloads.",
        "Useful logs that pass a secret scan.",
      ),
      task(
        "Emit useful metrics",
        "Track runs, success rate, duration, retries, approvals, and cost for a practice workflow.",
        "A small dashboard or report with all six measures.",
      ),
      task(
        "Alert on the right failures",
        "Define alerts for budget, repeated failure, stalled approval, and unexpected scope growth without alerting on normal noise.",
        "Four tested alert conditions and an owner for each.",
      ),
      task(
        "Use isolated workspaces",
        "Run code-changing work in a temporary branch or worktree and keep the main branch untouched until review.",
        "An isolated diff that can be discarded or integrated cleanly.",
      ),
      task(
        "Schedule a harmless job",
        "Schedule a read-only local practice report and document how to disable it.",
        "One successful scheduled run and a tested disable path.",
      ),
      task(
        "Run safely in CI",
        "Design a CI job with pinned environment, minimum token permissions, bounded commands, and no untrusted secret exposure.",
        "A reviewed configuration or pseudoconfiguration with those controls.",
      ),
      task(
        "Handle untrusted input",
        "Feed the workflow malicious task text and confirm policy and system boundaries outrank the content.",
        "The run rejects or contains the instruction and records why.",
      ),
      task(
        "Add a human escalation path",
        "Route ambiguity, policy conflicts, and repeated failures to a named person with a compact evidence packet.",
        "A sample escalation that asks one answerable question.",
      ),
      task(
        "Measure quality over time",
        "Create a small evaluation set and compare workflow outputs after a prompt or skill change.",
        "A before/after scorecard that catches at least one regression.",
      ),
      task(
        "Graduate from assisted to autonomous",
        "Define readiness gates from manual, to suggested, to approved execution, to bounded autonomy.",
        "A four-stage rollout with rollback criteria.",
      ),
      task(
        "Capstone: autonomous operations loop",
        "Build a test-only workflow that gathers bounded inputs, proposes work, executes only approved low-risk actions, verifies them, logs results, and stops on budget or policy limits.",
        "A complete demo with dry run, approval, execution, verification, metrics, kill-switch drill, and retrospective.",
      ),
    ],
  },
];

/**
 * The client-safe course skeleton: ids, titles, lengths and types, and nothing
 * a learner could read an answer out of. `claude-course.gen.ts` is this value
 * written to disk; the test compares the two so the committed file cannot drift.
 */
export function claudeModulesFromLevels(): ModuleMeta[] {
  return claudeLevels.map((level) => {
    if (level.lessons) {
      return {
        id: level.id,
        title: level.title,
        summary: `${level.lessons.length} lessons \u00b7 ${level.summary}`,
        lessons: level.lessons.map((lesson) => ({
          id: claudeLessonId(level.id, lesson.slug),
          title: lesson.title,
          minutes: lesson.minutes,
          type: lesson.type,
        })),
      };
    }
    return {
      id: level.id,
      title: level.title,
      summary: `${level.tasks.length} tasks \u00b7 ${level.summary}`,
      lessons: level.tasks.map((item, index) => {
        const capstone = index === level.tasks.length - 1;
        return {
          id: claudeTaskId(level.id, index),
          title: item.title,
          minutes: capstone ? level.capstoneMinutes : level.minutes,
          type: capstone ? ("project" as const) : level.taskType,
        };
      }),
    };
  });
}

export function renderClaudeModules(): string {
  return `// AUTO-GENERATED by \`bun run lessons:manifest\` from claude-levels.server.ts — never edit.
import type { ModuleMeta } from "./curriculum";

export const claudeModules: ModuleMeta[] = ${JSON.stringify(claudeModulesFromLevels(), null, 2)};
`;
}
