# Roadmap: Trained

## Milestones

- v1.0 Launch Polish (Phases 1-5, shipped 2026-02-04)
- v1.1 Design Refresh (7 phases, shipped 2026-02-05)
- v1.2 Pre-Launch Confidence (4 phases, shipped 2026-02-07)
- v1.3 Coach Dashboard (Phases 1-6, shipped 2026-02-08)
- v1.4 Intake Dashboard (Phases 7-10, shipped 2026-02-21)
- v1.5 Native iOS App (Phases 11-16, closed 2026-02-27)
- v2.0 WellTrained V2 (Phases 17-24, in progress)
- **v2.1 Onboarding Redesign** (Phases 25-29, in progress)

## v2.1 Onboarding Redesign

**Milestone Goal:** Complete 8-screen onboarding flow with value-first approach, Obsidian styling, paywall after investment, and reverse trial for non-subscribers. Replace existing 10-step wizard with conversion-optimized journey.

### Phases

- [x] **Phase 25: Onboarding Navigation** - OnboardingStack infrastructure and routing gate (completed 2026-03-06)
- [x] **Phase 26: Welcome and Value** - Welcome screen with brand hook, Value Proposition with benefit rows, progress indicator (completed 2026-03-06)
- [x] **Phase 27: Profile and Goal** - Profile Setup (name, units, training days, fitness level) and Goal Selection (4 cards) (completed 2026-03-06)
- [x] **Phase 28: Archetype and Macros** - Archetype Selection (5 cards with premium badges) and Macro Setup (donut chart, calculated targets) (completed 2026-03-06)
- [x] **Phase 29: Paywall and Entry** - Paywall with reverse trial and Welcome to Protocol cinematic entry (completed 2026-03-06)

## Phase Details

### Phase 25: Onboarding Navigation
**Goal**: The app correctly routes new users through the onboarding stack and existing users to the main tab navigator -- the foundation that all onboarding screens render within
**Depends on**: Nothing (first phase of v2.1; uses existing routing patterns)
**Requirements**: NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. User who has not completed onboarding sees OnboardingStack instead of main tabs
  2. User who has completed onboarding sees MainTabNavigator and never sees onboarding screens
  3. Onboarding screens can navigate forward through the 8-screen flow without affecting main app routes
**Plans**: 1 plan

Plans:
- [ ] 25-01-PLAN.md -- OnboardingStack infrastructure, onboardingStore, App.tsx routing gate

### Phase 26: Welcome and Value
**Goal**: Users see a compelling brand hook and understand the discipline system before entering any personal data -- the value-first screens that set the emotional context
**Depends on**: Phase 25 (OnboardingStack must exist to render these screens)
**Requirements**: WELC-01, WELC-02, WELC-03, WELC-04, WELC-05, VALU-01, VALU-02, VALU-03, VALU-04, PROG-01, PROG-02, PROG-03
**Success Criteria** (what must be TRUE):
  1. User sees Welcome screen with brand mark, wordmark, headline, and "BEGIN PROTOCOL" CTA on app launch (when not onboarded)
  2. User can tap "Already initiated? Sign In" to navigate to sign-in screen
  3. User sees Value Proposition screen with headline and three animated benefit rows explaining DP, ranks, and avatar
  4. Progress indicator shows 5 dots on screens 2-6 with current step highlighted in gold
  5. Welcome screen elements animate with staggered fade-up, CTA pulses after 2 seconds
**Plans**: 2 plans

Plans:
- [x] 26-01-PLAN.md -- Welcome screen with brand hook, animations, and navigation CTAs
- [ ] 26-02-PLAN.md -- Value Proposition screen with benefit rows, ProgressIndicator component

### Phase 27: Profile and Goal
**Goal**: Users provide their profile information and select their training goal -- the data collection screens that personalize the experience
**Depends on**: Phase 26 (navigation flow must reach these screens)
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06, PROF-07, PROF-08, GOAL-01, GOAL-02, GOAL-03, GOAL-04, GOAL-05, GOAL-06, GOAL-07
**Success Criteria** (what must be TRUE):
  1. User can enter name, toggle LBS/KG units, select training days (2-6), and select fitness level on Profile Setup screen
  2. Selected chips and cards show gold border with subtle gold background tint, selections trigger haptic feedback
  3. CONTINUE button is disabled until name has at least one character
  4. User can select one of 4 goal cards (Build Muscle, Lose Fat, Get Stronger, Improve Fitness) with gold border animation
  5. Selected goal is stored in user profile store for macro calculation
