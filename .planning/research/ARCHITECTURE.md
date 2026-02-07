# Architecture: E2E Testing + Analytics/Monitoring Integration

**Domain:** Playwright E2E tests, Plausible funnel events, and Sentry performance monitoring for a React + Vite + Zustand + Supabase offline-first PWA
**Researched:** 2026-02-06
**Confidence:** HIGH (codebase analysis + official docs cross-referenced)

---

## Current Architecture (What Exists)

### System Overview

```
Browser
+--------------------------------------------------------------------+
|  index.html                                                         |
|  +-- Plausible script tag (defer, data-domain)                     |
|  +-- <div id="root">                                                |
|      |                                                              |
|      main.tsx                                                       |
|      +-- initSentry()           <-- Sentry SDK init (prod only)    |
|      +-- <ErrorBoundary>        <-- Sentry.ErrorBoundary            |
|      +-- <BrowserRouter>                                            |
|          +-- <App>                                                  |
|              +-- AppContent()                                       |
|                  +-- AccessGate | Auth | Onboarding | Main Routes  |
|                  +-- <SyncStatusIndicator>                          |
|                  +-- <Navigation>                                   |
|                                                                     |
|  Zustand Stores (8 stores, localStorage persistence)               |
|  +-- gamify-gains-user, -workouts, -macros, -xp, -avatar,         |
|  |   -achievements, -access, -reminders                            |
|  +-- syncStore (non-persisted, runtime only)                       |
|                                                                     |
|  Service Worker (vite-plugin-pwa / Workbox)                        |
|  +-- Precache: *.{js,css,html,ico,png,svg,woff2}                  |
|  +-- Runtime: USDA (CacheFirst), OpenFoodFacts (CacheFirst),       |
|  |           Supabase REST (NetworkFirst, 3s timeout)              |
+--------------------------------------------------------------------+
        |
        v
+------------------+    +------------------+    +------------------+
|  Supabase        |    |  Sentry          |    |  Plausible       |
|  (Auth + DB)     |    |  (Errors +       |    |  (Privacy-first  |
|  - profiles      |    |   Performance)   |    |   analytics)     |
|  - workout_logs  |    |  10% traces      |    |  Script tag      |
|  - macro_targets |    |  100% error      |    |  window.plausible|
|  - daily_macro_  |    |   replays        |    |  Custom events   |
|    logs          |    |                  |    |                  |
|  - weight_logs   |    |                  |    |                  |
|  - user_xp       |    |                  |    |                  |
+------------------+    +------------------+    +------------------+
```

### Current Analytics State

**Plausible (`src/lib/analytics.ts`):**
- `window.plausible` global from script tag in `index.html`
- `trackEvent()` wrapper that no-ops in dev mode
- `analytics` object with 20+ pre-defined event functions
- Events currently wired in: Onboarding (1 call), Workouts (4 calls), CheckIn (1 call), XPClaim (2 calls)
- Events defined but NOT wired: mealLogged, mealSaved, proteinTargetHit, calorieTargetHit, badgeEarned, avatarEvolved, appOpened, settingsViewed, achievementsViewed, dataExported, signupCompleted, loginCompleted, coachDashboardViewed, clientViewed
- No funnel goals configured in Plausible dashboard
- No SPA pageview tracking (relies on default script.js which only tracks initial load)

**Sentry (`src/lib/sentry.ts`):**
- `@sentry/react` v10.38+ initialized in `main.tsx`
- `tracesSampleRate: 0.1` (10% of transactions)
- `replaysOnErrorSampleRate: 1.0` (100% on error)
- `ErrorBoundary` wrapping root and AppContent
- `captureError()` in 8 catch blocks (auth x4, sync x2, foodApi x1)
- `setUser()`/`clearUser()` on login/logout
- `addBreadcrumb()` exported but NEVER called in app code
- NO `browserTracingIntegration` configured (only `tracesSampleRate`)
- NO React Router integration (route changes not tracked)
- NO custom spans for API calls or user interactions

