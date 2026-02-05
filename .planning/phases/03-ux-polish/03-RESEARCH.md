# Phase 3: UX Polish - Research

**Researched:** 2026-02-05
**Domain:** React UX patterns (skeleton loading, empty states, error messages, haptic feedback, onboarding progress)
**Confidence:** HIGH (all patterns verified against existing codebase; no new dependencies needed)

## Summary

Phase 3 is about improving perceived quality. The app already has all the infrastructure needed -- Tailwind CSS with `animate-pulse`, Framer Motion for transitions, a toast system for feedback, and a basic `Skeleton` component. The work is extending existing patterns, not building new systems.

The codebase currently uses loading spinners (`RouteLoader` in App.tsx) for lazy-loaded routes and has no per-screen skeleton states. Empty states exist inconsistently -- the Macros DailyView has one, the Workouts history has one, but Achievements has a minimal one and the Home screen's macro section has a basic CTA. Error messages are functional but inconsistent -- some say "Failed to X" without recovery guidance while others are more helpful.

**Primary recommendation:** Build screen-specific skeleton components that mirror each screen's card layout, create a reusable `EmptyState` component with icon + message + CTA pattern, create an error message helper that generates user-friendly toast messages, add a `haptics.ts` utility with feature detection, and enhance the existing onboarding progress indicator with a text label.

## Standard Stack

### Core (Already Installed -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | ^3.4.3 | `animate-pulse` for skeleton shimmer | Already used for the Skeleton component |
| Framer Motion | ^11.0.8 | AnimatePresence for skeleton-to-content transitions | Already used throughout the app |
| Zustand | ^4.5.2 | Toast store for error feedback | Already the state management solution |
| Lucide React | ^0.563.0 | Icons for empty states | Already used throughout |

### Supporting (Already Available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Navigator.vibrate | Web API | Haptic feedback | On set completion, workout finish |
| Tailwind keyframes | Built-in | `shimmer` animation already defined | For enhanced skeleton shimmer effect |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom skeleton | react-loading-skeleton | Adds dependency; app's existing Skeleton.tsx + Tailwind `animate-pulse` is sufficient for the card-based layout |
| navigator.vibrate | No alternative for web | Only API available; graceful fallback needed |

**Installation:** None required. All tools already in the project.

## Architecture Patterns

### Recommended Project Structure

```
src/
  components/
    Skeleton.tsx          # EXTEND existing - add screen-specific skeletons
    EmptyState.tsx        # NEW - reusable empty state component
    ErrorBoundary.tsx     # EXISTS - already has fallback UI
  lib/
    haptics.ts            # NEW - haptic feedback utility
    errors.ts             # NEW - user-friendly error message helpers
  screens/
    Home.tsx              # ADD skeleton + empty states
    Workouts.tsx          # ADD skeleton + empty states
    Macros.tsx            # ENHANCE existing empty state
    Achievements.tsx      # ADD skeleton + enhance empty state
    AvatarScreen.tsx      # ADD skeleton
    Onboarding.tsx        # ENHANCE progress indicator
```

### Pattern 1: Screen-Specific Skeleton Components

**What:** Each screen gets a skeleton that mirrors its actual layout with pulse-animated placeholder shapes.
**When to use:** Any screen that loads data from Zustand stores.
**Why:** The existing `RouteLoader` in App.tsx shows a generic spinner for lazy-loaded routes. Screen-specific skeletons maintain spatial layout and reduce perceived load time.

**Current state (spinner in App.tsx, line 18-24):**
```typescript
function RouteLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
```

**Target pattern:**
```typescript
// src/components/Skeleton.tsx - extend existing file
export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header skeleton */}
      <div className="pt-8 pb-6 px-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="px-4 space-y-6">
        {/* Avatar + XP card skeleton */}
        <SkeletonCard />
        {/* Weekly summary skeleton */}
        <SkeletonCard />
        {/* Quests skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Transition pattern (Framer Motion fade):**
```typescript
// When data is ready, cross-fade from skeleton to content
<AnimatePresence mode="wait">
  {isLoading ? (
    <motion.div key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <HomeSkeleton />
    </motion.div>
  ) : (
    <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <HomeContent />
    </motion.div>
  )}
