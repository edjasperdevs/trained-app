# Architecture Patterns: V2 Integration Architecture

**Domain:** Fitness gamification PWA -- V2 feature integration
**Researched:** 2026-02-27
**Confidence:** HIGH (based on direct codebase analysis + verified plugin documentation + V2 spec)
**Focus:** How RevenueCat, HealthKit, DP engine, design tokens, and coach removal integrate with the existing 10-store Zustand + Supabase architecture

---

## Current Architecture Snapshot

### Stores (11 Zustand stores)

| Store | localStorage Key | Persisted | Coach-Coupled | V2 Impact |
|-------|-----------------|-----------|---------------|-----------|
| `userStore` | `gamify-gains-user` | Yes | No | Add archetype field |
| `authStore` | (none) | No | References pullCoachData | Remove coach sync call |
| `xpStore` | `gamify-gains-xp` | Yes | No | **REPLACE** with dpStore |
| `workoutStore` | `gamify-gains-workouts` | Yes | Yes (assignedWorkout) | Strip assignedWorkout, keep core |
| `macroStore` | `gamify-gains-macros` | Yes | Yes (setBy/coachTargets) | Strip coach fields |
| `avatarStore` | `gamify-gains-avatar` | Yes | No | Evolve to 5-stage rank-based system |
| `achievementsStore` | `gamify-gains-achievements` | Yes | No | Update badges to reference dpStore |
| `remindersStore` | `gamify-gains-reminders` | Yes | No | No change |
| `accessStore` | `gamify-gains-access` | Yes | No | **REPLACE** with subscriptionStore (grace period) |
| `syncStore` | (none) | No | No | Remove pullCoachData references |
| `toastStore` | (none) | No | No | No change |

### Sync Architecture (Current)

`sync.ts` has two directional flows:
- **pushClientData()** -- client-owned data to Supabase (profile, weights, macros, workouts, XP)
- **pullCoachData()** -- coach-owned data from Supabase (macro targets with set_by='coach', assigned workouts, weekly check-ins)

Triggered by:
- Login/signup (`authStore.syncData`)
- Debounced after user actions (`scheduleSync`, 2s debounce)
- Reconnection (`flushPendingSync`)
- Visibility change / app foreground (`pullCoachData` + `flushPendingSync` after 30s absence)

**V2 Change:** pullCoachData is removed entirely. Coach features live in the separate welltrained-coach app. The trained-app no longer pulls coach-assigned workouts, coach-set macros, or weekly check-in data.

---

## Recommended V2 Architecture

### New and Modified Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **dpStore** (NEW) | DP accrual, rank calculation, archetype modifiers | userStore (archetype), healthStore (steps/sleep), workoutStore (completion), macroStore (targets hit) |
| **subscriptionStore** (NEW) | RevenueCat entitlement state, paywall gating | RevenueCat SDK, Supabase (via webhook-written `subscriptions` table) |
| **healthStore** (NEW) | HealthKit steps/sleep data, manual fallback entry | HealthKit plugin, dpStore (DP earning) |
| **questStore** (NEW) | Protocol Orders (daily/weekly quests), bonus DP | dpStore, workoutStore, macroStore, healthStore |
| **sync.ts** (MODIFIED) | Remove pullCoachData, add syncDPToCloud, syncHealthToCloud | dpStore, healthStore |
| **userStore** (MODIFIED) | Add archetype field to UserProfile | dpStore (archetype modifiers) |
| **workoutStore** (MODIFIED) | Strip assignedWorkout, coachNotes, assignmentId | dpStore (workout completion DP) |
| **macroStore** (MODIFIED) | Strip setBy/setByCoachId/coachMacroUpdated/setCoachTargets | dpStore (protein/calorie targets hit) |
| **avatarStore** (MODIFIED) | 5-stage evolution tied to rank milestones | dpStore (rank for stage calculation) |
| **achievementsStore** (MODIFIED) | Badges reference dpStore instead of xpStore | dpStore |

### Data Flow Diagrams

**Core DP Accrual Flow:**
```
User Action (workout/meal/checkin)
    |
    v
Zustand Store Update (workoutStore, macroStore, userStore)
    |
    v
DP Accrual (dpStore.evaluateDay())
    |                     |
    v                     v
Rank Progression     Archetype Modifier
    |                (from userStore.profile.archetype)
    v
Avatar Stage Check (avatarStore reads dpStore.currentRank)
    |
    v
scheduleSync() --> pushClientData() --> Supabase
```

**HealthKit Integration Flow:**
```
App Foreground / User navigates to Health screen
    |
    v
healthStore.syncFromHealthKit()
    |
    v
dpStore.evaluateDay() (steps >= 10k? sleep >= 7h?)
    |
    v
scheduleSync()
```

