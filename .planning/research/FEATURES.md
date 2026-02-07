# Feature Landscape: E2E Testing, Analytics, and Monitoring

**Domain:** Pre-launch quality assurance and observability for a fitness gamification PWA
**Researched:** 2026-02-06
**Overall confidence:** HIGH (based on codebase analysis + Plausible docs + Playwright best practices + Web Vitals standards)

---

## Table Stakes

Features that MUST be in place before launching to ~90k followers with no beta group. Missing any of these means flying blind or shipping broken flows.

### 1. E2E Tests for Critical User Journeys

**Why expected:** Launching to 90k users simultaneously with zero beta testing means broken flows will be discovered by EVERYONE at once. Manual testing cannot cover the permutations. E2E tests are the safety net.

| Journey | What to Test | Complexity | Notes |
|---------|-------------|------------|-------|
| Access Gate -> Auth -> Onboarding | Enter access code, create account, complete 10-step wizard, land on Home | High | This is the first-use funnel. If it breaks, nobody gets in. Tests all 10 onboarding steps (welcome, name, gender, fitness, days, schedule, goal, avatar, features, tutorial, evolution). |
| Sign In -> Home | Existing user signs in, sees home screen with correct state | Medium | Depends on Supabase auth; needs auth mocking strategy. Tests session persistence. |
| Start Workout -> Log Sets -> Complete | From Home or Workouts screen, start today's workout, log weight/reps on sets, mark complete, verify XP awarded | High | Core value loop. Involves workoutStore, xpStore, avatarStore, achievementsStore interactions. |
| Log Meal -> Hit Macro Target | Navigate to Macros, quick-log protein and calories, verify progress updates and target-hit detection | Medium | Tests macroStore. Food search (USDA API) should be tested but can be mocked. |
| Daily Check-In | Open CheckInModal from Home, toggle quest checkboxes, submit report, verify XP animation and streak update | Medium | Involves userStore (streak), xpStore, avatarStore (reaction), achievementsStore (badges). |
| Weekly XP Claim | On Sunday (mocked date), verify claim banner appears, click claim, verify level-up animation, XP applied | Medium | Date-dependent. Needs date mocking. Tests xpStore.claimWeeklyXP flow. |
| Offline -> Online Sync | Go offline (simulated), log workout, go online, verify sync fires and data persists | Medium | Tests syncStore, navigator.onLine detection, flushPendingSync. Playwright has context.setOffline(). |

**Confidence:** HIGH (journeys derived directly from codebase analysis of App.tsx routing, screen components, and store interactions)

### 2. Plausible Funnel Definitions

**Why expected:** The user explicitly needs to answer "Where do people drop off?" Plausible supports funnels natively, but funnels must be defined in the Plausible dashboard as ordered step sequences. Without pre-defined funnels, you just have a pile of events with no conversion story.

| Funnel | Steps (in order) | What It Answers | Complexity |
|--------|-------------------|-----------------|------------|
| **Signup-to-First-Workout** | Signup Completed -> Onboarding Completed -> Workout Started -> Workout Completed | "How many signups actually work out?" This is THE launch funnel. | Low (config only) |
| **Daily Engagement** | App Opened -> Check-In Completed -> Workout Completed | "Of daily opens, how many complete the core loop?" | Low (config only) |
| **Meal Logging Adoption** | App Opened -> Meal Logged | "Are people using macro tracking or ignoring it?" | Low (config only) |
| **Gamification Loop** | Check-In Completed -> XP Claimed -> Level Up | "Is the XP/leveling system driving retention?" | Low (config only) |

**Plausible funnel setup:** Go to site settings -> Funnels -> Add funnel. Each step maps to an existing custom event goal. Steps must be completed in order; visitors can take other actions between steps. Funnel analysis shows drop-off rates at each step.

**Confidence:** HIGH (verified via Plausible docs: plausible.io/docs/funnel-analysis)

### 3. Missing Analytics Events (Gaps in Current 22 Events)

**Why expected:** The existing 22 events cover breadth but miss critical funnel and engagement depth. For a launch, you need to answer "what happened?" not just "something happened."

