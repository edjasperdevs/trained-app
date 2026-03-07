---
phase: 42-referral-system
plan: 03
subsystem: deep-linking
tags: [referrals, deep-links, universal-links, zustand, capacitor, aasa]

# Dependency graph
requires:
  - phase: 42-referral-system
    provides: referralStore with referral code generation and tracking
provides:
  - Deep link handler for /join/{CODE} referral capture
  - Referral attribution after signup completion
  - AASA configuration for iOS Universal Links
affects: [referral-rewards, analytics, user-acquisition]

# Tech tracking
tech-stack:
  added: []
  patterns: [zustand partialize for selective persistence, fire-and-forget attribution]

key-files:
  created: []
  modified:
    - src/lib/deep-link.ts
    - src/stores/referralStore.ts
    - src/screens/auth-screens/SignUpScreen.tsx
    - src/screens/auth-screens/EmailSignUpScreen.tsx
    - public/.well-known/apple-app-site-association

key-decisions:
  - "Referral code captured before auth flow completes, attributed after signup"
  - "Attribution is fire-and-forget to not block signup UX"
  - "capturedReferralCode persisted via zustand partialize for app restart resilience"

patterns-established:
  - "Pre-auth data capture: Store referral code in localStorage before user authenticates"
  - "Fire-and-forget attribution: Call attributeReferral without awaiting to avoid blocking"

requirements-completed: [REFR-07]

# Metrics
duration: 8min
completed: 2026-03-07
---

# Phase 42 Plan 03: Deep Link Capture Summary

**Referral deep link capture via /join/{CODE} with localStorage persistence and fire-and-forget attribution after signup**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-07T14:21:03Z
- **Completed:** 2026-03-07T14:29:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Implemented setCapturedCode, clearCapturedCode, and attributeReferral in referralStore
- Added /join/* deep link handling to capture referral codes and redirect to signup
- Integrated referral attribution into Apple, Google, and Email signup flows
- Updated AASA file to enable iOS Universal Links for referral URLs

## Task Commits

Each task was committed atomically:

1. **Task 1: Add referral code capture to deep-link handler** - `5d913a16` (feat)
2. **Task 2: Trigger attribution after successful signup** - `bd92af11` (feat)
3. **Task 3: Update AASA for /join/* Universal Links** - `5965d703` (chore)

**Plan metadata:** (pending)

## Files Created/Modified
- `src/lib/deep-link.ts` - Added /join/* handler to capture referral code and navigate to signup
- `src/stores/referralStore.ts` - Implemented setCapturedCode, clearCapturedCode, attributeReferral with zustand persist partialize
- `src/screens/auth-screens/SignUpScreen.tsx` - Added referral attribution to Apple/Google sign-in handlers
- `src/screens/auth-screens/EmailSignUpScreen.tsx` - Added referral attribution to email signup handler
- `public/.well-known/apple-app-site-association` - Added /join/* pattern for Universal Links

## Decisions Made
- Used zustand partialize to persist only capturedReferralCode (not full store state)
- Fire-and-forget pattern for attributeReferral to avoid blocking signup flow
- Code validation requires hyphen and CALLSIGN-XXXX format before storing
- Self-referral blocked in attributeReferral to prevent abuse

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Referral deep link capture complete
- Ready for Phase 43 (Referral Rewards) to implement DP award logic
- Universal Links will require AASA deployment to production server

## Self-Check: PASSED

All files and commits verified:
- FOUND: src/lib/deep-link.ts
- FOUND: src/stores/referralStore.ts
- FOUND: src/screens/auth-screens/SignUpScreen.tsx
- FOUND: src/screens/auth-screens/EmailSignUpScreen.tsx
- FOUND: public/.well-known/apple-app-site-association
- FOUND: 5d913a16 (Task 1 commit)
- FOUND: bd92af11 (Task 2 commit)
- FOUND: 5965d703 (Task 3 commit)

---
*Phase: 42-referral-system*
*Completed: 2026-03-07*
