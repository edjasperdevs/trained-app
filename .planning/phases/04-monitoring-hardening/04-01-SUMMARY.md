---
phase: 04-monitoring-hardening
plan: 01
subsystem: monitoring
tags: [sentry, tracing, source-maps, replay, react-router, vite-plugin, core-web-vitals]

# Dependency graph
requires:
  - phase: 03-analytics-enhancement
    provides: "Analytics wiring and event tracking foundation"
provides:
  - "Sentry browser tracing with React Router v6 integration (Core Web Vitals)"
  - "Session replay with PII-aware masking (maskAllText: false + data-sentry-mask)"
  - "Source map upload pipeline via @sentry/vite-plugin"
  - "ErrorBoundary wired to Sentry captureError"
  - "SentryRoutes wrapper for all route blocks"
affects: ["04-02 (alert rules)", "deploy (Vercel env vars for SENTRY_AUTH_TOKEN)"]

# Tech tracking
tech-stack:
  added: ["@sentry/vite-plugin"]
  patterns: ["reactRouterV6BrowserTracingIntegration for route-aware tracing", "SentryRoutes wrapper at module level", "hidden source maps with filesToDeleteAfterUpload"]

key-files:
  created: [".env.sentry-build-plugin"]
  modified: ["src/lib/sentry.ts", "src/App.tsx", "src/components/ErrorBoundary.tsx", "vite.config.ts", ".gitignore", ".env.example"]

key-decisions:
  - "maskAllText: false with explicit [data-sentry-mask] selectors for PII elements"
  - "replaysSessionSampleRate: 0.1 (10% normal sessions) for replay coverage"
  - "sentryVitePlugin as last plugin in Vite config array"
  - "Re-export withSentryReactRouterV6Routing from sentry.ts to keep imports centralized"

patterns-established:
  - "SentryRoutes wrapper: all <Routes> blocks use SentryRoutes for automatic page load tracking"
  - "data-sentry-mask attribute: add to DOM elements displaying health/fitness PII for replay masking"
  - "captureError wrapper: ErrorBoundary uses lib/sentry captureError (not direct Sentry import)"

# Metrics
duration: 8min
completed: 2026-02-07
---

# Phase 4 Plan 1: Sentry Tracing, Replay, and Source Maps Summary

**React Router v6 browser tracing for Core Web Vitals, session replay with PII-aware masking, hidden source map upload via @sentry/vite-plugin, and ErrorBoundary wired to Sentry**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-07T15:28:15Z
- **Completed:** 2026-02-07T15:36:51Z
- **Tasks:** 1
- **Files modified:** 9

## Accomplishments
- Sentry.init() now includes reactRouterV6BrowserTracingIntegration with React Router v6 hooks -- Core Web Vitals (LCP, CLS, INP) and page load spans will flow to Sentry dashboard
- Session replay configured with maskAllText: false and [data-sentry-mask] CSS selector -- readable replays with explicit PII masking
- Vite builds now produce hidden source maps and @sentry/vite-plugin is configured to upload them (requires SENTRY_AUTH_TOKEN)
- ErrorBoundary.componentDidCatch TODO resolved -- errors caught by the boundary now report to Sentry via captureError
- All 3 Routes blocks in App.tsx (auth, onboarding, main) wrapped with SentryRoutes for route-aware performance tracking

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure Sentry tracing, replay, source maps, and ErrorBoundary wiring** - `3e8f75c0` (feat)

## Files Created/Modified
- `src/lib/sentry.ts` - Added reactRouterV6BrowserTracingIntegration, replayIntegration, re-exported withSentryReactRouterV6Routing
- `src/App.tsx` - Created SentryRoutes wrapper at module level, replaced all Routes with SentryRoutes
- `src/components/ErrorBoundary.tsx` - Imported captureError, wired componentDidCatch to Sentry
- `vite.config.ts` - Added sentryVitePlugin (last plugin), set build.sourcemap: 'hidden'
- `.gitignore` - Added .env.sentry-build-plugin
- `.env.example` - Added SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT documentation
- `.env.sentry-build-plugin` - Created template for local Sentry build credentials
- `package.json` / `package-lock.json` - Added @sentry/vite-plugin devDependency

## Decisions Made
- **maskAllText: false** -- Default true masks all text in replays making them unreadable for debugging. Set to false with explicit [data-sentry-mask] on PII elements (health/fitness data).
- **replaysSessionSampleRate: 0.1** -- Changed from 0 to 0.1 (10% of normal sessions) per plan spec, providing replay coverage beyond just error sessions.
- **Module-level SentryRoutes** -- withSentryReactRouterV6Routing(Routes) called at module scope (not inside component) per Sentry docs requirement.
- **Re-export from sentry.ts** -- withSentryReactRouterV6Routing re-exported from lib/sentry.ts so App.tsx imports from centralized location.

## Deviations from Plan

None -- plan executed exactly as written.

## User Setup Required

**Source map upload requires Sentry authentication.** The build works without it (source maps just won't upload), but for readable stack traces in production:

1. Create auth token: Sentry Dashboard > Settings > Developer Settings > Auth Tokens
2. Get org slug: Sentry Dashboard > Settings > General > Organization Slug
3. Get project slug: Sentry Dashboard > Settings > Projects > Project Slug
4. **Local builds:** Fill in `.env.sentry-build-plugin` with SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
5. **Vercel deployment:** Add the same 3 variables to Vercel project environment variables

## Issues Encountered

None.

## Next Phase Readiness
- Sentry tracing and replay infrastructure is active -- ready for alert rule configuration (04-02)
- PII masking infrastructure is in place ([data-sentry-mask]) -- future plans can add attributes to sensitive DOM elements
- Source map upload pipeline ready -- just needs auth token configuration in .env.sentry-build-plugin or Vercel env vars

## Self-Check: PASSED

---
*Phase: 04-monitoring-hardening*
*Completed: 2026-02-07*
