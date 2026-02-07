---
phase: 02-invitations
plan: 01
subsystem: database
tags: [postgresql, supabase, rls, triggers, invites, migration]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: profiles table, coach_clients table, handle_new_user trigger, RLS patterns
provides:
  - invites table with status lifecycle (pending/accepted/expired)
  - invite_status PostgreSQL enum
  - UNIQUE(coach_id, email) deduplication constraint
  - Auto-link trigger (handle_new_user extends to accept invites and create coach_clients)
  - InviteStatus TypeScript type and invites table type definitions
  - RLS policy restricting invite management to owning coach
affects: [02-02 (Edge Function reads/writes invites), 02-03 (Coach UI queries invites)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Invite lifecycle state machine in PostgreSQL (pending -> accepted/expired)"
    - "Trigger-based auto-linking on signup (extend handle_new_user)"
    - "UNIQUE constraint for invite deduplication (coach_id, email)"

key-files:
  created:
    - supabase/migrations/003_invitations.sql
  modified:
    - supabase/schema.sql
    - src/lib/database.types.ts

key-decisions:
  - "invite_status is a PostgreSQL enum (not TEXT CHECK) for type safety and indexability"
  - "UNIQUE(coach_id, email) is unconditional -- one invite row per coach+email pair, upsert on resend"
  - "Auto-link runs inside handle_new_user trigger (same transaction as profile creation, atomic)"
  - "RLS uses same EXISTS subquery pattern as coach_clients for consistency"

patterns-established:
  - "Invite lifecycle: status enum + expires_at checked on read (no cron for expiry)"
  - "Extending handle_new_user for cross-table side effects on signup"

# Metrics
duration: 3min
completed: 2026-02-07
---

# Phase 2 Plan 1: Invitations Data Layer Summary

**PostgreSQL invites table with status lifecycle enum, UNIQUE deduplication, RLS for coaches, and handle_new_user trigger extension that auto-accepts pending invites and creates coach_clients rows on signup**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-07T21:07:53Z
- **Completed:** 2026-02-07T21:11:06Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created invites table with all columns (coach_id, email, status, token, expires_at, accepted_at, accepted_by) and 4 indexes
- Enforced invite deduplication via UNIQUE(coach_id, email) constraint at the database level
- Extended handle_new_user trigger to atomically auto-accept pending invites and create coach_clients relationships on user signup
- Added RLS policy matching the existing coach_clients pattern (coach_id = auth.uid() with role check)
- Added InviteStatus type and full invites table Row/Insert/Update type definitions to database.types.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Create invitations migration and update schema.sql** - `283175ce` (feat)
2. **Task 2: Add invite TypeScript types to database.types.ts** - `5708efa8` (feat)

## Files Created/Modified
- `supabase/migrations/003_invitations.sql` - Complete migration: invite_status enum, invites table, indexes, RLS, updated handle_new_user trigger
- `supabase/schema.sql` - Canonical schema updated with invites table, indexes, RLS policy, updated_at trigger, and extended handle_new_user
- `src/lib/database.types.ts` - InviteStatus type export, invites table Row/Insert/Update definitions, invite_status in Enums

## Decisions Made
- Used PostgreSQL ENUM for invite_status (not TEXT with CHECK) -- provides type safety, indexability, and matches the existing pattern used by coach_client_status
- UNIQUE constraint is unconditional on (coach_id, email) -- one row per pair, resending upserts the existing row
- Auto-link logic lives inside handle_new_user trigger (not a separate function) -- runs in the same transaction as profile/XP creation for atomicity
- RLS policy uses the same EXISTS subquery pattern as coach_clients for consistency across the codebase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Migration must be applied to Supabase when deploying (standard migration flow).

## Next Phase Readiness
- Invites table and types ready for the Edge Function (plan 02-02) to create invite records and send emails
- TypeScript types ready for the Coach UI (plan 02-03) to display and manage invites
- handle_new_user trigger will auto-link without any additional application code

## Self-Check: PASSED

---
*Phase: 02-invitations*
*Completed: 2026-02-07*