**Test Infrastructure (`src/test/`):**
- Vitest (unit tests) with jsdom environment
- `setup.ts`: localStorage mock, matchMedia mock, ResizeObserver mock
- `utils.tsx`: custom render with BrowserRouter, mockDate helper, resetStore helper
- 3 existing unit test files: `macroStore.test.ts`, `workoutStore.test.ts`, `xpStore.test.ts`
- NO E2E tests
- NO Playwright configuration
- NO CI/CD pipeline

**Dev Utilities:**
- `devSeed.ts`: Comprehensive seed data for all 8 stores via localStorage
- `VITE_DEV_BYPASS=true` env var skips auth + access gate
- `?reset=true` URL param clears all data
- `window.seedTestData()` / `window.clearTestData()` in dev mode

---

## Recommended Architecture (What to Build)

### Three Integration Areas

This milestone adds three independent but complementary systems:

```
1. PLAYWRIGHT E2E TESTS          2. PLAUSIBLE FUNNELS         3. SENTRY PERFORMANCE
(test infrastructure)             (analytics enhancement)       (monitoring enhancement)

e2e/                              src/lib/analytics.ts          src/lib/sentry.ts
+-- fixtures/                     +-- Enhanced trackEvent()     +-- browserTracingIntegration
|   +-- auth.ts                   +-- Funnel-aware events       +-- reactRouterV6 integration
|   +-- seed.ts                   +-- SPA pageview tracking     +-- Custom spans for sync
|   +-- base.ts                                                 +-- Web Vitals
+-- pages/                        Plausible Dashboard
|   +-- home.page.ts              +-- Goal definitions          Sentry Dashboard
|   +-- workouts.page.ts          +-- Funnel: Onboarding        +-- Transaction traces
|   +-- macros.page.ts            +-- Funnel: First Workout     +-- Performance metrics
|   +-- onboarding.page.ts        +-- Funnel: Daily Engagement  +-- Web Vitals
+-- tests/
|   +-- smoke.spec.ts
|   +-- onboarding.spec.ts
|   +-- workout.spec.ts
|   +-- macros.spec.ts
|   +-- offline.spec.ts
+-- playwright.config.ts
.github/workflows/e2e.yml
```

### Integration Point Map

| Existing Module | Playwright Touches | Plausible Touches | Sentry Touches |
|---|---|---|---|
| `main.tsx` | -- | -- | Add `browserTracingIntegration`, router instrumentation |
| `App.tsx` | Test target (all routes) | -- | Wrap `Routes` with Sentry HOC |
| `src/lib/analytics.ts` | Mock in tests | Add SPA pageview, wire unwired events | -- |
| `src/lib/sentry.ts` | Disable in tests | -- | Add integrations, custom spans |
| `src/lib/sync.ts` | Seed data bypasses sync | -- | Add performance spans |
| `src/lib/supabase.ts` | Test client or mock | -- | -- |
| `src/lib/devSeed.ts` | Adapt for E2E fixtures | -- | -- |
| `src/stores/*.ts` | Seed via localStorage | Event fire points | -- |
| `index.html` | -- | Upgrade to `script.hash.js` or manual SPA tracking | -- |
| `vite.config.ts` | Reference in webServer config | -- | -- |
| `package.json` | Add Playwright devDep + scripts | -- | -- |

---

## Area 1: Playwright E2E Test Architecture

### Directory Structure

```
/Users/ejasper/code/trained-app/
+-- e2e/                              <-- NEW: E2E test root (outside src/)
|   +-- fixtures/
|   |   +-- base.ts                   <-- Extended test with custom fixtures
|   |   +-- auth.fixture.ts           <-- Auth state management
|   |   +-- seed.fixture.ts           <-- localStorage seeding
|   +-- pages/
|   |   +-- base.page.ts             <-- Shared page helpers
|   |   +-- home.page.ts
|   |   +-- onboarding.page.ts
|   |   +-- workouts.page.ts
|   |   +-- macros.page.ts
|   |   +-- auth.page.ts
|   |   +-- settings.page.ts
|   +-- tests/
|   |   +-- smoke.spec.ts            <-- App loads, nav works
|   |   +-- onboarding.spec.ts       <-- Full onboarding flow
|   |   +-- workout-flow.spec.ts     <-- Start/complete workout
|   |   +-- macro-logging.spec.ts    <-- Log a meal
|   |   +-- offline-sync.spec.ts     <-- Offline behavior + sync
|   |   +-- auth-flow.spec.ts        <-- Login/logout
|   +-- helpers/
|   |   +-- storage.ts               <-- localStorage seeding utilities
|   |   +-- wait.ts                   <-- Custom wait helpers
+-- playwright.config.ts              <-- NEW: Playwright configuration
+-- .github/
|   +-- workflows/
|       +-- e2e.yml                   <-- NEW: CI workflow
```

