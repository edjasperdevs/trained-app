# Phase 5: Workout Programming - Research

**Researched:** 2026-02-07
**Domain:** Supabase schema design, coach-to-client data flow, workout builder UI, prescribed-vs-actual comparison
**Confidence:** HIGH

## Summary

Phase 5 adds the core coaching feature: building workouts, saving them as templates, assigning them to client calendars, and comparing prescribed vs actual performance. This is the most architecturally significant phase in v1.3 because it introduces two new database tables, extends the existing `pullCoachData()` mechanism to include workout assignments, and modifies the client-side `Workouts.tsx` screen to render coach-prescribed workouts alongside the existing self-generated template system.

The existing codebase provides strong foundations. The `workoutStore.ts` already has `Exercise`, `ExerciseSet`, and `WorkoutCustomization` types that match what a coach would prescribe. The `Workouts.tsx` screen already handles exercise logging with weight/reps/set completion tracking. The `pullCoachData()` function in `sync.ts` already demonstrates the pattern for pulling coach-authoritative data into client stores. The `MacroEditor` in `Coach.tsx` provides a direct UI precedent for coach editing client data from the dashboard.

The critical architectural decisions are: (1) use two new Supabase tables (`workout_templates` for reusable programs and `assigned_workouts` for date-specific assignments), (2) extend `pullCoachData()` to fetch assigned workouts and inject them into the client's workout flow, (3) store the prescribed workout snapshot alongside the actual logged workout in `workout_logs` for comparison, and (4) follow the existing `useClientDetails` hook pattern for coach-side data access.

**Primary recommendation:** Build workout templates and assignments as server-authoritative data (Supabase tables with RLS). Client pulls assigned workouts via extended `pullCoachData()`. The prescribed workout is stored as a snapshot in the `workout_logs` row so coach comparison works even after the template is edited.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18 | UI framework | Already installed |
| Supabase JS | 2.93.3 | Database client | Already installed |
| Zustand | 4.x | Client state | Already installed |
| Tailwind v4 | 4.x | Styling | Already installed |
| shadcn/ui | Latest | UI primitives | Already installed (Card, Button, Input, Tabs, Select, Badge) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | Latest | Icons | Already installed, use for workout builder icons |
| CVA | Latest | Component variants | Already installed, use for assignment status badges |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSONB exercises column | Normalized exercise_sets table | Normalized adds join complexity for every read. JSONB matches existing `workout_logs.exercises` pattern and the client-side `Exercise[]` type. Use JSONB. |
| React DnD for exercise reordering | Manual array reorder buttons | DnD is a new dependency for minimal UX gain on mobile. The existing exercise editor in `Workouts.tsx` already uses up/down arrow buttons for reordering. Use manual reorder. |
| React Query for coach data | Custom hooks with Map cache | React Query would add a dependency and diverge from the existing `useClientDetails` pattern. Follow existing pattern. |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Current State Analysis

#### 1. Exercise Data Shape (workoutStore.ts)

The existing `Exercise` interface defines the universal exercise shape used throughout the app:

```typescript
// src/stores/workoutStore.ts
export interface Exercise {
  id: string
  name: string
  targetSets: number
  targetReps: string    // e.g., "8-12"
  sets: ExerciseSet[]
  notes?: string
}

export interface ExerciseSet {
  weight: number
  reps: number
  completed: boolean
  skipped?: boolean
}
```

The `CustomExercise` type (used by the workout customizer) is a subset:

```typescript
export interface CustomExercise {
  id: string
  name: string
  targetSets: number
  targetReps: string
}
```

**Key insight:** Coach-prescribed exercises should produce this same `Exercise` shape so that the existing workout logging UI (`ActiveWorkoutView` in `Workouts.tsx`) works without modification. The coach specifies `name`, `targetSets`, `targetReps`, `notes`, and optionally `weight` (target weight). When the client starts the workout, the `ExerciseSet[]` array is generated from `targetSets`.

#### 2. Workout Generation Flow (workoutStore.ts)

When a client starts a workout, the flow is:

