---
phase: 44-locked-protocol
plan: 05
subsystem: ui
tags: [share-cards, dp-rewards, html-to-image, locked-protocol]

# Dependency graph
requires:
  - 44-02 (LockedProtocolScreen, share prompt placeholder)
provides:
  - LockedStartShareCard component
  - LockedMilestoneShareCard component
  - Share DP tracking in dpStore
  - Share prompts wired in LockedProtocolScreen
affects: [44-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Locked Protocol share card inline style pattern (matches existing share cards)"
    - "One-time share DP gating (per protocol ID, per milestone day)"
    - "Off-screen card rendering with ShareCardWrapper for html-to-image capture"

key-files:
  created:
    - src/components/share/LockedStartShareCard.tsx
    - src/components/share/LockedMilestoneShareCard.tsx
  modified:
    - src/stores/dpStore.ts
    - src/lib/shareCard.ts
    - src/screens/LockedProtocolScreen.tsx

key-decisions:
  - "Share cards use inline styles for html-to-image capture (no Tailwind JIT)"
  - "+10 DP for each share type (locked start, locked milestone)"
  - "One-time gate per protocol ID for start share, per milestone day for milestone share"
  - "Pre-filled captions include hashtags per feature brief"

patterns-established:
  - "Locked share card SVG pattern: chain crown logo top-left, wordmark top-right"
  - "Share prompt overlay with ShareCardWrapper for off-screen capture"

requirements-completed: [LOCK-10, LOCK-11]

# Metrics
duration: 5min
completed: 2026-03-07
---

# Phase 44 Plan 05: Share Cards Summary

**Locked Protocol share cards with DP rewards for protocol start and milestone achievements**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-07T19:32:49Z
- **Completed:** 2026-03-07T19:38:21Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Created LockedStartShareCard with padlock icon, keyholder, goal, start date, user callsign/rank
- Created LockedMilestoneShareCard with massive days count, milestone title, DP earned display
- Added share DP tracking to dpStore (lastLockedStartShareProtocolId, lastLockedMilestoneShareMilestones)
- Added awardLockedStartShareDP and awardLockedMilestoneShareDP methods (+10 DP each)
- Added shareLockedStartCard and shareLockedMilestoneCard to shareCard.ts with pre-filled captions
- Wired actual share functionality in LockedProtocolScreen replacing placeholder
- Share prompt appears after accepting protocol with card capture
- Share prompt appears after reaching milestone with card capture

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LockedStartShareCard component** - `a18bc7db` (feat)
2. **Task 2: Create LockedMilestoneShareCard component** - `ebfd246f` (feat)
3. **Task 3: Wire share prompts and DP rewards** - `1a253377` (feat)

## Files Created/Modified
- `src/components/share/LockedStartShareCard.tsx` - Protocol Initiated share card (284 lines)
- `src/components/share/LockedMilestoneShareCard.tsx` - Milestone share card (293 lines)
- `src/stores/dpStore.ts` - Added locked share tracking state and DP award methods
- `src/lib/shareCard.ts` - Added locked_start and locked_milestone share types and convenience wrappers
- `src/screens/LockedProtocolScreen.tsx` - Replaced placeholder share prompt with actual share flow

## Decisions Made
- Share cards use 390x844 dimensions matching existing share cards
- Used inline SVG chain crown logo pattern consistent with other share cards
- Added decorative wing/laurel SVG around rank name for visual polish
- MILESTONE_TITLES exported from LockedMilestoneShareCard for use in share text
- Share prompt shows after 3-second milestone toast dismisses (sequential UX)

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Share cards ready for production use
- DP rewards properly gated (one-time per protocol/milestone)
- Plan 06 can proceed with any remaining Locked Protocol features
- All share infrastructure in place using existing patterns

## Self-Check: PASSED

- FOUND: src/components/share/LockedStartShareCard.tsx
- FOUND: src/components/share/LockedMilestoneShareCard.tsx
- FOUND: commit a18bc7db
- FOUND: commit ebfd246f
- FOUND: commit 1a253377

---
*Phase: 44-locked-protocol*
*Completed: 2026-03-07*
