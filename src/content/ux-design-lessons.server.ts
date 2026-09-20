import type { LessonBody } from "./lessons";

/**
 * UX Design Fundamentals.
 *
 * Three lessons, and the third deliberately does not re-teach the Figma
 * course's "Test it with five people" — that one covers writing tasks and
 * staying quiet. This one covers what happens either side of the session:
 * preparing it, and turning five people's confusion into a ranked list. The two
 * courses share the UX/UI path, so a learner meets both.
 */
export const uxDesignLessonBodies: Record<string, LessonBody> = {
  "ux-core.interviews": {
    summary:
      "Ask about what people actually did, not what they say they would do — and know when you have heard enough.",
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
        body: "**Compliments are not data.** “That's a great idea” and “I'd definitely use that” feel like progress and mean nothing — Rob Fitzpatrick's *The Mom Test* is the short book on why. The useful currency is specifics people give up without being prompted: what they've already tried, what they've already paid for, who else they had to ask, what they do in the meantime.",
      },
      {
        kind: "text",
        body: "**Talk to people who have the problem**, not people who are easy to reach. Your colleagues, your Twitter followers and your most enthusiastic customer are all convenient and all wrong in the same direction. A two-question screener — have you done this thing, and when was the last time — is usually enough to keep the sample honest.",
      },
      {
        kind: "callout",
        body: "**When to stop:** when new interviews stop surprising you. That point is called **saturation**, and in one reasonably narrow group it usually arrives somewhere around the fifth to eighth conversation. It's a signal to watch for, not a quota to hit — a second, different group of users resets the clock.",
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
          "It asks about an event that actually happened, so the answer contains detail you did not think to ask for — who was involved, how long it took, what they did when the person was on holiday. The other three ask for predictions or ratings, which people produce on demand and which correlate poorly with behaviour.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "An interviewee says “Honestly, I'd pay for that tomorrow.” What is that worth?",
        options: [
          "Strong evidence of demand — record it as a validated signal",
          "Very little on its own; follow it with what they pay for today and what they tried last",
          "Enough to justify building a prototype",
          "Nothing, and you should end the interview",
        ],
        answer: 1,
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
      "Draw the path, the branches and the ways out — the states you would otherwise discover in production.",
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
        body: "**Most flows are drawn as though everyone starts at the home screen.** They don't. People arrive from an email link, a push notification, a shared URL, a bookmark two versions old, or a back button. Each of those is an entry point, and each one can land somewhere the flow never planned for — which is how you get a signed-out user staring at an empty dashboard.",
      },
      {
        kind: "text",
        body: "The branches worth drawing every time are the ones that produce screens nobody designs: **nothing here yet**, **not permitted**, **it failed**, **you already did this**, and **you left halfway through**. That last one has a question attached — is their progress saved? The flow is where you decide, rather than the sprint where someone notices.",
      },
      {
        kind: "callout",
        body: "A finished flow is a shopping list for the design file. Every rectangle is a screen or a state you now owe, which is exactly the checklist the handoff lesson asks for — empty, loading, error, extremes, permissions.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You want to find the screens your team has forgotten to design. Which artefact is the right one to draw?",
        options: [
          "A task flow, because it shows the path most people take",
          "A journey map, because it covers the whole experience",
          "A user flow, because its decision points force every branch to be drawn",
          "A sitemap, because it lists every page",
        ],
        answer: 2,
        explanation:
          "Missing screens hide behind decisions — expired, not permitted, already done. A task flow deliberately omits branches, a journey map is too coarse to name screens, and a sitemap shows what exists rather than what should.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Your invite flow works perfectly in testing, but real users keep landing on a blank page. What was most likely missing from the flow?",
        options: [
          "The entry point where someone arrives from an email link while signed out",
          "A loading spinner",
          "The confirmation screen",
          "The colour tokens for the empty state",
        ],
        answer: 0,
        explanation:
          "Testing starts from the home screen; real invites start from an email, often in a browser with no session. The flow needs that arrow drawn, ending at sign-in and returning to the invite — otherwise nobody specifies what happens in between.",
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
        body: "Before anyone sits down, write a **script**. It doesn't need to be clever: a sentence about what this is and that you're testing the design rather than them, permission to record, one easy warm-up task, the real tasks in order, and a wrap-up question. Reading from a script is what makes five sessions comparable — without one you will unconsciously run the last session better than the first.",
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
        body: "Afterwards, group the rows **by problem, not by participant**. Five per-person summaries are five stories; one list of problems with the people who hit each is a decision-making document. Then rate each problem's **severity** — Nielsen Norman Group's familiar 0–4 scale works fine — by combining how many people hit it, how badly it blocked them, and whether they got past it on a second try.",
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
          "Neither — one participant is not a large enough sample",
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
          "“The information architecture needs rethinking”",
          "“P2 opened the ⋯ menu, closed it, then re-read the page for 40 seconds”",
          "“Participant seemed like a confident user”",
          "“We should move Refund to the top level”",
        ],
        answer: 1,
        explanation:
          "It records what happened, with enough detail to group later. The other three are conclusions or solutions written before the evidence is in — and once they're on the page, you stop looking for anything that contradicts them.",
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
          "A pilot tests the *session*, not the design. Your colleague's data isn't usable — they know too much — but the twenty minutes they save you is one of only five real participants.",
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
};