```
getTodayWorkout() -> returns { type, name, dayNumber }
startWorkout(type, dayNumber) -> generates Exercise[] via generateExercises()
generateExercises() -> checks customizations first, then falls back to templates
```

The `generateExercises()` function (line 245) already has a priority system:
1. Check `customizations` array for the workout type (user-customized exercises)
2. Use `getTemplateForDay()` based on training days (3/4/5 day templates)
3. Fall back to legacy `WORKOUT_TEMPLATES`

**Coach-prescribed workouts must integrate at priority level 0** (highest). If the coach has assigned a workout for today's date, it should override both customizations and templates.

#### 3. How Coach-Assigned Macros Work (Established Pattern)

Phase 4 established the pattern for coach-to-client data flow. The same pattern applies to workouts:

**Coach side:**
- Coach opens client detail modal in `Coach.tsx`
- `MacroEditor` component lets coach set values
- Coach writes directly to Supabase (`macro_targets` table)
- Uses `set_by: 'coach'` to mark ownership

**Client side:**
- `pullCoachData()` in `sync.ts` runs on app open + visibility change
- Queries Supabase for coach-set data
- Updates local Zustand store if coach data exists
- Toast notification: "Your coach updated your macro targets"

**The workout programming phase follows this exact pattern**, extended to workouts:
- Coach writes to `workout_templates` and `assigned_workouts` tables
- Client's `pullCoachData()` queries `assigned_workouts` for today/upcoming dates
- Assigned workout exercises override the template system
- Toast notification: "Your coach assigned today's workout"

#### 4. Coach Dashboard Structure (Coach.tsx)

The Coach screen currently has:
- Client roster list with search/pagination
- Client detail modal with tabs: Overview, Progress, Activity
- MacroEditor component within Overview tab
- Invite management section

**For workout programming, the coach needs:**
- A workout builder (exercise list editor) -- similar to the existing exercise editor in `Workouts.tsx` lines 506-722
- Template management (save/load/edit templates)
- Assignment flow (pick template -> pick date -> assign to client)
- Prescribed-vs-actual view in the client detail modal

The existing `Coach.tsx` is already 1038 lines. The workout builder should be extracted into separate components to keep the file manageable.

#### 5. workout_logs Table (Supabase)

```sql
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_type workout_type NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  duration_minutes INTEGER,
  exercises JSONB DEFAULT '[]'::jsonb NOT NULL,
  xp_awarded BOOLEAN DEFAULT FALSE NOT NULL
);
```

**Current exercises JSONB stores the actual logged data** (weights, reps, completed status). For prescribed-vs-actual comparison, we need to store the prescription too. Two approaches:

1. **Add `prescribed_exercises` JSONB column to `workout_logs`** -- When client starts a coach-assigned workout, copy the prescribed exercises into this column. The `exercises` column holds actual performance as always. Coach comparison reads both columns.

2. **Reference the `assigned_workouts` row from `workout_logs`** -- Add `assignment_id` FK column. The prescription is stored in the assignment, the actual is in `exercises`.

**Recommendation:** Use approach 2 (FK reference). The assignment row already holds the prescribed exercises, and adding a FK avoids data duplication. The `assignment_id` also serves as the "Assigned by Coach" indicator (non-null = coach-assigned).

#### 6. Sync System (sync.ts)

`pullCoachData()` currently only handles macro targets:

```typescript
export async function pullCoachData() {
  // ... auth checks ...

  // Pull macro targets -- check if coach-set
  const { data: macroData } = await client
    .from('macro_targets')
    .select('protein, calories, carbs, fats, activity_level, set_by, set_by_coach_id')
    .eq('user_id', user.id)
    .single()

  // Update store if coach-set...
}
```

**Extension needed:** Add a second query for assigned workouts. Fetch active assignments for the current user where the date is today or upcoming. Cache the result in a lightweight in-memory structure (not Zustand persist) so the client knows about upcoming assigned workouts.

#### 7. Existing UI Components Available

Components that can be reused directly for the workout builder:
- `Input` -- for exercise name, sets, reps, weight
- `Button` -- save, assign, cancel actions
- `Card` / `CardContent` -- exercise cards, template cards
- `Badge` -- "Assigned by Coach" indicator, template status
- `Select` -- workout type selection
- `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` -- template management tabs
- `Sheet` -- slide-up panels for mobile exercise editor
- `Dialog` -- confirmation dialogs

