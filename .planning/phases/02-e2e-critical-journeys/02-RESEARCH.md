# Phase 2: E2E Critical Journeys - Research

**Researched:** 2026-02-06
**Domain:** Playwright E2E testing for 7 critical user journeys
**Confidence:** HIGH

## Summary

This phase writes 7 Playwright E2E tests covering every launch-critical user flow. Phase 1 is complete with Playwright configured, 60 data-testid attributes across 11 screen files, a `seededPage` fixture for pre-authenticated testing, and 3 passing smoke tests. The research below maps each of the 7 required test journeys to the exact UI flow, Zustand stores involved, selectors available, and API calls that need mocking or intercepting.

The two most complex tests are the auth/onboarding journey (E2E-05) -- which must run WITHOUT `VITE_DEV_BYPASS` and mock Supabase auth -- and the offline sync test (E2E-11) -- which must use `context.setOffline()` and verify localStorage persistence plus sync-on-reconnect. All other tests (E2E-06 through E2E-10) can use the existing `seededPage` fixture with `VITE_DEV_BYPASS=true`.

**Primary recommendation:** Split into 2 plans: Plan 02-01 handles auth+onboarding tests (E2E-05, E2E-06) which need custom non-bypass fixtures with route mocking; Plan 02-02 handles the 5 core feature tests (E2E-07 through E2E-11) which use seededPage with targeted store overrides.

## Standard Stack

### Core (already installed in Phase 1)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | ^1.58.2 | E2E test runner | Already installed, configured with Vite dev server |
| Chromium browser | (bundled) | Single browser target | Decision from STATE.md |

### Supporting (no new installs needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| e2e/fixtures/base.ts | custom | seededPage fixture | All non-auth tests (E2E-07 through E2E-11) |
| e2e/helpers/storage.ts | custom | seedStore/seedAllStores | Seeding specific store states per test |

### No New Dependencies Required
All test infrastructure exists from Phase 1. No new packages needed.

## Architecture Patterns

### Test File Structure
```
e2e/tests/
├── smoke.spec.ts              # Existing (Phase 1)
├── auth-onboarding.spec.ts    # NEW: E2E-05, E2E-06
└── core-journeys.spec.ts      # NEW: E2E-07 through E2E-11
```

### Pattern 1: Auth Tests WITHOUT Dev Bypass

**What:** Auth tests (E2E-05, E2E-06) must run through the actual AccessGate -> Auth -> Onboarding flow. This means they CANNOT use `VITE_DEV_BYPASS=true` (which the webServer currently sets). These tests need their own Playwright config project or must launch without the env var.

**Critical insight from App.tsx (lines 96-147):**
```typescript
const devBypass = import.meta.env.VITE_DEV_BYPASS === 'true'

// Auth wall order:
// 1. If !hasAccess && !accessGranted -> show AccessGate
// 2. If !user -> show Auth
// 3. If !profile?.onboardingComplete -> show Onboarding
// 4. Otherwise -> show main app
```

**Approach:** Use `page.route()` to intercept Supabase API calls and return mock success responses. The app creates the Supabase client from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars. In E2E tests (dev mode), if these are not set, `supabase` is null and `isSupabaseConfigured` is false, which causes the Auth screen to show "Setup Required" instead of the auth form.

**Solution for auth mocking:**
1. Need a separate Playwright project in playwright.config.ts for auth tests that does NOT set `VITE_DEV_BYPASS=true` but DOES set Supabase env vars (can be fake URLs)
2. Use `page.route()` to intercept all requests to the Supabase URL and return mock auth responses
3. The AccessGate validates codes against Lemon Squeezy API OR uses fallback validation (any 8+ char code) when `VITE_LEMONSQUEEZY_API_URL` is not set. In dev mode without the API URL configured, ANY 8+ character code is accepted.

**Simpler alternative (RECOMMENDED):** Since the app is running in dev mode during tests, and Lemon Squeezy API URL won't be configured, the AccessGate already accepts any 8+ char code. For Auth, we need to either:
- Set fake VITE_SUPABASE_URL/KEY env vars and mock all Supabase requests
- OR intercept the auth initialization to make it appear authenticated

**Best approach:** Create a new Playwright project `chromium-auth` in playwright.config.ts that starts the Vite server WITHOUT `VITE_DEV_BYPASS` but WITH fake Supabase env vars. Then use `page.route()` to mock Supabase auth endpoints.

### Pattern 2: Seeded State Overrides Per Test

**What:** Different tests need different starting states. The `seededPage` fixture seeds a "fully loaded" state, but individual tests may need modifications.

**Example - Check-in test:** Seed data has `lastCheckInDate: new Date().toISOString().split('T')[0]` (today) and `currentStreak: 7`, which means the check-in button won't appear (already checked in). The test needs seed data with `lastCheckInDate` set to yesterday.

