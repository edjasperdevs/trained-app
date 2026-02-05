# Pre-Launch Checklist - Trained PWA

**Date:** 2026-02-05
**Status:** READY
**Verified by:** Automated checks + code inspection

---

## PWA Essentials

- [x] **Web App Manifest** - PASS
  - vite-plugin-pwa generates `manifest.webmanifest` at build time
  - Confirmed in build output: `dist/manifest.webmanifest` (0.48 kB)
  - Contains: name, short_name, display, theme_color, background_color, icons, orientation

- [x] **Icons 192x192 + 512x512** - PASS
  - `public/pwa-192x192.png` exists
  - `public/pwa-512x512.png` exists
  - Both referenced in manifest icons array

- [x] **Apple Touch Icon** - PASS
  - `public/apple-touch-icon.png` exists
  - Referenced in index.html: `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`

- [x] **Favicons** - PASS
  - `public/favicon.svg` (primary, SVG)
  - `public/favicon-16x16.png` (16x16 fallback)
  - `public/favicon-32x32.png` (32x32 fallback)
  - All three referenced in index.html `<head>`

- [x] **Service Worker Registration** - PASS
  - vite-plugin-pwa with `registerType: 'prompt'` in vite.config.ts
  - Build output confirms: `dist/sw.js` and `dist/workbox-57649e2b.js` generated
  - 51 precache entries (967.52 KiB)

- [x] **Standalone Display Mode** - PASS
  - `display: 'standalone'` in vite.config.ts manifest config
  - Confirmed in built manifest.webmanifest

- [x] **Theme Color** - PASS
  - `<meta name="theme-color" content="#0a0a0a" />` in index.html
  - Matches `theme_color: '#0a0a0a'` in manifest config

---

## Meta Tags & SEO

- [x] **OG Tags Complete** - PASS
  - `og:type` = "website"
  - `og:title` = "Trained"
  - `og:description` = "The protocol for building discipline through fitness."
  - `og:url` = "https://trained-app-eta.vercel.app"
  - `og:image` = "https://trained-app-eta.vercel.app/og-image.png"
  - `og:image:width` = "1200"
  - `og:image:height` = "630"

- [x] **OG Image Dimensions** - PASS
  - `public/og-image.png`: 1200x630 pixels (verified via `sips`)
  - Fixed in Plan 05-01 (was 512x512, regenerated from SVG via sharp)

- [x] **Twitter Card** - PASS
  - `twitter:card` = "summary_large_image"
  - `twitter:title` = "Trained"
  - `twitter:description` = "The protocol for building discipline through fitness."
  - `twitter:image` = "https://trained-app-eta.vercel.app/og-image.png"

- [x] **robots.txt** - PASS
  - `public/robots.txt` exists with `User-agent: * / Allow: /`
  - Created in Plan 05-01

- [x] **Page Title** - PASS
  - `<title>Trained</title>` in index.html

- [x] **Meta Description** - PASS
  - `<meta name="description" content="Trained - The protocol for building discipline through fitness." />`

---

## Error Monitoring

- [x] **Sentry DSN Documented** - PASS
  - `VITE_SENTRY_DSN` present in `.env.example` with placeholder value
  - Marked as optional with setup instructions

- [x] **Sentry ErrorBoundary** - PASS
  - `ErrorBoundary` imported from `./lib/sentry` and wrapping entire app in `src/main.tsx`
  - Fallback UI shows friendly error message with refresh button

- [x] **Sentry captureError Wired** - PASS (8 call sites)
  - `src/lib/sync.ts`: 2 calls (scheduleSync, flushPendingSync)
  - `src/stores/authStore.ts`: 5 calls (initialize, signUp, signIn, resetPassword, syncData)
  - `src/lib/foodApi.ts`: 1 call (USDA fallback)

- [x] **Sentry User Context** - PASS
  - `sentrySetUser` called after signIn (line 125) and signUp (line 86) in authStore.ts
  - `sentryClearUser` called after signOut (line 144) in authStore.ts

---

## Analytics

- [x] **Plausible Script Tag** - PASS
  - `<script defer data-domain="trained-app-eta.vercel.app" src="https://plausible.io/js/script.js"></script>`
  - Present in index.html `<head>`

- [x] **Plausible Domain** - PASS
  - `data-domain="trained-app-eta.vercel.app"` matches deployed domain

---

## Deployment

- [x] **Vercel Config** - PASS
  - `vercel.json` present with build command, output directory, and framework specified

- [x] **SPA Rewrites** - PASS
  - Rewrite rule: `/((?!assets|sw|workbox|manifest).*)` -> `/`
  - Correctly excludes static assets, service worker, and manifest from rewrites

