---
phase: 21-archetypes
plan: 01
subsystem: ui
tags: [archetype, gamification, premium-gating, onboarding, zustand]

# Dependency graph
requires:
  - phase: 19-subscriptions
    provides: isPremium subscription state and premium gating pattern
  - phase: 18-gamification-engine
    provides: DPAction type for archetype modifiers
provides:
  - Archetype type with 5 values (bro, himbo, brute, pup, bull)
  - ARCHETYPE_INFO and ARCHETYPE_MODIFIERS constants
  - ArchetypeCard and ArchetypeSelector components
  - archetype field in UserProfile store
  - Onboarding archetype step
  - Settings archetype section
affects: [phase-21-plan-02, dp-earning]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Archetype premium gating via isPremium store check"
    - "ARCHETYPE_MODIFIERS for DP multiplier lookup"

key-files:
  created:
    - src/components/ArchetypeCard.tsx
    - src/components/ArchetypeSelector.tsx
  modified:
    - src/design/constants.ts
    - src/stores/userStore.ts
    - src/lib/sync.ts
    - src/screens/Onboarding.tsx
    - src/screens/Settings.tsx
    - src/components/index.ts

key-decisions:
  - "Bro is free generalist; Himbo/Brute/Pup/Bull require premium"
  - "ARCHETYPE_MODIFIERS prepared for Plan 02 DP calculation integration"
  - "Bull streak bonuses deferred to v2.1 (empty modifier for now)"

patterns-established:
  - "Archetype selection UI with premium lock overlay"
  - "ARCHETYPE_INFO record pattern for archetype metadata"

requirements-completed: [GAME-03]

# Metrics
duration: 5min
completed: 2026-02-28
---

# Phase 21 Plan 01: Archetype Selection UI Summary

**Archetype type system with 5 archetypes, selection UI components, and integration into onboarding and settings screens**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-28T13:45:24Z
- **Completed:** 2026-02-28T13:50:36Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Archetype type with 5 values and ARCHETYPE_INFO/MODIFIERS constants
- ArchetypeCard and ArchetypeSelector components with premium gating
- Onboarding archetype step after features
- Settings archetype section with active bonus display

## Task Commits

Each task was committed atomically:

1. **Task 1: Add archetype types and constants** - `4cfbc6dd` (feat)
2. **Task 2: Create ArchetypeSelector and ArchetypeCard components** - `2356765d` (feat)
3. **Task 3: Integrate archetype into Onboarding and Settings** - `3eb2a7c6` (feat)

## Files Created/Modified

- `src/design/constants.ts` - Archetype type, ARCHETYPE_INFO, ARCHETYPE_MODIFIERS
- `src/stores/userStore.ts` - archetype field in UserProfile
- `src/lib/sync.ts` - archetype field for cloud sync compatibility
- `src/components/ArchetypeCard.tsx` - Individual archetype display component
- `src/components/ArchetypeSelector.tsx` - 5-archetype selection with premium gating
- `src/components/index.ts` - Export new components
- `src/screens/Onboarding.tsx` - ArchetypeStep after features
- `src/screens/Settings.tsx` - ARCHETYPE section with change functionality

## Decisions Made

- Bro is the free generalist archetype with no modifier bonuses
- Premium archetypes (Himbo, Brute, Pup, Bull) show locked state for non-premium users
- ARCHETYPE_MODIFIERS uses partial Record to allow empty objects for Bro and Bull
- Bull streak bonuses deferred to v2.1 - current modifier is empty placeholder
- sync.ts updated to handle archetype field with fallback to 'bro'

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added archetype field to sync.ts cloudProfile**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** sync.ts loadProfileFromCloud was missing archetype field, causing TypeScript error
- **Fix:** Added archetype field with 'bro' fallback in cloudProfile construction
- **Files modified:** src/lib/sync.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** 4cfbc6dd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Essential for TypeScript compilation. No scope creep.

## Issues Encountered

None - plan executed smoothly after sync.ts auto-fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Archetype selection UI complete and functional
- ARCHETYPE_MODIFIERS ready for Plan 02 DP calculation integration
- Premium gating tested via subscription store
- Settings allows changing archetype post-onboarding

---
*Phase: 21-archetypes*
*Completed: 2026-02-28*

## Self-Check: PASSED

- [x] src/components/ArchetypeCard.tsx exists
- [x] src/components/ArchetypeSelector.tsx exists
- [x] Commit 4cfbc6dd exists
- [x] Commit 2356765d exists
- [x] Commit 3eb2a7c6 exists
