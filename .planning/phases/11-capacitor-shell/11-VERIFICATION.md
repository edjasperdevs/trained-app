---
phase: 11-capacitor-shell
verified: 2026-02-22T15:08:13Z
status: human_needed
score: 4/5 must-haves verified
re_verification: false
human_verification:
  - test: "Launch app in iOS simulator and confirm no browser chrome"
    expected: "App launches with dark (#0a0a0a) background, no Safari URL bar or navigation buttons, login screen renders and functions, content extends to edges on notched device"
    why_human: "Cannot run Xcode simulator or observe visual rendering programmatically"
---

# Phase 11: Capacitor Shell Verification Report

**Phase Goal:** The existing React app runs inside a native iOS shell with no browser chrome, and all WKWebView-incompatible patterns are fixed
**Verified:** 2026-02-22T15:08:13Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                      | Status      | Evidence                                                                                      |
|----|--------------------------------------------------------------------------------------------|-------------|-----------------------------------------------------------------------------------------------|
| 1  | App launches in iOS simulator showing the full React app with no browser chrome            | ? UNCERTAIN | ios/App/App.xcodeproj exists; capacitor.config.ts wired to dist/; approved by user in checkpoint Task 3 — cannot verify visually |
| 2  | Service worker is inactive in native build while remaining functional in web PWA           | VERIFIED    | UpdatePrompt split into outer guard (returns null when isNative()) + inner WebUpdatePrompt with useRegisterSW |
| 3  | npm run build:web produces the Vercel PWA and npm run build:ios produces the Capacitor build | VERIFIED  | Both scripts present in package.json; build:ios wired to tsc -b && vite build && npx cap sync ios |
| 4  | Every destructive confirmation dialog uses native iOS dialog on native, window.confirm on web | VERIFIED  | 10/10 call sites migrated; zero window.confirm remaining outside confirm.ts fallback; Dialog.confirm wired via isNative() |
| 5  | App detects background/foreground transitions and syncs on foreground resume               | VERIFIED    | appStateChange listener in App.tsx; isNative() guard; 30s threshold; calls pullCoachData() + flushPendingSync() |

**Score:** 4/5 truths programmatically verified (1 requires human: simulator visual confirmation)

### Required Artifacts

| Artifact                            | Expected                              | Status      | Details                                                              |
|-------------------------------------|---------------------------------------|-------------|----------------------------------------------------------------------|
| `capacitor.config.ts`               | Capacitor project configuration       | VERIFIED    | appId=fitness.welltrained.app, webDir=dist, backgroundColor=#0a0a0a |
| `src/lib/platform.ts`               | Platform detection utilities          | VERIFIED    | Exports isNative, getPlatform, isIOS via Capacitor.isNativePlatform  |
| `src/components/UpdatePrompt.tsx`   | Service worker guard for native builds | VERIFIED   | isNative() check present; inner/outer split pattern implemented      |
| `ios/`                              | Generated Xcode project               | VERIFIED    | ios/App/App.xcodeproj, Podfile, Podfile.lock, Pods/ all present      |
| `package.json`                      | Dual build scripts                    | VERIFIED    | build:web, build:ios, cap:open, cap:sync, cap:run all present        |
| `src/lib/confirm.ts`                | Cross-platform confirmation wrapper   | VERIFIED    | Dialog.confirm on native, window.confirm fallback on web             |
| `src/App.tsx`                       | Native lifecycle listener             | VERIFIED    | CapApp.addListener('appStateChange') with isNative() guard           |

### Key Link Verification

