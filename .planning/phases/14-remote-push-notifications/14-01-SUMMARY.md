---
phase: 14-remote-push-notifications
plan: 01
subsystem: infra
tags: [capacitor, push-notifications, apns, ios, supabase, device-tokens]

# Dependency graph
requires:
  - phase: 11-capacitor-shell
    provides: Capacitor native shell with iOS project structure
  - phase: 13-deep-linking
    provides: AppDelegate with Universal Links delegate methods
provides:
  - "@capacitor/push-notifications plugin installed and synced"
  - "src/lib/push.ts module with requestPushPermission, initPushListeners, removeDeviceToken"
  - "device_tokens Supabase migration with RLS and unique constraint"
  - "iOS AppDelegate push delegate methods forwarding to Capacitor"
  - "aps-environment entitlement in App.entitlements"
  - "Token cleanup wired into authStore signOut"
affects: [14-02 (Edge Function needs device_tokens table), 14-03 (App.tsx wires push listeners)]

# Tech tracking
tech-stack:
  added: ["@capacitor/push-notifications@7.0.5"]
  patterns: ["APNs token upsert with onConflict for idempotent registration", "Non-blocking token cleanup on sign-out"]

key-files:
  created:
    - src/lib/push.ts
    - supabase/migrations/011_device_tokens.sql
  modified:
    - capacitor.config.ts
    - ios/App/App/AppDelegate.swift
    - ios/App/App/App.entitlements
    - src/stores/authStore.ts
    - src/lib/database.types.ts
    - package.json

key-decisions:
  - "@capacitor/push-notifications@7.0.5 (not 8.x) to match Capacitor 7.5.x peer dependency"
  - "device_tokens table types added manually to database.types.ts (migration not applied to running DB)"

patterns-established:
  - "Push module pattern: isNative() guard on all exports, Sentry capture on errors, non-blocking cleanup"
  - "Device token upsert with onConflict: 'user_id,platform' for idempotent registration"

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 14 Plan 01: Push Infrastructure Summary

**Capacitor push plugin with APNs delegate forwarding, push.ts registration/listener/cleanup module, device_tokens migration with RLS, and signOut token cleanup**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-22T20:59:37Z
- **Completed:** 2026-02-22T21:06:06Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Installed @capacitor/push-notifications@7.0.5 with iOS pod sync
- Created push.ts module with full APNs lifecycle: permission request, token storage, listener init, deep link routing on tap, token removal
- Added device_tokens table migration with RLS policies and user_id index
- Wired token cleanup into authStore.signOut (before session clear for auth context)
- Configured iOS entitlements and AppDelegate for APNs registration forwarding

## Task Commits

Each task was committed atomically:

1. **Task 1: Install plugin, configure iOS project, and create device_tokens migration** - `fd94fd56` (feat)
2. **Task 2: Create push.ts module and wire token cleanup into signOut** - `34bdb6ed` (feat)

## Files Created/Modified
- `src/lib/push.ts` - Push registration, permission, listeners, token storage/removal
- `supabase/migrations/011_device_tokens.sql` - device_tokens table with RLS and unique constraint
- `capacitor.config.ts` - PushNotifications presentationOptions for foreground display
- `ios/App/App/AppDelegate.swift` - APNs delegate methods forwarding to Capacitor
- `ios/App/App/App.entitlements` - aps-environment entitlement for push
- `src/stores/authStore.ts` - removeDeviceToken call in signOut
- `src/lib/database.types.ts` - device_tokens table type definitions
- `package.json` - @capacitor/push-notifications dependency

## Decisions Made
- Used @capacitor/push-notifications@7.0.5 instead of 8.x because Capacitor core is 7.5.x (peer dep conflict)
- Added device_tokens types manually to database.types.ts since migration hasn't been applied and `supabase gen types` can't run

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plugin version downgrade from 8.x to 7.x**
- **Found during:** Task 1 (Install plugin)
- **Issue:** Latest @capacitor/push-notifications@8.0.1 requires @capacitor/core >= 8.0.0, but project uses 7.5.x
- **Fix:** Installed @7.0.5 which is compatible with Capacitor 7.5.x peer dependency
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm ls @capacitor/push-notifications` shows 7.0.5 installed cleanly
- **Committed in:** fd94fd56 (Task 1 commit)

**2. [Rule 3 - Blocking] Added device_tokens to database.types.ts**
- **Found during:** Task 2 (TypeScript type check)
- **Issue:** `supabase.from('device_tokens')` failed type check -- table not in Database type definitions
- **Fix:** Added device_tokens Row/Insert/Update types to database.types.ts matching migration schema
- **Files modified:** src/lib/database.types.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 34bdb6ed (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for compatibility and type safety. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required. Migration 011 will need to be applied to production Supabase before push notifications can work end-to-end.

## Next Phase Readiness
- Push infrastructure complete, ready for plan 14-02 (Edge Function for sending push notifications)
- Plan 14-03 will wire initPushListeners and requestPushPermission into App.tsx
- Migration 011_device_tokens.sql needs production application before live testing

## Self-Check: PASSED

All 7 created/modified files verified present. Both task commits (fd94fd56, 34bdb6ed) verified in git history.

---
*Phase: 14-remote-push-notifications*
*Completed: 2026-02-22*
