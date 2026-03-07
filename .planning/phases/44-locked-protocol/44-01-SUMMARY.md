---
phase: 44-locked-protocol
plan: 01
subsystem: database
tags: [supabase, zustand, rls, streaks, protocol]

# Dependency graph
requires: []
provides:
  - locked_protocols table for tracking user protocol commitments
  - locked_logs table for daily compliance check-ins
  - lockedStore Zustand store with fetch/start/log/end methods
  - MILESTONES and MILESTONE_DP constants for UI
affects: [44-02, 44-03, 44-04, 44-05, 44-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Streak calculation with yesterday grace period"
    - "Protocol types: continuous vs day_lock"
    - "Milestone tracking at 7, 14, 21, 30, 60, 90 days"

key-files:
  created:
    - supabase/migrations/20260307190452_locked_protocol.sql
    - src/stores/lockedStore.ts
  modified:
    - src/lib/database.types.ts

key-decisions:
  - "Types added to existing database.types.ts (not separate src/types/ directory)"
  - "Streak has yesterday grace period - streak continues if logged yesterday even if not today yet"
  - "MILESTONE_DP rewards: 7d=50, 14d=100, 21d=150, 30d=250, 60d=500, 90d=750"

patterns-established:
  - "ProtocolStatus: active | ended | broken"
  - "ProtocolType: continuous | day_lock"
  - "lockedStore persist only caches milestonesReached"

requirements-completed: [LOCK-01, LOCK-02]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 44 Plan 01: Schema & Store Summary

**Supabase tables (locked_protocols, locked_logs) with RLS policies and Zustand lockedStore for streak-based protocol tracking**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T19:04:33Z
- **Completed:** 2026-03-07T19:07:50Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created locked_protocols table with status, protocol_type, goal_days, streak tracking
- Created locked_logs table with one-per-day constraint for compliance check-ins
- Built lockedStore with fetchProtocol, startProtocol, logCompliance, endProtocol methods
- Implemented streak calculation with yesterday grace period
- Added milestone tracking for 7/14/21/30/60/90 day achievements

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Supabase migration for locked protocol tables** - `597db812` (feat)
2. **Task 2: Regenerate database types and create lockedStore** - `9368d15d` (feat)

## Files Created/Modified
- `supabase/migrations/20260307190452_locked_protocol.sql` - Migration with RLS policies and indexes
- `src/lib/database.types.ts` - Added ProtocolStatus, ProtocolType, LockedProtocol, LockedLog types
- `src/stores/lockedStore.ts` - Zustand store with Supabase integration

## Decisions Made
- Used existing `src/lib/database.types.ts` instead of creating `src/types/database.types.ts` (matches project convention)
- Streak calculation includes yesterday grace period - streak is valid if logged yesterday even if not logged today yet
- Milestone DP rewards scale: 50 at 7d, 100 at 14d, 150 at 21d, 250 at 30d, 500 at 60d, 750 at 90d
- Only milestonesReached persisted in zustand (rest fetched fresh from Supabase)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Supabase local not running**
- **Found during:** Task 1 (migration verification)
- **Issue:** Docker not running, could not apply migration with `supabase db push --local`
- **Fix:** Created migration file correctly, deferred verification to when Supabase available
- **Files modified:** None
- **Verification:** Migration file syntax correct, TypeScript types compile
- **Committed in:** 597db812 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking - deferred verification)
**Impact on plan:** Migration file created correctly, types and store verified via TypeScript compilation. Migration needs to be applied when local Supabase is available.

## Issues Encountered
- Docker/Supabase not running locally - migration file created but not applied. Verification deferred.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Database schema ready for migration when Supabase available
- lockedStore fully typed and ready for UI integration
- All exports (useLockedStore, MILESTONES, MILESTONE_DP) available for Plan 02-06

## Self-Check: PASSED

- FOUND: supabase/migrations/20260307190452_locked_protocol.sql
- FOUND: src/stores/lockedStore.ts
- FOUND: src/lib/database.types.ts
- FOUND: commit 597db812
- FOUND: commit 9368d15d

---
*Phase: 44-locked-protocol*
*Completed: 2026-03-07*
