# Phase 4: Macro Management - Research

**Researched:** 2026-02-07
**Domain:** Coach-to-client macro target setting, Supabase RLS write policies, Zustand state guards, directional sync
**Confidence:** HIGH

## Summary

Phase 4 builds on significant Phase 1 foundation work. The directional sync system (`pushClientData()` / `pullCoachData()`), the `set_by` column on `macro_targets`, the `setCoachTargets()` action in macroStore, and the `setBy`/`setByCoachId` state fields are all already implemented. The RLS policies for coach SELECT and UPDATE on `macro_targets` are already deployed. This phase needs to: (1) add a coach-side UI for setting client macros, (2) add a client-side "Set by Coach" indicator with calculator lock, and (3) ensure the client sees updated macros on next app open.

The research found that the existing infrastructure handles nearly all of the hard problems. The coach can already UPDATE macro_targets rows via RLS. The client-side `pullCoachData()` already pulls coach-set macros and calls `setCoachTargets()`. The `pushClientData()` function already skips macro upsert when `setBy === 'coach'`. The remaining work is purely UI: a macro editor form in the Coach screen, a badge/indicator on the client's Macros screen, and locking the calculator tab when macros are coach-owned.

**Primary recommendation:** Build the coach macro editor as an inline section in the existing Client Detail modal (not a separate route). Add a "Set by Coach" indicator on the client's Macros screen header and DailyView, and disable the Calculator tab when `setBy === 'coach'`. No new database migrations, Edge Functions, or sync changes are needed.

## Standard Stack

No new dependencies needed for Phase 4. Everything uses existing packages.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18 | UI framework | Already installed |
| Supabase JS | 2.93.3 | Database client (coach writes to macro_targets) | Already installed |
| Zustand | 4.x | Client state (setBy, targets) | Already installed |
| Lucide React | N/A | Icons (ShieldCheck, Lock, etc.) | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cn (clsx + tailwind-merge) | N/A | Conditional class names | Already installed, used throughout |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline macro editor in Client Detail modal | Separate /coach/client/:id/macros route | Separate route adds complexity, requires new lazy loading. Modal section is simpler, consistent with existing patterns (overview/progress/activity tabs already in modal) |
| Direct Supabase update from coach UI | Edge Function for macro setting | Edge Function adds latency and deployment dependency. RLS already allows coaches to UPDATE macro_targets for their clients. Direct update is sufficient for v1.3 single-coach model |
| Badge component for "Set by Coach" | Toast notification only | Badge is persistent and visible; toast is ephemeral. Client needs to ALWAYS see that coach owns targets, not just on first load |

**Installation:**
```bash
# No new packages needed for Phase 4
```

## Architecture Patterns

### Existing Infrastructure (from Phase 1)

All of these are already built and working:

#### 1. Database: `set_by` column on `macro_targets`
```sql
-- From migration 002_coach_foundation.sql (already applied)
ALTER TABLE macro_targets
  ADD COLUMN set_by TEXT NOT NULL DEFAULT 'self'
    CHECK (set_by IN ('self', 'coach')),
  ADD COLUMN set_by_coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
```

#### 2. RLS Policies (already deployed in schema.sql)
```sql
-- Coach can SELECT client macro targets (already exists)
CREATE POLICY "Coaches can view client macro targets"
  ON macro_targets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = auth.uid()
    AND coach_clients.client_id = macro_targets.user_id
    AND coach_clients.status = 'active'
  ));

-- Coach can UPDATE client macro targets (already exists)
CREATE POLICY "Coaches can update client macro targets"
  ON macro_targets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = auth.uid()
    AND coach_clients.client_id = macro_targets.user_id
    AND coach_clients.status = 'active'
  ));
```

**Critical gap identified:** There is NO `INSERT` policy for coaches on `macro_targets`. If a client has never set macros (no row exists for their `user_id`), the coach cannot insert a new row. The coach UPDATE policy only works on existing rows. A new RLS policy or an alternative approach is needed. See "Pitfall 1" below.

#### 3. Zustand macroStore (already has setBy support)
```typescript
// Already exists in macroStore.ts
interface MacroStore {
  setBy: 'self' | 'coach'
  setByCoachId: string | null
  setCoachTargets: (targets: MacroTargets, coachId: string) => void
}
```

