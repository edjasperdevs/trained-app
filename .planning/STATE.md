# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** The coach can manage every client's training from one place -- programs, macros, check-ins -- and clients see their personalized plans without friction
**Current focus:** v1.5 Native iOS App -- Phase 12: Native Polish

## Current Position

Phase: 12 (Native Polish) -- second of 6 phases (11-16)
Plan: 1 of 2 complete
Status: Executing Phase 12
Last activity: 2026-02-22 -- Completed 12-01 (Plugin foundation + haptics)

Progress: [███░░░░░░░] 25% (3/12 plans estimated)

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
| 12. Native Polish | 1/2 | 10min | 10min |

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

### Pending Todos

- Apply Supabase migrations 003-007 to production
- Deploy send-invite Edge Function + set RESEND_API_KEY
- Configure Sentry alert rules, set deploy env vars

### Blockers/Concerns

- Apple Developer account not yet created (blocks TestFlight/submission, not development)
- Capacitor 7 to 8 migration needed before April 28, 2026 Apple deadline (not in v1.5 scope)
- APNs without Firebase needs implementation validation (plugin may have internal Firebase deps)

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 12-01-PLAN.md (Plugin foundation + haptics)
Resume file: None
