# Phase 4: Monitoring Hardening - Research

**Researched:** 2026-02-07
**Domain:** Sentry monitoring (performance tracing, source maps, alerting, session replay PII masking)
**Confidence:** HIGH

## Summary

The app already has `@sentry/react@10.38.0` installed and initialized with basic error capture (8 catch blocks + auth), error replay at 100%, and session replay at 0% for normal sessions. However, the current setup is missing four critical capabilities: (1) `browserTracingIntegration` is not activated, so no Core Web Vitals or page load performance data reaches Sentry; (2) source maps are not generated or uploaded, so all production stack traces show minified code; (3) no alert rules exist, so error spikes go unnoticed; (4) session replay records everything with default masking (all text masked), but has no fitness-PII-specific configuration.

All four requirements (MON-01 through MON-04) can be addressed in a single plan because they all modify `src/lib/sentry.ts`, `vite.config.ts`, and Sentry dashboard settings. The `@sentry/react` v10 SDK already exports all needed integrations (`browserTracingIntegration`, `reactRouterV6BrowserTracingIntegration`, `replayIntegration`). The only new dependency needed is `@sentry/vite-plugin` for source map upload.

**Primary recommendation:** Add `reactRouterV6BrowserTracingIntegration` + `replayIntegration` to `Sentry.init()`, install `@sentry/vite-plugin` for source map upload, configure alert rules in Sentry dashboard, and add `sentry-mask` CSS classes to PII-displaying elements.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@sentry/react` | 10.38.0 (installed) | Error tracking, performance, replay | Already in use; exports all needed integrations |
| `@sentry/vite-plugin` | ^4.6.2 (to install) | Source map upload during build | Official Sentry plugin for Vite; handles upload + deletion |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-router-dom` | ^6.22.3 (installed) | Provides hooks for Sentry Router integration | Already used; provides `useLocation`, `useNavigationType`, `createRoutesFromChildren`, `matchRoutes` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@sentry/vite-plugin` | `sentry-cli` manual upload | Plugin is simpler; CLI requires separate CI step |
| `reactRouterV6BrowserTracingIntegration` | Generic `browserTracingIntegration` | Router integration gives better page names instead of raw URLs |
| CSS class masking (`sentry-mask`) | `beforeAddRecordingEvent` scrubbing | CSS classes are declarative and simpler; scrubbing is for edge cases |

**Installation:**
```bash
npm install @sentry/vite-plugin --save-dev
```

## Architecture Patterns

### Current Sentry Setup (What Exists)
```
src/lib/sentry.ts          -- Sentry.init() with DSN, tracesSampleRate, replaysOnErrorSampleRate
                              captureError(), captureMessage(), setUser(), clearUser(), addBreadcrumb()
                              ErrorBoundary re-export
src/main.tsx               -- initSentry() called, Sentry.ErrorBoundary wraps app
src/App.tsx                -- Uses <Routes>/<Route> pattern (not createBrowserRouter)
vite.config.ts             -- No source map generation, no Sentry plugin
```

### Target Architecture (What to Build)
```
src/lib/sentry.ts          -- ADD: reactRouterV6BrowserTracingIntegration, replayIntegration with PII masking config
                              KEEP: existing captureError/captureMessage/setUser/clearUser
src/App.tsx                -- WRAP: <Routes> with Sentry.withSentryReactRouterV6Routing(Routes)
vite.config.ts             -- ADD: build.sourcemap: "hidden", sentryVitePlugin()
.env.sentry-build-plugin   -- NEW: SENTRY_AUTH_TOKEN (gitignored)
Vercel env vars            -- ADD: SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
Sentry dashboard           -- ADD: metric alert rules
PII-containing components  -- ADD: data-sentry-mask attributes on sensitive elements
```

### Pattern 1: React Router v6 Browser Tracing
**What:** Wrap Routes component with Sentry for automatic page load and navigation span creation
**When to use:** When using `<Routes>` pattern (not `createBrowserRouter`)
**Example:**
```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/react/features/react-router/v6
import React from 'react'
import * as Sentry from '@sentry/react'
import {
  Routes,
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom'

// In Sentry.init():
Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration({
      // PII masking config here
    }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
})

