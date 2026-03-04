# Manual QA Test Plan - WellTrained v1.0

## Test Environment Setup
- iOS device with app installed via Xcode
- Test account credentials
- Fresh install (delete app before critical tests)

---

## 1. Authentication

### 1.1 Sign Up - New User
**User Story:** As a new user, I want to create an account so I can start tracking my fitness.

**Steps:**
1. Launch app (fresh install)
2. Tap "Sign Up"
3. Enter valid email and password (8+ chars)
4. Tap "Create Account"
5. Check email for verification link
6. Tap verification link

**Expected:** Redirected to Access Code screen

**Edge Cases:**
- [ ] Invalid email format → Error message
- [ ] Password < 8 chars → Error message
- [ ] Email already registered → Error message
- [ ] No internet → Offline error

---

### 1.2 Sign In - Existing User
**User Story:** As a returning user, I want to sign in to access my data.

**Steps:**
1. Launch app
2. Enter email and password
3. Tap "Sign In"

**Expected:** Redirected to Home (if onboarding complete) or Onboarding

**Edge Cases:**
- [ ] Wrong password → Error message
- [ ] Non-existent account → Error message
- [ ] Account not verified → Prompt to verify

---

### 1.3 Password Reset
**User Story:** As a user who forgot my password, I want to reset it.

**Steps:**
1. Tap "Forgot Password"
2. Enter email
3. Tap "Send Reset Link"
4. Check email, tap link
5. Enter new password
6. Tap "Update Password"

**Expected:** Success message, can sign in with new password

---

### 1.4 Access Code Entry
**User Story:** As a new user, I need to enter an access code to use the app.

**Steps:**
1. Complete sign up
2. Enter valid access code (8+ chars or master code)
3. Tap "Activate"

**Expected:** Redirected to Onboarding

**Edge Cases:**
- [ ] Invalid code → Error message
- [ ] Code < 8 chars → Validation error
- [ ] Already used code → Depends on code type

---

## 2. Onboarding

### 2.1 Complete Onboarding Flow
**User Story:** As a new user, I want to set up my profile so the app is personalized.

**Steps:**
1. Enter display name
2. Select gender
3. Select fitness level
4. Select training days per week
5. Select training schedule
6. Enter weight
7. Enter height
8. Enter age
9. Select goal (cut/recomp/maintain/bulk)
10. Select avatar base
11. Select archetype

**Expected:** Redirected to Home screen with profile complete

**Edge Cases:**
- [ ] Skip steps → Should not be possible
- [ ] Invalid weight/height → Validation error
- [ ] App killed mid-onboarding → Resume from last step
- [ ] Back button → Navigate to previous step

---

### 2.2 Onboarding Persistence
**User Story:** As a user, if I close the app during onboarding, I want to resume where I left off.

**Steps:**
1. Start onboarding, complete 5 steps
2. Force close app
3. Reopen app

**Expected:** Resume at step 6

---

## 3. Home Screen

### 3.1 View Dashboard
**User Story:** As a user, I want to see my progress at a glance.

**Steps:**
1. Navigate to Home tab

**Expected:**
- Current DP displayed
- Current rank displayed
- Streak counter visible
- Avatar displayed
- Daily assignments visible

---

### 3.2 DP Toast Notification
**User Story:** As a user, I want immediate feedback when I earn DP.

**Steps:**
1. Complete a workout OR log a meal
2. Return to Home

**Expected:** Floating "+X DP" toast appears and animates away

---

### 3.3 Rank Up Celebration
**User Story:** As a user, I want to celebrate when I reach a new rank.

**Steps:**
1. Earn enough DP to rank up
2. Observe celebration

**Expected:**
- Confetti animation
- Rank up modal with trophy
- New rank name displayed
- Haptic feedback

---

### 3.4 Streak Display
**User Story:** As a user, I want to see my current streak and weekly activity.

**Steps:**
1. View Home screen
2. Check streak badge and calendar

**Expected:**
- Current streak number with flame icon
- 7-day calendar with checkmarks for active days
- Today highlighted if active

**Edge Cases:**
- [ ] Missed day → Streak resets (unless Safe Word used)
- [ ] First day → Streak shows 1
- [ ] Safe Word active → Grace period indicator

---

## 4. Workouts