The `setCoachTargets()` method already:
- Sets `targets` to the provided values
- Sets `setBy` to `'coach'`
- Sets `setByCoachId` to the coach's ID
- Regenerates the meal plan with the new targets

#### 4. Directional Sync (already implemented in sync.ts)
```typescript
// pushClientData() -- already skips macro targets when setBy === 'coach'
if (setBy !== 'coach') {
  results.macroTargets = await withRetryResult(syncMacroTargetsToCloud)
}

// pullCoachData() -- already pulls coach-set macros and calls setCoachTargets()
if (macroData.set_by === 'coach') {
  useMacroStore.getState().setCoachTargets(
    { protein, calories, carbs, fats },
    macroData.set_by_coach_id || ''
  )
}
```

#### 5. Auth Sync Flow (already calls pullCoachData)
```typescript
// authStore.syncData() already does:
await loadAllFromCloud()
await pullCoachData()    // <-- This is how client picks up coach changes
await pushClientData()
```

This means MACRO-03 ("Client sees updated macro targets after coach changes them on next app open") is ALREADY HANDLED by the existing sync flow. The client calls `pullCoachData()` on every sign-in and app initialization.

### What Phase 4 Needs to Build

```
Phase 4 changes:
src/
  screens/
    Coach.tsx              # MODIFY: add macro editor UI in Client Detail modal
    Macros.tsx             # MODIFY: add "Set by Coach" indicator, lock calculator
  lib/
    devSeed.ts             # MODIFY: add mock macro targets + setBy to mock client details
  hooks/
    useClientDetails.ts    # MODIFY: include set_by and all 4 macro fields in fetched targets

supabase/
  migrations/
    005_coach_macro_insert.sql  # NEW: add INSERT policy for coach on macro_targets
```

### Pattern 1: Coach Macro Editor (in Client Detail modal)
**What:** A form inside the Client Detail modal's "overview" or a new "macros" tab where the coach can enter calories, protein, carbs, and fat targets for a client.
**When to use:** When coach clicks a client and wants to set/update their macros.

The editor should:
1. Pre-populate with the client's current macro targets (fetched via `useClientDetails`)
2. Show a simple 4-field form (calories, protein, carbs, fats)
3. On submit, upsert to `macro_targets` with `set_by = 'coach'` and `set_by_coach_id = coach.id`
4. Show success toast
5. Invalidate the client details cache so next view shows updated values

**Implementation approach:**
```typescript
// Inside Coach.tsx, in the Client Detail modal
const handleSetMacros = async (clientId: string, macros: {
  calories: number; protein: number; carbs: number; fats: number
}) => {
  const client = getSupabaseClient()
  const { error } = await client
    .from('macro_targets')
    .upsert({
      user_id: clientId,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fats: macros.fats,
      set_by: 'coach',
      set_by_coach_id: user!.id,
      activity_level: 'moderate', // Default; coach doesn't set activity level
    }, { onConflict: 'user_id' })

  if (error) {
    toast.error('Failed to set macros')
    return
  }

  toast.success('Macros updated')
  refreshClientDetails() // Invalidate cache
}
```

### Pattern 2: "Set by Coach" Client-Side Indicator
**What:** A visual indicator on the client's Macros screen showing that targets are coach-set, plus disabling the Calculator tab.
**When to use:** When `macroStore.setBy === 'coach'`.

The indicator should:
1. Show a badge/pill on the Macros screen header: "Set by Coach" (or themed equivalent using LABELS)
2. Replace the "Set Up Targets" CTA in DailyView empty state with "Your coach hasn't set targets yet" if no targets exist
3. On the Calculator tab: show a message like "Your macros are set by your coach" with the current targets displayed (read-only) instead of the editable form
4. Prevent `calculateMacros()` from being called when `setBy === 'coach'`

### Pattern 3: Coach Reverting to Client-Owned
**What:** The coach can "release" macro ownership back to the client by setting `set_by = 'self'` in Supabase.
**When to use:** Coach wants the client to manage their own macros again.

This is already partially handled:
- `pullCoachData()` already resets local `setBy` to `'self'` when server shows `set_by = 'self'`
- The coach UI needs a "Release to client" button that updates `set_by = 'self'` and `set_by_coach_id = null`

