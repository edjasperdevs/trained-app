# Roadmap: Trained Pre-Launch Confidence

## Milestones

- **v1.0 Launch Polish** - 5 phases, 16 requirements (shipped)
- **v1.1 Design Refresh** - 7 phases, 25 requirements (shipped)
- **v1.2 Pre-Launch Confidence** - 4 phases, 21 requirements (in progress)

## Overview

Pre-launch safety nets before deploying to ~90k Instagram followers with no beta phase. Four phases follow a strict dependency chain: repair existing tests and build Playwright infrastructure (selectors, fixtures, config), then write E2E tests for 7 critical user journeys, then enhance Plausible analytics with funnel tracking and missing events, and finally harden Sentry monitoring with performance tracing, source maps, and PII-safe session replay. Zero behavior changes -- testing and observability only.

**Phases:** 4
**Requirements:** 21 mapped
**Depth:** Standard
**Execution:** Sequential

## Phases

<details>
<summary>v1.0 Launch Polish (shipped) -- see archived milestone</summary>
5 phases, 10 plans, 16 requirements -- all complete.
</details>

<details>
<summary>v1.1 Design Refresh (shipped 2026-02-05) -- see archived milestone</summary>
7 phases, 12 plans, 25 requirements -- all complete.
</details>

### v1.2 Pre-Launch Confidence

**Milestone Goal:** Nothing is broken and you can see exactly how users interact from day one

- [x] **Phase 1: Test Foundation** - Repair broken tests, install Playwright, add data-testid selectors, build auth/seed fixtures
- [x] **Phase 2: E2E Critical Journeys** - Write Playwright tests for 7 launch-critical user flows
- [x] **Phase 3: Analytics Enhancement** - Design event naming convention, wire missing Plausible events, configure funnel tracking
- [x] **Phase 4: Monitoring Hardening** - Activate Sentry performance tracing, upload source maps, configure alerts, mask PII in replay

## Phase Details

### Phase 1: Test Foundation
**Goal**: The existing test suite passes, Playwright is ready to author tests against, and every critical interactive element has a stable test selector
**Depends on**: Nothing (first phase of milestone)
**Requirements**: TEST-01, TEST-02, E2E-01, E2E-02, E2E-03, E2E-04
**Success Criteria** (what must be TRUE):
  1. `vitest run` passes with zero failures (existing tests repaired or intentionally removed after design refresh)
  2. `tsc --noEmit` passes with zero type errors
  3. `npx playwright test --list` shows the test runner configured with Vite dev server integration and at least one placeholder test discoverable
  4. All navigation elements, form inputs, action buttons, and modals across screens have `data-testid` attributes following a consistent `screen-element` naming convention
  5. A Playwright test can start with a pre-authenticated state (localStorage seeded with valid Zustand stores, bypassing the AccessGate/Auth/Onboarding wall) and tests run in isolation with no state leakage between them
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Repair 4 failing component test assertions to match post-shadcn class names
- [x] 01-02-PLAN.md -- Install Playwright, configure with Vite dev server, build localStorage seeding fixtures, add data-testid attributes to all screens

---

### Phase 2: E2E Critical Journeys
**Goal**: Seven Playwright tests cover every launch-critical user flow -- if any of these break, you know before users do
**Depends on**: Phase 1
**Requirements**: E2E-05, E2E-06, E2E-07, E2E-08, E2E-09, E2E-10, E2E-11
**Success Criteria** (what must be TRUE):
  1. A new user can navigate access gate, sign up, complete onboarding, and land on the home screen (E2E verified)
  2. An existing user can sign in and see their data on the home screen (E2E verified)
  3. A user can add an exercise, log sets with reps/weight, and save a completed workout (E2E verified)
  4. A user can search for food, add a meal entry, and see updated macro totals (E2E verified)
  5. A user can complete daily check-in (streak maintained), claim weekly XP, and survive an offline-to-online sync cycle (E2E verified)
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md -- Auth and onboarding journey tests: chromium-auth project + Supabase mocks + access gate/signup/onboarding/signin E2E tests (E2E-05, E2E-06)
- [x] 02-02-PLAN.md -- Core feature journey tests: workout logging, meal logging, daily check-in, weekly XP claim, offline sync E2E tests (E2E-07 through E2E-11)

---

### Phase 3: Analytics Enhancement
**Goal**: Every step of the user funnel is tracked -- you can see exactly where people drop off from sign-up through habit formation
**Depends on**: Phase 1 (test foundation must exist to verify events fire)
**Requirements**: ANLYT-01, ANLYT-02, ANLYT-03, ANLYT-04
**Success Criteria** (what must be TRUE):
  1. A documented event naming convention exists and all existing + new events follow it consistently
  2. All 14 previously-unwired Plausible events fire when their corresponding user actions occur
  3. Navigating between screens fires SPA pageview events (not just the initial page load)
  4. Funnel definitions are documented covering sign up through first workout through 7-day retention, with each step mapping to a trackable Plausible event
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md -- Document event naming convention and funnel definitions (ANLYT-01, ANLYT-04)
- [x] 03-02-PLAN.md -- Wire 14 missing events, verify SPA pageview tracking (ANLYT-02, ANLYT-03)

---

### Phase 4: Monitoring Hardening
**Goal**: Sentry captures performance data, readable stack traces, and PII-safe session replays -- with alerts that fire before users complain
**Depends on**: Phase 2 (E2E tests provide confidence that monitoring changes don't break functionality)
**Requirements**: MON-01, MON-02, MON-03, MON-04
**Success Criteria** (what must be TRUE):
  1. Sentry dashboard shows Core Web Vitals (LCP, CLS, INP) and page load performance data from the running app
  2. Error stack traces in Sentry display readable source-mapped code (not minified bundles)
  3. Alert rules are configured to notify on error rate spikes (catches launch-day regressions)
  4. Session replay recordings mask all health/fitness PII -- body weight, meal data, and body metrics are not visible in replays
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md -- Configure Sentry tracing, replay integration, source map upload, ErrorBoundary wiring (MON-01, MON-02, MON-04 partial)
- [x] 04-02-PLAN.md -- Add PII masking to health/fitness screens, configure Sentry alert rules (MON-03, MON-04)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Test Foundation | 2/2 | Complete | 2026-02-07 |
| 2. E2E Critical Journeys | 2/2 | Complete | 2026-02-07 |
| 3. Analytics Enhancement | 2/2 | Complete | 2026-02-07 |
| 4. Monitoring Hardening | 2/2 | Complete | 2026-02-07 |

---
*Roadmap created: 2026-02-06*
*Total: 4 phases, 8 plans, 21 requirements*
