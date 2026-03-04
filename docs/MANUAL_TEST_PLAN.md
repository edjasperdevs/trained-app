# Manual Test Plan - WellTrained App

**Version:** 1.0
**Date:** March 4, 2026
**Purpose:** Pre-App Store submission testing

---

## Test Account Setup

Use the browser console to seed different test accounts. Each account tests specific user scenarios.

### How to Use Test Accounts

1. Open the app in browser/simulator
2. Open Developer Console (Cmd+Option+I)
3. Run the appropriate seed command
4. Refresh the page

```javascript
// Import and run from console:
import('/src/lib/devSeed.ts').then(m => m.seedTestData())

// Or for specific personas:
import('/src/lib/devSeed.ts').then(m => m.seedPersona('newbie'))
```

### Test Personas

| Persona | Archetype | Goal | Units | Training | Rank | Use Case |
|---------|-----------|------|-------|----------|------|----------|
| `newbie` | Bro (free) | Maintain | Imperial | 3 days | 1 | Fresh onboarding, minimal data |
| `veteran` | Bro (free) | Recomp | Imperial | 4 days | 8 | Long-term user, many achievements |
| `premium_himbo` | Himbo | Bulk | Imperial | 5 days | 5 | Premium training-focused user |
| `premium_brute` | Brute | Cut | Metric | 4 days | 6 | Premium nutrition-focused user |
| `premium_pup` | Pup | Maintain | Metric | 3 days | 4 | Premium lifestyle-focused user |
| `premium_bull` | Bull | Bulk | Imperial | 5 days | 7 | Premium consistency-focused user |
| `female_user` | Bro | Cut | Imperial | 4 days | 3 | Female user, different macros |
| `metric_user` | Bro | Bulk | Metric | 4 days | 4 | Tests unit conversions |
| `streak_master` | Bro | Maintain | Imperial | 4 days | 10 | 30+ day streak, streak badges |
| `struggling` | Bro | Cut | Imperial | 3 days | 2 | Broken streaks, missed days |

---

## Test Categories

### 1. Authentication & Onboarding

#### 1.1 Fresh Install Flow
- [ ] App shows splash/auth screen on first launch
- [ ] "Sign Up" flow works with valid email/password
- [ ] "Login" flow works with existing credentials
- [ ] "Forgot Password" sends reset email
- [ ] Invalid email format shows error
- [ ] Weak password shows error
- [ ] Terms & Privacy links work

#### 1.2 Onboarding Steps
- [ ] **Welcome:** Hero image displays, "Start Setup" advances
- [ ] **Profile:** All fields work (username, gender, age, weight, height, goal)
- [ ] **Profile:** Imperial/Metric toggle converts values correctly
- [ ] **Profile:** Validation rejects empty/invalid fields
- [ ] **Profile:** Back button preserves data
- [ ] **Archetype:** All 5 archetypes display with descriptions
- [ ] **Archetype:** Free archetypes (Bro) selectable
- [ ] **Archetype:** Premium archetypes show lock/upsell for free users
- [ ] **Macros:** Auto-calculated based on profile
- [ ] **Macros:** Activity level affects calorie calculation
- [ ] **Initiate:** Shows rank 1, 0 DP, completes onboarding
- [ ] **Redirect:** User lands on Home screen after completion

#### 1.3 Session Persistence
- [ ] Closing app and reopening preserves login
- [ ] Onboarding progress saves if user leaves mid-flow
- [ ] Returning to incomplete onboarding resumes at correct step

---

### 2. Home Screen (Dashboard)

#### 2.1 Avatar Display
- [ ] Avatar shows correct archetype image (bro/brute/bull/himbo/pup)
- [ ] Avatar shows correct evolution stage based on rank (1-5)
- [ ] Avatar mood changes: happy (after action), sad (missed day), neglected (3+ days)
- [ ] Reaction messages display and auto-hide after 3 seconds

#### 2.2 Stats Display
- [ ] Current rank name and number display correctly
- [ ] Total DP shows accumulated points
- [ ] Progress bar shows % to next rank
- [ ] Obedience streak count is accurate
- [ ] Streak paused state shows "Safe Word" indicator