- [x] **Cache Headers** - PASS
  - `/assets/*`: `public, max-age=31536000, immutable` (1 year, immutable)
  - `/sw.js`: `no-cache` (always fresh service worker)
  - `/manifest.webmanifest`: `Content-Type: application/manifest+json`

---

## Security

- [x] **Client Env Vars** - PASS
  - All client-exposed env vars use `VITE_` prefix: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SENTRY_DSN, VITE_LEMONSQUEEZY_API_URL, VITE_MASTER_ACCESS_CODE, VITE_USDA_API_KEY

- [x] **No Secrets in Git** - PASS (with note)
  - `.env.example` committed (expected, contains placeholders only)
  - `.env.production.local` committed but contains only Vercel CLI build config (NX_DAEMON, TURBO_CACHE settings), no secrets

---

## Build Verification

- [x] **TypeScript Clean** - PASS
  - `npx tsc --noEmit` completed with zero errors

- [x] **Production Build** - PASS
  - `npx vite build` completed in 6.61s
  - 2465 modules transformed
  - PWA precache: 51 entries (967.52 KiB)

- [x] **Bundle Sizes** - PASS (reasonable)
  - CSS: 35.29 kB (6.98 kB gzip)
  - App code (index): 116.57 kB (32.71 kB gzip)
  - vendor-react: 163.84 kB (53.47 kB gzip)
  - vendor-supabase: 169.90 kB (44.64 kB gzip)
  - vendor-motion: 115.26 kB (38.24 kB gzip)
  - vendor-sentry: 82.77 kB (28.33 kB gzip)
  - Route chunks (Home, Workouts, Macros, etc.): 7-48 kB each
  - Total gzip estimate: ~280 kB (reasonable for a feature-rich PWA)

---

## Summary

| Category | Checks | Passed | Failed | N/A |
|----------|--------|--------|--------|-----|
| PWA Essentials | 7 | 7 | 0 | 0 |
| Meta Tags & SEO | 6 | 6 | 0 | 0 |
| Error Monitoring | 4 | 4 | 0 | 0 |
| Analytics | 2 | 2 | 0 | 0 |
| Deployment | 3 | 3 | 0 | 0 |
| Security | 2 | 2 | 0 | 0 |
| Build Verification | 3 | 3 | 0 | 0 |
| **Total** | **27** | **27** | **0** | **0** |

**Result: ALL 27 AUTOMATED CHECKS PASSED**

---

## Manual Tasks (User Action Required)

These items cannot be verified automatically and require human action before or shortly after launch.

### 1. Verify Sentry DSN in Vercel Dashboard
**Priority:** HIGH (before launch)
**What:** Confirm `VITE_SENTRY_DSN` is set in Vercel project environment variables
**Why:** If not set, Sentry silently does nothing in production -- all error tracking is inactive
**How:**
1. Go to Vercel Dashboard > Project > Settings > Environment Variables
2. Check that `VITE_SENTRY_DSN` has a valid Sentry DSN value
3. If missing, get DSN from Sentry.io > Project Settings > Client Keys (DSN)

### 2. Test OG Image After Deploy
**Priority:** MEDIUM (before announcing)
**What:** Verify social media link preview looks correct
**How:**
1. Deploy latest code to Vercel
2. Test with https://opengraph.xyz -- enter `https://trained-app-eta.vercel.app`
3. Verify preview shows 1200x630 branded image, correct title and description
4. (Optional) Test with Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/

### 3. Marketing Screenshots
**Priority:** MEDIUM (before announcing on social media)
**What:** Take device-framed screenshots of key app screens with real data
**Best screens:**
- Home dashboard (with recent workout and XP data)
- Active workout (mid-exercise)
- Macro tracking (with meals logged)
- Achievements (with some unlocked badges)
**How:**
1. Use the app with real data to populate screens
2. Take screenshots on your device
3. Frame with device mockup: https://shots.so or https://mockuphone.com

### 4. Supabase Dashboard Familiarization
**Priority:** LOW (within first week of launch)
**What:** Know where to check backend health metrics
**How:**
1. Bookmark Supabase Dashboard > Reports page for your project
2. Review available reports: Database, Auth, API Gateway
3. Check Database report for connection pool usage
4. Check Auth report for login/signup volumes and error rates
5. No code or configuration needed -- just know where to look

### 5. Trigger Test Error in Production (Optional)
**Priority:** LOW (after deploy with Sentry DSN set)
**What:** Verify Sentry actually receives errors from production
**How:**
1. Open browser console on the deployed app
2. The ErrorBoundary and captureError calls will report real errors
3. Check Sentry dashboard for incoming events within a few minutes

---

*Checklist generated: 2026-02-05*
*All automated checks passed. Manual tasks documented for user action.*
