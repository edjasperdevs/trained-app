---
phase: 01-coach-foundation
plan: 01
subsystem: database
tags: [postgres, supabase, rls, migration, typescript, schema]

# Dependency graph
requires:
  - phase: none
    provides: existing schema with macro_targets and coach_clients tables
provides:
  - set_by data ownership column on macro_targets (self vs coach)
  - Fixed coach_clients RLS requiring role = 'coach'
  - Role escalation prevention trigger on profiles
  - Updated TypeScript types with MacroSetBy
affects: [01-coach-foundation plan 02, 01-coach-foundation plan 03, coach dashboard UI]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Data ownership via set_by column pattern (TEXT with CHECK constraint)"
    - "Role-gated RLS policies using EXISTS subquery on profiles.role"
    - "Trigger-based column protection (prevent_role_change)"

key-files:
  created:
    - supabase/migrations/002_coach_foundation.sql
  modified:
    - supabase/schema.sql
    - src/lib/database.types.ts

key-decisions:
  - "set_by uses TEXT with CHECK constraint instead of enum (simpler migration, only 2 values)"
  - "Role protection via BEFORE UPDATE trigger checking JWT claims for service_role"

patterns-established:
  - "Data ownership pattern: set_by column distinguishes client-owned vs coach-owned records"
  - "RLS hardening: coach operations require role = 'coach' check via EXISTS subquery"

# Metrics
duration: 2min
completed: 2026-02-07
---

# Phase 1 Plan 1: Coach Foundation Schema Summary

**set_by data ownership column on macro_targets, coach_clients RLS fix requiring role = 'coach', and role escalation prevention trigger**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-07T20:07:38Z
- **Completed:** 2026-02-07T20:10:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `set_by` and `set_by_coach_id` columns to `macro_targets` for data ownership tracking
- Fixed critical RLS vulnerability where any authenticated user could make themselves a coach by inserting into `coach_clients`
- Added `prevent_role_change` trigger preventing role escalation via client API
- Updated TypeScript types with `MacroSetBy` type and new columns in all three macro_targets type variants

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SQL migration for schema changes** - `d202a094` (feat)
2. **Task 2: Update TypeScript database types** - `0cce3f42` (feat)

## Files Created/Modified
- `supabase/migrations/002_coach_foundation.sql` - SQL migration with set_by columns, RLS fix, and role protection trigger
- `supabase/schema.sql` - Canonical schema reference updated to match migration
- `src/lib/database.types.ts` - MacroSetBy type, set_by/set_by_coach_id in macro_targets Row/Insert/Update

## Decisions Made
- Used TEXT with CHECK constraint for `set_by` instead of a new enum type -- simpler migration path, only two values ('self', 'coach')
- Role protection trigger checks `request.jwt.claims` for `service_role` -- allows admin operations via Supabase service key while blocking client API changes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required. Migration must be run against Supabase when deploying.

## Next Phase Readiness
- Schema foundation complete for directional sync system (Plan 03)
- `set_by` column enables distinguishing client-owned vs coach-owned macro targets
- RLS fix and role protection must be applied to production before coach features go live
- TypeScript types are in sync and compile cleanly

## Self-Check: PASSED

---
*Phase: 01-coach-foundation*
*Completed: 2026-02-07*