// In App.tsx:
const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes)
// Then use <SentryRoutes> instead of <Routes>
```

### Pattern 2: Source Map Upload with Vite Plugin
**What:** Generate hidden source maps, upload to Sentry, delete from output
**When to use:** Every production build
**Example:**
```typescript
// Source: https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  build: {
    sourcemap: 'hidden', // Generate maps but don't reference in bundles
  },
  plugins: [
    // ... other plugins ...
    // Sentry MUST be last plugin
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }),
  ],
})
```

### Pattern 3: Session Replay PII Masking
**What:** Use `data-sentry-mask` attribute on elements displaying health/fitness data
**When to use:** Any DOM element showing body weight, macros, meal data, body metrics
**Example:**
```tsx
// Elements displaying PII get data-sentry-mask attribute
<p data-sentry-mask className="font-digital font-bold">
  {formatWeight(profile?.weight || 0, units)}
</p>

// Or via CSS class
<div className="sentry-mask">
  P: {ing.protein}g · C: {ing.carbs}g · F: {ing.fats}g · {ing.calories} cal
</div>
```

### Anti-Patterns to Avoid
- **Don't use generic `browserTracingIntegration()`:** Use `reactRouterV6BrowserTracingIntegration` instead -- it gives meaningful page names (e.g., `/settings`) instead of raw URLs
- **Don't set `sourcemap: true`:** Use `sourcemap: "hidden"` to prevent source maps from being served to users
- **Don't hardcode auth tokens:** Use environment variables; `.env.sentry-build-plugin` for local, Vercel env vars for CI
- **Don't mask everything with `maskAllText: true` (already default):** This makes replays unreadable. Instead, set `maskAllText: false` and explicitly mask PII elements with `data-sentry-mask`
- **Don't put Sentry plugin before other plugins:** It must be the LAST plugin in the Vite config array

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Source map upload | CI script with sentry-cli | `@sentry/vite-plugin` | Plugin handles release association, artifact upload, and cleanup automatically |
| Performance tracing | Custom performance.mark/measure | `browserTracingIntegration` | Automatically captures LCP, CLS, INP, page loads, navigation |
| PII scrubbing in replay | `beforeAddRecordingEvent` regex | `data-sentry-mask` CSS attribute | Declarative, visible in code review, no risk of regex bugs |
| Alert configuration | Custom webhook monitoring | Sentry metric alerts | Built-in anomaly detection, escalation policies, integrations |

**Key insight:** Sentry SDK v10 already bundles everything needed -- no additional packages for replay, tracing, or Web Vitals. The only new dev dependency is `@sentry/vite-plugin` for build-time source map upload.

## Common Pitfalls

### Pitfall 1: Source Maps Served to Users
**What goes wrong:** Setting `sourcemap: true` in Vite makes `.map` files available in the deployed output, exposing source code.
**Why it happens:** Developers forget that Sentry only needs the maps during upload, not at runtime.
**How to avoid:** Use `sourcemap: "hidden"` and configure `filesToDeleteAfterUpload` in the Sentry Vite plugin.
**Warning signs:** `.map` files visible in browser DevTools network tab in production.

### Pitfall 2: Sentry Plugin Ordering
**What goes wrong:** Source maps are incomplete or missing when the Sentry plugin runs before other build plugins.
**Why it happens:** Other plugins (React, Tailwind) transform code after Sentry captures the map.
**How to avoid:** Place `sentryVitePlugin()` as the LAST entry in the `plugins` array.
**Warning signs:** Stack traces in Sentry show wrong line numbers even after maps are uploaded.

### Pitfall 3: Session Replay Over-Masking
**What goes wrong:** Default `maskAllText: true` makes replays completely unreadable (all text becomes `****`).
**Why it happens:** Sentry's privacy-first default masks ALL text content.
**How to avoid:** Set `maskAllText: false` and `blockAllMedia: false`, then explicitly add `data-sentry-mask` to PII elements. This gives readable replays while protecting sensitive data.
**Warning signs:** QA reviews replays and can't tell what screen the user was on.

### Pitfall 4: Missing SENTRY_AUTH_TOKEN in CI
**What goes wrong:** Build succeeds but source maps aren't uploaded; errors show minified traces.
**Why it happens:** Auth token not configured in Vercel environment variables.
**How to avoid:** Add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` to Vercel project settings immediately after generating the token.
**Warning signs:** Build logs show "Sentry: No auth token found, skipping source map upload."

