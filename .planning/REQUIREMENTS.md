# Requirements: Trained Pre-Launch Confidence

**Defined:** 2026-02-06
**Core Value:** When this launches to 90k people, nothing is broken and you can see exactly how they're using it

## Previous Milestones -- Complete

### Launch Polish (v1.0) -- 16 requirements delivered
### Design Refresh (v1.1) -- 25 requirements delivered

See archived milestones for details.

## v1 Requirements

Requirements for pre-launch confidence -- E2E testing, analytics enhancement, and monitoring hardening.

### Test Repair

- [x] **TEST-01**: Existing unit/component tests pass after design refresh (`vitest run` green)
- [x] **TEST-02**: `tsc --noEmit` passes with zero type errors

### E2E Infrastructure

- [x] **E2E-01**: Playwright installed and configured with Vite dev server integration
- [x] **E2E-02**: `data-testid` attributes added to all interactive elements across screens
- [x] **E2E-03**: Auth fixture seeds localStorage with valid Zustand store state (bypasses UI login)
- [x] **E2E-04**: Test isolation clears localStorage between tests (no state leakage)

### E2E Critical Journeys

- [ ] **E2E-05**: E2E test covers access gate → sign up → onboarding → home screen
- [ ] **E2E-06**: E2E test covers sign in → home screen with existing data
- [ ] **E2E-07**: E2E test covers full workout logging flow (add exercise, log sets, save)
- [ ] **E2E-08**: E2E test covers meal logging flow (search food, add entry, view macros)
- [ ] **E2E-09**: E2E test covers daily check-in and streak maintenance
- [ ] **E2E-10**: E2E test covers weekly XP claim ritual
- [ ] **E2E-11**: E2E test covers offline → online sync cycle (service worker blocked, localStorage persists, sync triggers on reconnect)

### Analytics Enhancement

- [ ] **ANLYT-01**: Event naming convention documented and applied to all existing + new events
- [ ] **ANLYT-02**: All 14 unwired Plausible events connected to their corresponding screens/actions
- [ ] **ANLYT-03**: SPA pageview tracking fires on route changes (not just initial load)
- [ ] **ANLYT-04**: Funnel definitions documented: sign up → onboarding complete → first workout → 7-day retention

### Monitoring Hardening

- [ ] **MON-01**: Sentry `browserTracingIntegration()` activated (captures page load performance + Web Vitals)
- [ ] **MON-02**: Source maps uploaded to Sentry (readable stack traces in production)
- [ ] **MON-03**: Alert rules configured for error rate spikes post-launch
- [ ] **MON-04**: Session replay masks health/fitness PII (body weight, meals, body metrics)

## Future Requirements

Deferred to post-launch.

### Advanced Visual
- **ADV-01**: OKLCH color space conversion
- **ADV-02**: Circular progress gauges (Whoop-style strain/recovery dials)
- **ADV-03**: Icon library evaluation (Phosphor thin weight)
- **ADV-04**: Storybook for component documentation

### Extended Testing
- **XTEST-01**: Cross-browser matrix (Chromium, WebKit, Firefox) in CI
- **XTEST-02**: CI pipeline integration (GitHub Actions + Playwright)
- **XTEST-03**: WCAG AAA contrast compliance (beyond AA)

### Advanced Monitoring
- **XMON-01**: Custom Sentry spans on sync/API operations
- **XMON-02**: Breadcrumb trail enhancement
- **XMON-03**: Web Vitals reporting via Plausible custom events

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cross-browser CI matrix | Complexity for launch; run locally on Chromium first |
| Web Vitals via Plausible | Sentry browserTracingIntegration captures these already |
| Custom Sentry spans | Over-instrumentation pre-launch; add based on real issues |
| A/B testing infrastructure | Premature for initial launch |
| Custom analytics backend | Plausible + Sentry sufficient |
| New features or functionality | Testing and observability only |
| Light mode | Dark-only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01 | Phase 1 | Complete |
| TEST-02 | Phase 1 | Complete |
| E2E-01 | Phase 1 | Complete |
| E2E-02 | Phase 1 | Complete |
| E2E-03 | Phase 1 | Complete |
| E2E-04 | Phase 1 | Complete |
| E2E-05 | Phase 2 | Pending |
| E2E-06 | Phase 2 | Pending |
| E2E-07 | Phase 2 | Pending |
| E2E-08 | Phase 2 | Pending |
| E2E-09 | Phase 2 | Pending |
| E2E-10 | Phase 2 | Pending |
| E2E-11 | Phase 2 | Pending |
| ANLYT-01 | Phase 3 | Pending |
| ANLYT-02 | Phase 3 | Pending |
| ANLYT-03 | Phase 3 | Pending |
| ANLYT-04 | Phase 3 | Pending |
| MON-01 | Phase 4 | Pending |
| MON-02 | Phase 4 | Pending |
| MON-03 | Phase 4 | Pending |
| MON-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-02-06*
*Last updated: 2026-02-07 after Phase 1 completion*