**RevenueCat Subscription Flow (native):**
```
RevenueCat Purchase / Subscription Change
    |
    v
Purchases.addCustomerInfoUpdateListener()
    |
    v
subscriptionStore.updateEntitlements(customerInfo)
    |
    v
UI re-renders (paywall gates, premium features)
```

**Server-side Subscription Verification:**
```
RevenueCat --> Supabase Edge Function --> subscriptions table
    |
    v
App pulls on login: subscriptionStore.loadFromCloud()
    (validates against client-side RevenueCat state)
```

---

## 1. RevenueCat + Zustand + Supabase Integration

**Confidence: HIGH** (official @revenuecat/purchases-capacitor plugin, well-documented pattern)

### Architecture Decision: Client-side entitlements as primary, server-side as backup

RevenueCat's Capacitor SDK provides client-side entitlement checking via `getCustomerInfo()` with built-in 5-minute caching. This is the **primary** gate for UI features. Server-side verification via webhooks provides the **backup** for:
1. Fraud prevention (server truth overrides client claims)
2. Cross-device subscription state (new device login before RevenueCat syncs)
3. Web/PWA users who cannot use RevenueCat directly

### New Store: subscriptionStore

```typescript
// src/stores/subscriptionStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SubscriptionStore {
  // State
  tier: 'free' | 'premium'
  entitlements: string[]           // e.g. ['premium']
  expiresAt: string | null         // ISO date
  lastVerifiedAt: string | null

  // Actions
  initialize: () => Promise<void>  // RevenueCat getCustomerInfo (native only)
  isPremium: () => boolean         // Checks tier + legacy access code fallback
  hasEntitlement: (id: string) => boolean
  purchase: (packageId: string) => Promise<{ success: boolean; error?: string }>
  restore: () => Promise<{ success: boolean; error?: string }>
  loadFromCloud: () => Promise<void>  // Pull server-side truth on login
  updateFromCustomerInfo: (info: any) => void  // Called by listener
  reset: () => void
}
```

**Persistence:** Yes, persist to localStorage with key `trained-subscription`. Persisting the derived `tier` means the UI can render premium/free gates instantly on cold start without waiting for RevenueCat SDK initialization.

### SDK Initialization Pattern

```typescript
// src/lib/revenuecat.ts
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { isNative } from '@/lib/platform'

export async function initRevenueCat(userId?: string) {
  if (!isNative()) return  // RevenueCat is native-only (iOS IAP)

  if (import.meta.env.DEV) {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
  }
  await Purchases.configure({
    apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
    appUserID: userId || null  // null = anonymous, identified on login
  })
}

export async function identifyUser(userId: string) {
  if (!isNative()) return
  await Purchases.logIn({ appUserID: userId })
}

export async function logoutRevenueCat() {
  if (!isNative()) return
  await Purchases.logOut()
}
```

**Integration with existing code:**

| Existing Location | Integration Point |
|---|---|
| `authStore.initialize()` | Call `initRevenueCat()` after auth session restored |
| `authStore.signIn()` | Call `identifyUser(user.id)` after successful login |
| `authStore.signOut()` | Call `logoutRevenueCat()` before clearing stores; add `subscriptionStore.reset()` |
| `App.tsx` useEffect | Wire `Purchases.addCustomerInfoUpdateListener()` to update subscriptionStore |

### Supabase Webhook (Server-side Verification)

**New Supabase Edge Function:** `handle-revenuecat-webhook`

Events handled:
- `INITIAL_PURCHASE` -- upsert into `subscriptions` table, set status 'active'
- `RENEWAL` -- update expiry date, keep status 'active'
- `CANCELLATION` -- set status 'canceled' (still active until period ends)
- `EXPIRATION` -- set status 'expired'
- `BILLING_ISSUE` -- set status 'billing_issue'

**New Supabase table:** `subscriptions`

```sql
CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  revenuecat_id TEXT,
  product_id TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'expired', 'billing_issue', 'trial')),
  expires_at TIMESTAMPTZ,
  original_purchase_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);
-- Only the webhook Edge Function writes (via service_role key)
```

### Access Code Migration Strategy

Existing `accessStore` users who validated an access code should be grandfathered into premium.

**Strategy:** Keep `accessStore` read-only during a 90-day grace period post-launch. subscriptionStore checks both sources:

```typescript
isPremium: () => {
  const sub = get()
  if (sub.tier === 'premium') return true
  // Legacy: access code holders get premium during grace period
  const access = useAccessStore.getState()
  if (access.hasAccess) return true
  return false
}
```

After 90 days, remove accessStore entirely and clear its localStorage key.

### Web vs Native

