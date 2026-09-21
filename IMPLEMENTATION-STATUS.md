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

- [ ] **Run one SQL, one Python and one React challenge in a real browser.**
      Each is verified by `lessons:verify` (SQL/Python on local CPython, React
      under happy-dom) but none has been clicked in Chrome yet. Open
      `/learn/sql/sql-core.select`, `/learn/genai/ai-rag.embeddings` and
      `/learn/react/react-core.state`, click Run, and expect results — plus a
      rendered Preview for React.
- [ ] **Set `SUPABASE_SERVICE_ROLE_KEY` as a secret** for `nqudmlzugtssfqaebaqb`
      (server-only, never `VITE_`, never `.env` — it bypasses every RLS policy).
      Do this first: lesson completion runs through the service-role client, so
      without it no learner can earn XP — Complete fails with "Missing Supabase
      environment variable(s): SUPABASE_SERVICE_ROLE_KEY". Local dev: put it in
      `.env.local` (git-ignored; Bun loads it) and restart the dev server.
      Production: the host's environment settings. It's the Secret key (or the
      legacy service_role key) under Project Settings → API Keys.
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
      `?dry=1` first: it reports who _would_ be mailed and sends nothing.
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

- [x] **The operator paths say which one is longer, and call their units
      lessons** (2026-09-21) — the two paths now differ by roughly 2:1, the path
      pages compute ~6 weeks against ~3, and neither overview said why. Each
      names itself as the longer or shorter path, points at what accounts for
      the gap, and points at the other, since choosing between them is the
      actual question on those pages. The hours stay computed — a duration
      repeated in prose is the hardcoded `weeks` field two entries below,
      reintroduced somewhere harder to find. Both courses also still declared
      `unitLabel: "tasks"`, so a rewritten lesson opened as "TASK 1 OF 51"; the
      unit word and the section word were one field offering lessons-in-modules
      or tasks-in-levels, and not the lessons-in-levels both courses are, so
      they are now separate fields.
- [x] **Counts are pluralised** (2026-09-21) — every operator path holds exactly
      one course, so "1 courses" shipped to the landing page, the path index and
      the path page the day those paths did. The same hardcoded plural was
      waiting in "1 of 1 lessons live" on a path header and its course list,
      "You're 1 lessons in" on an empty profile, and "~1 weeks" for any learner
      whose stated pace makes a short path fit in one, since `pathWeeks()` floors
      at one. `plural()` in `utils.ts` picks the noun once instead of seven
      ternaries, and the per-course row now takes its noun from that course's
      own vocabulary rather than assuming "lessons".
- [x] **The landing hero stopped clipping itself on phones** (2026-09-20) — the
      hero grid's columns inherited `min-width: auto`, so the lesson panel's
      411px min-content width stretched the single mobile column past the
      viewport and the section's `overflow-hidden` clipped the spill rather than
      scrolling it. The headline, the body copy and both CTAs were cut off —
      103px lost at 320px wide, 37px at 390px — while `document.scrollWidth`
      still read 390, which is why no horizontal-overflow check had caught it.
      `min-w-0` on both columns. Desktop is unchanged at 685/619.
- [x] **Every control has a 44px tap target on touch** (2026-09-20) — controls
      sat at Tailwind's h-8/h-9/h-10, right for a mouse and too small for a
      thumb. The floor is raised under `@media (pointer: coarse)` rather than at
      a breakpoint, so a touch laptop gets it and a mouse-driven desktop keeps
      its exact proportions. `min-height` clamps without a specificity fight, and
      an inline box ignores it, which leaves links inside a sentence alone — the
      case WCAG 2.5.8 exempts. `.challenge-preview` is excluded because it
      renders the learner's own component. 139 undersized controls across 16
      routes became 2, both the "All" filter chip and short on width only.
