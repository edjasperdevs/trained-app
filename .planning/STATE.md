# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-07)

**Core value:** The coach can manage every client's training from one place -- programs, macros, check-ins -- and clients see their personalized plans without friction
**Current focus:** Phase 2 (Invitations) in progress. Edge Function complete, Coach UI remaining.

## Current Position

Phase: 2 of 6 (Invitations)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-02-07 -- Completed 02-02-PLAN.md (send-invite Edge Function)

Progress: [████░░░░░░] 28%

## Performance Metrics

**Prior Milestones:**
- v1.0 Launch Polish: 5 phases, 10 plans
- v1.1 Design Refresh: 7 phases, 12 plans (1.48 hours, avg 7.4min/plan)
- v1.2 Pre-Launch Confidence: 4 phases, 8 plans (1.01 hours, avg 7.9min/plan)

**v1.3 Coach Dashboard:**
- Total plans completed: 5
- Average duration: 2.4min
- Total execution time: 12min

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

### Pending Todos

- Configure Sentry alert rules in dashboard (MON-03)
- Set SENTRY_AUTH_TOKEN/ORG/PROJECT in deploy environment
- Verify source maps + PII masking + session replay post-deploy
- Set up Resend API key and deploy send-invite Edge Function before invite testing

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-07
Stopped at: Completed 02-02-PLAN.md (send-invite Edge Function)
Resume file: None
