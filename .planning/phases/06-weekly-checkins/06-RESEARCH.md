# Phase 6: Weekly Check-ins - Research

**Researched:** 2026-02-07
**Domain:** Supabase schema design, React multi-field form, coach-client communication, data ownership
**Confidence:** HIGH

## Summary

Phase 6 adds structured weekly check-ins where clients submit a 16-field form, app-tracked data is auto-included, the coach reviews and responds, and the client can read the response. This is the final phase in the v1.3 Coach Dashboard milestone.

The weekly check-in is conceptually different from the existing "Daily Report" (CheckInModal.tsx) which is a gamification XP-earning mechanism. The weekly check-in is a **coach communication tool** -- a structured health/lifestyle questionnaire that feeds the coaching relationship.

The architecture follows the established data ownership model: check-ins are **client-owned** (client creates and submits), but coach responses are **coach-owned** (coach writes, client reads). Both live in a single `weekly_checkins` table with a `coach_response` column, or alternatively in two tables. The single-table approach is simpler and matches the existing pattern (like `macro_targets` having both client and coach columns).

**Primary recommendation:** Single `weekly_checkins` table with both client fields and coach response fields. Client has INSERT+SELECT, coach has SELECT+UPDATE (for response only). Follow the established patterns: migration file, database.types.ts update, hook with Map cache + TTL, devSeed mock data, pullCoachData extension for the client to read responses, and direct file imports (not barrel).

## Standard Stack

The established libraries/tools for this domain -- **all already in the project**:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | UI components (form, review modal) | Already used everywhere |
| Zustand | 4.x | Client-side state (check-in form draft) | Project state management |
| Supabase JS | 2.x | Database queries, RLS enforcement | Project backend |
| TypeScript | 5.x | Type safety for check-in schema | Project language |
| Tailwind CSS | 3.x | Styling, existing design tokens | Project styling |
| Lucide React | latest | Icons (ClipboardCheck, MessageSquare, etc.) | Project icon library |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui components | latest | Input, Textarea, Select, Card, Button, Label | Form fields |
| radix-ui | latest | Select primitive for dropdown fields | Scale selectors (1-5, etc.) |

### No New Dependencies Needed
This phase requires zero new npm packages. Everything needed is already installed:
- `Textarea` component exists at `src/components/ui/textarea.tsx`
- `Select` component exists at `src/components/ui/select.tsx`
- `Label` component exists at `src/components/ui/label.tsx`
- `Input` component exists at `src/components/ui/input.tsx`
- `Card/CardContent` exists at `src/components/ui/card.tsx`

## Architecture Patterns

### Data Ownership Model
This is the critical architectural decision. Check-ins cross the data ownership boundary:

**Client-owned operations:**
- Client fills out and submits the check-in form (INSERT)
- Client reads their own check-ins and coach responses (SELECT)

**Coach-owned operations:**
- Coach reads any client's check-ins (SELECT)
- Coach writes response/notes to a check-in (UPDATE coach_response fields only)

**Precedent:** This mirrors `macro_targets` where both client and coach interact with the same row. The `assigned_workouts` pattern is also relevant (coach creates, client reads + logs against).

### Recommended Database Schema

