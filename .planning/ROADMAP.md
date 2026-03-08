# Roadmap: Trained

## Milestones

- v1.0 Launch Polish (Phases 1-5, shipped 2026-02-04)
- v1.1 Design Refresh (7 phases, shipped 2026-02-05)
- v1.2 Pre-Launch Confidence (4 phases, shipped 2026-02-07)
- v1.3 Coach Dashboard (Phases 1-6, shipped 2026-02-08)
- v1.4 Intake Dashboard (Phases 7-10, shipped 2026-02-21)
- v1.5 Native iOS App (Phases 11-16, closed 2026-02-27)
- v2.0 WellTrained V2 (Phases 17-24, in progress)
- v2.1 Onboarding Redesign (Phases 25-29, shipped 2026-03-06)
- v2.2 Auth Flow Redesign (Phases 30-36, in progress)
- v2.2.1 Social Sharing (Phases 37-40, shipped 2026-03-07)
- ✅ **v2.3 Engagement & Growth** (Phases 41-44, shipped 2026-03-07)
- 🚧 **v2.4 App Store Readiness** (Phases 45-48, in progress)

## Phases

<details>
<summary>✅ v2.3 Engagement & Growth (Phases 41-44) — SHIPPED 2026-03-07</summary>

**Milestone Goal:** Add retention and growth features -- Weekly Protocol Report (Sunday summaries with push notifications and share cards), Recruit a Sub (referral system with DP rewards and 7-day Premium trial), and Locked Protocol (streak-based accountability tracker with daily compliance logging and milestone rewards).

- [x] Phase 41: Weekly Protocol Report (3/3 plans) — completed 2026-03-07
- [x] Phase 42: Referral System (3/3 plans) — completed 2026-03-07
- [x] Phase 43: Referral Rewards (2/2 plans) — completed 2026-03-07
- [x] Phase 44: Locked Protocol (6/6 plans) — completed 2026-03-07

**Total:** 14 plans, 28 tasks

**Full details:** [.planning/milestones/v2.3-ROADMAP.md](milestones/v2.3-ROADMAP.md)

</details>

---

## v2.4 App Store Readiness

**Milestone Goal:** Resolve all P0 and P1 blockers identified in AUDIT_REPORT.md to prepare for iOS App Store submission.

### Phases

- [x] **Phase 45: iOS Configuration & Entitlements** - Fix privacy manifest, APN environment, and Team ID (completed 2026-03-07)
- [x] **Phase 46: Security & UX Fixes** - Close dev fallback, add health disclaimer, fix overflow and compliance bugs (completed 2026-03-07)
- [x] **Phase 47: Asset & Code Cleanup** - Optimize splash/logos, remove .DS_Store and dead code (completed 2026-03-08)
- [ ] **Phase 48: App Store Submission** - Complete metadata, verify Xcode build, host privacy policy

### Phase Details

#### Phase 45: iOS Configuration & Entitlements
**Goal**: iOS native configuration is App Store compliant
**Depends on**: Nothing (first phase of milestone)
**Requirements**: STORE-01, STORE-02, STORE-03
**Success Criteria** (what must be TRUE):
  1. PrivacyInfo.xcprivacy declares all collected data types (health, fitness, email, photos, usage)
  2. App.entitlements has aps-environment set to "production" for App Store builds
  3. apple-app-site-association file contains actual Team ID (no XXXXXXXXXX placeholder)
**Plans**: 1 plan

Plans:
- [x] 45-01-PLAN.md — Update iOS native config files (privacy manifest, APNS production, Team ID placeholder)

#### Phase 46: Security & UX Fixes
**Goal**: Security vulnerabilities closed and UX issues resolved
**Depends on**: Nothing (independent of Phase 45)
**Requirements**: SEC-01, UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. Access code validation no longer accepts dev fallback (any 8+ character string)
  2. User sees visible health/medical disclaimer during onboarding flow
  3. Workout names display without overflow on Workouts screen Today card
  4. Recovery day compliance calculation correctly distinguishes 4/4 vs 5/5 scenarios
