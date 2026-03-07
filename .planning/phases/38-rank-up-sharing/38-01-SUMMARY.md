---
phase: 38-rank-up-sharing
plan: 01
subsystem: sharing
tags: [html-to-image, share-card, rank-up, native-share, capacitor-share]

# Dependency graph
requires:
  - phase: 37-02
    provides: "ShareCardWrapper component, shareRankUpCard utility, generateAndShare core utility"
provides:
  - RankUpShareCard component for PNG capture with gold/obsidian styling
  - RankUpModal share button integration after rank claim
  - End-to-end share flow from claim to native share sheet
affects: [39-compliance-share, 40-workout-share]

# Tech tracking
tech-stack:
  added: []
  patterns: [inline-styles-for-capture, avatar-stage-from-rank]

key-files:
  created:
    - src/components/share/RankUpShareCard.tsx
  modified:
    - src/components/RankUpModal.tsx

key-decisions:
  - "Used getAvatarStage(newRank) instead of avatarStore.stage for accurate rank-based avatar display"
  - "Removed auto-close after claim to allow share action before dismissal"

patterns-established:
  - "Share card uses inline styles (not Tailwind) for html-to-image capture compatibility"
  - "Avatar stage derived from rank via getAvatarStage utility"
  - "Share button appears after claim with motion fade-in (0.5s delay)"

requirements-completed: [SHARE-04, SHARE-07]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 38 Plan 01: Rank-Up Share Card Summary

**RankUpShareCard component with gold/obsidian styling and RankUpModal integration showing share button after rank claim**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T02:32:33Z
- **Completed:** 2026-03-07T02:35:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created RankUpShareCard component matching mockup design with chain-link crown SVG, rank name, avatar with radial glow, DP/streak pills, and branding
- Integrated share button into RankUpModal that appears after user claims their rank
- Connected shareRankUpCard utility for PNG capture and native share sheet
- DP award (+10) automatically handled by existing shareCard.ts infrastructure

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RankUpShareCard component** - `eac87da6` (feat)
2. **Task 2: Integrate share button into RankUpModal** - `c5927b47` (feat)

## Files Created/Modified
- `src/components/share/RankUpShareCard.tsx` - Rank-up share card component with inline styles for PNG capture (259 lines)
- `src/components/RankUpModal.tsx` - Added share button integration, ShareCardWrapper, and share handling

## Decisions Made
- Used `getAvatarStage(newRank)` to derive avatar stage from the new rank, rather than accessing avatarStore.stage which doesn't exist
- Removed the auto-close timeout after claiming to allow users to share their rank before dismissing the modal
- Used inline styles throughout RankUpShareCard for reliable html-to-image capture (Tailwind JIT classes may not capture correctly)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Rank-up share flow complete and functional
- Pattern established for remaining share cards (compliance, workout)
- Same inline styles approach should be used for future share card components

---
*Phase: 38-rank-up-sharing*
*Completed: 2026-03-07*

## Self-Check: PASSED

- [x] src/components/share/RankUpShareCard.tsx exists
- [x] src/components/RankUpModal.tsx modified with share integration
- [x] Commit eac87da6 exists
- [x] Commit c5927b47 exists