#### 2.3 Reminders
- [ ] Check-in reminder shows if not checked in today
- [ ] Workout reminder shows on training days
- [ ] Log macros reminder shows if meals not logged
- [ ] Dismissing reminder hides it for the day
- [ ] Dismissed reminders don't return until next day

#### 2.4 Navigation
- [ ] Bottom nav highlights current tab
- [ ] All nav items work: Home, Workouts, Macros, Avatar, Settings

---

### 3. Workouts

#### 3.1 Workout Plan Display
- [ ] Shows correct number of training days (3/4/5)
- [ ] Scheduled days highlighted in week view
- [ ] Today's workout emphasized if it's a training day
- [ ] Rest days show "Rest Day" message

#### 3.2 Starting a Workout
- [ ] "Start Workout" button creates workout log
- [ ] Exercises load based on workout type (push/pull/legs/upper/lower)
- [ ] Each exercise shows: name, target sets, target reps
- [ ] Exercise history shows previous weights/reps

#### 3.3 Logging Sets
- [ ] Tap exercise opens set logging modal
- [ ] Weight and reps inputs work (numeric keyboard)
- [ ] "Complete Set" marks set as done
- [ ] "Skip Set" marks set as skipped
- [ ] Warmup toggle available
- [ ] Previous set values can be copied

#### 3.4 Completing Workout
- [ ] "Complete Workout" button available when sets logged
- [ ] Completion awards 50 DP (or modified amount for archetypes)
- [ ] DP toast notification shows earned amount
- [ ] Celebration animation plays
- [ ] Workout marked complete in history

#### 3.5 Minimal Workout
- [ ] "Quick Compliance" option available
- [ ] Notes field for describing abbreviated workout
- [ ] Submitting awards DP
- [ ] Logged as minimal in history

#### 3.6 Workout History
- [ ] Shows last 10+ completed workouts
- [ ] Each entry shows: date, type, duration, exercises
- [ ] Tapping workout shows full details
- [ ] Details include all sets with weights/reps

---

### 4. Macros / Nutrition

#### 4.1 Daily Tab
- [ ] Shows today's macro targets (calories, protein, carbs, fats)
- [ ] Progress bars update as meals logged
- [ ] Percentages calculate correctly
- [ ] Checkmark appears when target hit
- [ ] "Perfect Day" badge when protein + calories both hit

#### 4.2 Logging Meals
- [ ] "Log Meal" button opens entry modal
- [ ] Quick entry accepts manual P/C/F values
- [ ] Food search returns results
- [ ] Selecting food shows macro details
- [ ] Quantity/servings can be adjusted
- [ ] "Log" button adds to today's totals
- [ ] Toast shows DP earned (15 per meal, max 3)

#### 4.3 Recent & Favorites
- [ ] Recently logged foods appear in list
- [ ] Star icon favorites a food
- [ ] Favorites tab shows starred items
- [ ] Quick-add from recent/favorites works

#### 4.4 Saved Meals
- [ ] "Create Meal" opens meal builder
- [ ] Can add multiple ingredients
- [ ] Total macros calculate automatically
- [ ] Saving creates reusable meal
- [ ] Saved meal can be logged in one tap
- [ ] Edit/delete saved meals works

#### 4.5 Macro Calculator
- [ ] Calculator uses profile data by default
- [ ] Can adjust weight/height/age/goal
- [ ] Activity level affects calculations
- [ ] "Apply" updates macro targets

---

### 5. DP (Discipline Points) System

#### 5.1 Earning DP
| Action | Base DP | Test |
|--------|---------|------|
| Training workout | 50 | [ ] |
| Logging meal | 15 (max 3/day) | [ ] |
| Protein target | 25 | [ ] |
| Steps (10k+) | 10 | [ ] |
| Sleep (7h+) | 10 | [ ] |

