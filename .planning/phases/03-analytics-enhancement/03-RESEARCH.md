# Phase 3: Analytics Enhancement - Research

**Researched:** 2026-02-07
**Domain:** Plausible Analytics event tracking, SPA pageview tracking, funnel analysis
**Confidence:** HIGH

## Summary

This phase is about wiring up the 14 already-defined-but-unused Plausible analytics events in `src/lib/analytics.ts`, establishing a naming convention, adding SPA pageview tracking, and documenting funnel definitions. The work is straightforward because the analytics infrastructure is already in place: Plausible's `script.js` is loaded in `index.html`, the `trackEvent()` wrapper and all 22 pre-defined event methods exist in `analytics.ts`, and 8 of those events are already wired into screens. The remaining 14 events just need their corresponding `analytics.*()` calls placed at the correct locations in the codebase.

Plausible's standard `script.js` already automatically tracks SPA pageviews for pushState-based routing (which react-router-dom v6 uses). This means the ANLYT-03 requirement may already be partially satisfied by the existing script. However, verification is needed, and if the current script does not fire on route changes (it should), the fallback is to use Plausible's `plausible('pageview')` manual call in a `useEffect` hook that listens to `useLocation()`.

Funnel analysis in Plausible requires pre-defined goals (events) to exist. Funnels are configured in the Plausible dashboard (2-8 steps each), not in code. The code-side work is ensuring every funnel step maps to a trackable event, and documenting which events correspond to which funnel steps.

**Primary recommendation:** Wire the 14 missing events, verify SPA pageviews, standardize event naming to Title Case with spaces (matching existing convention), and document funnel definitions as a markdown reference. No new dependencies needed.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Plausible script.js | Cloud-hosted | Privacy-friendly analytics | Already integrated, no cookies, GDPR-compliant |
| react-router-dom | ^6.22.3 | SPA routing | Already in use, pushState-based (Plausible auto-tracks) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @plausible-analytics/tracker | 0.4.4 | NPM tracker with `enableAutoPageviews()` | Only if standard script.js doesn't auto-track pushState navigation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Standard script.js (current) | @plausible-analytics/tracker npm | NPM package adds `enableAutoPageviews()` with explicit History API override, but the standard script.js already handles pushState. Only switch if verification shows script.js misses route changes. |
| Manual pageview calls | Plausible auto-tracking | Auto is better; only go manual if auto doesn't work |

**Installation:**
```bash
# No installation needed -- Plausible script.js is already loaded in index.html
# Only install if standard script.js fails SPA pageview verification:
# npm install @plausible-analytics/tracker
```

## Architecture Patterns

### Current Analytics Architecture
```
src/
├── lib/
│   └── analytics.ts       # trackEvent() wrapper + 22 pre-defined event methods
├── screens/
│   ├── Workouts.tsx        # ✅ 4 events wired (workoutStarted, quickWorkoutLogged, workoutCompleted x2)
│   ├── Onboarding.tsx      # ✅ 1 event wired (onboardingCompleted)
│   ├── CheckInModal.tsx    # ✅ 1 event wired (checkInCompleted)
│   ├── XPClaimModal.tsx    # ✅ 2 events wired (xpClaimed, levelUp)
│   ├── Auth.tsx            # ❌ 0 events (signupCompleted, loginCompleted missing)
│   ├── Home.tsx            # ❌ 0 events (appOpened missing)
│   ├── Macros.tsx          # ❌ 0 events (mealLogged, mealSaved, proteinTargetHit, calorieTargetHit missing)
│   ├── Settings.tsx        # ❌ 0 events (settingsViewed, dataExported missing)
│   ├── Achievements.tsx    # ❌ 0 events (achievementsViewed missing)
│   ├── AvatarScreen.tsx    # ❌ 0 events (avatarEvolved fires from XPClaimModal but not on screen visit)
│   └── Coach.tsx           # ❌ 0 events (coachDashboardViewed, clientViewed missing)
└── index.html              # Plausible script.js loaded with data-domain
```