### Recommended Database Schema

#### Table: `workout_templates`

Coach-created workout templates. The `exercises` JSONB column uses the same shape as the client-side `Exercise` interface (minus the runtime `id` and `sets` arrays).

```sql
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercises JSONB DEFAULT '[]'::jsonb NOT NULL
  -- exercises format: [{ name, targetSets, targetReps, notes?, targetWeight? }]
);

CREATE INDEX idx_workout_templates_coach ON workout_templates(coach_id);

CREATE TRIGGER workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Design decisions:**
- No `workout_type` column. The coach names the template freely ("Monday Push", "Sarah's Leg Day", etc.). The `workout_type` enum is too restrictive for coaching (coaches create custom splits, not just push/pull/legs).
- No `is_active` boolean. Use deletion to remove templates. Keeps queries simple.
- `exercises` JSONB matches the existing pattern in `workout_logs.exercises`.

#### Table: `assigned_workouts`

Links a template (or inline exercises) to a specific client on a specific date.

```sql
CREATE TABLE assigned_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  exercises JSONB NOT NULL,
  -- Snapshot of exercises at assignment time (prevents template edits from changing past assignments)
  -- Format: [{ name, targetSets, targetReps, notes?, targetWeight? }]
  notes TEXT,
  UNIQUE(client_id, date)
  -- One assignment per client per date
);

CREATE INDEX idx_assigned_workouts_client_date ON assigned_workouts(client_id, date DESC);
CREATE INDEX idx_assigned_workouts_coach ON assigned_workouts(coach_id);

CREATE TRIGGER assigned_workouts_updated_at
  BEFORE UPDATE ON assigned_workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Design decisions:**
- `exercises` is a SNAPSHOT, not a live reference. When coach assigns a template to a date, the exercises are copied into this column. If the coach later edits the template, existing assignments are unaffected. This prevents retroactive changes to already-started workouts.
- `template_id` is nullable with `ON DELETE SET NULL`. If a template is deleted, past assignments retain their exercise snapshot.
- `UNIQUE(client_id, date)` -- one assignment per client per day. Coach reassigning overwrites the previous assignment for that date.
- No `status` column. The assignment is either present (workout assigned) or not. Completion is tracked in `workout_logs` via the `assignment_id` FK.

#### Column Addition: `workout_logs.assignment_id`

```sql
ALTER TABLE workout_logs
  ADD COLUMN assignment_id UUID REFERENCES assigned_workouts(id) ON DELETE SET NULL;

CREATE INDEX idx_workout_logs_assignment ON workout_logs(assignment_id)
  WHERE assignment_id IS NOT NULL;
```

This column:
- Links a completed workout to its prescription (for comparison)
- Serves as the "Assigned by Coach" indicator (non-null = coach-assigned)
- Is nullable (self-directed workouts have no assignment)

### RLS Policies for New Tables

#### `workout_templates`

```sql
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- Coaches own their templates
CREATE POLICY "Coaches can manage own templates"
  ON workout_templates FOR ALL
  USING (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  )
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );
```

Note: Clients do NOT need direct access to `workout_templates`. The exercises are snapshotted into `assigned_workouts` at assignment time.

#### `assigned_workouts`

```sql
ALTER TABLE assigned_workouts ENABLE ROW LEVEL SECURITY;

-- Coaches can manage assignments for their clients
CREATE POLICY "Coaches can manage client assignments"
  ON assigned_workouts FOR ALL
  USING (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  )
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- Clients can view their own assignments
CREATE POLICY "Clients can view own assignments"
  ON assigned_workouts FOR SELECT
  USING (client_id = auth.uid());
```

### Recommended Project Structure

