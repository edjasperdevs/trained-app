# Phase 1: Foundation - Research

**Researched:** 2026-02-07
**Domain:** Supabase schema, RLS security, React routing, code splitting, directional sync
**Confidence:** HIGH

## Summary

Phase 1 establishes the data ownership model, directional sync, RLS security fix, coach route guard, and lazy loading for the coach dashboard. This research is based on direct analysis of every relevant source file in the codebase, the existing Supabase schema, and the project-level research already completed.

The core finding is that the existing sync system (`syncAllToCloud()`) does unconditional upserts that will overwrite any coach-set data. The macro target sync is the critical collision point -- it must be guarded before the coach can set client macros. The existing RLS policy on `coach_clients` has a security vulnerability: any authenticated user can insert rows making themselves a coach. The coach route at `/coach` is already lazy-loaded but has zero auth protection -- any authenticated user can navigate there.

**Primary recommendation:** Split sync into `pushClientData()` and `pullCoachData()`, add `set_by` column to `macro_targets`, fix the `coach_clients` RLS policy to require `role = 'coach'`, and add a route guard component for `/coach/*`.

## Standard Stack

No new dependencies needed for Phase 1. Everything uses existing packages.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18 | UI framework | Already installed |
| Supabase JS | 2.93.3 | Database client | Already installed |
| React Router | 6.x | Routing | Already installed |
| Zustand | 4.x | Client state | Already installed |
| Vite | 6.x | Build tool | Already installed, handles code splitting |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase CLI | N/A | SQL migrations | Run `supabase migration new` for schema changes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual route guard | React Router `loader` | Loaders require data router setup (not currently used) -- manual guard in component is simpler and matches existing pattern |
| Supabase custom JWT claims for role | `profiles.role` column query | Custom claims require Edge Functions or auth hooks -- column query is already deployed and fast with index |

**Installation:**
```bash
# No new packages needed for Phase 1
```

## Architecture Patterns

### Current State Analysis

#### 1. Sync System (src/lib/sync.ts)

**Current `syncAllToCloud()` flow:**
```
syncProfileToCloud()        -> upserts profiles (unconditional)
syncWeightLogsToCloud()     -> upserts weight_logs (unconditional)
syncMacroTargetsToCloud()   -> upserts macro_targets (DANGER: unconditional)
syncSavedMealsToCloud()     -> upserts saved_meals (unconditional)
syncXPToCloud()             -> upserts user_xp (unconditional)
syncDailyMacroLogToCloud()  -> upserts daily_macro_logs (unconditional)
syncWorkoutLogToCloud()     -> upserts workout_logs (unconditional)
```

**Current `loadAllFromCloud()` flow:**
```
loadProfileFromCloud()      -> loads profiles
loadWeightLogsFromCloud()   -> loads weight_logs
(NOTHING ELSE is loaded -- macro targets, workouts, XP are NOT pulled)
```

**Critical problem:** `syncMacroTargetsToCloud()` at line 233-257 reads from `useMacroStore.getState().targets` (localStorage) and does an unconditional upsert. If coach sets macros via dashboard (writes to Supabase), and client triggers `scheduleSync()`, the stale localStorage values overwrite coach's update.

**Current `syncMacroTargetsToCloud()` code (lines 233-257):**
```typescript
export async function syncMacroTargetsToCloud() {
  // ... auth checks ...
  const { targets, activityLevel } = useMacroStore.getState()
  if (!targets) return { error: 'No targets set' }

  const { error } = await client
    .from('macro_targets')
    .upsert({
      user_id: user.id,
      protein: targets.protein,
      calories: targets.calories,
      carbs: targets.carbs,
      fats: targets.fats,
      activity_level: activityLevel
    }, { onConflict: 'user_id' })
  // No check for set_by, no check for updated_at, no guard at all
}
```

**Required change:** Before upserting, check if `set_by = 'coach'`. If so, SKIP the upsert. Better: split into directional functions where client push never touches coach-owned data.

#### 2. Auth Sync Trigger (src/stores/authStore.ts)

**`syncData()` at lines 170-198:**
```typescript
syncData: async () => {
  // First load any existing cloud data
  await loadAllFromCloud()     // Only loads profile + weight logs
  // Then sync local changes to cloud
  await syncAllToCloud()       // Pushes EVERYTHING including macro targets
}
```