### Why Outside `src/`

E2E tests run against the built/served app, not imported into the bundle. Keeping them in `e2e/` avoids:
- Vite trying to process test files
- TypeScript `include` conflicts (current tsconfig excludes `src/**/*.test.*`)
- Confusion between Vitest (unit) and Playwright (E2E) test files

### Fixture Architecture

The key design decision: **use Playwright fixtures + localStorage seeding instead of Supabase test users**.

Rationale:
- The app is offline-first. Zustand + localStorage is the source of truth.
- Supabase is only used for cloud sync, which is optional.
- `devSeed.ts` already builds comprehensive test data for all 8 stores.
- `VITE_DEV_BYPASS=true` skips auth and access gate entirely.
- Testing against real Supabase in CI adds complexity, flakiness, and cost.

```
Fixture Composition:

  base.ts
  +-- Extends Playwright's test with:
  |   +-- seededPage: Page with localStorage pre-populated
  |   +-- cleanPage: Page with empty localStorage
  |
  +-- seed.fixture.ts
  |   +-- Adapts devSeed.ts data format for Playwright
  |   +-- injectStoreData(page, storeName, data)
  |   +-- clearAllStores(page)
  |   +-- STORE_KEYS constant (all 8 localStorage keys)
  |
  +-- auth.fixture.ts (optional, for Supabase integration tests only)
      +-- Uses storageState for Supabase session
      +-- Only needed if testing cloud sync E2E
```

### Seeding Strategy

```typescript
// e2e/helpers/storage.ts - Core seeding utility

// These match the Zustand persist keys from src/stores/*.ts
const STORE_KEYS = {
  user: 'gamify-gains-user',
  workouts: 'gamify-gains-workouts',
  macros: 'gamify-gains-macros',
  xp: 'gamify-gains-xp',
  avatar: 'gamify-gains-avatar',
  achievements: 'gamify-gains-achievements',
  access: 'gamify-gains-access',
  reminders: 'gamify-gains-reminders',
} as const

// Seed before page navigates (via addInitScript or page.evaluate)
async function seedStore(page: Page, key: string, state: object) {
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, value)
  }, { key, value: JSON.stringify({ state, version: 0 }) })
}
```

The critical insight: Zustand persist stores data as `{ state: {...}, version: N }`. The seed data must match this envelope format exactly, as seen in `devSeed.ts` (e.g., `{ state: { profile: {...} }, version: 0 }`).

### Test Isolation

Each Playwright test gets a fresh browser context by default. This means:
- localStorage is empty at test start (clean slate)
- No cross-test contamination from Zustand stores
- Each test seeds exactly the state it needs

For tests that need a "logged in with data" state:
1. Use `addInitScript` to inject localStorage BEFORE page load
2. Set `VITE_DEV_BYPASS=true` in the dev/preview server env
3. The app reads Zustand stores from localStorage on mount

For tests that need a "fresh user" state:
1. Don't seed anything -- localStorage is already empty
2. The app shows AccessGate > Auth > Onboarding flow

### Service Worker Handling

The PWA service worker complicates E2E testing because:
- Cached responses may be stale
- Service worker registration is async
- Workbox runtime caching intercepts API calls

**Recommendation:** Disable the service worker in E2E test builds.

In `playwright.config.ts`, use `vite preview` (production build) but with service worker unregistered:

```typescript
// In test setup or fixture
await page.addInitScript(() => {
  // Prevent service worker registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(r => r.unregister())
    })
  }
})
```

Alternatively, for one dedicated `offline.spec.ts` test file, keep the service worker active and use `context.setOffline(true)` to test offline behavior.

### Page Object Model

Each page object encapsulates selectors and actions for a screen:

