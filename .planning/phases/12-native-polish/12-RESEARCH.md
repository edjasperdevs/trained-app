# Phase 12: Native Polish - Research

**Researched:** 2026-02-22
**Domain:** Capacitor 7 native iOS polish -- haptics, file sharing, splash screen, app icon, status bar
**Confidence:** HIGH

## Summary

Phase 12 transforms the Capacitor-wrapped app from "web app in a native shell" to "feels like a native iOS app." Five discrete requirements target the sensory and visual polish that iOS users expect: Taptic Engine haptic feedback, native share sheet for data export, branded splash screen, proper app icon, and correct status bar appearance.

The codebase is well-prepared for this work. Phase 11 established the Capacitor 7.5.x foundation with `isNative()` / `isIOS()` platform detection in `src/lib/platform.ts`, and the existing `src/lib/haptics.ts` module already defines the haptic trigger taxonomy (light, medium, success, heavy, error) with 4 active call sites. The data export in `Settings.tsx` uses a Blob+anchor pattern that is confirmed non-functional in WKWebView and explicitly noted as needing Filesystem+Share replacement. Brand assets exist as PWA icons (dark #0A0A0A background, white "W" + red #D55550 "T") but the iOS project still has Capacitor's default placeholder icon and white splash screen.

All five requirements map cleanly to official Capacitor plugins: `@capacitor/haptics` for NATIVE-01, `@capacitor/filesystem` + `@capacitor/share` for NATIVE-02, `@capacitor/splash-screen` + `@capacitor/assets` for NATIVE-03, `@capacitor/assets` for NATIVE-04, and `@capacitor/status-bar` for NATIVE-05. Every plugin has a 7.x release compatible with the existing Capacitor 7.5.0 core.

**Primary recommendation:** Install all five plugins in a single plan, then implement each requirement in sequence: haptics first (smallest, highest user impact), then status bar (trivial config change), then app icon + splash (asset generation), then data export share sheet (most complex, touches Settings.tsx business logic).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@capacitor/haptics` | 7.0.3 | Taptic Engine feedback via `UIImpactFeedbackGenerator`, `UINotificationFeedbackGenerator` | Official Capacitor plugin; maps directly to iOS haptic APIs. No alternatives needed. |
| `@capacitor/filesystem` | 7.1.8 | Write export JSON to device temp directory before sharing | Official plugin; required because WKWebView Blob URLs cannot be shared via the native share sheet. |
| `@capacitor/share` | 7.0.4 | Present iOS `UIActivityViewController` share sheet with file attachment | Official plugin; supports `files` parameter for sharing local files (since v4.1.0). |
| `@capacitor/status-bar` | 7.0.5 | Set status bar text to light on dark background | Official plugin; `setStyle(Style.Dark)` gives light text on dark bg. |
| `@capacitor/splash-screen` | 7.0.5 | Control splash screen display duration and auto-hide | Official plugin; manages transition from native launch screen to web view. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@capacitor/assets` | 3.0.5 (dev) | Generate iOS app icon and splash screen images from source PNG/SVG | Run once during asset creation to populate `ios/App/App/Assets.xcassets/` with correctly sized images. |
| `sharp` | 0.34.5 (already installed) | PNG generation from SVG if needed for icon source | Already a devDependency. Can be used to render the existing `icon.svg` to a 1024x1024 PNG for `@capacitor/assets` input. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@capacitor/haptics` | Direct Swift Taptic Engine via custom plugin | Unnecessary complexity. Official plugin covers all needed feedback types. |
| `@capacitor/share` | `@byteowls/capacitor-filesharer` | Community plugin, less maintained. Official `@capacitor/share` supports file sharing since v4.1.0. |
| `@capacitor/splash-screen` | `@aparajita/capacitor-splash-screen` | Community plugin with more features (animations, dark mode variants). Overkill for this use case -- the app is always dark themed, so a single branded launch image suffices. |
| `@capacitor/status-bar` | Info.plist `UIStatusBarStyle` only | Static plist config works but `@capacitor/status-bar` gives runtime control and is the standard Capacitor approach. |
| `@capacitor/assets` | Manual Xcode asset catalog editing | Error-prone, tedious. `@capacitor/assets` generates all required sizes from a single source image. |

**Installation:**

```bash
# Runtime plugins (5 packages)
npm install @capacitor/haptics@7.0.3 @capacitor/filesystem@7.1.8 @capacitor/share@7.0.4 @capacitor/status-bar@7.0.5 @capacitor/splash-screen@7.0.5

# Dev tooling for asset generation
npm install -D @capacitor/assets@3.0.5

# Sync plugins to iOS project (updates Podfile, runs pod install)
npx cap sync ios
```

## Architecture Patterns

### Recommended Project Structure (new/modified files only)

```
trained-app/
  assets/                         # NEW: Source images for @capacitor/assets
    icon-only.png                 # 1024x1024 app icon (rendered from icon.svg)
    splash.png                    # 2732x2732 splash (dark bg + centered WT logo)
    splash-dark.png               # 2732x2732 same as splash (app is always dark)
  capacitor.config.ts             # MODIFY: add StatusBar + SplashScreen plugin config
  ios/
    App/App/
      Assets.xcassets/
        AppIcon.appiconset/       # REPLACED by @capacitor/assets (branded icon)
        Splash.imageset/          # REPLACED by @capacitor/assets (branded splash)
      Base.lproj/
        LaunchScreen.storyboard   # MODIFY: dark background color instead of systemBackgroundColor
  src/
    lib/
      haptics.ts                  # MODIFY: replace navigator.vibrate with @capacitor/haptics on native
    screens/
      Settings.tsx                # MODIFY: handleExport to use Filesystem+Share on native
```

### Pattern 1: Platform-Branching Haptics Module

**What:** The existing `src/lib/haptics.ts` uses `navigator.vibrate()` which has 0% iOS Safari/WKWebView support. Replace with `@capacitor/haptics` on native, keep `navigator.vibrate()` as web fallback.
**When to use:** Every haptic trigger point (4 existing call sites, no new ones needed).
**Example:**

```typescript
// src/lib/haptics.ts (MODIFIED)
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNative } from './platform'

