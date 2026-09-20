# Ascent: user experience critique — verification record

Critique written: September 20, 2026, 03:11
Verified against source: September 20, 2026

## What this document is now

The original critique reviewed the working tree as it stood at 03:11 and raised
twelve findings. Remediation landed between 08:02 and 08:17 the same morning.
This document is the verification pass: every finding re-checked against the
code, with the file and line that settles it.

All twelve are resolved. The review method has not changed — this is still a
source-based verification, not a live browser walkthrough and not a study with
real users. Visual quality, actual mobile fit, contrast, touch targets, and
anonymous database visibility still need hands-on validation. The "user
perspective" lines were always anticipated reactions, never research quotes.

## Verification status

| #   | Finding                                              | Status   | Settled by                                                                                                                                                                               |
| --- | ---------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Drafts not saved; reset destructive                  | Resolved | `useLessonDraft` at `src/routes/learn.$courseId.$lessonId.tsx:251`, status line :416, "Undo reset" `CodeChallenge.tsx:138`                                                               |
| 2   | Signup and login share one mode; destination lost    | Resolved | `validateSearch` `auth.tsx:30`, `src/lib/auth-navigation.ts`, resend with cooldown `auth.tsx:64-73`, "Use a different email" :151                                                        |
| 3   | Mock reviewer labelled "Mentor review"               | Resolved | `projects.$projectId.tsx:317` and the pre-submit note at :215                                                                                                                            |
| 4   | Failures rendered as empty states                    | Resolved | `QueryError` at 14 call sites across dashboard, both profiles, community, projects, pricing, lesson, mentor                                                                              |
| 5   | Checkout always described as a demo                  | Resolved | mode-aware copy `pricing.tsx:519/550/555`, currency :293/:357/:530, signed-out routing :202                                                                                              |
| 6   | Roadmap hidden below `xl`; mentor a custom overlay   | Resolved | outline `Sheet` `learn.$courseId.$lessonId.tsx:411-414`, mentor `Sheet` :484-489                                                                                                         |
| 7   | "Recommended" and "Most written" mislabelled         | Resolved | `learn.index.tsx:49-50`, availability line :232, URL-backed filters :35                                                                                                                  |
| 8   | Two competing next-lesson cards                      | Resolved | one "Your next learning session" card `dashboard.tsx:238`                                                                                                                                |
| 9   | Plain textarea; mentor text unformatted              | Resolved | `CodeEditor.tsx` with `codeTokens` from `src/lib/code-tokens.ts`, fenced code `MentorPanel.tsx:153`, retry :164                                                                          |
| 10  | Dead bell; search did not focus; missing a11y states | Resolved | `?focus=true` → `learn.index.tsx:63`; `aria-expanded`/`aria-current`/`aria-pressed` in `AppShell.tsx` and `onboarding.tsx`; the inactive bell is gone                                    |
| 11  | Seeded posts indistinguishable; no post management   | Resolved | "Example discussion · read-only" `community.tsx:426`, `PostActions.tsx` (edit, delete, report)                                                                                           |
| 12  | Public profile had no publication filter             | Resolved | `is_published` plus `publishProjectFn`, preview mode `profile.$userId.tsx:138`, states :207 and `profile.index.tsx:351`, migration `20260920120000_portfolio_and_community_controls.sql` |

## Defects found during verification, and fixed

**A cross-file test failure that hid behind file ordering.**
`tests/lesson-draft-ui.test.tsx` imported `react-dom/client` with a static
import. ES module imports are hoisted, so react-dom initialised before
`GlobalRegistrator.register()` had created a window — and React, initialised
against no document, never wired up the change detection behind `onChange`. The
failure then surfaced in `tests/react-runtime.test.ts`, whichever DOM file
happened to run next, as a controlled input that took a value but never
re-rendered. Bun runs test files in alphabetical order, so whether the suite
went green depended on filenames.

Three things were wrong and all three are fixed:

- react-dom, React's `act`, and the hook under test are now imported
  dynamically, after the window exists (`tests/lesson-draft-ui.test.tsx:11-13`).
- The four DOM-using test files share one window through
  `registerHappyDom()` (`tests/happy-dom.ts`). Files used to unregister
  happy-dom on the way out, swapping the window underneath a React that had
  already bound to it.
- `IS_REACT_ACT_ENVIRONMENT` is scoped to the describe block that needs it. A
  file-scope `afterAll` does not run until the whole suite is over, so the act
  environment used to stay on for every file that followed.

**A dead import.** `Bell` was imported in `AppShell.tsx` after the inactive
notification bell was removed. ESLint's unused-variable rule does not flag it,
so it survived the fix for finding 10.

## Verification result

| Check                              | Result                                                                |
| ---------------------------------- | --------------------------------------------------------------------- |
| `bunx tsc --noEmit`                | clean                                                                 |
| `bun test`                         | 177 pass, 0 fail — and stable across repeated runs and file orderings |
| `bunx eslint` on the touched files | 0 errors, 0 warnings                                                  |
| `bun run build`                    | passes                                                                |

Two lint warnings were resolved rather than suppressed by reformatting:
`codeTokens` moved out of the component file into `src/lib/code-tokens.ts`
(it is a pure, tested function, and exporting it beside a component broke fast
refresh), and the deliberate control-character screen in `safeReturnTo` now
carries an explicit `no-control-regex` exemption with its reason. The one
remaining exemption, `react-hooks/exhaustive-deps` in `auth.tsx`, is documented
in place: the effect keys on the account id because `finishLogin` is rebuilt
every render and `user` is a new object on each auth refresh, so depending on
either would re-run the redirect on a learner already on their way.

Formatting now covers every hand-written file in this change set: the files
this pass touched, plus the twenty-one carrying a prettier backlog from the
remediation itself. `src/integrations/supabase/types.ts` is deliberately left
alone — it is generated from the database, and formatting it would only fight
the next regeneration.

What remains red under `bun run lint` is pre-existing and outside this work:
sixteen committed, untouched files, among them the shadcn `ui/` primitives that
are regenerated through the CLI rather than hand-edited, the Supabase
integration files, and one genuine `prefer-const` at
`src/integrations/supabase/previewAuthStorage.ts:38` that predates this change
set. Clearing those is a separate cleanup.

## Still open

These were never code findings and remain as they were:

- **Validation with people.** Run a small formative study with beginners,
  returning learners, and mobile users: choose a course, register, complete a
  challenge, recover an interrupted session, interpret project feedback, and
  explain a plan before checkout. Observe hesitation rather than coaching.
- **Rendered-app checks.** Contrast, zoom behaviour, touch targets, and the
  mentor sheet under a software keyboard need measuring in a browser.
- **Anonymous visibility.** Finding 12's migration exists but signed-out
  visibility of unpublished projects has not been exercised end to end against
  the database.
- **Substantive project review.** Feedback is now labelled honestly, which was
  the trust problem. It is still a write-up check. A requirement-by-requirement
  rubric with evidence is a separate piece of work.
- **Landing page copy.** "Four steps between today and your first offer" still
  implies that course completion reliably produces an offer.

Measures worth tracking against a baseline — proposed, not yet collected:

| Outcome                  | Useful measure                                                        |
| ------------------------ | --------------------------------------------------------------------- |
| Easier start             | Time and completion rate from signup intent to first completed lesson |
| Dependable continuity    | Successful draft restoration and reported lost-work incidents         |
| Effective learning       | Challenge completion after feedback and later review performance      |
| Clear purchasing         | Correct understanding of plan limits and checkout abandonment by step |
| Better mobile experience | Lesson completion and error recovery by viewport/device               |
| Credible portfolio       | Reviewed projects intentionally published with supporting evidence    |

Use retention and learning outcomes together. More clicks, longer sessions, or
higher XP alone do not establish that the learner is making better progress.