- [x] **Path duration is computed, and the invented instructors are gone**
      (2026-09-20) — `CareerPath.weeks` was a hardcoded number shown as
      "~N weeks" on three surfaces and it described no pace at all: Full-stack
      claimed 30 weeks for 63 hours while Claude Operator claimed 12 for 37, a
      sevenfold spread between two numbers in the same typeface. `pathHours()`
      and `pathWeeks()` in `curriculum.ts` replace it, counting the portfolio
      projects as well as the lessons — projects are most of the work, 40 of
      Frontend's 63 hours — and dividing by the learner's own
      `profile.hours_per_week`, which onboarding already collects. The default
      for a signed-out visitor is `DEFAULT_HOURS_PER_WEEK` in
      `gamification.ts`, derived from `WEEKLY_XP_GOAL` so a path card and the
      dashboard can never describe different weeks. In the same pass the
      `instructor` field and its card went: sixteen courses named people who do
      not exist, under the heading "Your instructor", in a product that badges
      its sample leaderboard rows and labels its mock project reviewer.
- [x] **Lesson icons follow the body, not the declared type** (2026-09-20) —
      `LessonMeta.type` is authored intent and had drifted from the bodies on
      131 of 301 lessons, including all 172 Claude Operator tasks, which are
      typed `"challenge"` and run no code. The course page therefore drew a
      wrench on lessons that open an editor and an editor on lessons that ask
      you to go and work in your own terminal. `lessonShape()` in `lessons.ts`
      reads the manifest instead and returns what the learner is actually
      handed; `type` is kept for analytics and no longer decides anything a
      reader sees. 237 of 301 icons changed.
- [x] **Generative AI Engineering re-timed and re-scoped** (2026-09-20) — the
      course carried the catalog's densest prose and mid-pack challenges at its
      lowest per-lesson minutes (13.8), so six durations went from 83 minutes
      total to 139. Its description claimed "Work with LLM APIs" and "ship a
      chat feature", neither of which it did; `ai-prompt.api` now covers the
      request and response shape, message roles, `stop_reason`, tokens and the
      context window, verified against the live docs rather than recalled. The
      unbacked `"APIs"` skill came off the `ai` and `python` paths.
- [x] **Both operator courses rewritten as lessons** (2026-09-21) — Claude
      Levels 2-6 and the whole ChatGPT course followed Level 1 off the generated
      wrapper. Claude: 172 tasks -> 51 lessons, 36.8h -> 18.0h. ChatGPT: 60
      tasks -> 24 lessons, 17.1h -> 8.5h, which had the same defect measured at
      71.5% repeated text. With no templated levels left, `ClaudeTaskSpec`, the
      `task()` helper and both assembly steps are deleted and the shared
      `AuthoredLesson` type lives in `authored-lesson.ts`. 63 of the 75 lessons
      are assessed and the six capstones per course stay attested, so
      `chatgpt-operator` joins `claude-operator` at `eligible` — neither path
      could previously certify at all. Claude facts are checked against
      code.claude.com, which corrected several (deny/ask/allow order ignores
      rule specificity; managed settings outrank the command line; a PreToolUse
      hook exiting 2 pre-empts permission rules; an omitted subagent `tools`
      field inherits everything). Both suites now assert no MCQ option is
      correct more than 35% of the time — the first drafts had B correct on 64
      of 89 and 61% of questions respectively.
- [x] **Claude Operator Level 1 rewritten as lessons** (2026-09-20) — the
      generated wrapper stamped each level's guide, safety note and reference
      onto every task in it, so ~77% of any page was identical to the page
      before it and the unique part was one sentence naming the task; twenty
      such pages covered basic prompting. Level 1 is now six authored lessons in
      `claude-prompting.server.ts` carrying the same twenty missions as practice
      inside the lesson that teaches them, with real MCQs on the judgement
      calls. `ClaudeLevelDefinition` became a union of templated and authored
      levels so the other five keep working and convert one at a time. Five
      assessed lessons make `claude-operator` `assessable`, so the path's
      credential moves off `self-directed` for the first time — 37 hours of work
      could previously never certify. 172 tasks -> 158 lessons.
- [x] **Claude Operator examples: the renderer, and the Level 5 permissions and
      hooks clusters** (2026-09-20) — `ClaudeTaskSpec` gained
      `exampleLanguage`, because the old sniff asked whether an example started
      with `claude` and so rendered every settings, skill and hook snippet as
      plain text. Eleven worked examples followed on Level 5, each checked
      against `code.claude.com` rather than memory, which caught three things
      training would have got wrong: Bash rules are `Bash(git status *)` with a
      space (the colon form is only a trailing shorthand), `Write(path)` rules
      are accepted and never consulted so path rules must use `Edit(...)`, and
      deny beats allow regardless of specificity — which inverts the obvious
      way to write the "protect .env but keep .env.example" rule.