```typescript
// e2e/pages/home.page.ts
export class HomePage {
  constructor(private page: Page) {}

  // Locators (prefer data-testid, role, or text)
  get streakDisplay() { return this.page.getByTestId('streak-display') }
  get checkInButton() { return this.page.getByRole('button', { name: /check.in/i }) }
  get navigation() { return this.page.getByRole('navigation') }

  // Actions
  async navigateTo(tab: 'home' | 'workouts' | 'macros' | 'avatar' | 'settings') {
    await this.navigation.getByRole('link', { name: new RegExp(tab, 'i') }).click()
  }

  async checkIn() {
    await this.checkInButton.click()
  }
}
```

**Important:** The existing codebase does NOT use `data-testid` attributes. Adding them to key interactive elements is a prerequisite step. Target elements:
- Navigation links
- Primary action buttons on each screen
- Form inputs in Onboarding and Macros
- Modal triggers and close buttons

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:4173',  // vite preview port
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },  // PWA is mobile-first
    },
  ],
  webServer: {
    command: process.env.CI
      ? 'npx vite preview --port 4173'
      : 'npx vite dev --port 5173',
    port: process.env.CI ? 4173 : 5173,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_DEV_BYPASS: 'true',
    },
  },
})
```

**Note:** On CI, run `npm run build` before Playwright. The `webServer.command` for CI uses `vite preview` which serves the production build. This tests the real bundle (minified, tree-shaken) rather than the dev server.

### CI Pipeline

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
        env:
          VITE_DEV_BYPASS: 'true'
      - run: npx playwright test
        env:
          CI: true
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Area 2: Plausible Analytics Enhancement Architecture

### Current State vs Target State

```
CURRENT                              TARGET
-------                              ------
script.js (pageview only)    -->     script.hash.js OR manual SPA tracking
8 events wired               -->     20+ events wired
0 goals in dashboard         -->     All custom events as goals
0 funnels                    -->     3 funnels defined
No SPA pageview tracking     -->     Route-change pageviews
```

### SPA Pageview Tracking

The current `script.js` from Plausible only tracks the initial page load. For a React SPA with `react-router-dom`, route changes are invisible to Plausible.

**Solution:** Replace `script.js` with `script.hash.js` in `index.html`, OR add manual pageview tracking on route changes.

Since the app uses `BrowserRouter` (history-based routing, not hash-based), the correct script extension is NOT `script.hash.js`. Instead, use the auto SPA tracking approach:

**Option A (recommended):** Use `plausible-tracker` npm package for programmatic control:

```typescript
// src/lib/analytics.ts - enhanced
import Plausible from 'plausible-tracker'

const plausible = Plausible({
  domain: 'trained-app-eta.vercel.app',
  trackLocalhost: false,
})

// Call once on app mount
export function enableSPAPageviews() {
  plausible.enableAutoPageviews()  // Intercepts pushState/popstate
}
```

**Option B (simpler):** Track pageviews manually in a route-change hook:

```typescript
// In App.tsx or a dedicated hook
import { useLocation } from 'react-router-dom'