### 4.1 Log a Workout
**User Story:** As a user, I want to log my workout to track progress.

**Steps:**
1. Navigate to Workouts tab
2. Tap "Start Workout" or select a template
3. Add exercises
4. Log sets (weight, reps)
5. Tap "Complete Workout"

**Expected:**
- Workout saved to history
- DP awarded (+50)
- Toast notification

**Edge Cases:**
- [ ] Empty workout → Should not save
- [ ] Only warmup sets → Should not count as complete
- [ ] App crash during workout → Data persisted locally

---

### 4.2 Quick Compliance Mode
**User Story:** As a user short on time, I want to log a minimal workout.

**Steps:**
1. Start workout
2. Toggle "Quick Compliance" mode
3. Complete minimal exercises
4. Finish workout

**Expected:** Workout logged, DP awarded

---

### 4.3 Exercise Reordering
**User Story:** As a user, I want to reorder exercises mid-workout.

**Steps:**
1. Start workout with multiple exercises
2. Long press an exercise
3. Drag to new position
4. Release

**Expected:** Exercise order updated

---

### 4.4 Auto Warmup Sets
**User Story:** As a user, I want warmup sets pre-populated at 50% weight.

**Steps:**
1. Add exercise with previous weight data
2. Add warmup set

**Expected:** Weight field shows 50% of working weight

---

### 4.5 View Workout History
**User Story:** As a user, I want to see my past workouts.

**Steps:**
1. Navigate to Workouts tab
2. Scroll down to history section

**Expected:** List of past workouts with dates and exercises

---

## 5. Macros / Nutrition

### 5.1 Log a Meal
**User Story:** As a user, I want to log my meals to track macros.

**Steps:**
1. Navigate to Macros tab
2. Tap "Add Meal" or "+"
3. Search for food
4. Select food item
5. Adjust quantity
6. Tap "Add"

**Expected:**
- Meal added to daily log
- Macro totals updated
- DP awarded (+15, max 3x/day)

---

### 5.2 Food Search - USDA
**User Story:** As a user, I want to search a comprehensive food database.

**Steps:**
1. Tap "Add Meal"
2. Type food name (e.g., "chicken breast")
3. View results

**Expected:** Results from USDA database with macro info

**Edge Cases:**
- [ ] No results → "No foods found" message
- [ ] API rate limited → Falls back to Open Food Facts
- [ ] Offline → Search saved/recent foods only

---

### 5.3 Save Favorite Meal
**User Story:** As a user, I want to save meals I eat frequently.

**Steps:**
1. Log a meal
2. Tap heart/save icon on the meal
3. Check Favorites section

**Expected:** Meal appears in Favorites for quick re-logging

---

### 5.4 Recent Foods
**User Story:** As a user, I want quick access to recently logged foods.

**Steps:**
1. Tap "Add Meal"
2. Check "Recent" section

**Expected:** Recently logged foods displayed for quick add

---

### 5.5 Hit Protein Target
**User Story:** As a user, I want to earn DP for hitting my protein target.

**Steps:**
1. Log meals throughout day
2. Reach protein target

**Expected:** +25 DP awarded, visual indicator

---

### 5.6 View Macro Adherence
**User Story:** As a user, I want to see how well I'm hitting my targets.

**Steps:**
1. Navigate to Macros tab
2. View daily progress bars

**Expected:**
- Calories progress bar
- Protein progress bar
- Percentage of target shown

---

## 6. Gamification

### 6.1 Earn DP from Actions
**User Story:** As a user, I want to earn DP from completing daily actions.

| Action | DP | Test Steps |
|--------|-----|------------|
| Training | +50 | Complete a workout |
| Meal logged | +15 | Log a meal (max 3x) |
| Protein target | +25 | Hit daily protein |
| 10k steps | +10 | Sync 10k+ steps from HealthKit |
| 7+ hrs sleep | +10 | Log 7+ hours sleep |

---

### 6.2 Archetype Modifiers
**User Story:** As a premium user, I want my archetype to boost my DP earnings.

**Steps:**
1. Select premium archetype during onboarding
2. Complete relevant action
3. Check DP earned

**Expected:**
- Himbo: +50% training DP
- Brute: +50% nutrition DP
- Pup: +100% lifestyle DP

---

### 6.3 Streak Recovery (Safe Word)
**User Story:** As a user who missed a day, I want a chance to recover my streak.