#### 5.2 Archetype Modifiers
- [ ] Himbo: Training DP = 75 (1.5x)
- [ ] Brute: Meal DP = 22, Protein DP = 37 (1.5x)
- [ ] Pup: Steps DP = 20, Sleep DP = 20 (2x)
- [ ] Bull: No current modifier (v2.1)
- [ ] Bro: No modifiers (base values)

#### 5.3 Ranking Up
- [ ] DP accumulates correctly
- [ ] Rank up triggers at threshold (see table below)
- [ ] Rank up modal shows old -> new rank
- [ ] Rank name updates on Home screen
- [ ] Progress bar resets for next rank

**Rank Thresholds:**
| Rank | Name | DP Required |
|------|------|-------------|
| 1 | Initiate | 250 |
| 2 | Compliant | 750 |
| 3 | Obedient | 1,500 |
| 4 | Disciplined | 2,250 |
| 5 | Conditioned | 3,000 |
| 6 | Proven | 3,750 |
| 7 | Hardened | 4,750 |
| 8 | Forged | 5,750 |
| 9 | Trusted | 6,750 |
| 10 | Enforcer | 7,750 |
| 11 | Seasoned | 9,000 |
| 12 | Elite | 10,250 |
| 13 | Apex | 11,500 |
| 14 | Sovereign | 13,000 |
| 15 | Master | 14,750 |

---

### 6. Streak System

#### 6.1 Streak Mechanics
- [ ] First action of day increments streak
- [ ] Streak displays on Home screen
- [ ] Missing 1 day: Streak pauses (Safe Word)
- [ ] Paused state shows indicator
- [ ] Action after pause: Streak recovers (+1)
- [ ] Missing 2+ days: Streak resets to 1
- [ ] Longest streak tracks all-time high

#### 6.2 Streak Edge Cases
- [ ] Multiple actions same day: Only first counts
- [ ] Timezone handling: Uses local date
- [ ] App restart: Streak persists
- [ ] Day rollover at midnight local time

---

### 7. Achievements / Badges

#### 7.1 Badge Display
- [ ] Achievements screen shows all badges
- [ ] Earned badges show with date earned
- [ ] Unearned badges show progress bar
- [ ] Badge rarity indicated (common/rare/epic/legendary)
- [ ] Categories organized (Streak/Workout/Nutrition/Rank)

#### 7.2 Badge Unlock Testing
| Badge | Requirement | Test |
|-------|-------------|------|
| First Rep | 1 workout | [ ] |
| Day One | 1 check-in | [ ] |
| Iron Will | 7-day streak | [ ] |
| Relentless | 30-day streak | [ ] |
| Warming Up | 10 workouts | [ ] |
| Building Momentum | 25 workouts | [ ] |
| Well Fueled | 7 days protein hit | [ ] |
| Rising | Rank 3 | [ ] |
| Established | Rank 5 | [ ] |
| Veteran | Rank 8 | [ ] |

#### 7.3 Unlock Notifications
- [ ] Toast notification on badge earn
- [ ] Badge animation plays
- [ ] Multiple badges same action: All show

---

### 8. Avatar Screen

#### 8.1 Avatar Display
- [ ] Shows current archetype avatar image
- [ ] Evolution stage matches rank (Stage 1: R1-3, Stage 2: R4-7, etc.)
- [ ] Current mood reflected in UI

#### 8.2 Stats Display
- [ ] Current rank and name
- [ ] Total DP
- [ ] Current streak
- [ ] Role/archetype info

---

### 9. Settings

#### 9.1 Profile Settings
- [ ] Username editable
- [ ] Weight logging works
- [ ] Weight history chart displays
- [ ] Goal weight settable
- [ ] Weight trend calculations accurate
- [ ] Projected goal date shows (if data available)

#### 9.2 Workout Settings
- [ ] Training days adjustable (3/4/5)
- [ ] Day selection works (Sun-Sat buttons)
- [ ] Custom exercise link works

#### 9.3 Unit System
- [ ] Imperial/Metric toggle
- [ ] Weight converts correctly
- [ ] Height converts correctly
- [ ] Historical data converts

