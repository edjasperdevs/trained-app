# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-07)

**Core value:** The coach can manage every client's training from one place -- programs, macros, check-ins -- and clients see their personalized plans without friction
**Current focus:** Phase 6 (Weekly Check-ins) in progress. Plan 01 complete, 3 remaining.

## Current Position

Phase: 6 of 6 (Weekly Check-ins)
Plan: 1 of 4 in current phase
Status: In progress
Last activity: 2026-02-08 -- Completed 06-01-PLAN.md (Weekly Check-ins Foundation)

Progress: [███████████████░░] 83%

## Performance Metrics

**Prior Milestones:**
- v1.0 Launch Polish: 5 phases, 10 plans
- v1.1 Design Refresh: 7 phases, 12 plans (1.48 hours, avg 7.4min/plan)
- v1.2 Pre-Launch Confidence: 4 phases, 8 plans (1.01 hours, avg 7.9min/plan)

**v1.3 Coach Dashboard:**
- Total plans completed: 15
- Average duration: 2.7min
- Total execution time: 48min

## Accumulated Context

### Decisions

All prior decisions logged in PROJECT.md Key Decisions table and milestone archives.

Recent decisions affecting current work:
- v1.3: Coach dashboard at /coach, single coach, Supabase-only backend, existing design system
- v1.3: Data ownership split -- client-owned (offline-first, push) vs coach-owned (server-authoritative, pull)
- 01-01: set_by uses TEXT with CHECK constraint (not enum) for simplicity
- 01-01: Role protection trigger checks JWT claims for service_role
- 01-02: CoachGuard eagerly imported (not lazy) -- tiny component, must render before Coach chunk
- 01-02: Direct file import for CoachGuard (not barrel) to preserve code-splitting
- 01-02: Network errors during role check fail closed (redirect) with toast warning
- 01-03: syncAllToCloud kept as @deprecated for backward compatibility
- 01-03: pullCoachData resets local setBy to 'self' when server shows set_by='self' (handles coach revert)
- 02-01: invite_status is PostgreSQL ENUM (not TEXT CHECK) for type safety and indexability
- 02-01: UNIQUE(coach_id, email) is unconditional -- one invite row per pair, upsert on resend
- 02-01: Auto-link runs inside handle_new_user trigger (same transaction, atomic)
- 02-02: EMAIL_FROM read from env with fallback to Resend test domain (onboarding@resend.dev)
- 02-02: APP_URL env var with fallback to https://app.trained.com
- 02-02: Invite link uses ?invite=token on normal signup URL (not magic link)
- 02-03: Accepted invites excluded from invite section (appear in client list via auto-link)
- 02-03: Dev bypass returns empty invites array (server-authoritative, no meaningful mock)
- 02-03: Resend reuses handleInviteClient with emailOverride param
- 03-01: security_invoker via CREATE OR REPLACE (not DROP+CREATE) to avoid downtime
- 03-01: ClientSummary interface defined in useClientRoster.ts for shared reuse
- 03-01: Estimated count for pagination performance
- 03-01: Dev bypass filters mock data client-side matching server behavior shape
- 03-02: Quick stats hidden for multi-page rosters (only current page data available)
- 03-02: Client card shows workouts (7d) instead of level for at-a-glance activity
- 04-01: set_by defaults to 'self' when null from database (fallback in mapping)
- 04-02: Used trackEvent() directly instead of analytics.track() (typed object has no generic track)
- 04-02: Null guards for clientId and coachId props (both nullable types)
- 04-02: useEffect syncs form fields with currentTargets after cache refresh
- 05-01: UNIQUE(client_id, date) on assigned_workouts -- one assignment per client per day
- 05-01: assignedWorkout non-persisted via partialize -- server-authoritative, fetched fresh
- 05-01: assignment_id ON DELETE SET NULL -- preserves workout history
- 05-02: JSON.parse(JSON.stringify()) for exercise snapshot and Json type compatibility
- 05-02: Segmented control toggle for Clients/Templates views (not sidebar tabs)
- 05-02: Programs tab as 4th tab in client detail modal
- 05-02: deleteAssignment added for complete assignment CRUD
- 05-02: Mutable module-level arrays for dev bypass mock templates/assignments
- 05-03: Coach workout on rest day uses fallback type push/dayNumber 1 (generateExercises overrides with prescribed)
- 05-03: Self-directed fallback sets assignedWorkout to null for current session only
- 05-03: Priority 0 in generateExercises: coach-assigned exercises bypass all other generation logic
- 05-04: Case-insensitive name matching for exercise pairing in prescribed-vs-actual comparison
- 05-04: Expandable card accordion pattern for completed workout comparison views
- 05-04: Mock completed data synthesized from existing mock assignments
- 06-01: 5 RLS policies (client insert/select/update-when-submitted, coach select/update via coach_clients)
- 06-01: Client UPDATE restricted to status='submitted' (prevents editing after coach reviews)
- 06-01: getCurrentMonday() uses local timezone via getLocalDateString for week_of
- 06-01: PendingCheckin interface extends WeeklyCheckin with client_username/email for coach list

### Pending Todos

- Configure Sentry alert rules in dashboard (MON-03)
- Set SENTRY_AUTH_TOKEN/ORG/PROJECT in deploy environment
- Verify source maps + PII masking + session replay post-deploy
- Set up Resend API key and deploy send-invite Edge Function before invite testing
- Apply migration 003_invitations.sql to Supabase
- Apply migration 004_roster_enhancements.sql to Supabase
- Apply migration 005_coach_macro_insert.sql to Supabase
- Apply migration 006_workout_programming.sql to Supabase
- Apply migration 007_weekly_checkins.sql to Supabase

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-08
Stopped at: Completed 06-01-PLAN.md (Weekly Check-ins Foundation)
Resume file: None
