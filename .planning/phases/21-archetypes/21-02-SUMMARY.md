---
phase: 21-archetypes
plan: 02
subsystem: gamification
tags: [archetype, dp-modifiers, zustand, supabase, sync]

# Dependency graph
requires:
  - phase: 21-01
    provides: Archetype type definitions, ARCHETYPE_MODIFIERS constant, UserProfile.archetype field
  - phase: 18-01
    provides: dpStore with awardDP function and DP_VALUES
provides:
  - dpStore.awardDP() with archetype modifier application
  - getModifiedDP() helper for UI display of bonus DP
  - Archetype sync to Supabase profiles table (push and pull)
  - Database migration for profiles.archetype column
affects: [ui-components, home-screen, settings]

# Tech tracking
tech-stack:
  added: []
  patterns: [archetype-modifier-lookup, profile-sync-with-archetype]

key-files:
  created:
    - supabase/migrations/014_archetypes.sql
  modified:
    - src/stores/dpStore.ts
    - src/design/constants.ts
    - src/lib/sync.ts

key-decisions:
  - "Duplicated DP_VALUES in constants.ts to avoid circular import with dpStore"
  - "Meal cap enforced before modifier (cap is on count, not DP value)"
  - "archetype column uses text with CHECK constraint rather than enum type"

patterns-established:
  - "Archetype modifiers: ARCHETYPE_MODIFIERS[archetype]?.[action] || 1"
  - "Profile sync includes archetype with 'bro' default"

requirements-completed: [GAME-04]

# Metrics
duration: 2min
completed: 2026-02-28
---

# Phase 21-02: Archetype DP Modifiers Summary

**Archetype-based DP multipliers in awardDP() with Himbo +50% training, Brute +50% meal/protein, Pup +100% steps/sleep**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T13:53:43Z
- **Completed:** 2026-02-28T13:55:43Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- dpStore.awardDP() now applies archetype modifiers from ARCHETYPE_MODIFIERS constant
- getModifiedDP() helper exported from constants.ts for UI display of bonus amounts
- syncProfileToCloud() now includes archetype field in profile upsert
- Migration 014_archetypes.sql adds archetype column to profiles table

## Task Commits

Each task was committed atomically:

1. **Task 1: Modify dpStore.awardDP() to apply archetype modifiers** - `e62f0a14` (feat)
2. **Task 2: Add archetype sync to Supabase and create migration** - `036b2dda` (feat)

## Files Created/Modified
- `src/stores/dpStore.ts` - Import archetype modifiers, apply to DP awards
- `src/design/constants.ts` - Add getModifiedDP() helper with duplicated DP_VALUES
- `src/lib/sync.ts` - Add archetype field to syncProfileToCloud()
- `supabase/migrations/014_archetypes.sql` - Add archetype column with CHECK constraint

## Decisions Made
- Duplicated DP_VALUES in constants.ts rather than importing from dpStore to avoid circular import
- Used text with CHECK constraint for archetype column instead of PostgreSQL enum type (simpler migrations)
- Meal cap enforcement happens before modifier application (cap is on meal count, not DP value)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None - pull side of archetype sync was already implemented in 21-01 as an auto-fix deviation.

## User Setup Required
**Database migration required.** Run `npx supabase db push` or apply migration 014_archetypes.sql manually to add the archetype column to the profiles table.

## Next Phase Readiness
- Archetype system complete: selection UI (21-01), DP modifiers (21-02), cloud sync
- Bull streak bonuses deferred to v2.1 (empty modifier for now)
- Phase 21 (Archetypes) complete, ready for Phase 22

## Self-Check: PASSED

All files verified to exist. All commits verified in git history.

---
*Phase: 21-archetypes*
*Completed: 2026-02-28*