| Event to Add | Properties | Why Missing Matters | Complexity |
|-------------|-----------|-------------------|------------|
| `Onboarding Step Viewed` | `{step: string}` | Current: only tracks start and complete. Cannot tell WHERE people drop off in the 10-step wizard. Critical for launch. | Low |
| `Onboarding Abandoned` | `{last_step: string}` | If someone closes the app mid-onboarding, we need to know which step killed them. Fire on visibilitychange hidden during onboarding. | Low |
| `Workout Abandoned` | `{workout_type: string, sets_completed: number, duration_minutes: number}` | Current: tracks start and complete. If 60% start but only 30% complete, that's a design problem. Fire when user navigates away from active workout. | Low |
| `Food Search Used` | `{query_length: number, results_found: boolean}` | "Are people finding food?" If search fails consistently, macro tracking adoption dies. | Low |
| `Streak Lost` | `{previous_streak: number}` | High-streak users churning is the #1 retention risk. Need to know when it happens. | Low |
| `Error Shown` | `{context: string, error_type: string}` | Sentry catches exceptions, but user-facing errors (network, auth, 429) should also be tracked as events. Overlap with Sentry but different audience (product vs engineering). | Low |
| `PWA Installed` | `{}` | Track beforeinstallprompt and appinstalled events. "How many users install the PWA?" is a key engagement metric. | Low |
| `Access Code Entered` | `{success: boolean}` | "What % of access code attempts fail?" If the code entry is confusing, nobody gets past the gate. | Low |

**Confidence:** HIGH (gaps identified by comparing existing analytics.ts events against the user journeys documented in App.tsx, Onboarding.tsx, Workouts.tsx)

### 4. Sentry Performance and Error Alerting Configuration

**Why expected:** Sentry is already integrated with 8 catch blocks + auth. But without alerting rules, errors go into a void. At 90k users, you need to know within minutes when something breaks.

| Configuration | What to Set | Why | Complexity |
|--------------|------------|-----|------------|
| Alert on error spike | >10 errors in 5 minutes | Launch-day errors will spike from 0 to potentially thousands. Need early warning. | Low (Sentry dashboard config) |
| Alert on new issue | Any new issue type | New error categories during launch = something we never tested. | Low (Sentry dashboard config) |
| Transaction grouping | Group by route (`/`, `/workouts`, `/macros`, `/settings`) | See which screens are slow. | Low (already partially in place via tracesSampleRate) |
| Release tracking | Tag deployments with version | Know which deploy broke what. | Low (add Sentry release in build) |
| Source maps | Upload source maps to Sentry | Minified stack traces are useless. Need readable errors. | Medium (Vite plugin config) |

**Current state:** Sentry is initialized with `tracesSampleRate: 0.1` and `replaysOnErrorSampleRate: 1.0`. Error filtering is good (ignores extensions, network errors, ResizeObserver). PII scrubbing is in place. What is MISSING: alerting rules, release tracking, and source maps.

**Confidence:** HIGH (verified from src/lib/sentry.ts analysis)

### 5. Core Web Vitals Baseline

**Why expected:** 90k users hitting the app simultaneously will expose performance issues immediately. Need a pre-launch baseline to compare against.

| Metric | Target | What It Measures | How to Measure |
|--------|--------|-----------------|----------------|
| LCP (Largest Contentful Paint) | < 2.5s | How fast the main content loads | web-vitals library -> Plausible custom event |
| INP (Interaction to Next Paint) | < 200ms | How responsive interactions feel | web-vitals library -> Plausible custom event |
| CLS (Cumulative Layout Shift) | < 0.1 | Visual stability during load | web-vitals library -> Plausible custom event |
| TTFB (Time to First Byte) | < 800ms | Server/CDN response time | web-vitals library -> Plausible custom event |
| FCP (First Contentful Paint) | < 1.8s | Time to first visual | web-vitals library -> Plausible custom event |

**Implementation approach:** Use `web-vitals` npm package (3KB gzipped) to measure CWV in the browser, then report them as Plausible custom events with the metric value as a property. This avoids adding another analytics service. Sentry's performance monitoring (already at 10% sampling) also captures these.

**Confidence:** HIGH (web-vitals library is maintained by Google Chrome team, standard approach documented at web.dev/articles/vitals)

---

## Differentiators

Features that would give competitive advantage and deeper insight, but are not strictly required for launch safety.

### 1. Session Replay on Errors (Already Configured)

**Value proposition:** When a user hits an error, see exactly what they were doing. Sentry is already configured with `replaysOnErrorSampleRate: 1.0` which records 100% of sessions that encounter errors. This is a powerful debugging tool that most apps at this stage do not have.

| Feature | Status | What to Do | Complexity |
|---------|--------|------------|------------|
| Error replays | Configured, needs verification | Verify replay captures are working in production before launch. Trigger a test error. | Low |
| Session context | Partially configured | setUser() is called after sign-in. Verify breadcrumbs are being added for key actions. | Low |
| Custom breadcrumbs | Not implemented | Add addBreadcrumb() calls at key state transitions: onboarding complete, workout start/end, check-in, sync events. | Medium |

**Confidence:** HIGH (verified from sentry.ts, replay is already configured)

### 2. Cohort Analysis via Plausible Properties

