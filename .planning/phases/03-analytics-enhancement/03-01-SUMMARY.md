---
phase: 03-analytics-enhancement
plan: 01
subsystem: analytics
tags: [plausible, analytics, events, funnels, naming-convention]

# Dependency graph
requires:
  - phase: none
    provides: n/a (documentation-only plan, no code dependencies)
provides:
  - Event naming convention (Title Case with Spaces / snake_case / lowercase values)
  - Complete 22-event inventory with wiring status
  - Three funnel definitions with step-to-event mappings
  - Plausible dashboard goal configuration checklist
affects: [03-02 (event wiring needs inventory), 07-deploy (dashboard setup needs checklist)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Event names: Title Case with Spaces"
    - "Property keys: snake_case"
    - "Property values: lowercase strings or numbers"

key-files:
  created:
    - .planning/phases/03-analytics-enhancement/EVENTS.md
    - .planning/phases/03-analytics-enhancement/FUNNELS.md
  modified: []

key-decisions:
  - "Corrected event count: 7 wired methods (8 call sites), 15 missing -- research said 14 missing but actual count is 15"
  - "Funnel 2 (Habit Formation) documented as unsuitable for Plausible built-in funnel feature due to duplicate event name in steps 3 and 5"
  - "Recommended property filtering approach for Funnel 2 instead of built-in funnel"

patterns-established:
  - "Event naming: Title Case with Spaces for event names, snake_case for property keys"
  - "Funnel documentation: step table with Plausible Event column linking to EVENTS.md inventory"

# Metrics
duration: 3min
completed: 2026-02-07
---

# Phase 3 Plan 1: Analytics Convention and Funnels Summary

**Plausible event naming convention (Title Case / snake_case / lowercase), 22-event inventory with wiring status, and 3 funnel definitions mapped to trackable events**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-07T14:36:19Z
- **Completed:** 2026-02-07T14:40:16Z
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments

- Documented the event naming convention all 22 Plausible events follow (Title Case with Spaces for names, snake_case for property keys, lowercase for values)
- Created complete event inventory table with method names, event strings, properties, wiring locations, and status (7 wired, 15 missing)
- Defined 3 user funnels (Signup to First Workout, Signup to Habit Formation, Daily Engagement Loop) with step-to-event mappings
- Identified Funnel 2 limitation (duplicate event name in steps 3/5) and documented workaround

## Task Commits

Each task was committed atomically:

1. **Task 1: Create event naming convention and full event inventory** - `b83a8fdb` (docs)
2. **Task 2: Create funnel definitions with step-to-event mappings** - `5efecba9` (docs)

## Files Created/Modified

- `.planning/phases/03-analytics-enhancement/EVENTS.md` - Event naming convention, 22-event inventory with wiring status, Plausible dashboard goal checklist
- `.planning/phases/03-analytics-enhancement/FUNNELS.md` - Three funnel definitions with step-to-event mappings and dashboard configuration instructions

## Decisions Made

1. **Corrected event count from research** - Research doc stated "14 missing" events but actual count from analytics.ts is 15 missing (7 wired methods, not 8). The discrepancy arose from counting workoutCompleted's 2 call sites as 2 wired events.

2. **Funnel 2 uses property filtering, not built-in funnels** - Plausible funnels match events by name only. Since Funnel 2 (Habit Formation) uses Check-In Completed in both step 3 (streak=1) and step 5 (streak>=7), the built-in funnel feature would be inaccurate. Documented property-based filtering as the recommended approach.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Dashboard goal and funnel creation is documented in EVENTS.md and FUNNELS.md as post-deployment manual steps.

## Next Phase Readiness

- EVENTS.md provides the complete wiring map for Plan 03-02 (event wiring)
- FUNNELS.md provides the dashboard setup reference for post-deployment
- All 15 missing events are identified with their target files and trigger points

## Self-Check: PASSED

---
*Phase: 03-analytics-enhancement*
*Completed: 2026-02-07*
