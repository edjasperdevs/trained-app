---
phase: 37-share-infrastructure
plan: 02
subsystem: sharing
tags: [html-to-image, capacitor-share, capacitor-filesystem, dom-capture, social-sharing]

# Dependency graph
requires:
  - phase: 37-01
    provides: "html-to-image package, @capacitor/camera, dpStore share actions with gating"
provides:
  - ShareCardWrapper component for off-screen DOM rendering
  - generateAndShare core utility for PNG capture and native sharing
  - shareRankUpCard, shareWorkoutCard, shareComplianceCard convenience wrappers
  - Web platform fallback via download link
affects: [38-workout-share, 39-compliance-share, 40-rankup-share]

# Tech tracking
tech-stack:
  added: []
  patterns: [off-screen-dom-capture, native-share-with-web-fallback, dp-award-after-share]

key-files:
  created:
    - src/lib/shareCard.ts
    - src/components/share/ShareCardWrapper.tsx
  modified: []

key-decisions:
  - "Used underscore prefix (_streak) for unused parameter to maintain API consistency"

patterns-established:
  - "Off-screen DOM capture: position at -9999px with 390x844 fixed dimensions"
  - "Share flow: toPng() with pixelRatio 2 for retina quality"
  - "DP award: called after Share.share() resolves, not on button tap"
  - "Web fallback: document.createElement('a') with download attribute"

requirements-completed: [SHARE-01, SHARE-02, SHARE-03, SHARE-15]

# Metrics
duration: 5min
completed: 2026-03-07
---

# Phase 37 Plan 02: Core Share Utility Summary

**shareCard.ts utility with generateAndShare for DOM-to-PNG capture, native share sheet integration, and web download fallback**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-07T02:01:21Z
- **Completed:** 2026-03-07T02:06:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created ShareCardWrapper component for off-screen DOM rendering at -9999px position
- Implemented generateAndShare core utility converting DOM elements to PNG via html-to-image
- Added native share sheet integration via @capacitor/share with file URI
- Implemented web platform fallback using download link
- Created convenience wrappers (shareRankUpCard, shareWorkoutCard, shareComplianceCard) with pre-formatted share text
- Integrated DP award system to fire after successful share

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ShareCardWrapper component** - `2fcc0481` (feat)
2. **Task 2: Create shareCard.ts utility with web fallback** - `d3053292` (feat)

## Files Created/Modified
- `src/components/share/ShareCardWrapper.tsx` - Off-screen wrapper for DOM capture (390x844px fixed dimensions)
- `src/lib/shareCard.ts` - Core share utility with generateAndShare and card-type wrappers

## Decisions Made
- Used underscore prefix (_streak) in shareRankUpCard for unused parameter to maintain consistent API signature while satisfying TypeScript strict mode

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Share infrastructure complete
- ShareCardWrapper ready for card component integration
- generateAndShare ready to be called from share card implementations
- Convenience wrappers (shareRankUpCard, shareWorkoutCard, shareComplianceCard) ready for card components
- Web fallback functional for development/testing without native device

---
*Phase: 37-share-infrastructure*
*Completed: 2026-03-07*

## Self-Check: PASSED

- [x] src/lib/shareCard.ts exists
- [x] src/components/share/ShareCardWrapper.tsx exists
- [x] Commit 2fcc0481 exists
- [x] Commit d3053292 exists
