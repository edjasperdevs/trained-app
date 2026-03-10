---
status: resolved
trigger: "Investigate root cause of Issue 1 from app audit. Existing user incorrectly routed to onboarding"
created: 2026-03-09T00:00:00Z
updated: 2026-03-10T08:10:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Profile exists in database but not loaded into local state before routing check
test: complete - analyzed routing, sync, and database schema
expecting: FOUND - Race condition between auth initialization and profile loading
next_action: diagnosis complete

## Symptoms

expected: Existing user (CoachJasper@WellTrained.Fitness) should skip onboarding and go directly to Home dashboard
actual: After signing in, user was routed to onboarding flow despite having existing account
errors: None reported
reproduction: Sign in as CoachJasper@WellTrained.Fitness
started: Unknown - reported in audit

## Eliminated

- hypothesis: onboardingComplete flag not set in database
  evidence: Database schema shows field exists and sync.ts properly reads it
  timestamp: 2026-03-09T00:05:00Z

- hypothesis: Profile data not persisted to database
  evidence: syncProfileToCloud uses upsert with onConflict handling, properly saves onboarding_complete
  timestamp: 2026-03-09T00:05:00Z

## Evidence

- timestamp: 2026-03-09T00:01:00Z
  checked: App.tsx routing logic (lines 289-301)
  found: Routes based on `profile` from useUserStore and checks `profile.onboardingComplete`
  implication: Routing decision depends on local zustand state, not database

- timestamp: 2026-03-09T00:02:00Z
  checked: userStore.ts persistence (lines 93-96, 423-426)
  found: Profile stored in zustand with persist middleware, storage key 'gamify-gains-user'
  implication: Profile is persisted to localStorage, but must be loaded on auth

- timestamp: 2026-03-09T00:03:00Z
  checked: authStore.ts signIn flow (lines 109-149)
  found: After successful signIn, calls `get().syncData()` to sync profile
  implication: Profile loading happens AFTER auth completes

- timestamp: 2026-03-09T00:04:00Z
  checked: authStore.ts syncData implementation (lines 226-256)
  found: Calls `loadAllFromCloud()` which includes `loadProfileFromCloud()`
  implication: Profile is loaded from cloud, but happens asynchronously

- timestamp: 2026-03-09T00:05:00Z
  checked: sync.ts loadProfileFromCloud (lines 153-204)
  found: Queries database for profile, only loads if `onboarding_complete === true` (line 170)
  implication: CRITICAL - Profile will only be loaded from cloud if onboarding_complete is true

- timestamp: 2026-03-09T00:06:00Z
  checked: App.tsx auth initialization and routing (lines 47-60, 243-300)
  found: Auth loads first, then routing checks happen immediately based on profile state
  implication: RACE CONDITION - Routing renders before syncData completes

- timestamp: 2026-03-09T00:07:00Z
  checked: App.tsx routing condition (line 290)
  found: `if (!devBypass && (!profile || !profile.onboardingComplete))`
  implication: If profile is null OR onboardingComplete is false, shows OnboardingStack

- timestamp: 2026-03-09T00:08:00Z
  checked: authStore.ts initialize vs signIn timing
  found: initialize() sets isLoading=false immediately after getSession, signIn() calls syncData() but doesn't wait
  implication: App renders with user authenticated but profile=null before sync completes

## Resolution

root_cause: Race condition between authentication and profile loading causes existing users to be routed to onboarding

**Detailed Analysis:**

The routing logic in App.tsx (line 290) checks if profile exists and if onboardingComplete is true:
```typescript
if (!devBypass && (!profile || !profile.onboardingComplete)) {
  return <OnboardingStack />
}
```

When an existing user signs in:

1. **authStore.signIn()** (line 109-149):
   - Authenticates with Supabase (line 115-118)
   - Sets user and session in state (line 137)
   - Calls `get().syncData()` (line 141) - but does NOT await it
   - Returns immediately

2. **Auth state updates**:
   - App.tsx sees user is authenticated
   - Stops showing loading spinner (authLoading = false)
   - Proceeds to render main app routes

3. **Routing decision happens**:
   - `profile` from userStore is checked (line 47)
   - On fresh login, profile may be null (not loaded from cloud yet)
   - Even with localStorage persistence, if logging in from different device or cleared storage
   - Condition evaluates to true: `!profile` → shows OnboardingStack

4. **syncData() completes later**:
   - `loadAllFromCloud()` runs asynchronously (line 235)
   - `loadProfileFromCloud()` fetches from database (sync.ts line 153-204)
   - Profile loaded into userStore (line 189-199)
   - But routing already happened - user stuck in onboarding

**The Critical Timing Issue:**
- authStore sets `isSyncing: true` when syncData starts (line 232)
- But App.tsx doesn't check `isSyncing` before routing decision
- App only checks `authLoading` (line 244), not `isSyncing`
- This means: authenticated user with no local profile → onboarding route

**Why This Affects Existing Users:**
- Fresh login on new device: no localStorage persistence
- Cleared browser data: localStorage wiped
- Different browser: profile not persisted there
- Account switching: previous user's profile in localStorage
- All these scenarios: profile is null until sync completes

fix: Add isSyncing check to routing logic before checking profile state
verification: App now shows loading state while sync in progress, doesn't make routing decision until profile loaded
files_changed: ['/Users/ejasper/code/welltrained-platform/trained-app/src/App.tsx']
resolved_at: 2026-03-10T08:10:00Z
resolution_summary: Added isSyncing check in App.tsx lines 292-315. When authenticated user has no profile loaded yet, app now checks if sync is in progress and shows loading spinner instead of immediately routing to onboarding. This prevents race condition where existing users were sent to onboarding before their profile loaded from cloud.
