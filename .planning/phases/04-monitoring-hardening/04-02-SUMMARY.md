---
phase: 04-monitoring-hardening
plan: 02
subsystem: monitoring
tags: [sentry, replay, pii-masking, alert-rules, data-sentry-mask]

# Dependency graph
requires:
  - phase: 04-01
    provides: "Sentry replay with maskAllText:false and [data-sentry-mask] CSS selector"
provides:
  - "PII masking on all health/fitness data across 5 screens (Settings, Macros, Onboarding, Home, Coach)"
  - "Sentry alert rules: Error Rate Spike (>10/10min) and User Impact (>5 users/15min)"
  - "MON-03 and MON-04 requirements satisfied"
affects: ["deploy (alert rules are live in Sentry dashboard)"]

# Tech tracking
tech-stack:
  added: []
  patterns: ["data-sentry-mask on nearest PII wrapper div (not individual elements)"]

key-files:
  created: []
  modified: ["src/screens/Settings.tsx", "src/screens/Macros.tsx", "src/screens/Onboarding.tsx", "src/screens/Home.tsx", "src/screens/Coach.tsx"]

key-decisions:
  - "data-sentry-mask on nearest common wrapper div, not individual PII elements"
  - "Alert rule thresholds: 10 events/10min for error spikes, 5 unique users/15min for impact"

patterns-established:
  - "PII masking pattern: add data-sentry-mask to parent container of health/fitness data clusters"

# Metrics
duration: 5min
completed: 2026-02-07
---

# Phase 4 Plan 2: PII Masking and Alert Rules Summary

**data-sentry-mask on 8 health/fitness PII containers across 5 screens, plus Sentry alert rules for error rate spikes and user impact**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-07T15:53:00Z
- **Completed:** 2026-02-07T16:00:57Z
- **Tasks:** 2 (1 auto + 1 checkpoint)
- **Files modified:** 5

## Accomplishments
- Added data-sentry-mask to 8 PII-containing wrapper elements across Settings (weight, email, body metrics), Macros (macro numbers, meal data), Onboarding (weight input), Home (macro progress), and Coach (client health data)
- Alert rules configured in Sentry dashboard: Error Rate Spike (>10 events in 10 minutes) and User Impact (>5 unique users in 15 minutes)
- MON-03 (alert rules for error rate spikes) satisfied
- MON-04 (session replay masks health/fitness PII) satisfied

## Task Commits

Each task was committed atomically:

1. **Task 1: Add data-sentry-mask to all PII-containing elements** - `133a7510` (feat)
2. **Task 2: Verify PII masking + configure Sentry alert rules** - checkpoint (user approved, dashboard config)

## Files Created/Modified
- `src/screens/Settings.tsx` - data-sentry-mask on weight section, email display, body metrics
- `src/screens/Macros.tsx` - data-sentry-mask on macro tracking content area
- `src/screens/Onboarding.tsx` - data-sentry-mask on weight input steps
- `src/screens/Home.tsx` - data-sentry-mask on macro progress summary
- `src/screens/Coach.tsx` - data-sentry-mask on client health data sections

## Decisions Made
- **Wrapper-level masking** -- Added data-sentry-mask to the nearest common parent div containing PII clusters, rather than tagging every individual number. Keeps markup clean and automatically catches child elements.
- **Alert thresholds** -- 10 events/10min for error spikes and 5 unique users/15min for user impact, matching the plan specification for a 90k-user launch audience.

## Deviations from Plan

None -- plan executed exactly as written.

## User Setup Required

**Alert rules were configured during checkpoint:**
- Error Rate Spike: Issues alert, >10 events in 10 minutes, default notification
- User Impact: Issues alert, >5 unique users in 15 minutes, default notification

Both rules are live in the Sentry dashboard. No further setup needed.

## Issues Encountered

None.

## Next Phase Readiness
- Phase 4 (Monitoring Hardening) is now complete -- all 4 MON requirements satisfied
- Sentry is fully configured: tracing, replay, source maps, PII masking, and alert rules
- All 8 milestone plans across 4 phases are complete
- Ready for animation refinement, cleanup, or deployment phases

## Self-Check: PASSED

---
*Phase: 04-monitoring-hardening*
*Completed: 2026-02-07*
