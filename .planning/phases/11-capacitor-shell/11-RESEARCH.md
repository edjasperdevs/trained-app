# Phase 11: Capacitor Shell - Research

**Researched:** 2026-02-21
**Domain:** Capacitor 7 iOS native shell wrapping existing React + Vite PWA
**Confidence:** HIGH

## Summary

Phase 11 wraps the existing Trained PWA in a native iOS shell using Capacitor 7. The phase scope is deliberately narrow: get the app running in WKWebView with no browser chrome, disable the service worker for native builds, replace `window.confirm()` with native dialogs, and detect background/foreground transitions. This is the foundation that all subsequent native phases (push notifications, haptics, data persistence) build upon.

The existing codebase is well-suited for Capacitor wrapping. BrowserRouter, Zustand, Supabase client, Tailwind CSS, Radix UI, and all screen components work in WKWebView without modification. The app already has `env(safe-area-inset-*)` CSS in `src/index.css` (lines 218, 222) and `overscroll-behavior: none` (line 171), though the viewport meta tag is missing `viewport-fit=cover` which must be added for the safe area insets to take effect on notched iPhones.

**Primary recommendation:** Install Capacitor 7.5.0 core packages, create the iOS project, add `viewport-fit=cover`, guard the UpdatePrompt against service worker registration, create a shared `confirmAction()` utility to replace all 10 `window.confirm()` calls, and add `@capacitor/app` for background/foreground detection. Xcode must be installed first (not currently present -- only CLI tools exist).

## Standard Stack

### Core (Phase 11 only)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@capacitor/core` | 7.5.0 | Native runtime bridge, `Capacitor.isNativePlatform()` | Core runtime; all plugins depend on it |
| `@capacitor/cli` | 7.5.0 (dev) | `npx cap init`, `npx cap add ios`, `npx cap sync` | Build tooling for generating and syncing iOS project |
| `@capacitor/ios` | 7.5.0 | WKWebView container, iOS project scaffolding | Required for iOS platform |
| `@capacitor/dialog` | 7.0.4 | Native iOS confirm/alert dialogs | Replaces `window.confirm()` which can silently fail in WKWebView |
| `@capacitor/app` | 7.1.2 | `appStateChange` listener for background/foreground | Required by SHELL-05 for lifecycle detection |

### Not Needed for Phase 11

These are needed for later phases but NOT for the shell:

| Library | Phase | Why Deferred |
|---------|-------|-------------|
| `@capacitor/push-notifications` | Push Notifications phase | Not in SHELL requirements |
| `@capacitor/haptics` | Native Polish phase | Not in SHELL requirements |
| `@capacitor/preferences` | Data Persistence phase | localStorage works for initial shell validation |
| `@capacitor/keyboard` | Native Polish phase | Not in SHELL requirements |
| `@capacitor/filesystem` + `@capacitor/share` | Native Polish phase | Export not in scope |
| `@sentry/capacitor` | Observability phase | Not in SHELL requirements |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Capacitor 7.5.0 | Capacitor 8.1.0 | 8.x requires macOS Sequoia 15.6+ and Node 22+. Current machine: macOS 14.7.6 Sonoma, Node 20.20.0. Must upgrade OS first. |
| `@capacitor/dialog` | Keep `window.confirm()` | `window.confirm()` works in WKWebView most of the time via Capacitor's WKUIDelegate, but has edge cases where it silently returns `false`. The requirement SHELL-04 explicitly mandates native dialogs. |
| CocoaPods | SPM (Swift Package Manager) | SPM is opt-in for Capacitor 7; CocoaPods is the default. SPM becomes default in Capacitor 8. Use CocoaPods for now. |

**Installation:**

```bash
# Core Capacitor (5 packages for Phase 11)
npm install @capacitor/core@7.5.0 @capacitor/ios@7.5.0 @capacitor/dialog@7.0.4 @capacitor/app@7.1.2
npm install -D @capacitor/cli@7.5.0

# Initialize Capacitor project
npx cap init WellTrained fitness.welltrained.app --web-dir dist

# Add iOS platform (generates ios/ directory with Xcode project)
npx cap add ios

# Build web app and sync to iOS project
npm run build && npx cap sync ios
```

**Confidence: HIGH** -- All versions verified against npm registry on 2026-02-21. `@capacitor/core@7.5.0` is the latest 7.x release.

