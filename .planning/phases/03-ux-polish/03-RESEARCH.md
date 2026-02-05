# Phase 3: UX Polish - Research

**Researched:** 2026-02-05
**Domain:** React PWA UX patterns (skeleton loading, empty states, error handling, haptic feedback, onboarding progress)
**Confidence:** HIGH

## Summary

Phase 3 is a UX polish pass across five distinct areas: skeleton loading states, empty states, error messages, haptic feedback, and onboarding progress. The codebase already has foundational infrastructure for most of these -- a `Skeleton` component (unused), a toast system, an `ErrorBoundary`, and onboarding progress dots -- but they are either unused, incomplete, or not user-friendly enough.

The existing tech stack (Framer Motion ^11.0.8, Tailwind CSS ^3.4.3, Zustand ^4.5.2, Lucide React ^0.563.0) provides everything needed. **No new dependencies are required.** The critical finding from the codebase audit is that most screens (Home, Workouts, Macros, Achievements, Settings) read data synchronously from Zustand localStorage stores and render instantly. Only 3 actual async loading points exist: the `RouteLoader` Suspense fallback, the auth loading state, and the Coach screen's Supabase fetch. Skeletons should target only these real loading states, not create artificial loading where none exists.

**Primary recommendation:** This is a code-touch-heavy but low-risk phase. Every plan involves editing existing files, not creating new infrastructure. Extend the existing `Skeleton.tsx`, create a small `haptics.ts` utility (~15 lines), improve error message strings in catch blocks, add actionable CTAs to empty states, and enhance the onboarding progress dots with "Step X of Y" text.

## Standard Stack

### Core (Already Installed -- No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | ^3.4.3 | `animate-pulse` for skeleton shimmer | Already used in `Skeleton.tsx`; `shimmer` keyframe also defined in `tailwind.config.js` |
| Framer Motion | ^11.0.8 | AnimatePresence for skeleton-to-content transitions | Already used in every screen |
| Zustand | ^4.5.2 | Toast store for error feedback | Existing `toastStore.ts` with `toast.error/success/warning/info` helpers |
| Lucide React | ^0.563.0 | Icons for empty states | Already used throughout all screens |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Navigator.vibrate | Web API | Haptic feedback on Android/Chrome | On set completion, workout finish, check-in, XP claim |
| Tailwind `animate-pulse` | Built-in | Skeleton shimmer effect | Already used in `Skeleton.tsx` line 7 |
| Tailwind `shimmer` keyframe | Custom in config | Enhanced shimmer animation | Defined in `tailwind.config.js` lines 76-96 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Skeleton.tsx | react-loading-skeleton npm package | Adds dependency for ~20 lines of existing code that works fine |
| navigator.vibrate() | ios-haptics library (Safari 17.4+ checkbox hack) | Adds iOS support but uses fragile browser hack; not worth the risk for non-critical feature |
| Existing ErrorBoundary + toast | react-error-boundary | Adds dependency; existing class component + Zustand toast covers all cases |

**Installation:**
```bash
# No new packages needed. Everything is already installed.
```

## Architecture Patterns

### Recommended File Changes
```
src/
├── components/
│   └── Skeleton.tsx          # EXTEND: Add route-level skeleton variants (SkeletonPage, SkeletonCoach)
├── lib/
│   └── haptics.ts            # NEW: ~15-line utility for haptic feedback abstraction
├── screens/
│   ├── Workouts.tsx          # EDIT: Enhance empty state for workout history (add CTA)
│   ├── Macros.tsx            # EDIT: Enhance DailyView empty state (add button), MealsView (add button)
│   ├── Achievements.tsx      # EDIT: Empty filter state is fine as-is (no actionable change in filter context)
│   ├── Coach.tsx             # EDIT: Replace spinner with skeleton, improve error messages
│   ├── Onboarding.tsx        # EDIT: Add "Step X of Y" text to progress indicator
│   ├── CheckInModal.tsx      # EDIT: Add haptic on submit
│   └── Settings.tsx          # EDIT: Improve error message strings
├── App.tsx                   # EDIT: Replace RouteLoader spinner with skeleton, replace auth spinner
├── stores/
│   └── authStore.ts          # EDIT: Improve sync error message strings
└── screens/
    └── Auth.tsx              # EDIT: Improve error message strings
```

