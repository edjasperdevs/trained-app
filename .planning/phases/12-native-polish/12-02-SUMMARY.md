---
phase: 12-native-polish
plan: 02
subsystem: native
tags: [capacitor, ios, app-icon, splash-screen, data-export, filesystem, share-sheet, wkwebview]

# Dependency graph
requires:
  - phase: 12-native-polish-01
    provides: "Five Capacitor runtime plugins installed (haptics, filesystem, share, status-bar, splash-screen) with StatusBar/SplashScreen config"
provides:
  - "Branded 1024x1024 app icon (no rounded corners) replacing Capacitor placeholder"
  - "Dark 2732x2732 splash screen with centered WT logo"
  - "Dark LaunchScreen.storyboard background eliminating white flash on cold launch"
  - "Native data export via Filesystem.writeFile + Share.share on iOS"
  - "Web data export preserved via Blob + anchor fallback"
affects: [testflight, app-store-submission, settings]

# Tech tracking
tech-stack:
  added: ["@capacitor/assets@3.0.5 (devDependency, already in 12-01)"]
  patterns: ["Native file export: write to Cache directory, share URI, cleanup after", "Platform branching in handleExport: isNative() for Filesystem+Share vs Blob+anchor"]

key-files:
  created: ["assets/icon-only.png", "assets/splash.png", "assets/splash-dark.png"]
  modified: ["src/screens/Settings.tsx", "ios/App/App/Base.lproj/LaunchScreen.storyboard", "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", "ios/App/App/Assets.xcassets/Splash.imageset/"]

key-decisions:
  - "Downgraded @capacitor/filesystem from 7.1.8 to 7.0.1 due to IONFilesystemLib linker errors on x86_64 simulator"
  - "Cache directory for temp export files (auto-cleaned by OS, cleaned up after share)"
  - "Sharp-based asset generation pipeline: SVG to PNG with rounded corners removed for icon"

patterns-established:
  - "Native export pattern: Filesystem.writeFile (Cache) -> Share.share (URI) -> Filesystem.deleteFile (cleanup)"
  - "Asset generation: sharp renders SVG to PNG source images, @capacitor/assets generates iOS asset catalog variants"

# Metrics
duration: 18min
completed: 2026-02-22
---

# Phase 12 Plan 02: App Icon, Splash Screen & Data Export Summary

**Branded app icon and dark splash screen replacing Capacitor placeholders, native iOS data export via Filesystem+Share with Blob+anchor web fallback**

## Performance

- **Duration:** 18 min
- **Started:** 2026-02-22T16:09:06Z
- **Completed:** 2026-02-22T16:58:37Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 16

## Accomplishments
- Generated branded 1024x1024 app icon (rounded corners removed to avoid double-rounding with iOS superellipse mask) and 2732x2732 dark splash screen using sharp
- Populated iOS asset catalog via @capacitor/assets, replacing default Capacitor placeholder icon and splash
- Fixed LaunchScreen.storyboard background from systemBackgroundColor (white) to dark #0A0A0A, eliminating white flash on cold launch
- Implemented native data export in Settings.tsx: Filesystem.writeFile to Cache directory, Share.share for iOS share sheet, with temp file cleanup and Blob+anchor web fallback preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate branded app icon and splash screen, fix storyboard background** - `47653cf9` (feat)
2. **Task 2: Implement native data export via Filesystem + Share** - `9ddc38e4` (feat)
3. **Task 3: Verify native polish in iOS simulator** - checkpoint, approved by user

**Additional fix:** `8b362745` - Downgraded @capacitor/filesystem 7.1.8 to 7.0.1 (fix)

## Files Created/Modified
- `assets/icon-only.png` - 1024x1024 source icon without rounded corners for @capacitor/assets
- `assets/splash.png` - 2732x2732 dark background with centered WT logo
- `assets/splash-dark.png` - Identical to splash.png (app is always dark themed)
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/` - Branded app icon at all required sizes
- `ios/App/App/Assets.xcassets/Splash.imageset/` - Branded splash at 1x/2x/3x for light and dark
- `ios/App/App/Base.lproj/LaunchScreen.storyboard` - Dark #0A0A0A background replacing white
- `src/screens/Settings.tsx` - Native export via Filesystem+Share, async handleExport
- `package.json` - @capacitor/filesystem downgraded to 7.0.1
- `package-lock.json` - Lock file updated
- `ios/App/Podfile.lock` - Pod lock file updated

## Decisions Made
- Downgraded @capacitor/filesystem from 7.1.8 to 7.0.1 -- IONFilesystemLib 1.1.1 binary pod had undefined symbol errors on x86_64 simulator architecture
- Used Cache directory for temp export files -- auto-cleaned by OS and explicitly deleted after share completes
- Sharp-based pipeline for asset generation rather than manual image creation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Downgraded @capacitor/filesystem from 7.1.8 to 7.0.1**
- **Found during:** Post-Task 2 (iOS simulator build verification)
- **Issue:** IONFilesystemLib 1.1.1 binary pod (bundled with @capacitor/filesystem 7.1.8) contained undefined symbols for x86_64 simulator architecture, causing linker errors
- **Fix:** Downgraded @capacitor/filesystem to 7.0.1 which uses a compatible binary pod version
- **Files modified:** package.json, package-lock.json, ios/App/Podfile.lock
- **Verification:** iOS simulator build succeeds, Filesystem API functional
- **Committed in:** `8b362745`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor version downgrade, no API differences between 7.1.8 and 7.0.1 for the features used (writeFile, deleteFile with Cache directory).

## Issues Encountered
- IONFilesystemLib 1.1.1 linker errors on x86_64 -- resolved by downgrading to 7.0.1 (see deviation above)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 12 (Native Polish) is now complete -- all native UI polish features implemented
- Ready for Phase 13 (Push Notifications) or Phase 14 (TestFlight) when Apple Developer account is available
- All five native features verified in iOS simulator: haptics, data export, splash screen, app icon, status bar

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 12-native-polish*
*Completed: 2026-02-22*
