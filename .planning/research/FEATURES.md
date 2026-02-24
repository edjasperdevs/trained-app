# Feature Landscape: Capacitor iOS Native App

**Domain:** Native iOS wrapper for existing fitness gamification PWA with push notifications
**Researched:** 2026-02-21
**Overall confidence:** HIGH (Capacitor docs, Apple guidelines, codebase analysis, competitive research)

---

## Existing State (Already Built)

Before detailing new features, here is what already exists and must be preserved or adapted during the native wrapping process.

| Existing Feature | Location | Native Adaptation Needed |
|-----------------|----------|--------------------------|
| PWA with service worker (Workbox) | `vite.config.ts` VitePWA plugin | Must be **disabled** for native builds. Capacitor bundles assets locally; service workers conflict with WKWebView on iOS. |
| In-app reminder banners | `src/stores/remindersStore.ts`, `src/components/ReminderCard.tsx` | Keep as-is for in-app state. Push notifications **supplement** these, not replace. |
| navigator.vibrate haptics | `src/lib/haptics.ts` | Replace with `@capacitor/haptics` for real iOS Taptic Engine feedback. Current implementation is a no-op on iOS Safari. |
| Blob/FileReader export/import | Various screens | Replace with `@capacitor/share` for native iOS share sheet. |
| Offline-first Zustand + localStorage | All stores | Keep as-is. Capacitor bundles the web app locally, so offline works by default for the app shell. Supabase sync remains the same. |
| Supabase auth (email/password) | `src/stores/authStore.ts` | Works in WKWebView. No changes needed. |
| Plausible analytics (22 events) | `src/lib/analytics.ts` | Works in WKWebView. May need to add native app tracking context. |
| Sentry error monitoring | `src/lib/sentry.ts` | Works in WKWebView. Should add Capacitor platform tags for debugging. |
| coach_clients + RLS | `src/lib/sync.ts` pullCoachData | Push notification triggers will fire from coach actions on these tables. |
| Weekly check-in system | `src/screens/WeeklyCheckIn.tsx`, `src/hooks/useWeeklyCheckins.ts` | Coach response to check-in should trigger push notification to client. |
| Assigned workouts | `src/lib/sync.ts` pullCoachData, assigned_workouts table | New workout assignment should trigger push notification to client. |
| Macro targets (set_by: coach) | `src/stores/macroStore.ts` setCoachTargets | Coach macro update should trigger push notification to client. |

**Key observation:** The app is feature-rich with a working offline-first architecture. The native wrapping is not about rebuilding features -- it is about adding iOS-native capabilities (push notifications, real haptics, native share, App Store presence) and satisfying Apple's review requirements for a non-trivial native app.

---

## Table Stakes

Features users expect in a native iOS fitness app. Missing = App Store rejection or user confusion.

### 1. Push Notifications -- Coach Action Triggers

**Why expected:** This is the primary reason for going native. iOS has no reliable web push for PWAs (Safari Web Push requires explicit setup and user opt-in per visit). Native push via APNs is the standard and expected channel for fitness coaching apps. Every competitor (TrueCoach, Hevy Coach, Everfit, Trainerize) has native push.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| APNs device token registration | App registers with Apple Push Notification service on launch, stores token per user in Supabase | Medium | Requires Apple Developer Account, APNs key (.p8), Capacitor Push Notifications plugin, `device_tokens` table in Supabase. |
| Coach assigns workout notification | Client receives push when coach assigns a new workout | Low | Database webhook on `assigned_workouts` INSERT triggers Supabase Edge Function to send push via APNs. |
| Coach updates macros notification | Client receives push when coach changes their macro targets | Low | Database webhook on `macro_targets` UPDATE (where set_by = 'coach') triggers Edge Function. |
| Coach responds to check-in notification | Client receives push when coach writes a check-in response | Low | Database webhook on `weekly_checkins` UPDATE (where coach_response IS NOT NULL) triggers Edge Function. |
| New client invitation notification | Client receives push when invited by coach (if they already have the app) | Low | Edge Function on `coach_clients` INSERT with status = 'pending'. |
| Permission request with context | Ask for push permission after demonstrating value, not on first launch | Low | Show permission prompt after first coach action or during onboarding ("Enable notifications to know when your coach updates your plan"). iOS median opt-in is 51% -- earning the ask matters. |

**Architecture for push delivery:**

```
Coach Action (web/app)
  --> Supabase table mutation (INSERT/UPDATE)
    --> Database Webhook fires
      --> Supabase Edge Function (send-push)
        --> APNs (via Firebase Cloud Messaging or direct APNs HTTP/2)
          --> iOS device notification
            --> User taps notification
              --> Deep link to relevant screen
```

**Critical design decision: FCM vs Direct APNs:**

