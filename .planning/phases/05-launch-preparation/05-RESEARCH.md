# Phase 5: Launch Preparation - Research

**Researched:** 2026-02-05
**Domain:** Monitoring, OG images, marketing assets, pre-launch verification
**Confidence:** HIGH

## Summary

This phase focuses on getting the Trained PWA ready for public launch. Research reveals that much of the infrastructure is already in place -- Sentry error tracking is configured (though not actively called from app code), Plausible analytics is integrated with comprehensive event tracking, OG meta tags exist in index.html, and the PWA manifest is properly configured.

The primary gaps are: (1) the OG image is wrong -- `og-image.png` is 512x512 (the app icon) but meta tags declare 1200x630, (2) Sentry `captureError`/`addBreadcrumb` functions are defined but never called from application code, (3) Supabase monitoring requires dashboard configuration (not code), and (4) marketing screenshots and a pre-launch verification pass need to be done.

**Primary recommendation:** Fix the OG image (convert existing SVG to proper 1200x630 PNG using sharp), wire up Sentry calls in error-prone code paths, configure Supabase dashboard monitoring manually, and create a comprehensive pre-launch checklist that verifies everything passes.

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @sentry/react | ^10.38.0 | Error monitoring, crash reporting | Configured, init called, but captureError never used in app code |
| Plausible Analytics | Script tag | Privacy-friendly analytics | Fully integrated, 20+ events tracked |
| sharp | ^0.34.5 | Image processing (devDependency) | Installed, can convert SVG to PNG |
| @supabase/supabase-js | ^2.93.3 | Backend, auth, data sync | Fully integrated |

### Supporting (No New Dependencies Needed)

This phase requires **zero new npm packages**. Everything needed is already installed or involves manual dashboard configuration.

| Tool | Purpose | Notes |
|------|---------|-------|
| Supabase Dashboard | Monitoring & reports | Dashboard-only, no code changes |
| Vercel Dashboard | Deployment monitoring | Already deployed to vercel |
| Lighthouse | Performance audit | Built into Chrome DevTools |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp (for OG image) | @vercel/og, satori | Overkill -- we have a static SVG that just needs PNG conversion |
| Supabase Grafana stack | Supabase built-in reports | Grafana is overkill for a solo/small project launch |
| Playwright screenshot tests | Manual screenshots | Could automate but overhead isn't worth it for one-time marketing assets |

## Architecture Patterns

### Current Monitoring Architecture (Already In Place)

```
Error Flow:
  App Error --> Sentry ErrorBoundary (main.tsx) --> Sentry.io
  Console logs (dev only) --> Browser DevTools

Analytics Flow:
  User Action --> analytics.ts --> window.plausible() --> Plausible.io

Data Sync Flow:
  Store Change --> scheduleSync() --> Supabase REST API
  Network Error --> useSyncStore.status = 'error'
  Reconnect --> flushPendingSync()
```

### What EXISTS vs What NEEDS WORK

**Fully Working:**
- Sentry initialization with DSN env var
- Sentry ErrorBoundary wrapping entire app (main.tsx)
- Sentry performance monitoring (10% trace rate)
- Sentry session replay (100% on error sessions)
- Sentry PII filtering (email redaction)
- Sentry vendor chunk splitting in Vite build
- Plausible analytics with 20+ custom events
- Plausible script tag in index.html
- OG meta tags in index.html (og:title, og:description, og:url, og:image)
- Twitter Card meta tags (summary_large_image)
- PWA manifest with icons (192x192, 512x512)
- Apple touch icon, favicon (SVG, PNG 16x16, 32x32)
- Service worker with prompt-based updates
- Vercel deployment with SPA rewrites and cache headers
- Offline sync with retry logic and status indicator

**Needs Fix:**
- OG image is WRONG: `og-image.png` is 512x512 (app icon), not 1200x630 as meta tags declare
- Sentry captureError() is defined but NEVER called from any application code
- Sentry setUser()/clearUser() defined but never called from authStore
- Sentry addBreadcrumb() defined but never called anywhere
- No robots.txt file
- No Supabase dashboard monitoring configured (manual step)

