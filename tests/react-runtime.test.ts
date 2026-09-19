import { afterAll, describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

/**
 * The React challenge runtime, exercised in a simulated DOM. The same module
 * runs in the learner's browser, so these are the rules a React challenge's
 * tests actually get.
 */
GlobalRegistrator.register();
afterAll(async () => {
  // Let React's scheduler finish before the simulated window goes away.
  await new Promise((resolve) => setTimeout(resolve, 50));
  await GlobalRegistrator.unregister();
});

const { prepareSource, runReactChallenge } = await import("../src/lib/react-runtime");

const COUNTER = `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Add</button>
    </div>
  );
}`;

describe("react runtime", () => {
  test("strips React imports and exports, and refuses other imports", () => {
    const out = prepareSource(COUNTER);
    expect(out).not.toContain("import");
    expect(out).not.toContain("export");
    expect(() => prepareSource('import axios from "axios";')).toThrow(/Only React/);
  });

  test("renders, clicks and reads the screen", async () => {
    const run = await runReactChallenge(COUNTER, [
      {
        name: "starts at zero",
        expression: "await render(<App />); return text() === 'Clicked 0 times Add';",
      },
      {
        name: "counts clicks",
        expression:
          "await render(<App />); const b = getByRole('button', { name: 'Add' }); await click(b); await click(b); return getByText('Clicked 2 times') !== null;",
      },
      {
        name: "a failing test",
        expression: "await render(<App />); getByText('Nope'); return true;",
      },
    ]);
    expect(run.error).toBeNull();
    expect(run.results.map((r) => r.passed)).toEqual([true, true, false]);
    expect(run.results[2]?.detail).toContain(`Couldn't find the text "Nope"`);
  });

  test("text() separates elements but not the pieces of one element", async () => {
    const run = await runReactChallenge(
      "function App() { const total = 44.5; return <div><p>Total: ${total}</p><button>Pay</button></div>; }",
      [
        {
          name: "reads naturally",
          expression: "await render(<App />); return text() === 'Total: $44.5 Pay';",
        },
      ],
    );
    expect(run.results[0]?.passed).toBe(true);
  });

  test("controlled inputs, labels and blur", async () => {
    const form = `function App() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  return (
    <form>
      <label htmlFor="email">Email</label>
      <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} />
      {touched && !email.includes("@") ? <p role="alert">Enter a valid email</p> : null}
      <p>You typed {email}</p>
    </form>
  );
}`;
    const run = await runReactChallenge(form, [
      {
        name: "fill updates state",
        expression:
          "await render(<App />); await fill(getByLabelText('Email'), 'ada@example.com'); return getByText('You typed ada@example.com') !== null;",
      },
      {
        name: "blur shows the error",
        expression:
          "await render(<App />); const f = getByLabelText('Email'); await fill(f, 'ada'); await blur(f); return getByRole('alert').textContent === 'Enter a valid email';",
      },
    ]);
    expect(run.results.map((r) => r.passed)).toEqual([true, true]);
  });

  test("effects run and waitFor sees async updates", async () => {
    const effect = `function App() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => setItems(["a", "b"]), 50);
    return () => clearTimeout(t);
  }, []);
  if (!items) return <p>Loading…</p>;
  return <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}`;
    const run = await runReactChallenge(effect, [
      {
        name: "loading then list",
        expression:
          "await render(<App />); const loading = text() === 'Loading…'; await waitFor(() => getAllByRole('listitem').length === 2); return loading;",
      },
    ]);
    expect(run.results[0]?.passed).toBe(true);
  });

  test("a component that throws is reported, not a crash", async () => {
    const run = await runReactChallenge("function App() { throw new Error('boom'); }", [
      { name: "renders", expression: "await render(<App />); return true;" },
    ]);
    expect(run.results[0]?.passed).toBe(false);
    expect(run.error).toContain("boom");
  });

  test("a syntax error fails every test with the compiler's message", async () => {
    const run = await runReactChallenge("function App() { return <div> }", [
      { name: "renders", expression: "await render(<App />); return true;" },
    ]);
    expect(run.results[0]?.passed).toBe(false);
    expect(run.error).toBeTruthy();
  });
});
