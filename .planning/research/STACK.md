# Technology Stack: Capacitor iOS Native Shell

**Project:** Trained -- Capacitor iOS Native App
**Researched:** 2026-02-21

## Recommended Stack

### Capacitor Version Decision: 7.x (NOT 8.x)

**Use Capacitor 7.5.x** because the development machine runs macOS 14.7.6 (Sonoma) and Node v20.20.0.

| Constraint | Capacitor 7 | Capacitor 8 |
|---|---|---|
| Node.js | 20+ (current: v20.20.0) | 22+ (would require upgrade) |
| Xcode | 16.0+ (runs on macOS Sonoma 14.5+) | 26.0+ (requires macOS Sequoia 15.6+) |
| macOS | 14.5+ Sonoma (current: 14.7.6) | 15.6+ Sequoia (NOT installed) |
| iOS Deploy Target | iOS 14.0 | iOS 15.0 |
| Dependency Manager | CocoaPods (default) or SPM | SPM (default) |
| Status | Stable, actively maintained (7.5.0 latest) | Latest (8.1.0), but requires OS upgrade |

**IMPORTANT DEADLINE:** Apple mandates Xcode 26 + iOS 26 SDK for all App Store submissions after **April 28, 2026**. This means a macOS upgrade to Sequoia 15.6+ and migration to Capacitor 8.x will be required before that deadline. Starting with Capacitor 7 now and migrating to 8 before April 28 is the pragmatic path -- ship first, then upgrade.

**Confidence: HIGH** -- Version requirements verified via Capacitor official docs and npm registry.

### Core Framework

| Technology | Version | Purpose | Why |
|---|---|---|---|
| `@capacitor/core` | ^7.5.0 | Native runtime bridge | Core runtime for web-to-native communication |
| `@capacitor/cli` | ^7.5.0 | Build tooling (dev dep) | Generates iOS project, syncs web assets, runs native builds |
| `@capacitor/ios` | ^7.5.0 | iOS platform support | WKWebView container, native iOS project scaffolding |

### Push Notifications

| Technology | Version | Purpose | Why |
|---|---|---|---|
| `@capacitor/push-notifications` | ^7.0.3 | APNs token registration + notification handling | Official Capacitor plugin; on iOS returns raw APNs device token (NOT FCM token). No Firebase dependency needed for iOS-only. |

**Architecture decision: Direct APNs WITHOUT Firebase.** The `@capacitor/push-notifications` plugin on iOS registers with APNs directly and returns the native APNs device token. Since the existing backend is Supabase Edge Functions (not Firebase), the flow is:

1. App calls `PushNotifications.register()` -- gets APNs token
2. App stores token in Supabase `device_tokens` table
3. Supabase Edge Function sends push via APNs HTTP/2 API using `.p8` key
4. No Firebase project needed, no `google-services.json`, no FCM SDK

This avoids adding Firebase as a dependency entirely. Firebase is only required if targeting Android (for FCM), which is not in scope for this milestone.

**Confidence: MEDIUM** -- Multiple sources confirm iOS returns APNs token directly. The "no Firebase needed for iOS-only" claim needs validation during implementation since plugin internals may still import Firebase SDK.

### Native Haptics

| Technology | Version | Purpose | Why |
|---|---|---|---|
| `@capacitor/haptics` | ^7.0.1 | Native Taptic Engine feedback | Replaces `navigator.vibrate()` which is a no-op on iOS Safari/WKWebView. Uses UIImpactFeedbackGenerator and UINotificationFeedbackGenerator. |

**Integration with existing code:** The current `src/lib/haptics.ts` uses `navigator.vibrate()` with 5 intensity levels. The Capacitor Haptics API provides `impact()` (Light/Medium/Heavy), `notification()` (Success/Warning/Error), and `selectionStart/Changed/End()`. The haptics module will be rewritten to call Capacitor Haptics when native, falling back to `navigator.vibrate()` on web.

**Confidence: HIGH** -- Official Capacitor plugin, well-documented API.

### Native File Sharing

