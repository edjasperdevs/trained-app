# Phase 2: Performance Foundation - Research

**Researched:** 2026-02-04
**Domain:** PWA performance optimization (Vite + React + Workbox)
**Confidence:** HIGH

## Summary

Research focused on what is needed to achieve the five success criteria for this phase: lazy-loaded routes, service worker prompt mode with update banner, Lighthouse Performance >90, Lighthouse Accessibility >90, and Supabase API caching with NetworkFirst.

**Critical finding: Most of the "implementation" work is already done.** The codebase already has lazy-loaded routes (React.lazy), prompt-mode service worker with an UpdatePrompt component, and manual vendor chunk splitting. The remaining work is primarily: (1) adding Supabase runtime caching, (2) fixing specific Lighthouse audit failures (fonts, accessibility, meta viewport), and (3) verifying and documenting that existing implementations meet the success criteria.

**Primary recommendation:** Run a Lighthouse audit first to identify exact failing audits, then fix the specific issues rather than doing broad optimization work. The heaviest lift is likely Lighthouse Accessibility (color contrast, missing form labels, viewport meta restrictions) rather than Performance.

## Current State Assessment

### What Already Exists (verified from codebase)

| Requirement | Current State | Gap |
|-------------|--------------|-----|
| PERF-01: Route lazy loading | **DONE.** All 7 route screens use `React.lazy()` with dynamic imports in `App.tsx` | Barrel import of `AccessGate` and `Auth` from `@/screens` index (eagerly loaded, but these are gate screens - they MUST be eager) |
| PERF-01: Vendor chunk splitting | **DONE.** Four manual chunks: vendor-react, vendor-motion, vendor-supabase, vendor-sentry | No gap - chunks are well-sized |
| PERF-02: Prompt mode SW | **DONE.** `registerType: 'prompt'` in vite.config.ts | No gap |
| PERF-02: Update banner | **DONE.** `UpdatePrompt.tsx` uses `useRegisterSW`, shows "A new version is available" with Update button | No gap |
| PERF-03: Lighthouse Performance | **UNKNOWN.** No baseline measurement exists | Must run audit |
| PERF-03: Lighthouse Accessibility | **LIKELY FAILING.** `user-scalable=no` in viewport meta, potential contrast issues (#888 on #0A0A0A = 10.2:1 ok, but #8B1A1A on #0A0A0A = 2.7:1 FAIL for text), some form labels use `<label>` without `htmlFor` | Multiple fixes needed |
| PERF-04: Supabase caching | **NOT DONE.** Runtime caching exists for USDA and OpenFoodFacts APIs only. No Supabase API caching | Must add NetworkFirst rule |

### Build Output Analysis

Current production build (verified 2026-02-04):

```
Total JS: ~810 KB (uncompressed), ~235 KB gzipped
Precache: 49 entries, 962 KB

Key chunks:
- vendor-react:    164 KB (53 KB gz)  - React, ReactDOM, React Router
- vendor-supabase: 170 KB (45 KB gz)  - Supabase client
- vendor-motion:   115 KB (38 KB gz)  - Framer Motion
- vendor-sentry:    83 KB (28 KB gz)  - Sentry
- index (app):     105 KB (31 KB gz)  - App shell, stores, utilities
- Home:             48 KB (12 KB gz)  - Largest route chunk
- Onboarding:       33 KB (8 KB gz)
- Macros:           32 KB (8 KB gz)
- Workouts:         29 KB (7 KB gz)
- Settings:         28 KB (8 KB gz)
```

The lazy loading IS working -- route chunks are separate files loaded on demand.

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| vite-plugin-pwa | ^0.19.8 | PWA generation, service worker, manifest | Installed, configured |
| workbox-window | ^7.0.0 | SW registration, update detection | Installed, used by UpdatePrompt |
| react (lazy/Suspense) | ^18.3.1 | Code splitting | Used in App.tsx |

### Supporting (no new dependencies needed)

This phase requires **zero new npm packages**. All tooling is already present:
- Workbox (bundled with vite-plugin-pwa) handles runtime caching
- React.lazy/Suspense handles code splitting
- Vite's rollupOptions handles chunk splitting

### Alternatives Considered

| Instead of | Could Use | Why NOT |
|------------|-----------|---------|
| React.lazy | @loadable/components | React.lazy is already working, @loadable adds SSR features not needed |
| Workbox generateSW | injectManifest | generateSW is simpler for declarative config, no custom SW logic needed |
| Google Fonts CDN | Self-hosted fonts | Would require font file management; `font-display: swap` on CDN is sufficient |

**Installation:** None required. All dependencies are present.

## Architecture Patterns

### Pattern 1: Workbox Runtime Caching for Supabase API

**What:** Add a NetworkFirst runtime caching rule for Supabase REST API calls
**When to use:** For all Supabase API calls (profiles, workout_logs, etc.)
**Why NetworkFirst:** Supabase data changes frequently (user writes), so network should be preferred. Cache provides offline fallback.

```typescript
// Source: Workbox official docs (https://developer.chrome.com/docs/workbox/modules/workbox-strategies)
// In vite.config.ts workbox.runtimeCaching array:
{
  // Cache Supabase REST API calls
  urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'supabase-api-cache',
    networkTimeoutSeconds: 3,
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 // 24 hours
    },
    cacheableResponse: {
      statuses: [0, 200]
    }
  }
}
```

**Key detail:** Supabase REST API URL pattern is `https://<project-id>.supabase.co/rest/v1/<table>`. The regex `.*\.supabase\.co\/rest\/v1\/.*` matches any Supabase project.

**What NOT to cache:** Auth endpoints (`/auth/v1/`) should NOT be cached -- auth tokens are sensitive and time-bound. Only cache `/rest/v1/` (data reads).

### Pattern 2: Google Fonts with font-display: swap

**What:** The current Google Fonts link already includes `display=swap`, which is correct. But fonts are render-blocking because there are 3 font families (Oswald, Inter, JetBrains Mono) loaded via a single `<link>` tag.

**Optimization opportunity:**
```html
<!-- Already present (good): -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Current (already has display=swap via &display=swap): -->
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

The `display=swap` parameter is already present in the URL. The preconnect tags are present. The main potential improvement is reducing font weights (currently loading 4-5 weights per family = potentially 13 font files).

### Pattern 3: Accessibility Meta Viewport Fix

**What:** Remove `user-scalable=no` and `maximum-scale=1.0` from viewport meta tag
**Why:** Lighthouse Accessibility audit "Zooming and scaling is not disabled" fails. WCAG 2.1 requires users to be able to zoom to 200%.

```html
<!-- Current (FAILS accessibility): -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

<!-- Fixed (PASSES accessibility): -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**Risk:** Some PWAs disable zoom to prevent double-tap zoom interfering with UI. With `touch-action: manipulation` on interactive elements (already handled by Tailwind's `-webkit-tap-highlight-color: transparent`), this is not needed.

### Anti-Patterns to Avoid

- **Over-caching Supabase auth endpoints:** Never cache `/auth/v1/` -- tokens expire and caching them causes auth failures
- **CacheFirst for API data:** USDA food data (static reference) is fine as CacheFirst, but user data (Supabase) must be NetworkFirst or StaleWhileRevalidate
- **Removing lazy loading for "simplicity":** The current lazy loading is working correctly and producing separate chunks -- don't consolidate
- **Self-hosting Google Fonts for "performance":** The CDN is faster due to cross-site caching; adding `display=swap` is sufficient

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker caching | Custom fetch handler | Workbox via vite-plugin-pwa `runtimeCaching` config | Workbox handles cache versioning, expiration, offline fallback |
| Route code splitting | Manual `import()` with state management | React.lazy + Suspense (already done) | Built-in, handles loading states, works with React error boundaries |
| Update notification | Custom polling for new versions | `useRegisterSW` from `virtual:pwa-register/react` (already done) | Handles SW lifecycle events correctly |
| Font loading optimization | JS font loader or self-hosting | Google Fonts with `display=swap` + preconnect (already done) | CDN handles subsetting, WOFF2 encoding, caching |

**Key insight:** This phase is primarily about configuration and verification, not about building new systems. The heavy lifting was done in previous development. The planner should focus tasks on: audit -> fix specific issues -> verify.

## Common Pitfalls

### Pitfall 1: Caching Supabase Auth Endpoints
**What goes wrong:** Adding a broad `*.supabase.co` pattern caches auth tokens, causing stale authentication and refresh failures
**Why it happens:** Developers match the entire Supabase domain instead of just the REST API path
**How to avoid:** URL pattern must specifically match `/rest/v1/` and exclude `/auth/v1/`
**Warning signs:** Users getting logged out, auth refreshes failing after going offline/online

### Pitfall 2: Lighthouse Mobile vs Desktop Confusion
**What goes wrong:** Developers test on Desktop and get 95+, but mobile scores are much lower due to CPU throttling
**Why it happens:** Lighthouse mobile emulation applies 4x CPU throttling and slow 3G network simulation
**How to avoid:** Always run Lighthouse in mobile mode (the default). Scores should be verified in mobile mode for the success criteria.
**Warning signs:** Scores look great locally but fail in CI or PageSpeed Insights

### Pitfall 3: Viewport Zoom Restriction Failing Accessibility
**What goes wrong:** Lighthouse Accessibility drops 5-10 points from the `user-scalable=no, maximum-scale=1.0` viewport meta
**Why it happens:** Common PWA pattern to prevent zoom, but WCAG requires zoom support
**How to avoid:** Remove `maximum-scale=1.0` and `user-scalable=no`. Use CSS `touch-action: manipulation` if double-tap zoom is problematic.
**Warning signs:** Accessibility score stuck around 85-88 with no other visible issues

### Pitfall 4: Font Weight Bloat
**What goes wrong:** Loading 13+ font weight variants (4-5 weights x 3 families) slows first contentful paint
**Why it happens:** Developers add all weights "just in case" during development
**How to avoid:** Audit actual usage in Tailwind classes. Common: only 2-3 weights per family are actually used.
**Warning signs:** Large LCP (Largest Contentful Paint), font FOIT visible on throttled connections

### Pitfall 5: Color Contrast Failures
**What goes wrong:** Accessibility fails due to low contrast ratios on dark themes
**Why it happens:** Dark themes often have accent colors that look good aesthetically but fail WCAG AA (4.5:1 for text, 3:1 for large text)
**How to avoid:** Check all text-color + background-color pairings. Known issue: `#8B1A1A` (primary/accent text) on `#0A0A0A` (background) = ~2.7:1 ratio -- FAILS AA for normal text.
**Warning signs:** Accessibility score drops; Lighthouse flags specific elements

### Pitfall 6: Precache Size Bloat
**What goes wrong:** Service worker precache grows to >1MB, slowing first install and using mobile data
**Why it happens:** `globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']` catches everything in dist/
**How to avoid:** Current 962KB is borderline. Removing unused assets or limiting precache scope could help.
**Warning signs:** Slow first load on mobile, users abandoning before PWA is ready

## Code Examples

### Adding Supabase Runtime Caching to vite.config.ts

```typescript
// Source: vite-plugin-pwa docs + Workbox strategies docs
// Add to the existing runtimeCaching array in vite.config.ts

{
  // Supabase REST API - NetworkFirst for fresh data with offline fallback
  urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'supabase-api-cache',
    networkTimeoutSeconds: 3,
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 // 24 hours
    },
    cacheableResponse: {
      statuses: [0, 200]
    }
  }
}
```

### Google Fonts Runtime Caching (optional optimization)

```typescript
// Source: vite-plugin-pwa docs (generateSW page)
// Cache Google Fonts CSS and font files separately

{
  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'google-fonts-cache',
    expiration: {
      maxEntries: 10,
      maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
    },
    cacheableResponse: {
      statuses: [0, 200]
    }
  }
},
{
  urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'gstatic-fonts-cache',
    expiration: {
      maxEntries: 30,
      maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
    },
    cacheableResponse: {
      statuses: [0, 200]
    }
  }
}
```

### Fixed Viewport Meta Tag

```html
<!-- Replace in index.html: -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

### Lighthouse CLI Audit Command

```bash
# Install Lighthouse CLI
npx lighthouse https://trained-app-eta.vercel.app \
  --output=json --output=html \
  --output-path=./lighthouse-report \
  --chrome-flags="--headless" \
  --preset=desktop

# For mobile (default, use for scoring):
npx lighthouse https://trained-app-eta.vercel.app \
  --output=json --output=html \
  --output-path=./lighthouse-report \
  --chrome-flags="--headless"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| autoUpdate SW | prompt mode SW | vite-plugin-pwa always supported both | Users control when update happens, prevents data loss |
| Webpack code splitting | Vite/Rollup native code splitting | Vite 2+ (2021) | Faster builds, native ESM, simpler config |
| workbox-cli | vite-plugin-pwa wrapping workbox | vite-plugin-pwa v0.12+ | Declarative config in vite.config.ts |
| Blocking Google Fonts | `display=swap` + preconnect | Google added swap param ~2020 | Text visible immediately, font swaps in |

**Deprecated/outdated:**
- `registerType: 'autoUpdate'` -- still works but prompt is preferred for user control
- Self-hosting Google Fonts for performance -- CDN cross-site caching makes this unnecessary for most apps
- `user-scalable=no` -- deprecated for accessibility; WCAG 2.1 requires zoom support

## Accessibility-Specific Findings

### Known Issues from Codebase Audit

1. **Viewport meta restricts zoom** (HIGH confidence)
   - `maximum-scale=1.0, user-scalable=no` in index.html
   - Lighthouse flags this as accessibility failure
   - Fix: Remove both attributes

2. **Color contrast concerns** (MEDIUM confidence -- needs Lighthouse confirmation)
   - Primary color `#8B1A1A` used as text accent on `#0A0A0A` background: contrast ratio ~2.7:1 (FAILS AA 4.5:1)
   - Text secondary `#888888` on `#0A0A0A`: contrast ratio ~10.2:1 (PASSES)
   - Text primary `#E8E8E8` on `#0A0A0A`: contrast ratio ~17.6:1 (PASSES)
   - Success `#2D5A27` on `#141414` surface: ~2.3:1 (FAILS)
   - Warning `#8B6914` on `#141414` surface: ~3.0:1 (FAILS for normal text)

3. **Form labels** (MEDIUM confidence)
   - 27 `<label>` elements found, 16 `aria-label`/`htmlFor` attributes
   - Some labels may lack proper `htmlFor` associations
   - Auth.tsx uses `<label>` with `className` but no explicit `htmlFor`

4. **No `<img>` tags found** -- all icons are inline SVGs (lucide-react), which is good for accessibility (no alt text issues)

5. **ARIA usage is present** -- 43 ARIA attributes across 10 files. Navigation has `aria-label`, modals have `role="dialog"`.

## Open Questions

1. **What is the current Lighthouse score?**
   - What we know: App is deployed at trained-app-eta.vercel.app
   - What's unclear: No baseline measurement exists
   - Recommendation: Run Lighthouse audit as first task in plan. This determines how much work PERF-03 actually requires.

2. **Are all font weights actually used?**
   - What we know: 3 families x 4-5 weights = up to 13 font files loaded
   - What's unclear: Which weights are actually referenced in Tailwind classes
   - Recommendation: Audit font weight usage, trim to only used weights. LOW priority if Lighthouse Performance already passes.

3. **Will removing viewport zoom restriction break the PWA experience?**
   - What we know: Many PWAs use `user-scalable=no` to prevent accidental zoom. Removing it is required for accessibility.
   - What's unclear: Whether double-tap zoom will interfere with the app's touch interactions
   - Recommendation: Remove it and test. CSS `touch-action: manipulation` on `<body>` prevents double-tap zoom without failing accessibility.

4. **What are the exact contrast ratio failures?**
   - What we know: `#8B1A1A` accent text on dark backgrounds likely fails. Status colors (success, warning) likely fail on surface backgrounds.
   - What's unclear: Whether these colors are actually used as foreground text or only as backgrounds/borders
   - Recommendation: Lighthouse audit will flag exact elements. Fix only what Lighthouse actually flags -- some of these colors may only be used on backgrounds where they don't need text contrast.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** - Direct reading of vite.config.ts, App.tsx, UpdatePrompt.tsx, index.html, package.json, theme files
- **Build output** - Verified via `npm run build` on 2026-02-04
- [Workbox strategies documentation](https://developer.chrome.com/docs/workbox/modules/workbox-strategies) - NetworkFirst configuration, options, code examples
- [vite-plugin-pwa documentation](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html) - Prompt mode, generateSW, runtime caching
- [vite-plugin-pwa generateSW docs](https://vite-pwa-org.netlify.app/workbox/generate-sw.html) - Runtime caching configuration examples

### Secondary (MEDIUM confidence)
- [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) - How scores map to metrics
- [Google Fonts optimization](https://requestmetrics.com/web-performance/5-tips-to-make-google-fonts-faster/) - Preconnect, display=swap, font subsetting
- [Workbox runtime caching guide](https://web.dev/runtime-caching-with-workbox/) - Strategy selection guidance

### Tertiary (LOW confidence)
- Color contrast ratios calculated manually (should verify with Lighthouse or WebAIM contrast checker)
- Font weight usage is estimated (should verify with actual CSS/Tailwind audit)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from package.json, all patterns verified from codebase
- Architecture: HIGH - Patterns based on official Workbox/vite-plugin-pwa docs, verified against existing config
- Pitfalls: MEDIUM - Contrast ratios and font weights need Lighthouse confirmation; SW caching pitfalls from official docs
- Current state assessment: HIGH - All claims verified by reading actual source files and running build

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (stable libraries, 30-day validity)
