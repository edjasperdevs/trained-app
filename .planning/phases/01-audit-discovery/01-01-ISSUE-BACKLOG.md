# Trained App - Issue Backlog

**Plan:** 01-01
**Date:** 2026-02-04
**Source:** Automated audit + code analysis

---

## Urgency Categories

| Category | Description | Action |
|----------|-------------|--------|
| **NOW** | Blocks launch, must fix immediately | Fix before any other work |
| **DAY1** | Critical for first impressions | Fix before launch day |
| **WEEK** | Should fix for launch week | Address as time permits |
| **BACKLOG** | Post-launch improvements | Track for future |

---

## NOW - Launch Blockers

These issues will cause immediate user frustration or app failure.

### ISSUE-001: Streak Timezone Off-by-One (BUG-003)

**Priority:** P1 | **Severity:** Critical
**File:** `src/stores/userStore.ts` (lines 119-150)

**Problem:** Streak calculation uses UTC dates, not local timezone. Users who work out late at night (11 PM - midnight) lose their streaks even when checking in on consecutive local days.

**Impact:** Core gamification mechanic broken. Users who notice will be frustrated and may abandon the app.

**Fix Required:**
- Convert all date comparisons to user's local timezone
- Use `startOfDay()` with timezone-aware date library (date-fns-tz or dayjs)
- Test with timezone offsets (-12 to +14)

**Acceptance Criteria:**
- [ ] Check-in at 11:59 PM Day 1 + 12:01 AM Day 2 = streak continues
- [ ] Works for all major timezone offsets
- [ ] Existing streak data not corrupted

---

### ISSUE-002: XP Claim Timezone Bug (BUG-006)

**Priority:** P1 | **Severity:** High
**File:** `src/stores/xpStore.ts` (lines 142-160)

**Problem:** Weekly XP claim uses UTC week boundaries. Users in EST/PST experience inconsistent claim windows - may not be able to claim on "their" Sunday.

**Impact:** Users expect weekly claim to reset on their local Sunday midnight. UTC mismatch creates confusion.

**Fix Required:**
- Calculate week start/end in local timezone
- Consistent week boundary logic with streak calculation

**Acceptance Criteria:**
- [ ] Weekly claim resets at local Sunday midnight
- [ ] Claim window is exactly 7 local days
- [ ] Edge cases: timezone change mid-week handled

---

### ISSUE-003: Unit Tests Failing (BUG-021)

**Priority:** P2 | **Severity:** Medium
**File:** `src/components/*.test.tsx`

**Problem:** 42 of 138 unit tests fail because component tests don't wrap with ThemeProvider.

**Impact:** Can't verify code quality, may ship broken components.

**Fix Required:**
- Create test utility that wraps components with required providers
- Update all failing tests to use wrapper
- Add to test setup for future tests

**Acceptance Criteria:**
- [ ] All 138 tests pass
- [ ] Test utility documented for future use

---

## DAY1 - First Impression Critical

These affect the first-time user experience.

### ISSUE-004: Auth Error Messages Unclear (BUG-004)

**Priority:** P1 | **Severity:** High
**File:** `src/screens/Auth.tsx` (lines 85-92)

**Problem:** Unconfirmed email users get "Invalid email or password" instead of "Please confirm your email."

**Impact:** Users who signed up but didn't confirm are confused. They may reset password unnecessarily or abandon.

**Fix Required:**
- Check Supabase error code for unconfirmed email
- Display specific message: "Please check your email and confirm your account"
- Add resend confirmation option

**Acceptance Criteria:**
- [ ] Unconfirmed user sees email confirmation message
- [ ] Can resend confirmation email
- [ ] Other auth errors still show appropriate messages

---

### ISSUE-005: Onboarding Progress Not Persisted (BUG-010)

**Priority:** P2 | **Severity:** Medium
**File:** `src/screens/Onboarding.tsx`

**Problem:** Completing 7 of 8 onboarding steps, closing browser, reopening = back to step 1.

**Impact:** Long onboarding (8 steps) + lost progress = high abandonment risk.

**Fix Required:**
- Save current step to localStorage after each step
- Resume from saved step on reload
- Clear saved step after completion

**Acceptance Criteria:**
- [ ] Step progress persists across refresh
- [ ] Step progress persists across browser close/open
- [ ] Completed onboarding clears saved step

---

### ISSUE-006: Missing Macro Calculator Loading State (BUG-009)

**Priority:** P2 | **Severity:** Medium
**File:** `src/screens/Macros.tsx` (lines 98-108)

**Problem:** Calculate button has no loading indicator. Users click multiple times.

**Impact:** Poor perceived performance. Potential duplicate submissions.

**Fix Required:**
- Add isCalculating state
- Disable button during calculation
- Show spinner or loading text

**Acceptance Criteria:**
- [ ] Button shows loading state during calculation
- [ ] Button disabled to prevent duplicate clicks
- [ ] Loading clears on success or error

---

### ISSUE-007: No Workout Set Validation (BUG-007)

**Priority:** P2 | **Severity:** High
**File:** `src/stores/workoutStore.ts` (logSet function)

**Problem:** Can log negative reps (-10) or zero weight. Corrupts workout history and PR calculations.

**Impact:** Bad data permanently in history. PRs become meaningless.

**Fix Required:**
- Validate: reps > 0, weight >= 0
- Reject invalid values with user feedback
- Consider max reasonable limits (e.g., reps < 1000)

**Acceptance Criteria:**
- [ ] Negative reps rejected
- [ ] Zero/negative weight rejected (unless bodyweight)
- [ ] Clear error message shown

---

## WEEK - Launch Week Polish

