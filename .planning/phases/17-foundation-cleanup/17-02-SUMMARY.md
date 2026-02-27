---
phase: 17-foundation-cleanup
plan: 02
subsystem: ui
tags: [css, tailwind, design-tokens, color-system, dopamine-noir-v2]

# Dependency graph
requires:
  - phase: 17-01
    provides: "Clean codebase with zero coach dashboard artifacts"
provides:
  - "Dopamine Noir V2 color system applied to all CSS tokens and components"
  - "Lime (#C8FF00) primary signal color replacing red (#D55550)"
  - "Updated surface (#26282B), foreground (#FAFAFA), muted (#A1A1AA), destructive (#B91C1C) tokens"
  - "0.75rem border radius design token"
affects: [18-gamification-engine, 19-subscriptions, 20-health-tracking, 21-archetypes, 22-protocol-orders, 23-avatar-evolution]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dopamine Noir V2 color tokens: lime primary, dark surfaces, bright foreground"
    - "All color values flow from CSS custom properties in :root and @theme -- no hard-coded hex in components"

key-files:
  created: []
  modified:
    - src/index.css
    - index.html
    - src/screens/XPClaimModal.tsx

key-decisions:
  - "Kept --border and --input at #2A2A2A (distinct from --card #26282B) so card boundaries remain visible"
  - "Confetti colors in XPClaimModal updated from red palette to lime palette (#C8FF00, #D4FF33, #A0CC00, #86B300)"

patterns-established:
  - "Primary signal color is lime #C8FF00 with dark foreground #0A0A0A for CTAs"
  - "Destructive actions use #B91C1C, visually distinct from primary"
  - "Surface hierarchy: background #0A0A0A > card/secondary/muted #26282B > surface-elevated #2E3033 > border #2A2A2A"

requirements-completed: [DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05, DESIGN-06]

# Metrics
duration: 8min
completed: 2026-02-27
---

# Phase 17 Plan 02: Dopamine Noir V2 Design Tokens Summary

**Migrated entire color system from red (#D55550) to lime (#C8FF00) primary -- 51 CSS token updates, confetti palette swap, and mask-icon rebrand across 3 files**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-27T18:31:00Z
- **Completed:** 2026-02-27T18:39:44Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Updated all :root CSS variables to Dopamine Noir V2 values: lime primary (#C8FF00), dark primary-foreground (#0A0A0A), brighter foreground (#FAFAFA), V2 surface (#26282B), muted text (#A1A1AA), distinct destructive (#B91C1C), and 0.75rem radius
- Updated @theme block tokens: surface, surface-elevated, primary-hover, primary-muted, glow shadows all changed from red-derived to lime-derived values
- Replaced hard-coded confetti colors in XPClaimModal.tsx from red palette to lime palette
- Updated index.html mask-icon color from #8B1A1A to #C8FF00
- Visual verification confirmed: all screens render with V2 lime color system, no red remnants visible

## Task Commits

Each task was committed atomically:

1. **Task 1: Update CSS tokens to Dopamine Noir V2 and fix hard-coded colors** - `f1478898` (feat)
2. **Task 2: Visual verification of Dopamine Noir V2 across all screens** - checkpoint approved, no code changes

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `src/index.css` - All :root and @theme color tokens updated to Dopamine Noir V2 values
- `index.html` - mask-icon color updated from #8B1A1A to #C8FF00
- `src/screens/XPClaimModal.tsx` - Confetti color array updated from red palette to lime palette

## Decisions Made
- Kept --border and --input at #2A2A2A rather than matching --card (#26282B) to preserve visible card boundaries (per research open question #3)
- Confetti colors updated to lime-adjacent palette (#C8FF00, #D4FF33, #A0CC00, #86B300) for visual consistency with new brand

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 17 (Foundation Cleanup) is fully complete: coach code stripped and V2 design tokens applied
- All subsequent phases (18-24) will build on the Dopamine Noir V2 color system
- Ready for Phase 18 (Gamification Engine) which depends on V2 design tokens for new UI

## Self-Check: PASSED

- FOUND: .planning/phases/17-foundation-cleanup/17-02-SUMMARY.md
- FOUND: f1478898 (Task 1 commit)
- FOUND: src/index.css
- FOUND: index.html
- FOUND: src/screens/XPClaimModal.tsx

---
*Phase: 17-foundation-cleanup*
*Completed: 2026-02-27*