function usePageviewTracking() {
  const location = useLocation()
  useEffect(() => {
    if (window.plausible) {
      window.plausible('pageview')
    }
  }, [location.pathname])
}
```

**Recommendation:** Option B. It requires no new dependency, integrates with the existing `window.plausible` pattern already in the codebase, and is simpler to reason about. The script tag in `index.html` stays as-is.

### Event Wiring Map

Events defined in `analytics.ts` but NOT currently called anywhere in the app:

| Event | Where to Wire | How |
|---|---|---|
| `mealLogged` | `Macros.tsx` (after meal add) | After `addMealToLog()` call |
| `mealSaved` | `MealBuilder.tsx` (save button) | After `saveMeal()` call |
| `proteinTargetHit` | `Macros.tsx` (target comparison) | When daily protein >= target |
| `calorieTargetHit` | `Macros.tsx` (target comparison) | When daily calories >= target |
| `badgeEarned` | `achievementsStore.ts` (badge check) | After new badge detected |
| `avatarEvolved` | `avatarStore.ts` (evolution check) | After stage increases |
| `appOpened` | `App.tsx` (mount effect) | On initial mount |
| `settingsViewed` | `Settings.tsx` (mount) | On screen mount |
| `achievementsViewed` | `Achievements.tsx` (mount) | On screen mount |
| `dataExported` | `Settings.tsx` (export action) | After export completes |
| `signupCompleted` | `authStore.ts` (signUp success) | After successful signup |
| `loginCompleted` | `authStore.ts` (signIn success) | After successful login |
| `coachDashboardViewed` | `Coach.tsx` (mount) | On screen mount |
| `clientViewed` | `Coach.tsx` (client select) | When viewing client detail |

### Funnel Definitions

Three funnels to configure in the Plausible dashboard:

**Funnel 1: Onboarding Completion** (3 steps)
1. `Signup Completed` (custom event)
2. `Onboarding Started` (custom event -- needs wiring)
3. `Onboarding Completed` (custom event -- already wired)

**Funnel 2: First Workout** (3 steps)
1. `Onboarding Completed`
2. `Workout Started` (already wired)
3. `Workout Completed` (already wired)

**Funnel 3: Daily Engagement Loop** (4 steps)
1. `App Opened` (needs wiring)
2. `Check-In Completed` (already wired)
3. `Workout Completed` (already wired)
4. `Meal Logged` (needs wiring)

**Dashboard setup is manual:** Goals and funnels are configured in the Plausible web dashboard at `plausible.io/trained-app-eta.vercel.app/settings/goals`. Each custom event must be registered as a goal before it appears in analytics. Funnel steps reference these goals.

### Data Flow for Analytics Events

```
User Action (e.g., completes workout)
    |
    v
Screen Component (Workouts.tsx)
    |
    +-- 1. Update Zustand store (workoutStore.completeWorkout())
    +-- 2. Fire analytics event (analytics.workoutCompleted(type, duration))
    +-- 3. Schedule sync (scheduleSync())
    |
    v
analytics.workoutCompleted()
    |
    +-- trackEvent('Workout Completed', { workout_type, duration_minutes })
    |
    v
trackEvent()
    |
    +-- DEV? console.log('[Analytics]', ...)
    +-- PROD? window.plausible('Workout Completed', { props: {...} })
    |
    v
Plausible script (async, non-blocking)
    +-- POST to plausible.io/api/event
```

---

## Area 3: Sentry Performance Monitoring Architecture

### Current State vs Target State

```
CURRENT                              TARGET
-------                              ------
Error tracking only          -->     Error + Performance monitoring
No browser tracing           -->     browserTracingIntegration
No route instrumentation     -->     reactRouterV6 integration
10% sample rate              -->     10% (keep, appropriate for scale)
No custom spans              -->     Spans on sync operations
No Web Vitals                -->     LCP, FID, CLS tracked
8 captureError calls         -->     8+ (add sync span context)
0 addBreadcrumb calls        -->     Breadcrumbs on key user actions
```

### Sentry Init Enhancement

The current `initSentry()` in `src/lib/sentry.ts` needs to add `browserTracingIntegration`. However, there is a complication: `reactRouterV6BrowserTracingIntegration` requires React hooks (`useEffect`, `useLocation`, `useNavigationType`) and React Router utilities (`createRoutesFromChildren`, `matchRoutes`), which means it must be called within the React tree, NOT in `main.tsx` before render.

**Architecture decision:** Keep `Sentry.init()` in `main.tsx` (before render) but use the standard `browserTracingIntegration()` rather than the React Router-specific one. Route names will be captured from `window.location.pathname` automatically.

Why not `reactRouterV6BrowserTracingIntegration`:
- The app uses `<BrowserRouter>` + `<Routes>` pattern (declarative)
- Sentry's v6 integration requires wrapping Routes with `withSentryReactRouterV6Routing(Routes)`
- This requires restructuring the routing in `App.tsx`
- The standard `browserTracingIntegration()` already captures page load + navigation via History API
- The added value of route parameterization (e.g., `/user/:id` instead of `/user/123`) is minimal for this app (no dynamic route params exist)

**Updated `initSentry()`:**

```typescript
// src/lib/sentry.ts - enhanced init
import * as Sentry from '@sentry/react'

