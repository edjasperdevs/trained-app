---
phase: 13-deep-linking-auth
plan: 01
subsystem: auth
tags: [universal-links, deep-linking, capacitor, ios, supabase-auth, password-reset]

# Dependency graph
requires:
  - phase: 11-capacitor-shell
    provides: Capacitor iOS shell with @capacitor/app plugin
  - phase: 12-native-polish
    provides: Native platform utilities (isNative, app lifecycle)
provides:
  - AASA file for iOS Universal Links (scoped to /reset-password)
  - Vercel config serving AASA with correct Content-Type
  - Xcode Associated Domains entitlement
  - Deep link handler with appUrlOpen listener and cold start fallback
  - Password reset screen with updateUser flow
  - Hardcoded web domain for resetPasswordForEmail redirectTo
  - /reset-password route in both auth states
affects: [14-push-notifications, deploy]

# Tech tracking
tech-stack:
  added: []
  patterns: [deep-link-handler, universal-links-aasa, native-only-listener-guard]

key-files:
  created:
    - public/.well-known/apple-app-site-association
    - ios/App/App/App.entitlements
    - src/lib/deep-link.ts
    - src/screens/ResetPassword.tsx
  modified:
    - vercel.json
    - src/stores/authStore.ts
    - src/App.tsx
    - ios/App/App.xcodeproj/project.pbxproj

key-decisions:
  - "AASA scoped to /reset-password* only (not catch-all) to avoid hijacking PWA web experience"
  - "Team ID placeholder XXXXXXXXXX used -- Apple Developer account not yet created"
  - "Hardcoded https://app.welltrained.fitness/reset-password for redirectTo instead of window.location.origin (capacitor://localhost breaks Supabase redirect)"
  - "Deep link handler shared function for warm start (appUrlOpen) and cold start (getLaunchUrl) to avoid duplication"
  - "/reset-password route in both authenticated and unauthenticated sections to handle brief session restoration window"

patterns-established:
  - "Deep link pattern: initDeepLinkHandler(navigate) with isNative() guard, shared handleDeepLink() for warm/cold start"
  - "Auth URL pattern: hardcode production web domain for Supabase auth redirects in native context"

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 13 Plan 01: Deep Linking + Auth Summary

**iOS Universal Links infrastructure (AASA, entitlements) with deep link handler parsing Supabase recovery tokens and password reset screen**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-22T18:04:06Z
- **Completed:** 2026-02-22T18:09:09Z
- **Tasks:** 2 auto tasks completed (1 checkpoint pending)
- **Files modified:** 8

## Accomplishments
- AASA file at public/.well-known/apple-app-site-association with scoped /reset-password pattern
- Vercel config serves AASA with application/json Content-Type, excluded from SPA rewrites
- Xcode project has Associated Domains entitlement for applinks:app.welltrained.fitness
- Deep link handler parses access_token/refresh_token from URL hash, restores Supabase session
- Cold start deep links handled via App.getLaunchUrl() fallback
- Password reset screen with validation, updateUser call, success toast, and navigation
- AuthStore redirectTo hardcoded to production web domain (fixes native capacitor://localhost issue)
- /reset-password route registered in both authenticated and unauthenticated route sections

## Task Commits

Each task was committed atomically:

1. **Task 1: Universal Links infrastructure** - `59f38c9c` (feat)
2. **Task 2: Deep link handler, password reset screen, and auth store fixes** - `d044c81c` (feat)

Task 3 is a human-verify checkpoint (pending).

## Files Created/Modified
- `public/.well-known/apple-app-site-association` - AASA file for iOS Universal Links
- `ios/App/App/App.entitlements` - Associated Domains entitlement for Xcode
- `ios/App/App.xcodeproj/project.pbxproj` - CODE_SIGN_ENTITLEMENTS reference in build configs
- `vercel.json` - AASA rewrite exclusion and Content-Type header
- `src/lib/deep-link.ts` - Central deep link handler with warm/cold start support
- `src/screens/ResetPassword.tsx` - Password reset form screen
- `src/stores/authStore.ts` - Hardcoded redirectTo web domain
- `src/App.tsx` - Deep link init, ResetPassword route, lazy import

## Decisions Made
- AASA scoped to /reset-password* only -- catch-all would hijack the PWA web experience for all URLs
- Used Team ID placeholder XXXXXXXXXX since Apple Developer account not yet created (noted in STATE.md blockers)
- Hardcoded https://app.welltrained.fitness/reset-password for Supabase redirectTo -- window.location.origin returns capacitor://localhost in native context which breaks the redirect chain
- Extracted shared handleDeepLink() function used by both appUrlOpen (warm start) and getLaunchUrl (cold start)
- Added /reset-password to both authenticated and unauthenticated route sections -- user arrives via recovery deep link which sets session, but there's a brief render before onAuthStateChange fires

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

Before full end-to-end testing:
1. **Apple Developer Portal:** Replace XXXXXXXXXX in AASA file with actual Team ID (Membership -> Team ID)
2. **Supabase Dashboard:** Add `https://app.welltrained.fitness/**` to Auth -> URL Configuration -> Redirect URLs allowlist
3. **Deploy to Vercel:** AASA file must be live at production domain for Apple's CDN to cache it

## Next Phase Readiness
- Deep link infrastructure ready for Phase 14 push notification taps (navigate to any path)
- Full native testing requires: AASA deployed, signed build with matching Team ID, physical device
- Web password reset flow is testable immediately after Vercel deploy

---
*Phase: 13-deep-linking-auth*
*Completed: 2026-02-22*
