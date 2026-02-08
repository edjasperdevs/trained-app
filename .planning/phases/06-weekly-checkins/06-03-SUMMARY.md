---
phase: 06-weekly-checkins
plan: 03
subsystem: ui
tags: [react, typescript, coach-dashboard, check-in-review, weekly-checkins]

# Dependency graph
requires:
  - phase: 06-weekly-checkins
    provides: useWeeklyCheckins hook, WeeklyCheckin/PendingCheckin types, devSeed mock data
provides:
  - Coach dashboard "Check-ins" view with pending list and review flow
  - Client detail "Check-ins" tab with history and expandable check-in content
---

# Plan 06-03 Summary: Coach Check-in Review UI

## What was built
Added coach-side check-in review capabilities to Coach.tsx:

1. **Dashboard "Check-ins" view** — 3-segment control (Clients/Templates/Check-ins) with pending check-ins list showing client name, week, submission time, sorted oldest first
2. **Check-in review flow** — Click a pending check-in to see auto-populated data summary (weight, macros, workouts), all client-submitted fields grouped by 5 sections (only non-empty fields shown), and a response textarea with "Submit Review" button
3. **Client detail "Check-ins" tab** — 5th tab showing client's check-in history with status badges (Submitted/Reviewed), expandable cards with full check-in content + coach response
4. **Helper function** — `getCheckinSections()` shared between review view and client detail, filters empty fields and groups by Nutrition/Training/Lifestyle/Health/Open Feedback

## Key files

### Modified
- `src/screens/Coach.tsx` — +409 lines: DashboardView includes 'checkins', ClientDetailTab includes 'checkins', pending list, review view with auto data card + sections + response form, client detail check-in history tab

## Commits
- `2b92a616` feat(06-03): add coach check-in review UI with pending list and client history

## Decisions
- 06-03: getCheckinSections() helper shared between review view and client detail tab
- 06-03: Scale fields displayed as "{value}/5", sleep as "{value} hours"
- 06-03: Empty/null fields hidden from coach review (research pitfall #5)
- 06-03: Expandable card accordion pattern for client check-in history (matches completed workouts pattern)

## Self-Check: PASSED
- [x] DashboardView includes 'checkins'
- [x] ClientDetailTab includes 'checkins'
- [x] Pending check-ins list renders with client name and submission date
- [x] Review view shows auto data + 5 sections + response textarea
- [x] submitReview changes status to 'reviewed'
- [x] Client detail Check-ins tab shows history with status badges
- [x] TypeScript compiles with zero errors