export function initSentry() {
  if (import.meta.env.DEV || !SENTRY_DSN) return

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),  // NEW: page load + navigation
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [/* existing list */],
    beforeSend(event) { /* existing PII filter */ },
  })
}
```

### Custom Performance Spans

Add spans to the most important operations to understand performance:

```typescript
// src/lib/sync.ts - add spans to sync operations
import * as Sentry from '@sentry/react'

export async function syncAllToCloud() {
  return Sentry.startSpan(
    { name: 'sync.all', op: 'sync' },
    async () => {
      // existing sync logic
      // Each sub-sync can be a child span
    }
  )
}
```

Key operations to instrument with spans:

| Operation | Location | Span Name |
|---|---|---|
| Full sync to cloud | `sync.ts` `syncAllToCloud()` | `sync.all` |
| Full load from cloud | `sync.ts` `loadAllFromCloud()` | `sync.load` |
| Food API search | `foodApi.ts` `searchFoods()` | `api.food-search` |
| Auth initialization | `authStore.ts` `initialize()` | `auth.init` |

### Breadcrumb Strategy

The `addBreadcrumb()` function exists but is never called. Add breadcrumbs at key user interaction points so that error reports include context:

```typescript
// Example: in Workouts.tsx
addBreadcrumb('Started workout', 'user.action', { workoutType: type })

// Example: in sync.ts
addBreadcrumb('Sync completed', 'sync', { duration: elapsed })
```

Target breadcrumb locations:
- Navigation between screens
- Workout start/complete
- Meal logging
- Check-in completion
- XP claim
- Sync start/complete/error
- Online/offline transitions

### Files Modified

| File | Change | Why |
|---|---|---|
| `src/lib/sentry.ts` | Add `browserTracingIntegration` to init | Enable performance tracing |
| `src/lib/sentry.ts` | Add `startSpan` helper export | Consistent span API for app code |
| `src/lib/sync.ts` | Wrap sync functions with spans | Track sync performance |
| `src/lib/foodApi.ts` | Wrap search with span | Track API latency |
| `src/stores/authStore.ts` | Add span to `initialize()` | Track auth init time |
| Various screens | Add `addBreadcrumb()` calls | Context for error reports |

---

## New Files Summary

| File | Type | Purpose |
|---|---|---|
| `playwright.config.ts` | Config | Playwright test runner configuration |
| `e2e/fixtures/base.ts` | Fixture | Extended test with seeded/clean page fixtures |
| `e2e/fixtures/auth.fixture.ts` | Fixture | Auth state helpers (optional, for cloud sync tests) |
| `e2e/fixtures/seed.fixture.ts` | Fixture | localStorage seeding from devSeed data format |
| `e2e/pages/base.page.ts` | POM | Shared page object base (navigation, common actions) |
| `e2e/pages/home.page.ts` | POM | Home screen locators + actions |
| `e2e/pages/onboarding.page.ts` | POM | Onboarding flow locators + actions |
| `e2e/pages/workouts.page.ts` | POM | Workouts screen locators + actions |
| `e2e/pages/macros.page.ts` | POM | Macros screen locators + actions |
| `e2e/pages/auth.page.ts` | POM | Auth screen locators + actions |
| `e2e/pages/settings.page.ts` | POM | Settings screen locators + actions |
| `e2e/helpers/storage.ts` | Utility | localStorage manipulation helpers |
| `e2e/helpers/wait.ts` | Utility | Custom wait conditions |
| `e2e/tests/smoke.spec.ts` | Test | App loads, nav works, no console errors |
| `e2e/tests/onboarding.spec.ts` | Test | Full onboarding flow E2E |
| `e2e/tests/workout-flow.spec.ts` | Test | Start/complete workout E2E |
| `e2e/tests/macro-logging.spec.ts` | Test | Meal logging E2E |
| `e2e/tests/offline-sync.spec.ts` | Test | Offline behavior + reconnect sync |
| `e2e/tests/auth-flow.spec.ts` | Test | Login/signup flows (with dev bypass) |
| `.github/workflows/e2e.yml` | CI | GitHub Actions workflow for E2E |

## Modified Files Summary

| File | Change Type | What Changes |
|---|---|---|
| `package.json` | Dependencies | Add `@playwright/test` devDep, add `test:e2e` script |
| `src/lib/sentry.ts` | Enhancement | Add `browserTracingIntegration`, `startSpan` helper |
| `src/lib/analytics.ts` | Enhancement | Add SPA pageview hook, wire to remaining events |
| `src/lib/sync.ts` | Enhancement | Add Sentry performance spans |
| `src/lib/foodApi.ts` | Enhancement | Add Sentry performance span |
| `src/stores/authStore.ts` | Enhancement | Add Sentry span, add analytics events |
| `src/screens/Macros.tsx` | Enhancement | Wire analytics events |
| `src/screens/Settings.tsx` | Enhancement | Wire analytics events |
| `src/screens/Achievements.tsx` | Enhancement | Wire analytics events |
| `src/screens/Coach.tsx` | Enhancement | Wire analytics events |
| `src/App.tsx` | Enhancement | Add SPA pageview tracking hook, add data-testid attrs |
| `index.html` | Optional | May stay as-is if using manual SPA tracking |
| Various components | Enhancement | Add `data-testid` attributes for E2E selectors |
| Various screens | Enhancement | Add `addBreadcrumb()` calls |

---

## Build Order and Dependencies

```
PHASE 1: PLAYWRIGHT INFRASTRUCTURE
  |
  |-- 1a. Install Playwright, create config, create CI workflow
  |-- 1b. Create fixtures (base, seed) + storage helpers
  |-- 1c. Add data-testid attributes to key UI elements
  |-- 1d. Write smoke test (app loads, navigation works)
  |
  DEPENDS ON: Nothing (net new infrastructure)
  UNBLOCKS: All other E2E tests

