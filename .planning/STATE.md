# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** The coach can manage every client's training from one place -- programs, macros, check-ins -- and clients see their personalized plans without friction
**Current focus:** v1.5 Native iOS App -- Phase 16 in progress

## Current Position

Phase: 16 (App Store Submission) -- IN PROGRESS
Plan: 2 of 4 (16-02 complete)
Status: Executing phase 16
Last activity: 2026-02-22 -- Completed 16-02 (Privacy Policy & Apple Manifest, 2 tasks)

Progress: [█████████░] 88% (12/13+ plans estimated)

## Performance Metrics

**Prior Milestones:**
- v1.0 Launch Polish: 5 phases, 10 plans
- v1.1 Design Refresh: 7 phases, 12 plans (1.48 hours, avg 7.4min/plan)
- v1.2 Pre-Launch Confidence: 4 phases, 8 plans (1.01 hours, avg 7.9min/plan)
- v1.3 Coach Dashboard: 6 phases, 18 plans (61min, avg 3.4min/plan)
- v1.4 Intake Dashboard: 4 phases (built outside GSD)

**v1.5 Native iOS App:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 11. Capacitor Shell | 2/2 | 14min | 7min |
| 12. Native Polish | 2/2 | 28min | 14min |
| 13. Deep Linking + Auth | 1/1 | 5min | 5min |
| 14. Remote Push Notifications | 3/3 | 10min | 3.3min |
| 15. Local Notifications | 2/2 | 9min | 4.5min |
| 16. App Store Submission | 2/4 | 8min | 4min |

## Accumulated Context

### Decisions

- Capacitor 7.5.x (not 8) due to macOS 14.7 Sonoma + Node 20 constraints
- Direct APNs (no Firebase) since iOS-only with Supabase Edge Functions
- Service worker conditionally disabled for native builds via isNative() guard in UpdatePrompt
- Hook guarding pattern: outer component checks platform, inner component contains hooks
- All 10 window.confirm() replaced with async confirmAction() using @capacitor/dialog on native
- Native lifecycle: appStateChange for iOS foreground sync, visibilitychange for web tabs (both coexist)
- Data export Blob+anchor pattern non-functional in WKWebView, needs Filesystem+Share
- Fire-and-forget haptic calls (no await) to avoid blocking UI thread
- StatusBar style DARK for light text on dark app background
- SplashScreen auto-hide with 500ms display + 200ms fade
- @capacitor/filesystem downgraded to 7.0.1 (7.1.8 IONFilesystemLib linker errors on x86_64)
- Cache directory for temp export files, cleanup after share
- Sharp-based asset generation pipeline for icon and splash source images
- AASA scoped to /reset-password* only (not catch-all) to avoid hijacking PWA web experience
- Team ID placeholder XXXXXXXXXX in AASA -- Apple Developer account not yet created
- Hardcoded web domain for Supabase auth redirectTo (capacitor://localhost breaks redirect chain)
- Deep link handler shared function for warm start (appUrlOpen) and cold start (getLaunchUrl)
- /reset-password route in both auth states to handle brief session restoration window
- @capacitor/push-notifications@7.0.5 (not 8.x) to match Capacitor 7.5.x peer dependency
- device_tokens types added manually to database.types.ts (migration not yet applied to running DB)
- No Firebase -- direct APNs HTTP/2 via Deno fetch (auto-negotiates HTTP/2 via TLS ALPN)
- 50-minute JWT cache to stay under APNs 60-min limit and avoid TooManyProviderTokenUpdates
- Webhook payloads trusted without caller auth -- only Supabase admins can create webhooks
- Separate notificationPreferences from existing in-app preferences for backward compatibility
- weeklyCheckIn defaults to disabled (only relevant for coaching clients)
- Workout notification IDs use computed 20+dayOfWeek for individual per-day cancel targeting
- Badge count from two sources: pending daily check-in + unread coach response
- Weekly check-in notification toggle conditionally visible based on active coach_clients row
- Badge updates on every foreground resume (not just after 30s threshold)
- Direct store imports (workoutStore, remindersStore) in App.tsx for .getState() calls to avoid circular deps
- Removed badge:1 from APNs payload so badge count is exclusively client-managed
- Best-effort table deletion in delete-account (continue on individual errors, fail only on auth.admin.deleteUser)
- 13 tables deleted in dependency-safe order (children before parents, profiles last)
- Manual Tailwind utilities for Privacy.tsx (no @tailwindcss/typography plugin installed)

### Pending Todos

- Apply Supabase migrations 003-007 to production
- Deploy send-invite Edge Function + set RESEND_API_KEY
- Configure Sentry alert rules, set deploy env vars
- Replace XXXXXXXXXX in AASA file with actual Apple Team ID
- Add https://app.welltrained.fitness/** to Supabase Auth redirect URL allowlist
- Apply migration 011_device_tokens.sql to production Supabase
- Deploy send-push Edge Function (`supabase functions deploy send-push`)
- Create 3 database webhooks in Supabase Dashboard (assigned_workouts, macro_targets, weekly_checkins -> send-push)
- Set APNs secrets in Supabase (APNS_P8_KEY, APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_ENV)
- Deploy delete-account Edge Function (`supabase functions deploy delete-account`)

### Blockers/Concerns

- Apple Developer account not yet created (blocks TestFlight/submission, not development)
- Capacitor 7 to 8 migration needed before April 28, 2026 Apple deadline (not in v1.5 scope)
- APNs without Firebase needs implementation validation (plugin may have internal Firebase deps)

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 16-02-PLAN.md
Resume file: .planning/phases/16-app-store-submission/16-03-PLAN.md