**Example - XP Claim test:** `canClaimXP()` returns true only on Sundays AND when `pendingXP > 0` AND `lastClaimDate` is 7+ days ago. The test can't depend on it being Sunday. Must override the XP store's date check.

**Pattern:**
```typescript
// Use seedStore() directly instead of seedAllStores() for custom states
import { seedStore, STORE_KEYS, seedAllStores } from '../helpers/storage'

// After seedAllStores, override specific store data
await seedStore(page, STORE_KEYS.user, {
  ...defaultUserState,
  profile: { ...defaultProfile, lastCheckInDate: '2025-01-01' }
}, 0)
```

### Pattern 3: Offline Sync Testing

**What:** E2E-11 tests offline -> online sync cycle.

**Playwright API:** `await context.setOffline(true)` emulates network offline.

**Important limitation from docs:** `context.setOffline()` emulates network being offline but does NOT fire `addEventListener('online')` or `addEventListener('offline')` events automatically.

**The app's sync mechanism (from App.tsx lines 51-87):**
- Listens to `window.addEventListener('online', handleOnline)` and `window.addEventListener('offline', handleOffline)`
- `handleOnline` calls `flushPendingSync()` and sets syncStore.isOnline = true
- `handleOffline` sets syncStore.isOnline = false and syncStore.status = 'offline'

**Test approach:**
1. Start with seeded state online
2. Use `context.setOffline(true)` to go offline
3. Dispatch `window.dispatchEvent(new Event('offline'))` via `page.evaluate()` to trigger the listener
4. Perform a user action (e.g., log macros)
5. Verify SyncStatusIndicator shows "Offline" pill
6. Verify data persists in localStorage (check via `page.evaluate()`)
7. Use `context.setOffline(false)` to go back online
8. Dispatch `window.dispatchEvent(new Event('online'))` via `page.evaluate()`
9. Verify SyncStatusIndicator shows "Syncing..." then disappears
10. The actual Supabase sync will fail (no real backend) -- use `page.route()` to mock Supabase endpoints OR simply verify the sync was attempted

### Anti-Patterns to Avoid
- **Testing through real Supabase:** Never hit a real backend in E2E tests. Always mock API responses.
- **Depending on day of week:** The XP claim requires Sunday. Mock the date or override the store state to make `canClaimXP` return true.
- **Using getByText for ambiguous content:** Multiple elements may share text. Use `getByRole` with name, or `getByTestId` (decision from STATE.md).
- **Forgetting animation delays:** The seededPage fixture disables CSS animations, but JavaScript `setTimeout` delays still exist (e.g., EvolutionStep has a 1.5s timer). Use `page.waitForSelector` or `expect(...).toBeVisible()` with adequate timeouts.
- **Not handling Suspense boundaries:** Routes use `React.lazy` + `<Suspense>`. When navigating, wait for the actual content to appear, not just the skeleton fallback.

## Detailed Test Flows

### E2E-05: Access Gate -> Sign Up -> Onboarding -> Home

**Screens:** AccessGate -> Auth (signup mode) -> Onboarding (10 steps + evolution) -> Home
**Stores involved:** accessStore, authStore, userStore, workoutStore, macroStore, avatarStore, xpStore
**API calls to mock:**
- Lemon Squeezy license validation (or skip -- dev mode accepts 8+ char codes)
- Supabase auth.signUp (must mock response)
- Supabase auth.getSession (initial check)
- Supabase auth.onAuthStateChange (auth state listener)

**Flow:**
1. Navigate to `/` with NO seeded data and NO VITE_DEV_BYPASS
2. App shows AccessGate (because `hasAccess === false`)
3. Enter 8+ character code in `[data-testid="access-code-input"]`
4. Click `[data-testid="access-submit-button"]`
5. AccessGate validates code (dev fallback: any 8+ char = success)
6. Success modal appears with "Access Granted" text and "Begin" button
7. Click "Begin" -> AccessGate calls `onAccessGranted()`
8. App now shows Auth screen (because `user === null`)
9. Auth defaults to signup mode (mode === 'signup')
10. Fill `[data-testid="auth-email-input"]` with test email
11. Fill `[data-testid="auth-password-input"]` with test password
12. Fill confirm password input (no testid -- use `getByRole('textbox')` or label "Confirm Password")
13. Click `[data-testid="auth-submit-button"]` (labeled "Create Account")
14. Mock Supabase signUp to return success (with user object)
15. Auth sets user in store -> app now shows Onboarding
16. Onboarding Step 1 (Welcome): Click "Start" button
17. Step 2 (Name): Fill `[data-testid="onboarding-username-input"]`, click `[data-testid="onboarding-next-button"]`
18. Step 3 (Gender): Click `[data-testid="onboarding-gender-male"]`, click Continue
19. Step 4 (Fitness): Click a fitness level option, click Continue
20. Step 5 (Days): Click `[data-testid="onboarding-training-days-3"]`, click Continue
21. Step 6 (Schedule): Days are auto-selected from step 5, click Continue
22. Step 7 (Goal): Fill `[data-testid="onboarding-weight-input"]`, `[data-testid="onboarding-height-input"]`, `[data-testid="onboarding-age-input"]`, click `[data-testid="onboarding-goal-recomp"]`, click Continue
23. Step 8 (Avatar): Click an avatar option, click Continue
24. Step 9 (Features): Click Continue
25. Step 10 (Tutorial): Click "Begin" (calls `finishOnboarding()`)
26. Evolution step: Wait for animation (1.5s timer), click "Begin"
27. App navigates to `/` -> Home screen visible
28. Assert: `[data-testid="home-screen"]` visible, navigation visible, username visible