const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

export const haptics = {
  /** Light tap - set completion, toggles */
  light: () => {
    if (isNative()) {
      Haptics.impact({ style: ImpactStyle.Light })
    } else if (canVibrate) {
      navigator.vibrate(10)
    }
  },

  /** Medium tap - action confirmed */
  medium: () => {
    if (isNative()) {
      Haptics.impact({ style: ImpactStyle.Medium })
    } else if (canVibrate) {
      navigator.vibrate(25)
    }
  },

  /** Success pattern - workout complete, check-in, achievement unlock */
  success: () => {
    if (isNative()) {
      Haptics.notification({ type: NotificationType.Success })
    } else if (canVibrate) {
      navigator.vibrate([15, 50, 30])
    }
  },

  /** Heavy tap - important milestone like XP claim */
  heavy: () => {
    if (isNative()) {
      Haptics.impact({ style: ImpactStyle.Heavy })
    } else if (canVibrate) {
      navigator.vibrate(50)
    }
  },

  /** Error buzz - something went wrong */
  error: () => {
    if (isNative()) {
      Haptics.notification({ type: NotificationType.Error })
    } else if (canVibrate) {
      navigator.vibrate([50, 30, 50])
    }
  },
}
```

**Key mapping from existing taxonomy to iOS Taptic Engine:**

| App Method | Current Implementation | Native Replacement | iOS Engine |
|------------|----------------------|-------------------|------------|
| `haptics.light()` | `navigator.vibrate(10)` | `Haptics.impact({ style: ImpactStyle.Light })` | UIImpactFeedbackGenerator(.light) |
| `haptics.medium()` | `navigator.vibrate(25)` | `Haptics.impact({ style: ImpactStyle.Medium })` | UIImpactFeedbackGenerator(.medium) |
| `haptics.success()` | `navigator.vibrate([15,50,30])` | `Haptics.notification({ type: NotificationType.Success })` | UINotificationFeedbackGenerator(.success) |
| `haptics.heavy()` | `navigator.vibrate(50)` | `Haptics.impact({ style: ImpactStyle.Heavy })` | UIImpactFeedbackGenerator(.heavy) |
| `haptics.error()` | `navigator.vibrate([50,30,50])` | `Haptics.notification({ type: NotificationType.Error })` | UINotificationFeedbackGenerator(.error) |

**Confidence: HIGH** -- Haptics API verified from official Capacitor docs. ImpactStyle and NotificationType enums confirmed.

### Pattern 2: Native File Export via Filesystem + Share

**What:** The current `handleExport()` in `Settings.tsx` creates a Blob, generates an object URL, and triggers a download via an anchor click. This pattern is non-functional in WKWebView because `URL.createObjectURL()` + anchor download doesn't work in the `capacitor://` scheme. On native, write the JSON to the Filesystem cache directory first, then invoke the Share plugin to present the iOS share sheet.
**When to use:** The data export action in Settings.

