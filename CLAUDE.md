# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Career Canvas** (branded in-product as **"Ascent"**) — an interactive, gamified
tech-career learning platform: career paths, courses, lessons with an in-browser
code runner, an AI mentor panel, XP/levels/streaks/achievements, projects,
community, leaderboard and certificates.

`README.md` is the **product spec** (the original Lovable prompt), not developer
docs. Read it for intended features/scope; read this file for how the code works.

## Commands

Package manager is **bun** (`bun.lock`, `bunfig.toml`).

```sh
bun install
bun run dev        # vite dev server
bun run build      # vite build (nitro, cloudflare target by default)
bun run preview
bun run lint       # eslint (prettier runs as an eslint rule)
bun run format     # prettier --write .
bun run test       # bun test — unit tests in tests/, outside src/
bunx tsc --noEmit  # typecheck — no script for this; run it before finishing work
```

Tests live in `tests/` rather than `src/` on purpose: `tsconfig.json` only
includes `src`, so `bun:test` imports need no `bun-types` dependency. They cover
the pure rules that decide rewards — the level curve, goal sizing, live-vs-
unwritten lessons, answer checking, review scheduling and plan entitlements.
There is no component or integration test.

Verification = `tsc --noEmit` clean, `bun test` green, `lint` clean on the files
you touched (the repo has a pre-existing prettier backlog in untouched files),
`build` passes, and routes render.

`bunfig.toml` sets `minimumReleaseAge = 86400` (24h supply-chain guard).
Confirm with the user before adding anything to `minimumReleaseAgeExcludes`.

## Stack

TanStack Start 1.x (React 19, SSR) + TanStack Router file-based routing +
TanStack Query, Vite 8, Tailwind v4 (CSS-first, no tailwind.config), shadcn/ui
(new-york, Radix + lucide), Supabase (auth + Postgres), zod + react-hook-form,
recharts, sonner. Scaffolded by Lovable.

`vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which **already
includes** tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro, devtools,
the `@/*` alias and VITE_ env injection. Do not add those plugins manually — the
app breaks on duplicates.

## Layout

```
src/routes/        file-based routes (see src/routes/README.md for conventions)
src/routeTree.gen.ts   AUTO-GENERATED — never edit
src/components/ui/     shadcn primitives (regenerate via CLI, avoid hand-edits)
src/components/{common,layout,learn}/  app components (AppShell, MentorPanel, CodeChallenge…)
src/content/       static seed content: curriculum, lessons, gamification, projects, community
src/hooks/         useAuth, useLearner, useProjects, useCommunity (React Query wrappers)
src/integrations/supabase/   clients, auth middleware, generated types
src/lib/           code-runner, mentor, certificates, error reporting, utils
supabase/migrations/   SQL migrations
```

## Conventions that matter here

**Routing.** File-based only. No `src/pages/`, no `app/layout.tsx`. Dynamic
segments are bare `$id`. `__root.tsx` is the only root layout and must keep its
`<Outlet />`. Every page route sets its own `head()` meta (title/description/og);
match that when adding routes.

**Live vs. unwritten lessons.** A lesson only exists if it has an authored body
in `src/content/lesson-bodies.server.ts`. Everything else on a roadmap is a planned slot:
`isLessonLive()` is false, the lesson route renders "coming soon", it awards no
XP, it is excluded from every progress denominator (`liveLessons`,
`pathLiveLessonCount`), and it blocks its path's certificate
(`pathCompletion().published`). Never generate filler to fill those slots — that
is exactly what this replaced. To make a lesson live: add its body to `bodies`,
then run `bun run lessons:manifest` (a test fails until you do). For a
Python or SQL challenge, `bun run lessons:verify` checks the reference solution
passes every test and the starter fails one; SQL runs against the shop dataset
in `src/content/datasets/shop.ts`, whose numbers the SQL lessons quote.

**The answer key never reaches the browser.** Bodies live in
`lesson-bodies.server.ts`, which the Start plugin refuses to bundle for the
client (`**/*.server.*`); only server handlers `await import` it. The browser
knows which lessons exist from the generated `lesson-manifest.gen.ts`, loads a
lesson through `getLessonFn` as `toPublicBody()` (no `answer`, `explanation` or
`solution`), and asks `checkAnswerFn` whether an answer is right — the
explanation comes back only when it is. Review feedback arrives with the grade
from `submitReviewFn`; placement is graded by `gradePlacementFn`. Never import
the bodies from a route, hook or component, and never reveal the right option on
a wrong answer.

**Content vs. data.** Curriculum, lessons, projects and community seeds are
static TypeScript in `src/content/`; per-user state (profile, XP, progress,
achievements, submissions, posts) lives in Supabase. Leaderboard/community views
**merge live Supabase rows over seed data and must fall back to the seed when the
query fails** — never leave a permanent skeleton.

**XP is server-authored.** `completeLessonFn` in `src/lib/learning.functions.ts`
is the only writer of `profiles.xp/level/streak_*`, `lesson_progress` and
`daily_activity`. It re-checks the learner's answers against the authored lesson
body, takes the XP amount from that body, and writes with the service-role
client; the `20260916120000_server_authored_xp` migration revokes the client's
grants on those columns and tables. Never add a client-side write to them — and
note server functions must not live under `src/server/` (the Start plugin denies
client imports from that path); `*.functions.ts` under `src/lib/` is the
convention.

**Data access.** Always through React Query hooks in `src/hooks/`, keyed by
`[resource, user?.id]` and gated with `enabled: Boolean(user)`. Don't call
`supabase` directly from route components.

**Supabase clients.**
- `@/integrations/supabase/client` — anon client, browser + SSR. Auto-generated header; don't edit.
- `@/integrations/supabase/client.server` — **service role, bypasses RLS.** Import only inside server handlers (`await import(...)`) or other `*.server.ts` files. Route files and `*.functions.ts` ship to the client bundle.
- `types.ts` is generated from the database — regenerate, don't hand-edit.
- `attachSupabaseAuth` is registered as a global `functionMiddleware` in `src/start.ts`; keep it there or serverFn RPCs lose their bearer token.

**Auth.** Client-side only — there are no `beforeLoad` route guards. Pages call
`useSession()` and render a loading/empty state; `AppShell` redirects to `/auth`
on sign-out. Google sign-in is Supabase's own `signInWithOAuth` in `auth.tsx`,
redirecting to `/dashboard`; the client reads the session from the URL on return.
The Lovable Cloud auth helper was removed with the move off Lovable Cloud — don't
let Lovable re-add it.

**Gamification copy must match the rule.** The streak is held by completing any
one lesson **or one due review** (both stamp `profiles.last_active_day` from the
server). The daily XP goal is a separate, softer target — and it is no longer a
constant: `dailyXpGoal(hours_per_week)` in `src/content/gamification.ts` sizes it
from the onboarding answer. Don't write copy that ties the goal to the streak —
no single lesson is worth a full day's goal, so that phrasing warns people their
streak is at risk after they've already secured it.

**Onboarding answers must have consequences.** `src/content/personalisation.ts`
is the map from each answer to what it changes (goal → what the dashboard pushes,
experience → the suggested starting module and the placement check, hours →
the XP goals, path → the roadmap). If you add an option, give it a real effect or
leave it out of onboarding — four questions that only read one of the answers is
what this replaced.

**Spaced review.** Completing a lesson that asked a question inserts a
`review_items` row due tomorrow. `/review` asks those questions again;
`submitReviewFn` (`src/lib/review.functions.ts`) re-checks them server-side and
pays a fifth of the lesson's XP, capped. Scheduling is `src/lib/review-schedule.ts`
(pure, tested): correct widens the gap, wrong resets it to a day. Reviewing early
is allowed but pays nothing. `review_items` is SELECT-only to the client.

**Answer checking lives in one place.** `src/lib/lesson-grading.ts` — shared by
lesson completion, review, placement and `checkAnswerFn`, and the only definition
of "got it right". It runs on the server only — a route can't compare answers,
because it doesn't have them. An mcq answer is an index, not a string.

**Certificates are verifiable.** `issued_certificates` carries an HMAC signature
written at issue time (`src/lib/signing.server.ts`, keyed by
`CERTIFICATE_SIGNING_SECRET`, falling back to the service-role key). `/verify` and
`/verify/$certificateId` are public and unauthenticated, and report two separate
facts: the issuing record exists (only the service role can write it) and the
signature still matches. Never make verification require a session.

**Re-engagement.** `POST /api/cron/reengagement` with
`Authorization: Bearer $CRON_SECRET`, routed in `src/server.ts` before the Start
handler like the Stripe webhook, for the same reason. The job is
`src/lib/reengagement.server.ts`; delivery goes through the `EMAIL_PROVIDER`
(mock | resend) seam in `src/lib/email.server.ts`. Consent is `profiles.email_optin`,
filtered in the query so an opted-out learner's address is never read, and every
email carries a signed unsubscribe link handled at `/unsubscribe` — POST only,
because mail scanners follow links. Web push is the second channel
(`src/lib/web-push.server.ts`, hand-written RFC 8291/8292 on Web Crypto — the
`web-push` package needs `node:crypto`). A learner with a subscribed device gets
the push; email is the fallback when no device accepts it. One nudge per learner
per day across both channels. `push_subscriptions` is SELECT-only to the client.

**Database.** Every table has RLS enabled with explicit `GRANT`s per role and
`auth.uid()`-scoped policies. Any new table must follow that pattern, in a new
timestamped file under `supabase/migrations/`.

**Styling.** All design tokens (the "Ascent" oklch palette, radii, shadows,
fonts) live in `src/styles.css`. **Never hardcode colors in components** — use
the semantic token classes (`bg-background`, `text-muted-foreground`,
`text-brand`, `shadow-card`, …). Compose classes with `cn()` from `@/lib/utils`.

**TypeScript is strict**, including `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`, and `noPropertyAccessFromIndexSignature` (so
`import.meta.env['VITE_X']`, not `.VITE_X`). Optional props usually need
`| undefined` written explicitly.

**AI mentor.** Real models run server-side in `src/lib/mentor.functions.ts`
against a provider chosen by `MENTOR_PROVIDER` (anthropic | openai | deepseek |
mock) in `src/lib/mentor-providers.server.ts`. Keys are server-only and must
never get a `VITE_` prefix. `mock` (the default when unset) uses
`scriptedMentorReply` in `src/lib/mentor.ts` so the app runs without a key.
Usage is metered per plan by counting `mentor_messages` rows — that table is
read-only to the client for exactly that reason.

**Code runner.** JavaScript runs in a sandboxed `new Function`; Python runs for
real on Pyodide (CPython in WebAssembly) in a Blob worker — `src/lib/python-runtime.ts`,
loaded from a CDN (`VITE_PYODIDE_URL`) rather than bundled, so no dependency is
added. If it can't boot, the old source-pattern simulation takes over and the
result carries `engine: "python-simulated"`, which the UI labels. Never let a
simulated run present itself as a real one. Python challenge `tests` are real
Python expressions evaluated against the learner's namespace; JavaScript ones are
JS expressions. SQL runs on Pyodide's sqlite3 against the shop dataset (no
simulation). React challenges (`language: "react"`) render the learner's JSX with
the app's own React via `src/lib/react-runtime.ts` — sucrase compiles it, loaded
lazily; a visible Preview mounts `App`. React `tests` are async function bodies
using user-level helpers (`render`, `getByRole`, `getByLabelText`, `click`, `fill`,
`blur`, `waitFor`, `text`) and should assert what a user sees, never how the
code is written. `tests/react-runtime.test.ts` runs it under happy-dom.

**Still mocked.** The checkout in `src/routes/pricing.tsx` when
`PAYMENTS_PROVIDER=mock`. Its input/output shape is the contract the UI depends
on — swap the implementation without changing the shape.

**Seeded data must be labelled.** The leaderboard merges seed rows under live
ones, badges them "Sample", excludes them from a real learner's rank, and hides
them once eight real learners are ranked. Any other surface that mixes seeds with
real rows owes the reader the same three things.

**Style.** Prettier: 100 cols, double quotes, semicolons, trailing commas.
Existing code comments explain *why* (non-obvious constraints), not *what* —
match that density.

**Entitlements.** `src/lib/entitlements.ts` is the only place plan limits are
written down; both the UI and the server functions read it. Enforcement is off
unless `ENTITLEMENTS_ENABLED`/`VITE_ENTITLEMENTS_ENABLED` is `"true"`. Every gate
must exist server-side — a lock that only lives in a component is decoration.
`profiles.plan` is server-written only (mock checkout included); payments go
through `PAYMENTS_PROVIDER` (mock | stripe) in `src/lib/payments.server.ts`, and
the Stripe webhook is handled in `src/server.ts` before the Start handler so it
skips CSRF and auth.

**Analytics.** `track()` from `src/lib/analytics.ts` appends to
`analytics_events`, which the app can write but never read. It is fire-and-forget
and must stay that way — no product behaviour may depend on an event landing.
`lesson_completed` is recorded server-side on purpose. Query packs live in
`supabase/analytics-queries.sql`.

**Status tracking.** `IMPLEMENTATION-STATUS.md` tracks what's done and what's
left from the product review. Update it when an item moves.

## Environment

`.env` holds `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` and their `VITE_` twins
(client build-time). `SUPABASE_SERVICE_ROLE_KEY` is server-only, never gets a
`VITE_` prefix, and is **required** — lesson completion goes through the
service-role client and fails loudly without it. `.env` is committed here — do not add secrets beyond what the
platform provisions.
