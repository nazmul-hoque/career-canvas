import type { LessonBody } from "./lessons";

/**
 * Product Management Craft.
 *
 * The decisions a product manager is actually accountable for: what is worth
 * building and in what order, what the team agreed to build, how it reaches
 * people, and how anyone will know afterwards whether it worked. Each lesson is
 * assessed rather than attested — the judgements here have right and wrong
 * answers often enough to check.
 */
export const productLessonBodies: Record<string, LessonBody> = {
  "pm-core.discovery": {
    summary:
      "Find the assumption that would change your mind, and test that one, in two weeks rather than two quarters.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "Discovery is not a phase before the real work. It is the habit of finding out whether the thing you're about to build is worth building, continuously, while you build other things. Teresa Torres's phrase for it is *continuous discovery*, and the practical version is small: every week, some contact with the people who have the problem.",
      },
      {
        kind: "text",
        body: "Marty Cagan's framing of what can go wrong is the most useful checklist here. Any idea carries four risks:\n\n- **Value:** will anyone want it?\n- **Usability:** can they work out how to use it?\n- **Feasibility:** can we build it?\n- **Business viability:** does it work for us legally, commercially, operationally?\n\nMost teams test feasibility (engineers estimate it) and usability (designers test it), and simply hope about value. Value is the one that kills features.",
      },
      {
        kind: "text",
        body: "So start by writing down what you are **assuming**. Not what you know, but what has to be true for this to work. “Teams want a shared inbox.” “Admins will invite their colleagues.” “Support can handle the extra volume.” Then plot each one by how risky it is against how much evidence you actually have. The assumptions that are high-risk and evidence-free are the only ones worth spending a fortnight on.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Assumption map: only the top-right corner is worth testing",
        code: `                 high risk
                     │
  "Admins will       │   "Teams want shared
   invite their      │    approvals at all"     ← test this
   colleagues"       │
─────────────────────┼─────────────────────
  "Engineers can     │   "Our auth supports
   build it in       │    multi-seat billing"
   a quarter"        │
                     │
                 low risk
    no evidence ◄────┴────► strong evidence`,
      },
      {
        kind: "text",
        body: "Then run the smallest thing that could **change your mind**, often called a riskiest assumption test. Not a small version of the product: a test of the belief. If the assumption is “teams will pay for this”, a landing page with a real price and a real button tests it in days. If it's “admins will invite colleagues”, look at whether they invite anyone today. An MVP is a small product; this is not a product at all.",
      },
      {
        kind: "callout",
        body: "**Timebox it and name the decision up front.** Two weeks, one question, and (written down before you start) what result would make you stop. Discovery without a pre-committed decision rule turns into research that confirms whatever the team already wanted to build.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A team estimates the build, runs a usability test on the prototype, and ships. Six weeks later almost nobody uses it. Which risk went untested?",
        options: ["Feasibility", "Usability", "Value", "Business viability"],
        answer: 2,
        explanation:
          "They confirmed they could build it and that people could operate it. Nobody checked whether anyone wanted it. Usability testing answers “can they use it” and is routinely mistaken for evidence of demand.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "You have four assumptions. Which should the next two weeks go on?",
        options: [
          "The one that is quickest to test",
          "The one the team disagrees about most loudly",
          "All four, briefly",
          "The one that is both high-risk and has no evidence behind it",
        ],
        answer: 3,
        explanation:
          "Risk times ignorance is where the value of a test lives. The quickest test is often the one you already know the answer to, the loudest argument is often about something low-stakes, and spreading two weeks across four questions answers none of them.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "Which of these is a riskiest assumption test rather than a small version of the product?",
        options: [
          "Put up a pricing page with a real Buy button and count who clicks, before anything is built",
          "Build the feature for one customer segment first",
          "Ship it behind a feature flag to 5% of users",
          "Build a rough version with no styling",
        ],
        answer: 0,
        explanation:
          "It tests the belief “people will pay for this” without building the thing. The other three all require building the product first. They're useful, but they answer “does it work” after you have already spent the money.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the risk that asks whether anyone actually wants the thing. It's the one teams most often skip.",
        before: "The ",
        after: " risk",
        answer: "value",
        explanation:
          "Value risk is answered by people's behaviour, not by their enthusiasm in a meeting and not by a successful usability test.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** write down the five assumptions behind whatever your team is about to build, mark which have real evidence, and take the riskiest evidence-free one to someone outside the building.",
      },
    ],
  },

  "pm-core.spec": {
    summary:
      "One page that says what problem this solves, what is deliberately out of scope, and what is still unknown.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "A spec exists so that six people build the same thing. It is not a contract, not a design, and not a place to be comprehensive. If it runs past a page, the parts that matter stop being read, and you have written a document instead of an agreement.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The whole skeleton",
        code: `# Shared invoice approvals

Problem      Finance can't tell who approved what. Evidence:
             7 of 9 interviews, 40 support tickets last quarter.

For whom     Admins on team plans with 3+ seats. Not sole traders.

Success      Approved-invoice share ≥ 60% within 30 days.
             Guardrail: time-to-send must not rise.

Scope        Request approval, approve/reject with a note,
             a visible audit trail.

Non-goals    No approval *chains*. No per-amount thresholds.
             No Slack notifications in v1.

States       No approvers configured · awaiting approval ·
             rejected · approver left the company.

Open         Can an admin approve their own invoice?
             → Nadia, by Friday.

Rollout      10% of team-plan accounts, one week, then all.`,
      },
      {
        kind: "text",
        body: "**Non-goals is the highest-value section**, and it is the one people leave out. Every argument three weeks into a build is a scope argument, and almost all of them are avoidable by having written “no approval chains in v1” while everyone was calm. Naming what you are not doing also tells engineers what not to build for. A system that must eventually support chains is architected differently from one that must not.",
      },
      {
        kind: "text",
        body: "**Open questions belong in the spec, with a name and a date.** A spec with no open questions is either trivial or dishonest. Writing “can an admin approve their own invoice? (Nadia, Friday)” costs one line and stops the question being answered silently, in code, by whoever hits it first at 5pm.",
      },
      {
        kind: "text",
        body: "Two habits keep it useful. **Link the design, don't describe it.** Pixels belong in Figma, and a prose description of a layout will disagree with the file within a week. And **write the problem with its evidence attached**: “finance can't tell who approved what” is an assertion, while the same sentence with “7 of 9 interviews, 40 tickets” is a reason.",
      },
      {
        kind: "callout",
        body: "A spec everyone nods along to has usually not said anything. If nobody pushes back on the non-goals or the success metric, it's worth checking whether the specific commitments are actually in there.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Three weeks into the build, someone asks for approval chains. Which section should have prevented the argument?",
        options: ["Scope", "Non-goals", "Open questions", "Rollout"],
        answer: 1,
        explanation:
          "Scope lists what you are doing, which leaves everything unmentioned open to interpretation. Non-goals close the door explicitly, at the moment when nobody is under deadline pressure and the decision is cheap.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "A spec arrives with no open questions listed. What should you suspect?",
        options: [
          "It is unusually well researched",
          "It is too long",
          "The success metric is wrong",
          "The unknowns exist but haven't been written down, so they'll be resolved ad hoc during the build",
        ],
        answer: 3,
        explanation:
          "Real features have edges nobody has decided yet. Unwritten ones don't disappear. They get settled by whichever engineer reaches them first, at the least convenient moment, with no one else aware a decision was made.",
      },
      {
        kind: "mcq",
        id: "q3",
        question: "Which of these belongs in the spec rather than in the Figma file?",
        options: [
          "The padding inside the approval card",
          "The exact shade of the reject button",
          "That an approver who has left the company must still appear in the audit trail",
          "The icon used for the audit trail",
        ],
        answer: 2,
        explanation:
          "It's a rule about data and behaviour over time, which no canvas can show and which changes what gets stored. The other three are measurable from the design file, and duplicating them in prose just creates two sources of truth.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the section that says explicitly what the team is choosing not to build in this version.",
        before: "",
        after: "",
        answer: "non-goals",
        accept: ["non goals", "nongoals", "out of scope"],
        explanation:
          "Non-goals are cheap to write before the build and nearly impossible to establish halfway through it.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** take something your team is building now and write it to this skeleton, on one page. Fill in Non-goals last and out loud, with an engineer in the room. That conversation is the point of the exercise.",
      },
    ],
  },

  "pm-ship.metrics": {
    summary:
      "One number that can go down, one guardrail that must not get worse, and a baseline measured before launch.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "Pick **one** primary metric. Teams that pick four are protecting themselves: whatever happens, one of the four will have moved, and the launch can be called a success. A single number chosen before launch is a commitment, and it is the only version of this that teaches you anything.",
      },
      {
        kind: "text",
        body: "**The metric must be able to go down.** This one test eliminates most bad choices. Cumulative sign-ups, total documents created, hours of video watched all time: these only rise, so they cannot tell you whether the thing you shipped was good. Rates, shares and cohort figures can fall, which is exactly what makes them informative: *share of invoices approved within 30 days*, not *invoices approved*.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The metric written down before the flag goes on",
        code: `Primary    Share of team-plan invoices approved before sending
           Baseline  11%  (measured 4 weeks pre-launch)
           Target    ≥ 60% within 30 days of rollout

Guardrail  Median time from draft to sent
           Baseline  6 min, must not exceed 8 min

Segment    Report team-plan and enterprise separately;
           enterprise already has an external approval process.

Read on    Day 30. Not day 3.`,
      },
      {
        kind: "text",
        body: "**Every primary metric needs a guardrail**: a counter-metric that must not get worse. Almost any number can be moved by making something else worse: sign-ups rise if you remove email verification, engagement rises if you add notifications nobody asked for, approval rates rise if you make sending slower and more annoying. The guardrail is what stops a win that isn't one.",
      },
      {
        kind: "callout",
        body: "**Goodhart's law:** when a measure becomes a target, it ceases to be a good measure. The moment a number is attached to a team's quarter, people optimise it. Usually honestly, occasionally not, and almost always at the expense of something unmeasured. Guardrails and segmentation are the practical defence.",
      },
      {
        kind: "text",
        body: "Two last things. **Measure the baseline before you launch**, because afterwards you cannot. “It feels better than before” is not a result, and nobody remembers what before was. And **segment**, because an average across two groups that behave differently describes neither: a feature that delights small teams and annoys enterprise reads as “no change”.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which of these is a vanity metric for judging a feature launch?",
        options: [
          "Total documents ever created, all time",
          "Share of active teams that used the feature in week one",
          "Median time to complete the task",
          "30-day retention of teams that used it, versus those that didn't",
        ],
        answer: 0,
        explanation:
          "A cumulative all-time total can only rise, so it goes up whether the launch went well, badly or was never noticed. The other three can all get worse, which is what makes them capable of telling you something.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Sign-ups jump 40% after you remove the email verification step. Which guardrail would have caught the catch?",
        options: [
          "Total page views",
          "Share of new accounts still active after 14 days",
          "Number of sign-up form submissions",
          "Time spent on the sign-up page",
        ],
        answer: 1,
        explanation:
          "Removing verification lets bots and typo'd addresses through, so the extra accounts never come back. A retention or activation guardrail exposes that; the other three move with the vanity number or say nothing about account quality.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "The feature shipped four weeks ago and someone asks whether approval rates improved. Nobody recorded the rate beforehand. What can you honestly say?",
        options: [
          "Compare against a similar feature's numbers instead",
          "That you can report the current rate but cannot attribute any change to the launch",
          "Estimate the old rate from memory and report the difference",
          "That the launch succeeded, since the rate is above zero",
        ],
        answer: 1,
        explanation:
          "Without a baseline there is no before, so there is no change to claim. Reporting the current number and saying plainly that it isn't a comparison is the only honest option, and it's why the baseline gets measured before the flag is switched on.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Name the secondary metric that must not get worse while you move the primary one.",
        before: "The ",
        after: " metric",
        answer: "guardrail",
        accept: ["counter", "counter-metric", "guard rail"],
        explanation:
          "A guardrail (or counter-metric) is how you tell a real improvement from one bought by damaging something you weren't watching.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** for the next thing your team ships, write the primary metric, its guardrail and today's baseline on one line each, before the launch. Then agree the date you'll read it, and don't read it earlier.",
      },
    ],
  },

  "pm-core.prioritise": {
    summary:
      "Score options with RICE to make the trade-offs visible, then treat the score as the start of the argument, not the end of it.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "Every team has more good ideas than capacity. Without a method, the backlog gets ordered by who asked loudest, who asked last, or who is most senior. A scoring model doesn't make the decision for you. What it does is make everyone's assumptions **visible and comparable**, so the argument is about “do we really think this reaches 2,000 people?” rather than “I just feel it's more important”.",
      },
      {
        kind: "text",
        body: "The most widely used model is **RICE**, from Intercom. Score each idea on four things:\n\n- **Reach**: how many people or events it affects in a set period, such as customers per quarter.\n- **Impact**: how much it moves the goal for each of them, on a fixed scale: 3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal.\n- **Confidence**: how sure you are of the other estimates: 100% high, 80% medium, 50% low.\n- **Effort**: total team time, usually in person-months.\n\nThe score is **Reach × Impact × Confidence ÷ Effort**: value per unit of work, discounted by how much you're guessing.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Three ideas, scored",
        code: `Idea                     Reach/qtr  Impact  Confidence  Effort  RICE
───────────────────────  ─────────  ──────  ──────────  ──────  ─────
Bulk invoice export          500       2        80%         1     800
Approval workflow          2,000       1        50%         4     250
Reminder emails            3,000     0.5       100%       0.5   3,000`,
      },
      {
        kind: "text",
        body: "**Confidence is the most useful column.** It's where the model punishes ideas nobody has evidence for. If an idea's score depends on 50% confidence, the best next step is often not to build it, but to run the discovery that raises or lowers that number, as in the discovery lesson.",
      },
      {
        kind: "callout",
        body: "**Know what the score can't see.** RICE has no column for strategy (a low-reach feature that wins a key market), dependencies (B is worthless until A exists), or obligations (legal, security, a contract promise). Its numbers also look more precise than they are. Use the ranking to start the conversation, and write down why you overrode it when you do.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "An idea reaches 2,000 customers a quarter, has impact 1, confidence 80% and takes 4 person-months. What is its RICE score?",
        before: "",
        after: "",
        answer: "400",
        explanation:
          "2,000 × 1 × 0.8 ÷ 4 = 400. Write the confidence as a fraction (0.8), not as 80, or every score is a hundred times too big.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "An exciting idea scores high on reach and impact, but nobody has talked to a customer about it, so confidence is 50%. What's the most useful next step?",
        options: [
          "Build it, because its reach and impact are high",
          "Score confidence at 100% since the team is excited",
          "Drop it, because low confidence means a bad idea",
          "Run a short discovery test to find out whether the reach and impact estimates hold up",
        ],
        answer: 3,
        explanation:
          "Low confidence means you don't know, not that it's bad. A cheap test either raises the score with evidence or saves you from building it. Raising confidence because of enthusiasm defeats the column's purpose.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which situation is RICE worst at handling?",
        options: [
          "Choosing between three similar improvements to the same product",
          "A feature with low reach that's required to close a contract with your largest customer",
          "Ideas that differ a lot in effort",
          "Ideas with different levels of evidence",
        ],
        answer: 1,
        explanation:
          "Contractual, legal and strategic obligations aren't captured by reach or impact. RICE handles the other three well: comparing like with like, weighing effort, and discounting by confidence.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** score the top five items in your backlog with RICE. Then look at where your gut ranking and the score disagree, and write one sentence explaining each disagreement. Those sentences are your real strategy.",
      },
    ],
  },

  "pm-team.roadmap": {
    summary:
      "Build a roadmap of problems to solve, more certain near-term than long-term, that communicates direction without promising dates you can't keep.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "A roadmap is a communication tool. Its job is to tell the team, the company and sometimes customers **where the product is heading and why**. The classic failure is the feature-and-date Gantt chart: twelve features with twelve delivery dates, a year out. It's out of date within a month, every slip feels like a broken promise, and it commits the team to solutions before anyone has learned whether they solve anything.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Now, Next, Later: certainty drops as you look further out",
        code: `NOW (committed, in progress)
  Finance can see who approved each invoice
    → measured by: approved-invoice share

NEXT (likely, being explored)
  Invoices get paid faster
    → candidates: reminder emails, card payments on invoice

LATER (direction, not commitment)
  Small teams run all their billing here
    → open: multi-currency, accountant access`,
      },
      {
        kind: "text",
        body: "Two changes make a roadmap honest. **Write outcomes, not outputs**: “invoices get paid faster” instead of “build reminder emails”. That leaves the team free to find the best way to get there, and makes it obvious when something shipped but didn't work. And **let certainty fade with distance**. A Now/Next/Later format says plainly that this quarter is committed, next quarter is likely and anything after is direction. Put a date on an item only when something outside the team really depends on it, such as a regulation, a contract, or a conference launch.",
      },
      {
        kind: "text",
        body: "**Different audiences need different views** of the same roadmap. Engineers need the Now column in detail. Sales wants to know what they can talk to customers about, which usually means Now only, because promising Later items to customers turns them into commitments. Executives want to see how the roadmap connects to company goals.",
      },
      {
        kind: "callout",
        body: "**A roadmap that never changes is a warning sign.** If learning from discovery and launches never moves anything, the team either isn't learning or isn't allowed to act on it. Review it on a regular schedule, monthly or quarterly, and say what changed and why.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which roadmap item is written as an outcome rather than an output?",
        options: [
          "Build a reminder email feature",
          "Fewer invoices are paid late",
          "Redesign the invoice page",
          "Integrate with Stripe",
        ],
        answer: 1,
        explanation:
          "It describes the change you want in the world, which several solutions could deliver and which you can measure. The others name a specific thing to build, and could all ship without improving anything.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "When should a roadmap item carry a firm date?",
        options: [
          "Always, so the team stays accountable",
          "Never; dates are always harmful",
          "When something outside the team depends on it, such as a legal deadline or a contract",
          "Only for items in the Later column",
        ],
        answer: 2,
        explanation:
          "Dates are commitments, and commitments are worth making when someone else is relying on them. Elsewhere, a date is a guess that gets treated as a promise.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "A salesperson wants to show customers the whole roadmap, including the Later column. What's the risk?",
        options: [
          "Customers will hear Later items as promises, and the team loses the freedom to change them",
          "Customers won't understand the format",
          "The Later items will be copied by competitors",
          "There is no risk; transparency is always good",
        ],
        answer: 0,
        explanation:
          "Once a customer has been told about something, dropping it feels like breaking a promise, even if it was labelled as direction. Share Now openly and Later carefully.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** rewrite your team's current roadmap into Now, Next and Later, with each item as an outcome and the measure beside it. Notice which items you can't phrase as an outcome: they may not have a reason yet.",
      },
    ],
  },

  "pm-team.stakeholders": {
    summary:
      "Get decisions made and keep them made: understand what each stakeholder needs, agree before the meeting, and say no with a reason.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "Product managers rarely have authority over the people whose agreement they need: engineering, design, sales, support, finance, leadership. The work gets done through **trust and clarity**. That means knowing what each person cares about, keeping them informed before they have to ask, and making decisions in a way that stays decided.",
      },
      {
        kind: "text",
        body: "Start by mapping who matters for a decision and how. A simple grid of **influence** (can they change or block it?) against **interest** (are they affected?) tells you how to spend your time. High-influence, high-interest people get involved early and often. High-influence, low-interest people get short updates and no surprises. Low-influence, high-interest people, often support and sales, get kept informed, and are frequently your best source of evidence.",
      },
      {
        kind: "text",
        body: "**Don't surprise anyone in a meeting.** If a decision affects someone with influence, talk to them one-to-one first. You'll hear their objections when they can be handled, they'll arrive having already thought it through, and the meeting can confirm a decision rather than start an argument. Then **write the decision down**: what was decided, why, what else was considered, and who agreed. A two-paragraph note in a shared place stops the same discussion happening again in a month.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Saying no, with a reason and a way back",
        code: `"Not this quarter. Our goal is to get invoices paid faster, and
bulk export doesn't move that. If the large accounts you mentioned
are at risk of leaving over it, bring me the names and I'll weigh
it against the reminders work next week."`,
      },
      {
        kind: "text",
        body: "**Saying no is most of the job**, and how you say it decides whether people keep bringing you ideas. Tie the no to the shared goal, not to your preference. Say what would change your answer, so “no” means “not with what we know now”. And thank people for the request: the next one might be the one that matters.",
      },
      {
        kind: "callout",
        body: "**Disagree and commit** works in both directions. Once a decision is made, with the dissent heard and recorded, everyone works to make it succeed, including the people who argued against it. If you're the one overruled, say so once, clearly, and then help.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You need the head of sales to agree to drop a feature they asked for. When should they first hear about it?",
        options: [
          "In the quarterly planning meeting, with everyone else",
          "In a one-to-one conversation before the meeting",
          "In the release notes",
          "When their customers ask about it",
        ],
        answer: 1,
        explanation:
          "A one-to-one lets them raise objections privately and early, while you can still address them. Hearing it for the first time in a group meeting forces them to defend their position in public.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which is the most effective way to decline a feature request?",
        options: [
          "“That's not a priority for us.”",
          "“Maybe later.”",
          "“Let's add it to the backlog.” (with no plan to look at it)",
          "“Not this quarter, because it doesn't move our goal of faster payments. If the accounts asking for it are at risk, bring me details and I'll reconsider.”",
        ],
        answer: 3,
        explanation:
          "It ties the no to a shared goal and says what evidence would change it. The other three are vague or quietly bury the request, which teaches people to go around you next time.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "The same debate about pricing tiers keeps restarting every few weeks. What's most likely missing?",
        options: [
          "A written record of the decision, the reasons and the options rejected",
          "A more senior person in the room",
          "A longer meeting",
          "A new pricing model",
        ],
        answer: 0,
        explanation:
          "Without a record, people remember the decision differently, newcomers never knew it, and any doubt reopens the whole thing. A short written decision note settles what was decided and why.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** list the five people whose agreement your next decision needs, and place each on the influence and interest grid. Talk to the high-influence ones before any group meeting.",
      },
    ],
  },

  "pm-ship.launch": {
    summary:
      "Release in stages behind a flag, watch the guardrails, and know in advance what would make you turn it off.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "Shipping to everyone at once is the riskiest possible way to learn whether something works. A **staged rollout** spreads that risk out: first the team itself, then a small share of real users, then more, watching the numbers at each step. Most teams do this with a **feature flag**, a switch in configuration that turns the feature on for chosen users without a new deploy, and off again in seconds.",
      },
      {
        kind: "code",
        language: "text",
        caption: "A rollout plan, written before launch day",
        code: `Stage 1  Internal team only            3 days
Stage 2  5% of team-plan accounts      1 week
Stage 3  50%                           1 week
Stage 4  Everyone

Watch      approved-invoice share (primary)
           time-to-send, error rate, support tickets (guardrails)
Roll back  if error rate > 1% or time-to-send rises > 2 min
Owner      Priya (on call during each stage change)`,
      },
      {
        kind: "text",
        body: "**Decide the rollback rule before you start.** On launch day, with the team proud of the work, every bad number looks like noise. Writing down beforehand “if the error rate goes above 1%, we turn it off” turns a judgement made under pressure into a check. The kill switch only helps if someone is watching and allowed to use it.",
      },
      {
        kind: "text",
        body: "Some decisions are easy to reverse and some aren't. A UI change behind a flag can be turned off in seconds. A database migration that deletes a column, a pricing change customers have been emailed about, or a public API others have built on can't be undone cleanly. **Move fast on reversible decisions and slowly on irreversible ones**: the latter need more review, a longer rollout and a plan for the people affected.",
      },
      {
        kind: "callout",
        body: "**Launch is not just the code.** Before the flag reaches real users: support knows what's changing and has answers ready, help pages are updated, sales knows what they can promise, and the people who'll see a change in their workflow have been told. A feature that surprises the support team becomes a pile of tickets.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "At 5% rollout, the error rate rises from 0.2% to 1.4%. The plan says roll back above 1%. The team thinks it's probably a coincidence. What should happen?",
        options: [
          "Continue to 50% to gather more data",
          "Wait a week and look again",
          "Roll back as planned, then investigate",
          "Ignore it, because 5% of users is too small a sample",
        ],
        answer: 2,
        explanation:
          "The point of a pre-agreed rule is that it holds when the team would rather it didn't. Rolling back costs little; carrying on risks spreading a real problem to ten times as many people.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which change needs the slowest, most careful rollout?",
        options: [
          "A new layout for the settings page, behind a flag",
          "A change in the colour of the primary button",
          "Re-wording an empty state",
          "Removing a public API field that partners' integrations read",
        ],
        answer: 3,
        explanation:
          "Once partners' code breaks, you can't take it back by flipping a flag: their systems fail until they change them. The other three are reversible in seconds.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the configuration switch that turns a feature on for chosen users without a new deploy.",
        before: "A feature ",
        after: "",
        answer: "flag",
        accept: ["toggle", "switch"],
        explanation:
          "Feature flags separate deploying code from releasing it, which is what makes staged rollouts and fast rollbacks possible.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** for the next thing you ship, write a rollout plan like the one above: stages, what you'll watch, the rollback rule and who owns it. Share it with support before stage two.",
      },
    ],
  },

  "pm-ship.experiments": {
    summary:
      "Run an A/B test you can trust: decide the sample size and the decision rule first, then don't peek, and check the split before believing the result.",
    xp: 150,
    blocks: [
      {
        kind: "callout",
        body: "The statistics of comparing groups (rates, not counts, and Simpson's paradox) are in *Data Analytics Toolkit → Comparisons that hold up*. This lesson is the product manager's side: setting a test up so its result means something, and the ways teams fool themselves when reading it.",
      },
      {
        kind: "text",
        body: "An A/B test shows a random half of users the change and the other half the current version, then compares one metric. It's the most reliable way to know whether a change *caused* an improvement. It's also easy to run in a way that produces confident nonsense. Almost all of the mistakes happen before the test starts or while it's running, not in the maths at the end.",
      },
      {
        kind: "text",
        body: "**Write the plan before you start**: the hypothesis, the primary metric and its guardrail, the smallest change worth detecting, and the decision you'll make for each result. The smallest worthwhile change decides the **sample size**: detecting a 1-point change in conversion takes far more users than detecting a 5-point one. Use a sample size calculator, and run for **whole weeks**, because Monday's users behave differently from Saturday's.",
      },
      {
        kind: "text",
        body: "**Don't peek and stop early.** Results swing randomly at the start. If you check every day and stop the first time the result looks significant, you'll “find” winners that are really noise far more often than the 5% your significance level promised. Decide the end date, and read the result then. (Some testing tools use sequential methods designed for continuous monitoring; follow their rules, not your impatience.)",
      },
      {
        kind: "code",
        language: "text",
        caption: "Check the split before you read the result",
        code: `Planned split   50 / 50
Actual users    A 51,840   B 48,160   (51.8% / 48.2%)

With 100,000 users, a gap this big almost never happens by chance.
Something is losing B users: a redirect, a crash, a bot filter.
Don't read the result. Find the bug.`,
      },
      {
        kind: "text",
        body: "Two more checks. **Sample ratio mismatch**: if you planned a 50/50 split and got something noticeably different on a large sample, the assignment is broken and the result can't be trusted, whatever it says. And the **novelty effect**: people click on anything new for the first few days. A result driven entirely by week one often fades.",
      },
      {
        kind: "callout",
        body: "**“Not significant” doesn't mean “no effect”.** It means this test couldn't tell. If the test was too small to detect the change you care about, a flat result is inconclusive, not proof that the idea failed. That's why the sample size is decided from the smallest change worth detecting, up front.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A test planned for two weeks shows B ahead with p < 0.05 on day three. The team wants to stop and ship B. What's the problem?",
        options: [
          "Early results swing randomly; stopping the first time it looks significant greatly increases the chance of a false winner",
          "p < 0.05 is too strict a threshold",
          "Three days is long enough; there's no problem",
          "B should be shipped only if it's still ahead tomorrow",
        ],
        answer: 0,
        explanation:
          "Checking repeatedly and stopping at the first significant reading gives chance many opportunities to look like a result. Run to the planned end, which also covers full weekly cycles.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A 50/50 test has 120,000 users: 63,000 in A and 57,000 in B. What should you do before reading the result?",
        options: [
          "Nothing; small differences in group size are normal",
          "Weight B's results up to match A's size",
          "Investigate the assignment, because a split this uneven on this many users points to a bug",
          "Remove the extra users from A at random",
        ],
        answer: 2,
        explanation:
          "That's a 52.5/47.5 split on 120,000 users, far outside random variation. Something is dropping or misassigning users, and whatever it is may also be what's driving the difference in results.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "A test was sized to detect a 5-point change, but you care about anything above 1 point. It ends with no significant difference. What can you conclude?",
        options: [
          "The change has no effect",
          "The change made things worse",
          "The test proves a 1-point improvement",
          "Very little: the test was too small to detect the effect you care about",
        ],
        answer: 3,
        explanation:
          "An underpowered test can easily miss a real 1-point effect. The result is inconclusive. To answer the question, you'd need a test sized for the smallest change that matters.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the problem where the groups in a test end up a noticeably different size from the planned split.",
        before: "Sample ratio ",
        after: "",
        answer: "mismatch",
        explanation:
          "Sample ratio mismatch means assignment or tracking is broken. Fix it before trusting any result from the test.",
      },
      {
        kind: "callout",
        body: "**Do it this week:** for the next test your team runs, write the hypothesis, the metric, the guardrail, the smallest change worth detecting, the end date and the decision for each outcome on one page, before it starts.",
      },
    ],
  },
};