**Plans**: 2 plans

Plans:
- [ ] 27-01-PLAN.md -- ProfileScreen with name, units, training days, fitness level inputs
- [ ] 27-02-PLAN.md -- GoalScreen with 4 goal cards and gold selection animation

### Phase 28: Archetype and Macros
**Goal**: Users choose their archetype specialization and see calculated macro targets -- the screens that show premium value and personalized results
**Depends on**: Phase 27 (goal selection needed for macro calculation)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, ARCH-07, MACR-01, MACR-02, MACR-03, MACR-04, MACR-05, MACR-06, MACR-07, MACR-08, MACR-09
**Reference**: `Design inspo/mockups/onboarding/onboarding_05_archetype_v2.png`, `Design inspo/mockups/onboarding/onboarding_06_macros.png`
**Success Criteria** (what must be TRUE):
  1. User sees 5 archetype cards with Bro (FREE, selected by default), 3 premium archetypes, and Bull (COMING SOON, dimmed)
  2. User can select any archetype including premium ones (gate happens at paywall, not here)
  3. User sees calculated daily macro targets based on profile inputs with animated donut chart (800ms draw effect)
  4. Three macro stat cards (protein, carbs, fat) count up from 0 after chart completes (600ms)
  5. Calculated macros are stored in macroStore when user taps "ACCEPT MY PROTOCOL"
**Plans**: 2 plans

Plans:
- [ ] 28-01-PLAN.md -- ArchetypeScreen with 5 archetype cards, badges (FREE/PREMIUM/COMING SOON), default Bro selection
- [ ] 28-02-PLAN.md -- MacrosScreen with animated donut chart, count-up stat cards, macroStore integration

### Phase 29: Paywall and Entry
**Goal**: Users see the premium offering and make a subscription decision, then enter the app with a cinematic welcome -- the conversion and onboarding completion screens
**Depends on**: Phase 28 (profile data needed for paywall context, macros stored)
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08, FINAL-01, FINAL-02, FINAL-03, FINAL-04, FINAL-05, FINAL-06, FINAL-07, FINAL-08
**Success Criteria** (what must be TRUE):
  1. User sees paywall with monthly option (gold border, MOST POPULAR) and annual option after completing profile setup
  2. User can tap "START FREE TRIAL" to initiate RevenueCat purchase or "Continue with free access" to skip
  3. Skipping paywall grants 7-day free Premium trial automatically (reverse trial)
  4. User sees Welcome to Protocol screen with avatar fade-in, rank card slide-up, and "ENTER THE DISCIPLINE" CTA
  5. Tapping CTA navigates to Home tab, clears onboarding from navigation history, and sets onboardingComplete to true
**Plans**: 2 plans

Plans:
- [ ] 29-01-PLAN.md -- PaywallScreen with subscription options, reverse trial on skip, premium bypass
- [ ] 29-02-PLAN.md -- FinalScreen (Welcome to Protocol) with avatar fade-in, rank card, and entry CTA

## v2.0 WellTrained V2