```
Phase 5 changes:
supabase/
  migrations/
    006_workout_programming.sql     # NEW: workout_templates, assigned_workouts, assignment_id

src/
  lib/
    database.types.ts               # MODIFY: add workout_templates, assigned_workouts types
    sync.ts                         # MODIFY: extend pullCoachData() for assigned workouts

  hooks/
    useCoachTemplates.ts            # NEW: CRUD for workout_templates (coach-side)
    useAssignedWorkout.ts           # NEW: fetch assigned workout for a date (client-side)

  stores/
    workoutStore.ts                 # MODIFY: add assignedWorkout state, integrate with startWorkout

  screens/
    Workouts.tsx                    # MODIFY: show "Assigned by Coach" indicator, use assigned exercises
    Coach.tsx                       # MODIFY: add workout builder and assignment flow

  components/
    WorkoutBuilder.tsx              # NEW: exercise list editor for coach
    WorkoutAssigner.tsx             # NEW: date picker + template selector for assignment
    PrescribedVsActual.tsx          # NEW: comparison view for coach
    AssignedWorkoutBadge.tsx        # NEW: "Assigned by Coach" badge for client

  lib/
    devSeed.ts                      # MODIFY: add mock templates and assignments
```

### Pattern: Prescribed Workout Snapshot

**What:** When a coach assigns a template to a date, the exercises are COPIED (snapshotted) into the `assigned_workouts.exercises` column. The template is referenced via `template_id` for grouping/management only.

**Why:** Templates evolve over time. If the coach edits "Monday Push" to add a new exercise, that change should NOT retroactively modify workouts that were already assigned and potentially started. The snapshot ensures:
1. Past assignments are stable
2. The prescribed-vs-actual comparison always shows what was originally prescribed
3. Deleting a template does not break historical data

**When to use:** Always. Every assignment creates a snapshot.

### Pattern: Coach-Assigned Workout Override

**What:** When `pullCoachData()` detects an active assignment for today's date, it stores the assigned exercises in a non-persisted state variable. When `startWorkout()` is called, it checks for an assigned workout first, before falling back to customizations and templates.

**Implementation approach:**

```typescript
// In workoutStore.ts - add to state:
assignedWorkout: {
  assignmentId: string
  exercises: Array<{ name: string; targetSets: number; targetReps: string; notes?: string; targetWeight?: number }>
  date: string
  coachNotes?: string
} | null

// In generateExercises() - add priority 0:
if (assignedWorkout && assignedWorkout.date === today) {
  // Use coach-assigned exercises
  return assignedWorkout.exercises.map(...)
}
// Then fall through to existing customizations -> templates -> legacy
```

### Pattern: Prescribed-vs-Actual Comparison

**What:** Coach views a side-by-side comparison of what was prescribed vs what the client actually did.

**Data source:** Query `workout_logs` where `assignment_id` is not null. Join with `assigned_workouts` to get the prescription. The `workout_logs.exercises` JSONB contains the actual logged sets with weights/reps/completed status.

**Display:**
```
Exercise          | Prescribed     | Actual
Squat             | 3 x 8-12      | 3 x 10, 8, 8 @ 225lbs
Incline Press     | 3 x 8-12      | 3 x 12, 10, 9 @ 135lbs
Leg Extension     | 2 x 10-15     | 2 x 15, 12 @ 90lbs
(skipped)         | Lateral Raises | --
(added)           | --             | Face Pulls 2 x 15 @ 30lbs
```

The comparison handles:
- Matching exercises by name (case-insensitive)
- Showing prescribed exercises the client skipped
- Showing exercises the client added that were not prescribed
- Showing actual weight/reps vs prescribed rep range

### Anti-Patterns to Avoid

- **Anti-pattern: Storing coach workout data in a Zustand persisted store.** Coach templates are server-authoritative. Persisting them in localStorage creates stale data. Use `useCoachTemplates` hook with in-memory Map cache, following the `useClientDetails` pattern.

- **Anti-pattern: Modifying the template when a client logs a workout.** The template is the coach's creation. The assignment snapshot is the bridge. Never write back to templates from client activity.

- **Anti-pattern: Adding `workout_type` enum to templates.** The existing enum (`push`, `pull`, `legs`, `upper`, `lower`, `rest`) is too restrictive for coaching. Coaches create custom workout names. Use free-text `name` instead.

