# Requirements: Trained MVP Launch Polish

**Defined:** 2026-02-04
**Core Value:** First impression must be flawless - no broken flows, confusing UX, or visual jank

## v1 Requirements

Requirements for launch to 90k fitness enthusiast followers.

### Audit

- [ ] **AUDIT-01**: Complete full user journey test (access -> onboarding -> workout -> macros -> XP claim)

### Performance

- [ ] **PERF-01**: Implement route lazy loading and vendor chunk splitting
- [ ] **PERF-02**: Switch service worker from autoUpdate to prompt mode with update banner
- [ ] **PERF-03**: Achieve Lighthouse scores >90 (Performance, Accessibility, PWA)
- [ ] **PERF-04**: Add runtime caching for Supabase API calls

### UX Polish

- [ ] **UX-01**: Replace loading spinners with skeleton placeholders
- [ ] **UX-02**: Add actionable empty states for all data-dependent screens
- [ ] **UX-03**: Improve error messages to be user-friendly and explain fixes
- [ ] **UX-04**: Add haptic feedback on key actions
- [ ] **UX-05**: Add progress indicator to onboarding flow

### Resilience

- [ ] **RES-01**: Implement graceful degradation for network failures
- [ ] **RES-02**: Add food API fallback when rate limited
- [ ] **RES-03**: Implement sync retry logic for failed cloud syncs

### Launch Prep

- [ ] **LAUNCH-01**: Set up Supabase monitoring and alerts
- [ ] **LAUNCH-02**: Create marketing screenshots (App Store-style)
- [ ] **LAUNCH-03**: Create OG images for social media sharing

## v2 Requirements

Deferred to post-launch or design refresh project.

### Design Refresh
- **DESIGN-01**: Explore Equinox/luxury gym aesthetic
- **DESIGN-02**: New color palette (darker, cleaner, more masculine)
- **DESIGN-03**: Typography refresh
- **DESIGN-04**: Component library redesign

### Extended Testing
- **TEST-01**: Device matrix testing (iOS Safari, Android Chrome, desktop)
- **TEST-02**: Comprehensive offline mode testing
- **TEST-03**: Cross-device sync testing
- **TEST-04**: Load testing at 10x expected volume

### Documentation
- **DOC-01**: FAQ for common questions
- **DOC-02**: Support response templates
- **DOC-03**: Known issues documentation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Coach dashboard polish | Client experience only for this launch |
| New features | Polish existing, don't add complexity |
| GYG theme polish | Trained theme only |
| Full design redesign | Deferred to next project |
| Comprehensive QA | Time-boxed audit, not full QA cycle |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 1: Audit & Discovery | Pending |
| PERF-01 | Phase 2: Performance Foundation | Pending |
| PERF-02 | Phase 2: Performance Foundation | Pending |
| PERF-03 | Phase 2: Performance Foundation | Pending |
| PERF-04 | Phase 2: Performance Foundation | Pending |
| UX-01 | Phase 3: UX Polish | Pending |
| UX-02 | Phase 3: UX Polish | Pending |
| UX-03 | Phase 3: UX Polish | Pending |
| UX-04 | Phase 3: UX Polish | Pending |
| UX-05 | Phase 3: UX Polish | Pending |
| RES-01 | Phase 4: Resilience Hardening | Pending |
| RES-02 | Phase 4: Resilience Hardening | Pending |
| RES-03 | Phase 4: Resilience Hardening | Pending |
| LAUNCH-01 | Phase 5: Launch Preparation | Pending |
| LAUNCH-02 | Phase 5: Launch Preparation | Pending |
| LAUNCH-03 | Phase 5: Launch Preparation | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-02-04*
*Last updated: 2026-02-04 - Traceability completed*