### Pitfall 5: Router Integration Import Side Effects
**What goes wrong:** `Sentry.init()` must be called before React Router renders, but the router hooks (`useLocation`, etc.) can only be imported, not invoked, before the router exists.
**Why it happens:** Misunderstanding that `reactRouterV6BrowserTracingIntegration` takes the hook FUNCTIONS, not their return values.
**How to avoid:** Pass the hook functions as references (not invocations) to the integration config. They'll be called internally by Sentry when the router is active.
**Warning signs:** Runtime errors about hooks being called outside a Router context.

### Pitfall 6: Multiple Routes Components
**What goes wrong:** The app has multiple `<Routes>` blocks (for auth, onboarding, and main app), but only one can be wrapped with `SentryRoutes`.
**Why it happens:** Sentry's `withSentryReactRouterV6Routing` only wraps one `<Routes>` component.
**How to avoid:** Wrap ALL `<Routes>` usages in `App.tsx` with the Sentry-wrapped version. There are 4 instances: auth routes (line 134), onboarding routes (line 148), main routes (line 160), and dev routes within main routes. All must use `SentryRoutes`.
**Warning signs:** Navigation spans only appear for some pages, not all.

## Code Examples

### Complete Sentry.init() Configuration
```typescript
// Source: Sentry React docs + React Router v6 docs
import React from 'react'
import * as Sentry from '@sentry/react'
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  if (import.meta.env.DEV || !SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] Disabled in development mode')
    }
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,

    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration({
        maskAllText: false,    // Don't mask all text (makes replays unreadable)
        maskAllInputs: true,   // Mask form inputs by default
        blockAllMedia: false,  // Allow media to be visible
        // Additional custom selectors
        mask: ['.sentry-mask', '[data-sentry-mask]'],
      }),
    ],

    // Performance: 10% of transactions
    tracesSampleRate: 0.1,

    // Session Replay: only on errors
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // Filter noisy errors
    ignoreErrors: [
      /extensions\//i,
      /^chrome-extension:\/\//i,
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'ResizeObserver loop',
    ],

    // PII scrubbing for error events
    beforeSend(event) {
      if (event.message) {
        event.message = event.message.replace(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
          '[EMAIL]'
        )
      }
      return event
    },
  })
}
```

### Vite Config with Source Maps
```typescript
// Source: https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-sentry': ['@sentry/react'],
        }
      }
    }
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({ /* existing config */ }),
    // Sentry MUST be last
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }),
  ],
})
```

### Wrapping Routes for Tracing
```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/react/features/react-router/v6
import * as Sentry from '@sentry/react'
import { Routes } from 'react-router-dom'

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes)

// In App.tsx, replace ALL <Routes> with <SentryRoutes>
```

