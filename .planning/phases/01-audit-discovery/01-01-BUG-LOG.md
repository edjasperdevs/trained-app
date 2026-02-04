# Trained App - Bug Log

**Plan:** 01-01
**Date:** 2026-02-04
**Audit Type:** Automated code analysis + manual verification

---

## Severity & Priority Matrix

### Severity (Impact)

| Level | Description | Examples |
|-------|-------------|----------|
| **Critical** | App unusable, data loss, security issue | Crash on launch, data corruption, auth bypass |
| **High** | Major feature broken, poor workaround | Can't complete workout, macros don't save |
| **Medium** | Feature impaired but usable | Slow performance, minor calculation errors |
| **Low** | Cosmetic, minor inconvenience | Typo, slight misalignment, color off |

### Priority (Urgency)

| Level | Description | Timeline |
|-------|-------------|----------|
| **P1** | Must fix before launch | This week |
| **P2** | Should fix for launch | Within 2 weeks |
| **P3** | Nice to fix for launch | If time permits |
| **P4** | Post-launch improvement | Backlog |

---

## Bug Log

### BUG-001: Environment Variables Corrupted with Newlines

**Severity:** Critical
**Priority:** P1
**Phase Assignment:** Phase 2
**Status:** FIXED

**Environment:**
- Device: All
- File: `.env.production.local`

**Steps to Reproduce:**
1. Enter access code EARLYADOPTER
2. Code validation fails

**Expected Behavior:**
Access code accepted

**Actual Behavior:**
Code rejected because env var contains literal `\n` characters

**Resolution:**
Fixed by removing `\n` from all VITE_ variables in `.env.production.local`

---

### BUG-002: Access Code Validation Security Flaw

**Severity:** Critical
**Priority:** P1
**Phase Assignment:** Phase 4
**Status:** Open

**Environment:**
- File: `src/stores/accessStore.ts` (lines 166-173)

**Steps to Reproduce:**
1. Enter wrong code while online, get rejection
2. Go offline
3. Try same wrong code
4. Network error fallback may cache invalid code

**Expected Behavior:**
Invalid codes should never be cached as valid

**Actual Behavior:**
Fallback logic (line 171-172) could cache wrong code if it matches previously attempted code

**Console Errors:**
Network error handling may mask the invalid code state

---

### BUG-003: Streak Reset Timezone Off-by-One Error

**Severity:** Critical
**Priority:** P1
**Phase Assignment:** Phase 2
**Status:** Open

**Environment:**
- File: `src/stores/userStore.ts` (lines 119-150)

**Steps to Reproduce:**
1. Check in at 11:59 PM in local timezone
2. Check in at 12:01 AM the next day
3. Streak doesn't increment (both are same UTC day)

**Expected Behavior:**
Streak increments for consecutive local days

**Actual Behavior:**
Date calculation uses UTC, not local timezone. Users near midnight boundary lose streaks.

**Impact:**
Core gamification mechanic broken for users who work out late at night

---

### BUG-004: Auth Error Messages Unclear for Unconfirmed Users

**Severity:** High
**Priority:** P1
**Phase Assignment:** Phase 4
**Status:** Open

**Environment:**
- File: `src/screens/Auth.tsx` (lines 85-92)

**Steps to Reproduce:**
1. Sign up with email
2. Don't confirm email
3. Try to sign in

**Expected Behavior:**
"Please confirm your email before signing in"

**Actual Behavior:**
Generic "Invalid email or password" message

---

### BUG-005: Macro Target Mismatch When Changed Mid-Day

**Severity:** High
**Priority:** P2
**Phase Assignment:** Phase 2
**Status:** Open

**Environment:**
- File: `src/stores/macroStore.ts` (lines 132-162)

**Steps to Reproduce:**
1. Log breakfast with 2000 cal target
2. Change target to 1800 cal
3. Progress shows incorrect percentage

**Expected Behavior:**
Previously logged meals recalculated or warning shown

**Actual Behavior:**
Silent data inconsistency

---

### BUG-006: XP Claim Has Timezone Bug

**Severity:** High
**Priority:** P1
**Phase Assignment:** Phase 4
**Status:** Open

**Environment:**
- File: `src/stores/xpStore.ts` (lines 142-160)

**Steps to Reproduce:**
1. Claim XP on Sunday 11 PM EST
2. Next Sunday 1 AM EST (actually same UTC day)
3. Can't claim because "already claimed this week"

**Expected Behavior:**
Weekly claim based on local week boundaries

**Actual Behavior:**
UTC-based calculation creates inconsistent claim windows

---

### BUG-007: No Validation on Workout Set Data

**Severity:** High
**Priority:** P2
**Phase Assignment:** Phase 2
**Status:** Open