### Pattern 1: Direct Call in Event Handler (Existing Pattern)
**What:** Call `analytics.*()` directly in the handler that triggers the user action.
**When to use:** User-initiated actions (button clicks, form submissions, completions).
**Example:**
```typescript
// Source: src/screens/Workouts.tsx (existing pattern)
const handleStartWorkout = () => {
  if (!todayWorkout) return
  startWorkout(todayWorkout.type, todayWorkout.dayNumber)
  setActiveWorkout(getCurrentWorkout())
  analytics.workoutStarted(todayWorkout.type)  // <-- fire after action
}
```

### Pattern 2: Screen View on Mount (New Pattern Needed)
**What:** Fire a "viewed" event when a screen component mounts.
**When to use:** Tracking screen visits (settingsViewed, achievementsViewed, coachDashboardViewed).
**Example:**
```typescript
// Fire once when component mounts
import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

export function Settings() {
  useEffect(() => {
    analytics.settingsViewed()
  }, [])
  // ... rest of component
}
```

### Pattern 3: SPA Pageview Tracking via useLocation
**What:** Track pageviews on route changes using react-router's `useLocation`.
**When to use:** Only if Plausible's built-in pushState interception doesn't fire correctly.
**Example:**
```typescript
// In App.tsx or a dedicated analytics component
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function usePageviewTracking() {
  const location = useLocation()
  useEffect(() => {
    // Plausible auto-tracks pushState, but this ensures coverage
    if (window.plausible) {
      window.plausible('pageview')
    }
  }, [location.pathname])
}
```

### Pattern 4: Side-Effect Tracking in Store Actions
**What:** Fire analytics from within Zustand store actions for events that trigger from store logic (like badge earned, avatar evolved).
**When to use:** When the event fires as a result of store state changes, not direct UI interaction.
**Note:** Currently `badgeEarned` and `avatarEvolved` are defined but never called. These fire from store-level logic (achievementsStore.checkAndAwardBadges, avatarStore.updateEvolutionStage). The cleanest approach is to fire them from the calling screen code right after the store action, not inside the store itself, to keep stores analytics-free.

### Anti-Patterns to Avoid
- **Analytics inside Zustand stores:** Stores should be pure state. Analytics calls belong in the UI layer that triggers the action.
- **Dynamic event names:** Never create event names with variable data (e.g., `trackEvent(`Workout ${type}`)`). Use properties instead (`trackEvent('Workout Started', { workout_type: type })`). The existing code already does this correctly.
- **Missing DEV guard:** The existing `trackEvent` already returns early in dev mode (`import.meta.env.DEV`). New code should always use `analytics.*()` methods, never raw `window.plausible()` calls.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SPA pageview tracking | Custom History API interception | Plausible script.js built-in pushState tracking | Plausible already intercepts `history.pushState` and `popstate` events automatically |
| Funnel visualization | Custom funnel UI | Plausible dashboard funnel feature | Funnels are defined in the Plausible dashboard settings, not in code |
| Event deduplication | Custom debounce/dedup logic | Plausible handles this server-side | Plausible deduplicates pageviews; for custom events, fire-and-forget is fine |
| Cookie consent | Consent banner | Nothing | Plausible is cookieless and GDPR-compliant by design |

**Key insight:** The analytics wrapper (`analytics.ts`) already exists with all 22 events pre-defined. This phase is almost entirely about adding ~14 function calls at the right locations and verifying they fire. No new infrastructure needed.

## Common Pitfalls

### Pitfall 1: Firing Events in Wrong Lifecycle Phase
**What goes wrong:** Events fire on every re-render instead of once on mount, or fire before the action completes.
**Why it happens:** Putting `analytics.*()` outside `useEffect` or in the render body.
**How to avoid:** For screen-view events, always use `useEffect(() => { analytics.*() }, [])`. For action events, fire after the action succeeds (inside the handler, after the store call).
**Warning signs:** Event counts in Plausible are much higher than expected for "viewed" events.

### Pitfall 2: Event Name Inconsistency
**What goes wrong:** Events in Plausible dashboard show as separate goals because names differ (e.g., "Signup Completed" vs "signup_completed" vs "signup-completed").
**Why it happens:** No naming convention enforced, different developers use different casing.
**How to avoid:** The existing `analytics.ts` already uses Title Case with spaces (e.g., "Workout Started", "Check-In Completed"). Document this convention and enforce it: all events use **Title Case with Spaces**. Properties use **snake_case**.
**Warning signs:** Plausible dashboard shows near-duplicate event names.

