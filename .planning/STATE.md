# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** Daily discipline earns visible rank progression — the app makes consistency feel like leveling up
**Current focus:** v2.0 WellTrained V2

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-27 — Milestone v2.0 started

## Performance Metrics

**Prior Milestones:**
- v1.0 Launch Polish: 5 phases, 10 plans
- v1.1 Design Refresh: 7 phases, 12 plans (1.48 hours, avg 7.4min/plan)
- v1.2 Pre-Launch Confidence: 4 phases, 8 plans (1.01 hours, avg 7.9min/plan)
- v1.3 Coach Dashboard: 6 phases, 18 plans (61min, avg 3.4min/plan)
- v1.4 Intake Dashboard: 4 phases (built outside GSD)
- v1.5 Native iOS App: 6 phases, 12 plans (closed — App Store submission pending Apple approval)

## Accumulated Context

### Decisions

- v1.5 closed as-is; App Store submission moves to V2 launch phase
- Coach dashboard stripped from trained-app; lives in welltrained-coach
- RevenueCat for iOS IAP subscriptions
- HealthKit for steps/sleep with manual fallback
- "Bro" is 5th generalist archetype (free tier)

### Pending Todos

- Apple Developer account verification (submitted, awaiting response)
- Apply Supabase migrations 003-007 to production
- Deploy send-invite Edge Function + set RESEND_API_KEY
- Apply migration 011_device_tokens.sql to production
- Deploy send-push Edge Function + create database webhooks
- Deploy delete-account Edge Function
- Replace XXXXXXXXXX in AASA file with actual Apple Team ID

### Blockers/Concerns

- Apple Developer enrollment awaiting approval (blocks App Store submission, not development)
- Capacitor 7→8 migration needed before April 28, 2026 Apple deadline

## Session Continuity

Last session: 2026-02-27
Stopped at: Milestone v2.0 initialization — defining requirements
