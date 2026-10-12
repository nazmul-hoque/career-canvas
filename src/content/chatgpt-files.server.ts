/**
 * Level 4 of the ChatGPT course: data and deliverables you have checked.
 *
 * Ten task specs merged into four lessons. The dataset is deliberately tiny —
 * 2x3 + 4x2 + 3x5 = 29 — because the learner has to be able to do the sum in
 * their head. A worked example you cannot check teaches trust, not checking.
 */
import type { AuthoredLesson } from "./authored-lesson";
import { ATTESTED_XP } from "./gamification";

const REFERENCE = "Work with files · https://learn.chatgpt.com/docs/artifacts-viewer";

export const chatgptFilesLessons: AuthoredLesson[] = [
  {
    slug: "dataset-and-checks",
    title: "A dataset small enough to check",
    minutes: 22,
    type: "practice",
    body: {
      summary: "Confirm the columns, verify the arithmetic, and find the problems yourself.",
      xp: 150,
      blocks: [
        {
          kind: "text",
          body: "Start every data task with a set small enough that you can do the sums in your head. Not because the tool can't handle more, but because **you can only learn how much to trust it on work you can independently check**, and on a hundred rows you can't.",
        },
        {
          kind: "code",
          language: "text",
          caption: "supplies.csv: three rows, checkable by eye",
          code: `item,quantity,unit_price
tables,2,3
chairs,4,2
boxes,3,5`,
        },
        {
          kind: "text",
          body: "**Ask what the columns are before asking for a calculation.** Is `unit_price` per item or per pack? Is the currency stated anywhere? It isn't, and a total that arrives with a currency symbol has invented one. Establishing what the data means is a separate step from computing on it, and skipping it is how a confident total ends up measuring the wrong thing.",
        },
        {
          kind: "text",
          body: "Then the line totals and the grand total: 2×3 = 6, 4×2 = 8, 3×5 = 15, giving **29**. Do that yourself and compare. The habit you're building isn't distrust of arithmetic. It's the reflex of having an independent answer before you look at the provided one, which is the only way to notice a plausible-but-wrong result.",
        },
        {
          kind: "text",
          body: "**Now break it deliberately.** Make a copy with one missing quantity and one duplicated row, and ask for problems to be flagged. What you're testing is whether they come back as *reported*. A missing quantity is not a zero, and a duplicate row is not something to silently drop. Either fix might be right, and both are your call.",
        },
        {
          kind: "text",
          body: "**Cleaning rules belong to you too.** Add ragged capitalisation and stray spaces, then define the rule explicitly: trim whitespace, title-case the item names, and keep the original column beside the cleaned one so the change is visible. A cleaning step that overwrites its input is a cleaning step nobody can review.",
        },
        {
          kind: "callout",
          body: "**Practice.** Create the three-row supplies CSV and ask for a description of each column and its units before any calculation. Get line totals and a grand total, and verify 29 by hand. Then make a copy with one missing quantity and one duplicate row and confirm both are flagged rather than silently fixed. Finally, add inconsistent capitalisation and spaces, define a cleaning rule, and keep the original values alongside the cleaned ones.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            'The supplies data has no currency column. The total comes back as "$29.00". What\'s wrong?',
          options: [
            "Nothing, because dollars are a reasonable default",
            "The formatting should match the input's precision",
            "A currency was supplied that the data never stated, so an assumption is presented as a fact",
            "The total should have been rounded differently",
          ],
          answer: 2,
          explanation:
            "29 is right; the dollar sign is invented. It's the same gap-filling from Level 1 wearing a numeric disguise, and a number carries more authority than a sentence, so it gets questioned less.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Why check a total you already asked for?",
          options: [
            "Because arithmetic is where these tools most often fail",
            "To confirm the file was read completely",
            "Because an independent answer is the only way to notice a plausible but wrong result",
            "Because totals are usually the most important number",
          ],
          answer: 2,
          explanation:
            "A wrong total doesn't look wrong. That's the whole problem. Having your own figure before you read theirs is what converts a number you were given into one you know.",
        },
        {
          kind: "mcq",
          id: "q3",
          question: "A row is missing its quantity. What's the correct handling?",
          options: [
            "Treat it as zero so the total can still be produced",
            "Drop the row and note the count in a footnote",
            "Estimate it from the other rows' average",
            "Report the missing value and let you decide how to handle it",
          ],
          answer: 3,
          explanation:
            "Zero, deletion and averaging are three different answers with three different totals, and each is a decision about your data. The tool's job is to surface the gap; the choice belongs to whoever knows what the missing row was.",
        },
      ],
    },
  },
  {
    slug: "charts-and-claims",
    title: "Honest charts and claims that stay in the data",
    minutes: 16,
    type: "practice",
    body: {
      summary: "A chart that matches the table, and a summary that doesn't explain why.",
      xp: 120,
      blocks: [
        {
          kind: "text",
          body: "A bar chart of your three supplies should start its value axis at **zero**, label its units, and total to the same 29 as the table. A truncated axis makes a small difference look dramatic, which is occasionally a legitimate choice and far more often an accident you'd never have made deliberately.",
        },
        {
          kind: "text",
          body: "Check the chart against the source table rather than against your impression of it. Bars in the right order, values matching, nothing rounded into a different story. If chart generation isn't available in your account, build it in a spreadsheet from the verified table. The checking discipline is the lesson, not the tool.",
        },
        {
          kind: "text",
          body: '**Then the summary, which is where claims escape the data.** "Boxes contribute $15 of the $29 total" is in the dataset. "Boxes cost the most because people buy more storage than furniture" is not. There is no customer, no behaviour and no time series in three rows of supplies. It\'s a plausible sentence describing a world the data says nothing about.',
        },
        {
          kind: "text",
          body: "Ask for explanations bounded by the source: which item contributes most, and by how much. If a cause is offered, it should be marked as a hypothesis to test, not delivered as a finding. This is the same instinct as a source-bound answer in Level 2. The boundary just happens to be a table this time.",
        },
        {
          kind: "callout",
          body: "**Practice.** Request a bar chart of supply costs with a zero baseline and labelled units, and check every bar against the table. Then ask which supply contributes most to cost and why, and reject any explanation involving customers, demand or behaviour, and confirm the answer identifies boxes at $15 of the $29 total without inventing a cause.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Which statement is supported by a three-row table of item, quantity and unit price?",
          options: [
            '"Boxes are the largest single cost at $15 of the $29 total"',
            '"Storage is where most of the budget goes because demand is rising"',
            '"Chairs are good value compared to the alternatives"',
            '"Costs are concentrated in bulky items"',
          ],
          answer: 0,
          explanation:
            'Only the first is arithmetic on the data. Rising demand needs a time series, value needs a comparison the table doesn\'t contain, and "bulky" is a property of items that appears nowhere in these three columns.',
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Why insist on a zero baseline for this chart?",
          options: [
            "Charts are conventionally drawn from zero",
            "Because a truncated axis exaggerates small differences, usually by accident rather than intent",
            "Because the totals won't add up otherwise",
            "Because labelled units require it",
          ],
          answer: 1,
          explanation:
            "Bar length is read as quantity, so a cropped axis makes $8 and $15 look like a far bigger gap than 2:1. It's occasionally a deliberate choice; in an automatically generated chart it's a distortion nobody chose.",
        },
      ],
    },
  },
  {
    slug: "documents-and-export",
    title: "Documents, exports, and surgical revisions",
    minutes: 20,
    type: "practice",
    body: {
      summary:
        "Account for every input, open the file outside the chat, and change only one thing.",
      xp: 130,
      blocks: [
        {
          kind: "text",
          body: "Turning five event notes into a one-page volunteer brief is the most ordinary useful thing these tools do. The check that makes it trustworthy is **accounting for all five**. A brief that reads beautifully while silently dropping the note about the key collection is worse than no brief, because it will be used.",
        },
        {
          kind: "text",
          body: "So review by input, not by output. Go note by note and find where each one landed. Names and times get checked individually, because those are what people act on and what a fluent summary will happily approximate.",
        },
        {
          kind: "text",
          body: "**Then open the result outside the chat.** A document that looks fine in a conversation can lose its table formatting, wrap badly, or quietly drop a heading on export. Save it, open it in whatever will actually be used to read it, and look. This is a five-second check that catches an embarrassing class of problem.",
        },
        {
          kind: "text",
          body: "**Revise surgically.** Give feedback on one section, then compare versions to confirm nothing else moved. This is the failure that catches people out: you ask for a clearer timings section and get a regenerated document where an approved quantity has quietly changed. Diff the two versions rather than re-reading the new one. You're looking for unrequested changes, and re-reading is exactly how you miss them.",
        },
        {
          kind: "callout",
          body: "**Practice.** Provide five fictional event notes and request a one-page volunteer brief with headings, timings and unresolved questions, then check each note individually against the result. Save or download the output, open it outside the chat, and list any readability or formatting fixes. Then give targeted feedback on one section, compare the two versions, and confirm no approved time or quantity changed elsewhere.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "You ask for a clearer timings section and get a new version. What's the right way to check it?",
          options: [
            "Read the new version carefully from start to finish",
            "Check the timings section is clearer and move on",
            "Compare the two versions and look for anything that changed outside the timings section",
            "Ask ChatGPT to confirm nothing else was altered",
          ],
          answer: 2,
          explanation:
            "Re-reading tests whether the document is good, not whether it's the same. The risk is an unrequested change elsewhere, and only a comparison surfaces that. Asking whether anything changed relies on the same process that changed it.",
        },
        {
          kind: "mcq",
          id: "q2",
          question:
            "Why check five input notes against the brief rather than reading the brief for completeness?",
          options: [
            "Reading the brief takes longer",
            "Input notes may contain errors of their own",
            "A brief that reads as complete gives no signal that an input was dropped",
            "The brief may reorder the notes",
          ],
          answer: 2,
          explanation:
            "Omissions are invisible from the output side, because the prose closes over the gap. Working from the inputs is the only direction that can detect something missing, which is why the review runs note by note.",
        },
      ],
    },
  },
  {
    slug: "capstone",
    title: "Capstone: deliver an event pack",
    minutes: 30,
    type: "project",
    body: {
      summary: "Three outputs whose numbers agree with each other and with the source.",
      xp: ATTESTED_XP,
      attested: true,
      blocks: [
        {
          kind: "text",
          body: "Produce three deliverables for the fictional book swap: a verified supplies table, a cost chart, and a volunteer brief. Each is straightforward alone. The capstone is the reconciliation.",
        },
        {
          kind: "text",
          body: "Every shared number has to agree across all three. The total in the table, the total implied by the chart, and any figure quoted in the brief are the same number, and event details like the date and venue match everywhere they appear. Inconsistency across documents is the characteristic failure of generating them separately, and nothing warns you about it.",
        },
        {
          kind: "callout",
          body: "**Do it now, in your own account.** Keep this evidence: the three outputs, and a reconciliation checklist listing each shared figure with a tick per document. Use fictional data throughout, and keep an untouched copy of your input so you can always tell what the source actually said.",
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