- **Anti-pattern: Live-linking assignments to templates (no snapshot).** If template edits propagate to existing assignments, a client could start a workout that changes mid-session. Snapshot at assignment time.

- **Anti-pattern: Client writing to `assigned_workouts` table.** Assignments are coach-owned, server-authoritative. The client has SELECT-only access. Client performance data goes in `workout_logs` as always, linked via `assignment_id`.

- **Anti-pattern: Importing workout builder components into the barrel exports.** Coach-specific components (WorkoutBuilder, WorkoutAssigner, PrescribedVsActual) should only be imported from within the lazy-loaded Coach route tree to preserve code splitting.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exercise reordering | Drag-and-drop library | Up/down arrow buttons (existing pattern in Workouts.tsx) | Mobile touch DnD is complex, existing pattern works, no new dependency |
| Date picker for assignment | Custom calendar component | Native `<input type="date">` styled with shadcn Input | Native date input works on all mobile browsers, zero bundle cost |
| Exercise search/autocomplete | Custom typeahead | Simple text input with existing exercise name suggestions | Single coach, small exercise library. Autocomplete is premature. Coach types exercise names. |
| Template duplication | Custom copy logic | SQL: `INSERT INTO workout_templates (coach_id, name, exercises) SELECT coach_id, name || ' (copy)', exercises FROM workout_templates WHERE id = $1` | Single Supabase call, no client-side serialization |

**Key insight:** The workout builder is fundamentally an array editor (add/remove/reorder items in a list). The existing exercise customizer in `Workouts.tsx` (lines 506-722) IS this exact pattern. The coach workout builder reuses the same UX, just targeting a different data store (Supabase instead of Zustand).

## Common Pitfalls

### Pitfall 1: Template Edit Propagation to Past Assignments
**What goes wrong:** Coach edits a template. All previously assigned workouts using that template retroactively change.
**Why it happens:** Using a live FK reference instead of snapshotting exercises at assignment time.
**How to avoid:** Copy exercises into `assigned_workouts.exercises` at assignment time. The `template_id` is for management only (grouping, "re-assign this template"), not for exercise resolution.
**Warning signs:** Client starts a workout and sees different exercises than what was on their calendar yesterday.

### Pitfall 2: Stale Assigned Workout on Client
**What goes wrong:** Coach assigns a workout, but the client does not see it until they force-close and reopen the app.
**Why it happens:** `pullCoachData()` only runs on login and visibility change (30s+ away).
**How to avoid:** `pullCoachData()` already runs on app open and visibility change. For workouts, this is sufficient -- the coach typically assigns workouts hours or days before the client needs them. If immediacy is needed, add a "Refresh" button.
**Warning signs:** Coach assigns a workout and immediately asks client to check -- client does not see it yet.

### Pitfall 3: Conflict Between Coach-Assigned and Self-Directed Workout
**What goes wrong:** Client has a coach-assigned workout for today but also wants to do their own workout. The system forces the assigned workout.
**How to avoid:** Show the assigned workout as the primary option with "Assigned by Coach" badge, but allow the client to start a self-directed workout instead ("Do your own workout" fallback button). Self-directed workouts have `assignment_id = NULL`.
**Warning signs:** Client feels locked out of their own workout choice.

### Pitfall 4: Duplicate Assignment Upsert Race Condition
**What goes wrong:** Coach assigns two different templates to the same client on the same date. The second overwrites the first without warning.
**Why it happens:** `UNIQUE(client_id, date)` constraint means only one assignment per date.
**How to avoid:** When assigning to a date that already has an assignment, show a confirmation dialog: "This client already has a workout assigned for [date]. Replace it?" This is correct behavior -- one workout per day is the design constraint.
**Warning signs:** Coach loses a previously assigned workout without realizing it was overwritten.

### Pitfall 5: Large exercises JSONB Causing Performance Issues
**What goes wrong:** Coach creates templates with many exercises (20+) and assigns them widely. The JSONB column in `assigned_workouts` becomes large.
**Why it happens:** Each assignment stores a full copy of exercises.
**How to avoid:** Not a real concern for this use case. A workout with 10 exercises, each with name + targetSets + targetReps + notes, is approximately 2-3 KB of JSON. Even 1000 assignments is only 2-3 MB. PostgreSQL handles this easily.
**Warning signs:** None expected. This is not a real risk.

