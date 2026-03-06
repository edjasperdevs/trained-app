---
phase: 28-archetype-and-macros
plan: 02
subsystem: ui
tags: [react, framer-motion, svg, animation, macros, zustand]

# Dependency graph
requires:
  - phase: 28-01
    provides: ArchetypeScreen with navigation to macros
  - phase: 27-02
    provides: GoalScreen storing goal to onboardingStore
provides:
  - MacrosScreen with animated donut chart
  - setOnboardingTargets action in macroStore
  - Macro calculation using Mifflin-St Jeor formula
affects: [29-paywall-and-subscription, onboarding-flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [svg-donut-chart-animation, count-up-animation-raf]

key-files:
  created:
    - src/screens/onboarding-v2/MacrosScreen.tsx
  modified:
    - src/stores/macroStore.ts
    - src/screens/onboarding-v2/index.ts
    - src/navigation/OnboardingStack.tsx

key-decisions:
  - "Default profile values (5'10 185lbs 30yo male) used for macro calculation during onboarding"
  - "Donut chart uses custom SVG with framer-motion, not Recharts library"
  - "setOnboardingTargets skips meal plan generation (deferred to post-onboarding)"
  - "Chart animation 800ms, count-up animation 600ms starting after chart completes"

patterns-established:
  - "SVG donut chart: strokeDasharray for segments, strokeDashoffset animation for draw effect"
  - "Count-up animation: requestAnimationFrame with ease-out cubic easing"

requirements-completed: [MACR-01, MACR-02, MACR-03, MACR-04, MACR-05, MACR-06, MACR-07, MACR-08, MACR-09]

# Metrics
duration: 4min
completed: 2026-03-06
---

# Phase 28 Plan 02: MacrosScreen Summary

**Personalized macro targets display with animated SVG donut chart and count-up stat cards**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-06T15:34:34Z
- **Completed:** 2026-03-06T15:38:11Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- MacrosScreen displays calculated daily macro targets with gold color palette
- Donut chart animates clockwise over 800ms with protein/carbs/fat segments
- Stat cards count up from 0 to calculated values over 600ms
- Macro calculation uses Mifflin-St Jeor formula with goal-based adjustments
- Targets persisted to macroStore via new setOnboardingTargets action

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MacrosScreen component with animated donut chart** - `ce2ced42` (feat)
2. **Task 2: Add setOnboardingTargets action to macroStore** - `77da0c6b` (feat)
3. **Task 3: Export MacrosScreen and wire to OnboardingStack** - `c8b820fd` (feat)

## Files Created/Modified

- `src/screens/onboarding-v2/MacrosScreen.tsx` - MacrosScreen with DonutChart and StatCard components
- `src/stores/macroStore.ts` - Added setOnboardingTargets action
- `src/screens/onboarding-v2/index.ts` - Export MacrosScreen, remove OnboardingMacros placeholder
- `src/navigation/OnboardingStack.tsx` - Wire MacrosScreen to /macros route

## Decisions Made

- Default profile (5'10", 185 lbs, 30 yo male) used for macro calculation since full profile data not collected during onboarding
- Custom SVG donut chart implementation (not Recharts) for precise animation control
- setOnboardingTargets skips meal plan generation - user can generate meal plan later from macros screen
- Three-segment gold palette: protein (#D4A853), carbs (#E5C98A), fat (#8B7355)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- MacrosScreen complete, navigates to PaywallScreen on ACCEPT MY PROTOCOL
- Ready for Phase 29 (Paywall and Subscription) implementation
- Macros stored to both onboardingStore and macroStore for later use

## Self-Check: PASSED

- FOUND: src/screens/onboarding-v2/MacrosScreen.tsx
- FOUND: ce2ced42 (Task 1 commit)
- FOUND: 77da0c6b (Task 2 commit)
- FOUND: c8b820fd (Task 3 commit)

---
*Phase: 28-archetype-and-macros*
*Completed: 2026-03-06*
