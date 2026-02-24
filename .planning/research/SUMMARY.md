# Research Summary: Capacitor iOS Native App

**Domain:** PWA-to-native iOS wrapper with push notifications, native haptics, native file sharing, App Store distribution
**Researched:** 2026-02-21
**Overall confidence:** HIGH

## Executive Summary

Wrapping the existing Trained PWA (React 18 + Vite + Zustand + Supabase) in a Capacitor iOS shell is a well-trodden path with mature tooling. Capacitor is the clear choice over alternatives (React Native requires a rewrite, Cordova is deprecated, Tauri Mobile is immature). The fundamental architecture is a thin native shell around the existing web app -- ALL UI and business logic remains in React. The native shell provides only device-level capabilities: push notifications via APNs, Taptic Engine haptics, native share sheet for file export, and App Store distribution.

The critical environmental constraint is that the development machine runs macOS 14.7.6 (Sonoma) with Node v20.20.0. Capacitor 8 (the latest) requires macOS Sequoia 15.6+ and Node 22+, which are not installed. **Capacitor 7.5.x is the correct starting version** because it works with the current environment. However, Apple mandates Xcode 26 + iOS 26 SDK for all App Store submissions after **April 28, 2026**, which requires macOS Sequoia and Capacitor 8. This creates a forced migration window: ship with Capacitor 7 now, upgrade to 8 before the April deadline.

Research uncovered 20 specific pitfalls in the existing codebase that affect Capacitor integration. The most critical: (1) the service worker from `vite-plugin-pwa` does not work in WKWebView and can break the native bridge, (2) iOS can evict `localStorage` data under storage pressure -- all 8 Zustand persisted stores are vulnerable, (3) `window.confirm()` has 10 call sites across 6 files and can silently fail in WKWebView, (4) the Supabase auth redirect flow (`detectSessionInUrl`) is broken in Capacitor since redirects go to Safari not back to the app, and (5) the data export in Settings.tsx uses a Blob+anchor pattern that is non-functional in WKWebView. These are not speculative -- they are known, documented issues with specific existing code files.

The recommended stack adds 10 runtime dependencies and 2 dev dependencies, all from the official `@capacitor/*` namespace. No third-party or community plugins are needed. The push notification architecture uses direct APNs (no Firebase) since the backend is already Supabase Edge Functions. Total estimated JS bundle overhead is approximately 105KB pre-minification, reduced by tree-shaking on web builds.

## Key Findings

**Stack:** Capacitor 7.5.x with 10 official plugins (core, ios, push-notifications, haptics, share, filesystem, app, dialog, preferences, keyboard). No Firebase. Direct APNs via Supabase Edge Function.

**Architecture:** Thin native shell wrapping the existing React SPA in WKWebView. Single `vite build` output serves both Vercel (web) and Capacitor (native). Runtime platform detection via `Capacitor.isNativePlatform()` handles all branching. No separate build configurations.

