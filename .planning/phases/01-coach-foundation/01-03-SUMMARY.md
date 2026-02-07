---
phase: 01-coach-foundation
plan: 03
subsystem: sync
tags: [supabase, sync, zustand, data-ownership, offline-first]

# Dependency graph
requires:
  - phase: 01-coach-foundation plan 01
    provides: set_by and set_by_coach_id columns on macro_targets table, MacroSetBy TypeScript type
provides:
  - pushClientData() directional sync function that skips coach-owned macro targets
  - pullCoachData() function that loads coach-set macro targets from Supabase
  - macroStore setBy/setByCoachId state fields and setCoachTargets action
  - Visibility and reconnection events trigger pullCoachData
affects: [04-coach-macro-management, coach dashboard UI, any future coach-owned data types]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Directional sync: pushClientData() for client-owned, pullCoachData() for coach-owned"
    - "Data ownership check: skip sync when setBy === 'coach' prevents overwriting"
    - "Pull-on-resume: pullCoachData on visibility change and reconnection for near-real-time coach updates"

key-files:
  created: []
  modified:
    - src/lib/sync.ts
    - src/stores/macroStore.ts
    - src/stores/authStore.ts
    - src/App.tsx

key-decisions:
  - "syncAllToCloud kept as @deprecated for backward compatibility rather than removing it"
  - "pullCoachData resets local setBy to 'self' when server shows set_by='self' (handles coach revert)"

patterns-established:
  - "Directional sync pattern: push client-owned data, pull coach-owned data, check ownership before sync"
  - "Coach data pull triggers: sign-in, visibility resume (30s+), reconnection online event"

# Metrics
duration: 3min
completed: 2026-02-07
---

# Phase 1 Plan 3: Directional Sync Summary

**Directional push/pull sync with coach macro target ownership guard -- pushClientData skips coach-set macros, pullCoachData loads them from Supabase on sign-in and app resume**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-07T20:19:07Z
- **Completed:** 2026-02-07T20:31:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Refactored sync from unconditional bidirectional to directional: pushClientData() for client-owned data, pullCoachData() for coach-owned data
- macroStore now tracks setBy ('self' | 'coach') and setByCoachId to distinguish data ownership
- Client sync (scheduleSync, flushPendingSync) skips macro target push when setBy === 'coach', preventing overwrite of coach-set values
- Sign-in flow now calls pullCoachData before pushClientData, ensuring coach targets are loaded first
- Visibility change (30s+ background) and reconnection events trigger pullCoachData for near-real-time coach updates

## Task Commits

Each task was committed atomically:

1. **Task 1: Add setBy awareness to macroStore** - `1f43a583` (feat)
2. **Task 2: Refactor sync.ts to directional sync** - `fe309dbc` (feat)

## Files Created/Modified
- `src/stores/macroStore.ts` - Added setBy, setByCoachId state fields and setCoachTargets action
- `src/lib/sync.ts` - Added pushClientData(), pullCoachData(); updated syncMacroTargetsToCloud with set_by fields; scheduleSync/flushPendingSync use pushClientData
- `src/stores/authStore.ts` - syncData calls pullCoachData + pushClientData instead of syncAllToCloud
- `src/App.tsx` - Visibility and online handlers call pullCoachData

## Decisions Made
- Kept syncAllToCloud as @deprecated rather than removing -- avoids breaking any edge-case callers while making the deprecation clear
- pullCoachData handles the "coach revert" case: if server has set_by='self' but local store has setBy='coach', it resets local to 'self'

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required. The set_by column migration from plan 01-01 must already be applied.

## Next Phase Readiness
- Directional sync foundation complete -- coach can safely write macro targets without client overwrite
- Phase 4 (coach macro management) can now build the coach UI for setting client macros, knowing pushClientData will respect the set_by guard
- pullCoachData is structured for extension to additional coach-owned data types (workout programs, check-in schedules)
- TypeScript compiles and production build succeeds

## Self-Check: PASSED

---
*Phase: 01-coach-foundation*
*Completed: 2026-02-07*