| Technology | Version | Purpose | Why |
|---|---|---|---|
| `@capacitor/share` | ^7.0.1 | Native iOS share sheet | Invokes UIActivityViewController for sharing files, text, URLs. Replaces the current DOM-based download approach. |
| `@capacitor/filesystem` | ^7.0.1 | Write files to device storage | Required to write export data to a temp file before sharing via Share plugin. Current approach uses Blob + createObjectURL + anchor click which does not work in WKWebView. |

**Integration with existing code:** The current `src/screens/Settings.tsx` exports data via `Blob` -> `URL.createObjectURL` -> anchor element click. This pattern does NOT work in Capacitor's WKWebView. The native flow will be: `Filesystem.writeFile()` to a temp path, then `Share.share({ files: [path] })` to invoke the iOS share sheet.

**Confidence: HIGH** -- Official Capacitor plugins, standard pattern documented by Capawesome.

### Platform Integration Plugins (Required by Pitfall Analysis)

These plugins were initially considered optional but pitfall analysis of the existing codebase revealed they are needed.

| Technology | Version | Purpose | Why Required |
|---|---|---|---|
| `@capacitor/app` | ^7.0.1 | App lifecycle events, URL open listener | Required for handling Universal Links (auth redirects), `appStateChange` events (background/foreground detection for sync). |
| `@capacitor/dialog` | ^7.0.1 | Native iOS confirm/alert dialogs | The codebase has 10 `window.confirm()` calls across 6 files. `window.confirm` can silently fail in WKWebView, returning `false` without showing a dialog. |
| `@capacitor/preferences` | ^7.0.1 | Native UserDefaults persistence | iOS can evict WKWebView localStorage under storage pressure. All 8 Zustand persisted stores must use native UserDefaults (via Preferences) on iOS to prevent data loss. |
| `@capacitor/keyboard` | ^7.0.1 | Keyboard show/hide events, resize mode | The app is input-heavy (macro logging, workout sets, coach notes). Without keyboard configuration, WKWebView resizes unpredictably and touch targets misalign after keyboard dismissal. |

**Confidence: HIGH** -- Each of these addresses a specific, verified pitfall with the existing codebase. See PITFALLS.md for detailed analysis.

### Plugins NOT Needed

| Plugin | Why Not |
|---|---|
| `@capacitor/local-notifications` | Not in scope. Push notifications come from server (coach actions, reminders). Local scheduling can be added later. |
| `@capacitor/camera` | No camera features in Trained. Check-in photos are future scope. |
| `@capacitor/geolocation` | No location features. |
| `@capacitor/browser` | In-app browser not needed; external links can use `window.open()`. |
| `@capacitor/splash-screen` | Capacitor 7 has built-in splash screen support via Xcode storyboard. Plugin only needed for programmatic control (post-launch). |
| `@capacitor/status-bar` | Capacitor 7 handles status bar via native configuration. Plugin only needed for dynamic changes. |
| `@capacitor-firebase/messaging` | Firebase not needed for iOS-only APNs. |
| `@ionic/pwa-elements` | Polyfills for Camera/Toast -- not needed since we use native plugins and Sonner. |

### Build Configuration

| Technology | Version | Purpose | Why |
|---|---|---|---|
| Xcode | 16.x (latest available on Sonoma) | iOS build toolchain | Required for compiling native iOS project. Install from App Store. |
| CocoaPods | latest | iOS dependency management | Default for Capacitor 7. SPM available but CocoaPods is more battle-tested at 7.x. Migrate to SPM when moving to Capacitor 8. |
| Apple Developer Program | $99/year | App Store distribution | Required for push notification certificates, provisioning profiles, and App Store submission. |
| `@capacitor/assets` | latest (dev dep) | Icon + splash screen generation | Auto-generates all required iOS icon sizes and splash screens from source images. |

**Confidence: HIGH** -- Standard Capacitor 7 requirements.

## Vite Build Integration

### How Capacitor Works with Vite

Capacitor does NOT replace or modify the Vite build. The relationship is:

1. `vite build` produces `dist/` as normal
2. `npx cap copy ios` copies `dist/` into the Xcode project's web assets folder
3. `npx cap sync ios` copies assets AND updates native plugins/dependencies
4. Xcode builds the native shell which embeds those web assets in WKWebView

