/**
 * Level 1 of the Claude course, authored as lessons rather than generated from
 * task specs.
 *
 * The generated form gave each of twenty tasks the same level guide, the same
 * safety paragraph and the same reference link, so roughly three quarters of
 * what a learner read on any one page was identical to the page before it, and
 * the unique part was a single sentence naming the task. Twenty pages of that
 * is a checklist wearing a course's clothes. These six lessons carry the same
 * twenty missions — as practice inside the lesson that teaches them, which is
 * what they always were — and ask real questions about the judgement calls.
 *
 * Server-only, like every other file holding an answer key.
 */
import type { AuthoredLesson } from "./authored-lesson";
import { ATTESTED_XP } from "./gamification";

export const claudePromptingLessons: AuthoredLesson[] = [
  {
    slug: "anatomy",
    title: "Anatomy of a useful prompt",
    minutes: 18,
    type: "practice",
    body: {
      summary: "The three parts every working prompt has, and what each one is for.",
      xp: 120,
      blocks: [
        {
          kind: "text",
          body: "The difference between a prompt that works and one that doesn't is almost never politeness or length. It's whether the prompt contains the things Claude has no way to infer: who the answer is for, what situation it has to survive, and what shape it needs to be in before you can use it.",
        },
        {
          kind: "text",
          body: "A working prompt has three parts. **The request** is what you want done, stated with a verb: explain, draft, compare, list, rewrite. **The context** is what Claude cannot guess: your audience, your constraints, what you already tried. **The shape** is what a good answer looks like: its format, its length, the level it's pitched at.",
        },
        {
          kind: "code",
          language: "text",
          caption: "The same question, missing its context and shape, then carrying both",
          code: `Weak:
  Explain database indexes.

Strong:
  Explain database indexes to a junior developer on my team who
  writes SQL daily but has never tuned a slow query. We're on
  Postgres. Six bullets, no code samples. I want them to
  understand when an index helps before they start adding any.`,
        },
        {
          kind: "text",
          body: "Notice what the strong version did not do: it didn't say \"please\", it didn't say \"you are an expert\", and it isn't longer for the sake of being longer. Every clause it added removes a guess Claude would otherwise have had to make about the reader's level, the database, and whether code would help or distract.",
        },
        {
          kind: "text",
          body: "**Format is not decoration.** Asking for a checklist, a table or three bullets changes what you can *do* with the answer, not just how it looks. A table invites comparison, so ask for one when you're choosing between options. A checklist invites action, so ask for one when the next step matters more than the reasoning. Prose is right when the reasoning *is* the point.",
        },
        {
          kind: "text",
          body: '**Constraints work when they remove work.** "No code samples", "assume I know SQL", "under 200 words" each cut something out, so each one changes the answer. Constraints that only sound demanding ("be concise but thorough and highly detailed") pull in opposite directions and cancel, leaving Claude to pick for you.',
        },
        {
          kind: "callout",
          body: "**Practice.** Ask Claude to explain one topic you genuinely want to understand, then add why you need it and watch the answer move. Take a vague question of your own and add the audience, situation and background. Ask for one answer as a checklist, a short table and three bullets, then decide which you'd actually use. Finally, constrain length, reading level and scope at once without the constraints fighting each other.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            'You ask: "How should we handle errors in our API?" The answer is reasonable but generic. Which addition would change it most?',
          options: [
            "Adding that it's a public API used by third parties who can't be asked to redeploy",
            {
              text: 'Adding "please be thorough and detailed"',
              whyNot:
                "Asking for thoroughness gets you more of the same generic advice. It doesn't tell Claude anything about your situation it was guessing at.",
            },
            {
              text: 'Adding "You are a senior backend engineer"',
              whyNot:
                "A role raises the confidence of the writing, but Claude still doesn't know who uses the API or what they can change. The guesses stay the same.",
            },
            {
              text: "Asking the same question again in a new conversation",
              whyNot:
                "A fresh conversation rolls the dice again with the same missing context. The answer was generic because of what the question left out.",
            },
          ],
          answer: 0,
          explanation:
            "That one fact rules out whole categories of answer. You now need stable error codes and backward compatibility, not just try/catch advice. The other three leave Claude guessing at exactly the same things it was guessing at before.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Which of these sets of constraints will actually shape the answer?",
          options: [
            '"Under 200 words, no code, assume I already know what a foreign key is"',
            {
              text: '"Be concise, but comprehensive, and cover everything important"',
              whyNot:
                "Concise and comprehensive pull in opposite directions, so Claude has to pick the balance for you. Nothing here rules anything out.",
            },
            {
              text: '"Write professionally and make it high quality"',
              whyNot:
                '"Professional" and "high quality" name a bar without saying what would meet it. Each clause should remove something specific.',
            },
            {
              text: '"Be as detailed as possible while keeping it brief"',
              whyNot:
                "This asks for two opposite things at once. A constraint only shapes the answer when it can't be satisfied both ways.",
            },
          ],
          answer: 0,
          explanation:
            "Each clause removes something specific: a length ceiling, a whole content type, and a level of explanation you don't need. The other three either contradict themselves or name a quality bar without saying what would meet it, so Claude ends up choosing on your behalf.",
        },
      ],
    },
  },
  {
    slug: "show-dont-tell",
    title: "Show, don't tell: examples and roles",
    minutes: 14,
    type: "practice",
    body: {
      summary:
        "When one example beats a paragraph of instructions, and when a role earns its place.",
      xp: 110,
      blocks: [
        {
          kind: "text",
          body: "Some things are far easier to show than to describe. Try writing instructions precise enough to reproduce your team's commit message style (the capitalisation, how long the first line runs, whether the body explains what or why) and you'll end up with a paragraph that still misses. One real example carries all of it at once.",
        },
        {
          kind: "code",
          language: "text",
          caption: "One example does the work of a style guide",
          code: `Here's a commit message in our house style:

  Stop the nightly export retrying forever

  The retry loop had no ceiling, so a malformed row kept it
  running until the next run overlapped it.

Write one in the same style for: fixed a crash when the
uploaded CSV has no header row.`,
        },
        {
          kind: "text",
          body: "This is worth reaching for whenever the thing you want is a *pattern*: a tone, a structure, a level of detail. Give one example, not six: a single clear case sets the pattern, while a pile of them tends to get averaged, and any accidental feature they happen to share gets copied along with the ones you meant.",
        },
        {
          kind: "text",
          body: '**Roles are the same idea aimed at judgement.** "You are a skeptical editor" is useful because a skeptical editor *disagrees with you*. It changes which things get flagged. "You are a world-class expert" changes vocabulary and confidence, not judgement, so the answer sounds more authoritative while containing the same content. If you can\'t say what the role would push back on, it isn\'t doing anything.',
        },
        {
          kind: "text",
          body: 'The useful test is to name the viewpoint *and* the audience: "Answer as a patient tutor explaining to someone who has never programmed" tells Claude both where the advice comes from and who has to understand it.',
        },
        {
          kind: "callout",
          body: "**Practice.** Give Claude a small example of a style or structure you use (a commit message, a bug report, a standup update) and ask for a new one that follows it. Then pick a role that adds a genuine viewpoint, such as patient tutor or skeptical editor, state the audience too, and check whether the advice actually changed or only the vocabulary did.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "You want bug reports in your team's format. What does one real example give you that a written description usually doesn't?",
          options: [
            {
              text: "It makes the answer shorter",
              whyNot:
                "An example says nothing about length; a long report format makes long answers. Its value is in what it conveys about the format.",
            },
            {
              text: "It stops Claude from asking clarifying questions",
              whyNot:
                "Clarifying questions can still come, and are sometimes useful. Think about what a real report shows that a description leaves out.",
            },
            "It carries the details you'd never think to write down: ordering, tone, how much detail each section gets",
            {
              text: "It guarantees the format is followed exactly every time",
              whyNot:
                "An example is a strong signal, not a guarantee. You still read the result, because a format can drift even with a good sample.",
            },
          ],
          answer: 2,
          explanation:
            "Most of a format lives in decisions nobody writes down. An example transmits all of them at once. It's a strong signal rather than a guarantee, which is why you still read the result.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Which role is actually doing work in the prompt?",
          options: [
            {
              text: '"You are a world-class expert in software engineering"',
              whyNot:
                '"World-class" raises the confidence of the writing without changing what the answer looks for. There\'s nothing at stake in this role.',
            },
            {
              text: '"You are a highly intelligent and capable assistant"',
              whyNot:
                "Telling Claude it's capable doesn't change what it pays attention to. A role does work when it brings something to protect.",
            },
            {
              text: '"You are a professional with years of experience"',
              whyNot:
                "Years of experience is a credential, not a concern. It doesn't change what the answer would flag or worry about.",
            },
            '"You are the engineer who will be on call for this at 3am"',
          ],
          answer: 3,
          explanation:
            "That role has something to protect, so it changes what gets flagged: missing alerts, unclear logs, anything you can't debug half-asleep. The others raise the confidence of the writing without changing what the answer looks for.",
        },
      ],
    },
  },
  {
    slug: "iterate",
    title: "Iterate: clarify, decompose, compare",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Treat the first answer as a draft, and learn what it had to guess.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "The first answer is a draft. That isn't a failure. You gave an incomplete brief, and Claude filled the gaps to produce something. The skill is reading the result for **what it had to guess**, because every guess marks a piece of context you didn't supply.",
        },
        {
          kind: "text",
          body: 'The diagnostic move is to ask directly: *"What did you assume about my situation to answer that?"* The list that comes back is your missing context, itemised. Put the two or three that matter into the prompt and ask again.',
        },
        {
          kind: "text",
          body: "**Make it ask first.** For anything underspecified, require questions before the answer: \"Ask me up to three questions before you start.\" This inverts the failure mode. Instead of a confident answer built on wrong assumptions, you get the assumptions surfaced while they're still cheap to fix. It's most valuable exactly when you're least sure what you want.",
        },
        {
          kind: "code",
          language: "text",
          caption: "Two ways to open an underspecified request",
          code: `Guessing:
  Write a migration plan for moving our app off Heroku.

Asking:
  I want a migration plan for moving our app off Heroku.
  Before you write it, ask me up to three questions whose
  answers would most change the plan.`,
        },
        {
          kind: "text",
          body: "**Break down what feels too big.** An intimidating goal usually hides an unclear first step. Ask for a sequence of steps where the first one is small enough to start now. A plan you can begin in fifteen minutes is worth more than a complete one you postpone.",
        },
        {
          kind: "text",
          body: "**Compare fairly.** When you test two versions of a prompt, change exactly one thing (the context, the format, or the constraint) and keep everything else identical. Change two and you learn that something helped without learning what, which is the same as learning nothing.",
        },
        {
          kind: "callout",
          body: "**Practice.** Give Claude an underspecified task and require up to three questions before it answers. Turn a goal that intimidates you into numbered steps with a first action you can do in fifteen minutes. Run a vague prompt, ask what it assumed, then rewrite to remove those guesses. Finally, change one variable in a prompt and compare the two outputs.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "An answer is plausible but not quite right, and you can't say why. What's the most useful next move?",
          options: [
            {
              text: "Ask the same question again and hope for a better roll",
              whyNot:
                "Rerolling changes the wording but not the missing context, so you're likely to get the same gap phrased differently.",
            },
            {
              text: 'Add "be more accurate" to the prompt',
              whyNot:
                "\"Be more accurate\" doesn't tell Claude what it got wrong. It can't fix a gap in the brief that nobody has named.",
            },
            {
              text: "Rewrite the prompt from scratch with more detail everywhere",
              whyNot:
                "Adding detail everywhere is expensive guesswork. You could find out exactly which detail was missing first.",
            },
            "Ask what it assumed about your situation in order to answer",
          ],
          answer: 3,
          explanation:
            "The assumptions are the gaps in your brief, listed for you. Rerolling changes the wording but not the missing context, and adding detail everywhere is expensive guesswork when you could be told exactly which detail was missing.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "You change a prompt's role *and* its output format at once, and the answer improves. What have you learned?",
          options: [
            "That something helped, but not which change was responsible",
            {
              text: "That the role change worked",
              whyNot:
                "You changed two things, so you can't credit either one. The role change might even have hurt while the format change made up for it.",
            },
            {
              text: "That the format change worked",
              whyNot:
                "Two changes, one result: the format may have helped, or may have done nothing while the role did the work. You can't tell which.",
            },
            {
              text: "That both changes helped",
              whyNot:
                "Both may have helped, or one may have hurt while the other more than made up for it. One result can't separate two changes.",
            },
          ],
          answer: 0,
          explanation:
            "Two variables, one result: the improvement can't be attributed, and either change might even have hurt while the other more than made up for it. Change one thing at a time when you're trying to learn something that will transfer.",
        },
      ],
    },
  },
  {
    slug: "apply",
    title: "Apply it: summarize, rewrite, extract",
    minutes: 20,
    type: "practice",
    body: {
      summary: "The jobs you'll actually use Claude for, and the failure each one has.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "Four jobs make up most day-to-day use: summarising, rewriting for a different reader, pulling structured data out of prose, and generating options. Each has a characteristic way of going wrong, and each is fixed by asking for something more specific than the job's name.",
        },
        {
          kind: "text",
          body: '**Summarising loses decisions.** "Summarise this thread" averages everything: a settled decision and an offhand aside come out weighted the same, and the one line you needed (who agreed to what) dissolves into the general sense of the discussion. Ask for the parts instead: the decisions, the actions and their owners, and the questions still open.',
        },
        {
          kind: "code",
          language: "text",
          caption: "Asking for the structure you actually need",
          code: `Instead of:
  Summarise this meeting transcript.

Ask for:
  From this transcript, list:
  1. Decisions made (and by whom)
  2. Action items with owners and dates
  3. Questions raised but not answered
  Mark anything you're unsure about as "unclear" rather
  than guessing.`,
        },
        {
          kind: "text",
          body: "**Rewriting drifts.** A message rewritten for a busy manager and the same message rewritten for a new starter should differ in what they *include*, not just in vocabulary. The manager's version can drop the explanation and keep the ask; the new starter's needs the reverse. If both versions say the same things in different words, the rewrite hasn't happened yet.",
        },
        {
          kind: "text",
          body: "**Extraction invents.** When a field is missing from the source, the most fluent thing to do is produce something plausible. Head it off by naming the fields you want *and* saying what to do when one isn't there: leave it null, or mark it \"not stated\". Without that instruction you can't tell a real value from a confident guess.",
        },
        {
          kind: "text",
          body: '**Brainstorming converges.** Ask for ten ideas and the first three will be the obvious ones. Push past them explicitly: ask what a competitor with half the budget would do, or what you\'d try if the obvious option were banned. For critique, ask for the strongest objection rather than "feedback". Feedback comes back agreeable, while an objection has to argue.',
        },
        {
          kind: "callout",
          body: "**Practice.** Take a short non-sensitive passage and ask for decisions, actions, owners and open questions. Rewrite one message for a busy manager and a new learner, then check what each version dropped. Extract structured fields from prose with an explicit rule for missing values. Ask for options beyond the obvious, and invite the strongest objection to a plan you actually hold.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: 'Why does "summarise this thread" so often lose the thing you needed?',
          options: [
            {
              text: "Summaries are always too short to be useful",
              whyNot:
                "A summary can be any length you ask for. Length isn't what drops the decision; how the summary weighs each line is.",
            },
            {
              text: "Claude can't read long threads accurately",
              whyNot:
                "Reading the thread isn't the problem. The request never said which parts matter more than others.",
            },
            {
              text: "Threads contain too much irrelevant conversation",
              whyNot:
                "Irrelevant chatter is exactly what a summary is meant to cut. The trouble is that nothing marks the decisions as more important than the chatter.",
            },
            "A summary weights everything evenly, so a decision reads like any other line",
          ],
          answer: 3,
          explanation:
            'Nothing in the word "summary" says decisions matter more than pleasantries, so they get flattened together. Naming the parts you want (decisions, owners, open questions) is what preserves them.',
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "You're extracting contact details from messy notes. Some records have no phone number. What should the prompt say?",
          options: [
            {
              text: "Nothing, because Claude will leave it blank if it isn't there",
              whyNot:
                "Left unsaid, the pressure is toward a complete-looking record, which can mean a plausible invented number rather than a blank.",
            },
            '"If a field isn\'t stated in the source, write null rather than inferring it"',
            {
              text: '"Be accurate and don\'t make anything up"',
              whyNot:
                "A general plea for accuracy doesn't say what to do when a field is missing, so it doesn't define the behaviour you want.",
            },
            {
              text: '"Only extract records that have every field"',
              whyNot:
                "This quietly throws away real records you wanted, just because one field is empty. A gap should come back as a gap.",
            },
          ],
          answer: 1,
          explanation:
            "It gives the model something specific to do when a field is missing, so a gap comes back as a gap. A general accuracy plea doesn't define the behaviour, and dropping incomplete records quietly loses real data you wanted.",
        },
        {
          kind: "mcq",
          id: "q3",
          question: "You want a genuine critique of your plan. Which prompt gets you one?",
          options: [
            {
              text: '"What do you think of this plan?"',
              whyNot:
                "An open invitation tends to return agreeable commentary. Nothing in it asks Claude to work against the plan.",
            },
            {
              text: '"Give me feedback on this plan"',
              whyNot:
                '"Feedback" is usually answered with balanced, encouraging notes that confirm what you already decided.',
            },
            {
              text: '"Is this plan good?"',
              whyNot:
                "A yes/no question invites a yes with caveats. A real critique has to be asked for as an argument that can be built and checked.",
            },
            '"What\'s the strongest argument that this plan fails, and what would have to be true for it to hold?"',
          ],
          answer: 3,
          explanation:
            'It asks for an argument, which has to be built and can be evaluated. Open invitations for "feedback" or "thoughts" tend to return agreeable commentary that confirms what you already decided.',
        },
      ],
    },
  },
  {
    slug: "verify",
    title: "Verify and protect what you send",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Fluency isn't accuracy. Check the claims that matter, and redact before you paste.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "A wrong answer arrives in the same confident prose as a right one. There's no tell in the writing, so \"it sounded sure\" carries no information and reading more carefully doesn't help. What helps is deciding, before you read, which claims would actually change what you do.",
        },
        {
          kind: "text",
          body: "**Check by consequence, not by doubt.** Most claims in an answer don't matter: if a date is off by a year in a paragraph of background, nothing downstream changes. Find the one or two load-bearing claims (the ones your decision rests on) and verify those against a source that isn't Claude. A plan that checks everything gets abandoned; a plan that checks two things gets done.",
        },
        {
          kind: "text",
          body: "**Make the assumptions visible.** Ask Claude to mark which parts of its answer are established facts, which are inferences from what you told it, and which are assumptions it made to fill a gap. The third category is where errors live, and it's the category you can fix for free by supplying the missing context.",
        },
        {
          kind: "text",
          body: "**Redact before you paste, not after.** Once text is sent it's sent. Replace sensitive details with realistic placeholders, and keep them *consistent*, so the answer still makes sense coming back: the same customer as `CUSTOMER_A` throughout, not deleted. Deleting details makes the answer generic; consistent placeholders keep the structure intact while the real values stay with you.",
        },
        {
          kind: "code",
          language: "text",
          caption: "Redacted, but still answerable",
          code: `Original:
  Priya Raman at Northwind lost £8,400 when the March
  invoice run double-charged her.

Redacted:
  CUSTOMER_A at ACCOUNT_1 lost AMOUNT_1 when the March
  invoice run double-charged them.

The shape of the problem survives; the identity doesn't.`,
        },
        {
          kind: "callout",
          body: "**Safety.** Passwords, API keys, customer records, health information and anything under NDA don't go into a chat, on any provider. Work in a practice space with invented data while you're learning. Realistic placeholders behave the same way and cost you nothing if you get it wrong.",
        },
        {
          kind: "text",
          body: "**Keep what worked.** When a prompt earns its keep, save it with the variable parts marked (`[audience]`, `[format]`, `[constraint]`) and you've turned one good result into a tool you reuse. This is the ancestor of the skills you'll write in Level 5.",
        },
        {
          kind: "callout",
          body: "**Practice.** Build a check plan for an answer you'd actually act on: name the claims that would change your decision and how you'd verify each. Ask Claude to separate facts from assumptions in something it just told you. Redact a real passage with consistent placeholders. Then turn your best prompt so far into a reusable template.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Claude gives you a migration plan with eight factual claims. You have time to check two. Which two?",
          options: [
            {
              text: "The two that appear earliest, since later steps depend on them",
              whyNot:
                "Position in the plan doesn't measure risk. A claim near the end can be the one everything hinges on.",
            },
            "The two the plan would fail on if they were wrong",
            {
              text: "The two you personally find most surprising",
              whyNot:
                "Surprise reflects what you already know, not what it would cost to be wrong. An unsurprising error can still sink the plan.",
            },
            {
              text: "Any two, because checking a sample tells you the overall reliability",
              whyNot:
                "An answer isn't uniformly reliable, so two random checks say little about the other six. Spend the checks where an error would hurt.",
            },
          ],
          answer: 1,
          explanation:
            "Verification budget goes where being wrong costs something. Surprise tracks your existing knowledge rather than risk, and an answer isn't uniformly reliable, so spot-checking two claims says nothing about the other six.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "You need help with a bug in code that contains a live API key and a customer's email. What do you do?",
          options: [
            {
              text: "Paste it as-is, because the conversation is private to your account",
              whyNot:
                "Private to your account isn't the same as never leaving your machine. A live key shouldn't go anywhere it doesn't need to.",
            },
            {
              text: "Delete the key and the email entirely, leaving gaps",
              whyNot:
                "Leaving gaps often changes the very behaviour you're asking about, so the bug may disappear from the snippet.",
            },
            {
              text: "Describe the code in words instead of pasting any of it",
              whyNot:
                "A prose description throws away the exact detail that usually holds the bug. Claude needs the code, just not the real secrets.",
            },
            "Replace the key and email with realistic fake values, keeping them consistent through the snippet",
          ],
          answer: 3,
          explanation:
            "Consistent placeholders keep the code runnable and the bug diagnosable while the real secret never leaves your machine. Leaving gaps often changes the behaviour you're asking about, and a prose description throws away the detail that usually holds the bug.",
        },
      ],
    },
  },
  {
    slug: "capstone",
    title: "Capstone: make a daily brief",
    minutes: 25,
    type: "project",
    body: {
      summary:
        "Build one reusable prompt that turns your own raw inputs into a brief you'd act on.",
      xp: ATTESTED_XP,
      attested: true,
      blocks: [
        {
          kind: "text",
          body: "Put the whole level together into one prompt you'll keep. The job: turn a pile of raw input you actually have (notes, a message thread, a task list, a changelog) into a short daily brief you would genuinely act on.",
        },
        {
          kind: "text",
          body: "It should carry every part you've practised. A stated **request** and **audience** (you, at the start of your day). **Context** Claude can't guess: what you're responsible for, what a normal day contains, what you can safely ignore. A **shape** that makes it usable in thirty seconds. **Constraints** that remove work. An **example** of one good brief, so the pattern is shown rather than described. A rule for **missing or uncertain** information, so gaps come back as gaps. And placeholders in place of anything you wouldn't want to send.",
        },
        {
          kind: "callout",
          body: "**Do it now, in your own tools.** Run it on three different days' worth of real input. Keep this evidence: the template with its variable parts marked, the three briefs it produced, and one note on what you changed after the first run and why. Nothing here is marked by us. This one is yours, and it's the prompt you'll still be using in Level 2.",
        },
        {
          kind: "code",
          language: "text",
          caption: "Official reference",
          code: "Claude prompting guide · https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview",
        },
      ],
    },
  },
];