Called on `signIn()` and `signUp()`. Also called via `flushPendingSync()` on reconnection and visibility change (App.tsx lines 55-91). The `flushPendingSync()` function calls `syncAllToCloud()` directly.

**Required change:** `syncData()` must call `pullCoachData()` after `loadAllFromCloud()` and call `pushClientData()` instead of `syncAllToCloud()`.

#### 3. RLS Policy Vulnerability (supabase/schema.sql, line 204-206)

**Current policy:**
```sql
CREATE POLICY "Coaches can manage their client relationships"
  ON coach_clients FOR ALL
  USING (coach_id = auth.uid());
```

**Problem:** This policy allows ANY authenticated user to INSERT/UPDATE/DELETE rows in `coach_clients` where `coach_id` equals their own user ID. There is NO check that the user has `role = 'coach'` in the profiles table. A regular client can call `supabase.from('coach_clients').insert({ coach_id: myId, client_id: someoneElseId, status: 'active' })` and it will succeed.

**Required fix:**
```sql
-- Drop the old policy
DROP POLICY "Coaches can manage their client relationships" ON coach_clients;

-- Create fixed policy requiring coach role
CREATE POLICY "Coaches can manage their client relationships"
  ON coach_clients FOR ALL
  USING (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );
```

**Secondary concern:** The `profiles` UPDATE policy (line 188-189) allows users to update their own profile with no column restrictions:
```sql
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

A user could theoretically update their own `role` column to `'coach'`. This needs a WITH CHECK clause:
```sql
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
  );
```

Or a trigger that prevents role changes:
```sql
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Cannot change role via client update';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_role_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
```

The trigger approach is cleaner because it does not interfere with the existing UPDATE policy logic.

#### 4. Coach Route (src/App.tsx, line 19 + 169)

**Current state:** Coach.tsx IS already lazy-loaded (line 19):
```typescript
const Coach = lazy(() => import('@/screens/Coach.tsx').then(m => ({ default: m.Coach })))
```

And the route (line 169):
```typescript
<Route path="/coach" element={<Suspense fallback={<HomeSkeleton />}><Coach /></Suspense>} />
```

**Problem:** Zero auth guard. Any authenticated user who navigates to `/coach` will see the coach dashboard. The RLS policies prevent data access from Supabase (coach_client_summary view will return empty for non-coaches), but the UI shell renders.

**Required change:** Create a `CoachGuard` wrapper component that checks `isCoach()` on mount and redirects non-coaches:

```typescript
// src/components/CoachGuard.tsx
function CoachGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    isCoach().then(result => {
      setAuthorized(result)
      if (!result) {
        navigate('/', { replace: true })
      }
    })
  }, [navigate])

  if (authorized === null) return <HomeSkeleton />
  if (!authorized) return null
  return <>{children}</>
}
```

Then in App.tsx:
```typescript
<Route path="/coach" element={
  <Suspense fallback={<HomeSkeleton />}>
    <CoachGuard><Coach /></CoachGuard>
  </Suspense>
} />
```

#### 5. Bundle Splitting (vite.config.ts + build output)

**Current state:** Coach.tsx IS in a separate chunk: `Coach-DBhYbQ1B.js` at 22.91 KB (6.20 KB gzipped). This is already separated from the main bundle via React.lazy().

**Verification from build output:**
- `index-BwnlyNHV.js`: 147.26 KB (42.94 KB gzip) -- main bundle
- `Coach-DBhYbQ1B.js`: 22.91 KB (6.20 KB gzip) -- separate chunk
- Coach code only loads when user navigates to `/coach`

**Status:** Bundle splitting is already working. No changes needed for INFRA-06 other than verification.

**Future concern:** As coach features grow (template editor, macro editor, etc.), ensure new coach components are co-located and imported only from Coach.tsx (or other lazy-loaded coach routes), NOT from the barrel exports in `src/components/index.ts`.

#### 6. macro_targets Table (supabase/schema.sql, lines 71-81)

**Current schema:**
```sql
CREATE TABLE macro_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  protein INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fats INTEGER NOT NULL,
  activity_level activity_level NOT NULL
);
```

**Missing:** No `set_by` column. There is no way to distinguish coach-set macros from client-calculated macros.

**Required migration:**
```sql
-- Add set_by column to macro_targets
ALTER TABLE macro_targets
  ADD COLUMN set_by TEXT NOT NULL DEFAULT 'self'
  CHECK (set_by IN ('self', 'coach'));

