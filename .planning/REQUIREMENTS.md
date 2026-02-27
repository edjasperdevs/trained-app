# Requirements: WellTrained V2

**Defined:** 2026-02-27
**Core Value:** Daily discipline earns visible rank progression -- the app makes consistency feel like leveling up

## v2.0 Requirements

### Design System

- [ ] **DESIGN-01**: App uses Dopamine Noir V2 color tokens (Signal #C8FF00, Background #0A0A0A, Surface #26282B, Foreground #FAFAFA, Muted #A1A1AA)
- [ ] **DESIGN-02**: Primary CTAs use Signal background with Signal FG (dark) text and 0.75rem border radius
- [ ] **DESIGN-03**: Bottom navigation icons are Muted by default, Signal when active
- [ ] **DESIGN-04**: Progress bars use Signal fill on Surface track
- [ ] **DESIGN-05**: Cards use Surface background with Border color, no heavy shadows
- [ ] **DESIGN-06**: Typography hierarchy uses Oswald (display/stats), Inter (body/UI), JetBrains Mono (data/numbers)

### Gamification

- [ ] **GAME-01**: User earns Discipline Points (DP) for daily actions: training (+50), tracked meals (+15), 10k+ steps (+10), hit protein target (+25), 7h+ sleep (+10)
- [ ] **GAME-02**: User progresses through 15 named ranks (Initiate -> Master) based on cumulative DP thresholds
- [ ] **GAME-03**: User selects one of 5 archetypes during onboarding (Bro is free; Himbo, Brute, Pup, Bull are premium)
- [ ] **GAME-04**: Selected archetype applies DP bonus modifiers to specific actions
- [ ] **GAME-05**: User maintains an Obedience Streak by completing at least one core action daily
- [ ] **GAME-06**: User receives daily Protocol Orders (quests) with bonus DP rewards
- [ ] **GAME-07**: User receives weekly Protocol Orders with larger DP rewards (premium only)
- [ ] **GAME-08**: User can view current rank, cumulative DP, and progress toward next rank
- [ ] **GAME-09**: Rank-up triggers a celebration animation and notification

### Avatar

- [ ] **AVATAR-01**: User has an evolving silhouette avatar that reflects rank progression
- [ ] **AVATAR-02**: Avatar changes at 5 rank milestones (stages tied to specific ranks)
- [ ] **AVATAR-03**: Avatar is displayed prominently on the home screen

### Health Tracking

- [ ] **HEALTH-01**: User can view daily step count sourced from HealthKit
- [ ] **HEALTH-02**: User can manually enter daily step count as fallback
- [ ] **HEALTH-03**: User can view sleep duration sourced from HealthKit
- [ ] **HEALTH-04**: User can manually enter sleep duration as fallback
- [ ] **HEALTH-05**: Steps (10k+) and sleep (7h+) thresholds trigger DP awards
- [ ] **HEALTH-06**: App requests HealthKit permissions contextually (not during onboarding)
- [ ] **HEALTH-07**: App handles HealthKit permission denial gracefully with manual-only fallback

### Subscriptions

- [ ] **SUB-01**: App integrates RevenueCat SDK for iOS in-app purchase subscriptions
- [ ] **SUB-02**: User sees a paywall presenting subscription tiers (monthly and annual)
- [ ] **SUB-03**: Premium features gated behind active subscription (specialized archetypes, avatar evolution, weekly quests, advanced analytics)
- [ ] **SUB-04**: User can restore previous purchases
- [ ] **SUB-05**: Subscription entitlement status persists across app restarts
- [ ] **SUB-06**: Paywall displays all Apple-required subscription transparency text
- [ ] **SUB-07**: User can manage subscription from Settings screen

### Coach Stripping

- [ ] **STRIP-01**: Coach.tsx screen, 4 coach hooks, and 4 coach-specific components removed
- [ ] **STRIP-02**: /coach route and CoachGuard component removed
- [ ] **STRIP-03**: pullCoachData() sync preserved for clients receiving coach-assigned data
- [ ] **STRIP-04**: set_by:'coach' macro target handling preserved in macroStore and sync
- [ ] **STRIP-05**: Weekly check-in submission flow preserved
- [ ] **STRIP-06**: Assigned workout display and "Assigned by Coach" badge preserved
- [ ] **STRIP-07**: isCoach() helper, coach nav link, and coach-only Settings UI removed

### Data Migration

- [ ] **DATA-01**: V2 update displays "Fresh Start" message acknowledging XP/level reset
- [ ] **DATA-02**: All users begin at Rank 1 (Initiate) with 0 DP on V2
- [ ] **DATA-03**: Old xpStore localStorage data cleaned up without breaking app state
- [ ] **DATA-04**: Existing workout, macro, weight, and profile data fully preserved

### App Store

- [ ] **LAUNCH-01**: App passes Apple App Review with subscription IAP products
- [ ] **LAUNCH-02**: PrivacyInfo.xcprivacy updated for HealthKit data types
- [ ] **LAUNCH-03**: App Store metadata, screenshots, and description prepared for submission
- [ ] **LAUNCH-04**: AASA file updated with actual Apple Team ID (when approved)

## Future Requirements (v2.1+)

### Gamification Enhancements

- **GAME-10**: Obedience Streak multiplier amplifies DP earnings on long streaks
- **GAME-11**: PR tracking awards +50 DP for Bull archetype personal records

### Premium Enhancements

- **SUB-08**: Premium custom app themes and icons
- **SUB-09**: Advanced visual progress reports and analytics dashboard

### Platform

- **PLAT-01**: Android / Google Play Store distribution
- **PLAT-02**: Web-only subscription path (non-IAP)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Android / Play Store | iOS only for V2, reduces scope |
| Light mode | Dark-only brand identity |
| Community leaderboard | Potential V3, not needed for launch |
| Streak multiplier | Spec says "future phase" -- deferred to v2.1 |
| Custom themes / icons | Premium feature deferred to post-launch |
| AI workout generation | Coach expertise is the product |
| Multi-coach / teams | Single-coach app |
| Chat / messaging | Check-in responses cover communication needs |
| Marketing site | App only |
| Coach dashboard in-app | Moved to welltrained-coach |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DESIGN-01 | Phase 17 | Pending |
| DESIGN-02 | Phase 17 | Pending |
| DESIGN-03 | Phase 17 | Pending |
| DESIGN-04 | Phase 17 | Pending |
| DESIGN-05 | Phase 17 | Pending |
| DESIGN-06 | Phase 17 | Pending |
| GAME-01 | Phase 18 | Pending |
| GAME-02 | Phase 18 | Pending |
| GAME-03 | Phase 21 | Pending |
| GAME-04 | Phase 21 | Pending |
| GAME-05 | Phase 18 | Pending |
| GAME-06 | Phase 22 | Pending |
| GAME-07 | Phase 22 | Pending |
| GAME-08 | Phase 18 | Pending |
| GAME-09 | Phase 18 | Pending |
| AVATAR-01 | Phase 23 | Pending |
| AVATAR-02 | Phase 23 | Pending |
| AVATAR-03 | Phase 23 | Pending |
| HEALTH-01 | Phase 20 | Pending |
| HEALTH-02 | Phase 20 | Pending |
| HEALTH-03 | Phase 20 | Pending |
| HEALTH-04 | Phase 20 | Pending |
| HEALTH-05 | Phase 20 | Pending |
| HEALTH-06 | Phase 20 | Pending |
| HEALTH-07 | Phase 20 | Pending |
| SUB-01 | Phase 19 | Pending |
| SUB-02 | Phase 19 | Pending |
| SUB-03 | Phase 19 | Pending |
| SUB-04 | Phase 19 | Pending |
| SUB-05 | Phase 19 | Pending |
| SUB-06 | Phase 19 | Pending |
| SUB-07 | Phase 19 | Pending |
| STRIP-01 | Phase 17 | Pending |
| STRIP-02 | Phase 17 | Pending |
| STRIP-03 | Phase 17 | Pending |
| STRIP-04 | Phase 17 | Pending |
| STRIP-05 | Phase 17 | Pending |
| STRIP-06 | Phase 17 | Pending |
| STRIP-07 | Phase 17 | Pending |
| DATA-01 | Phase 24 | Pending |
| DATA-02 | Phase 24 | Pending |
| DATA-03 | Phase 24 | Pending |
| DATA-04 | Phase 24 | Pending |
| LAUNCH-01 | Phase 24 | Pending |
| LAUNCH-02 | Phase 24 | Pending |
| LAUNCH-03 | Phase 24 | Pending |
| LAUNCH-04 | Phase 24 | Pending |

**Coverage:**
- v2.0 requirements: 47 total
- Mapped to phases: 47
- Unmapped: 0

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 -- traceability populated during roadmap creation*
