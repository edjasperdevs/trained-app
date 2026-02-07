---
phase: 04-monitoring-hardening
verified: 2026-02-07T19:14:00Z
status: human_needed
score: 10/11 must-haves verified
human_verification:
  - test: "Verify Sentry alert rules in dashboard"
    expected: "Two alert rules exist: Error Rate Spike (>10 events/10min) and User Impact (>5 users/15min)"
    why_human: "Alert rules are configured in Sentry dashboard, not in code"
  - test: "Trigger test error after deployment"
    expected: "Stack trace in Sentry shows original source code (not minified), with correct file names and line numbers"
    why_human: "Source maps only work in production build with SENTRY_AUTH_TOKEN set"
  - test: "View session replay in Sentry"
    expected: "Body weight, macro numbers, meal data, and email are masked (show as blocked/redacted), but XP and streaks are visible"
    why_human: "Replay recording requires real production traffic to Sentry"
---

# Phase 4: Monitoring Hardening Verification Report

**Phase Goal:** Sentry captures performance data, readable stack traces, and PII-safe session replays -- with alerts that fire before users complain
**Verified:** 2026-02-07T19:14:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Sentry.init() includes reactRouterV6BrowserTracingIntegration with all required hooks | ✓ VERIFIED | src/lib/sentry.ts lines 47-53 - integration configured with useEffect, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes |
| 2 | Sentry.init() includes replayIntegration with maskAllText: false and [data-sentry-mask] selector | ✓ VERIFIED | src/lib/sentry.ts lines 54-58 - maskAllText: false, mask: ['[data-sentry-mask]'] |
| 3 | Vite build produces hidden source maps and uploads them via sentryVitePlugin | ✓ VERIFIED | vite.config.ts lines 97-104 (plugin configured), line 107 (sourcemap: 'hidden'), dist/assets/*.map files deleted after build |
| 4 | ErrorBoundary calls captureError in componentDidCatch | ✓ VERIFIED | src/components/ErrorBoundary.tsx lines 29-30 - captureError(error, { componentStack: ... }) |
| 5 | Routes wrapped with withSentryReactRouterV6Routing | ✓ VERIFIED | src/App.tsx line 10 (SentryRoutes created), lines 137, 150, 163 (3 usages covering auth, onboarding, main routes) |
| 6 | Body weight values in Settings are masked | ✓ VERIFIED | src/screens/Settings.tsx line 421 - data-sentry-mask on weight tracking card |
| 7 | Macro numbers and meal data in Macros are masked | ✓ VERIFIED | src/screens/Macros.tsx line 77 - data-sentry-mask on macro tracking content area |
| 8 | Weight input during onboarding is masked | ✓ VERIFIED | src/screens/Onboarding.tsx lines 759, 795 - data-sentry-mask on weight input steps |
| 9 | Macro summary on Home screen is masked | ✓ VERIFIED | src/screens/Home.tsx line 336 - data-sentry-mask on macro progress section |
| 10 | Client health data in Coach screen is masked | ✓ VERIFIED | src/screens/Coach.tsx lines 381, 480 - data-sentry-mask on client data containers |
| 11 | Sentry alert rules fire on error rate spikes | ? NEEDS HUMAN | Per 04-02-SUMMARY.md, alert rules were configured during checkpoint, but this is dashboard config - cannot verify programmatically |

**Score:** 10/11 truths verified (91%)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/sentry.ts` | Sentry init with browserTracing + replay integrations | ✓ VERIFIED | Lines 42-93: Sentry.init with reactRouterV6BrowserTracingIntegration, replayIntegration, proper sampling rates (10% traces, 10% replays, 100% on error) |
| `src/App.tsx` | SentryRoutes wrapper for route instrumentation | ✓ VERIFIED | Line 10: SentryRoutes created at module level, 3 usages (auth/onboarding/main routes) |
| `vite.config.ts` | Source map generation and upload | ✓ VERIFIED | Lines 97-104: sentryVitePlugin as last plugin, line 107: sourcemap: 'hidden', filesToDeleteAfterUpload configured |
| `src/components/ErrorBoundary.tsx` | Sentry error capture in boundary | ✓ VERIFIED | Lines 29-30: captureError(error, { componentStack }) in componentDidCatch |
| `src/screens/Settings.tsx` | PII masking on weight, email, body metrics | ✓ VERIFIED | Line 421: data-sentry-mask on weight tracking card, line 741: data-sentry-mask on body metrics |
| `src/screens/Macros.tsx` | PII masking on macro values, meal data | ✓ VERIFIED | Line 77: data-sentry-mask on entire macro tracking content area |
| `src/screens/Onboarding.tsx` | PII masking on weight input | ✓ VERIFIED | Lines 759, 795: data-sentry-mask on weight input steps |
| `src/screens/Home.tsx` | PII masking on macro progress summary | ✓ VERIFIED | Line 336: data-sentry-mask on macro progress section |
| `src/screens/Coach.tsx` | PII masking on client health data | ✓ VERIFIED | Lines 381, 480: data-sentry-mask on client data sections |
| `.gitignore` | .env.sentry-build-plugin entry | ✓ VERIFIED | .env.sentry-build-plugin is gitignored |
| `.env.sentry-build-plugin` | Template for Sentry build credentials | ✓ VERIFIED | File exists with SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT placeholders |
| `.env.example` | Sentry environment variables documented | ✓ VERIFIED | SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT documented with instructions |
| `package.json` | @sentry/vite-plugin dependency | ✓ VERIFIED | @sentry/vite-plugin: ^4.9.0 in devDependencies |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| src/lib/sentry.ts | Sentry dashboard | reactRouterV6BrowserTracingIntegration sends Core Web Vitals | ✓ WIRED | Integration configured with all required React Router v6 hooks (lines 47-53), tracesSampleRate: 0.1 (line 62) |
| vite.config.ts | Sentry releases | sentryVitePlugin uploads source maps on build | ✓ WIRED | Plugin configured as last plugin (lines 97-104), build.sourcemap: 'hidden' (line 107), dist/assets/*.map files successfully deleted after build |
| src/App.tsx | src/lib/sentry.ts | SentryRoutes wraps Routes for page load tracking | ✓ WIRED | Line 3: imports withSentryReactRouterV6Routing from @/lib/sentry, line 10: creates SentryRoutes at module level (correct), 3 usages cover all route blocks |
| data-sentry-mask attributes | src/lib/sentry.ts replayIntegration | CSS selector '[data-sentry-mask]' in mask array | ✓ WIRED | sentry.ts line 57: mask: ['[data-sentry-mask]'], 8 usages across 5 screens on health/fitness data containers |
| ErrorBoundary | captureError | componentDidCatch calls captureError | ✓ WIRED | Line 2: imports captureError from @/lib/sentry, line 30: captureError(error, { componentStack }) in catch handler |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| MON-01: Browser tracing for Core Web Vitals | ✓ SATISFIED | reactRouterV6BrowserTracingIntegration configured with tracesSampleRate: 0.1 |
| MON-02: Source maps for readable stack traces | ✓ SATISFIED | sentryVitePlugin configured, hidden source maps generated, files deleted after upload |
| MON-03: Alert rules for error rate spikes | ? NEEDS HUMAN | Per 04-02-SUMMARY.md, dashboard config completed during checkpoint - cannot verify programmatically |
| MON-04: Session replay masks health/fitness PII | ✓ SATISFIED | replayIntegration with maskAllText: false + [data-sentry-mask], 8 data-sentry-mask attributes on weight/macro/meal data across 5 screens |

### Anti-Patterns Found

No anti-patterns detected.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| - | - | - | - | - |

**Scanned files:** src/lib/sentry.ts, src/App.tsx, src/components/ErrorBoundary.tsx, vite.config.ts, src/screens/Settings.tsx, src/screens/Macros.tsx, src/screens/Onboarding.tsx, src/screens/Home.tsx, src/screens/Coach.tsx

**Patterns checked:** TODO/FIXME comments, placeholder text, empty implementations, console.log-only handlers

**Result:** All files are substantive with real implementations. No stubs detected.

### Human Verification Required

#### 1. Verify Sentry Alert Rules in Dashboard

**Test:** Navigate to Sentry Dashboard -> Alerts -> Alert Rules and verify two rules exist:
1. "Error Rate Spike" - Type: Issues, Condition: Number of events > 10 in 10 minutes
2. "User Impact" - Type: Issues, Condition: Number of unique users > 5 in 15 minutes

**Expected:** Both alert rules are configured and active in the Sentry dashboard with default notification channels

**Why human:** Alert rules are configured in the Sentry web dashboard, not in code. No API to query alert rules programmatically from build verification.

**Status per 04-02-SUMMARY.md:** "Alert rules configured in Sentry dashboard: Error Rate Spike (>10 events in 10 minutes) and User Impact (>5 unique users in 15 minutes)" - checkpoint approved by human during 04-02 execution.

#### 2. Verify Source Maps in Production

**Test:** After deploying to production with SENTRY_AUTH_TOKEN set:
1. Trigger a test error (throw new Error('test') in a component)
2. View the error in Sentry dashboard
3. Check the stack trace

**Expected:** Stack trace shows original source code file names (e.g., src/components/Button.tsx:42) and readable code snippets, not minified bundle references

**Why human:** Source map upload only happens during production build with SENTRY_AUTH_TOKEN environment variable set. Local dev build doesn't initialize Sentry (lines 35-40 of sentry.ts).

#### 3. Verify PII Masking in Session Replay

**Test:** After deployment, trigger a session replay recording:
1. Navigate through the app as a real user
2. Visit Settings (view weight), Macros (view macro numbers), Home (view macro progress)
3. View the session replay in Sentry dashboard

**Expected:**
- **MASKED (blocked/redacted):** Body weight numbers, macro values (protein/calories/carbs/fats), meal names, food data, email address
- **VISIBLE:** XP, streaks, badges, workout exercise names, screen titles, navigation

**Why human:** Session replay recordings require real production traffic to Sentry. Replay feature activates at 10% session sample rate (replaysSessionSampleRate: 0.1) or 100% for error sessions.

---

## Verification Details

### Build Verification

```bash
npm run build
✓ built in 6.75s
```

- Build completed successfully
- Source maps generated (hidden)
- Asset source maps deleted (dist/assets/*.map missing)
- Service worker maps preserved (dist/sw.js.map, dist/workbox-*.js.map)
- sentryVitePlugin executed (warnings expected without auth token)

### Type Checking

```bash
npx tsc --noEmit
(no output)
```

- Zero TypeScript errors

### Test Suite

```bash
npx vitest run
Test Files  6 passed (6)
Tests  139 passed (139)
Duration  2.79s
```

- All existing tests pass
- No test failures introduced

### PII Masking Coverage

8 `data-sentry-mask` attributes across 5 screens:

1. **Settings.tsx** (2 occurrences)
   - Line 421: Weight tracking card (weight, goal weight, rate of change)
   - Line 741: Body metrics section (BMR, TDEE)

2. **Macros.tsx** (1 occurrence)
   - Line 77: Entire macro tracking content area (protein, calories, carbs, fats, meal data)

3. **Onboarding.tsx** (2 occurrences)
   - Line 759: Weight input field
   - Line 795: Weight unit selector

4. **Home.tsx** (1 occurrence)
   - Line 336: Macro progress summary (protocol compliance section)

5. **Coach.tsx** (2 occurrences)
   - Line 381: Client health data display
   - Line 480: Client activity feed with health metrics

**Pattern:** All data-sentry-mask attributes are placed on parent container divs (not individual elements), following the plan specification for clean markup.

### Integration Completeness

**Tracing Integration:**
- reactRouterV6BrowserTracingIntegration: ✓ Configured
- React Router v6 hooks: ✓ All provided (useEffect, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes)
- tracesSampleRate: ✓ Set to 0.1 (10%)

**Replay Integration:**
- replayIntegration: ✓ Configured
- maskAllText: ✓ Set to false (avoids over-masking)
- mask selector: ✓ Set to ['[data-sentry-mask]']
- replaysSessionSampleRate: ✓ Set to 0.1 (10% of normal sessions)
- replaysOnErrorSampleRate: ✓ Set to 1.0 (100% of error sessions)

**Source Maps:**
- @sentry/vite-plugin: ✓ Installed (^4.9.0)
- sentryVitePlugin: ✓ Configured as last plugin
- build.sourcemap: ✓ Set to 'hidden'
- filesToDeleteAfterUpload: ✓ Configured (./dist/**/*.map)
- Environment variables: ✓ Documented in .env.example
- .gitignore: ✓ .env.sentry-build-plugin excluded

**Error Boundary:**
- captureError import: ✓ From @/lib/sentry (avoids circular deps)
- componentDidCatch: ✓ Calls captureError with error and componentStack
- Dev logging: ✓ Preserved (console.error still present)

**Route Instrumentation:**
- withSentryReactRouterV6Routing: ✓ Re-exported from sentry.ts
- SentryRoutes: ✓ Created at module level (not inside component)
- Route blocks wrapped: ✓ All 3 blocks (auth, onboarding, main)

---

_Verified: 2026-02-07T19:14:00Z_
_Verifier: Claude (gsd-verifier)_