-- Add set_by_coach_id for audit trail
ALTER TABLE macro_targets
  ADD COLUMN set_by_coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
```

**database.types.ts update:** Add `set_by: 'self' | 'coach'` and `set_by_coach_id: string | null` to the macro_targets table types.

#### 7. isCoach() Helper (src/lib/supabase.ts, lines 43-56)

**Current implementation:**
```typescript
export const isCoach = async (): Promise<boolean> => {
  if (!_supabase) return false
  const user = await getUser()
  if (!user) return false
  const client = getSupabaseClient()
  const { data } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return data?.role === 'coach'
}
```

**Status:** Works correctly. Queries the profiles table for the role column. Used in Settings.tsx (line 69) where the result is cached in useState.

**For the route guard:** This function can be used directly. It makes one Supabase call per check. Since the route guard only fires on navigation to `/coach`, the cost is acceptable. If performance becomes a concern, cache the result in a lightweight store or module-level variable.

#### 8. Data Ownership Model

Based on analysis of all sync functions and tables, here is the ownership classification:

| Table | Owner | Sync Direction | Guard Needed |
|-------|-------|---------------|--------------|
| `profiles` | Client (except `role`) | Push (client -> Supabase) | Prevent role column changes |
| `weight_logs` | Client | Push | None |
| `macro_targets` | Conditional (`set_by`) | Push if `set_by='self'`, Pull if `set_by='coach'` | Check `set_by` before upsert |
| `daily_macro_logs` | Client | Push | None |
| `logged_meals` | Client | Push | None |
| `saved_meals` | Client | Push | None |
| `workout_logs` | Client | Push | None |
| `user_xp` | Client | Push | None |
| `xp_logs` | Client | Push | None |
| `coach_clients` | Coach | Neither (coach writes directly, client reads) | RLS enforces |

**For Phase 1, only `macro_targets` needs the conditional guard.** All other client-owned tables continue to push unconditionally. Coach-owned tables that will be added in future phases (workout_programs, check_ins, invites) will be pull-only from the client perspective.

### Recommended Implementation Structure

```
Phase 1 changes:
src/
  lib/
    sync.ts              # MODIFY: split into pushClientData() + pullCoachData()
    supabase.ts          # NO CHANGE (isCoach() already works)
    database.types.ts    # MODIFY: add set_by to macro_targets
  stores/
    macroStore.ts        # MODIFY: add setBy field awareness, setCoachTargets()
    authStore.ts         # MODIFY: call pullCoachData() in syncData()
  components/
    CoachGuard.tsx       # NEW: route guard component
  screens/
    Coach.tsx            # NO CHANGE (already lazy-loaded)
  App.tsx                # MODIFY: wrap /coach route with CoachGuard

supabase/
  migrations/
    002_coach_foundation.sql  # NEW: set_by column, RLS fixes, role trigger
```

### Pattern: Directional Sync

**What:** Replace the single `syncAllToCloud()` with two directional functions:
- `pushClientData()` -- pushes client-owned data to Supabase (everything the client creates)
- `pullCoachData()` -- pulls coach-originated data from Supabase (macro targets if set_by='coach', future: assigned workouts)

**When to use:** Always. `scheduleSync()` calls `pushClientData()`. App open and visibility change call `pullCoachData()`.

**Implementation:**
```typescript
// src/lib/sync.ts

export async function pushClientData() {
  const results = {
    profile: await withRetryResult(syncProfileToCloud),
    weightLogs: await withRetryResult(syncWeightLogsToCloud),
    macroTargets: await withRetryResult(syncMacroTargetsIfClientOwned), // NEW: conditional
    savedMeals: await withRetryResult(syncSavedMealsToCloud),
    xp: await withRetryResult(syncXPToCloud),
  }
  // ... daily macro log, recent workouts (unchanged)
  return results
}

