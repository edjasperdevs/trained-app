# Phase 18: Gamification Engine - Research

**Researched:** 2026-02-27
**Domain:** Zustand store migration, rank progression system, celebration UI
**Confidence:** HIGH

## Summary

Phase 18 replaces the existing XP/level system with Discipline Points (DP) and a 15-rank progression. The codebase already has a fully functional `xpStore` (305 lines, `gamify-gains-xp` localStorage key) with daily logging, weekly claiming, level calculation, and progress tracking. The new `dpStore` must replicate this architecture but with different values: new DP amounts per GAME-01 (training +50, meal +15, protein +25, steps +10, sleep +10), 15 named ranks per GAME-02, immediate DP accrual (no weekly claim gate), and an Obedience Streak counter per GAME-05.

The existing XP system has deep tentacles: 14+ files import `useXPStore` or reference XP data. The store itself is consumed by Home, Workouts, CheckInModal, XPClaimModal, XPDisplay, WeeklySummary, StreakDisplay, AvatarScreen, Settings (export/import/reset), Achievements, Onboarding, sync.ts, badge.ts, remindersStore, and authStore. The migration strategy is to create `dpStore` as a drop-in replacement with the same hook pattern (`useDPStore`), then update all consumers to import from the new store. The old `xpStore` stays untouched for now -- Phase 24 handles the data migration cleanup.

The UI work for Plan 18-02 builds on existing components: `XPDisplay`, `ProgressBar`, `StreakDisplay`, and the confetti/celebration system in `XPClaimModal`. These components already use `LABELS.xp` ("DP"), `LABELS.level` ("Rank"), and `LABELS.streak` ("Obedience Streak") from `src/design/constants.ts` -- the naming is already correct. The rank-up celebration animation can reuse the existing confetti particle system and level-up phase from XPClaimModal.

