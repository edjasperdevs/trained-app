---
phase: 06-weekly-checkins
plan: 01
subsystem: database
tags: [supabase, postgresql, rls, typescript, react-hooks, weekly-checkins]

# Dependency graph
requires:
  - phase: 01-coach-foundation
    provides: coach_clients table, profiles FK, RLS patterns
provides:
  - weekly_checkins table with 16 client fields, 7 auto fields, coach response
  - WeeklyCheckin and CheckinStatus TypeScript types
  - useWeeklyCheckins hook (client submit/fetch, coach review)
  - getCurrentMonday() helper for week_of calculation
  - Mock check-in data (3 entries) for dev bypass
affects: [06-02 client form, 06-03 coach review, 06-04 response viewing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Map cache + TTL for check-in queries (same as useCoachTemplates)"
    - "Mutable module-level array for dev bypass mock mutations"
    - "PendingCheckin extends WeeklyCheckin with client info for coach view"

key-files:
  created:
    - supabase/migrations/007_weekly_checkins.sql
    - src/hooks/useWeeklyCheckins.ts
  modified:
    - src/lib/database.types.ts
    - src/lib/devSeed.ts

key-decisions:
  - "5 RLS policies: client insert/select/update-when-submitted, coach select/update via coach_clients"
  - "Client UPDATE restricted to status='submitted' (prevents editing after coach reviews)"
  - "getCurrentMonday() uses local timezone via getLocalDateString for week_of"
  - "PendingCheckin interface extends WeeklyCheckin with client_username/email for coach list"

patterns-established:
  - "Weekly check-in upsert on (client_id, week_of) for re-submission before review"
  - "Coach review flow: update status + coach_response + reviewed_at in single mutation"

# Metrics
duration: 10min
completed: 2026-02-08
---

# Phase 6 Plan 1: Weekly Check-ins Foundation Summary

**weekly_checkins table with checkin_status enum, 5 RLS policies, WeeklyCheckin types, useWeeklyCheckins hook with 6 CRUD functions, 3 mock check-ins**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-08T05:27:14Z
- **Completed:** 2026-02-08T05:37:05Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Full weekly_checkins schema with 16 client fields, 7 auto-populated snapshot fields, and coach response columns
- 5 RLS policies covering client insert/select/update and coach select/update with coach_clients join
- useWeeklyCheckins hook with 6 functions: submitCheckin, fetchMyCheckins, hasCheckinForCurrentWeek, fetchPendingCheckins, fetchClientCheckins, submitReview
- 3 realistic mock check-ins (Sarah submitted, Mike and Jake reviewed with coach responses)

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration and TypeScript types** - `3c77f5ad` (feat)
2. **Task 2: useWeeklyCheckins hook and devSeed mock data** - `a4ca6264` (feat)

## Files Created/Modified
- `supabase/migrations/007_weekly_checkins.sql` - Full schema: table, enum, 5 RLS policies, 2 indexes, trigger
- `src/lib/database.types.ts` - WeeklyCheckin interface, CheckinStatus type, Database.public.Tables entry
- `src/hooks/useWeeklyCheckins.ts` - Hook with client + coach CRUD, Map cache, devBypass, getCurrentMonday()
- `src/lib/devSeed.ts` - 3 mock WeeklyCheckin entries with realistic field values

## Decisions Made
- 5 RLS policies (not 4): added client UPDATE policy restricted to status='submitted' so clients can re-submit before coach reviews but cannot edit after review
- getCurrentMonday() computes Monday via local timezone using getLocalDateString (avoids timezone pitfall from research)
- PendingCheckin interface extends WeeklyCheckin with client_username and client_email for the coach pending list view
- Coach review uses profiles join via FK name `weekly_checkins_client_id_fkey` for client info

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Migration 007 needs to be applied to Supabase when deploying.

## Next Phase Readiness
- Schema, types, hook, and mock data are all in place
- Plan 02 (client check-in form) and Plan 03 (coach review UI) can proceed in parallel
- Both plans import from these foundation files without needing to modify them

## Self-Check: PASSED

---
*Phase: 06-weekly-checkins*
*Completed: 2026-02-08*
