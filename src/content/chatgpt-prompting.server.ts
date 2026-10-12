/**
 * Level 1 of the ChatGPT course: writing a request that comes back useful.
 *
 * Ten task specs merged into four lessons. The specs were good; the wrapper
 * around them repeated the level's guide, safety note and reference on all ten
 * pages, so roughly seven tenths of what a learner read was the page before it.
 */
import type { AuthoredLesson } from "./authored-lesson";
import { ATTESTED_XP } from "./gamification";

const REFERENCE = "ChatGPT · https://learn.chatgpt.com/";

export const chatgptPromptingLessons: AuthoredLesson[] = [
  {
    slug: "anatomy",
    title: "Naming the outcome, the reader, and the shape",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Three things a request needs before the answer can be useful.",
      xp: 120,
      blocks: [
        {
          kind: "text",
          body: "\"Help me study\" gets you something. It's just not something you can use, because nothing in that request says what subject, how long you have, or what you're studying *for*. ChatGPT filled those in with the most average possible answers, and an average answer to an unasked question is what a vague prompt buys.",
        },
        {
          kind: "text",
          body: "Three things fix most of it. **The outcome** is what you want to end up holding: a plan, a table, an explanation, a draft. **The reader** is who has to understand it, which is often you but is frequently someone else. **The shape** is how long, what format, what to leave out.",
        },
        {
          kind: "code",
          language: "text",
          caption: "The same request, unusable then usable",
          code: `Vague:
  Help me study.

Specific:
  I have four evenings before a driving theory test.
  I've read the handbook once and keep failing the
  hazard-perception practice. Give me a plan for the four
  evenings, one focus per evening, with what to do if an
  evening gets cancelled.`,
        },
        {
          kind: "text",
          body: "**Naming the reader changes the content, not just the words.** Ask for an explanation of the same idea for a nine-year-old and for a colleague, and a good answer keeps the facts identical while changing which ones need unpacking. If only the vocabulary moves (the same explanation in shorter words), you've been given a rewrite rather than an explanation aimed at someone.",
        },
        {
          kind: "text",
          body: "**Asking for a table is a decision about checking.** A table forces one value per cell, which means you can see a gap. Ask for five errands as prose and a missing duration reads as a smooth sentence; ask for a table and the empty cell is obvious. Requiring estimates to be *labelled* as estimates does the same job. It separates what you told it from what it supplied.",
        },
        {
          kind: "callout",
          body: '**Practice.** Ask ChatGPT to explain a hobby you know well to a beginner in three steps, then correct one thing it got wrong from your own knowledge. Compare "help me study" with a version naming your subject, time and target, and write down two concrete differences in the answers. Get the same everyday concept explained for a child and for a colleague, and check the facts stayed consistent. Then give it five invented errands and ask for a table of task, duration and priority, with every guessed duration labelled as an estimate.',
        },
        {
          kind: "callout",
          body: "**Throughout this course, use invented names and situations.** Practise on a fictional book swap, not your actual client list. Nothing here needs real data to work, and a chat is not a private notebook.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            'You ask for an explanation "for a nine-year-old" and get the same explanation with simpler words. What\'s missing?',
          options: [
            "A shorter overall length",
            "A friendlier, more encouraging tone",
            "Examples drawn from children's interests",
            "A change in which facts need unpacking and which can be assumed",
          ],
          answer: 3,
          explanation:
            "Aiming at a reader changes the substance: a nine-year-old needs the thing an adult already knows spelled out, and doesn't need the caveat an adult would ask about. Simpler vocabulary alone is a rewrite of the same explanation.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "Why ask for five errands as a table rather than a paragraph, when you'll read both?",
          options: [
            "Tables are faster for ChatGPT to produce",
            "A paragraph can't hold five items clearly",
            "A table forces one value per cell, so a missing duration is visible instead of smoothed over",
            "Tables can be pasted into a spreadsheet later",
          ],
          answer: 2,
          explanation:
            "Prose hides gaps well. A sentence reads fine whether or not it contains the number you needed. The grid makes an absence structural, which is why the format is a checking decision rather than a styling one.",
        },
      ],
    },
  },
  {
    slug: "steer-and-revise",
    title: "Steering an answer: examples, limits, and specific feedback",
    minutes: 18,
    type: "practice",
    body: {
      summary:
        "Show the style you want, state the real constraints, and revise one thing at a time.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: 'Describing a tone is hard. Showing one is easy. Write two sentences in the voice you want and ask for something new that follows it. That carries the rhythm, the formality and the length all at once, and none of those survive being described as "friendly but professional".',
        },
        {
          kind: "text",
          body: "One caution: ask for a new item with *new facts*. A sample about the Tuesday meeting has a habit of donating its Tuesday meeting to whatever comes next, because it's hard to tell which parts of an example are the pattern and which are the content.",
        },
        {
          kind: "text",
          body: "**Constraints are only real if you can check them.** A weekend plan with a fixed budget, a location and a step-free access requirement gives you three things to test each suggestion against, and the test is the point, because a plan that quietly includes a venue with stairs looks exactly like one that doesn't. Run the checklist yourself rather than asking whether the constraints were met.",
        },
        {
          kind: "text",
          body: "**When your brief is thin, ask for questions before answers.** Give an incomplete event brief and require the two missing details that would most change the plan. You get the gaps named while they're cheap, instead of a confident plan built on invented assumptions that you then have to reverse-engineer.",
        },
        {
          kind: "text",
          body: '**Revise one specific thing.** "Make it better" produces a different answer, not a better one, and you lose whatever was already right. "The second step uses the term *hazard window* without explaining it, and the 20-minute estimate is unrealistic for a beginner" produces a fix you can compare against the original.',
        },
        {
          kind: "callout",
          body: "**Practice.** Write a two-sentence sample in your preferred tone and ask for a new reminder in that style with entirely new facts. Request a weekend plan with a fixed budget, a location and an accessibility requirement using fictional prices, then build a checklist and mark which suggestions pass. Give an incomplete event brief and require the two most important missing details before any draft. Then take an earlier answer, name one exact problem, ask for a focused revision, and compare the two.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "You give a style sample about Tuesday's meeting and ask for a reminder about Friday's deadline. The result mentions a meeting. What happened?",
          options: [
            "The example's content was copied along with its style, because nothing said which was which",
            "The style sample was too short to establish a pattern",
            "The request should have used a longer sample",
            "ChatGPT cannot separate tone from subject matter",
          ],
          answer: 0,
          explanation:
            "An example carries everything at once, and the boundary between pattern and content isn't marked. Saying the facts are new, or giving a sample from a clearly unrelated subject, is what draws that line.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Which revision request will actually improve the answer you have?",
          options: [
            '"Make this better and more professional"',
            '"Try again, I don\'t like it"',
            '"Rewrite this with more detail throughout"',
            "\"Step two uses 'hazard window' without explaining it, and 20 minutes is unrealistic for a beginner. Fix those two and leave the rest\"",
          ],
          answer: 3,
          explanation:
            "It names the defects and protects what was already right. The others ask for a different answer and you'll be comparing two drafts from scratch, having possibly lost the parts that worked.",
        },
      ],
    },
  },
  {
    slug: "facts-and-guesses",
    title: "Keeping unknowns unknown",
    minutes: 14,
    type: "practice",
    body: {
      summary: "The gap-filling habit, and the one instruction that stops it.",
      xp: 110,
      blocks: [
        {
          kind: "text",
          body: "Give ChatGPT an announcement with no date on it and ask for the details, and you will often get a date. Not because it's dishonest, but because you asked for a complete answer and a complete answer has a date in it. The most fluent output is the one with no holes.",
        },
        {
          kind: "text",
          body: "This is the single most expensive failure in everyday use, because an invented value is indistinguishable from a real one. You can't spot it by reading carefully. A fabricated date is written in exactly the same confident prose as a correct one.",
        },
        {
          kind: "code",
          language: "text",
          caption: "Making the gaps survive",
          code: `From the announcement below, list:
  - Facts stated in the text
  - Details a reader would expect but which are NOT stated

Do not infer anything that isn't written. If the date,
venue or price is missing, put it under "not stated"
rather than supplying a likely value.`,
        },
        {
          kind: "text",
          body: 'The instruction works because it gives the model somewhere to put the absence. Without a "not stated" bucket, the only available move is to produce a value; with one, reporting the gap is a valid, complete-looking answer. This is the same instinct as labelling estimates in a table, and you\'ll use it again in every level of this course.',
        },
        {
          kind: "callout",
          body: "**Practice.** Write a short fictional announcement and deliberately leave out the date. Ask for an extraction that separates stated facts from unknowns, and confirm the missing date comes back as unknown rather than as a plausible Saturday. Then try it once without the instruction and compare.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "Why is an invented detail more dangerous than an obviously wrong one?",
          options: [
            "It appears in the same confident prose as a correct one, so reading carefully won't catch it",
            "It's harder to correct once it has been written down",
            "It tends to appear in longer answers where it's easy to miss",
            "It usually concerns dates, which people rarely check",
          ],
          answer: 0,
          explanation:
            "Fluency is uniform: nothing about the writing marks the fabricated value. That's why the defence is structural (asking for unknowns to be listed) rather than a matter of reading more attentively.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            'What makes "list anything not stated" work better than "don\'t make things up"?',
          options: [
            "It's shorter and therefore easier to follow",
            "It applies to dates specifically rather than all content",
            "It forces a structured output format",
            "It gives the absence somewhere to go, so reporting a gap is a complete answer rather than a failure",
          ],
          answer: 3,
          explanation:
            '"Don\'t make things up" is a prohibition with no alternative behaviour attached, and the pressure toward a complete-looking answer remains. A named bucket for unknowns makes the honest output the well-formed one.',
        },
      ],
    },
  },
  {
    slug: "capstone",
    title: "Capstone: build a prompt recipe",
    minutes: 25,
    type: "project",
    body: {
      summary: "Turn one good prompt into a template that works on a second subject.",
      xp: ATTESTED_XP,
      attested: true,
      blocks: [
        {
          kind: "text",
          body: "Write a reusable study-planning prompt with slots for the subject, your starting knowledge, the time available and what success looks like. It should carry everything from this level: a named outcome, a named reader, a shape you can check, constraints that are testable, and an instruction that keeps unknowns unknown.",
        },
        {
          kind: "text",
          body: "Then the test that makes it a template rather than a lucky prompt: **run it on a second, quite different subject.** The instruction that only worked for the first one will reveal itself. Usually it's a step that assumed a textbook exists, or a practice test, or that the subject can be split into evenings at all. Fix that instruction and note what you changed.",
        },
        {
          kind: "callout",
          body: "**Do it now, in your own account.** Keep this evidence: the final template with its slots marked, both trial outputs, and one sentence on the instruction you had to generalise and why. Nothing here is graded by us. The second subject is the grader.",
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
