---
phase: 04-macro-management
plan: 01
subsystem: database-rls, coach-hooks, dev-tooling
tags: [rls, macro-targets, insert-policy, useClientDetails, devSeed]
depends_on:
  requires: [01-01, 03-01]
  provides: [coach-macro-insert-policy, expanded-macro-targets-interface, full-macro-mock-data]
  affects: [04-02]
tech-stack:
  added: []
  patterns: [rls-insert-with-check, ownership-tracking-fields]
key-files:
  created:
    - supabase/migrations/005_coach_macro_insert.sql
  modified:
    - supabase/schema.sql
    - src/hooks/useClientDetails.ts
    - src/lib/devSeed.ts
decisions:
  - id: 04-01-A
    decision: "set_by defaults to 'self' when null from database (fallback in mapping)"
    reason: "Existing rows may not have set_by populated yet; safe default"
metrics:
  duration: 1.7min
  completed: 2026-02-07
---

# Phase 4 Plan 1: Coach Macro Insert Policy & Expanded Hook Summary

**One-liner:** RLS INSERT policy for coach macro upsert plus expanded MacroTargets with carbs/fats/ownership fields and full mock data

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add coach INSERT policy migration and update schema reference | 73206db3 | supabase/migrations/005_coach_macro_insert.sql, supabase/schema.sql |
| 2 | Expand useClientDetails hook and devSeed mock data with full macro fields | a447dad9 | src/hooks/useClientDetails.ts, src/lib/devSeed.ts |

## What Was Done

### Task 1: Coach INSERT Policy Migration
- Created `005_coach_macro_insert.sql` with RLS INSERT policy allowing coaches to insert macro_targets rows for their active clients
- Updated `schema.sql` with matching policy after existing UPDATE policy
- schema.sql now has all 3 coach policies on macro_targets: SELECT (view), UPDATE, INSERT

### Task 2: Expanded MacroTargets Hook & Mock Data
- Expanded `MacroTargets` interface from 2 fields to 6: protein, calories, carbs, fats, set_by, set_by_coach_id
- Updated Supabase `.select()` query to fetch all 6 fields
- Updated targets mapping with fallback defaults (set_by defaults to 'self', set_by_coach_id defaults to null)
- Expanded `buildMockMacroData()` configs with carbs, fats, set_by, set_by_coach_id
- Sarah mock client has `set_by: 'coach'` for testing coach indicator in dev bypass mode

## Decisions Made

| ID | Decision | Reasoning |
|----|----------|-----------|
| 04-01-A | set_by defaults to 'self' when null from database | Existing rows may not have set_by populated; safe default preserves backward compatibility |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `npx tsc --noEmit` passes with zero errors
2. Migration file exists with CREATE POLICY for INSERT
3. schema.sql has all three coach policies (SELECT, UPDATE, INSERT) at lines 293, 304, 317
4. MacroTargets interface has 6 fields: protein, calories, carbs, fats, set_by, set_by_coach_id
5. fetchClientMacros() selects all 6 fields
6. buildMockMacroData() returns full targets with carbs, fats, set_by, set_by_coach_id
7. Sarah has set_by: 'coach' for testing

## Next Phase Readiness

Plan 04-02 (Coach Macro Editor UI) can proceed -- all data layer prerequisites are in place:
- INSERT policy enables creating new macro_targets rows
- Expanded hook provides all fields needed for the editor form
- Mock data supports dev bypass testing with set_by variations

## Self-Check: PASSED
