/**
 * Level 2 of the ChatGPT course: working briefs and carrying decisions forward.
 *
 * Ten task specs merged into four lessons.
 */
import type { AuthoredLesson } from "./authored-lesson";
import { ATTESTED_XP } from "./gamification";

const REFERENCE =
  "Get started with ChatGPT Work · https://learn.chatgpt.com/docs/get-started-with-work";

export const chatgptContextLessons: AuthoredLesson[] = [
  {
    slug: "working-brief",
    title: "The working brief",
    minutes: 18,
    type: "practice",
    body: {
      summary: "One page that makes every conversation about a project start correctly.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "Once a piece of work outlives a single conversation, re-explaining it becomes the job. A **working brief** is the fix: one page holding the goal, the audience, the fixed constraints, and what's still undecided. You write it once and paste it into whatever chat needs it.",
        },
        {
          kind: "text",
          body: 'The "still undecided" section is the one people leave out and the one that does the most work. Without it, open questions get quietly answered somewhere in a conversation and become facts nobody agreed to.',
        },
        {
          kind: "text",
          body: "**Before using a brief, make it restate the brief.** Ask for it back in its own words and read what came out. A restatement that promotes a maybe into a decision, or drops the constraint you care about, has just told you something for free, and it's much cheaper to catch there than three drafts later.",
        },
        {
          kind: "text",
          body: "**Label your source material.** When you paste two sets of notes, give each a title and a date, and ask for a summary that names which note each claim came from. Unlabelled material blends into one undifferentiated pile, and you lose the ability to ask the only question that matters when something looks wrong: which of these did that come from?",
        },
        {
          kind: "callout",
          body: "**What your account actually has varies.** Some interfaces offer projects or saved instructions that hold a brief for you; others don't. Start by checking what yours has, and pick a plain-text fallback for anything missing. A note on your machine you paste in works everywhere and is what the rest of this level assumes.",
        },
        {
          kind: "callout",
          body: "**Practice.** List which capabilities your account actually gives you (plain chat, files, research, projects) and name a text-only fallback for each gap. Invent a neighbourhood book swap and write its goal, audience, fixed constraints and open questions, then have ChatGPT restate it and correct whatever it got wrong. Then supply two fictional notes with titles and dates and ask for a combined summary that attributes every claim to one of them.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "Why ask ChatGPT to restate a brief before you start working from it?",
          options: [
            "A misreading shows up now, in one paragraph, instead of three drafts later",
            {
              text: "It confirms the whole brief was received without truncation",
              whyNot:
                "A brief can arrive whole and still be misread. The restatement tests understanding, not delivery: a maybe handed back as a decision is the thing to look for.",
            },
            {
              text: "It warms up the conversation with the relevant context",
              whyNot:
                "Pasting the brief already puts it in the conversation. The restatement earns its place by what reading it back tells you, not by priming anything.",
            },
            {
              text: "It produces a shorter version you can reuse",
              whyNot:
                "A shorter copy isn't the goal; you already have the brief. What you're reading the restatement for is where it differs from what you meant.",
            },
          ],
          answer: 0,
          explanation:
            "The restatement is a cheap test of a shared understanding. The characteristic failure it catches is an open question being handed back as a settled decision, which is invisible once work is built on top of it.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "What do you lose by pasting two sets of notes without titles or dates?",
          options: [
            {
              text: "Nothing, provided both sets are accurate",
              whyNot:
                "Accuracy isn't the issue. When a claim in the summary looks wrong, the question is which note it came from, and unlabelled notes can't answer that.",
            },
            "The ability to trace a suspicious claim back to which note it came from",
            {
              text: "The chance to use them in a future conversation",
              whyNot:
                "Labels don't decide whether notes can be reused. They decide whether a claim in the summary can be traced back when you doubt it.",
            },
            {
              text: "Accuracy, because unlabelled text is processed less carefully",
              whyNot:
                "Unlabelled text isn't read less carefully. It's blended, so you lose track of where each claim came from.",
            },
          ],
          answer: 1,
          explanation:
            "Attribution is what makes a summary checkable. Without it a wrong claim is just wrong somewhere, and your only recourse is re-reading both sources yourself, which is the work you were trying to avoid.",
        },
      ],
    },
  },
  {
    slug: "conflicts-and-preferences",
    title: "Conflicts, preferences, and what to leave out",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Handle sources that disagree, state how you want answers, and cut the rest.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "Real source material contradicts itself. An old note says the event starts at 2pm; a later correction says 3pm. The wrong behaviour is to pick one silently. And picking the *newer* one is still picking silently, even though it's usually right.",
        },
        {
          kind: "text",
          body: 'What you want is the conflict surfaced: *"These two sources disagree on the start time. The 3pm note is dated later and describes itself as a correction. Which should I use?"* Then you approve one, and the approved value is what gets used from then on. The rule generalises: **when sources disagree, report and ask; don\'t resolve by rule of thumb.**',
        },
        {
          kind: "text",
          body: "**Working preferences** are the standing instructions that save you repeating yourself: short paragraphs, metric units, explicit unknowns, no summary at the end. Write three, then test them across two different requests on the same brief. Preferences drift, especially in long conversations, and the only way to know whether yours survived is to check rather than assume.",
        },
        {
          kind: "text",
          body: "**Then cut the brief down.** Add some unrelated background, see how the answers change, and remove it again. The exercise teaches something durable: most of what feels like helpful context is noise that dilutes the parts that matter. Keep a fact only if you can say what it would change. That's the test, and it eliminates more than you'd expect.",
        },
        {
          kind: "callout",
          body: "**Practice.** Create an older note saying 2pm and a newer correction saying 3pm, and confirm the conflict is reported rather than silently resolved, then approve one and check the approved time is what gets used. Write three working preferences and test them across two requests, marking which were followed. Then pad your brief with unrelated background, compare the answers, and strip it back, giving a reason for every fact you kept.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            'Two of your notes give different start times. Why isn\'t "use the newer one" the right default behaviour?',
          options: [
            {
              text: "Newer notes are often less carefully written",
              whyNot:
                "Newer notes aren't sloppier as a rule. The point isn't which note is better written; it's who gets to decide when they disagree.",
            },
            {
              text: "Dates in pasted notes are unreliable",
              whyNot:
                "The dates may be perfectly accurate and the rule still fail: a later note can be the mistaken one. The problem is resolving it without telling you.",
            },
            {
              text: "It would require reading both notes fully",
              whyNot:
                "Reading both notes is cheap. The cost of the rule is hidden: you never learn there was a disagreement to settle.",
            },
            "It resolves the conflict without telling you one existed, and you may know something the dates don't",
          ],
          answer: 3,
          explanation:
            "The heuristic is usually right, which is exactly what makes it dangerous. It works until the newer note is the mistaken one. Surfacing the conflict costs one question and keeps the decision with the person who knows the situation.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "What's the test for whether a fact belongs in your brief?",
          options: [
            {
              text: "Whether it's true and relevant to the project",
              whyNot:
                "Almost everything about a project is true and relevant, which is how briefs bloat. The test needs to be harder than that.",
            },
            {
              text: "Whether it fits within a single page",
              whyNot:
                "A page limit forces cutting but says nothing about what to cut. A fact can fit easily and still be noise.",
            },
            "Whether you can say what the answer would lose without it",
            {
              text: "Whether it was mentioned in the original source material",
              whyNot:
                "Where a fact came from doesn't decide whether it earns its place. Plenty of source material is background that changes nothing.",
            },
          ],
          answer: 2,
          explanation:
            '"True and relevant" admits almost everything, which is how briefs bloat. Requiring a named consequence is a much harder test, and the facts that fail it were diluting the ones that didn\'t.',
        },
      ],
    },
  },
  {
    slug: "decisions-and-handoff",
    title: "Source-bound answers, decision logs, and handoff",
    minutes: 18,
    type: "practice",
    body: {
      summary: "Bind answers to your material, record what was settled, and start fresh safely.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "When you supply a document and ask a question it doesn't cover, there are two possible answers: what the document says, and what venues generally do. The second is often useful and is never what you asked for. **Bind the answer to the source**: if the policy doesn't state it, the answer is \"not stated\", optionally followed by general advice, clearly marked as such.",
        },
        {
          kind: "text",
          body: "Test this deliberately. Supply a fictional venue policy, ask something it can't answer, and see whether you get the honest gap or plausible general guidance in the voice of your document. It's a two-minute experiment that tells you how much to trust every other answer about that document.",
        },
        {
          kind: "text",
          body: "**A decision log is the brief's other half.** The brief says where you're going; the log says what's been settled on the way. Four columns: the decision, the reason, the date, and what's still open. Then audit it. The failure mode is a suggestion from a conversation appearing as an approved decision. You wrote \"we could do evenings\"; the log says \"evenings confirmed\".",
        },
        {
          kind: "text",
          body: "**Handoff is the payoff.** Open a brand-new conversation with nothing but the brief and the log, and ask for the next three actions. If they're consistent with your recorded decisions and assume nothing you didn't write down, the pair is doing its job. If the answer needs something you never wrote, you just found the gap, and you found it in a new chat rather than in a month when you'd forgotten the context entirely.",
        },
        {
          kind: "callout",
          body: '**Practice.** Supply a fictional venue policy and ask a question it cannot answer, requiring an explicit "not stated" instead of general advice. Turn a practice conversation into a decision log with decision, reason, date and open question, then check nothing was promoted from suggestion to decision. Finally, start a fresh chat with only the brief and the log, ask for the next three actions, and confirm none of them assumes context you never supplied.',
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "You ask a question your supplied policy doesn't address and get confident general advice. Why is that a problem?",
          options: [
            "It reads as coming from your document, so a general claim becomes an apparent fact about your venue",
            {
              text: "The advice is likely to be inaccurate",
              whyNot:
                "The general advice may be perfectly sound. The trouble is where it seems to come from, not whether it's right.",
            },
            {
              text: "It makes the answer longer than necessary",
              whyNot:
                "Length is a minor cost. The real one is that you can no longer tell which parts of the answer your document actually says.",
            },
            {
              text: "It means the document wasn't read properly",
              whyNot:
                "The document may have been read perfectly. It simply doesn't cover the question, and the answer filled the gap without saying so.",
            },
          ],
          answer: 0,
          explanation:
            "The general advice may be perfectly sound. The defect is provenance. Presented in the same breath as answers drawn from the policy, it acquires the policy's authority, and you'll quote it back to someone as what the venue requires.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "What's the specific failure a decision log audit catches?",
          options: [
            {
              text: "Decisions recorded without a date",
              whyNot:
                "A missing date is easy to spot by reading the log. The audit is after a failure that looks perfectly normal on the page.",
            },
            {
              text: "Duplicate entries from long conversations",
              whyNot:
                "Duplicates are harmless and easy to see. The audit targets rows that look valid but record something nobody agreed to.",
            },
            "Suggestions that were quietly promoted into approved decisions",
            {
              text: "Decisions that contradict the working brief",
              whyNot:
                "A contradiction with the brief would stand out. The audit asks a different question of each row: was this decided, or only discussed?",
            },
          ],
          answer: 2,
          explanation:
            "Exploratory talk and settled choices read alike once written down as bullet points. The audit is asking, for each row, whether you actually decided that or merely discussed it.",
        },
      ],
    },
  },
  {
    slug: "capstone",
    title: "Capstone: create a context kit",
    minutes: 25,
    type: "project",
    body: {
      summary: "Package brief, sources, preferences and decisions, then use it cold.",
      xp: ATTESTED_XP,
      attested: true,
      blocks: [
        {
          kind: "text",
          body: "Assemble the book-swap materials into one kit: the brief, the labelled source notes, your working preferences, and the decision log. This is the artefact you'd hand someone, or hand yourself in three weeks.",
        },
        {
          kind: "text",
          body: "Use it in a completely fresh conversation to produce an organiser's checklist, then audit that checklist against every fixed constraint in the brief. Anything the checklist assumed that the kit didn't state is a gap in the kit, not a mistake in the answer, so fix the kit.",
        },
        {
          kind: "callout",
          body: "**Do it now, in your own account.** Keep this evidence: the assembled kit, the organiser checklist it produced cold, and the completed constraint audit naming anything you had to add to the kit afterwards. Use fictional material throughout. A brief is exactly the kind of document that tempts people to paste something real.",
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