## Architecture Patterns

### Recommended Project Structure (new/modified files only)

```
trained-app/
  capacitor.config.ts         # NEW: Capacitor configuration
  ios/                        # NEW: Generated Xcode project (npx cap add ios)
    App/
      App/
        Assets.xcassets/      # App icons (can use defaults initially)
        Info.plist             # Auto-generated, may need viewport-fit
  src/
    lib/
      platform.ts             # NEW: isNative(), getPlatform() helpers
      confirm.ts              # NEW: confirmAction() wrapping Dialog/window.confirm
    components/
      UpdatePrompt.tsx         # MODIFY: guard with isNative() check
    App.tsx                    # MODIFY: add useAppLifecycle hook
  index.html                  # MODIFY: add viewport-fit=cover to viewport meta
```

### Pattern 1: Platform Detection Module

**What:** Single source of truth for runtime platform detection via `@capacitor/core`.
**When to use:** Every time code needs to branch between web and native behavior.
**Example:**

```typescript
// src/lib/platform.ts (NEW)
import { Capacitor } from '@capacitor/core'

export const isNative = (): boolean => Capacitor.isNativePlatform()
export const getPlatform = (): 'ios' | 'android' | 'web' => Capacitor.getPlatform() as any
export const isIOS = (): boolean => getPlatform() === 'ios'
```

**Why:** Isolates all `@capacitor/core` imports to one place. Components never import from `@capacitor/*` directly -- they go through `src/lib/` modules.

**Confidence: HIGH** -- `Capacitor.isNativePlatform()` and `Capacitor.getPlatform()` are documented stable API since Capacitor 3.

### Pattern 2: Async Confirm Wrapper

**What:** Replace synchronous `window.confirm()` with an async wrapper that uses `@capacitor/dialog` on native and falls back to `window.confirm()` on web.
**When to use:** Every destructive confirmation dialog.

```typescript
// src/lib/confirm.ts (NEW)
import { Dialog } from '@capacitor/dialog'
import { isNative } from './platform'

/**
 * Platform-aware confirmation dialog.
 * Native: uses iOS UIAlertController via @capacitor/dialog
 * Web: uses window.confirm()
 *
 * IMPORTANT: This is async. All call sites must use `await`.
 */
export async function confirmAction(
  message: string,
  title = 'Confirm'
): Promise<boolean> {
  if (isNative()) {
    const { value } = await Dialog.confirm({ title, message })
    return value
  }
  return window.confirm(message)
}
```

**Migration pattern for call sites:**

```typescript
// BEFORE (synchronous):
if (window.confirm('Delete this meal entry?')) {
  onDeleteMeal(meal.id)
}

// AFTER (async):
const confirmed = await confirmAction('Delete this meal entry?', 'Delete Meal')
if (confirmed) {
  onDeleteMeal(meal.id)
}
```

**Key constraint:** Changing from sync to async means:
- Event handler functions must become `async`
- Inline `onClick` handlers like `onClick={() => { if (window.confirm(...)) ... }}` become `onClick={async () => { if (await confirmAction(...)) ... }}`
- React event handlers support async functions (no issues with this pattern)

**Confidence: HIGH** -- Dialog.confirm() API verified from official Capacitor docs. Returns `Promise<{ value: boolean }>`.

### Pattern 3: Conditional Service Worker Registration

**What:** Prevent the `useRegisterSW` hook from executing when running inside Capacitor's WKWebView.
**When to use:** The `UpdatePrompt` component.

```typescript
// src/components/UpdatePrompt.tsx (MODIFY)
import { isNative } from '@/lib/platform'

// Separate component that only renders on web
// This avoids the conditional hook problem (useRegisterSW is a hook)
function WebUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-32 left-4 right-4 z-50 animate-in slide-in-from-bottom">
      {/* ... existing UI unchanged ... */}
    </div>
  )
}

export function UpdatePrompt() {
  // Service workers don't exist in WKWebView -- skip entirely
  if (isNative()) return null
  return <WebUpdatePrompt />
}
```

**Why two components:** `useRegisterSW` is a React hook from `virtual:pwa-register/react`. Hooks cannot be called conditionally. By splitting into a wrapper + inner component, the hook is only called when the inner component mounts (web only). Since `isNative()` never changes during a session (always native or always web), this is safe.

