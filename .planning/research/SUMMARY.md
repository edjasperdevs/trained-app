# Project Research Summary

**Project:** Trained -- Pre-Launch Confidence (E2E Testing + Analytics/Monitoring)
**Domain:** PWA quality assurance and observability enhancement
**Researched:** 2026-02-06
**Confidence:** HIGH

## Executive Summary

This milestone adds pre-launch safety nets to the existing Trained fitness PWA before deploying to ~90k Instagram followers with no beta testing phase. The research reveals a remarkably straightforward implementation: **no new vendors or major architectural changes are needed**. The app already has Sentry for error monitoring, Plausible for analytics, and Vitest for unit testing. What's missing is: (1) Playwright for E2E testing of critical user journeys, (2) activation of Sentry's existing performance monitoring capabilities, and (3) Plausible funnel configuration to track conversion paths.

The recommended approach is infrastructure-first: add test selectors (`data-testid` attributes) before writing any Playwright tests, configure two-project test architecture (auth tests vs. app tests) to handle the app's three-layer auth wall (AccessGate > Auth > Onboarding), and leverage the existing offline-first architecture by seeding Zustand localStorage rather than mocking Supabase. This avoids the complexity of database test fixtures while testing the actual user experience. For analytics, finalize funnel event naming before coding (names are permanent in Plausible's history), and wire the 14 existing-but-unused events already defined in `analytics.ts`. For Sentry, simply add `browserTracingIntegration()` to the existing init—it's already bundled, just not activated.

The critical risk is test selector fragility: the codebase has zero `data-testid` attributes after the recent shadcn/ui migration, and the app is icon-heavy with identical component structures across screens. Without stable selectors, tests become brittle and fail on innocent changes. The second risk is Supabase auth session handling in Playwright—naive per-test login is slow and creates rate-limiting exposure, but the app's `VITE_DEV_BYPASS` flag combined with `storageState` provides a clean solution. Service worker interference with network mocking and Zustand localStorage pollution between test runs are both critical but solvable with proper Playwright configuration (`serviceWorkers: 'block'` by default, careful `storageState` filtering).

## Key Findings

### Recommended Stack

The existing stack already provides everything needed—this milestone is about **deepening integrations** rather than adding vendors. Playwright is the sole new dev dependency, with zero production bundle impact. Sentry's `browserTracingIntegration` is already bundled in the installed `@sentry/react` package and just needs activation. Plausible funnel configuration is dashboard-only (no code changes to the script tag). The app's offline-first architecture (Zustand + localStorage as source of truth) is ideal for E2E testing because it eliminates the need for complex Supabase mocking in most tests.

**Core additions:**
- **@playwright/test ^1.58**: E2E testing framework — browser-based tests for critical user flows (auth, onboarding, workout logging, macro tracking, offline sync). Dev dependency only. Provides real browser testing (not jsdom), built-in auth session reuse via `storageState`, network interception, mobile viewport emulation, and offline simulation.
- **Sentry browserTracingIntegration**: Activate existing capability — enables automatic Web Vitals capture (LCP, CLS, INP), page load/navigation tracing, and XHR/fetch spans. Already included in `@sentry/react` bundle, near-zero bundle impact to enable.
- **Plausible funnel configuration**: Dashboard setup — define 3-4 conversion funnels (signup-to-first-workout, daily engagement, meal tracking adoption) from existing and new custom events. No script changes needed; base `script.js` supports `window.plausible()` with custom props.