```sql
-- Migration 007: Weekly Check-ins

CREATE TYPE checkin_status AS ENUM ('submitted', 'reviewed');

CREATE TABLE weekly_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ownership
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Metadata
  week_of DATE NOT NULL, -- The Monday of the check-in week
  status checkin_status DEFAULT 'submitted' NOT NULL,

  -- =====================
  -- Client-submitted fields (16 fields per CHECK-01)
  -- =====================
  water_intake TEXT,              -- e.g. "1 gallon daily" or scale
  caffeine_intake TEXT,           -- e.g. "2 cups coffee"
  hunger_level INTEGER CHECK (hunger_level BETWEEN 1 AND 5),
  slip_ups TEXT,                  -- free text: any dietary slip-ups
  refeed_date DATE,              -- last refeed/diet break date
  digestion TEXT,                 -- free text: digestion notes
  training_progress TEXT,         -- free text: strength/progress notes
  training_feedback TEXT,         -- free text: how training felt
  recovery_soreness TEXT,         -- free text: recovery status
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  sleep_hours DECIMAL(3,1),      -- e.g. 7.5
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  stressors TEXT,                -- free text: what's causing stress
  mental_health TEXT,            -- free text: mood, anxiety, etc.
  injuries TEXT,                 -- free text: injury status
  cycle_status TEXT,             -- free text: menstrual cycle (optional)
  side_effects TEXT,             -- free text: supplement/medication side effects
  bloodwork_date DATE,           -- last bloodwork date
  open_feedback TEXT,            -- free text: anything else

  -- =====================
  -- Auto-populated app data (CHECK-02)
  -- =====================
  auto_weight_current DECIMAL(5,1),  -- latest weight
  auto_weight_weekly_avg DECIMAL(5,1), -- 7-day average
  auto_weight_change DECIMAL(4,1),    -- change from prior week
  auto_step_avg INTEGER,              -- avg daily steps (if tracked)
  auto_macro_hit_rate INTEGER,        -- % days hitting protein+cal targets
  auto_cardio_sessions INTEGER,       -- cardio workouts logged this week
  auto_workouts_completed INTEGER,    -- total workouts this week

  -- =====================
  -- Coach response (CHECK-04, CHECK-05)
  -- =====================
  coach_response TEXT,
  reviewed_at TIMESTAMPTZ,

  -- Prevent duplicate check-ins for same week
  UNIQUE(client_id, week_of)
);

-- Indexes
CREATE INDEX idx_weekly_checkins_client ON weekly_checkins(client_id, week_of DESC);
CREATE INDEX idx_weekly_checkins_coach_pending ON weekly_checkins(coach_id, status, created_at)
  WHERE status = 'submitted';

-- RLS
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

-- Client can insert their own check-ins
CREATE POLICY "Clients can insert own check-ins"
  ON weekly_checkins FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- Client can view their own check-ins (including coach response)
CREATE POLICY "Clients can view own check-ins"
  ON weekly_checkins FOR SELECT
  USING (client_id = auth.uid());

-- Coach can view their clients' check-ins
CREATE POLICY "Coaches can view client check-ins"
  ON weekly_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = weekly_checkins.client_id
      AND coach_clients.status = 'active'
    )
  );

-- Coach can update check-ins (to add response)
CREATE POLICY "Coaches can respond to client check-ins"
  ON weekly_checkins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = weekly_checkins.client_id
      AND coach_clients.status = 'active'
    )
  );

-- Trigger
CREATE TRIGGER weekly_checkins_updated_at
  BEFORE UPDATE ON weekly_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Recommended Project Structure

New files to create:
```
src/
├── screens/
│   └── WeeklyCheckIn.tsx          # Client check-in form (standalone screen, not modal)
├── hooks/
│   └── useWeeklyCheckins.ts       # Hook for both client + coach queries
├── lib/
│   └── database.types.ts          # Add WeeklyCheckin type
│   └── devSeed.ts                 # Add mock check-in data
│   └── sync.ts                    # Extend pullCoachData for check-in responses
supabase/
└── migrations/
    └── 007_weekly_checkins.sql    # Schema migration