**Plans**: 3 plans

Plans:
- [ ] 46-01-PLAN.md — Remove dev fallback from access code validator
- [ ] 46-02-PLAN.md — Add health disclaimer component and onboarding step
- [ ] 46-03-PLAN.md — Fix workout name overflow and recovery day compliance logic

#### Phase 47: Asset & Code Cleanup
**Goal**: Assets optimized and dead code removed
**Depends on**: Nothing (independent cleanup)
**Requirements**: ASSET-01, ASSET-02, ASSET-03, INFRA-02
**Success Criteria** (what must be TRUE):
  1. Splash screen displays WellTrained branding (no generic dim green glow)
  2. Icon-only.png and WT Logo.png are optimized (reduced from 3.1 MB each)
  3. Repository contains no .DS_Store files and .gitignore prevents future additions
  4. Legacy Onboarding.tsx (1,017 lines) removed from codebase
**Plans**: 4 plans

Plans:
- [x] 47-01-PLAN.md — Update splash screen with WellTrained branding
- [x] 47-02-PLAN.md — Optimize oversized logo files in public directory
- [x] 47-03-PLAN.md — Remove .DS_Store files and update .gitignore
- [ ] 47-04-PLAN.md — Remove legacy Onboarding.tsx and references

#### Phase 48: App Store Submission
**Goal**: App successfully submitted to App Store
**Depends on**: Phases 45, 46, 47 (all blockers resolved)
**Requirements**: STORE-04, STORE-05, INFRA-01
**Success Criteria** (what must be TRUE):
  1. App Store Connect has complete metadata (screenshots, description, privacy label)
  2. Build compiles successfully with latest Xcode and iOS 18 SDK
  3. Privacy policy is publicly accessible at hosted URL (not just in-app /privacy route)
  4. App binary uploaded to App Store Connect and passes automated review checks
**Plans**: TBD

Plans:
- [ ] 48-01: TBD

---

## v2.2 Auth Flow Redesign

**Milestone Goal:** Full authentication flow redesign with Apple Sign-In, Google Sign-In, and email/password. All screens updated to Obsidian/Dopamine Noir styling with chain-link crown branding. 3-pass implementation per screen: Build -> Review -> Refine.

### Phases

- [x] **Phase 30: Auth Infrastructure** - Apple/Google Sign-In plugins, Supabase providers, AuthStack navigation
- [x] **Phase 31: Splash Screen** - Chain-link crown logo, wordmark, tagline, loading indicator (3 passes) (completed 2026-03-07)
- [x] **Phase 32: Sign Up Screen** - Social entry with Apple/Google/Email buttons (3 passes) (completed 2026-03-07)
- [x] **Phase 33: Sign In Screen** - Returning user entry with social auth options (3 passes) (completed 2026-03-07)
- [x] **Phase 34: Email Sign Up Form** - Email/password registration with strength indicator (3 passes) (completed 2026-03-07)
- [x] **Phase 35: Email Sign In Form** - Email/password login with error handling (3 passes) (completed 2026-03-07)
- [x] **Phase 36: Forgot Password Screen** - Password reset request with success state (3 passes) (completed 2026-03-07)

<details>
<summary>v2.2 Phase Details</summary>

### Phase 30: Auth Infrastructure
**Goal**: Authentication foundation ready for all social and email auth flows
**Depends on**: Nothing (first phase of v2.2)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. Apple Sign-In Capacitor plugin responds to native sign-in trigger on iOS device
  2. Google Sign-In Capacitor plugin responds to native sign-in trigger on iOS device
  3. Supabase accepts Apple and Google ID tokens via signInWithIdToken
  4. AuthStack navigation renders correct screen based on route
  5. App routes unauthenticated users to AuthStack, authenticated+onboarded users to MainTabNavigator