**Value proposition:** Track whether Day-1 signups behave differently from Day-7 signups. Whether 3-day/week users retain better than 5-day/week users.

| Property | Event to Attach To | Insight |
|----------|--------------------|---------|
| `training_days` | Already on `Onboarding Completed` | Do 3-day users retain better than 5-day? |
| `fitness_level` | Add to `Onboarding Completed` | Do beginners drop off faster? |
| `goal` | Add to `Onboarding Completed` | Do "cut" users engage more with macros? |
| `days_since_signup` | Add to `Check-In Completed` | Does check-in rate decay over time? |
| `current_streak` | Already on `Check-In Completed` | At what streak length do people stop? |

**Plausible limitation:** Plausible is privacy-first and does not track individual users or cohorts in the traditional sense. Properties are aggregate-only. For true cohort analysis, you would need Mixpanel or PostHog. However, properties on events give enough signal for launch decisions.

**Confidence:** MEDIUM (Plausible properties work as documented, but cohort-level analysis is limited vs. dedicated product analytics)

### 3. Uptime Monitoring

**Value proposition:** Know when the app, Supabase, or the USDA food API goes down before users tell you.

| What to Monitor | Tool | Threshold |
|----------------|------|-----------|
| App URL (trained.fitness) | Free uptime monitor (e.g., Uptime Robot, Better Stack) | Check every 5 min, alert on 2 consecutive failures |
| Supabase API | Monitor auth endpoint from Sentry or external | Alert if auth calls fail > 5% in 5 min |
| USDA FoodData API | Existing 429 cooldown in foodApi.ts handles this partially | Alert if > 50% of food searches fail |

**Confidence:** MEDIUM (standard practice, no codebase-specific verification needed)

### 4. Lighthouse CI Pre-Deploy Gate

**Value proposition:** Run Lighthouse performance audit before every deploy. Catch regressions before users see them.

| Metric | Budget | Reasoning |
|--------|--------|-----------|
| Performance score | >= 90 | PWA should be fast |
| Accessibility score | >= 90 | WCAG AA already targeted |
| Best Practices score | >= 90 | Standard baseline |
| PWA score | 100 | Must pass all PWA criteria |

**Confidence:** MEDIUM (standard approach, requires CI pipeline setup which may not exist yet)

---

## Anti-Features

Things to deliberately NOT build. Common mistakes when adding testing and analytics to an existing app.

### 1. Do NOT Add a Full Product Analytics Suite (Mixpanel, Amplitude, PostHog)

**Why avoid:** Plausible is already integrated with 22 events. Adding a second analytics tool means: (a) doubled implementation effort for every new event, (b) confusion about which dashboard is "truth," (c) cookie consent requirements (Plausible is cookie-free), (d) user privacy concerns. Plausible's custom events + funnels + properties cover 90% of launch needs.

**What to do instead:** Maximize Plausible. Define funnels, add missing events (8 gaps identified above), use properties for segmentation. Revisit only if Plausible's aggregate-only model proves insufficient after 30 days of real data.

### 2. Do NOT Test Implementation Details

**Why avoid:** E2E tests should verify user-visible behavior, not internal state. Testing "Zustand store has workoutLogs.length === 1" is a unit test concern. E2E tests should verify "the Workout Completed screen shows +100 XP."

**What to do instead:** Use Playwright's role-based locators (`getByRole`, `getByText`, `getByLabel`). Assert on visible UI state, not DOM structure or store internals.

### 3. Do NOT Write E2E Tests for Every Screen and Edge Case

**Why avoid:** Diminishing returns. 7-10 critical journey tests catch 90% of launch-blocking bugs. Writing 50+ tests for every button and edge case takes weeks and creates a brittle test suite that breaks on every UI change.

