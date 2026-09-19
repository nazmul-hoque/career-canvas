# Implementation status

Running tracker for the product review of 2026-09-16. Severity and numbering
follow that review's ranked issue list, so `#3` here is `#3` there.

Update this file whenever an item moves. One line of "what changed and where"
per item is enough — the code is the detail.

---

## Blocked on you (nothing ships correctly until these are done)

Two facts shape every item below:

- **The database is your own Supabase project** `nqudmlzugtssfqaebaqb` (moved off
  Lovable Cloud's `deazbmtlzyvhvrtqetls` on 2026-09-19). The repo is linked to it,
  so `supabase db push` applies new migrations and
  `supabase gen types typescript --linked` regenerates `types.ts`. Lovable still
  syncs code from GitHub; if it regenerates `types.ts` from its old database it
  will strip tables — restore the file from `--linked` rather than accept that.
- **`.env` is committed to GitHub.** Every secret below — service-role key, model
  and Stripe keys, `CRON_SECRET`, `CERTIFICATE_SIGNING_SECRET`,
  `VAPID_PRIVATE_KEY`, `RESEND_API_KEY` — goes in the host's environment
  settings, never in `.env`. Only public values with a `VITE_` prefix belong
  there.

- [ ] **Set `SUPABASE_SERVICE_ROLE_KEY` as a secret** for `nqudmlzugtssfqaebaqb`
      (server-only, never `VITE_`, never `.env` — it bypasses every RLS policy).
      Do this first: lesson completion runs through the service-role client, so
      without it no learner can earn XP.
- [ ] **Enable Google sign-in in Supabase.** The code now calls Supabase's own
      `signInWithOAuth` (the Lovable helper is gone). In the dashboard: turn on
      Google under Authentication → Sign In / Providers with a Google OAuth
      client ID and secret (its authorised redirect URI is
      `https://nqudmlzugtssfqaebaqb.supabase.co/auth/v1/callback`), set the Site
      URL, and add `<your-domain>/dashboard` and
      `http://localhost:8080/dashboard` to the redirect allow-list. Until then the
      button shows "Google sign-in is unavailable"; email sign-in is unaffected.
- [ ] **Set `MENTOR_PROVIDER` and the matching API key** as secrets (see
      `.env.example`). Unset, the mentor falls back to the old scripted replies —
      the feature looks alive but isn't real.
- [ ] **Confirm mentor monthly caps** — Free 10 / Pro 500 / Lifetime 500, now in
      `src/lib/entitlements.ts`. Roughly $10/month of model spend per maxed-out
      Pro learner against $19 of revenue. Pricing copy was updated to match.
- [ ] **Flip `ENTITLEMENTS_ENABLED` to true** once a path has enough written
      lessons that a Free tier is worth having. Nothing is gated until you do.
- [ ] **For real payments:** set `PAYMENTS_PROVIDER=stripe`, add
      `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and the three price IDs, and
      register `https://<your-domain>/api/webhooks/stripe` in the Stripe
      dashboard for `checkout.session.completed` and
      `customer.subscription.deleted`.
- [ ] **Set `CRON_SECRET` and schedule the re-engagement job** — any cron that can
      `POST /api/cron/reengagement` with `Authorization: Bearer $CRON_SECRET`, once
      a day. Without it the emails exist but nothing ever sends them. Add
      `?dry=1` first: it reports who *would* be mailed and sends nothing.
      For real delivery also set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`,
      `EMAIL_FROM` (a verified sender) and `APP_URL`.
- [ ] **Set `CERTIFICATE_SIGNING_SECRET`** before the first certificate is issued.
      It falls back to the service-role key, which works — until you rotate that
      key, at which point every signature issued before the rotation stops
      verifying (the issuing record stays valid, the page says "not confirmed").
- [ ] **Generate VAPID keys for push** — `bun run push:keys` prints
      `VITE_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and
      `VAPID_SUBJECT`. `VITE_VAPID_PUBLIC_KEY` is public and can go in `.env`;
      the other three are secrets (set the subject to a real contact).
      Unset, the profile toggle stays hidden and every nudge goes by email.
      Generate once and keep them: a new pair drops every browser subscription.
- [ ] **Decide whether to self-host Pyodide.** Python challenges fetch ~10MB of
      WebAssembly from jsDelivr on first run. `VITE_PYODIDE_URL` points it at
      your own copy if you would rather not depend on a CDN.
- [x] ~~**Historical filler XP cleanup**~~ — not needed: the new database
      started empty on 2026-09-19, so it holds no rows for unwritten lessons.
      `supabase/maintenance/backfill-filler-xp.sql` stays for the old Lovable
      Cloud database only.

---

## Decisions

- **Real learners, not a marketplace template** (confirmed 2026-09-18). This is
  why the mentor calls real models, plans are enforceable, payments are real
  behind a flag, and seeded data is labelled wherever it meets live rows.

## Incidents

- **2026-09-17 — Lovable merge deleted the local work.** Lovable built the
  "remaining pages" from the old `5743488` snapshot, and its merge `a35636a` kept
  Lovable's tree wholesale, deleting server-authored XP, review, entitlements,
  certificates, their migrations and the tests. Restored 2026-09-18 by `5dd429f`,
  a forward merge (not a force push — `AGENTS.md` forbids rewriting history
  Lovable has synced). Lovable's pages were earlier drafts of routes that already
  existed, so none were kept. Before editing in Lovable, make sure it has synced
  past `5dd429f`.

---

## Done

- [x] **The answer key no longer ships to the browser** (2026-09-19) — lesson
      bodies moved to `src/content/lesson-bodies.server.ts`, which the Start
      plugin won't bundle for the client. Pages learn which lessons exist from a
      generated manifest (`bun run lessons:manifest`), load lessons without
      answers/explanations/solutions through `getLessonFn`, and check answers with
      `checkAnswerFn`, which returns the explanation only for a right answer — a
      wrong mcq pick no longer lights up the correct option. Review gets answers
      back with its grade; placement is graded server-side, which also fixed
      placement answers colliding across lessons (every lesson's first question is
      `q1`). Verified in the production build: no explanation or solution text in
      `.output/public`. Tests guard the manifest, the public shape, and static
      imports of the bodies.

- [x] **Course figures are derived, not invented** (2026-09-19) — the
      hand-typed `hours`, `rating`, `students` and `popularity` are gone from
      `curriculum.ts`. Length is the sum of the written lessons' minutes
      (`liveMinutes`), "practical tasks" (which counted planned lessons labelled
      practice) is now the number of written lessons with a checked coding
      challenge, and the catalog's "Most popular"/"Highest rated" sorts became
      "Most written". Instructors are still invented names — see below.
- [x] **Git questions test reasoning, not recall** (2026-09-19) — each question
      now reads real `git status` / `git log --graph` / conflict output and asks
      what happens or what to do; correct answers are spread across positions
      (they were all option B).

- [x] **Database set up** (2026-09-19) — all 11 migrations applied to
      `nqudmlzugtssfqaebaqb` with `supabase db push` and recorded in its migration
      history; all 15 tables answer, and an anonymous write to `lesson_progress`
      is refused. `types.ts` regenerated from the live schema, replacing the
      hand-written tables; `tsc` is clean against it.

- [x] **#1 Filler lessons** — `fallbackBody()` deleted. A lesson exists only if it
      has an authored body; everything else is a visible "coming soon" slot that
      awards no XP, counts in no denominator, and blocks its path's certificate.
      `src/content/lessons.ts`, `src/lib/certificates.ts`, and every surface that
      shows progress. Landing/catalog copy now advertises live lessons, not
      planned ones.
- [x] **#4 XP client-authored** — `completeLessonFn` in `src/lib/learning.functions.ts`
      is now the only writer of XP, level, streak, `lesson_progress` and
      `daily_activity`. It re-checks the learner's answers against the authored
      body and derives XP from it. Migration `20260916120000` revokes the client's
      grants on those columns and tables.
- [x] **#9 Streak copy vs streak rule** — the dashboard reads
      `profiles.last_active_day` instead of inferring the streak from XP. The old
      copy warned every learner their streak was at risk minutes after they'd
      secured it, because no lesson is worth the full 150 XP daily goal.
- [x] **#6 Project milestones** — `project_milestones` table, one row per tick,
      with optimistic updates in `useProjects.ts`. They used to live in React
      state and cleared on reload.
- [x] **#7 Community likes** — `post_likes` table with a trigger keeping
      `community_posts.likes` honest, replacing the `localStorage` version.
      Seeded example posts are read-only (they aren't database rows).
- [x] **#12 Analytics (instrumentation half)** — `src/lib/analytics.ts` +
      `analytics_events` table + `supabase/analytics-queries.sql`. Tracks
      pageviews, signup, onboarding, path choice, lesson start, lesson complete
      (server-side, so it can't be faked), coming-soon views, challenge runs,
      mentor usage, project submissions and the checkout funnel. The queries file
      answers activation, lesson funnel, D1/D7, what-to-write-next, where people
      get stuck, mentor usage and checkout conversion.

- [x] **#2 AI mentor** — real models behind a provider seam
      (`src/lib/mentor-providers.server.ts`): Anthropic (official SDK, default
      `claude-opus-5`), OpenAI and DeepSeek (shared chat-completions adapter),
      or `mock` for the scripted fallback. `mentorReplyFn` in
      `src/lib/mentor.functions.ts` runs it server-side with the authored lesson
      as context, persists both sides of the conversation to `mentor_messages`,
      and meters usage per plan. Relents and shows a worked solution after 3
      failed challenge runs. Decisions recorded 2026-09-16: real learners (not a
      marketplace template), provider-agnostic, conversations persist, no
      progress history in context yet.

- [x] **#3 Plan enforcement, trials and payments** — built and shipped **off**.
      `src/lib/entitlements.ts` is the single source of truth for what each plan
      may do; `VITE_ENTITLEMENTS_ENABLED` / `ENTITLEMENTS_ENABLED` (default
      `false`) unlocks everything until there is enough content to gate. Enforced
      server-side in `learning.functions.ts` (module lock, monthly practice
      quota), `mentor.functions.ts` (message cap) and `projects.functions.ts`
      (submission), with matching locks in the UI. 14-day card-free trial
      (`startTrialFn`, once per account). Payments run through the same kind of
      seam as the mentor: `PAYMENTS_PROVIDER=mock|stripe`, real Stripe Checkout
      plus a signature-verified webhook at `/api/webhooks/stripe`. Every plan
      write is server-side now — the migration revoked the browser's grant on
      `profiles.plan`. Certificates are recorded in `issued_certificates` the
      moment they are earned, so they stay valid after a downgrade. Decisions
      recorded 2026-09-16: limits real but flag-overridable, enforce after
      content, payments real but flag-overridable, certificates survive
      downgrade, 14-day trial.

- [x] **#5 Python was simulated** — Python now runs for real: CPython compiled to
      WebAssembly (Pyodide) in a Blob worker, `src/lib/python-runtime.ts`, loaded
      from a CDN so nothing is added to `package.json`. The two authored Python
      challenges had their tests rewritten from substring matches into real
      expressions evaluated against the learner's namespace. When the runtime
      can't be reached the old simulation still answers, but the result carries
      `engine: "python-simulated"` and the UI says so — a simulated run never
      presents itself as a real one. Query 10 in `analytics-queries.sql` tracks
      how often that happens.

- [x] **#12b Re-engagement** — `POST /api/cron/reengagement` (bearer
      `CRON_SECRET`, routed in `src/server.ts` before the Start handler) selects
      learners whose streak breaks tonight, and those dormant 7 or 30 days. One
      email per learner per run, deduplicated by the database, the 30-day note
      sent once ever. Delivery goes through an `EMAIL_PROVIDER=mock|resend` seam.
      Consent is `profiles.email_optin`, filtered in the query, toggleable from
      the profile page, and every email carries a signed unsubscribe link served
      at `/unsubscribe` — POST-only, because mail scanners follow links. Query 9
      measures whether any of it actually brings people back.

- [x] **#8 Onboarding personalisation** — all four answers now do something, and
      `src/content/personalisation.ts` is the map of what. Weekly hours size the
      daily and weekly XP goals (`dailyXpGoal()` — the onboarding step shows the
      number as you pick it, and the dashboard says where it came from); the goal
      changes what the dashboard pushes you toward; the starting level drives the
      suggestion on a roadmap and the placement check.

- [x] **#10 Seeded users in the live leaderboard** — seed rows are badged
      "Sample" everywhere they appear, never counted in a real learner's rank,
      dismissible, and hidden automatically once eight real learners are ranked.

- [x] **#11 Certificate verification** — `/verify` and `/verify/$certificateId`,
      public and unauthenticated. `issued_certificates` now stores an HMAC
      signature written at issue time (`src/lib/signing.server.ts`). The page
      reports two separate facts: the issuing record exists (only the service role
      can write that table) and the signature still matches, which is what catches
      a doctored printout. The ID and the verify URL are printed on the
      certificate itself.

- [x] **#13 Spaced review and placement** — every completed lesson with a question
      joins `review_items`, due tomorrow. `/review` asks those questions again;
      the server re-checks them and pays a fifth of the lesson's XP, capped.
      Intervals widen on a correct answer and reset to a day on a wrong one
      (`src/lib/review-schedule.ts`, pure and tested); reviewing early is allowed
      but pays nothing. A review holds the streak, like a lesson — the copy says
      so. `/placement/$pathId` asks real questions from the written lessons and
      recommends a starting module; it awards no XP and marks nothing complete,
      on purpose.

- [x] **#14 Tests** — `bun test`, 76 tests in `tests/` covering the level curve,
      goal sizing, live-vs-unwritten lessons, path completion and certificate
      ids, answer checking (the rule that decides whether XP is paid), review
      scheduling, plan entitlements including the trial, the mentor's history
      summary, and web-push encryption/VAPID signing. They are outside
      `src/` so `bun:test` needs no extra dependency. Still no component or
      integration tests.

- [x] **Mentor: progress history as context** — `src/lib/mentor-history.ts`
      (pure, tested) turns `lesson_progress` and `review_items` into a few lines
      under a hard 1,200-character budget: what they keep missing on review, what
      they recall reliably, what they finished recently, whether they're
      revisiting this lesson, and a pile of overdue reviews. Only fetched when a
      real model will read it; rows for unwritten lessons are ignored; a new
      learner adds nothing to the prompt.

- [x] **Push notifications** — web push written against RFC 8291/8292 in Web
      Crypto (`src/lib/web-push.server.ts`, no `web-push` package, because it
      needs `node:crypto` and the build targets a worker), with the encryption
      checked byte-for-byte against the RFC's worked example. `push_subscriptions`
      is client read-only; subscribe/unsubscribe/test go through
      `src/lib/push.functions.ts`. `public/push-sw.js` only shows notifications:
      no caching, no fetch handler. Per-device toggle and "Send a test" on the
      profile page, hidden until VAPID keys exist. The re-engagement job tries push
      first when the learner has a device, falls back to email only if no device
      accepted it and they have email on, and never sends both on the same day.
      Dead subscriptions (404/410) are deleted. Query 9 now splits return rate by
      channel.

### Left to implement

- [ ] **Instructors are invented people.** Every course names an instructor
      ("Tomas Beck, Platform Engineer") who doesn't exist. Replace with real
      authors or drop the card.
- [ ] **Component and integration tests** — the unit layer is covered; nothing
      exercises a route end to end.

---

## The constraint that outranks this whole list

**8 of 71 lessons are written** (the roadmap in `src/content/curriculum.ts` has
71 slots). Git & GitHub is the first complete course, 3 of 3, written 2026-09-19.
Every item on the review's ranked list is now closed, which changes nothing about
this: the platform tells the truth, measures itself, remembers what you learned
and can prove what you finished — about eight lessons. Nothing above changes the
product's value until one whole path is written. The engineering here was about making sure the platform tells the truth
while the content gets written — it is not a substitute for writing it.
