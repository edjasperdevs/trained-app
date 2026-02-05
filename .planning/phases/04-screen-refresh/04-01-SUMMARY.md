---
phase: 04-screen-refresh
plan: 01
subsystem: ui-typography
tags: [typography, spacing, uppercase, tailwind, css]

dependency-graph:
  requires: [03-component-primitives]
  provides: [premium-typography-hierarchy, consistent-screen-spacing]
  affects: [05-detail-screens, 06-polish]

tech-stack:
  added: []
  patterns:
    - weight-driven-hierarchy (font-semibold/font-bold replacing uppercase)
    - screen-level-px-5 (consistent 20px outer padding)
    - h1-only-uppercase (CSS global rule restricts uppercase to h1)

file-tracking:
  key-files:
    created: []
    modified:
      - src/index.css
      - src/screens/Home.tsx
      - src/screens/Workouts.tsx
      - src/screens/Macros.tsx
      - src/screens/Achievements.tsx
      - src/screens/AvatarScreen.tsx
      - src/screens/Settings.tsx
      - src/screens/Onboarding.tsx
      - src/screens/AccessGate.tsx
      - src/screens/Auth.tsx
      - src/screens/Coach.tsx
      - src/screens/CheckInModal.tsx
      - src/screens/XPClaimModal.tsx
      - src/components/Badges.tsx
      - src/components/StreakDisplay.tsx
      - src/components/XPDisplay.tsx
      - src/components/Avatar.tsx
      - src/components/WeeklySummary.tsx
      - src/components/ReminderCard.tsx
      - src/components/Navigation.tsx
      - src/components/BadgeUnlockModal.tsx
      - src/components/Skeleton.tsx

decisions:
  - id: 04-01-01
    decision: "h1 keeps uppercase in CSS, h2/h3 get letter-spacing only"
    rationale: "Page titles are the screen identity, sub-headings use weight for hierarchy"
  - id: 04-01-02
    decision: "Settings section headers keep uppercase (5 instances)"
    rationale: "Settings groups function as structural section dividers (PROFILE, UNITS, etc.)"
  - id: 04-01-03
    decision: "Button.tsx primary CTA uppercase preserved"
    rationale: "Primary action buttons are intentionally uppercase per design system"
  - id: 04-01-04
    decision: "AccessGate input uppercase preserved"
    rationale: "License key input formatting, not text content"
  - id: 04-01-05
    decision: "Achievements scrollable filter uses -mx-5 px-5 to match parent"
    rationale: "Horizontal scroll bleeds need negative margin matching container padding"

metrics:
  duration: ~10min
  completed: 2026-02-05
---

# Phase 04 Plan 01: Typography and Spacing Refresh Summary

**One-liner:** Reduced uppercase from 92 to 11 intentional uses with weight-driven hierarchy, applied consistent px-5 screen padding across all 10 screens and 7 skeleton variants.

## What Was Done

### Task 1: Fix Uppercase Overuse (0d741853)
Systematically audited all 10 screens and 8 components for uppercase usage. Changed the global CSS heading rules to restrict `text-transform: uppercase` to h1 only (h2/h3 get `letter-spacing: 0.02em` instead). Removed inline `uppercase tracking-wide/wider/widest` from 81 locations across the codebase. Removed `font-heading` (Oswald) from non-heading elements like card labels, stat values, option labels, and badge names.

**Before:** 92 uppercase occurrences across screens and components
**After:** 11 intentional uppercase uses:
- Home.tsx (2): section headers "Daily Quests" and "Protocol Compliance"
- AvatarScreen.tsx (2): section headers "ROLE" and "PROGRESSION PATH"
- Settings.tsx (5): section group headers (PROFILE, UNITS, etc.)
- AccessGate.tsx (1): license key input formatting
- Button.tsx (1): primary CTA variant

Files modified: 18 (10 screens, 8 components, index.css)

### Task 2: Consistent Screen Spacing (a2290d06)
Changed all screen-level container and header `px-4` (16px) to `px-5` (20px) across all screens. Updated all 7 Skeleton component variants (HomeSkeleton, WorkoutsSkeleton, MacrosSkeleton, AchievementsSkeleton, AvatarSkeleton, SettingsSkeleton, OnboardingSkeleton) to match real screen padding.

**Before:** 27 px-4 in screens, 0 px-5
**After:** 8 px-4 (inner content only), 19 px-5 (screen-level containers)

Skeleton.tsx: 0 px-4 remaining, 13 px-5 instances matching real screens.

Files modified: 11 (10 screens, Skeleton.tsx)

## Verification Results

1. No screen file exceeds 5 uppercase occurrences (section headers only)
2. All screen-level containers use px-5 (20px) padding
3. All skeleton variants match real screen padding
4. `npx tsc --noEmit` passes cleanly
5. `npx vite build` succeeds (4.83s)

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 0d741853 | feat(04-01): fix uppercase overuse across all screens and components |
| 2 | a2290d06 | feat(04-01): apply consistent px-5 spacing across all screens |

## Next Phase Readiness

Plan 04-01 complete. Combined with 04-02 (already complete), Phase 4 Screen Refresh is fully executed. All screens now use:
- Weight-driven typography hierarchy (no excessive uppercase)
- Consistent 20px screen padding
- Bottom sheet modals with proper overlay and spacing (from 04-02)
- Cleaned palette with no legacy color references (from 04-02)