**data-testid selectors used:** access-gate, access-code-input, access-submit-button, auth-screen, auth-email-input, auth-password-input, auth-submit-button, onboarding-screen, onboarding-username-input, onboarding-next-button, onboarding-gender-male, onboarding-training-days-3, onboarding-weight-input, onboarding-height-input, onboarding-age-input, onboarding-goal-recomp, home-screen

**Confirm password field note:** The confirm password input does NOT have a data-testid. Use `page.getByLabel('Confirm Password')` or locate by id `confirmPassword`.

### E2E-06: Sign In -> Home with Existing Data

**Screens:** Auth (login mode) -> Home (with seeded data)
**Stores involved:** authStore (for login), all stores (pre-seeded for "existing data")
**API calls to mock:** Supabase auth.signInWithPassword, auth.getSession

**Flow:**
1. Navigate to `/` with access store seeded (hasAccess: true) but NO user auth
2. App shows Auth screen (hasAccess passes, but user === null)
3. Click `[data-testid="auth-toggle-mode"]` to switch to login (default is signup)
4. Fill email and password
5. Click `[data-testid="auth-submit-button"]` (labeled "Sign In")
6. Mock Supabase signIn to return success
7. Meanwhile, seed all other stores via localStorage (user profile with onboardingComplete: true, workouts, macros, xp, etc.)
8. App transitions to Home with seeded data
9. Assert: Username visible, streak display visible, XP display visible, level display visible

**Alternative simpler approach:** Pre-seed ALL stores (including user profile with onboardingComplete) and just verify the auth flow transitions correctly. The "existing data" is already in localStorage -- the Auth screen just gates access to it.

### E2E-07: Full Workout Logging Flow

**Screens:** Workouts screen
**Stores involved:** workoutStore, xpStore, avatarStore, achievementsStore
**Fixture:** seededPage (pre-authenticated, bypasses auth)

**Flow:**
1. Navigate to Workouts via `[data-testid="nav-workouts"]`
2. Verify `[data-testid="workouts-screen"]` visible
3. Seed data includes a training plan with today being a training day (the default seed has `currentPlan` with push/pull/legs/upper on days 1,2,4,5). Test may need to ensure today's day of week matches a training day, OR override the seed.
4. If today's workout is available, "Start Workout" button visible at `[data-testid="workouts-start-button"]`
5. Click Start Workout -> ActiveWorkoutView renders with exercises
6. Exercise cards appear with `[data-testid="workouts-exercise-card"]`
7. For first exercise: fill weight in `[data-testid="workouts-set-weight-input"]` (first one), fill reps in `[data-testid="workouts-set-reps-input"]`, click `[data-testid="workouts-set-checkbox"]` ("Done" button)
8. Repeat for remaining sets of first exercise
9. Complete all sets for all exercises (or use "End Workout Early")
10. Click `[data-testid="workouts-complete-button"]` (enabled when all sets complete)
11. Assert: Workout completed, XP awarded, toast shows

**Key challenge:** The seeded workout plan has specific days. If the test runs on a rest day, there's no "Start Workout" button. **Solution:** Override the `workoutStore` seed to make today a training day regardless of actual day of week. The `schedule` array maps day indices (0=Sun..6=Sat) to workout types. Set the current day's index to a workout type.

**Workout start button:** `data-testid="workouts-start-button"` only shows when `todayWorkout` exists AND `isCompleted` is false.