### Pattern 1: Skeleton Variants for Real Async Loading Points
**What:** Create named skeleton variants that match the visual structure of content behind actual loading states.
**When to use:** ONLY where there is a real async boundary -- Suspense fallback, auth loading, or API fetch.
**Key insight from audit:** Most screens render synchronously from Zustand localStorage stores. Only 3 spots need skeletons:

| Loading Point | File | Line | Current UI | Skeleton Needed |
|---------------|------|------|-----------|----------------|
| Route lazy loading | `App.tsx` RouteLoader | 18-24 | CSS spinner `animate-spin` | Generic page skeleton |
| Auth initialization | `App.tsx` authLoading | 66-78 | CSS spinner + "Loading..." | Centered skeleton |
| Coach client list | `Coach.tsx` isLoading | 216-225 | Emoji + "Loading clients..." | Dashboard skeleton |

**FoodSearch.tsx** (line 365-373) has a small inline spinner in the search input -- this is appropriate for inline search and should stay. Optionally add skeleton result rows.

**Example:**
```typescript
// In Skeleton.tsx -- extend existing component
export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="pt-8 pb-6 px-4">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="px-4 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
```

### Pattern 2: Empty State with Actionable Guidance
**What:** Every data-dependent empty state shows icon + descriptive text + action button.
**When to use:** When a list or data view has no items to display AND the user can take action to populate it.

**Current audit of empty states:**
| Location | File:Line | Has Icon | Has Text | Has Action CTA | Needs Work |
|----------|-----------|----------|----------|----------------|------------|
| Home no macros | `Home.tsx:414-434` | Yes (Beef) | Yes | Yes (navigate /macros) | Fine as-is |
| Workouts no history | `Workouts.tsx:432-437` | No (text only) | Yes | **No** | **Add CTA** |
| Workouts rest day | `Workouts.tsx:301-312` | Yes (emoji) | Yes | No (appropriate) | Fine as-is |
| Macros DailyView no targets | `Macros.tsx:135-143` | Yes (emoji) | Yes | **No button** | **Add "Set Up Macros" button** |
| Macros MealsView no plan | `Macros.tsx:381-389` | Yes (icon) | Yes | **No button** | **Add "Go to Calculator" button** |
| Macros LogMealView no meals | `Macros.tsx:806-813` | Yes (icon) | Yes | No (Create button above) | Fine -- CTA already on page |
| Achievements empty filter | `Achievements.tsx:365-370` | Yes (icon) | Minimal | No | Fine -- filter context |
| Coach no clients | `Coach.tsx:293-299` | Yes (emoji) | Yes | Yes (Add Client) | Already good |
| Settings no weight history | `Settings.tsx:583-586` | No | Minimal text | No | Minor -- add encouragement |

**Consistent pattern:**
```typescript
<Card className="text-center py-8">
  <Icon size={40} className="mx-auto mb-4 text-text-secondary" />
  <p className="text-xl font-bold mb-2">{title}</p>
  <p className="text-text-secondary mb-4">{description}</p>
  {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
</Card>
```

### Pattern 3: Haptic Feedback Utility
**What:** A thin wrapper around `navigator.vibrate()` that gracefully degrades on unsupported browsers.
**When to use:** Key user actions identified in success criteria: set completion, workout finish.
**Browser support:** 81% global (Chrome, Firefox, Edge on Android). No Safari/iOS support.