### Pitfall 3: Missing Plausible Goal Configuration
**What goes wrong:** Events fire from the app but don't show up in Plausible dashboard.
**Why it happens:** Plausible requires goals to be configured in the dashboard before events appear. Custom events must be registered as goals.
**How to avoid:** After wiring events in code, each event name must be added as a Custom Event Goal in Plausible dashboard (Settings > Goals > Add Goal > Custom Event).
**Warning signs:** Events visible in browser Network tab but not in Plausible dashboard.

### Pitfall 4: SPA Pageview Double-Counting
**What goes wrong:** Pageviews are counted twice -- once from Plausible's auto-tracking and once from a manual `plausible('pageview')` call.
**Why it happens:** Adding a manual pageview hook when the auto-tracking already works.
**How to avoid:** VERIFY first whether Plausible's script.js auto-tracks route changes. Only add manual tracking if verification shows it doesn't work. Test by navigating in the app and checking Network tab for POST to `plausible.io/api/event`.
**Warning signs:** Pageview counts in Plausible are ~2x actual visits.

### Pitfall 5: Not Tracking Both Signup and Login Success
**What goes wrong:** Auth funnel tracking is incomplete because events fire in the wrong place.
**Why it happens:** The `authStore.signUp()` and `authStore.signIn()` methods handle the auth logic, but analytics should fire in the `Auth.tsx` screen after success confirmation, not in the store.
**How to avoid:** Fire `analytics.signupCompleted()` in the `Auth.tsx` `handleSubmit` after successful signup (when `error` is null). Fire `analytics.loginCompleted()` after successful sign-in. The existing pattern in other screens (fire in handler after success) applies here.
**Warning signs:** Signup events fire even when signup fails.

## Code Examples

### Wiring signupCompleted and loginCompleted in Auth.tsx
```typescript
// In Auth.tsx handleSubmit, after successful signup:
if (mode === 'signup') {
  const { error } = await signUp(email, password)
  if (!error) {
    analytics.signupCompleted()
    // ... existing success logic
  }
}

// After successful login:
if (mode === 'login') {
  const { error } = await signIn(email, password)
  if (!error) {
    analytics.loginCompleted()
    // ... existing success logic
  }
}
```

### Wiring screen-view events (e.g., Settings)
```typescript
// At the top of Settings component:
useEffect(() => {
  analytics.settingsViewed()
}, [])
```

### Wiring mealLogged in Macros.tsx
```typescript
// In the DailyView quick-log handler:
const handleQuickLog = () => {
  onLogMacros({ /* ... */ })
  analytics.mealLogged('manual')
  setQuickLog({ protein: '', calories: '' })
}

// In LogMealView when logging a saved meal:
const handleLogSavedMeal = (meal: SavedMeal) => {
  onLogMeal(meal.name, { /* ... */ })
  analytics.mealLogged('saved')
}
```

### Wiring badgeEarned in the existing checkBadgesWithToast pattern
```typescript
// In Workouts.tsx checkBadgesWithToast (and anywhere else badges are checked):
const checkBadgesWithToast = () => {
  const newBadgeIds = checkAndAwardBadges()
  if (newBadgeIds.length > 0) {
    const badge = allBadges.find(b => b.id === newBadgeIds[0])
    if (badge) {
      toast.success(`Badge Unlocked: ${badge.name}!`, 5000)
      analytics.badgeEarned(badge.name, badge.rarity)
    }
  }
}
```

### Verifying SPA pageview tracking in browser
```
1. Open app in browser with DevTools Network tab open
2. Filter by "plausible" or "api/event"
3. Navigate between tabs (Home -> Workouts -> Macros -> Settings)
4. Each navigation should trigger a POST to https://plausible.io/api/event
5. Request payload should include: {"n":"pageview","u":"...current URL..."}
```

## Exact Event Wiring Map (14 Unwired Events)