### Pitfall 6: workout_type Enum Mismatch
**What goes wrong:** Coach-assigned workouts don't fit into the existing `workout_type` enum (`push`, `pull`, `legs`, `upper`, `lower`, `rest`). The coach's workout might be "Full Body", "Arms", "Cardio + Core", etc.
**Why it happens:** The existing enum was designed for the 3/4/5-day template system, not freeform coaching.
**How to avoid:** For coach-assigned workouts, use a generic type (e.g., `push` as default) or add the `workout_type` to the assignment. The `workout_type` is mainly used for display (emoji) and template selection. For coach-assigned workouts, the assignment name replaces the type display. Alternatively, the `workout_type` column could accept `NULL` for coach-assigned workouts, but this requires schema change. Simplest: use `push` as a fallback type for coach-assigned workouts and display the assignment template name instead.
**Warning signs:** Coach sees wrong emoji next to their custom workout name.

## Code Examples

### Example 1: SQL Migration (006_workout_programming.sql)

```sql
-- Migration: Workout Programming Schema
-- Adds workout_templates, assigned_workouts tables and assignment_id to workout_logs

-- ===========================================
-- 1. Workout Templates (coach-created)
-- ===========================================

CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercises JSONB DEFAULT '[]'::jsonb NOT NULL
);

CREATE INDEX idx_workout_templates_coach ON workout_templates(coach_id);

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own templates"
  ON workout_templates FOR ALL
  USING (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  )
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

CREATE TRIGGER workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- 2. Assigned Workouts (coach assigns to client on a date)
-- ===========================================

CREATE TABLE assigned_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  exercises JSONB NOT NULL,
  notes TEXT,
  UNIQUE(client_id, date)
);

CREATE INDEX idx_assigned_workouts_client_date ON assigned_workouts(client_id, date DESC);
CREATE INDEX idx_assigned_workouts_coach ON assigned_workouts(coach_id);

ALTER TABLE assigned_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage client assignments"
  ON assigned_workouts FOR ALL
  USING (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = assigned_workouts.client_id
      AND coach_clients.status = 'active'
    )
  )
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = assigned_workouts.client_id
      AND coach_clients.status = 'active'
    )
  );

CREATE POLICY "Clients can view own assignments"
  ON assigned_workouts FOR SELECT
  USING (client_id = auth.uid());

CREATE TRIGGER assigned_workouts_updated_at
  BEFORE UPDATE ON assigned_workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- 3. Link workout_logs to assignments
-- ===========================================

ALTER TABLE workout_logs
  ADD COLUMN assignment_id UUID REFERENCES assigned_workouts(id) ON DELETE SET NULL;

CREATE INDEX idx_workout_logs_assignment ON workout_logs(assignment_id)
  WHERE assignment_id IS NOT NULL;
```

### Example 2: Extended pullCoachData() in sync.ts

```typescript
export async function pullCoachData() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // --- Existing: Pull macro targets ---
  // (unchanged from current implementation)

  // --- NEW: Pull assigned workouts for today and upcoming ---
  const today = new Date().toISOString().split('T')[0]
  const { data: assignments } = await client
    .from('assigned_workouts')
    .select('id, date, exercises, notes, template_id')
    .eq('client_id', user.id)
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(7) // Next 7 days max

  if (assignments && assignments.length > 0) {
    const todayAssignment = assignments.find(a => a.date === today)
    if (todayAssignment) {
      // Store in workoutStore for today's workout
      useWorkoutStore.getState().setAssignedWorkout({
        assignmentId: todayAssignment.id,
        exercises: todayAssignment.exercises,
        date: todayAssignment.date,
        coachNotes: todayAssignment.notes || undefined,
      })
    }
    // Optionally cache upcoming assignments for week view
  }

  return { error: null }
}
```

### Example 3: WorkoutBuilder Component