**Steps:**
1. Build a streak of 3+ days
2. Miss one day
3. Return next day
4. Tap "Use Safe Word" (if available)

**Expected:** Streak preserved, Safe Word consumed

**Edge Cases:**
- [ ] Miss 2+ days → Streak lost, no recovery
- [ ] Safe Word already used this week → Not available

---

## 7. Avatar

### 7.1 View Avatar
**User Story:** As a user, I want to see my avatar and its mood.

**Steps:**
1. Navigate to Avatar tab

**Expected:**
- Avatar displayed in current evolution stage
- Mood indicator (Happy/Neutral/Sad/Hyped/Neglected)
- Stats visible

---

### 7.2 Avatar Evolution
**User Story:** As a user, I want my avatar to evolve as I progress.

**Steps:**
1. Reach rank threshold for evolution
2. View Avatar tab

**Expected:** Avatar displays new evolution stage

---

### 7.3 Avatar Mood Changes
**User Story:** As a user, I want my avatar's mood to reflect my activity.

| Condition | Expected Mood |
|-----------|---------------|
| Active today, streak maintained | Happy |
| Just ranked up | Hyped |
| Inactive today | Neutral → Sad |
| Streak broken | Neglected |

---

## 8. Achievements

### 8.1 View Achievement Collection
**User Story:** As a user, I want to see all available achievements.

**Steps:**
1. Navigate to Achievements tab
2. Browse categories

**Expected:**
- Achievements grouped by category
- Earned badges highlighted
- Locked badges grayed out
- Rarity indicators visible

---

### 8.2 Unlock Achievement
**User Story:** As a user, I want to be notified when I unlock an achievement.

**Steps:**
1. Complete achievement criteria (e.g., 7-day streak)
2. Observe notification

**Expected:**
- Achievement unlock modal
- Badge added to collection
- Haptic feedback

---

## 9. Weekly Check-in

### 9.1 Submit Weekly Check-in
**User Story:** As a user, I want to submit my weekly progress.

**Steps:**
1. Navigate to Check-in tab (or Home prompt)
2. Fill out 16-field form
3. Review auto-populated data
4. Tap "Submit"

**Expected:**
- Check-in saved
- Status: "Submitted"
- Coach notified (if applicable)

---

### 9.2 Auto-populated Data
**User Story:** As a user, I want my check-in pre-filled with tracked data.

**Steps:**
1. Open Weekly Check-in form

**Expected auto-populated fields:**
- Current weight
- 7-day weight average
- Weekly weight change
- Macro hit rate %
- Workouts completed
- Cardio sessions
- Average steps

---

## 10. Settings

### 10.1 Update Weight
**User Story:** As a user, I want to log my weight.

**Steps:**
1. Navigate to Settings
2. Tap weight field
3. Enter new weight
4. Save

**Expected:** Weight logged, trend updated

---

### 10.2 View Weight Trend
**User Story:** As a user, I want to see my weight progress.

**Steps:**
1. Navigate to Settings
2. View weight chart

**Expected:** Line chart showing weight history

---

### 10.3 Change Units
**User Story:** As a user, I want to switch between imperial/metric.

**Steps:**
1. Navigate to Settings
2. Toggle unit system

**Expected:** All weights/heights display in new unit

---

### 10.4 Export Data
**User Story:** As a user, I want to backup my data.

**Steps:**
1. Navigate to Settings
2. Tap "Export Data"
3. Save file

**Expected:** JSON file downloaded with all user data

---

### 10.5 Import Data
**User Story:** As a user, I want to restore my data.

**Steps:**
1. Navigate to Settings
2. Tap "Import Data"
3. Select backup file

**Expected:** Data restored, UI updated

---

### 10.6 Delete Account
**User Story:** As a user, I want to delete my account and all data.

**Steps:**
1. Navigate to Settings
2. Tap "Delete Account"
3. Confirm deletion

**Expected:**
- All user data deleted
- Signed out
- Redirected to Auth screen

---

## 11. Offline Functionality

### 11.1 Offline Workout Logging
**User Story:** As a user without internet, I want to still log workouts.

**Steps:**
1. Enable airplane mode
2. Log a workout
3. Complete workout

**Expected:** Workout saved locally

---