**What NOT to add:**
- No MSW for E2E (Playwright's `page.route()` is simpler)
- No supawright (overkill for offline-first app; localStorage seeding is sufficient)
- No second analytics vendor (Plausible funnels + properties cover launch needs)
- No Lighthouse CI yet (add post-launch after design stability)
- No visual regression testing yet (design still settling after shadcn migration)

### Expected Features

Research reveals a clear MVP scope prioritized by launch safety: analytics gaps close immediately (low-risk, high-value event wiring), E2E tests provide the safety net for critical flows, and monitoring hardening ensures operational visibility at scale.

**Must have (table stakes):**
- **E2E tests for 7 critical user journeys** — Access gate > auth > onboarding, workout logging, meal tracking, daily check-in, XP claim, offline/sync. Manual testing cannot cover permutations at 90k-user launch scale.
- **Plausible funnel definitions** — Dashboard-configured funnels for signup-to-first-workout (3 steps), daily engagement (4 steps), meal logging adoption (2 steps). Answers "where do people drop off?"
- **Missing analytics events** — 8 gaps identified: onboarding step tracking (find drop-off points), abandonment events (workout, onboarding), food search success tracking, streak loss detection, PWA install tracking, error-to-event correlation.
- **Sentry performance monitoring + alerting** — Activate `browserTracingIntegration` for Web Vitals (LCP, CLS, INP), configure error spike alerts (>10 errors/5min), new issue alerts, release tracking, source maps upload.
- **Core Web Vitals baseline** — Pre-launch measurement to compare against. LCP <2.5s, INP <200ms, CLS <0.1.

**Should have (differentiators):**
- **Session replay on errors (already configured)** — Verify `replaysOnErrorSampleRate: 1.0` works in production. Add custom breadcrumbs at key state transitions (onboarding complete, workout start/end, check-in, sync events).
- **Cohort analysis via properties** — Add properties to events: `fitness_level`, `goal`, `days_since_signup` to understand which user segments retain better.
- **Analytics verification in E2E** — Test hook to verify critical events fire during user flows (onboarding completion, workout logging).

**Defer (post-launch):**
- Uptime monitoring (nice to have, not blocking)
- Lighthouse CI gate (requires CI pipeline work)
- Visual regression testing (wait for design stability)
- Additional E2E tests beyond critical 7-10 (add as bugs appear)

### Architecture Approach

The architecture centers on three independent but complementary systems: (1) Playwright E2E infrastructure using localStorage seeding to bypass complex Supabase test fixtures, (2) Plausible analytics enhancement via event wiring and SPA pageview tracking, and (3) Sentry performance monitoring via integration activation and custom spans. The key insight is that the app's offline-first design (Zustand localStorage as source of truth) makes it **ideal for E2E testing**—tests can seed state directly without database dependencies.

**Major components:**
1. **Playwright test infrastructure** — Two-project architecture: `auth-tests` (exercises AccessGate/Auth/Onboarding flows without bypass) and `app-tests` (uses `storageState` with seeded Zustand stores, bypassing auth). Fixtures for localStorage seeding adapted from existing `devSeed.ts`. Page object model for each screen (home, onboarding, workouts, macros). Service worker blocked by default to prevent cache interference. Animation disabled via CSS override to prevent flaky assertions.
2. **Plausible analytics wiring** — SPA pageview tracking via `useLocation` hook in App.tsx (no dependency on `plausible-tracker` npm package). Wire 14 existing-but-unused events to their trigger points (Macros screen, Settings screen, Achievements screen, authStore actions). Dashboard funnel configuration maps event sequences (3-4 funnels from 2-8 steps each).
3. **Sentry performance monitoring** — Add `browserTracingIntegration()` to existing `Sentry.init()` in main.tsx. Wrap sync operations (`syncAllToCloud`, `loadAllFromCloud`) in performance spans. Wrap food API calls in spans. Add breadcrumbs to key user actions (navigation, workout start/complete, meal logging, check-in, sync events). Configure PII masking for session replay (`maskAllInputs: true`, mask weight/meal data).

**Integration points:**
- `e2e/fixtures/seed.fixture.ts` adapts `src/lib/devSeed.ts` format for Playwright's `page.addInitScript()`
- `playwright.config.ts` `webServer` auto-starts Vite dev server with `VITE_DEV_BYPASS=true`
- `src/lib/analytics.ts` adds `usePageviewTracking()` hook exported for App.tsx
- `src/lib/sentry.ts` exports `startSpan()` helper for consistent API in app code
- CI workflow installs Playwright browsers, runs `npm run build`, then `playwright test` with production bundle

**Anti-patterns to avoid:**
- Testing against real Supabase in CI (use localStorage seeding + bypass instead)
- Adding `data-testid` after tests are written (selectors break immediately)
- Putting Sentry React Router integration before understanding routing (standard `browserTracingIntegration` is sufficient)
- Event naming inconsistency (existing 22 events use `{Noun} {Past Tense Verb}` Title Case pattern)

### Critical Pitfalls

Research identified 14 pitfalls; the top 5 are architectural blockers that must be addressed before code is written:

1. **Zero data-testid attributes after visual overhaul** — The shadcn/ui migration replaced all component markup. No stable test selectors exist. Tests relying on CSS classes or text content will break on innocent changes. **Prevention:** Add `data-testid` to critical interactive elements (navigation, form inputs, action buttons, modals) BEFORE writing any Playwright tests. Use naming convention `screen-element` (e.g., `auth-email-input`, `home-checkin-button`).

2. **Supabase auth session handling in Playwright** — Naive per-test login is slow (3-5s), flaky, and creates rate-limiting risk. Saved `storageState` with expired JWT causes all tests to fail simultaneously. The app has three auth gates (AccessGate > Auth > Onboarding). **Prevention:** Use Playwright project dependencies pattern: `setup` project authenticates once via Supabase REST API, saves `storageState`, all test projects load it. Create dedicated test user. Filter `storageState` to exclude Zustand stores, keeping only auth token.

3. **Service worker intercepting Playwright network mocking** — The app uses `vite-plugin-pwa` with `CacheFirst` for food APIs and `NetworkFirst` for Supabase. Service worker intercepts requests before `page.route()` sees them. Mocks never fire; tests get stale cached data. **Prevention:** Set `serviceWorkers: 'block'` in playwright.config.ts by default. Create separate test project for offline/SW behavior testing.

4. **Zustand localStorage pollution between test runs** — Saved `storageState` includes all 8 Zustand persist stores (`gamify-gains-*` keys). Test actions trigger `scheduleSync()` which writes to Supabase; next test may load that data. **Prevention:** Filter `storageState` to only include auth token, strip Zustand keys. Add `beforeEach` helper to clear `gamify-gains-*` localStorage keys. Use dedicated test Supabase instance.

5. **Plausible event names are permanent history** — 22 existing events use inconsistent naming (mostly `{Noun} {Past Tense Verb}` Title Case, some deviations). Once deployed, event names cannot be changed without losing historical data. **Prevention:** Document naming convention BEFORE adding new events. Map entire funnel as event names on paper first. Review new names against all 22 existing for consistency. Use custom properties for variants, not new event names.

## Implications for Roadmap

Based on research, suggested phase structure follows a strict dependency order: infrastructure and planning phases must precede implementation to avoid compounding failures.

### Phase 1: Test Infrastructure & Existing Test Repair
**Rationale:** Playwright infrastructure is a prerequisite for all E2E tests. Adding `data-testid` attributes is zero-behavior-change but required for reliable selectors. Existing unit tests (likely broken after shadcn migration) provide a baseline for regression detection.

**Delivers:**
- Audit of existing 6 test files (fix logic tests, delete broken visual tests)
- `data-testid` attributes on critical UI elements (navigation, forms, actions, modals)
- Playwright config with two projects (auth-tests, app-tests)
- Fixtures for localStorage seeding (adapted from `devSeed.ts`)
- `storageState` setup for auth reuse
- Service worker blocking configuration
- Animation disabling via CSS override
- CI workflow skeleton (without test execution yet)

**Addresses:**
- Pitfall #1 (zero data-testid)
- Pitfall #2 (auth session handling)
- Pitfall #3 (service worker interference)
- Pitfall #4 (localStorage pollution)
- Pitfall #12 (broken existing tests)

**Avoids:**
- Writing tests before selectors exist
- Debugging CI failures without local baseline

### Phase 2: Core E2E Test Suite
**Rationale:** With infrastructure in place, write tests for critical user journeys. These provide the safety net for all future changes. Focus on 7-10 tests covering launch-blocking flows.

**Delivers:**
- E2E tests for: auth flow, onboarding (10 steps), workout logging, meal logging, check-in, XP claim, offline/sync
- Page object models for each screen
- Verification that tests pass locally (dev server)
- Verification that tests pass in CI (production build)

**Addresses:**
- Feature requirement: E2E tests for critical journeys
- Pitfall #7 (animation flakiness)
- Pitfall #8 (CI environment differences)
- Pitfall #10 (AccessGate blocking tests)
- Pitfall #14 (sync debounce races)

**Avoids:**
- Testing implementation details (focus on user-visible behavior)
- Testing every screen and edge case (diminishing returns)

### Phase 3: Analytics Planning & Implementation
**Rationale:** Event naming is a one-way door. Plan on paper before coding. Wiring existing events is low-risk, high-value work that can happen independently of E2E tests.

**Delivers:**
- Documented event naming convention (Title Case `{Noun} {Past Tense Verb}`)
- Funnel design document (signup-to-first-workout, daily engagement, meal logging adoption, gamification loop)
- Wiring of 14 existing-but-unused events to their trigger points
- SPA pageview tracking via `useLocation` hook
- New events: onboarding step tracking, abandonment, food search, streak loss, PWA install, error correlation
- Dashboard configuration guide for Plausible goals and funnels
- E2E test verification that critical events fire

**Addresses:**
- Feature requirement: Plausible funnel definitions
- Feature requirement: Missing analytics events
- Pitfall #5 (event names permanent)
- Pitfall #11 (Plausible blocked in tests)

**Avoids:**
- Over-instrumenting (keep event count <40 for dashboard usability)
- Adding second analytics vendor

### Phase 4: Sentry Performance & Monitoring Hardening
**Rationale:** Performance monitoring adds bundle size. Do it after E2E tests exist to verify no breakage. Session replay PII masking is critical before launch.

**Delivers:**
- `browserTracingIntegration()` added to Sentry init
- Custom spans on sync operations and food API calls
- Breadcrumbs at key user actions
- Session replay PII masking for weight, meals, email
- Sentry alert configuration (error spike, new issue)
- Source maps upload
- Release tracking in build
- Bundle size verification (<50KB gzipped for vendor-sentry)

**Addresses:**
- Feature requirement: Sentry performance monitoring + alerting
- Feature requirement: Core Web Vitals baseline
- Pitfall #6 (bundle size doubling)
- Pitfall #13 (session replay PII leakage)

**Avoids:**
- Over-instrumenting with custom spans everywhere
- Missing PII masking before launch

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** Infrastructure (selectors, fixtures, config) must exist before tests are written. Adding `data-testid` after tests exist causes immediate breakage.
- **Phase 3 independent of Phases 1-2:** Analytics event naming and wiring can happen in parallel with E2E test infrastructure, but analytics verification tests depend on Phase 2 completing.
- **Phase 4 last:** Performance monitoring touches critical init paths (`sentry.ts`, `sync.ts`). Having E2E tests first provides confidence that monitoring doesn't break functionality. PII masking review requires manual Sentry dashboard testing, best done after other phases stabilize.
- **CI integration spans phases:** CI workflow skeleton created in Phase 1, executed with tests in Phase 2, includes analytics/Sentry verification in Phases 3-4.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (E2E tests):** Supabase auth flow testing if `storageState` approach proves insufficient. May need API research for Supabase REST endpoints.
- **Phase 3 (Analytics):** Food search event tracking depends on USDA/Open Food Facts API behavior; may need API research if 429 detection and fallback logic needs event correlation.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Playwright setup is well-documented. `data-testid` addition is mechanical. Test repair is codebase-specific, no external research needed.
- **Phase 4:** Sentry `browserTracingIntegration` is a single import with official docs. Breadcrumb placement is pattern-matching. PII masking is configuration-only.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Playwright version verified via npm (v1.58.1, published 2026-02-01), Sentry browserTracingIntegration confirmed in official docs as bundled with @sentry/react 10.x, Plausible funnel config verified in official docs |
| Features | HIGH | Critical journeys derived from codebase analysis (App.tsx routing, store interactions). Missing events identified by comparing existing analytics.ts against actual usage. Funnel definitions match Plausible capability (2-8 steps) |
| Architecture | HIGH | Two-project Playwright config is official pattern. localStorage seeding verified against existing devSeed.ts format. SPA pageview tracking via useLocation is standard React pattern. Sentry integration points confirmed in docs |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (1-5) verified via codebase analysis (`grep data-testid` = 0 results, vite.config.ts shows CacheFirst SW rules, Zustand persist keys documented). Animation pitfall based on community sources. CI differences based on standard Playwright pain points |

**Overall confidence:** HIGH

Research is comprehensive with official sources for all stack recommendations. Feature scope validated against codebase structure. Pitfall analysis grounded in actual codebase state (zero test selectors, existing auth flow, SW configuration). Medium confidence areas are standard Playwright pain points rather than domain-specific unknowns.

### Gaps to Address

Minor gaps that need validation during implementation:

- **Sentry `reactRouterV6BrowserTracingIntegration` exact API:** Research recommends skipping this in favor of standard `browserTracingIntegration()` because the app has no parameterized routes and uses `<BrowserRouter>` pattern. Validate during Phase 4 that route-change transactions are captured correctly without the React Router-specific integration.
- **Playwright `context.setOffline()` with vite-plugin-pwa:** Documented feature but not extensively tested with Workbox specifically. Validate during Phase 2's offline/sync test that offline simulation works as expected.
- **Plausible custom properties aggregation limitations:** Plausible is privacy-first and doesn't track individual users. Properties are aggregate-only. Validate during Phase 3 that property-based segmentation (e.g., training_days, fitness_level) provides sufficient insight, or flag need for deeper product analytics tool post-launch.
- **Zustand localStorage format stability:** The seed fixtures assume `{ state: {...}, version: N }` envelope format from current Zustand persist implementation. If Zustand version changes, seeding may break. Document format dependency and pin Zustand version.

## Sources

### Primary (HIGH confidence)
- [Playwright npm - v1.58.1](https://www.npmjs.com/package/@playwright/test)
- [Playwright installation](https://playwright.dev/docs/intro)
- [Playwright webServer](https://playwright.dev/docs/test-webserver)
- [Playwright authentication](https://playwright.dev/docs/auth)
- [Playwright release notes](https://playwright.dev/docs/release-notes)
- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [Sentry React tracing](https://docs.sentry.io/platforms/javascript/guides/react/tracing/)
- [Sentry browserTracingIntegration](https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/browsertracing/)
- [Sentry Web Vitals](https://docs.sentry.io/product/insights/frontend/web-vitals/)
- [Sentry automatic instrumentation](https://docs.sentry.io/platforms/javascript/guides/react/tracing/instrumentation/automatic-instrumentation/)
- [Plausible custom events](https://plausible.io/docs/custom-event-goals)
- [Plausible funnel analysis](https://plausible.io/docs/funnel-analysis)
- [Plausible custom properties](https://plausible.io/docs/custom-props/for-custom-events)
- [Plausible script extensions](https://plausible.io/docs/script-extensions)
- Direct codebase analysis: `src/lib/analytics.ts`, `src/lib/sentry.ts`, `src/lib/sync.ts`, `src/lib/devSeed.ts`, `src/stores/*.ts`, `src/App.tsx`, `vite.config.ts`, `package.json`

### Secondary (MEDIUM confidence)
- [Supabase auth in Playwright E2E (Mokkapps)](https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test)
- [Playwright + Vite + React setup (DEV Community)](https://dev.to/juan_deto/configure-vitest-msw-and-playwright-in-a-react-project-with-vite-and-ts-part-3-32pe)
- [Supawright test harness](https://github.com/isaacharrisholt/supawright)
- [@plausible-analytics/tracker npm](https://www.npmjs.com/package/@plausible-analytics/tracker)
- [Vite PWA testing docs](https://vite-pwa-org.netlify.app/guide/testing-service-worker)
- [BrowserStack: Playwright Selectors Best Practices](https://www.browserstack.com/guide/playwright-selectors-best-practices)

### Tertiary (LOW confidence -- verify before acting)
- Sentry `reactRouterV6BrowserTracingIntegration` exact import path and API -- verify against current SDK version during implementation
- Playwright `context.setOffline()` for PWA offline testing -- documented but not extensively tested with vite-plugin-pwa specifically

---
*Research completed: 2026-02-06*
*Ready for roadmap: yes*
