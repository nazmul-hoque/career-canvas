import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Root } from "react-dom/client";
import { registerHappyDom } from "./happy-dom";

registerHappyDom();

// react-dom reads the DOM globals as it initialises, so it has to be imported
// after the window exists. A static import is hoisted above registerHappyDom() and
// would initialise it against no document — React then never wires up its
// change detection, and the damage shows up in whichever DOM test file runs
// next rather than in this one.
const { act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { useLessonDraft } = await import("../src/hooks/useLessonDraft");

type ActEnv = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
function setActEnvironment(value: boolean) {
  (globalThis as ActEnv).IS_REACT_ACT_ENVIRONMENT = value;
}

let current: ReturnType<typeof useLessonDraft>;
function Harness({ user = "alice", lesson = "one" }: { user?: string; lesson?: string }) {
  current = useLessonDraft(user, "js", lesson, "starter");
  return <p>{current.status}</p>;
}
async function mount(user: string, lesson = "one") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<Harness user={user} lesson={lesson} />);
  });
  return { root, container };
}
async function unmount(root: Root, container: HTMLElement) {
  await act(async () => root.unmount());
  container.remove();
}

// `IS_REACT_ACT_ENVIRONMENT` is process-wide, and a file-scope afterAll does
// not run until the whole suite is over. Left set, this file's act environment
// makes React defer the un-acted updates react-runtime.test.ts relies on, so
// the flag is scoped to this describe rather than to the file.
describe("lesson draft", () => {
  beforeAll(() => setActEnvironment(true));
  afterAll(() => setActEnvironment(false));

  test("editing survives unmount and accounts/lessons stay isolated", async () => {
    localStorage.clear();
    let view = await mount("alice");
    expect(current.ready).toBe(true);
    await act(async () => {
      current.setCode("const total = 42;");
      current.setAnswers({ first: 0 });
    });
    await unmount(view.root, view.container);
    view = await mount("bob");
    expect(current.code).toBe("starter");
    expect(current.answers).toEqual({});
    await unmount(view.root, view.container);
    view = await mount("alice", "two");
    expect(current.code).toBe("starter");
    await unmount(view.root, view.container);
    view = await mount("alice");
    expect(current.code).toBe("const total = 42;");
    expect(current.answers).toEqual({ first: 0 });
    expect(current.status).toContain("restored");
    await unmount(view.root, view.container);
  });

  test("storage write failures keep editing usable and disclose unsaved work", async () => {
    const view = await mount("storage-failure");
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage")!;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        setItem() {
          throw new Error("Storage full");
        },
      },
    });
    try {
      await act(async () => current.setCode("important work"));
      expect(current.code).toBe("important work");
      expect(current.status).toContain("not saved");
    } finally {
      Object.defineProperty(globalThis, "localStorage", descriptor);
      await unmount(view.root, view.container);
    }
  });
});