PHASE 2: CORE E2E TEST FLOWS
  |
  |-- 2a. Onboarding flow test (fresh user > complete onboarding)
  |-- 2b. Workout flow test (seeded user > start > complete workout)
  |-- 2c. Macro logging test (seeded user > log meal)
  |-- 2d. Offline/sync test (go offline > make changes > reconnect)
  |
  DEPENDS ON: Phase 1 (fixtures, page objects, data-testids)
  UNBLOCKS: Confidence to make changes without manual testing

PHASE 3: PLAUSIBLE ENHANCEMENT
  |
  |-- 3a. Add SPA pageview tracking (useLocation hook)
  |-- 3b. Wire remaining 14 unwired analytics events
  |-- 3c. Document funnel goals for dashboard setup
  |
  DEPENDS ON: Nothing (independent of Playwright)
  UNBLOCKS: Funnel analysis in Plausible dashboard

PHASE 4: SENTRY PERFORMANCE
  |
  |-- 4a. Add browserTracingIntegration to Sentry init
  |-- 4b. Add custom spans to sync + API operations
  |-- 4c. Wire addBreadcrumb calls at key interaction points
  |
  DEPENDS ON: Nothing (independent of Playwright and Plausible)
  UNBLOCKS: Performance monitoring in Sentry dashboard