- [x] **Claude course made honest: self-attested, not fake-graded** (2026-09-19)
      — the 172 tasks carried a generated MCQ whose right answer was always the
      first option, paying 70–145 XP each (~17k, dwarfing the catalog), filing
      172 review items that asked one repeated question, and making
      `claude-operator` certificate-eligible for template content. The question
      is gone: the tasks ask nothing and run nothing, which is what they always
      were. `isLessonAssessed()` in `src/content/lessons.ts` derives that from
      the manifest rather than a flag, `pathCompletion().eligible` now requires
      at least one assessed lesson, and XP is a flat 15 — enough to hold a
      streak, ~2.6k across the course. `/paths/$pathId` and
      `/certificates/$pathId` say plainly why the path issues no certificate.
- [x] **Claude task prose off the client bundle** (2026-09-19) — the authored
      missions, evidence, guides and safety notes were in `claude-course.ts`,
      which `curriculum.ts` imports, so 28.3 KB of server-only prose (and every
      MCQ's answer) sat in the main chunk on the first-paint path. Specs moved
      to `claude-levels.server.ts`; the client-safe skeleton is generated into
      `claude-course.gen.ts` by `bun run lessons:manifest`, and a test asserts
      the committed file matches the levels and contains no prose.

- [x] **JavaScript From Zero, complete** (2026-09-19) — nine new lessons and the
      two existing ones rewritten in place: values and coercion traps, functions
      and arrow bodies, guard clauses and `??` vs `||`, arrays (mutating vs not,
      `sort()` sorting as text), objects and immutable updates, map/filter/reduce
      (reduce's initial value), reading stack traces and throwing useful errors,
      the debugging method, DOM rendering with `textContent` (an XSS test),
      events with state + one render function, and a new async module (forgotten
      `await`, `Promise.all` for parallel requests — timed). Runner changes: the
      JavaScript runner is now async (tests may `await`) and reports why a test
      failed; a new `dom` language runs the learner's script against fixed markup
      in a fresh inert document per test, with a scripts-enabled Preview in an
      opaque-origin sandbox. `lessons:verify` now checks JavaScript challenges
      too — it used to skip them.

- [x] **HTML & CSS Foundations, complete** (2026-09-19) — ten lessons (the one
      existing lesson, `layout.responsive`, rewritten in place): the page
      skeleton, semantic landmarks and headings, accessible forms, the cascade,
      the box model, rem/em/ch/clamp, flexbox, grid vs flex, intrinsic
      responsive layout and mobile-first media queries. New `web` challenge
      language: the Preview renders the page for real in a fully sandboxed
      iframe (no scripts) with a Phone/Desktop toggle; tests check structure
      (the browser's own DOMParser) and which declaration wins for an element at
      a given width (`src/lib/css-cascade.ts`: importance, inline, specificity,
      order, inheritance, @media, margin/padding/flex/gap shorthands). Pixel
      layout is deliberately not graded — it can't be reproduced outside a
      browser. `tests/css-cascade.test.ts` pins the cascade to the spec.

- [x] **Data Analytics Toolkit, complete, with pandas** (2026-09-19) — six
      lessons on one messy export (duplicates, "$1,173.00" as text, "apparel "
      vs "APPAREL", a test order, a missing amount): cleaning in code, EDA that
      notices one B2B order making Footwear look like the top category, mean vs
      median and the IQR outlier rule, rates vs counts and Simpson's paradox in
      an A/B test, shaping data for charts, and KPI tiles with written
      definitions, % change for amounts and points for rates. A new "Reason with
      numbers" module covers the Statistics skill the Data Analyst path promised.
      pandas (~8 MB) loads on first import; the first run that imports it now
      gets the boot timeout, and a killed worker resets it (it previously kept
      the short timeout after a restart). This completes the Data Analyst path.

- [x] **Excel for Analysts, complete, on a formula engine** (2026-09-19) —
      `src/lib/sheet-engine.ts` is a dependency-free engine for the subset
      analysts use (operators with Excel's precedence, SUM/AVERAGE/COUNT…,
      IF/IFERROR, SUMIFS/COUNTIFS/AVERAGEIFS with criteria strings and
      wildcards, XLOOKUP, VLOOKUP including its approximate default, INDEX/MATCH,
      text functions) and Excel's fill semantics for relative, absolute and mixed
      references. HyperFormula was ruled out: GPL. The UI labels it an
      Excel-compatible subset; unsupported functions are #NAME?, not guesses.
      Learners write `G2:G13 =E2*F2` lines; tests check behaviour with
      `valueWith` (change an input, the result must follow), which catches both
      hardcoded numbers and missing `$`. Six lessons: formulas, references and
      model layout, conditional sums, lookups, pivot tables (built as one mixed-
      reference SUMIFS grid with a reconciling check cell) and charts.
      `tests/sheet-engine.test.ts` pins the engine to Excel's behaviour.

- [x] **Python Essentials, complete** (2026-09-19) — seven new lessons and the two
      existing ones rewritten (same ids, so progress stands): first program and
      variables, types and f-strings, conditions and truthiness, lists and loops
      (aliasing, range), dictionaries (KeyError, counting), comprehensions (and
      when not to), functions (return vs print, the mutable-default trap), errors
      (reading tracebacks, catching narrowly, raising your own), and a CSV report
      that reads and writes real files in Pyodide's file system. Tests can now
      check printed output: the Pyodide driver exposes it as `__stdout__`, and
      `lessons:verify` mirrors the driver exactly. This completes the Python
      Developer and AI / GenAI Developer paths.

- [x] **React in Practice, complete, on a real React runner** (2026-09-19) —
      `src/lib/react-runtime.ts` compiles the learner's JSX with sucrase and
      renders it with the app's own React: hidden for the tests, visible in a
      new Preview panel. Tests act like a user (click, fill, blur, read the
      screen) and a failing one says why ("Couldn't find the text …"). Sucrase
      is a lazy 201 KB chunk loaded only by a React challenge. Eight lessons:
      components, props/composition, state without mutation or stored derived
      values, effects with cleanup, a custom debounce hook, keys (the index-key
      bug, reproduced), a new forms lesson the course description promised, and
      the four data states with stale-response handling. `lessons:verify` runs
      every React solution through the same runtime under happy-dom.

- [x] **Machine Learning Basics, complete** (2026-09-19) — six lessons: fitting
      a line and beating a baseline, precision/recall against the cost of a
      mistake, held-out sets and preprocessing leakage, overfitting with
      k-nearest neighbours, feature encoding and target leakage, and production
      (training/serving skew, drift, fallbacks). Evaluation, overfitting, features
      and deployment were advertised with no lesson; they now have two modules.
      Challenges build each mechanism in plain Python; scikit-learn equivalents
      are shown but not run (30 MB+ in the browser). Relabelled Intermediate from
      "Advanced" — it's the basics and assumes only Python.

- [x] **Generative AI Engineering, complete** (2026-09-19) — six lessons: prompt
      specs and keeping user text as data, validating structured output, embeddings
      and cosine similarity, chunking and grounded RAG prompts, tool calling and a
      safe agent loop, and evaluation sets with regression tracking. Tool calling
      and evaluation were advertised skills with no lesson; they now have a
      "Shipping it" module. Every challenge is offline Python (scripted stand-ins
      for the model), so it runs for real on Pyodide with no API key.
      Provider-neutral on purpose: no model names, prices or SDK calls to go stale.

- [x] **SQL for Analysis, complete** (2026-09-19) — five lessons (SELECT/WHERE,
      joins, GROUP BY/HAVING, a new CTEs lesson the course advertised but had no
      slot for, window functions), each ending in a query challenge that runs
      for real: SQLite inside the Pyodide runtime, against one shop dataset
      (`src/content/datasets/shop.ts`) built with the traps analysis hits — a
      customer with no orders, a missing city, refunds and pending orders, a
      discounted sale, per-order shipping that a join double-counts. No
      simulation fallback: if the engine can't load, the run says so. Every
      number the lessons quote was computed from the data;
      `bun run lessons:verify` checks each solution passes and each starter
      fails. **Not yet run in a real browser** — see "Blocked on you".

- [x] **Git & GitHub course, complete** (2026-09-19) — a "Git from zero" module
      (why version control, first repository and `.gitignore`, reading
      status/diff/log, remotes and a rejected push) ahead of the everyday-git
      module, so "Beginner" is true. Every lesson ends with a "Try it on your
      machine" exercise; they pay no XP because the app can't check them. Note:
      Free unlocks a course's first module, so with enforcement on, Free gets
      the four basics and "Everyday git" needs a plan.

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

- [ ] **Component and integration tests** — the unit layer is covered, and
      happy-dom now runs React in tests (`tests/react-runtime.test.ts`), so
      component tests for the app itself are unblocked; none exist yet, and
      nothing exercises a route end to end. This is where a defect would now
      hide: `pathCompletion()`'s four credential states, signed-out visibility
      and the entitlement gates all branch in route code that nothing runs.

- [ ] **Worked examples for Claude Operator Levels 1, 3, 4 and 6** — Level 2 is
      finished (17 of 32 tasks) and Level 5 is now 11 of 35. The rest are bare:
      Level 1 has 1 of 20, Level 3 has 1 of 35, Levels 4 and 6 have none. Not
      every task wants one — a judgement task like "Spot a delegable task" is
      spoiled by a worked answer — so the scope is ~23 more, not 129. Clusters
      left: subagent definitions (6), skills format (5), autonomy artifacts (8),
      CLI bounding flags (3), worktrees (1).

- [ ] **Make `bun run lint` able to go green** (2026-09-20: 129 errors → 4).
      `eslint --fix` cleared the 128-error prettier backlog across ten files.
      What is left cannot be auto-fixed and keeps the gate red, so a genuine
      regression would be invisible in the noise: - 3 prettier errors in `src/integrations/supabase/types.ts`, deliberately
      unformatted because it is generated from the database. Adding it to the
      eslint ignore list is the real fix. - 1 `prefer-const` at `previewAuthStorage.ts:54`. Not auto-fixable because
      the declaration and assignment are split; safe to collapse, since
      `finish` only reads `timer` when invoked and neither caller can run
      before the assignment. It is a Lovable-synced file, so expect it back. - 6 `react-refresh/only-export-components` warnings in shadcn `ui/`
      primitives, which are regenerated through the CLI.
      Separately, `prettier --check` flags four files eslint does not cover:
      `AGENTS.md`, `CLAUDE.md`, `src/routes/README.md`, `src/styles.css`.

- [ ] **Claude Operator assesses nothing.** 172 tasks, 37 hours, zero graded
      questions, so the path is permanently `self-directed`. That is the correct
      mechanical outcome for work done in the learner's own terminal, but it
      means the single largest commitment in the catalog yields no credential
      while a 34-hour path does. A product decision, not a bug.

---

## The constraint that outranks this whole list — now lifted

**129 of 129 lessons are written.** Every course in `src/content/curriculum.ts`
is published (the Claude Operator course's 172 self-attested tasks are counted
separately). UX Design Fundamentals (3) and Product Management Craft (3) landed
together on 2026-09-20; `ai-prompt.api` followed, after a review found the
Generative AI course used `{"role": "user", …}` and `call_model(prompt)` in
three lessons without ever saying what a model API is.

**Seven of the eight paths can issue a certificate:** Frontend Developer,
Full-stack Developer, Python Developer, Data Analyst, AI / GenAI Developer,
UX/UI Designer and Product Manager. Issuing one still needs
`SUPABASE_SERVICE_ROLE_KEY` set (see "Blocked on you") — that is now the only
thing between a finishing learner and a certificate.

Claude Operator is the eighth, and it is deliberately `self-directed`: every
task on it is self-attested, so it never certifies. The same applies to one
lesson inside Figma for Product Teams (`fig-handoff.capstone`) — the work
happens in the learner's own file, so it pays `ATTESTED_XP` and is excluded from
the certificate denominator.

What this changes: the honest answer to "is there enough here to learn from" is
now yes for every path in the product. The engineering was about making the
platform tell the truth while the content got written; the content is written.