**Plans**: 2 plans

Plans:
- [x] 30-01-PLAN.md -- Install Apple/Google Sign-In Capacitor plugins, create auth wrapper modules, configure Supabase providers
- [x] 30-02-PLAN.md -- Create AuthStack navigation with 5 auth screen placeholders, update App.tsx routing logic

### Phase 31: Splash Screen
**Goal**: Branded loading experience during app initialization
**Depends on**: Phase 30
**Requirements**: SPLASH-01, SPLASH-02, SPLASH-03
**Success Criteria** (what must be TRUE):
  1. User sees chain-link crown logo, WELLTRAINED wordmark, and FORGE YOUR LEGEND tagline on app launch
  2. Gold loading bar animates while app initializes
  3. Splash automatically transitions to appropriate screen (Auth or Main) after load completes
**Plans**: 3 plans

Plans:
- [x] 31-01-PLAN.md -- Build Splash screen with chain-link crown logo, WELLTRAINED wordmark, FORGE YOUR LEGEND tagline, animated gold loading bar
- [x] 31-02-PLAN.md -- Review implementation against mockup, document visual gaps
- [x] 31-03-PLAN.md -- Refine spacing, typography, and animations based on review findings

### Phase 32: Sign Up Screen
**Goal**: New users can begin registration via Apple, Google, or email
**Depends on**: Phase 31
**Requirements**: SIGNUP-01, SIGNUP-02, SIGNUP-03, SIGNUP-04, SIGNUP-05
**Success Criteria** (what must be TRUE):
  1. User sees logo, BEGIN YOUR PROTOCOL headline, three auth buttons, and legal copy
  2. Apple button triggers native Apple Sign-In and creates Supabase session
  3. Google button triggers native Google Sign-In and creates Supabase session
  4. Email button navigates to Email Sign Up form
  5. Sign In link navigates to Sign In screen
**Plans**: 3 plans

Plans:
- [x] 32-01-PLAN.md -- Build Sign Up screen with layout, auth button handlers, and navigation
- [x] 32-02-PLAN.md -- Review implementation against mockup, document visual gaps
- [x] 32-03-PLAN.md -- Refine spacing, typography, and styling based on review findings

### Phase 33: Sign In Screen
**Goal**: Returning users can authenticate via Apple, Google, or email
**Depends on**: Phase 32
**Requirements**: SIGNIN-01, SIGNIN-02, SIGNIN-03, SIGNIN-04, SIGNIN-05, SIGNIN-06
**Success Criteria** (what must be TRUE):
  1. User sees logo, WELCOME BACK headline, and three auth buttons
  2. Apple button triggers Apple Sign-In flow
  3. Google button triggers Google Sign-In flow
  4. Email button navigates to Email Sign In form
  5. Create Account link navigates to Sign Up screen
  6. Forgot Password link navigates to Forgot Password screen
**Plans**: 3 plans

Plans:
- [x] 33-01-PLAN.md -- Build Sign In screen with layout, auth handlers, and navigation
- [x] 33-02-PLAN.md -- Review implementation against mockup, document visual gaps
- [x] 33-03-PLAN.md -- Refine spacing, typography, and styling based on review findings

### Phase 34: Email Sign Up Form
**Goal**: Users can create account with email and password
**Depends on**: Phase 33
**Requirements**: EMAILSIGNUP-01, EMAILSIGNUP-02, EMAILSIGNUP-03, EMAILSIGNUP-04, EMAILSIGNUP-05
**Success Criteria** (what must be TRUE):
  1. User sees email, password, confirm password fields with gold icons
  2. Password strength indicator shows 4 segments updating based on complexity
  3. CREATE ACCOUNT button disabled until all validation passes
  4. Valid form submission creates Supabase account and session
  5. Sign In link navigates to Sign In screen
**Plans**: 3 plans

