# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-07)

**Core value:** The coach can manage every client's training from one place -- programs, macros, check-ins -- and clients see their personalized plans without friction
**Current focus:** Phase 2 complete. Ready for Phase 3 (Client Roster).

## Current Position

Phase: 3 of 6 (Client Roster)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-02-07 -- Phase 2 (Invitations) verified and complete

Progress: [██████░░░░] 33%

## Performance Metrics

**Prior Milestones:**
- v1.0 Launch Polish: 5 phases, 10 plans
- v1.1 Design Refresh: 7 phases, 12 plans (1.48 hours, avg 7.4min/plan)
- v1.2 Pre-Launch Confidence: 4 phases, 8 plans (1.01 hours, avg 7.9min/plan)

**v1.3 Coach Dashboard:**
- Total plans completed: 6
- Average duration: 2.7min
- Total execution time: 16min

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

### Pending Todos

- Configure Sentry alert rules in dashboard (MON-03)
- Set SENTRY_AUTH_TOKEN/ORG/PROJECT in deploy environment
- Verify source maps + PII masking + session replay post-deploy
- Set up Resend API key and deploy send-invite Edge Function before invite testing
- Apply migration 003_invitations.sql to Supabase

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-07
Stopped at: Phase 2 (Invitations) complete -- ready for Phase 3 (Client Roster)
Resume file: None
