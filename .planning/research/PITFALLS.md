# Domain Pitfalls: Capacitor iOS Native Wrapping

**Domain:** Wrapping existing React + Vite + Zustand + Supabase PWA with Capacitor for iOS App Store distribution, push notifications (APNs), native haptics, and native file sharing
**Researched:** 2026-02-21
**Existing Codebase:** Trained fitness gamification PWA

---

## Table of Contents

### Critical Pitfalls (cause rewrites or App Store rejection)
1. [Service Worker Conflicts in Capacitor WebView](#1-service-worker-conflicts-in-capacitor-webview)
2. [localStorage Data Eviction by iOS](#2-localstorage-data-eviction-by-ios)
3. [App Store Rejection Under Guideline 4.2 (Minimum Functionality)](#3-app-store-rejection-under-guideline-42-minimum-functionality)
4. [Push Notification Permission Is One-Shot on iOS](#4-push-notification-permission-is-one-shot-on-ios)
5. [Supabase Auth Redirect Broken in Capacitor WebView](#5-supabase-auth-redirect-broken-in-capacitor-webview)
6. [window.confirm Dialogs Silently Fail in WKWebView](#6-windowconfirm-dialogs-silently-fail-in-wkwebview)

### Moderate Pitfalls (cause bugs or degraded UX)
7. [WKWebView White Screen After Background Memory Pressure](#7-wkwebview-white-screen-after-background-memory-pressure)
8. [Plausible Analytics Script Fails in capacitor:// Scheme](#8-plausible-analytics-script-fails-in-capacitor-scheme)
9. [Data Export via Blob URL / Anchor Click Broken on iOS](#9-data-export-via-blob-url--anchor-click-broken-on-ios)
10. [Vite Build Pipeline Misconfiguration](#10-vite-build-pipeline-misconfiguration)
11. [APNs Token vs FCM Token Confusion](#11-apns-token-vs-fcm-token-confusion)
12. [iOS Keyboard Pushes WebView and Misaligns Touch Targets](#12-ios-keyboard-pushes-webview-and-misaligns-touch-targets)
13. [Scroll Bounce and Overscroll on iOS 16+](#13-scroll-bounce-and-overscroll-on-ios-16)

### Minor Pitfalls (cause friction or polish issues)
14. [Missing viewport-fit=cover for Notch/Dynamic Island](#14-missing-viewport-fitcover-for-notchdynamic-island)
15. [navigator.vibrate No-Op -- Need Capacitor Haptics Plugin](#15-navigatorvibrate-no-op----need-capacitor-haptics-plugin)
16. [Universal Links Configuration Fragility](#16-universal-links-configuration-fragility)
17. [Splash Screen and App Icon Sizing Requirements](#17-splash-screen-and-app-icon-sizing-requirements)
18. [iOS Swipe-Back Gesture Does Not Work With BrowserRouter](#18-ios-swipe-back-gesture-does-not-work-with-browserrouter)
19. [Live Reload server.url Left in Production Config](#19-live-reload-serverurl-left-in-production-config)
20. [Capacitor Plugin Version Mismatches](#20-capacitor-plugin-version-mismatches)

---

## Critical Pitfalls

### 1. Service Worker Conflicts in Capacitor WebView

**Severity:** CRITICAL
**Phase:** Initial Capacitor Setup
**Confidence:** HIGH (verified via Capacitor GitHub issues [#7069](https://github.com/ionic-team/capacitor/issues/7069), [#580](https://github.com/ionic-team/capacitor/issues/580), [#4122](https://github.com/ionic-team/capacitor/issues/4122))

**What goes wrong:** Capacitor serves assets via the `capacitor://localhost` custom scheme on iOS. WKWebView does not support service workers on custom schemes. The existing `vite-plugin-pwa` with Workbox (precache + runtime caching for USDA, Open Food Facts, and Supabase APIs) will attempt to register a service worker that silently fails or throws errors. The `UpdatePrompt` component (`useRegisterSW` from `virtual:pwa-register/react`) will break because service worker registration returns undefined.

**Why it happens:** WKWebView only supports service workers for domains listed in `WKAppBoundDomains` (iOS 14+), and even then only for `https://` URLs, not custom schemes like `capacitor://`. The PWA is designed to work offline via service worker caching, but Capacitor apps ship all assets in the native bundle -- they do not need a service worker for offline access.

**Consequences:**
- Console errors on every app launch from failed SW registration
- `UpdatePrompt` component throws or shows stale "update available" prompts
- Runtime caching for food search APIs (USDA, Open Food Facts) stops working
- Supabase API caching via Workbox NetworkFirst strategy stops working
- Potential app crash if SW registration error is unhandled

**Trained-specific impact:** The `vite.config.ts` has `registerType: 'prompt'` and extensive `workbox.runtimeCaching` for 3 API domains. The `UpdatePrompt.tsx` component calls `useRegisterSW()` which will fail in Capacitor.

**Prevention:**
1. Conditionally disable `vite-plugin-pwa` for Capacitor builds using an environment variable:
   ```typescript
   // vite.config.ts
   const isCapacitor = process.env.CAPACITOR_BUILD === 'true'

   plugins: [
     // Only include PWA plugin for web builds
     !isCapacitor && VitePWA({ ... }),
   ].filter(Boolean)
   ```
2. Guard `UpdatePrompt` component:
   ```typescript
   // Check if running in Capacitor
   import { Capacitor } from '@capacitor/core'

   export function UpdatePrompt() {
     if (Capacitor.isNativePlatform()) return null
     // ... existing SW logic
   }
   ```
3. For runtime API caching lost in native builds, rely on Capacitor's native HTTP plugin or implement app-level caching in Zustand/memory for food search results.
4. Add `CAPACITOR_BUILD=true` to the native build script in `package.json`:
   ```json
   "build:native": "CAPACITOR_BUILD=true vite build"
   ```

**Detection:** App launches with console error `navigator.serviceWorker is not defined` or `Failed to register service worker`.

---

### 2. localStorage Data Eviction by iOS

**Severity:** CRITICAL
**Phase:** Data Persistence Migration
**Confidence:** HIGH (verified via [Apple Developer Forums](https://developer.apple.com/forums/thread/742037), [Capacitor Storage docs](https://capacitorjs.com/docs/guides/storage), [Capacitor issue #636](https://github.com/ionic-team/capacitor/issues/636))

**What goes wrong:** iOS will reclaim localStorage data from WKWebView when the device is under storage pressure. All 8 Zustand persisted stores (user, xp, macros, workouts, achievements, reminders, avatar, access) use `persist` middleware writing to `localStorage`. Users lose all their progress, workout logs, macro tracking data, XP, and achievements without warning.

**Why it happens:** WKWebView's localStorage is treated as "website data" by iOS, subject to the same eviction policies as Safari. Unlike native app storage (UserDefaults, CoreData, SQLite), localStorage is not guaranteed to persist. The OS can purge it during low-storage conditions, after extended periods of non-use, or during iOS updates.

**Consequences:**
- Complete loss of user training history, streak data, XP progress, and avatar evolution
- Users see the onboarding flow again after data eviction
- For authenticated users: local data gone but server data intact, creating a confusing state
- For offline-only users (no Supabase account): permanent, irrecoverable data loss
- The 90-day pruning in xpStore, macroStore, workoutStore becomes irrelevant because iOS evicts the entire store

**Trained-specific impact:** The app has 8 Zustand stores with `persist` middleware, ALL writing to localStorage. The stores contain critical user data: workout logs, macro daily logs, XP/level progress, achievement unlocks, avatar evolution state. For synced users, server has a backup, but for offline-only users this is catastrophic.

**Prevention:**
1. Replace Zustand's localStorage persistence with Capacitor Preferences plugin for native builds:
   ```typescript
   import { Preferences } from '@capacitor/preferences'
   import { Capacitor } from '@capacitor/core'

   const capacitorStorage = {
     getItem: async (name: string) => {
       const { value } = await Preferences.get({ key: name })
       return value
     },
     setItem: async (name: string, value: string) => {
       await Preferences.set({ key: name, value })
     },
     removeItem: async (name: string) => {
       await Preferences.remove({ key: name })
     },
   }

   // Use in Zustand persist config
   persist(storeCreator, {
     name: 'store-name',
     storage: Capacitor.isNativePlatform()
       ? createJSONStorage(() => capacitorStorage)
       : createJSONStorage(() => localStorage),
   })
   ```
2. Capacitor Preferences uses iOS UserDefaults under the hood, which is not subject to web data eviction.
3. Keep localStorage for web PWA builds (no change to existing behavior).
4. Consider migrating larger datasets (workout logs, macro logs) to SQLite via `@capacitor-community/sqlite` if they exceed ~1MB.
5. On first Capacitor launch, attempt to read existing localStorage and migrate to Preferences (one-time migration for users who had the PWA installed).

**Detection:** Users report "all my data is gone" after not opening the app for a while, or after iOS update, or after device runs low on storage.

---

### 3. App Store Rejection Under Guideline 4.2 (Minimum Functionality)

**Severity:** CRITICAL
**Phase:** App Store Submission
**Confidence:** HIGH (verified via [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Apple Developer Forums](https://developer.apple.com/forums/thread/82714), [mobiloud analysis](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper))

**What goes wrong:** Apple rejects apps under Guideline 4.2.2 that are essentially "web clippings" -- a WebView wrapping a website with no native integration. The rejection message states the app does not provide enough native functionality to differentiate it from the mobile web experience.

**Why it happens:** Apple's review team distinguishes between "lazy wrappers" (load a URL, do nothing else) and legitimate hybrid apps. A lazy wrapper has: no push notifications, no offline handling beyond SW, no native UI elements, no device API integration, and crashes to white screen without internet. Apple wants apps that justify their existence as native apps rather than bookmarks.

**Consequences:**
- App rejected, cannot ship to App Store
- Must re-submit after adding native features, losing 1-2+ weeks per review cycle
- Repeated rejections can flag the developer account

**Trained-specific advantages:** The app already has legitimate native value propositions (fitness tracking, gamification, coach features). The risk is in the implementation -- if the reviewer sees a WebView with no native integration, the content does not matter.

**Prevention (things that demonstrate "native app" to reviewers):**
1. **Push notifications** (the most important signal) -- implement coach notification delivery, daily check-in reminders, workout reminders via APNs
2. **Native haptics** via `@capacitor/haptics` (replaces the no-op `navigator.vibrate`)
3. **Native share sheet** via `@capacitor/share` for data export (replaces Blob/anchor download)
4. **Native splash screen** via `@capacitor/splash-screen`
5. **Status bar control** via `@capacitor/status-bar`
6. **App icon with proper iOS sizing** (1024x1024 for App Store, all required sizes in asset catalog)
7. **Offline functionality** -- app works without network since assets are bundled (demonstrate this in review notes)
8. **Native dialogs** via `@capacitor/dialog` (replace `window.confirm`)
9. In the App Store review notes, explicitly call out: push notifications, offline capability, native haptics, native sharing, coach/client real-time features

**Detection:** Rejection email citing Guideline 4.2 - Design - Minimum Functionality.

---

### 4. Push Notification Permission Is One-Shot on iOS

**Severity:** CRITICAL
**Phase:** Push Notification Implementation
**Confidence:** HIGH (verified via [Apple Developer Documentation](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications), [Capacitor Push Notifications docs](https://capacitorjs.com/docs/apis/push-notifications))

**What goes wrong:** On iOS, `requestPermission()` for notifications presents a system dialog exactly once. If the user taps "Don't Allow," the permission transitions to `.denied` permanently. Calling `requestPermission()` again immediately returns `denied` with no dialog shown. The app cannot re-prompt. The user must manually navigate to Settings > Notifications > YourApp to re-enable.

**Why it happens:** iOS treats notification permission as a one-time user decision to prevent apps from nagging users repeatedly. The permission states are: `.notDetermined` (never asked), `.authorized`, `.denied` (permanent), `.provisional`, and `.ephemeral`.

**Consequences:**
- If prompted too early (e.g., on first launch before user understands the value), user denies and never receives push notifications
- Coach notifications (new workout assigned, check-in feedback) never delivered
- No way to programmatically re-prompt -- must show custom UI directing to Settings app
- Lost engagement channel for the entire lifetime of the install

**Trained-specific impact:** Push notifications are the primary reason for the native app (coach-to-client notifications). If a user denies on first prompt, the coach feature's notification delivery is permanently broken for that user without manual Settings intervention.

**Prevention:**
1. **Never prompt on first launch.** Wait for a contextual moment where the value is clear:
   - After completing onboarding and seeing the dashboard
   - When a coach assigns them their first workout ("Get notified when your coach sends you a new workout?")
   - When they visit Settings and toggle a "Notifications" preference
2. **Show a pre-permission screen** (a custom UI explaining what notifications will be used for) before calling the system API. Only call `PushNotifications.requestPermissions()` after the user taps "Enable Notifications" on your custom screen.
3. **Check permission status first** before requesting:
   ```typescript
   const status = await PushNotifications.checkPermissions()
   if (status.receive === 'prompt') {
     // Show pre-permission UI, then request
   } else if (status.receive === 'denied') {
     // Show "Go to Settings" guidance
   }
   ```
4. **Handle the denied state gracefully** with a UI that explains how to enable in Settings and provides a deep link to the app's notification settings:
   ```typescript
   import { NativeSettings } from 'capacitor-native-settings'
   NativeSettings.openIOS({ option: 'application' })
   ```
5. **Consider provisional notifications** (iOS 12+) as a soft-ask alternative -- they deliver to Notification Center without a prompt, but silently (no banner, no sound). Good for non-urgent notifications.

**Detection:** User reports "I never get notifications" -- check permission status on their device.

---

### 5. Supabase Auth Redirect Broken in Capacitor WebView

**Severity:** CRITICAL
**Phase:** Auth Integration
**Confidence:** HIGH (verified via [Supabase Native Mobile Deep Linking docs](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), [supabase/discussions#11548](https://github.com/orgs/supabase/discussions/11548))

**What goes wrong:** The Supabase client is configured with `detectSessionInUrl: true`, which works in browsers by reading the `#access_token=...` fragment from the URL after OAuth/magic link redirects. In Capacitor, the redirect URL (`https://app.welltrained.fitness/...`) opens in the system browser (Safari), not in the app's WebView. The token fragment never reaches the Capacitor app, so the user authenticates in Safari but the app remains logged out.

**Why it happens:** Capacitor apps run in a WKWebView with a custom scheme (`capacitor://localhost`). When Supabase redirects after authentication, it redirects to the web URL. Without Universal Links or a custom URL scheme configured, the redirect stays in Safari. Even with Universal Links, the `#fragment` portion of the URL is not sent to the server (it's client-side only), creating a chicken-and-egg problem.

**Consequences:**
- Magic link sign-in opens Safari, user authenticates, but the app stays on the login screen
- OAuth flows (if added later) redirect to Safari and never return to the app
- Password reset links open in Safari instead of the app
- Session detection fails entirely for native builds

**Trained-specific impact:** The app uses `detectSessionInUrl: true` in `src/lib/supabase.ts`. The Auth screen flow depends on Supabase session detection via URL fragments. This is fundamentally incompatible with Capacitor without modification.

**Prevention:**
1. **Set up Universal Links** for `app.welltrained.fitness` with an `apple-app-site-association` file hosted on the domain:
   ```json
   {
     "applinks": {
       "apps": [],
       "details": [{
         "appID": "TEAM_ID.com.welltrained.fitness",
         "paths": ["/auth/callback", "/auth/confirm"]
       }]
     }
   }
   ```
2. **Add the `@capacitor/app` listener** to capture incoming URLs:
   ```typescript
   import { App } from '@capacitor/app'

   App.addListener('appUrlOpen', ({ url }) => {
     // Extract tokens from URL and set Supabase session
     const hashParams = new URL(url).hash
     if (hashParams.includes('access_token')) {
       supabase.auth.setSession({
         access_token: extractParam(hashParams, 'access_token'),
         refresh_token: extractParam(hashParams, 'refresh_token'),
       })
     }
   })
   ```
3. **Configure Supabase redirect URLs** in the Supabase dashboard to include both:
   - `https://app.welltrained.fitness/auth/callback` (web)
   - The Universal Link URL that routes to the app
4. **Use PKCE flow** (`flowType: 'pkce'` in Supabase client options) for native apps -- it's more secure and handles the redirect exchange better than the implicit flow.
5. **Consider email+password auth as primary** for the native app (avoids redirect issues entirely). Magic links and OAuth can be secondary.

**Detection:** User taps magic link in email, Safari opens, user sees "logged in" in Safari, switches back to app, still sees login screen.

---

### 6. window.confirm Dialogs Silently Fail in WKWebView

**Severity:** CRITICAL
**Phase:** UI Migration
**Confidence:** HIGH (verified via [webapp2app.com](https://www.webapp2app.com/2018/06/11/javascript-dialogs-like-alert-confirm-and-prompt-in-ios-webview-apps/), [Capacitor Dialog docs](https://capacitorjs.com/docs/apis/dialog))

**What goes wrong:** `window.confirm()` calls may not display in WKWebView or may display inconsistently depending on the Capacitor version and iOS version. The WKWebView requires a `WKUIDelegate` implementing `runJavaScriptConfirmPanelWithMessage` to show confirm dialogs. While Capacitor's bridge sets this up, there are edge cases where the dialog silently returns `false` or does not appear, especially during transitions or when the WebView is not the key window.

**Why it happens:** WKWebView's JavaScript dialog support is delegated to native UIKit via the `WKUIDelegate` protocol. Unlike Safari, the WebView does not automatically handle `window.confirm`. Capacitor implements the delegate, but edge cases exist around timing and focus states.

**Consequences:** The app has **10 `window.confirm` calls** across 6 files:
- `Settings.tsx`: "Are you sure? This will delete ALL your progress..." -- if confirm silently returns false, user cannot reset progress
- `Coach.tsx`: 3 confirms for releasing macros, deleting templates, removing assignments -- coaches cannot manage clients
- `Workouts.tsx`: 2 confirms for ending workout and resetting exercises
- `Macros.tsx`: 2 confirms for deleting meal entries and saved meals
- `Onboarding.tsx`: 1 confirm for skipping setup
- `WorkoutAssigner.tsx`: 1 confirm for replacing assigned workout

If any of these silently return `false`, the user action is blocked with no feedback.

**Prevention:**
1. **Replace ALL `window.confirm` calls with `@capacitor/dialog`** on native platforms:
   ```typescript
   import { Dialog } from '@capacitor/dialog'
   import { Capacitor } from '@capacitor/core'

   export async function confirmAction(message: string): Promise<boolean> {
     if (Capacitor.isNativePlatform()) {
       const { value } = await Dialog.confirm({
         title: 'Confirm',
         message,
       })
       return value
     }
     return window.confirm(message)
   }
   ```
2. This changes confirms from synchronous to async -- each call site needs to be updated from `if (window.confirm(...))` to `if (await confirmAction(...))`.
3. Create a shared utility and search-replace all 10 instances systematically.
4. Test each confirmation flow on a real iOS device (simulator may behave differently).

**Detection:** User taps "Delete" on a meal, nothing happens. No dialog appears, no deletion occurs.

---

## Moderate Pitfalls

### 7. WKWebView White Screen After Background Memory Pressure

**Severity:** MODERATE (but feels critical to users)
**Phase:** App Polish / Background Handling
**Confidence:** HIGH (verified via [Capacitor discussion #7097](https://github.com/ionic-team/capacitor/discussions/7097), [Capacitor discussion #5260](https://github.com/ionic-team/capacitor/discussions/5260), [Apple Developer Forums](https://developer.apple.com/forums/thread/741088))

**What goes wrong:** When the app is backgrounded and iOS reclaims memory, WKWebView's web content process is terminated. When the user returns to the app, they see a white screen. Capacitor 3.4.1+ automatically reloads the WebView via `webViewWebContentProcessDidTerminate`, but the reload takes time and shows a blank white screen with no splash screen or loading indicator.

**Why it happens:** WKWebView runs its web content in a separate process from the app process. iOS can terminate this web process to free memory without killing the app itself. The native app frame remains visible but the WebView content is gone.

**Consequences:**
- User backgrounds the app during a workout, opens camera, returns to app: white screen for 1-3 seconds
- Zustand stores must re-hydrate from storage, causing a flash of default state
- Any in-progress workout data not yet persisted to storage is lost
- User perceives the app as "crashed"

**Prevention:**
1. **Persist in-progress workout state aggressively** -- the workoutStore should write to persistent storage on every set completion, not just at workout end
2. **Add a native splash screen overlay** that shows during WebView reload:
   ```swift
   // In AppDelegate or a Capacitor plugin
   func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
     showSplashOverlay()
     webView.reload()
   }
   ```
3. **Use Capacitor's `SplashScreen.show()`** on `App.addListener('appStateChange')` when transitioning to background, so the splash covers the white screen on resume
4. **Track background entry time** using UserDefaults (not in-memory variables, which are lost when the web process terminates):
   ```typescript
   App.addListener('appStateChange', ({ isActive }) => {
     if (!isActive) {
       Preferences.set({ key: 'backgroundedAt', value: Date.now().toString() })
     }
   })
   ```

**Detection:** White flash when returning to the app after using other memory-intensive apps (camera, games).

---

### 8. Plausible Analytics Script Fails in capacitor:// Scheme

**Severity:** MODERATE
**Phase:** Analytics Integration
**Confidence:** MEDIUM (inferred from scheme behavior + [iOS ITP behavior](https://www.thinktecture.com/en/ios/wkwebview-itp-ios-14/))

**What goes wrong:** The Plausible script tag (`<script defer data-domain="app.welltrained.fitness" src="https://plausible.io/js/script.js">`) loads from a CDN. In Capacitor's WKWebView, the page origin is `capacitor://localhost`, not `https://app.welltrained.fitness`. The Plausible script uses `document.location` to determine the domain and sends pageviews attributed to `capacitor://localhost` or simply fails due to cross-origin restrictions. iOS ITP (Intelligent Tracking Prevention) in WKWebView may also block the script entirely.

**Why it happens:** WKWebView has stricter privacy controls than Safari. Cross-origin script loading from `capacitor://` to `https://plausible.io` may be blocked. Even if the script loads, it reports the wrong domain.

**Consequences:**
- No analytics data from native app users
- Or analytics data polluted with `capacitor://localhost` as the domain
- Cannot distinguish web vs native app users in Plausible dashboard

**Trained-specific impact:** The app has 25+ custom analytics events in `src/lib/analytics.ts` plus automatic pageview tracking. All of these stop working or misreport in the native app.

**Prevention:**
1. **Use Plausible's Events API** server-side instead of the client-side script for native builds:
   ```typescript
   if (Capacitor.isNativePlatform()) {
     // Use Plausible Events API directly
     fetch('https://plausible.io/api/event', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         name: event,
         url: `app://welltrained.fitness${window.location.pathname}`,
         domain: 'app.welltrained.fitness',
         props,
       }),
     })
   }
   ```
2. **Conditionally load the Plausible script** -- only include the `<script>` tag in web builds, not in the native app's `index.html`.
3. **Add a platform dimension** to events so web and native users can be distinguished.

**Detection:** Plausible dashboard shows zero users despite active native installs, or shows traffic from `capacitor://localhost`.

---

### 9. Data Export via Blob URL / Anchor Click Broken on iOS

**Severity:** MODERATE
**Phase:** File Sharing Migration
**Confidence:** HIGH (verified via [Capacitor Filesystem docs](https://capacitorjs.com/docs/apis/filesystem), [Capacitor Share docs](https://capacitorjs.com/docs/apis/share), [Capacitor issue #6132](https://github.com/ionic-team/capacitor/issues/6132))

**What goes wrong:** The Settings screen exports data by creating a Blob, generating an object URL via `URL.createObjectURL()`, creating an anchor element with `download` attribute, programmatically clicking it, then revoking the URL. This pattern does not work in WKWebView. The `download` attribute on anchors is not reliably supported in WKWebView, and `URL.createObjectURL` + programmatic click may silently fail or open the blob in a new tab instead of downloading.

**Why it happens:** WKWebView does not fully implement the HTML5 download attribute. Blob URLs created via `URL.createObjectURL` behave differently than in a browser -- the WebView may try to navigate to the blob URL instead of downloading it.

**Consequences:**
- Users tap "Export Data" and nothing happens (or app navigates to a data:// URL showing raw JSON)
- No way to back up data from the native app
- File import via `<input type="file">` with FileReader may work but has its own iOS quirks

**Trained-specific impact:** `Settings.tsx` lines 182-197 use the exact Blob + anchor + click pattern that breaks. The import flow (lines 268-278) using FileReader may also have issues with file selection in WKWebView.

**Prevention:**
1. **Use Capacitor Filesystem + Share plugins** for native export:
   ```typescript
   import { Filesystem, Directory } from '@capacitor/filesystem'
   import { Share } from '@capacitor/share'

   if (Capacitor.isNativePlatform()) {
     const fileName = `trained-backup-${getLocalDateString()}.json`
     await Filesystem.writeFile({
       path: fileName,
       data: dataStr, // JSON string, not Blob
       directory: Directory.Cache,
     })
     const uri = await Filesystem.getUri({
       path: fileName,
       directory: Directory.Cache,
     })
     await Share.share({
       title: 'Trained Backup',
       url: uri.uri,
     })
   } else {
     // Existing Blob + anchor pattern for web
   }
   ```
2. **For file import**, the `<input type="file">` element should work in Capacitor's WKWebView, but test on real devices. FileReader's `readAsText` is reliable.
3. The Share plugin opens the native iOS share sheet, letting users save to Files, AirDrop, email, etc. -- much better UX than a file download.

**Detection:** User taps "Export Data," nothing visible happens, no file appears.

---

### 10. Vite Build Pipeline Misconfiguration

**Severity:** MODERATE
**Phase:** Build Pipeline Setup
**Confidence:** HIGH (verified via [Capacitor docs](https://capacitorjs.com/docs/getting-started), [Capacitor workflow docs](https://capacitorjs.com/docs/basics/workflow))

**What goes wrong:** Multiple configuration mismatches between Vite's output and Capacitor's expectations:
- `webDir` in `capacitor.config.ts` must point to `dist` (Vite's default output), but may be misconfigured to `build` (CRA convention)
- `npx cap sync` copies the `dist` folder to the native project -- if `npm run build` was not run first, it copies stale or missing assets
- Sentry source map upload (`sentryVitePlugin`) runs during build and deletes `.map` files from `dist` -- this is fine, but if the build order is wrong, Capacitor copies incomplete assets
- The `@` path alias (`resolve.alias`) works in Vite but may cause issues if native build tools try to resolve these paths

**Consequences:**
- Xcode build succeeds but app shows blank page (wrong webDir)
- App shows old version of the code (stale dist from previous build)
- Source maps missing for native crash reports

**Prevention:**
1. **Set `webDir: 'dist'` in `capacitor.config.ts`** explicitly:
   ```typescript
   const config: CapacitorConfig = {
     appId: 'com.welltrained.fitness',
     appName: 'WellTrained',
     webDir: 'dist',
   }
   ```
2. **Add a combined build+sync script** to `package.json`:
   ```json
   "build:ios": "CAPACITOR_BUILD=true vite build && npx cap sync ios",
   "build:android": "CAPACITOR_BUILD=true vite build && npx cap sync android"
   ```
3. **Run `npx cap doctor`** after setup to verify configuration
4. **Never run `npx cap sync` without building first** -- make it a habit to always use the combined script

**Detection:** `npx cap sync` warns "The web directory (dist) must contain an index.html" or Xcode build shows old content.

---

### 11. APNs Token vs FCM Token Confusion

**Severity:** MODERATE
**Phase:** Push Notification Backend
**Confidence:** HIGH (verified via [Capacitor Push Notifications docs](https://capacitorjs.com/docs/apis/push-notifications), [Capacitor issue #1749](https://github.com/ionic-team/capacitor/issues/1749))

**What goes wrong:** On iOS, `@capacitor/push-notifications` returns the raw APNs device token in the `registration` event. On Android, it returns the FCM token. Developers often store this token in the database assuming it's an FCM token and try to send via Firebase Cloud Messaging, which fails for iOS tokens unless FCM-APNs integration is configured.

**Why it happens:** The Capacitor plugin abstracts the registration but the token format differs by platform. The documentation is confusing because it shows a single `registration` event handler for both platforms.

**Consequences:**
- Push notifications silently fail to deliver on iOS
- Backend sends to FCM with an APNs token, gets "InvalidRegistration" error
- Coach assigns a workout, client never gets notified

**Prevention:**
1. **Decide on a push delivery strategy early:**
   - **Option A: FCM for both platforms** -- configure APNs key in Firebase Console, use FCM SDK (`@capacitor-firebase/messaging`), which returns FCM tokens on both platforms
   - **Option B: Supabase Edge Functions + direct APNs** -- use Supabase to send push notifications directly to APNs (no Firebase dependency), store the APNs token directly
   - **Option C: Third-party service** (OneSignal, Pusher) -- handles both platforms transparently
2. **Store the platform alongside the token** in the database:
   ```typescript
   PushNotifications.addListener('registration', (token) => {
     await supabase.from('push_tokens').upsert({
       user_id: userId,
       token: token.value,
       platform: Capacitor.getPlatform(), // 'ios' | 'android' | 'web'
     })
   })
   ```
3. **For Trained, recommend Option B** (Supabase Edge Functions + APNs) since the backend is already Supabase and adding Firebase creates unnecessary complexity. Use Supabase's `pg_net` or Edge Functions to send directly to APNs using the APNs HTTP/2 API with a .p8 key.

**Detection:** Tokens are stored in the database but `push-send` Edge Function returns errors or notifications never arrive.

---

### 12. iOS Keyboard Pushes WebView and Misaligns Touch Targets

**Severity:** MODERATE
**Phase:** UI Polish
**Confidence:** HIGH (verified via [Capacitor issue #1366](https://github.com/ionic-team/capacitor/issues/1366), [Capacitor Keyboard docs](https://capacitorjs.com/docs/apis/keyboard))

**What goes wrong:** When the iOS keyboard opens, WKWebView resizes or scrolls to accommodate it. This can cause the entire page to "jump up and down" when focusing an input, and after the keyboard dismisses, touch targets may be offset from their visual position (tap at position Y but the hit target is at Y-300px).

**Why it happens:** WKWebView reports incorrect bottom insets during keyboard show/hide transitions. The viewport resize behavior differs from Safari's. Combined with React's virtual DOM reconciliation, this can leave the layout in an inconsistent state.

**Consequences:**
- Meal logging inputs (Macros screen) jump around when entering calorie values
- Workout set inputs (weight/reps) cause the screen to bounce
- Coach notes textarea in check-in review causes layout shifts
- After dismissing keyboard, buttons may not respond to taps in the correct position

**Trained-specific impact:** The app is input-heavy: macro logging (multiple number inputs per meal), workout logging (weight/reps per set), coach notes, onboarding form. Every input-heavy screen is affected.

**Prevention:**
1. **Install `@capacitor/keyboard` plugin** and configure:
   ```typescript
   import { Keyboard, KeyboardResize } from '@capacitor/keyboard'

   // Use 'none' to prevent WebView resize, handle manually
   Keyboard.setResizeMode({ mode: KeyboardResize.None })

   // Or use 'ionic' mode which adds padding instead of resizing
   Keyboard.setResizeMode({ mode: KeyboardResize.Ionic })
   ```
2. **Listen for keyboard events** to adjust layout:
   ```typescript
   Keyboard.addListener('keyboardWillShow', (info) => {
     document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`)
   })
   Keyboard.addListener('keyboardWillHide', () => {
     document.documentElement.style.setProperty('--keyboard-height', '0px')
   })
   ```
3. **Add `inputmode="decimal"` or `inputmode="numeric"`** to number inputs to show the appropriate keyboard (numeric pad instead of full keyboard reduces screen real estate impact)
4. **Use `scrollIntoView({ block: 'center' })`** on focus to position inputs well above the keyboard

**Detection:** Inputs jump or "bounce" when focused; tapping a button after dismissing the keyboard does nothing.

---

### 13. Scroll Bounce and Overscroll on iOS 16+

**Severity:** MODERATE
**Phase:** UI Polish
**Confidence:** HIGH (verified via [Capacitor issue #5907](https://github.com/ionic-team/capacitor/issues/5907))

**What goes wrong:** iOS 16+ WKWebView shows rubber-band bounce (overscroll) at the top and bottom of scrollable content, even when the Capacitor config sets `allowsBackForwardNavigationGestures: false`. The app's dark background (#0a0a0a) reveals a white or gray overscroll area, breaking the visual design.

**Why it happens:** WKWebView's `UIScrollView` has `bounces` enabled by default. The `alwaysBounceVertical` property and the standard `bounces` property do not always behave consistently across iOS versions.

**Consequences:**
- Pull-down at top of screen shows white/gray area above the app content
- Scroll past bottom shows white/gray area below
- Looks unpolished and non-native
- On dark-themed apps like Trained (background #0a0a0a), the contrast is jarring

**Prevention:**
1. **Set `overscroll-behavior: none`** in CSS:
   ```css
   html, body {
     overscroll-behavior: none;
   }
   ```
2. **Configure in `capacitor.config.ts`:**
   ```typescript
   ios: {
     backgroundColor: '#0a0a0a', // Match app background
     scrollEnabled: false, // Disable if not needed at root level
   }
   ```
3. **Set the WKWebView background color** to match the app theme so any overscroll area is the same color:
   ```swift
   // In AppDelegate.swift
   webView?.scrollView.backgroundColor = UIColor(red: 0.04, green: 0.04, blue: 0.04, alpha: 1.0)
   ```
4. Apply `overscroll-behavior: none` specifically to the root scroll container, not just `body`

**Detection:** Pull down on the Dashboard screen reveals a white band above the content.

---

## Minor Pitfalls

### 14. Missing viewport-fit=cover for Notch/Dynamic Island

**Severity:** MINOR (but looks unprofessional)
**Phase:** Initial Capacitor Setup
**Confidence:** HIGH (verified via [CSS-Tricks](https://css-tricks.com/the-notch-and-css/), [Capacitor Status Bar docs](https://capacitorjs.com/docs/apis/status-bar))

**What goes wrong:** The current `index.html` meta viewport tag is:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```
This does NOT include `viewport-fit=cover`. Without it, the app content is inset from the edges on notched iPhones (X, 11, 12, 13, 14, 15) and Dynamic Island devices (14 Pro, 15 Pro, 16). The app appears in a "letterboxed" area with black bars at the top and bottom.

**Trained-specific note:** The app already uses `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` in `src/index.css` (lines 218, 222), which is correct. But these CSS environment variables only have non-zero values when `viewport-fit=cover` is set.

**Prevention:**
1. **Update the viewport meta tag:**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
   ```
2. Verify that the existing `env(safe-area-inset-*)` padding in `index.css` properly handles the notch/home indicator areas after this change
3. This change is safe for the web PWA too -- it's a no-op on non-notched devices and in browsers

**Detection:** App appears with black bars at top/bottom on notched iPhones instead of extending edge-to-edge.

---

### 15. navigator.vibrate No-Op -- Need Capacitor Haptics Plugin

**Severity:** MINOR
**Phase:** Native Features Integration
**Confidence:** HIGH (established in project memory: "navigator.vibrate() has 0% iOS Safari support")

**What goes wrong:** The existing `src/lib/haptics.ts` uses `navigator.vibrate()`, which has zero support on iOS (Safari and WKWebView). The `canVibrate` check returns `false` and all haptic feedback is silently skipped. The Capacitor native app has the same problem unless replaced with the native Haptics plugin.

**Trained-specific impact:** The app has 5 haptic patterns (light, medium, success, heavy, error) used across workout completion, XP claims, check-ins, and achievement unlocks. None of them fire on iOS.

**Prevention:**
1. **Replace with `@capacitor/haptics`:**
   ```typescript
   import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
   import { Capacitor } from '@capacitor/core'

   export const haptics = {
     light: () => Capacitor.isNativePlatform()
       ? Haptics.impact({ style: ImpactStyle.Light })
       : canVibrate && navigator.vibrate(10),

     medium: () => Capacitor.isNativePlatform()
       ? Haptics.impact({ style: ImpactStyle.Medium })
       : canVibrate && navigator.vibrate(25),

     success: () => Capacitor.isNativePlatform()
       ? Haptics.notification({ type: NotificationType.Success })
       : canVibrate && navigator.vibrate([15, 50, 30]),

     heavy: () => Capacitor.isNativePlatform()
       ? Haptics.impact({ style: ImpactStyle.Heavy })
       : canVibrate && navigator.vibrate(50),

     error: () => Capacitor.isNativePlatform()
       ? Haptics.notification({ type: NotificationType.Error })
       : canVibrate && navigator.vibrate([50, 30, 50]),
   }
   ```
2. The Capacitor Haptics plugin uses the Taptic Engine on iOS -- real, satisfying haptic feedback instead of the no-op vibrate.
3. Keep the `navigator.vibrate` fallback for Android web/PWA users.

**Detection:** No tactile feedback on any interaction on iOS. (Already the case in PWA -- this pitfall is about not forgetting to fix it for native.)

---

### 16. Universal Links Configuration Fragility

**Severity:** MINOR (until it breaks auth)
**Phase:** Deep Linking Setup
**Confidence:** HIGH (verified via [Capacitor Deep Links guide](https://capacitorjs.com/docs/guides/deep-links), [Apple Developer docs](https://developer.apple.com/documentation/xcode/supporting-associated-domains))

**What goes wrong:** Universal Links require a precise chain: (1) `apple-app-site-association` (AASA) file hosted at `https://app.welltrained.fitness/.well-known/apple-app-site-association` with correct MIME type, (2) Associated Domains entitlement in Xcode (`applinks:app.welltrained.fitness`), (3) matching Team ID + Bundle ID in the AASA file, and (4) the AASA file must be accessible without redirects. If ANY link in this chain is wrong, Universal Links silently fail -- no error, no fallback, links just open in Safari.

**Why it happens:** Apple's AASA validation happens at app install time, is cached by the CDN, and only refreshes periodically. There's no way to force a refresh. The AASA file must be served with `Content-Type: application/json` (not `application/pkcs7-mime` which was the old format). Vercel's routing may interfere with serving the `.well-known` directory.

**Consequences:**
- Auth magic links open in Safari instead of the app
- Coach share links don't open the app
- Deep links to specific workouts don't work

**Prevention:**
1. **Host AASA file on Vercel** with proper configuration (add `vercel.json` route rule):
   ```json
   {
     "routes": [{
       "src": "/.well-known/apple-app-site-association",
       "headers": { "Content-Type": "application/json" }
     }]
   }
   ```
2. **Verify with Apple's validator:** `https://app-site-association.cdn-apple.com/a/v1/app.welltrained.fitness`
3. **Test on a real device** (not simulator) -- Universal Links do not work in the iOS Simulator
4. **Remember:** Universal Links only work when the user taps a link from another app (Safari, Mail, Messages). They do NOT work when typed directly into Safari's URL bar.
5. **Chrome as default browser breaks Universal Links** on iOS -- this is a known iOS limitation. Document this for users.

**Detection:** Magic link in email opens Safari instead of the app. Verify by checking `https://app-site-association.cdn-apple.com/a/v1/app.welltrained.fitness` returns valid JSON.

---

### 17. Splash Screen and App Icon Sizing Requirements

**Severity:** MINOR (but blocks submission)
**Phase:** App Store Preparation
**Confidence:** HIGH (verified via [Capacitor assets docs](https://capacitorjs.com/docs/guides/splash-screens-and-icons), [capacitor-assets tool](https://github.com/ionic-team/capacitor-assets))

**What goes wrong:** iOS requires very specific icon and splash screen sizes. A single wrong size or missing variant causes Xcode build warnings or App Store Connect upload failures. Required: 1024x1024 app icon (no alpha channel, no rounded corners -- Apple adds the rounding), splash screen source at least 2732x2732.

**Common mistakes:**
- Icon PNG has transparency/alpha channel -- App Store Connect rejects
- Icon has pre-applied rounded corners -- looks double-rounded on device
- Splash screen image has important content at edges -- gets cropped on different aspect ratios
- Missing required icon sizes in the asset catalog

**Prevention:**
1. **Use `@capacitor/assets`** to auto-generate all sizes:
   ```bash
   npx @capacitor/assets generate --iconBackgroundColor '#0a0a0a' --splashBackgroundColor '#0a0a0a'
   ```
2. Provide source files:
   - `assets/icon-only.png` (1024x1024, no alpha, no rounded corners)
   - `assets/splash.png` (2732x2732, center the logo, keep critical content in the center 1000x1000 safe zone)
   - `assets/splash-dark.png` (for dark mode splash)
3. **Verify in Xcode:** Open `ios/App/App/Assets.xcassets` and confirm no yellow warning triangles

**Detection:** App Store Connect upload fails with "Invalid Icon" error, or Xcode shows yellow warnings in the asset catalog.

---

### 18. iOS Swipe-Back Gesture Does Not Work With BrowserRouter

**Severity:** MINOR (UX polish issue)
**Phase:** Navigation Polish
**Confidence:** MEDIUM (based on [Capacitor discussion #3137](https://github.com/ionic-team/capacitor/discussions/3137), community reports)

**What goes wrong:** iOS users expect to swipe from the left edge to go back. With `BrowserRouter` and React Router v6, the native swipe-back gesture is tied to WKWebView's browser history, not React Router's navigation stack. Swiping back may navigate to an unexpected route, cause a blank page (if the browser history is out of sync with React Router), or navigate out of the SPA entirely.

**Trained-specific impact:** The app uses `BrowserRouter` in `main.tsx`. Navigation between screens (Dashboard, Workouts, Macros, etc.) uses React Router. The bottom nav provides navigation but users may expect iOS swipe-back to work between screens.

**Prevention:**
1. **Disable WKWebView's swipe navigation** in `capacitor.config.ts`:
   ```typescript
   ios: {
     allowsBackForwardNavigationGestures: false,
   }
   ```
2. This prevents the confusing partial-swipe-then-white-screen behavior.
3. The bottom tab navigation is the primary nav pattern for Trained, so swipe-back is not critical.
4. For screens that DO have back buttons (coach client detail, settings sub-screens), the in-app back button is sufficient.

**Detection:** User swipes from left edge, sees a white flash or navigates to an unexpected screen.

---

### 19. Live Reload server.url Left in Production Config

**Severity:** MINOR (but catastrophic if shipped)
**Phase:** Build Pipeline
**Confidence:** HIGH (verified via [Capacitor discussion #1478](https://github.com/ionic-team/capacitor/discussions/1478))

**What goes wrong:** During development, you configure `capacitor.config.ts` with a `server.url` pointing to your local Vite dev server (`http://192.168.1.x:5173`). If this is not removed before the production build, the App Store release will try to load from a development machine's IP address. The app shows a blank screen or connection error for every user.

**Prevention:**
1. **Never hardcode `server.url` in `capacitor.config.ts`** -- use environment-based configuration:
   ```typescript
   const config: CapacitorConfig = {
     appId: 'com.welltrained.fitness',
     appName: 'WellTrained',
     webDir: 'dist',
     server: process.env.CAPACITOR_LIVE_RELOAD ? {
       url: process.env.CAPACITOR_DEV_URL || 'http://localhost:5173',
       cleartext: true,
     } : undefined,
   }
   ```
2. **Add a CI check** that verifies `capacitor.config.ts` does not contain a `server.url` in production builds
3. **Add a pre-build validation script** that fails if server.url is present

**Detection:** App Store build shows white screen; all users affected.

---

### 20. Capacitor Plugin Version Mismatches

**Severity:** MINOR (but blocks builds)
**Phase:** Initial Setup
**Confidence:** HIGH (verified via [Capacitor docs](https://capacitorjs.com/docs/getting-started), community reports)

**What goes wrong:** Capacitor core and plugins must all be on the same major version. Installing `@capacitor/core@7` but `@capacitor/push-notifications@6` causes type errors, runtime crashes, or silent failures. The Capacitor ecosystem recently transitioned from v6 to v7, and many tutorials/examples mix versions.

**Prevention:**
1. **Pin all Capacitor packages to the same major version:**
   ```bash
   npm install @capacitor/core@latest @capacitor/cli@latest
   npm install @capacitor/ios@latest
   npm install @capacitor/push-notifications@latest @capacitor/haptics@latest \
     @capacitor/dialog@latest @capacitor/share@latest @capacitor/filesystem@latest \
     @capacitor/preferences@latest @capacitor/splash-screen@latest \
     @capacitor/status-bar@latest @capacitor/keyboard@latest @capacitor/app@latest
   ```
2. **Run `npx cap doctor`** after any plugin install to verify version compatibility
3. **Use `npm ls @capacitor/core`** to verify no duplicate versions in the dependency tree

**Detection:** TypeScript errors about incompatible types, or runtime error `Cannot read property 'Plugins' of undefined`.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| Initial Capacitor setup | Service worker conflicts (#1), viewport-fit missing (#14), plugin version mismatches (#20) | CRITICAL/MINOR | Disable PWA plugin for native builds, add viewport-fit=cover, pin versions |
| Data persistence | localStorage eviction (#2) | CRITICAL | Migrate Zustand persistence to Capacitor Preferences on native |
| Auth integration | Supabase redirect broken (#5) | CRITICAL | Universal Links + appUrlOpen listener + PKCE flow |
| Push notifications | One-shot permission (#4), APNs token confusion (#11) | CRITICAL/MOD | Pre-permission UI, decide FCM vs direct APNs early |
| UI migration | window.confirm fails (#6), keyboard issues (#12), scroll bounce (#13) | CRITICAL/MOD | Replace all confirms with Dialog plugin, configure Keyboard plugin |
| Native features | Haptics no-op (#15), export broken (#9) | MINOR/MOD | Replace navigator.vibrate with Haptics plugin, use Filesystem+Share |
| Analytics | Plausible fails in WebView (#8) | MODERATE | Use Events API or conditional script loading |
| Background handling | White screen after memory pressure (#7) | MODERATE | Aggressive state persistence, splash overlay on resume |
| Deep linking | Universal Links fragility (#16) | MINOR | AASA file on Vercel, real-device testing |
| App Store submission | Guideline 4.2 rejection (#3) | CRITICAL | Native features + detailed review notes |
| Build pipeline | Live reload URL in prod (#19), webDir misconfiguration (#10) | MINOR/MOD | Environment-based config, combined build+sync scripts |
| Navigation | Swipe-back gesture mismatch (#18) | MINOR | Disable WKWebView swipe navigation |
| App assets | Splash screen / icon sizing (#17) | MINOR | Use @capacitor/assets generator |

---

## Integration Pitfall Matrix: Existing Modules vs Capacitor

This maps each existing Trained module to its specific Capacitor integration risks.

| Existing Module | Files Affected | Capacitor Pitfall | Priority |
|----------------|----------------|-------------------|----------|
| `vite-plugin-pwa` + Workbox | `vite.config.ts`, `UpdatePrompt.tsx` | SW fails in WKWebView (#1) | Must fix before first build |
| Zustand `persist` (8 stores) | All files in `src/stores/` | localStorage eviction (#2) | Must fix before launch |
| `supabase.ts` (`detectSessionInUrl`) | `src/lib/supabase.ts`, `Auth.tsx` | Redirect broken (#5) | Must fix before launch |
| `window.confirm` (10 calls) | 6 files across screens | Silently fails (#6) | Must fix before launch |
| `haptics.ts` (`navigator.vibrate`) | `src/lib/haptics.ts` | No-op on iOS (#15) | Should fix (UX win) |
| Settings export (Blob+anchor) | `src/screens/Settings.tsx:182-197` | Download broken (#9) | Should fix (feature broken) |
| Settings import (FileReader) | `src/screens/Settings.tsx:268-278` | Likely works, needs testing | Test on device |
| Plausible script tag | `index.html:32` | Wrong domain / blocked (#8) | Should fix (analytics gap) |
| `BrowserRouter` | `src/main.tsx` | Swipe-back mismatch (#18) | Nice to fix |
| `index.css` safe area insets | `src/index.css:218,222` | Need viewport-fit=cover (#14) | Must fix (already half-done) |
| Sentry | `vite.config.ts`, `src/lib/sentry.ts` | Source maps need Capacitor config | Verify works |

---

## Sources

### Official Documentation
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [Capacitor Storage Guide](https://capacitorjs.com/docs/guides/storage)
- [Capacitor Deep Links Guide](https://capacitorjs.com/docs/guides/deep-links)
- [Capacitor Dialog Plugin](https://capacitorjs.com/docs/apis/dialog)
- [Capacitor Keyboard Plugin](https://capacitorjs.com/docs/apis/keyboard)
- [Capacitor Splash Screens and Icons](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
- [Capacitor Live Reload](https://capacitorjs.com/docs/guides/live-reload)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple: Asking Permission for Notifications](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications)
- [Supabase Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)

### GitHub Issues and Discussions (HIGH confidence)
- [Capacitor #7069: Service workers fail to register on iOS](https://github.com/ionic-team/capacitor/issues/7069)
- [Capacitor #4122: App-Bound Domains for Service Workers](https://github.com/ionic-team/capacitor/issues/4122)
- [Capacitor #7097: iOS white screen after background](https://github.com/ionic-team/capacitor/discussions/7097)
- [Capacitor #5260: WKWebView memory pressure handling](https://github.com/ionic-team/capacitor/discussions/5260)
- [Capacitor #1366: WebView jumps with keyboard](https://github.com/ionic-team/capacitor/issues/1366)
- [Capacitor #5907: WKWebView bouncing on iOS 16](https://github.com/ionic-team/capacitor/issues/5907)
- [Capacitor #1749: APNs token vs FCM token](https://github.com/ionic-team/capacitor/issues/1749)
- [Capacitor #636: localStorage lost on reboot](https://github.com/ionic-team/capacitor/issues/636)
- [Supabase #11548: OAuth redirects with Capacitor](https://github.com/orgs/supabase/discussions/11548)
- [Capacitor #6132: CapacitorHttp Blob upload fails](https://github.com/ionic-team/capacitor/issues/6132)

### Community / Analysis (MEDIUM confidence)
- [Apple Developer Forums: localStorage lost in WKWebView](https://developer.apple.com/forums/thread/742037)
- [Apple Developer Forums: Notification requestPermission always denied](https://developer.apple.com/forums/thread/725619)
- [mobiloud: App Store Review Guidelines for WebView Apps](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper)
- [capgo: Apple Policy Updates for Capacitor Apps 2025](https://capgo.app/blog/apple-policy-updates-for-capacitor-apps-2025/)
- [Thinktecture: iOS 14 ITP in WKWebView](https://www.thinktecture.com/en/ios/wkwebview-itp-ios-14/)
- [webapp2app: JavaScript dialogs in iOS WebView](https://www.webapp2app.com/2018/06/11/javascript-dialogs-like-alert-confirm-and-prompt-in-ios-webview-apps/)
- [Zustand #2418: Capacitor Preferences with persist](https://github.com/pmndrs/zustand/discussions/2418)