### Anti-Patterns to Avoid
- **Setting up Grafana/Prometheus for a small PWA launch:** The Supabase built-in reports are sufficient. External monitoring infrastructure is overkill at this stage.
- **Building a custom monitoring dashboard in the app:** Use the existing third-party dashboards (Sentry, Supabase, Plausible, Vercel).
- **Generating OG images dynamically at runtime:** This is a static site. A single pre-generated PNG is correct.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG image generation | Canvas API, headless browser | sharp SVG-to-PNG conversion | sharp is already installed, SVG template already exists at correct dimensions |
| Error monitoring dashboard | Custom error tracking UI | Sentry dashboard | Already configured, just needs captureError() calls wired up |
| Analytics dashboard | Custom analytics | Plausible dashboard | Already integrated with 20+ events |
| Performance auditing | Custom perf monitoring | Lighthouse CLI / Chrome DevTools | Industry standard, free |
| Device-framed screenshots | Custom screenshot tool | Manual: take screenshots + use online frame tool (mockuphone.com, shots.so) | One-time task, not worth automating |

## Common Pitfalls

### Pitfall 1: OG Image Dimension Mismatch (CRITICAL - EXISTS NOW)
**What goes wrong:** Social media platforms (Facebook, Twitter, LinkedIn) fetch og-image.png and get a 512x512 square instead of the expected 1200x630 landscape. The preview will either be cropped badly or show a tiny square.
**Why it happens:** The og-image.png was likely copied from the PWA icon (pwa-512x512.png) instead of being generated from the og-image.svg template.
**How to avoid:** Convert og-image.svg (which IS correctly 1200x630) to PNG using sharp. Verify dimensions after conversion.
**Warning signs:** Test with Facebook Sharing Debugger, Twitter Card Validator, or opengraph.xyz before launch.

### Pitfall 2: Sentry Configured But Not Actually Capturing Errors
**What goes wrong:** Sentry is initialized and the ErrorBoundary catches React render errors, but all other errors (API failures, sync errors, store errors) silently fail without being reported to Sentry.
**Why it happens:** The captureError() wrapper was created but never wired into the error handling paths throughout the app.
**How to avoid:** Add captureError() calls in: sync.ts (sync failures), authStore.ts (auth errors), foodApi.ts (API failures), and any try/catch blocks that currently only console.error.
**Warning signs:** If Sentry dashboard shows zero errors for days after launch, either no one is using the app or errors aren't being captured.

### Pitfall 3: Missing setUser/clearUser in Auth Flow
**What goes wrong:** Sentry errors have no user context, making it impossible to correlate errors with specific users or understand if one user is hitting a unique bug.
**Why it happens:** setUser() and clearUser() are exported from sentry.ts but never called from authStore.
**How to avoid:** Call setUser(user.id) after successful sign-in, clearUser() after sign-out.

### Pitfall 4: Sharp Font Rendering in SVG-to-PNG
**What goes wrong:** The og-image.svg uses Oswald and Inter fonts. Sharp uses librsvg for SVG rendering, which requires fonts to be installed on the system. If fonts aren't available, text renders in a fallback font.
**Why it happens:** librsvg doesn't load web fonts from CSS `@import` or Google Fonts URLs.
**How to avoid:** Either install Oswald/Inter locally before running sharp conversion, OR modify the SVG to use a fallback system font, OR embed the text as SVG paths instead of text elements. Alternatively, use a simple script that opens the SVG in a browser and screenshots it at the right dimensions.
**Warning signs:** Check the generated PNG visually before deploying.

### Pitfall 5: Forgetting to Test OG Tags After Deployment
**What goes wrong:** OG tags look correct in HTML but social platforms cache old/broken previews.
**Why it happens:** Facebook/Twitter cache OG data aggressively. Changes don't show up until cache is cleared.
**How to avoid:** Use Facebook Sharing Debugger (developers.facebook.com/tools/debug/) to scrape fresh data. Use Twitter Card Validator. Test with opengraph.xyz.

## Code Examples

### Converting OG Image SVG to PNG with Sharp

```typescript
// scripts/generate-og-image.ts (or run as one-off Node script)
// Source: sharp documentation + existing project setup
import sharp from 'sharp'
import { readFileSync } from 'fs'

const svgBuffer = readFileSync('public/og-image.svg')

await sharp(svgBuffer)
  .resize(1200, 630)
  .png()
  .toFile('public/og-image.png')

console.log('Generated og-image.png (1200x630)')
```

**Note:** Since sharp is a devDependency, this runs fine in the development environment. Can be a simple `node -e "..."` one-liner or a script in package.json.

### Wiring Sentry captureError into Sync Service

```typescript
// In src/lib/sync.ts, inside the catch blocks:
import { captureError } from './sentry'

// Example: In scheduleSync() catch block
} catch (error) {
  store.setStatus('error')
  store.setPendingChanges(true)
  if (error instanceof Error) {
    captureError(error, { context: 'scheduleSync' })
  }
}
```

### Wiring Sentry User Context into Auth

