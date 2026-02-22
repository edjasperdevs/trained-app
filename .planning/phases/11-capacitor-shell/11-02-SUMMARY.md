---
phase: 11-capacitor-shell
plan: 02
subsystem: ui
tags: [capacitor, dialog, ios, native, wkwebview, lifecycle, sync, confirm]

# Dependency graph
requires:
  - phase: 11-01
    provides: "Capacitor 7.5 iOS project, platform detection (isNative), @capacitor/dialog + @capacitor/app installed"
provides:
  - "Cross-platform confirmAction() wrapper (native iOS dialogs on Capacitor, window.confirm on web)"
  - "Native app lifecycle detection for background/foreground sync"
affects: [12-native-plugins, 13-push-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns: ["confirmAction() for all destructive confirmations", "CapApp.addListener appStateChange for native lifecycle"]

key-files:
  created: ["src/lib/confirm.ts"]
  modified: ["src/App.tsx", "src/screens/Settings.tsx", "src/screens/Workouts.tsx", "src/screens/Macros.tsx", "src/screens/Coach.tsx", "src/screens/Onboarding.tsx", "src/components/WorkoutAssigner.tsx"]

key-decisions:
  - "confirmAction() is always async -- all call sites use await for uniform native/web behavior"
  - "Each dialog gets a descriptive 2-3 word title parameter for native UIAlertController context"
  - "Native lifecycle listener is additive to existing visibilitychange -- both coexist for respective platforms"

patterns-established:
  - "Confirmation dialogs: always use confirmAction() from @/lib/confirm, never window.confirm()"
  - "Native lifecycle: use @capacitor/app appStateChange for iOS background/foreground, visibilitychange for web tabs"

# Metrics
duration: 9min
completed: 2026-02-22
---

# Phase 11 Plan 02: Native Dialog & Lifecycle Summary

**Cross-platform confirmAction() replacing all 10 window.confirm() calls with native iOS dialogs, plus appStateChange lifecycle listener for foreground sync**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-22T14:50:52Z
- **Completed:** 2026-02-22T14:59:56Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- All 10 window.confirm() calls replaced with async confirmAction() across 6 files -- zero window.confirm remaining
- confirmAction() uses @capacitor/dialog (native iOS UIAlertController) on Capacitor, window.confirm on web
- Each dialog has a descriptive title (e.g., 'Delete Progress', 'End Workout', 'Release Targets')
- Native app lifecycle listener in App.tsx detects background/foreground transitions via appStateChange
- Foreground resume triggers pullCoachData() + flushPendingSync() after 30+ seconds (mirrors web visibilitychange behavior)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create confirmAction wrapper and migrate all 10 window.confirm() call sites** - `fef62646` (feat)
2. **Task 2: Add native app lifecycle listener for background/foreground detection** - `2eb24b35` (feat)

## Files Created/Modified
- `src/lib/confirm.ts` - Cross-platform confirmation dialog wrapper (isNative check, Dialog.confirm vs window.confirm)
- `src/App.tsx` - Added @capacitor/app lifecycle listener for native foreground sync
- `src/screens/Settings.tsx` - handleResetProgress: async + confirmAction
- `src/screens/Workouts.tsx` - handleEndWorkoutEarly + reset-to-defaults: async + confirmAction
- `src/screens/Macros.tsx` - delete meal entry + delete saved meal: async + confirmAction
- `src/screens/Coach.tsx` - handleRevert + handleDeleteTemplate + handleDeleteAssignment: confirmAction
- `src/screens/Onboarding.tsx` - handleSkip: async + confirmAction
- `src/components/WorkoutAssigner.tsx` - existing assignment check: confirmAction

## Decisions Made
- confirmAction() is always async with Promise<boolean> return, even on web (window.confirm wrapped in promise) -- simplifies call sites to always use await
- Each confirmation gets a short descriptive title for the native UIAlertController header (2-3 words describing the action)
- Native lifecycle listener coexists with existing visibilitychange -- both are needed (visibilitychange for web tab switching, appStateChange for iOS app switcher)
- 30-second threshold for foreground sync matches the existing visibilitychange behavior

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed isSubmitting guard placement in handleEndWorkoutEarly**
- **Found during:** Task 1 (Workouts.tsx migration)
- **Issue:** `setIsSubmitting(true)` was called before the confirmation dialog check -- if user cancelled, the UI would be locked in submitting state
- **Fix:** Moved `setIsSubmitting(true)` to after the confirmation check passes
- **Files modified:** src/screens/Workouts.tsx
- **Verification:** Build passes, logic flow is correct
- **Committed in:** fef62646 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor guard reordering for correctness. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All confirmation dialogs are native-ready for iOS WKWebView
- App lifecycle detection enables sync-on-resume for native users
- Phase 11 (Capacitor Shell) is now complete -- ready for Phase 12 (Native Plugins)
- Zero window.confirm() calls remain in the codebase

## Self-Check: PASSED

All files verified present, all commits confirmed in history, all content checks pass. Zero window.confirm() in any migrated file.

---
*Phase: 11-capacitor-shell*
*Completed: 2026-02-22*
