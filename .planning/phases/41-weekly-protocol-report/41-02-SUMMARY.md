---
phase: 41-weekly-protocol-report
plan: 02
subsystem: engagement
tags: [weekly-report, notifications, deep-linking, settings-ui]
completed: 2026-03-07
duration: 7min

dependencies:
  requires: [weeklyReportStore, WeeklyReportScreen, remindersStore, notifications]
  provides: [weeklyReport-notification, in-app-trigger, deep-link-handler]
  affects: [Home.tsx, Settings.tsx, App.tsx]

tech_stack:
  added: [weeklyReport-preference, WEEKLY_REPORT-notification]
  patterns: [sunday-notification, sessionStorage-deep-link, subscribe-pattern]

key_files:
  created: []
  modified:
    - src/stores/remindersStore.ts
    - src/lib/notifications.ts
    - src/screens/Home.tsx
    - src/App.tsx
    - src/screens/Settings.tsx

decisions:
  - weeklyReport notification defaults to enabled at 7pm (19:00)
  - Deep link route /weekly-report uses sessionStorage flag for modal trigger
  - Weekly report triggers on Sunday after any DP action
  - Subscribe to dpStore for reactive trigger after check-in
  - Placed weeklyReport toggle after claimXP in Settings (both Sunday notifications)

metrics:
  tasks_completed: 3
  files_created: 0
  files_modified: 5
  commits: 3
---

# Phase 41 Plan 02: Home Screen Integration Summary

**One-liner:** In-app trigger on Sunday after first DP action, push notification at 7pm, and Settings toggle for weekly report notifications

## Tasks Completed

| Task | Commit | Files |
|------|--------|-------|
| 1. Add weeklyReport notification preference and scheduling | 700bbf1d | src/stores/remindersStore.ts, src/lib/notifications.ts |
| 2. Integrate WeeklyReportScreen in Home.tsx with in-app trigger | 1e5b5f4d | src/screens/Home.tsx, src/App.tsx |
| 3. Add weekly report toggle to Settings | 385d9ac3 | src/screens/Settings.tsx |

## Implementation Details

### Task 1: Notification Preference & Scheduling

**remindersStore.ts:**
- Added `weeklyReport: { enabled: boolean; time: NotificationTimePreference }` to NotificationPreferences interface
- Default state: `{ enabled: true, time: { hour: 19, minute: 0 } }` (7pm Sunday)

**notifications.ts:**
- Added `WEEKLY_REPORT: 7` to NOTIFICATION_IDS
- Created Sunday notification schedule:
  - Title: "Weekly Protocol Report"
  - Body: "Your weekly performance summary is ready."
  - Weekday: Sunday
  - Time: User-configured (default 7pm)
  - Deep link route: `/weekly-report`

### Task 2: Home Screen Integration

**Home.tsx:**
- Imported `WeeklyReportScreen` and `useWeeklyReportStore`
- Added `showWeeklyReportFull` state for full-screen modal
- Created useEffect that:
  - Checks `shouldShowReport()` on mount
  - Subscribes to dpStore to trigger after DP actions
  - Sets flag when conditions met (Sunday + not shown this week)
- Added sessionStorage deep link handler:
  - Checks for `showWeeklyReport` flag on mount
  - Clears flag after detection
  - Triggers modal display
- Rendered WeeklyReportScreen as conditional overlay
- Calls `markReportShown()` on close to prevent duplicate shows

**App.tsx:**
- Updated local notification listener to handle `/weekly-report` route
- Sets `sessionStorage.setItem('showWeeklyReport', 'true')` for modal trigger
- Navigates to home screen where modal is displayed

**Pattern:** Deep link → sessionStorage flag → Home.tsx detection → Modal display

### Task 3: Settings Toggle

**Settings.tsx:**
- Added weeklyReport entry to notification toggles array (line 926, after claimXP)
- Configuration:
  - Key: `'weeklyReport'`
  - Label: `'Weekly Report'`
  - Description: `'Sunday reminder to view your weekly summary'`
  - Icon: `BarChart3` (matches stats/analytics theme)
  - Visible: `true` (always shown)
- Inherits existing toggle UI pattern:
  - Enable/disable switch
  - Time picker (when enabled)
  - Auto-reschedules notifications on change

## Verification Results

1. `npx tsc --noEmit` passes with zero errors ✓
2. weeklyReport exists in NotificationPreferences with 7pm default ✓
3. WEEKLY_REPORT notification ID exists in notifications.ts ✓
4. WeeklyReportScreen modal integrated in Home.tsx ✓
5. Settings shows Weekly Report toggle in Push Notifications section ✓

## Success Criteria Met

- [x] In-app trigger shows WeeklyReportScreen on Sunday after first DP action (once per week)
- [x] Push notification scheduled for Sunday at 7pm (or user-configured time)
- [x] Push notification deep links to show weekly report via sessionStorage pattern
- [x] Settings has Weekly Report toggle for enabling/disabling notifications

## Deviations from Plan

**Auto-fix Issue 1 (Rule 3 - Blocking):**
- **Found during:** Task 2 implementation
- **Issue:** Plan suggested Zustand's selector-based subscribe syntax `useDPStore.subscribe((state) => state.lastActionDate, callback)` but this is not supported by standard Zustand
- **Fix:** Changed to standard subscribe pattern `useDPStore.subscribe(callback)` which fires on any state change
- **Files modified:** src/screens/Home.tsx
- **Commit:** 1e5b5f4d (included in Task 2)

**Rationale:** This is correct - Zustand's base subscribe API only accepts a single callback. The selector-based subscription is a zustand/middleware feature not used in this codebase.

## Next Steps

Plan 03 will implement share card generation for the weekly report (similar to RankUpShareCard and WorkoutShareCard patterns from v2.2.1).

## Self-Check

Verifying modified files exist:
- FOUND: src/stores/remindersStore.ts
- FOUND: src/lib/notifications.ts
- FOUND: src/screens/Home.tsx
- FOUND: src/App.tsx
- FOUND: src/screens/Settings.tsx

Verifying commits exist:
- FOUND: 700bbf1d (Task 1)
- FOUND: 1e5b5f4d (Task 2)
- FOUND: 385d9ac3 (Task 3)

## Self-Check: PASSED
