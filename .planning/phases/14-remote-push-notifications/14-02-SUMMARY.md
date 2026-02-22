---
phase: 14-remote-push-notifications
plan: 02
subsystem: infra
tags: [apns, push-notifications, edge-functions, jwt, es256, deno, jose, http2]

# Dependency graph
requires:
  - phase: 14-remote-push-notifications
    provides: "device_tokens migration and push plugin integration (plan 01)"
provides:
  - "APNs shared helper with ES256 JWT generation and HTTP/2 delivery"
  - "send-push Edge Function with webhook routing for 3 coach action tables"
  - "Coach-action filtering (set_by for macros, coach_response for check-ins)"
affects: [14-remote-push-notifications plan 03 (webhook configuration + deployment)]

# Tech tracking
tech-stack:
  added: [jose@5 (Deno ESM)]
  patterns: [APNs JWT caching (50-min), webhook payload routing by table name, admin client for cross-user reads]

key-files:
  created:
    - supabase/functions/_shared/apns.ts
    - supabase/functions/send-push/index.ts
  modified: []

key-decisions:
  - "No Firebase -- direct APNs HTTP/2 via Deno fetch (auto-negotiates HTTP/2 via TLS ALPN)"
  - "50-minute JWT cache to stay under APNs 60-min limit and avoid TooManyProviderTokenUpdates"
  - "Webhook payloads trusted without caller auth -- only Supabase admins can create webhooks"

patterns-established:
  - "APNs JWT caching: module-level variable reused across warm Edge Function invocations"
  - "Webhook table routing: switch on payload.table to determine clientId column and notification content"
  - "Coach-action filtering: set_by check for macros, coach_response null-to-truthy for check-ins"

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 14 Plan 02: Server-Side APNs Push Delivery Summary

**APNs JWT+HTTP/2 shared helper and send-push Edge Function routing database webhooks for workouts, macros, and check-ins to client devices via direct APNs**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T21:08:58Z
- **Completed:** 2026-02-22T21:11:32Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- APNs shared helper generates ES256 JWT from .p8 key secrets with 50-minute cache
- send-push Edge Function handles webhook payloads for 3 coach action tables
- Coach-action filtering prevents spurious notifications from self-edits

## Task Commits

Each task was committed atomically:

1. **Task 1: Create APNs shared helper with JWT caching and HTTP/2 delivery** - `2fc74a6c` (feat)
2. **Task 2: Create send-push Edge Function with webhook routing and coach-action filtering** - `0210bfa8` (feat)

## Files Created/Modified
- `supabase/functions/_shared/apns.ts` - ES256 JWT generation, 50-min cache, sendAPNs HTTP/2 delivery
- `supabase/functions/send-push/index.ts` - Webhook handler routing 3 tables to APNs with coach-action filtering

## Decisions Made
- No Firebase -- direct APNs HTTP/2 via Deno fetch which auto-negotiates HTTP/2 via TLS ALPN
- 50-minute JWT cache to stay safely under APNs 60-minute validity and avoid 429 rate limits
- Webhook payloads trusted without caller authentication since only Supabase dashboard admins can create webhooks
- Data fields (route) placed at top level of APNs payload (not inside aps) for client-side access via notification.data

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required. (Webhook configuration and secret setup are handled in plan 14-03.)

## Next Phase Readiness
- APNs helper and send-push Edge Function ready for deployment
- Plan 14-03 will configure database webhooks in Supabase Dashboard and set APNS secrets
- Requires: APNS_KEY_ID, APNS_TEAM_ID, APNS_P8_KEY, APNS_BUNDLE_ID secrets in Supabase

## Self-Check: PASSED

All files and commits verified:
- supabase/functions/_shared/apns.ts -- FOUND
- supabase/functions/send-push/index.ts -- FOUND
- 14-02-SUMMARY.md -- FOUND
- Commit 2fc74a6c -- FOUND
- Commit 0210bfa8 -- FOUND

---
*Phase: 14-remote-push-notifications*
*Completed: 2026-02-22*
