# Architecture Patterns: Coach Dashboard Integration

**Domain:** Coach dashboard for existing fitness gamification PWA
**Researched:** 2026-02-07
**Confidence:** HIGH (based on direct codebase analysis + verified Supabase patterns)

## Current Architecture Snapshot

Before designing the integration, here is what already exists:

### Existing Coach Infrastructure (Already Built)

The codebase already has significant coach infrastructure in place:

| Component | Location | Status |
|-----------|----------|--------|
| `coach_clients` table | `supabase/schema.sql` | Deployed, with indexes |
| `coach_client_summary` view | `supabase/schema.sql` | Deployed, joins profiles + XP + weight + workouts |
| `profiles.role` column | `supabase/schema.sql` | Deployed, enum `user_role = 'client' \| 'coach' \| 'admin'` |
| RLS policies (read) | `supabase/schema.sql` | Deployed for all data tables |
| `Coach.tsx` screen | `src/screens/Coach.tsx` | Functional client list + detail modal with tabs |
| `useClientDetails` hook | `src/hooks/useClientDetails.ts` | Functional with 5-min cache, fetches weight/macros/activity |
| `ClientActivityFeed` | `src/components/ClientActivityFeed.tsx` | Functional, grouped by date |
| `ClientMacroAdherence` | `src/components/ClientMacroAdherence.tsx` | Functional, adherence bars |
| `WeightChart` (reused) | `src/components/WeightChart.tsx` | Accepts generic `WeightEntry[]`, works for coach view |
| `isCoach()` helper | `src/lib/supabase.ts` | Queries `profiles.role === 'coach'` |
| Coach link in Settings | `src/screens/Settings.tsx` | Conditionally shows "Open Dom/me Dashboard" |
| `/coach` route | `src/App.tsx` | Lazy-loaded, inside authenticated routes |
| Mock data (dev bypass) | `src/lib/devSeed.ts` | 4 mock clients with weight/macro/activity data |
| Analytics events | `src/lib/analytics.ts` | `coachDashboardViewed`, `clientViewed` |
| Theme labels | `src/design/constants.ts` | `coach: 'Dom/me'`, `client: 'Sub'`, etc. |

### What is NOT Built Yet

The milestone asks about features that go BEYOND read-only client monitoring:

| Feature | Status | What's Needed |
|---------|--------|---------------|
| Coach assigns workout templates | NOT BUILT | New table, new RLS, new UI, client pull mechanism |
| Coach sets macro targets | PARTIALLY BUILT | RLS policy for coach UPDATE on `macro_targets` exists, but no UI |
| Coach-client check-ins/messaging | NOT BUILT | New table, new RLS, new UI |
| Client sees coach assignments | NOT BUILT | Client-side polling/subscription, store integration |
| Coach role assignment | MANUAL ONLY | Must be set via Supabase dashboard SQL |

### Existing Data Flow

```
CLIENT CREATES DATA:
  User action
    -> Zustand store (localStorage, source of truth)
      -> scheduleSync() (2s debounce)
        -> syncAllToCloud() (Supabase)

COACH READS DATA:
  Coach opens dashboard
    -> Direct Supabase queries (NOT Zustand)
      -> coach_client_summary view (client list)
      -> useClientDetails hook (weight, macros, activity)
```

### Existing Auth Flow

```
AccessGate (access code)
  -> Auth (email/password via Supabase)
    -> Onboarding (profile setup)
      -> Main App (routes)

Coach detection:
  Settings.tsx calls isCoach() -> queries profiles.role
  If coach, shows link to /coach route
  /coach route is inside main authenticated routes (no separate auth)
```

---

## Recommended Architecture for Coach Dashboard Expansion

### Design Principle: Two Data Authorities

The fundamental challenge is that Trained is offline-first (Zustand localStorage is truth), but coach data is server-authoritative (Supabase is truth). These two models must coexist.

**Rule:** Coach-originated data flows FROM Supabase TO client. Client-originated data flows FROM Zustand TO Supabase. They never conflict because they are different data domains.

```
COACH-ORIGINATED DATA (server-authoritative):
  Coach writes in dashboard
    -> Supabase directly
      -> Client polls on app open / visibility change
        -> Merged into Zustand stores

CLIENT-ORIGINATED DATA (offline-first, unchanged):
  User action
    -> Zustand store (localStorage)
      -> scheduleSync() -> Supabase
```

