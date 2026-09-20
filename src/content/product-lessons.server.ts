import type { LessonBody } from "./lessons";

/**
 * Product Management Craft.
 *
 * The three decisions a product manager is actually accountable for: what is
 * worth building, what the team agreed to build, and how anyone will know
 * afterwards whether it worked. Each lesson is assessed rather than attested —
 * the judgements here have right and wrong answers often enough to check.
 */
export const productLessonBodies: Record<string, LessonBody> = {
  "pm-core.discovery": {
    summary:
      "Find the assumption that would change your mind, and test that one — in two weeks, not two quarters.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "Discovery is not a phase before the real work. It is the habit of finding out whether the thing you're about to build is worth building, continuously, while you build other things. Teresa Torres's phrase for it is *continuous discovery*, and the practical version is small: every week, some contact with the people who have the problem.",
      },
      {
        kind: "text",
        body: "Marty Cagan's framing of what can go wrong is the most useful checklist here. Any idea carries four risks:\n\n- **Value** — will anyone want it?\n- **Usability** — can they work out how to use it?\n- **Feasibility** — can we build it?\n- **Business viability** — does it work for us legally, commercially, operationally?\n\nMost teams test feasibility (engineers estimate it) and usability (designers test it), and simply hope about value. Value is the one that kills features.",
      },
      {
        kind: "text",
        body: "So start by writing down what you are **assuming**. Not what you know — what has to be true for this to work. “Teams want a shared inbox.” “Admins will invite their colleagues.” “Support can handle the extra volume.” Then plot each one by how risky it is against how much evidence you actually have. The assumptions that are high-risk and evidence-free are the only ones worth spending a fortnight on.",
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
        body: "Then run the smallest thing that could **change your mind** — often called a riskiest assumption test. Not a small version of the product: a test of the belief. If the assumption is “teams will pay for this”, a landing page with a real price and a real button tests it in days. If it's “admins will invite colleagues”, look at whether they invite anyone today. An MVP is a small product; this is not a product at all.",
      },
      {
        kind: "callout",
        body: "**Timebox it and name the decision up front.** Two weeks, one question, and — written down before you start — what result would make you stop. Discovery without a pre-committed decision rule turns into research that confirms whatever the team already wanted to build.",
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
          "The one that is both high-risk and has no evidence behind it",
          "All four, briefly",
        ],
        answer: 2,
        explanation:
          "Risk times ignorance is where the value of a test lives. The quickest test is often the one you already know the answer to, the loudest argument is often about something low-stakes, and spreading two weeks across four questions answers none of them.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "Which of these is a riskiest assumption test rather than a small version of the product?",
        options: [
          "Build the feature for one customer segment first",
          "Put up a pricing page with a real Buy button and count who clicks, before anything is built",
          "Ship it behind a feature flag to 5% of users",
          "Build a rough version with no styling",
        ],
        answer: 1,
        explanation:
          "It tests the belief “people will pay for this” without building the thing. The other three all require building the product first — they're useful, but they answer “does it work” after you have already spent the money.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the risk that asks whether anyone actually wants the thing — the one teams most often skip.",
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
        body: "**Non-goals is the highest-value section**, and it is the one people leave out. Every argument three weeks into a build is a scope argument, and almost all of them are avoidable by having written “no approval chains in v1” while everyone was calm. Naming what you are not doing also tells engineers what not to build for — a system that must eventually support chains is architected differently from one that must not.",
      },
      {
        kind: "text",
        body: "**Open questions belong in the spec, with a name and a date.** A spec with no open questions is either trivial or dishonest. Writing “can an admin approve their own invoice? — Nadia, Friday” costs one line and stops the question being answered silently, in code, by whoever hits it first at 5pm.",
      },
      {
        kind: "text",
        body: "Two habits keep it useful. **Link the design, don't describe it** — pixels belong in Figma, and a prose description of a layout will disagree with the file within a week. And **write the problem with its evidence attached**: “finance can't tell who approved what” is an assertion, while the same sentence with “7 of 9 interviews, 40 tickets” is a reason.",
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
          "The unknowns exist but haven't been written down, so they'll be resolved ad hoc during the build",
          "It is too long",
          "The success metric is wrong",
        ],
        answer: 1,
        explanation:
          "Real features have edges nobody has decided yet. Unwritten ones don't disappear — they get settled by whichever engineer reaches them first, at the least convenient moment, with no one else aware a decision was made.",
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
        body: "**The metric must be able to go down.** This one test eliminates most bad choices. Cumulative sign-ups, total documents created, hours of video watched all time — these only rise, so they cannot tell you whether the thing you shipped was good. Rates, shares and cohort figures can fall, which is exactly what makes them informative: *share of invoices approved within 30 days*, not *invoices approved*.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The metric written down before the flag goes on",
        code: `Primary    Share of team-plan invoices approved before sending
           Baseline  11%  (measured 4 weeks pre-launch)
           Target    ≥ 60% within 30 days of rollout

Guardrail  Median time from draft to sent
           Baseline  6 min — must not exceed 8 min

Segment    Report team-plan and enterprise separately;
           enterprise already has an external approval process.

Read on    Day 30. Not day 3.`,
      },
      {
        kind: "text",
        body: "**Every primary metric needs a guardrail** — a counter-metric that must not get worse. Almost any number can be moved by making something else worse: sign-ups rise if you remove email verification, engagement rises if you add notifications nobody asked for, approval rates rise if you make sending slower and more annoying. The guardrail is what stops a win that isn't one.",
      },
      {
        kind: "callout",
        body: "**Goodhart's law:** when a measure becomes a target, it ceases to be a good measure. The moment a number is attached to a team's quarter, people optimise it — usually honestly, occasionally not, and almost always at the expense of something unmeasured. Guardrails and segmentation are the practical defence.",
      },
      {
        kind: "text",
        body: "Two last things. **Measure the baseline before you launch**, because afterwards you cannot — “it feels better than before” is not a result, and nobody remembers what before was. And **segment**, because an average across two groups that behave differently describes neither: a feature that delights small teams and annoys enterprise reads as “no change”.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which of these is a vanity metric for judging a feature launch?",
        options: [
          "Share of active teams that used the feature in week one",
          "Total documents ever created, all time",
          "Median time to complete the task",
          "30-day retention of teams that used it, versus those that didn't",
        ],
        answer: 1,
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
          "Without a baseline there is no before, so there is no change to claim. Reporting the current number and saying plainly that it isn't a comparison is the only honest option — and it's why the baseline gets measured before the flag is switched on.",
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
        body: "**Do it this week:** for the next thing your team ships, write the primary metric, its guardrail and today's baseline on one line each — before the launch. Then agree the date you'll read it, and don't read it earlier.",
      },
    ],
  },
};