```typescript
// In Settings.tsx handleExport (MODIFIED)
import { isNative } from '@/lib/platform'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const handleExport = async () => {
  // ... existing data gathering code unchanged ...
  const dataStr = JSON.stringify(exportObj, null, 2)
  const fileName = `trained-backup-${getLocalDateString()}.json`

  try {
    if (isNative()) {
      // Write to cache directory (temp, auto-cleaned by OS)
      const result = await Filesystem.writeFile({
        path: fileName,
        data: dataStr,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      })

      // Present iOS share sheet with the file
      await Share.share({
        title: 'Trained Backup',
        url: result.uri,  // file:// URI from Filesystem
        dialogTitle: 'Export Trained Data',
      })
    } else {
      // Web: existing Blob + anchor pattern (unchanged)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    analytics.dataExported()
    toast.success('Data exported')
  } catch (error) {
    toast.error(friendlyError('export your data', error))
  }
}
```

**Why Cache directory:** `Directory.Cache` is appropriate for temporary export files. iOS can reclaim the space when needed, and we don't need persistence -- the user is actively sharing/saving the file via the share sheet.

**Why `url` not `files`:** The `Share.share()` `url` parameter accepts a `file://` URI for a single file. The `files` array parameter is for multiple files. For a single backup JSON, `url` is simpler and more reliable.

**Confidence: HIGH** -- This is the well-documented Capacitor pattern for file export. The Phase 11 research explicitly noted "Data export Blob+anchor pattern non-functional in WKWebView, needs Filesystem+Share."

### Pattern 3: Status Bar Configuration

**What:** Set status bar style to `Dark` (which means LIGHT text) on app startup.
**When to use:** App initialization, once.

```typescript
// In App.tsx or a startup hook (one-time call)
import { StatusBar, Style } from '@capacitor/status-bar'
import { isNative } from '@/lib/platform'

// Call once during app initialization
if (isNative()) {
  StatusBar.setStyle({ style: Style.Dark })
}
```

**Alternative: declarative config in capacitor.config.ts:**

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  // ... existing config ...
  plugins: {
    StatusBar: {
      style: 'DARK',       // Light text on dark background
      overlaysWebView: true, // Status bar overlays web content (transparent bg)
    },
  },
}
```

**iOS prerequisite:** `UIViewControllerBasedStatusBarAppearance` must be `YES` in Info.plist. **Already set** (verified in current Info.plist line 46-47).

**Naming confusion alert:** In Capacitor's `Style` enum, `Style.Dark` means "light-colored text for dark backgrounds" (matching iOS `UIStatusBarStyle.lightContent`). This is counter-intuitive but correct.

**Confidence: HIGH** -- Verified from official Capacitor Status Bar docs. Info.plist prerequisite already met.

### Pattern 4: Branded Splash Screen via Storyboard + Assets

**What:** Replace the default white Capacitor splash screen with a dark-themed branded version. This involves two parts: (1) generating the splash image asset, and (2) updating the LaunchScreen.storyboard background color.
**When to use:** One-time asset setup.

**Part 1: Generate splash assets**

```bash
# Create source images in assets/ directory
# icon-only.png: 1024x1024 (render from public/icon.svg)
# splash.png: 2732x2732 (dark bg #0A0A0A with centered WT logo)
# splash-dark.png: same as splash.png (app is always dark)

# Generate all iOS assets
npx capacitor-assets generate --ios \
  --iconBackgroundColor '#0a0a0a' \
  --iconBackgroundColorDark '#0a0a0a' \
  --splashBackgroundColor '#0a0a0a' \
  --splashBackgroundColorDark '#0a0a0a'