---

## 1. Supabase Schema Design

### New Tables Needed

#### `coach_workout_templates`

Coach-created workout templates that can be assigned to clients.

```sql
CREATE TABLE coach_workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workout_type workout_type NOT NULL,
  exercises JSONB DEFAULT '[]'::jsonb NOT NULL,
  -- exercises format matches existing Exercise[] shape:
  -- [{ name, targetSets, targetReps, notes }]
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE INDEX idx_coach_templates_coach ON coach_workout_templates(coach_id);

CREATE TRIGGER coach_workout_templates_updated_at
  BEFORE UPDATE ON coach_workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### `client_assignments`

Links a coach template to a specific client with scheduling info.

```sql
CREATE TABLE client_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES coach_workout_templates(id) ON DELETE SET NULL,
  -- Assignment can be a workout template OR macro targets
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('workout', 'macros')),
  -- For macro assignments, store targets directly
  macro_targets JSONB, -- { protein, calories, carbs, fats, activity_level }
  -- Scheduling
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_date DATE, -- NULL = indefinite
  notes TEXT,
  -- Client acknowledgment
  seen_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled'))
);

CREATE INDEX idx_assignments_client ON client_assignments(client_id, status);
CREATE INDEX idx_assignments_coach ON client_assignments(coach_id);
CREATE INDEX idx_assignments_effective ON client_assignments(client_id, effective_date DESC);

CREATE TRIGGER client_assignments_updated_at
  BEFORE UPDATE ON client_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### `coach_notes`

Coach can leave notes/check-in messages for clients.

```sql
CREATE TABLE coach_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  -- Simple types: 'note' (coach internal), 'message' (visible to client), 'check_in' (prompted response)
  note_type TEXT DEFAULT 'note' CHECK (note_type IN ('note', 'message', 'check_in')),
  -- Client response (for check_in type)
  client_response TEXT,
  responded_at TIMESTAMPTZ,
  -- Read tracking
  seen_at TIMESTAMPTZ
);

CREATE INDEX idx_coach_notes_client ON coach_notes(client_id, created_at DESC);
CREATE INDEX idx_coach_notes_coach ON coach_notes(coach_id, created_at DESC);
CREATE INDEX idx_coach_notes_unseen ON coach_notes(client_id) WHERE seen_at IS NULL;
```

### Schema NOT Recommended

| Rejected Idea | Why |
|---------------|-----|
| `coach_programs` (multi-week plans) | Scope creep. Start with single assignments, add programs later if needed. |
| Separate `coach_macro_targets` table | Unnecessary. `client_assignments` with `assignment_type = 'macros'` plus `macro_targets` JSONB handles this cleanly. Coach can also directly UPDATE the existing `macro_targets` table (RLS already allows this). |
| `conversations` / `messages` tables | Over-engineered for single-coach model. `coach_notes` with types covers check-ins and messages. |
| Custom claims in JWT | Adds complexity. `profiles.role` column query is fast with index and caches well. |

### Tables Already Deployed (No Changes Needed)

- `profiles` -- Has `role` column, no changes
- `coach_clients` -- Has coach-client relationship, no changes
- `coach_client_summary` view -- May need minor updates for new fields
- All data tables (weight_logs, workout_logs, etc.) -- RLS already allows coach read

---

## 2. Row Level Security (RLS) Policies

### Existing Policies (Already Deployed, No Changes)

All existing RLS policies follow the correct pattern. Summary:

| Table | Client Access | Coach Access |
|-------|--------------|--------------|
| `profiles` | Own row (SELECT, UPDATE) | Client rows via `coach_clients` join (SELECT only) |
| `coach_clients` | Own relationship (SELECT) | Full CRUD on own relationships |
| `weight_logs` | Full CRUD own rows | SELECT client rows |
| `macro_targets` | Full CRUD own rows | SELECT + UPDATE client rows |
| `daily_macro_logs` | Full CRUD own rows | SELECT client rows |
| `logged_meals` | Full CRUD own rows | SELECT client rows |
| `workout_logs` | Full CRUD own rows | SELECT client rows |
| `user_xp` | Full CRUD own rows | SELECT client rows |
| `xp_logs` | Full CRUD own rows | SELECT client rows |