```typescript
// src/components/WorkoutBuilder.tsx
interface PrescribedExercise {
  name: string
  targetSets: number
  targetReps: string
  notes?: string
  targetWeight?: number
}

interface WorkoutBuilderProps {
  exercises: PrescribedExercise[]
  onChange: (exercises: PrescribedExercise[]) => void
  templateName: string
  onNameChange: (name: string) => void
}

export function WorkoutBuilder({ exercises, onChange, templateName, onNameChange }: WorkoutBuilderProps) {
  // Reuses the same UX pattern as the exercise editor in Workouts.tsx
  // - List of exercises with name, sets, reps, notes
  // - Add exercise form at bottom
  // - Up/down reorder buttons
  // - Delete button per exercise
  // - Template name input at top
}
```

### Example 4: Prescribed vs Actual View

```typescript
// src/components/PrescribedVsActual.tsx
interface PrescribedVsActualProps {
  prescribed: PrescribedExercise[]
  actual: Exercise[]
}

export function PrescribedVsActual({ prescribed, actual }: PrescribedVsActualProps) {
  // Match exercises by name (case-insensitive)
  // Show: prescribed target | actual sets/reps/weight
  // Highlight: exercises completed, skipped, or added
}
```

### Example 5: useCoachTemplates Hook

```typescript
// src/hooks/useCoachTemplates.ts
// Follows useClientDetails pattern: Map-based cache, direct Supabase queries

const templateCache = new Map<string, { data: WorkoutTemplate[]; fetchedAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useCoachTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchTemplates = useCallback(async () => {
    // Check cache first
    // Query workout_templates WHERE coach_id = auth.uid()
    // Update cache and state
  }, [])

  const createTemplate = useCallback(async (name: string, exercises: PrescribedExercise[]) => {
    // INSERT into workout_templates
    // Invalidate cache
    // Refresh list
  }, [])

  const updateTemplate = useCallback(async (id: string, updates: Partial<WorkoutTemplate>) => {
    // UPDATE workout_templates SET ... WHERE id = $1
    // Invalidate cache
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    // DELETE FROM workout_templates WHERE id = $1
    // Invalidate cache
  }, [])

  const assignTemplate = useCallback(async (
    templateId: string,
    clientId: string,
    date: string,
    exercises: PrescribedExercise[],
    notes?: string
  ) => {
    // UPSERT into assigned_workouts (onConflict: client_id, date)
    // exercises = snapshot from template
  }, [])

  return { templates, isLoading, fetchTemplates, createTemplate, updateTemplate, deleteTemplate, assignTemplate }
}
```

### Example 6: Client Workouts.tsx Integration

