---
phase: 19-subscriptions
plan: 03
subsystem: infra
tags: [supabase, edge-function, revenuecat, webhook, rls, subscriptions]

# Dependency graph
requires:
  - phase: 19-01
    provides: RevenueCat SDK integration with subscriptionStore
provides:
  - subscriptions Supabase table with RLS policies
  - handle-revenuecat-webhook Edge Function for server-side sync
  - Server-side subscription state persistence
affects: [19-04, subscription-validation, premium-features]

# Tech tracking
tech-stack:
  added: []
  patterns: [webhook-auth-bearer-token, upsert-on-conflict, event-type-state-machine]

key-files:
  created:
    - supabase/migrations/012_subscriptions.sql
    - supabase/functions/handle-revenuecat-webhook/index.ts
  modified: []

key-decisions:
  - "Bearer token auth for webhook (not Supabase JWT) - RevenueCat sends its own auth"
  - "Single subscription record per user (UNIQUE user_id) with upsert on event"
  - "Skip sandbox events in production deployment to avoid test pollution"
  - "Skip $RCAnonymousID users - SDK must be configured with real Supabase user ID"

patterns-established:
  - "Webhook auth: Verify REVENUECAT_WEBHOOK_SECRET Bearer token before processing"
  - "Event type state machine: ACTIVE_EVENTS vs INACTIVE_EVENTS determine is_active"
  - "Service role upsert: Webhook uses service_role key to bypass RLS for writes"

requirements-completed: [SUB-03]

# Metrics
duration: 2min
completed: 2026-02-28
---

# Phase 19 Plan 03: Webhook and Subscriptions Table Summary

**RevenueCat webhook Edge Function with Bearer auth persists subscription events to RLS-protected subscriptions table**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T04:04:03Z
- **Completed:** 2026-02-28T04:05:31Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created subscriptions table with user_id unique constraint for single-record-per-user pattern
- Implemented RLS policies allowing users to read own subscription, service_role to manage all
- Built handle-revenuecat-webhook Edge Function with Bearer token authentication
- Added event type state machine (ACTIVE_EVENTS, INACTIVE_EVENTS) for is_active computation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create subscriptions table migration** - `893cad3c` (feat)
2. **Task 2: Create handle-revenuecat-webhook Edge Function** - `db5ac149` (feat)

**Plan metadata:** `86162536` (docs: complete plan)

## Files Created/Modified
- `supabase/migrations/012_subscriptions.sql` - Subscriptions table with RLS, indexes, and comments
- `supabase/functions/handle-revenuecat-webhook/index.ts` - Edge Function handling RevenueCat webhook events

## Decisions Made
- Bearer token authentication (REVENUECAT_WEBHOOK_SECRET) instead of Supabase JWT - webhooks are server-to-server
- UNIQUE(user_id) constraint enables upsert pattern - always have latest subscription state
- Skip $RCAnonymousID users to require proper Supabase user identification
- Skip sandbox events in production to avoid test data pollution

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

**External services require manual configuration.** Per plan frontmatter `user_setup`:

1. **RevenueCat Dashboard:**
   - Go to Project Settings -> Webhooks -> Add Endpoint
   - URL: `https://<project-ref>.supabase.co/functions/v1/handle-revenuecat-webhook`
   - Authorization: `Bearer <REVENUECAT_WEBHOOK_SECRET>`

2. **Supabase Dashboard:**
   - Go to Edge Functions -> Secrets
   - Add `REVENUECAT_WEBHOOK_SECRET` with a secure random string (32+ chars)

3. **Apply Migration:**
   ```bash
   supabase db push
   ```

4. **Deploy Edge Function:**
   ```bash
   supabase functions deploy handle-revenuecat-webhook --no-verify-jwt
   ```

## Issues Encountered

None

## Next Phase Readiness
- Server-side subscription infrastructure complete
- Ready for 19-04: Premium Feature Gating (client-side isPremium checks)
- Client apps can query subscriptions table for cross-device sync if needed

---
*Phase: 19-subscriptions*
*Completed: 2026-02-28*

## Self-Check: PASSED

All files and commits verified:
- supabase/migrations/012_subscriptions.sql: FOUND
- supabase/functions/handle-revenuecat-webhook/index.ts: FOUND
- Commit 893cad3c: FOUND
- Commit db5ac149: FOUND