async function syncMacroTargetsIfClientOwned() {
  if (!supabase) return { error: 'Not configured' }
  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if macros are coach-owned -- if so, skip push
  const { data: existing } = await client
    .from('macro_targets')
    .select('set_by')
    .eq('user_id', user.id)
    .single()

  if (existing?.set_by === 'coach') {
    // Coach owns these macros -- do NOT overwrite
    return { error: null }
  }

  // Client-owned -- proceed with normal sync
  return syncMacroTargetsToCloud()
}

export async function pullCoachData() {
  if (!supabase) return
  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  // Pull macro targets if coach-set
  const { data: macroData } = await client
    .from('macro_targets')
    .select('protein, calories, carbs, fats, activity_level, set_by, updated_at')
    .eq('user_id', user.id)
    .single()

  if (macroData?.set_by === 'coach') {
    const store = useMacroStore.getState()
    const currentTargets = store.targets
    // Only update if targets actually differ
    if (!currentTargets ||
        currentTargets.protein !== macroData.protein ||
        currentTargets.calories !== macroData.calories ||
        currentTargets.carbs !== macroData.carbs ||
        currentTargets.fats !== macroData.fats) {
      store.setCoachTargets({
        protein: macroData.protein,
        calories: macroData.calories,
        carbs: macroData.carbs,
        fats: macroData.fats,
      })
      toast.info('Your coach updated your macro targets')
    }
  }
}
```

### Anti-Patterns to Avoid
- **Anti-pattern: Creating a separate Zustand store for coach data.** Coach data is server-authoritative. Persisting it in localStorage creates stale data. Use direct Supabase queries + in-memory cache (hooks) for coach-side data.
- **Anti-pattern: Using Supabase Realtime for coach updates in Phase 1.** Overkill for infrequent updates. Polling on app open and visibility change is sufficient. Add Realtime later if needed.
- **Anti-pattern: Importing coach components into the barrel exports (src/components/index.ts).** This would pull coach code into the main bundle, defeating lazy loading. Coach components should only be imported from within the lazy-loaded coach route tree.
- **Anti-pattern: Checking `set_by` only on the client side.** The RLS policy must also guard against coach-set macros being overwritten. Use a trigger or RLS WITH CHECK clause as the server-side enforcement. Client-side check is for UX, RLS is for security.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route guarding | Custom middleware system | Simple React component with `isCoach()` check | Existing `isCoach()` helper works. No need for a route middleware abstraction. |
| RLS role enforcement | Client-side role checks | PostgreSQL RLS policies + trigger | Server-side enforcement is the security boundary. Client checks are UX only. |
| Code splitting | Manual webpack config | Vite's built-in React.lazy() support | Already working. Coach.tsx is 22.91 KB in its own chunk. |
| Conflict resolution | Custom CRDT or timestamp comparison | `set_by` column + ownership-based sync direction | Ownership model eliminates conflicts entirely -- each data domain has exactly one authority. |

## Common Pitfalls

### Pitfall 1: Macro Target Overwrite Race Condition
**What goes wrong:** Coach sets client macros in Supabase. Client opens app, triggers `scheduleSync()`. Stale localStorage values overwrite coach's update within 2 seconds.
**Why it happens:** `syncMacroTargetsToCloud()` does unconditional upsert from localStorage. No `set_by` check exists.
**How to avoid:** Add `set_by` column. Check it before upserting in `syncMacroTargetsIfClientOwned()`. Pull coach-set macros in `pullCoachData()`.
**Warning signs:** Coach refreshes dashboard and sees their macro changes reverted.

### Pitfall 2: RLS Role Escalation
**What goes wrong:** Any authenticated user can insert into `coach_clients` making themselves a coach. The existing RLS policy only checks `coach_id = auth.uid()` -- it does NOT require `role = 'coach'`.
**Why it happens:** The `FOR ALL` policy was written assuming only coaches would call this, but RLS is the security boundary.
**How to avoid:** Fix the policy to include `AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')`. Add trigger preventing profile role self-modification.
**Warning signs:** Test by attempting `supabase.from('coach_clients').insert(...)` as a non-coach user. It currently succeeds.

### Pitfall 3: Profile Role Self-Modification
**What goes wrong:** User updates their own profile and sets `role = 'coach'`. The current `Users can update own profile` policy has no column restrictions.
**Why it happens:** The UPDATE policy uses `USING (auth.uid() = id)` without a `WITH CHECK` that prevents role changes.
**How to avoid:** Add a trigger that prevents role column changes on the profiles table.
**Warning signs:** Test by calling `supabase.from('profiles').update({ role: 'coach' }).eq('id', myId)` as a regular client.

