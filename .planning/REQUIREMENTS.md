# Requirements: Trained v1.3 Coach Dashboard

**Defined:** 2026-02-07
**Core Value:** The coach can manage every client's training from one place -- programs, macros, check-ins -- and clients see their personalized plans without friction.

## v1.3 Requirements

### Infrastructure

- [x] **INFRA-01**: Coach route (`/coach/*`) is protected -- non-coach users are redirected away
- [x] **INFRA-02**: Data ownership model separates client-owned data (offline-first, push to Supabase) from coach-owned data (server-authoritative, pull from Supabase)
- [x] **INFRA-03**: Sync system is directional -- `pushClientData()` for client-owned, `pullCoachData()` for coach-owned -- preventing coach-set data from being overwritten
- [x] **INFRA-04**: Existing `coach_clients` RLS policy requires `role = 'coach'` to prevent unauthorized coach escalation
- [x] **INFRA-05**: Client roster is paginated with server-side search and sort (handles 90K scale)
- [x] **INFRA-06**: Coach dashboard is lazy-loaded -- zero bundle size impact on client app

### Invitations

- [x] **INVITE-01**: Coach can enter a client's email and send a branded signup invite via Supabase Edge Function + Resend
- [x] **INVITE-02**: Invite status is tracked (pending/accepted/expired) with deduplication (one active invite per email)
- [x] **INVITE-03**: When an invited user signs up, the coach-client relationship is automatically created

### Client Roster

- [x] **ROSTER-01**: Coach sees a list of all enrolled clients with at-a-glance activity summaries (last workout, streak, macro adherence)
- [x] **ROSTER-02**: Coach can drill into a client detail view showing weight history, macro adherence, and activity feed
- [x] **ROSTER-03**: Coach can search clients by name or email

### Workout Programming

- [ ] **PROG-01**: Coach can build a workout for a client on a specific date (select exercises, sets, reps, weight targets)
- [ ] **PROG-02**: Coach can save workouts as reusable templates (build once, assign to many clients)
- [ ] **PROG-03**: Coach can assign a saved template to a client on a specific date
- [ ] **PROG-04**: Client sees coach-assigned workout on the assigned date with "Assigned by Coach" indicator
- [ ] **PROG-05**: Client can log their actual performance against the prescribed workout
- [ ] **PROG-06**: Coach can see prescribed vs actual comparison (what was assigned vs what the client did)

### Macro Management

- [ ] **MACRO-01**: Coach can set a client's daily macro targets (calories, protein, carbs, fat)
- [ ] **MACRO-02**: Coach-set targets override client self-calculated targets with a "Set by Coach" indicator
- [ ] **MACRO-03**: Client sees updated macro targets after coach changes them (on next app open)

### Weekly Check-ins

- [ ] **CHECK-01**: Client can fill out a structured weekly check-in form (16 fields: water/caffeine, hunger, slip-ups, refeed date, digestion, training progress, training feedback, recovery/soreness, sleep quality/hours, stress/stressors, mental health, injuries, cycle status, side effects, bloodwork date, open feedback)
- [ ] **CHECK-02**: Check-in auto-populates app-tracked data for coach review (weight daily/weekly/change, step count, macro target hit rate, cardio from workout logs)
- [ ] **CHECK-03**: Coach sees a list of pending check-ins to review with client name and submission date
- [ ] **CHECK-04**: Coach can review a check-in and add coach notes/response
- [ ] **CHECK-05**: Client can see that their check-in was reviewed and read the coach's response
- [ ] **CHECK-06**: Check-in is surfaced prominently on client home screen when due (not buried in a menu)

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Workout Programming Enhancements

- **PROG-07**: Multi-week program builder (assign a full training block across multiple weeks)
- **PROG-08**: Program duplication (copy a client's program to another client with modifications)
- **PROG-09**: Exercise video links (URL field on exercises for form reference)

### Check-in Enhancements

- **CHECK-07**: Progress photo upload with check-in submission
- **CHECK-08**: Check-in completion awards XP (gamification integration)
- **CHECK-09**: Coach can customize check-in questions per client

### Differentiators

- **DIFF-01**: Training-day vs rest-day macro targets
- **DIFF-02**: Gamification visibility for coach (client XP, badges, avatar evolution on dashboard)
- **DIFF-03**: Streak leaderboard for coach (clients ranked by current streak)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full chat / messaging | Infrastructure-heavy, check-in responses cover 80% of communication needs |
| Intake form | Deferred -- coach can gather intake info through existing channels |
| Progress photos | Requires image upload/storage infrastructure not yet built |
| Multi-coach / team features | Single-coach app -- no multi-tenancy needed |
| Payment / subscription management | Coach uses existing Lemon Squeezy access codes |
| AI workout generation | Coach expertise is the product -- manual builder is sufficient |
| Custom check-in form builder | Single coach uses the same questions every week |
| Push notifications | Requires service worker registration and permission flow -- separate feature |
| Exercise video library | Content project, not software -- coach links external videos |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 3 | Complete |
| INFRA-06 | Phase 1 | Complete |
| INVITE-01 | Phase 2 | Complete |
| INVITE-02 | Phase 2 | Complete |
| INVITE-03 | Phase 2 | Complete |
| ROSTER-01 | Phase 3 | Complete |
| ROSTER-02 | Phase 3 | Complete |
| ROSTER-03 | Phase 3 | Complete |
| PROG-01 | Phase 5 | Pending |
| PROG-02 | Phase 5 | Pending |
| PROG-03 | Phase 5 | Pending |
| PROG-04 | Phase 5 | Pending |
| PROG-05 | Phase 5 | Pending |
| PROG-06 | Phase 5 | Pending |
| MACRO-01 | Phase 4 | Pending |
| MACRO-02 | Phase 4 | Pending |
| MACRO-03 | Phase 4 | Pending |
| CHECK-01 | Phase 6 | Pending |
| CHECK-02 | Phase 6 | Pending |
| CHECK-03 | Phase 6 | Pending |
| CHECK-04 | Phase 6 | Pending |
| CHECK-05 | Phase 6 | Pending |
| CHECK-06 | Phase 6 | Pending |

**Coverage:**
- v1.3 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-07 after roadmap creation*
