---
phase: 30-auth-infrastructure
plan: 01
subsystem: auth
tags: [apple-sign-in, google-sign-in, capacitor, supabase, oauth]

# Dependency graph
requires: []
provides:
  - Apple Sign-In native auth wrapper with Supabase integration
  - Google Sign-In native auth wrapper with Supabase integration
  - iOS entitlements for Sign In with Apple capability
  - Google OAuth URL scheme configuration
affects: [auth-ui, profile-sync, session-management]

# Tech tracking
tech-stack:
  added:
    - "@capacitor-community/apple-sign-in@7.1.0"
    - "@southdevs/capacitor-google-auth@7.0.0"
  patterns:
    - "Native social auth via signInWithIdToken pattern"
    - "Auth wrapper modules returning {data, error} tuple"

key-files:
  created:
    - src/lib/apple-auth.ts
    - src/lib/google-auth.ts
  modified:
    - capacitor.config.ts
    - ios/App/App/App.entitlements
    - ios/App/App/Info.plist
    - package.json

key-decisions:
  - "Used @southdevs/capacitor-google-auth instead of @codetrix-studio (Capacitor 7 compatibility)"
  - "Native sign-in returns to Supabase via signInWithIdToken, not OAuth redirect flow"

patterns-established:
  - "Auth wrapper pattern: async function returning { data: any; error: string | null }"
  - "Platform check via isNative() before native-only operations"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-04]

# Metrics
duration: ~15min
completed: 2026-03-06
---

# Phase 30 Plan 01: Social Auth Plugins Summary

**Apple and Google Sign-In Capacitor plugins with Supabase signInWithIdToken integration**

## Performance

- **Duration:** ~15 min (across multiple sessions with human-action checkpoint)
- **Started:** 2026-03-06
- **Completed:** 2026-03-06
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Installed @capacitor-community/apple-sign-in and @southdevs/capacitor-google-auth plugins
- Created apple-auth.ts wrapper that passes Apple identity token to Supabase
- Created google-auth.ts wrapper that passes Google ID token to Supabase
- Configured iOS Sign In with Apple entitlement via Xcode
- Added Google OAuth URL scheme to Info.plist for callback handling
- Configured Supabase Apple and Google providers in dashboard

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Apple and Google Sign-In Capacitor plugins** - `9db8e77f` (feat)
2. **Task 2: Create Apple and Google auth wrapper modules** - `bf51d6f9` (feat)
3. **Task 3: Configure iOS entitlements and provider dashboards** - `c33956c6` (chore)

## Files Created/Modified
- `src/lib/apple-auth.ts` - Apple Sign-In wrapper with signInWithApple() export
- `src/lib/google-auth.ts` - Google Sign-In wrapper with signInWithGoogle(), configureGoogleSignIn(), signOutGoogle() exports
- `src/lib/index.ts` - Re-exports for apple-auth and google-auth
- `capacitor.config.ts` - Added GoogleAuth plugin configuration
- `ios/App/App/App.entitlements` - Sign In with Apple capability
- `ios/App/App/Info.plist` - Google OAuth URL scheme
- `package.json` - Added plugin dependencies
- `ios/App/Podfile` - iOS CocoaPods dependencies
- `ios/App/Podfile.lock` - Locked pod versions

## Decisions Made
- **Plugin swap:** Used @southdevs/capacitor-google-auth instead of @codetrix-studio/capacitor-google-auth because the original package only supports Capacitor 6, and this project uses Capacitor 7
- **Async initialize:** Made configureGoogleSignIn() async to match @southdevs/capacitor-google-auth API (initialize() returns Promise)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Switched Google Auth plugin for Capacitor 7 compatibility**
- **Found during:** Task 1 (Plugin installation)
- **Issue:** @codetrix-studio/capacitor-google-auth only supports Capacitor 6, project uses Capacitor 7
- **Fix:** Installed @southdevs/capacitor-google-auth@7.0.0 instead (fork with Capacitor 7 support)
- **Files modified:** package.json, package-lock.json, src/lib/google-auth.ts
- **Verification:** npm install succeeded, TypeScript compiles, plugin in npm ls output
- **Committed in:** 9db8e77f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Plugin swap required for Capacitor 7 compatibility. No functional difference - API is identical.

## Issues Encountered
None - plan executed as expected after plugin swap.

## User Setup Required

**External services were configured via human-action checkpoint:**
- Apple Developer Portal: Sign In with Apple capability enabled for App ID
- Supabase Dashboard: Apple provider configured with Team ID
- Google Cloud Console: OAuth consent screen and credentials created
- Supabase Dashboard: Google provider configured with Web Client ID and Secret
- Environment variables: VITE_GOOGLE_WEB_CLIENT_ID and VITE_GOOGLE_IOS_CLIENT_ID added to .env

## Next Phase Readiness
- Auth wrapper modules ready for UI integration in Phase 31
- signInWithApple() and signInWithGoogle() functions exported from src/lib
- Supabase providers configured and ready to accept ID tokens
- iOS build will include Sign In with Apple entitlement

---
*Phase: 30-auth-infrastructure*
*Completed: 2026-03-06*

## Self-Check: PASSED

- FOUND: src/lib/apple-auth.ts
- FOUND: src/lib/google-auth.ts
- FOUND: 9db8e77f (Task 1 commit)
- FOUND: bf51d6f9 (Task 2 commit)
- FOUND: c33956c6 (Task 3 commit)