```typescript
// In Workouts.tsx, modify the "Today" section:

const assignedWorkout = useWorkoutStore(state => state.assignedWorkout)
const today = new Date().toISOString().split('T')[0]
const hasAssignment = assignedWorkout && assignedWorkout.date === today

// In the Today card:
{hasAssignment && (
  <div className="flex items-center gap-1.5 mb-2">
    <ShieldCheck size={14} className="text-primary" />
    <span className="text-xs text-primary font-medium">
      Assigned by {LABELS.coach}
    </span>
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client generates workout from hardcoded templates | Coach assigns specific workout for specific date | Phase 5 | Coach controls programming |
| No prescribed vs actual | Assignment snapshot enables comparison | Phase 5 | Coach can evaluate adherence |
| Workouts are always self-directed | `assignment_id` distinguishes coach-assigned from self-directed | Phase 5 | Data ownership is explicit |

## Open Questions

1. **Should the coach be able to assign a workout without a template (inline/one-off)?**
   - What we know: Templates are reusable. But sometimes a coach wants to assign a custom workout for a specific client on a specific day without saving it as a template.
   - Recommendation: YES. The `assigned_workouts` table has `template_id` as nullable. If the coach builds an inline workout, `template_id` is null and `exercises` contains the exercises directly. The coach can optionally save it as a template afterward. This avoids forcing the coach through a two-step flow (create template, then assign).

2. **Should the client be able to modify a coach-assigned workout during the session?**
   - What we know: The existing `Workouts.tsx` lets users add exercises to an active workout and skip sets. These capabilities should remain for coach-assigned workouts.
   - Recommendation: YES. The client can add exercises, skip sets, and log different weights/reps than prescribed. The comparison view shows the deviation. This matches how Hevy Coach and TrueCoach work -- the prescription is a guide, not a lock.

3. **How should multi-day assignment work from the coach UI?**
   - What we know: PROG-03 says "assign a saved template to a client on a specific date." This is singular.
   - Recommendation: Start with single-date assignment. The coach picks a template, picks a client, picks a date, and assigns. For recurring assignments (e.g., "this template every Monday"), the coach assigns to multiple dates manually. Multi-week program builder is explicitly deferred to v2 (PROG-07).

4. **Should `pullCoachData()` fetch a week of assignments or just today?**
   - What we know: The Workouts.tsx "This Week" section shows a 7-day overview. If the coach has assigned workouts for the week, the client should see them in this view.
   - Recommendation: Fetch up to 7 days of assignments (today + 6 days ahead). Display assigned days with a coach badge in the week overview. This provides forward visibility without over-fetching.

5. **How does the `workout_type` enum interact with coach-assigned workouts?**
   - What we know: The existing `workout_logs` table requires a `workout_type` enum value. Coach workouts may not fit neatly into `push`, `pull`, `legs`, `upper`, `lower`.
   - Recommendation: For coach-assigned workouts, use a sensible default (`push` as the fallback type in `workout_logs`). The display uses the template name, not the type. The `workout_type` column in `workout_logs` becomes less meaningful for coach-assigned workouts. An alternative is to add 'custom' to the enum, but this requires a schema migration that changes the enum -- more disruptive. Simplest: use `push` as default, override display with assignment name.

## Sources

### Primary (HIGH confidence)
- Direct analysis of `src/stores/workoutStore.ts` -- `Exercise`, `ExerciseSet`, `CustomExercise`, `WorkoutCustomization` types, `generateExercises()` flow, template system (3/4/5 day splits)
- Direct analysis of `src/screens/Workouts.tsx` -- `ActiveWorkoutView`, exercise editor UI, set logging, workout completion, exercise history
- Direct analysis of `src/screens/Coach.tsx` -- `MacroEditor` component (established pattern for coach editing client data), client detail modal structure, tab navigation
- Direct analysis of `src/lib/sync.ts` -- `pullCoachData()`, `pushClientData()`, `scheduleSync()`, directional sync architecture
- Direct analysis of `src/lib/database.types.ts` -- existing table types, enum types, JSONB patterns
- Direct analysis of `supabase/schema.sql` -- full schema, RLS policies, indexes, triggers, `update_updated_at()` function
- Direct analysis of `src/hooks/useClientDetails.ts` -- Map-based cache pattern, concurrent data fetching, cache TTL
- Direct analysis of `src/hooks/useClientRoster.ts` -- pagination, search debouncing, dev bypass
- Direct analysis of `src/lib/devSeed.ts` -- mock data patterns for dev bypass mode
- `.planning/research/ARCHITECTURE.md` -- schema design recommendations, anti-patterns, data flow patterns
- `.planning/research/FEATURES.md` -- competitor analysis (TrueCoach, Hevy Coach, TrainHeroic), workout programming sub-features
- `.planning/phases/01-coach-foundation/01-RESEARCH.md` -- data ownership model, directional sync pattern

### Secondary (MEDIUM confidence)
- `.planning/research/FEATURES.md` competitive analysis for workout programming UX patterns (TrueCoach, Hevy Coach, TrainHeroic)
- Prior milestone research on server-first vs sync-first for prescribed workouts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing packages
- Architecture: HIGH -- extends established patterns (pullCoachData, useClientDetails hook, MacroEditor precedent)
- Schema design: HIGH -- follows existing JSONB pattern from workout_logs, existing RLS patterns, existing migration conventions
- Pitfalls: HIGH -- identified from actual codebase analysis and prior phase learnings
- Client integration: MEDIUM -- the exact UI for "Assigned by Coach" indicator needs design decisions during planning, but the data flow is well-understood

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable -- all findings based on codebase analysis, not external APIs)
