---
phase: 15-local-notifications-engagement
plan: 01
subsystem: notifications
tags: [capacitor, local-notifications, badge, zustand, ios]

# Dependency graph
requires:
  - phase: 11-capacitor-shell
    provides: Capacitor native shell with isNative() platform guard
  - phase: 14-remote-push-notifications
    provides: Push notification plugin patterns and capacitor.config.ts structure
provides:
  - scheduleAllNotifications() for 6 notification types + per-day workout reminders
  - cancelAllScheduled() cancel-and-reschedule pattern
  - updateBadge() with computePendingActions() badge count logic
  - markCoachResponseSeen() for badge count management
  - NotificationPreferences persisted state with setNotificationPreference/setNotificationTime
  - NOTIFICATION_IDS stable ID constants and toCapWeekday weekday mapper
affects: [15-02-local-notifications-engagement, settings-ui, app-lifecycle]

# Tech tracking
tech-stack:
  added: ["@capacitor/local-notifications@7.0.5", "@capawesome/capacitor-badge@7.0.1"]
  patterns: ["cancel-and-reschedule notification pattern", "dual preferences (in-app reminders vs push notifications)", "stable notification IDs for cancel targeting"]

key-files:
  created: ["src/lib/notifications.ts", "src/lib/badge.ts"]
  modified: ["src/stores/remindersStore.ts", "src/stores/index.ts", "capacitor.config.ts", "package.json"]

key-decisions:
  - "Separate notificationPreferences from existing in-app preferences to maintain backward compatibility"
  - "weeklyCheckIn defaults to disabled (only relevant for coaching clients)"
  - "Workout reminders use stable IDs 20+dayOfWeek for individual per-day cancel targeting"
  - "Badge count from two sources: pending daily check-in + unread coach response"
  - "NotificationPreferences types added in Task 1 to avoid cross-task circular dependency"

patterns-established:
  - "Cancel-and-reschedule: always cancelAllScheduled() before scheduling new notifications"
  - "Stable notification IDs: named constants for fixed types, computed 20+day for workouts"
  - "Dual preferences: in-app reminder cards (preferences) vs native push scheduling (notificationPreferences)"

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 15 Plan 01: Local Notification Infrastructure Summary

**Local notification scheduling with 6 configurable notification types, badge count from check-in and coach response, and persisted time preferences via Zustand**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-23T01:21:02Z
- **Completed:** 2026-02-23T01:26:40Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Installed @capacitor/local-notifications and @capawesome/capacitor-badge with native sync
- Created notification scheduling module supporting daily, weekly, and per-workout-day triggers via ScheduleOn
- Created badge module computing pending actions from check-in status and unread coach responses
- Extended reminders store with 6 notification preferences (enabled + time) persisted via Zustand

## Task Commits

Each task was committed atomically:

1. **Task 1: Install plugins and create notification scheduling module** - `5113b171` (feat)
2. **Task 2: Create badge module and extend reminders store with notification preferences** - `4f370042` (feat)

## Files Created/Modified
- `src/lib/notifications.ts` - Scheduling module with scheduleAllNotifications, cancelAllScheduled, NOTIFICATION_IDS, toCapWeekday
- `src/lib/badge.ts` - Badge management with updateBadge, computePendingActions, markCoachResponseSeen
- `src/stores/remindersStore.ts` - Extended with NotificationPreferences types, state, and actions
- `src/stores/index.ts` - Added NotificationTimePreference and NotificationPreferences type exports
- `capacitor.config.ts` - Added LocalNotifications and Badge plugin config with triple-slash reference
- `package.json` - Added @capacitor/local-notifications and @capawesome/capacitor-badge dependencies
- `package-lock.json` - Lock file updated with new dependencies

## Decisions Made
- Separated `notificationPreferences` (native push scheduling) from existing `preferences` (in-app reminder cards) to preserve backward compatibility and avoid breaking existing UI
- weeklyCheckIn defaults to `enabled: false` since it's only relevant for coaching clients
- Workout reminders use computed IDs (20 + dayOfWeek) for individual per-day cancel targeting
- Badge count limited to two actionable sources: pending check-in and unread coach response
- Added NotificationPreferences types to remindersStore during Task 1 (ahead of Task 2's store extension) to satisfy the import from notifications.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added NotificationPreferences types during Task 1**
- **Found during:** Task 1 (notification scheduling module)
- **Issue:** notifications.ts imports NotificationPreferences from remindersStore, but the types were planned for Task 2
- **Fix:** Added the type definitions (NotificationTimePreference, NotificationPreferences interfaces) to remindersStore in Task 1, with full state/actions in Task 2
- **Files modified:** src/stores/remindersStore.ts
- **Verification:** `npx tsc --noEmit` passes after Task 1
- **Committed in:** 5113b171 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor sequencing adjustment to avoid cross-task circular dependency. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Notification scheduling and badge modules ready for Plan 02 to wire into UI and app lifecycle
- All 6 notification types schedulable via `scheduleAllNotifications(prefs, workoutDays)`
- Badge count ready to update on app foreground via `updateBadge()`

## Self-Check: PASSED

All files verified present, all commit hashes found in git log.

---
*Phase: 15-local-notifications-engagement*
*Completed: 2026-02-22*
