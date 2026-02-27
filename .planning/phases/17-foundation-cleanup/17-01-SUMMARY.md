---
phase: 17-foundation-cleanup
plan: 01
subsystem: ui
tags: [react, typescript, coach-dashboard, code-removal, cleanup]

# Dependency graph
requires: []
provides:
  - "Clean codebase with zero coach dashboard artifacts"
  - "Preserved client-side coach data flows (pullCoachData, assigned workouts, weekly check-ins, coach-set macros)"
affects: [18-archetype-system, 19-subscription-model, 20-health-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-coach separation: dashboard code removed, data sync preserved"

key-files:
  created: []
  modified:
    - src/App.tsx
    - src/lib/supabase.ts
    - src/lib/index.ts
    - src/screens/index.ts
    - src/components/index.ts
    - src/screens/Settings.tsx
    - src/components/Navigation.tsx
    - src/lib/analytics.ts
    - src/lib/devSeed.ts
    - src/lib/badge.ts
    - src/hooks/useWeeklyCheckins.ts
    - src/screens/Home.tsx

key-decisions:
  - "Removed coach response modal and badge count from client app since coach dashboard now lives in separate welltrained-coach app"
  - "Preserved all client-facing coach data flows: pullCoachData, assigned workouts, weekly check-in submission, coach-set macros"

patterns-established:
  - "Coach dashboard code belongs in welltrained-coach repo only"
  - "Client app consumes coach data via pullCoachData sync and set_by:'coach' macro targets"

requirements-completed: [STRIP-01, STRIP-02, STRIP-03, STRIP-04, STRIP-05, STRIP-06, STRIP-07]

# Metrics
duration: 9min
completed: 2026-02-27
---

# Phase 17 Plan 01: Strip Coach Dashboard Summary

**Removed 4,276 lines of coach dashboard code (7 files deleted, 12 files cleaned) while preserving all client-side coach data flows**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-27T18:12:27Z
- **Completed:** 2026-02-27T18:21:23Z
- **Tasks:** 2
- **Files modified:** 19 (7 deleted + 12 modified)

## Accomplishments
- Deleted 7 coach-only files: Coach.tsx (~2158 lines), useClientRoster.ts, useClientDetails.ts, useCoachTemplates.ts, WorkoutAssigner.tsx, ClientMacroAdherence.tsx, ClientActivityFeed.tsx
- Cleaned 12 shared files: removed CoachGuard, isCoach(), coach barrel exports, coach dashboard card, coach analytics events, coach mock data, coach-only check-in functions, coach response modal/badge
- Preserved all client-facing coach flows: pullCoachData sync, assigned workout display, weekly check-in submission, coach-set macro targets, isCoachingClient check
- tsc --noEmit and npm run build both pass cleanly with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete coach-only files and fix all broken imports/exports** - `e940df59` (feat)
2. **Task 2: Clean coach references from shared files and trim useWeeklyCheckins** - `56bc501c` (feat)

## Files Created/Modified
- `src/screens/Coach.tsx` - DELETED (2158-line coach dashboard screen)
- `src/hooks/useClientRoster.ts` - DELETED (coach-only roster hook)
- `src/hooks/useClientDetails.ts` - DELETED (coach-only client detail hook)
- `src/hooks/useCoachTemplates.ts` - DELETED (coach-only template hook)
- `src/components/WorkoutAssigner.tsx` - DELETED (coach-only assignment component)
- `src/components/ClientMacroAdherence.tsx` - DELETED (coach-only adherence component)
- `src/components/ClientActivityFeed.tsx` - DELETED (coach-only activity feed component)
- `src/App.tsx` - Removed CoachGuard, Coach lazy import, /coach routes, isCoachRoute bypass, useState/useLocation imports
- `src/lib/supabase.ts` - Removed isCoach() function
- `src/lib/index.ts` - Removed isCoach export
- `src/screens/index.ts` - Removed Coach barrel export
- `src/components/index.ts` - Removed ClientMacroAdherence, ClientActivityFeed barrel exports
- `src/screens/Settings.tsx` - Removed isCoach state, checkIsCoach import/call, Coach Dashboard card
- `src/components/Navigation.tsx` - Removed /coach path null-return
- `src/lib/analytics.ts` - Removed coachDashboardViewed and clientViewed events
- `src/lib/devSeed.ts` - Removed MockClientSummary, mockClients, mockWorkoutTemplates, mockAssignedWorkouts, and 6 coach-only functions
- `src/lib/badge.ts` - Removed coach response badge count and markCoachResponseSeen
- `src/hooks/useWeeklyCheckins.ts` - Removed PendingCheckin interface, fetchPendingCheckins, fetchClientCheckins, submitReview, pendingCheckins/clientCheckins state
- `src/screens/Home.tsx` - Removed coach response modal, latestCheckinInfo, hasCoachResponse, showCoachResponse state; preserved hasCoach and weeklyCheckinDue

## Decisions Made
- Removed coach response modal from Home.tsx and unread coach response badge count from badge.ts since the coach dashboard now lives in the separate welltrained-coach app. Coach responses will be viewed there.
- Settings.tsx isCoach cleanup was pulled into Task 1 (from Task 2 scope) as a blocking dependency -- tsc could not pass without removing the checkIsCoach import after isCoach was deleted from supabase.ts.
- Removed unused useState import from App.tsx and useLocation import since both were only used by the deleted CoachGuard component and isCoachRoute variable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Settings.tsx isCoach cleanup moved to Task 1**
- **Found during:** Task 1 (tsc --noEmit verification step)
- **Issue:** After removing isCoach() from supabase.ts in Task 1, Settings.tsx imported it causing tsc failure. Plan had this cleanup in Task 2 but Task 1 requires tsc to pass.
- **Fix:** Removed isCoach import, state, checkIsCoach call, and Coach Dashboard card from Settings.tsx as part of Task 1
- **Files modified:** src/screens/Settings.tsx
- **Verification:** tsc --noEmit passes
- **Committed in:** e940df59 (Task 1 commit)

**2. [Rule 1 - Bug] Removed unused imports from App.tsx**
- **Found during:** Task 1 (tsc --noEmit verification step)
- **Issue:** After removing CoachGuard and isCoachRoute, useState and useLocation became unused, causing TS6133 errors
- **Fix:** Removed useState from React import and useLocation from react-router-dom import, removed location variable
- **Files modified:** src/App.tsx
- **Verification:** tsc --noEmit passes
- **Committed in:** e940df59 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes were necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Codebase is clean: zero coach dashboard artifacts remain
- All client-facing coach data flows verified intact
- Ready for 17-02 (dead code audit / further cleanup) or Phase 18 (archetype system)

---
*Phase: 17-foundation-cleanup*
*Completed: 2026-02-27*