**What to do instead:** Cover the 7 critical journeys (listed in Table Stakes #1). Add tests for specific bugs as they appear. Keep total E2E test count under 15-20 for this phase.

### 4. Do NOT Build a Custom Analytics Dashboard

**Why avoid:** Plausible already provides a dashboard. Building a custom internal dashboard is a multi-week effort that delays launch for no user-facing value.

**What to do instead:** Use Plausible's built-in dashboard, funnels, and goal conversions. Export data via Plausible API if needed for deeper analysis later.

### 5. Do NOT Add Visual Regression Testing

**Why avoid:** The app just went through a major visual design refresh (shadcn/ui migration). Visual regression tests are valuable for stable UIs, but the design is still settling. Every minor CSS tweak will fail screenshot comparisons, creating noise.

**What to do instead:** Revisit visual regression testing (e.g., Playwright screenshots + Percy) after 2-3 months of design stability.

### 6. Do NOT Over-Instrument Performance Monitoring

**Why avoid:** Adding performance marks, measures, and custom spans to every function creates noise and overhead. The app is a PWA reading from localStorage -- it is inherently fast. Monitor the 5 Core Web Vitals and Sentry's existing performance traces.

**What to do instead:** web-vitals library for 5 metrics, Sentry traces at 10% sampling. That is sufficient. Add targeted performance monitoring only if a specific bottleneck is identified post-launch.

---

## Feature Dependencies

```
Existing Plausible (22 events)
    |
    +--> Add 8 missing events (Onboarding steps, abandonment, etc.)
    |       |
    |       +--> Define Plausible funnels (requires events as goals)
    |
Existing Sentry (8 catch blocks)
    |
    +--> Configure alerting rules (dashboard only, no code)
    |
    +--> Upload source maps (build config)
    |
    +--> Add custom breadcrumbs (code changes)
    |
No existing E2E tests
    |
    +--> Install and configure Playwright
    |       |
    |       +--> Auth mocking strategy (Supabase)
    |       |       |
    |       |       +--> Write critical journey tests
    |       |
    |       +--> localStorage seeding for Zustand state
    |
web-vitals (new dependency)
    |
    +--> Report CWV to Plausible as custom events
```

**Key dependency chain:** Plausible events must exist before funnels can be defined. Playwright auth strategy must be solved before journey tests can be written.

---

## MVP Recommendation

For pre-launch (this milestone), prioritize in this order:

### Phase 1: Analytics Gaps (1 day)
1. Add 8 missing Plausible events (low effort, high value)
2. Define 4 Plausible funnels in dashboard
3. Add `web-vitals` reporting to Plausible
4. Add onboarding properties (`fitness_level`, `goal`)

**Rationale:** Zero risk, immediate value. Events start collecting data the moment they deploy. Funnels need data to analyze, so the sooner they are live, the sooner you have launch-day funnel data.

### Phase 2: E2E Testing (2-3 days)
5. Install Playwright, configure for the project
6. Build auth mocking / localStorage seeding fixtures
7. Write 7-10 critical journey tests
8. Verify tests pass in CI (or locally if no CI)

**Rationale:** Higher effort but prevents launch-day embarrassment. The access gate -> auth -> onboarding -> first workout journey is ~1200 lines of code across 4 screens with complex state interactions. Manual testing cannot cover this reliably.

### Phase 3: Monitoring Hardening (0.5 day)
9. Configure Sentry alerts (error spike, new issue)
10. Add Sentry release tracking to builds
11. Upload source maps
12. Add custom breadcrumbs at key state transitions

**Rationale:** Low effort, operational safety net. Without alerts, Sentry is a database nobody checks.

### Defer to Post-Launch
- Uptime monitoring (nice to have, not blocking)
- Lighthouse CI gate (requires CI pipeline)
- Visual regression testing (design still settling)
- Cohort analysis beyond Plausible properties (wait for data)
- Additional E2E tests beyond critical 7-10 (add as bugs appear)

---

## Sources

### HIGH Confidence
- Codebase analysis: `src/lib/analytics.ts` (22 existing Plausible events)
- Codebase analysis: `src/lib/sentry.ts` (existing Sentry configuration)
- Codebase analysis: `src/App.tsx` (routing and auth flow)
- Codebase analysis: `src/screens/Onboarding.tsx` (10-step wizard)
- Codebase analysis: `src/screens/Workouts.tsx` (workout logging flow)
- Codebase analysis: `src/screens/CheckInModal.tsx` (check-in flow)
- Codebase analysis: `src/screens/XPClaimModal.tsx` (XP claim flow)
- [Plausible Funnel Analysis Docs](https://plausible.io/docs/funnel-analysis)
- [Plausible Custom Events Docs](https://plausible.io/docs/custom-event-goals)
- [Plausible Custom Properties Docs](https://plausible.io/docs/custom-props/for-custom-events)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Google web-vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Web Vitals Metrics (web.dev)](https://web.dev/articles/vitals)

### MEDIUM Confidence
- [Playwright localStorage Testing (BrowserStack)](https://www.browserstack.com/guide/playwright-local-storage)
- [Offline Testing with Playwright (The Green Report)](https://www.thegreenreport.blog/articles/offline-but-not-broken-testing-cached-data-with-playwright/offline-but-not-broken-testing-cached-data-with-playwright.html)
- [Core Web Vitals Metrics 2026 (NitroPack)](https://nitropack.io/blog/most-important-core-web-vitals-metrics/)
- [PWA Monitoring Best Practices (Datadog)](https://www.datadoghq.com/blog/progressive-web-application-monitoring/)
- [Fitness App Retention Benchmarks (Enable3)](https://enable3.io/blog/app-retention-benchmarks-2025)
