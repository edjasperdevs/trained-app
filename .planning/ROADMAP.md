# Roadmap: Trained

## Milestones

- v1.0 Launch Polish (Phases 1-5, shipped 2026-02-04)
- v1.1 Design Refresh (7 phases, shipped 2026-02-05)
- v1.2 Pre-Launch Confidence (4 phases, shipped 2026-02-07)
- v1.3 Coach Dashboard (Phases 1-6, shipped 2026-02-08)
- v1.4 Intake Dashboard (Phases 7-10, shipped 2026-02-21)
- v1.5 Native iOS App (Phases 11-16, closed 2026-02-27)
- **v2.0 WellTrained V2** (Phases 17-24, in progress)

## v2.0 WellTrained V2

**Milestone Goal:** Complete app revamp -- new Dopamine Noir V2 design system (lime signal #C8FF00), Discipline Points / 15-rank progression replacing XP/levels, 5 archetypes with DP modifiers, HealthKit steps and sleep tracking, freemium subscription via RevenueCat, coach dashboard stripped to welltrained-coach, and App Store submission.

### Phases

- [x] **Phase 17: Foundation Cleanup** - Strip coach dashboard and migrate to Dopamine Noir V2 design tokens
- [x] **Phase 18: Gamification Engine** - Discipline Points store, 15-rank progression, rank-up celebrations, Obedience Streak
- [ ] **Phase 19: Subscriptions** - RevenueCat integration, paywall, premium entitlement gating, webhook backend
- [ ] **Phase 20: Health Tracking** - HealthKit steps and sleep with manual fallback, DP awards for health actions
- [ ] **Phase 21: Archetypes** - 5-archetype system with DP modifiers, premium gating, onboarding integration
- [ ] **Phase 22: Protocol Orders** - Daily and weekly quests with bonus DP rewards
- [ ] **Phase 23: Avatar Evolution** - 5-stage evolving silhouette tied to rank milestones
- [ ] **Phase 24: App Store Submission** - Data migration, compliance, TestFlight, App Store review

## Phase Details

### Phase 17: Foundation Cleanup
**Goal**: The codebase is stripped of all coach dashboard code and the entire app renders with the Dopamine Noir V2 color system -- every subsequent phase builds on a clean, V2-branded foundation
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: STRIP-01, STRIP-02, STRIP-03, STRIP-04, STRIP-05, STRIP-06, STRIP-07, DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05, DESIGN-06
**Success Criteria** (what must be TRUE):
  1. The /coach route returns a 404 or redirects -- no coach dashboard exists in the app
  2. Coach-assigned workout display and "Assigned by Coach" badge still appear for clients who have coach-assigned data
  3. Weekly check-in submission flow works identically to before the coach code removal
  4. All screens use lime (#C8FF00) signal color instead of red, with dark background (#0A0A0A), and the three-font typography hierarchy (Oswald/Inter/JetBrains Mono)
  5. `tsc --noEmit` passes with zero errors after all coach code removal
**Plans**: 2 plans

Plans:
- [x] 17-01-PLAN.md — Coach code removal (delete 7 coach-only files, fix imports/exports, clean shared files, trim useWeeklyCheckins)
- [x] 17-02-PLAN.md — Dopamine Noir V2 design token migration (CSS tokens, hard-coded colors, visual verification)

### Phase 18: Gamification Engine
**Goal**: Users earn Discipline Points for daily actions and progress through a 15-rank system with visible progression and celebration -- the core motivation loop that replaces XP/levels
**Depends on**: Phase 17 (V2 design tokens must exist for all new UI)
**Requirements**: GAME-01, GAME-02, GAME-05, GAME-08, GAME-09
**Success Criteria** (what must be TRUE):
  1. User earns DP from completing a workout (+50), tracking a meal (+15), hitting protein target (+25), and checking in (streak maintained)
  2. User can see their current rank name, cumulative DP total, and a progress bar toward the next rank on the home screen
  3. When a user accumulates enough DP to reach a new rank, a celebration animation plays and a notification appears
  4. User maintains an Obedience Streak counter by completing at least one core action daily, visible on the home screen
**Plans**: 3 plans

Plans:
- [x] 18-01-PLAN.md — TDD dpStore (DP accrual, 15-rank system, obedience streak, meal cap) + migrate all store-level xpStore consumers
- [x] 18-02-PLAN.md — DPDisplay and RankUpModal components, Home/Workouts/CheckInModal DP wiring, StreakDisplay/WeeklySummary/AvatarScreen migration
- [ ] 18-03-PLAN.md — Gap closure: Add RankUpModal handling to Macros.tsx meal-log paths

### Phase 19: Subscriptions
**Goal**: The app has a working freemium model -- free users see a compelling paywall, subscribers unlock premium features, and subscription state persists reliably across sessions and app restarts
**Depends on**: Phase 17 (V2 design tokens), Phase 18 (dpStore must exist for premium feature gating context)
**Requirements**: SUB-01, SUB-02, SUB-03, SUB-04, SUB-05, SUB-06, SUB-07
**Success Criteria** (what must be TRUE):
  1. User sees a paywall screen presenting monthly and annual subscription options with all Apple-required legal text (auto-renewal terms, pricing, privacy policy link, EULA link)
  2. User can complete a subscription purchase via iOS in-app purchase and immediately access premium features
  3. User can tap "Restore Purchases" on both the paywall and the Settings screen to recover a previous subscription
  4. Premium entitlement status persists across app restarts without requiring network calls (cached locally)
  5. User can view and manage their subscription status from the Settings screen
**Plans**: TBD

Plans:
- [ ] 19-01: RevenueCat SDK setup, subscriptionStore, loading gate, Xcode entitlements
- [ ] 19-02: Paywall screen with legal text, restore purchases, Settings subscription management
- [ ] 19-03: handle-revenuecat-webhook Edge Function, subscriptions Supabase table, RLS policies

### Phase 20: Health Tracking
**Goal**: Users can track daily steps and sleep -- automatically from HealthKit or manually -- and earn DP for meeting health thresholds
**Depends on**: Phase 18 (dpStore must exist to award DP for steps/sleep)
**Requirements**: HEALTH-01, HEALTH-02, HEALTH-03, HEALTH-04, HEALTH-05, HEALTH-06, HEALTH-07
**Success Criteria** (what must be TRUE):
  1. User who grants HealthKit permission sees their daily step count auto-populated from Health data
  2. User who grants HealthKit permission sees their sleep duration auto-populated from Health data
  3. User who denies HealthKit (or is on web) can manually enter steps and sleep and the app works identically
  4. User earns +10 DP when steps exceed 10,000 and +10 DP when sleep exceeds 7 hours
  5. App shows an explanatory screen before requesting HealthKit permission (soft-ask pattern), and handles denial gracefully without re-prompting
**Plans**: TBD

Plans:
- [ ] 20-01: healthStore, HealthKit plugin setup, soft-ask permission screen, steps and sleep reading
- [ ] 20-02: Manual entry fallback UI, DP award integration, daily_health Supabase table

### Phase 21: Archetypes
**Goal**: Users select a personal archetype that modifies how they earn DP -- free users get Bro (generalist), premium subscribers unlock 4 specialized archetypes that boost specific actions
**Depends on**: Phase 18 (dpStore for modifier application), Phase 19 (subscriptionStore for premium gating)
**Requirements**: GAME-03, GAME-04
**Success Criteria** (what must be TRUE):
  1. User selects an archetype during onboarding (Bro available to all; Himbo, Brute, Pup, Bull shown but locked for free users)
  2. Selected archetype applies visible DP bonus modifiers to specific actions (e.g., Himbo boosts training DP)
  3. User can change their archetype from Settings (premium archetypes require active subscription)
  4. Archetype selection and modifier effects are clearly communicated in the UI so users understand the upgrade incentive
**Plans**: TBD

Plans:
- [ ] 21-01: Archetype data model, selection UI (onboarding + settings), premium gating
- [ ] 21-02: DP modifier logic in dpStore, archetype visualization, Supabase profile column

### Phase 22: Protocol Orders
**Goal**: Users receive rotating daily and weekly quests that award bonus DP -- an engagement layer that gives users specific goals beyond their routine
**Depends on**: Phase 18 (dpStore for DP awards), Phase 19 (subscriptionStore for weekly quest gating), Phase 20 (healthStore for health-related quest evaluation)
**Requirements**: GAME-06, GAME-07
**Success Criteria** (what must be TRUE):
  1. User sees 3 daily Protocol Orders with specific objectives (e.g., "Log 3 meals today") and bonus DP rewards
  2. Completing a quest objective automatically marks it done and awards the bonus DP
  3. Premium subscribers see 2 additional weekly Protocol Orders with larger DP rewards
  4. Quests rotate daily/weekly so users see fresh objectives regularly
**Plans**: TBD

Plans:
- [ ] 22-01: questStore, quest template pool, daily/weekly rotation, progress evaluation
- [ ] 22-02: Protocol Orders UI screen, quest completion tracking, premium weekly quest gating

### Phase 23: Avatar Evolution
**Goal**: Users have an evolving visual avatar that grows more impressive as they rank up -- a premium visual reward that makes progression tangible
**Depends on**: Phase 18 (dpStore.currentRank for stage calculation), Phase 19 (subscriptionStore for premium stage gating)
**Requirements**: AVATAR-01, AVATAR-02, AVATAR-03
**Success Criteria** (what must be TRUE):
  1. User sees their avatar silhouette prominently displayed on the home screen
  2. Avatar visually evolves at 5 rank milestones (ranks 1, 4, 8, 12, 15), with each stage looking more developed
  3. Avatar stages 3-5 are premium-gated -- free users see a locked preview with an upgrade prompt
**Plans**: TBD

Plans:
- [ ] 23-01: Avatar component, 5-stage SVG assets, rank-to-stage mapping, premium gating
- [ ] 23-02: Home screen avatar integration, stage transition animation, locked-preview UI

### Phase 24: App Store Submission
**Goal**: The app passes Apple review and is live on the App Store with V2 features, correct IAP products, and all compliance requirements met
**Depends on**: All previous phases (17-23)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, LAUNCH-01, LAUNCH-02, LAUNCH-03, LAUNCH-04
**Success Criteria** (what must be TRUE):
  1. Existing users see a "Fresh Start" message on V2 update, begin at Rank 1 with 0 DP, and retain all workout/macro/weight/profile data
  2. Old xpStore localStorage data is cleaned up without breaking app state
  3. PrivacyInfo.xcprivacy declares HealthKit and StoreKit API usage
  4. App is live on TestFlight with working sandbox purchases and HealthKit integration
  5. App is submitted to the App Store with screenshots, metadata, IAP products, and review notes
**Plans**: TBD

Plans:
- [ ] 24-01: XP-to-DP data migration (Fresh Start messaging, xpStore cleanup, data preservation verification)
- [ ] 24-02: PrivacyInfo.xcprivacy update, AASA Team ID, Xcode signing, TestFlight build
- [ ] 24-03: App Store Connect metadata, screenshots, IAP product submission, review notes

<details>
<summary>v1.5 Native iOS App (Phases 11-16, closed 2026-02-27)</summary>

### Phase 11: Capacitor Shell
**Goal**: The existing React app runs inside a native iOS shell with no browser chrome, and all WKWebView-incompatible patterns are fixed
**Depends on**: Nothing (first phase of v1.5; builds on existing PWA codebase)
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05
**Plans:** 3/3 plans complete

Plans:
- [x] 11-01-PLAN.md -- Capacitor project setup, platform detection, service worker guard, iOS simulator build
- [x] 11-02-PLAN.md -- Dialog migration (10 window.confirm replacements) and native app lifecycle detection

### Phase 12: Native Polish
**Goal**: The app feels like a native iOS app -- real haptic feedback, native file sharing, branded launch experience, and correct status bar appearance
**Depends on**: Phase 11 (requires working Capacitor shell)
**Requirements**: NATIVE-01, NATIVE-02, NATIVE-03, NATIVE-04, NATIVE-05
**Plans:** 2 plans

Plans:
- [x] 12-01-PLAN.md -- Install Capacitor plugins, configure StatusBar + SplashScreen, replace haptics with @capacitor/haptics
- [x] 12-02-PLAN.md -- Generate branded icon + splash assets, fix storyboard background, implement native data export via share sheet

### Phase 13: Deep Linking + Auth
**Goal**: Universal Links route welltrained.fitness URLs into the app, and Supabase auth flows (password reset) work correctly in the Capacitor context
**Depends on**: Phase 11 (requires Capacitor App plugin for URL listening)
**Requirements**: DEEP-01, DEEP-03
**Plans:** 1 plan

Plans:
- [x] 13-01-PLAN.md -- Universal Links infrastructure (AASA, Vercel config, Xcode entitlements) + deep link handler + password reset screen

### Phase 14: Remote Push Notifications
**Goal**: Clients receive real-time push notifications when the coach takes actions (assigns workout, updates macros, responds to check-in), delivered via direct APNs from Supabase
**Depends on**: Phase 13 (Universal Links needed for push tap deep navigation), Phase 11 (Capacitor shell)
**Requirements**: PUSH-01, PUSH-02, PUSH-03, PUSH-04, PUSH-05, PUSH-06, DEEP-02
**Plans:** 3 plans

Plans:
- [x] 14-01-PLAN.md -- Client-side push infrastructure (plugin, iOS config, device_tokens migration, push.ts module, sign-out cleanup)
- [x] 14-02-PLAN.md -- Server-side APNs Edge Function (JWT helper, send-push webhook handler with coach-action filtering)
- [x] 14-03-PLAN.md -- Integration and verification (wire into App.tsx, contextual permission, end-to-end checkpoint)

### Phase 15: Local Notifications + Engagement
**Goal**: Users receive configurable daily and weekly reminder notifications, streak protection alerts, and see a badge count for pending actions
**Depends on**: Phase 14 (push permission infrastructure and notification handling already established)
**Requirements**: LOCAL-01, LOCAL-02, LOCAL-03, LOCAL-04, LOCAL-05, LOCAL-06, ENGAGE-01, ENGAGE-02
**Plans:** 2 plans

Plans:
- [x] 15-01-PLAN.md -- Install plugins, create notification scheduling + badge modules, extend reminders store with time preferences
- [x] 15-02-PLAN.md -- Settings UI for push notification configuration, App.tsx lifecycle wiring, remove badge from remote push

### Phase 16: App Store Submission
**Goal**: The app is published on the iOS App Store, having passed Apple review with all compliance requirements met
**Depends on**: Phases 11-15 (all features must be working before submission)
**Requirements**: STORE-01, STORE-02, STORE-03, STORE-04, STORE-05, STORE-06
**Plans:** 4 plans (2/4 complete, remaining moved to v2.0 Phase 24)

Plans:
- [x] 16-01-PLAN.md -- Account deletion Edge Function + Settings UI (STORE-01)
- [x] 16-02-PLAN.md -- In-app privacy policy + PrivacyInfo.xcprivacy (STORE-02)
- [ ] 16-03-PLAN.md -- Apple Developer enrollment, Xcode signing, TestFlight (STORE-05) -- moved to v2.0 Phase 24
- [ ] 16-04-PLAN.md -- App Store Connect metadata, screenshots, submission (STORE-03, STORE-04, STORE-06) -- moved to v2.0 Phase 24

</details>

## Progress

**Execution Order:** 17 -> 18 -> 19 -> 20 -> 21 -> 22 -> 23 -> 24

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 11. Capacitor Shell | v1.5 | 2/2 | Complete | 2026-02-22 |
| 12. Native Polish | v1.5 | 2/2 | Complete | 2026-02-22 |
| 13. Deep Linking + Auth | v1.5 | 1/1 | Complete | 2026-02-22 |
| 14. Remote Push Notifications | v1.5 | 3/3 | Complete | 2026-02-22 |
| 15. Local Notifications + Engagement | v1.5 | 2/2 | Complete | 2026-02-22 |
| 16. App Store Submission | v1.5 | 2/4 | Closed | 2026-02-27 |
| 17. Foundation Cleanup | v2.0 | Complete    | 2026-02-27 | 2026-02-27 |
| 18. Gamification Engine | 3/3 | Complete   | 2026-02-28 | - |
| 19. Subscriptions | v2.0 | 0/3 | Not started | - |
| 20. Health Tracking | v2.0 | 0/2 | Not started | - |
| 21. Archetypes | v2.0 | 0/2 | Not started | - |
| 22. Protocol Orders | v2.0 | 0/2 | Not started | - |
| 23. Avatar Evolution | v2.0 | 0/2 | Not started | - |
| 24. App Store Submission | v2.0 | 0/3 | Not started | - |
