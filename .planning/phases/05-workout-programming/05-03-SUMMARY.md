---
phase: 05-workout-programming
plan: 03
subsystem: ui, api
tags: [react, zustand, supabase, sync, workout-programming, coach-assigned]

# Dependency graph
requires:
  - phase: 05-01
    provides: "assigned_workouts table, AssignedWorkoutState type, setAssignedWorkout action, PrescribedExercise type"
  - phase: 05-02
    provides: "Coach UI for creating/assigning workouts and templates"
provides:
  - "pullCoachData fetches assigned workouts for today and upcoming 7 days"
  - "generateExercises uses coach-assigned exercises at priority 0"
  - "WorkoutLog.assignmentId links completed workouts to assignments"
  - "Assigned by Coach badge on Workouts screen"
  - "Self-directed fallback option for client"
affects: [05-04, 06-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Priority-based exercise generation (coach > customization > template > legacy)"
    - "Coach badge pattern reused from Macros screen (ShieldCheck icon)"

key-files:
  created: []
  modified:
    - "src/lib/sync.ts"
    - "src/stores/workoutStore.ts"
    - "src/screens/Workouts.tsx"

key-decisions:
  - "Coach workout on rest day uses fallback type push/dayNumber 1 (generateExercises overrides with prescribed anyway)"
  - "Self-directed fallback sets assignedWorkout to null for current session (restored on next pullCoachData)"
  - "Prescribed exercises preview shows targetWeight only when provided"

patterns-established:
  - "Priority 0 in generateExercises: coach-assigned exercises bypass all other generation logic"
  - "assignmentId on WorkoutLog propagated to assignment_id in cloud sync"

# Metrics
duration: 4min
completed: 2026-02-08
---

# Phase 5 Plan 3: Client Workout Integration Summary

**pullCoachData fetches assigned workouts, generateExercises uses them at priority 0, and Workouts.tsx shows Assigned by Coach badge with self-directed fallback**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-08T02:20:54Z
- **Completed:** 2026-02-08T02:24:57Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- pullCoachData extended to fetch today + 6 upcoming assigned workouts from Supabase
- generateExercises checks for coach-assigned workout at priority 0 (before customizations and templates)
- WorkoutLog stores assignmentId which syncs as assignment_id to cloud
- Workouts.tsx shows "Assigned by Coach" badge with ShieldCheck icon when assignment exists
- Prescribed exercises listed with sets, reps, and target weights in today card
- "Do your own workout instead" button clears assignment for current session
- Active workout shows "Prescribed by Coach" header for coach-assigned workouts
- Week view shows ShieldCheck icon on coach-assigned days

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend pullCoachData and modify generateExercises** - `f61d5f22` (feat)
2. **Task 2: Update Workouts.tsx with coach badge and self-directed fallback** - `3eb22a5f` (feat)

## Files Created/Modified
- `src/lib/sync.ts` - Added assigned_workouts fetch in pullCoachData, assignment_id in syncWorkoutLogToCloud
- `src/stores/workoutStore.ts` - Priority 0 in generateExercises, assignmentId on WorkoutLog, clear on complete/endEarly
- `src/screens/Workouts.tsx` - Assigned by Coach badge, prescribed exercises preview, self-directed fallback, active workout header

## Decisions Made
- Coach workout on rest day uses fallback type push/dayNumber 1 since generateExercises overrides with prescribed exercises anyway
- Self-directed fallback uses setAssignedWorkout(null) for transient session override (restored on next sync)
- Prescribed exercises preview shows targetWeight only when provided by coach
- Week view shows ShieldCheck on today only (pullCoachData stores only today assignment currently)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Handle coach assignment on rest day**
- **Found during:** Task 2 (Workouts.tsx UI)
- **Issue:** handleStartWorkout returned early when !todayWorkout, but coach could assign a workout on a rest day
- **Fix:** Updated handleStartWorkout to allow starting when hasAssignment is true even without todayWorkout, using fallback type/dayNumber
- **Files modified:** src/screens/Workouts.tsx
- **Verification:** TypeScript passes, logic allows coach assignment to override rest days
- **Committed in:** 3eb22a5f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for correctness -- without this fix, coach-assigned workouts on rest days would be unlaunchable.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Client can see and start coach-assigned workouts
- Coach-assigned workout completion links back to assignment via assignment_id
- Ready for 05-04 (progress visibility / coach-side completion view)
- Migration 006_workout_programming.sql still needs to be applied to Supabase

---
*Phase: 05-workout-programming*
*Completed: 2026-02-08*

## Self-Check: PASSED
