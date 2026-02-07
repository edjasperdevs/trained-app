---
phase: 01-test-foundation
plan: 02
subsystem: testing
tags: [playwright, e2e, data-testid, localstorage-seeding, vite-dev-server, zustand-persist]

# Dependency graph
requires:
  - phase: 01-test-foundation plan 01
    provides: green 139-test baseline (all vitest tests passing)
provides:
  - "Playwright E2E infrastructure with Vite dev server integration and chromium project"
  - "localStorage seeding fixtures that inject all 8 Zustand stores before page load"
  - "seededPage custom Playwright fixture with animation disabling and pre-authenticated state"
  - "3 passing smoke tests verifying app load, navigation, and test isolation"
  - "60 data-testid attributes across 11 screen/component files following screen-element naming"
affects: [02-01 (auth journey tests use seededPage and data-testid selectors), 02-02 (core feature journey tests)]

# Tech tracking
tech-stack:
  added: ["@playwright/test", "chromium (via npx playwright install)"]
  patterns:
    - "page.addInitScript for localStorage seeding before Zustand hydration"
    - "Custom test.extend<{ seededPage: Page }> fixture pattern"
    - "data-testid='screen-element' naming convention for stable E2E selectors"
    - "VITE_DEV_BYPASS=true in webServer.env to skip auth gates in E2E"
    - "serviceWorkers: 'block' to prevent SW cache interference"

key-files:
  created:
    - playwright.config.ts
    - e2e/tsconfig.json
    - e2e/helpers/storage.ts
    - e2e/fixtures/base.ts
    - e2e/tests/smoke.spec.ts
  modified:
    - package.json
    - .gitignore
    - src/components/Navigation.tsx
    - src/screens/AccessGate.tsx
    - src/screens/Auth.tsx
    - src/screens/Onboarding.tsx
    - src/screens/Home.tsx
    - src/screens/Workouts.tsx
    - src/screens/Macros.tsx
    - src/screens/AvatarScreen.tsx
    - src/screens/Settings.tsx
    - src/screens/CheckInModal.tsx
    - src/screens/XPClaimModal.tsx

key-decisions:
  - "Static seed data in e2e/helpers/storage.ts instead of reusing dynamic devSeed.ts (deterministic tests)"
  - "Chromium-only project -- no mobile browser projects yet (Phase 2 scope)"
  - "page.addInitScript over page.evaluate for localStorage seeding (runs before any page script)"

patterns-established:
  - "E2E test files in e2e/tests/, fixtures in e2e/fixtures/, helpers in e2e/helpers/"
  - "Import test/expect from e2e/fixtures/base.ts (not @playwright/test directly) for seeded fixtures"
  - "data-testid='screen-element' naming: screen name lowercase, element describes function, hyphens for multi-word"
  - "Use getByRole over getByText for assertions to avoid strict mode violations with duplicate text"

# Metrics
duration: ~15min
completed: 2026-02-07
---

# Phase 1 Plan 2: Playwright E2E Infrastructure and data-testid Selectors Summary

**Playwright E2E framework with Vite dev server, localStorage seeding fixtures for all 8 Zustand stores, 3 passing smoke tests, and 60 data-testid attributes across 11 screen files**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-07T04:15:00Z
- **Completed:** 2026-02-07T04:30:39Z
- **Tasks:** 3
- **Files modified:** 18

## Accomplishments
- Playwright installed and configured with Vite dev server integration, service worker blocking, and animation disabling
- localStorage seeding fixtures inject all 8 Zustand stores via page.addInitScript before page load, enabling pre-authenticated E2E testing
- 3 smoke tests pass: app loads with seeded state, navigation works across all 5 screens, and test isolation confirmed
- 60 data-testid attributes added across 11 screen/component files following consistent screen-element naming convention
- Zero behavior changes: all 139 unit tests pass, TypeScript compiles cleanly, existing functionality untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Playwright and create configuration with Vite dev server integration** - `a62b4ed1` (chore)
2. **Task 2: Build localStorage seeding fixtures and smoke test** - `72fadebb` (feat)
3. **Task 3: Add data-testid attributes to all interactive elements across screens** - `2d374580` (feat)