```

**Part 2: Update LaunchScreen.storyboard background color**

The current storyboard uses `systemBackgroundColor` (white in light mode). Replace with the app's dark background:

```xml
<!-- BEFORE: white system background -->
<color key="backgroundColor" systemColor="systemBackgroundColor"/>

<!-- AFTER: app dark background #0A0A0A -->
<color key="backgroundColor" red="0.039" green="0.039" blue="0.039" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
```

The RGB values for #0A0A0A are: R=10/255=0.039, G=10/255=0.039, B=10/255=0.039.

**Part 3: Configure splash plugin in capacitor.config.ts**

```typescript
plugins: {
  SplashScreen: {
    launchAutoHide: true,
    launchShowDuration: 500,
    backgroundColor: '#0a0a0aff',
    launchFadeOutDuration: 200,
  },
}
```

**Confidence: HIGH** -- LaunchScreen.storyboard format verified from current file. @capacitor/assets flags verified from official docs.

### Pattern 5: App Icon via @capacitor/assets

**What:** Generate a proper branded app icon from the existing SVG source.
**When to use:** One-time asset setup.

The project already has `public/icon.svg` (512x512 viewBox, dark bg with WT logo) and `public/pwa-512x512.png`. For iOS, we need a 1024x1024 PNG without rounded corners (iOS applies its own mask).

```bash
# Option A: Use @capacitor/assets with the logo approach
# Place a 1024x1024 icon-only.png in assets/ (no rounded corners, full bleed)
npx capacitor-assets generate --ios

# Option B: Use sharp (already installed) to render SVG to 1024x1024 PNG
npx -y sharp-cli -i public/icon.svg -o assets/icon-only.png resize 1024 1024
```

**Important:** The existing `AppIcon-512@2x.png` is a 1024x1024 Capacitor default placeholder (blue X on white). It MUST be replaced. The current `Contents.json` uses the modern single-image approach (`"size": "1024x1024"`, `"platform": "ios"`), which is correct for Xcode 15+.

**Confidence: HIGH** -- Verified current icon is placeholder via visual inspection. Modern Xcode single-icon approach confirmed.

### Anti-Patterns to Avoid

- **Calling Haptics.impact() without try/catch in hot paths:** Haptics calls return Promises. While they won't throw on unsupported devices (they resolve silently), wrapping in try/catch is defensive. However, the existing fire-and-forget pattern (no await) is acceptable since haptic calls should never block UI.
- **Using `Directory.Documents` for temporary export files:** Documents persists across app launches and shows up in Files app if file sharing is enabled. Use `Directory.Cache` for ephemeral export files.
- **Editing LaunchScreen.storyboard in a text editor carelessly:** Storyboard XML is fragile. Only change the specific `backgroundColor` color element. Do not reformat the XML or change other attributes.
- **Setting status bar style before checking platform:** `StatusBar.setStyle()` will throw on web. Always guard with `isNative()` check or use the declarative config in `capacitor.config.ts` (which only applies on native).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Haptic feedback on iOS | Custom Swift plugin calling UIFeedbackGenerator | `@capacitor/haptics` | Plugin wraps all three iOS feedback generators (impact, notification, selection) with proper lifecycle management |
| File export on native | Custom WKWebView download handler or message handler | `@capacitor/filesystem` + `@capacitor/share` | WKWebView file download is notoriously unreliable. Filesystem+Share is the blessed Capacitor pattern. |
| Status bar styling | Direct Info.plist `UIStatusBarStyle` manipulation | `@capacitor/status-bar` plugin | Runtime control, works with Capacitor's view controller hierarchy |
| App icon generation | Manual Photoshop/Figma export at multiple sizes | `@capacitor/assets` CLI | Generates all required sizes from a single source. Eliminates human error in sizing. |
| Splash screen generation | Manual image creation at multiple resolutions | `@capacitor/assets` CLI | Handles 1x/2x/3x variants, correct dimensions, proper asset catalog entries |

**Key insight:** Every requirement in this phase maps to an official Capacitor plugin. There is zero custom native Swift code needed. The entire phase is TypeScript changes + asset generation + minor storyboard/config edits.

## Common Pitfalls

### Pitfall 1: Haptics Style.Dark vs Style.Light Naming Confusion

**What goes wrong:** Developer sets `StatusBar.setStyle({ style: Style.Light })` thinking "light theme" but actually gets dark text on the dark background (invisible).
**Why it happens:** Capacitor's `Style.Dark` means "I have a dark background, give me light text." `Style.Light` means "I have a light background, give me dark text." The style describes the BACKGROUND, not the text.
**How to avoid:** Remember: `Style.Dark` = light text (what we want). Verify visually on device/simulator immediately.
**Warning signs:** Status bar time/battery indicators are invisible or very hard to read against the dark background.

### Pitfall 2: Splash Screen White Flash on Cold Launch

**What goes wrong:** Despite setting `ios.backgroundColor: '#0a0a0a'` in capacitor.config.ts, a brief white flash appears between the native launch screen and the web view loading.
**Why it happens:** The `LaunchScreen.storyboard` still uses `systemBackgroundColor` (white in light appearance). iOS displays the storyboard first (before Capacitor config applies), so there's a white frame before the dark web view loads.
**How to avoid:** Change the `LaunchScreen.storyboard` background color to match `#0A0A0A` directly in the storyboard XML. This ensures the very first frame the user sees is dark.
**Warning signs:** Brief white flash visible during cold launch, especially on slower devices.

