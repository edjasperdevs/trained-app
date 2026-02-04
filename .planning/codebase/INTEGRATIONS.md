# External Integrations

**Analysis Date:** 2026-02-04

## APIs & External Services

**Food Database & Nutrition:**
- USDA FoodData Central API - Nutrition lookup for meals
  - SDK/Client: Fetch HTTP POST to `https://api.nal.usda.gov/fdc/v1/foods/search`
  - Auth: API key via `VITE_USDA_API_KEY` (defaults to 'DEMO_KEY')
  - Fallback: Open Food Facts API at `https://world.openfoodfacts.org/cgi/search.pl`
  - Location: `src/lib/foodApi.ts`

**License & Access Control:**
- Lemon Squeezy License Validation API - License key validation for app access
  - SDK/Client: Fetch HTTP POST to `{VITE_LEMONSQUEEZY_API_URL}/v1/licenses/validate`
  - Auth: No explicit auth, license key included in request body
  - Features: Validates license key, tracks activation limit, tracks instances
  - Location: `src/stores/accessStore.ts` (validateCode, revokeAccess methods)

**Analytics:**
- Plausible Analytics - Privacy-friendly, anonymous analytics
  - SDK/Client: Script tag in `index.html` (no SDK import needed)
  - Implementation: `window.plausible()` global function called from `src/lib/analytics.ts`
  - No cookies, GDPR compliant
  - Tracked events: Onboarding, workouts, meals, achievements, level ups, sign-ups

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - Connection: Supabase client in `src/lib/supabase.ts`
  - Client: @supabase/supabase-js 2.93.3
  - Schema: `supabase/schema.sql`, migrations in `supabase/migrations/`
  - Tables managed:
    - `profiles` - User profile data (username, fitness level, avatar, streak, etc.)
    - `weight_logs` - Daily weight tracking
    - `macro_targets` - User nutrition targets
    - `daily_macro_logs` - Daily nutrition logs
    - `logged_meals` - Individual meal entries
    - `saved_meals` - User's saved meal templates
    - `workout_logs` - Completed workout records
    - `user_xp` - XP and level progression
    - `access_codes` - License key validation table

**File Storage:**
- None - App is client-side only with no file uploads

**Caching:**
- Browser Local Storage - Primary data store (offline-first)
- Zustand stores persist to localStorage:
  - `src/stores/userStore.ts`
  - `src/stores/workoutStore.ts`
  - `src/stores/macroStore.ts`
  - `src/stores/xpStore.ts`
  - `src/stores/achievementsStore.ts`
  - `src/stores/accessStore.ts` (with explicit persist middleware)
- Service Worker (Workbox) - Asset caching with immutable strategy for `/assets/**`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (PostgreSQL-backed)
  - Implementation: Email/password authentication in `src/stores/authStore.ts`
  - Methods: `signUp()`, `signIn()`, `signOut()`, `resetPassword()`
  - Session persistence: Auto refresh tokens enabled
  - Key methods:
    - `getUser()` - Get current authenticated user
    - `isCoach()` - Check if user has coach role
  - Location: `src/lib/supabase.ts`, `src/stores/authStore.ts`

## Monitoring & Observability

**Error Tracking:**
- Sentry React - Error monitoring and crash reporting
  - DSN: Via `VITE_SENTRY_DSN` env var (optional)
  - Disabled in development mode
  - Configuration: `src/lib/sentry.ts`
  - Features enabled:
    - Performance monitoring (10% trace sample rate)
    - Session replay (0% on normal sessions, 100% on error)
    - PII filtering (redacts email addresses from error messages)
  - Error filtering: Ignores extension errors, network errors, ResizeObserver
  - Methods:
    - `initSentry()` - Initialize in production
    - `captureError()` - Capture exceptions with context
    - `captureMessage()` - Capture non-error events
    - `setUser()` - Set user context after sign-in
    - `clearUser()` - Clear user context after sign-out
    - `addBreadcrumb()` - Add debugging breadcrumbs

**Logs:**
- Console logging (development)
- Sentry breadcrumbs for error context
- No centralized log aggregation

## CI/CD & Deployment

**Hosting:**
- Vercel - Production deployment
  - Config: `vercel.json` with SPA rewrites, cache headers
  - Build command: `npm run build` (tsc -b && vite build)
  - Output directory: `dist/`
  - Framework: Vite

**CI Pipeline:**
- Not detected - No GitHub Actions or CI service configuration found

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL (e.g., https://your-project.supabase.co)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Optional env vars (with sensible defaults):**
- `VITE_SENTRY_DSN` - Error tracking (skipped if not set; logs warning in dev)
- `VITE_LEMONSQUEEZY_API_URL` - Defaults to `https://api.lemonsqueezy.com` but fallback to accept 8+ char codes
- `VITE_MASTER_ACCESS_CODE` - Override code for testing (no validation if set)
- `VITE_USDA_API_KEY` - Defaults to 'DEMO_KEY' (limited rate limits, should be overridden in production)

**Secrets location:**
- `.env` file (local development, NOT committed)
- `.env.production.local` (production secrets for Vercel, NOT committed)
- Vercel environment variables (UI-managed in Vercel dashboard)

## Webhooks & Callbacks

**Incoming:**
- None detected - App is client-side only

**Outgoing:**
- Lemon Squeezy deactivate endpoint - Called when user revokes access
  - POST to `{VITE_LEMONSQUEEZY_API_URL}/v1/licenses/deactivate`
  - Body: `{ license_key, instance_id }`
  - Fire-and-forget (errors ignored)

## Data Sync Pattern

**Sync Service:**
- Location: `src/lib/sync.ts`
- Architecture: Offline-first with eventual consistency
- Triggered on:
  - User sign-in/sign-up via `authStore.syncData()`
  - Manual sync via user action
- Synced data:
  - Profile metadata (username, fitness level, streak, avatar)
  - Weight history
  - Macro targets and daily logs
  - Saved meal templates
  - Workout logs (last 10)
  - XP and level progression
- Merge strategy: Local storage is source of truth; cloud data loaded on sign-in, merged with local for weight logs
- Error handling: User-friendly toast messages, graceful fallback to local-only mode

---

*Integration audit: 2026-02-04*