**Plan metadata:** `b999bbc2` (docs: complete plan)

## Files Created/Modified
- `playwright.config.ts` - Playwright config with Vite webServer, chromium project, service worker blocking
- `e2e/tsconfig.json` - TypeScript config for E2E directory with bundler module resolution
- `e2e/helpers/storage.ts` - STORE_KEYS, seedStore, seedAllStores, clearAllStores for localStorage seeding
- `e2e/fixtures/base.ts` - Custom test with seededPage fixture (seeds stores, disables animations, navigates)
- `e2e/tests/smoke.spec.ts` - 3 smoke tests: load, navigate, isolation
- `package.json` - Added @playwright/test devDependency and 3 test:e2e scripts
- `.gitignore` - Added Playwright artifact patterns
- `src/components/Navigation.tsx` - Added data-testid="navigation" and nav-{label} on each link
- `src/screens/AccessGate.tsx` - Added access-gate, access-code-input, access-submit-button
- `src/screens/Auth.tsx` - Added auth-screen, auth-email-input, auth-password-input, auth-submit-button, auth-toggle-mode
- `src/screens/Onboarding.tsx` - Added onboarding-screen, onboarding-progress, step testids, input testids, button testids
- `src/screens/Home.tsx` - Added home-screen, home-checkin-button, home-streak-display, home-xp-display, home-level-display, home-claim-xp-button
- `src/screens/Workouts.tsx` - Added workouts-screen, workouts-start-button, workouts-complete-button, workouts-exercise-card, set inputs, workouts-history
- `src/screens/Macros.tsx` - Added macros-screen, macros-food-search-input, macros-add-meal-button, macros-protein/calories-display, macros-meal-entry, macros-saved-meals
- `src/screens/AvatarScreen.tsx` - Added avatar-screen, avatar-display, avatar-stage, avatar-mood
- `src/screens/Settings.tsx` - Added settings-screen, settings-export-button, settings-signout-button, settings-achievements-link
- `src/screens/CheckInModal.tsx` - Added checkin-modal, checkin-confirm-button, checkin-streak-display
- `src/screens/XPClaimModal.tsx` - Added xpclaim-modal, xpclaim-claim-button, xpclaim-amount-display

## Decisions Made
- **Static seed data over dynamic devSeed.ts:** E2E helpers use hardcoded dates and values instead of Date.now()/Math.random() for deterministic, reproducible tests
- **Chromium-only:** No mobile browser projects added yet -- Phase 2 will add them when writing journey tests
- **page.addInitScript over page.evaluate:** Ensures localStorage is populated before Zustand hydration happens, not after
- **getByRole over getByText in smoke tests:** Avoids strict mode violations when text like "Macros" appears in multiple elements (heading, button, nav)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed strict mode violation in smoke test navigation assertions**
- **Found during:** Task 2 (smoke test creation)
- **Issue:** `getByText('Macros')` resolved to 3 elements (h1 heading, "Log Macros" button, and nav link), causing Playwright strict mode failure
- **Fix:** Changed assertions from `getByText('Macros')` to `getByRole('heading', { name: 'Macros' })`, and similarly for Avatar screen (`getByRole('heading', { name: 'Your Status' })`) and Settings screen (`getByRole('heading', { name: 'Settings' })`)
- **Files modified:** e2e/tests/smoke.spec.ts
- **Verification:** All 3 smoke tests pass
- **Committed in:** 72fadebb (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test assertion fix for correctness. No scope creep.

## Issues Encountered
None beyond the strict mode fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 1 complete: all 139 unit tests pass, 3 Playwright smoke tests pass, 60 data-testid selectors ready
- Phase 2 (E2E Critical Journeys) can begin immediately -- seededPage fixture, data-testid selectors, and Playwright config are all in place
- No blockers or concerns

---
*Phase: 01-test-foundation*
*Completed: 2026-02-07*

## Self-Check: PASSED