**Milestone Goal:** Complete app revamp -- new Dopamine Noir V2 design system (lime signal #C8FF00), Discipline Points / 15-rank progression replacing XP/levels, 5 archetypes with DP modifiers, HealthKit steps and sleep tracking, freemium subscription via RevenueCat, coach dashboard stripped to welltrained-coach, and App Store submission.

### Phases

- [x] **Phase 17: Foundation Cleanup** - Strip coach dashboard and migrate to Dopamine Noir V2 design tokens
- [x] **Phase 18: Gamification Engine** - Discipline Points store, 15-rank progression, rank-up celebrations, Obedience Streak
- [x] **Phase 19: Subscriptions** - RevenueCat integration, paywall, premium entitlement gating, webhook backend (completed 2026-02-28)
- [x] **Phase 20: Health Tracking** - HealthKit steps and sleep with manual fallback, DP awards for health actions (completed 2026-02-28)
- [x] **Phase 21: Archetypes** - 5-archetype system with DP modifiers, premium gating, onboarding integration (completed 2026-02-28)
- [x] **Phase 22: Protocol Orders** - Daily and weekly quests with bonus DP rewards (completed 2026-02-28)
- [x] **Phase 23: Avatar Evolution** - 5-stage evolving silhouette tied to rank milestones (completed 2026-03-01)
- [ ] **Phase 24: App Store Submission** - Data migration, compliance, TestFlight, App Store review

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
- [x] 17-01-PLAN.md -- Coach code removal (delete 7 coach-only files, fix imports/exports, clean shared files, trim useWeeklyCheckins)
- [x] 17-02-PLAN.md -- Dopamine Noir V2 design token migration (CSS tokens, hard-coded colors, visual verification)

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
- [x] 18-01-PLAN.md -- TDD dpStore (DP accrual, 15-rank system, obedience streak, meal cap) + migrate all store-level xpStore consumers
- [x] 18-02-PLAN.md -- DPDisplay and RankUpModal components, Home/Workouts/CheckInModal DP wiring, StreakDisplay/WeeklySummary/AvatarScreen migration
- [x] 18-03-PLAN.md -- Gap closure: Add RankUpModal handling to Macros.tsx meal-log paths

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
**Plans**: 4 plans

Plans:
- [x] 19-01-PLAN.md -- RevenueCat SDK setup, subscriptionStore, loading gate, Xcode entitlements
- [x] 19-02-PLAN.md -- Paywall screen with legal text, restore purchases, Settings subscription management
- [x] 19-03-PLAN.md -- handle-revenuecat-webhook Edge Function, subscriptions Supabase table, RLS policies
- [x] 19-04-PLAN.md -- PremiumGate component and UpgradePrompt fallback for client-side feature gating

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
**Plans**: 2 plans

Plans:
- [x] 20-01-PLAN.md -- HealthKit plugin setup, health.ts wrapper, healthStore, iOS entitlements
- [x] 20-02-PLAN.md -- HealthPermission soft-ask screen, HealthCard display, manual entry UI, DP awards, daily_health table

### Phase 21: Archetypes
**Goal**: Users select a personal archetype that modifies how they earn DP -- free users get Bro (generalist), premium subscribers unlock 4 specialized archetypes that boost specific actions
**Depends on**: Phase 18 (dpStore for modifier application), Phase 19 (subscriptionStore for premium gating)
**Requirements**: GAME-03, GAME-04
**Success Criteria** (what must be TRUE):
  1. User selects an archetype during onboarding (Bro available to all; Himbo, Brute, Pup, Bull shown but locked for free users)
  2. Selected archetype applies visible DP bonus modifiers to specific actions (e.g., Himbo boosts training DP)
  3. User can change their archetype from Settings (premium archetypes require active subscription)
  4. Archetype selection and modifier effects are clearly communicated in the UI so users understand the upgrade incentive
**Plans**: 2 plans

Plans:
- [x] 21-01-PLAN.md -- Archetype types/constants, ArchetypeSelector/ArchetypeCard components, onboarding archetype step, Settings archetype section
- [x] 21-02-PLAN.md -- dpStore modifier integration, getModifiedDP helper, Supabase archetype sync, profiles migration

### Phase 22: Protocol Orders
**Goal**: Users receive rotating daily and weekly quests that award bonus DP -- an engagement layer that gives users specific goals beyond their routine
**Depends on**: Phase 18 (dpStore for DP awards), Phase 19 (subscriptionStore for weekly quest gating), Phase 20 (healthStore for health-related quest evaluation)
**Requirements**: GAME-06, GAME-07
**Success Criteria** (what must be TRUE):
  1. User sees 3 daily Protocol Orders with specific objectives (e.g., "Log 3 meals today") and bonus DP rewards
  2. Completing a quest objective automatically marks it done and awards the bonus DP
  3. Premium subscribers see 2 additional weekly Protocol Orders with larger DP rewards
  4. Quests rotate daily/weekly so users see fresh objectives regularly
**Plans**: 2 plans

Plans:
- [x] 22-01-PLAN.md -- Quest catalog with condition evaluators, questStore with deterministic rotation and completion tracking
- [x] 22-02-PLAN.md -- ProtocolOrders UI component, Home screen integration, premium weekly quest gating

### Phase 23: Avatar Evolution
**Goal**: Users have an evolving visual avatar that grows more impressive as they rank up -- a premium visual reward that makes progression tangible
**Depends on**: Phase 18 (dpStore.currentRank for stage calculation), Phase 19 (subscriptionStore for premium stage gating)
**Requirements**: AVATAR-01, AVATAR-02, AVATAR-03
**Success Criteria** (what must be TRUE):
  1. User sees their avatar silhouette prominently displayed on the home screen
  2. Avatar visually evolves at 5 rank milestones (ranks 1, 4, 8, 12, 15), with each stage looking more developed
  3. Avatar stages 3-5 are premium-gated -- free users see a locked preview with an upgrade prompt
**Plans**: 2 plans

Plans:
- [x] 23-01-PLAN.md -- EvolvingAvatar component, 5-stage SVG silhouettes, LockedAvatar premium gate
- [x] 23-02-PLAN.md -- Home screen avatar integration, AvatarScreen update, transition animations

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
**Plans**: 3 plans

Plans:
- [ ] 24-01-PLAN.md -- Data migration (Fresh Start modal, xpStore cleanup, data preservation)
- [ ] 24-02-PLAN.md -- Build preparation (PrivacyInfo.xcprivacy HealthKit, AASA Team ID)
- [ ] 24-03-PLAN.md -- App Store submission (metadata, review notes, TestFlight, submission)

<details>
<summary>v1.5 Native iOS App (Phases 11-16, closed 2026-02-27)</summary>

### Phase 11: Capacitor Shell
**Goal**: The existing React app runs inside a native iOS shell with no browser chrome, and all WKWebView-incompatible patterns are fixed
**Depends on**: Nothing (first phase of v1.5; builds on existing PWA codebase)
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05
**Plans:** 2/2 plans complete

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

**Execution Order:** 25 -> 26 -> 27 -> 28 -> 29 (then 24 for App Store)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 11. Capacitor Shell | v1.5 | 2/2 | Complete | 2026-02-22 |
| 12. Native Polish | v1.5 | 2/2 | Complete | 2026-02-22 |
| 13. Deep Linking + Auth | v1.5 | 1/1 | Complete | 2026-02-22 |
| 14. Remote Push Notifications | v1.5 | 3/3 | Complete | 2026-02-22 |
| 15. Local Notifications + Engagement | v1.5 | 2/2 | Complete | 2026-02-22 |
| 16. App Store Submission | v1.5 | 2/4 | Closed | 2026-02-27 |
| 17. Foundation Cleanup | v2.0 | 2/2 | Complete | 2026-02-27 |
| 18. Gamification Engine | v2.0 | 3/3 | Complete | 2026-02-28 |
| 19. Subscriptions | v2.0 | 4/4 | Complete | 2026-02-28 |
| 20. Health Tracking | v2.0 | 2/2 | Complete | 2026-02-28 |
| 21. Archetypes | v2.0 | 2/2 | Complete | 2026-02-28 |
| 22. Protocol Orders | v2.0 | 2/2 | Complete | 2026-02-28 |
| 23. Avatar Evolution | v2.0 | 2/2 | Complete | 2026-03-01 |
| 24. App Store Submission | v2.0 | 0/3 | Not started | - |
| 25. Onboarding Navigation | 1/1 | Complete    | 2026-03-06 | - |
| 26. Welcome and Value | 2/2 | Complete    | 2026-03-06 | - |
| 27. Profile and Goal | 2/2 | Complete    | 2026-03-06 | - |
| 28. Archetype and Macros | 2/2 | Complete    | 2026-03-06 | - |
| 29. Paywall and Entry | 2/2 | Complete   | 2026-03-06 | - |