### Pitfall 4: loadAllFromCloud() Missing Coach Data
**What goes wrong:** `loadAllFromCloud()` only loads profile and weight logs. It never pulls macro targets from Supabase. So coach-set macros are never loaded on app open.
**Why it happens:** The load function was written before coach features existed. It only loads what the client pushes.
**How to avoid:** Add `pullCoachData()` call to `authStore.syncData()` after `loadAllFromCloud()`.
**Warning signs:** Client signs in, coach has already set macros, but client sees their old self-calculated macros.

### Pitfall 5: Coach Components in Main Bundle
**What goes wrong:** New coach components (CoachGuard, etc.) get imported into `src/components/index.ts` barrel export, pulling them into the main bundle.
**Why it happens:** Developers follow the existing pattern of barrel-exporting all components.
**How to avoid:** Import CoachGuard directly in App.tsx (not via barrel). Keep coach-specific code out of shared barrels.
**Warning signs:** Build output shows main chunk size increasing after adding coach components.

## Code Examples

### Example 1: CoachGuard Component
```typescript
// src/components/CoachGuard.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isCoach } from '@/lib/supabase'
import { HomeSkeleton } from '@/components'

export function CoachGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    isCoach().then(result => {
      setAuthorized(result)
      if (!result) {
        navigate('/', { replace: true })
      }
    })
  }, [navigate])

  if (authorized === null) return <HomeSkeleton />
  if (!authorized) return null

  return <>{children}</>
}
```

### Example 2: SQL Migration for Phase 1
```sql
-- 002_coach_foundation.sql

-- 1. Add set_by column to macro_targets
ALTER TABLE macro_targets
  ADD COLUMN set_by TEXT NOT NULL DEFAULT 'self'
  CHECK (set_by IN ('self', 'coach'));

ALTER TABLE macro_targets
  ADD COLUMN set_by_coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Fix coach_clients RLS policy
DROP POLICY "Coaches can manage their client relationships" ON coach_clients;

CREATE POLICY "Coaches can manage their client relationships"
  ON coach_clients FOR ALL
  USING (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- 3. Prevent role self-modification
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Cannot change role via client update';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_role_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();

-- 4. Add composite partial index for RLS performance
CREATE INDEX idx_coach_clients_active
  ON coach_clients(coach_id, client_id)
  WHERE status = 'active';
```

### Example 3: Updated authStore.syncData()
```typescript
syncData: async () => {
  if (!supabase) return
  const { user } = get()
  if (!user) return

  set({ isSyncing: true })
  try {
    // 1. Load existing cloud data (profile, weight logs)
    await loadAllFromCloud()
    // 2. Pull coach-owned data (macro targets if set_by='coach')
    await pullCoachData()
    // 3. Push client-owned data only (skips coach-owned macros)
    await pushClientData()
  } catch (error) {
    // ... existing error handling ...
  } finally {
    set({ isSyncing: false })
  }
}
```

### Example 4: macroStore additions
```typescript
// Add to MacroStore interface:
setBy: 'self' | 'coach'

// Add to store:
setBy: 'self',

setCoachTargets: (targets: MacroTargets) => {
  set({
    targets,
    setBy: 'coach',
    // Do NOT regenerate meal plan -- coach sets targets only
  })
},

// Modify calculateMacros to set setBy:
calculateMacros: (weight, height, age, gender, goal, activity) => {
  // ... existing calculation ...
  set({
    targets: { protein, calories: adjustedCalories, carbs, fats },
    activityLevel: activity,
    setBy: 'self',  // Client calculated these
  })
  get().generateMealPlan()
},
```