| # | Event Method | Event Name | Where to Wire | Trigger |
|---|-------------|------------|---------------|---------|
| 1 | `onboardingStarted()` | Onboarding Started | `Onboarding.tsx` | When user advances past 'welcome' step |
| 2 | `mealLogged('manual')` | Meal Logged | `Macros.tsx` DailyView `handleQuickLog` | After quick-logging macros |
| 3 | `mealLogged('saved')` | Meal Logged | `Macros.tsx` LogMealView `handleLogSavedMeal` | After logging a saved meal |
| 4 | `mealSaved()` | Meal Saved | `Macros.tsx` LogMealView `handleSaveMeal` | After saving a new meal |
| 5 | `proteinTargetHit()` | Protein Target Hit | `Macros.tsx` DailyView or CheckInModal | When protein target is reached (check after logging) |
| 6 | `calorieTargetHit()` | Calorie Target Hit | `Macros.tsx` DailyView or CheckInModal | When calorie target is reached (check after logging) |
| 7 | `badgeEarned(name, rarity)` | Badge Earned | `Workouts.tsx`, `CheckInModal.tsx` | After `checkAndAwardBadges()` returns new badges |
| 8 | `avatarEvolved(stage)` | Avatar Evolved | `XPClaimModal.tsx` | After `updateEvolutionStage()` returns `evolved: true` |
| 9 | `appOpened()` | App Opened | `App.tsx` or `Home.tsx` | On app mount (once per session) |
| 10 | `settingsViewed()` | Settings Viewed | `Settings.tsx` | On component mount |
| 11 | `achievementsViewed()` | Achievements Viewed | `Achievements.tsx` | On component mount |
| 12 | `dataExported()` | Data Exported | `Settings.tsx` `handleExport` | After successful export |
| 13 | `signupCompleted()` | Signup Completed | `Auth.tsx` | After successful signup |
| 14 | `loginCompleted()` | Login Completed | `Auth.tsx` | After successful login |
| 15 | `coachDashboardViewed()` | Coach Dashboard Viewed | `Coach.tsx` | On component mount |
| 16 | `clientViewed()` | Client Viewed | `Coach.tsx` | When client detail modal opens |

**Note:** This is 16 wiring points but covers the 14 unique unwired events (mealLogged has 2 call sites with different sources). The roadmap says "14 previously-unwired events" which aligns with the count of event methods in analytics.ts that have zero call sites in .tsx files.

## Event Naming Convention

The existing codebase already follows a consistent pattern:

| Aspect | Convention | Examples |
|--------|-----------|----------|
| Event names | Title Case with Spaces | `Workout Started`, `Check-In Completed`, `Meal Logged` |
| Property keys | snake_case | `workout_type`, `duration_minutes`, `training_days` |
| Property values | Lowercase strings or numbers | `'push'`, `42`, `'manual'` |

All 22 existing events in `analytics.ts` follow this convention. No renaming needed.

## Funnel Definitions

Based on the success criteria ("sign up through first workout through 7-day retention"), these funnels should be documented:

### Funnel 1: Signup to First Workout
| Step | Event | Description |
|------|-------|-------------|
| 1 | Signup Completed | User creates account |
| 2 | Onboarding Completed | User finishes onboarding wizard |
| 3 | Workout Started | User starts their first workout |
| 4 | Workout Completed | User finishes their first workout |

### Funnel 2: Signup to Habit Formation (7-Day Retention)
| Step | Event | Description |
|------|-------|-------------|
| 1 | Signup Completed | User creates account |
| 2 | Onboarding Completed | User finishes onboarding |
| 3 | Check-In Completed | First daily check-in (streak=1) |
| 4 | XP Claimed | First weekly XP claim |
| 5 | Check-In Completed | Check-in at streak >= 7 (7-day retention) |

### Funnel 3: Daily Engagement Loop
| Step | Event | Description |
|------|-------|-------------|
| 1 | App Opened | User opens the app |
| 2 | Meal Logged | User logs nutrition |
| 3 | Workout Completed | User finishes workout |
| 4 | Check-In Completed | User completes daily report |

**Note:** Funnels are configured in the Plausible dashboard (Settings > Funnels), not in code. The code-side deliverable is a documentation file mapping each funnel step to its event name. Plausible funnels support 2-8 steps.

