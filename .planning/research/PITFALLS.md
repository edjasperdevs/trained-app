# E2E Testing & Analytics/Monitoring Pitfalls

**Research Date:** 2026-02-06
**Context:** Adding Playwright E2E tests, Plausible funnel analytics, and Sentry performance monitoring to existing Trained fitness PWA (React 18 + Vite + Zustand + Supabase) before launching to ~90k followers. No E2E tests exist yet. No `data-testid` attributes exist in the codebase. Sentry and Plausible already partially integrated.

---

## Table of Contents

1. [Zero data-testid Attributes After Visual Overhaul](#1-zero-data-testid-attributes-after-visual-overhaul)
2. [Supabase Auth Session Handling in Playwright](#2-supabase-auth-session-handling-in-playwright)
3. [Service Worker Intercepting Playwright Network Mocking](#3-service-worker-intercepting-playwright-network-mocking)
4. [Zustand localStorage Pollution Between Test Runs](#4-zustand-localstorage-pollution-between-test-runs)
5. [Plausible Event Names Are Permanent History](#5-plausible-event-names-are-permanent-history)
6. [Sentry Performance Monitoring Doubling Bundle Impact](#6-sentry-performance-monitoring-doubling-bundle-impact)
7. [Animation-Induced Test Flakiness](#7-animation-induced-test-flakiness)
8. [CI Environment Differences Breaking Playwright](#8-ci-environment-differences-breaking-playwright)
9. [Test User Cleanup and Database State Leaking](#9-test-user-cleanup-and-database-state-leaking)
10. [AccessGate and Auth Wall Blocking Every E2E Test](#10-accessgate-and-auth-wall-blocking-every-e2e-test)
11. [Plausible Script Blocked in Test Environments](#11-plausible-script-blocked-in-test-environments)
12. [Existing Unit Tests Broken After Design Refresh](#12-existing-unit-tests-broken-after-design-refresh)
13. [Sentry Session Replay PII Leakage in Fitness Context](#13-sentry-session-replay-pii-leakage-in-fitness-context)
14. [Sync Debounce Timer Causing Race Conditions in Tests](#14-sync-debounce-timer-causing-race-conditions-in-tests)

---

## Critical Pitfalls

Mistakes that cause test suites to be unreliable, analytics data to be permanently corrupted, or monitoring to miss real issues.

---

### 1. Zero data-testid Attributes After Visual Overhaul

**What goes wrong:** The codebase has zero `data-testid` attributes anywhere in `src/`. The recent shadcn/ui migration replaced nearly every component's markup and class names. Without stable test selectors, Playwright tests must rely on text content, ARIA roles, or CSS class names -- all of which are fragile. Tests written against current CSS classes (`bg-primary`, `text-muted-foreground`) will break on any future Tailwind or shadcn update. Tests written against text content break when copy changes. This creates a test suite that provides false confidence: it passes today but breaks on innocent changes.

**Specific risk areas in this codebase:**
- Navigation uses icon-only buttons (no visible text to select by)
- Multiple screens use identical shadcn Button/Card components with no distinguishing attributes
- Onboarding is a 10-step wizard where each step uses the same component structure
- Modals (CheckInModal, XPClaimModal) overlay the main content, making parent element selection ambiguous
- The AccessGate screen has a single input + button -- easy to target, but similar structure to the Auth screen

**Warning signs:**
- Tests use selectors like `page.locator('.bg-primary')` or `page.locator('button:nth-child(2)')`
- Tests break when a developer changes a button label from "Log Workout" to "Log Session"
- Flaky failures where the selector matches multiple elements on the page

**Prevention:**
1. Add `data-testid` attributes to critical interactive elements BEFORE writing any Playwright tests. Target these areas first:
   - Navigation links (home, workouts, macros, avatar, settings)
   - Form inputs and submit buttons on Auth, AccessGate, and Onboarding
   - Primary action buttons on each screen (log workout, log meal, check in, claim XP)
   - Modal triggers and modal action buttons
   - Key data displays (XP amount, streak count, level indicator)
2. Follow a naming convention: `data-testid="screen-element"` (e.g., `data-testid="auth-email-input"`, `data-testid="home-checkin-button"`)
3. Use Playwright's recommended locator priority: `getByRole` > `getByLabel` > `getByTestId` -- but for this app's icon-heavy navigation and modal-heavy flows, `getByTestId` will be the most reliable
4. Do NOT use `getByText` for buttons whose labels might change during copy refinement

**Detection:** Run `grep -r 'data-testid' src/` -- if it returns 0 results, this pitfall is active.

**Phase relevance:** Adding `data-testid` attributes should be the FIRST step of the E2E testing phase, before any Playwright test is written. It requires touching component files but is a zero-behavior-change modification.

---

### 2. Supabase Auth Session Handling in Playwright

**What goes wrong:** Every test that exercises authenticated functionality needs a valid Supabase session. The naive approach -- typing email/password into the Auth screen for every test -- is slow (~3-5 seconds per login), flaky (network-dependent), and creates rate-limiting risk with Supabase auth endpoints. Worse, Supabase sessions are stored in localStorage by the `@supabase/supabase-js` client (key format: `sb-{project-ref}-auth-token`), and the session includes JWTs with expiration. If you save a `storageState` file with an expired JWT, all tests using that state will fail simultaneously with auth errors.

**This app's specific risk:**
- The auth flow has THREE gates: AccessGate (access code) -> Auth (email/password) -> Onboarding (if new user). Tests must bypass or handle all three.
- `authStore.initialize()` runs on every app load, calling `supabase.auth.getSession()` which validates the token
- The `VITE_DEV_BYPASS` env var exists and skips all auth gates -- but using it in E2E tests means you never test auth flows
- Supabase auth tokens expire after 1 hour by default; CI runs that take longer will see mid-run failures

**Warning signs:**
- Tests pass individually but fail when run as a suite (session expires during the run)
- All tests fail simultaneously with "Invalid login credentials" or "JWT expired"
- Test suite takes 5+ minutes because every test logs in through the UI
- Rate limiting: Supabase returns 429 after too many auth requests in CI

**Prevention:**
1. Use Playwright's [project dependencies](https://playwright.dev/docs/auth) pattern: create a `setup` project that authenticates once via Supabase REST API (not through the UI), saves `storageState` to a JSON file, and all test projects depend on it
2. Authenticate via the Supabase client library directly in `globalSetup`:
   ```typescript
   // global-setup.ts (conceptual approach)
   const { data } = await supabase.auth.signInWithPassword({
     email: TEST_USER_EMAIL,
     password: TEST_USER_PASSWORD
   })
   // Save session to storageState file for Playwright to inject
   ```
3. Create a dedicated test user in Supabase with a known password -- do NOT use production accounts
4. Set Supabase JWT expiration to a longer duration for test environments, or refresh the token in `globalSetup`
5. For the AccessGate: either set the access code in test env config, or use `VITE_DEV_BYPASS=true` ONLY for non-auth tests

**Phase relevance:** Auth setup infrastructure must be built FIRST in the E2E phase. Every subsequent test depends on it. Get this wrong and the entire E2E suite is unreliable.

---

### 3. Service Worker Intercepting Playwright Network Mocking

**What goes wrong:** The app uses `vite-plugin-pwa` with Workbox, and has runtime caching rules for USDA food API, Open Food Facts, and Supabase REST API. When Playwright tests run against the built app (production mode), the service worker activates and intercepts network requests. This means `page.route()` and `browserContext.route()` do NOT see requests handled by the service worker. If a test mocks the USDA API to return specific food data, the service worker may serve a cached response instead, and the mock never fires. The test passes or fails unpredictably depending on cache state.

**This app's specific caching rules (from vite.config.ts):**
- USDA food search: `CacheFirst` with 1-week TTL (100 entries)
- Open Food Facts: `CacheFirst` with 1-week TTL (100 entries)
- Supabase REST API: `NetworkFirst` with 24-hour TTL and 3-second timeout (50 entries)

The `CacheFirst` strategy for food APIs is the most dangerous: once cached, tests will NEVER see fresh mock data.

**Warning signs:**
- Tests that mock API responses still get old data
- Food search tests pass on first run but return stale results on subsequent runs
- Tests pass locally (dev mode, no SW) but fail in CI (production build, SW active)
- Intermittent failures where some workers get cached data and others don't

**Prevention:**
1. **Block the service worker in Playwright config** for all tests that don't specifically test SW behavior:
   ```typescript
   // playwright.config.ts
   use: {
     serviceWorkers: 'block'
   }
   ```
2. Create a SEPARATE test project specifically for service worker testing (update prompts, offline behavior) where SW is allowed
3. If running tests against `vite dev` server (not production build), the service worker won't be active -- this is simpler for most E2E tests
4. For tests that DO need the SW, clear caches in `beforeEach`:
   ```typescript
   await page.evaluate(() => caches.keys().then(k => Promise.all(k.map(c => caches.delete(c)))))
   ```
5. Document clearly which test suites require SW and which don't

**Detection:** If you see `page.route()` handlers that never fire, check the DevTools Application tab for active service workers.

**Phase relevance:** This must be decided during Playwright config setup, BEFORE writing food search or Supabase data tests. A wrong default here creates hours of debugging later.

---

### 4. Zustand localStorage Pollution Between Test Runs

**What goes wrong:** Playwright creates a fresh browser context per test by default, which includes clean localStorage. This SHOULD prevent Zustand state leaks. However, there are two traps specific to this codebase:

**Trap 1: storageState reuse carries Zustand data.** When you save `storageState` for auth reuse (Pitfall #2), that file includes ALL localStorage -- including the 8 Zustand persist stores (`gamify-gains-user`, `gamify-gains-workouts`, `gamify-gains-macros`, `gamify-gains-xp`, `gamify-gains-avatar`, `gamify-gains-achievements`, `gamify-gains-reminders`, `gamify-gains-access`). If the auth setup test also triggers onboarding or logs data, that state leaks into every subsequent test via the storageState file.

**Trap 2: Test actions trigger Supabase sync.** The `scheduleSync()` function fires after most user actions with a 2-second debounce. If a test creates data (logs a workout, logs a meal), `scheduleSync()` writes to the REAL Supabase database. The next test, even with clean localStorage, may load that data from the cloud via `loadAllFromCloud()` when it initializes auth.

**Zustand persist keys in this codebase:**
| Key | Store | Persists To |
|-----|-------|-------------|
| `gamify-gains-user` | userStore | localStorage |
| `gamify-gains-workouts` | workoutStore | localStorage |
| `gamify-gains-macros` | macroStore | localStorage |
| `gamify-gains-xp` | xpStore | localStorage |
| `gamify-gains-avatar` | avatarStore | localStorage |
| `gamify-gains-achievements` | achievementsStore | localStorage |
| `gamify-gains-reminders` | remindersStore | localStorage |
| `gamify-gains-access` | accessStore | localStorage |

**Warning signs:**
- Tests pass in isolation but fail when run as a suite
- A workout logged in Test A appears in Test B's workout history
- User profile from auth setup appears in tests that should start with no profile
- Tests that check "empty state" UI fail because they see data from previous tests

**Prevention:**
1. When saving `storageState` for auth, ONLY include cookies and the Supabase auth token localStorage key -- strip out the `gamify-gains-*` keys:
   ```typescript
   // After saving storageState, filter it
   const state = JSON.parse(fs.readFileSync(authFile))
   state.origins[0].localStorage = state.origins[0].localStorage.filter(
     item => item.name.startsWith('sb-')
   )
   fs.writeFileSync(authFile, JSON.stringify(state))
   ```
2. Add a `beforeEach` helper that clears Zustand stores (but NOT the auth token) by evaluating in the page:
   ```typescript
   await page.evaluate(() => {
     Object.keys(localStorage)
       .filter(k => k.startsWith('gamify-gains-'))
       .forEach(k => localStorage.removeItem(k))
   })
   ```
3. Use a dedicated test Supabase project (or at minimum, dedicated test user) so sync data doesn't contaminate the production database
4. For tests that need specific state (e.g., "completed onboarding" state), seed the localStorage directly rather than running through the full onboarding flow

**Phase relevance:** This infrastructure must be built alongside the auth setup (Pitfall #2). Both are part of the same Playwright test infrastructure phase.

---

### 5. Plausible Event Names Are Permanent History

**What goes wrong:** The app already has 22 custom events defined in `src/lib/analytics.ts`. Plausible tracks events by name. If you add new funnel/engagement events with names that are poorly chosen, inconsistent with existing names, or too generic, you are stuck with them. While Plausible allows editing the display name of a goal, the underlying event name in your codebase is what fires from the app. Historical data is tied to that event name. If you later realize "Workout Started" should have been "Workout Begun" (to match a naming convention), you have to keep firing both names during a transition period, or lose the ability to compare historical data across the rename.

**Existing event names in this codebase (22 events):**
```
Onboarding Started, Onboarding Completed, Workout Started, Workout Completed,
Quick Workout Logged, Meal Logged, Meal Saved, Protein Target Hit,
Calorie Target Hit, Check-In Completed, XP Claimed, Level Up, Badge Earned,
Avatar Evolved, App Opened, Settings Viewed, Achievements Viewed,
Data Exported, Signup Completed, Login Completed, Coach Dashboard Viewed,
Client Viewed
```

The naming convention is: `{Noun} {Past Tense Verb}` (e.g., "Workout Completed", "Badge Earned"). Some deviate: "Quick Workout Logged" (adjective+noun+verb), "App Opened" (noun+verb).

**Warning signs:**
- New events use a different convention: "user_signed_up" (snake_case) vs "Signup Completed" (Title Case)
- Funnel events overlap with existing events ("Signup" vs "Signup Completed")
- Events are too granular (tracking every button click) making the dashboard noisy
- Events are too broad ("Page Viewed") providing no actionable insight
- Property names are inconsistent: `workout_type` in one event, `type` in another

**Prevention:**
1. Document the naming convention BEFORE adding new events: `{Noun} {Past Tense Verb}` in Title Case with spaces (matching existing)
2. Map the entire funnel as event names BEFORE implementing any:
   ```
   FUNNEL: App Opened -> Access Code Entered -> Signup Completed ->
           Onboarding Completed -> First Workout Completed ->
           First Meal Logged -> First Week Completed
   ```
3. Review new event names against ALL 22 existing names for consistency
4. Use custom properties for variants rather than creating new event names:
   - GOOD: `trackEvent('Workout Completed', { is_first: true })`
   - BAD: `trackEvent('First Workout Completed')` (creates a new event when a property suffices)
5. Keep event count manageable -- Plausible dashboards become unusable past ~40 custom events
6. For funnel tracking, Plausible requires events to be set up as goals first -- plan the Plausible dashboard configuration alongside the code changes

**Phase relevance:** Event naming and funnel design should be completed as a planning step BEFORE any code is written. This is a one-way door. Get it right on paper first.

---

### 6. Sentry Performance Monitoring Doubling Bundle Impact

**What goes wrong:** The app already includes `@sentry/react` (currently used for error tracking and session replay). Adding performance monitoring (tracing) imports additional code. The current Sentry config sets `tracesSampleRate: 0.1` but does not import `BrowserTracing` explicitly -- it relies on whatever the default Sentry.init provides. Explicitly adding `browserTracingIntegration()` and `replayIntegration()` to get full performance monitoring can significantly increase the Sentry portion of the bundle.

**Bundle impact breakdown (approximate, based on Sentry docs and community reports):**
- `@sentry/react` core: ~30KB gzipped
- `browserTracingIntegration()`: ~10-15KB gzipped additional
- `replayIntegration()`: ~36KB gzipped (already included via `replaysOnErrorSampleRate: 1.0`)
- Total potential: ~80KB+ gzipped for full Sentry

The app already splits Sentry into its own chunk (`manualChunks: { 'vendor-sentry': ['@sentry/react'] }` in vite.config.ts), which is good -- Sentry won't block initial render. But on mobile networks targeting 90k users, every KB matters for the initial app shell.

**Warning signs:**
- `npm run build` output shows vendor-sentry chunk growing past 100KB
- Lighthouse performance score drops after adding tracing
- Time to Interactive increases on mobile 3G
- Users on slow connections see a delay before the app becomes responsive

**Prevention:**
1. Audit what you actually need. For a PWA pre-launch, you likely need:
   - Error tracking (already have)
   - Session replay on errors (already have at `replaysOnErrorSampleRate: 1.0`)
   - Web Vitals (can be done with Sentry's `browserTracingIntegration` OR lightweight alternatives)
   - Page load timing (included in BrowserTracing)
2. Use Sentry's tree-shaking flags in vite.config.ts to strip unused code:
   ```typescript
   define: {
     __SENTRY_DEBUG__: false,
     __SENTRY_TRACING__: true, // only if you actually use tracing
   }
   ```
3. Consider whether `web-vitals` library (~1.5KB) is sufficient for Core Web Vitals instead of full Sentry tracing (~15KB)
4. Keep `replaysSessionSampleRate: 0` (current setting) -- recording all sessions adds massive overhead
5. After changes, verify bundle impact:
   ```bash
   npx vite build && ls -la dist/assets/vendor-sentry*.js
   ```
6. Set a bundle size budget: Sentry chunk should not exceed 50KB gzipped

**Phase relevance:** Performance monitoring additions should happen AFTER E2E tests are working (so you can verify the monitoring does not break anything) and should include a bundle size check as an acceptance criterion.

---

### 7. Animation-Induced Test Flakiness

**What goes wrong:** The app uses Framer Motion (spring animations with critically damped springs after the redesign) and CSS transitions throughout. Playwright's auto-waiting waits for elements to be visible and stable, but "stable" does not mean "animation complete." A button that is animating via `spring` might be clickable but at the wrong position. A toast notification that fades in might be visible but not yet readable for text assertions. Modals (CheckInModal, XPClaimModal) that animate in may have their content intercepted by the parent overlay during the transition.

**This app's specific animation risk areas:**
- `XPClaimModal`: Spring animation on mount -- if test clicks "Claim" too fast, the modal may not be fully rendered
- `CheckInModal`: Overlay + content animation -- assertions on streak count may fire before the number animates to its final value
- `Navigation`: `layoutId="nav-indicator"` creates a shared layout animation when switching tabs
- Toast notifications (`sonner`): Appear with slide-in animation, disappear after timeout
- Skeleton -> content transitions: Components use `Suspense` with skeleton fallbacks -- the transition from skeleton to content is a visual shift

**Warning signs:**
- Tests pass 90% of the time but fail randomly on modal assertions
- `toBeVisible()` passes but `toHaveText('100 XP')` fails (content still animating)
- Click actions fire but nothing happens (clicked during animation transition)
- Tests pass locally (fast machine) but fail in CI (slower, headless)

**Prevention:**
1. **Disable animations in test mode.** Add a CSS override when running in Playwright:
   ```typescript
   // In Playwright test setup
   await page.addStyleTag({
     content: `*, *::before, *::after {
       animation-duration: 0s !important;
       transition-duration: 0s !important;
     }`
   })
   ```
   Or better: use a Framer Motion `ReducedMotion` provider in test mode
2. **Use `page.waitForLoadState('networkidle')` before assertions** -- not just `domcontentloaded`
3. **Wait for specific content** rather than element visibility:
   ```typescript
   // BAD: flaky if content is animating
   await expect(page.locator('[data-testid="xp-display"]')).toBeVisible()
   // GOOD: waits for specific text content
   await expect(page.locator('[data-testid="xp-display"]')).toHaveText(/\d+ XP/)
   ```
4. **For toast assertions**, wait for the toast to appear AND stabilize:
   ```typescript
   await expect(page.locator('[data-sonner-toast]')).toBeVisible()
   await expect(page.locator('[data-sonner-toast]')).toContainText('Workout logged')
   ```
5. Set Playwright timeout configs appropriately: `expect.timeout` of 5000ms (default) is fine, but `actionTimeout` should be 10000ms for animations to settle

**Phase relevance:** Animation handling should be decided in the Playwright config phase, before individual test files are written. The CSS override approach is simplest and covers all cases.

---

## Moderate Pitfalls

Mistakes that cause delays, debugging sessions, or compromised test/monitoring quality.

---

### 8. CI Environment Differences Breaking Playwright

**What goes wrong:** Playwright tests pass locally (macOS, headed browser, fast machine) but fail in GitHub Actions (Linux, headless, slower, containerized). Common causes specific to this PWA:
- **Font rendering differences:** The app uses Inter, Oswald, and JetBrains Mono via `@fontsource`. In CI, these web fonts may not render identically, affecting any screenshot comparison tests.
- **Viewport differences:** Mobile PWA tests assume specific viewport sizes. CI default viewport may differ from local.
- **Network timing:** Supabase calls that complete in <100ms locally may take 500ms+ in CI, causing timeout-sensitive assertions to fail.
- **`page.pause()` left in code:** If a developer leaves `page.pause()` in a test for debugging, it hangs indefinitely in headless CI with no visible error -- just a timeout after the full test timeout.

**Warning signs:**
- Green locally, red in CI -- consistently
- Tests pass on retry in CI (indicating timing, not logic issues)
- Screenshot comparison tests always fail in CI
- CI runs take 10x longer than local, or hang without output

**Prevention:**
1. **Configure explicit viewport** in `playwright.config.ts` matching the target mobile experience:
   ```typescript
   use: {
     viewport: { width: 375, height: 812 }, // iPhone X
   }
   ```
2. **Install browser dependencies in CI** -- Playwright needs system libraries:
   ```yaml
   - name: Install Playwright Browsers
     run: npx playwright install --with-deps chromium
   ```
   Install only the browsers you test (chromium is sufficient for most PWA testing)
3. **Never use `page.pause()` in committed code** -- add a lint rule or pre-commit hook to catch it
4. **Set generous timeouts for CI** but strict locally:
   ```typescript
   timeout: process.env.CI ? 60000 : 30000,
   ```
5. **Run the dev server in CI, not the production build** (unless testing SW behavior) -- it avoids the build step and SW issues
6. **Avoid screenshot comparison tests entirely** for this milestone -- they add complexity without matching the goal of "does the user flow work?"
7. **Use `retries: 2` in CI only** to handle genuine flakiness, but investigate any test that needs retries regularly

**Phase relevance:** CI integration should be the LAST step of the E2E phase, after all tests pass locally. Debugging CI failures without a working local suite is extremely painful.

---

### 9. Test User Cleanup and Database State Leaking

**What goes wrong:** E2E tests that create Supabase data (user profiles, workout logs, meal logs, XP records) leave that data behind. If tests run against the production Supabase instance, test data appears in the real database. If tests run against a test Supabase instance, data accumulates across runs, causing tests that expect empty/specific states to fail.

**This app's Supabase tables affected by E2E tests:**
- `profiles` (user profile data)
- `workout_logs` (workout history)
- `daily_macro_logs` and `logged_meals` (nutrition data)
- `macro_targets` (user macro settings)
- `saved_meals` (user's saved meals)
- `user_xp` (XP and level data)
- `weight_logs` (weight tracking history)

**Warning signs:**
- Production dashboard shows test users in real data
- Tests that check "no workouts yet" empty state see workouts from previous test runs
- Database foreign key errors when cleanup deletes records in the wrong order
- Supabase free tier row limits approached by test data accumulation

**Prevention:**
1. **NEVER run E2E tests against production Supabase.** Use one of:
   - Supabase local development (via Docker: `supabase start`)
   - A dedicated Supabase test project (free tier is fine for tests)
2. **Create a test cleanup function** that runs in `globalTeardown`:
   ```typescript
   // Delete in correct order respecting foreign keys
   await supabase.from('logged_meals').delete().eq('user_id', TEST_USER_ID)
   await supabase.from('daily_macro_logs').delete().eq('user_id', TEST_USER_ID)
   await supabase.from('saved_meals').delete().eq('user_id', TEST_USER_ID)
   await supabase.from('workout_logs').delete().eq('user_id', TEST_USER_ID)
   await supabase.from('user_xp').delete().eq('user_id', TEST_USER_ID)
   await supabase.from('weight_logs').delete().eq('user_id', TEST_USER_ID)
   await supabase.from('macro_targets').delete().eq('user_id', TEST_USER_ID)
   await supabase.from('profiles').delete().eq('id', TEST_USER_ID)
   ```
3. Use the [supawright](https://github.com/isaacharrisholt/supawright) library which handles cleanup automatically, respecting foreign key constraints
4. Prefix test user email with a recognizable pattern (e.g., `test+{timestamp}@trained.app`) so test data is identifiable
5. If using Supabase local, add a `supabase db reset` step to CI before running tests

**Phase relevance:** Database strategy must be decided during Playwright infrastructure setup. It determines the entire test environment configuration.

---

### 10. AccessGate and Auth Wall Blocking Every E2E Test

**What goes wrong:** The app has a three-layer authentication wall: AccessGate (access code) -> Auth (email/password) -> Onboarding (if first time). The `App.tsx` renders these as conditional returns -- if `!hasAccess`, ONLY the AccessGate renders. If `!user`, ONLY the Auth screen renders. If `!profile.onboardingComplete`, ONLY Onboarding renders. This means a Playwright test that tries to navigate to `/workouts` will see the AccessGate instead, with no route change and no error.

**The `VITE_DEV_BYPASS` escape hatch:**
The app already has `const devBypass = import.meta.env.VITE_DEV_BYPASS === 'true'` which skips AccessGate, Auth, and Onboarding checks. BUT: if you use this for ALL tests, you never test the actual auth flow that 90k users will experience.

**Warning signs:**
- Every test fails because it sees the AccessGate instead of the expected screen
- Tests navigate to `/workouts` but assertions about workout UI fail -- they are actually asserting against the AccessGate screen
- Tests pass with `VITE_DEV_BYPASS=true` but the auth flow itself is untested
- Switching between bypass and non-bypass modes requires rebuilding the app

**Prevention:**
1. Create TWO Playwright projects in the config:
   - `auth-tests`: Tests AccessGate, Auth, and Onboarding flows. Uses NO bypass. Authenticates through the UI.
   - `app-tests`: Tests all authenticated features. Uses `storageState` from auth setup (which includes the access token and auth session). Does NOT use `VITE_DEV_BYPASS`.
2. The `storageState` from auth setup must include:
   - `gamify-gains-access` localStorage key (so AccessGate is bypassed)
   - `sb-{project-ref}-auth-token` localStorage key (so Auth is bypassed)
   - Optionally: a seeded `gamify-gains-user` with `onboardingComplete: true` (so Onboarding is bypassed)
3. Do NOT rely on `VITE_DEV_BYPASS` for E2E tests -- it skips real code paths
4. For the auth setup project, authenticate through the AccessGate + Auth screens once, save the state, and all app tests reuse it

**Phase relevance:** This is the foundation of the entire test architecture. Decide the project structure and auth strategy before writing any tests.

---

### 11. Plausible Script Blocked in Test Environments

**What goes wrong:** The Plausible script is loaded from `https://plausible.io/js/script.js` via a `<script>` tag in `index.html`. In test environments (local dev, CI), this script may not load because: (a) the test server runs on `localhost` and the `data-domain` is `trained-app-eta.vercel.app`, so Plausible ignores events; (b) Playwright may block external scripts; or (c) ad blockers in the test browser block `plausible.io`. When `window.plausible` is undefined, all `trackEvent()` calls silently do nothing. This is fine for test execution, but it means you cannot verify that analytics events are actually firing correctly.

**The existing guard in analytics.ts:**
```typescript
if (import.meta.env.DEV) {
  console.log('[Analytics]', event, props)
  return
}
```
This means in dev mode, events are logged to console but NOT sent to Plausible. Tests running against the dev server will never exercise the real Plausible path.

**Warning signs:**
- Analytics events fire in dev console but not in production
- Plausible dashboard shows zero events after deploying new tracking
- Events fire in production but with wrong property names (never caught in tests)
- Funnel analysis shows broken funnels because intermediate events were never fired

**Prevention:**
1. Create a test utility that intercepts `trackEvent` calls and records them:
   ```typescript
   // test-helpers/analytics.ts
   export async function getTrackedEvents(page: Page): Promise<Array<{event: string, props?: object}>> {
     return page.evaluate(() => (window as any).__TEST_ANALYTICS_EVENTS__ || [])
   }
   ```
   And in analytics.ts, add a test hook:
   ```typescript
   if (import.meta.env.VITE_TEST_ANALYTICS === 'true') {
     (window as any).__TEST_ANALYTICS_EVENTS__ = (window as any).__TEST_ANALYTICS_EVENTS__ || []
     (window as any).__TEST_ANALYTICS_EVENTS__.push({ event, props })
   }
   ```
2. Write explicit E2E tests that verify critical events fire during user flows:
   - "When user completes onboarding, `Onboarding Completed` event fires with `training_days` prop"
   - "When user logs a workout, `Workout Completed` event fires with `workout_type` and `duration_minutes`"
3. Do NOT test analytics by checking the Plausible dashboard -- that has a delay and is not deterministic
4. Verify event property names match the Plausible goal configuration before deploying

**Phase relevance:** Analytics verification tests should be written AFTER the funnel event names are finalized (Pitfall #5) but as part of the E2E test suite.

---

### 12. Existing Unit Tests Broken After Design Refresh

**What goes wrong:** The app has 6 existing test files (3 store tests, 3 component tests). The store tests (`workoutStore.test.ts`, `macroStore.test.ts`, `xpStore.test.ts`) are likely fine -- they test business logic, not UI. But the component tests (`Button.test.tsx`, `Card.test.tsx`, `ProgressBar.test.tsx`) were written before the shadcn/ui migration and almost certainly assert against old class names, old component APIs, or old rendering behavior. Running `vitest run` and seeing failures creates a demoralizing start to the testing milestone.

**Specific risk areas:**
- `Button.test.tsx`: The Button component was completely replaced by shadcn's Button with CVA variants. Old tests may assert against variant class names that no longer exist.
- `Card.test.tsx`: Card structure changed in the shadcn migration. Tests may assert against old child component structure.
- `ProgressBar.test.tsx`: May assert against old progress bar implementation.
- `src/test/setup.ts`: Mocks localStorage, but may not mock the new shadcn dependencies or Radix UI primitives properly.

**Warning signs:**
- `npm run test:run` fails immediately with import errors or missing component exports
- Tests compile but fail on class name assertions (`expected 'bg-surface' but received 'bg-card'`)
- Tests assert against component props that no longer exist in the shadcn version

**Prevention:**
1. Run the existing test suite FIRST, before writing any new code. Document what passes and what fails:
   ```bash
   npm run test:run 2>&1 | tee test-audit-results.txt
   ```
2. Fix or delete broken tests based on a simple rule: if the test asserts business logic (store behavior), fix it. If it asserts visual output (CSS classes, DOM structure), delete it and replace with E2E tests that verify the actual user experience.
3. Do NOT spend days fixing component snapshot tests -- E2E tests provide better coverage for visual behavior
4. Update `src/test/setup.ts` if needed for new dependencies (Radix UI portals, etc.)
5. Consider adding `vitest run` to CI as a gate AFTER fixing the tests, so regressions are caught going forward

**Phase relevance:** Existing test repair should happen BEFORE new E2E tests are written. It provides a baseline and catches any business logic regressions introduced during the design refresh.

---

### 13. Sentry Session Replay PII Leakage in Fitness Context

**What goes wrong:** The app has `replaysOnErrorSampleRate: 1.0` -- every session with an error gets a replay recorded. Sentry session replay captures DOM snapshots, which include text content. In a fitness app, this means replays may capture: body weight, age, calorie intake, macro targets, meal names, workout exercises and weights lifted, streak data, and potentially email addresses from the auth screen. The existing `beforeSend` filter redacts email patterns from error messages, but session replay captures the DOM directly -- the `beforeSend` hook does not apply to replay data.

**Specific PII risk areas in this app:**
- Settings screen: displays email, weight, height, age, gender
- Macros screen: food search queries, logged meals (dietary data is health PII in many jurisdictions)
- Workouts screen: exercises, weights, reps (fitness data)
- Profile/onboarding: username, body metrics

**Warning signs:**
- Sentry replay dashboard shows user body weights, meal details, and email addresses
- GDPR/CCPA compliance review flags session replay as a PII vector
- Users discover their fitness data is being recorded and lose trust

**Prevention:**
1. Configure Sentry replay masking for sensitive DOM elements:
   ```typescript
   replayIntegration({
     maskAllText: false, // Don't mask everything -- too aggressive
     maskAllInputs: true, // Mask all form inputs
     blockAllMedia: false,
     // Mask specific sensitive selectors
     mask: [
       '[data-sentry-mask]', // Opt-in masking
       'input[type="email"]',
       'input[type="password"]',
     ],
   })
   ```
2. Add `data-sentry-mask` to components displaying: weight, meals, body metrics, email
3. Alternatively, add `data-sentry-block` to entire screens (Settings, Macros) to exclude them from replay entirely
4. Review the current Sentry replay configuration and test it: trigger an error, then check the replay in Sentry dashboard to see what's captured
5. Document what IS and IS NOT captured in a privacy log

**Phase relevance:** This should be reviewed during the Sentry performance monitoring phase, BEFORE the launch to 90k users. Post-launch discovery of PII leakage is a trust-destroying event.

---

### 14. Sync Debounce Timer Causing Race Conditions in Tests

**What goes wrong:** The `scheduleSync()` function in `src/lib/sync.ts` uses a 2-second debounce timer. When a Playwright test performs an action (e.g., logs a workout), the sync fires 2 seconds later. If the test makes an assertion immediately after the action, it may pass -- but 2 seconds later, `syncAllToCloud()` fires and modifies Supabase state. The NEXT test, which depends on a clean database, sees unexpected data. Alternatively, if a test checks that data was synced, it needs to wait at least 2 seconds + network time, introducing artificial delays.

**Code path:**
```
User action -> scheduleSync() -> 2s debounce -> syncAllToCloud() -> Supabase writes
```

**Warning signs:**
- Tests that check Supabase state fail intermittently (sync hasn't fired yet)
- Tests that should have clean state see data from previous tests (sync fired AFTER cleanup)
- Adding `await page.waitForTimeout(3000)` makes tests pass (bad sign -- timing dependency)
- Test suite takes 2x longer than expected due to sync wait times

**Prevention:**
1. **For most E2E tests, block Supabase network requests** so sync never completes:
   ```typescript
   await page.route('**/rest/v1/**', route => route.abort())
   ```
   This tests the offline-first behavior (Zustand stores work without Supabase) which is the primary UX path anyway.
2. **For tests that explicitly test sync behavior**, wait for the sync indicator:
   ```typescript
   // Trigger action
   await page.click('[data-testid="log-workout-button"]')
   // Wait for sync to complete (SyncStatusIndicator shows then hides)
   await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible()
   await expect(page.locator('[data-testid="sync-indicator"]')).toBeHidden({ timeout: 10000 })
   ```
3. **In test teardown**, flush pending syncs before cleanup:
   ```typescript
   await page.evaluate(() => {
     // Clear any pending sync timers
     const syncTimerId = (window as any).__syncTimer
     if (syncTimerId) clearTimeout(syncTimerId)
   })
   ```
4. Consider exposing `flushPendingSync()` to the test environment for deterministic sync testing

**Phase relevance:** Sync handling strategy should be decided during Playwright infrastructure setup, alongside the database strategy (Pitfall #9) and localStorage strategy (Pitfall #4). These three are interconnected.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|---|---|---|---|
| Playwright infrastructure setup | Auth wall blocks all tests (#10) | Two-project config with storageState | Critical |
| Playwright infrastructure setup | Service worker intercepts mocks (#3) | `serviceWorkers: 'block'` default | Critical |
| Playwright infrastructure setup | No test selectors exist (#1) | Add data-testid before writing tests | Critical |
| Playwright infrastructure setup | Zustand state leaks via storageState (#4) | Filter storageState, clean in beforeEach | Critical |
| Playwright infrastructure setup | Sync debounce causes races (#14) | Block Supabase routes or wait for indicator | Moderate |
| Test database strategy | Test data pollutes production (#9) | Use local/test Supabase instance | Critical |
| Existing test repair | Old tests broken by design refresh (#12) | Audit first, fix logic tests, delete visual tests | Moderate |
| Writing E2E tests | Animation causes flaky assertions (#7) | CSS override to disable animations | Moderate |
| CI integration | Environment differences (#8) | Explicit viewport, deps, generous timeouts | Moderate |
| Analytics planning | Event names are permanent (#5) | Document naming convention, plan funnel on paper | Critical |
| Analytics verification | Can't test Plausible in dev mode (#11) | Test hook to intercept trackEvent calls | Moderate |
| Sentry performance | Bundle size doubles (#6) | Audit integrations, tree-shake, set size budget | Moderate |
| Sentry configuration | Session replay captures PII (#13) | Mask sensitive elements, review before launch | Moderate |

---

## Recommended Phase Order Based on Pitfalls

The pitfall analysis suggests this ordering to prevent compounding failures:

1. **Existing Test Audit & Repair** -- Fix or remove broken unit tests first. This gives a baseline and catches design refresh regressions. Quick win for confidence.

2. **Test Selectors & Infrastructure** -- Add `data-testid` attributes to the codebase. Configure Playwright with two projects (auth-tests, app-tests), storageState, service worker blocking, and animation disabling. Decide database strategy. This is pure infrastructure -- no actual test assertions yet.

3. **E2E Test Suite** -- Write tests for critical user journeys: auth flow, onboarding, workout logging, meal logging, check-in, XP claim. Use the infrastructure from step 2.

4. **Analytics Event Planning** -- Design funnel event names on paper. Review against existing 22 events. Get naming right before coding.

5. **Analytics Implementation & Verification** -- Add new Plausible events. Write E2E tests that verify events fire. Configure Plausible dashboard goals and funnels.

6. **Sentry Performance Monitoring** -- Add tracing integration. Configure replay masking. Verify bundle size stays within budget. Set up operational alerts.

7. **CI Integration** -- Wire Playwright into GitHub Actions. Configure for headless Chromium. Add test reports. Gate deploys on test pass.

The critical insight: **Steps 1-2 must happen before Step 3**, and **Step 4 must happen before Step 5**. The infrastructure and planning phases prevent the most expensive mistakes.

---

## Sources

### Playwright & E2E Testing
- [Playwright Authentication Docs](https://playwright.dev/docs/auth) -- storageState pattern, project dependencies, global setup
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) -- locator priority, test isolation
- [Playwright Browser Context Isolation](https://playwright.dev/docs/browser-contexts) -- fresh localStorage per test
- [Supawright: Playwright Test Harness for Supabase](https://github.com/isaacharrisholt/supawright) -- automatic cleanup with FK-aware deletion
- [Mokkapps: Login at Supabase via REST API in Playwright](https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test) -- REST API auth for speed
- [Semaphore: Flaky Tests in Rendering and Animation Workflows](https://semaphore.io/blog/flaky-tests-ui) -- animation timing solutions
- [BetterStack: Avoiding Flaky Tests in Playwright](https://betterstack.com/community/guides/testing/avoid-flaky-playwright-tests/) -- timeout and retry patterns
- [BrowserStack: Playwright Selectors Best Practices 2026](https://www.browserstack.com/guide/playwright-selectors-best-practices) -- data-testid usage
- [Vite PWA: Testing Service Worker](https://vite-pwa-org.netlify.app/guide/testing-service-worker) -- SW testing strategies

### Plausible Analytics
- [Plausible Custom Event Goals](https://plausible.io/docs/custom-event-goals) -- goal setup, naming requirements
- [Plausible Custom Properties](https://plausible.io/docs/custom-props/for-custom-events) -- attaching properties to events

### Sentry Monitoring
- [Sentry: How to Reduce Bundle Size of JS SDKs](https://sentry.zendesk.com/hc/en-us/articles/32588203861403-How-can-I-reduce-the-bundle-size-of-JS-SDKs) -- tree-shaking, integration removal
- [Sentry: Tree Shaking for React](https://docs.sentry.io/platforms/javascript/guides/react/configuration/tree-shaking/) -- build flags, dead code elimination
- [Sentry: Session Replay Performance Overhead](https://docs.sentry.io/product/explore/session-replay/web/performance-overhead/) -- bundle size breakdown, DOM complexity impact
- [Sentry Blog: Reduced Replay SDK by 35%](https://blog.sentry.io/sentry-bundle-size-how-we-reduced-replay-sdk-by-35/) -- bundle optimization techniques

### Codebase Analysis
- Direct analysis of: `src/lib/analytics.ts` (22 existing events), `src/lib/sentry.ts` (current config), `src/lib/sync.ts` (2s debounce, retry logic), `src/lib/supabase.ts` (client config), `src/stores/authStore.ts` (3-layer auth), `src/stores/syncStore.ts` (non-persisted), `vite.config.ts` (SW caching rules, manual chunks), `src/App.tsx` (AccessGate/Auth/Onboarding gates), `src/test/setup.ts` (existing test infrastructure), `package.json` (dependency versions)
- `grep` analysis: 0 `data-testid` attributes, 8 Zustand persist stores with `gamify-gains-*` keys, 6 existing test files

---

*Research compiled: 2026-02-06*