Use **direct APNs HTTP/2** for push delivery, not Firebase Cloud Messaging. Reasons:
1. iOS-only app -- FCM adds unnecessary dependency for a single platform
2. Direct APNs avoids Firebase SDK (reduces bundle size, no GoogleService-Info.plist)
3. Capacitor's `@capacitor/push-notifications` supports direct APNs on iOS -- returns the native APNs token (not FCM token) when Firebase is not configured
4. Supabase Edge Functions can speak APNs HTTP/2 directly using the .p8 key for JWT signing
5. FCM only becomes valuable if Android is added later (separate milestone per Anti-Features)
6. Fewer moving parts = easier to debug token registration issues

**Confidence:** HIGH (universal pattern; Capacitor docs explicitly support this; Supabase has Edge Function examples)

---

### 2. Push Notifications -- Local Scheduled Reminders

**Why expected:** The app already has in-app reminder banners (check-in, workout, macros, XP claim) via `remindersStore.ts`. These only work when the app is open. Users expect OS-level reminders that appear in Notification Center even when the app is closed. This is the single most impactful engagement mechanism for fitness apps.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Daily check-in reminder | Scheduled local notification at user-configured time (e.g., 8 PM) reminding them to complete their daily check-in | Low | Uses `@capacitor/local-notifications`. Schedule repeating daily notification. Critical for streak maintenance. |
| Workout reminder | Scheduled notification on training days at configured time | Medium | Needs to know which days are training days from `workoutStore.selectedDays`. Schedule per-day recurring notifications. |
| Macro logging reminder | Evening reminder to log macros if not yet logged today | Medium | Needs to check state before firing. Can use local notification with `at` scheduling; app checks on resume whether macros are logged. |
| Weekly XP claim reminder | Sunday notification reminding user to claim weekly XP | Low | Schedule weekly repeating on Sunday. |
| User-configurable timing | Settings screen to set notification times and toggle each type | Low | Map to existing `remindersStore.preferences` structure. Add `notificationTime` per type. |
| Weekly check-in submission reminder | Reminder to submit weekly coaching check-in (e.g., Saturday morning) | Low | Schedule weekly repeating. |

**Integration with existing reminders system:**

The existing `remindersStore.ts` already has the logic for determining when each reminder type should show (`shouldShowCheckInReminder`, `shouldShowWorkoutReminder`, etc.). The local notification system should mirror these types but fire at the OS level. The in-app banners remain for when the user is already in the app.

**Confidence:** HIGH (standard pattern; `@capacitor/local-notifications` is a core Capacitor plugin)

---

### 3. Native Haptics (Replacing navigator.vibrate)

**Why expected:** The app already uses haptics extensively for key moments (set completion, workout finish, XP claim, achievement unlock). Currently `navigator.vibrate()` which has 0% support on iOS Safari. Going native means real Taptic Engine feedback via `@capacitor/haptics`.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Replace haptics.ts with Capacitor Haptics | Swap `navigator.vibrate` calls to `Haptics.impact()`, `Haptics.notification()`, etc. | Low | Drop-in replacement. 5 call sites in codebase (XPClaimModal, Home, Workouts, plus any new screens). |
| Platform-aware haptics module | Detect Capacitor native vs web and use appropriate API | Low | `Capacitor.isNativePlatform()` check. Fall back to `navigator.vibrate` on web, use native Haptics API on iOS. |

**Existing mapping from `src/lib/haptics.ts`:**

```
Current (web, no-op on iOS)          --> Native Capacitor equivalent
haptics.light()  [vibrate(10)]       --> Haptics.impact({ style: ImpactStyle.Light })
haptics.medium() [vibrate(25)]       --> Haptics.impact({ style: ImpactStyle.Medium })
haptics.success()[vibrate([15,50,30])]--> Haptics.notification({ type: NotificationType.Success })
haptics.heavy()  [vibrate(50)]       --> Haptics.impact({ style: ImpactStyle.Heavy })
haptics.error()  [vibrate([50,30,50])]--> Haptics.notification({ type: NotificationType.Error })
```

**Confidence:** HIGH (`@capacitor/haptics` is a core plugin, API mapping is straightforward)

---

### 4. Native Splash Screen and App Icon