### Anti-Patterns to Avoid
- **Anti-pattern: Using Supabase Realtime for instant macro updates.** The requirement says "on next app open," not "in real-time." The existing `pullCoachData()` on auth sync handles this. Realtime adds connection management complexity for no user value.
- **Anti-pattern: Creating a new Zustand store for coach-side state.** Coach data is server-authoritative. The `useClientDetails` hook already manages the cache. Adding a Zustand persist store for coach-side data creates stale state problems.
- **Anti-pattern: Adding the macro editor as a separate route/page.** The Client Detail modal already has tabs (overview, progress, activity). Adding macros inline keeps the UX cohesive and avoids new routing complexity.
- **Anti-pattern: Blocking the entire Macros screen when setBy is 'coach'.** Only the Calculator tab should be locked. The client should still be able to view their targets, log meals, and track daily progress. Coach-set targets does NOT mean the client can't use the Macros screen.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coach auth for macro writes | Custom auth middleware | Existing RLS policies on macro_targets | Coach UPDATE policy already exists; just need to add INSERT policy |
| Client-side ownership guard | Custom sync interceptor | Existing `setBy` check in `pushClientData()` | Already implemented in Phase 1 |
| Coach data pull on app open | Custom polling system | Existing `pullCoachData()` in auth sync flow | Already called on sign-in and app init |
| Form validation for macro inputs | Custom validation library | HTML5 `type="number"` + `min`/`max` attributes + basic JS checks | Macros are just 4 integers; full validation library is overkill |

**Key insight:** Phase 1 already built the hard parts (sync direction, ownership model, RLS, state management). Phase 4 is primarily UI work.

## Common Pitfalls

