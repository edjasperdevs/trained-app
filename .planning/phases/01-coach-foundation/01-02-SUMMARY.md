---
phase: 01-coach-foundation
plan: 02
subsystem: auth
tags: [react, route-guard, role-check, supabase, lazy-loading]

# Dependency graph
requires:
  - phase: 01-coach-foundation/01
    provides: "profiles.role column and isCoach() helper in supabase.ts"
provides:
  - "CoachGuard route protection component"
  - "/coach route restricted to coach-role users only"
affects: [01-coach-foundation/03, coach-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route guard pattern: check role async on mount, render loading/redirect/children"
    - "Direct imports for coach code (not barrel) to preserve code-splitting"

key-files:
  created:
    - src/components/CoachGuard.tsx
  modified:
    - src/App.tsx

key-decisions:
  - "CoachGuard imported eagerly (not lazy) since it is ~2KB and must render before Coach chunk loads"
  - "Direct file import for CoachGuard (not barrel) to keep coach code isolated from main bundle"
  - "Network errors during role check treated as unauthorized with toast warning"

patterns-established:
  - "Route guard pattern: useState for loading/authorized/unauthorized, useEffect calling async role check"
  - "Direct import pattern for coach-only components to preserve tree-shaking"

# Metrics
duration: 2min
completed: 2026-02-07
---

# Phase 1 Plan 2: Coach Route Guard Summary

**CoachGuard component checks isCoach() on mount and redirects non-coach users to /, preserving lazy-loaded Coach chunk**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-07T20:13:24Z
- **Completed:** 2026-02-07T20:15:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created CoachGuard component with loading spinner, role verification, and redirect
- Wired CoachGuard into /coach route in App.tsx wrapping the Suspense boundary
- Preserved Coach screen as separate lazy-loaded chunk (22.9KB)
- Error handling with toast warning on network failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CoachGuard component** - `5175dfb4` (feat)
2. **Task 2: Wire CoachGuard into App.tsx /coach route** - `cc275ecd` (feat)

## Files Created/Modified
- `src/components/CoachGuard.tsx` - Route guard: checks isCoach(), shows spinner while loading, redirects unauthorized users
- `src/App.tsx` - Added CoachGuard import and wrapped /coach route element

## Decisions Made
- CoachGuard is eagerly imported (not lazy) because it is tiny (~2KB) and must render before the Coach chunk loads -- lazy-loading it would add unnecessary latency to the role check
- Direct file import (`@/components/CoachGuard`) instead of barrel import to avoid pulling coach code into the main bundle for all users
- Network errors during isCoach() are treated as unauthorized (redirect with toast warning) rather than showing an error state -- fails closed for security

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Route guard is in place, ready for plan 01-03 (coach client sync and data fetching)
- CoachGuard pattern can be reused for any future coach-only routes
- No blockers

## Self-Check: PASSED

---
*Phase: 01-coach-foundation*
*Completed: 2026-02-07*
