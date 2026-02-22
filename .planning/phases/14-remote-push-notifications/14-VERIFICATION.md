---
phase: 14-remote-push-notifications
verified: 2026-02-22T23:00:44Z
status: passed
score: 12/12 must-haves verified
re_verification: false
human_verification:
  - test: "Push notification permission dialog appears after first sync (not on cold launch)"
    expected: "iOS system dialog shows ~2 seconds after sync completes on native device, not immediately on launch"
    why_human: "Cannot verify timing/UX behavior programmatically"
  - test: "Coach assigns workout via Coach dashboard, client receives locked-screen push notification"
    expected: "Within seconds of assignment, client's iPhone shows 'New Workout Assigned' banner"
    why_human: "Requires Apple Developer .p8 key, Supabase secrets, deployed Edge Function, and database webhooks — all user setup items not yet configured"
  - test: "Tapping notification while app is terminated opens app to correct screen"
    expected: "Tapping workout notification opens /workouts, macros notification opens /macros, check-in notification opens /"
    why_human: "Requires a physical device, APNs credentials, and a real notification delivery to test cold-start routing"
  - test: "Foreground notification banner appears natively when app is open"
    expected: "iOS banner (not a JS toast) appears when push arrives while app is in foreground"
    why_human: "Requires live APNs delivery on device; presentationOptions config correct but behavior cannot be verified statically"
---

# Phase 14: Remote Push Notifications Verification Report