### Pitfall 1: Missing INSERT Policy for Coach on macro_targets
**What goes wrong:** Coach tries to set macros for a client who has never used the macro calculator (no `macro_targets` row exists for their `user_id`). The UPDATE policy exists but INSERT does not. The upsert fails silently or with an RLS error.
**Why it happens:** Phase 1 only added SELECT and UPDATE policies for coaches on `macro_targets`, not INSERT. The assumption was that the client would always have created a row first.
**How to avoid:** Either add an INSERT policy for coaches on `macro_targets`, OR use an upsert approach that works within existing policies. The cleanest fix is a new migration adding:
```sql
CREATE POLICY "Coaches can insert client macro targets"
  ON macro_targets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = macro_targets.user_id
      AND coach_clients.status = 'active'
    )
  );
```
**Warning signs:** Coach clicks "Set Macros" for a new client (who hasn't used the calculator yet) and gets an error.

### Pitfall 2: Stale Client Detail Cache After Macro Update
**What goes wrong:** Coach sets macros, but the Client Detail modal still shows old macro data because `useClientDetails` has a 5-minute cache.
**Why it happens:** `useClientDetails` caches `macroData` with `CACHE_TTL = 5 * 60 * 1000`. The refresh function clears the cache, but it must be called explicitly after the macro update.
**How to avoid:** Call `refreshClientDetails()` (which calls `clientCache.delete(clientId)`) after successful macro upsert.
**Warning signs:** Coach sets macros, closes and re-opens client modal, sees old values.

### Pitfall 3: Calculator Tab Not Locked When setBy is 'coach'
**What goes wrong:** Client with coach-set macros navigates to the Calculator tab and recalculates macros. The `calculateMacros()` function sets `setBy = 'self'`, which causes `pushClientData()` to overwrite the coach's macros on next sync.
**Why it happens:** The Calculator tab currently has no awareness of `setBy`. It calls `calculateMacros()` unconditionally, which resets `setBy` to `'self'`.
**How to avoid:** When `setBy === 'coach'`, either disable the Calculate button or show a read-only view with a "Your macros are managed by your coach" message. If the client REALLY wants to override, show a confirmation dialog that warns they'll lose coach-set values.
**Warning signs:** Client with coach-set macros recalculates, then coach sees their values reverted.

### Pitfall 4: Coach Setting activity_level Column
**What goes wrong:** The `macro_targets` table has a `NOT NULL` constraint on `activity_level`. The coach doesn't set activity level (only macro numbers). If the upsert doesn't include `activity_level`, it fails on INSERT.
**Why it happens:** The coach macro editor sets calories/protein/carbs/fats but the table requires an `activity_level` value.
**How to avoid:** On INSERT, use a default value like `'moderate'`. On UPDATE, don't modify `activity_level` (it's the client's self-reported value). The upsert should include `activity_level: 'moderate'` as a fallback.
**Warning signs:** Coach sets macros for a new client, gets a "NOT NULL constraint violation" error.

### Pitfall 5: setBy State Not Reflected in Home Screen
**What goes wrong:** The Home screen shows macro progress but has no "Set by Coach" indicator. Client is confused about where their targets came from.
**Why it happens:** Home screen reads from `useMacroStore` for targets but doesn't check `setBy`.
**How to avoid:** Add a small "Set by Coach" badge near the Protocol Compliance section on the Home screen when `setBy === 'coach'`. This is a nice-to-have, not critical -- the Macros screen is the primary place for this indicator.
**Warning signs:** Client sees different targets than expected and doesn't know why.

### Pitfall 6: Dev Bypass Missing Mock Coach Macro Data
**What goes wrong:** In dev bypass mode (`VITE_DEV_BYPASS=true`), the coach macro editor has no mock data to work with. The mock client details return macro adherence data but no `set_by` field.
**Why it happens:** The `buildMockMacroData()` function in `devSeed.ts` returns `{ logs, targets }` but doesn't include `set_by` or `set_by_coach_id`.
**How to avoid:** Add `set_by` and `set_by_coach_id` to the mock macro data. For dev bypass, the macro editor should work with mock mutations (update in-memory mock data).
**Warning signs:** Dev bypass mode shows "No targets set" for clients even though mock targets exist.

## Code Examples

### Example 1: Coach Macro Editor Component
```typescript
// Inside Coach.tsx Client Detail modal
function MacroEditor({
  clientId,
  currentTargets,
  coachId,
  onSaved,
}: {
  clientId: string
  currentTargets: { protein: number; calories: number; carbs: number; fats: number } | null
  coachId: string
  onSaved: () => void
}) {
  const [calories, setCalories] = useState(String(currentTargets?.calories || ''))
  const [protein, setProtein] = useState(String(currentTargets?.protein || ''))
  const [carbs, setCarbs] = useState(String(currentTargets?.carbs || ''))
  const [fats, setFats] = useState(String(currentTargets?.fats || ''))
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!calories || !protein || !carbs || !fats) return
    setIsSaving(true)

    const client = getSupabaseClient()
    const { error } = await client
      .from('macro_targets')
      .upsert({
        user_id: clientId,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fats: Number(fats),
        set_by: 'coach',
        set_by_coach_id: coachId,
        activity_level: 'moderate',
      }, { onConflict: 'user_id' })

    setIsSaving(false)
    if (error) {
      toast.error('Failed to set macros')
      return
    }
    toast.success('Macros updated for client')
    onSaved()
  }

  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">SET MACRO TARGETS</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground">Calories</label>
            <Input type="number" value={calories} onChange={e => setCalories(e.target.value)} min={800} max={8000} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Protein (g)</label>
            <Input type="number" value={protein} onChange={e => setProtein(e.target.value)} min={50} max={500} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Carbs (g)</label>
            <Input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} min={0} max={1000} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Fats (g)</label>
            <Input type="number" value={fats} onChange={e => setFats(e.target.value)} min={20} max={300} />
          </div>
        </div>
        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Set Macros'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Example 2: "Set by Coach" Badge on Client Macros Screen
```typescript
// In Macros.tsx header section
const { setBy } = useMacroStore()

// In the header JSX:
<div className="bg-card pt-8 pb-4 px-5">
  <div className="flex items-center gap-2">
    <h1 className="text-2xl font-bold">Macros</h1>
    {setBy === 'coach' && (
      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
        <ShieldCheck size={12} />
        Set by {LABELS.coach}
      </span>
    )}
  </div>
  {/* ... tabs ... */}
</div>
```

### Example 3: Locked Calculator Tab
```typescript
// In Macros.tsx, when activeTab === 'calculator' and setBy === 'coach':
{activeTab === 'calculator' && setBy === 'coach' ? (
  <Card className="py-0 border-primary/20">
    <CardContent className="text-center py-8">
      <ShieldCheck size={40} className="mx-auto mb-4 text-primary" />
      <p className="text-lg font-bold mb-2">Macros Set by {LABELS.coach}</p>
      <p className="text-muted-foreground text-sm mb-6">
        Your macro targets are managed by your {LABELS.coach.toLowerCase()}. Contact them to request changes.
      </p>
      {targets && (
        <div className="grid grid-cols-2 gap-4 text-left">
          <div><p className="text-xs text-muted-foreground">Calories</p><p className="text-2xl font-bold font-digital text-primary">{targets.calories}</p></div>
          <div><p className="text-xs text-muted-foreground">Protein</p><p className="text-2xl font-bold font-digital text-primary">{targets.protein}g</p></div>
          <div><p className="text-xs text-muted-foreground">Carbs</p><p className="text-lg font-digital">{targets.carbs}g</p></div>
          <div><p className="text-xs text-muted-foreground">Fats</p><p className="text-lg font-digital">{targets.fats}g</p></div>
        </div>
      )}
    </CardContent>
  </Card>
) : activeTab === 'calculator' && (
  <CalculatorView ... />
)}
```

### Example 4: Coach Revert to Client-Owned
```typescript
const handleRevertMacros = async (clientId: string) => {
  if (!confirm('Release macro targets back to the client?')) return

  const client = getSupabaseClient()
  const { error } = await client
    .from('macro_targets')
    .update({
      set_by: 'self',
      set_by_coach_id: null,
    })
    .eq('user_id', clientId)

  if (error) {
    toast.error('Failed to release macros')
    return
  }
  toast.success('Client can now manage their own macros')
  refreshClientDetails()
}
```

### Example 5: RLS Migration for Coach INSERT
```sql
-- 005_coach_macro_insert.sql
CREATE POLICY "Coaches can insert client macro targets"
  ON macro_targets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = macro_targets.user_id
      AND coach_clients.status = 'active'
    )
  );
