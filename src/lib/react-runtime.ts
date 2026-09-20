/**
 * Real React for the React in Practice challenges.
 *
 * The learner's JSX is compiled with sucrase and rendered by the app's own
 * React into a container on this page — hidden for tests, visible for the
 * preview. That is the same trust level as the JavaScript runner (it is the
 * learner's own code, in their own browser), with no CDN and no second copy of
 * React to drift out of step with the app.
 *
 * Tests are async function bodies, written like a user would check the screen:
 *
 *   await render(<App />);
 *   await click(getByRole("button", { name: "Add" }));
 *   return getByText("2 items") !== null;
 *
 * Each test gets a fresh mount. A test that throws or times out has failed, and
 * the thrown message is shown to the learner — "Couldn't find the text '2
 * items'" is the most useful thing a failing test can say.
 *
 * Loaded on demand (see code-runner.ts) so sucrase never ships with pages that
 * don't need it.
 */
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { transform } from "sucrase";
import {
  accessibleName,
  captureConsole,
  collapseWhitespace as normalise,
  errorMessage as message,
  stripModuleSyntax,
  withTimeout,
  type EngineOutcome,
  type TestSpec,
} from "./runtime-shared";

const TEST_TIMEOUT_MS = 4_000;

/** What a challenge can use without importing it. */
const REACT_GLOBALS = {
  React,
  Fragment: React.Fragment,
  createContext: React.createContext,
  useState: React.useState,
  useEffect: React.useEffect,
  useLayoutEffect: React.useLayoutEffect,
  useRef: React.useRef,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
  useReducer: React.useReducer,
  useContext: React.useContext,
  useId: React.useId,
  useTransition: React.useTransition,
  useDeferredValue: React.useDeferredValue,
};

/** React is provided, so importing it is a no-op; anything else is unresolvable. */
export function prepareSource(code: string): string {
  return stripModuleSyntax(code, {
    allowImportsFrom: ["react", "react-dom", "react-dom/client"],
    importError: (statement) =>
      `Only React is available in challenges, so this import can't work: ${statement}`,
  });
}

