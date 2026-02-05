---
phase: 04-resilience-hardening
plan: 02
subsystem: resilience
tags: [food-api, rate-limiting, 429, sync-status, ui-indicator, zustand, lucide-react]

# Dependency graph
requires:
  - phase: 04-resilience-hardening
    plan: 01
    provides: syncStore for status tracking, online/offline listeners
provides:
  - USDA 429 rate limit detection with 5-minute cooldown in foodApi.ts
  - SyncStatusIndicator component showing synced/syncing/offline/error states
  - Visual sync feedback in authenticated app shell
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-level cooldown flag (usdaCooldownUntil) for API rate limit bypass"
    - "Null-return pattern: SyncStatusIndicator returns null in happy path (synced + no pending)"

key-files:
  created:
    - src/components/SyncStatusIndicator.tsx
  modified:
    - src/lib/foodApi.ts
    - src/components/index.ts
    - src/App.tsx

key-decisions:
  - "5-minute cooldown for USDA 429 -- long enough to respect rate limits, short enough to retry naturally"
  - "SyncStatusIndicator returns null when synced -- zero visual noise in happy path"
  - "Direct syncStore import (not barrel) in SyncStatusIndicator to match 04-01 pattern"
  - "Fixed positioning bottom-[72px] z-40 -- above nav bar (64px + 8px breathing), below nav z-50"

patterns-established:
  - "API rate limit cooldown: module-level timestamp flag skipping API during cooldown window"
  - "Status indicator null-return: hide when everything is fine, show only when action needed"

# Metrics
duration: 2min
completed: 2026-02-05
---

# Phase 4 Plan 2: Food API Resilience and Sync Status Indicator Summary

**USDA 429 rate limit cooldown (5-min bypass) and SyncStatusIndicator component showing synced/syncing/offline/error above bottom nav**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-05T14:20:37Z
- **Completed:** 2026-02-05T14:22:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added 429 rate limit detection to USDA food search with 5-minute cooldown flag
- During cooldown, searchFoods skips USDA entirely and routes directly to Open Food Facts
- Created SyncStatusIndicator component that reads syncStore status and pendingChanges
- Indicator shows nothing when synced (happy path), shows syncing/offline/error states with lucide icons
- Mounted SyncStatusIndicator in App.tsx authenticated shell, positioned above bottom nav

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 429 rate limit detection and cooldown to foodApi.ts** - `2f6967a2` (feat)
2. **Task 2: Create SyncStatusIndicator component and mount in App.tsx** - `c5d7fa9f` (feat)

## Files Created/Modified
- `src/lib/foodApi.ts` - Added usdaCooldownUntil, USDA_COOLDOWN_MS, 429 detection in searchUSDA, cooldown check in searchFoods
- `src/components/SyncStatusIndicator.tsx` - New component reading syncStore, renders pill with icon/label for non-synced states
- `src/components/index.ts` - Added SyncStatusIndicator barrel export
- `src/App.tsx` - Added SyncStatusIndicator import and mounted before Routes in authenticated shell

## Decisions Made
- 5-minute USDA cooldown balances rate limit respect with eventual retry
- SyncStatusIndicator returns null when synced with no pending changes -- users only see it when something needs attention
- Used direct syncStore import (from '@/stores/syncStore') consistent with 04-01 pattern for store access from components
- Positioned at bottom-[72px] (64px nav + 8px gap) with z-40 (below nav z-50 but above content)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 4 resilience work complete (sync foundation + API resilience + sync visibility)
- Food API gracefully handles rate limits without user impact
- Sync status visible to users, updating in real-time with store changes

---
*Phase: 04-resilience-hardening*
*Completed: 2026-02-05*