</AnimatePresence>
```

**Important nuance for this app:** Since all data comes from Zustand with localStorage persistence, "loading" is almost instant on subsequent visits. The skeleton primarily helps with:
1. The `Suspense` fallback when lazy-loaded routes first load (code splitting)
2. First-visit experience before stores are hydrated
3. Any future async data fetching (e.g., if coach features add API calls)

The `RouteLoader` in `App.tsx` should be replaced with screen-specific skeleton fallbacks in the `Suspense` wrappers.

### Pattern 2: Reusable EmptyState Component

**What:** A consistent component for "no data yet" screens with icon, message, and CTA.
**When to use:** Workouts history, Macros daily view, Achievements (filtered), any list that can be empty.

**Pattern:**
```typescript
// src/components/EmptyState.tsx
interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon size={28} className="text-text-secondary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-text-secondary text-sm mb-6 max-w-xs mx-auto">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
```

### Pattern 3: Haptic Feedback Utility

**What:** A thin wrapper around `navigator.vibrate()` with feature detection and predefined patterns.
**When to use:** Set completion, workout finish, XP claim, check-in completion.

**Pattern:**
```typescript
// src/lib/haptics.ts
const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

export const haptics = {
  /** Light tap - set completion, toggle */
  light: () => canVibrate && navigator.vibrate(10),

  /** Medium tap - action confirmed */
  medium: () => canVibrate && navigator.vibrate(25),

  /** Success pattern - workout complete, achievement unlocked */
  success: () => canVibrate && navigator.vibrate([15, 50, 30]),

  /** Heavy - important milestone like XP claim */
  heavy: () => canVibrate && navigator.vibrate(50),

  /** Error buzz */
  error: () => canVibrate && navigator.vibrate([50, 30, 50]),
}
```

**Important notes on Navigator.vibrate():**
- Only works on Android devices (Safari/iOS does not support it -- [MDN source](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate))
- Requires "sticky user activation" (user must have interacted with the page)
- Always call as a result of a user action (click handler), never on page load
- Returns `boolean` -- `true` if successful, `false` if not
- Graceful no-op on unsupported platforms (desktop, iOS) when using the feature detection wrapper above

### Pattern 4: User-Friendly Error Messages

**What:** Replace technical error messages with human-readable ones that explain what happened and what to do.
**When to use:** All toast.error() calls, ErrorBoundary fallback, form validation.

**Current error messages in the codebase (from grep):**
- `"Failed to export data"` -- no guidance on what to do
- `"Invalid backup file format"` -- no guidance on what format is expected
- `"Invalid JSON format"` -- technical jargon
- `"Failed to load clients"` -- no recovery action
- `"Failed to sync data. Changes saved locally."` -- this one is actually good (explains impact)

**Target pattern for error messages:**
```typescript
// src/lib/errors.ts
export function friendlyError(context: string, error?: Error): string {
  // Network errors
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return `Couldn't ${context}. Check your internet connection and try again.`
  }
  // Storage errors
  if (error?.message?.includes('storage') || error?.message?.includes('quota')) {
    return `Couldn't ${context}. Your device storage may be full. Try clearing some browser data.`
  }
  // Generic
  return `Something went wrong while trying to ${context}. Please try again.`
}
```

### Pattern 5: Onboarding Progress Indicator Enhancement

**What:** Add a text label ("Step X of Y") alongside the existing dot indicators.
**Current state:** The onboarding already has a progress bar with dot indicators (line 227-237 of Onboarding.tsx). It shows horizontal bars that fill as you progress. The current implementation does NOT show step numbers.

**Enhancement needed:**
```typescript
// Current (lines 227-237):
{step !== 'welcome' && (
  <div className="flex gap-1 mb-8 justify-center">
    {steps.slice(1).map((s, i) => (
      <div
        key={s}
        className={`h-1 w-8 rounded-full transition-colors ${
          i < currentIndex ? 'bg-accent-primary' : 'bg-gray-700'
        }`}
      />
    ))}
  </div>
)}

