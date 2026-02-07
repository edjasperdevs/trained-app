# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-06)

**Core value:** When this launches to 90k people, nothing is broken and you can see exactly how they're using it
**Current focus:** All 4 milestone phases complete. E2E tests, analytics, and monitoring hardening done. Ready for animation refinement, cleanup, or deployment.

## Current Position

Phase: 4 of 4 (Monitoring Hardening) -- COMPLETE
Plan: 2 of 2 in current phase -- COMPLETE
Status: All milestone plans complete
Last activity: 2026-02-07 -- Completed 04-02-PLAN.md (PII masking + Sentry alert rules)

Progress: [██████████] 100% (8/8 plans)

## Performance Metrics

**Previous Milestone (Design Refresh):**
- 7 phases, 12 plans
- Total execution time: 1.48 hours
- Average plan duration: 7.4min

**Current Milestone:**
- Total plans completed: 8
- Average duration: 7.9min
- Total execution time: 1.01 hours

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Playwright for E2E testing (fast, reliable, multi-browser)
- Build on Sentry + Plausible (already integrated, no new vendors)
- E2E over unit tests (user journey coverage more valuable pre-launch)
- No beta group (launching to everyone -- tests must provide confidence)
- Static seed data in E2E helpers (deterministic over dynamic devSeed.ts)
- Chromium-only project for now (mobile browsers deferred to Phase 2)
- page.addInitScript for localStorage seeding (before Zustand hydration)
- getByRole over getByText for E2E assertions (avoids strict mode violations)
- Dual Playwright projects: chromium (port 5173, bypass) + chromium-auth (port 5174, no bypass)
- VITE_DEV_BYPASS=false in process env overrides .env file for auth tests
- Catch-all page.route handler for Supabase auth mocking (URL-based dispatch)
- Locator.or() pattern for handling parent-unmount race conditions in E2E tests
- baseTest with manual seedAllStores + seedStore for custom-seed E2E tests
- Date mocking via page.addInitScript for day-of-week dependent tests
- context.setOffline + dispatchEvent for offline/online E2E testing
- logQuickMacros replaces daily totals (not additive) -- tests match actual behavior
- Corrected event count: 7 wired methods (8 call sites), 15 missing -- research said 14 but actual is 15
- Funnel 2 (Habit Formation) uses property filtering instead of Plausible built-in funnels (duplicate event name limitation)
- SPA pageviews work automatically via Plausible standard script.js + BrowserRouter -- no manual fallback needed
- useRef guards for proteinTargetHit/calorieTargetHit to fire once per session
- Avatar evolution detection uses before/after store comparison (prevStage !== newStage)
- maskAllText: false with explicit [data-sentry-mask] selectors for PII (readable replays + PII protection)
- replaysSessionSampleRate: 0.1 for replay coverage beyond error sessions
- SentryRoutes wrapper at module level (required by Sentry docs)
- Re-export withSentryReactRouterV6Routing from sentry.ts for centralized imports
- data-sentry-mask on nearest wrapper div for PII clusters (not individual elements)
- Alert thresholds: 10 events/10min error spike, 5 users/15min user impact

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-07
Stopped at: Completed 04-02-PLAN.md (PII masking + alert rules) -- All 8 milestone plans complete
Resume file: None