### New Policies Needed

#### `coach_workout_templates`

```sql
ALTER TABLE coach_workout_templates ENABLE ROW LEVEL SECURITY;

-- Coach owns their templates
CREATE POLICY "Coaches can manage own templates"
  ON coach_workout_templates FOR ALL
  USING (coach_id = auth.uid());

-- Clients can see templates assigned to them (via client_assignments)
CREATE POLICY "Clients can view assigned templates"
  ON coach_workout_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_assignments ca
      WHERE ca.template_id = coach_workout_templates.id
      AND ca.client_id = auth.uid()
      AND ca.status = 'active'
    )
  );
```

#### `client_assignments`

```sql
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;

-- Coaches can manage assignments for their clients
CREATE POLICY "Coaches can manage client assignments"
  ON client_assignments FOR ALL
  USING (coach_id = auth.uid());

-- Clients can view their own assignments
CREATE POLICY "Clients can view own assignments"
  ON client_assignments FOR SELECT
  USING (client_id = auth.uid());

-- Clients can mark assignments as seen
CREATE POLICY "Clients can mark assignments as seen"
  ON client_assignments FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());
```

#### `coach_notes`

```sql
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;

-- Coaches can manage notes for their clients
CREATE POLICY "Coaches can manage notes"
  ON coach_notes FOR ALL
  USING (coach_id = auth.uid());

-- Clients can view messages/check-ins addressed to them (NOT internal notes)
CREATE POLICY "Clients can view their messages"
  ON coach_notes FOR SELECT
  USING (
    client_id = auth.uid()
    AND note_type IN ('message', 'check_in')
  );

-- Clients can update their response and seen_at
CREATE POLICY "Clients can respond to check-ins"
  ON coach_notes FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());
```

### RLS Performance Considerations

The existing coach RLS policies use `EXISTS (SELECT 1 FROM coach_clients WHERE ...)` subqueries. With indexes already on `coach_clients(coach_id)` and `coach_clients(client_id)`, these are efficient.

**Recommendation:** Add a composite partial index for the most common coach RLS check:

```sql
CREATE INDEX idx_coach_clients_active
  ON coach_clients(coach_id, client_id)
  WHERE status = 'active';
```

This partial index covers every coach RLS policy check with a single index scan.

**Confidence:** HIGH -- this follows documented Supabase RLS performance best practices for EXISTS subqueries with filtered indexes.

---

## 3. Route Structure

### Current Route Structure

```
/           -> Home
/workouts   -> Workouts
/macros     -> Macros
/avatar     -> AvatarScreen
/settings   -> Settings
/coach      -> Coach (single flat screen)
/achievements -> Achievements
```

### Recommended: Keep `/coach` as Entry, No Sub-routes Initially

The existing Coach.tsx is already a functional single-page dashboard with modal-based client detail views. For the expansion, continue this pattern rather than introducing sub-routes.

**Rationale:**
- The coach dashboard is mobile-first (same PWA)
- Modal-based navigation matches existing patterns (CheckInModal, XPClaimModal)
- Sub-routes (`/coach/clients/:id`, `/coach/templates`) add complexity for routing, back-button handling, and lazy loading without clear UX benefit on mobile
- The existing Coach.tsx already handles client selection + detail tabs via state

**If sub-routes become necessary later** (e.g., template editor needs its own URL), add them as:
```
/coach              -> Client list (existing)
/coach/templates    -> Template management (future)
/coach/assign/:id   -> Assignment flow (future)
```

But start without sub-routes.

### Navigation Changes

The coach dashboard is NOT in the bottom nav (correct -- it is accessed via Settings). This should remain the same because:
1. Most users are clients, not coaches (single coach, many clients)
2. Adding a nav item for one user bloats the nav for everyone
3. The Settings > Coach Dashboard link already works

**No changes needed to Navigation.tsx.**

---

## 4. State Management

### The Core Decision: Zustand vs React Query vs Direct Fetch

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Zustand store for coach data** | Consistent with codebase | Coach data is server-authoritative, localStorage persistence is wrong | REJECT |
| **React Query / TanStack Query** | Built for server-state, caching, stale-while-revalidate | New dependency, learning curve, different pattern from rest of app | REJECT for now |
| **Custom hooks with in-memory cache** | Already used (`useClientDetails`), familiar pattern, no new deps | Manual cache management, no optimistic updates | USE THIS |

