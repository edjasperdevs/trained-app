# Technology Stack: E2E Testing & Analytics Enhancement

**Project:** Trained -- Pre-Launch Confidence (E2E Testing + Analytics/Monitoring)
**Researched:** 2026-02-06
**Mode:** Ecosystem (Stack dimension)
**Overall confidence:** HIGH

---

## Executive Summary

The existing Trained stack already has the foundation pieces in place: Sentry (`@sentry/react` ^10.38.0) for error monitoring and Plausible (script tag in `index.html`) for privacy-first analytics with 22 custom events. The Vitest + Testing Library unit test setup is also established.

What is missing is: (1) Playwright for E2E testing against real browser behavior, (2) Sentry's `browserTracingIntegration` for Web Vitals and performance monitoring (the `tracesSampleRate: 0.1` config exists but the integration is not wired up), and (3) Plausible funnel configuration in the dashboard to track conversion paths.

The good news: **no new vendors are needed.** This milestone is about deepening existing integrations and adding Playwright as the sole new dev dependency. Bundle size impact on production is near-zero -- Playwright is dev-only, Sentry's browserTracingIntegration is already bundled with `@sentry/react`, and Plausible funnels are dashboard-only configuration.

---

## New Stack Additions

### Add: @playwright/test (E2E Testing)

| Detail | Value |
|--------|-------|
| **Package** | `@playwright/test` ^1.58 |
| **Type** | Dev dependency only (zero production bundle impact) |
| **Why** | Browser-based E2E tests for critical user flows before 90k-follower launch. Catches integration bugs that Vitest + jsdom cannot (routing, localStorage persistence, Supabase auth flows, service worker behavior). |
| **Confidence** | HIGH -- verified via npm (v1.58.1 published 2026-02-01), Playwright release notes |

**What it provides:**
- Real Chromium/WebKit/Firefox testing (not jsdom simulation)
- Built-in `webServer` config to auto-start Vite dev server
- `storageState` for auth session reuse across tests (critical for Supabase)
- Network interception via `page.route()` for mocking Supabase/API responses
- Mobile viewport emulation (essential for a mobile-first PWA)
- Offline simulation via `context.setOffline(true)` for service worker testing
- Auto-wait for elements (no manual `waitFor` chains)
- Trace viewer and screenshot-on-failure for debugging

**Integration with existing stack:**
- Vite dev server: Playwright's `webServer` config starts `npm run dev` and waits for the port
- Vitest coexistence: Playwright uses its own test runner (`npx playwright test`), completely separate from Vitest. No conflicts.
- TypeScript: First-class TS support, shares the project's `tsconfig.json`
- CI: Playwright provides official GitHub Actions setup with browser caching

**Key configuration decisions:**
- Test against Chromium only in dev (speed), all 3 browsers in CI (coverage)
- Use `storageState` pattern for authenticated tests -- authenticate once via Supabase REST API in setup, reuse session across all tests
- Keep E2E tests in `/e2e/` directory (separate from unit tests in `/src/`)
- Use `baseURL` config pointing to Vite dev server (default `http://localhost:5173`)