#### 9.4 Archetype Change
- [ ] Current archetype displayed
- [ ] Free archetypes selectable
- [ ] Premium archetypes locked for free users
- [ ] Change applies immediately

#### 9.5 Notifications (iOS)
- [ ] Toggle for each reminder type
- [ ] Time picker works
- [ ] Changes schedule notifications

#### 9.6 Subscription (iOS)
- [ ] "Upgrade" button for free users
- [ ] "Manage Subscription" for premium
- [ ] "Restore Purchases" works

#### 9.7 Data Management
- [ ] Export data downloads JSON
- [ ] Import data restores from JSON
- [ ] Reset all data requires confirmation
- [ ] Reset clears all progress

#### 9.8 Sign Out
- [ ] Sign out requires confirmation
- [ ] Clears all local data
- [ ] Returns to auth screen

---

### 10. Premium / Paywall

#### 10.1 Paywall Display
- [ ] Shows for non-premium users only
- [ ] Feature highlights display
- [ ] Monthly and annual options shown
- [ ] Pricing accurate

#### 10.2 Purchase Flow
- [ ] Monthly purchase initiates payment
- [ ] Annual purchase initiates payment
- [ ] Success unlocks premium features
- [ ] Error shows appropriate message
- [ ] Cancel doesn't show error

#### 10.3 Premium Features
- [ ] Premium archetypes unlocked
- [ ] Avatar stages 3-5 visible (if implemented)
- [ ] Premium badge/indicator in settings

#### 10.4 Restore Purchases
- [ ] Restore button available
- [ ] Restores previous purchase
- [ ] Shows success/error feedback

---

### 11. Offline / Sync

#### 11.1 Offline Mode
- [ ] App functions without network
- [ ] Data saves to local storage
- [ ] "Offline" indicator shows
- [ ] Actions queue for sync

#### 11.2 Sync Behavior
- [ ] Data syncs when online
- [ ] Sync indicator shows progress
- [ ] Conflicts resolve (newer wins)
- [ ] No duplicate entries

---

### 12. Edge Cases & Error Handling

#### 12.1 Input Validation
- [ ] Empty fields show errors
- [ ] Invalid email format rejected
- [ ] Negative numbers rejected
- [ ] Extremely large values handled

#### 12.2 Network Errors
- [ ] Network loss during action: Saves locally
- [ ] API timeout: Shows retry option
- [ ] Auth expired: Redirects to login

#### 12.3 Data Integrity
- [ ] App restart preserves data
- [ ] Force quit preserves data
- [ ] Multiple tabs sync (web)

---

### 13. Platform-Specific (iOS)

#### 13.1 Visual
- [ ] Safe area (notch/dynamic island) respected
- [ ] Status bar color correct
- [ ] Keyboard doesn't overlap content
- [ ] Bottom tab bar visible

#### 13.2 Functionality
- [ ] HealthKit permission request works
- [ ] Steps data imports (if permitted)
- [ ] Sleep data imports (if permitted)
- [ ] Push notifications work
- [ ] App icon correct
- [ ] Splash screen displays

#### 13.3 Device Testing
- [ ] iPhone 14 Pro Max (large)
- [ ] iPhone 14 (standard)
- [ ] iPhone SE (small)
- [ ] Portrait orientation
- [ ] Keyboard interactions

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Install latest build
- [ ] Clear all previous data
- [ ] Verify test accounts created
- [ ] Document device/OS version

### Test Session Recording
For each test:
1. Note expected result
2. Note actual result
3. Mark PASS/FAIL
4. Screenshot failures
5. Note device and date

### Post-Test
- [ ] All critical paths pass
- [ ] No crashes observed
- [ ] Performance acceptable
- [ ] All premium features work
- [ ] Data persists correctly

---

## Sign-Off

| Tester | Date | Device | Build | Status |
|--------|------|--------|-------|--------|
| | | | | |
| | | | | |

**Ready for App Store:** [ ] Yes / [ ] No

**Blocking Issues:**
1.
2.
3.

**Notes:**