### Pitfall 3: Share.share() Requires file:// URI, Not Blob URL

**What goes wrong:** Developer tries to pass a `blob:` URL or `capacitor://` URL to `Share.share()` and gets an error or empty share sheet.
**Why it happens:** The iOS share sheet (`UIActivityViewController`) needs a proper `file://` URI pointing to a real file on disk. Blob URLs and capacitor:// scheme URLs are not recognized.
**How to avoid:** Always write to disk first via `Filesystem.writeFile()`, then pass the returned `result.uri` (which is a `file://` path) to `Share.share()`.
**Warning signs:** Share sheet appears empty, or shows an error. Console logs may show "unable to find file" type errors.

### Pitfall 4: @capacitor/assets Overwrites Existing iOS Assets

**What goes wrong:** Running `npx capacitor-assets generate` overwrites customized asset catalog entries or storyboard modifications.
**Why it happens:** The tool is designed to regenerate all assets from source. It replaces everything in `Assets.xcassets`.
**How to avoid:** Run asset generation BEFORE making manual storyboard edits. If re-running later, be aware that manual changes to `LaunchScreen.storyboard` background color may need to be re-applied. Consider making the storyboard edit a documented post-generation step.
**Warning signs:** After running asset generation, splash background reverts to white or icon reverts to default.

### Pitfall 5: Forgetting npx cap sync After Plugin Install

**What goes wrong:** Plugin is installed via npm but the iOS project doesn't know about it. Building in Xcode produces "module not found" errors.
**Why it happens:** `npm install` adds the JS package but doesn't update the Podfile or run `pod install` for the iOS project.
**How to avoid:** Always run `npx cap sync ios` after installing new Capacitor plugins. This updates the Podfile, runs `pod install`, and copies web assets.
**Warning signs:** Xcode build fails with "No such module" for the newly installed plugin.

### Pitfall 6: Icon Has Rounded Corners Baked In

**What goes wrong:** App icon appears with double-rounded corners (icon's baked-in corners + iOS's own corner mask) looking wrong.
**Why it happens:** The existing `icon.svg` has `rx="102"` (rounded corners) suitable for PWA rendering. iOS applies its own superellipse mask, so the source icon should be square/full-bleed.
**How to avoid:** Create the 1024x1024 source icon WITHOUT rounded corners. Use the full square area. iOS will mask it appropriately.
**Warning signs:** Icon in App Store, home screen, or Settings has a visible inner rounding that doesn't match iOS standard.

## Code Examples

### Complete capacitor.config.ts with all plugin configs

```typescript
// capacitor.config.ts (MODIFIED)
/// <reference types="@capacitor/status-bar" />
/// <reference types="@capacitor/splash-screen" />
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'fitness.welltrained.app',
  appName: 'WellTrained',
  webDir: 'dist',
  ios: {
    backgroundColor: '#0a0a0a',
    allowsBackForwardNavigationGestures: false,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 500,
      backgroundColor: '#0a0a0aff',
      launchFadeOutDuration: 200,
    },
  },
  server: process.env.CAPACITOR_LIVE_RELOAD ? {
    url: process.env.CAPACITOR_DEV_URL || 'http://localhost:5173',
    cleartext: true,
  } : undefined,
}

export default config
```

