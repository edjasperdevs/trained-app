---
status: diagnosed
type: full-app-audit
started: 2026-03-09T04:40:00Z
updated: 2026-03-09T04:45:00Z
---

## Current Test

[testing stopped - critical blockers found]

## Tests

### Authentication Flows

#### 1. Sign in with existing account
expected: From welcome screen → tap "Already have an account?" → enter email/password → sign in → lands on Home dashboard with callsign and protocol orders
result: pass

#### 2. Sign out and sign back in
expected: Settings → Sign Out → confirm → returns to welcome screen. Sign back in works correctly.
result: issue
reported: "I signed in as CoachJasper@WellTrained.Fitness, and it made me go to the onboarding flow, even though I already have an account."
severity: major

### Onboarding Flow (New User)

#### 3. Complete onboarding flow
expected: New user path: Welcome → Value Prop → Profile (name, units, training days, fitness level) → Goal selection → Archetype selection → Macros (auto-calculated) → Paywall (optional) → Final screen → Home dashboard
result: issue
reported: "After entering my name, it takes me to a health and safety notice. When I check the checkbox and press continue, it doesn't go to the next screen. When I click back, it doesn't go to the screen before."
severity: blocker

#### 4. Archetype selection displays correctly
expected: Archetype screen shows 5 options (Bro, Himbo, Brute, Pup, Bull) with cards showing name, tagline, and badge (FREE/PREMIUM/COMING SOON). Bro is always selectable. Can select and continue.
result: [pending]

### Home Dashboard

#### 5. Home dashboard displays protocol orders
expected: Home screen shows greeting with callsign, protocol orders section with context-aware cards (Daily Check-in, Workout Scheduled if training day, etc.), and rank card at bottom with DP progress bar
result: [pending]

### Daily Check-In Flow

#### 6. Complete daily check-in
expected: Tap "Check In" from Home → modal opens with 5 compliance items (Workout, Protein, Meal Plan, Steps, Sleep) → toggle items on/off → tap "Submit Report" → DP animations play showing points earned → if 5/5, Share button appears
result: [pending]

#### 7. HealthKit data auto-populates in check-in
expected: If HealthKit connected, steps and sleep should auto-populate with today's data. Manual entry available if not connected.
result: [pending]

#### 8. Badge unlock on check-in
expected: If earning a new badge (e.g., 7-day streak), after check-in submit, Badge Unlock Modal should appear showing the unlocked badge
result: [pending]

#### 9. Rank up celebration
expected: If check-in causes rank increase, Rank Up Modal should appear with celebration animation, new rank name, and avatar evolution preview
result: [pending]

#### 10. Share compliance card
expected: After 5/5 check-in, tap "Share" button → system share sheet opens with branded compliance card image showing 5/5 status, date, and callsign
result: [pending]

### Workout Tracking

#### 11. View today's workout
expected: Navigate to Workouts tab → "Today" section shows scheduled workout type (Push/Pull/Legs/Upper/Lower) with "Start Workout" button if it's a training day
result: [pending]

#### 12. Start and log workout
expected: Tap "Start Workout" → exercise list expands → for each exercise, enter weight and reps for each set → tap checkmarks to confirm → after all exercises, tap "Finish Workout" → workout logged with timestamp
result: [pending]

#### 13. Quick compliance log
expected: Under Today card, tap "Log quick compliance instead" → workout marked as completed without detailed logging → counts for daily check-in
result: [pending]

#### 14. Customize workout template
expected: Scroll to "Customize Workouts" section → tap edit icon on a workout type → can add, remove, or reorder exercises → can set target sets and reps → changes save automatically
result: [pending]

#### 15. Share workout completion
expected: After finishing workout, share card option appears → tap to open share sheet with workout summary card
result: [pending]

### Macro Tracking

#### 16. View macro dashboard
expected: Navigate to Macros tab → see daily macro summary with progress rings for calories, protein, carbs, fat → shows target vs actual
result: [pending]

#### 17. Search and log food
expected: Tap "Log Meal" or "+" button → search modal opens → type food name → results appear from food database → select food → adjust quantity and unit → tap "Add" → macro totals update in real-time
result: [pending]

#### 18. Use saved meals
expected: Tap "Saved Meals" → see list of previously saved meal combinations → tap saved meal → all items added to today's log at once
result: [pending]

#### 19. Edit macro targets
expected: Can adjust daily macro targets (calories, protein, carbs, fat) → changes save and affect compliance calculation
result: [pending]

### Avatar & Progression

#### 20. View avatar screen
expected: Navigate to Avatar tab → large animated avatar displays (evolves through 5 stages based on rank) → shows archetype name with bonus description → rank progress bar with DP totals → obedience streak counter
result: [pending]