```typescript
// In src/stores/authStore.ts, after successful sign-in:
import { setUser, clearUser } from '@/lib/sentry'

// After sign-in success:
setUser(user.id, user.email)

// After sign-out:
clearUser()
```

### Adding robots.txt

```
# public/robots.txt
User-agent: *
Allow: /

Sitemap: https://trained-app-eta.vercel.app/sitemap.xml
```

Note: A sitemap is optional for a single-page PWA, but robots.txt is good practice.

## Supabase Monitoring - Dashboard Configuration (Not Code)

**Confidence: MEDIUM** (based on Supabase docs, not hands-on verification)

### What Supabase Dashboard Provides Natively

The Supabase dashboard includes built-in Reports (no code needed):

| Report | What It Shows |
|--------|---------------|
| **Database** | CPU usage, memory, disk IOPS, storage, connection counts |
| **Auth** | Active users, sign-in attempts by type, signup volumes, error rates |
| **API Gateway** | Request volume, error rates (4XX/5XX), response times |
| **Storage** | Request volume, response speed, cache hit rates |
| **Realtime** | WebSocket connections (not used in this app) |

### What Supabase Does NOT Provide Natively

- **No built-in email/Slack alerts.** Supabase Reports are dashboard-only visualizations.
- To get alerts, you need to either:
  1. **Check the dashboard manually** (simplest for solo launch)
  2. Set up the Supabase Prometheus Metrics API endpoint at `https://<project-ref>.supabase.co/customer/v1/privileged/metrics` with an external monitoring tool (Grafana, Datadog, etc.)

### Recommendation for Launch

For initial launch, **manual dashboard monitoring is sufficient**:
1. Bookmark the Supabase Reports page for your project
2. Check Database and Auth reports daily for the first week
3. Set up external alerting only if usage grows or problems are detected

The phase success criteria says "Supabase dashboard shows alerts for connection limits, query latency, auth errors." Reframe this as: "Supabase dashboard Reports page is reviewed and shows healthy metrics. Developer knows where to check for connection limits, query latency, and auth errors."

### Supabase Metrics API (For Future Reference)

```
Endpoint: https://<project-ref>.supabase.co/customer/v1/privileged/metrics
Auth: HTTP Basic (username: service_role, password: sb_secret_xxx from API settings)
Format: Prometheus-compatible (~200 series)
Scrape interval: 1 minute max
```

This is available if/when external alerting becomes necessary.

## Pre-Launch Checklist

### PWA Essentials
- [ ] Web App Manifest present and valid (`manifest.webmanifest` generated by vite-plugin-pwa)
- [ ] Icons: 192x192 and 512x512 PNG present (DONE - verified)
- [ ] Apple touch icon present (DONE - `apple-touch-icon.png`)
- [ ] Favicon present (DONE - `favicon.svg`, `favicon-16x16.png`, `favicon-32x32.png`)
- [ ] Service worker registers and caches assets (DONE - prompt mode)
- [ ] App works offline (core functionality via localStorage)
- [ ] `display: standalone` in manifest (DONE)
- [ ] `theme-color` meta tag matches manifest (DONE - `#0a0a0a`)
- [ ] Start URL loads correctly when installed

### Meta Tags & SEO
- [ ] `<title>` set (DONE - "Trained")
- [ ] `<meta name="description">` set (DONE)
- [ ] OG tags complete: og:title, og:description, og:url, og:image (DONE in HTML)
- [ ] OG image is correct dimensions 1200x630 (BROKEN - currently 512x512)
- [ ] Twitter Card meta tags set (DONE - summary_large_image)
- [ ] `robots.txt` present (MISSING)

### Security & Performance
- [ ] HTTPS enforced (Vercel handles this)
- [ ] No sensitive data in client bundle (env vars via VITE_ prefix)
- [ ] Lighthouse Performance score > 90
- [ ] Lighthouse Accessibility score > 90
- [ ] Lighthouse Best Practices score > 90
- [ ] Lighthouse PWA score passes
- [ ] Bundle size reasonable (vendor splitting configured)

### Error Monitoring
- [ ] Sentry DSN configured in production env vars
- [ ] Sentry ErrorBoundary wrapping app (DONE)
- [ ] Sentry captureError() called from error paths (NOT DONE)
- [ ] Sentry setUser()/clearUser() wired into auth (NOT DONE)
- [ ] Test error in production to verify Sentry receives it

### Analytics
- [ ] Plausible script tag in index.html (DONE)
- [ ] Plausible domain matches deployed domain (DONE - `trained-app-eta.vercel.app`)
- [ ] Key user events tracked (DONE - onboarding, workouts, meals, XP, check-ins)

