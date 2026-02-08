---
phase: 06-weekly-checkins
plan: 02
subsystem: ui
tags: [react, typescript, zustand, form, weekly-checkins, home-screen, routing]

# Dependency graph
requires:
  - phase: 06-weekly-checkins
    provides: useWeeklyCheckins hook, WeeklyCheckin types, getCurrentMonday(), devSeed mock data
provides:
  - WeeklyCheckIn.tsx full-screen 16-field form with 5 collapsible sections
  - computeAutoData() for weight/macro/workout snapshot at submission
  - Home screen "Weekly Check-in Due" banner with secondary color
  - /checkin lazy-loaded route in App.tsx
affects: [06-03 coach review, 06-04 response viewing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ScaleButtonGroup component for 1-5 scale fields (reusable)"
    - "computeAutoData() uses getState() to read from stores at submission time (not render)"
    - "Section-grouped useState for multi-section forms"

key-files:
  created:
    - src/screens/WeeklyCheckIn.tsx
  modified:
    - src/screens/Home.tsx
    - src/App.tsx

key-decisions:
  - "Button group (not Select) for 1-5 scale fields -- more mobile-friendly, fewer taps"
  - "All 5 sections start expanded on first visit -- user can collapse as they go"
  - "Weekly banner placed after reminders, before Daily Report banner -- clear visual hierarchy"
  - "Weekly banner uses secondary color (not primary) and ClipboardCheck icon (not Sparkles) to differentiate from Daily Report"
  - "No bounce animation on weekly banner chevron -- further visual distinction from Daily Report"
  - "hasCheckinForCurrentWeek check runs on Home mount via useEffect"

patterns-established:
  - "Weekly vs Daily visual distinction: secondary color + ClipboardCheck for weekly, primary + Sparkles for daily"
  - "computeAutoData() pattern: read stores via getState() at submission time for point-in-time snapshots"

# Metrics
duration: 7min
completed: 2026-02-08
---

# Phase 6 Plan 2: Client Check-in Form and Home Banner Summary

**642-line weekly check-in form with 5 collapsible sections (16 fields), auto-computed weight/macro/workout snapshots, and Home screen "due" banner with secondary color distinction**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-08T05:44:38Z
- **Completed:** 2026-02-08T06:25:42Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Full-screen WeeklyCheckIn.tsx with Nutrition (6 fields), Training (3), Lifestyle (5), Health (4), Open Feedback (1) collapsible sections
- computeAutoData() reads from userStore (weight), macroStore (macro hit rate), workoutStore (workout count) at submit time
- Home screen "Weekly Check-in Due" banner visually distinct from Daily Report (secondary color, ClipboardCheck icon, no bounce)
- /checkin lazy-loaded route with HomeSkeleton fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Weekly check-in form screen** - `cae26b5a` (feat)
2. **Task 2: Home screen banner and /checkin route** - `0d3372e5` (feat)

## Files Created/Modified
- `src/screens/WeeklyCheckIn.tsx` - Full-screen 16-field form with 5 sections, ScaleButtonGroup, computeAutoData()
- `src/screens/Home.tsx` - Weekly Check-in Due banner with secondary color and ClipboardCheck icon
- `src/App.tsx` - /checkin lazy-loaded route with HomeSkeleton fallback

## Decisions Made
- Button groups for 1-5 scales instead of Select dropdowns -- more touch-friendly on mobile, single tap vs tap-scroll-tap
- All sections expanded by default on first visit -- client can collapse sections they want to skip
- Weekly banner placed between reminders and Daily Report in visual hierarchy
- Weekly banner uses secondary color theme (border-l-secondary, text-secondary) while Daily Report uses primary -- clear visual differentiation
- hasCheckinForCurrentWeek() called on Home mount, result stored in state (null = loading, true/false = loaded)
- No imports from CheckInModal.tsx -- weekly and daily check-ins are completely separate features per research

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Client form and Home banner complete
- Plan 03 (coach review UI) can proceed -- uses same useWeeklyCheckins hook and WeeklyCheckin types
- Plan 04 (client response viewing) can proceed -- client-side infrastructure is in place

## Self-Check: PASSED

---
*Phase: 06-weekly-checkins*
*Completed: 2026-02-08*