```

**Phase ordering rationale:**
- Phases 1+2 (Playwright) should come first because they create a safety net for all future changes.
- Phases 3 and 4 (Plausible + Sentry) are independent of each other and can be done in either order.
- Phase 3 is smaller scope (mostly wiring existing events), so it could be combined with Phase 4 if desired.
- Phase 4 touches `sentry.ts` init and `sync.ts` (critical paths), so having E2E tests first provides confidence.

---

## Anti-Patterns to Avoid

### Anti-Pattern: Testing Against Real Supabase in CI

**Why bad:** Requires provisioning test database, managing test users, dealing with email confirmation, rate limits, network flakiness. Massively increases CI complexity and flake rate.

**Instead:** Use `VITE_DEV_BYPASS=true` to skip auth. Seed Zustand stores via localStorage. The app's offline-first design means all core flows work without Supabase.

### Anti-Pattern: Mocking Everything in E2E

**Why bad:** If you mock Zustand, mock the router, mock localStorage... you're testing mocks, not the app.

**Instead:** E2E tests should exercise the real app code. Seed real localStorage state, let Zustand hydrate from it, navigate real routes. Only mock external services (Supabase API, Plausible, Sentry) to prevent real network calls.

### Anti-Pattern: One Giant Test File

**Why bad:** Slow, hard to debug, can't run subsets.

**Instead:** One spec file per user flow. Each test seeds its own state. Tests are independent and parallelizable.

### Anti-Pattern: Putting Sentry React Router Integration Before Understanding the Routing

**Why bad:** The `reactRouterV6BrowserTracingIntegration` requires passing React hooks to `Sentry.init()`, which runs before the React tree mounts. This creates a chicken-and-egg problem and requires restructuring `main.tsx` to use `createBrowserRouter` pattern instead of `<BrowserRouter>`.

**Instead:** Use standard `browserTracingIntegration()` which hooks into the History API directly. It captures route changes without needing React Router integration. The app has no parameterized routes (no `/user/:id`), so route name grouping is not needed.

### Anti-Pattern: Adding Analytics in Zustand Store Actions

**Why bad:** Stores become coupled to analytics. Makes unit testing stores harder (need to mock analytics). Analytics is a side effect, not business logic.

**Instead:** Fire analytics events at the component/screen level, after the store action succeeds. Keep stores pure.

---

## Scalability Considerations

| Concern | Now (beta, ~100 users) | At 10K users | At 1M users |
|---|---|---|---|
| Sentry traces | 10% sample rate is fine | Keep 10%, monitor quota | Consider 1-5%, use `tracesSampler` for targeted sampling |
| Plausible | Hosted plan handles volume | Hosted plan handles volume | Self-host consideration |
| E2E CI time | <2 min (2 browsers, ~6 tests) | <5 min (more tests) | Shard tests across workers |
| E2E flakiness | Retries: 2 on CI | Add visual comparison | Consider dedicated test infra |

---

## Sources

### Official Documentation (HIGH confidence)
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures) -- fixture composition, test.extend
- [Playwright Authentication](https://playwright.dev/docs/auth) -- storageState, setup projects
- [Playwright Browser Contexts / Isolation](https://playwright.dev/docs/browser-contexts) -- test isolation model
- [Playwright Page Object Models](https://playwright.dev/docs/pom) -- POM pattern
- [Playwright CI Setup](https://playwright.dev/docs/ci-intro) -- GitHub Actions workflow
- [Sentry React Tracing](https://docs.sentry.io/platforms/javascript/guides/react/tracing/) -- browserTracingIntegration setup
- [Sentry React Router v6](https://docs.sentry.io/platforms/javascript/guides/react/features/react-router/v6/) -- reactRouterV6BrowserTracingIntegration (documented but NOT recommended for this app)
- [Sentry Automatic Instrumentation](https://docs.sentry.io/platforms/javascript/guides/react/tracing/instrumentation/automatic-instrumentation/) -- what browserTracingIntegration captures
- [Plausible Custom Events](https://plausible.io/docs/custom-event-goals) -- goal setup
- [Plausible Funnel Analysis](https://plausible.io/docs/funnel-analysis) -- funnel configuration (2-8 steps)
- [Plausible SPA Support](https://plausible.io/docs/spa-support) -- SPA pageview tracking options
- [Plausible Custom Properties](https://plausible.io/docs/custom-props/for-custom-events) -- event properties

### Community / Ecosystem (MEDIUM confidence)
- [Supawright - Playwright + Supabase harness](https://github.com/isaacharrisholt/supawright) -- evaluated but NOT recommended (overkill for offline-first app)
- [Testing Service Worker with vite-plugin-pwa](https://vite-pwa-org.netlify.app/guide/testing-service-worker) -- SW testing patterns
- [Supabase Login via REST in Playwright](https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test) -- auth testing pattern
- [plausible-tracker npm](https://github.com/plausible/plausible-tracker) -- programmatic Plausible client (evaluated, simpler manual approach recommended)

### Codebase Analysis (HIGH confidence)
- `src/lib/analytics.ts` -- 20 events defined, 8 wired
- `src/lib/sentry.ts` -- error tracking only, no performance
- `src/lib/sync.ts` -- sync operations without performance instrumentation
- `src/lib/devSeed.ts` -- comprehensive seed data for all stores
- `src/stores/*.ts` -- 8 Zustand stores with localStorage persist keys
- `src/App.tsx` -- routing structure, auth flow, dev bypass
- `vite.config.ts` -- PWA config, build config, test config
- `package.json` -- current dependencies, no Playwright