**Sources:**
- [Playwright installation docs](https://playwright.dev/docs/intro)
- [Playwright npm - v1.58.1](https://www.npmjs.com/package/@playwright/test)
- [Playwright release notes](https://playwright.dev/docs/release-notes)
- [Playwright webServer config](https://playwright.dev/docs/test-webserver)
- [Playwright authentication](https://playwright.dev/docs/auth)

---

## Existing Stack -- Enhancements (No New Packages)

### Enhance: @sentry/react -- Add browserTracingIntegration

| Detail | Value |
|--------|-------|
| **Package** | `@sentry/react` ^10.38.0 (ALREADY INSTALLED) |
| **Change** | Add `Sentry.browserTracingIntegration()` to the existing `Sentry.init()` call |
| **Why** | Enables automatic Web Vitals capture (LCP, CLS, INP), page load/navigation transaction tracing, and XHR/fetch span creation. Currently `tracesSampleRate: 0.1` is set but does nothing without the integration. |
| **Bundle impact** | Near-zero -- `browserTracingIntegration` is already included in the `@sentry/react` bundle; it just needs to be activated. |
| **Confidence** | HIGH -- verified via Sentry docs; the integration is a core feature of the SDK |

**What it automatically captures (zero additional code):**
- **LCP** (Largest Contentful Paint) -- how fast the main content loads
- **CLS** (Cumulative Layout Shift) -- visual stability
- **INP** (Interaction to Next Paint) -- responsiveness (replaced FID in SDK 10.x)
- **TTFB** (Time to First Byte) -- server response time
- **Page load transactions** -- full waterfall of the initial page load
- **Navigation transactions** -- SPA route changes via React Router
- **Fetch/XHR spans** -- Supabase API call performance

**What needs to change in `src/lib/sentry.ts`:**

The current `Sentry.init()` call needs one addition:
```typescript
Sentry.init({
  dsn: SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0.1, // already configured
  // ... rest of existing config
})
```

**Configuration decisions:**
- Keep `tracesSampleRate: 0.1` (10%) -- sufficient for a launch audience of ~90k, avoids quota issues on free/growth Sentry plans
- Set `tracePropagationTargets` to only the Supabase API domain (prevents CORS issues with third-party APIs like USDA/Open Food Facts)
- INP is enabled by default in SDK 10.x -- no opt-in needed
- LCP and CLS send as standalone spans by default in 10.x

**Sources:**
- [Sentry React tracing setup](https://docs.sentry.io/platforms/javascript/guides/react/tracing/)
- [Sentry browserTracingIntegration](https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/browsertracing/)
- [Sentry Web Vitals](https://docs.sentry.io/product/insights/frontend/web-vitals/)
- [Sentry automatic instrumentation](https://docs.sentry.io/platforms/javascript/guides/react/tracing/instrumentation/automatic-instrumentation/)

### Enhance: Plausible Analytics -- Funnel Configuration + New Events

| Detail | Value |
|--------|-------|
| **Script** | `https://plausible.io/js/script.js` (ALREADY IN index.html) |
| **Change** | Dashboard-side funnel configuration + new custom events in `src/lib/analytics.ts` |
| **Why** | Track conversion funnels (signup-to-first-workout, onboarding completion) and engagement patterns to understand user behavior at launch scale. |
| **Bundle impact** | Zero -- Plausible script is external, funnels are dashboard config, new events just add function calls to existing `analytics.ts` |
| **Confidence** | HIGH -- Plausible funnel docs are straightforward; the JS API (`window.plausible()`) with custom props already works with the base `script.js` |

**Important finding:** The base `script.js` already supports `window.plausible(event, { props })` via the JavaScript API. The `tagged-events`, `pageview-props`, and other script extensions are only needed for HTML-attribute-based automatic tracking, which this project does not use. No script change needed.

**Funnel setup is dashboard-only:**
1. Go to Plausible site settings > Goals -- register each event name as a goal
2. Go to Plausible site settings > Funnels -- create funnels from those goals
3. Minimum 2 steps, maximum 8 steps per funnel

**Recommended funnels (built from existing + new events):**

| Funnel | Steps |
|--------|-------|
| Signup to First Workout | Signup Completed > Onboarding Completed > Workout Completed |
| Daily Engagement | App Opened > Check-In Completed > Workout Started |
| Meal Tracking Adoption | App Opened > Meal Logged > Protein Target Hit |
| Gamification Loop | Workout Completed > XP Claimed > Level Up |

**New events to add to `analytics.ts`:**

| Event | Purpose | Props |
|-------|---------|-------|
| `Page View` | Track SPA navigation (Plausible auto-tracks, but explicit for funnels) | `path` |
| `Feature Discovery` | Track when users find key features | `feature` |
| `Retention Signal` | Track return visits (daily active) | `days_since_signup` |
| `Error Encountered` | Track user-facing errors for correlation | `error_type`, `screen` |

**Sources:**
- [Plausible custom events](https://plausible.io/docs/custom-event-goals)
- [Plausible funnel analysis](https://plausible.io/docs/funnel-analysis)
- [Plausible custom properties](https://plausible.io/docs/custom-props/for-custom-events)
- [Plausible script extensions](https://plausible.io/docs/script-extensions)

---

## What NOT to Add (and Why)

### Do NOT add @playwright/experimental-ct-react (Component Testing)

Playwright offers experimental component testing for React. Do NOT use it. The project already has Vitest + Testing Library for component-level tests. Playwright should only be used for full E2E flows (multi-page, with real routing, auth, and network). Component testing with Playwright adds complexity for zero benefit over the existing Vitest setup.

### Do NOT add MSW (Mock Service Worker) for E2E tests

MSW is excellent for unit tests but adds unnecessary complexity to E2E tests. Playwright has built-in `page.route()` for network interception that is simpler and more reliable in the E2E context. Use `page.route()` to mock Supabase responses when needed. If tests can run against a real (local or staging) Supabase instance, prefer that over mocking entirely.

### Do NOT add supawright

Supawright is a Playwright + Supabase test harness that auto-creates/cleans database records. It is useful for complex multi-tenant apps but overkill here. The app stores most data in Zustand/localStorage. For the few Supabase-dependent flows (auth, sync), direct API calls in test setup are simpler and more transparent.

### Do NOT switch from Plausible script tag to plausible-tracker npm package

The `plausible-tracker` npm package (v0.3.9, unmaintained) and its successor `@plausible-analytics/tracker` (v0.4.4) add the Plausible tracking script as a JS module instead of a script tag. This adds to the production bundle and removes the CDN caching benefit. The current script tag approach is correct for a PWA -- it loads async, is cached by the browser independently of the app bundle, and the `window.plausible()` API already provides everything needed.

### Do NOT add Google Analytics, Mixpanel, PostHog, or Amplitude

The project is privacy-first (no cookies). Plausible provides funnel analysis, custom events, and custom properties -- everything needed for launch analytics. Adding a second analytics vendor contradicts the privacy stance, increases bundle size, and fragments data across dashboards.

### Do NOT add web-vitals npm package separately

The `web-vitals` npm package provides standalone Web Vitals measurement. This is unnecessary because Sentry's `browserTracingIntegration` already uses `web-vitals` internally and reports the same metrics (LCP, CLS, INP) to Sentry's dashboard. Adding it separately would duplicate measurements.

### Do NOT add Lighthouse CI or SpeedCurve

Synthetic performance monitoring (Lighthouse CI, SpeedCurve) runs lab tests in controlled environments. Sentry's Web Vitals capture Real User Monitoring (RUM) data from actual users, which is more valuable for a mobile-first PWA where device diversity matters. Add Lighthouse CI only if you need a CI gate for performance regression, which is a separate concern from this milestone.

### Do NOT add Datadog, New Relic, or other APM tools

Sentry already covers error tracking, performance monitoring, and Web Vitals. Adding a full APM tool duplicates Sentry's capabilities at significant cost and complexity. The app has no backend server to monitor (Supabase is the backend).

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| E2E framework | Playwright | Cypress | Playwright is faster (parallel by default), supports all browsers, better mobile emulation, better PWA/service worker support. Cypress is older and has architectural limitations (single-tab, no multi-domain). |
| E2E framework | Playwright | Selenium/WebDriverIO | Heavyweight, slower, worse DX. Playwright is the modern standard. |
| Performance monitoring | Sentry browserTracingIntegration | web-vitals + custom dashboard | Sentry already integrates web-vitals. Building a custom dashboard is wasted effort. |
| Performance monitoring | Sentry browserTracingIntegration | Vercel Speed Insights | Vendor lock-in to Vercel. Sentry works on any host. App already uses Sentry. |
| Analytics funnels | Plausible funnels | PostHog funnels | PostHog is more powerful but requires cookies, self-hosting, or paid cloud. Contradicts privacy-first. |
| Analytics funnels | Plausible funnels | Custom-built funnel tracking | Plausible already supports 2-8 step funnels from custom events. No need to build this. |
| API mocking in E2E | Playwright page.route() | MSW | MSW adds a dependency and service worker registration complexity. Playwright's built-in mocking is simpler for E2E. |
| Auth in E2E | storageState (Playwright built-in) | supawright | supawright is for database seeding; storageState handles auth session reuse directly. |

---

## Installation

### New dev dependencies (one command)
```bash
npm install -D @playwright/test
```

### Install Playwright browsers
```bash
npx playwright install --with-deps chromium webkit
```

Note: Install only Chromium and WebKit. Firefox is optional and can be added later. WebKit covers Safari (important for iOS PWA users). The `--with-deps` flag installs system dependencies needed for headless browsers.

### No production dependency changes

The only production-side change is modifying `src/lib/sentry.ts` to add `browserTracingIntegration()` -- using the already-installed `@sentry/react` package. No new production packages.

---

## File Structure for New Capabilities

### Playwright E2E tests
```
/e2e/                          # E2E test directory (separate from src/)
  playwright.config.ts          # Playwright configuration
  auth.setup.ts                # Authentication setup (runs once, saves storageState)
  fixtures/                    # Test fixtures and helpers
    auth.ts                    # Custom fixture with authenticated page
  tests/
    auth.spec.ts               # Login/signup/logout flows
    onboarding.spec.ts         # Onboarding flow
    workout.spec.ts            # Workout logging flow
    macros.spec.ts             # Meal/macro tracking flow
    gamification.spec.ts       # XP, leveling, streaks, achievements
    offline.spec.ts            # Offline/service worker behavior
    navigation.spec.ts         # Tab bar, routing, deep links
  .auth/                       # Stored auth state (gitignored)
    user.json
```

### Sentry enhancement
```
src/lib/sentry.ts              # Existing file -- add browserTracingIntegration
```

### Plausible enhancement
```
src/lib/analytics.ts           # Existing file -- add new event definitions
```

### Package scripts to add
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## Key Integration Points

### Playwright + Vite Dev Server

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Playwright + Supabase Auth

The recommended pattern for authenticating in E2E tests with Supabase:

1. **Setup project** authenticates via Supabase REST API (not UI clicks)
2. **Saves session** to `storageState` file (localStorage + cookies)
3. **Test projects** load `storageState` -- tests start authenticated
4. Use a dedicated test user in Supabase (not a real user)

This avoids slow UI-based login in every test and handles Supabase's token-based auth cleanly.

### Sentry browserTracingIntegration + React Router

The `browserTracingIntegration()` automatically detects React Router v6 navigation events and creates transactions for each route change. No additional configuration needed beyond adding the integration -- it hooks into the History API automatically.

For React Router v6 specifically, Sentry recommends using `Sentry.reactRouterV6BrowserTracingIntegration` for route-aware transaction names. This uses `useEffect`, `useLocation`, `useNavigationType`, `createRoutesFromChildren`, and `matchRoutes` from `react-router-dom`.

### Plausible + Existing Analytics Module

The `src/lib/analytics.ts` module already wraps `window.plausible()` correctly. New events simply add more methods to the `analytics` object. No architectural changes needed.

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Playwright version/setup | HIGH | Verified via npm (v1.58.1, published 2026-02-01) and official docs |
| Playwright + Vite integration | HIGH | `webServer` config is well-documented, widely used pattern |
| Playwright + Supabase auth | MEDIUM | Pattern documented in community sources (Mokkapps blog, Fireship); not in official Playwright docs. Works but needs per-project tuning. |
| Sentry browserTracingIntegration | HIGH | Official Sentry docs confirm it is already bundled in @sentry/react 10.x |
| Sentry Web Vitals (LCP/CLS/INP) | HIGH | Official docs confirm automatic capture with browserTracingIntegration in SDK 10.x |
| Sentry + React Router v6 | MEDIUM | Documented but requires specific wiring with `reactRouterV6BrowserTracingIntegration` |
| Plausible funnels | HIGH | Official Plausible docs confirm dashboard-only setup with custom events |
| Plausible base script.js + JS API | HIGH | Official docs confirm window.plausible() works with base script without extensions |
| No-new-vendors strategy | HIGH | All capabilities achievable with existing Sentry + Plausible + new Playwright |

---

## Sources

### Verified (HIGH confidence)
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

### Cross-referenced (MEDIUM confidence)
- [Supabase auth in Playwright E2E (Mokkapps)](https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test)
- [Playwright + Vite + React setup (DEV Community)](https://dev.to/juan_deto/configure-vitest-msw-and-playwright-in-a-react-project-with-vite-and-ts-part-3-32pe)
- [Supawright test harness](https://github.com/isaacharrisholt/supawright)
- [@plausible-analytics/tracker npm](https://www.npmjs.com/package/@plausible-analytics/tracker)
- [Vite PWA testing docs](https://vite-pwa-org.netlify.app/guide/testing-service-worker)

### Single-source (LOW confidence -- verify before acting)
- Sentry `reactRouterV6BrowserTracingIntegration` exact import path and API -- verify against current SDK version during implementation
- Playwright `context.setOffline()` for PWA offline testing -- documented but not extensively tested with vite-plugin-pwa specifically
