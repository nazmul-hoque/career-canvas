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

- [x] **Run one SQL, one Python and one React challenge in a real browser**
      (2026-09-27, headless Chrome). `sql-core.select` ran on SQLite
      (WebAssembly), `ai-rag.embeddings` on CPython (WebAssembly), not the
      simulation, and `react-core.state` rendered its Preview. Each starter
      failed some tests and each reference solution passed all of them, with no
      console errors.
- [x] **Set `SUPABASE_SERVICE_ROLE_KEY` as a secret** for `nqudmlzugtssfqaebaqb`
      (server-only, never `VITE_`, never `.env` — it bypasses every RLS policy).
      Do this first: lesson completion runs through the service-role client, so
      without it no learner can earn XP — Complete fails with "Missing Supabase
      environment variable(s): SUPABASE_SERVICE_ROLE_KEY". Local dev: put it in
      `.env.local` (git-ignored; Bun loads it) and restart the dev server.
      Production: the host's environment settings. It's the Secret key (or the
      legacy service_role key) under Project Settings → API Keys. Done
      2026-09-27 in `.env.local`: a signed-in completion wrote XP, streak and
      progress. Make sure the production host has it too.
- [x] **Apply `20260922120000_split_sql_course`** with `supabase db push`
      (confirmed applied 2026-09-27: `supabase migration list` shows every
      local migration on the remote). The
      SQL course split in two, and the migration moves stored progress, review
      items and mentor history onto the new course and lesson ids. Until it
      runs, a learner who had done GROUP BY, CTEs or windows sees them as not
      done, and those review cards drop out of `/review`.
- [ ] **Enable Google sign-in in Supabase.** The code now calls Supabase's own
      `signInWithOAuth` (the Lovable helper is gone). In the dashboard: turn on
      Google under Authentication → Sign In / Providers with a Google OAuth
      client ID and secret (its authorised redirect URI is
      `https://nqudmlzugtssfqaebaqb.supabase.co/auth/v1/callback`), set the Site
      URL, and add `<your-domain>/auth**` and
      `http://localhost:8080/auth**` to the redirect allow-list (the callback is
      `/auth?complete=true`, which routes new learners to onboarding; a URL
      missing from the list falls back to the Site URL and skips onboarding). Until then the
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