```typescript
// src/lib/haptics.ts
function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Silently fail -- haptics are enhancement, not requirement
    }
  }
}

export const haptics = {
  /** Light tap -- set completion, toggle */
  light: () => vibrate(10),
  /** Medium tap -- button press confirmation */
  medium: () => vibrate(25),
  /** Heavy tap -- workout complete, XP claim */
  heavy: () => vibrate(50),
  /** Success pattern -- check-in submitted, badge earned */
  success: () => vibrate([10, 50, 20]),
  /** Error pattern -- validation error */
  error: () => vibrate([50, 100, 50]),
  /** Check if haptics are supported on this device */
  isSupported: () => typeof navigator !== 'undefined' && 'vibrate' in navigator,
}
```

**Haptic trigger points (from code audit):**
| Action | File | Function | Haptic Type | Rationale |
|--------|------|----------|-------------|-----------|
| Complete a set | `Workouts.tsx` | `handleCompleteSet` (line 187-191) | `haptics.light` | Frequent action, subtle feedback |
| Finish workout | `Workouts.tsx` | `handleCompleteWorkout` (line 96-124) | `haptics.success` | Major milestone |
| End workout early | `Workouts.tsx` | `handleEndWorkoutEarly` (line 126-166) | `haptics.medium` | Partial completion |
| Submit check-in | `CheckInModal.tsx` | `handleSubmit` (line 89-153) | `haptics.success` | Daily milestone |
| Claim weekly XP | `XPClaimModal.tsx` | claim action | `haptics.heavy` | Major reward moment |
| Badge unlocked | `CheckInModal.tsx` / `Workouts.tsx` | badge toast | `haptics.success` | Achievement unlocked |

### Pattern 4: User-Friendly Error Messages
**What:** Replace generic error messages with ones that explain what happened AND what to do next.
**When to use:** All `toast.error()` calls and inline error states.

**Error message audit with improvements:**
| File:Line | Current Message | Improved Message |
|-----------|----------------|-----------------|
| `Coach.tsx:79` | "Failed to load clients" | "Couldn't load your clients. Try pulling down to refresh." |
| `Coach.tsx:187` | "Failed to remove client" | "Couldn't remove this client. Please try again." |
| `Auth.tsx:89` | "No internet connection" | "No internet connection. Connect to the internet and try again." |
| `Settings.tsx:183` | "Failed to export data" | "Couldn't export your data. Your progress is still safe -- try again." |
| `Settings.tsx:223` | "Invalid JSON format" | "This file doesn't look right. Make sure it's a .json backup from this app." |
| `Settings.tsx:193` | "Invalid backup file format" | "This doesn't look like a backup file. Export your data first to create one." |
| `Settings.tsx:250` | "Failed to reset progress" | "Couldn't reset your data. Try reloading the page and trying again." |
| `ErrorBoundary.tsx:55-56` | "Something went wrong" | Keep, but enhance the subtitle: "Don't worry -- your data is safe. Try the options below." |

**Messages that are already good (keep as-is):**
- `Coach.tsx:76`: "Unable to load clients - check your internet" -- has action
- `authStore.ts:173`: "Failed to sync data. Changes saved locally." -- has reassurance
- `Auth.tsx:63`: Long email confirmation message -- clear and specific

### Pattern 5: Onboarding Progress Indicator Enhancement
**What:** Add "Step X of Y" text alongside the existing dot indicators.
**Current state:** Onboarding.tsx line 228-237 shows horizontal bar segments that fill as the user progresses. No text label. Steps array: `['welcome', 'name', 'gender', 'fitness', 'days', 'schedule', 'goal', 'avatar', 'features', 'tutorial']` (10 total, 9 shown in progress bar after welcome).

