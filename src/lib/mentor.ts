/**
 * Mock AI mentor service.
 *
 * Deliberately Socratic: it nudges with questions before it hands over answers.
 * Replace `askMentor` with a call to a real LLM endpoint later — the
 * MentorContext in, string out contract is what the UI depends on.
 */

export interface MentorContext {
  lessonTitle?: string | undefined;
  courseTitle?: string | undefined;
  code?: string | undefined;
  language?: string | undefined;
  lastError?: string | null | undefined;
  failingTests?: string[] | undefined;
}

export interface MentorMessage {
  id: string;
  role: "user" | "mentor";
  content: string;
  at: number;
}

const nudges = [
  "Before we change anything: what did you expect that line to produce, and what did it actually produce?",
  "Say the goal out loud in one sentence. Which part of your code is responsible for that sentence?",
  "Try adding a log right before the suspicious line. What value is actually arriving there?",
];

function analyseCode(ctx: MentorContext): string | null {
  const code = ctx.code ?? "";
  if (!code.trim()) return null;

  if (/=>\s*{[^}]*\b(sum|acc|total)\b[^}]*}/s.test(code) && !/return/.test(code)) {
    return "Look closely at your arrow function body. When you use curly braces, nothing leaves the function unless you write `return`. What happens to the accumulator on the next pass if this one hands back nothing?";
  }
  if (/def\s+\w+\([^)]*\):\s*(#[^\n]*\n\s*)?pass/.test(code)) {
    return "Your function body is still `pass`, which means it returns None. What is the single value this function should hand back for the simplest possible input?";
  }
  if (/function\s+\w+\([^)]*\)\s*{(?:(?!return)[\s\S])*}$/.test(code.trim())) {
    return "I cannot find a `return` in your function. It will run its work and then quietly hand back `undefined`. Which value do you want the caller to receive?";
  }
  if (/==(?!=)/.test(code) && ctx.language === "javascript") {
    return "You are using `==`. That coerces types behind your back. Would `===` change the outcome of the comparison you are making?";
  }
  return null;
}

export async function askMentor(
  question: string,
  ctx: MentorContext,
  history: MentorMessage[] = [],
): Promise<string> {
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
  const q = question.toLowerCase();
  const lesson = ctx.lessonTitle ? `"${ctx.lessonTitle}"` : "this lesson";

  if (ctx.lastError) {
    return `That error — \`${ctx.lastError}\` — is the program telling you exactly where its expectation broke. Read it as a sentence: what was it trying to do, and to what value? Point me at the line you think it refers to and we will check your theory together.`;
  }

  if (ctx.failingTests?.length) {
    return `One test is still red: **${ctx.failingTests[0]}**. Walk me through what your code does with that exact input, step by step. Where does your version stop matching what the test asks for?`;
  }

  const codeNote = analyseCode(ctx);
  if (codeNote && /why|broken|not work|wrong|fail|bug|error|help/.test(q)) {
    return codeNote;
  }

  if (/hint/.test(q)) {
    return `Here is a nudge rather than the answer, because you are closer than you think. ${nudges[Math.floor(Math.random() * nudges.length)]}`;
  }

  if (/explain|what is|what does|how does|why is/.test(q)) {
    return `Short version, then a question back. In ${lesson}, the idea you are asking about exists to remove repetition and make behaviour predictable: you describe *what* should happen once, and the runtime handles *when*. Now you tell me — where in your current code does that same idea already appear, even if it is written differently?`;
  }

  if (/review|check my|is this right|feedback/.test(q)) {
    return `${codeNote ?? "Structurally this reads well — naming is clear and the shape matches the task."} Two things I would ask you before calling it done: what happens with an empty input, and what happens with an unexpected type? Try both and tell me what you see.`;
  }

  if (/next|what should i|study/.test(q)) {
    return `Given where you are, the highest-value next step is a practice task rather than more reading: repeat this pattern once without looking, then move to the next challenge in ${ctx.courseTitle ?? "this course"}. Reading twice feels productive and teaches half as much.`;
  }

  if (/stuck|give up|hard|confused/.test(q)) {
    return `That feeling usually means the problem is still too big. Shrink it: solve it for one item instead of all of them, with values you choose yourself. Get that working, then grow it. What is the smallest version you could make pass right now?`;
  }

  return `Good question. Let's work it out rather than me handing it over. ${nudges[Math.floor(Math.random() * nudges.length)]} Tell me what you find and I will take it from there.`;
}

export const suggestedPrompts = (ctx: MentorContext) =>
  [
    ctx.lessonTitle ? `Explain ${ctx.lessonTitle.toLowerCase()} simply` : "Explain this concept simply",
    "Give me a hint",
    "Review my code",
    "What should I study next?",
  ].slice(0, 4);