## SPA Pageview Tracking Assessment

**Current setup:** `<script defer data-domain="trained-app-eta.vercel.app" src="https://plausible.io/js/script.js"></script>` in `index.html`.

**Expected behavior:** Plausible's `script.js` automatically intercepts `history.pushState` calls made by react-router-dom v6. This means navigating between `/`, `/workouts`, `/macros`, `/avatar`, `/settings`, `/coach`, `/achievements` should automatically fire pageview events WITHOUT any additional code.

**Verification required:** The executor should verify by:
1. Running the app locally (dev mode won't send events but console.log should fire)
2. Checking browser Network tab in production for POST to `plausible.io/api/event` on navigation
3. If auto-tracking doesn't work, fall back to a `useLocation()` hook that calls `window.plausible('pageview')` manually

**HIGH confidence** that this works out of the box based on Plausible's documentation stating: "If you're using a pushState based frontend router, such as React, Angular, or Vue, Plausible Analytics will automatically work and track pageviews."

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `plausible-tracker` npm (deprecated) | `@plausible-analytics/tracker` 0.4.4 or standard `script.js` | 2024 | Old package archived, new one at `@plausible-analytics` scope. Standard script.js still works fine. |
| Manual SPA pageview hooks | Plausible auto pushState tracking | Already built into script.js | No manual code needed for most SPAs |

**Deprecated/outdated:**
- `plausible-tracker` npm package: Archived. Replaced by `@plausible-analytics/tracker`. Not needed for this project since `script.js` is already loaded and sufficient.

## Open Questions

1. **SPA pageview auto-tracking verification**
   - What we know: Plausible docs say script.js auto-tracks pushState. react-router-dom v6 uses pushState.
   - What's unclear: Whether this specific deployment (Vercel, PWA) has any edge cases that break it.
   - Recommendation: Verify in production after deployment. If it doesn't work, add a `useLocation()` hook. Test in Plan 03-02 before considering it done.

2. **proteinTargetHit / calorieTargetHit timing**
   - What we know: These events should fire when the user hits their target.
   - What's unclear: Whether to fire immediately after each meal log (requiring a re-check of totals) or only once per day.
   - Recommendation: Fire once per day, the first time the target is hit. Check after `logQuickMacros`/`logNamedMeal` whether the target transitioned from not-hit to hit. This prevents duplicate events.

3. **Plausible goal configuration (dashboard side)**
   - What we know: Events fire from code, but Plausible requires goals to be configured in the dashboard for them to appear.
   - What's unclear: Whether the project owner has Plausible dashboard access and will configure goals.
   - Recommendation: Document all 22 event names that need to be registered as Custom Event Goals. This is a manual dashboard step, not a code task. Include it in the plan as a post-deployment checklist item.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/lib/analytics.ts` -- all 22 event definitions read directly
- Codebase analysis: All 12 screen files grep'd for `analytics.*()` calls
- [Plausible SPA support docs](https://plausible.io/docs/spa-support) -- confirms auto pushState tracking
- [Plausible custom events docs](https://plausible.io/docs/custom-event-goals) -- event API confirmed
- [Plausible funnel analysis docs](https://plausible.io/docs/funnel-analysis) -- 2-8 steps, dashboard configuration
- [Plausible custom properties docs](https://plausible.io/docs/custom-props/introduction) -- 30 props max, no PII

### Secondary (MEDIUM confidence)
- [Plausible script extensions docs](https://plausible.io/docs/script-extensions) -- extensions overview
- [@plausible-analytics/tracker npm](https://www.npmjs.com/package/@plausible-analytics/tracker) -- v0.4.4, replacement for deprecated plausible-tracker

### Tertiary (LOW confidence)
- None -- all findings verified with official docs or codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Plausible already integrated, no new dependencies needed
- Architecture: HIGH -- Existing analytics.ts patterns verified by reading all screen files
- Event wiring map: HIGH -- Complete grep of all .tsx files confirms exactly which events are wired vs unwired
- SPA pageview: MEDIUM -- Plausible docs say it works, but needs production verification
- Pitfalls: HIGH -- Derived from actual codebase patterns and Plausible documentation

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable domain, Plausible API rarely changes)
