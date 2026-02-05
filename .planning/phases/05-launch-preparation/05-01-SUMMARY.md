---
phase: 05-launch-preparation
plan: 01
subsystem: infra
tags: [sentry, og-image, sharp, robots-txt, error-tracking, social-sharing]

# Dependency graph
requires:
  - phase: 04-resilience-hardening
    provides: sync.ts with catch blocks, foodApi.ts with rate limit handling
provides:
  - Correct 1200x630 OG image for social sharing
  - Sentry error capture wired into all app error paths
  - Sentry user context set on auth events
  - robots.txt for search engine crawling
  - Repeatable OG image generation script
affects: [05-02-testing, 05-03-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "captureError with context object pattern: captureError(error, { context: 'module.function' })"
    - "Sentry user aliasing to avoid naming collisions: sentrySetUser/sentryClearUser"

key-files:
  created:
    - scripts/generate-og-image.mjs
    - public/robots.txt
  modified:
    - public/og-image.png
    - src/lib/sync.ts
    - src/stores/authStore.ts
    - src/lib/foodApi.ts

key-decisions:
  - "Aliased Sentry setUser/clearUser as sentrySetUser/sentryClearUser to avoid collision with authStore user state"
  - "captureError wraps instanceof Error check at call site for type safety"
  - "429 rate limit errors NOT captured to Sentry (expected behavior, handled by cooldown)"

patterns-established:
  - "Sentry captureError pattern: if (error instanceof Error) { captureError(error, { context: 'module.action' }) }"
  - "Sentry user lifecycle: sentrySetUser on signIn/signUp, sentryClearUser on signOut"

# Metrics
duration: 3min
completed: 2026-02-05
---

# Phase 5 Plan 1: Launch Preparation - OG Image, Sentry Wiring, robots.txt Summary

**Fixed OG image to 1200x630 via sharp SVG-to-PNG conversion, wired Sentry captureError into 8 catch blocks across sync/auth/foodApi, added user context on auth events, created robots.txt**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-05T14:36:20Z
- **Completed:** 2026-02-05T14:39:08Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- OG image regenerated at correct 1200x630 dimensions (was broken at 512x512) with repeatable script
- Sentry captureError wired into all error paths: sync.ts (2), authStore.ts (5), foodApi.ts (1)
- Sentry user context set after signIn/signUp, cleared after signOut
- robots.txt created with Allow: / directive for search engine crawling

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix OG image and add robots.txt** - `5be8cd09` (feat)
2. **Task 2: Wire Sentry into all error paths** - `fa915cc5` (feat)

## Files Created/Modified
- `scripts/generate-og-image.mjs` - ESM script using sharp to convert SVG to 1200x630 PNG
- `public/og-image.png` - Regenerated at correct 1200x630 dimensions
- `public/robots.txt` - Search engine crawling directive (Allow: /)
- `src/lib/sync.ts` - Added captureError import, wired into scheduleSync and flushPendingSync catch blocks
- `src/stores/authStore.ts` - Added Sentry imports, captureError in 5 catch blocks, sentrySetUser after signIn/signUp, sentryClearUser after signOut
- `src/lib/foodApi.ts` - Added captureError import, wired into USDA fallback catch

## Decisions Made
- Aliased Sentry setUser/clearUser as sentrySetUser/sentryClearUser to avoid naming collision with authStore's user state
- Each captureError call includes an instanceof Error guard for type safety
- 429 rate limit errors from USDA API are NOT sent to Sentry (they are expected behavior handled by the cooldown mechanism)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Sentry DSN was already configured in prior phases.

## Next Phase Readiness
- All code changes for launch preparation complete
- OG social sharing image is correct dimensions
- Error tracking fully wired into production code paths
- Ready for testing and deployment phases

---
*Phase: 05-launch-preparation*
*Completed: 2026-02-05*