**Phase Goal:** Clients receive real-time push notifications when the coach takes actions (assigns workout, updates macros, responds to check-in), delivered via direct APNs from Supabase
**Verified:** 2026-02-22T23:00:44Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | APNs device token is stored in Supabase device_tokens table after push registration | VERIFIED | `storeDeviceToken()` in push.ts upserts to `device_tokens` via `supabase.from('device_tokens').upsert()` with `onConflict: 'user_id,platform'` (line 86-93) |
| 2 | AppDelegate forwards push registration callbacks to Capacitor plugin | VERIFIED | Both `didRegisterForRemoteNotificationsWithDeviceToken` and `didFailToRegisterForRemoteNotificationsWithError` methods present in AppDelegate.swift (lines 49-59), posting to `capacitorDidRegisterForRemoteNotifications` and `capacitorDidFailToRegisterForRemoteNotifications` |
| 3 | Push Notifications capability and aps-environment entitlement exist in Xcode project | VERIFIED | App.entitlements contains `<key>aps-environment</key><string>development</string>` (line 9-10) |
| 4 | Device token is deleted from Supabase when user signs out | VERIFIED | authStore.ts imports `removeDeviceToken` (line 7), calls it before `supabase.auth.signOut()` (lines 155-160), wrapped in try/catch so sign-out never fails |
| 5 | PushNotifications plugin is configured with presentationOptions in capacitor.config.ts | VERIFIED | `PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] }` in capacitor.config.ts (lines 25-27) |
| 6 | Edge Function generates valid ES256 JWT for APNs authentication using .p8 key from secrets | VERIFIED | `apns.ts` uses `importPKCS8` + `SignJWT` from jose@5, reads `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_P8_KEY` from Deno.env (lines 15-18), handles `\\n` literal newline replacement |
| 7 | Edge Function sends push to APNs HTTP/2 endpoint with correct headers | VERIFIED | `sendAPNs()` POSTs to `api.push.apple.com/3/device/{token}` with `apns-topic`, `apns-push-type: alert`, `apns-priority: 10`, `apns-expiration: 0` (lines 40-58) |
| 8 | Edge Function correctly maps webhook table to client user ID | VERIFIED | `assigned_workouts` uses `record.client_id`, `macro_targets` uses `record.user_id`, `weekly_checkins` uses `record.client_id` (send-push/index.ts lines 26-53) |
| 9 | Edge Function filters out non-coach actions | VERIFIED | macros check `record.set_by !== 'coach'` returns null (line 36), check-ins check `!record.coach_response || old_record?.coach_response` returns null (line 46) |
| 10 | JWT is cached for 50 minutes to avoid TooManyProviderTokenUpdates (429) from APNs | VERIFIED | Module-level `cachedJWT` variable with `expiresAt: Date.now() + 50 * 60 * 1000` (line 28 in apns.ts) |
| 11 | Push listeners are initialized when authenticated user loads the app on native | VERIFIED | App.tsx useEffect calls `initPushListeners(user.id)` on user change (lines 63-66); `initPushListeners` has `isNative()` guard internally |
| 12 | Push permission is requested at a contextual moment, not on first launch | VERIFIED | Zustand subscribe waits for `!state.isSyncing && state.user` then requests permission with 2000ms delay; `useRef` guard prevents repeats (App.tsx lines 68-97) |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/push.ts` | Push registration, permission, listeners, token storage/removal | VERIFIED | 107 lines. Exports `requestPushPermission`, `initPushListeners`, `removeDeviceToken`. Internal `storeDeviceToken`. All functions have `isNative()` guards. |
| `supabase/migrations/011_device_tokens.sql` | device_tokens table with RLS and unique constraint | VERIFIED | CREATE TABLE with UNIQUE(user_id, platform), RLS enabled, policy for user-owned rows, index on user_id |
| `ios/App/App/AppDelegate.swift` | Push registration delegate methods forwarding to Capacitor | VERIFIED | Both APNs delegate methods present at lines 49-59, forwarding to NotificationCenter with capacitor notification names |
| `ios/App/App/App.entitlements` | Push Notifications APS environment entitlement | VERIFIED | `aps-environment: development` present at lines 9-10 |
| `supabase/functions/_shared/apns.ts` | APNs JWT generation and HTTP/2 push delivery | VERIFIED | 62 lines. Exports `sendAPNs`. ES256 JWT via jose@5, 50-min module-level cache, correct APNs headers, route data at top level of payload |
| `supabase/functions/send-push/index.ts` | Webhook handler for coach actions that sends push notifications | VERIFIED | 113 lines. `Deno.serve` handler, 3-table routing, coach-action filtering, admin client for cross-user device token reads, APNs delivery with success counting |
| `src/App.tsx` | Push listener initialization on auth + native, contextual permission request | VERIFIED | `initPushListeners` and `requestPushPermission` both imported (line 9) and called in separate useEffects (lines 62-97). `pushPermissionRequested` useRef guard present (line 50) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/push.ts` | supabase device_tokens table | `supabase.from('device_tokens').upsert()` | WIRED | Line 86 in push.ts: `supabase.from('device_tokens').upsert(...)` with conflict resolution |
| `src/stores/authStore.ts` | `src/lib/push.ts` | `removeDeviceToken()` call in signOut | WIRED | Import at line 7, call at line 157, before `supabase.auth.signOut()` at line 162 |
| `ios/App/App/AppDelegate.swift` | `@capacitor/push-notifications` plugin | `NotificationCenter.default.post capacitorDidRegisterForRemoteNotifications` | WIRED | Lines 51-52 in AppDelegate.swift |
| `supabase/functions/send-push/index.ts` | `supabase/functions/_shared/apns.ts` | `import { sendAPNs }` | WIRED | Line 3: `import { sendAPNs } from '../_shared/apns.ts'`, called at line 94 |
| `supabase/functions/send-push/index.ts` | device_tokens table | `admin.from('device_tokens').select()` | WIRED | Lines 81-84: admin client queries device_tokens filtered by clientId |
| `supabase/functions/_shared/apns.ts` | APNs HTTP/2 API | `fetch to api.push.apple.com` | WIRED | Line 40: `fetch(\`${apnsHost}/3/device/${deviceToken}\`, ...)` with both PROD and DEV endpoints defined |
| `src/App.tsx` | `src/lib/push.ts` | `initPushListeners(user.id)` in useEffect | WIRED | Line 9 import, line 65 call |
| `src/App.tsx` | `src/lib/push.ts` | `requestPushPermission()` in contextual useEffect | WIRED | Line 9 import, line 82 and 91 calls |
| Push notification tap | App route | `window.location.href = data.route` in `pushNotificationActionPerformed` | WIRED | push.ts lines 51-56; routes `/workouts`, `/macros`, `/` all exist in App.tsx |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| PUSH-01: App registers for push notifications, stores APNs token in Supabase | SATISFIED | `requestPushPermission` + `initPushListeners` + `storeDeviceToken` chain in push.ts; device_tokens migration exists |
| PUSH-02: Client receives push when coach assigns workout | SATISFIED (code) | send-push handles `assigned_workouts` INSERT webhook; needs APNs credentials + webhook config to test live |
| PUSH-03: Client receives push when coach updates macro targets | SATISFIED (code) | send-push handles `macro_targets` UPDATE with `set_by === 'coach'` filter |
| PUSH-04: Client receives push when coach responds to check-in | SATISFIED (code) | send-push handles `weekly_checkins` UPDATE with `coach_response` null-to-truthy filter |
| PUSH-05: App requests push permission at contextual moment, not on first launch | SATISFIED | Zustand subscribe waits for sync completion + 2s delay; useRef guard prevents repeats |
| PUSH-06: Push via direct APNs HTTP/2 from Supabase Edge Function, no Firebase | SATISFIED | apns.ts uses Deno fetch to `api.push.apple.com`, jose@5 for ES256 JWT; no Firebase anywhere in codebase |
| DEEP-02: Tapping push notification navigates to relevant screen | SATISFIED (code) | `pushNotificationActionPerformed` listener reads `action.notification.data.route` and sets `window.location.href`; routes match App.tsx routing |