```typescript
// Enhanced progress indicator
{step !== 'welcome' && step !== 'evolution' && (
  <div className="mb-8">
    <p className="text-center text-xs text-text-secondary mb-3">
      Step {currentIndex} of {steps.length - 1}
    </p>
    <div className="flex gap-1 justify-center">
      {steps.slice(1).map((s, i) => (
        <div
          key={s}
          className={`h-1 w-8 rounded-full transition-colors ${
            i < currentIndex ? 'bg-accent-primary' : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  </div>
)}
```

### Anti-Patterns to Avoid
- **Skeleton on synchronous data:** Home, Workouts, Macros, Achievements, Settings read from Zustand localStorage -- they render instantly. Adding skeletons would be theater, not UX improvement. Only add skeletons where there's a real async loading delay.
- **Over-vibrating:** Don't add haptics to every button tap. Reserve for milestone moments per the success criteria: set completion, workout finish.
- **Generic empty states:** "No data" with no action is useless. Always include a CTA button when the user can take action.
- **Error messages without recovery:** "Something went wrong" tells the user nothing. Always include what to try next.
- **Technical jargon in errors:** Replace "Invalid JSON format" with plain English that a non-developer understands.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skeleton animation | Custom CSS keyframes | Tailwind `animate-pulse` (already in Skeleton.tsx) | Built-in, consistent, zero maintenance |
| Toast system | Custom notification system | Existing `toastStore.ts` + `Toast.tsx` | Already built with Framer Motion, themed for both themes |
| Error boundary | Custom try/catch wrappers | Existing `ErrorBoundary.tsx` component | Already wraps entire app, has retry + reload |
| Progress indicator | Custom step tracker | Enhance existing onboarding dots in `Onboarding.tsx` | Already works, just needs text label |
| Haptic patterns | Complex vibration library | `navigator.vibrate()` with ~15-line wrapper | No dependency needed; covers all use cases |
| Reusable EmptyState | Could create shared component | Inline pattern in each screen | Only 3-4 screens need changes; a shared component is over-engineering for this scope |

**Key insight:** This phase adds zero new dependencies. Every UX improvement builds on existing infrastructure. The value is in consistent application of patterns, not new technology.

## Common Pitfalls

### Pitfall 1: Adding Skeletons Where Data Is Synchronous
**What goes wrong:** Developer adds skeleton to Workouts or Macros screen, but data loads from localStorage via Zustand instantly. Users see a flash of skeleton for 0ms, causing layout shift.
**Why it happens:** Assumption that "all screens need skeletons." The requirement says "all data-loading screens," but most screens in this app have no loading state.
**How to avoid:** From the audit, only 3 places have actual async loading (RouteLoader, auth, Coach). Only add skeletons there.
**Warning signs:** If you can't find an `isLoading` state or `Suspense` boundary in a screen, it doesn't need a skeleton.

### Pitfall 2: Haptics on iOS Safari
**What goes wrong:** `navigator.vibrate()` silently fails on iOS Safari. Developer tests on Android, ships, half the users get no feedback.
**Why it happens:** Safari has never supported the Vibration API. As of 2026, it still doesn't (confirmed via Can I Use -- 0% Safari support across all versions).
**How to avoid:** Accept this gracefully. The utility wrapper silently falls back to no-op. Haptics are a progressive enhancement. The `haptics.isSupported()` check can optionally hide a "Haptic Feedback" toggle in Settings for unsupported devices.
**Warning signs:** `'vibrate' in navigator` returns `false` on Safari.

### Pitfall 3: Empty State Flash on First Render
**What goes wrong:** Component renders empty state briefly before Zustand rehydrates from localStorage.
**Why it happens:** Zustand with async `persist` middleware rehydrates after first render.
**How to avoid:** This app uses direct `JSON.parse(localStorage.getItem(...))` initialization in store creators (not async persist). Stores are populated on first render. This is NOT an issue for this codebase.
**Warning signs:** If stores ever migrate to async persistence (IndexedDB), this becomes a concern.

### Pitfall 4: Onboarding Progress Breaking Existing Animations
**What goes wrong:** Adding "Step X of Y" text disrupts the existing `AnimatePresence` slide transitions or layout.
**Why it happens:** The progress indicator is rendered conditionally with `step !== 'welcome'` and sits above the animated content area.
**How to avoid:** Add the step text INSIDE the existing progress indicator `<div className="mb-8">` container (line 228). Don't create a new container element that could affect the flex layout.
**Warning signs:** Progress indicator jumping or causing content to shift during step transitions.

### Pitfall 5: Inconsistent Error Message Tone
**What goes wrong:** Some errors are warm and helpful, others are cold and technical. Users get mixed signals about the app's personality.
**Why it happens:** Error messages were added ad-hoc in different files at different times.
**How to avoid:** Follow a consistent pattern: "[What happened]. [What to do next]." Never use "invalid", "failed", or "error" without follow-up guidance. The app has two themes (Trained = stern/professional, GYG = friendly/casual), but error messages should be universally friendly regardless of theme.

## Code Examples

### Example 1: Replace RouteLoader in App.tsx
```typescript
// In App.tsx -- replace lines 18-24
import { Skeleton, SkeletonCard } from '@/components'

