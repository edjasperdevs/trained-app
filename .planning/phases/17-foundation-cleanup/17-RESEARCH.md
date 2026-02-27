# Phase 17: Foundation Cleanup - Research

**Researched:** 2026-02-27
**Domain:** Coach code removal + Dopamine Noir V2 design token migration
**Confidence:** HIGH

## Summary

Phase 17 performs two independent but sequential operations on the existing codebase: (1) strip all coach DASHBOARD code while preserving client-side coach data flows, and (2) migrate the entire color system from red (#D55550) to lime (#C8FF00) "Dopamine Noir V2" tokens. These are both purely subtractive/transformative -- no new features, no new dependencies.

The coach stripping is the riskier operation. The critical nuance is that the REQUIREMENTS mandate preserving `pullCoachData()`, assigned workout display, weekly check-in submission, and coach-set macro handling for CLIENTS who have a coach relationship. Only the coach DASHBOARD screen (`Coach.tsx`), the 4 coach-specific hooks, the `CoachGuard` component, the `/coach` route, the `isCoach()` helper, the coach nav link suppression, and coach-only Settings UI are removed. The ARCHITECTURE.md research was more aggressive (proposing to remove ALL coach features including `pullCoachData`), but the Phase 17 REQUIREMENTS (STRIP-03 through STRIP-06, Success Criteria #2 and #3) explicitly require preserving the client-facing coach data flows. The requirements are authoritative.

The design token migration is straightforward: update CSS custom properties in `index.css`, update the `@theme` block, and verify all screens render correctly. The three-font typography (Oswald/Inter/JetBrains Mono) is already in place. The color migration is the main change -- replacing the red primary (#D55550) with lime signal (#C8FF00) and adjusting surface/foreground/muted values to match the V2 spec.

**Primary recommendation:** Execute coach stripping first (Plan 17-01) with `tsc --noEmit` validation after each step, then execute design token migration (Plan 17-02). The two operations should not be interleaved because coach stripping changes TypeScript signatures.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRIP-01 | Coach.tsx screen, 4 coach hooks, and 4 coach-specific components removed | Full file inventory documented: Coach.tsx (2158 lines), useClientRoster.ts, useClientDetails.ts, useCoachTemplates.ts + WorkoutAssigner.tsx, ClientMacroAdherence.tsx, ClientActivityFeed.tsx (coach-only components in components/index.ts) |
| STRIP-02 | /coach route and CoachGuard component removed | CoachGuard is inline in App.tsx (lines 23-33), /coach route at line 269, Coach lazy import at line 42, isCoach import at line 15 |
| STRIP-03 | pullCoachData() sync preserved for clients receiving coach-assigned data | pullCoachData in sync.ts (lines 821-905) pulls macro_targets, assigned_workouts, and weekly_checkins. KEEP this function -- clients with coaches still need it |
| STRIP-04 | set_by:'coach' macro target handling preserved in macroStore and sync | macroStore has setBy, setByCoachId, coachMacroUpdated, setCoachTargets (line 528). pushClientData guards macro push with `setBy !== 'coach'` (line 776). KEEP all of this |
| STRIP-05 | Weekly check-in submission flow preserved | WeeklyCheckIn.tsx screen (route /checkin), useWeeklyCheckins hook's client-side functions (submitCheckin, fetchMyCheckins, hasCheckinForCurrentWeek, isCoachingClient). KEEP these -- only remove COACH-side functions (fetchPendingCheckins, fetchClientCheckins, submitReview) |
| STRIP-06 | Assigned workout display and "Assigned by Coach" badge preserved | Workouts.tsx lines 301-370: hasAssignment check, "Assigned by Coach" badge, prescribed exercises preview, coach notes. workoutStore's assignedWorkout state + setter. KEEP all of this |
| STRIP-07 | isCoach() helper, coach nav link, and coach-only Settings UI removed | isCoach() in supabase.ts (lines 43-56), exported from lib/index.ts. Navigation.tsx line 23 hides nav on /coach. Settings.tsx lines 76-88 (isCoach state + checkIsCoach call) and lines 912-929 (coach dashboard card). Also: analytics.coachDashboardViewed (line 88 of analytics.ts) |
| DESIGN-01 | App uses Dopamine Noir V2 color tokens | Current tokens in index.css :root block. V2 spec: Background #0A0A0A (same), Surface #26282B, Foreground #FAFAFA, Muted #A1A1AA, Signal #C8FF00, Signal FG #0A0A0A, Border #26282B, Destructive #B91C1C |
| DESIGN-02 | Primary CTAs use Signal background with Signal FG text and 0.75rem border radius | Currently primary is #D55550 with white foreground. Change --primary to #C8FF00, --primary-foreground to #0A0A0A. --radius already 0.625rem, bump to 0.75rem |
| DESIGN-03 | Bottom nav icons are Muted by default, Signal when active | Navigation.tsx already uses `text-muted-foreground` (inactive) and `text-primary` (active). Once --primary is lime, this works automatically. Top accent bar also uses bg-primary |
| DESIGN-04 | Progress bars use Signal fill on Surface track | ProgressBar component uses bg-primary for fill. Once --primary is lime and surface is updated, this works. Verify ProgressBar and XPDisplay components |
| DESIGN-05 | Cards use Surface background with Border color, no heavy shadows | Current --card: #141414, --border: #2A2A2A. V2 spec: Surface #26282B, Border #26282B. Update --card to match V2 Surface value. Shadows already minimal (shadow-card used sparingly) |
| DESIGN-06 | Typography hierarchy uses Oswald/Inter/JetBrains Mono | Already implemented: @fontsource-variable packages in package.json, --font-heading (Oswald), --font-body (Inter), --font-mono (JetBrains Mono). Global h1/h2/h3 styles in index.css. No changes needed for typography |
</phase_requirements>

## Standard Stack

### Core

No new libraries needed. This phase is purely subtractive (coach removal) and transformative (CSS token changes).

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| React | ^18.3.1 | UI framework | Existing, no change |
| TypeScript | ~5.6.2 | Type checking (`tsc --noEmit`) | Existing, validation tool |
| Tailwind CSS | ^4.1.18 | Utility classes + `@theme` block | Existing, token source |
| Zustand | ^4.5.2 | State management | Existing, store modifications |

### Supporting

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @fontsource-variable/inter | ^5.2.8 | Body font | Already installed |
| @fontsource-variable/oswald | ^5.2.8 | Display font | Already installed |
| @fontsource-variable/jetbrains-mono | ^5.2.8 | Data font | Already installed |

### Alternatives Considered

None. No new dependencies for this phase.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Deletion Order (Coach Code)

The existing ARCHITECTURE.md research proposes a 5-step removal order. However, that research assumed ALL coach features would be removed. Since STRIP-03 through STRIP-06 require PRESERVING client-side coach data flows, the actual removal scope is smaller and the deletion order must be adjusted.

**Revised Safe Removal Order:**

```
Step 1: Delete full files (Coach.tsx, 3 coach-only hooks, 3 coach-only components)
  - src/screens/Coach.tsx (2158 lines)
  - src/hooks/useClientRoster.ts (coach-only, no client usage)
  - src/hooks/useClientDetails.ts (coach-only, no client usage)
  - src/hooks/useCoachTemplates.ts (coach-only, no client usage)
  - src/components/WorkoutAssigner.tsx (coach-only component)
  - src/components/ClientMacroAdherence.tsx (coach-only component)
  - src/components/ClientActivityFeed.tsx (coach-only component)
  → tsc --noEmit (will fail -- proceed to Step 2 to fix)

Step 2: Fix imports and exports referencing deleted files
  - src/screens/index.ts: remove Coach export
  - src/components/index.ts: remove ClientMacroAdherence, ClientActivityFeed exports
  - src/App.tsx: remove CoachGuard, Coach lazy import, /coach route,
    isCoach import, isCoachRoute check, /coach auth route
  - src/lib/supabase.ts: remove isCoach() helper
  - src/lib/index.ts: remove isCoach export
  → tsc --noEmit (should pass)

Step 3: Remove coach-only code from shared files (Settings, Navigation, analytics, devSeed, badge)
  - src/screens/Settings.tsx: remove isCoach state, checkIsCoach effect,
    coach dashboard card, isCoach import
  - src/components/Navigation.tsx: remove `/coach` return-null check
  - src/lib/analytics.ts: remove coachDashboardViewed event
  - src/lib/devSeed.ts: remove mock coach data (getMockClients, mockWorkoutTemplates,
    mockAssignedWorkouts, mockWeeklyCheckins and related functions)
  - src/lib/badge.ts: remove coach response badge logic
  → tsc --noEmit (should pass)

Step 4: Clean up useWeeklyCheckins hook (remove coach-side functions, keep client-side)
  - Remove: fetchPendingCheckins, fetchClientCheckins, submitReview,
    PendingCheckin interface, pendingCheckins state, clientCheckins state
  - Keep: submitCheckin, fetchMyCheckins, hasCheckinForCurrentWeek,
    isCoachingClient, myCheckins state
  → tsc --noEmit (should pass)

Step 5: Clean up Home.tsx coach banners (remove coach response modal, simplify)
  - Remove: showCoachResponse state, coach response modal JSX,
    latestCheckinInfo reading from localStorage, hasCoachResponse logic
  - Keep: hasCoach state (still needed for weekly check-in banner),
    weeklyCheckinDue state, check-in due banner
  → tsc --noEmit (should pass)
```

### CSS Token Migration Pattern

The design token migration touches a single file (`src/index.css`) with ripple effects through the entire app via Tailwind utility classes.

**Current → V2 Token Mapping:**

```
:root CSS Variables:
  --background:          #0A0A0A  →  #0A0A0A  (no change)
  --foreground:          #E8E8E8  →  #FAFAFA  (brighter)
  --card:                #141414  →  #26282B  (V2 Surface)
  --card-foreground:     #E8E8E8  →  #FAFAFA  (match foreground)
  --popover:             #1C1C1C  →  #26282B  (match Surface)
  --popover-foreground:  #E8E8E8  →  #FAFAFA  (match foreground)
  --primary:             #D55550  →  #C8FF00  (red → lime)
  --primary-foreground:  #FFFFFF  →  #0A0A0A  (white → dark, for contrast on lime)
  --secondary:           #4A4A4A  →  #26282B  (match Surface)
  --secondary-foreground:#E8E8E8  →  #FAFAFA
  --muted:               #1C1C1C  →  #26282B  (or keep darker for contrast)
  --muted-foreground:    #888888  →  #A1A1AA  (V2 Muted text)
  --accent:              #1C1C1C  →  #26282B
  --accent-foreground:   #E8E8E8  →  #FAFAFA
  --destructive:         #D55550  →  #B91C1C  (V2 Destructive, now distinct from primary)
  --border:              #2A2A2A  →  #26282B  (V2 Border)
  --input:               #2A2A2A  →  #26282B
  --ring:                #D55550  →  #C8FF00  (match Signal)
  --radius:              0.625rem →  0.75rem  (V2 button radius)

@theme Block Custom Tokens:
  --color-surface:         #141414  →  #26282B
  --color-surface-elevated:#1C1C1C  →  #26282B or #2E3033 (slightly lighter)
  --color-primary-hover:   #E0605A  →  #D4FF33 (lighter lime)
  --color-primary-muted:   rgba(213,85,80,0.15) → rgba(200,255,0,0.15)
  ... (all red-referencing tokens update to lime equivalents)

Glow/Shadow Updates:
  --shadow-glow:         rgba(213,85,80,0.2)  →  rgba(200,255,0,0.2)
  --shadow-glow-intense: rgba(213,85,80,0.4)  →  rgba(200,255,0,0.4)
```

### Anti-Patterns to Avoid

- **Removing pullCoachData or client coach flows:** The ARCHITECTURE.md research assumed total coach removal. The REQUIREMENTS (STRIP-03 through STRIP-06) mandate preserving these. Do NOT follow ARCHITECTURE.md's aggressive removal plan for client-side coach data.
- **Interleaving coach removal with design changes:** Run `tsc --noEmit` between coach removal steps. Design token changes should be a separate plan executed after coach code compiles cleanly.
- **Hard-coded color values in component files:** Some components may use inline hex colors (e.g., `#D55550` in JSX). These must be caught and replaced. Use `grep -r '#D55550\|#E0605A\|#d55550\|#e0605a'` to find them.
- **Forgetting to update chart colors:** The `:root` block has separate chart color variables (`--chart-1` through `--chart-5`) that currently use #D55550. These need updating.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color contrast checking | Manual WCAG math | Online WCAG contrast checker | Lime on dark backgrounds needs verification for 4.5:1 text contrast |
| CSS variable search | Manual file reading | `grep -r` for hex values | Hard-coded colors may exist outside index.css |

**Key insight:** The design system is entirely CSS-variable-driven through Tailwind's `@theme` block. Changing the root variables changes the entire app. But hard-coded hex values in JSX or inline styles will be missed.

## Common Pitfalls

### Pitfall 1: Deleting useWeeklyCheckins entirely
**What goes wrong:** The weekly check-in submission screen (`/checkin`) and the "check-in due" banner on Home.tsx break.
**Why it happens:** The ARCHITECTURE.md research says "Delete useWeeklyCheckins.ts" but STRIP-05 requires preserving the check-in submission flow.
**How to avoid:** Only remove COACH-side functions from useWeeklyCheckins. Keep submitCheckin, fetchMyCheckins, hasCheckinForCurrentWeek, isCoachingClient.
**Warning signs:** `/checkin` route renders a blank screen or crashes.

### Pitfall 2: Removing assignedWorkout from workoutStore
**What goes wrong:** Clients with coach-assigned workouts see no workout on their Workouts screen.
**Why it happens:** The ARCHITECTURE.md research says "Strip assignedWorkout" but STRIP-06 requires preserving assigned workout display.
**How to avoid:** Keep assignedWorkout state, setAssignedWorkout setter, and all assignment display logic in Workouts.tsx.
**Warning signs:** `hasAssignment` always false, "Assigned by Coach" badge never appears.

### Pitfall 3: Removing pullCoachData from sync.ts
**What goes wrong:** Clients with coaches never receive updated macro targets, assigned workouts, or check-in data.
**Why it happens:** The ARCHITECTURE.md research says "Delete pullCoachData entirely" but STRIP-03 requires preserving it.
**How to avoid:** Keep pullCoachData and all its callers (App.tsx online/visibility/foreground handlers, authStore.syncData).
**Warning signs:** Coach-set macros never appear on client's Macros screen.

### Pitfall 4: Lime text on dark backgrounds failing WCAG contrast
**What goes wrong:** #C8FF00 on #0A0A0A actually has excellent contrast (>14:1). But #C8FF00 as BACKGROUND with #0A0A0A text also works well (~14:1). The real risk is lime on SURFACE (#26282B) -- check this.
**Why it happens:** The Surface color is lighter than Background, reducing contrast.
**How to avoid:** Verify #C8FF00 on #26282B (lime text on surface card) -- this should be approximately 9:1, which passes. But test specifically.
**Warning signs:** Text appears washed out on card backgrounds.

### Pitfall 5: Stale devSeed mock data referencing coach types
**What goes wrong:** Dev bypass mode crashes because it references deleted hooks or coach types.
**Why it happens:** devSeed.ts has mock coach data (getMockClients, mockWorkoutTemplates, etc.) that may be imported by deleted hooks.
**How to avoid:** Clean up devSeed.ts in Step 3 -- remove mock data functions that are only used by deleted hooks. Keep mock data used by preserved client-side code (e.g., mock check-in data for useWeeklyCheckins).
**Warning signs:** `VITE_DEV_BYPASS=true` mode throws import errors.

### Pitfall 6: index.html mask-icon color still references old brand
**What goes wrong:** The mask-icon in index.html uses `color="#8B1A1A"` (dark red).
**Why it happens:** meta tags are outside the CSS variable system.
**How to avoid:** Update the mask-icon color to match V2 brand. The `theme-color` is already #0a0a0a (correct).
**Warning signs:** Safari pinned tab shows red instead of lime.

### Pitfall 7: IntakeView/intakeApi coach_notes field
**What goes wrong:** These files reference `coach_notes` but they're part of the intake dashboard (welltrained-coach's intake form data, not the in-app coach dashboard).
**Why it happens:** Confusing naming -- `coach_notes` in intake is a data field on the intake submission, not related to the coach dashboard.
**How to avoid:** Do NOT remove coach_notes references from IntakeView.tsx, intakeApi.ts, or intakeTypes.ts. These are intake form data fields, not coach dashboard code.
**Warning signs:** Intake view breaks for the intake dashboard.

## Code Examples

### Example 1: useWeeklyCheckins after coach stripping

The hook should have its coach-specific functions removed but retain all client functions:

```typescript
// src/hooks/useWeeklyCheckins.ts (after stripping)
export function useWeeklyCheckins() {
  const [myCheckins, setMyCheckins] = useState<WeeklyCheckin[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  // ... (mount/unmount effect unchanged)

  // CLIENT functions (KEEP ALL):
  const submitCheckin = useCallback(async (...) => { ... }, [])
  const fetchMyCheckins = useCallback(async () => { ... }, [])
  const hasCheckinForCurrentWeek = useCallback(async () => { ... }, [])
  const isCoachingClient = useCallback(async () => { ... }, [])

  // REMOVED: fetchPendingCheckins, fetchClientCheckins, submitReview
  // REMOVED: pendingCheckins state, clientCheckins state, PendingCheckin type

  return {
    myCheckins,
    isLoading,
    error,
    submitCheckin,
    fetchMyCheckins,
    hasCheckinForCurrentWeek,
    isCoachingClient,
  }
}
```

### Example 2: Settings.tsx after coach stripping

```typescript
// Remove these lines:
import { isCoach as checkIsCoach, getSupabaseClient } from '@/lib/supabase'
// becomes:
import { getSupabaseClient } from '@/lib/supabase'

// Remove state:
// const [isCoach, setIsCoach] = useState(false)

// Remove from useEffect:
// checkIsCoach().then(setIsCoach)

// Remove the entire Coach Dashboard card (lines 912-929):
// {isCoach && ( <Card>...</Card> )}

// KEEP hasCoach state + coach_clients check (needed for weekly check-in notification visibility)
```

### Example 3: CSS token update (index.css :root)

```css
:root {
  --radius: 0.75rem;
  --background: #0A0A0A;
  --foreground: #FAFAFA;
  --card: #26282B;
  --card-foreground: #FAFAFA;
  --popover: #26282B;
  --popover-foreground: #FAFAFA;
  --primary: #C8FF00;
  --primary-foreground: #0A0A0A;
  --secondary: #26282B;
  --secondary-foreground: #FAFAFA;
  --muted: #1C1C1C;
  --muted-foreground: #A1A1AA;
  --accent: #26282B;
  --accent-foreground: #FAFAFA;
  --destructive: #B91C1C;
  --border: #26282B;
  --input: #26282B;
  --ring: #C8FF00;
  /* chart and sidebar colors also updated */
}
```

### Example 4: App.tsx after coach stripping

```typescript
// REMOVE:
// import { isCoach } from '@/lib/supabase'
// The CoachGuard function (lines 23-33)
// const Coach = lazy(...)
// const isCoachRoute = location.pathname === '/coach'
// The /coach route in unauthenticated routes
// The isCoachRoute bypass in onboarding check
// The /coach route in authenticated routes

// KEEP:
// import { pullCoachData } from '@/lib/sync'  ← STILL NEEDED (STRIP-03)
// All pullCoachData calls in handleOnline, handleVisibilityChange, appStateChange
// The /checkin route  ← STILL NEEDED (STRIP-05)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Red primary (#D55550) | Lime signal (#C8FF00) | V2 spec | All screens change visually |
| Coach dashboard in trained-app | Coach dashboard in welltrained-coach | V2 architecture | ~4000+ lines removed |
| White primary-foreground | Dark primary-foreground (#0A0A0A) | V2 spec | Buttons go from white-on-red to dark-on-lime |

## Open Questions

1. **devSeed.ts cleanup scope**
   - What we know: devSeed.ts has extensive mock coach data (~300 lines). Some mocks are used by deleted hooks (getMockClients, mockWorkoutTemplates, mockAssignedWorkouts), some by preserved code (mockWeeklyCheckins used by useWeeklyCheckins).
   - What's unclear: Exactly which mock functions are only imported by deleted files vs preserved files.
   - Recommendation: During execution, trace imports before deleting. Remove mock data that is only consumed by deleted files.

2. **database.types.ts coach-related types**
   - What we know: database.types.ts defines types for coach tables (coach_clients, assigned_workouts, weekly_checkins, workout_templates). Some types are used by preserved code (WeeklyCheckin, AssignedWorkout, PrescribedExercise).
   - What's unclear: Whether removing WorkoutTemplate type (only used by useCoachTemplates) will cause issues.
   - Recommendation: Leave database.types.ts largely intact. It's auto-generated from Supabase schema. Only remove exports that are unused after stripping.

3. **Surface color: #26282B for both card and border?**
   - What we know: The V2 spec uses #26282B for both Surface AND Border. Currently card (#141414) and border (#2A2A2A) are different.
   - What's unclear: Whether making card and border the same color will make cards invisible against their borders.
   - Recommendation: Set `--card` to #26282B but consider keeping `--border` slightly different (e.g., #333538 or keep #2A2A2A) to maintain visual separation. Or use the spec as written and rely on spacing/padding for card definition. This is a judgment call during implementation.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: src/index.css, src/App.tsx, src/lib/sync.ts, src/stores/macroStore.ts, src/stores/workoutStore.ts, src/screens/Coach.tsx, src/screens/Settings.tsx, src/screens/Home.tsx, src/screens/Workouts.tsx, src/components/Navigation.tsx
- .planning/REQUIREMENTS.md: STRIP-01 through STRIP-07, DESIGN-01 through DESIGN-06
- .planning/research/ARCHITECTURE.md: Coach stripping inventory, store analysis, sync architecture
- WellTrained V2 Master Specification (Part 1: Dopamine Noir V2 design system)

### Secondary (MEDIUM confidence)
- .planning/research/ARCHITECTURE.md coach removal order: The 5-step order is well-reasoned but the SCOPE was wrong (too aggressive). The ordering logic is valid when applied to the correct subset of files.

### Tertiary (LOW confidence)
- None. All findings verified from direct codebase analysis.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, purely editing existing code
- Architecture: HIGH - Complete file inventory with line numbers, verified imports/exports
- Pitfalls: HIGH - Critical conflict between ARCHITECTURE.md and REQUIREMENTS identified and resolved; all edge cases documented

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable -- no external dependency changes)