### Example 5: Updated scheduleSync
```typescript
export function scheduleSync() {
  if (!supabase) return
  const { isOnline } = useSyncStore.getState()

  if (!isOnline) {
    useSyncStore.getState().setPendingChanges(true)
    toast.info('Saved locally. Will sync when online.')
    return
  }

  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    const store = useSyncStore.getState()
    store.setStatus('syncing')
    try {
      await pushClientData()  // Changed from syncAllToCloud()
      store.setStatus('synced')
      store.setPendingChanges(false)
      store.setLastSyncedAt(new Date().toISOString())
    } catch (error) {
      store.setStatus('error')
      store.setPendingChanges(true)
      if (error instanceof Error) {
        captureError(error, { context: 'scheduleSync' })
      }
    }
  }, 2000)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `syncAllToCloud()` (bidirectional upsert) | `pushClientData()` + `pullCoachData()` (directional) | Phase 1 | Prevents coach data overwrite |
| No role enforcement in RLS | `role = 'coach'` check in `coach_clients` policy | Phase 1 | Fixes security vulnerability |
| No `set_by` on macro_targets | `set_by` column distinguishes ownership | Phase 1 | Enables conditional sync |
| No coach route guard | `CoachGuard` component | Phase 1 | Non-coaches redirected away |

## Open Questions

1. **Should `pullCoachData()` also run on visibility change (return from background)?**
   - What we know: `flushPendingSync()` already runs on visibility change after 30s. Adding `pullCoachData()` here means the client picks up coach changes within 30s of returning to the app.
   - What's unclear: Whether this creates unnecessary network requests for non-coached clients (who will always get empty results).
   - Recommendation: Yes, run it. The query is cheap (single-row lookup on indexed `user_id`). The cost of NOT running it (client misses coach updates) outweighs the cost of an extra query.

2. **Should `setBy` be persisted in Zustand localStorage?**
   - What we know: `macroStore` uses Zustand persist with localStorage. If `setBy` is persisted, the client remembers that macros are coach-set even offline.
   - What's unclear: If the coach removes the client relationship, the local `setBy: 'coach'` persists until the next cloud sync.
   - Recommendation: Yes, persist it. The `pullCoachData()` function will correct it on next sync if the coach relationship changes.

3. **Should `syncMacroTargetsIfClientOwned()` check `set_by` locally first (fast) or query Supabase (authoritative)?**
   - What we know: Local check is instant but could be stale. Supabase check is authoritative but adds a network request per sync.
   - Recommendation: Check locally first via `useMacroStore.getState().setBy`. If `'coach'`, skip immediately (zero network cost). The `pullCoachData()` function ensures local state matches server state on app open.

4. **What Supabase tables need to be created NOW vs in later phases?**
   - What we know: Project research recommends `invites`, `check_ins`, `workout_programs` tables. The roadmap says Phase 1 is foundation only.
   - Recommendation: Phase 1 creates ONLY the `set_by` column migration and RLS fixes. New tables (`invites`, `check_ins`, `workout_programs`) should be created in their respective phases. No empty tables -- create them when the feature needs them.

## Sources

### Primary (HIGH confidence)
- Direct analysis of `src/lib/sync.ts` -- all sync functions, `syncAllToCloud()`, `loadAllFromCloud()`, `scheduleSync()`, `flushPendingSync()`
- Direct analysis of `src/stores/macroStore.ts` -- `calculateMacros()`, `targets` state, persist middleware
- Direct analysis of `src/stores/authStore.ts` -- `syncData()`, `signIn()`, `signUp()` trigger points
- Direct analysis of `supabase/schema.sql` -- all tables, RLS policies, views, triggers, indexes
- Direct analysis of `src/App.tsx` -- route definitions, lazy loading, existing Coach route
- Direct analysis of `src/screens/Coach.tsx` -- existing coach dashboard, no auth guard
- Direct analysis of `src/lib/supabase.ts` -- `isCoach()` helper, `getSupabaseClient()`
- Direct analysis of `src/lib/database.types.ts` -- macro_targets type (no `set_by` column)
- Build output verification -- Coach chunk is separate (22.91 KB / 6.20 KB gzip)
- Project-level research: `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`, `.planning/research/SUMMARY.md`

### Secondary (MEDIUM confidence)
- Supabase RLS performance best practices for EXISTS subquery optimization
- React Router v6 route guarding patterns (component-based guard)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing packages
- Architecture: HIGH -- based on direct codebase analysis of every relevant file
- Pitfalls: HIGH -- identified from actual code inspection, not speculation
- RLS security: HIGH -- verified by reading the actual SQL policies
- Bundle splitting: HIGH -- verified by running production build

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable -- all findings based on codebase analysis, not external APIs)