**Recommendation: Extend the existing `useClientDetails` hook pattern.**

The codebase already uses this pattern successfully:
- `useClientDetails.ts` -- fetches weight/macros/activity with 5-minute Map-based cache
- Direct Supabase queries (no Zustand)
- State managed via `useState` inside the hook
- Cache invalidation via `refresh()` callback

New hooks following the same pattern:

```typescript
// src/hooks/useCoachTemplates.ts
// Fetches/creates/updates coach workout templates
// Uses same Map-based cache pattern as useClientDetails

// src/hooks/useClientAssignments.ts
// For coach: fetches assignments for a client
// For client: fetches own assignments (server-authoritative)

// src/hooks/useCoachNotes.ts
// Fetches/creates notes for a client
```

### Client-Side: Coach Assignments in Zustand

When the CLIENT opens their app, they need to see coach assignments. This data should NOT live in a separate store -- it should merge into existing stores.

```
Client opens app
  -> loadAllFromCloud() (existing)
  -> NEW: loadCoachAssignments()
    -> Fetches active assignments from client_assignments
    -> Macro assignment -> updates macroStore.targets (if newer)
    -> Workout assignment -> updates workoutStore.customizations (if newer)
    -> Message -> shows notification banner
```

**Key insight:** Coach assignments update EXISTING stores, not a new store. The client's Zustand stores remain the source of truth for their current workout plan and macro targets. Coach assignments are a mechanism to UPDATE those stores, not replace them.

### Where Coach Data Lives at Runtime

| Data | Where | Why |
|------|-------|-----|
| Client list | `useState` in Coach.tsx (fetched from `coach_client_summary` view) | Server-authoritative, no persistence needed |
| Client details (weight, macros, activity) | `useClientDetails` hook with Map cache | Already implemented, works well |
| Coach templates | New `useCoachTemplates` hook with Map cache | Server-authoritative, coach-only |
| Assignments | New `useClientAssignments` hook | Server-authoritative |
| Coach notes | New `useCoachNotes` hook | Server-authoritative |
| Client's active macro targets | `macroStore` (Zustand, persisted) | Offline-first, may be set by coach |
| Client's workout plan | `workoutStore` (Zustand, persisted) | Offline-first, may be set by coach |

---

## 5. Data Flow: Coach Assignments to Client Stores

### How Coach-Assigned Macros Flow to Client

```
COACH SIDE:
  Coach opens client detail
    -> Views current macro targets (from macro_targets table via RLS)
    -> Edits targets in UI
    -> Two options:
      a) Direct update: coach UPDATEs macro_targets row (RLS allows this)
      b) Assignment: coach INSERTs into client_assignments (audit trail)
    -> Recommendation: Use BOTH. Update macro_targets directly AND create
       an assignment record for audit trail.

CLIENT SIDE:
  Client opens app (or returns from background after 30s)
    -> flushPendingSync() fires (existing)
    -> NEW: checkCoachUpdates() runs alongside
      -> Queries macro_targets from Supabase for own user_id
      -> Compares with macroStore.targets
      -> If Supabase version is newer (updated_at comparison):
        -> Updates macroStore.targets
        -> Shows toast: "Your coach updated your macro targets"
      -> Queries client_assignments WHERE seen_at IS NULL
      -> If unseen assignments exist:
        -> Shows notification banner
        -> Marks as seen when user taps
```

### How Coach-Assigned Workouts Flow to Client

```
COACH SIDE:
  Coach creates workout template (exercises JSONB matches existing Exercise shape)
    -> Saves to coach_workout_templates
  Coach assigns template to client
    -> Creates client_assignments with template_id
    -> Can set effective_date (start next week, etc.)

CLIENT SIDE:
  Client opens app
    -> checkCoachUpdates() queries active workout assignments
    -> If active workout assignment exists:
      -> Converts template exercises to workoutStore.customizations format
      -> Updates workoutStore.setCustomExercises() for the assigned workout type
      -> Shows toast: "Your coach updated your workout plan"
    -> Client still starts workouts normally (getTodayWorkout())
    -> The customized exercises from coach assignment are automatically used
       because workoutStore.startWorkout() already checks customizations first
```

