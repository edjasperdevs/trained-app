---
phase: 11-capacitor-shell
plan: 01
subsystem: infra
tags: [capacitor, ios, wkwebview, native, pwa, service-worker, vite]

# Dependency graph
requires: []
provides:
  - "Capacitor 7.5 iOS project with working simulator build"
  - "Platform detection utilities (isNative, getPlatform, isIOS)"
  - "Service worker guard for native builds"
  - "Dual build pipeline (build:web for Vercel PWA, build:ios for Capacitor)"
affects: [11-capacitor-shell, 12-native-plugins, 13-push-notifications]

# Tech tracking
tech-stack:
  added: ["@capacitor/core@7.5.0", "@capacitor/ios@7.5.0", "@capacitor/cli@7.5.0", "@capacitor/dialog@7.0.4", "@capacitor/app@7.1.2"]
  patterns: ["platform detection via Capacitor.isNativePlatform()", "conditional service worker registration", "inner/outer component split for hook guarding"]

key-files:
  created: ["capacitor.config.ts", "src/lib/platform.ts", "ios/"]
  modified: ["package.json", "index.html", ".gitignore", "src/components/UpdatePrompt.tsx"]

key-decisions:
  - "Capacitor 7.5.0 (not 8.x) due to macOS 14.7 Sonoma + Node 20 constraints"
  - "Split UpdatePrompt into outer guard + inner WebUpdatePrompt to avoid conditional hook calls"
  - "viewport-fit=cover added for safe area support on notched devices"
  - "Live reload via CAPACITOR_LIVE_RELOAD env var for development workflow"

patterns-established:
  - "Platform detection: import { isNative } from '@/lib/platform' as the canonical way to branch native vs web"
  - "Hook guarding: outer component checks isNative() and returns null, inner component contains hooks"

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 11 Plan 01: Capacitor Shell Summary

**Capacitor 7.5 iOS project with WKWebView shell, platform detection utilities, and service worker guard for dual web/native builds**

## Performance

- **Duration:** ~5 min (automated tasks) + user verification checkpoint
- **Started:** 2026-02-22T14:11:00Z
- **Completed:** 2026-02-22T14:42:00Z
- **Tasks:** 3
- **Files modified:** 24

## Accomplishments
- Capacitor 7.5 iOS project initialized with correct appId (fitness.welltrained.app), dark background, and safe area viewport
- Platform detection module (isNative/getPlatform/isIOS) established as canonical native-vs-web branching pattern
- Service worker registration guarded for native builds using inner/outer component split (React hook rules compliant)
- Dual build pipeline: `build:web` for Vercel PWA, `build:ios` for Capacitor native, both from the same codebase
- App verified launching in iOS simulator with no browser chrome

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Capacitor packages, create config, init iOS project, add build scripts** - `9561cd7f` (feat)
2. **Task 2: Guard service worker for native builds** - `b8b2e6fc` (feat)
3. **Task 3: Verify app launches in iOS simulator** - checkpoint:human-verify (approved by user)

## Files Created/Modified
- `capacitor.config.ts` - Capacitor project config (appId, webDir, iOS background color, optional live reload)
- `src/lib/platform.ts` - Platform detection utilities (isNative, getPlatform, isIOS)
- `src/components/UpdatePrompt.tsx` - Refactored with native guard to skip service worker registration
- `ios/` - Generated Xcode project (App.xcodeproj, Podfile, AppDelegate, storyboards, assets)
- `package.json` - Added Capacitor deps + build:web, build:ios, cap:open, cap:sync, cap:run scripts
- `index.html` - Added viewport-fit=cover for safe area support
- `.gitignore` - Added Capacitor iOS build artifact exclusions

## Decisions Made
- Capacitor 7.5.0 chosen over 8.x due to macOS 14.7 Sonoma and Node 20 compatibility constraints
- UpdatePrompt split into outer guard component + inner WebUpdatePrompt to comply with React hook rules (hooks cannot be called conditionally)
- viewport-fit=cover added to index.html for proper safe area rendering on notched devices
- Live reload configuration gated behind CAPACITOR_LIVE_RELOAD env var for dev workflow

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - Xcode and CocoaPods prerequisites were already satisfied before execution.

## Next Phase Readiness
- iOS project ready for native plugin integration (Dialog, App lifecycle)
- Plan 11-02 depends on platform.ts and Capacitor packages installed here
- 10 window.confirm() call sites identified for Dialog plugin replacement in 11-02
- App lifecycle listener for background/foreground sync ready to implement in 11-02

## Self-Check: PASSED

All files verified present, all commits confirmed in history, all content checks pass.

---
*Phase: 11-capacitor-shell*
*Completed: 2026-02-22*