RevenueCat only works on native (iOS). For the PWA:
- `subscriptionStore` reads from Supabase `subscriptions` table on login
- Purchase flows are disabled (`isNative()` guard)
- Web users see "Subscribe in the iOS app" messaging
- subscriptionStore.isPremium() still works (checks server-side tier)

---

## 2. HealthKit + Zustand + Supabase Integration

**Confidence: MEDIUM** (plugin exists, steps are straightforward, sleep API needs spike)

### Plugin Choice: @perfood/capacitor-healthkit

Use `@perfood/capacitor-healthkit` because:
- iOS-only project (no need for @capgo/capacitor-health's cross-platform abstraction)
- Focused API with `queryHKitSampleType` for steps and sleep
- Active maintenance, Capacitor 6/7 compatible
- Lower dependency footprint

**Risk flag (LOW confidence):** Sleep data querying is complex. HealthKit sleep analysis includes multiple sample values (HKCategoryValueSleepAnalysisAsleep, AsleepCore, AsleepDeep, AsleepREM, InBed). Overlapping samples from multiple sources (Apple Watch, iPhone, third-party apps) can double-count sleep hours. Implementation needs a spike to validate the exact aggregation logic. Steps are simpler (sum of stepCount samples).

### New Store: healthStore

```typescript
// src/stores/healthStore.ts
interface DailyHealthEntry {
  date: string
  steps: number
  sleepHours: number
  stepsSource: 'healthkit' | 'manual'
  sleepSource: 'healthkit' | 'manual'
}

interface HealthStore {
  // State
  todaySteps: number
  todaySleepHours: number
  stepsSource: 'healthkit' | 'manual'
  sleepSource: 'healthkit' | 'manual'
  healthKitAuthorized: boolean | null  // null = not yet asked
  lastHealthKitSync: string | null
  dailyHealth: DailyHealthEntry[]      // Persisted for offline DP evaluation

  // Actions
  requestAuthorization: () => Promise<boolean>
  syncFromHealthKit: () => Promise<void>
  setManualSteps: (steps: number) => void
  setManualSleep: (hours: number) => void
  getTodayHealth: () => { steps: number; sleepHours: number }
  resetHealth: () => void
}
```

**Persistence:** Yes, key `trained-health`. HealthKit data is queried (not owned), so persisted daily snapshots are needed for offline DP evaluation and history display.

### HealthKit Data Retrieval

```typescript
// src/lib/healthkit.ts
import { CapacitorHealthkit } from '@perfood/capacitor-healthkit'
import { isNative } from '@/lib/platform'

export async function requestHealthKitAuth(): Promise<boolean> {
  if (!isNative()) return false
  try {
    await CapacitorHealthkit.requestAuthorization({
      all: [],
      read: ['stepCount', 'sleepAnalysis'],
      write: [],
    })
    // Note: iOS always returns success for requestAuthorization even if denied.
    // The only way to know if user denied is that queries return no data.
    return true
  } catch {
    return false
  }
}

export async function getTodaySteps(): Promise<number> {
  if (!isNative()) return 0
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const result = await CapacitorHealthkit.queryHKitSampleType({
    sampleName: 'stepCount',
    startDate: startOfDay.toISOString(),
    endDate: now.toISOString(),
    limit: 0,  // 0 = no limit
  })

  // Aggregate all step samples for today
  return (result.resultData || []).reduce(
    (sum: number, sample: any) => sum + (sample.quantity || 0), 0
  )
}

export async function getLastNightSleep(): Promise<number> {
  if (!isNative()) return 0
  // Query sleep analysis from 8pm yesterday to noon today
  const now = new Date()
  const yesterday8pm = new Date(now)
  yesterday8pm.setDate(yesterday8pm.getDate() - 1)
  yesterday8pm.setHours(20, 0, 0, 0)
  const todayNoon = new Date(now)
  todayNoon.setHours(12, 0, 0, 0)

  const result = await CapacitorHealthkit.queryHKitSampleType({
    sampleName: 'sleepAnalysis',
    startDate: yesterday8pm.toISOString(),
    endDate: todayNoon.toISOString(),
    limit: 0,
  })

  // Calculate total sleep from "asleep" samples (exclude "inBed")
  let totalMinutes = 0
  for (const sample of (result.resultData || [])) {
    const val = sample.value || ''
    if (val.includes('Asleep') || val.includes('asleep') ||
        val.includes('Core') || val.includes('Deep') || val.includes('REM')) {
      const start = new Date(sample.startDate).getTime()
      const end = new Date(sample.endDate).getTime()
      totalMinutes += (end - start) / 60000
    }
  }
  return Math.round((totalMinutes / 60) * 10) / 10  // Hours, 1 decimal
}
```

### HealthKit Authorization Timing

Do NOT request during onboarding. Request contextually:
1. User taps Steps card for the first time -- authorization prompt
2. User taps Sleep card for the first time -- authorization prompt
3. If denied or no data, show manual entry fields (graceful degradation)

This follows Apple's guidelines for purpose-driven permission requests and reduces denial rates.

### Dual-Source Design (Manual Fallback)

Every health metric has a dual-source pattern:
- If `healthKitAuthorized === true` and data available -- auto-populate from HealthKit
- If `healthKitAuthorized === false` or no data -- show manual entry input
- User can always override HealthKit with manual entry for that day (manual takes precedence)
- On web (PWA), `healthKitAuthorized` initializes to `false`, showing manual-only UI

### Sync to Supabase

**New table:** `daily_health`

```sql
CREATE TABLE daily_health (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  steps INTEGER DEFAULT 0,
  sleep_hours NUMERIC(4,2) DEFAULT 0,
  steps_source TEXT DEFAULT 'manual' CHECK (steps_source IN ('healthkit', 'manual')),
  sleep_source TEXT DEFAULT 'manual' CHECK (sleep_source IN ('healthkit', 'manual')),
  PRIMARY KEY (user_id, date)
);

ALTER TABLE daily_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own health data" ON daily_health
  FOR ALL USING (auth.uid() = user_id);
```

Added to `pushClientData()` as a new `syncDailyHealthToCloud(today, ctx)` call.

---

## 3. DP Engine Replacing xpStore

**Confidence: HIGH** (V2 spec well-defined, Zustand migrate function documented)

### Architecture Decision: New dpStore with separate localStorage key

Do NOT modify xpStore in place. Create a new `dpStore` with key `trained-dp`. The XP and DP systems have fundamentally different shapes -- 99 levels vs 15 ranks, weekly claim vs daily accrual, no archetypes vs archetype modifiers. Trying to evolve one into the other via Zustand persist migration within the same key risks data corruption.

### Key Differences

| Aspect | xpStore (V1) | dpStore (V2) |
|--------|-------------|-------------|
| Earning | Daily log + weekly claim cycle | Real-time daily accrual (no claim step) |
| Actions | workout, protein, calories, checkIn, perfectDay, streakBonus | training, trackedMeals, steps10k, hitProtein, sleep7h |
| Progression | 99 levels, progressive XP curve | 15 ranks, fixed cumulative DP thresholds |
| Modifiers | None | Archetype-specific DP bonuses (e.g. Himbo gets +50% for training) |
| Streak | Separate (userStore.currentStreak) | Same mechanism, renamed "Obedience Streak" |
| localStorage | `gamify-gains-xp` | `trained-dp` (new key) |

### New Store: dpStore

```typescript
// src/stores/dpStore.ts
type Archetype = 'bro' | 'himbo' | 'brute' | 'pup' | 'bull'

interface DailyDP {
  date: string
  training: boolean       // +50 base
  trackedMeals: boolean   // +15 base
  steps10k: boolean       // +10 base
  hitProtein: boolean     // +25 base
  sleep7h: boolean        // +10 base
  archetypeBonus: number  // calculated from archetype modifiers
  total: number
}

interface DPStore {
  // State
  totalDP: number
  currentRank: number     // 1-15
  dailyLogs: DailyDP[]

  // Actions
  evaluateDay: () => DailyDP   // Calculate today's DP from all stores
  getRankForDP: (dp: number) => number
  getRankProgress: () => { current: number; next: number; percentage: number }
  getRankName: (rank: number) => string
  getAvatarStage: () => 1 | 2 | 3 | 4 | 5
  resetDP: () => void
  exportData: () => string
  importData: (data: string) => boolean
}
```

### DP Evaluation (Cross-Store Read Pattern)

`dpStore.evaluateDay()` reads from multiple stores. This follows the existing proven pattern in `achievementsStore.checkAndAwardBadges()` and `sync.ts`:

```typescript
evaluateDay: () => {
  const today = getLocalDateString()
  const archetype = useUserStore.getState().profile?.archetype || 'bro'

  // Read completion status from other stores
  const training = useWorkoutStore.getState().isWorkoutCompletedToday()
  const macroState = useMacroStore.getState()
  const todayLog = macroState.dailyLogs.find(l => l.date === today)
  const trackedMeals = (todayLog?.loggedMeals?.length || 0) > 0
  const hitProtein = todayLog && macroState.targets
    ? todayLog.protein >= macroState.targets.protein * 0.9
    : false
  const health = useHealthStore.getState().getTodayHealth()
  const steps10k = health.steps >= 10000
  const sleep7h = health.sleepHours >= 7

  // Calculate base + archetype bonus
  let base = 0
  let bonus = 0
  if (training) { base += 50; bonus += getArchetypeBonus(archetype, 'training') }
  if (trackedMeals) { base += 15; bonus += getArchetypeBonus(archetype, 'trackedMeals') }
  if (steps10k) { base += 10; bonus += getArchetypeBonus(archetype, 'steps10k') }
  if (hitProtein) { base += 25; bonus += getArchetypeBonus(archetype, 'hitProtein') }
  if (sleep7h) { base += 10; bonus += getArchetypeBonus(archetype, 'sleep7h') }
  const total = base + bonus

  // Upsert today's log, recalculate totalDP and rank
  // ...
}
```

**Important:** Use direct store imports (not barrel `@/stores`) to avoid circular dependencies -- same pattern as `sync.ts`.

### Rank Thresholds (from V2 Spec)

```typescript
const RANK_THRESHOLDS: Record<number, number> = {
  1: 250,    2: 750,    3: 1500,   4: 2250,   5: 3000,
  6: 3750,   7: 4750,   8: 5750,   9: 6750,   10: 7750,
  11: 9000,  12: 10250, 13: 11500, 14: 13000, 15: 14750,
}
```

### Archetype as UserProfile Field (Not Separate Store)

The V2 spec's archetype is a user attribute (selected during onboarding, changeable in settings if premium). It belongs on `userStore.profile.archetype`, not as a separate store. This matches how `avatarBase` and `fitnessLevel` work today:

```typescript
// In userStore.ts -- add to UserProfile interface:
archetype: Archetype  // 'bro' | 'himbo' | 'brute' | 'pup' | 'bull'
```

The archetype modifier logic lives in `dpStore` (or a `dp-config.ts` constants file). dpStore reads `userStore.getState().profile?.archetype` to apply modifiers.

### XP-to-DP Data Migration

Users with existing xpStore data need a one-time migration using Zustand's persist `migrate` option:

**Strategy:** Do NOT try to convert XP values to DP values (incomparable systems). Instead, map XP level to an approximate DP rank (generous mapping favoring the user):

```typescript
function mapXPLevelToRank(level: number): number {
  if (level <= 3) return 1
  if (level <= 6) return 2
  if (level <= 9) return 3
  if (level <= 12) return 4
  if (level <= 15) return 5
  if (level <= 20) return 6
  if (level <= 25) return 7
  if (level <= 30) return 8
  if (level <= 35) return 9
  if (level <= 40) return 10
  if (level <= 50) return 11
  if (level <= 60) return 12
  if (level <= 70) return 13
  if (level <= 85) return 14
  return 15
}

// dpStore persist config:
persist(
  (set, get) => ({ /* store implementation */ }),
  {
    name: 'trained-dp',
    version: 1,
    migrate: (persistedState: any, version: number) => {
      if (version === 0) {
        try {
          const raw = localStorage.getItem('gamify-gains-xp')
          if (raw) {
            const xpData = JSON.parse(raw)
            const xpLevel = xpData?.state?.currentLevel || 0
            if (xpLevel > 0) {
              const mappedRank = mapXPLevelToRank(xpLevel)
              return {
                ...persistedState,
                totalDP: RANK_THRESHOLDS[mappedRank],
                currentRank: mappedRank,
              }
            }
          }
        } catch { /* migration optional, default state is fine */ }
      }
      return persistedState
    }
  }
)
```

### Avatar Stage (Derived from Rank)

```typescript
getAvatarStage: () => {
  const rank = get().currentRank
  if (rank <= 3) return 1   // Ranks 1-3: Stage 1
  if (rank <= 7) return 2   // Ranks 4-7: Stage 2
  if (rank <= 11) return 3  // Ranks 8-11: Stage 3
  if (rank <= 14) return 4  // Ranks 12-14: Stage 4
  return 5                  // Rank 15: Stage 5
}
```

### Supabase Schema

**New table:** `user_dp` (replaces `user_xp`)

```sql
CREATE TABLE user_dp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_dp INTEGER NOT NULL DEFAULT 0,
  current_rank INTEGER NOT NULL DEFAULT 1 CHECK (current_rank BETWEEN 1 AND 15),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_dp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own DP" ON user_dp
  FOR ALL USING (auth.uid() = user_id);
```

Archetype stored on profiles table (add column): `ALTER TABLE profiles ADD COLUMN archetype TEXT DEFAULT 'bro' CHECK (archetype IN ('bro', 'himbo', 'brute', 'pup', 'bull'));`

**Sync:** Replace `syncXPToCloud()` with `syncDPToCloud()` in pushClientData.

### achievementsStore Update

Badges referencing `useXPStore.getState().currentLevel` must update to `useDPStore.getState().currentRank`. Badge IDs should change (e.g., `level-5` becomes `rank-5`) to prevent false "already earned" states.

---

## 4. Stripping Coach Code Safely

**Confidence: HIGH** (complete inventory of touchpoints, no hidden dependencies)

### Clarification: ALL Coach Features Leave the Client App

Per PROJECT.md: "Strip coach dashboard (lives in welltrained-coach now)." This means:
- **Delete** pullCoachData entirely (not just the UI)
- **Delete** coach-assigned workout fetching
- **Delete** weekly check-in pulling
- **Delete** set_by='coach' conditional logic
- **Keep** Supabase tables/RLS (welltrained-coach still uses them server-side)

### Full Inventory

**Files to DELETE entirely (~4,239 lines):**

| File | Lines | Purpose |
|------|-------|---------|
| `src/screens/Coach.tsx` | ~2,158 | Coach dashboard |
| `src/hooks/useClientDetails.ts` | ~400 | Client detail queries |
| `src/hooks/useClientRoster.ts` | ~400 | Client roster queries |
| `src/hooks/useCoachTemplates.ts` | ~300 | Workout template management |
| `src/hooks/useWeeklyCheckins.ts` | ~321 | Check-in queries (also used in Home.tsx) |

**Files to MODIFY:**

| File | What to Remove |
|------|---------------|
| `src/App.tsx` | CoachGuard (~11 lines), Coach lazy import, /coach route, isCoach import, all pullCoachData calls from online/visibility/foreground handlers |
| `src/lib/sync.ts` | pullCoachData() function (~85 lines), set_by='coach' guard in pushClientData, syncAllToCloud deprecated function, `trained-latest-checkin` localStorage |
| `src/stores/authStore.ts` | pullCoachData import and call in syncData() |
| `src/stores/macroStore.ts` | setBy, setByCoachId, coachMacroUpdated fields; setCoachTargets, dismissCoachMacroUpdated actions |
| `src/stores/workoutStore.ts` | assignedWorkout state + setter; assignment logic in generateExercises, startWorkout, completeWorkout, endWorkoutEarly; partialize exclusion |
| `src/screens/Home.tsx` | hasCoach state, coach response modal (~40 lines), weekly check-in banner (~20 lines), useWeeklyCheckins import, localStorage checkin read |
| `src/screens/Workouts.tsx` | "Assigned by Coach" labels, "Coach Workout" name, coachNotes display, isCoachDay variable |
| `src/screens/WeeklyCheckIn.tsx` | Delete entirely (check-ins are coach-only) |
| `src/components/Navigation.tsx` | `/coach` path check (1 line) |
| `src/lib/supabase.ts` | isCoach() helper (~10 lines) |
| `src/lib/index.ts` | isCoach export |

### Safe Removal Order (5 Steps)

Removing callers before implementations prevents compilation failures.

**Step 1: Remove pullCoachData callers**
1. Remove pullCoachData calls from App.tsx (handleOnline, handleVisibilityChange, appStateChange)
2. Remove pullCoachData call from authStore.syncData()
3. Result: pullCoachData exists but is never called. App compiles and runs.

**Step 2: Remove pullCoachData and coach sync internals**
1. Delete pullCoachData() function from sync.ts
2. Remove setBy !== 'coach' guard from pushClientData (now always push macro targets)
3. Delete deprecated syncAllToCloud function
4. Remove `trained-latest-checkin` localStorage read/write

**Step 3: Remove store fields (bump versions)**
1. macroStore: remove setBy, setByCoachId, coachMacroUpdated, setCoachTargets, dismissCoachMacroUpdated. Add version: 2 + migrate to strip old fields.
2. workoutStore: remove assignedWorkout, setAssignedWorkout, all assignment references. Remove partialize that excludes assignedWorkout. Add version: 2 + migrate.

**Step 4: Remove UI components**
1. Delete Coach.tsx, all 4 hooks, WeeklyCheckIn.tsx
2. Remove CoachGuard, Coach import, /coach route from App.tsx
3. Remove coach banners from Home.tsx
4. Remove coach labels from Workouts.tsx
5. Remove /coach check from Navigation.tsx

**Step 5: Remove helpers**
1. Delete isCoach() from supabase.ts
2. Remove isCoach from lib/index.ts
3. Clean up database.types.ts imports

### What NOT to Remove

- Supabase tables: weekly_checkins, assigned_workouts, clients, coach_clients -- welltrained-coach uses them
- set_by column on macro_targets -- keep in DB, client always writes 'self' now
- RLS policies -- protect data the coach app reads
- Edge Functions for coach features -- welltrained-coach depends on them

### Store Version Bumps (Prevent Stale Data)

When removing fields from macroStore and workoutStore, bump the persist `version` and provide a `migrate` function that strips the removed fields. This prevents Zustand from hydrating removed fields from localStorage:

```typescript
// macroStore.ts
persist(
  (set, get) => ({ /* without coach fields */ }),
  {
    name: 'gamify-gains-macros',
    version: 2,  // was 1 (or unversioned = 0)
    migrate: (state: any, version: number) => {
      if (version < 2) {
        // Strip coach fields from persisted state
        const { setBy, setByCoachId, coachMacroUpdated, ...clean } = state
        return { ...clean, /* keep all non-coach fields */ }
      }
      return state
    }
  }
)
```

### Verification

Run `vitest run` + `playwright test` after each step. Remove tests that reference coach/assigned workout functionality along with the code they test.

---

## 5. Design Token Migration

**Confidence: HIGH** (straightforward value swap in a single file)

### Token Location

All tokens are in `src/index.css`:
- `:root { }` block -- shadcn CSS custom properties
- `@theme { }` block -- custom tokens + Tailwind class mapping

### Migration: Swap Values

| Token | V1 Value | V2 Value | Notes |
|-------|----------|----------|-------|
| `--primary` | `#D55550` (red) | `#C8FF00` (lime) | Signal color |
| `--primary-foreground` | `#FFFFFF` | `#0A0A0A` | Dark text on lime |
| `--ring` | `#D55550` | `#C8FF00` | Focus rings |
| `--destructive` | `#D55550` | `#B91C1C` | Stays red for destructive |
| `--card` | `#141414` | `#26282B` | Surface per spec |
| `--border` | `#2A2A2A` | `#26282B` | Same as surface per spec |
| `--muted-foreground` | `#888888` | `#A1A1AA` | Muted text per spec |
| `--chart-1` | `#D55550` | `#C8FF00` | Charts use signal |

**Tokens to add/rename:**
- `--color-xp-bar` becomes `--color-dp-bar` = `#C8FF00`
- `--color-streak-active` changes from `#D55550` to `#C8FF00`
- `--shadow-glow` changes from `rgba(213, 85, 80, 0.2)` to `rgba(200, 255, 0, 0.2)`
- Add `--color-signal` = `#C8FF00` (V2 nomenclature)
- Add `--color-signal-fg` = `#0A0A0A`

**Fonts:** Already correct -- Oswald, Inter, JetBrains Mono match V2 spec.

### Build Order Rationale

Design tokens BEFORE component work because:
1. Every component uses `bg-primary`, `text-primary` via Tailwind
2. Changing tokens once changes every component atomically
3. No component-by-component color migration needed
4. Visual verification is immediate

---

## 6. Protocol Orders / Quest Store

**Confidence: MEDIUM** (spec defines concepts but implementation details need design)

```typescript
// src/stores/questStore.ts
interface Quest {
  id: string
  type: 'daily' | 'weekly'
  title: string
  description: string
  dpReward: number
  isPremium: boolean
  progress: number
  target: number
  completed: boolean
  claimed: boolean
  expiresAt: string
}

interface QuestStore {
  activeQuests: Quest[]
  completedQuestIds: string[]
  lastDailyRefresh: string | null
  lastWeeklyRefresh: string | null

  refreshDailyQuests: () => void
  refreshWeeklyQuests: () => void
  checkQuestProgress: () => string[]  // Newly completed quest IDs
  claimQuestReward: (questId: string) => number  // DP awarded
  resetQuests: () => void
}
```

**Persistence:** Yes, key `trained-quests`. Quests generated client-side from template pool (not server-driven initially). Progress checked by reading other stores.

---

## 7. Modified Auth and Lifecycle Flows

### Login Sequence (V2)

```
1. authStore.signIn(email, password)
2. supabase.auth.signInWithPassword()
3. set user + session
4. identifyUser(user.id) -- RevenueCat (native only)
5. syncData():
   a. loadAllFromCloud() -- existing (minus coach loads)
   b. subscriptionStore.loadFromCloud() -- NEW
   c. pushClientData() -- existing (minus coach logic)
   d. subscriptionStore.initialize() -- RevenueCat getCustomerInfo()
   e. healthStore.syncFromHealthKit() -- if authorized
```

### Logout Sequence (V2)

```
1. authStore.signOut()
2. removeDeviceToken() -- existing
3. logoutRevenueCat() -- NEW
4. supabase.auth.signOut()
5. Clear stores (existing + new):
   userStore, xpStore, macroStore, workoutStore, avatarStore, accessStore,
   dpStore, subscriptionStore, healthStore, questStore
```

### Foreground Sync (V2)

```
App returns to foreground (elapsed > 30s)
    +--> flushPendingSync()              (push client data)
    +--> healthStore.syncFromHealthKit() (NEW)
    +--> updateBadge()                   (existing)
    [pullCoachData REMOVED]
```

---

## Patterns to Follow

### Pattern 1: Cross-Store Reads via getState()

**What:** Stores read each other via `useXStore.getState()` not subscriptions.
**When:** DP evaluation, quest progress, sync operations.
**Why:** Avoids circular subscriptions. Proven in achievementsStore + sync.ts.

### Pattern 2: Feature Gating Hook

```typescript
// src/hooks/useEntitlement.ts
export function useEntitlement(id: string): boolean {
  return useSubscriptionStore(state => state.hasEntitlement(id))
}
// Usage: const canSelectArchetype = useEntitlement('premium')
```

### Pattern 3: Dual-Source Health Data

Every health input has HealthKit + manual fallback. HealthKit auto-populates when available, manual entry always works.

### Pattern 4: Zustand Persist Version + Migrate

Use `version` and `migrate` for all breaking state changes (dpStore migration, coach field removal).

### Pattern 5: isNative() Guards

All Capacitor plugin calls wrapped in `if (!isNative()) return`. App runs as both PWA and native.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Server-Only Subscription Gating

**Why bad:** Latency on every feature gate, breaks offline. RevenueCat SDK caches locally.
**Instead:** Client-side entitlements primary, server-side as backup.

### Anti-Pattern 2: Modifying xpStore In-Place

**Why bad:** Zustand hydrates old `gamify-gains-xp` data into new shape, causing type mismatches.
**Instead:** New dpStore with new key `trained-dp`. Migrate data once. Delete xpStore later.

### Anti-Pattern 3: HealthKit Polling on Timer

**Why bad:** Battery drain, unnecessary queries, Apple review risk.
**Instead:** Sync on app foreground + when user navigates to health screens.

### Anti-Pattern 4: Removing Coach Code All at Once

**Why bad:** Cannot bisect breakage across 10+ files.
**Instead:** 5-step ordered removal. Test after each step.

### Anti-Pattern 5: HealthKit Permission During Onboarding

**Why bad:** No user context, higher denial rate, possible Apple rejection.
**Instead:** Request contextually when user first interacts with steps/sleep features.

---

## Build Order Recommendation

Based on dependency analysis:

```
1. Strip coach code         [no deps, removes ~4,500 lines of noise]
2. Design token migration   [no deps, visual foundation for all V2 work]
3. dpStore + DP engine      [no new deps, replaces xpStore]
4. subscriptionStore        [no deps, gates premium features]
5. healthStore + HealthKit  [depends on dpStore for DP evaluation]
6. Archetype system         [depends on dpStore + subscriptionStore]
7. questStore               [depends on dpStore, healthStore, workoutStore]
8. Avatar evolution         [depends on dpStore for rank -> stage]
9. Updated onboarding       [depends on archetype + dpStore]
10. achievementsStore update [depends on dpStore]
11. App Store submission     [depends on everything]
```

**Rationale:** Coach removal first reduces noise. Design tokens second affects every screen visually. DP engine third because health, quests, archetypes all depend on it. Subscription early because archetypes and premium quests need entitlement gating.

---

## Sources

- [RevenueCat Capacitor Plugin](https://github.com/RevenueCat/purchases-capacitor) -- HIGH confidence
- [RevenueCat Subscription Status Docs](https://www.revenuecat.com/docs/customers/customer-info) -- HIGH confidence
- [RevenueCat Webhooks](https://www.revenuecat.com/docs/integrations/webhooks) -- HIGH confidence
- [RevenueCat Webhook Event Types](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields) -- HIGH confidence
- [RevenueCat Capacitor Installation](https://www.revenuecat.com/docs/getting-started/installation/capacitor) -- HIGH confidence
- [@perfood/capacitor-healthkit](https://github.com/perfood/capacitor-healthkit) -- MEDIUM confidence
- [@perfood/capacitor-healthkit npm](https://www.npmjs.com/package/@perfood/capacitor-healthkit) -- MEDIUM confidence
- [Zustand Persist Migration](https://github.com/pmndrs/zustand/discussions/1717) -- HIGH confidence
- [Zustand Persist Middleware](https://deepwiki.com/pmndrs/zustand/3.1-persist-middleware) -- HIGH confidence
- [RevenueCat + Supabase Pattern](https://medium.com/@d13nunes/implementing-revenuecat-virtual-currency-with-supabase-7944bd3444a4) -- MEDIUM confidence
- WellTrained V2 Master Specification (repo: `WellTrained V2_ Master Specification & Build Document.md`) -- HIGH confidence
- Existing codebase: all 11 stores, sync.ts, App.tsx, index.css -- HIGH confidence