### PII Masking via data-sentry-mask
```tsx
{/* Body weight display - Settings.tsx */}
<p data-sentry-mask className="font-digital font-bold text-xl text-foreground">
  {formatWeight(profile?.weight || 0, units)}
</p>

{/* Macro numbers - Macros.tsx */}
<span data-sentry-mask className="text-2xl font-bold font-digital">{current}</span>

{/* Meal macro breakdown */}
<p data-sentry-mask className="text-xs text-muted-foreground">
  P: {ing.protein}g · C: {ing.carbs}g · F: {ing.fats}g · {ing.calories} cal
</p>

{/* Weight input placeholder - reveals current weight */}
<Input data-sentry-mask type="number" placeholder={String(todayWeight?.weight)} />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `BrowserTracing` integration class | `browserTracingIntegration()` function | Sentry SDK v8 | Functional API; old class removed in v10 |
| `new Replay()` integration class | `replayIntegration()` function | Sentry SDK v8 | Same -- functional API |
| FID (First Input Delay) | INP (Interaction to Next Paint) | March 2024 (Google) | Sentry v8+ captures INP by default |
| `sentry-cli upload-sourcemaps` | `@sentry/vite-plugin` | 2023 | Plugin handles release + upload in one step |
| `Sentry.BrowserTracing` + manual router | `reactRouterV6BrowserTracingIntegration` | Sentry SDK v10 | Framework-specific integration with cleaner API |
| `blockSelector`/`maskSelector` strings | `block`/`mask` arrays of selectors | Sentry SDK v8 | Array-based config, more flexible |

**Deprecated/outdated:**
- `new BrowserTracing()` class: Replaced by `browserTracingIntegration()` in SDK v8, removed in v10
- `new Replay()` class: Replaced by `replayIntegration()` in SDK v8, removed in v10
- `enableInp: true` option: No longer needed -- INP is captured by default in v10

## Existing Codebase Findings

### Current Sentry Integration Points
- **`src/lib/sentry.ts`**: `Sentry.init()` with DSN, `tracesSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`, `replaysSessionSampleRate: 0`
- **`src/main.tsx`**: Calls `initSentry()`, wraps app in `Sentry.ErrorBoundary`
- **`src/stores/authStore.ts`**: 5 `captureError()` calls + `sentrySetUser()`/`sentryClearUser()`
- **`src/lib/sync.ts`**: 2 `captureError()` calls (scheduleSync, flushPendingSync)
- **`src/lib/foodApi.ts`**: 1 `captureError()` call (searchFoods.USDA)
- **`src/components/ErrorBoundary.tsx`**: Custom error boundary (NOT using Sentry -- has TODO comment to connect Sentry)

### Missing Integrations
- No `browserTracingIntegration` or `reactRouterV6BrowserTracingIntegration`
- No `replayIntegration()` in integrations array (sample rates set but integration not added)
- No source map generation (`sourcemap` not set in `vite.config.ts`)
- No `@sentry/vite-plugin` installed
- No `SENTRY_AUTH_TOKEN` configured anywhere
- No `release` property set in `Sentry.init()`

### PII-Containing Screens (Need data-sentry-mask)
1. **Settings.tsx**: Body weight (current, goal, weight input, weight chart, rate of change), email display
2. **Macros.tsx**: Protein/calories/carbs/fats progress numbers, macro targets, meal logged food names/macros
3. **MealBuilder.tsx**: Ingredient names, macros per ingredient, meal totals
4. **FoodSearch.tsx**: Food search results with nutritional data
5. **CheckInModal.tsx**: Protein/calorie target hit status (boolean only -- low PII risk)
6. **Onboarding.tsx**: Weight input during onboarding
7. **Home.tsx**: Macro progress summary, weight references
8. **WeeklySummary.tsx**: Weekly macro/weight summary data
9. **ClientMacroAdherence.tsx** / **ClientActivityFeed.tsx**: Coach view of client data

### Sentry DSN Details (from .env.vercel)
- **DSN**: `https://08cf31ab1415ab713ef12c1bfd38bd83@o4510830383923200.ingest.us.sentry.io/4510830389821440`
- **Org ID**: `o4510830383923200`
- **Project ID**: `4510830389821440`
- Need to look up org slug and project slug in Sentry dashboard for the Vite plugin config

### Build & Deploy Context
- **Build tool**: Vite 5.4.2
- **Deploy**: Vercel (`vercel.json` present with SPA rewrites)
- **Chunks**: Manual chunks for react, supabase, sentry (in `vite.config.ts`)
- **Source maps**: NOT generated currently (`sourcemap` not set -- defaults to `false`)

## Key Implementation Decisions

### 1. maskAllText: false (not default true)
The default `maskAllText: true` masks ALL text in replays, making them useless for debugging. Since this is a fitness app (not financial/medical), the approach should be:
- Set `maskAllText: false` for readable replays
- Set `maskAllInputs: true` to mask form inputs by default
- Explicitly add `data-sentry-mask` to elements showing health/fitness PII
- This gives the best balance: replays are useful for debugging while PII is protected

