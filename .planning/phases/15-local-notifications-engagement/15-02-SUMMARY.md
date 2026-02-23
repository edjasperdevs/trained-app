---
phase: 15-local-notifications-engagement
plan: 02
subsystem: notifications
tags: [capacitor, local-notifications, badge, settings-ui, ios, apns]

# Dependency graph
requires:
  - phase: 15-local-notifications-engagement
    plan: 01
    provides: scheduleAllNotifications, updateBadge, NotificationPreferences store state
  - phase: 14-remote-push-notifications
    provides: APNs payload in supabase/functions/_shared/apns.ts
provides:
  - Push Notifications settings card in Settings.tsx with toggles and time pickers
  - Local notification tap navigation via localNotificationActionPerformed listener
  - Schedule-on-launch and badge-on-foreground lifecycle integration in App.tsx
  - Client-managed badge count (no more server-side badge:1 in APNs payload)
affects: [settings-ui, app-lifecycle, remote-push-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Settings UI notification config with immediate reschedule", "foreground badge refresh", "local notification tap-to-route navigation"]

key-files:
  created: []
  modified: ["src/screens/Settings.tsx", "src/App.tsx", "supabase/functions/_shared/apns.ts"]

key-decisions:
  - "Weekly check-in notification toggle conditionally visible based on active coach_clients row"
  - "Badge updates on every foreground resume (not just after 30s threshold)"
  - "Direct store imports (workoutStore, remindersStore) in App.tsx for .getState() calls to avoid circular deps"
  - "Removed badge:1 from APNs payload so badge count is exclusively client-managed"

patterns-established:
  - "Notification reschedule on any preference change: toggle, time, or workout day selection"
  - "Badge refresh on both app launch and foreground resume for accurate count"

# Metrics
duration: 4min
completed: 2026-02-22
---

# Phase 15 Plan 02: Settings UI & Lifecycle Integration Summary

**Push notification settings card with 6 configurable types, local notification tap navigation, schedule-on-launch, and badge-on-foreground lifecycle wiring**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-23T01:29:54Z
- **Completed:** 2026-02-23T01:34:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added Push Notifications settings card to Settings screen with toggles and time pickers for 6 notification types
- Wired local notification tap listener in App.tsx for route-based navigation on notification tap
- Integrated schedule-on-launch and badge-on-foreground lifecycle hooks in App.tsx
- Removed badge:1 from APNs remote push payload for exclusive client-side badge management

## Task Commits

Each task was committed atomically:

1. **Task 1: Add push notification settings UI to Settings screen** - `9a8b73df` (feat)
2. **Task 2: Wire lifecycle integration and remove badge from remote push** - `a9819577` (feat)

## Files Created/Modified
- `src/screens/Settings.tsx` - Push Notifications card with 6 toggleable notification types, time pickers, coaching client check for weekly check-in visibility
- `src/App.tsx` - Local notification tap listener, schedule-on-launch effect, badge update on foreground resume and launch
- `supabase/functions/_shared/apns.ts` - Removed badge:1 from APNs payload for client-managed badge count

## Decisions Made
- Weekly check-in notification toggle is conditionally visible based on an active `coach_clients` row for the current user (not the `isCoach` check)
- Badge count updates on every foreground resume, not gated by the 30-second sync threshold
- Used direct store imports (`workoutStore`, `remindersStore`) in App.tsx for `.getState()` calls to avoid barrel circular dependency issues
- Removed `badge: 1` from the APNs payload entirely so badge count is exclusively managed by the client-side badge module

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed .catch() from Supabase PromiseLike chain**
- **Found during:** Task 1 (Settings notification UI)
- **Issue:** Plan specified `.catch(() => {})` on Supabase query, but Supabase client returns `PromiseLike` (not `Promise`) which doesn't have `.catch()` method
- **Fix:** Removed the `.catch()` call since Supabase queries don't throw on errors (they return `{ error }` in the result)
- **Files modified:** src/screens/Settings.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 9a8b73df (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor type compatibility fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 15 (Local Notifications & Engagement) is now complete
- All 6 notification types configurable from Settings with immediate reschedule
- Local notification tap navigation routes to correct screens
- Badge count accurately reflects pending actions on every app resume
- Ready for production testing on native iOS device

## Self-Check: PASSED

All files verified present, all commit hashes found in git log.

---
*Phase: 15-local-notifications-engagement*
*Completed: 2026-02-22*
