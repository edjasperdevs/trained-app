---
phase: 05-workout-programming
plan: 02
subsystem: coach-programming
tags: [workout-templates, assignment, supabase, react, coach-ui]
depends_on:
  requires: ["05-01"]
  provides: ["useCoachTemplates hook", "WorkoutBuilder component", "WorkoutAssigner component", "Programs tab in Coach dashboard"]
  affects: ["05-03", "05-04"]
tech-stack:
  added: []
  patterns: ["Map cache with TTL", "snapshot-at-assignment", "dev bypass with mutable mock stores"]
key-files:
  created:
    - src/hooks/useCoachTemplates.ts
    - src/components/WorkoutBuilder.tsx
    - src/components/WorkoutAssigner.tsx
  modified:
    - src/screens/Coach.tsx
decisions:
  - "JSON.parse(JSON.stringify()) for exercise snapshot to ensure deep copy and Json type compatibility"
  - "Mutable module-level arrays for dev bypass mock data (devTemplates, devAssignments)"
  - "Segmented control toggle for Clients/Templates top-level views (not sidebar tabs)"
  - "Programs tab added as 4th tab in client detail modal"
  - "Template assign from top-level uses client selector dropdown; client detail uses pre-filled clientId"
  - "Inline builder for custom one-off workouts in client Programs tab"
  - "deleteAssignment added to hook (not in original plan) for complete CRUD on assignments"
metrics:
  duration: "7m 22s"
  completed: "2026-02-08"
---

# Phase 05 Plan 02: Coach Workout Programming UI Summary

Template CRUD hook with Map cache + assignment upsert/conflict-check, WorkoutBuilder exercise editor, WorkoutAssigner date/client/notes flow, and full Coach dashboard integration with Templates view and client Programs tab.

## What Was Built

### useCoachTemplates Hook (`src/hooks/useCoachTemplates.ts`)
- `templates` state with auto-fetch on mount
- `fetchTemplates()` with Map cache (5min TTL), dev bypass returning mock data
- `createTemplate(name, exercises)` -- INSERT + cache invalidation + local state update
- `updateTemplate(id, { name?, exercises? })` -- UPDATE + cache invalidation
- `deleteTemplate(id)` -- DELETE + cache invalidation
- `checkExistingAssignment(clientId, date)` -- SELECT for conflict detection
- `assignWorkout(clientId, date, exercises, templateId?, notes?)` -- UPSERT with `onConflict: 'client_id,date'`
- `fetchClientAssignments(clientId, startDate, endDate)` -- date-range query
- `deleteAssignment(id)` -- DELETE for removing assignments
- Exercises deep-copied via `JSON.parse(JSON.stringify())` at assignment time (snapshot pattern)

### WorkoutBuilder Component (`src/components/WorkoutBuilder.tsx`)
- Exercise list editor with name, sets, reps, weight (optional), notes (optional) fields
- Add/remove/reorder exercises with ChevronUp/ChevronDown/Trash2 buttons
- Optional template name field (controlled via `showNameField` prop)
- Empty state: "Add exercises to build your workout"
- Uses shadcn Input, Button, Card components with direct imports

### WorkoutAssigner Component (`src/components/WorkoutAssigner.tsx`)
- Client selector dropdown (when `clientId` not pre-provided)
- Date picker defaulting to tomorrow
- Notes text input
- Read-only exercise summary (name + sets x reps)
- Pre-assign conflict check via `checkExistingAssignment()`
- `window.confirm()` dialog for overwrite confirmation
- Success toast and callback on completion

### Coach Dashboard Integration (`src/screens/Coach.tsx`)
- **Top-level toggle:** Clients / Templates segmented control in header
- **Templates view:** List with quick-assign/edit/delete buttons, create mode with WorkoutBuilder, edit mode, assign mode with WorkoutAssigner
- **Client detail Programs tab:** 4th tab alongside overview/progress/activity
  - Assigned workouts list (upcoming tagged, sorted by date desc)
  - "Assign Template" dropdown pre-populated from template library
  - "Custom Workout" inline builder flow -> assign
  - Delete assignment with confirmation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Json type casting for Supabase insert/upsert**
- **Found during:** Task 1
- **Issue:** `Record<string, unknown>[]` not assignable to Supabase `Json` type
- **Fix:** Used `JSON.parse(JSON.stringify(exercises)) as Json` for proper type compatibility
- **Files modified:** `src/hooks/useCoachTemplates.ts`
- **Commit:** c3bf1262

**2. [Rule 2 - Missing Critical] Added deleteAssignment function**
- **Found during:** Task 2
- **Issue:** Plan specified assignment list in client Programs tab but no way to remove assignments
- **Fix:** Added `deleteAssignment(id)` to useCoachTemplates hook + delete button on assignment cards
- **Files modified:** `src/hooks/useCoachTemplates.ts`, `src/screens/Coach.tsx`
- **Commit:** f24325e1

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | useCoachTemplates hook + WorkoutBuilder | c3bf1262 | src/hooks/useCoachTemplates.ts, src/components/WorkoutBuilder.tsx |
| 2 | WorkoutAssigner + Coach.tsx Programs tab | f24325e1 | src/components/WorkoutAssigner.tsx, src/screens/Coach.tsx |

## Verification Results

1. `npx tsc --noEmit` -- passes clean
2. `npx vite build` -- succeeds, Coach chunk 55.29 kB (14.12 kB gzip)
3. Template CRUD: create/list/edit/delete all wired through useCoachTemplates
4. Assignment flow: template or custom exercises -> client + date -> conflict check -> upsert
5. Overwrite confirmation: `window.confirm()` when date already has assignment
6. Snapshot pattern: `JSON.parse(JSON.stringify(exercises))` deep copies at assign time
7. Dev bypass: mutable module-level arrays for templates and assignments

## Next Phase Readiness

Plan 05-03 (client-side workout pull) can now use:
- `assigned_workouts` table populated by coach
- `AssignedWorkout` type from `database.types.ts`
- `workoutStore.assignedWorkout` + `setAssignedWorkout` from plan 05-01

## Self-Check: PASSED
