# Roadmap: Trained v1.3 Coach Dashboard

## Overview

Transform Trained from a client-only fitness app into a full coaching platform where the sole coach can invite clients, program workouts, set macro targets, and review structured weekly check-ins. The critical path starts with data ownership (preventing sync collisions between coach-authoritative and client-owned data), builds the roster and invitation infrastructure, then delivers three independent coaching features: macro management, workout programming, and weekly check-ins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Data ownership model, directional sync, schema, RLS security fix, coach route guard, lazy loading
- [x] **Phase 2: Invitations** - Email infrastructure (Edge Function + Resend) and invite lifecycle
- [x] **Phase 3: Client Roster** - Paginated roster with search, client detail view, server-side performance
- [ ] **Phase 4: Macro Management** - Coach sets client macro targets, client sees coach-set targets
- [ ] **Phase 5: Workout Programming** - Coach builds and assigns workouts, client executes prescribed workouts
- [ ] **Phase 6: Weekly Check-ins** - Client submits structured check-in, coach reviews and responds

## Phase Details

### Phase 1: Foundation
**Goal**: Coach route is protected, data ownership is defined, sync is directional, and the coach dashboard loads without impacting client bundle size
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-06
**Success Criteria** (what must be TRUE):
  1. Non-coach users who navigate to `/coach` are redirected to the client app
  2. Coach-set macro targets are NOT overwritten when a client opens the app and sync fires
  3. Client app loads coach-assigned data (macros, workouts) from Supabase on app open without the client pushing stale data back
  4. A non-coach user cannot insert rows into `coach_clients` via the Supabase API (RLS enforces `role = 'coach'`)
  5. Coach dashboard code is not included in the client app's JavaScript bundle
**Plans**: 3 plans
Plans:
- [x] 01-01-PLAN.md -- Schema migration (set_by column, RLS fix, role protection trigger)
- [x] 01-02-PLAN.md -- CoachGuard route protection component + App.tsx wiring
- [x] 01-03-PLAN.md -- Directional sync refactor (pushClientData, pullCoachData)

### Phase 2: Invitations
**Goal**: Coach can invite new clients by email and the coach-client relationship is automatically created when the invite is accepted
**Depends on**: Phase 1 (coach route guard, RLS policies)
**Requirements**: INVITE-01, INVITE-02, INVITE-03
**Success Criteria** (what must be TRUE):
  1. Coach enters a client email, clicks send, and a branded invite email arrives in the client's inbox
  2. Coach can see which invites are pending, accepted, or expired
  3. Sending a second invite to the same email does not create a duplicate (deduplication enforced)
  4. When an invited user completes signup, they appear in the coach's client roster without manual linking
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md -- Database migration (invites table, RLS, handle_new_user trigger extension, TypeScript types)
- [x] 02-02-PLAN.md -- Edge Function (send-invite with Resend email, CORS helper)
- [x] 02-03-PLAN.md -- Coach UI (invite modal refactor, invite status list)

### Phase 3: Client Roster
**Goal**: Coach can browse, search, and drill into any client's details from a performant paginated roster
**Depends on**: Phase 1 (schema, lazy loading), Phase 2 (clients exist via invites)
**Requirements**: INFRA-05, ROSTER-01, ROSTER-02, ROSTER-03
**Success Criteria** (what must be TRUE):
  1. Coach sees a paginated list of clients with last workout date, current streak, and macro adherence at a glance
  2. Coach can search clients by name or email and results update with server-side filtering
  3. Coach can drill into a client to see weight history, macro adherence trends, and activity feed
  4. Roster loads in under 2 seconds with 100+ clients (server-side pagination, no full table scan)
**Plans**: 2 plans
Plans:
- [x] 03-01-PLAN.md -- Database migration (security_invoker on view) + useClientRoster hook (pagination, search, debounce)
- [x] 03-02-PLAN.md -- Coach.tsx refactor (search input, pagination controls, updated client cards)

### Phase 4: Macro Management
**Goal**: Coach can remotely set a client's daily macro targets and the client sees the updated targets on their next app open
**Depends on**: Phase 1 (data ownership, directional sync), Phase 3 (client detail view)
**Requirements**: MACRO-01, MACRO-02, MACRO-03
**Success Criteria** (what must be TRUE):
  1. Coach can set calories, protein, carbs, and fat targets for any client from the dashboard
  2. Client sees "Set by Coach" indicator on their macro targets and cannot recalculate/override them
  3. Client sees updated macro targets on next app open after coach changes them (no manual refresh needed)
**Plans**: TBD

### Phase 5: Workout Programming
**Goal**: Coach can build workouts, save them as templates, assign them to client calendars, and see how clients performed against the prescription
**Depends on**: Phase 1 (data ownership, workout_programs table), Phase 3 (client detail view)
**Requirements**: PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06
**Success Criteria** (what must be TRUE):
  1. Coach can build a workout for a client on a specific date by selecting exercises, sets, reps, and weight targets
  2. Coach can save a workout as a reusable template and assign that template to any client on any date
  3. Client sees the coach-assigned workout on the assigned date with an "Assigned by Coach" indicator
  4. Client can log their actual sets/reps/weight against the prescribed workout
  5. Coach can view a prescribed-vs-actual comparison showing what was assigned versus what the client did
**Plans**: TBD

### Phase 6: Weekly Check-ins
**Goal**: Clients submit structured weekly check-ins and the coach reviews and responds to them from the dashboard
**Depends on**: Phase 1 (check_ins table, data ownership), Phase 3 (client detail view)
**Requirements**: CHECK-01, CHECK-02, CHECK-03, CHECK-04, CHECK-05, CHECK-06
**Success Criteria** (what must be TRUE):
  1. Client can fill out a structured weekly check-in form covering all 16 fields (water, hunger, sleep, stress, training feedback, etc.)
  2. Check-in auto-includes app-tracked data (weight trend, step count, macro hit rate, cardio) for coach context
  3. Coach sees a list of pending check-ins to review, sorted by submission date
  4. Coach can review a check-in and add notes/response that the client can read
  5. Check-in prompt is surfaced prominently on the client home screen when due (not buried in navigation)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-02-07 |
| 2. Invitations | 3/3 | Complete | 2026-02-07 |
| 3. Client Roster | 2/2 | Complete | 2026-02-07 |
| 4. Macro Management | 0/TBD | Not started | - |
| 5. Workout Programming | 0/TBD | Not started | - |
| 6. Weekly Check-ins | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-07*
*Milestone: v1.3 Coach Dashboard*
