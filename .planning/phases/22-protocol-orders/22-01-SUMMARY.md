---
phase: 22-protocol-orders
plan: 01
subsystem: gamification
tags: [quests, zustand, rotation, bonus-dp]

# Dependency graph
requires:
  - phase: 21-archetypes
    provides: archetype DP modifiers and subscription store
provides:
  - Quest catalog with 12 daily and 6 weekly definitions
  - questStore with deterministic rotation and completion tracking
  - Bonus DP awards for quest completion (bypasses archetype modifiers)
affects: [22-02-PLAN, protocol-orders-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Seeded shuffle for deterministic rotation (same date+user = same quests)
    - Direct totalDP manipulation for bonus awards (bypass modifiers)

key-files:
  created:
    - src/lib/questCatalog.ts
    - src/stores/questStore.ts
  modified:
    - src/stores/index.ts

key-decisions:
  - "Quest bonus DP bypasses archetype modifiers - direct totalDP add"
  - "Seeded shuffle uses date+userId for daily, weekString+userId for weekly rotation"
  - "Weekly quests are premium-only (2 per week vs 3 daily for all users)"

patterns-established:
  - "Quest condition evaluators read from existing stores (macro/workout/health/dp)"
  - "Period-based completion tracking (date for daily, week for weekly)"

requirements-completed: [GAME-06, GAME-07]

# Metrics
duration: 4min
completed: 2026-02-28
---

# Phase 22 Plan 01: Quest Infrastructure Summary

**Quest catalog with 12 daily and 6 weekly definitions, questStore with deterministic seeded rotation, auto-completion detection, and bonus DP awards**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-28T19:26:48Z
- **Completed:** 2026-02-28T19:30:46Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created questCatalog.ts with 12 daily quests across nutrition/training/health/streak categories
- Created 6 weekly quests (premium only) with higher DP rewards
- Built questStore with deterministic rotation via seeded shuffle algorithm
- Implemented auto-completion detection and bonus DP awards that bypass archetype modifiers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Quest Catalog with Condition Evaluators** - `0b1f2439` (feat)
2. **Task 2: Create questStore with Rotation and Completion Logic** - `b3bd9a93` (feat)

## Files Created/Modified
- `src/lib/questCatalog.ts` - Quest definitions with evaluate functions for each quest condition
- `src/stores/questStore.ts` - Quest state management with rotation, completion tracking, DP awards
- `src/stores/index.ts` - Added useQuestStore export

## Decisions Made
- Quest bonus DP bypasses archetype modifiers - awards are added directly to totalDP rather than going through awardDP() to avoid multipliers being applied to quest bonuses
- Weekly step tracking uses dpLogs step awards as proxy (healthStore only tracks today's steps, not historical)
- Seeded shuffle ensures same user sees same quests on same day regardless of app state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Quest infrastructure complete, ready for UI components in Plan 02
- checkAndCompleteQuests() needs to be called from relevant action points (meal logging, workout completion, etc.)
- UI will need to display active quests and completion states

---
*Phase: 22-protocol-orders*
*Completed: 2026-02-28*