**Primary recommendation:** Create `dpStore` as a clean new store with the V2 DP/rank model, then systematically replace all `useXPStore` imports across the codebase. Keep `xpStore.ts` file intact but unused -- Phase 24 reads it for migration cleanup.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GAME-01 | User earns DP for daily actions: training (+50), tracked meals (+15), 10k+ steps (+10), hit protein target (+25), 7h+ sleep (+10) | dpStore implements `DP_VALUES` with these exact amounts. Steps/sleep DP deferred to Phase 20 (healthStore doesn't exist yet) but constants defined now. Meal tracking (+15) is NEW -- must hook into macroStore meal logging, not just protein hit. |
| GAME-02 | User progresses through 15 named ranks based on cumulative DP thresholds | dpStore implements rank table: 15 ranks from Initiate (0 DP) to Master. Cumulative thresholds calculated from rank config array. `currentRank` derived from `totalDP`. |
| GAME-05 | User maintains an Obedience Streak by completing at least one core action daily | Existing streak logic in `userStore.updateStreak()` already tracks consecutive days. dpStore adds `obedienceStreak` counter that increments when ANY core action is completed (workout, meal, protein). Replaces xpStore's streak bonus with dpStore's own streak tracking. |
| GAME-08 | User can view current rank, cumulative DP, and progress toward next rank | Home screen already has Avatar + XPDisplay card. Replace `XPDisplay` internals to show rank name, total DP, and progress bar. `ProgressBar` component already exists with correct design tokens. |
| GAME-09 | Rank-up triggers a celebration animation and notification | Existing `XPClaimModal` has a "Level Up" phase with confetti, pulse-scale animation, and rank display. Adapt this pattern for immediate rank-up (no weekly claim gate in V2). Add local notification via existing `@capacitor/local-notifications`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^4.5.2 | State management with persist middleware | Already used for all 9 stores in the app |
| zustand/middleware (persist) | ^4.5.2 | localStorage persistence | All stores use `persist` with `gamify-gains-*` keys |
| react | ^18.3.1 | UI rendering | Existing framework |
| lucide-react | ^0.563.0 | Icons | Used across all screens |
| class-variance-authority | ^0.7.1 | Component variants (ProgressBar) | Already used for ProgressBar variants |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @capacitor/local-notifications | ^7.0.5 | Rank-up notification | When user reaches a new rank |
| @capacitor/haptics | ^7.0.3 | Rank-up haptic feedback | Celebration moment on rank-up |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New dpStore file | Modify xpStore in-place | In-place modification risks breaking the V1 data migration path in Phase 24 -- separate file is safer |
| CSS animations (existing) | canvas-confetti library | The existing hand-rolled confetti in XPClaimModal works well and uses V2 colors -- no new dependency needed |
| Immediate DP accrual | Weekly claim pattern (V1) | V2 spec says DP is earned immediately, not accumulated and claimed weekly |

**Installation:**
```bash
# No new dependencies needed -- everything is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  stores/
    dpStore.ts           # NEW: Discipline Points store (replaces xpStore)
    xpStore.ts           # KEEP: Untouched for Phase 24 migration
    achievementsStore.ts # UPDATE: Change xpStore refs to dpStore
    authStore.ts         # UPDATE: Change resetXP to resetDP
    remindersStore.ts    # UPDATE: Change xpStore refs to dpStore
    index.ts             # UPDATE: Export useDPStore, keep useXPStore for Phase 24
  components/
    DPDisplay.tsx        # NEW: Replaces XPDisplay (rank name, DP total, progress bar)
    RankUpModal.tsx      # NEW: Rank-up celebration (adapted from XPClaimModal level-up phase)
    StreakDisplay.tsx     # UPDATE: Read from dpStore instead of xpStore
    WeeklySummary.tsx     # UPDATE: Read from dpStore instead of xpStore
  screens/
    Home.tsx             # UPDATE: Replace XPDisplay with DPDisplay, remove XPClaimModal
    CheckInModal.tsx     # UPDATE: Use dpStore.awardDP() instead of logDailyXP()
    Workouts.tsx         # UPDATE: Use dpStore.awardDP() instead of logDailyXP()
    XPClaimModal.tsx     # KEEP: Dead code after migration, removed in Phase 24
    Settings.tsx         # UPDATE: Export/import/reset uses dpStore
  design/
    constants.ts         # No changes needed -- LABELS already say "DP", "Rank", "Obedience Streak"
  lib/
    badge.ts             # UPDATE: Use dpStore instead of xpStore
    sync.ts              # UPDATE: Push dpStore state to user_xp table (or new table)
```

### Pattern 1: dpStore Shape
**What:** Zustand persist store with DP values, rank table, and immediate accrual
**When to use:** All DP-related state

```typescript
// src/stores/dpStore.ts

interface DailyDP {
  date: string
  training: number    // +50 per workout
  meals: number       // +15 per tracked meal
  protein: number     // +25 for hitting target
  steps: number       // +10 for 10k+ (Phase 20)
  sleep: number       // +10 for 7h+ (Phase 20)
  total: number
}

interface DPStore {
  totalDP: number
  currentRank: number         // 1-15
  obedienceStreak: number     // consecutive days with >= 1 core action
  longestObedienceStreak: number
  lastActionDate: string | null
  dailyLogs: DailyDP[]

  // Actions
  awardDP: (action: DPAction, amount?: number) => { dpAwarded: number; rankedUp: boolean; newRank: number }
  getRankInfo: () => { name: string; rank: number; dpForNext: number; progress: number }
  checkObedienceStreak: () => void
  resetDP: () => void
}

// 15-rank system
const RANKS = [
  { rank: 1,  name: 'Initiate',     threshold: 0 },
  { rank: 2,  name: 'Novice',       threshold: 200 },
  { rank: 3,  name: 'Trainee',      threshold: 500 },
  { rank: 4,  name: 'Disciplined',  threshold: 1000 },
  { rank: 5,  name: 'Committed',    threshold: 2000 },
  { rank: 6,  name: 'Devoted',      threshold: 3500 },
  { rank: 7,  name: 'Obedient',     threshold: 5500 },
  { rank: 8,  name: 'Conditioned',  threshold: 8000 },
  { rank: 9,  name: 'Hardened',     threshold: 11000 },
  { rank: 10, name: 'Proven',       threshold: 15000 },
  { rank: 11, name: 'Forged',       threshold: 20000 },
  { rank: 12, name: 'Tempered',     threshold: 27000 },
  { rank: 13, name: 'Dominant',     threshold: 36000 },
  { rank: 14, name: 'Elite',        threshold: 48000 },
  { rank: 15, name: 'Master',       threshold: 65000 },
]
```

### Pattern 2: Immediate DP Accrual (V1 to V2 Change)
**What:** DP is awarded immediately when an action completes, not accumulated and claimed weekly
**When to use:** Every DP-earning action

V1 flow: `logDailyXP()` -> accumulate `pendingXP` -> `claimWeeklyXP()` after 7 days -> add to `totalXP` -> check level-up

V2 flow: `awardDP('training')` -> immediately add to `totalDP` -> immediately check rank-up -> if ranked up, trigger celebration

```typescript
awardDP: (action, amount) => {
  const dpAmount = amount ?? DP_VALUES[action]
  const newTotal = get().totalDP + dpAmount
  const oldRank = get().currentRank
  const newRank = calculateRank(newTotal)
  const rankedUp = newRank > oldRank

  // Update daily log
  const today = getLocalDateString()
  // ... update or create daily log entry

  set({ totalDP: newTotal, currentRank: newRank })

  // Update obedience streak
  get().checkObedienceStreak()

  return { dpAwarded: dpAmount, rankedUp, newRank }
}
```

### Pattern 3: Rank-Up Detection and Celebration
**What:** When `awardDP()` returns `rankedUp: true`, the calling component triggers a celebration
**When to use:** Every call site that awards DP

```typescript
// In CheckInModal, Workouts, etc:
const result = useDPStore.getState().awardDP('training')
if (result.rankedUp) {
  // Show RankUpModal with rank name, confetti, haptic
  setRankUpData({ oldRank: result.newRank - 1, newRank: result.newRank })
  setShowRankUp(true)
  haptics.heavy()
}
```

### Pattern 4: Obedience Streak (Replaces V1 Streak)
**What:** A counter that increments daily when at least one core action is completed
**When to use:** After any DP-earning action

The existing streak in `userStore` counts consecutive check-in days. The V2 Obedience Streak counts consecutive days with ANY core action (workout, meal log, protein hit). This is tracked in `dpStore` directly, not `userStore`.

Key difference: V1 streak only increments on check-in submission. V2 streak increments on any DP-earning action.

```typescript
checkObedienceStreak: () => {
  const today = getLocalDateString()
  const lastAction = get().lastActionDate
  const currentStreak = get().obedienceStreak

  if (lastAction === today) return // Already counted today

  if (lastAction && getLocalDaysDifference(lastAction, today) === 1) {
    // Consecutive day
    const newStreak = currentStreak + 1
    set({
      obedienceStreak: newStreak,
      longestObedienceStreak: Math.max(get().longestObedienceStreak, newStreak),
      lastActionDate: today
    })
  } else if (!lastAction || getLocalDaysDifference(lastAction, today) > 1) {
    // First action or gap > 1 day -> reset to 1
    set({ obedienceStreak: 1, lastActionDate: today })
  }
}
```

### Anti-Patterns to Avoid
- **Modifying xpStore.ts:** The file must stay untouched for Phase 24 data migration. Create a new dpStore.ts instead.
- **Keeping weekly claim gate:** V2 awards DP immediately. Don't carry over the `pendingXP` / `claimWeeklyXP()` / `canClaimXP()` pattern.
- **Forgetting to check rank-up at every award site:** Every place that calls `awardDP()` must handle the `rankedUp` return value.
- **Double-counting streak:** The dpStore obedience streak replaces the userStore check-in streak. Don't maintain both.
- **Hardcoding rank thresholds in UI:** Always derive rank info from `getRankInfo()` -- thresholds may change in Phase 21 (archetype modifiers).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confetti animation | New animation system | Existing confetti from XPClaimModal | Already built, uses V2 lime colors, tested |
| Progress bar component | New progress bar | Existing ProgressBar component | CVA-based, supports multiple colors/sizes, uses V2 tokens |
| Date calculations | Manual Date math | Existing dateUtils.ts helpers | `getLocalDateString()`, `getLocalDaysDifference()`, `getDaysSince()` already handle timezone-safe date comparison |
| Haptic feedback | Raw Capacitor calls | Existing `haptics` module (src/lib/haptics.ts) | Wraps Capacitor haptics with platform detection |
| Toast notifications | Custom notification | Existing `toast()` from toastStore | Used throughout the app for user feedback |
| Local notifications | Raw Capacitor calls | Existing notification patterns from Phase 15 | Already configured with permission handling |

**Key insight:** This phase is largely a data model swap, not a greenfield build. The UI patterns, animation system, and design tokens all exist. The work is: new store -> update consumers -> add rank names to UI.

## Common Pitfalls

### Pitfall 1: localStorage Key Collision
**What goes wrong:** Using the same `gamify-gains-xp` key for dpStore causes Zustand persist to load old XP data into the new DP shape, crashing the app.
**Why it happens:** Both stores would write to the same localStorage slot.
**How to avoid:** Use a NEW localStorage key for dpStore: `trained-dp` (following the app rename pattern). The old `gamify-gains-xp` key stays untouched for Phase 24 migration.
**Warning signs:** App crashes on load, `totalDP` has unexpected large values.

### Pitfall 2: Incomplete Consumer Migration
**What goes wrong:** Some screens still import `useXPStore` and read stale XP data while dpStore holds the real DP data.
**Why it happens:** xpStore is imported in 14+ files. Easy to miss one.
**How to avoid:** Grep for ALL `useXPStore` / `xpStore` / `XP_VALUES` references. Update every file except xpStore.ts itself. Run `tsc --noEmit` to catch missing type changes.
**Warning signs:** Some screens show 0 DP while Home shows real data, or "Rank 0" appears.

### Pitfall 3: Meal Tracking DP Award Point
**What goes wrong:** GAME-01 says "+15 for tracked meals" but the current codebase has no explicit "meal tracked" event -- it only checks protein/calorie targets at check-in time.
**Why it happens:** V1 tracked protein/calorie hits as boolean yes/no. V2 awards DP per meal logged.
**How to avoid:** Hook DP award into `macroStore.logMeal()` or the meal save action in IntakeView/MealBuilder. Each meal log triggers `awardDP('meal')` for +15.
**Warning signs:** Users only earn DP from workouts and protein -- no meal DP despite logging meals.

### Pitfall 4: Streak Reset on App Close
**What goes wrong:** If the streak check only runs when the user performs an action, users who miss a day see their streak as still alive until they next open the app.
**Why it happens:** Zustand persist freezes state between sessions -- no background process detects missed days.
**How to avoid:** On app mount (App.tsx or Home screen), check if `lastActionDate` is > 1 day ago. If so, reset the streak to 0 before rendering.
**Warning signs:** User sees "Streak: 15" after not opening the app for a week, then it drops to 0 on first action.

### Pitfall 5: Rank-Up Celebration Triggers Multiple Times
**What goes wrong:** If multiple actions in the same session push past a rank threshold, the celebration animation fires repeatedly.
**Why it happens:** Each `awardDP()` call independently detects rank-up.
**How to avoid:** Track `lastCelebratedRank` in dpStore. Only trigger celebration when `newRank > lastCelebratedRank`. Update `lastCelebratedRank` after showing the modal.
**Warning signs:** User sees 3 rank-up modals in a row during check-in.

## Code Examples

### Example 1: dpStore Persist Configuration
```typescript
// Source: existing pattern from src/stores/xpStore.ts
export const useDPStore = create<DPStore>()(
  persist(
    (set, get) => ({
      totalDP: 0,
      currentRank: 1,
      obedienceStreak: 0,
      longestObedienceStreak: 0,
      lastActionDate: null,
      dailyLogs: [],
      lastCelebratedRank: 1,
      // ... actions
    }),
    {
      name: 'trained-dp',  // NEW key, NOT gamify-gains-xp
    }
  )
)
```

### Example 2: CheckInModal Migration
```typescript
// BEFORE (V1):
const { logDailyXP, XP_VALUES } = useXPStore()
logDailyXP({
  date: getLocalDateString(),
  workout: data.workout,
  protein: data.protein,
  calories: data.calories,
  checkIn: true,
  perfectDay,
  streakBonus
})

// AFTER (V2):
const { awardDP } = useDPStore.getState()
if (data.workout) awardDP('training')
if (data.protein) awardDP('protein')
// meals are awarded at meal-log time, not check-in
// steps/sleep deferred to Phase 20
```

### Example 3: DPDisplay Component (Replaces XPDisplay)
```typescript
// Source: adapted from src/components/XPDisplay.tsx
export function DPDisplay() {
  const { totalDP, currentRank } = useDPStore()
  const rankInfo = useDPStore((s) => s.getRankInfo)()

  return (
    <div className="text-center">
      {/* Rank name */}
      <p className="text-xs text-muted-foreground uppercase tracking-wider">
        {rankInfo.name}
      </p>
      {/* Rank number + DP */}
      <p className="text-2xl font-bold text-primary font-mono">
        {LABELS.level} {currentRank}
      </p>
      {/* Progress bar */}
      <ProgressBar progress={rankInfo.progress} color="gradient" size="lg" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="font-mono">{totalDP.toLocaleString()} {LABELS.xp}</span>
        <span className="font-mono">{rankInfo.dpForNext.toLocaleString()} to next</span>
      </div>
    </div>
  )
}
```

### Example 4: RankUpModal (Adapted from XPClaimModal level-up phase)
```typescript
// Source: adapted from src/screens/XPClaimModal.tsx "levelup" phase
// Reuses: CONFETTI_COLORS, confetti-fall keyframes, pulse-scale animation

function RankUpModal({ oldRank, newRank, rankName, onClose }) {
  const confettiParticles = useMemo(() =>
    Array.from({ length: 25 }).map(() => ({
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      // ... same particle config
    }))
  , [])

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 ...">
      {/* Confetti overlay */}
      {/* Rank name with pulse animation */}
      <h2 className="text-3xl font-bold text-primary">{rankName}</h2>
      {/* Old rank -> New rank transition */}
      <div className="flex items-center gap-4">
        <span>Rank {oldRank}</span>
        <ChevronRight />
        <span className="text-primary">Rank {newRank}</span>
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach (V1) | Current Approach (V2) | When Changed | Impact |
|--------------------|-----------------------|--------------|--------|
| Weekly XP claim gate | Immediate DP accrual | V2 redesign | Removes claimWeeklyXP, canClaimXP, pendingXP, lastClaimDate, XPClaimModal |
| 99-level system (numeric only) | 15 named ranks with thresholds | V2 redesign | Named ranks add identity; fewer ranks make each one feel meaningful |
| XP values: WORKOUT 100, PROTEIN 50, CALORIES 50, CHECK_IN 25, PERFECT_DAY 25, STREAK_PER_DAY 10 | DP values: TRAINING 50, MEAL 15, PROTEIN 25, STEPS 10, SLEEP 10 | V2 redesign | Simpler actions, lower per-action values, no "perfect day" bonus, no streak multiplier (deferred to v2.1) |
| Check-in triggers all XP at once | Each action awards DP independently | V2 redesign | More immediate feedback; DP trickles in throughout the day |
| Streak tracked in userStore | Obedience Streak in dpStore | V2 redesign | Single source of truth for gamification state |

**Deprecated/outdated:**
- `pendingXP` / `claimWeeklyXP()` / `canClaimXP()` -- weekly claim concept removed in V2
- `XP_VALUES.CALORIES` / `XP_VALUES.PERFECT_DAY` / `XP_VALUES.STREAK_PER_DAY` -- these specific V1 values don't map to V2
- `XPClaimModal` -- no longer needed (DP accrues immediately)

## Existing File Impact Analysis

Files that import `useXPStore` and MUST be updated in this phase:

| File | What Changes | Priority |
|------|-------------|----------|
| `src/stores/index.ts` | Add `useDPStore` export, keep `useXPStore` for Phase 24 | Plan 18-01 |
| `src/stores/achievementsStore.ts` | `checkProgress` lambdas for level badges read dpStore.currentRank instead of xpStore.currentLevel; `first-checkin` badge reads dpStore.dailyLogs | Plan 18-01 |
| `src/stores/authStore.ts` | `resetXP()` call -> `resetDP()` | Plan 18-01 |
| `src/stores/remindersStore.ts` | `getTodayLog()` and `canClaimXP()` refs -> dpStore equivalents (canClaimXP logic removed) | Plan 18-01 |
| `src/screens/Home.tsx` | Replace `useXPStore` selectors with `useDPStore`; replace `XPDisplay` with `DPDisplay`; remove `XPClaimModal`; show obedience streak from dpStore | Plan 18-02 |
| `src/screens/CheckInModal.tsx` | Replace `logDailyXP()` with `awardDP()` calls; handle rank-up return | Plan 18-02 |
| `src/screens/Workouts.tsx` | Replace `logDailyXP()` with `awardDP('training')`; handle rank-up return | Plan 18-02 |
| `src/screens/Settings.tsx` | Replace export/import/reset XP with DP equivalents | Plan 18-01 |
| `src/screens/AvatarScreen.tsx` | Replace xpStore level/progress with dpStore rank/progress | Plan 18-02 |
| `src/screens/Onboarding.tsx` | Replace `completeXPOnboarding()` with dpStore init (rank 1) | Plan 18-01 |
| `src/components/XPDisplay.tsx` | KEEP but unused after DPDisplay replaces it. Removed in Phase 24. | Plan 18-02 |
| `src/components/StreakDisplay.tsx` | Read dailyLogs from dpStore; streak from dpStore.obedienceStreak | Plan 18-02 |
| `src/components/WeeklySummary.tsx` | Read dailyLogs from dpStore; show DP instead of XP | Plan 18-02 |
| `src/lib/badge.ts` | `getTodayLog()` -> dpStore equivalent | Plan 18-01 |
| `src/lib/sync.ts` | Push dpStore to user_xp (or new table) instead of xpStore | Plan 18-01 |

## DP Values and Rank Thresholds Analysis

### DP Economy Validation

Per GAME-01, daily maximum DP (all actions):
- Training: +50
- 3 tracked meals: +45 (3 x 15)
- Protein target: +25
- Steps 10k+: +10 (Phase 20)
- Sleep 7h+: +10 (Phase 20)
- **Max daily: ~140 DP**

A "perfect week" (7 days, all actions): ~980 DP

### Rank Progression Pacing

Using the proposed thresholds:
| Rank | Name | Threshold | Perfect Weeks to Reach |
|------|------|-----------|----------------------|
| 1 | Initiate | 0 | 0 |
| 2 | Novice | 200 | ~0.2 |
| 3 | Trainee | 500 | ~0.5 |
| 4 | Disciplined | 1,000 | ~1 |
| 5 | Committed | 2,000 | ~2 |
| 6 | Devoted | 3,500 | ~3.6 |
| 7 | Obedient | 5,500 | ~5.6 |
| 8 | Conditioned | 8,000 | ~8.2 |
| 9 | Hardened | 11,000 | ~11.2 |
| 10 | Proven | 15,000 | ~15.3 |
| 11 | Forged | 20,000 | ~20.4 |
| 12 | Tempered | 27,000 | ~27.6 |
| 13 | Dominant | 36,000 | ~36.7 |
| 14 | Elite | 48,000 | ~49.0 |
| 15 | Master | 65,000 | ~66.3 |

This means ~16 months to reach Master with perfect adherence, ~2.5+ years with typical adherence. Early ranks come fast (hook), later ranks take months (retention).

**Note:** These thresholds are proposals. The planner should include them in the dpStore as a configuration array that's easy to adjust.

## Open Questions

1. **Meal DP hook point**
   - What we know: GAME-01 says "+15 for tracked meals" -- this is per-meal, not per-day
   - What's unclear: Where exactly in the meal logging flow to trigger `awardDP('meal')`. Options: (a) when a meal is saved in MealBuilder, (b) when an ingredient is added to a meal slot, (c) when the daily macro log is finalized
   - Recommendation: Award on meal save (MealBuilder submit). This is the clearest "I tracked a meal" moment. Cap at 3 meals/day to prevent farming.

2. **Supabase table: reuse user_xp or create new?**
   - What we know: `user_xp` table exists with columns `total_xp`, `current_level`, `pending_xp`, `last_claim_date`
   - What's unclear: Whether to add columns to user_xp or create a new `user_dp` table
   - Recommendation: Reuse `user_xp` table but rename columns in a migration (or add new columns). Simpler than a new table. Actual migration runs in Phase 24. For now, sync to existing table with mapped column names.

3. **Steps and sleep DP in dpStore**
   - What we know: GAME-01 includes steps (+10) and sleep (+10), but Phase 20 creates the healthStore
   - What's unclear: Whether to wire steps/sleep DP into dpStore now or wait
   - Recommendation: Define `DP_VALUES.STEPS` and `DP_VALUES.SLEEP` constants now, but don't create any award triggers. Phase 20 will call `dpStore.awardDP('steps')` when healthStore detects threshold met.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/stores/xpStore.ts` (305 lines, complete XP system)
- Codebase analysis: `src/stores/achievementsStore.ts` (14 badge definitions reference xpStore)
- Codebase analysis: `src/screens/XPClaimModal.tsx` (423 lines, confetti + level-up celebration)
- Codebase analysis: `src/screens/Home.tsx` (510 lines, XPDisplay + quests + streak)
- Codebase analysis: `src/components/XPDisplay.tsx` (125 lines, level + progress bar)
- Codebase analysis: `src/components/ProgressBar.tsx` (75 lines, CVA-based)
- Codebase analysis: `src/design/constants.ts` (LABELS already use "DP", "Rank", "Obedience Streak")
- Codebase analysis: `src/stores/xpStore.test.ts` (485 lines, comprehensive test coverage)

### Secondary (MEDIUM confidence)
- REQUIREMENTS.md: GAME-01 through GAME-09 requirement definitions
- ROADMAP.md: Phase 18 success criteria and plan descriptions
- STATE.md: Project decisions and accumulated context

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed, all patterns exist in codebase
- Architecture: HIGH - Direct evolution of existing xpStore pattern, well-understood
- Pitfalls: HIGH - Based on concrete codebase analysis of 14+ consumer files

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable -- no external dependencies)
