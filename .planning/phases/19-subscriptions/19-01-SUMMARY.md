---
phase: 19-subscriptions
plan: 01
subsystem: payments
tags: [revenuecat, ios, iap, subscriptions, zustand]

# Dependency graph
requires:
  - phase: 18-gamification
    provides: dpStore pattern for Zustand persist
provides:
  - RevenueCat SDK initialized with Supabase user ID
  - subscriptionStore with isPremium selector persisted
  - Xcode IAP entitlements
affects: [19-02-paywall, 19-03-premium-gate, 19-04-client-gate]

# Tech tracking
tech-stack:
  added: ["@revenuecat/purchases-capacitor@11.3.2"]
  patterns: ["subscription state with Zustand persist", "SDK init guarded by isNative()"]

key-files:
  created:
    - src/lib/revenuecat.ts
    - src/stores/subscriptionStore.ts
    - .planning/phases/19-subscriptions/19-USER-SETUP.md
  modified:
    - src/App.tsx
    - src/stores/authStore.ts
    - src/stores/index.ts
    - ios/App/App/App.entitlements
    - package.json
    - package-lock.json

key-decisions:
  - "ENTITLEMENT_ID constant set to 'premium' - must match RevenueCat dashboard"
  - "Only persist isPremium to localStorage, not offerings/customerInfo"
  - "Subscription loading gate only applies to native, web bypasses"

patterns-established:
  - "RevenueCat SDK calls guarded with isNative() to prevent web errors"
  - "Subscription store reset called during signOut alongside other stores"

requirements-completed: [SUB-01, SUB-05]

# Metrics
duration: 6min
completed: 2026-02-28
---

# Phase 19 Plan 01: SDK Setup Summary

**RevenueCat SDK installed with Zustand persist subscriptionStore, App.tsx initialization, and iOS IAP entitlements**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-28T03:47:33Z
- **Completed:** 2026-02-28T03:53:51Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Installed @revenuecat/purchases-capacitor@11.3.2 and ran cap sync ios
- Created revenuecat.ts helper with initializeRevenueCat, loginToRevenueCat, logoutFromRevenueCat
- Created subscriptionStore with isPremium, purchase, restorePurchases actions using Zustand persist
- Wired SDK initialization into App.tsx after auth with loading gate for native
- Added logoutFromRevenueCat call and subscription state reset to authStore signOut
- Added In-App Purchase capability to iOS entitlements file

## Task Commits

Each task was committed atomically:

1. **Task 1: Install RevenueCat SDK and create subscriptionStore** - `42a2ed6c` (feat)
2. **Task 2: Wire SDK initialization into App.tsx and add Xcode entitlements** - `014c6391` (feat)

## Files Created/Modified

- `src/lib/revenuecat.ts` - SDK initialization helpers with isNative guards
- `src/stores/subscriptionStore.ts` - Zustand store with isPremium, purchase, restore actions
- `src/stores/index.ts` - Export useSubscriptionStore
- `src/App.tsx` - Initialize RevenueCat after auth, subscription loading gate
- `src/stores/authStore.ts` - Call logoutFromRevenueCat and reset subscription on sign out
- `ios/App/App/App.entitlements` - Added In-App Purchase capability
- `package.json`, `package-lock.json` - Added @revenuecat/purchases-capacitor

## Decisions Made

- Set `ENTITLEMENT_ID = 'premium'` - this must match the entitlement configured in RevenueCat dashboard
- Only persist `isPremium` to localStorage, not offerings or customerInfo (these are fetched fresh on app launch)
- Subscription loading gate only blocks on native with authenticated user - web bypasses immediately

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed RevenueCat type mismatches**
- **Found during:** Task 1 (subscriptionStore creation)
- **Issue:** `getOfferings()` returns `PurchasesOfferings` directly, not `{ offerings }`. Error code is `PURCHASE_CANCELLED_ERROR` not `PURCHASE_CANCELLED`.
- **Fix:** Updated destructuring and error code constant to match actual SDK types
- **Files modified:** src/stores/subscriptionStore.ts
- **Verification:** Build passes
- **Committed in:** 42a2ed6c (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor type fix required to match actual SDK API. No scope creep.

## Issues Encountered

None - plan executed as specified.

## User Setup Required

**External services require manual configuration.** See [19-USER-SETUP.md](./19-USER-SETUP.md) for:
- Environment variable: `VITE_REVENUECAT_IOS_API_KEY`
- RevenueCat project setup and entitlements configuration
- App Store Connect subscription product creation
- Xcode In-App Purchase capability enablement

## Next Phase Readiness

- SDK infrastructure complete, ready for Plan 02 (Paywall Screen)
- Future plans can import `useSubscriptionStore` and check `isPremium`
- USER-SETUP.md must be completed before testing subscription flow on device

---
*Phase: 19-subscriptions*
*Completed: 2026-02-28*

## Self-Check: PASSED

All files verified:
- src/lib/revenuecat.ts: FOUND
- src/stores/subscriptionStore.ts: FOUND
- 19-USER-SETUP.md: FOUND
- Commit 42a2ed6c: FOUND
- Commit 014c6391: FOUND
