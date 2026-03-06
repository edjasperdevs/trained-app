# Requirements: WellTrained

**Defined:** 2026-02-27 (v2.0), 2026-03-06 (v2.1)
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
- [x] **GAME-03**: User selects one of 5 archetypes during onboarding (Bro is free; Himbo, Brute, Pup, Bull are premium)
- [x] **GAME-04**: Selected archetype applies DP bonus modifiers to specific actions
- [ ] **GAME-05**: User maintains an Obedience Streak by completing at least one core action daily
- [x] **GAME-06**: User receives daily Protocol Orders (quests) with bonus DP rewards
- [x] **GAME-07**: User receives weekly Protocol Orders with larger DP rewards (premium only)
- [ ] **GAME-08**: User can view current rank, cumulative DP, and progress toward next rank
- [x] **GAME-09**: Rank-up triggers a celebration animation and notification

### Avatar

- [x] **AVATAR-01**: User has an evolving silhouette avatar that reflects rank progression
- [x] **AVATAR-02**: Avatar changes at 5 rank milestones (stages tied to specific ranks)
- [x] **AVATAR-03**: Avatar is displayed prominently on the home screen

### Health Tracking

- [x] **HEALTH-01**: User can view daily step count sourced from HealthKit
- [x] **HEALTH-02**: User can manually enter daily step count as fallback
- [x] **HEALTH-03**: User can view sleep duration sourced from HealthKit
- [x] **HEALTH-04**: User can manually enter sleep duration as fallback
- [x] **HEALTH-05**: Steps (10k+) and sleep (7h+) thresholds trigger DP awards
- [x] **HEALTH-06**: App requests HealthKit permissions contextually (not during onboarding)
- [x] **HEALTH-07**: App handles HealthKit permission denial gracefully with manual-only fallback

### Subscriptions

- [x] **SUB-01**: App integrates RevenueCat SDK for iOS in-app purchase subscriptions
- [x] **SUB-02**: User sees a paywall presenting subscription tiers (monthly and annual)
- [x] **SUB-03**: Premium features gated behind active subscription (specialized archetypes, avatar evolution, weekly quests, advanced analytics)
- [x] **SUB-04**: User can restore previous purchases
- [x] **SUB-05**: Subscription entitlement status persists across app restarts
- [x] **SUB-06**: Paywall displays all Apple-required subscription transparency text
- [x] **SUB-07**: User can manage subscription from Settings screen

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

## v2.1 Requirements

Requirements for onboarding redesign. 8-screen conversion-optimized flow.

### Welcome

- [x] **WELC-01**: User sees Welcome screen with brand mark, wordmark, and headline on app launch (when not onboarded)
- [x] **WELC-02**: User can tap "BEGIN PROTOCOL" to start onboarding flow
- [x] **WELC-03**: User can tap "Already initiated? Sign In" to go to sign-in screen
- [x] **WELC-04**: Welcome screen has fade-up animation on load (logo, wordmark, headline stagger)
- [x] **WELC-05**: CTA button pulses subtly after 2 seconds if user hasn't tapped

### Value Proposition

- [x] **VALU-01**: User sees Value Proposition screen with headline "IMAGINE A FITNESS APP THAT TRAINS YOU LIKE A CHAMPION"
- [x] **VALU-02**: User sees three benefit rows explaining DP system, rank system, and avatar system
- [x] **VALU-03**: Benefit rows animate in with stagger after headline appears
- [x] **VALU-04**: User can tap NEXT to proceed to Profile Setup

### Profile Setup

- [x] **PROF-01**: User can enter their name in a text field
- [x] **PROF-02**: User can toggle between LBS and KG units
- [x] **PROF-03**: User can select training days per week (2-6) via selector chips
- [x] **PROF-04**: User can select fitness level (Beginner/Intermediate/Advanced) via cards
- [x] **PROF-05**: Selected chips/cards show gold border with subtle gold background tint
- [x] **PROF-06**: Training days and fitness level selections trigger haptic feedback
- [x] **PROF-07**: CONTINUE button is disabled until name field has at least one character
- [x] **PROF-08**: Keyboard pushes form up smoothly on all device sizes

### Goal Selection

- [ ] **GOAL-01**: User sees 4 goal cards: Build Muscle, Lose Fat, Get Stronger, Improve Overall Fitness
- [ ] **GOAL-02**: Each goal card has a gold Lucide icon and two-line label
- [ ] **GOAL-03**: User can select one goal at a time (single selection)
- [ ] **GOAL-04**: Selected goal card shows gold border with animation (150ms ease-out)
- [ ] **GOAL-05**: Goal selection triggers haptic feedback
- [ ] **GOAL-06**: CONTINUE button is disabled until a goal is selected
- [ ] **GOAL-07**: Selected goal is stored in user profile store

