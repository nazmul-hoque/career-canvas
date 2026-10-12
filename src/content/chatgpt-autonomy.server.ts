/**
 * Level 6 of the ChatGPT course: delegating a whole task, with limits.
 *
 * Ten task specs merged into four lessons. Everything stays draft-only: the
 * level teaches the shape of a bounded delegation without ever letting the
 * practice workflow reach another person.
 */
import type { AuthoredLesson } from "./authored-lesson";
import { ATTESTED_XP } from "./gamification";

const REFERENCE = "Scheduled tasks · https://learn.chatgpt.com/docs/automations";

export const chatgptAutonomyLessons: AuthoredLesson[] = [
  {
    slug: "bounded-objective",
    title: "A bounded objective, a budget, and a place to run",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Define done, cap the effort, and know what the run can actually reach.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "Handing over a whole task means you won't be watching each step, so everything you'd have decided in the moment has to be decided in advance. Three things, before anything runs.",
        },
        {
          kind: "text",
          body: "**The objective, with a finish line.** \"Produce a weekly update from these three notes\" plus what the output must contain, what counts as success, and what's explicitly out of scope. The exclusions do real work (*don't contact anyone, don't invent items that aren't in the notes, don't reorganise the format*) because a broad objective invites helpful additions you never asked for.",
        },
        {
          kind: "text",
          body: '**An effort budget.** Two revision attempts, then stop. Without a cap, an unsatisfied run keeps refining, and the tenth version is not better than the second. It\'s just further from what you reviewed. Record the attempt count and the reason work stopped, because "stopped at the limit" and "stopped because it finished" are very different results that produce similar-looking output.',
        },
        {
          kind: "text",
          body: "**Where it runs and what it can reach.** Check whether your account's tools run in the cloud or locally, and what inputs they can actually see. A scheduled task that can't reach the file you meant will find something else to do. For a plain chat run, document which files you'll be supplying yourself. The point is to know the reach before the run, not discover it from the output.",
        },
        {
          kind: "callout",
          body: "**Everything in this level stays draft-only.** Nothing sends, publishes or contacts anyone. Use fictional notes, and if you create a practice schedule, pause it when you're done.",
        },
        {
          kind: "callout",
          body: "**Practice.** Write an objective for producing a weekly update from three fictional notes, with the output, the success checks and the exclusions stated before anything starts. Give it a maximum of two revision attempts and a clear stop condition, then run it supervised and log the attempt count and why it stopped. Then write an execution plan naming where the run happens, what it can reach, and what you'll supply by hand.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "Why state exclusions in the objective when you've already said what you want?",
          options: [
            "Because a broad objective invites helpful additions: reformatting, extra items, contacting people",
            "To keep the output shorter",
            "Because exclusions are required before scheduling a task",
            "To make the success checks easier to write",
          ],
          answer: 0,
          explanation:
            "\"Produce a weekly update\" doesn't say not to reorganise the sections or add an item that seemed missing. Naming what's out of scope is how you keep the run inside the thing you reviewed.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "Two runs both produce a finished-looking update. One stopped at its two-attempt limit. Why does the distinction matter?",
          options: [
            "The limited run used more effort and cost more",
            "Runs that hit a limit are always incomplete",
            "One met its checks and the other ran out of attempts. The outputs look alike but mean different things",
            "It determines whether the run can be scheduled later",
          ],
          answer: 2,
          explanation:
            "A run that stopped because it satisfied its checks is done; one that stopped because it ran out of attempts is unfinished and may know it. Nothing in the output distinguishes them, which is why the log records the reason.",
        },
      ],
    },
  },
  {
    slug: "plan-dry-run-stop",
    title: "Review the plan, run it supervised, then break it",
    minutes: 20,
    type: "practice",
    body: {
      summary:
        "Check the steps before they happen, verify the output against inputs, and test the stop.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "**Ask for the plan before the work.** The steps it intends to take are cheap to read and cheap to correct, and you're looking for two things: does each step contribute to the objective, and does any step reach outside it: sending a message, editing something, fetching a source you didn't authorise. Remove those before running, not after.",
        },
        {
          kind: "text",
          body: "**Then the supervised run.** Watch it once with complete fictional notes. The temptation at the end is to read the completion message (\"I've produced the weekly update covering all three notes\") and take it as the result. It isn't the result. It's a claim about the result.",
        },
        {
          kind: "text",
          body: "Check the output against the inputs instead, note by note, exactly as in Level 4. Every stated decision and every change should trace to something you supplied. This is the discipline that makes the difference between supervising a run and watching one happen.",
        },
        {
          kind: "text",
          body: "**Now break it on purpose.** Replace one note with a conflicting event date and run it again. The correct behaviour is to report the conflict and stop *before* presenting a final update, because a workflow that silently picks one date has made a decision that belongs to you, and it will make the same decision every week without telling you.",
        },
        {
          kind: "text",
          body: "A stop is a success. The thing you're building towards is a workflow that halts on ambiguity rather than one that always produces something, and those are genuinely different goals. The second is easier to reach and much worse to rely on.",
        },
        {
          kind: "callout",
          body: "**Practice.** Ask for the steps the workflow will take on your fictional notes and remove anything that doesn't serve the objective or that reaches outside it. Run it once supervised with complete notes and verify every stated decision against the inputs rather than accepting the completion message. Then replace one note with a conflicting date and confirm the run reports the conflict and stops before producing a final update.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            'The run ends with "I\'ve produced the weekly update covering all three notes." What is that?',
          options: [
            "A claim about the result, which is not the same as the result",
            "Confirmation that all three notes were used",
            "A summary that can be checked against the output",
            "Evidence the run stayed within its budget",
          ],
          answer: 0,
          explanation:
            "The sentence is generated by the same process that made the output, so it carries no independent information. Checking coverage means going back to the three notes and finding where each one landed.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "Your inputs contain two different event dates. The workflow picks the later one and produces a clean update. What's wrong?",
          options: [
            "Nothing, because the later date is usually the correction",
            "It resolved an ambiguity that was yours to resolve, and will do so again unseen every week",
            "It should have used the earlier date as the original",
            "It should have included both dates in the output",
          ],
          answer: 1,
          explanation:
            "The choice may even be right. The problem is that it was made silently inside an unsupervised run. So the one week the later date is a typo, the update goes out wrong with nothing to flag it.",
        },
      ],
    },
  },
  {
    slug: "recover-schedule-audit",
    title: "Recovering, scheduling, and auditing a run",
    minutes: 20,
    type: "practice",
    body: {
      summary: "Resume without duplicating, schedule something harmless, and review what happened.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "**Test a missing input.** Remove a required note and run it. A useful blocked report names exactly what's missing (\"note 2 of 3, the volunteer rota, wasn't provided\") rather than reporting a general failure or, worse, producing an update from two notes as though that were the job.",
        },
        {
          kind: "text",
          body: "Then supply the note and resume, and check the resumption didn't redo completed work or double up items already in the draft. Duplication on resume is the characteristic failure here, and it's easy to miss because the output looks complete.",
        },
        {
          kind: "text",
          body: "**Scheduling makes it real**, because now it runs when you aren't there. A schedule specification needs five things: cadence, timezone, where the inputs come from, where the output goes, and the pause rule: how it gets stopped and by whom. The timezone is not pedantry; a weekly Monday-morning task means different things in two countries, and a run that fires before the inputs exist produces a confident update about nothing.",
        },
        {
          kind: "text",
          body: "If your account supports scheduled tasks, create a harmless draft-only one, inspect its configuration, then **pause it**. If it doesn't, write the same specification for a manual calendar reminder. The specification is the deliverable either way, and the discipline of writing the pause rule before the start rule is the part that transfers.",
        },
        {
          kind: "text",
          body: "**Finally, audit one run.** Four questions: were all the sources covered, are any statements unsupported by the inputs, what actions were taken, and how much effort was used? Then record one change that makes the *next* run easier to inspect: a numbered output, a source tag per item, a shorter format. Auditing gets skipped when it's laborious, so the most valuable improvement is usually the one that reduces the cost of the next audit.",
        },
        {
          kind: "callout",
          body: "**Practice.** Remove one required note, confirm the run reports exactly what's missing, then supply it and resume, checking nothing was duplicated. Write a schedule specification with cadence, timezone, input source, output destination and pause rule; if your account supports it, create a draft-only practice task, inspect it, and pause it. Then audit one completed run for source coverage, unsupported statements, actions taken and effort used, and name one change that makes the next audit cheaper.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "Which is the useful blocked report?",
          options: [
            '"I wasn\'t able to complete the weekly update."',
            '"Note 2 of 3, the volunteer rota, wasn\'t provided. Notes 1 and 3 were processed; supply note 2 to continue."',
            '"An error occurred while reading the input files."',
            '"I\'ve produced the update using the notes that were available."',
          ],
          answer: 1,
          explanation:
            "It names exactly what's missing and what was already done, so resuming is one step. The last option is the dangerous one. It silently redefines the job as whatever inputs happened to be there.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "Why does a schedule specification need a timezone and a pause rule before it needs anything else?",
          options: [
            "Because most scheduling tools require both fields",
            "Because a run that fires before its inputs exist produces a confident update about nothing, and you need a way to stop it",
            "Because they're the hardest settings to change afterwards",
            "Because they determine where the output is delivered",
          ],
          answer: 1,
          explanation:
            "Timing decides whether the run sees real inputs, and the pause rule is how you stop it once you notice it doesn't. Writing the stop before the start is the same instinct as rehearsing a kill switch.",
        },
      ],
    },
  },
  {
    slug: "capstone",
    title: "Capstone: operate a bounded workflow",
    minutes: 40,
    type: "project",
    body: {
      summary: "Three scenarios, three logs, and a handover another person could follow.",
      xp: ATTESTED_XP,
      attested: true,
      blocks: [
        {
          kind: "text",
          body: "Run your weekly-update workflow through all three scenarios and keep a log of each: **complete** inputs, **conflicting** inputs, and **missing** inputs. You're demonstrating that it produces a verified draft in the first case and stops usefully in the other two.",
        },
        {
          kind: "text",
          body: "Then write the handover guide, which is the real deliverable. It covers the inputs and where they come from, what access the workflow has, the review checks a person should run, the stop conditions, how to recover from a blocked run, and how to disable any schedule. Write it for someone who has never seen your setup, because in six months that's you.",
        },
        {
          kind: "callout",
          body: "**Do it now, in your own account.** Keep this evidence: the final workflow, the three run logs, the drafts you verified against their inputs, and the handover guide. Everything stays draft-only, and if you created a practice schedule, confirm in writing that you paused it.",
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