### 11.2 Sync on Reconnect
**User Story:** As a user, I want my offline data to sync when online.

**Steps:**
1. Complete actions offline
2. Disable airplane mode
3. Wait for sync indicator

**Expected:** Data synced to cloud, indicator shows success

---

### 11.3 Offline Meal Logging
**User Story:** As a user offline, I want to log meals from saved/recent foods.

**Steps:**
1. Enable airplane mode
2. Add meal from Recent or Favorites

**Expected:** Meal logged locally

---

## 12. Health Integration (iOS)

### 12.1 Grant HealthKit Permission
**User Story:** As an iOS user, I want to connect HealthKit for step tracking.

**Steps:**
1. Fresh install, complete onboarding
2. See health permission prompt
3. Tap "Allow"
4. Grant steps permission in iOS dialog

**Expected:** Steps sync to app

---

### 12.2 Sync Steps
**User Story:** As a user, I want my steps synced from Apple Health.

**Steps:**
1. Walk 10,000+ steps (or simulate in Health app)
2. Open WellTrained app
3. Check Home screen

**Expected:** Step count displayed, +10 DP if 10k+ reached

---

### 12.3 Deny HealthKit Permission
**User Story:** As a user, I can skip HealthKit and enter data manually.

**Steps:**
1. See health permission prompt
2. Tap "Skip" or deny iOS dialog

**Expected:** App functions without HealthKit, manual entry available

---

## 13. Push Notifications

### 13.1 Grant Push Permission
**User Story:** As a user, I want to receive reminders.

**Steps:**
1. On first launch, see push permission prompt
2. Tap "Allow"

**Expected:** Device registered for push

---

### 13.2 Receive Reminder
**User Story:** As a user, I want to be reminded to log my workout.

**Steps:**
1. Set reminder time in Settings
2. Wait for scheduled time

**Expected:** Push notification received

---

## 14. Navigation & UI

### 14.1 Tab Navigation
**User Story:** As a user, I want to navigate between main sections.

**Steps:**
1. Tap each tab: Home, Workouts, Macros, Avatar, Settings

**Expected:**
- Smooth transitions
- Correct screen displayed
- Active tab highlighted
- Haptic feedback on tap

---

### 14.2 Pull to Refresh
**User Story:** As a user, I want to refresh data.

**Steps:**
1. Pull down on scrollable screen

**Expected:** Data refreshes, sync occurs

---

### 14.3 Loading States
**User Story:** As a user, I want feedback while content loads.

**Steps:**
1. Navigate to any screen with async data

**Expected:** Skeleton loaders displayed until content ready

---

## 15. Edge Cases & Error Handling

### 15.1 Network Timeout
**Steps:** Simulate slow network, perform action requiring API

**Expected:** Timeout error, retry option

---

### 15.2 Session Expired
**Steps:** Leave app for extended period, return

**Expected:** Auto-refresh session or prompt to sign in

---

### 15.3 Invalid Data Entry
**Steps:** Enter invalid values in forms (negative weight, future dates)

**Expected:** Validation errors, form not submitted

---

### 15.4 Storage Full
**Steps:** Fill device storage, try to save data

**Expected:** Graceful error message

---

### 15.5 App Backgrounded During Action
**Steps:** Start action, switch apps, return

**Expected:** Action completes or resumes appropriately

---

## 16. Accessibility

### 16.1 VoiceOver Navigation
**Steps:** Enable VoiceOver, navigate app

**Expected:** All elements properly labeled

---

### 16.2 Dynamic Type
**Steps:** Increase iOS text size to max

**Expected:** Text scales appropriately, no truncation

---

### 16.3 Reduced Motion
**Steps:** Enable "Reduce Motion" in iOS settings

**Expected:** Animations reduced/disabled

---

## Sign-off Checklist

### Pre-Launch Verification
- [ ] All critical paths tested
- [ ] No crash bugs
- [ ] Data persists across sessions
- [ ] Offline mode functional
- [ ] Push notifications working
- [ ] HealthKit integration verified
- [ ] Performance acceptable
- [ ] No console errors in production

### Device Testing
- [ ] iPhone SE (small screen)
- [ ] iPhone 14/15 (standard)
- [ ] iPhone Pro Max (large screen)
- [ ] iOS 16 minimum
- [ ] iOS 17+

---

*Last Updated: March 2026*