- [x] **SQL for Analysis is hard to follow** (reader review, 2026-10-12). The
      SQL and the traps are right; the presentation isn't. Lessons quote facts
      the reader can't see, string figures together in prose, pack 4–6 ideas
      into one unbroken page (`sql-time.dates` is two lessons), and a wrong quiz
      pick says only "Try again". Plan, in order:
      1. ~~Blocks for it~~ — done 2026-10-12: `heading` and `table` lesson
         blocks (`LessonTable.tsx`). A table can be `collapsed` ("see the
         data") and carry a `source` query that `tests/lessons.test.ts` re-runs
         on its dataset, so a quoted figure fails the suite if it drifts.
      2. ~~Wrong-answer notes~~ — done 2026-10-12: an mcq option can be
         `{ text, whyNot }`; `answerVerdict` (`lesson-grading.ts`) returns the
         picked option's note on a miss, shown in the lesson, `/review` and
         placement. All 45 wrong options in SQL for Analysis have one; other
         courses opt in through `FEEDBACK_COURSES` in `tests/lessons.test.ts`.
      3. ~~Content~~ — done 2026-10-12: `sql-time.dates` split into *Dates,
         weeks and months* (new challenge: two averages per month) and
         `sql-time.calendars` (2 learners had finished the old lesson; agreed
         to let them see the new one as unfinished). Every lesson has a
         folded "see the data" panel; lessons 1 and 3–6 have subheadings and
         query-checked tables in place of number-heavy prose (grain defined
         and the duplicated rows shown in 1, ROW_NUMBER/RANK/DENSE_RANK side
         by side in 3, like-for-like and Harrogate's partial month in 5, the
         per-order reconciliation in 6, its query kept back as the challenge's
         answer). Challenge prompts say each test checks one thing; the
         capstone's interpretation question now follows its challenge.
      4. ~~Say what a failing test got~~ — done 2026-10-12: a Python/SQL test
         can carry `show`, evaluated by the driver only on failure and printed
         under it ("Your query gives 7", NULL for None). Only `PYTHON_DRIVER`
         changed; the worker string forwards tests untouched. All 49 SQL for
         Analysis tests have one; `lessons:verify` fails on a `show` that
         raises, and `--shows` prints each starter's messages. Checked in
         Chrome on real Pyodide (SQL and a plain Python challenge).

- [x] **Crawl review of 2026-10-09, group 1** — removed the unsupported "4.8
      average course rating" from the homepage; lesson pages server-render
      their title, summary and opening prose (auth is client-side, so SSR used
      to send only "Loading your workspace…") with canonical and breadcrumb
      metadata; the sitemap lists every live lesson plus `/community` and
      `/leaderboard`; `/learn/$courseId` 301s to `/courses/$courseId`; the level
      filter only offers levels a course has; the leaderboard drops its podium
      and numbers only real learners while samples show; `/admin` renders the
      ordinary 404 for non-admins; the mentor panel shows the month's allowance
      before the first message and links to Pro when a Free learner is low;
      `site.webmanifest`, app icons and a 1200×630 `og-image.png` on every page.
- [x] **Terms, Privacy, About** (2026-10-09) — `/terms`, `/privacy` and
      `/about` for Equawire Inc. (Ontario), linked from a footer now on every
      page, from sign-up ("16 or over" and the Terms) and from checkout (the
      14-day refund). The company facts, refund window and minimum age live in
      `src/lib/company.ts`; the Privacy Policy names only processors the code
      actually calls (Supabase, Gemini, Google sign-in, Stripe, Resend, browser
      push, jsDelivr). Change it when a provider changes, and bump
      `LEGAL_UPDATED`. **Not legal advice: have a lawyer review both before
      relying on them.** Also paste `https://ascent.withcloud.io/privacy` and
      `/terms` into the Google OAuth consent screen.
- [x] **Crawl review follow-up** (2026-10-09) — `/contact` exists (the footer
      links it); `/admin` is served with a 404 status to every direct load
      (`src/server.ts`), still opening the console for a real admin; lesson
      pages server-render all their teaching text and code examples, not just
      the prose before the first one. Verified with a throwaway user: a new
      account lands on `/onboarding`, a signed-in non-admin calling the admin
      functions gets "You don't have admin access", and an admin gets the
      console. Admin Metrics returns real daily data; Log is empty because no
      admin action has been taken yet.
- [x] **Self-serve account deletion** (2026-10-09) — "Delete account" on
      `/profile`, typed confirmation checked on the server too. A Pro learner's
      Stripe subscription is cancelled first; if it can't be found, the account
      is left alone. Verified end to end against the real project with a
      throwaway user (mock payments; the Stripe branch is untested until
      `PAYMENTS_PROVIDER=stripe` has test keys). Privacy and Terms updated.
- [x] **Per-page share images** (2026-10-09) — every course and path has its
      own 1200×630 card in `public/og/`, rendered by `bun run og:images`
      (headless Chrome; set `CHROME_PATH` if it isn't found) from
      `src/lib/og-cards.ts`. Lesson pages use their course's card.
      `tests/og-cards.test.ts` fails when a title, summary, level or skill
      list changes without a re-render, or a card is left over.
- [x] **Crawl review of 2026-10-09, group 3: thin courses** — Node.js & APIs
      4 → 11 lessons (middleware and an error boundary, config and secrets,
      cursor pagination, idempotency keys, rate limiting, structured logging,
      and a bookings-API capstone; every new lesson ends in a graded
      challenge). UX Design Fundamentals 3 → 9 (synthesis, information
      architecture, wireframes, UX writing, heuristic evaluation, and the
      case-study capstone its description already promised). Product
      Management Craft 3 → 8 (RICE, roadmaps, stakeholders, staged launches,
      A/B tests). All assessed, none attested. Path durations recompute from
      the new minutes.

- [x] **Community examples step aside; trending is real** (2026-09-24) — the
      six example posts in `src/content/community.ts` now hide once 5 real
      posts exist (they still show when the count can't be loaded), and a
      topic with nothing in it gets an empty state instead of a blank column.
      Trending ranks real posts from the last 14 days by likes plus replies;
      it used to pick from the examples forever, so a real post could never
      trend. Examples fill it only while they fill the feed, now labelled.
      Rules in `src/lib/community-feed.ts`, tested. Topics and house rules
      stay in code by decision.

- [x] **Admin console** (2026-09-23) — `/admin`, for accounts in the new
      `admin_users` table (service-role written; grant with the SQL at the foot
      of `20260923120000_admin_roles.sql`). Users: search by name/email/id,
      activity, change plan, suspend sign-in, delete account (refused for a
      paid Stripe plan and for other admins). Moderation: open/resolved/
      dismissed reports, delete a post, unpublish a portfolio project.
      Metrics: headline counts and daily sign-ups, completions and active
      learners. Content: read-only written/graded/usage per course — lessons
      stay in `src/content/`. Every change lands in `admin_actions`, shown
      under Log. Server functions in `src/lib/admin.functions.ts` re-check
      admin on every call.

- [x] **SQL checkpoint and capstone** (2026-09-22) — both SQL courses are now
      complete as planned. Foundations ends its Querying module with an
      empty-editor *March packing list* (four-table join, half-open dates,
      COALESCE, a discount CASE, a NOT EXISTS first-order flag). Analysis ends
      with an Independent project, *Is the website taking over?* (conditional
      sums by channel, a share, LAG across the year boundary), whose question
      asks the learner to read the April fall as Harrogate opening, not the
      website losing ground (56.8% vs 56.5% of web+Leeds). Foundations: 6
      lessons; Analysis: 7.
- [x] **SQL for Analysis: pivots and data-quality checks** (2026-09-22) —
      *Conditional aggregation* (a column per case, the `COUNT ... ELSE 0` and
      `AVG ... ELSE 0` traps, rates, 0 vs NULL) joins the Analysis module on
      the shop. *Checking the data before you trust it* opens a Checking the
      data module on a new `payments` dataset: the shop plus a card-provider
      export with one of each real fault (duplicate webhook, three spellings
      of a status, a day-first date, an orphan, a NULL amount, a short charge,
      a missing payment). Its point: totals of 1,655 vs 1,653 look like
      rounding and hide all of them. A new test fails if an authored body has
      no roadmap slot, which nothing caught before. Still to write: a capstone
      and a Foundations checkpoint.
- [x] **SQL for Analysis: an Over time module** (2026-09-22) — two lessons on
      the stores dataset. *Dates, calendars and missing days*: strftime
      bucketing, half-open ranges, week starts, julianday, trading vs calendar
      averages, and a recursive calendar LEFT JOINed with the filter in `ON`.
      *LAG and period-over-period change*: LAG/LEAD, NULL first periods,
      NULLIF, integer division, previous row vs previous period, and
      like-for-like growth (45.7% headline vs 13.8% like-for-like). Every quoted
      number is from a query on the dataset. Still to write: conditional
      aggregation, data-quality checks, a capstone, and a Foundations
      checkpoint.
- [x] **A second SQL dataset for date work** (2026-09-22) — `datasets/stores.ts`:
      two years (2024–2025) of daily sales for a website and two stores, about
      1,600 rows generated by SQL so it ships at 2 KB. It carries the cases date
      lessons need: days with no row (Sundays, holidays, a website outage), a
      zero-sales row, a store that opened mid-2025, seasonality and ~15% growth.
      A SQL challenge opts in with `dataset: "stores"`; the shop stays the
      default and unchanged. A separate business on purpose: a daily table for
      the shop would contradict its 15 orders. No lesson uses it yet.
- [x] **SQL split into Foundations and Analysis** (2026-09-22) — `sql` is now
      SQL Foundations (Beginner): SELECT/WHERE, a new *Shaping results* lesson
      (DISTINCT, LIMIT, LIKE, COALESCE, CASE), joins, a new *Subqueries* lesson
      (IN, EXISTS, the NOT IN NULL trap, subquery vs join) and GROUP BY, now
      `sql-summary.groupby`. CTEs and window functions moved to a new
      `sql-analysis` course (Intermediate), because window functions sat at the
      end of a course labelled Beginner. Data, Python and Full-stack take both.
      Bodies live in `sql-lessons.server.ts`. The three old lesson URLs 301 to
      their new addresses (`movedLesson` in `curriculum.ts`). Next batches: Foundations
      checkpoint; Analysis conditional aggregation, dates, LAG, data-quality
      checks and a capstone, which need extra dataset tables first (the shop's
      15 orders are too few for date bucketing or LAG, and adding rows would
      invalidate numbers the lessons quote).
- [x] **Python and SQL never ran for real** (2026-09-21) — `be9b275` renamed
      the module constant `DRIVER` to `PYTHON_DRIVER` so `lessons:verify` could
      import it, and the rename also rewrote the call site _inside_ the Pyodide
      worker, where the local is still `DRIVER`. The worker is built from a
      string, so TypeScript and ESLint both see an opaque template literal and
      neither noticed: every run threw `PYTHON_DRIVER is not defined`. Python
      silently fell back to the pattern simulation — labelled, so not dishonest,
      but not CPython either — and SQL, which has no fallback by design, told
      the learner "the SQL engine couldn't load… check your connection", so the
      report arrived as a network complaint. One word fixes it. The worker's
      `fatal` reply was also being discarded, which is why nothing anywhere
      distinguished a real defect from a blocked CDN; it is now logged. A test
      in `js-runtimes.test.ts` parses the worker source and fails when it
      references a constant it does not declare.
- [x] **Signing in left the learner on the login page** (2026-09-21) — the
      OAuth callback returns to `/auth?complete=1`, and the route read that flag
      with `search["complete"] === true || === "1"`. TanStack Router parses
      search with `JSON.parse`, so the value arrives as the **number** `1` and
      neither branch matched: `complete` validated to `false`, the router wrote
      that back into the URL, and the effect that calls `finishLogin` never ran.
      Supabase had already consumed the tokens from the hash, so the learner was
      signed in and stranded — the reported URL ended `?complete=false…#`. The
      flag is now `isAuthCallback()` in `auth-navigation.ts`, accepting every
      shape it can arrive in, and the callback emits `complete=true` so it round
      trips as a boolean. It still accepts `1` because that form is sitting in
      already-delivered confirmation emails. This was never Google-specific:
      email confirmation and password-reset links use the same callback.
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
      fails. Run in a real browser on 2026-09-27.

- [x] **Git & GitHub course, complete** (2026-09-19) — a "Git from zero" module
      (why version control, first repository and `.gitignore`, reading
      status/diff/log, remotes and a rejected push) ahead of the everyday-git
      module, so "Beginner" is true. Every lesson ends with a "Try it on your
      machine" exercise; they pay no XP because the app can't check them. Note:
      Free unlocks a course's first module, so with enforcement on, Free gets
      the four basics and "Everyday git" needs a plan.

- [x] **JavaScript: scope, closures and modules** (2026-09-27) —
      `js-browser.scope`, after loading scripts and before the DOM, so event
      handlers (closures over state) and React's hooks have a foundation.
      Block scope and lookup, why globals collide, `var` leaking from loops,
      closures as private state, and modules (file scope, `export`/`import`,
      `./` and `.js`, a module runs once). The runner executes one function
      body, where `export` is a syntax error, so modules are assessed by a
      question and a fill; the lesson says so and gives a two-file exercise to
      try locally. The challenge is `makeCounter` and `once`. Four plausible
      mistakes (a shared count, the count as a property, `once` forgetting its
      result or sharing state across wrappers) each fail. Still open from the
      review: a first-program lesson and HTML basics for Full-stack, and the
      classic `for`/`while` loop.

- [x] **JavaScript: fetch and JSON** (2026-09-27) — `js-async.fetch`, between
      promises and the capstone. JSON's rules and what `stringify` drops,
      `fetch` resolving on a 404/500 so `response.ok` must be checked, POSTing
      JSON, loading/empty/error states, and a first look at stale responses so
      the capstone tests that idea instead of introducing it. The challenge's
      starter declares a local `fetch` that returns real `Response` objects, so
      learners write exactly the browser code; it must stay local, because DOM
      challenges run in the app's own window. Solution passes 8/8 in Chrome and
      under happy-dom; the starter and six plausible mistakes (no `ok` check,
      unstringified body, no JSON header, GET instead of POST, button never
      re-enabled, "1 orders") each fail. `InlineText` now renders code inside
      bold and italic: 29 strings in 18 lessons had shown raw backticks, and a
      scan of all 3,719 prose strings now finds none. Still open from the
      review: scope/closures/modules, a first-program lesson and HTML basics for
      Full-stack, and the classic `for`/`while` loop. `bun test` now runs
      every in-process challenge (55: JavaScript, DOM, web, React, Excel)
      through `runCode`: the solution must pass and the starter fail. Before,
      only the manual `lessons:verify` did. One starter is exempt by name
      (`react-data.fetch`: its missing `.catch` is the lesson, and bun fails a
      test on any uncaught rejection); `lessons:verify` still checks it.

- [x] **Multiple-choice answers no longer favour B** (2026-09-27) — eleven
      courses leant on one position (JavaScript: B on 23 of 27, so always
      answering B scored 85%; B was right on 153 of 396 questions overall).
      111 questions had their right option moved, other options keeping their
      order, and none whose wording points at a position ("above", "both of
      the") or whose options are sorted numbers. Every question kept its text,
      options and right answer; every course is now 25–33% at most. A test
      now holds every course to within one question of an even split. A learner
      with an unfinished lesson draft may find a picked-but-unchecked option
      has moved; the server re-checks every answer, so nothing is miscredited.

- [x] **JavaScript: strings and template literals** (2026-09-27) — a course
      review found template literals were never taught, though the React course
      uses them from its first lesson. `js-basics.strings` (after functions,
      before conditionals) covers `${}`, the quotes-don't-interpolate trap,
      `undefined` leaking into text, cleaning input, and strings never
      changing. Its `itemCount` helper sets up the "1 item / N items" text the
      DOM checkpoint and capstone ask for. `InlineText` now reads Markdown's
      double-backtick code, which also fixes two Claude course spans that
      rendered with stray backticks. Still open from that review: fetch and
      JSON, scope/closures/modules, a first-program lesson and HTML basics for
      the Full-stack path, and the classic `for`/`while` loop.

- [x] **Git sandbox** (2026-09-27) — eleven Git lessons now end in a hands-on
      challenge: a terminal, a live commit graph and a file editor over
      `src/lib/git-sandbox.ts`, a deterministic model of git. The server replays
      the learner's commands to grade it, so a git challenge is the first one
      not taken on the browser's word. `bun run git:verify` checks the model
      against real git (every challenge solution, plus eleven scenarios, match
      on history, files, index, stash and reflog). Found on the way: a plain
      `git pull` on diverged branches fails in modern git unless `pull.rebase`
      is set, which the course's advice depended on — the setup lesson now sets
      it. Checked signed in on 2026-09-27: solving `git-start.first-repo` in the
      UI and pressing Complete paid 110 XP. Forged calls with
      `challengeSolved: true` were all rejected: a transcript that only runs
      `git init`, no transcript at all, and one that commits `.env`.

- [x] **Git "Getting out of trouble" module** (2026-09-27) — six lessons the
      course description already promised: stash, reset's three modes, the
      wrong branch and detached HEAD, reflog recovery, rebase and
      `--force-with-lease`, and untracking a file or rotating a leaked secret.
      Bodies are in `git-lessons.server.ts`, and every transcript was captured
      from a real git 2.40 session. Also fixed: the setup now sets
      `init.defaultBranch`, the first push has a sign-in step, and `/review`
      shows the scenario above each question.

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
      `claude-opus-5`), OpenAI, DeepSeek and Gemini (shared chat-completions adapter),
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

- [ ] **Machine Learning Basics is a primer, not the "end to end" it promises**
      (reviewed 2026-09-27). The six lessons are sound, but the learner never
      trains a real model: every scikit-learn snippet says "(not run here)",
      and the challenges are hand-written maths on 5–9 made-up rows. Lesson 2
      grades a classifier the course never builds, and lesson 4's scenario
      compares decision trees it never teaches. Nothing joins features, split,
      fit, evaluate and ship on one dataset. In priority order: runnable sklearn
      snippets; a lesson that trains a classifier and tunes its threshold; a
      capstone on one messy dataset; several features and cross-validation in
      practice. Also: "Basics" is labelled Intermediate with no stated Python
      prerequisite, 14–15 min per lesson is low for reading plus a challenge,
      module 1's "improve" happens in module 2, the course list says "Metrics
      that do not lie" while the challenge says "don't", and the course isn't in
      the Data Analyst path. **scikit-learn runs** through the existing Pyodide
      runtime (checked in Chrome): ~24 MB on first import, 23s cold, then
      instant. `lessons:verify` needs `pip install scikit-learn` locally before
      any sklearn challenge.

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