### Anti-Patterns Found

No anti-patterns found. No TODOs, placeholders, empty implementations, or stub functions detected in any phase 14 files.

### Human Verification Required

The code infrastructure is complete and verified. The following items require live device testing with Apple Developer credentials, which are documented as pre-TestFlight user setup tasks:

**1. Contextual Permission Timing**
**Test:** Log into the app on a native iOS device. Observe whether the iOS push permission dialog appears after a short delay post-login, not immediately on launch.
**Expected:** System dialog appears approximately 2 seconds after the first sync completes.
**Why human:** UX timing and dialog appearance cannot be verified statically.

**2. End-to-End Push Delivery (requires pre-TestFlight setup)**
**Test:** With APNs credentials configured (APNS_P8_KEY, APNS_KEY_ID, APNS_TEAM_ID in Supabase secrets), send-push deployed, and database webhooks configured — have the coach assign a workout via the dashboard.
**Expected:** Client's iPhone receives a locked-screen push notification within seconds.
**Why human:** Requires Apple Developer account, Supabase secret configuration, webhook setup, and production migration.

**3. Terminated-State Deep Link Navigation**
**Test:** Force-quit the app. Tap a push notification from the lock screen.
**Expected:** App opens and navigates directly to the route specified in the notification data (e.g., /workouts for workout assignment).
**Why human:** Cold-start behavior with `window.location.href` routing requires a physical device test.

**4. Foreground Notification Banner**
**Test:** Keep the app open in the foreground. Trigger a coach action that sends a push.
**Expected:** iOS native banner notification appears (not a JS toast), with sound and badge update.
**Why human:** `presentationOptions: ['badge', 'sound', 'alert']` config is verified correct, but foreground rendering requires live delivery.

### Gaps Summary

No gaps. All 12 observable truths are verified, all 7 artifacts exist and are substantive, all 9 key links are wired. TypeScript compilation passes with zero errors (`npx tsc --noEmit`). All 5 documented commits (fd94fd56, 34bdb6ed, 2fc74a6c, 0210bfa8, 2d17a34a) exist in git history.

The phase goal is achieved at the code infrastructure level. The remaining items are operational prerequisites documented in plan 14-03 frontmatter: Apple Developer .p8 key creation, Supabase secrets, 3 database webhooks, production migration application, and Edge Function deployment. These are intentionally deferred to pre-TestFlight setup.

---

_Verified: 2026-02-22T23:00:44Z_
_Verifier: Claude (gsd-verifier)_
