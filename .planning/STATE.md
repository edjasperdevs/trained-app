# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** The coach can manage every client's training from one place -- programs, macros, check-ins -- and clients see their personalized plans without friction
**Current focus:** v1.5 Native iOS App -- Phase 11: Capacitor Shell

## Current Position

Phase: 11 (Capacitor Shell) -- first of 6 phases (11-16)
Plan: Not started
Status: Ready to plan
Last activity: 2026-02-21 -- Roadmap created for v1.5

Progress: [░░░░░░░░░░] 0%

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
| 11. Capacitor Shell | - | - | - |

## Accumulated Context

### Decisions

- Capacitor 7.5.x (not 8) due to macOS 14.7 Sonoma + Node 20 constraints
- Direct APNs (no Firebase) since iOS-only with Supabase Edge Functions
- Service worker must be conditionally disabled for native builds (breaks WKWebView)
- 10 window.confirm() call sites across 6 files need Dialog plugin replacement
- Data export Blob+anchor pattern non-functional in WKWebView, needs Filesystem+Share

### Pending Todos

- Apply Supabase migrations 003-007 to production
- Deploy send-invite Edge Function + set RESEND_API_KEY
- Configure Sentry alert rules, set deploy env vars

### Blockers/Concerns

- Apple Developer account not yet created (blocks TestFlight/submission, not development)
- Capacitor 7 to 8 migration needed before April 28, 2026 Apple deadline (not in v1.5 scope)
- APNs without Firebase needs implementation validation (plugin may have internal Firebase deps)

## Session Continuity

Last session: 2026-02-21
Stopped at: Roadmap created for v1.5, ready to plan Phase 11
Resume file: None