### Sync Timing

When does the client check for coach updates?

| Trigger | Mechanism | Already Exists? |
|---------|-----------|-----------------|
| App open (cold start) | `authStore.syncData()` calls `loadAllFromCloud()` | YES -- add `checkCoachUpdates()` here |
| Return from background (30s+) | `flushPendingSync()` in visibility change handler | YES -- add `checkCoachUpdates()` here |
| Manual pull-to-refresh | Not implemented | Add if needed later |
| Supabase Realtime subscription | Would provide instant updates | NOT RECOMMENDED initially (see below) |

### Why Not Supabase Realtime?

Supabase Realtime (Postgres Changes) would let the client get instant notifications when the coach updates their data. However:

1. **Overkill for single-coach model.** Coach updates are infrequent (maybe 1-2x/week per client). Polling on app open is sufficient.
2. **Adds WebSocket connection overhead.** Every client maintains a persistent connection. At 90K potential clients, this is 90K WebSocket connections.
3. **Complexity.** Requires channel management, reconnection logic, and state synchronization -- for updates that happen very rarely.
4. **PWA background limitations.** Service workers cannot maintain WebSocket connections. The client only receives updates when the app is in the foreground anyway.

**Recommendation:** Poll on app open + visibility change. If latency becomes an issue (coach changes something and calls client to check), add a "Refresh" button. Realtime can be added later as an enhancement.

**Confidence:** HIGH -- polling is the correct pattern for low-frequency server-authoritative updates in a PWA.

---

## 6. Auth Model

### Current Implementation (Already Working)

The auth model for coach identification is already implemented:

```typescript
// src/lib/supabase.ts
export const isCoach = async (): Promise<boolean> => {
  const user = await getUser()
  const { data } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return data?.role === 'coach'
}
```

```sql
-- supabase/schema.sql
CREATE TYPE user_role AS ENUM ('client', 'coach', 'admin');

CREATE TABLE profiles (
  role user_role DEFAULT 'client' NOT NULL,
  ...
);
```

### How Coach Role is Set

Currently: Manually via Supabase dashboard SQL.

```sql
UPDATE profiles SET role = 'coach' WHERE email = 'coach@example.com';
```

**This is correct for a single-coach model.** No self-service coach registration is needed. The coach is the product owner.

### Recommendations

1. **Keep `profiles.role` column.** It works, it is simple, it is already deployed.
2. **Do NOT use Supabase custom claims (JWT).** Custom claims require Edge Functions or a separate auth hook. The `profiles.role` query is fast enough (one indexed lookup on app load).
3. **Cache the coach check.** Currently `isCoach()` is called in `Settings.tsx` on mount. The result should be cached in a `useState` or a lightweight store so it is not re-queried on every Settings re-render. (It already does this -- `const [isCoach, setIsCoach] = useState(false)` in Settings.tsx.)
4. **For the coach screen itself:** The `/coach` route should verify the role on mount and redirect non-coaches. Currently it does NOT do this -- any authenticated user can navigate to `/coach` directly. The RLS policies prevent data access, but the UI should also guard.

### Auth Guard Recommendation

Add a role check at the route level:

```typescript
// In Coach.tsx, add at the top of the component:
const [authorized, setAuthorized] = useState<boolean | null>(null)

useEffect(() => {
  isCoach().then(result => {
    setAuthorized(result)
    if (!result) navigate('/') // redirect non-coaches
  })
}, [])

if (authorized === null) return <LoadingSkeleton />
if (authorized === false) return null // redirect happens in effect
```

---

## 7. Component Architecture

### New Components Needed

| Component | Location | Purpose |
|-----------|----------|---------|
| `CoachTemplateEditor` | `src/components/CoachTemplateEditor.tsx` | Create/edit workout templates (exercise list editor) |
| `MacroTargetEditor` | `src/components/MacroTargetEditor.tsx` | Edit macro targets for a client (reuse calculation logic from macroStore) |
| `AssignmentCard` | `src/components/AssignmentCard.tsx` | Display an assignment in the client's view |
| `CoachNoteBanner` | `src/components/CoachNoteBanner.tsx` | Show coach messages/check-in prompts to client |
| `AssignmentFlow` | `src/components/AssignmentFlow.tsx` | Multi-step flow: pick template -> pick client -> set dates -> confirm |

