#!/bin/sh
set -e
cd /Volumes/KumaDrive/MAC-MINI/DESKTOP/CodeCanyon/career-canvas

echo "=== files that will be committed ==="
git add -A
git status --short

git commit -F - <<'MSG'
Add the seven missing routes and fix three render bugs

Builds out the pages the README's build priority listed but the app never
had. The nav in AppShell already linked to all of them, so every one of
these was a dead link before this change.

New routes:
- index: replaces the Lovable placeholder with a real landing page
- paths, paths/$pathId: 7 career paths with roadmap, skills and progress
- projects, projects/$projectId: briefs, milestones, submission + review
- community: seeded feed merged with live Supabase posts and comments
- leaderboard: podium and table, live profiles merged with seed rankings
- profile, profile/$userId: own editable profile and public version
- certificates/$pathId: printable certificate with a verifiable ID
- pricing: three plans, monthly/yearly toggle and a mock checkout

Supporting: hooks/useProjects, hooks/useCommunity, lib/certificates.
Certificates are derived from completed lessons rather than stored, so
this needs no new migration.

Fixes:
- leaderboard and community showed skeletons forever when the profiles
  query failed; they now fall back to seed data as designed
- landing page rendered 2 cards in a 3-column grid (only two paths are
  flagged popular)
- pricing marked Free as the current plan for signed-out visitors,
  disabling the free CTA
- dashboard linked to /certificate/$pathId, a route that never existed
- MentorContext broke under exactOptionalPropertyTypes

Verified: build passes, tsc --noEmit clean, eslint clean, all 11 routes
render at 200.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0111pUscxBg4bQMGcJv2VDus
MSG

echo
echo "=== done ==="
git log --oneline -1
