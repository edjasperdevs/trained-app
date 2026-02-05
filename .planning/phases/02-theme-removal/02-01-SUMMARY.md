---
phase: 02-theme-removal
plan: 01
subsystem: ui
tags: [react, components, theme-removal, constants, de-branching]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Design token system and CSS custom properties
provides:
  - 12 de-branched component files (zero isTrained/useTheme references)
  - src/design/constants.ts with LABELS, AVATAR_STAGES, STANDING_ORDERS, getStandingOrder
affects: [02-theme-removal plan-02 (screens), 02-theme-removal plan-03 (theme deletion)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Direct LABELS/AVATAR_STAGES import from @/design/constants instead of useTheme().theme.labels"
    - "Single-path component styling (no conditional branching)"

key-files:
  created:
    - src/design/constants.ts
  modified:
    - src/components/Button.tsx
    - src/components/Card.tsx
    - src/components/Navigation.tsx
    - src/components/ProgressBar.tsx
    - src/components/Toast.tsx
    - src/components/XPDisplay.tsx
    - src/components/Avatar.tsx
    - src/components/StreakDisplay.tsx
    - src/components/ReminderCard.tsx
    - src/components/WeeklySummary.tsx
    - src/components/Badges.tsx
    - src/components/BadgeUnlockModal.tsx

key-decisions:
  - "Trained moodAnimations kept as single const (renamed from trainedMoodAnimations)"
  - "RARITY_GLOW removed from BadgeUnlockModal (was GYG-only styling)"
  - "RARITY_COLORS import removed from BadgeUnlockModal (unused after de-branching)"
  - "StreakBadge text removed entirely (Trained shows no label text after count)"
  - "Confetti only shows for epic/legendary badges (Trained behavior)"

patterns-established:
  - "Import labels from @/design/constants, not from useTheme"
  - "RARITY_BG uses Trained palette (surface-elevated, info/10, primary-muted, warning/10)"

# Metrics
duration: 7min
completed: 2026-02-05
---

# Phase 2 Plan 1: Component De-branching Summary

**De-branched 12 component files (removed ~267 lines of GYG conditional logic) and created constants file decoupled from theme system**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-05T18:42:14Z
- **Completed:** 2026-02-05T18:49:13Z
- **Tasks:** 2
- **Files modified:** 13 (1 created, 12 modified)

## Accomplishments
- Created src/design/constants.ts with all label strings, avatar stages, standing orders, and getStandingOrder function -- fully decoupled from theme imports
- Removed all useTheme/isTrained/themeId references from 12 component files (net -267 lines)
- All 138 existing tests pass, TypeScript compiles cleanly, build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/design/constants.ts** - `30ca7a0f` (feat)
2. **Task 2: De-branch all 12 component files** - `c5114973` (feat)

## Files Created/Modified
- `src/design/constants.ts` - Exported LABELS, AVATAR_STAGES, STANDING_ORDERS, getStandingOrder (decoupled from theme system)
- `src/components/Button.tsx` - Removed GYG variant switch, kept rounded + uppercase tracking
- `src/components/Card.tsx` - Removed GYG glassmorphism, kept solid surface + rounded-md
- `src/components/Navigation.tsx` - Removed GYG indicator, kept w-10 + uppercase labels
- `src/components/ProgressBar.tsx` - Removed gradient ternary, kept rounded-sm
- `src/components/Toast.tsx` - Removed GYG colored-bg, kept border-l + bottom-20
- `src/components/XPDisplay.tsx` - Replaced theme.labels with LABELS, removed glass/text-glow
- `src/components/Avatar.tsx` - Replaced theme.avatarStages with AVATAR_STAGES, merged moodAnimations
- `src/components/StreakDisplay.tsx` - Removed GYG text variations, kept rounded-sm squares + empty content for non-active days
- `src/components/ReminderCard.tsx` - Removed GYG gradient/pulse, kept border-left style, simplified TYPE_STYLES to single string
- `src/components/WeeklySummary.tsx` - Replaced theme.labels with LABELS, kept Trained labels (Reports, Full Compliance, Weekly)
- `src/components/Badges.tsx` - Renamed TRAINED_RARITY_BG to RARITY_BG, removed GYG RARITY_BG, replaced theme.labels
- `src/components/BadgeUnlockModal.tsx` - Simplified confetti to CONFETTI_COLORS constant, removed GYG glow ring, removed RARITY_GLOW

## Decisions Made
- Kept Trained moodAnimations (subtle, restrained) as the sole set, renamed from `trainedMoodAnimations` to `moodAnimations`
- Removed RARITY_GLOW entirely from BadgeUnlockModal (only existed for GYG rounded-full badge styling)
- Removed RARITY_COLORS import from BadgeUnlockModal (unused after removing GYG badge icon path that used it)
- StreakBadge shows no trailing text (Trained behavior: count only, no "day streak" label)
- Confetti only renders for epic/legendary badges (Trained behavior: restrained celebration)
- Used HTML entity `&#10003;` for check mark in Badges.tsx earned indicator (replaces raw character)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused RARITY_COLORS import and RARITY_GLOW constant**
- **Found during:** Task 2 (BadgeUnlockModal de-branching)
- **Issue:** After removing GYG branch, RARITY_COLORS import and RARITY_GLOW constant were unused, causing TS6133 errors
- **Fix:** Removed the import and the constant definition
- **Files modified:** src/components/BadgeUnlockModal.tsx
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** c5114973 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial cleanup of dead code exposed by de-branching. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 12 component files are de-branched and ready
- Plan 02 (screen de-branching) can proceed -- screens import these components
- Plan 03 (theme file deletion) is unblocked for components layer
- src/design/constants.ts provides the label/stage constants that screens will also need

---
*Phase: 02-theme-removal*
*Completed: 2026-02-05*