**Source:** [Capacitor Status Bar Plugin Config](https://capacitorjs.com/docs/apis/status-bar), [Capacitor Splash Screen Plugin Config](https://capacitorjs.com/docs/apis/splash-screen)

### Haptic trigger point inventory (all 4 active call sites)

| # | File | Line | Method Called | Trigger Context |
|---|------|------|-------------|-----------------|
| 1 | `src/screens/Workouts.tsx` | 236 | `haptics.light()` | Individual set completion |
| 2 | `src/screens/Workouts.tsx` | 154 | `haptics.success()` | Entire workout completed |
| 3 | `src/screens/Home.tsx` | 546 | `haptics.success()` | Daily check-in completed |
| 4 | `src/screens/XPClaimModal.tsx` | 156 | `haptics.heavy()` | Weekly XP claimed |

**Note:** `haptics.medium()` and `haptics.error()` are defined but not currently called anywhere in the codebase. They should remain for future use but are not tested as part of NATIVE-01 success criteria.

### LaunchScreen.storyboard dark background edit

```xml
<!-- Change this one line in ios/App/App/Base.lproj/LaunchScreen.storyboard -->

<!-- BEFORE (line 19): -->
<color key="backgroundColor" systemColor="systemBackgroundColor"/>

<!-- AFTER: -->
<color key="backgroundColor" red="0.039215686274510" green="0.039215686274510" blue="0.039215686274510" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
```

### Podfile after sync (expected state)

After `npx cap sync ios`, the Podfile's `capacitor_pods` function should include all new plugins:

```ruby
def capacitor_pods
  pod 'Capacitor', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCordova', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorApp', :path => '../../node_modules/@capacitor/app'
  pod 'CapacitorDialog', :path => '../../node_modules/@capacitor/dialog'
  pod 'CapacitorHaptics', :path => '../../node_modules/@capacitor/haptics'
  pod 'CapacitorFilesystem', :path => '../../node_modules/@capacitor/filesystem'
  pod 'CapacitorShare', :path => '../../node_modules/@capacitor/share'
  pod 'CapacitorStatusBar', :path => '../../node_modules/@capacitor/status-bar'
  pod 'CapacitorSplashScreen', :path => '../../node_modules/@capacitor/splash-screen'
end
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `navigator.vibrate()` for haptics | `@capacitor/haptics` with Taptic Engine | Always (vibrate never worked on iOS) | Real iOS haptic feedback vs silent no-op |
| Blob+anchor download for export | Filesystem+Share for native, Blob for web | Capacitor 3+ | Native share sheet with AirDrop, Messages, Files, Mail options |
| Multiple icon sizes in asset catalog | Single 1024x1024 source, Xcode scales | Xcode 15 (2023) | Simplified asset management, no more 20+ size variants |
| Manual splash image creation | `@capacitor/assets` CLI generation | @capacitor/assets v3 | Automated 1x/2x/3x generation from single source |

**Deprecated/outdated:**
- `navigator.vibrate()` on iOS: Has 0% support on iOS Safari/WKWebView. Was never supported and never will be. The existing `haptics.ts` is entirely non-functional on iOS.
- LaunchImage asset catalog (pre-storyboard): Deprecated by Apple. All apps should use LaunchScreen.storyboard.
- Multiple icon size entries in Contents.json: Xcode 15+ supports a single 1024x1024 "universal" entry. The current Contents.json already uses this format.

## Existing Asset Inventory

| Asset | Location | Status | Action Needed |
|-------|----------|--------|---------------|
| App icon SVG | `public/icon.svg` | Branded (dark bg, WT logo, has rounded corners) | Render to 1024x1024 PNG without rounded corners |
| PWA icon 512x512 | `public/pwa-512x512.png` | Branded | Reference for visual consistency |
| Apple touch icon | `public/apple-touch-icon.png` | Branded | Reference only (used by PWA, not native) |
| iOS app icon | `ios/.../AppIcon-512@2x.png` | DEFAULT PLACEHOLDER (blue X) | MUST REPLACE |
| iOS splash 1x | `ios/.../splash-2732x2732-2.png` | DEFAULT PLACEHOLDER (white bg, tiny blue X) | MUST REPLACE |
| iOS splash 2x | `ios/.../splash-2732x2732-1.png` | DEFAULT PLACEHOLDER | MUST REPLACE |
| iOS splash 3x | `ios/.../splash-2732x2732.png` | DEFAULT PLACEHOLDER | MUST REPLACE |
| LaunchScreen.storyboard | `ios/.../LaunchScreen.storyboard` | White background (`systemBackgroundColor`) | Change to dark #0A0A0A |

## Open Questions

1. **Icon source without rounded corners**
   - What we know: `public/icon.svg` has `rx="102"` rounded corners. iOS applies its own superellipse mask, so the source should be square.
   - What's unclear: Whether the user has a version without rounded corners, or if we should render a modified SVG.
   - Recommendation: Modify the SVG to remove the `rx` attribute before rendering to PNG. The icon content (W and T letters) is centered and has enough margin to work at full bleed.

2. **Splash screen logo size**
   - What we know: `@capacitor/assets` default `logoSplashScale` is 0.2 (20% of the 2732px canvas = ~546px logo). The current placeholder has a tiny centered icon.
   - What's unclear: What logo size looks best on actual devices.
   - Recommendation: Start with the 0.2 default scale. Can adjust via `--logoSplashScale` flag if the logo appears too small or too large during testing.

3. **Cleanup of temp export files**
   - What we know: `Filesystem.writeFile()` to `Directory.Cache` creates a file that iOS can reclaim. But it persists until iOS needs the space.
   - What's unclear: Whether we should explicitly delete the file after sharing completes.
   - Recommendation: Optionally delete with `Filesystem.deleteFile()` after `Share.share()` resolves. Low priority since cache directory is auto-managed, but cleaner.

## Sources

### Primary (HIGH confidence)
- [Capacitor Haptics Plugin API](https://capacitorjs.com/docs/apis/haptics) -- ImpactStyle, NotificationType enums, method signatures
- [Capacitor Share Plugin API](https://capacitorjs.com/docs/apis/share) -- share() with files/url params, iOS behavior
- [Capacitor Filesystem Plugin API](https://capacitorjs.com/docs/apis/filesystem) -- writeFile, Directory enum, Encoding
- [Capacitor Status Bar Plugin API](https://capacitorjs.com/docs/apis/status-bar) -- Style enum (Dark/Light/Default), iOS config requirements
- [Capacitor Splash Screen Plugin API](https://capacitorjs.com/docs/apis/splash-screen) -- launchShowDuration, backgroundColor, autoHide config
- [Capacitor Splash Screens and Icons Guide](https://capacitorjs.com/docs/guides/splash-screens-and-icons) -- @capacitor/assets usage, source image requirements
- npm registry -- all plugin versions verified: haptics@7.0.3, filesystem@7.1.8, share@7.0.4, status-bar@7.0.5, splash-screen@7.0.5, assets@3.0.5
- Codebase analysis -- haptics.ts (18 lines, navigator.vibrate only), 4 active haptic call sites, Settings.tsx export at lines 142-198, icon.svg source, Info.plist UIViewControllerBasedStatusBarAppearance=YES

### Secondary (MEDIUM confidence)
- [GitHub: ionic-team/capacitor-assets](https://github.com/ionic-team/capacitor-assets) -- CLI flags for Easy Mode (iconBackgroundColor, splashBackgroundColor, logoSplashScale)
- [Capacitor Status Bar config in capacitor.config.ts](https://github.com/ionic-team/capacitor-plugins/blob/main/status-bar/README.md) -- declarative plugin config format
- Phase 11 Research (`.planning/phases/11-capacitor-shell/11-RESEARCH.md`) -- prior decisions on Capacitor 7.5.x, plugin architecture, deferred plugins list

### Tertiary (LOW confidence)
- None. All findings verified against npm registry + official Capacitor docs + codebase inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all 5 plugins verified on npm registry with exact 7.x versions, APIs confirmed from official docs
- Architecture: HIGH -- patterns based on codebase analysis (existing haptics module, export code, platform utils) and verified Capacitor APIs
- Pitfalls: HIGH -- white flash, naming confusion, and file URI requirements are well-documented in community forums and official docs
- Asset inventory: HIGH -- visual inspection of current placeholder images confirms all need replacement

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable -- all plugins are mature Capacitor 7 releases, unlikely to change)