Plans:
- [x] 34-01-PLAN.md -- Implement Email Sign Up form with fields, validation, strength indicator, Supabase auth
- [x] 34-02-PLAN.md -- Review implementation against mockup, document visual gaps
- [ ] 34-03-PLAN.md -- Pixel-polish form styling, error states, animations based on review findings

### Phase 35: Email Sign In Form
**Goal**: Users can sign in with email and password
**Depends on**: Phase 34
**Requirements**: EMAILSIGNIN-01, EMAILSIGNIN-02, EMAILSIGNIN-03, EMAILSIGNIN-04, EMAILSIGNIN-05
**Success Criteria** (what must be TRUE):
  1. User sees email and password fields with gold icons
  2. Valid credentials sign in via Supabase signInWithPassword
  3. Invalid credentials show inline error message below password field
  4. Forgot Password link navigates to Forgot Password screen
  5. Create Account link navigates to Sign Up screen
**Plans**: 3 plans

Plans:
- [x] 35-01-PLAN.md -- Implement Email Sign In form with fields, validation, error handling, and Supabase auth
- [x] 35-02-PLAN.md -- Review implementation against mockup, document visual gaps (User approved - zero gaps)
- [ ] 35-03-PLAN.md -- Pixel-polish form styling, error states, animations based on review findings

### Phase 36: Forgot Password Screen
**Goal**: Users can reset forgotten password via email
**Depends on**: Phase 35
**Requirements**: FORGOT-01, FORGOT-02, FORGOT-03, FORGOT-04
**Success Criteria** (what must be TRUE):
  1. User sees logo, gold key icon, and email field
  2. Submit triggers Supabase resetPasswordForEmail
  3. Success state shows confirmation message with submitted email address
  4. Back to Sign In link navigates to Sign In screen
**Plans**: 3 plans

Plans:
- [x] 36-01-PLAN.md -- Implement Forgot Password screen with form, Supabase integration, and success state
- [x] 36-02-PLAN.md -- Review implementation against mockup, document visual gaps
- [x] 36-03-PLAN.md -- Pixel-polish form styling, success state, animations based on review findings

</details>

---

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

<details>
<summary>v2.0 Phase Details</summary>

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

</details>

## Progress

**Execution Order:** Continue with v2.4 App Store Readiness

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 45. iOS Configuration & Entitlements | v2.4 | 1/1 | Complete | 2026-03-07 |
| 46. Security & UX Fixes | 3/3 | Complete    | 2026-03-07 | - |
| 47. Asset & Code Cleanup | 4/4 | Complete    | 2026-03-08 | - |
| 48. App Store Submission | v2.4 | 0/? | Not started | - |
| 41. Weekly Protocol Report | v2.3 | 3/3 | Complete | 2026-03-07 |
| 42. Referral System | v2.3 | 3/3 | Complete | 2026-03-07 |
| 43. Referral Rewards | v2.3 | 2/2 | Complete | 2026-03-07 |
| 44. Locked Protocol | v2.3 | 6/6 | Complete | 2026-03-07 |
| 34. Email Sign Up Form | v2.2 | 2/3 | Partial | - |
| 35. Email Sign In Form | v2.2 | 2/3 | Partial | - |
| 24. App Store Submission | v2.0 | 0/3 | Not started | - |

<details>
<summary>Archived Milestones</summary>

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 11-16 | v1.5 Native iOS App | 12/14 | Closed | 2026-02-27 |
| 17-23 | v2.0 WellTrained V2 | 17/20 | In progress | - |
| 25-29 | v2.1 Onboarding Redesign | 9/9 | Complete | 2026-03-06 |
| 30-36 | v2.2 Auth Flow Redesign | 17/20 | In progress | - |
| 37-40 | v2.2.1 Social Sharing | 6/6 | Complete | 2026-03-07 |
| 41-44 | v2.3 Engagement & Growth | 14/14 | Complete | 2026-03-07 |

</details>