// Enhanced:
{step !== 'welcome' && step !== 'evolution' && (
  <div className="mb-8">
    <p className="text-center text-xs text-text-secondary mb-2">
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

- **Full-screen skeleton for persistent data:** Since Zustand stores hydrate from localStorage, data is usually available immediately. Only show skeletons for the `Suspense` fallback (code splitting), not as an "initial data load" pattern.
- **Overly long vibrations:** Keep haptic patterns under 100ms total. Users should feel a tap, not a massage.
- **Generic empty states:** "No data" is not helpful. Always explain WHAT is empty, WHY it might be empty, and HOW to populate it.
- **Multiple CTAs in empty states:** Focus on a single primary action. Don't overwhelm users in an empty state.
- **Technical error messages:** Never expose raw error.message to users. Always translate through a friendly helper.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skeleton animation | Custom CSS keyframe shimmer | Tailwind `animate-pulse` (already exists) | Already defined, consistent, zero-config |
| Route-level loading | Custom loading state management | React `Suspense` + lazy() (already set up) | Already configured in App.tsx |
| Toast notifications | Custom notification system | Existing `toast.error/success/etc` | Already built with Framer Motion animations |
| Vibration patterns | Raw navigator.vibrate calls | Centralized `haptics.ts` utility | Feature detection + predefined patterns in one place |
| Error boundaries | Custom try/catch wrappers | Existing `ErrorBoundary` component | Already handles retry + reload |

**Key insight:** This phase adds zero new dependencies. Every UX improvement builds on existing infrastructure (Tailwind animations, Framer Motion, Zustand toast store, Suspense boundaries). The value is in consistent application of patterns, not new technology.

## Common Pitfalls

### Pitfall 1: Skeleton Layout Mismatch

**What goes wrong:** Skeleton doesn't match the actual content layout, causing a jarring "jump" when data loads.
**Why it happens:** Skeleton shapes are designed independently of the actual component.
**How to avoid:** Build skeleton components by referencing the exact Card/section structure of each screen. Match heights, widths, padding, and spacing exactly.
**Warning signs:** Content shifts position when transitioning from skeleton to real content.

### Pitfall 2: Haptic Feedback on iOS

**What goes wrong:** Developer tests on desktop or Android, ships code that silently fails on iOS.
**Why it happens:** `navigator.vibrate` is not supported on Safari/iOS. The function doesn't exist.
**How to avoid:** The `canVibrate` check in the haptics utility handles this. Never call `navigator.vibrate` directly -- always use the utility. Also: never gate functionality on haptic support. Haptics are an enhancement, not a requirement.
**Warning signs:** Error in console about `navigator.vibrate is not a function` on iOS.

### Pitfall 3: Empty State Flash

**What goes wrong:** Empty state briefly appears before data hydrates from localStorage, then content appears causing a flash.
**Why it happens:** Zustand's localStorage persistence needs one tick to hydrate.
**How to avoid:** Check if the store has been hydrated before showing empty states. In this app, since all stores use Zustand `persist` middleware, hydration is synchronous on the same tick for localStorage. But verify by checking: if `profile` exists (user has onboarded), the stores should have data.
**Warning signs:** Empty state flashes for a frame when navigating to a screen.

### Pitfall 4: Overusing Skeletons

**What goes wrong:** Skeleton shows for 50ms then disappears, creating a flicker worse than no skeleton.
**Why it happens:** Data loads instantly from localStorage but skeleton is shown anyway.
**How to avoid:** Only use skeletons in `Suspense` fallbacks for lazy-loaded route components. Don't add loading states to synchronous store reads. The primary use case here is when JS chunks are loading for the first time.
**Warning signs:** Skeleton appears and disappears too quickly to register visually.

### Pitfall 5: Error Messages That Blame Users

**What goes wrong:** Message says "You entered invalid data" or "Error: invalid input".
**Why it happens:** Developer writes error messages from the system's perspective.
**How to avoid:** Always describe what happened and what to do next. Never use the word "invalid". Frame messages as "couldn't do X" not "you did X wrong".
**Warning signs:** Any error message containing "invalid", "error:", or "failed" without a follow-up action.

## Code Examples

### Skeleton Component Extension (Verified Pattern -- Tailwind + Existing Component)

```typescript
// Extend src/components/Skeleton.tsx
// Source: Existing codebase pattern (Skeleton.tsx lines 1-19)

// Workout-specific skeleton
export function WorkoutSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="pt-8 pb-6 px-4 bg-surface">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="px-4 py-6 space-y-6">
        <SkeletonCard />
        <div>
          <Skeleton className="h-5 w-28 mb-3" />
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-5 w-36 mb-3" />
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### EmptyState Usage Examples

```typescript
// Workouts - no history
<EmptyState
  icon={Dumbbell}
  title="No workouts yet"
  description="Start your first workout to begin tracking your progress and earning XP."
  action={{ label: "Start Workout", onClick: handleStartWorkout }}
/>

// Macros - no targets set
<EmptyState
  icon={Beef}
  title="No macro targets set"
  description="Set up your nutrition targets to start tracking protein and calories."
  action={{ label: "Set Up Macros", onClick: () => setActiveTab('calculator') }}
/>

// Achievements - empty filter
<EmptyState
  icon={Trophy}
  title="No badges in this category"
  description="Keep training and checking in to unlock badges across all categories."
/>
```

### Haptic Integration Points

```typescript
// Workouts.tsx - set completion (handleCompleteSet)
const handleCompleteSet = (exerciseId: string, setIndex: number) => {
  if (!activeWorkout) return
  logSet(activeWorkout.id, exerciseId, setIndex, { completed: true, skipped: false })
  setActiveWorkout(getCurrentWorkout())
  haptics.light()  // <-- add
}

// Workouts.tsx - workout completion (handleCompleteWorkout)
const handleCompleteWorkout = () => {
  // ... existing logic ...
  haptics.success()  // <-- add after toast/analytics
}

// Home.tsx - check-in completion (CheckInModal onClose)
if (didCheckIn) {
  setJustCheckedIn(true)
  haptics.success()  // <-- add
}

// XPClaimModal - XP claim
haptics.heavy()  // <-- add after claim action
```

### Enhanced Onboarding Progress

```typescript
// Onboarding.tsx - replace progress indicator section
{step !== 'welcome' && step !== 'evolution' && (
  <div className="mb-8">
    <p className="text-center text-xs text-text-secondary mb-2">
      Step {currentIndex} of {steps.length - 1}
    </p>
    <div className="flex gap-1 justify-center">
      {steps.slice(1).map((s, i) => (
        <div
          key={s}
          className={`h-1 w-8 rounded-full transition-colors duration-300 ${
            i < currentIndex ? 'bg-accent-primary' : i === currentIndex - 1 ? 'bg-accent-primary/50' : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic spinners | Content-shaped skeletons | Standard since ~2019 | 10-20% reduction in perceived load time |
| "Error occurred" messages | Context-specific error + recovery CTA | UX standard since ~2020 | Reduces user abandonment on errors |
| No haptic in web | navigator.vibrate() in PWAs | Available since Chrome 30+ | Premium feel on Android; no-op on iOS |
| Numbered step indicators | Progress bar + "Step X of Y" text | Current best practice | Clearer sense of progress and completion |

**Deprecated/outdated:**
- Loading spinners as primary loading indicator (replaced by skeletons)
- `window.confirm()` for destructive actions (the codebase still uses this in Workouts.tsx line 136 and Settings.tsx -- should be replaced with custom modal, but that's beyond Phase 3 scope)

## Open Questions

1. **Suspense vs. Manual Loading States**
   - What we know: App uses React.lazy() + Suspense for code-split routes. All store data comes from localStorage (synchronous).
   - What's unclear: Should we add loading states within screens for the case where localStorage takes time to parse large datasets?
   - Recommendation: Only use skeletons as Suspense fallbacks. Don't add manual loading states to store reads since localStorage hydration is synchronous. If future API calls are added, reassess.

2. **Haptic Feedback Granularity**
   - What we know: Success criteria says "key actions (set completion, workout finish)". navigator.vibrate works on Android only.
   - What's unclear: Should we also add haptics to check-in, XP claim, achievement unlock, and tab navigation?
   - Recommendation: Add to set completion, workout finish, check-in, and XP claim as explicitly required. Achievement unlock is a good bonus. Skip tab navigation -- too frequent.

3. **Theme-Aware Empty States**
   - What we know: App has dual themes (Trained = minimal/dark, GYG = colorful/gamified). Each theme uses different language ("Protocol" vs "System", etc.).
   - What's unclear: Should empty state messages differ per theme?
   - Recommendation: Yes, use `useTheme()` to select appropriate copy. The EmptyState component should accept `title` and `description` as props, letting each screen pass theme-appropriate text.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis -- `src/components/Skeleton.tsx`, `src/App.tsx`, all screen files, `src/stores/toastStore.ts`
- [MDN Navigator.vibrate()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate) -- API specification, browser compatibility, security requirements
- [MDN Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) -- Pattern format documentation

### Secondary (MEDIUM confidence)
- [LogRocket: Handling React Loading States](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/) -- Skeleton best practices
- [Carbon Design System: Empty States](https://carbondesignsystem.com/patterns/empty-states-pattern/) -- Empty state taxonomy and patterns
- [Sentry: Error Handling in React](https://blog.sentry.io/guide-to-error-and-exception-handling-in-react/) -- Error boundary and message patterns
- [618media: Error Messages for Better UX](https://618media.com/en/blog/error-messages-for-better-user-experience/) -- Friendly error message writing guide

### Tertiary (LOW confidence)
- [Medium: Haptic Feedback in Web Design](https://medium.com/@officialsafamarva/haptic-feedback-in-web-design-ux-you-can-feel-10e1a5095cee) -- Future direction of haptics in web
- [Ironeko: Skeleton Loading Do's and Don'ts](https://ironeko.com/posts/the-dos-and-donts-of-skeleton-loading-in-react) -- Practical skeleton patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools are already installed and used in the codebase
- Architecture: HIGH -- patterns are direct extensions of existing code (Skeleton.tsx, Toast.tsx, Onboarding.tsx)
- Pitfalls: HIGH -- verified against actual codebase patterns and known API limitations
- Haptic feedback: MEDIUM -- navigator.vibrate API well-documented but iOS limitation means degraded experience for a portion of users

**Research date:** 2026-02-05
**Valid until:** 2026-04-05 (stable domain, no fast-moving dependencies)