**Critical pitfall:** Service worker from vite-plugin-pwa breaks in WKWebView -- must be conditionally disabled for native BEFORE first build. Additionally, localStorage eviction by iOS threatens all 8 Zustand stores -- must migrate to `@capacitor/preferences` (UserDefaults) for native persistence.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Capacitor Shell + WKWebView Fixes** - Foundation phase
   - Addresses: Capacitor init, Xcode project setup, service worker gating, `viewport-fit=cover`, overscroll fixes, `window.confirm` replacement with Dialog plugin, live reload config safety
   - Avoids: Service worker bridge interference (Pitfall #1), confirm dialog failures (Pitfall #6)
   - Rationale: Must establish a working native shell before adding any native features. Multiple existing code patterns break in WKWebView and must be fixed first.

2. **Native Persistence + Haptics + File Sharing** - Core native features
   - Addresses: Zustand persistence migration to `@capacitor/preferences`, haptics module rewrite to Taptic Engine, Settings export rewrite to Filesystem+Share, keyboard configuration
   - Avoids: localStorage eviction (Pitfall #2), broken export (Pitfall #9), no-op haptics (Pitfall #15)
   - Rationale: These are the "minimum native functionality" features that prevent App Store rejection under Guideline 4.2. Each replaces a broken or no-op web pattern.

3. **Push Notifications** - Highest-value native feature
   - Addresses: APNs key setup, push registration flow, deferred permission prompt UX, device_tokens table + Supabase migration, Edge Function for APNs HTTP/2 sending, notification handling (foreground + tap)
   - Avoids: One-shot permission denial (Pitfall #4), token confusion (Pitfall #11), token staleness (Pitfall #3)
   - Rationale: Push notifications are the primary business reason for going native (coach-to-client notifications). Separated from Phase 2 because it requires Apple Developer Account setup, APNs key generation, and a Supabase Edge Function -- different expertise than the plugin integration work.

4. **Auth + Deep Linking** - Supabase auth compatibility
   - Addresses: Universal Links configuration (AASA file on Vercel), `@capacitor/app` URL listener for auth redirects, Supabase PKCE flow configuration, Plausible analytics fix for WKWebView
   - Avoids: Auth redirect broken (Pitfall #5), Universal Links fragility (Pitfall #16), analytics gap (Pitfall #8)
   - Rationale: Auth currently works for email+password (direct flow). Magic links and any future OAuth need Universal Links. This can be deferred if email+password is the only auth method.

5. **App Store Preparation + Submission** - Distribution
   - Addresses: App icon + splash screen generation, Privacy manifest (`PrivacyInfo.xcprivacy`), App Store Connect metadata, screenshots, privacy policy, TestFlight distribution, App Review submission
   - Avoids: Privacy manifest rejection (Pitfall #2 from PITFALLS), icon sizing errors (Pitfall #17)
   - Rationale: All native features must be working before submission. Privacy manifest and metadata are final steps.

6. **Capacitor 7-to-8 Migration** - Deadline compliance
   - Addresses: macOS upgrade to Sequoia 15.6+, Xcode 26 install, Node 22 upgrade, `npx cap migrate`, CocoaPods-to-SPM migration, edge-to-edge CSS handling, full regression test
   - Avoids: App Store submission block after April 28, 2026
   - Rationale: Must be completed before the Apple deadline. Separated as its own phase because it requires OS-level changes and has breaking changes in edge-to-edge handling.

**Phase ordering rationale:**
- Phase 1 must come first because WKWebView incompatibilities block everything else
- Phase 2 delivers "minimum native" features needed for App Store viability
- Phase 3 is the highest-value feature but requires infrastructure setup (APNs, Edge Function)
- Phase 4 is lower priority if email+password auth is sufficient (no magic links needed)
- Phase 5 depends on all features being working
- Phase 6 has a hard deadline (April 28, 2026) but can be done any time before then

**Research flags for phases:**
- Phase 1: Standard Capacitor init patterns, well-documented. Skip deep research.
- Phase 2: Zustand + Capacitor Preferences integration needs validation -- async storage adapter with Zustand persist middleware. Likely needs phase-specific research.
- Phase 3: APNs HTTP/2 JWT signing in Deno Edge Function is non-trivial. The `.p8` key handling, JWT creation with ES256 algorithm, and Apple-specific header requirements need phase-specific research.
- Phase 4: Universal Links AASA file on Vercel needs testing. Phase-specific research recommended.
- Phase 5: App Store submission process is well-documented. Skip deep research.
- Phase 6: Capacitor migration tool is automated. Breaking changes documented. Skip deep research, but budget extra time.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Capacitor versions verified via npm, Xcode/macOS requirements cross-referenced, plugin versions confirmed on npm. One MEDIUM confidence item: direct APNs without Firebase needs implementation validation. |
| Features | HIGH | Feature set is well-defined (push, haptics, share, App Store). Table stakes vs. differentiators clear from iOS app ecosystem. |
| Architecture | HIGH | Single-codebase dual-deployment pattern is the documented Capacitor approach. Data flows verified against existing codebase. Platform detection API confirmed. |
| Pitfalls | HIGH | 20 pitfalls identified with specific file references in the existing codebase. Each verified against Capacitor GitHub issues, official docs, or Apple developer documentation. Integration matrix maps every existing module to its Capacitor risk. |

## Gaps to Address

- **APNs without Firebase validation:** The `@capacitor/push-notifications` plugin may have internal Firebase SDK dependencies even for iOS. Need to validate during Phase 3 implementation that removing all Firebase config still allows APNs token registration. Fallback: add minimal Firebase project for token management only.
- **Zustand async persistence adapter:** `@capacitor/preferences` is asynchronous. Zustand's `persist` middleware supports async storage via `createJSONStorage()`, but the interaction with Zustand's synchronous `getState()` on app cold start needs testing. If hydration timing causes issues, may need a loading screen during initial store rehydration.
- **Sentry in Capacitor:** The existing Sentry setup (`@sentry/react` + `@sentry/vite-plugin`) should work in WKWebView but source map uploads need to include the Capacitor build context. Not researched in depth -- verify during Phase 1.
- **Background app behavior:** WKWebView web process can be terminated under memory pressure, showing a white screen on resume. Capacitor auto-reloads but there is a visible flash. Not critical for MVP but should be addressed post-launch with a splash screen overlay.

## Sources

- [Capacitor Official Documentation](https://capacitorjs.com/docs)
- [Capacitor 7 Update Guide](https://capacitorjs.com/docs/updating/7-0)
- [Capacitor 8 Update Guide](https://capacitorjs.com/docs/updating/8-0)
- [Announcing Capacitor 8 - Ionic Blog](https://ionic.io/blog/announcing-capacitor-8)
- [Apple Xcode 26 Mandate - April 2026](https://developer.apple.com/news/upcoming-requirements/)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Capacitor Push Notifications API](https://capacitorjs.com/docs/apis/push-notifications)
- [Capacitor Service Worker Issue #7069](https://github.com/ionic-team/capacitor/issues/7069)
- [Capacitor localStorage Eviction Issue #636](https://github.com/ionic-team/capacitor/issues/636)
- [Supabase Push Notifications Guide](https://supabase.com/docs/guides/functions/examples/push-notifications)
- [Apple Privacy Manifest Requirements](https://capgo.app/blog/privacy-manifest-for-capacitor-apps-guide/)
- [CocoaPods Deprecation](https://capgo.app/blog/ios-spm-vs-cocoapods-capacitor-migration-guide/)
- [Push Notifications Guide - Capawesome](https://capawesome.io/blog/the-push-notifications-guide-for-capacitor/)
- [File Handling Guide - Capawesome](https://capawesome.io/blog/the-file-handling-guide-for-capacitor/)
- [@capacitor/core npm](https://www.npmjs.com/package/@capacitor/core)

---

*Research completed: 2026-02-21*
*Ready for roadmap: yes*
*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
