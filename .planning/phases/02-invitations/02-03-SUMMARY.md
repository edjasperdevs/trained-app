---
phase: 02-invitations
plan: 03
subsystem: ui
tags: [react, supabase, edge-functions, invites, coach-dashboard]

# Dependency graph
requires:
  - phase: 02-invitations plan 01
    provides: invites table, InviteStatus type, RLS policies
  - phase: 02-invitations plan 02
    provides: send-invite Edge Function returning action (invite_sent | added_directly)
provides:
  - Invite Client modal calling send-invite Edge Function
  - Invite status list showing pending/expired invites with resend action
  - Complete frontend layer for INVITE-01, INVITE-02, INVITE-03 requirements
affects: [deployment (requires Edge Function deployed + RESEND_API_KEY configured)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "supabase.functions.invoke() for Edge Function calls from React"
    - "Client-side expired invite detection (expires_at < now on read)"
    - "emailOverride parameter for resend-from-list reuse of invite handler"

key-files:
  created: []
  modified:
    - src/screens/Coach.tsx

key-decisions:
  - "Accepted invites excluded from invite section -- they appear in client list via auto-link trigger"
  - "Dev bypass returns empty invites array (no mock invites needed since invites are server-authoritative)"
  - "Resend reuses handleInviteClient with emailOverride param rather than a separate function"

patterns-established:
  - "Edge Function error handling: FunctionsRelayError / non-2xx -> service unavailable message"
  - "Invite status pill styling: warning (yellow) for pending, muted (gray) for expired"

# Metrics
duration: 4min
completed: 2026-02-07
---

# Phase 2 Plan 3: Coach Invite UI Summary

**Invite Client modal calling send-invite Edge Function with response-based feedback, plus pending/expired invite status list with resend action**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-07T21:18:42Z
- **Completed:** 2026-02-07T21:23:33Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Replaced "Add Client" modal with "Invite Client" flow calling `supabase.functions.invoke('send-invite')`
- Added response-based feedback: "Invite sent!" for new users, "Added as client!" for existing users, specific error messages
- Added invite status section showing pending and expired invites with email, status pill, time-since-sent, and resend action
- Dev bypass mock updated to simulate both `invite_sent` and `added_directly` Edge Function responses

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace Add Client modal with Invite Client flow** - `4ac26b55` (feat)
2. **Task 2: Add invite status list to Coach dashboard** - `cd4520dd` (feat)

## Files Created/Modified
- `src/screens/Coach.tsx` - Invite Client modal with Edge Function invocation, invite status list with pending/expired display and resend

## Decisions Made
- Accepted invites are excluded from the invite status section -- they appear as clients in the client list (via the auto-link trigger), avoiding duplication
- Dev bypass returns an empty invites array since invites are server-authoritative data (no meaningful mock needed)
- Resend reuses the `handleInviteClient` function with an `emailOverride` parameter rather than duplicating logic in a separate function
- Edge Function errors categorized into three buckets: relay errors (service unavailable), network errors (check connection), and response errors (show specific message from Edge Function)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- TypeScript error: `handleInviteClient` gained an optional `emailOverride` string parameter, but was passed directly as an `onClick` handler which passes a MouseEvent. Fixed by wrapping in an arrow function: `onClick={() => handleInviteClient()}`.

## User Setup Required
None - no external service configuration required for this plan. The Edge Function (02-02) and database migration (02-01) must be deployed separately.

## Next Phase Readiness
- All three INVITE requirements have their frontend layer complete
- Phase 2 (Invitations) is fully implemented: data layer, Edge Function, and Coach UI
- Deployment requires: (1) apply migration 003_invitations.sql, (2) deploy send-invite Edge Function, (3) set RESEND_API_KEY secret

## Self-Check: PASSED