**Note:** The `vite-plugin-pwa` configuration in `vite.config.ts` stays UNCHANGED. The service worker file is still generated in `dist/` (needed for the web PWA build deployed to Vercel). It simply never gets registered when running inside Capacitor.

**Confidence: HIGH** -- Verified that WKWebView does not support service workers on `capacitor://` scheme. The `useRegisterSW` hook import from `virtual:pwa-register/react` will still resolve at build time (the module exists in the bundle) but won't execute on native.

### Pattern 4: Native App Lifecycle Listener

**What:** Use `@capacitor/app`'s `appStateChange` event to detect background/foreground transitions, supplementing the existing `visibilitychange` listener.
**When to use:** App initialization.

```typescript
// In App.tsx or a dedicated hook
import { App as CapApp } from '@capacitor/app'
import { isNative } from '@/lib/platform'

// Inside AppContent component's existing lifecycle useEffect:
useEffect(() => {
  if (!isNative()) return

  const listener = CapApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      console.log('[Capacitor] App resumed to foreground')
      // Trigger sync on foreground resume (mirrors existing visibilitychange logic)
      const elapsed = Date.now() - lastHidden
      if (elapsed > 30_000 && navigator.onLine) {
        pullCoachData()
        flushPendingSync()
      }
    } else {
      console.log('[Capacitor] App went to background')
      lastHidden = Date.now()
    }
  })

  return () => { listener.then(l => l.remove()) }
}, [])
```

**Relationship to existing code:** The existing `visibilitychange` listener in `App.tsx` (lines 67-88) continues to work on both web and native. The Capacitor `appStateChange` listener is ADDITIVE -- it provides a more reliable signal for native app lifecycle events (iOS sends proper `UIApplicationDidBecomeActive`/`UIApplicationWillResignActive` notifications). Both can coexist.

**Confidence: HIGH** -- `App.addListener('appStateChange', ...)` API verified from official Capacitor docs. Returns `PluginListenerHandle` with `remove()` for cleanup.

### Anti-Patterns to Avoid