**Why expected:** Every iOS app has a launch screen (Apple requires it) and an app icon. The PWA already has icons (192x192, 512x512) but iOS native requires specific sizes and a storyboard-based launch screen.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| iOS app icon (all sizes) | Generate required icon sizes for iOS (20pt through 1024pt, @2x and @3x) | Low | Use `@capacitor/assets` CLI or manual export from existing icon. Needed: 1024x1024 source icon. |
| Launch screen (splash) | Native iOS launch screen storyboard with app branding | Low | Capacitor uses `@capacitor/splash-screen` plugin. Configure background color (#0a0a0a to match theme), centered logo, auto-hide after app loads. |
| Status bar configuration | Match dark theme -- light text on dark background | Low | `@capacitor/status-bar` plugin. Set `style: Style.Dark` and `backgroundColor: '#0a0a0a'`. |

**Confidence:** HIGH (standard Capacitor setup; well-documented)

---

### 5. Native Share (Replacing Blob/FileReader Export)

**Why expected:** The app has data export functionality. On iOS native, users expect the standard iOS share sheet (UIActivityViewController) instead of browser-style file downloads.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Share via native share sheet | Replace file download with `@capacitor/share` to invoke iOS share sheet for data export | Low | `Share.share({ title, text, url, files })`. Users can share to Messages, Mail, Files, etc. Native feel. |
| Platform-aware sharing | Detect native vs web and use appropriate API | Low | `Capacitor.isNativePlatform()` -> use Share plugin; web -> use existing Blob/download approach. |

**Confidence:** HIGH (`@capacitor/share` is a core plugin)

---

### 6. Disable Service Worker for Native Build

**Why expected:** WKWebView on iOS does not properly support service workers. The app uses `vite-plugin-pwa` with Workbox which registers a service worker for offline caching. In a Capacitor native build, assets are bundled locally -- the service worker is redundant and causes WKWebView registration failures and console errors.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Conditional VitePWA disable | Detect native build target and set `VitePWA({ disabled: true })` | Low | Environment variable (e.g., `VITE_CAPACITOR=true`) or build script flag. Single change in `vite.config.ts`. |
| Dual build pipeline | Maintain separate web (with PWA) and native (without PWA) build commands | Low | `"build:web": "vite build"` and `"build:native": "VITE_CAPACITOR=true vite build && npx cap sync"` in package.json. |

**Confidence:** HIGH (documented Capacitor recommendation; service workers + WKWebView is a known conflict)

---

### 7. Offline Error Handling (Non-Browser)

**Why expected:** Without the service worker handling offline, the app needs its own network status management for the native context. Browser-style "You are offline" error pages would immediately flag the app as a web wrapper to Apple reviewers.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Native network status detection | Use `@capacitor/network` instead of `navigator.onLine` | Low | Already have `useSyncStore` with `isOnline` state. Wire native network detection to it. |
| Graceful offline states | All screens handle offline gracefully with proper messaging | Already built | `SyncStatusIndicator` already shows sync state. Existing offline-first architecture means app functions fully offline. |

**Confidence:** HIGH (app is already offline-first; just need native network detection wiring)

---

### 8. Deep Linking (Universal Links)

**Why expected:** Push notifications need to open specific screens. Coach sends workout notification -- tapping it should open the Workouts screen, not just the app root. Also needed for invitation links.

| Sub-feature | What It Does | Complexity | Notes |
|-------------|-------------|------------|-------|
| Universal Links setup | Associate welltrained.fitness domain with iOS app via Apple App Site Association file | Medium | Requires: AASA file hosted at `.well-known/apple-app-site-association` on welltrained.fitness, Associated Domains capability in Xcode, route parsing in app. |
| Notification deep links | Push notifications include deep link URL that opens the correct screen | Low | Include `data: { route: '/workouts' }` in push payload. Handle `pushNotificationActionPerformed` event to navigate via react-router. |
| Invitation link handling | Invitation links (from coach) open the app if installed or the website if not | Medium | Universal link to `/invite/:code` opens the app's AccessGate with pre-filled code. Falls back to web if app not installed. |

**Confidence:** MEDIUM (standard Capacitor pattern, but AASA file hosting and domain verification add complexity)

---

### 9. App Store Submission Requirements

**Why expected:** Without meeting these, the app will be rejected. These are not features per se, but required compliance items.

| Requirement | What It Means | Complexity | Notes |
|-------------|--------------|------------|-------|
| Apple Developer Account ($99/year) | Required for App Store distribution, APNs certificates, and provisioning profiles | N/A | One-time setup. Must be an individual or organization account. |
| Privacy Policy URL | Must be accessible from within the app and listed in App Store Connect | Low | Already have app at welltrained.fitness -- add /privacy route or page. |
| Privacy Nutrition Labels | Declare all data collection in App Store Connect (health/fitness data, usage data, identifiers) | Medium | Must accurately declare: email (account), weight/body data (health), workout logs (fitness), usage analytics (Plausible), crash data (Sentry). Inaccurate labels = rejection. |
| Account Deletion | If the app has account creation (it does via Supabase Auth), must provide in-app account deletion | Medium | Apple Guideline 5.1.1(v). Requires "Delete Account" in Settings, Supabase Admin API call to delete user data + auth record. |
| iOS 18 SDK minimum | Apps must be built with Xcode 16+ / iOS 18 SDK (current requirement); iOS 26 SDK required by April 28, 2026 | N/A | Use latest Xcode. Capacitor 7+ supports this. |
| Non-trivial native functionality | App must not be a "web clipping" -- needs native features beyond just WKWebView | Addressed | Push notifications + haptics + native share + splash screen + deep linking collectively satisfy Guideline 4.2. |
| App Review Information | Test account credentials, demo instructions for Apple reviewer | Low | Provide a test account with coach-assigned workout + macros so reviewer can see full functionality. |
| Export Compliance (HTTPS) | Declare whether the app uses encryption | Low | Standard HTTPS declaration. Supabase uses TLS. Standard exemption applies. |

**Confidence:** HIGH (Apple's guidelines are explicit; multiple verified sources)

---

## Differentiators

Features that set the app apart from a basic Capacitor wrapper. Not required for launch but add meaningful value.

### 1. Streak-Saving Notifications

**Value proposition:** The app's streak system is a core engagement mechanic with grace periods. A "You haven't checked in today -- your 47-day streak is at risk!" notification at 9 PM could be the most retention-impactful notification in the entire app. No competitor ties push notifications to gamification streaks this way.

| Feature | What It Does | Complexity | Notes |
|---------|-------------|------------|-------|
| Streak-at-risk evening alert | If user hasn't checked in by a configured time, send an urgent-style notification | Medium | Local notification that checks streak status. Could use `@capacitor/local-notifications` with daily scheduling, or a scheduled Edge Function that checks `profiles.last_check_in_date`. |
| Grace period expiry warning | "Your grace period expires tomorrow" notification | Low | Schedule based on streak state in local store. |
| Streak milestone celebration | "Congratulations! 30-day streak achieved!" push notification | Low | Triggered locally when streak crosses milestone thresholds (7, 14, 30, 60, 90, 180, 365 days). |

**Confidence:** MEDIUM (unique to Trained's gamification model; no competitive validation but logically high-impact)

---

### 2. Badge/Achievement Unlock Notifications

**Value proposition:** Achievement unlocks already have in-app modal animations (`BadgeUnlockModal.tsx`). Adding a push notification means users who are not currently in the app still learn about unlocks, creating a pull-back-in moment.

| Feature | What It Does | Complexity | Notes |
|---------|-------------|------------|-------|
| Achievement unlock push | Fire a local notification when a new badge is earned | Low | Hook into `achievementsStore` badge unlock logic. Fire local notification with badge name and description. |
| Level-up notification | "You reached Level 12 -- Warrior!" notification | Low | Hook into XP store level-up detection. |

**Confidence:** MEDIUM (unique to Trained's gamification; natural extension of existing system)

---

### 3. Biometric App Lock

**Value proposition:** Users with sensitive body data (weight, macros, progress) may want Face ID/Touch ID lock. Adds a premium native feel and security credibility.

| Feature | What It Does | Complexity | Notes |
|---------|-------------|------------|-------|
| Face ID / Touch ID unlock | Require biometric authentication to open the app | Medium | Use `@aparajita/capacitor-biometric-auth` or `@capgo/capacitor-native-biometric`. Requires NSFaceIDUsageDescription in Info.plist. Optional feature in Settings. |
| Auto-lock timeout | Lock app after configurable inactivity period | Low | Timer-based, check on app resume. |

**Confidence:** MEDIUM (common in health/fitness apps; multiple Capacitor plugins available)

---

### 4. App Update Prompting (Native)

**Value proposition:** The PWA already has update prompting via `vite-plugin-pwa` registerType: 'prompt'. The native equivalent should check the App Store for updates and prompt users.

| Feature | What It Does | Complexity | Notes |
|---------|-------------|------------|-------|
| Check for App Store update | On launch, check if a newer version is available on the App Store | Low | `@capawesome/capacitor-app-update` plugin. `getAppUpdateInfo()` returns current vs available version. |
| Update prompt | Show dialog prompting user to go to App Store to update | Low | Unlike Android, iOS does not support in-app updates. Redirect to App Store page. |

**Confidence:** HIGH (well-documented Capacitor plugin; standard iOS pattern)

---

### 5. Coach Push Notification Dashboard (Coach-Side)

**Value proposition:** The coach can see which clients have notifications enabled and know their engagement-channel reach. Optionally, send targeted nudge messages.

| Feature | What It Does | Complexity | Notes |
|---------|-------------|------------|-------|
| Notification status per client | Coach sees which clients have push notifications enabled | Low | Query `device_tokens` table -- if client has a valid token, they have push enabled. Show indicator on client roster. |
| Manual coach nudge push | Coach can send a custom text notification to a specific client | Medium | Edge Function takes client_id + message, sends via APNs. Simple form in client detail view. Lightweight alternative to full messaging. |

**Confidence:** MEDIUM (not standard in competitors, but natural fit for single-coach model)

---

### 6. App Badge Count

**Value proposition:** App icon badge count (the red number bubble) signals to users that something needs their attention. Fitness apps commonly show pending check-ins or unreviewed coach actions.

| Feature | What It Does | Complexity | Notes |
|---------|-------------|------------|-------|
| Badge count on app icon | Show count of pending actions (uncompleted check-in, unread coach response) | Medium | Use `@capawesome/capacitor-badge` plugin. Set count from push notification payload or calculate locally on app resume. Clear when user addresses the item. |

**Confidence:** MEDIUM (standard iOS pattern; Capawesome plugin is well-maintained)

---

## Anti-Features

Things to deliberately NOT build. Common mistakes when wrapping a PWA as a native app.

### 1. Do NOT Build Android Support in This Milestone

**Why avoid:** iOS-only milestone. The 90k-follower fitness audience skews heavily iOS. Adding Android doubles the testing surface, introduces Google Play submission requirements, and complicates push notification infrastructure (FCM required for Android but not iOS). Keep scope tight.

**What to do instead:** Ship iOS first. If Android is needed, it is a separate future milestone. The Capacitor architecture makes this straightforward to add later.

---

### 2. Do NOT Build In-App Purchases or Subscriptions

**Why avoid:** Apple takes 30% commission on in-app purchases. The app uses Lemon Squeezy access codes for monetization -- this flow happens outside the app (web purchase, get code, enter in app). Adding IAP would require Apple's payment infrastructure, revenue sharing, and subscription management UI. The access code system specifically avoids this.

**What to do instead:** Continue using the existing access code flow. The user purchases access externally, enters their code in the AccessGate screen. This is a well-established pattern (Netflix, Kindle, Spotify for content purchased elsewhere).

**Risk note:** Apple has become more aggressive about IAP enforcement. Ensure the app does not contain ANY purchase links, "subscribe" buttons, or references to external pricing. The access code entry screen should be framed as "enter your code" not "don't have a code? buy one here."

---

### 3. Do NOT Build HealthKit Integration (V1)

**Why avoid:** HealthKit integration (syncing workouts, weight, calories to Apple Health) is a significant undertaking. It requires HealthKit entitlements, additional privacy disclosures, bidirectional sync logic, unit conversion, and careful handling of data conflicts. It also triggers heightened App Store review scrutiny. The app's data model (XP-based, gamified) does not map cleanly to HealthKit's activity model.

**What to do instead:** Defer to a future milestone. HealthKit adds credibility but is not required for the core coaching workflow. The app's own tracking is the source of truth.

---

### 4. Do NOT Build Widget Extensions (V1)

**Why avoid:** iOS widgets (Today View, Lock Screen, StandBy) require a separate App Extension target, SwiftUI code (not web), shared data container between app and extension, and ongoing maintenance for each iOS version's widget API changes. The complexity is high relative to the value.

**What to do instead:** Defer entirely. If users request it, the most impactful widget would be a simple streak counter or "next workout" display. But this is a full native Swift development effort.

---

### 5. Do NOT Rebuild Navigation as a Native Tab Bar

**Why avoid:** Some guides recommend using a native iOS tab bar (UITabBarController) to avoid Apple's Guideline 4.2 rejection. This is unnecessary for Capacitor apps with well-designed web-based navigation. The existing bottom tab navigation in `Navigation.tsx` already looks and behaves like a native tab bar. Adding a native tab bar would create two navigation systems and break code sharing.

**What to do instead:** Keep the existing web-based bottom navigation. It already satisfies Apple's "app-like experience" requirement. The combination of push notifications + haptics + native share + splash screen + deep linking provides more than enough native functionality to pass Guideline 4.2.

---

### 6. Do NOT Use Firebase SDK

**Why avoid:** For an iOS-only app, the Firebase SDK (GoogleService-Info.plist, Firebase iOS SDK pods) adds unnecessary complexity, bundle size, and a third-party dependency. The `@capacitor/push-notifications` plugin returns native APNs tokens on iOS when Firebase is not configured. Supabase Edge Functions can send directly to APNs using HTTP/2 and a .p8 authentication key.

**What to do instead:** Use direct APNs integration. The Supabase Edge Function handles JWT signing with the .p8 key and sends directly to the APNs HTTP/2 endpoint. This eliminates an entire service dependency.

---

### 7. Do NOT Replace localStorage with Native SQLite

**Why avoid:** Capacitor's WKWebView has the same localStorage limits as Safari (~5-10 MB). The app's current data (profiles, workout logs, macro logs, XP) fits well within these limits. Replacing localStorage with SQLite or Capacitor Preferences would require rewriting every Zustand persist store, is a massive refactor for no immediate benefit, and introduces native storage APIs that differ between platforms.

**What to do instead:** Keep `zustand/persist` with localStorage. Monitor storage usage. If limits become a problem (unlikely for the current data model), address it then.

---

## Feature Dependencies

```
[Prerequisite] Apple Developer Account + Provisioning
    |
    +--> [Table Stakes] Capacitor project init + iOS platform setup
            |
            +--> [Table Stakes] Disable service worker for native build
            |       |
            |       +--> Conditional VitePWA config in vite.config.ts
            |       +--> Dual build pipeline (web + native)
            |
            +--> [Table Stakes] Native splash screen + app icons + status bar
            |
            +--> [Table Stakes] Native haptics replacement
            |       |
            |       +--> Platform-aware haptics.ts module
            |
            +--> [Table Stakes] Native share replacement
            |       |
            |       +--> Platform-aware share module
            |
            +--> [Table Stakes] Native network detection
            |       |
            |       +--> Wire @capacitor/network to syncStore.isOnline
            |
            +--> [Table Stakes] Push notification infrastructure
            |       |
            |       +--> APNs key (.p8) from Apple Developer Account
            |       |       |
            |       |       +--> device_tokens table in Supabase
            |       |       |
            |       |       +--> Token registration on app launch
            |       |
            |       +--> Supabase Edge Function (send-push)
            |       |       |
            |       |       +--> Database webhooks on coach action tables
            |       |       |       |
            |       |       |       +--> assigned_workouts INSERT
            |       |       |       +--> macro_targets UPDATE (set_by='coach')
            |       |       |       +--> weekly_checkins UPDATE (coach_response)
            |       |       |
            |       |       +--> APNs HTTP/2 direct integration
            |       |
            |       +--> Local notifications (scheduled reminders)
            |       |       |
            |       |       +--> Mirror existing remindersStore types
            |       |       |
            |       |       +--> Notification time preferences UI in Settings
            |       |
            |       +--> Deep linking (notification tap -> screen)
            |               |
            |               +--> AASA file on welltrained.fitness
            |               |
            |               +--> Route handling in pushNotificationActionPerformed
            |               |
            |               +--> Invitation link deep linking
            |
            +--> [Table Stakes] App Store compliance
            |       |
            |       +--> Privacy policy page
            |       |
            |       +--> Privacy nutrition labels in App Store Connect
            |       |
            |       +--> Account deletion feature in Settings
            |       |
            |       +--> App Store listing (screenshots, description, keywords)
            |       |
            |       +--> TestFlight beta distribution
            |
            +--> [Differentiator] Streak-saving notifications
            |
            +--> [Differentiator] Badge/level-up notifications
            |
            +--> [Differentiator] App badge count
            |
            +--> [Differentiator] Biometric app lock
            |
            +--> [Differentiator] App update prompting
```

**Key dependency chains:**

1. **Apple Developer Account is prerequisite for everything** -- needed for provisioning profiles, APNs key, and App Store submission
2. **Capacitor init must come before any native plugin integration** -- project structure, Xcode project, native dependencies
3. **Push notification infrastructure has 3 independent sub-tracks:** remote push (APNs), local notifications, and deep linking -- these can be developed in parallel
4. **Service worker disabling must happen before first native build** -- prevents WKWebView errors
5. **App Store compliance can be done in parallel** with notification work -- mostly content/config, not code
6. **Native haptics, share, and network detection are independent** -- small scoped changes, can be done in any order

---

## Notification Trigger Matrix

Comprehensive mapping of all notification types, their triggers, and delivery mechanism.

### Remote Push Notifications (Server-Triggered via APNs)

| Trigger Event | Who Receives | Message Template | Deep Link | Priority |
|--------------|-------------|------------------|-----------|----------|
| Coach assigns workout | Client | "Your coach assigned a new workout for {day}" | `/workouts` | High |
| Coach updates macros | Client | "Your coach updated your nutrition targets" | `/macros` | Medium |
| Coach responds to check-in | Client | "Your coach reviewed your weekly check-in" | `/checkin` | High |
| Coach invites client | Client (if app installed) | "You've been invited to join WellTrained" | `/` | Medium |
| Client submits check-in | Coach | "{name} submitted their weekly check-in" | `/coach` | Medium |
| Client goes inactive (3+ days) | Coach | "{name} hasn't been active for {n} days" | `/coach` | Low |

### Local Notifications (Device-Scheduled)

| Trigger | Timing | Message Template | Deep Link | Configurable |
|---------|--------|------------------|-----------|-------------|
| Daily check-in reminder | User-set time (default 8 PM) | "Time for your daily check-in. Keep your streak alive!" | `/` | Yes (time + on/off) |
| Workout reminder | Training days, user-set time (default 7 AM) | "Today is a training day. Time to get after it." | `/workouts` | Yes (time + on/off) |
| Macro logging reminder | Daily, user-set time (default 7 PM) | "Don't forget to log your nutrition today." | `/macros` | Yes (time + on/off) |
| Weekly XP claim | Sunday, user-set time (default 10 AM) | "Your weekly XP reward is ready to claim!" | `/` | Yes (time + on/off) |
| Weekly check-in submission | Saturday, user-set time (default 9 AM) | "Submit your weekly check-in for your coach." | `/checkin` | Yes (time + on/off) |
| Streak at risk (differentiator) | Daily at 9 PM, only if no check-in today | "Your {n}-day streak is at risk! Check in before midnight." | `/` | Yes (on/off) |

---

## App Store Review Strategy

Specific guidance for passing Apple's review with a Capacitor-wrapped web app.

### Guideline 4.2 (Minimum Functionality) Compliance

Apple rejects apps that are merely "websites wrapped in a WebView." The following native features collectively demonstrate the app is NOT a lazy wrapper:

| Native Feature | How It Satisfies 4.2 |
|---------------|---------------------|
| Push notifications (remote + local) | Uses APNs, which is a native-only capability |
| Native haptics (Taptic Engine) | Uses device hardware not accessible from the web |
| Native share sheet | UIActivityViewController, a native iOS API |
| Native splash screen + status bar | Standard native app feel |
| Deep linking (Universal Links) | OS-level integration for URL handling |
| Network detection | Native `@capacitor/network` over `navigator.onLine` |
| App badge count | Notification badge on app icon |

**Additional strategies from successful Capacitor App Store approvals:**
- Ensure no visible browser-style loading bars or error pages
- Handle all empty states gracefully (no generic browser error pages)
- Ensure transitions feel smooth (no visible page reloads)
- Test on a real device (not just simulator) before submission

### Privacy Nutrition Label Declaration

Based on the app's data collection:

| Data Type | Category | Purpose | Linked to Identity |
|-----------|----------|---------|-------------------|
| Email address | Contact Info | App Functionality | Yes |
| Body weight | Health & Fitness | App Functionality | Yes |
| Workout data | Fitness | App Functionality | Yes |
| Macro/nutrition logs | Health & Fitness | App Functionality | Yes |
| Device push token | Identifiers | App Functionality | Yes |
| Crash logs | Diagnostics | App Functionality | No |
| Usage analytics | Analytics | Analytics | No (Plausible is privacy-first, no cookies) |

### Account Deletion Requirement

Apple Guideline 5.1.1(v) requires in-app account deletion. Implementation:

1. Add "Delete Account" button in Settings screen
2. Show confirmation dialog with consequences ("This will permanently delete all your data including workout history, macros, XP, and achievements")
3. Require re-authentication (password entry) before deletion
4. Call Supabase Edge Function that: deletes all user rows across tables, calls Supabase Auth Admin API to delete the auth user
5. Clear all localStorage
6. Redirect to Auth screen

This is **required** -- not optional. Missing this will result in rejection.

---

## MVP Recommendation

For the Capacitor native iOS milestone, prioritize in this order:

### Phase 1: Capacitor Foundation + Native Polish

1. Initialize Capacitor project with iOS platform
2. Configure dual build pipeline (web with PWA, native without PWA)
3. Native splash screen, app icons, status bar
4. Replace `haptics.ts` with platform-aware Capacitor Haptics
5. Replace file export with platform-aware native Share
6. Wire native Network detection to syncStore
7. Build and test on real iOS device via Xcode

**Rationale:** Establishes the native shell. App runs identically to PWA but with native polish. No server-side changes needed. Must be rock-solid before adding push infrastructure.

### Phase 2: Push Notification Infrastructure

8. Apple Developer Account + APNs key (.p8) setup
9. `device_tokens` table in Supabase
10. `@capacitor/push-notifications` integration -- APNs token registration
11. Supabase Edge Function: `send-push` (receives webhook, sends via APNs HTTP/2)
12. Database webhooks on coach action tables (assigned_workouts, macro_targets, weekly_checkins)
13. Notification permission request flow (contextual, after value demonstrated)
14. Test end-to-end: coach action -> webhook -> Edge Function -> APNs -> device notification

**Rationale:** Core native capability that justifies the native app and App Store presence. Server-side + client-side work. Depends on Phase 1 being stable.

### Phase 3: Local Notifications + Deep Linking

15. `@capacitor/local-notifications` -- scheduled reminders mirroring remindersStore types
16. Notification preferences UI in Settings (time picker per notification type)
17. Universal Links setup (AASA file on welltrained.fitness, Xcode config)
18. Deep link handling for notification taps (route to correct screen via react-router)
19. App badge count management

**Rationale:** Completes the notification experience. Local notifications are independent of remote push infrastructure but share deep linking code. Deep linking makes both local and remote notifications useful.

### Phase 4: App Store Submission

20. Privacy policy page at welltrained.fitness/privacy
21. Account deletion feature in Settings
22. Privacy nutrition labels in App Store Connect
23. App Store listing content (screenshots, description, keywords, category: Health & Fitness)
24. App review information (test account with coach data, demo walkthrough notes)
25. TestFlight beta distribution to small group (internal testing)
26. Submit for App Store review

**Rationale:** Compliance and distribution. Cannot submit until all native features are tested. TestFlight first for real-device validation with beta users.

### Defer to Later Milestone

- **Streak-saving notifications:** Differentiator -- add after launch metrics show engagement patterns
- **Badge/level-up notifications:** Differentiator -- add once base notification system is stable
- **Biometric app lock:** Nice-to-have, not retention-critical
- **App update prompting:** Low effort, can add in a quick follow-up
- **Coach notification dashboard:** Useful but coach already manages via web
- **HealthKit integration:** High complexity, different data model, separate milestone
- **Widget extensions:** Requires native Swift development, separate milestone
- **Android support:** Separate milestone, different distribution requirements

---

## Sources

### HIGH Confidence
- Codebase analysis: `src/lib/haptics.ts` (current navigator.vibrate implementation, 0% iOS support)
- Codebase analysis: `src/stores/remindersStore.ts` (existing 4 reminder types: logMacros, checkIn, claimXP, workout)
- Codebase analysis: `src/lib/sync.ts` (push/pull sync architecture, coach data flow via pullCoachData)
- Codebase analysis: `vite.config.ts` (VitePWA configuration with Workbox, runtime caching)
- Codebase analysis: `supabase/functions/` (existing Edge Functions: send-invite, handle-intake-complete)
- [Capacitor Push Notifications Plugin API](https://capacitorjs.com/docs/apis/push-notifications) -- registration, listeners, iOS configuration
- [Capacitor Haptics Plugin API](https://capacitorjs.com/docs/apis/haptics) -- impact styles, notification types
- [Capacitor Share Plugin API](https://capacitorjs.com/docs/apis/share) -- iOS UIActivityViewController
- [Capacitor Local Notifications Plugin API](https://capacitorjs.com/docs/apis/local-notifications) -- scheduling, permissions
- [Capacitor Splash Screen Plugin API](https://capacitorjs.com/docs/apis/splash-screen) -- iOS storyboard config
- [Capacitor Status Bar Plugin API](https://capacitorjs.com/docs/apis/status-bar) -- style, overlay config
- [Capacitor Deep Links Guide](https://capacitorjs.com/docs/guides/deep-links) -- Universal Links, AASA file
- [Capacitor Deploying to App Store](https://capacitorjs.com/docs/ios/deploying-to-app-store) -- submission steps
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) -- 4.2 Minimum Functionality, 5.1.1(v) Account Deletion
- [Apple Privacy Nutrition Labels](https://developer.apple.com/app-store/app-privacy-details/) -- data disclosure requirements
- [WKWebView Service Worker Issue (Capacitor #7069)](https://github.com/ionic-team/capacitor/issues/7069) -- service workers fail in WKWebView

### MEDIUM Confidence
- [Supabase Push Notifications with Edge Functions](https://supabase.com/docs/guides/functions/examples/push-notifications) -- database webhook + push delivery pattern
- [Capawesome App Update Plugin](https://capawesome.io/plugins/app-update/) -- version check and App Store redirect
- [Capawesome Badge Plugin](https://capawesome.io/plugins/badge/) -- app icon badge management
- [App Store Review Guidelines Checklist (NextNative)](https://nextnative.dev/blog/app-store-review-guidelines) -- 2025 rejection reasons
- [App Store Review: Webview Apps (MobiLoud)](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper) -- Guideline 4.2 compliance for webview apps
- [Capacitor Push Notifications Guide (Capawesome)](https://capawesome.io/blog/the-push-notifications-guide-for-capacitor/) -- comprehensive setup guide
- [Capacitor Push Notifications Guide (Devdactic)](https://devdactic.com/push-notifications-ionic-capacitor/) -- APNs token handling walkthrough
- [Apple Policy Updates for Capacitor Apps 2025 (Capgo)](https://capgo.app/blog/apple-policy-updates-for-capacitor-apps-2025/) -- SDK requirements, Xcode 26 deadline April 2026
- [Fitness App Push Notification Strategies (Sudor Apps)](https://www.sudorapps.com/blog/harnessing-the-power-of-push-notifications-to-elevate-your-fitness-app-ekyhz) -- retention patterns
- [Push Notification Best Practices for Fitness (Glofox)](https://www.glofox.com/blog/driving-member-value-with-push-notifications/) -- notification trigger types
- [Biometric Auth Plugin (Aparajita)](https://github.com/aparajita/capacitor-biometric-auth) -- Face ID/Touch ID Capacitor plugin

### LOW Confidence
- iOS push notification opt-in rate of 51% (cited in multiple sources but exact methodology unclear)
- Service worker + WKWebView conflict resolution via conditional VitePWA disable (pattern mentioned in forums, not officially documented by Capacitor as a recommended approach)
- Apple's enforcement intensity on Guideline 4.2 for Capacitor apps specifically (varies by reviewer; anecdotal from Ionic Forum posts)
