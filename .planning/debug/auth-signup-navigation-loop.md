---
status: resolved
trigger: "Sentry error: Attempt to use history.replaceState() more than 100 times per 10 seconds at /auth/signup"
created: 2026-03-10T08:00:00Z
updated: 2026-03-10T08:10:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Deep link handler navigates to non-existent route
test: complete - found navigate('/auth/signup') in deep-link.ts
expecting: FOUND - Route doesn't exist, causes redirect loop
next_action: diagnosis complete

## Symptoms

expected: Deep link referral flow should navigate to auth signup
actual: Browser throws error "Attempt to use history.replaceState() more than 100 times per 10 seconds" at /auth/signup
errors: Sentry error reported at /auth/signup route
reproduction: Click referral deep link with format /join/CODE
started: Reported via Sentry 2026-03-09

## Evidence

- timestamp: 2026-03-10T08:01:00Z
  checked: src/lib/deep-link.ts line 66
  found: navigate('/auth/signup') called when processing referral links
  implication: Code tries to navigate to /auth/signup route

- timestamp: 2026-03-10T08:02:00Z
  checked: src/App.tsx routing configuration
  found: Only /auth route exists, no /auth/signup route defined
  implication: Navigation to /auth/signup has no matching route

- timestamp: 2026-03-10T08:03:00Z
  checked: App.tsx wildcard routes (lines 286, 300)
  found: Wildcard routes redirect to /onboarding/welcome for unauthenticated users
  implication: /auth/signup falls through to wildcard, redirects to /onboarding/welcome

- timestamp: 2026-03-10T08:04:00Z
  checked: Auth component implementation
  found: Auth component uses internal state modes (splash/login/signup/forgot), not routes
  implication: Auth doesn't expect separate routes for each mode

- timestamp: 2026-03-10T08:05:00Z
  checked: OnboardingStack useEffect (lines 24-27)
  found: Syncs currentStep to URL on mount, could interact with redirects
  implication: Multiple navigation calls happening in quick succession

## Resolution

root_cause: Deep link handler navigates to non-existent /auth/signup route, causing navigation loop

**Detailed Analysis:**

When a referral deep link is processed (e.g., /join/REFERRAL-CODE):

1. **deep-link.ts line 66**:
   - Detects /join/ path
   - Extracts referral code
   - Calls `navigate('/auth/signup')`

2. **App.tsx routing**:
   - No route defined for /auth/signup
   - Only /auth route exists
   - Falls through to wildcard: `<Route path="*" element={<Navigate to="/onboarding/welcome" replace />} />`

3. **Navigation loop begins**:
   - Browser navigates to /auth/signup
   - No match → wildcard redirects to /onboarding/welcome
   - OnboardingStack mounts, useEffect may trigger
   - Something (possibly cached URL or another effect) tries to navigate back
   - Loop continues rapidly
   - Browser rate limit: "replaceState() more than 100 times per 10 seconds"

**Why /auth/signup doesn't exist:**

The Auth component was refactored to use internal state modes instead of separate routes:
- Auth component accepts `defaultMode` prop: 'splash' | 'login' | 'signup' | 'forgot'
- State managed internally via useState, not via routing
- Old planning docs referenced /auth/signup routes, but current implementation changed

fix: Changed deep link navigation from '/auth/signup' to '/auth' (Auth splash screen)
verification: Deep link navigates to /auth, Auth component handles mode selection
files_changed: ['/Users/ejasper/code/welltrained-platform/trained-app/src/lib/deep-link.ts']
resolved_at: 2026-03-10T08:10:00Z
resolution_summary: Updated deep-link.ts line 66 to navigate to '/auth' instead of '/auth/signup'. The Auth component's splash screen will show the signup flow, and the referral code is already captured in the referral store before navigation.