**Environment:**
- File: `src/stores/workoutStore.ts` (logSet function)

**Steps to Reproduce:**
1. Log a set with -10 reps or 0 weight
2. Data saved to history

**Expected Behavior:**
Reject negative/zero values

**Actual Behavior:**
Invalid data corrupts workout history and PR calculations

---

### BUG-008: localStorage Migration Has No Schema Validation

**Severity:** High
**Priority:** P2
**Phase Assignment:** Phase 4
**Status:** Open

**Environment:**
- Files: All stores using Zustand persist middleware

**Steps to Reproduce:**
1. Have old version of app data in localStorage
2. Update app
3. Old schema loaded without validation

**Expected Behavior:**
Schema migration or validation on load

**Actual Behavior:**
Corrupted/old data loads silently, app behaves unpredictably

---

### BUG-009: Missing Loading State on Macro Calculator

**Severity:** Medium
**Priority:** P2
**Phase Assignment:** Phase 3
**Status:** Open

**Environment:**
- File: `src/screens/Macros.tsx` (lines 98-108)

**Steps to Reproduce:**
1. Click calculate macros
2. No loading indicator

**Expected Behavior:**
Button shows loading state

**Actual Behavior:**
Button appears unresponsive, users click multiple times

---

### BUG-010: Onboarding Progress Not Persisted

**Severity:** Medium
**Priority:** P2
**Phase Assignment:** Phase 3
**Status:** Open

**Environment:**
- File: `src/screens/Onboarding.tsx`

**Steps to Reproduce:**
1. Complete steps 1-7 of onboarding
2. Close browser
3. Reopen app

**Expected Behavior:**
Resume at step 7

**Actual Behavior:**
Start over from step 1 - all progress lost

---

### BUG-011: No React Error Boundaries

**Severity:** Medium
**Priority:** P2
**Phase Assignment:** Phase 4
**Status:** Open

**Environment:**
- File: `src/App.tsx`

**Steps to Reproduce:**
1. Any component throws runtime error
2. App crashes to white screen

**Expected Behavior:**
Error boundary catches error, shows fallback UI

**Actual Behavior:**
Complete app crash, poor user experience

---

### BUG-012: Sync Partial Failures Are Silent

**Severity:** Medium
**Priority:** P3
**Phase Assignment:** Phase 4
**Status:** Open

**Environment:**
- File: `src/lib/sync.ts` (lines 20-90)

**Steps to Reproduce:**
1. New user without server profile
2. Sync tries to update non-existent row
3. Fails silently

**Expected Behavior:**
Upsert logic or clear error reporting

**Actual Behavior:**
Local data appears synced but cloud is out of sync

---

### BUG-013: USDA API Demo Key Rate Limited

**Severity:** Medium
**Priority:** P1
**Phase Assignment:** Phase 4
**Status:** Open

**Environment:**
- File: `src/lib/foodApi.ts` (line 47)

**Steps to Reproduce:**
1. Don't set VITE_USDA_API_KEY
2. App falls back to DEMO_KEY
3. 90k users share rate limit

**Expected Behavior:**
Production API key configured

**Actual Behavior:**
Demo key has strict limits, food search fails under load

---

### BUG-014: Goal Weight Input Not Validated

**Severity:** Medium
**Priority:** P3
**Phase Assignment:** Phase 2
**Status:** Open

**Environment:**
- File: `src/screens/Onboarding.tsx` (GoalStep)

**Steps to Reproduce:**
1. Enter height: 5'0"
2. Enter weight: 1000 lbs
3. Macro calculation produces absurd numbers

**Expected Behavior:**
Validate for reasonable ranges

**Actual Behavior:**
Any value accepted, bad recommendations generated

---

### BUG-015: PWA Doesn't Cache Food Search Results

**Severity:** Medium
**Priority:** P3
**Phase Assignment:** Phase 4
**Status:** Open

**Environment:**
- File: `vite.config.ts` (workbox config)

**Steps to Reproduce:**
1. Search for food online
2. Go offline
3. Search for same food

**Expected Behavior:**
Previously searched foods available offline

**Actual Behavior:**
All food searches fail offline

---

### BUG-016: Avatar Evolution Not Synced to Cloud

**Severity:** Medium
**Priority:** P3
**Phase Assignment:** Phase 4
**Status:** Open

**Environment:**
- File: `src/lib/sync.ts`

**Steps to Reproduce:**
1. Evolve avatar on device A
2. Sign in on device B
3. Avatar is at old evolution stage

**Expected Behavior:**
Avatar state syncs across devices

**Actual Behavior:**
Only profile/XP sync, avatar evolution lost

---

### BUG-017: Check-In Animation Performance on Slow Devices

**Severity:** Low
**Priority:** P3
**Phase Assignment:** Phase 3
**Status:** Open

