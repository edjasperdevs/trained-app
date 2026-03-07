# Requirements: WellTrained

**Defined:** 2026-02-27 (v2.0), 2026-03-06 (v2.1, v2.2)
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

- [x] **GOAL-01**: User sees 4 goal cards: Build Muscle, Lose Fat, Get Stronger, Improve Overall Fitness
- [x] **GOAL-02**: Each goal card has a gold Lucide icon and two-line label
- [x] **GOAL-03**: User can select one goal at a time (single selection)
- [x] **GOAL-04**: Selected goal card shows gold border with animation (150ms ease-out)
- [x] **GOAL-05**: Goal selection triggers haptic feedback
- [x] **GOAL-06**: CONTINUE button is disabled until a goal is selected
- [x] **GOAL-07**: Selected goal is stored in user profile store

### Archetype Selection (Onboarding)

- [x] **ARCH-01**: User sees 5 archetype cards: Bro (FREE), Himbo (PREMIUM), Brute (PREMIUM), Pup (PREMIUM), Bull (COMING SOON)
- [x] **ARCH-02**: Bro card is selected by default
- [x] **ARCH-03**: Bull card is dimmed (40% opacity) and non-interactive
- [x] **ARCH-04**: FREE badge on Bro is green (#22C55E)
- [x] **ARCH-05**: PREMIUM badges are gold (#D4A853)
- [x] **ARCH-06**: User can select any archetype including premium ones (gate at paywall, not here)
- [x] **ARCH-07**: Selected archetype is stored in dpStore

### Macro Setup (Onboarding)

- [x] **MACR-01**: User sees calculated daily macro targets based on profile inputs
- [x] **MACR-02**: Large donut ring chart shows macro distribution (Recharts, gold palette)
- [x] **MACR-03**: Three macro stat cards show protein, carbs, fat (grams and percentage)
- [x] **MACR-04**: Macro calculation uses Mifflin-St Jeor formula adjusted for selected goal
- [x] **MACR-05**: Default height/weight (5'10", 185 lbs) used for initial calculation
- [x] **MACR-06**: Donut chart animates with draw effect (arc fills clockwise over 800ms)
- [x] **MACR-07**: Stat cards count up from 0 to target values over 600ms after chart completes
- [x] **MACR-08**: User can tap "ACCEPT MY PROTOCOL" to proceed
- [x] **MACR-09**: Calculated macros are stored in macroStore

### Paywall (Onboarding)

- [x] **PAY-01**: User sees paywall after completing profile setup
- [x] **PAY-02**: Monthly option ($9.99/month, 7-day free trial) is visually prominent with gold border and MOST POPULAR label
- [x] **PAY-03**: Annual option ($59.99/year, save 50%) shown as secondary card
- [x] **PAY-04**: User can tap "START FREE TRIAL" to initiate RevenueCat purchase flow
- [x] **PAY-05**: User can tap "Continue with free access" to skip paywall
- [x] **PAY-06**: Skipping paywall grants 7-day free Premium trial automatically (reverse trial via RevenueCat)
- [x] **PAY-07**: Paywall screen does not show back arrow
- [x] **PAY-08**: Paywall screen is skipped entirely if user is already premium

### Welcome to Protocol

- [x] **FINAL-01**: User sees Welcome to Protocol screen after paywall resolution
- [x] **FINAL-02**: Avatar appears with fade-in and subtle scale-up animation (0.95 to 1.0 over 400ms)
- [x] **FINAL-03**: Rank card shows "UNINITIATED" with DP progress bar at zero
- [x] **FINAL-04**: Rank card displays "0 of 250 DP to Initiate"
- [x] **FINAL-05**: Rank card slides up from below (translateY 20px to 0 over 400ms, 200ms delay)
- [x] **FINAL-06**: CTA button "ENTER THE DISCIPLINE" pulses once after 1 second
- [x] **FINAL-07**: Tapping CTA navigates to Home tab and clears onboarding from navigation history
- [x] **FINAL-08**: onboardingComplete flag is set to true

### Progress Indicator

- [x] **PROG-01**: 5-dot progress indicator appears on screens 2-6
- [x] **PROG-02**: Current step dot is highlighted (gold)
- [x] **PROG-03**: Completed steps show filled dots

### Navigation (Onboarding)

- [x] **NAV-01**: OnboardingStack renders when onboardingComplete is false
- [x] **NAV-02**: MainTabNavigator renders when onboardingComplete is true
- [x] **NAV-03**: Onboarding flow is a separate navigation stack from main app

## v2.2 Requirements

Requirements for Auth Flow Redesign. 6 screens with 3-pass implementation (Build -> Review -> Refine).

### Auth Infrastructure

- [x] **INFRA-01**: Apple Sign-In Capacitor plugin installed and configured
- [x] **INFRA-02**: Google Sign-In Capacitor plugin installed and configured
- [x] **INFRA-03**: Supabase Apple provider configured with Service ID, Team ID, Key ID, private key
- [x] **INFRA-04**: Supabase Google provider configured with Web client ID and secret
- [x] **INFRA-05**: AuthStack navigation with routes for all 5 auth screens
- [x] **INFRA-06**: App routing logic checks session + onboardingComplete to route appropriately

### Splash Screen

- [x] **SPLASH-01**: Splash screen displays chain-link crown logo, WELLTRAINED wordmark, FORGE YOUR LEGEND tagline
- [x] **SPLASH-02**: Gold loading bar animates during app initialization
- [x] **SPLASH-03**: Splash auto-transitions to appropriate destination after load complete

### Sign Up (Social Entry)

- [x] **SIGNUP-01**: Sign Up screen displays logo, BEGIN YOUR PROTOCOL headline, 3 auth buttons, legal copy
- [x] **SIGNUP-02**: Apple button triggers Apple Sign-In flow and creates Supabase session
- [x] **SIGNUP-03**: Google button triggers Google Sign-In flow and creates Supabase session
- [x] **SIGNUP-04**: Email button navigates to Email Sign Up form
- [x] **SIGNUP-05**: Sign In link navigates to Sign In screen

### Sign In (Social Entry)

- [ ] **SIGNIN-01**: Sign In screen displays logo, WELCOME BACK headline, 3 auth buttons
- [ ] **SIGNIN-02**: Apple button triggers Apple Sign-In flow
- [ ] **SIGNIN-03**: Google button triggers Google Sign-In flow
- [ ] **SIGNIN-04**: Email button navigates to Email Sign In form
- [ ] **SIGNIN-05**: Create Account link navigates to Sign Up screen
- [ ] **SIGNIN-06**: Forgot Password link navigates to Forgot Password screen

### Email Sign Up Form

- [ ] **EMAILSIGNUP-01**: Email Sign Up form displays email, password, confirm password fields with gold icons
- [ ] **EMAILSIGNUP-02**: Password strength indicator shows 4 segments based on complexity criteria
- [ ] **EMAILSIGNUP-03**: CREATE ACCOUNT button disabled until all validation passes
- [ ] **EMAILSIGNUP-04**: User can create account with valid email and password via Supabase signUp
- [ ] **EMAILSIGNUP-05**: Sign In link navigates to Sign In screen

### Email Sign In Form

- [ ] **EMAILSIGNIN-01**: Email Sign In form displays email and password fields with gold icons
- [ ] **EMAILSIGNIN-02**: User can sign in with valid credentials via Supabase signInWithPassword
- [ ] **EMAILSIGNIN-03**: Invalid credentials show inline error message below password field
- [ ] **EMAILSIGNIN-04**: Forgot Password link navigates to Forgot Password screen
- [ ] **EMAILSIGNIN-05**: Create Account link navigates to Sign Up screen

### Forgot Password

- [ ] **FORGOT-01**: Forgot Password screen displays logo, gold key icon, email field
- [ ] **FORGOT-02**: User can request password reset email via Supabase resetPasswordForEmail
- [ ] **FORGOT-03**: Success state shows confirmation message with submitted email address
- [ ] **FORGOT-04**: Back to Sign In link navigates to Sign In screen

## v2.2.1 Requirements

Requirements for Social Sharing milestone. Three branded share card types.

### Share Infrastructure

- [x] **SHARE-01**: Share utility generates PNG from React components via html-to-image
- [x] **SHARE-02**: Native share sheet opens via @capacitor/share with image file
- [x] **SHARE-03**: Off-screen render wrapper enables DOM capture without UI flicker

### Share Cards

- [ ] **SHARE-04**: Rank-Up card displays rank name, avatar, total DP, streak with gold/obsidian styling
- [ ] **SHARE-05**: Workout card displays sets, top lift, DP earned with full-bleed photo layout
- [ ] **SHARE-06**: Compliance card displays streak, 5 compliance checks, milestone banners (Day 7/30/100)

### Integration Points

- [ ] **SHARE-07**: RankUpModal shows "Share Your Rank" button after rank claim
- [ ] **SHARE-08**: Workouts shows "Share Protocol" button on completed workouts
- [ ] **SHARE-09**: CheckInModal shows "Share Your Protocol" on full 5/5 compliance

### DP Rewards

- [x] **SHARE-10**: Sharing workout awards +5 DP with daily limit gate
- [x] **SHARE-11**: Sharing compliance awards +5 DP with daily limit gate
- [x] **SHARE-12**: Sharing rank-up awards +10 DP with per-rank limit gate

### Camera Compositing

- [ ] **SHARE-13**: Camera capture integrates photo into workout share card
- [ ] **SHARE-14**: Bottom sheet offers "with photo" / "without photo" options

### Platform Handling

- [x] **SHARE-15**: Web platform shows "Download Card" fallback instead of native share

## Future Requirements (v2.3+)

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
| Instagram/X API integration | Native share sheet handles routing; no platform SDKs needed |
| Share to specific platforms | User chooses destination via native share sheet |
| Share history / analytics | Not needed for v1 of feature |
| Custom share text editing | Pre-generated text is sufficient |
| Video share cards | PNG only; video would require different tech stack |
| Email collection during onboarding | Research shows email walls cause abandonment; collect in Profile after engagement |
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
| GOAL-01 | Phase 27 | Complete |
| GOAL-02 | Phase 27 | Complete |
| GOAL-03 | Phase 27 | Complete |
| GOAL-04 | Phase 27 | Complete |
| GOAL-05 | Phase 27 | Complete |
| GOAL-06 | Phase 27 | Complete |
| GOAL-07 | Phase 27 | Complete |
| ARCH-01 | Phase 28 | Complete |
| ARCH-02 | Phase 28 | Complete |
| ARCH-03 | Phase 28 | Complete |
| ARCH-04 | Phase 28 | Complete |
| ARCH-05 | Phase 28 | Complete |
| ARCH-06 | Phase 28 | Complete |
| ARCH-07 | Phase 28 | Complete |
| MACR-01 | Phase 28 | Complete |
| MACR-02 | Phase 28 | Complete |
| MACR-03 | Phase 28 | Complete |
| MACR-04 | Phase 28 | Complete |
| MACR-05 | Phase 28 | Complete |
| MACR-06 | Phase 28 | Complete |
| MACR-07 | Phase 28 | Complete |
| MACR-08 | Phase 28 | Complete |
| MACR-09 | Phase 28 | Complete |
| PAY-01 | Phase 29 | Complete |
| PAY-02 | Phase 29 | Complete |
| PAY-03 | Phase 29 | Complete |
| PAY-04 | Phase 29 | Complete |
| PAY-05 | Phase 29 | Complete |
| PAY-06 | Phase 29 | Complete |
| PAY-07 | Phase 29 | Complete |
| PAY-08 | Phase 29 | Complete |
| FINAL-01 | Phase 29 | Complete |
| FINAL-02 | Phase 29 | Complete |
| FINAL-03 | Phase 29 | Complete |
| FINAL-04 | Phase 29 | Complete |
| FINAL-05 | Phase 29 | Complete |
| FINAL-06 | Phase 29 | Complete |
| FINAL-07 | Phase 29 | Complete |
| FINAL-08 | Phase 29 | Complete |
| PROG-01 | Phase 26 | Complete |
| PROG-02 | Phase 26 | Complete |
| PROG-03 | Phase 26 | Complete |
| NAV-01 | Phase 25 | Complete |
| NAV-02 | Phase 25 | Complete |
| NAV-03 | Phase 25 | Complete |
| INFRA-01 | Phase 30 | Complete |
| INFRA-02 | Phase 30 | Complete |
| INFRA-03 | Phase 30 | Complete |
| INFRA-04 | Phase 30 | Complete |
| INFRA-05 | Phase 30 | Complete |
| INFRA-06 | Phase 30 | Complete |
| SPLASH-01 | Phase 31 | Complete |
| SPLASH-02 | Phase 31 | Complete |
| SPLASH-03 | Phase 31 | Complete |
| SIGNUP-01 | Phase 32 | Complete |
| SIGNUP-02 | Phase 32 | Complete |
| SIGNUP-03 | Phase 32 | Complete |
| SIGNUP-04 | Phase 32 | Complete |
| SIGNUP-05 | Phase 32 | Complete |
| SIGNIN-01 | Phase 33 | Pending |
| SIGNIN-02 | Phase 33 | Pending |
| SIGNIN-03 | Phase 33 | Pending |
| SIGNIN-04 | Phase 33 | Pending |
| SIGNIN-05 | Phase 33 | Pending |
| SIGNIN-06 | Phase 33 | Pending |
| EMAILSIGNUP-01 | Phase 34 | Pending |
| EMAILSIGNUP-02 | Phase 34 | Pending |
| EMAILSIGNUP-03 | Phase 34 | Pending |
| EMAILSIGNUP-04 | Phase 34 | Pending |
| EMAILSIGNUP-05 | Phase 34 | Pending |
| EMAILSIGNIN-01 | Phase 35 | Pending |
| EMAILSIGNIN-02 | Phase 35 | Pending |
| EMAILSIGNIN-03 | Phase 35 | Pending |
| EMAILSIGNIN-04 | Phase 35 | Pending |
| EMAILSIGNIN-05 | Phase 35 | Pending |
| FORGOT-01 | Phase 36 | Pending |
| FORGOT-02 | Phase 36 | Pending |
| FORGOT-03 | Phase 36 | Pending |
| FORGOT-04 | Phase 36 | Pending |
| SHARE-01 | Phase 37 | Complete |
| SHARE-02 | Phase 37 | Complete |
| SHARE-03 | Phase 37 | Complete |
| SHARE-04 | Phase 38 | Pending |
| SHARE-05 | Phase 40 | Pending |
| SHARE-06 | Phase 39 | Pending |
| SHARE-07 | Phase 38 | Pending |
| SHARE-08 | Phase 40 | Pending |
| SHARE-09 | Phase 39 | Pending |
| SHARE-10 | Phase 37 | Complete |
| SHARE-11 | Phase 37 | Complete |
| SHARE-12 | Phase 37 | Complete |
| SHARE-13 | Phase 40 | Pending |
| SHARE-14 | Phase 40 | Pending |
| SHARE-15 | Phase 37 | Complete |

**Coverage:**
- v2.0 requirements: 47 total
- v2.1 requirements: 44 total
- v2.2 requirements: 34 total
- v2.2.1 requirements: 15 total
- Total mapped to phases: 140
- Unmapped: 0

---
*Requirements defined: 2026-02-27 (v2.0), 2026-03-06 (v2.1, v2.2, v2.2.1)*
*Last updated: 2026-03-07 -- v2.2.1 Social Sharing roadmap created*
