---
phase: 03-component-primitives
plan: 01
subsystem: ui
tags: [cva, class-variance-authority, tailwind, cn, components, button, card, progressbar, toast]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Design tokens and Tailwind v4 @theme configuration
  - phase: 02-theme-removal
    provides: Single-theme codebase with no GYG branching
provides:
  - CVA-based Button with typed variant/size API and exported buttonVariants
  - CVA-based Card with solid surface variants (no glass) and exported cardVariants
  - CVA-based ProgressBar with simplified color API (5 colors, no legacy aliases)
  - CVA-based Toast with typed type variants and icon map
  - cn() class merging pattern established across all four primitives
affects: [03-component-primitives/plan-02, 04-screen-refresh, 05-animation-refinement]

# Tech tracking
tech-stack:
  added: []
  patterns: [CVA variant definitions, cn() class merging, VariantProps typing, icon map objects]

key-files:
  created: []
  modified:
    - src/components/Button.tsx
    - src/components/Card.tsx
    - src/components/ProgressBar.tsx
    - src/components/Toast.tsx
    - src/components/index.ts
    - src/components/Button.test.tsx
    - src/components/Card.test.tsx
    - src/components/ProgressBar.test.tsx
    - src/index.css
    - src/components/WeightChart.tsx
    - src/components/ClientMacroAdherence.tsx
    - src/screens/Achievements.tsx
    - src/screens/Macros.tsx

key-decisions:
  - "Legacy ProgressBar colors (gold/cyan/green/purple) fully removed -- callers migrated to primary/secondary/success/warning"
  - "Card elevated variant gets shadow-card for premium depth without glass effects"
  - "buttonVariants and cardVariants exported from barrel for link-styled-as-button patterns"
  - ".glass CSS class removed; WeightChart usages replaced with bg-surface border border-border"
  - ".glass-subtle preserved for Settings.tsx (cleaned in screen refresh phase)"

patterns-established:
  - "CVA pattern: define variants with cva(), type props with VariantProps<typeof xxxVariants>, compose with cn()"
  - "Icon maps: Record<Type, JSX.Element> replaces switch/case for icon selection"
  - "No template literal concatenation for className -- always cn() with CVA variants"

# Metrics
duration: 5min
completed: 2026-02-05
---

# Phase 3 Plan 1: Component Primitives CVA Rewrite Summary

**Button, Card, ProgressBar, Toast rewritten with CVA typed variant APIs, cn() class merging, and solid Card surfaces replacing glass effects**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-05T20:03:42Z
- **Completed:** 2026-02-05T20:08:32Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- All four component primitives now use CVA variant definitions with typed APIs via VariantProps
- Eliminated all getVariantClasses() switch/case functions and template literal class concatenation
- Simplified ProgressBar color API from 9 options to 5 (removed gold/cyan/green/purple legacy aliases)
- Card uses solid surfaces only -- .glass and .glass-elevated CSS classes removed from index.css
- Card tests explicitly enforce "no glass/backdrop-blur" constraint (VIS-02)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite Button, Card, ProgressBar, Toast with CVA variants** - `22c73da6` (feat)
2. **Task 2: Update tests and clean up glass CSS** - `f8c90a21` (feat)

## Files Created/Modified
- `src/components/Button.tsx` - CVA buttonVariants with variant/size, exported for reuse
- `src/components/Card.tsx` - CVA cardVariants with variant/padding, solid surfaces, shadow-card on elevated
- `src/components/ProgressBar.tsx` - CVA progressBarVariants + progressTrackVariants, simplified 5-color API
- `src/components/Toast.tsx` - CVA toastVariants with type, icon map object replaces switch
- `src/components/index.ts` - Added buttonVariants and cardVariants exports
- `src/components/Button.test.tsx` - Existing tests pass (14 tests, CVA produces same classes)
- `src/components/Card.test.tsx` - Added no-glass assertion test (15 tests total)
- `src/components/ProgressBar.test.tsx` - Replaced legacy color tests with new API tests (14 tests)
- `src/index.css` - Removed .glass and .glass-elevated CSS classes
- `src/components/WeightChart.tsx` - Replaced .glass class usage with inline Tailwind classes
- `src/components/ClientMacroAdherence.tsx` - Migrated green/cyan/purple to success/primary/secondary
- `src/screens/Achievements.tsx` - Migrated green/cyan/purple to success/primary/secondary
- `src/screens/Macros.tsx` - Migrated cyan/purple to primary/secondary

## Decisions Made
- **Legacy color removal over aliases:** Removed gold/cyan/green/purple entirely from ProgressBar type rather than keeping as aliases. This forces callers to use the semantic names (primary/secondary/success/warning), preventing color drift. All 5 callers in screens/components were migrated.
- **Card elevated gets shadow-card:** Added shadow-card to the elevated variant to maintain premium depth feel without glass effects.
- **Export variant objects:** buttonVariants and cardVariants exported from barrel, enabling patterns like `<Link className={buttonVariants({ variant: 'primary' })}>` without importing the full Button component.
- **WeightChart glass replacement:** Replaced .glass class with `bg-surface border border-border` (the non-blur equivalent).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migrated legacy color props in screen files**
- **Found during:** Task 1 (CVA rewrite)
- **Issue:** ProgressBar color type change from 9 to 5 options broke callers in Achievements.tsx, Macros.tsx, and ClientMacroAdherence.tsx that used gold/cyan/green/purple
- **Fix:** Mapped cyan->primary, purple->secondary, green->success in all 5 callsites
- **Files modified:** src/screens/Achievements.tsx, src/screens/Macros.tsx, src/components/ClientMacroAdherence.tsx
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 22c73da6 (Task 1 commit)

**2. [Rule 3 - Blocking] Replaced .glass usage in WeightChart before CSS removal**
- **Found during:** Task 2 (CSS cleanup)
- **Issue:** .glass class was used in WeightChart.tsx (2 places) -- removing CSS without updating component would break styling
- **Fix:** Replaced `glass` class with `bg-surface border border-border` (solid surface equivalent)
- **Files modified:** src/components/WeightChart.tsx
- **Verification:** Build passes, no `.glass` className references remain in components
- **Committed in:** f8c90a21 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary to maintain type safety and prevent visual regressions. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four component primitives are CVA-based with typed APIs, ready for consumption in Plan 03-02 (inputs/forms) and Phase 4 (screen refresh)
- The cn() + CVA pattern is established -- new components should follow the same pattern
- .glass-subtle remains in index.css for Settings.tsx (will be cleaned in screen refresh phase)

---
*Phase: 03-component-primitives*
*Completed: 2026-02-05*