### Archetype Selection (Onboarding)

- [ ] **ARCH-01**: User sees 5 archetype cards: Bro (FREE), Himbo (PREMIUM), Brute (PREMIUM), Pup (PREMIUM), Bull (COMING SOON)
- [ ] **ARCH-02**: Bro card is selected by default
- [ ] **ARCH-03**: Bull card is dimmed (40% opacity) and non-interactive
- [ ] **ARCH-04**: FREE badge on Bro is green (#22C55E)
- [ ] **ARCH-05**: PREMIUM badges are gold (#D4A853)
- [ ] **ARCH-06**: User can select any archetype including premium ones (gate at paywall, not here)
- [ ] **ARCH-07**: Selected archetype is stored in dpStore

### Macro Setup (Onboarding)

- [ ] **MACR-01**: User sees calculated daily macro targets based on profile inputs
- [ ] **MACR-02**: Large donut ring chart shows macro distribution (Recharts, gold palette)
- [ ] **MACR-03**: Three macro stat cards show protein, carbs, fat (grams and percentage)
- [ ] **MACR-04**: Macro calculation uses Mifflin-St Jeor formula adjusted for selected goal
- [ ] **MACR-05**: Default height/weight (5'10", 185 lbs) used for initial calculation
- [ ] **MACR-06**: Donut chart animates with draw effect (arc fills clockwise over 800ms)
- [ ] **MACR-07**: Stat cards count up from 0 to target values over 600ms after chart completes
- [ ] **MACR-08**: User can tap "ACCEPT MY PROTOCOL" to proceed
- [ ] **MACR-09**: Calculated macros are stored in macroStore

### Paywall (Onboarding)

- [ ] **PAY-01**: User sees paywall after completing profile setup
- [ ] **PAY-02**: Monthly option ($9.99/month, 7-day free trial) is visually prominent with gold border and MOST POPULAR label
- [ ] **PAY-03**: Annual option ($59.99/year, save 50%) shown as secondary card
- [ ] **PAY-04**: User can tap "START FREE TRIAL" to initiate RevenueCat purchase flow
- [ ] **PAY-05**: User can tap "Continue with free access" to skip paywall
- [ ] **PAY-06**: Skipping paywall grants 7-day free Premium trial automatically (reverse trial via RevenueCat)
- [ ] **PAY-07**: Paywall screen does not show back arrow
- [ ] **PAY-08**: Paywall screen is skipped entirely if user is already premium

### Welcome to Protocol

- [ ] **FINAL-01**: User sees Welcome to Protocol screen after paywall resolution
- [ ] **FINAL-02**: Avatar appears with fade-in and subtle scale-up animation (0.95 to 1.0 over 400ms)
- [ ] **FINAL-03**: Rank card shows "UNINITIATED" with DP progress bar at zero
- [ ] **FINAL-04**: Rank card displays "0 of 250 DP to Initiate"
- [ ] **FINAL-05**: Rank card slides up from below (translateY 20px to 0 over 400ms, 200ms delay)
- [ ] **FINAL-06**: CTA button "ENTER THE DISCIPLINE" pulses once after 1 second
- [ ] **FINAL-07**: Tapping CTA navigates to Home tab and clears onboarding from navigation history
- [ ] **FINAL-08**: onboardingComplete flag is set to true

### Progress Indicator

- [x] **PROG-01**: 5-dot progress indicator appears on screens 2-6
- [x] **PROG-02**: Current step dot is highlighted (gold)
- [x] **PROG-03**: Completed steps show filled dots

### Navigation (Onboarding)

- [x] **NAV-01**: OnboardingStack renders when onboardingComplete is false
- [x] **NAV-02**: MainTabNavigator renders when onboardingComplete is true
- [x] **NAV-03**: Onboarding flow is a separate navigation stack from main app

## Future Requirements (v2.2+)

### Onboarding Enhancements

- **ONB-F01**: Email collection in onboarding (currently deferred to Profile settings)
- **ONB-F02**: Height/weight collection for more accurate macro calculation
- **ONB-F03**: A/B testing different value proposition copy

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
| Email collection during onboarding | Research shows email walls cause abandonment; collect in Profile after engagement |
| Social login (Apple, Google) | Email/password sufficient for v2.1 |
| Onboarding skip option | All screens are conversion-critical |
| Custom avatar selection in onboarding | Avatar is fixed during onboarding; customization is post-onboarding |
| Height/weight input in onboarding | Use defaults for v2.1; user can update in Profile settings |

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
| GAME-03 | Phase 21 | Complete |
| GAME-04 | Phase 21 | Complete |
| GAME-05 | Phase 18 | Pending |
| GAME-06 | Phase 22 | Complete |
| GAME-07 | Phase 22 | Complete |
| GAME-08 | Phase 18 | Pending |
| GAME-09 | Phase 18 | Complete |
| AVATAR-01 | Phase 23 | Complete |
| AVATAR-02 | Phase 23 | Complete |
| AVATAR-03 | Phase 23 | Complete |
| HEALTH-01 | Phase 20 | Complete |
| HEALTH-02 | Phase 20 | Complete |
| HEALTH-03 | Phase 20 | Complete |
| HEALTH-04 | Phase 20 | Complete |
| HEALTH-05 | Phase 20 | Complete |
| HEALTH-06 | Phase 20 | Complete |
| HEALTH-07 | Phase 20 | Complete |
| SUB-01 | Phase 19 | Complete |
| SUB-02 | Phase 19 | Complete |
| SUB-03 | Phase 19 | Complete |
| SUB-04 | Phase 19 | Complete |
| SUB-05 | Phase 19 | Complete |
| SUB-06 | Phase 19 | Complete |
| SUB-07 | Phase 19 | Complete |
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
| WELC-01 | Phase 26 | Complete |
| WELC-02 | Phase 26 | Complete |
| WELC-03 | Phase 26 | Complete |
| WELC-04 | Phase 26 | Complete |
| WELC-05 | Phase 26 | Complete |
| VALU-01 | Phase 26 | Complete |
| VALU-02 | Phase 26 | Complete |
| VALU-03 | Phase 26 | Complete |
| VALU-04 | Phase 26 | Complete |
| PROF-01 | Phase 27 | Complete |
| PROF-02 | Phase 27 | Complete |
| PROF-03 | Phase 27 | Complete |
| PROF-04 | Phase 27 | Complete |
| PROF-05 | Phase 27 | Complete |
| PROF-06 | Phase 27 | Complete |
| PROF-07 | Phase 27 | Complete |
| PROF-08 | Phase 27 | Complete |
| GOAL-01 | Phase 27 | Pending |
| GOAL-02 | Phase 27 | Pending |
| GOAL-03 | Phase 27 | Pending |
| GOAL-04 | Phase 27 | Pending |
| GOAL-05 | Phase 27 | Pending |
| GOAL-06 | Phase 27 | Pending |
| GOAL-07 | Phase 27 | Pending |
| ARCH-01 | Phase 28 | Pending |
| ARCH-02 | Phase 28 | Pending |
| ARCH-03 | Phase 28 | Pending |
| ARCH-04 | Phase 28 | Pending |
| ARCH-05 | Phase 28 | Pending |
| ARCH-06 | Phase 28 | Pending |
| ARCH-07 | Phase 28 | Pending |
| MACR-01 | Phase 28 | Pending |
| MACR-02 | Phase 28 | Pending |
| MACR-03 | Phase 28 | Pending |
| MACR-04 | Phase 28 | Pending |
| MACR-05 | Phase 28 | Pending |
| MACR-06 | Phase 28 | Pending |
| MACR-07 | Phase 28 | Pending |
| MACR-08 | Phase 28 | Pending |
| MACR-09 | Phase 28 | Pending |
| PAY-01 | Phase 29 | Pending |
| PAY-02 | Phase 29 | Pending |
| PAY-03 | Phase 29 | Pending |
| PAY-04 | Phase 29 | Pending |
| PAY-05 | Phase 29 | Pending |
| PAY-06 | Phase 29 | Pending |
| PAY-07 | Phase 29 | Pending |
| PAY-08 | Phase 29 | Pending |
| FINAL-01 | Phase 29 | Pending |
| FINAL-02 | Phase 29 | Pending |
| FINAL-03 | Phase 29 | Pending |
| FINAL-04 | Phase 29 | Pending |
| FINAL-05 | Phase 29 | Pending |
| FINAL-06 | Phase 29 | Pending |
| FINAL-07 | Phase 29 | Pending |
| FINAL-08 | Phase 29 | Pending |
| PROG-01 | Phase 26 | Complete |
| PROG-02 | Phase 26 | Complete |
| PROG-03 | Phase 26 | Complete |
| NAV-01 | Phase 25 | Complete |
| NAV-02 | Phase 25 | Complete |
| NAV-03 | Phase 25 | Complete |

**Coverage:**
- v2.0 requirements: 47 total
- v2.1 requirements: 44 total
- Mapped to phases: 91
- Unmapped: 0

---
*Requirements defined: 2026-02-27 (v2.0), 2026-03-06 (v2.1)*
*Last updated: 2026-03-06 -- v2.1 traceability added*