### Modified Components

| Component | Change | Reason |
|-----------|--------|--------|
| `Coach.tsx` | Add "Assign Workout" and "Update Macros" buttons to client detail modal | Core new functionality |
| `Coach.tsx` | Add templates tab or section | Coach needs to manage templates |
| `Home.tsx` | Add coach notification banner | Client needs to see coach messages |
| `Macros.tsx` | Add "Set by coach" indicator | Client should know when targets are coach-set |
| `Workouts.tsx` | Add "Custom plan from coach" indicator | Client should know when plan is coach-assigned |
| `sync.ts` | Add `checkCoachUpdates()` function | Client needs to pull coach changes |

### Component Reuse

Several existing components work directly for coach features with no changes:

- `WeightChart` -- Already accepts generic `WeightEntry[]` data prop
- `ProgressBar` -- Used by `ClientMacroAdherence`, reusable
- `Card`, `Button`, `Input` (shadcn/ui) -- Standard throughout
- `ClientActivityFeed` -- Already built for coach view
- `ClientMacroAdherence` -- Already built for coach view

### Existing Pattern for Exercise Editing

The `workoutStore` already has `CustomExercise` and `WorkoutCustomization` types that match what the coach template editor needs:

```typescript
// Already exists in workoutStore.ts
export interface CustomExercise {
  id: string
  name: string
  targetSets: number
  targetReps: string
}

export interface WorkoutCustomization {
  workoutType: WorkoutType
  exercises: CustomExercise[]
}
```

The coach template editor can produce this same shape, making assignment to the client's workoutStore trivial.

---

## 8. Suggested Build Order

Based on dependencies between components:

### Phase 1: Schema + Coach Auth Guard (Foundation)

**Dependencies:** None (builds on existing schema)
**What:** New tables, RLS policies, migration, auth guard
**Why first:** Everything else depends on the schema existing

1. Create migration for `coach_workout_templates`, `client_assignments`, `coach_notes`
2. Add RLS policies for new tables
3. Add composite partial index for coach RLS performance
4. Update `database.types.ts` with new table types
5. Add auth guard to `Coach.tsx` (redirect non-coaches)

### Phase 2: Coach Template Management (Coach UI)

**Dependencies:** Phase 1
**What:** Coach can create and manage workout templates

1. `useCoachTemplates` hook (CRUD operations + Map cache)
2. `CoachTemplateEditor` component (exercise list CRUD matching existing CustomExercise shape)
3. Add templates section to `Coach.tsx`
4. Dev mock data for templates

### Phase 3: Coach Assignments + Macro Editing (Coach UI)

**Dependencies:** Phases 1-2
**What:** Coach can assign workouts and update macros for clients