The `capacitor.config.ts` simply points to the Vite output:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fitness.welltrained.app',
  appName: 'WellTrained',
  webDir: 'dist',
  ios: {
    backgroundColor: '#0a0a0a',
    allowsBackForwardNavigationGestures: false,
  },
  server: process.env.CAPACITOR_LIVE_RELOAD ? {
    url: process.env.CAPACITOR_DEV_URL || 'http://localhost:5173',
    cleartext: true,
  } : undefined,
};

export default config;
```

### vite-plugin-pwa + Capacitor Interaction (CRITICAL)

**Problem:** Service workers do NOT work in Capacitor's WKWebView on iOS. The `vite-plugin-pwa` generates a service worker that will fail to register, and worse, can interfere with Capacitor's native bridge injection.

**Solution:** Conditionally disable service worker registration when running inside Capacitor. Two approaches:

**Approach A (Recommended): Runtime detection in UpdatePrompt.tsx**

```typescript
import { Capacitor } from '@capacitor/core';

// In the service worker registration code:
if (!Capacitor.isNativePlatform()) {
  // Only register SW for web/PWA
  useRegisterSW(...)
}
```

**Approach B: Build-time exclusion via environment variable**

```typescript
// vite.config.ts
VitePWA({
  // Disable SW generation entirely for native builds
  disable: process.env.CAPACITOR_BUILD === 'true',
  ...
})
```

Approach A is preferred because it keeps a single build output that works for both web and native, avoiding separate build configurations.

**The web manifest and PWA assets are harmless** -- they are simply ignored by Capacitor. Only the service worker registration needs conditional gating.

**Confidence: HIGH** -- Multiple GitHub issues and official Capacitor docs confirm service workers don't work in WKWebView. The `Capacitor.isNativePlatform()` API is well-documented.

## Build Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "cap:sync": "npm run build && npx cap sync ios",
    "cap:open": "npx cap open ios",
    "cap:run": "npx cap run ios",
    "build:ios": "npm run build && npx cap copy ios"
  }
}
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|---|---|---|---|
| Native wrapper | Capacitor 7 | React Native | Total rewrite. Capacitor wraps existing web app as-is. |
| Native wrapper | Capacitor 7 | Tauri Mobile | Immature mobile support, smaller ecosystem, less iOS tooling. |
| Native wrapper | Capacitor 7 | Cordova | Deprecated in favor of Capacitor (same team, Ionic). |
| Native wrapper | Capacitor 7 | Capacitor 8 | Requires macOS Sequoia + Node 22. Upgrade before April 28, 2026 deadline. |
| Push delivery | Direct APNs | Firebase Cloud Messaging | Adds unnecessary Firebase dependency for iOS-only. FCM only needed if adding Android. |
| Push delivery | Direct APNs | OneSignal | Third-party dependency with usage-based pricing. Not needed for ~90k users with direct APNs. |
| Dependency mgmt | CocoaPods (Cap 7) | SPM (Cap 7 opt-in) | SPM support in Cap 7 is opt-in; CocoaPods is the tested default. Migrate to SPM with Cap 8. |
| File sharing | @capacitor/share + @capacitor/filesystem | @byteowls/capacitor-filesharer | Third-party plugin. Official plugins cover the same use case. |
| Data persistence | @capacitor/preferences | @capacitor-community/sqlite | Preferences uses UserDefaults (simple key-value, no eviction). SQLite is overkill for Zustand store data. |

## Installation

```bash
# Core Capacitor
npm install @capacitor/core@^7.5.0
npm install -D @capacitor/cli@^7.5.0

# iOS platform
npm install @capacitor/ios@^7.5.0

# Push notifications (APNs)
npm install @capacitor/push-notifications@^7.0.3

# Native haptics
npm install @capacitor/haptics@^7.0.1

# Native file sharing
npm install @capacitor/share@^7.0.1
npm install @capacitor/filesystem@^7.0.1

