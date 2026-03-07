---
phase: 46-security-ux-fixes
plan: 03
subsystem: ui-polish
tags: [ux-fix, compliance, layout]
dependency_graph:
  requires: []
  provides: [workout-name-truncation, recovery-day-compliance]
  affects: [workouts-screen, checkin-modal]
tech_stack:
  added: []
  patterns: [text-truncation, conditional-compliance]
key_files:
  created: []
  modified:
    - src/screens/Workouts.tsx
    - src/screens/CheckInModal.tsx
decisions:
  - Used truncate CSS class on workout name paragraph for ellipsis overflow behavior
  - Implemented 4/4 compliance for recovery days rather than auto-checking workout item (simpler UX)
metrics:
  duration: 139s
  tasks_completed: 2
  files_modified: 2
  commits: 2
  completed: 2026-03-07
---

# Phase 46 Plan 03: UX Fixes - Workout Name & Compliance Summary

**One-liner:** Fixed workout name overflow with text truncation and adjusted compliance logic to allow 4/4 achievement on recovery days.

## Objective

Fix two UX issues identified in the audit report: (1) workout name overflow on the Today card, and (2) recovery day compliance calculation preventing users from achieving full compliance on rest days.

## Tasks Completed

### Task 1: Fix workout name overflow on Today card
**Status:** ✓ Complete
**Commit:** 5e0ba136
**Files:** src/screens/Workouts.tsx

Added `truncate` class to the workout name paragraph element (line 359) to ensure long workout names (e.g., "Push (Chest/Shoulders/Triceps)") display with ellipsis instead of overlapping the Start Workout button. The parent container already had `flex-1 min-w-0` which allows flex children to shrink properly.

**Technical approach:**
- Applied `truncate` utility class which sets `overflow: hidden`, `text-overflow: ellipsis`, and `white-space: nowrap`
- Leveraged existing `flex-1 min-w-0` container structure for proper flex shrinking
- No changes to button positioning required

### Task 2: Fix recovery day compliance calculation
**Status:** ✓ Complete
**Commit:** 61f8860b
**Files:** src/screens/CheckInModal.tsx

Adjusted the `isFullCompliance` calculation (lines 74-82) to detect whether a workout is scheduled. On training days, 5/5 compliance is required. On recovery days (no workout scheduled), 4/4 compliance (excluding workout item) is sufficient to unlock the share button.

**Technical approach:**
- Added `hasWorkoutScheduled` boolean check using `todayWorkout !== null`
- Changed `isFullCompliance` to conditional ternary: 5/5 if workout scheduled, 4/4 if not
- No UI changes required (workout row already displays as "Recovery Day" when no workout)
- Simpler than audit's suggestion to auto-check workout item with special label

## Verification

**UX-02 (Workout name overflow):**
- Long workout names now truncate with ellipsis on Today card
- Start Workout button remains fully visible and clickable
- No text/button overlap at any screen size

**UX-03 (Recovery day compliance):**
- Recovery days allow 4/4 compliance (protein + meal + steps + sleep)
- Share button appears on recovery days with 4/4 compliance
- Training days still require 5/5 compliance (including workout)
- Compliance logic correctly detects scheduled vs. non-scheduled workout days

Build succeeded with no errors. No regressions in existing workout tracking or check-in functionality.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

**Files created:**
- ✓ FOUND: .planning/phases/46-security-ux-fixes/46-03-SUMMARY.md

**Files modified:**
- ✓ FOUND: src/screens/Workouts.tsx
- ✓ FOUND: src/screens/CheckInModal.tsx

**Commits:**
- ✓ FOUND: 5e0ba136 (fix workout name overflow on Today card)
- ✓ FOUND: 61f8860b (fix recovery day compliance calculation)

## Self-Check: PASSED
