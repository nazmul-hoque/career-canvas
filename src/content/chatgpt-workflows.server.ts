/**
 * Level 5 of the ChatGPT course: packaging repeatable work.
 *
 * Ten task specs merged into four lessons. The load-bearing idea here is the
 * one the old level stated in a safety note nobody read twice: an instruction
 * saying "read only" is not a read-only permission.
 */
import type { AuthoredLesson } from "./authored-lesson";
import { ATTESTED_XP } from "./gamification";

const REFERENCE =
  "Get started with ChatGPT Work · https://learn.chatgpt.com/docs/get-started-with-work";

export const chatgptWorkflowsLessons: AuthoredLesson[] = [
  {
    slug: "what-repeats",
    title: "Finding what repeats, and naming its inputs",
    minutes: 16,
    type: "practice",
    body: {
      summary: "Separate the stable steps from the variable ones, then define what's required.",
      xp: 120,
      blocks: [
        {
          kind: "text",
          body: "A workflow is worth building once you've done something twice and expect to again. The first move is separating what stays the same from what changes: turning event notes into a volunteer brief has stable steps (extract timings, assign owners, list unknowns) and variable inputs, which are the notes themselves.",
        },
        {
          kind: "text",
          body: "Write those two lists down separately. The stable half becomes your instructions; the variable half becomes the slots you fill each run. Most failed templates are failed because something variable got written into the stable half: a venue name, a date, an assumption about how many volunteers there are.",
        },
        {
          kind: "text",
          body: '**Then define the input contract.** Which fields are required, and (the question people skip) what should happen when one is missing? A time, an owner and a venue are not equally optional, and "do your best" is not a policy.',
        },
        {
          kind: "text",
          body: 'The default without a stated policy is invention, because you asked for a brief and a brief has a venue in it. Say explicitly: if the venue is missing, stop and ask for it; if an owner is missing, write "unassigned" and list it under open questions. Different fields can have different rules. That\'s the point of writing them down.',
        },
        {
          kind: "callout",
          body: "**Practice.** Choose a task you've genuinely done twice and write what repeats beside what changes each run. Then list the required fields for your volunteer brief and decide, field by field, what should happen when a time, an owner or a venue is missing, including which ones should stop the run entirely.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            "Your template produces good briefs for the community hall and odd ones everywhere else. What's the likely cause?",
          options: [
            {
              text: "The instructions are too general to handle a second venue",
              whyNot:
                "Too general would fail everywhere, including the hall. Working well in one place and oddly elsewhere points to something too specific.",
            },
            "Something variable, like a venue detail or assumption, got written into the stable instructions",
            {
              text: "The input notes for other venues are lower quality",
              whyNot:
                "Blaming the inputs skips the pattern: the one venue that works is the one the template was built on. Look at what came along from that first run.",
            },
            {
              text: "The template needs a second example to learn from",
              whyNot:
                "A template doesn't learn from examples between runs. The fix is to find what the first run left behind in the instructions.",
            },
          ],
          answer: 1,
          explanation:
            "This is the classic template defect: a specific fact from the first run hardened into a rule. It only shows up on a genuinely different second case, which is why running one is the test that matters.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Why specify behaviour for a missing field rather than leaving it unstated?",
          options: [
            {
              text: "Unstated fields cause an error that stops the run",
              whyNot:
                "Nothing stops. That's the problem: the run carries on and produces a complete-looking brief whether or not the field was supplied.",
            },
            "Because the default when nothing is stated is to invent a plausible value",
            {
              text: "Because the field will be silently omitted from the output",
              whyNot:
                "Silent omission would at least leave a visible gap. What tends to happen is worse, because you asked for a complete brief.",
            },
            {
              text: "To make the template easier for someone else to read",
              whyNot:
                "Readability is a side benefit. The real reason is what happens at run time when a field is absent and no rule says what to do.",
            },
          ],
          answer: 1,
          explanation:
            'You asked for a complete brief, so a complete brief is what gets produced, gap included. Naming the behaviour per field is what turns that into a stop-and-ask or an explicit "unassigned".',
        },
      ],
    },
  },
  {
    slug: "template",
    title: "Writing a template that survives a second case",
    minutes: 20,
    type: "practice",
    body: {
      summary: "Four sections, one honest second test, and a run that refuses to guess.",
      xp: 140,
      blocks: [
        {
          kind: "text",
          body: "A reusable prompt has four sections: **inputs** (what you paste in), **instructions** (the stable steps), **output format** (what comes back), and **checks** (what must be true before it claims to be done). Save it somewhere you control. A note on your own machine works regardless of what your account offers.",
        },
        {
          kind: "code",
          language: "text",
          caption: "The skeleton",
          code: `INPUTS
  Event notes: <paste>
  Venue: <required; if missing, stop and ask>
  Date: <required>

INSTRUCTIONS
  1. Extract every timing and its owner.
  2. Mark any task with no owner as "unassigned".
  3. List anything the notes leave unresolved.

OUTPUT
  One page: Timings | Owners | Open questions

CHECKS
  - Every note is accounted for somewhere in the output.
  - No time or name appears that isn't in the notes.
  - Missing required inputs stopped the run instead of
    being filled in.`,
        },
        {
          kind: "text",
          body: 'The **checks** section is what separates a template from a long prompt. Without it, "done" means the output looks finished. With it, there are stated conditions, and you can run them yourself even if the template doesn\'t.',
        },
        {
          kind: "text",
          body: "**Then test it on a second, different event.** Not a variation on the first, but a genuinely different one. Every assumption inherited from example one will surface here, and that's the point of the exercise rather than a sign you wrote it badly.",
        },
        {
          kind: "text",
          body: "**And test a missing input on purpose.** Remove the venue and run it. Did it stop and ask, as the contract says, or did it produce a brief with a plausible venue in it? This is the single most informative test you can run on a template, because it tells you whether your stated policy is actually doing anything.",
        },
        {
          kind: "callout",
          body: "**Practice.** Write the template with all four sections, save it locally, and run it once with complete fictional data. Reuse it verbatim for a different fictional event and revise whatever assumption came along from the first. Then remove the venue from the second scenario, run it again, and confirm it asks for the venue instead of inventing one.",
        },
        {
          kind: "mcq",
          id: "q1",
          question: "What does the checks section add that detailed instructions don't?",
          options: [
            {
              text: "A shorter, more readable template",
              whyNot:
                "Checks make a template longer, not shorter. They earn their place by what they let you test.",
            },
            {
              text: "A way for ChatGPT to correct its own errors automatically",
              whyNot:
                "Checks don't make anything correct itself. They're conditions you can run yourself, whether or not the template does.",
            },
            {
              text: "Compatibility with accounts that lack saved instructions",
              whyNot:
                "Where the template is saved is a separate question. Checks are about knowing when the work is genuinely finished.",
            },
            "Stated conditions for completion, instead of 'done' meaning the output looks finished",
          ],
          answer: 3,
          explanation:
            "Instructions describe the work; checks describe the finish line. It's the difference between a claim of completion and a claim you can test, and you can run the checks yourself either way.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Why is deliberately removing a required input the most informative test?",
          options: [
            {
              text: "It exercises the error-handling path, which is rarely used",
              whyNot:
                "Rarity isn't what makes it informative. It's that this path is where a stated policy either changes the outcome or turns out to be just a sentence.",
            },
            "It shows whether your stated missing-input policy actually changes the behaviour",
            {
              text: "It's faster than running a full scenario",
              whyNot:
                "It isn't about speed. A full run with complete data can't tell you whether your missing-input rule does anything.",
            },
            {
              text: "It reveals which inputs the template genuinely needs",
              whyNot:
                "You already decided which inputs are required when you wrote the contract. The test checks whether that decision is honoured.",
            },
          ],
          answer: 1,
          explanation:
            "A policy in a template is a sentence until something tests it. The failure it exposes (a confident brief containing a venue nobody supplied) is exactly the one that would go unnoticed in normal use.",
        },
      ],
    },
  },
  {
    slug: "review-tools-and-boundaries",
    title: "Separate review, connected tools, and the approval boundary",
    minutes: 22,
    type: "practice",
    body: {
      summary:
        "A second pair of eyes, a clear look at what a tool can touch, and a hard line before sending.",
      xp: 150,
      blocks: [
        {
          kind: "text",
          body: "**Draft and review in separate conversations.** A conversation that produced a brief is a poor judge of it. The reasoning that made the choices is still in view, so the choices look justified. A fresh chat given only the source inputs and a rubric is genuinely checking.",
        },
        {
          kind: "text",
          body: "Then treat the reviewer as what it is: another fallible model. Take its findings one at a time and decide accept or reject against the source yourself. A reviewer that flags a missing owner is right or wrong about a fact you can check in ten seconds, and reviewers invent problems as readily as drafters invent facts.",
        },
        {
          kind: "text",
          body: "**Connected tools change the stakes**, because now something can reach real data. Before granting anything, read what an integration says it reads and what it can change, and write the two lists down. Do this without granting new access. Inspecting a description costs nothing and is the only moment you're deciding freely. If your account has no integrations, design a mock one on paper; the reasoning is the transferable part.",
        },
        {
          kind: "text",
          body: '**Here is the sentence to carry out of this level.** Writing "read only" in your prompt is not a read-only permission. Instructions describe desired behaviour; they do not enforce access control. If an integration is authorised to write, then the thing standing between it and a write is a sentence, and you already know from Level 3 that a sentence can be argued with by text arriving from outside. **The scope you granted is the boundary; the prompt is a preference.**',
        },
        {
          kind: "text",
          body: "So draw the **approval boundary** explicitly. Two columns: what the workflow may prepare on its own, and what requires you. Preparation (drafting, extracting, summarising, proposing) is the whole left column. Sending, publishing, deleting and anything a stranger will see belongs on the right, always.",
        },
        {
          kind: "callout",
          body: "**Practice.** Draft a brief in one conversation and check it in another using only the source inputs and a rubric, then accept or reject each finding yourself against the source. Inspect one available integration's description and permissions without granting access, recording what it reads and what it can change, or specify a clearly labelled mock. With an already-authorised practice connection, retrieve one named non-sensitive note and verify its identity, or paste a labelled fictional note and do the same check by hand. Then write your boundary table and rehearse asking the workflow to email the draft, confirming it returns a draft for review instead.",
        },
        {
          kind: "mcq",
          id: "q1",
          question:
            'Your prompt says "only read data, never modify anything", and the connected tool is authorised to write. How protected are you?',
          options: [
            {
              text: "Fully, because the instruction governs what the tool does",
              whyNot:
                "An instruction describes what you'd like; it doesn't enforce anything. With write access granted, the write is still possible.",
            },
            {
              text: "Mostly: the instruction holds unless the tool malfunctions",
              whyNot:
                "The risk isn't a malfunction. A working tool following persuasive text from a page can write, because it's allowed to.",
            },
            "Not really: the granted scope is the boundary, and the instruction is a preference that text from outside can argue with",
            {
              text: "It depends whether the tool supports read-only mode",
              whyNot:
                "Whether the tool has a read-only mode only matters if you use it when granting access. As granted here, it can write.",
            },
          ],
          answer: 2,
          explanation:
            "Instructions describe desired behaviour; scopes enforce it. With write access granted, a write is one persuasive input away, and Level 3 showed where persuasive inputs come from. Narrow the grant rather than describing the restraint.",
        },
        {
          kind: "mcq",
          id: "q2",
          question: "Why review a draft in a different conversation from the one that produced it?",
          options: [
            "The reasoning behind the choices is still in view, so the choices look justified",
            {
              text: "The original conversation has used too much context",
              whyNot:
                "Running out of space isn't the issue, even in a short conversation. The problem is what the reviewer can already see when it judges.",
            },
            {
              text: "A new conversation uses a fresher version of the model",
              whyNot:
                "A new conversation doesn't get a different model. What changes is what's in view while it judges the draft.",
            },
            {
              text: "It prevents the draft from being edited during review",
              whyNot:
                "Editing during review isn't the risk. A reviewer that saw the reasoning behind each choice will find the choices reasonable.",
            },
          ],
          answer: 0,
          explanation:
            "Reviewing your own work is hard for the same reason in people and models: the justification is right there. A reviewer holding only the inputs and the rubric has to judge the output on its own terms.",
        },
        {
          kind: "mcq",
          id: "q3",
          question: "Which belongs on the 'requires my approval' side of the boundary?",
          options: [
            {
              text: "Extracting timings from notes",
              whyNot:
                "Extracting produces something you read and can throw away. Nothing leaves your hands, so it can sit on the prepare-on-its-own side.",
            },
            {
              text: "Drafting a volunteer brief",
              whyNot:
                "A draft is exactly what the workflow may prepare alone: you read it before anyone else does.",
            },
            {
              text: "Listing open questions for follow-up",
              whyNot:
                "Listing questions produces something for you to read. It reaches nobody else and can be discarded, so it doesn't need your sign-off.",
            },
            "Emailing the brief to the volunteers",
          ],
          answer: 3,
          explanation:
            "The first three produce something you can read and discard. Sending is the one that reaches other people and can't be recalled, and irreversibility, not difficulty, is what puts an action on the right-hand side.",
        },
      ],
    },
  },
  {
    slug: "capstone",
    title: "Capstone: package a workflow",
    minutes: 30,
    type: "project",
    body: {
      summary: "A kit someone else could run, tested on three kinds of input.",
      xp: ATTESTED_XP,
      attested: true,
      blocks: [
        {
          kind: "text",
          body: "Package the whole thing: the template, the required inputs and their missing-input rules, sample data, the review rubric, and the approval boundary table. The test of a package is that someone else could run it without asking you anything.",
        },
        {
          kind: "text",
          body: "Then run three cases and write down what actually happened, not what should have. **Normal:** complete inputs. **Missing:** a required field absent. **Conflicting:** two inputs that disagree, such as two different start times. That third case is the one that finds the gap in your contract, because most templates say what to do about absence and nothing about contradiction.",
        },
        {
          kind: "callout",
          body: "**Do it now, in your own account.** Keep this evidence: the kit, the three run results with observed behaviour, and an honest list of known limitations. The limitations list is the most valuable page. A workflow whose failure modes are written down can be trusted within them.",
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
