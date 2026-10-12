import type { LessonBody } from "./lessons";

/**
 * UX Design Fundamentals.
 *
 * Research, structure and testing, ending in the portfolio case study the
 * course description promises. It shares the UX/UI path with the Figma course,
 * so it deliberately leaves the tool to that one: "Running a usability test"
 * doesn't re-teach Figma's "Test it with five people" (writing tasks, staying
 * quiet) and covers what happens either side of the session instead, and the
 * wireframing lesson is about fidelity and content, not frames and auto layout.
 */
export const uxDesignLessonBodies: Record<string, LessonBody> = {
  "ux-core.interviews": {
    summary:
      "Ask about what people actually did, not what they say they would do, and know when you have heard enough.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "Almost every bad research interview fails the same way: it asks about the future. “Would you use this?”, “How much would you pay?”, “Would a dark mode be useful?” People are generous, they want to be helpful, and they are genuinely bad at predicting their own behaviour. You will come back with a notebook full of encouragement and no information.",
      },
      {
        kind: "text",
        body: "The fix is to ask about the **past**, because the past already happened and people can remember it. “Walk me through the last time you had to do that.” “What did you do right before?” “What did you try first?” “What did it cost you when it went wrong?” Every one of those has a real answer, and the answer is evidence rather than a prediction.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The same curiosity, asked two ways",
        code: `Future intent (worthless)     Past behaviour (evidence)
──────────────────────────    ────────────────────────────────
"Would you use a shared      "Tell me about the last time two
 inbox?"                      of you answered the same email."

"Is invoicing painful?"      "Walk me through sending your
                              last invoice. What took longest?"

"Would you pay £20/month?"   "What do you spend on this today,
                              and what did you buy last?"`,
      },
      {
        kind: "text",
        body: "**Compliments are not data.** “That's a great idea” and “I'd definitely use that” feel like progress and mean nothing. Rob Fitzpatrick's *The Mom Test* is the short book on why. The useful currency is specifics people give up without being prompted: what they've already tried, what they've already paid for, who else they had to ask, what they do in the meantime.",
      },
      {
        kind: "text",
        body: "**Talk to people who have the problem**, not people who are easy to reach. Your colleagues, your Twitter followers and your most enthusiastic customer are all convenient and all wrong in the same direction. A two-question screener (have you done this thing, and when was the last time?) is usually enough to keep the sample honest.",
      },
      {
        kind: "callout",
        body: "**When to stop:** when new interviews stop surprising you. That point is called **saturation**, and in one reasonably narrow group it usually arrives somewhere around the fifth to eighth conversation. It's a signal to watch for, not a quota to hit. A second, different group of users resets the clock.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You're researching whether a team needs shared invoice approvals. Which question will give you the most reliable information?",
        options: [
          "“Would shared approvals be useful to your team?”",
          "“Walk me through the last invoice that needed someone else to sign it off.”",
          "“How important is approval on a scale of one to five?”",
          "“Would you use this if we built it next quarter?”",
        ],
        answer: 1,
        explanation:
          "It asks about an event that actually happened, so the answer contains detail you did not think to ask for: who was involved, how long it took, what they did when the person was on holiday. The other three ask for predictions or ratings, which people produce on demand and which correlate poorly with behaviour.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "An interviewee says “Honestly, I'd pay for that tomorrow.” What is that worth?",
        options: [
          "Strong evidence of demand, so record it as a validated signal",
          "Enough to justify building a prototype",
          "Very little on its own; follow it with what they pay for today and what they tried last",
          "Nothing, and you should end the interview",
        ],
        answer: 2,
        explanation:
          "It's a compliment about a hypothetical. The follow-up is what converts it into evidence or dissolves it: if they already pay for three tools in this space, that's a signal; if they've never spent a penny or an hour on it, the enthusiasm is politeness.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the point at which additional interviews in one group stop producing anything new.",
        before: "You have reached ",
        after: "",
        answer: "saturation",
        explanation:
          "Saturation is a judgement about your notes, not a number of sessions. A new user segment starts you over.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** find one person who has the problem you're working on and ask them to walk you through the last time it happened. Ask no question about the future for fifteen minutes. Count how many times you nearly did.",
      },
    ],
  },

  "ux-core.flows": {
    summary:
      "Draw the path, the branches and the ways out: the states you would otherwise discover in production.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "Three things get called “a flow” and they answer different questions.\n\n- A **task flow** is one path through one task, with no branches. Good for agreeing the happy path quickly.\n- A **user flow** adds the decision points and the branches. This is the one that finds missing screens.\n- A **journey map** zooms out to the whole experience over time, across channels and often with the person's emotional state. Good for finding where the product isn't the problem.",
      },
      {
        kind: "text",
        body: "The notation barely matters as long as you're consistent: a rectangle for a step or screen, a diamond for a decision, an arrow for a transition, and a note on the arrow for what triggers it. What matters is that every diamond has **every** exit drawn, including the unglamorous ones.",
      },
      {
        kind: "code",
        language: "text",
        caption: "A user flow with its branches drawn, not implied",
        code: `[Email link] ──► ◆ Signed in?
                   │ no  ──► [Sign in] ──┐
                   │ yes ◄───────────────┘
                   ▼
              ◆ Invite still valid?
                   │ expired ──► [Expired: request a new one]
                   │ already accepted ──► [Go to workspace]
                   ▼ valid
              [Accept invite] ──► ◆ Seat available?
                                     │ no ──► [Ask admin for a seat]
                                     ▼ yes
                                 [Workspace]`,
      },
      {
        kind: "text",
        body: "**Most flows are drawn as though everyone starts at the home screen.** They don't. People arrive from an email link, a push notification, a shared URL, a bookmark two versions old, or a back button. Each of those is an entry point, and each one can land somewhere the flow never planned for, which is how you get a signed-out user staring at an empty dashboard.",
      },
      {
        kind: "text",
        body: "The branches worth drawing every time are the ones that produce screens nobody designs: **nothing here yet**, **not permitted**, **it failed**, **you already did this**, and **you left halfway through**. That last one has a question attached: is their progress saved? The flow is where you decide, rather than the sprint where someone notices.",
      },
      {
        kind: "callout",
        body: "A finished flow is a shopping list for the design file. Every rectangle is a screen or a state you now owe, which is exactly the checklist the handoff lesson asks for: empty, loading, error, extremes, permissions.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You want to find the screens your team has forgotten to design. Which artefact is the right one to draw?",
        options: [
          "A user flow, because its decision points force every branch to be drawn",
          "A task flow, because it shows the path most people take",
          "A journey map, because it covers the whole experience",
          "A sitemap, because it lists every page",
        ],
        answer: 0,
        explanation:
          "Missing screens hide behind decisions: expired, not permitted, already done. A task flow deliberately omits branches, a journey map is too coarse to name screens, and a sitemap shows what exists rather than what should.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Your invite flow works perfectly in testing, but real users keep landing on a blank page. What was most likely missing from the flow?",
        options: [
          "A loading spinner",
          "The confirmation screen",
          "The colour tokens for the empty state",
          "The entry point where someone arrives from an email link while signed out",
        ],
        answer: 3,
        explanation:
          "Testing starts from the home screen; real invites start from an email, often in a browser with no session. The flow needs that arrow drawn, ending at sign-in and returning to the invite. Otherwise nobody specifies what happens in between.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Name the shape conventionally used for a decision point in a flow diagram.",
        before: "A ",
        after: " marks a decision",
        answer: "diamond",
        explanation:
          "Every diamond needs each of its exits drawn. An undrawn exit is a screen nobody has designed and an engineer will have to invent.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** take a flow your team has already shipped and redraw it from a notification rather than the home screen. Mark every branch that has no design. That list is usually longer than anyone expects.",
      },
    ],
  },

  "ux-test.usability": {
    summary:
      "Prepare the session properly, then turn five people's confusion into a ranked list somebody can act on.",
    xp: 140,
    blocks: [
      {
        kind: "callout",
        body: "**Writing the tasks and keeping quiet** is covered in *Figma for Product Teams → Test it with five people*. This lesson is what happens either side of the session: getting ready, and turning what you saw into decisions.",
      },
      {
        kind: "text",
        body: "Before anyone sits down, write a **script**. It doesn't need to be clever: a sentence about what this is and that you're testing the design rather than them, permission to record, one easy warm-up task, the real tasks in order, and a wrap-up question. Reading from a script is what makes five sessions comparable. Without one you will unconsciously run the last session better than the first.",
      },
      {
        kind: "text",
        body: "**Pilot it with a colleague first.** Every pilot finds something: a dead prototype link, a task that takes twenty minutes, a question you can't say out loud without laughing. Finding it on a colleague costs nothing. Finding it on your first real participant costs you one of five.",
      },
      {
        kind: "text",
        body: "**Say what you're recording and who sees it**, and mean it. People behave differently when they're unsure whether their screen is being shared with their manager. Tell them they can stop at any point, and make stopping genuinely easy.",
      },
      {
        kind: "text",
        body: "During the session, capture **observations, not conclusions**. One row per thing that happened: participant, task, what they did, and their words if they said something. “P3 clicked Settings twice looking for billing” is an observation. “Navigation is confusing” is a conclusion, and writing it down early means you stop collecting the evidence that would have told you *which* part.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Notes that survive synthesis",
        code: `P#  Task      What happened                        Quote
──  ────────  ───────────────────────────────────  ─────────────────────
P1  Refund    Opened Orders, scrolled past the     "I thought refunds
              row twice, used search instead        lived under Payments"
P2  Refund    Clicked the row, missed "Refund"     —
              in the ⋯ menu for 40s
P3  Refund    Completed in 15s                     —
P3  Invite    Stopped at the seat limit, no idea   "Does this cost me
              what to do next                       money?"`,
      },
      {
        kind: "text",
        body: "Afterwards, group the rows **by problem, not by participant**. Five per-person summaries are five stories; one list of problems with the people who hit each is a decision-making document. Then rate each problem's **severity** (Nielsen Norman Group's familiar 0–4 scale works fine) by combining how many people hit it, how badly it blocked them, and whether they got past it on a second try.",
      },
      {
        kind: "callout",
        body: "**Frequency is not severity.** One person who could not complete a core task outranks five people who thought a label was slightly odd. A single blocker is a finding; a single preference is an anecdote. Say which you have.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "One participant of five could not complete checkout at all. Three others said the confirm button's colour looked “off”. What do you rank first?",
        options: [
          "The button colour, because three people mentioned it",
          "The failed checkout, because it blocked a core task even though only one person hit it",
          "Neither, because one participant is not a large enough sample",
          "Whichever is cheaper to change",
        ],
        answer: 1,
        explanation:
          "Severity weighs impact, not just count. A blocked core task is revenue; a colour remark is a preference, and preferences are the least reliable thing a participant offers. One failure on a critical path is worth investigating whatever the sample size.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which of these belongs in your notes during a session?",
        options: [
          "“P2 opened the ⋯ menu, closed it, then re-read the page for 40 seconds”",
          "“The information architecture needs rethinking”",
          "“Participant seemed like a confident user”",
          "“We should move Refund to the top level”",
        ],
        answer: 0,
        explanation:
          "It records what happened, with enough detail to group later. The other three are conclusions or solutions written before the evidence is in. And once they're on the page, you stop looking for anything that contradicts them.",
      },
      {
        kind: "mcq",
        id: "q3",
        question: "Why pilot the session with a colleague before the first real participant?",
        options: [
          "To check the design is good enough to test",
          "To get a sixth data point at no cost",
          "To find the broken links, the impossible task and the unaskable question while it is still free",
          "To agree the severity scale in advance",
        ],
        answer: 2,
        explanation:
          "A pilot tests the *session*, not the design. Your colleague's data isn't usable (they know too much), but the twenty minutes they save you is one of only five real participants.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the rating you give each finding by combining impact, frequency and whether people recover.",
        before: "Each finding gets a ",
        after: " rating",
        answer: "severity",
        explanation:
          "Severity is what turns a list of observations into an order of work. Without it, the team fixes whatever is easiest.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** run one session from a written script, take notes as observations only, and write up the findings as a ranked list with a severity and the participant numbers beside each. If the write-up is longer than a page, you have written stories rather than findings.",
      },
    ],
  },

  "ux-core.synthesis": {
    summary:
      "Turn a pile of interview notes into a few insights you can defend, each with the evidence beside it.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "Six interviews produce sixty pages of notes, and the temptation is to skim them and write down what you remember. What you remember is what surprised you, what matched your hunch, and whatever the last person said. **Synthesis** is the deliberate version: break the notes into small pieces, find the patterns across people, and say what they mean.",
      },
      {
        kind: "text",
        body: "Start by pulling out **one observation per note**: something a participant did, said or described, in their words, tagged with who said it. “P4 keeps a spreadsheet of which client approved which invoice.” Not “P4 needs approvals”: that's already an interpretation. Then **cluster bottom-up**: put notes that feel related next to each other, *then* name each group. This is an **affinity map**. Naming the groups first (“pricing”, “onboarding”) just sorts the notes into the categories you already believed in.",
      },
      {
        kind: "code",
        language: "text",
        caption: "From observation to insight",
        code: `Observations (clustered)                         People
──────────────────────────────────────────────   ──────
Keeps a spreadsheet of who approved what           P1 P4 P6
Forwards invoices to a manager by email            P2 P4
"I find out it was paid when the client calls"     P3 P6

Insight
Finance teams track approvals outside the product because
the product doesn't record who signed off, so they can't
answer "who approved this?" without searching email.
(5 of 6 participants)`,
      },
      {
        kind: "text",
        body: "An **insight** is more than a theme. “Approvals” is a theme. An insight says what people do, why, and what it costs them, and it's surprising enough that someone could disagree. Write each one with its **evidence count** (“5 of 6 participants”) and a quote or two. A finding that only one person mentioned can still matter, but say that it's one person.",
      },
      {
        kind: "text",
        body: "Finally, turn insights into questions the team can work on. A **How might we** question (“How might we let finance see who approved an invoice without leaving the app?”) is narrow enough to act on and open enough not to dictate the answer. “How might we add an approvals tab?” has already chosen the solution.",
      },
      {
        kind: "callout",
        body: "**Look for the notes that don't fit.** The cluster that contradicts your hypothesis is the most valuable thing on the wall. If every note supports what the team already planned to build, check whether you asked leading questions.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which of these is an insight rather than a theme?",
        options: [
          "Invoices",
          "Users find approvals confusing",
          "Approvals and reminders",
          "Finance teams keep approvals in spreadsheets because the product doesn't record who signed off, so answering an auditor takes hours",
        ],
        answer: 3,
        explanation:
          "It says what people do, why, and what it costs them, which is specific enough to act on and to argue with. The others are topics or vague judgements: they name an area without saying anything about it.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Why build an affinity map bottom-up rather than starting with named categories?",
        options: [
          "Pre-named categories sort the evidence into what you already believed, so new patterns never appear",
          "Because it is faster",
          "Because stakeholders prefer it",
          "Because named categories can't hold quotes",
        ],
        answer: 0,
        explanation:
          "Categories decided in advance act as a filter: a note that fits nowhere gets squeezed into the nearest box or dropped. Clustering first and naming afterwards lets the groups come from what people actually said.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the diagram made by clustering observations into groups and naming the groups afterwards.",
        before: "An ",
        after: " map",
        answer: "affinity",
        accept: ["affinity diagram"],
        explanation:
          "Affinity mapping is the standard way to find patterns across interviews. The order matters: cluster, then name.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** take your notes from three conversations, write one observation per sticky note (or card in a whiteboard tool), and cluster them without naming any group until the end. Write one insight with its evidence count.",
      },
    ],
  },

  "ux-shape.ia": {
    summary:
      "Organise and label content the way people already think about it, and check they can find things before anything is designed.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "**Information architecture** (IA) is how content and features are organised, labelled and reached: what goes in which section, what each section is called, and how people get there. It's invisible when it works. When it doesn't, people use search for everything, support answers the same “where do I find…?” question every day, and every new feature gets its own top-level menu item because there's nowhere obvious to put it.",
      },
      {
        kind: "text",
        body: "The most common IA mistake is **organising by your company's structure** instead of by the user's task. Billing, Accounts and Payments may be three teams internally; to a customer who wants a refund, they're one question. Labels have the same problem: internal names (“Workspaces”, “Entities”, “Fulfilment”) mean nothing to people who weren't in the meeting where they were chosen.",
      },
      {
        kind: "text",
        body: "Two cheap methods test IA before anything is designed. In a **card sort**, people group cards (one per piece of content) in a way that makes sense to them. An **open** sort lets them create and name their own groups, which shows you how they think and what words they use. A **closed** sort gives them your categories to sort into, which checks whether a structure you already have makes sense. In a **tree test**, people see only the text hierarchy, with no visual design, and are asked to find things: “Where would you go to change your billing address?” You measure how many succeed and how many get there without backtracking.",
      },
      {
        kind: "code",
        language: "text",
        caption: "A tree test result that tells you where the problem is",
        code: `Task: "Change the card you pay with"          Success 38%   Direct 21%

First click:   Settings ▸ Account        54%   ✗
               Settings ▸ Billing        31%   ✓
               Help                      15%   ✗

→ People look for payment details under "Account".
  Move it, or link it from there.`,
      },
      {
        kind: "callout",
        body: "**Card sorts generate structure; tree tests check it.** Run an open sort when you're starting out or reorganising, then tree-test the hierarchy you build from it. Testing navigation inside a finished visual design mixes two questions: you can't tell whether people failed because of the structure or the layout.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You're reorganising a settings area and want to learn how customers would group the options and what they'd call each group. Which method fits?",
        options: [
          "A closed card sort with your current categories",
          "A tree test of the current menu",
          "An open card sort",
          "An A/B test of two menu designs",
        ],
        answer: 2,
        explanation:
          "An open sort lets people form and name their own groups, which is exactly how you learn their mental model and vocabulary. A closed sort and a tree test both evaluate a structure you've already chosen.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A tree test shows 70% of people look for “Export data” under Reports, but it lives under Settings. What does that tell you?",
        options: [
          "The visual design of the Settings page needs work",
          "Most people expect it under Reports, so move it there or make it reachable from there",
          "The test was flawed because it had no visual design",
          "People need a tutorial on where things are",
        ],
        answer: 1,
        explanation:
          "A tree test strips out the visuals on purpose, so this is purely about structure and labels. When most people look in one place, that's where they expect it. Fix the structure, not the people.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the method where people find items in a text-only hierarchy, with no visual design.",
        before: "A ",
        after: "",
        answer: "tree test",
        accept: ["tree testing", "treetest"],
        explanation:
          "Tree testing isolates findability. Its two numbers, success rate and directness, show whether a structure works and where people go wrong.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** write the ten most common things people do in a product you work on onto cards and ask three people to sort them into groups they name themselves. Compare their group names with your navigation labels.",
      },
    ],
  },

  "ux-shape.wireframes": {
    summary:
      "Choose the lowest fidelity that answers your question, use real content, and annotate the behaviour a picture can't show.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "A wireframe is a question you're asking someone. Fidelity decides which question they answer. Show a rough grey sketch and people talk about structure: is this the right content, in the right order, with the right actions? Show a polished mock-up and they talk about the blue, the font and the icon. Both conversations are useful, but at different times. **Use the lowest fidelity that can answer the question you have right now.**",
      },
      {
        kind: "code",
        language: "text",
        caption: "Fidelity, matched to the question",
        code: `Question                                  Fidelity
────────────────────────────────────────  ─────────────────────────────
Which of three approaches is right?       Sketches, 5 minutes each
What goes on this screen, in what order?  Grey boxes, real headings
Can people complete the task?             Clickable wireframes
Does it feel trustworthy and on-brand?    High-fidelity mock-up`,
      },
      {
        kind: "text",
        body: "**Explore before you refine.** The first idea is rarely the best one, and once it's drawn neatly it's hard to let go. A common exercise is *Crazy 8s*: fold a sheet into eight panels and sketch eight different versions in eight minutes. Most will be bad. One will have something the first idea didn't.",
      },
      {
        kind: "text",
        body: "**Use real content, never lorem ipsum.** Placeholder text is always the perfect length. Real content is a 60-character product name, a customer called “Dr Siobhán Ní Bhriain-Okonkwo”, a price with four digits, an empty list on day one. Designing with real (or realistic) content is how you find out the layout breaks before an engineer does.",
      },
      {
        kind: "text",
        body: "**Annotate what the picture can't show**: what happens on click, what's sorted and by what, what's required, what the limits are, and which states exist. A wireframe of a list is really five screens: loading, empty, a few items, hundreds of items, and failed to load. Draw or note each one, or someone will improvise them later.",
      },
      {
        kind: "callout",
        body: "Stakeholders shown a polished design early tend to treat it as nearly finished, and changing direction then feels like waste. Rough wireframes say “this is still open”, which is often exactly the message you want.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You show stakeholders a first draft of a dashboard to decide which metrics belong on it. The whole meeting is about the chart colours. What went wrong?",
        options: [
          "The fidelity was too high for the question: polish invited visual feedback instead of a decision about content",
          "The stakeholders weren't briefed properly",
          "The colours really were wrong",
          "Dashboards should be designed by engineers",
        ],
        answer: 0,
        explanation:
          "People respond to what's in front of them. A finished-looking design invites comments on finish. To get a decision about which metrics matter, show grey boxes with the metric names.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Why design with realistic content instead of placeholder text?",
        options: [
          "It looks more impressive in presentations",
          "Placeholder text is too short to fill the space",
          "Engineers can't build from placeholder text",
          "Real content has awkward lengths, missing values and empty states that placeholder text hides",
        ],
        answer: 3,
        explanation:
          "Lorem ipsum always fits. Real names, prices and lists don't, and finding that out on a wireframe is far cheaper than finding it in production.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the property of a design (from rough sketch to polished mock-up) that should match the question you're asking.",
        before: "Choose the right ",
        after: "",
        answer: "fidelity",
        explanation:
          "Low fidelity answers questions about structure and flow; high fidelity answers questions about feel and trust. Using the wrong one gets you answers to a question you didn't ask.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** pick a screen you're about to design and do Crazy 8s first. Then wireframe the best idea in greys, with real content, and note its empty and error states before you open a colour picker.",
      },
    ],
  },

  "ux-shape.writing": {
    summary:
      "Write labels that say what will happen, errors that say how to fix them, and empty states that say what to do next.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "Most interface text is read in under a second by someone trying to get something else done. So the job of UX writing isn't to be clever. It's to make the next action obvious. The words carry more of the design than people expect: a perfectly laid-out dialog with buttons labelled “OK” and “Cancel” can still lead someone to delete the wrong thing.",
      },
      {
        kind: "text",
        body: "**Buttons say what will happen**, as a verb and usually an object: “Delete project”, “Send invoice”, “Save draft”. Generic labels (“OK”, “Yes”, “Submit”, “Continue”) force people to reread the question to work out what they're agreeing to. In a destructive confirmation, the dangerous button should name the danger, so “Delete 14 files” and “Keep files”, not “Yes” and “No”.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The same error, three ways",
        code: `✗  Error 4012.
✗  Invalid input. Please try again.
✓  That card has expired. Use a different card, or update
   the expiry date in Billing.`,
      },
      {
        kind: "text",
        body: "**An error message answers three questions**: what happened, why (if it helps), and what to do now. Write in plain language, say it next to the thing that's wrong, and never blame the person (“You entered an invalid date”) when the system could simply say what it needs (“Enter a date like 31/12/2026”). Keep what they typed: clearing a form because one field was wrong turns a small mistake into a big one.",
      },
      {
        kind: "text",
        body: "**Empty states are a first impression.** “No data” on a new user's dashboard is the least helpful possible welcome. Say what will appear here and give the one action that makes it appear: “Your invoices will show up here. Create your first invoice.” And **pick one word per concept** and keep it everywhere. If it's a “project” in the menu, it isn't a “workspace” in the settings and a “board” in the email.",
      },
      {
        kind: "callout",
        body: "**Don't use placeholder text as a label.** Text inside an empty field disappears as soon as someone types, so they can't check what the field wanted. It's also often low-contrast, which makes it hard to read. Put the label above the field and keep any example as hint text that stays visible.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A dialog asks “Remove Dana from this workspace? They'll lose access to all projects.” Which button labels are best?",
        options: [
          "“Yes” and “No”",
          "“Remove Dana” and “Cancel”",
          "“OK” and “Cancel”",
          "“Continue” and “Go back”",
        ],
        answer: 1,
        explanation:
          "The action button names exactly what will happen, so someone skimming the buttons alone still knows what they're choosing. Yes/No and OK/Cancel make them reread the question; Continue is vague about which direction is destructive.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which error message is most helpful?",
        options: [
          "“Something went wrong.”",
          "“Error: payload validation failed (field: dob).”",
          "“You entered an invalid date of birth.”",
          "“Enter your date of birth as DD/MM/YYYY, for example 07/03/1991.”",
        ],
        answer: 3,
        explanation:
          "It says exactly what's needed and shows an example, without blame or jargon. The others say something is wrong without saying how to fix it, and two of them use system language or blame the person.",
      },
      {
        kind: "mcq",
        id: "q3",
        question: "What should a new user's empty project list show?",
        options: [
          "“No projects found.”",
          "Nothing, so the page stays uncluttered",
          "What projects are for and a button to create the first one",
          "A list of sample projects that can't be removed",
        ],
        answer: 2,
        explanation:
          "An empty state should explain what will appear and offer the action that makes it appear. “No projects found” sounds like an error, and blank space leaves people wondering if the page failed to load.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** collect every button label and error message from one flow you own into a single list. Rewrite any button that doesn't say what it does, and any error that doesn't say how to fix it.",
      },
    ],
  },

  "ux-test.heuristics": {
    summary:
      "Inspect an interface against Nielsen's ten usability heuristics to catch common problems cheaply, and know what this can't tell you.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "A **heuristic evaluation** is an expert review against a short list of principles. It costs an afternoon, needs no participants, and reliably finds the common problems, so a usability test can spend its five precious sessions on the problems only real users reveal. The list most teams use is Jakob Nielsen's ten usability heuristics, published in the 1990s and still in use because they describe how people behave, not how screens look.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Nielsen's ten usability heuristics",
        code: ` 1  Visibility of system status
 2  Match between the system and the real world
 3  User control and freedom
 4  Consistency and standards
 5  Error prevention
 6  Recognition rather than recall
 7  Flexibility and efficiency of use
 8  Aesthetic and minimalist design
 9  Help users recognize, diagnose, and recover from errors
10  Help and documentation`,
      },
      {
        kind: "text",
        body: "A few are easy to mix up. **Visibility of system status** means people always know what's happening: a save that shows no feedback, or an upload with no progress, breaks it. **User control and freedom** is the way out: undo, cancel, back, an exit from a flow entered by mistake. **Error prevention** stops the mistake happening at all, such as greying out a date that can't be booked. **Recognition rather than recall** means showing options instead of making people remember them: a list of recent files rather than asking them to type a path.",
      },
      {
        kind: "text",
        body: "**How to run one:** have three to five people review independently, each going through the key tasks twice (once to get the feel, once to inspect). For each problem, note where it is, which heuristic it breaks and how severe it is. Only then merge the lists. Independent reviews matter: each evaluator finds a different subset, and discussing too early makes everyone find the same things.",
      },
      {
        kind: "callout",
        body: "**Experts aren't users.** A heuristic evaluation finds violations of known principles. It can't tell you whether people want the feature, understand your vocabulary, or would ever click that tab. Treat it as a filter before testing with real users, never as a replacement for it.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "After clicking “Save”, nothing on screen changes, so people click it three more times. Which heuristic does this break?",
        options: [
          "Visibility of system status",
          "Consistency and standards",
          "Aesthetic and minimalist design",
          "Help and documentation",
        ],
        answer: 0,
        explanation:
          "People can't tell whether the save happened, so they repeat it. A “Saving…” then “Saved” message, or a disabled button while saving, fixes the visibility problem.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A booking form lets you pick a date that's already full, then shows an error after you've filled in everything else. Which heuristic is the best fit?",
        options: [
          "Help and documentation",
          "Match between the system and the real world",
          "Recognition rather than recall",
          "Error prevention",
        ],
        answer: 3,
        explanation:
          "The mistake didn't need to be possible. Showing full dates as unavailable in the picker prevents it; a good error message afterwards (heuristic 9) is the second-best fix.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "A command bar makes people type the exact name of a report, with no suggestions. Which heuristic does it break most directly?",
        options: [
          "User control and freedom",
          "Visibility of system status",
          "Recognition rather than recall",
          "Error prevention",
        ],
        answer: 2,
        explanation:
          "It relies on people remembering exact names. Suggesting matches as they type, or listing recent reports, lets them recognise what they want instead.",
      },
      {
        kind: "mcq",
        id: "q4",
        question: "What can a heuristic evaluation not tell you?",
        options: [
          "Whether the save button gives feedback",
          "Whether a form clears itself after an error",
          "Whether labels are used consistently",
          "Whether the people you're designing for actually want this feature",
        ],
        answer: 3,
        explanation:
          "The first three are inspectable against principles. Whether people want the feature is a question about real people's needs, which only research with them can answer.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** review one flow of a product you use against the ten heuristics. For each problem, note the screen, the heuristic and a severity from 0 to 4. Then ask a colleague to do the same alone, and compare lists.",
      },
    ],
  },

  "ux-test.casestudy": {
    summary:
      "Write a portfolio case study that shows the decisions you made and why, so a hiring manager can see how you think in three minutes.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "A hiring manager reviewing portfolios gives each one a few minutes, and they're not looking for pretty screens: everyone has those. They're looking for evidence that you can take a vague problem, find out what's really going on, make trade-offs under constraints, and tell whether it worked. A case study is an argument that you can, built from one project.",
      },
      {
        kind: "code",
        language: "text",
        caption: "A structure that survives a three-minute skim",
        code: `Summary      One paragraph: the problem, what you did, what changed.
             (Many readers stop here. Make it count.)
Context      The product, the users, the business problem.
Your role    What YOU did, distinct from the team. Team size, length.
Constraints  Deadline, tech limits, no research budget, legal rules.
Process      2–4 key decisions. For each: the options, the evidence,
             what you chose, and what you gave up.
Outcome      What changed, measured if possible. Honest if not.
Reflection   What you'd do differently, and why.`,
      },
      {
        kind: "text",
        body: "**Show decisions, not deliverables.** A wall of personas, journey maps and wireframes says you know the methods. What shows judgement is the moment you chose: “We had two weeks and no research budget, so instead of interviews I read 200 support tickets. That showed the problem wasn't the form; it was the confirmation email.” A rejected option and the reason you rejected it is worth more than three polished screens.",
      },
      {
        kind: "text",
        body: "**Be precise about your role.** “We redesigned checkout” hides whether you led it or attended the meetings. Say what you did yourself, and credit what others did. Interviewers will ask, and the case study and your answers need to match.",
      },
      {
        kind: "text",
        body: "**Outcomes, honestly.** A measured result (“completed checkouts rose from 61% to 68% over the following month”) is strong. If you don't have numbers, because the project shipped after you left or was never measured, say so and show the evidence you do have: usability test results, qualitative feedback, what the team did next. Invented or inflated numbers are easy for experienced interviewers to spot, and they undo everything else on the page. If the work is under NDA, change names and details and say that you have.",
      },
      {
        kind: "callout",
        body: "**Choose depth over breadth.** Two or three detailed case studies beat eight thin ones. Pick projects that show different strengths, such as one research-led and one systems-led, and put your strongest first.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "How should a case study open?",
        options: [
          "With a short summary of the problem, what you did and what changed",
          "With your design process diagram",
          "With the final high-fidelity screens, full width",
          "With a personal story about why you love design",
        ],
        answer: 0,
        explanation:
          "Many readers decide in the first paragraph whether to keep going. A summary up front gives them the whole story in seconds and a reason to read the detail.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which sentence best shows design judgement?",
        options: [
          "“I created personas, journey maps, wireframes and a prototype.”",
          "“The final design was clean and modern.”",
          "“We chose a single-page checkout over a multi-step one because tests showed people abandoned at step two, accepting a longer page on mobile as the cost.”",
          "“I collaborated closely with stakeholders throughout.”",
        ],
        answer: 2,
        explanation:
          "It names a decision, the evidence behind it, and the trade-off accepted. The others list activities or adjectives, which every portfolio has and which show nothing about how you think.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "Your project shipped after you left, and you have no data on how it performed. What should the Outcome section say?",
        options: [
          "Estimate a likely improvement from industry averages",
          "Leave the section out so nobody notices",
          "Say the project was a success",
          "Say plainly that it shipped after you left, and show the evidence you do have, such as test results",
        ],
        answer: 3,
        explanation:
          "Honesty about missing data is normal and respected; invented numbers are a red flag that can end an interview. Usability results, feedback and what the team did next are real evidence.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the section that says exactly what you did yourself, as distinct from your team.",
        before: "Your ",
        after: "",
        answer: "role",
        explanation:
          "Interviewers will ask what you personally did. A clear role section makes the answer match the page.",
      },
      {
        kind: "callout",
        body: "**Your capstone:** write one case study to the structure above, about a project of your own or the research, flows and wireframes you produced in this course. Keep the summary to one paragraph and the process to three decisions, each with the option you didn't take. Then ask someone outside design to read it for three minutes and tell you what you did. If they can't, rewrite the summary.",
      },
    ],
  },
};