1. `useClientAssignments` hook
2. `MacroTargetEditor` component (direct update to client's macro_targets)
3. `AssignmentFlow` component (pick template -> pick client -> set dates)
4. Add assignment + macro editing to client detail modal in `Coach.tsx`
5. `useCoachNotes` hook + note input in client detail

### Phase 4: Client Receives Coach Data (Client Side)

**Dependencies:** Phase 3
**What:** Client's app pulls coach assignments and updates stores

1. `checkCoachUpdates()` function in `sync.ts`
2. Wire into `loadAllFromCloud()` and visibility change handler
3. `AssignmentCard` component for Home screen
4. `CoachNoteBanner` component for messages
5. "Set by coach" indicators on Macros and Workouts screens
6. Mark assignments as seen (client UPDATE via RLS)

### Phase 5: Polish + Edge Cases

**Dependencies:** Phase 4
**What:** Edge cases, check-in responses, expiration handling

1. Check-in prompt flow (coach sends check-in, client responds)
2. Assignment expiration handling (cron or check-on-load)
3. Empty states for all new coach views
4. Client pagination for coach dashboard (currently loads all)

---

## 9. Anti-Patterns to Avoid

### Anti-Pattern 1: Separate Zustand Store for Coach Data
**What:** Creating a `coachStore.ts` with localStorage persistence for coach-side data.
**Why bad:** Coach data is server-authoritative. Persisting it in localStorage creates stale data problems and sync conflicts. The coach could be on a different device.
**Instead:** Use hooks with in-memory cache (Map-based, like `useClientDetails`).

### Anti-Pattern 2: Zustand Store for Coach Assignments on Client Side
**What:** Creating a `coachAssignmentsStore.ts` on the client side.
**Why bad:** Assignments are server-authoritative. If the coach revokes an assignment, the client's localStorage still has it.
**Instead:** Merge assignment data INTO existing stores (macroStore, workoutStore). Poll for changes on app open.

### Anti-Pattern 3: Real-time WebSocket for Coach Updates
**What:** Using Supabase Realtime channels for coach-to-client updates.
**Why bad:** Overkill for infrequent updates, creates 90K persistent connections, does not work in PWA background.
**Instead:** Poll on app open + visibility change. Sub-second latency is not needed.

### Anti-Pattern 4: Separate Auth System for Coach
**What:** Different login flow, separate JWT, admin panel.
**Why bad:** Adds massive complexity. Coach is just a user with `role = 'coach'`.
**Instead:** Same auth, same app, conditional UI based on `profiles.role`.

### Anti-Pattern 5: Coach Editing Client's Zustand Directly
**What:** Trying to push data directly into a client's localStorage.
**Why bad:** Impossible -- coach and client are on different devices/browsers.
**Instead:** Coach writes to Supabase. Client pulls from Supabase on next open.

### Anti-Pattern 6: Building Multi-Coach Support Prematurely
**What:** Adding `organization_id`, team permissions, coach-to-coach handoffs.
**Why bad:** Scope creep. This is a single-coach product.
**Instead:** Design for single coach. The `coach_id` foreign keys are already there if multi-coach is needed later, but do not build the infrastructure now.

---

## 10. Scalability Considerations

| Concern | Current (1 coach, 10 clients) | At 1K clients | At 90K clients |
|---------|-------------------------------|---------------|----------------|
| `coach_client_summary` view | Fast (subquery per row) | Add pagination | Materialized view with refresh trigger |
| RLS policy checks | Negligible | Add partial index (recommended above) | Partial index sufficient |
| Coach loading all clients | Single query | Paginate (limit/offset) | Virtual scrolling + search |
| Client polling for assignments | 1 query on app open | Same | Same (indexed, single-row lookup) |
| Coach notes volume | Minimal | Paginate per client | Archive old notes |

**Critical at scale:** The `coach_client_summary` view does correlated subqueries (latest weight, workouts last 7 days) per client row. At 90K clients, this view will be slow. Solutions:
1. Paginate the client list (show 50 at a time with search)
2. Replace correlated subqueries with a materialized view refreshed on a schedule
3. Add `last_activity_at` denormalized column to `coach_clients` for sorting

**Recommendation:** Add pagination to the client list from the start. The current code fetches ALL clients with `.select('*')`. Change to `.select('*').order('last_check_in_date', { ascending: false, nullsFirst: false }).limit(50)` and add search.

---

## 11. Database Types Update

The `database.types.ts` file must be updated with the new tables. This can be generated via `supabase gen types typescript` or manually added:

```typescript
// Add to Database.public.Tables:

coach_workout_templates: {
  Row: {
    id: string
    created_at: string
    updated_at: string
    coach_id: string
    name: string
    description: string | null
    workout_type: WorkoutType
    exercises: Json
    is_active: boolean
  }
  Insert: {
    id?: string
    created_at?: string
    updated_at?: string
    coach_id: string
    name: string
    description?: string | null
    workout_type: WorkoutType
    exercises?: Json
    is_active?: boolean
  }
  Update: {
    id?: string
    created_at?: string
    updated_at?: string
    coach_id?: string
    name?: string
    description?: string | null
    workout_type?: WorkoutType
    exercises?: Json
    is_active?: boolean
  }
  Relationships: []
}

client_assignments: {
  Row: {
    id: string
    created_at: string
    updated_at: string
    coach_id: string
    client_id: string
    template_id: string | null
    assignment_type: 'workout' | 'macros'
    macro_targets: Json | null
    effective_date: string
    expires_date: string | null
    notes: string | null
    seen_at: string | null
    status: 'active' | 'completed' | 'expired' | 'cancelled'
  }
  Insert: {
    id?: string
    created_at?: string
    updated_at?: string
    coach_id: string
    client_id: string
    template_id?: string | null
    assignment_type: 'workout' | 'macros'
    macro_targets?: Json | null
    effective_date?: string
    expires_date?: string | null
    notes?: string | null
    seen_at?: string | null
    status?: 'active' | 'completed' | 'expired' | 'cancelled'
  }
  Update: {
    id?: string
    created_at?: string
    updated_at?: string
    coach_id?: string
    client_id?: string
    template_id?: string | null
    assignment_type?: 'workout' | 'macros'
    macro_targets?: Json | null
    effective_date?: string
    expires_date?: string | null
    notes?: string | null
    seen_at?: string | null
    status?: 'active' | 'completed' | 'expired' | 'cancelled'
  }
  Relationships: []
}

coach_notes: {
  Row: {
    id: string
    created_at: string
    coach_id: string
    client_id: string
    content: string
    note_type: 'note' | 'message' | 'check_in'
    client_response: string | null
    responded_at: string | null
    seen_at: string | null
  }
  Insert: {
    id?: string
    created_at?: string
    coach_id: string
    client_id: string
    content: string
    note_type?: 'note' | 'message' | 'check_in'
    client_response?: string | null
    responded_at?: string | null
    seen_at?: string | null
  }
  Update: {
    id?: string
    created_at?: string
    coach_id?: string
    client_id?: string
    content?: string
    note_type?: 'note' | 'message' | 'check_in'
    client_response?: string | null
    responded_at?: string | null
    seen_at?: string | null
  }
  Relationships: []
}
```

---

## 12. Integration Points Summary

### Files That Need Changes

| File | Change Type | What Changes |
|------|-------------|-------------|
| `supabase/migrations/002_coach_dashboard.sql` | NEW | New tables, indexes, RLS, triggers |
| `src/lib/database.types.ts` | MODIFY | Add new table types |
| `src/lib/sync.ts` | MODIFY | Add `checkCoachUpdates()` function |
| `src/lib/supabase.ts` | NO CHANGE | `isCoach()` already works |
| `src/screens/Coach.tsx` | MODIFY | Add template management, assignment, macro editing, auth guard |
| `src/screens/Home.tsx` | MODIFY | Add coach notification banner |
| `src/screens/Macros.tsx` | MODIFY | Add "Set by coach" indicator |
| `src/screens/Workouts.tsx` | MODIFY | Add "Custom plan from coach" indicator |
| `src/hooks/useCoachTemplates.ts` | NEW | Template CRUD hook |
| `src/hooks/useClientAssignments.ts` | NEW | Assignment CRUD hook |
| `src/hooks/useCoachNotes.ts` | NEW | Notes CRUD hook |
| `src/components/CoachTemplateEditor.tsx` | NEW | Exercise list editor UI |
| `src/components/MacroTargetEditor.tsx` | NEW | Macro target editing UI |
| `src/components/AssignmentCard.tsx` | NEW | Client-facing assignment display |
| `src/components/CoachNoteBanner.tsx` | NEW | Client-facing coach message display |
| `src/components/AssignmentFlow.tsx` | NEW | Multi-step assignment creation flow |
| `src/lib/devSeed.ts` | MODIFY | Add mock templates, assignments, notes |

### Files That Do NOT Need Changes

| File | Why |
|------|-----|
| `src/stores/authStore.ts` | Auth flow unchanged |
| `src/stores/syncStore.ts` | Sync status tracking unchanged |
| `src/components/Navigation.tsx` | Coach not in bottom nav |
| `src/screens/Auth.tsx` | Same auth for coach and client |
| `src/screens/AccessGate.tsx` | Same access code flow |
| `src/screens/Onboarding.tsx` | Coach does not go through onboarding differently |
| `src/components/WeightChart.tsx` | Already generic, no changes |
| `src/components/ClientActivityFeed.tsx` | Already built, no changes |
| `src/components/ClientMacroAdherence.tsx` | Already built, no changes |

---

## Sources

- Direct codebase analysis of all files listed above (HIGH confidence)
- Existing `supabase/schema.sql` for current schema and RLS policies (HIGH confidence)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