function RouteLoader() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="pt-8 pb-6 px-4">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="px-4 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
```

### Example 2: Replace Auth Loading in App.tsx
```typescript
// In App.tsx -- replace lines 66-78
if (authLoading) {
  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    </>
  )
}
```

### Example 3: Coach Screen Skeleton
```typescript
// In Coach.tsx -- replace lines 216-225
if (isLoading) {
  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="bg-bg-secondary pt-8 pb-6 px-4">
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="px-4 py-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}
```

### Example 4: Haptics Utility (Complete File)
```typescript
// src/lib/haptics.ts
function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Silently fail -- haptics are enhancement, not requirement
    }
  }
}

export const haptics = {
  /** Light tap -- set completion, toggle */
  light: () => vibrate(10),
  /** Medium tap -- button press confirmation */
  medium: () => vibrate(25),
  /** Heavy tap -- workout complete, XP claim */
  heavy: () => vibrate(50),
  /** Success pattern -- check-in submitted, badge earned */
  success: () => vibrate([10, 50, 20]),
  /** Error pattern -- validation error */
  error: () => vibrate([50, 100, 50]),
  /** Check if haptics are supported on this device */
  isSupported: () => typeof navigator !== 'undefined' && 'vibrate' in navigator,
}
```

### Example 5: Enhanced Empty State for Workouts History
```typescript
// In Workouts.tsx -- replace lines 432-437
{workoutHistory.length === 0 && (
  <Card className="text-center py-8">
    <Dumbbell size={40} className="mx-auto mb-4 text-text-secondary" />
    <p className="text-lg font-bold mb-2">No workouts yet</p>
    <p className="text-text-secondary text-sm mb-4">
      Complete your first workout to start tracking progress
    </p>
    {todayWorkout && !isCompleted && (
      <Button onClick={handleStartWorkout}>Start Today's Workout</Button>
    )}
  </Card>
)}
```

### Example 6: Onboarding Progress Enhancement
```typescript
// In Onboarding.tsx -- replace lines 227-238
{step !== 'welcome' && step !== 'evolution' && (
  <div className="mb-8">
    <p className="text-center text-xs text-text-secondary mb-3">
      Step {currentIndex} of {steps.length - 1}
    </p>
    <div className="flex gap-1 justify-center">
      {steps.slice(1).map((s, i) => (
        <div
          key={s}
          className={`h-1 w-8 rounded-full transition-colors ${
            i < currentIndex ? 'bg-accent-primary' : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  </div>
)}
```

### Example 7: Improved Error Messages
```typescript
// In Settings.tsx -- replace error toast calls
// Line 183: toast.error("Failed to export data")
toast.error("Couldn't export your data. Your progress is still safe -- try again.")

// Line 223: toast.error("Invalid JSON format")
toast.error("This file doesn't look right. Make sure it's a .json backup from this app.")

// Line 193: toast.error("Invalid backup file format")
toast.error("This doesn't look like a backup file. Export your data first to create one.")
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic spinners | Content-shaped skeleton placeholders | Widely adopted ~2019 | Reduces perceived load time by 10-20% |
| "No data" text | Actionable empty states with icon + CTA | Material Design guidance ~2019 | Increases feature discovery, reduces confusion |
| "Error occurred" messages | Context-specific error + recovery action | UX best practice ~2020 | Reduces user abandonment on errors |
| No haptic in web | navigator.vibrate() in PWAs | Available since Chrome 30 | Premium feel on Android (~80% mobile); no-op on iOS |
| Numbered step indicators | Progress bar + "Step X of Y" text | Current standard | Clearer sense of progress and completion |

**Deprecated/outdated:**
- Loading spinners as primary loading indicator (replaced by skeletons)
- `window.confirm()` for destructive actions (codebase still uses this in `Workouts.tsx` line 136 and `Settings.tsx` line 240 -- beyond Phase 3 scope)

## Open Questions

1. **iOS Haptics: Worth the dependency?**
   - What we know: `ios-haptics` library uses Safari 17.4+ checkbox `<input switch>` hack to trigger native haptics. Clever but fragile.
   - What's unclear: Long-term stability. Apple could break this technique in future Safari updates.
   - Recommendation: Use plain `navigator.vibrate()` for now. iOS users get silent degradation (no haptics). If iOS support becomes critical later, the utility wrapper makes adding ios-haptics a one-line change.

2. **FoodSearch skeleton vs. inline spinner**
   - What we know: FoodSearch shows a small CSS spinner inside the search input while fetching. This is a scoped, appropriate inline indicator.
   - What's unclear: Whether adding skeleton result rows in the dropdown while loading would be better UX.
   - Recommendation: Keep the inline spinner (it's appropriate). Optionally add 3 skeleton rows in the results dropdown. The success criteria says "data-loading screens" -- FoodSearch is a component within Macros, not a screen.

3. **Scope of "all data-loading screens"**
   - What we know: Only 3 places have real async loading (RouteLoader, auth, Coach). Most screens are synchronous.
   - What's unclear: Whether the success criteria expects skeletons on every screen or just where there's actual loading delay.
   - Recommendation: Replace all visible spinners with skeletons. Don't add skeletons to screens that render instantly from store data. The success criteria says "show skeleton placeholders instead of spinners" -- focus on replacing the 3 existing spinners.

## Sources

### Primary (HIGH confidence)
- Codebase audit: All 12 screens, 22 components, 8 stores, App.tsx routing, tailwind.config.js
- [MDN Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) -- API specification, browser compatibility
- [Can I Use: navigator.vibrate](https://caniuse.com/mdn-api_navigator_vibrate) -- 81.13% global support, 0% Safari

### Secondary (MEDIUM confidence)
- [Smashing Magazine: Implementing Skeleton Screens in React](https://www.smashingmagazine.com/2020/04/skeleton-screens-react/) -- Design patterns for skeleton loading
- [LogRocket: Handling React Loading States](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/) -- Best practices
- [ios-haptics GitHub](https://github.com/tijnjh/ios-haptics) -- Safari 17.4+ workaround (evaluated, not recommended for now)

### Tertiary (LOW confidence)
- [Medium: Haptic Feedback in Web Design](https://medium.com/@officialsafamarva/haptic-feedback-in-web-design-ux-you-can-feel-10e1a5095cee) -- General patterns
- [Ironeko: Skeleton Loading Do's and Don'ts](https://ironeko.com/posts/the-dos-and-donts-of-skeleton-loading-in-react) -- Practical guidelines

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies. Everything already installed and used in codebase.
- Architecture: HIGH -- Patterns derived from direct audit of all 12 screens, 22 components, every loading state, every empty state, every error message.
- Pitfalls: HIGH -- Critical finding that most screens are synchronous (no loading state) prevents over-engineering. iOS haptic limitation documented with specific Can I Use data.
- Haptic feedback: MEDIUM -- Vibration API well-documented but iOS unsupported. 81% global coverage is good for progressive enhancement.

**Research date:** 2026-02-05
**Valid until:** 2026-03-07 (stable domain, no fast-moving APIs)