#### 21. Avatar mood reflects engagement
expected: Avatar shows different moods (happy, neutral, sad, hyped, neglected) based on recent engagement patterns
result: [pending]

### Achievements

#### 22. View achievements
expected: From Avatar screen or nav → tap Achievements → grid of badges displayed → earned badges highlighted/colored → can tap badge to see description and unlock criteria
result: [pending]

### Locked Protocol

#### 23. Start locked protocol
expected: Navigate to Locked Protocol screen → select protocol type (Continuous or Day Lock) → select duration (7/14/21/30/60/90 days) → tap "Start Protocol" → share card option appears
result: [pending]

#### 24. Log locked protocol daily
expected: During active protocol, can log daily compliance from Locked Protocol screen → milestone DP bonuses at 7, 14, 21, 30, 60, 90 days → share cards available at milestones
result: [pending]

#### 25. Locked protocol streak tracking
expected: Continuous mode: breaking streak ends protocol. Day Lock mode: more forgiving, allows missed days.
result: [pending]

### Recruit/Referral

#### 26. View referral code
expected: Navigate to Recruit screen → see unique referral code in CALLSIGN-XXXX format → tap "Share Invite" → native share sheet opens with referral URL
result: [pending]

#### 27. Track referral status
expected: Recruit screen shows recruit status cards with pending and completed referrals → displays DP earned from successful referrals
result: [pending]

### Weekly Report

#### 28. View weekly report
expected: From Home (if "Daily Report Pending" card appears) or Weekly Report screen → see summary of week's compliance, DP earned, workouts completed → share card option available
result: [pending]

### Weight Tracking

#### 29. Log weight entry
expected: Settings → Weight section → enter current weight → tap "Log" → weight chart updates with new data point → trend line and rate of change update
result: [pending]

#### 30. Set goal weight
expected: Settings → enter goal weight → tap "Set Goal" → projected goal date calculates based on current trend
result: [pending]

### Notifications

#### 31. Configure notifications
expected: Settings → Notifications section → toggle switches for morning reminder, workout reminder, evening check-in → time pickers for each type → notifications schedule correctly
result: [pending]

### Premium Features

#### 32. View paywall
expected: Access paywall from Settings or when selecting premium archetype → see monthly and annual pricing options → tap plan opens Apple IAP sheet
result: [pending]

#### 33. Restore purchases
expected: Settings or Paywall → tap "Restore Purchases" → RevenueCat checks receipt and restores premium entitlements if valid
result: [pending]

### Data Management

#### 34. Export data
expected: Settings → Data section → tap "Export Data" → JSON file generated with all user data → native share sheet opens with file
result: [pending]

## Summary

total: 34
passed: 1
issues: 2
pending: 31
skipped: 0

## Gaps

- truth: "Existing user signs in and lands on Home dashboard (not onboarding)"
  status: failed
  reason: "User reported: I signed in as CoachJasper@WellTrained.Fitness, and it made me go to the onboarding flow, even though I already have an account."
  severity: major
  test: 2
  root_cause: "Race condition between authentication and profile loading causes existing users to be routed to onboarding when their profile hasn't loaded into local state yet. App.tsx routing checks authLoading but not isSyncing before making routing decision."
  artifacts:
    - path: "src/App.tsx"
      issue: "Routing logic checks authLoading but not isSyncing (lines 244-300)"
    - path: "src/stores/authStore.ts"
      issue: "signIn() calls syncData() without awaiting (lines 109-149)"
    - path: "src/lib/sync.ts"
      issue: "loadProfileFromCloud loads profile asynchronously but routing happens before completion"
  missing:
    - "Add isSyncing check in App.tsx before routing decisions"
    - "Show loading state while sync is in progress"
  debug_session: ".planning/debug/existing-user-onboarding-routing.md"

- truth: "Health disclaimer screen in onboarding advances on Continue and goes back on Back button"
  status: failed
  reason: "User reported: After entering my name, it takes me to a health and safety notice. When I check the checkbox and press continue, it doesn't go to the next screen. When I click back, it doesn't go to the screen before."
  severity: blocker
  test: 3
  root_cause: "Navigation conflict between hardcoded navigate() calls and store-controlled routing. Disclaimer screen uses direct navigate() calls while useEffect enforces URL-to-store synchronization, causing navigation to be immediately reverted."
  artifacts:
    - path: "src/navigation/OnboardingStack.tsx"
      issue: "Disclaimer route uses hardcoded navigate() calls (lines 50, 58) that conflict with store-sync useEffect (lines 24-27)"
  missing:
    - "Create proper DisclaimerScreen component"
    - "Replace navigate() calls with nextStep() and prevStep() methods"
  debug_session: ".planning/debug/health-disclaimer-navigation-broken.md"