### 2. Which Elements Are PII
Health/fitness PII that must be masked in session replay:
- **Body weight** (current weight, goal weight, weight history, rate of change)
- **Macro numbers** (protein grams, calorie counts, carb grams, fat grams)
- **Meal data** (food names, ingredient lists, macro breakdowns)
- **Body metrics** (waist, chest, etc. -- if displayed)
- **Email addresses** (in Settings account section)

NOT PII (don't mask):
- XP numbers, streak counts, badge names
- Workout names (Push, Pull, Legs -- not personal)
- Navigation labels, button text, headings
- Avatar state, evolution stage

### 3. Alert Rules Configuration
Recommended alert rules for post-launch:
1. **Error rate spike**: "Number of Errors" > 10 in 10 minutes, notify via email
2. **User impact**: "Users Experiencing Errors" > 5 in 15 minutes, notify via email
3. **Performance degradation**: LCP p75 > 4s in 1 hour (once performance baseline exists)

These are configured in Sentry UI (Settings > Alerts > Create Alert), not in code.

### 4. Auth Token Management
- Generate org-level auth token in Sentry: Settings > Developer Settings > Internal Integrations
- For local builds: `.env.sentry-build-plugin` file (gitignored)
- For Vercel: Add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` as environment variables
- The Sentry Vercel integration can auto-inject these if installed via Vercel marketplace

## Open Questions

1. **Sentry org/project slugs**
   - What we know: DSN provides org ID `o4510830383923200` and project ID `4510830389821440`
   - What's unclear: The Vite plugin requires the org SLUG and project SLUG (human-readable names), not numeric IDs
   - Recommendation: Executor will need to check Sentry dashboard (Settings > Organization > General) for the slug values, or use the Sentry Vercel integration which auto-populates these

2. **Auth token generation**
   - What we know: Sentry requires an org auth token with Project:Read & Write and Release:Admin scopes
   - What's unclear: Whether the user has already created an auth token
   - Recommendation: Include token generation steps in the plan; skip if already exists

3. **Custom ErrorBoundary integration**
   - What we know: `src/components/ErrorBoundary.tsx` exists with a TODO to connect Sentry, but `main.tsx` already uses `Sentry.ErrorBoundary`
   - What's unclear: Whether the custom ErrorBoundary is used elsewhere and should be connected
   - Recommendation: Update the custom ErrorBoundary to call `Sentry.captureException()` in `componentDidCatch` -- it's a one-line change and ensures errors caught by both boundaries reach Sentry

## Sources

### Primary (HIGH confidence)
- `@sentry/react@10.38.0` installed package -- verified available exports: `browserTracingIntegration`, `reactRouterV6BrowserTracingIntegration`, `replayIntegration`, `replayCanvasIntegration`, `withSentryReactRouterV6Routing`
- [Sentry Vite Source Maps docs](https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/) -- complete plugin setup
- [Sentry React Router v6 docs](https://docs.sentry.io/platforms/javascript/guides/react/features/react-router/v6) -- complete integration setup
- [Sentry Session Replay Privacy docs](https://docs.sentry.io/platforms/javascript/guides/react/session-replay/privacy/) -- masking/blocking configuration
- [Sentry Metric Alert Config docs](https://docs.sentry.io/product/alerts/create-alerts/metric-alert-config/) -- alert threshold options

### Secondary (MEDIUM confidence)
- [Sentry Vercel Integration docs](https://docs.sentry.io/organization/integrations/deployment/vercel/) -- confirmed Vite apps need explicit plugin setup
- [@sentry/vite-plugin npm](https://www.npmjs.com/package/@sentry/vite-plugin) -- latest version ~4.6.2

### Tertiary (LOW confidence)
- None -- all critical findings verified against official docs or installed packages

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- verified all integrations exist in installed `@sentry/react@10.38.0` package
- Architecture: HIGH -- verified routing pattern (`<Routes>` component), confirmed `withSentryReactRouterV6Routing` is the correct wrapper
- Pitfalls: HIGH -- multiple source maps, plugin ordering, and masking pitfalls confirmed in official docs
- PII identification: HIGH -- manually reviewed all screens displaying health/fitness data

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (Sentry SDK stable, 30-day validity)
