# Roadmap: Trained MVP Launch Polish

## Overview

Polish and harden the Trained fitness gamification PWA for launch to 90k fitness enthusiast followers. This roadmap takes the app from unknown current state through audit, performance optimization, UX polish, resilience hardening, and launch preparation. Timeline is this week, requiring ruthless prioritization. Core principle: first impression must be flawless.

**Phases:** 5
**Requirements:** 16 mapped
**Depth:** Standard
**Timeline:** This week

## Phases

- [ ] **Phase 1: Audit & Discovery** - Understand current state before fixing anything
- [ ] **Phase 2: Performance Foundation** - Bundle optimization, service worker, Lighthouse targets
- [ ] **Phase 3: UX Polish** - Loading states, empty states, error messages, haptics
- [ ] **Phase 4: Resilience Hardening** - Network failures, API fallbacks, sync reliability
- [ ] **Phase 5: Launch Preparation** - Monitoring, marketing assets, final verification

## Phase Details

### Phase 1: Audit & Discovery
**Goal:** Understand the current state of the app before making any fixes
**Depends on:** Nothing (first phase)
**Requirements:** AUDIT-01
**Success Criteria** (what must be TRUE):
1. Full user journey tested (access code -> onboarding -> workout -> macros -> XP claim)
2. All critical bugs documented with severity and location
3. PWA install flow verified on iOS Safari and Android Chrome
4. Offline mode tested (app loads from cache, data persists)
5. Issue backlog prioritized for remaining phases
**Plans:** 1 plan

Plans:
- [ ] 01-01-PLAN.md - Full user journey audit with checklist, bug log, and prioritized backlog

---

### Phase 2: Performance Foundation
**Goal:** App loads fast and updates reliably without trapping users on broken versions
**Depends on:** Phase 1
**Requirements:** PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
1. Routes lazy load (Home, Workouts, Macros load on demand, not in initial bundle)
2. Service worker uses prompt mode with visible update banner
3. Lighthouse Performance score exceeds 90
4. Lighthouse Accessibility score exceeds 90
5. Supabase API calls cache with NetworkFirst strategy
**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md -- Supabase API caching, viewport fix, color contrast accessibility fixes
- [ ] 02-02-PLAN.md -- Lighthouse verification and human sign-off

---

### Phase 3: UX Polish
**Goal:** App feels premium with smooth loading states, helpful empty states, and clear feedback
**Depends on:** Phase 2
**Requirements:** UX-01, UX-02, UX-03, UX-04, UX-05
**Success Criteria** (what must be TRUE):
1. All data-loading screens show skeleton placeholders instead of spinners
2. Empty states for workouts, macros, and achievements show helpful actions
3. Error messages explain what went wrong and how to fix it
4. Key actions (set completion, workout finish) provide haptic feedback
5. Onboarding shows clear progress indicator (step X of Y)
**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md -- Screen-specific skeleton loading states replacing generic spinner
- [ ] 03-02-PLAN.md -- Reusable EmptyState component, error message improvements
- [ ] 03-03-PLAN.md -- Haptic feedback on key actions, onboarding progress indicator

---

### Phase 4: Resilience Hardening
**Goal:** App works reliably even when network fails, APIs rate limit, or sync conflicts occur
**Depends on:** Phase 3
**Requirements:** RES-01, RES-02, RES-03
**Success Criteria** (what must be TRUE):
1. Workout logging works completely offline with "saved locally" feedback
2. Food search falls back to Open Food Facts when USDA rate limits
3. Failed cloud syncs retry automatically with exponential backoff
4. User sees clear sync status indicator (synced/syncing/offline)
**Plans:** TBD

Plans:
- [ ] 04-01: Graceful network failure handling
- [ ] 04-02: Food API fallback implementation
- [ ] 04-03: Sync retry logic with status indicator

---

### Phase 5: Launch Preparation
**Goal:** Monitoring in place and marketing assets ready for launch announcement
**Depends on:** Phase 4
**Requirements:** LAUNCH-01, LAUNCH-02, LAUNCH-03
**Success Criteria** (what must be TRUE):
1. Supabase dashboard shows alerts for connection limits, query latency, auth errors
2. App Store-style marketing screenshots exist for key screens
3. OG images configured for social media link previews
4. Pre-launch checklist completed (all critical items pass)
**Plans:** TBD

Plans:
- [ ] 05-01: Supabase monitoring and alerts
- [ ] 05-02: Marketing screenshots
- [ ] 05-03: OG images for social sharing

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Audit & Discovery | 1/1 | Complete | 2026-02-04 |
| 2. Performance Foundation | 2/2 | Complete | 2026-02-05 |
| 3. UX Polish | 3/3 | Complete | 2026-02-05 |
| 4. Resilience Hardening | 0/3 | Not started | - |
| 5. Launch Preparation | 0/3 | Not started | - |

---

*Roadmap created: 2026-02-04*
*Depth: Standard (5 phases)*
*Coverage: 16/16 v1 requirements mapped*