Address during launch week as time permits.

### ISSUE-008: Timezone Handling Inconsistent (BUG-018)

**Priority:** P2 | **Severity:** High
**Files:** `src/stores/userStore.ts`, `src/stores/xpStore.ts`, `src/screens/Home.tsx`

**Problem:** Different features use different date handling - some UTC, some local. Data appears on different days depending on feature.

**Fix Required:**
- Audit all date/time usage
- Standardize on local timezone with utility functions
- Create date utility module

**Acceptance Criteria:**
- [ ] All user-facing dates use local timezone
- [ ] Server sync uses UTC internally
- [ ] Utility module prevents future inconsistencies

---

### ISSUE-009: Macro Target Mid-Day Mismatch (BUG-005)

**Priority:** P2 | **Severity:** High
**File:** `src/stores/macroStore.ts` (lines 132-162)

**Problem:** Changing daily macro target mid-day shows incorrect progress percentages.

**Fix Required:**
- Either recalculate progress against new target
- Or warn user that change applies tomorrow
- Document expected behavior

**Acceptance Criteria:**
- [ ] Behavior is intentional and documented
- [ ] User understands when change takes effect

---

### ISSUE-010: No React Error Boundaries (BUG-011)

**Priority:** P2 | **Severity:** Medium
**File:** `src/App.tsx`

**Problem:** Any component error = white screen of death.

**Fix Required:**
- Add ErrorBoundary component at App level
- Show fallback UI with retry option
- Log errors to Sentry

**Acceptance Criteria:**
- [ ] Component errors show fallback UI
- [ ] User can retry/refresh
- [ ] Error logged for debugging

---

### ISSUE-011: Goal Weight Not Validated (BUG-014)

**Priority:** P3 | **Severity:** Medium
**File:** `src/screens/Onboarding.tsx` (GoalStep)

**Problem:** Can enter 1000 lbs weight, produces absurd macro recommendations.

**Fix Required:**
- Validate weight in reasonable range (e.g., 50-500 lbs)
- Validate height in reasonable range
- Show warning for edge values

**Acceptance Criteria:**
- [ ] Unreasonable weights rejected
- [ ] Reasonable warnings for borderline values

---

### ISSUE-012: localStorage Migration Missing (BUG-008)

**Priority:** P2 | **Severity:** High
**Files:** All Zustand stores with persist middleware

**Problem:** No schema migration for localStorage data. Old versions load silently and may corrupt state.

**Fix Required:**
- Add version number to each store
- Add migration functions for version upgrades
- Validate schema on load

**Acceptance Criteria:**
- [ ] Stores have version numbers
- [ ] Invalid schemas reset to defaults
- [ ] Migration path for schema changes

---

## BACKLOG - Post-Launch

Track for future improvement.

### ISSUE-013: Access Code Security Flaw (BUG-002)

**Priority:** P1 | **Severity:** Critical
**File:** `src/stores/accessStore.ts` (lines 166-173)

**Problem:** Network error fallback could cache wrong code if previously attempted.

**Note:** Low real-world risk if Lemon Squeezy API is configured. Monitor for abuse.

---

### ISSUE-014: USDA API Demo Key (BUG-013)

**Priority:** P1 | **Severity:** Medium
**File:** `src/lib/foodApi.ts` (line 47)

**Problem:** Falls back to DEMO_KEY with strict rate limits.

**Action:** Configure production USDA API key before launch.

---

### ISSUE-015: No Cloud API Retry Logic (BUG-019)

**Priority:** P2 | **Severity:** Medium
**Files:** `src/lib/sync.ts`, `src/stores/authStore.ts`

**Problem:** Single failure = sync broken until manual retry.

---

### ISSUE-016: Sync Partial Failures Silent (BUG-012)

**Priority:** P3 | **Severity:** Medium
**File:** `src/lib/sync.ts` (lines 20-90)

---

### ISSUE-017: PWA Doesn't Cache Food Search (BUG-015)

**Priority:** P3 | **Severity:** Medium
**File:** `vite.config.ts`

---

### ISSUE-018: Avatar Evolution Not Synced (BUG-016)

**Priority:** P3 | **Severity:** Medium
**File:** `src/lib/sync.ts`

---

### ISSUE-019: Import Data Not Validated (BUG-020)

**Priority:** P3 | **Severity:** Medium
**Files:** All stores with importData()

---

### ISSUE-020: Check-In Animation Performance (BUG-017)

**Priority:** P3 | **Severity:** Low
**File:** `src/screens/CheckInModal.tsx` (lines 142-146)

---

---

## Summary by Urgency

| Urgency | Count | Description |
|---------|-------|-------------|
| NOW | 3 | Timezone bugs (streak + XP), failing tests |
| DAY1 | 4 | Auth UX, onboarding persistence, loading states, validation |
| WEEK | 5 | Timezone consistency, error boundaries, migrations |
| BACKLOG | 8 | Security, API config, sync improvements, caching |

**Total Issues:** 20 (BUG-001 already fixed)

---

## Recommended Fix Order

1. **ISSUE-001 + ISSUE-002 + ISSUE-008** - Timezone bugs (fix together with shared utility)
2. **ISSUE-003** - Fix tests so we can verify other fixes
3. **ISSUE-004** - Auth error messages (first-time user critical)
4. **ISSUE-005** - Onboarding persistence (abandonment risk)
5. **ISSUE-007** - Workout validation (data integrity)
6. **ISSUE-006** - Loading states (polish)
7. **ISSUE-010** - Error boundaries (crash protection)

---

*Issue backlog created: 2026-02-04*
*Last updated: 2026-02-04*