**Set completion flow:** Each set row has weight input, reps input, and "Done" button. The "Done" button is at `[data-testid="workouts-set-checkbox"]`. After clicking Done, the set shows a checkmark. When ALL sets across ALL exercises are done, `[data-testid="workouts-complete-button"]` becomes enabled (it's disabled with text "Complete All Sets First" until then).

**Multiple same-testid elements:** Weight inputs, reps inputs, and Done buttons all share the same testid across sets. Use `.first()`, `.nth(N)`, or scope with parent locator.

### E2E-08: Meal Logging Flow

**Screens:** Macros screen (Daily tab + Log tab)
**Stores involved:** macroStore, xpStore
**Fixture:** seededPage

**Flow:**
1. Navigate to Macros via `[data-testid="nav-macros"]`
2. Verify `[data-testid="macros-screen"]` visible with Macros heading
3. Default tab is "Daily" which shows macro progress rings
4. Verify protein and calories displays visible at `[data-testid="macros-protein-display"]` and `[data-testid="macros-calories-display"]`
5. In the QUICK LOG section: fill protein value in `[data-testid="macros-food-search-input"]` (note: this testid is on the protein input despite the name)
6. Fill calories value in the adjacent input (no testid -- use label "Calories" or position)
7. Click `[data-testid="macros-add-meal-button"]` ("Log Macros")
8. Verify macro totals update (protein display shows new value)
9. Expand "TODAY'S MEALS" section to verify the logged entry appears at `[data-testid="macros-meal-entry"]`

**Note on testid naming:** The `macros-food-search-input` testid is actually on the Quick Log protein input, not a food search input. The app doesn't have a food search feature in the traditional sense -- it has Quick Log (protein/calories inputs) and a Meal Builder. The testid name is misleading but it's what Phase 1 assigned.

**Alternative meal logging path (Log tab):**
1. Click "Log" tab
2. Click "Create New Meal" button
3. Use MealBuilder component to add ingredients
4. Save and log the meal
This is more complex and may not be needed for the E2E test -- the Quick Log on the Daily tab is sufficient to prove the flow.

### E2E-09: Daily Check-in and Streak

**Screens:** Home screen + CheckInModal
**Stores involved:** userStore (streak), xpStore (daily log), avatarStore, achievementsStore
**Fixture:** seededPage with MODIFIED user store (lastCheckInDate = yesterday, not today)

**Flow:**
1. Start on Home screen with seeded data where user has NOT checked in today
2. The check-in button should be visible at `[data-testid="home-checkin-button"]`
3. Also visible: "Daily Report Pending" card (clickable, opens check-in modal too)
4. Click `[data-testid="home-checkin-button"]`
5. CheckInModal opens at `[data-testid="checkin-modal"]`
6. Modal shows quest checkboxes (workout, protein, calories, check-in)
7. Check-in is always checked (disabled, auto-checked)
8. Streak bonus visible at `[data-testid="checkin-streak-display"]`
9. Click `[data-testid="checkin-confirm-button"]` ("Submit Report")
10. Modal shows success state ("Report Accepted") with XP breakdown animation
11. Click "Continue" to close modal
12. Home screen shows "Daily Report Complete" card (green, with XP earned)
13. The check-in button is now replaced with the completion card
14. Assert: Streak was maintained (streak display updated)

**Critical seed data requirement:** Must seed user store with `lastCheckInDate` as yesterday (not today) so the check-in button appears. The current `seedAllStores` sets `lastCheckInDate: new Date().toISOString().split('T')[0]` which is TODAY -- meaning the user already checked in and the button won't appear.

### E2E-10: Weekly XP Claim

**Screens:** Home screen + XPClaimModal
**Stores involved:** xpStore (pendingXP, canClaimXP, claimWeeklyXP)
**Fixture:** seededPage with MODIFIED xp store

**Flow:**
1. Start on Home screen with seed data where `canClaimXP()` returns true
2. The "Reward Ritual Ready" card appears at `[data-testid="home-claim-xp-button"]`
3. Click the card
4. XPClaimModal opens at `[data-testid="xpclaim-modal"]`
5. Modal shows XP breakdown by day
6. Total pending XP visible at `[data-testid="xpclaim-amount-display"]`
7. Click `[data-testid="xpclaim-claim-button"]` ("CLAIM REWARD")
8. Modal transitions to "claiming" phase with XP count-up animation (2 seconds)
9. Then transitions to "complete" phase showing "Reward Claimed" with total
10. Click "Continue" to close
11. Assert: pendingXP is now 0, totalXP increased

**Critical challenge:** `canClaimXP()` checks `isLocalSunday()` which returns true only on Sundays. Tests must work any day of the week.

**Solution:** Seed the xp store directly AND override `Date` in the browser to make it Sunday. Use `page.addInitScript()` to mock `Date`:
```typescript
await page.addInitScript(() => {
  // Make Date always return a Sunday
  const RealDate = Date
  const fakeDate = new RealDate('2025-01-19T12:00:00') // A known Sunday
  class MockDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(fakeDate.getTime())
      } else {
        // @ts-ignore
        super(...args)
      }
    }
    static now() { return fakeDate.getTime() }
  }
  // @ts-ignore
  window.Date = MockDate
})
```

Alternative: Seed the xp store with state that bypasses the Sunday check by manipulating the store state AFTER the component reads it. But this is fragile. Date mocking is cleaner.

**XP store seed for claim test:**
```typescript
await seedStore(page, STORE_KEYS.xp, {
  totalXP: 2500,
  currentLevel: 8,
  pendingXP: 350,
  weeklyHistory: [...],
  dailyLogs: [
    {
      date: '2025-01-18', // Saturday (day before mocked Sunday)
      workout: true, protein: true, calories: true,
      checkIn: true, perfectDay: true, streakBonus: 70,
      total: 350, claimed: false,
    }
  ],
  lastClaimDate: '2025-01-12', // 7+ days ago
}, 0)
```

### E2E-11: Offline -> Online Sync Cycle

**Screens:** Home or Macros (any screen with data modification)
**Stores involved:** syncStore, macroStore (for data modification)
**Fixture:** seededPage

**Flow:**
1. Start on Home screen with seeded data (online)
2. SyncStatusIndicator is NOT visible (returns null when synced)
3. Go offline: `await context.setOffline(true)` + dispatch offline event
4. Dispatch event: `await page.evaluate(() => window.dispatchEvent(new Event('offline')))`
5. SyncStatusIndicator should now show "Offline" pill
6. Navigate to Macros, log some macros (Quick Log)
7. Verify the toast shows "Saved locally. Will sync when online."
8. Verify data persists in localStorage: `await page.evaluate(() => localStorage.getItem('gamify-gains-macros'))`
9. Go back online: `await context.setOffline(false)` + dispatch online event
10. Dispatch: `await page.evaluate(() => window.dispatchEvent(new Event('online')))`
11. The `flushPendingSync()` will be called, which attempts to sync to Supabase
12. Since there's no real Supabase, the sync will fail. Mock Supabase requests OR just verify the sync was attempted and the status changed.
13. Assert: Data is still in localStorage (persisted through offline cycle)

**Mock approach for sync verification:** Use `page.route('**/rest/v1/**', route => route.fulfill({ status: 200, json: {} }))` to mock Supabase REST calls. This way `syncAllToCloud` succeeds and `SyncStatusIndicator` transitions from "Syncing..." back to hidden.

**Note on service workers:** `serviceWorkers: 'block'` is set in playwright.config.ts, so SW won't interfere with offline testing. The offline emulation is purely at the network level.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date mocking for Sunday check | Custom date utility | `page.addInitScript` with Date override | Playwright runs scripts before page loads; modifying Date constructor is standard |
| Auth mocking | Test user in real Supabase | `page.route()` to mock Supabase API | No external dependencies, deterministic, works in CI |
| Network offline | Custom fetch interceptor | `context.setOffline()` + manual event dispatch | Playwright built-in, plus event dispatch for app listeners |
| Store state per test | Complex fixture variations | `seedStore()` overrides after `seedAllStores()` | Existing helper from Phase 1 |
| Animation waiting | `page.waitForTimeout()` | `expect(locator).toBeVisible()` with timeout | Auto-retry built into Playwright assertions |

## Common Pitfalls

### Pitfall 1: VITE_DEV_BYPASS Blocks Auth Testing
**What goes wrong:** The webServer in playwright.config.ts sets `VITE_DEV_BYPASS=true`, which skips AccessGate, Auth, and Onboarding entirely. Auth tests can't run.
**Why it happens:** Phase 1 deliberately set this for non-auth tests.
**How to avoid:** Create a separate Playwright project for auth tests with different env vars. Use `webServer` per-project or test-level env configuration.
**Warning signs:** Auth tests navigate to `/` and immediately see Home screen instead of AccessGate.

### Pitfall 2: Seeded Data Makes Check-in Button Disappear
**What goes wrong:** The default `seedAllStores` sets `lastCheckInDate` to today, so the user appears to have already checked in. The check-in button doesn't render.
**Why it happens:** Seed data was designed for smoke tests that verify the app loads, not for testing check-in flow.
**How to avoid:** Override the user store seed to set `lastCheckInDate` to yesterday for check-in tests.
**Warning signs:** Test can't find `[data-testid="home-checkin-button"]` -- instead sees "Daily Report Complete" card.

### Pitfall 3: XP Claim Only Works on Sundays
**What goes wrong:** `canClaimXP()` returns false on non-Sundays, so the claim button never appears.
**Why it happens:** Business logic requires Sunday for weekly ritual.
**How to avoid:** Mock `Date` in the browser via `page.addInitScript()` to make it Sunday.
**Warning signs:** `[data-testid="home-claim-xp-button"]` never appears despite seeding pendingXP > 0.

### Pitfall 4: context.setOffline Doesn't Fire Browser Events
**What goes wrong:** Going offline with `context.setOffline(true)` stops network traffic but doesn't trigger the `offline` event listener the app uses.
**Why it happens:** Playwright's offline emulation is at the network level, not the browser API level.
**How to avoid:** Manually dispatch `window.dispatchEvent(new Event('offline'))` and `new Event('online')` after calling setOffline.
**Warning signs:** App continues showing "synced" status even when offline.

### Pitfall 5: Today's Workout Depends on Day of Week
**What goes wrong:** The workout test expects a "Start Workout" button, but it's a rest day in the seeded schedule.
**Why it happens:** `getTodayWorkout()` uses `new Date().getDay()` to look up the schedule.
**How to avoid:** Either mock Date (like XP claim test) or seed a schedule where ALL days are workout days.
**Warning signs:** Workouts screen shows "Recovery Day" instead of workout card with Start button.

### Pitfall 6: Multiple Elements Share Same data-testid
**What goes wrong:** Assertions fail with "strict mode violation" when using `getByTestId('workouts-set-weight-input')` because multiple sets share this testid.
**Why it happens:** Phase 1 added class-level testids for repeating elements (sets, exercise cards, meal entries).
**How to avoid:** Use `.first()`, `.nth(N)`, or scope with parent locator: `page.locator('[data-testid="workouts-exercise-card"]').first().locator('[data-testid="workouts-set-weight-input"]').first()`.
**Warning signs:** Playwright error: "strict mode violation: getByTestId('workouts-set-weight-input') resolved to N elements".

### Pitfall 7: Lazy-Loaded Routes Need Suspense Wait
**What goes wrong:** Test navigates to a route and immediately asserts, but only sees the skeleton fallback.
**Why it happens:** All routes use `React.lazy` + `<Suspense>` with skeleton fallbacks.
**How to avoid:** Wait for the actual content testid (e.g., `[data-testid="workouts-screen"]`) rather than assuming instant render.
**Warning signs:** Test sees HomeSkeleton or WorkoutsSkeleton instead of actual content.

### Pitfall 8: Supabase Not Configured Shows "Setup Required"
**What goes wrong:** Auth screen shows "Setup Required" instead of the sign-in form.
**Why it happens:** `isSupabaseConfigured` is false when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set.
**How to avoid:** For auth tests, set fake Supabase env vars in the webServer config AND mock all Supabase API calls via `page.route()`.
**Warning signs:** Auth screen shows "Backend is not configured" text.

### Pitfall 9: EvolutionStep Has 1.5s JavaScript Timer
**What goes wrong:** After finishing onboarding tutorial, the evolution step shows an "Egg" animating to "Hatchling" with a 1.5-second `setTimeout`. The "Begin" button only appears after the animation delay.
**Why it happens:** Deliberate UX animation in EvolutionStep component (line 1126: `setTimeout(() => setShowNew(true), 1500)`).
**How to avoid:** CSS animations are disabled by the fixture, but JS timers are not. Wait for the "Begin" button to appear with `expect(page.getByRole('button', { name: 'Begin' })).toBeVisible({ timeout: 5000 })`.
**Warning signs:** Test clicks "Begin" before it's visible, or times out.

## Code Examples

### Creating Auth Test Project in playwright.config.ts

```typescript
// In playwright.config.ts - add second project for auth tests
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    testMatch: /(?!auth-onboarding).*\.spec\.ts/,
  },
  {
    name: 'chromium-auth',
    use: { ...devices['Desktop Chrome'] },
    testMatch: /auth-onboarding\.spec\.ts/,
  },
],

webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
  env: {
    VITE_DEV_BYPASS: 'true',
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'fake-anon-key-for-testing',
  },
},
```

**Note:** Both projects share the same dev server. The `VITE_DEV_BYPASS` env var is baked into the Vite bundle at build time, so a single server serves both. The auth tests need to work differently.

**Better approach:** Since VITE_DEV_BYPASS is checked at runtime via `import.meta.env.VITE_DEV_BYPASS`, and the webServer starts with it set to 'true', auth tests should use `page.addInitScript` to override the env check OR route the app directly to `/access` and `/auth` pages (which are available via dev bypass routes in App.tsx lines 162-164):
```typescript
{devBypass && <Route path="/auth" element={<Auth />} />}
{devBypass && <Route path="/access" element={<AccessGate onAccessGranted={() => {}} />} />}
```

Wait -- these dev routes exist but AccessGate's `onAccessGranted` is a no-op `() => {}`. This won't work for the full flow.

**FINAL RECOMMENDED APPROACH for auth tests:**
1. Keep VITE_DEV_BYPASS=true in webServer (single server for all tests)
2. For auth tests, use `page.addInitScript` to:
   a. Set `localStorage` for access store with `hasAccess: false` (forces AccessGate)
   b. Override `import.meta.env.VITE_DEV_BYPASS` to `'false'` in the window context
   c. Actually, `import.meta.env` is replaced at Vite compile time, so you can't override it at runtime.
3. **REAL solution:** Auth test navigates to a clean page (no seeded data), and since `VITE_DEV_BYPASS=true` skips all gates, the test actually navigates to the dedicated dev routes: `/access` first, then `/auth`, then `/onboarding`. But these routes have limitations (AccessGate's onAccessGranted is no-op).

**SIMPLEST VIABLE APPROACH:**
- Start a SEPARATE Vite dev server for auth tests on a different port (e.g., 5174) WITHOUT VITE_DEV_BYPASS
- Use a separate Playwright project with its own webServer config
- OR: Test auth screens individually via dev routes (`/access`, `/auth`, `/onboarding`) and verify each screen works, then verify the INTEGRATION by seeding stores to simulate "just completed access gate" state

**ACTUALLY -- the cleanest approach:**
The real auth flow (AccessGate -> Auth -> Onboarding -> Home) works when VITE_DEV_BYPASS is NOT set. The Playwright config should define TWO webServer entries or use a project-specific approach. But Playwright only supports one webServer.

**Resolution:** Modify playwright.config.ts to NOT set VITE_DEV_BYPASS. Instead, the `seededPage` fixture already bypasses auth by seeding the access+user stores. The ONLY reason VITE_DEV_BYPASS exists is to skip gates for non-auth tests. But if stores are seeded with `hasAccess: true` and `profile.onboardingComplete: true`, the gates are already passed. Let's verify...

Looking at App.tsx:
- Line 114: `if (!devBypass && !hasAccess && !accessGranted)` -> shows AccessGate
- Line 124: `if (!devBypass && !user)` -> shows Auth

Without devBypass, even with `hasAccess: true` seeded, the app still checks `!user` (Supabase auth user). The `seededPage` fixture seeds localStorage stores but doesn't authenticate with Supabase. Without `VITE_DEV_BYPASS`, the app will show Auth screen even with all stores seeded.

**CONCLUSION:** Keep VITE_DEV_BYPASS=true for the webServer. For auth tests:
1. Use `page.addInitScript` to set `window.__E2E_DISABLE_DEV_BYPASS = true`
2. Modify the app code minimally: check `window.__E2E_DISABLE_DEV_BYPASS` in App.tsx
3. OR: Accept that VITE_DEV_BYPASS is compile-time and test auth screens individually via their dev routes

**RECOMMENDED APPROACH (no app code changes):**
- Auth test plan (02-01) adds a SECOND webServer on port 5174 started without VITE_DEV_BYPASS and WITH fake Supabase env vars
- Auth tests use `baseURL: 'http://localhost:5174'` via project-level config
- Non-auth tests keep using port 5173 with VITE_DEV_BYPASS

Alternatively, the planner could decide to use a simpler approach that tests auth screens individually via dev routes and verifies integration through store state.

### Mock Supabase Auth Responses

```typescript
// Mock Supabase auth for sign-up flow
await page.route('**/auth/v1/signup', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      user: {
        id: 'e2e-test-user-id',
        email: 'e2e@test.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
      },
      session: {
        access_token: 'fake-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh-token',
        user: {
          id: 'e2e-test-user-id',
          email: 'e2e@test.com',
        },
      },
    }),
  })
})

// Mock Supabase auth session check
await page.route('**/auth/v1/token*', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      access_token: 'fake-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'fake-refresh-token',
      user: {
        id: 'e2e-test-user-id',
        email: 'e2e@test.com',
      },
    }),
  })
})
```

### Override Seed Data for Specific Tests

```typescript
import { seedStore, STORE_KEYS } from '../helpers/storage'

// For check-in test: user hasn't checked in today
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
const yesterdayStr = yesterday.toISOString().split('T')[0]

await seedStore(page, STORE_KEYS.user, {
  profile: {
    // ... same as default seed
    lastCheckInDate: yesterdayStr,  // Not today!
    currentStreak: 7,
    onboardingComplete: true,
  },
  weightHistory: [],
}, 0)
```

### Offline/Online Cycle

```typescript
test('offline to online sync cycle', async ({ seededPage: page, context }) => {
  // Verify initially online (no sync indicator)
  await expect(page.getByText('Offline')).not.toBeVisible()

  // Go offline
  await context.setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))

  // Verify offline indicator appears
  await expect(page.getByText('Offline')).toBeVisible()

  // Perform action while offline
  await page.getByRole('link', { name: 'Macros' }).click()
  await page.locator('[data-testid="macros-food-search-input"]').fill('50')
  // ... fill calories, click log

  // Verify data in localStorage
  const macroData = await page.evaluate(() =>
    localStorage.getItem('gamify-gains-macros')
  )
  expect(macroData).toBeTruthy()
  expect(JSON.parse(macroData!).state.dailyLogs).toBeDefined()

  // Go back online
  await context.setOffline(false)
  await page.evaluate(() => window.dispatchEvent(new Event('online')))

  // Mock Supabase responses for sync
  await page.route('**/rest/v1/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{}',
  }))

  // Verify sync attempted (indicator shows syncing then disappears)
  // The SyncStatusIndicator returns null when status=synced && !pendingChanges
  await expect(page.getByText('Offline')).not.toBeVisible({ timeout: 10000 })
})
```

### Date Mocking for Sunday XP Claim

```typescript
// Add before page.goto() - mock Date to be a Sunday
await page.addInitScript(() => {
  const sunday = new Date('2025-01-19T12:00:00') // A known Sunday at noon
  const RealDate = globalThis.Date

  class MockDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(sunday.getTime())
      } else {
        // @ts-expect-error spread args
        super(...args)
      }
    }
    static now() {
      return sunday.getTime()
    }
    static parse(s: string) {
      return RealDate.parse(s)
    }
    static UTC(...args: any[]) {
      // @ts-expect-error spread args
      return RealDate.UTC(...args)
    }
  }

  globalThis.Date = MockDate as any
  // Keep toISOString and other prototype methods from RealDate
  Object.setPrototypeOf(MockDate.prototype, RealDate.prototype)
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| getByText for selectors | getByRole + getByTestId | Phase 1 decision | Avoids strict mode violations with duplicate text |
| Dynamic seed data | Static seed data | Phase 1 decision | Deterministic tests, no Date.now() drift |
| Service worker active | serviceWorkers: 'block' | Phase 1 config | Prevents cache interference in tests |
| Global auth bypass | Selective per-test auth control | Phase 2 (new) | Auth tests can run through real flow |

## Open Questions

1. **Auth test server strategy**
   - What we know: VITE_DEV_BYPASS is compile-time (Vite replaces `import.meta.env.X`). Can't override at runtime. The current webServer sets it to true.
   - What's unclear: Whether to run a second dev server, modify app code to support E2E bypass override, or test auth screens individually via dev routes.
   - Recommendation: The planner should decide between (a) second webServer on different port, (b) testing auth screens via dev routes `/access`, `/auth`, `/onboarding` individually, or (c) removing VITE_DEV_BYPASS from webServer and relying entirely on localStorage seeding for auth bypass in non-auth tests. Option (c) requires verifying that seeded stores + Supabase mocking is sufficient.

2. **Workout day-of-week dependency**
   - What we know: `getTodayWorkout()` uses `new Date().getDay()` to determine workout type
   - What's unclear: Whether Date mocking interferes with other date-dependent logic
   - Recommendation: Mock Date to a known day that has a workout scheduled in the seed data, OR seed a schedule where every day is a workout day

3. **Supabase sync verification depth**
   - What we know: E2E-11 requires "sync triggers on reconnect"
   - What's unclear: How deep to verify -- just that sync was attempted, or that specific API calls were made?
   - Recommendation: Mock Supabase REST endpoints and verify they were called (use `page.route` with a callback that records calls), plus verify localStorage data persisted correctly

## Sources

### Primary (HIGH confidence)
- Source code analysis: App.tsx, all screen files, all store files, e2e infrastructure files
- Playwright config: playwright.config.ts (Phase 1 output)
- Phase 1 verification report: 01-VERIFICATION.md (confirmed infrastructure works)
- Phase 1 Plan 02: 01-02-PLAN.md (details on seeding, testids, fixtures)

### Secondary (MEDIUM confidence)
- [Playwright Network docs](https://playwright.dev/docs/network) - route.fulfill, route.abort
- [Playwright BrowserContext docs](https://playwright.dev/docs/api/class-browsercontext) - setOffline
- [Playwright Mock APIs](https://playwright.dev/docs/mock) - API mocking patterns
- [BrowserStack Playwright Mocking Guide](https://www.browserstack.com/guide/how-to-mock-api-with-playwright)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All infrastructure exists from Phase 1, verified working
- Architecture: HIGH - Source code analyzed in detail, all flows mapped
- Pitfalls: HIGH - Each pitfall identified from actual code analysis (not speculation)
- Auth mocking strategy: MEDIUM - Multiple approaches viable, planner should decide

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (stable -- no dependency changes expected)
