---
phase: 04-resilience-hardening
plan: 01
subsystem: sync
tags: [zustand, supabase, offline-first, navigator.onLine, debounce, pwa]

# Dependency graph
requires:
  - phase: 02-performance
    provides: Service worker runtime caching for Supabase REST
provides:
  - syncStore for tracking sync status (synced/syncing/offline/error)
  - scheduleSync debounced sync scheduler for incremental syncing
  - flushPendingSync for immediate reconnection sync
  - Online/offline event listeners in App.tsx
  - Visibilitychange background sync trigger
  - Sync triggers after workout completion and meal logging
  - Rate limit (429) handling in friendlyError
affects: [04-02, 04-03, sync-status-indicator, error-handling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "syncStore: non-persisted Zustand store for runtime sync state"
    - "scheduleSync: debounced fire-and-forget sync after user actions"
    - "flushPendingSync: immediate sync flush for reconnection scenarios"
    - "useSyncStore.getState(): Zustand access from non-component code"

key-files:
  created:
    - src/stores/syncStore.ts
  modified:
    - src/lib/sync.ts
    - src/stores/index.ts
    - src/lib/index.ts
    - src/lib/errors.ts
    - src/App.tsx
    - src/screens/Workouts.tsx
    - src/screens/Macros.tsx

key-decisions:
  - "syncStore is non-persisted (runtime state only) -- no localStorage pollution"
  - "Direct store imports from syncStore/toastStore (not barrel) to avoid circular deps in sync.ts"
  - "2-second debounce on scheduleSync to batch rapid-fire actions"

patterns-established:
  - "scheduleSync() pattern: fire-and-forget after any data mutation"
  - "flushPendingSync() pattern: immediate sync on reconnection/app resume"
  - "Online/offline listeners in App.tsx AppContent component"

# Metrics
duration: 3min
completed: 2026-02-05
---

# Phase 4 Plan 1: Resilience Foundation Summary

**syncStore + scheduleSync debounced sync scheduler with online/offline detection, reconnection flush, and sync triggers after workouts/meals**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-05T14:15:07Z
- **Completed:** 2026-02-05T14:18:29Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created syncStore tracking sync lifecycle (synced/syncing/offline/error), isOnline, pendingChanges, lastSyncedAt
- Added scheduleSync with 2s debounce and flushPendingSync for reconnection to sync.ts
- Wired online/offline/visibilitychange event listeners in App.tsx
- Added sync triggers after workout completion (normal + early) and meal logging (quick + named)
- Added 429 rate limit handling to friendlyError

## Task Commits

Each task was committed atomically:

1. **Task 1: Create syncStore and add scheduleSync to sync.ts** - `0f45a138` (feat)
2. **Task 2: Wire online/offline listeners and sync triggers** - `a3f4a062` (feat)

## Files Created/Modified
- `src/stores/syncStore.ts` - Non-persisted Zustand store for sync status tracking
- `src/lib/sync.ts` - Added scheduleSync (2s debounce) and flushPendingSync (immediate)
- `src/stores/index.ts` - Added syncStore and SyncStatus type exports
- `src/lib/index.ts` - Added scheduleSync and flushPendingSync exports
- `src/lib/errors.ts` - Added 429 rate limit handling to friendlyError
- `src/App.tsx` - Online/offline/visibilitychange event listeners
- `src/screens/Workouts.tsx` - scheduleSync after handleCompleteWorkout and handleEndWorkoutEarly
- `src/screens/Macros.tsx` - scheduleSync after logQuickMacros and logNamedMeal

## Decisions Made
- syncStore is non-persisted (runtime state only) -- sync status resets on reload which is correct behavior
- Imported syncStore/toastStore directly (not via barrel) in sync.ts to avoid circular dependency risk
- 2-second debounce prevents rapid-fire syncs when user logs multiple sets or meals quickly
- Visibilitychange threshold set to 30 seconds to avoid unnecessary syncs on quick tab switches

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- syncStore provides the status tracking foundation for a SyncStatusIndicator component (future plan)
- scheduleSync/flushPendingSync provide the sync primitives for any new data mutation points
- Rate limit handling in friendlyError ready for food API resilience work

---
*Phase: 04-resilience-hardening*
*Completed: 2026-02-05*