```

Files to modify:
```
src/
├── screens/
│   ├── Home.tsx                   # Add weekly check-in prompt banner
│   └── Coach.tsx                  # Add "Check-ins" tab or section
├── App.tsx                        # Add /checkin route
├── components/
│   └── Navigation.tsx             # Potentially add check-in nav item (or just use Home banner)
├── lib/
│   └── database.types.ts          # WeeklyCheckin interface
│   └── sync.ts                    # pullCoachData extension
│   └── devSeed.ts                 # Mock data
├── design/
│   └── constants.ts               # Add LABELS for weekly check-in
```

### Pattern: Multi-Section Form with Sections
**What:** The 16-field check-in form should be organized into collapsible or tabbed sections to avoid overwhelming the user.
**When to use:** When a form has 10+ fields across different domains.
**Recommended sections:**
1. **Nutrition** (water, caffeine, hunger, slip-ups, refeed, digestion)
2. **Training** (progress, feedback, recovery/soreness)
3. **Lifestyle** (sleep quality/hours, stress/stressors, mental health)
4. **Health** (injuries, cycle status, side effects, bloodwork date)
5. **Open Feedback** (free text)

### Pattern: Auto-Populated Data
**What:** App-tracked metrics are computed at submission time and stored as snapshot columns.
**Why snapshot, not live:** The coach needs to see what the data was at check-in time, not what it is now. If the client logs more weight entries after submitting, the check-in data should not change.
**How to compute:**
```typescript
// At submission time, compute from local stores:
const autoData = {
  auto_weight_current: getLatestWeight(),
  auto_weight_weekly_avg: getWeeklyWeightAverage(),
  auto_weight_change: getWeightChange(),
  auto_step_avg: null, // App doesn't track steps currently
  auto_macro_hit_rate: getMacroHitRate(7), // last 7 days
  auto_cardio_sessions: getCardioCount(7),
  auto_workouts_completed: getWorkoutsCompleted(7),
}
```

### Pattern: Check-in Due Detection (CHECK-06)
**What:** Surface a prominent banner on the Home screen when a weekly check-in is due.
**Logic:**
1. Determine the current week's Monday
2. Query whether a check-in exists for this week (SELECT from weekly_checkins WHERE week_of = currentMonday)
3. If no check-in exists for current week, show the banner
4. The check should be local-first: store last check-in date in userStore or a lightweight local flag

**Home screen integration:** Follow the existing pattern of the "Daily Report Pending" banner (prominent Card with border-l-[3px], icon, CTA) but with a different color/icon to differentiate from daily check-in.

### Pattern: Coach Pending Check-ins List (CHECK-03)
**What:** Coach sees a list of check-ins awaiting review.
**Implementation options:**
1. **New dashboard tab** -- Add "Check-ins" alongside "Clients" and "Templates" in the Coach.tsx view toggle
2. **In-client modal tab** -- Add "Check-ins" tab to the client detail modal alongside "overview", "progress", "activity", "programs"

**Recommendation:** Both. The dashboard-level view shows ALL pending check-ins across all clients (sorted by submission date). The client detail modal shows that specific client's check-in history. This is the most useful for coaches managing multiple clients.

### Pattern: Coach Review Flow (CHECK-04)
**What:** Coach reads the full check-in and adds a response.
**Implementation:**
- Click a pending check-in to open a review modal/view
- Show all 16 client-submitted fields grouped by section
- Show the auto-populated app data in a summary card
- Textarea for coach response
- "Submit Review" button that updates status to 'reviewed' and saves coach_response
- After review, the check-in moves from "pending" to "reviewed"

### Anti-Patterns to Avoid
- **Don't build the check-in as a modal:** 16 fields is too much for a modal. Use a full-screen page at `/checkin`.
- **Don't store auto-populated data only on the client:** It must be in the database row so the coach can see it.
- **Don't use a JSONB blob for check-in fields:** Individual columns are queryable, type-safe, and easier to evolve.
- **Don't compute auto-data on the coach side:** The coach may not have access to all raw data. Snapshot at submission.
- **Don't make all 16 fields required:** Many are optional depending on the client's situation (cycle status, bloodwork, etc.).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state management | Custom reducer | React useState with section objects | Simple enough; 16 fields don't warrant a form library |
| Scale selectors (1-5) | Custom slider | Existing shadcn Select or button group | Consistent with design system |
| Date pickers | Custom calendar | Native `<input type="date">` | Already used in WorkoutAssigner for date selection |
| Week calculation | Manual date math | `getLocalDateString` from dateUtils.ts | Already used across the app |
| Toast notifications | Custom alerts | Existing `toast` from toastStore | Project standard |
| Loading states | Custom spinners | Existing loading patterns ("..." + text) | Consistent with Coach.tsx patterns |
| Error handling | Custom error UI | `friendlyError()` from errors.ts + `captureError()` from sentry.ts | Project standard |
| Cache management | Custom cache | Map + TTL pattern from useClientDetails/useCoachTemplates | Proven pattern |

## Common Pitfalls

### Pitfall 1: Confusing Daily Check-in with Weekly Check-in
**What goes wrong:** The app already has a "Daily Report" (CheckInModal.tsx) which is the gamification XP check-in. The weekly check-in is a completely separate feature.
**Why it happens:** Both use the word "check-in" and both surface on the Home screen.
**How to avoid:** Use distinct naming. The daily one is "Daily Report" (LABELS.checkIn). The weekly one should be "Weekly Check-in" or similar. Different icons (Sparkles for daily, ClipboardCheck for weekly). Different colors (primary for daily, secondary or a new accent for weekly).
**Warning signs:** If code imports from CheckInModal when building weekly check-in, something is wrong.

### Pitfall 2: Step Count Data Not Available
**What goes wrong:** CHECK-02 mentions "step count" as auto-populated data, but the app does not currently track steps. There is no step counter, Health API integration, or step-related store.
**Why it happens:** The requirement assumes step tracking exists or will be added.
**How to avoid:** The `auto_step_avg` column should be nullable and left as NULL. The UI should show "Not tracked" when null. Do NOT add a step tracking feature in this phase -- it's out of scope.
**Warning signs:** If someone tries to import HealthKit or add step tracking, that's scope creep.

### Pitfall 3: Timezone Issues with Week Detection
**What goes wrong:** Using `new Date()` without timezone awareness causes the "is check-in due?" detection to show the wrong week.
**Why it happens:** The app stores dates as YYYY-MM-DD strings (date-only), but week boundaries depend on the user's local timezone.
**How to avoid:** Use `getLocalDateString()` from `@/lib/dateUtils.ts` for all date comparisons. Calculate the current week's Monday in local time. This was a known issue fixed in Phase 1 of v1.2.
**Warning signs:** Test by running the app at 11:55 PM -- does it show the correct week?

### Pitfall 4: Coach Response Not Reaching Client
**What goes wrong:** Client submits check-in, coach responds, but client never sees the response because pullCoachData doesn't pull check-in responses.
**Why it happens:** Forgetting to extend pullCoachData in sync.ts.
**How to avoid:** Add check-in response pulling to pullCoachData. When client opens app, pull latest check-in responses. Store the "reviewed" status and coach_response locally so the client can see it without being online.
**Warning signs:** Client's check-in always shows as "Submitted" even after coach reviews it.

### Pitfall 5: Overly Long Coach Review UI
**What goes wrong:** Showing all 16 fields + auto data + response textarea in the coach review makes it impossibly long and tedious.
**Why it happens:** Literally dumping all fields as a vertical list.
**How to avoid:** Group fields into collapsible sections. Show auto-data in a compact summary card at the top. Only expand sections that have content (skip fields the client left blank). Consider a two-column layout on wider screens (but Coach.tsx modal is max-w-md, so probably just compact sections).

### Pitfall 6: No Way to Tell When Check-in is "Due"
**What goes wrong:** Client doesn't know when to submit their weekly check-in, so they either submit too early, too late, or not at all.
**Why it happens:** No clear "due date" logic.
**How to avoid:** Define a simple rule: check-in is due when the current week doesn't have one submitted. The banner appears on the Home screen starting Monday (or a configurable day). The check-in covers the previous week's data. For v1, simply show "Weekly Check-in Due" if no check-in exists for the current `week_of`.

## Code Examples

### Computing Auto-Populated Data (at submission time)
```typescript
// Source: Derived from existing store patterns
function computeAutoData(): CheckInAutoData {
  const userStore = useUserStore.getState()
  const macroStore = useMacroStore.getState()
  const workoutStore = useWorkoutStore.getState()

  const weightHistory = userStore.weightHistory
  const today = getLocalDateString()

  // Latest weight
  const latestWeight = weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].weight
    : null

  // 7-day average
  const sevenDaysAgo = /* compute 7 days ago */
  const recentWeights = weightHistory.filter(w => w.date >= sevenDaysAgo)
  const weeklyAvg = recentWeights.length > 0
    ? recentWeights.reduce((sum, w) => sum + w.weight, 0) / recentWeights.length
    : null

  // Weight change (current week avg vs prior week avg)
  // ... similar calculation

  // Macro hit rate (% of last 7 days hitting protein + calorie targets)
  const dailyLogs = macroStore.dailyLogs
  const targets = macroStore.targets
  // ... compute hit rate

  // Workouts completed this week
  const workoutLogs = workoutStore.workoutLogs
  const weekWorkouts = workoutLogs.filter(
    w => w.completed && w.date >= sevenDaysAgo
  )

  return {
    auto_weight_current: latestWeight,
    auto_weight_weekly_avg: weeklyAvg ? Math.round(weeklyAvg * 10) / 10 : null,
    auto_weight_change: /* computed */,
    auto_step_avg: null, // Not tracked
    auto_macro_hit_rate: /* computed */,
    auto_cardio_sessions: null, // Workouts don't distinguish cardio currently
    auto_workouts_completed: weekWorkouts.length,
  }
}
```

### Client Check-in Submission
```typescript
// Source: Follows existing patterns from useCoachTemplates
async function submitCheckin(formData: CheckInFormData): Promise<{ error: string | null }> {
  if (devBypass) {
    // Mock submission
    return { error: null }
  }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Compute auto-populated data
  const autoData = computeAutoData()

  // Determine coach_id from coach_clients
  const { data: relationship } = await client
    .from('coach_clients')
    .select('coach_id')
    .eq('client_id', user.id)
    .eq('status', 'active')
    .single()

  const { error } = await client
    .from('weekly_checkins')
    .upsert({
      client_id: user.id,
      coach_id: relationship?.coach_id || null,
      week_of: getCurrentMonday(),
      ...formData,
      ...autoData,
    }, {
      onConflict: 'client_id,week_of'
    })

  return { error: error?.message || null }
}
```

### Coach Pending Check-ins Query
```typescript
// Source: Follows useClientRoster pattern
async function fetchPendingCheckins(): Promise<PendingCheckin[]> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('weekly_checkins')
    .select(`
      id,
      client_id,
      week_of,
      created_at,
      status,
      profiles!weekly_checkins_client_id_fkey(username, email)
    `)
    .eq('status', 'submitted')
    .order('created_at', { ascending: true }) // Oldest first

  if (error) throw error
  return data || []
}
```

### Coach Review Submission
```typescript
// Source: Follows MacroEditor save pattern
async function submitReview(
  checkinId: string,
  coachResponse: string
): Promise<{ error: string | null }> {
  const client = getSupabaseClient()

  const { error } = await client
    .from('weekly_checkins')
    .update({
      coach_response: coachResponse,
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', checkinId)

  return { error: error?.message || null }
}
```

### pullCoachData Extension for Client
```typescript
// In sync.ts pullCoachData(), add:
// --- Pull latest check-in response ---
const { data: latestCheckin } = await client
  .from('weekly_checkins')
  .select('id, week_of, status, coach_response, reviewed_at')
  .eq('client_id', user.id)
  .order('week_of', { ascending: false })
  .limit(1)
  .single()

if (latestCheckin && latestCheckin.status === 'reviewed') {
  // Store in a lightweight Zustand store or local state
  // so client can show "Coach reviewed your check-in"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single sync function | Directional push/pull | Phase 1 v1.3 | Check-in responses use pullCoachData |
| Global data loading | Per-hook caching with TTL | Phase 3 v1.3 | Check-in hook follows same pattern |
| All coach UI in one file | Coach.tsx with tabs + hooks | Phase 3-5 v1.3 | Check-in adds new tab/section |

**Important distinctions in existing codebase:**
- "Daily Report" / `CheckInModal` = gamification XP check-in (daily, local-only, updates streak)
- "Weekly Check-in" = coach communication tool (weekly, server-stored, involves both parties)
- These are completely separate features with no code sharing

## Open Questions

1. **Cardio vs workout distinction**
   - What we know: Workout logs have a `workout_type` field (push/pull/legs/upper/lower) but no "cardio" type
   - What's unclear: Does the auto-populated `auto_cardio_sessions` mean something specific, or is it just total workouts?
   - Recommendation: Use `auto_workouts_completed` (total completed workouts this week). Set `auto_cardio_sessions` to NULL since the app doesn't distinguish cardio. If the user wants to report cardio, they can mention it in `training_feedback` free text.

2. **Step count source**
   - What we know: The app has no step tracking feature, no Health API integration
   - What's unclear: Whether step count should be added in this phase or deferred
   - Recommendation: Defer. Set `auto_step_avg` to NULL and show "Not tracked" in the UI. Step tracking is a separate feature.

3. **Check-in frequency enforcement**
   - What we know: The schema has UNIQUE(client_id, week_of) preventing duplicates per week
   - What's unclear: Should clients be able to edit a submitted check-in? Or is it one-shot?
   - Recommendation: Allow re-submission (upsert) before coach reviews. Once reviewed, lock it. This is friendlier for clients who realize they forgot something.

4. **When to show the weekly prompt**
   - What we know: CHECK-06 says "surfaced prominently when due"
   - What's unclear: Which day of the week triggers "due"? All week? Only after a certain day?
   - Recommendation: Show the prompt all week if no check-in has been submitted for the current week. The prompt appears on Monday and stays until submitted. Simple, no day-of-week configuration needed for v1.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `supabase/schema.sql` -- existing table patterns, RLS policies, ENUM types
- Codebase analysis: `src/screens/Coach.tsx` -- coach dashboard structure (tabs, modal, detail views)
- Codebase analysis: `src/screens/CheckInModal.tsx` -- existing daily check-in (what NOT to confuse with)
- Codebase analysis: `src/screens/Home.tsx` -- existing banner/prompt patterns
- Codebase analysis: `src/lib/sync.ts` -- pushClientData/pullCoachData patterns
- Codebase analysis: `src/hooks/useCoachTemplates.ts` -- Map cache + TTL + devBypass pattern
- Codebase analysis: `src/hooks/useClientDetails.ts` -- multi-query hook with cache
- Codebase analysis: `src/lib/database.types.ts` -- TypeScript type patterns
- Codebase analysis: `src/stores/userStore.ts` -- weightHistory for auto-data
- Codebase analysis: `src/stores/macroStore.ts` -- dailyLogs/targets for macro hit rate
- Codebase analysis: `src/stores/workoutStore.ts` -- workoutLogs for workout count

### Secondary (MEDIUM confidence)
- Requirements document: CHECK-01 through CHECK-06 field definitions

### Tertiary (LOW confidence)
- Step count/cardio distinction -- inferred from requirements text, may not match actual expectations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new deps, everything exists in project
- Database schema: HIGH -- follows established patterns exactly (schema.sql analysis)
- Architecture: HIGH -- direct extension of existing coach patterns (hooks, sync, RLS)
- Form design: MEDIUM -- 16-field form UX is straightforward but sections are a design choice
- Auto-populated data: MEDIUM -- weight and workout data are clear; step/cardio unclear
- Pitfalls: HIGH -- based on direct analysis of codebase gotchas

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable -- no external dependencies, all internal patterns)