function compile(source: string): string {
  return transform(source, {
    transforms: ["jsx"],
    jsxRuntime: "classic",
    production: true,
  }).code;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Lets React commit and run passive effects. Updates from discrete events
 * flush almost at once; effects are scheduled a tick later.
 */
async function settle() {
  await sleep(0);
  await sleep(10);
}

function roleOf(el: Element): string | null {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit;
  const tag = el.tagName.toLowerCase();
  if (tag === "button") return "button";
  if (tag === "a" && el.hasAttribute("href")) return "link";
  if (/^h[1-6]$/.test(tag)) return "heading";
  if (tag === "li") return "listitem";
  if (tag === "ul" || tag === "ol") return "list";
  if (tag === "textarea") return "textbox";
  if (tag === "select") return "combobox";
  if (tag === "input") {
    const type = (el.getAttribute("type") ?? "text").toLowerCase();
    if (type === "checkbox") return "checkbox";
    if (type === "radio") return "radio";
    if (type === "submit" || type === "button") return "button";
    if (["text", "email", "search", "tel", "url", "number", ""].includes(type)) return "textbox";
  }
  return null;
}

function matches(actual: string, expected: string | RegExp) {
  return typeof expected === "string" ? actual === normalise(expected) : expected.test(actual);
}

function describe(expected: string | RegExp) {
  return typeof expected === "string" ? `"${expected}"` : String(expected);
}

/** A mounted component plus the queries and actions a test uses on it. */
function createHarness(errors: unknown[]) {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  const scope = () => {
    if (!container) throw new Error("Call render(...) before looking at the screen.");
    return container;
  };

  const allElements = () => [scope(), ...Array.from(scope().querySelectorAll("*"))];

  function queryAllByText(expected: string | RegExp): Element[] {
    // The deepest elements whose whole text matches, so a match inside a
    // <li> returns the <li>, not every ancestor that also contains it.
    const hits = allElements().filter((el) => matches(normalise(el.textContent), expected));
    return hits.filter((el) => !hits.some((other) => other !== el && el.contains(other)));
  }

  function queryAllByRole(role: string, options: { name?: string | RegExp } = {}): Element[] {
    return allElements().filter(
      (el) =>
        roleOf(el) === role &&
        (options.name === undefined || matches(accessibleName(el, true) ?? "", options.name)),
    );
  }

  function queryAllByLabelText(expected: string | RegExp): Element[] {
    return allElements().filter(
      (el) =>
        ["input", "textarea", "select"].includes(el.tagName.toLowerCase()) &&
        matches(accessibleName(el, true) ?? "", expected),
    );
  }

  const single = (found: Element[], what: string) => {
    if (found.length === 0) throw new Error(`Couldn't find ${what}.`);
    if (found.length > 1)
      throw new Error(`Found ${found.length} matches for ${what}; expected one.`);
    return found[0] as HTMLElement;
  };

  const api = {
    async render(element: React.ReactNode) {
      api.cleanup();
      container = document.createElement("div");
      container.setAttribute("data-challenge-root", "");
      container.style.cssText = "position:absolute;left:-10000px;top:0;width:800px";
      document.body.appendChild(container);
      root = createRoot(container, {
        onUncaughtError: (error) => errors.push(error),
        onCaughtError: (error) => errors.push(error),
      });
      root.render(element);
      await settle();
      return container;
    },
    cleanup() {
      root?.unmount();
      container?.remove();
      root = null;
      container = null;
    },
    /**
     * Everything on screen as one string. Text from different elements is
     * separated by a space (textContent would run "0 items" and a button's
     * "Add" into "0 itemsAdd"); text within one element is joined as written,
     * because React splits `Total: ${total}` into two text nodes.
     */
    text: () => {
      let out = "";
      let previousParent: Node | null = null;
      const walker = document.createTreeWalker(scope(), NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (previousParent && node.parentNode !== previousParent) out += " ";
        out += node.textContent ?? "";
        previousParent = node.parentNode;
      }
      return normalise(out);
    },
    getByText: (t: string | RegExp) => single(queryAllByText(t), `the text ${describe(t)}`),
    queryByText: (t: string | RegExp) => (queryAllByText(t)[0] as HTMLElement | undefined) ?? null,
    getAllByText: (t: string | RegExp) => {
      const found = queryAllByText(t);
      if (!found.length) throw new Error(`Couldn't find the text ${describe(t)}.`);
      return found as HTMLElement[];
    },
    getByRole: (role: string, options: { name?: string | RegExp } = {}) =>
      single(
        queryAllByRole(role, options),
        `a ${role}${options.name === undefined ? "" : ` named ${describe(options.name)}`}`,
      ),
    queryByRole: (role: string, options: { name?: string | RegExp } = {}) =>
      (queryAllByRole(role, options)[0] as HTMLElement | undefined) ?? null,
    getAllByRole: (role: string, options: { name?: string | RegExp } = {}) =>
      queryAllByRole(role, options) as HTMLElement[],
    getByLabelText: (t: string | RegExp) =>
      single(queryAllByLabelText(t), `a form field labelled ${describe(t)}`) as HTMLInputElement,
    async click(el: Element) {
      (el as HTMLElement).click();
      await settle();
    },
    /** Replaces an input's value the way typing would, so React sees it. */
    async fill(el: Element, value: string) {
      const input = el as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")?.set;
      input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      if (setter) setter.call(input, value);
      else input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await settle();
    },
    async blur(el: Element) {
      el.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      el.dispatchEvent(new FocusEvent("blur"));
      await settle();
    },
    sleep: async (ms: number) => {
      await sleep(ms);
      await settle();
    },
    /** Polls until `check` returns truthy without throwing, or fails with its last error. */
    async waitFor<T>(check: () => T, timeoutMs = 1_500): Promise<T> {
      const started = Date.now();
      let last: unknown;
      while (Date.now() - started < timeoutMs) {
        try {
          const value = check();
          if (value) return value;
        } catch (error) {
          last = error;
        }
        await sleep(20);
      }
      throw last instanceof Error ? last : new Error("Timed out waiting for the screen to update.");
    },
  };
  return api;
}

type Harness = ReturnType<typeof createHarness>;
const HARNESS_NAMES = [
  "render",
  "text",
  "getByText",
  "queryByText",
  "getAllByText",
  "getByRole",
  "queryByRole",
  "getAllByRole",
  "getByLabelText",
  "click",
  "fill",
  "blur",
  "sleep",
  "waitFor",
] as const satisfies readonly (keyof Harness)[];

/**
 * Builds the learner's module and the tests in one scope, so tests can refer
 * to the components by name. Returns the test functions and whatever `App` is.
 */
function build(code: string, tests: TestSpec[], harness: Harness, logs: string[]) {
  const testFns = tests.map((t) => `async function () {\n${t.expression}\n}`).join(",\n");
  const source = `${prepareSource(code)}\n;return { App: typeof App === "undefined" ? undefined : App, tests: [${testFns}] };`;
  const compiled = compile(source);
  const names = [...Object.keys(REACT_GLOBALS), ...HARNESS_NAMES, "console"];
  const values = [
    ...Object.values(REACT_GLOBALS),
    ...HARNESS_NAMES.map((name) => harness[name]),
    captureConsole(logs),
  ];
  const factory = new Function(...names, compiled) as (...args: unknown[]) => {
    App: React.ComponentType | undefined;
    tests: (() => Promise<unknown>)[];
  };
  return factory(...values);
}

export async function runReactChallenge(code: string, tests: TestSpec[]): Promise<EngineOutcome> {
  const logs: string[] = [];
  const errors: unknown[] = [];
  const harness = createHarness(errors);

  let built: ReturnType<typeof build>;
  try {
    built = build(code, tests, harness, logs);
  } catch (error) {
    return {
      logs,
      error: message(error),
      results: tests.map(() => ({ passed: false, detail: null })),
    };
  }

  const results: EngineOutcome["results"] = [];
  for (const test of built.tests) {
    errors.length = 0;
    try {
      const passed = await withTimeout(test(), TEST_TIMEOUT_MS, () => {
        throw new Error("The test timed out. Is something re-rendering forever?");
      });
      const crashed = errors[0];
      results.push(
        crashed
          ? { passed: false, detail: `Your component threw: ${message(crashed)}` }
          : { passed: passed === true, detail: null },
      );
    } catch (error) {
      results.push({ passed: false, detail: message(errors[0] ?? error) });
    } finally {
      harness.cleanup();
    }
  }

  const firstCrash = results.find((r) => r.detail?.startsWith("Your component threw"));
  return { logs, error: firstCrash?.detail ?? null, results };
}

/** Renders the learner's `App` into a visible element. Returns how to remove it. */
export function mountPreview(
  code: string,
  element: HTMLElement,
  onError: (message: string) => void,
): () => void {
  let built: ReturnType<typeof build>;
  try {
    built = build(code, [], createHarness([]), []);
  } catch (error) {
    onError(message(error));
    return () => {};
  }
  if (!built.App) {
    onError("Define a component called App to see a preview.");
    return () => {};
  }
  const mount = document.createElement("div");
  element.appendChild(mount);
  const root = createRoot(mount, {
    onUncaughtError: (error) => onError(`Your component threw: ${message(error)}`),
  });
  root.render(React.createElement(built.App));
  // Deferred: the caller unmounts from an effect cleanup, and unmounting a
  // root synchronously while React is committing another one is not allowed.
  return () =>
    setTimeout(() => {
      root.unmount();
      mount.remove();
    }, 0);
}