- **Conditional hooks:** Never call `useRegisterSW` inside an `if` block. Split into wrapper + inner component instead.
- **Separate Vite configs for web vs native:** One build, runtime detection. No `CAPACITOR_BUILD` env var needed for Phase 11.
- **Replacing BrowserRouter with HashRouter:** BrowserRouter works in Capacitor's WKWebView. This is a Cordova-era myth.
- **Hardcoding `server.url` in capacitor.config.ts:** Use environment-based config for live reload (see Don't Hand-Roll section).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Native confirmation dialogs | Custom modal component mimicking iOS alerts | `@capacitor/dialog` | Plugin uses real `UIAlertController`. Looks, feels, and behaves exactly like native iOS alerts. |
| Platform detection | `window.navigator.userAgent` parsing | `Capacitor.isNativePlatform()` | User agent can be spoofed/unreliable. Capacitor injects its bridge and knows definitively. |
| Background/foreground detection | `document.visibilitychange` only | `@capacitor/app` `appStateChange` | `visibilitychange` is unreliable in WKWebView for true app backgrounding. Native events fire from `UIApplication` delegate. |
| iOS project scaffolding | Manual Xcode project creation | `npx cap add ios` | Generates properly configured Xcode project with WKWebView setup, bridge injection, and Info.plist. |

**Key insight:** Capacitor's value is bridging web APIs to native. For Phase 11, the three bridges are: platform detection (core), dialogs (Dialog plugin), and lifecycle events (App plugin). Everything else stays web.

## Common Pitfalls

### Pitfall 1: Xcode Not Installed

**What goes wrong:** `npx cap add ios` fails because Xcode is not installed (only Command Line Tools exist).
**Why it happens:** The development machine at `/Library/Developer/CommandLineTools` has CLI tools but no Xcode.app. `xcodebuild -version` returns macOS info but no Xcode version.
**How to avoid:** Install Xcode 16.x from the App Store BEFORE running any Capacitor iOS commands. This is a ~12GB download. After install, run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` and accept the license with `sudo xcodebuild -license accept`.
**Warning signs:** `xcode-select -p` returns `/Library/Developer/CommandLineTools` instead of `/Applications/Xcode.app/Contents/Developer`.
**Current state:** Xcode is NOT installed. This is a blocker for the entire phase.

### Pitfall 2: CocoaPods Version Too Old

**What goes wrong:** `npx cap sync ios` fails during `pod install` because CocoaPods 1.9.3 is too old for Capacitor 7 pods.
**Why it happens:** CocoaPods 1.9.3 (from 2020) is installed via Ruby 2.5.1 (`/Users/ejasper/.rvm/rubies/ruby-2.5.1/bin/pod`). Capacitor 7 requires CocoaPods 1.13+.
**How to avoid:** Update CocoaPods: `sudo gem install cocoapods` or `brew install cocoapods`. If using Homebrew, ensure the brew version is on PATH before the rvm version.
**Warning signs:** `pod install` fails with syntax errors or "Unable to find a specification" for `@capacitor/ios` pods.

### Pitfall 3: Service Worker Registration in WKWebView

**What goes wrong:** The `useRegisterSW()` hook in `UpdatePrompt.tsx` attempts to register a service worker, which fails silently in WKWebView. The `needRefresh` state may be undefined, causing React errors.
**Why it happens:** WKWebView uses the `capacitor://localhost` scheme which does not support service workers. The `navigator.serviceWorker` API may be undefined or throw.
**How to avoid:** Guard `UpdatePrompt` with `isNative()` check (Pattern 3 above). The guard must prevent the `useRegisterSW` hook from being called at all.
**Warning signs:** Console error `navigator.serviceWorker is undefined` on app launch in Capacitor.

### Pitfall 4: Missing viewport-fit=cover

**What goes wrong:** App appears letterboxed with black bars at top/bottom on iPhones with notch or Dynamic Island.
**Why it happens:** The current viewport meta tag is `width=device-width, initial-scale=1.0` without `viewport-fit=cover`. The existing `env(safe-area-inset-*)` CSS in `index.css` only works when `viewport-fit=cover` is set.
**How to avoid:** Update `index.html` viewport meta tag to include `viewport-fit=cover`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```
**Warning signs:** Content does not extend behind the status bar or home indicator. Safe area padding has no visible effect.

### Pitfall 5: window.confirm() Async Migration Breaks Event Flow

**What goes wrong:** After converting `window.confirm()` to `await confirmAction()`, some event handlers don't work correctly because the async/await changes the timing.
**Why it happens:** `window.confirm()` is synchronous and blocks the thread. `Dialog.confirm()` is async. In event handlers, code after `await` runs in a microtask. This generally works fine, but can cause issues with:
- Event propagation being stopped too late
- React batching behavior differences
- Multiple rapid taps triggering the dialog twice
**How to avoid:** Test each of the 10 call sites after migration. Ensure event handlers are properly marked `async`. For rapid-tap protection, disable the button while the dialog is showing.
**Warning signs:** Dialog appears twice, or action fires before dialog is dismissed.

### Pitfall 6: Live Reload URL Left in capacitor.config.ts

**What goes wrong:** Production build tries to load from `http://192.168.x.x:5173` instead of bundled assets.
**Why it happens:** Developer sets `server.url` for live reload during development and forgets to remove it.
**How to avoid:** Use environment variable pattern so `server` config is `undefined` by default (see capacitor.config.ts example in Architecture section).
**Warning signs:** App shows connection error or white screen when not on development WiFi.

## Code Examples

### capacitor.config.ts (complete configuration for Phase 11)

```typescript
// capacitor.config.ts (NEW - project root)
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'fitness.welltrained.app',
  appName: 'WellTrained',
  webDir: 'dist',
  ios: {
    backgroundColor: '#0a0a0a',  // Match app background to prevent white flash
    allowsBackForwardNavigationGestures: false,  // Prevent swipe-back confusion with React Router
  },
  // Live reload: only active when env var is set (never in production)
  server: process.env.CAPACITOR_LIVE_RELOAD ? {
    url: process.env.CAPACITOR_DEV_URL || 'http://localhost:5173',
    cleartext: true,
  } : undefined,
}

export default config
```

**Source:** Capacitor Configuration docs + project-level ARCHITECTURE.md

### index.html viewport update

```html
<!-- BEFORE -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- AFTER -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**Impact:** Safe for web PWA (no-op on non-notched devices). Activates the existing `env(safe-area-inset-*)` CSS in `src/index.css`.

### package.json build scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:web": "tsc -b && vite build",
    "build:ios": "tsc -b && vite build && npx cap sync ios",
    "cap:open": "npx cap open ios",
    "cap:sync": "npx cap sync ios",
    "cap:run": "npx cap run ios"
  }
}
```

**Notes:**
- `build:web` is an alias for the existing `build` command (for clarity in dual-pipeline context)
- `build:ios` runs the same Vite build, then copies output to the Xcode project via `npx cap sync`
- `cap:open` launches Xcode with the iOS project
- `cap:run` builds and runs on simulator (requires Xcode)

### All window.confirm() call sites (exact locations)

| # | File | Line | Context | Async Impact |
|---|------|------|---------|-------------|
| 1 | `src/screens/Settings.tsx` | 281 | Delete ALL progress (destructive) | Handler `handleResetProgress` must become async |
| 2 | `src/screens/Workouts.tsx` | 171 | End workout with no completed sets | Handler logic after confirm must use await |
| 3 | `src/screens/Workouts.tsx` | 861 | Reset exercises to defaults | Inline onClick must become async |
| 4 | `src/screens/Macros.tsx` | 595 | Delete meal entry | Inline onClick must become async |
| 5 | `src/screens/Macros.tsx` | 1230 | Delete saved meal | Inline onClick must become async |
| 6 | `src/screens/Coach.tsx` | 136 | Release macro targets to client | Handler `handleRevert` is already async |
| 7 | `src/screens/Coach.tsx` | 796 | Delete template | Handler `handleDeleteTemplate` is already async |
| 8 | `src/screens/Coach.tsx` | 807 | Remove assigned workout | Handler `handleDeleteAssignment` is already async |
| 9 | `src/components/WorkoutAssigner.tsx` | 70 | Replace existing workout assignment | Handler is already async |
| 10 | `src/screens/Onboarding.tsx` | 191 | Skip onboarding setup | Handler `handleSkip` must become async |

**Of the 10 call sites:** 4 are already in async functions (Coach.tsx x3, WorkoutAssigner.tsx x1). The remaining 6 need their containing functions changed to async.

### App lifecycle detection (SHELL-05)

```typescript
// Addition to App.tsx (inside AppContent component)
import { App as CapApp } from '@capacitor/app'
import { isNative } from '@/lib/platform'

// Add this useEffect alongside existing online/offline/visibilitychange listeners
useEffect(() => {
  if (!isNative()) return

  let lastBackground = 0

  const listener = CapApp.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      lastBackground = Date.now()
    } else {
      // Returning from background after 30+ seconds: trigger sync
      const elapsed = Date.now() - lastBackground
      if (elapsed > 30_000 && navigator.onLine) {
        pullCoachData()
        flushPendingSync()
      }
    }
  })

  return () => { listener.then(l => l.remove()) }
}, [])
```

**Relationship to existing code:** The existing `visibilitychange` listener (App.tsx lines 67-88) stays unchanged and continues to work on web. On native, BOTH listeners fire, but the Capacitor listener is more reliable for true iOS app backgrounding (covers scenarios where `visibilitychange` doesn't fire, like home button press).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cordova | Capacitor | 2019+ | Modern WKWebView (not UIWebView), TypeScript-first, npm-based plugins |
| Capacitor 6 | Capacitor 7 (used here) | 2025 | Node 20+ support, improved iOS 17+ compatibility |
| Capacitor 7 | Capacitor 8 | 2026 | Requires macOS 15.6+, Node 22+, SPM default. Not usable on current machine. |
| CocoaPods | SPM (Capacitor 8) | 2026 | CocoaPods deprecated in favor of SPM. Capacitor 7 still uses CocoaPods by default. |

**Deadline:** Apple mandates Xcode 26 for App Store submissions after April 28, 2026. This requires macOS Sequoia 15.6+ and will likely require Capacitor 8. Ship with Capacitor 7 now, upgrade before deadline.

## Environment Prerequisites

| Requirement | Current State | Action Needed | Blocker? |
|-------------|---------------|---------------|----------|
| macOS 14.5+ (Sonoma) | 14.7.6 | None | No |
| Node.js 20+ | v20.20.0 | None | No |
| npm 10+ | 10.8.2 | None | No |
| Xcode 16.x | **NOT INSTALLED** (only CLI tools) | Install from App Store (~12GB) | **YES** |
| CocoaPods 1.13+ | 1.9.3 (too old, Ruby 2.5.1) | Upgrade via `sudo gem install cocoapods` or `brew install cocoapods` | **YES** |
| Apple Developer Account | Unknown | Enroll at developer.apple.com ($99/year) | For device testing/distribution only |
| iOS Simulator | Comes with Xcode | Will be available after Xcode install | No |

**Critical blockers:** Xcode installation and CocoaPods upgrade must happen before any Capacitor iOS work can begin. These are prerequisites for the first plan.

## Existing CSS Already Handled

The codebase already has several iOS-friendly CSS properties that will work correctly once `viewport-fit=cover` is added:

| CSS Property | Location | Status |
|-------------|----------|--------|
| `env(safe-area-inset-bottom)` | `src/index.css:218` | Ready (needs viewport-fit=cover) |
| `env(safe-area-inset-top)` | `src/index.css:222` | Ready (needs viewport-fit=cover) |
| `overscroll-behavior: none` | `src/index.css:171` | Already set correctly |
| `overscroll-behavior-y: contain` | `src/index.css:172` | Already set correctly |
| `touch-action: manipulation` | `src/index.css:173` | Already set correctly |
| `min-height: 100dvh` | `src/index.css:170` | Already set correctly |
| Dark background (#0a0a0a) | `src/index.css:14` via `--background` | Matches `ios.backgroundColor` in capacitor.config.ts |

## .gitignore Additions

The `ios/` directory generated by `npx cap add ios` should be committed to git (it's the native project). However, derived data and build artifacts should be ignored:

```
# Capacitor iOS
ios/App/Pods/
ios/App/App.xcworkspace/xcuserdata/
ios/App/DerivedData/
ios/.build/
```

## Open Questions

1. **Apple Developer Account status**
   - What we know: Required for device testing and App Store distribution
   - What's unclear: Whether the user already has an Apple Developer account enrolled
   - Recommendation: Not a blocker for simulator-based Phase 11 work. Can test on simulator without it. Needed before Phase 13 (App Store submission).

2. **Bundle ID format**
   - What we know: Using `fitness.welltrained.app` (reverse domain: `app.welltrained.fitness`)
   - What's unclear: Whether this bundle ID is already registered in App Store Connect
   - Recommendation: Use `fitness.welltrained.app` as planned. Can be registered when Apple Developer account is set up.

3. **Capacitor 7 to 8 migration timeline**
   - What we know: Apple Xcode 26 mandate is April 28, 2026 (~2 months away). Capacitor 8 requires macOS Sequoia + Node 22.
   - What's unclear: Exact migration effort and testing time
   - Recommendation: Ship v1.5 with Capacitor 7. Plan OS + toolchain upgrade as a dedicated task before April deadline.

## Sources

### Primary (HIGH confidence)
- npm registry -- `@capacitor/core@7.5.0`, `@capacitor/ios@7.5.0`, `@capacitor/cli@7.5.0`, `@capacitor/dialog@7.0.4`, `@capacitor/app@7.1.2` (verified versions via `npm view`)
- [Capacitor Getting Started](https://capacitorjs.com/docs/getting-started) -- installation steps, project init
- [Capacitor Dialog Plugin API](https://capacitorjs.com/docs/apis/dialog) -- `confirm()` signature, parameters, return type
- [Capacitor App Plugin API](https://capacitorjs.com/docs/apis/app) -- `appStateChange` listener, `AppState.isActive`
- Codebase analysis -- all 10 `window.confirm()` call sites identified via grep
- Codebase analysis -- `UpdatePrompt.tsx` uses `useRegisterSW` from `virtual:pwa-register/react`
- Codebase analysis -- existing `visibilitychange` listener in `App.tsx:67-88`
- Codebase analysis -- existing safe area CSS in `index.css:218,222`

### Secondary (MEDIUM confidence)
- Project-level research docs: `.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md` -- thorough prior research on Capacitor 7 integration patterns

### Tertiary (LOW confidence)
- None. All findings verified against codebase + npm registry + official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- versions verified via `npm view`, API verified via official docs
- Architecture: HIGH -- patterns based on direct codebase analysis and verified Capacitor APIs
- Pitfalls: HIGH -- Xcode/CocoaPods state verified on actual machine, SW behavior well-documented
- Call site inventory: HIGH -- exact file/line numbers from grep of current codebase

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable -- Capacitor 7 is in maintenance mode, unlikely to change)
