---
phase: 05-workout-programming
plan: 01
subsystem: database-schema
tags: [sql, migration, typescript, zustand, rls]
dependency-graph:
  requires: [01-01, 02-01]
  provides: [workout_templates-table, assigned_workouts-table, assignment_id-fk, workout-programming-types, assigned-workout-store-state]
  affects: [05-02, 05-03, 05-04]
tech-stack:
  added: []
  patterns: [coach-owned-tables, client-date-unique-constraint, non-persisted-zustand-state, jsonb-exercise-snapshot]
key-files:
  created:
    - supabase/migrations/006_workout_programming.sql
  modified:
    - supabase/schema.sql
    - src/lib/database.types.ts
    - src/stores/workoutStore.ts
    - src/lib/devSeed.ts
decisions:
  - id: 05-01-D1
    decision: "UNIQUE(client_id, date) constraint on assigned_workouts -- one assigned workout per client per day"
    rationale: "Prevents conflicting assignments; coach can update but not double-assign"
  - id: 05-01-D2
    decision: "assignedWorkout excluded from persist via partialize -- fetched fresh from Supabase each session"
    rationale: "Server-authoritative data; stale cache would show outdated coach assignments"
  - id: 05-01-D3
    decision: "assignment_id ON DELETE SET NULL -- workout log survives if assignment is deleted"
    rationale: "Historical workout data should never be lost due to coach workflow changes"
  - id: 05-01-D4
    decision: "coach_id used mock-coach-id in devSeed (not coach-dev-id from plan)"
    rationale: "Consistent with existing devSeed mock data that uses mock-coach-id for coach references"
metrics:
  duration: "3min"
  completed: "2026-02-08"
---

# Phase 5 Plan 1: Workout Programming Schema & Types Summary

**SQL migration + TypeScript foundation for coach workout programming -- workout_templates, assigned_workouts tables, assignment_id FK, store state, dev mock data**

## Task Commits

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Create SQL migration and update schema.sql | 859f25d6 | Migration with 2 new tables, 1 ALTER, RLS, indexes, triggers; schema.sql updated |
| 2 | Add TypeScript types, store state, dev mock data | 9c7efff1 | PrescribedExercise/WorkoutTemplate/AssignedWorkout types, assignedWorkout non-persisted state, 3 mock templates + 1 assignment |

## What Was Built

### SQL Migration (006_workout_programming.sql)

**workout_templates** -- Coach-created reusable workout blueprints:
- UUID PK, coach_id FK, name, exercises JSONB
- RLS: coach-only ALL (requires role = 'coach')
- Index on coach_id, update_updated_at trigger

**assigned_workouts** -- Date-specific workout assignments to clients:
- UUID PK, coach_id FK, client_id FK, template_id FK (nullable), date, exercises JSONB snapshot, notes
- UNIQUE(client_id, date) -- one assignment per client per day
- RLS: coach ALL (requires active coach_clients relationship), client SELECT only
- Indexes on (client_id, date DESC) and coach_id, update_updated_at trigger

**workout_logs.assignment_id** -- Links completed logs to their assignment:
- Nullable UUID FK to assigned_workouts, ON DELETE SET NULL
- Partial index WHERE assignment_id IS NOT NULL

### TypeScript Types (database.types.ts)

- `PrescribedExercise` interface (name, targetSets, targetReps, notes?, targetWeight?)
- `WorkoutTemplate` row interface
- `AssignedWorkout` row interface
- Database interface updated with workout_templates, assigned_workouts tables
- workout_logs updated with assignment_id field

### Store State (workoutStore.ts)

- `AssignedWorkoutState` interface (assignmentId, exercises, date, coachNotes?)
- `assignedWorkout: null` initial state (non-persisted via partialize)
- `setAssignedWorkout` action

### Dev Mock Data (devSeed.ts)

- `mockWorkoutTemplates` -- 3 templates (Monday Push, Wednesday Pull, Friday Legs)
- `mockAssignedWorkouts` -- 1 assignment (today, linked to Push template)

## Decisions Made

1. **UNIQUE(client_id, date)** on assigned_workouts prevents double-assigning; coach updates the existing row
2. **assignedWorkout non-persisted** via partialize -- server-authoritative, fetched fresh via pullCoachData
3. **assignment_id ON DELETE SET NULL** preserves workout history even if assignments are cleaned up
4. **mock-coach-id** used in devSeed (consistent with existing mock data convention, not plan's coach-dev-id)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `npx tsc --noEmit` passes with zero errors
2. Migration contains CREATE TABLE for both tables, ALTER TABLE for assignment_id, RLS policies, indexes, triggers
3. database.types.ts exports PrescribedExercise, WorkoutTemplate, AssignedWorkout
4. workoutStore has assignedWorkout (non-persisted) and setAssignedWorkout action
5. devSeed has mockWorkoutTemplates and mockAssignedWorkouts

## Next Phase Readiness

All downstream plans (05-02 coach builder UI, 05-03 client integration, 05-04 comparison view) can import from:
- `@/lib/database.types` for PrescribedExercise, WorkoutTemplate, AssignedWorkout
- `@/stores/workoutStore` for AssignedWorkoutState, assignedWorkout, setAssignedWorkout
- `@/lib/devSeed` for mockWorkoutTemplates, mockAssignedWorkouts

Migration 006 must be applied to Supabase before live testing.

## Self-Check: PASSED