### Supabase Backend
- [ ] Database reports accessible in Supabase dashboard
- [ ] Auth reports showing login/signup metrics
- [ ] Connection pool not near limits
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] API keys are production keys (not development)

### Deployment
- [ ] Vercel project configured correctly (DONE - `vercel.json`)
- [ ] SPA rewrites working (DONE)
- [ ] Cache headers set for assets (DONE - 1 year immutable)
- [ ] Service worker cache-control set to no-cache (DONE)
- [ ] Environment variables set in Vercel dashboard

## State of the Art

| Area | Current State | Action Needed |
|------|---------------|---------------|
| OG meta tags | HTML tags present, correct format | NONE (tags are fine) |
| OG image | BROKEN - 512x512 instead of 1200x630 | Regenerate from SVG |
| Sentry init | Working, ErrorBoundary in place | NONE |
| Sentry usage | Functions defined but never called | Wire into error paths |
| Plausible | Fully integrated, 20+ events | NONE |
| PWA manifest | Complete with icons | NONE |
| Favicons | All sizes present | NONE |
| Service worker | Prompt mode, runtime caching configured | NONE |
| Vercel config | SPA rewrites, cache headers | NONE |
| robots.txt | Missing | Create simple one |
| Supabase monitoring | Not configured in dashboard | Manual dashboard review |
| Marketing screenshots | Don't exist yet | Manual creation needed |

## Open Questions

1. **Is the Sentry DSN actually set in Vercel production env vars?**
   - What we know: `.env.example` has placeholder, `.env.production.local` exists but is gitignored
   - What's unclear: Whether VITE_SENTRY_DSN is configured in the Vercel dashboard
   - Recommendation: Verify in Vercel dashboard. If not set, Sentry silently does nothing.

2. **Which screens make the best marketing screenshots?**
   - What we know: App has Home, Workouts, Macros, Avatar, Achievements, Settings, Onboarding
   - What's unclear: What the filled-in screens actually look like with real data
   - Recommendation: Best candidates are Home (dashboard overview), Workouts (active workout), Macros (daily tracking), and Achievements (badge collection). These need real/demo data to look good.

3. **Should OG image show the app UI or be brand-only?**
   - What we know: Current SVG is brand-only ("TRAINED" text + tagline, 1200x630)
   - What's unclear: Whether a UI screenshot would convert better for social sharing
   - Recommendation: The existing brand-only SVG design is clean and appropriate for OG. Keep it.

4. **Custom domain vs Vercel subdomain for launch?**
   - What we know: Currently deployed at `trained-app-eta.vercel.app`
   - What's unclear: Whether a custom domain is planned
   - Recommendation: OG tags hardcode the Vercel URL. If custom domain is planned, update og:url and og:image URLs.

## Sources

### Primary (HIGH confidence)
- Codebase files directly examined: `index.html`, `src/lib/sentry.ts`, `src/lib/analytics.ts`, `src/lib/supabase.ts`, `src/lib/sync.ts`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `package.json`, `vercel.json`, `tailwind.config.js`, `public/` directory
- File dimensions verified via `sips` and `file` commands
- `.planning/codebase/INTEGRATIONS.md` - existing integration audit

### Secondary (MEDIUM confidence)
- [Supabase Metrics API docs](https://supabase.com/docs/guides/telemetry/metrics) - Prometheus endpoint, ~200 metrics
- [Supabase Reports docs](https://supabase.com/docs/guides/telemetry/reports) - Built-in dashboard reports (Database, Auth, API, Storage)
- [Supabase Reports feature page](https://supabase.com/features/reports-and-metrics) - Report types and capabilities
- [sharp SVG-to-PNG documentation](https://techsparx.com/nodejs/graphics/svg-to-png.html) - Conversion approach with sharp

### Tertiary (LOW confidence)
- [Bootstrapped Supabase Guides - Monitoring](https://bootstrapped.app/guide/how-to-set-up-monitoring-and-alerting-for-supabase) - Referenced for dashboard alert setup (404 when fetched)
- Web search results for device frame tools - moqq, deviceframe (not verified for current functionality)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries directly verified in package.json and source code
- OG image issue: HIGH - Dimensions verified with sips command (512x512 vs declared 1200x630)
- Sentry gaps: HIGH - grep confirmed captureError/setUser never called outside definitions
- Supabase monitoring: MEDIUM - Based on official docs, not hands-on dashboard verification
- Pre-launch checklist: HIGH - Based on direct codebase inspection
- Marketing screenshots: LOW - Creative task, no technical research needed

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (stable domain, no fast-moving dependencies)