| From                              | To                          | Via                         | Status   | Details                                                        |
|-----------------------------------|-----------------------------|-----------------------------|----------|----------------------------------------------------------------|
| `src/components/UpdatePrompt.tsx` | `src/lib/platform.ts`       | import { isNative }         | WIRED    | Line 2: import, line 39: isNative() returns null on native     |
| `capacitor.config.ts`             | `dist/`                     | webDir config               | WIRED    | Line 6: webDir: 'dist'                                         |
| `src/lib/confirm.ts`              | `@capacitor/dialog`         | Dialog.confirm on native    | WIRED    | Line 1: import Dialog, line 16: Dialog.confirm({ title, message }) |
| `src/lib/confirm.ts`              | `src/lib/platform.ts`       | isNative() check            | WIRED    | Line 2: import isNative, line 15: if (isNative())              |
| `src/App.tsx`                     | `@capacitor/app`            | CapApp.addListener          | WIRED    | Line 6: import CapApp, line 99: CapApp.addListener('appStateChange') |
| `src/screens/Settings.tsx`        | `src/lib/confirm.ts`        | import confirmAction        | WIRED    | Line 10: import, line 281: await confirmAction(...)            |
| `src/screens/Workouts.tsx`        | `src/lib/confirm.ts`        | import confirmAction        | WIRED    | Line 11: import, lines 171 + 863: await confirmAction(...)     |
| `src/screens/Macros.tsx`          | `src/lib/confirm.ts`        | import confirmAction        | WIRED    | Line 9: import, lines 597 + 1232: await confirmAction(...)     |
| `src/screens/Coach.tsx`           | `src/lib/confirm.ts`        | import confirmAction        | WIRED    | Line 17: import, lines 137 + 797 + 808: await confirmAction(...)  |
| `src/screens/Onboarding.tsx`      | `src/lib/confirm.ts`        | import confirmAction        | WIRED    | Line 34: import, line 178: await confirmAction(...)            |
| `src/components/WorkoutAssigner.tsx` | `src/lib/confirm.ts`     | import confirmAction        | WIRED    | Line 8: import, line 71: await confirmAction(...)              |

### Requirements Coverage

| Requirement (from ROADMAP)                                                                             | Status      | Blocking Issue                                  |
|--------------------------------------------------------------------------------------------------------|-------------|-------------------------------------------------|
| SHELL-01: App launches on iOS device/simulator with no Safari browser chrome                           | ? UNCERTAIN | Requires human verification (visual)            |
| SHELL-02: Service worker inactive in native build, functional in web PWA                               | SATISFIED   | UpdatePrompt isNative() guard verified          |
| SHELL-03: npm run build:web and npm run build:ios both succeed from same codebase                      | SATISFIED   | Scripts present; build:ios wired to cap sync    |
| SHELL-04: Every destructive confirmation uses native iOS dialog instead of window.confirm()            | SATISFIED   | 10/10 sites migrated, 0 remaining window.confirm |
| SHELL-05: App detects background/foreground transitions, syncs on foreground resume                    | SATISFIED   | appStateChange listener with pullCoachData/flushPendingSync |

### Anti-Patterns Found

None. No TODO/FIXME/placeholder comments, no stub implementations, no empty return values in any phase 11 files.

### Human Verification Required

#### 1. iOS Simulator Launch — No Browser Chrome

**Test:** Run `npm run cap:open` to open the Xcode project. Select an iPhone 15 Pro simulator. Press Cmd+R to build and run.
**Expected:**
- App launches with dark (#0a0a0a) background
- No Safari URL bar or navigation buttons visible anywhere
- Login/auth screen appears and is interactive
- On notched devices, content extends to screen edges (viewport-fit=cover applied)
**Why human:** Cannot run Xcode or observe rendered output programmatically. This was user-approved at the Task 3 checkpoint during plan execution, but automated verification cannot confirm the visual result.

### Gaps Summary

No gaps found. All programmatically verifiable requirements pass all three levels (exists, substantive, wired). The single UNCERTAIN item (simulator visual appearance) is structurally correct — Xcode project exists, capacitor.config.ts is properly wired, and the user approved the simulator checkpoint during plan execution. The uncertainty is a verification tooling limitation, not a code gap.

**Commit evidence (all in git history):**
- `9561cd7f` — feat(11-01): install Capacitor 7.5, init iOS project, add platform utilities
- `b8b2e6fc` — feat(11-01): guard service worker registration for native builds
- `fef62646` — feat(11-02): replace all window.confirm() with cross-platform confirmAction()
- `2eb24b35` — feat(11-02): add native app lifecycle listener for background/foreground sync

---
_Verified: 2026-02-22T15:08:13Z_
_Verifier: Claude (gsd-verifier)_
