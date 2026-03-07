---
phase: 43-referral-rewards
plan: 01
subsystem: payments
tags: [revenuecat, promotional-entitlement, edge-function, deno, supabase]

# Dependency graph
requires:
  - phase: 42-referral-system
    provides: referral attribution flow (referralStore, attributeReferral)
provides:
  - RevenueCat promotional entitlement helper (grantPromotionalEntitlement)
  - Edge Function for granting 7-day premium (grant-referral-premium)
  - Signup flow integration for referred users
affects: [43-02, subscriptions, referral-system]

# Tech tracking
tech-stack:
  added: []
  patterns: [fire-and-forget edge function invocation, promotional entitlement grant]

key-files:
  created:
    - supabase/functions/_shared/revenuecat.ts
    - supabase/functions/grant-referral-premium/index.ts
  modified:
    - src/stores/referralStore.ts
    - src/screens/auth-screens/SignUpScreen.tsx
    - src/screens/auth-screens/EmailSignUpScreen.tsx

key-decisions:
  - "grantReferralPremium called after attributeReferral (order matters for referral record existence)"
  - "Fire-and-forget pattern for premium grant (non-blocking UX)"
  - "Edge Function verifies referral record exists before granting (prevents abuse)"

patterns-established:
  - "RevenueCat promotional entitlement via REST API (not SDK)"
  - "Sequential fire-and-forget pattern: attributeReferral then grantReferralPremium"

requirements-completed: [REFR-02]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 43 Plan 01: Referral Premium Grant Summary

**RevenueCat promotional entitlement Edge Function with signup flow integration for 7-day Premium rewards**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T14:50:15Z
- **Completed:** 2026-03-07T14:53:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created RevenueCat REST API helper for promotional entitlements
- Built Edge Function with JWT verification and referral record check
- Integrated promotional grant into all signup flows (Apple, Google, Email)
- Fire-and-forget pattern ensures non-blocking UX

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RevenueCat promotional entitlement Edge Function** - `1498da32` (feat)
2. **Task 2: Integrate promotional grant into signup flows** - `07ebab54` (feat)

## Files Created/Modified
- `supabase/functions/_shared/revenuecat.ts` - RevenueCat API helper with grantPromotionalEntitlement function
- `supabase/functions/grant-referral-premium/index.ts` - Edge Function for granting 7-day premium
- `src/stores/referralStore.ts` - Added grantReferralPremium action
- `src/screens/auth-screens/SignUpScreen.tsx` - Added grantReferralPremium calls after Apple/Google sign-in
- `src/screens/auth-screens/EmailSignUpScreen.tsx` - Added grantReferralPremium call after email signup

## Decisions Made
- Order matters: attributeReferral creates the referral record, then grantReferralPremium checks for it
- Edge Function performs server-side verification (user must have referral record) to prevent abuse
- Dynamic import of subscriptionStore to trigger entitlement refresh after grant

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

**External services require manual configuration:**

1. **REVENUECAT_SECRET_KEY environment variable:**
   - Source: RevenueCat Dashboard -> Project Settings -> API Keys -> Secret API key (starts with sk_)
   - Deploy: `supabase secrets set REVENUECAT_SECRET_KEY=sk_...`

2. **RevenueCat Dashboard configuration:**
   - Ensure 'premium' entitlement exists in RevenueCat Dashboard -> Project -> Entitlements

## Issues Encountered
None

## Next Phase Readiness
- Promotional grant infrastructure complete
- Ready for Phase 43-02 (Referrer DP rewards)
- REVENUECAT_SECRET_KEY must be configured before deployed Edge Function will work

## Self-Check: PASSED

- supabase/functions/_shared/revenuecat.ts: FOUND
- supabase/functions/grant-referral-premium/index.ts: FOUND
- Commit 1498da32: FOUND
- Commit 07ebab54: FOUND

---
*Phase: 43-referral-rewards*
*Completed: 2026-03-07*