# Platform integration (required by pitfall analysis)
npm install @capacitor/app@^7.0.1
npm install @capacitor/dialog@^7.0.1
npm install @capacitor/preferences@^7.0.1
npm install @capacitor/keyboard@^7.0.1

# Asset generation (dev dependency)
npm install -D @capacitor/assets

# Initialize Capacitor
npx cap init WellTrained fitness.welltrained.app --web-dir dist

# Add iOS platform (generates ios/ directory with Xcode project)
npx cap add ios

# Install CocoaPods dependencies
cd ios/App && pod install && cd ../..

# First sync
npm run build && npx cap sync ios
```

**Total new dependencies: 10 runtime + 2 dev**

| Package | Size Impact | Category |
|---|---|---|
| `@capacitor/core` | ~50KB | Runtime (JS bridge) |
| `@capacitor/ios` | Native only | No JS bundle impact |
| `@capacitor/push-notifications` | ~15KB | Plugin |
| `@capacitor/haptics` | ~5KB | Plugin |
| `@capacitor/share` | ~5KB | Plugin |
| `@capacitor/filesystem` | ~10KB | Plugin |
| `@capacitor/app` | ~5KB | Plugin |
| `@capacitor/dialog` | ~5KB | Plugin |
| `@capacitor/preferences` | ~5KB | Plugin |
| `@capacitor/keyboard` | ~5KB | Plugin |

Estimated JS bundle overhead: ~105KB (pre-minification). Tree-shaking reduces this since web builds only use `isNativePlatform()` from core.

## Environment Prerequisites

| Requirement | Current State | Action Needed |
|---|---|---|
| macOS Sonoma 14.5+ | 14.7.6 | None (compatible with Xcode 16 + Capacitor 7) |
| Node.js 20+ | v20.20.0 | None (meets Capacitor 7 requirement) |
| Xcode 16.x | NOT installed (only CLI tools) | **Install from App Store** (~12GB disk space) |
| CocoaPods | Unknown | `sudo gem install cocoapods` or `brew install cocoapods` |
| Apple Developer Account | Unknown | **Enroll at developer.apple.com ($99/year)** |
| iOS device or Simulator | Unknown | Xcode includes iOS Simulator; physical device needs provisioning profile |

### Pre-April 2026 Upgrade Path

Before the April 28, 2026 deadline:
1. Upgrade macOS to Sequoia 15.6+
2. Install Xcode 26
3. Upgrade Node.js to 22+
4. Run `npx cap migrate` to upgrade Capacitor 7 -> 8
5. Migrate CocoaPods to SPM via `npx cap spm-migration-assistant`
6. Rebuild and test

## Sources

- [Capacitor Official Documentation](https://capacitorjs.com/docs)
- [Capacitor 7 Update Guide](https://capacitorjs.com/docs/updating/7-0)
- [Capacitor 8 Update Guide](https://capacitorjs.com/docs/updating/8-0)
- [Announcing Capacitor 8 - Ionic Blog](https://ionic.io/blog/announcing-capacitor-8)
- [Push Notifications API Docs](https://capacitorjs.com/docs/apis/push-notifications)
- [Haptics API Docs](https://capacitorjs.com/docs/apis/haptics)
- [Share API Docs](https://capacitorjs.com/docs/apis/share)
- [Filesystem API Docs](https://capacitorjs.com/docs/apis/filesystem)
- [Capacitor iOS + SPM](https://capacitorjs.com/docs/ios/spm)
- [CocoaPods Deprecation - Capgo](https://capgo.app/blog/ios-spm-vs-cocoapods-capacitor-migration-guide/)
- [Apple Privacy Manifest Requirements](https://capgo.app/blog/privacy-manifest-for-capacitor-apps-guide/)
- [Apple Xcode 26 Mandate - April 2026](https://developer.apple.com/news/upcoming-requirements/)
- [Supabase Push Notifications Guide](https://supabase.com/docs/guides/functions/examples/push-notifications)
- [Capacitor Service Worker Issue #7069](https://github.com/ionic-team/capacitor/issues/7069)
- [@capacitor/core npm](https://www.npmjs.com/package/@capacitor/core)