```

## Existing Code Inventory

Files that need modification and their current state:

### `src/screens/Coach.tsx` (823 lines)
- Client Detail modal is a bottom sheet with tabs: overview, progress, activity
- Has header, tab navigation, content area, and "Remove Client" footer
- Uses `useClientDetails(clientId)` for data fetching
- Uses `useClientRoster()` for client list
- The macro editor should be added inside the "overview" tab content, between the Activity Summary card and the Weight Trend card
- Already imports: Button, Card, CardContent, Input, WeightChart, ClientMacroAdherence, ClientActivityFeed, useAuthStore, toast, getSupabaseClient, useClientDetails, useClientRoster, analytics, cn

### `src/screens/Macros.tsx` (897 lines)
- Has 4 tabs: daily, log, meals, calculator
- `DailyView` shows macro progress rings and quick log form
- `CalculatorView` has the full macro calculator form
- Currently does NOT read `setBy` from macroStore
- The `useMacroStore()` destructure at line 23-38 needs `setBy` added
- `CalculatorView` component needs conditional rendering based on `setBy`

### `src/stores/macroStore.ts` (664 lines)
- Already has: `setBy: 'self' | 'coach'`, `setByCoachId: string | null`, `setCoachTargets()`
- `calculateMacros()` already resets `setBy` to `'self'` and `setByCoachId` to `null`
- `resetMacros()` already resets `setBy` to `'self'`
- `exportData()` does NOT include `setBy` -- acceptable, export/import is for data portability
- No changes needed to the store itself

### `src/lib/sync.ts` (601 lines)
- `pushClientData()` already skips macros when `setBy === 'coach'` (line 432-435)
- `pullCoachData()` already pulls coach macros and calls `setCoachTargets()` (line 470-481)
- `pullCoachData()` already handles coach revert (resets `setBy` to `'self'` when server shows `set_by = 'self'`)
- No changes needed to sync

### `src/hooks/useClientDetails.ts` (306 lines)
- `fetchClientMacros()` fetches from `macro_targets` but only selects `protein, calories` (line 119)
- Needs to also select `carbs, fats, set_by, set_by_coach_id` for the coach macro editor
- `MacroTargets` interface currently only has `protein` and `calories` -- needs `carbs` and `fats`
- `MacroAdherence` interface has `{ logs, targets }` where targets is `MacroTargets | null`

### `src/lib/devSeed.ts` (641 lines)
- `buildMockMacroData()` returns `{ logs, targets: { protein, calories } }` -- missing `carbs`, `fats`, `set_by`
- Need to add full macro target data to mock details
- Need to add mock handler for coach macro update in dev bypass mode

### `supabase/schema.sql`
- Has coach SELECT and UPDATE policies on `macro_targets`
- Missing INSERT policy for coach on `macro_targets`

## State of the Art

| Old Approach (before Phase 4) | Current Approach (after Phase 4) | When Changed | Impact |
|-------------------------------|----------------------------------|--------------|--------|
| Coach can only VIEW client macros | Coach can SET client macros from dashboard | Phase 4 | MACRO-01 fulfilled |
| No indication of macro source to client | "Set by Coach" badge on Macros screen | Phase 4 | MACRO-02 fulfilled |
| Calculator always editable | Calculator locked when coach-owned with read-only display | Phase 4 | MACRO-02 fulfilled |
| No coach INSERT policy on macro_targets | INSERT policy allows coach to create targets for clients without existing rows | Phase 4 | Enables MACRO-01 for new clients |

## Open Questions

1. **Should the coach macro editor be a new tab or inline in the overview tab?**
   - What we know: The Client Detail modal has 3 tabs (overview, progress, activity). A 4th "macros" tab is an option.
   - What's unclear: Whether this adds too many tabs for the mobile bottom sheet UX.
   - Recommendation: Add it inline in the overview tab, below the Activity section. The macro editor is a quick action (4 fields + save), not a separate data view. If the overview gets too long, consider a 4th tab in a future phase.

2. **Should the client be able to override coach-set macros?**
   - What we know: The success criteria says "Client sees 'Set by Coach' indicator on their macro targets and cannot recalculate/override them."
   - What's unclear: Whether "cannot" means hard-locked or just warned.
   - Recommendation: Hard-lock. The Calculator tab shows read-only targets when `setBy === 'coach'`. The client contacts their coach to request changes. This matches the success criteria literally.

3. **What happens when the coach removes a client but had set their macros?**
   - What we know: The `set_by_coach_id` has `ON DELETE SET NULL`, so the reference is cleaned up. But `set_by` remains `'coach'` in the database.
   - What's unclear: Should the macros revert to client-owned when the coach relationship is removed?
   - Recommendation: Out of scope for Phase 4. The client can still use the coach-set targets. If they want to change them, they can recalculate (the Calculator lock checks `setBy` which is pulled from Supabase -- once the relationship is gone and `pullCoachData()` sees no coach relationship, it could clear the state). This edge case can be handled in a cleanup pass.

4. **Does `pullCoachData()` need to run on visibility change for MACRO-03?**
   - What we know: MACRO-03 requires "Client sees updated macro targets after coach changes them (on next app open)." The existing `syncData()` in authStore is called on sign-in. App.tsx has a visibility change listener that calls `flushPendingSync()` which only pushes, not pulls.
   - What's unclear: Whether "next app open" includes returning from background (visibility change) or only full app reload/sign-in.
   - Recommendation: The current behavior (pull on sign-in/app init) already satisfies the success criteria. Adding pull on visibility change is nice-to-have but not required for MACRO-03. The client will see updated macros when they next launch the app or sign in.

## Sources

### Primary (HIGH confidence)
- Direct analysis of `src/stores/macroStore.ts` -- `setBy`, `setByCoachId`, `setCoachTargets()`, `calculateMacros()` all verified
- Direct analysis of `src/lib/sync.ts` -- `pushClientData()` guard at line 432-435, `pullCoachData()` at line 456-492
- Direct analysis of `src/stores/authStore.ts` -- `syncData()` calls `pullCoachData()` at line 181
- Direct analysis of `supabase/schema.sql` -- RLS policies at lines 288-313 (SELECT + UPDATE for coach, no INSERT)
- Direct analysis of `supabase/migrations/002_coach_foundation.sql` -- `set_by` column, `set_by_coach_id` column
- Direct analysis of `src/screens/Coach.tsx` -- Client Detail modal structure, tabs, data flow
- Direct analysis of `src/screens/Macros.tsx` -- DailyView, CalculatorView, tab structure
- Direct analysis of `src/hooks/useClientDetails.ts` -- `fetchClientMacros()` only selects protein+calories
- Direct analysis of `src/lib/devSeed.ts` -- mock data structures, missing `set_by` and full macro fields
- Direct analysis of `src/lib/database.types.ts` -- `MacroSetBy` type, macro_targets type definitions

### Secondary (MEDIUM confidence)
- Supabase RLS documentation for INSERT vs UPDATE vs ALL policy semantics

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing packages
- Architecture: HIGH -- all infrastructure already exists from Phase 1, only UI work needed
- Pitfalls: HIGH -- identified from actual code inspection of all relevant files
- RLS gap: HIGH -- verified by reading actual SQL policies (INSERT policy missing)

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable -- all findings based on codebase analysis, not external APIs)