**Environment:**
- File: `src/screens/CheckInModal.tsx` (lines 142-146)

**Steps to Reproduce:**
1. Complete check-in with 8+ animations
2. On slow device, animations stack up

**Expected Behavior:**
Smooth animation sequence

**Actual Behavior:**
Frame drops, modal appears stuck

---

### BUG-018: Timezone Handling Inconsistent Across App

**Severity:** High
**Priority:** P2
**Phase Assignment:** Phase 2
**Status:** Open

**Environment:**
- Files: `src/stores/userStore.ts`, `src/stores/xpStore.ts`, `src/screens/Home.tsx`

**Steps to Reproduce:**
1. Log workout at 11:55 PM local
2. Check XP at 12:05 AM local
3. Workout appears on different day than XP

**Expected Behavior:**
Consistent date handling across features

**Actual Behavior:**
Some code uses UTC, some uses local - data mismatch

---

### BUG-019: No Retry Logic for Cloud API Failures

**Severity:** Medium
**Priority:** P2
**Phase Assignment:** Phase 4
**Status:** Open

**Environment:**
- Files: `src/lib/sync.ts`, `src/stores/authStore.ts`

**Steps to Reproduce:**
1. Supabase has brief outage
2. Sync attempt fails
3. No automatic retry

**Expected Behavior:**
Exponential backoff retry with queue

**Actual Behavior:**
Single failure = permanent sync failure until manual trigger

---

### BUG-020: Import Data Not Schema Validated

**Severity:** Medium
**Priority:** P3
**Phase Assignment:** Phase 4
**Status:** Open

**Environment:**
- Files: All stores with importData()

**Steps to Reproduce:**
1. Export data
2. Modify JSON to invalid schema
3. Import corrupted data

**Expected Behavior:**
Reject invalid imports with error message

**Actual Behavior:**
Corrupted data loaded, app behaves unpredictably

---

### BUG-021: Unit Tests Fail Due to Missing ThemeProvider

**Severity:** Medium
**Priority:** P2
**Phase Assignment:** Phase 2
**Status:** Open

**Environment:**
- Files: `src/components/*.test.tsx`

**Steps to Reproduce:**
1. Run `npm run test:run`
2. 42 tests fail

**Expected Behavior:**
All tests pass

**Actual Behavior:**
Component tests don't wrap with ThemeProvider, 42/138 tests fail

---

## Bug Summary

| Bug ID | Description | Severity | Priority | Phase | Status |
|--------|-------------|----------|----------|-------|--------|
| BUG-001 | Env vars corrupted with newlines | Critical | P1 | 2 | FIXED |
| BUG-002 | Access code security flaw | Critical | P1 | 4 | Open |
| BUG-003 | Streak timezone off-by-one | Critical | P1 | 2 | Open |
| BUG-004 | Auth error messages unclear | High | P1 | 4 | Open |
| BUG-005 | Macro target mid-day mismatch | High | P2 | 2 | Open |
| BUG-006 | XP claim timezone bug | High | P1 | 4 | Open |
| BUG-007 | No workout set validation | High | P2 | 2 | Open |
| BUG-008 | No localStorage schema validation | High | P2 | 4 | Open |
| BUG-009 | Missing macro calc loading state | Medium | P2 | 3 | Open |
| BUG-010 | Onboarding progress not persisted | Medium | P2 | 3 | Open |
| BUG-011 | No React error boundaries | Medium | P2 | 4 | Open |
| BUG-012 | Sync partial failures silent | Medium | P3 | 4 | Open |
| BUG-013 | USDA API demo key rate limited | Medium | P1 | 4 | Open |
| BUG-014 | Goal weight not validated | Medium | P3 | 2 | Open |
| BUG-015 | PWA doesn't cache food search | Medium | P3 | 4 | Open |
| BUG-016 | Avatar evolution not synced | Medium | P3 | 4 | Open |
| BUG-017 | Check-in animation performance | Low | P3 | 3 | Open |
| BUG-018 | Timezone handling inconsistent | High | P2 | 2 | Open |
| BUG-019 | No retry logic for cloud API | Medium | P2 | 4 | Open |
| BUG-020 | Import data not validated | Medium | P3 | 4 | Open |
| BUG-021 | Unit tests fail (ThemeProvider) | Medium | P2 | 2 | Open |

---

## Statistics

| Category | Count |
|----------|-------|
| Total Bugs | 21 |
| Critical | 3 |
| High | 6 |
| Medium | 11 |
| Low | 1 |
| P1 | 6 |
| P2 | 10 |
| P3 | 5 |
| P4 | 0 |
| Fixed | 1 |

---

*Bug log created: 2026-02-04*
*Last updated: 2026-02-04*
