import { GlobalRegistrator } from "@happy-dom/global-registrator";

/**
 * One simulated window for the whole run.
 *
 * Bun executes every test file in a single process, and React's scheduler and
 * DOM bindings are module state captured the first time react-dom is imported.
 * A file that unregisters happy-dom on the way out swaps the window underneath
 * React, which then posts its updates to a window nothing is listening to:
 * `fill()` sets the input, the input event fires, and the re-render never
 * arrives. The symptom lands in whichever DOM file happens to run next, not in
 * the file that tore the window down.
 *
 * So: register once, never unregister. The process exits and takes the window
 * with it.
 */
let registered = false;
export function registerHappyDom() {
  if (registered) return;
  GlobalRegistrator.register();
  registered = true;
}
