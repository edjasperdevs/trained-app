# User Stories for E2E Test Coverage

This document defines user stories for the WellTrained app. Each story maps to expected e2e test coverage.

## Legend

| Status | Meaning |
|--------|---------|
| :white_check_mark: | Covered by existing e2e test |
| :yellow_circle: | Partially covered |
| :x: | Not covered - needs test |

---

## 1. Authentication & Access

### 1.1 Access Gate
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| AUTH-01 | As a new user, I can enter an access code to unlock the app | :white_check_mark: | auth-onboarding.spec.ts |
| AUTH-02 | As a user, I see an error when entering an invalid access code | :x: | - |

### 1.2 Account Creation
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| AUTH-03 | As a new user, I can create an account with email/password | :white_check_mark: | auth-onboarding.spec.ts |
| AUTH-04 | As a user, I see validation errors for invalid email format | :x: | - |
| AUTH-05 | As a user, I see validation errors for weak passwords | :x: | - |
| AUTH-06 | As a user, I can toggle password visibility | :x: | - |

### 1.3 Sign In
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| AUTH-07 | As a returning user, I can sign in with my credentials | :white_check_mark: | auth-onboarding.spec.ts |
| AUTH-08 | As a user, I see an error for incorrect credentials | :x: | - |

### 1.4 Password Recovery
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| AUTH-09 | As a user, I can request a password reset email | :x: | - |
| AUTH-10 | As a user, I can reset my password via the reset link | :x: | - |

### 1.5 Sign Out
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| AUTH-11 | As a user, I can sign out from Settings | :white_check_mark: | auth-onboarding.spec.ts |
| AUTH-12 | As a user, my data persists after signing back in | :white_check_mark: | meal-persistence.spec.ts |

---

## 2. Onboarding

### 2.1 Profile Setup
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| ONB-01 | As a new user, I complete the onboarding wizard | :white_check_mark: | auth-onboarding.spec.ts |
| ONB-02 | As a user, I can set my username | :white_check_mark: | auth-onboarding.spec.ts |
| ONB-03 | As a user, I can select my biological sex | :white_check_mark: | auth-onboarding.spec.ts |
| ONB-04 | As a user, I can select my fitness level | :white_check_mark: | auth-onboarding.spec.ts |
| ONB-05 | As a user, I can select training days per week | :white_check_mark: | auth-onboarding.spec.ts |
| ONB-06 | As a user, I can select which days I train | :white_check_mark: | auth-onboarding.spec.ts |
| ONB-07 | As a user, I can enter my weight/height/age | :white_check_mark: | auth-onboarding.spec.ts |
| ONB-08 | As a user, I can select my fitness goal | :white_check_mark: | auth-onboarding.spec.ts |
| ONB-09 | As a user, I can choose my avatar persona | :white_check_mark: | auth-onboarding.spec.ts |
| ONB-10 | As a user, my macro targets are calculated automatically | :yellow_circle: | auth-onboarding.spec.ts |
| ONB-11 | As a user, my onboarding progress persists if I leave | :x: | - |

---

## 3. Home Screen

### 3.1 Daily Check-In
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| HOME-01 | As a user, I can submit my daily check-in | :white_check_mark: | core-journeys.spec.ts |
| HOME-02 | As a user, I see the check-in button only if I haven't checked in today | :white_check_mark: | core-journeys.spec.ts |
| HOME-03 | As a user, I see "Daily Report Complete" after checking in | :white_check_mark: | core-journeys.spec.ts |
| HOME-04 | As a user, I earn DP for completing my daily check-in | :yellow_circle: | core-journeys.spec.ts |

### 3.2 XP/DP System
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| HOME-05 | As a user, I can claim my weekly XP after 7 days | :white_check_mark: | core-journeys.spec.ts |
| HOME-06 | As a user, I see my current XP and level displayed | :white_check_mark: | auth-onboarding.spec.ts |
| HOME-07 | As a user, I see my current streak displayed | :white_check_mark: | auth-onboarding.spec.ts |

### 3.3 Navigation
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| HOME-08 | As a user, I can navigate to all main screens | :white_check_mark: | smoke.spec.ts |
| HOME-09 | As a user, I can tap my avatar to go to the Avatar screen | :x: | - |

### 3.4 Streak Display
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| HOME-10 | As a user, my streak increments after daily check-in | :yellow_circle: | core-journeys.spec.ts |
| HOME-11 | As a user, I see a streak calendar visualization | :x: | - |

---

## 4. Workouts

### 4.1 Starting a Workout
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| WRK-01 | As a user, I can start today's scheduled workout | :white_check_mark: | core-journeys.spec.ts |
| WRK-02 | As a user, I see exercises with warmup sets | :white_check_mark: | workout-features.spec.ts |
| WRK-03 | As a user, I see weight/reps input labels | :white_check_mark: | workout-features.spec.ts |

### 4.2 Logging Sets
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| WRK-04 | As a user, I can enter weight and reps for each set | :white_check_mark: | core-journeys.spec.ts |
| WRK-05 | As a user, I can mark a set as complete | :white_check_mark: | core-journeys.spec.ts |
| WRK-06 | As a user, completed set values carry forward as placeholders | :white_check_mark: | workout-features.spec.ts |
| WRK-07 | As a user, I can skip a set | :x: | - |
| WRK-08 | As a user, I can undo a completed set | :x: | - |

### 4.3 Exercise Management
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| WRK-09 | As a user, I can reorder exercises during a workout | :white_check_mark: | workout-features.spec.ts |
| WRK-10 | As a user, I can add an exercise mid-workout | :x: | - |
| WRK-11 | As a user, I can view exercise history | :x: | - |

### 4.4 Workout Completion
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| WRK-12 | As a user, I can complete my workout and see "Done!" | :white_check_mark: | core-journeys.spec.ts |
| WRK-13 | As a user, I earn DP for completing a workout | :yellow_circle: | core-journeys.spec.ts |
| WRK-14 | As a user, I can log a minimal workout | :x: | - |

### 4.5 Workout Picker
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| WRK-15 | As a user, I can expand the workout picker to see alternatives | :white_check_mark: | workout-features.spec.ts |
| WRK-16 | As a user, I can start an alternative workout | :white_check_mark: | workout-features.spec.ts |
| WRK-17 | As a user, completed workouts show a "Done" badge | :white_check_mark: | workout-features.spec.ts |

### 4.6 Rest Timer
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| WRK-18 | As a user, I can use a rest timer between sets | :x: | - |
| WRK-19 | As a user, I can adjust rest time (+/- 15 seconds) | :x: | - |
| WRK-20 | As a user, I hear a chime when rest is complete | :x: | - |

### 4.7 Workout Customization
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| WRK-21 | As a user, I can customize exercises in a workout template | :x: | - |
| WRK-22 | As a user, I can add a new exercise to a template | :x: | - |
| WRK-23 | As a user, I can delete an exercise from a template | :x: | - |
| WRK-24 | As a user, I can reset a template to defaults | :x: | - |

---

## 5. Macros / Nutrition

### 5.1 Viewing Targets
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| MAC-01 | As a user, I see my protein/calories/carbs/fats targets | :white_check_mark: | core-journeys.spec.ts |
| MAC-02 | As a user, I see progress rings showing daily consumption | :yellow_circle: | core-journeys.spec.ts |

### 5.2 Food Search & Logging
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| MAC-03 | As a user, I can search for foods in the database | :white_check_mark: | food-search.spec.ts |
| MAC-04 | As a user, I can select a food and set quantity | :white_check_mark: | food-search.spec.ts |
| MAC-05 | As a user, logged food appears in my daily totals | :white_check_mark: | food-search.spec.ts |
| MAC-06 | As a user, logged food appears in recent foods | :white_check_mark: | food-search.spec.ts |

### 5.3 Quick Log (Manual Entry)
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| MAC-07 | As a user, I can manually enter protein/calories | :white_check_mark: | core-journeys.spec.ts |
| MAC-08 | As a user, quick log updates my daily totals | :white_check_mark: | core-journeys.spec.ts |

### 5.4 Recent Foods
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| MAC-09 | As a user, I can re-log a recent food with one tap | :white_check_mark: | food-search.spec.ts |
| MAC-10 | As a user, recent foods persist across sessions | :white_check_mark: | food-search.spec.ts |

### 5.5 Favorites
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| MAC-11 | As a user, I can favorite a food from the Daily tab | :white_check_mark: | favorites.spec.ts |
| MAC-12 | As a user, favorited foods appear in the Saved tab | :white_check_mark: | favorites.spec.ts |
| MAC-13 | As a user, I can unfavorite a food | :white_check_mark: | favorites.spec.ts |
| MAC-14 | As a user, I can log a food from the Saved tab | :white_check_mark: | favorites.spec.ts |
| MAC-15 | As a user, favorites persist after navigation | :white_check_mark: | favorites.spec.ts |

### 5.6 Saved Meals
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| MAC-16 | As a user, I can create a saved meal with multiple ingredients | :white_check_mark: | meal-persistence.spec.ts |
| MAC-17 | As a user, I can log a saved meal with one tap | :yellow_circle: | favorites.spec.ts |
| MAC-18 | As a user, I can favorite a saved meal | :white_check_mark: | meal-persistence.spec.ts |
| MAC-19 | As a user, saved meals appear in the Saved tab | :white_check_mark: | favorites.spec.ts |
| MAC-20 | As a user, I can edit a saved meal | :x: | - |
| MAC-21 | As a user, I can delete a saved meal | :x: | - |

### 5.7 Macro Calculator
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| MAC-22 | As a user, I can calculate my macros based on stats | :x: | - |
| MAC-23 | As a user, I can change my goal and recalculate | :x: | - |

### 5.8 Today's Meals
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| MAC-24 | As a user, I see a list of today's logged meals | :yellow_circle: | core-journeys.spec.ts |
| MAC-25 | As a user, I can delete a logged meal | :x: | - |
| MAC-26 | As a user, deleting a meal updates my daily totals | :x: | - |

---

## 6. Avatar & Gamification

### 6.1 Avatar Display
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| AVA-01 | As a user, I see my avatar with current mood | :white_check_mark: | p0-critical.spec.ts |
| AVA-02 | As a user, my avatar mood reflects my compliance | :white_check_mark: | p0-critical.spec.ts |

### 6.2 Rank System
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| AVA-03 | As a user, I see my current rank and DP | :white_check_mark: | p0-critical.spec.ts |
| AVA-04 | As a user, I see progress toward the next rank | :white_check_mark: | p0-critical.spec.ts |
| AVA-05 | As a user, I see a rank-up celebration modal | :white_check_mark: | p0-critical.spec.ts |

### 6.3 Archetype
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| AVA-06 | As a user, I see my selected archetype | :x: | - |
| AVA-07 | As a user, I can change my archetype in Settings | :x: | - |

---

## 7. Achievements

### 7.1 Badge Display
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| ACH-01 | As a user, I can view all badges by category | :x: | - |
| ACH-02 | As a user, earned badges show unlock date | :x: | - |
| ACH-03 | As a user, unearned badges show progress | :x: | - |
| ACH-04 | As a user, I see badge rarity (Common/Rare/Epic/Legendary) | :x: | - |

### 7.2 Badge Unlocking
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| ACH-05 | As a user, I earn a badge after completing requirements | :x: | - |
| ACH-06 | As a user, I see a badge unlock modal | :yellow_circle: | core-journeys.spec.ts |

---

## 8. Settings

### 8.1 Profile Management
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| SET-01 | As a user, I can update my username | :x: | - |
| SET-02 | As a user, I can set a goal weight | :white_check_mark: | p0-critical.spec.ts |

### 8.2 Weight Tracking
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| SET-03 | As a user, I can log my current weight | :white_check_mark: | p0-critical.spec.ts |
| SET-04 | As a user, I see my weight history chart | :white_check_mark: | p0-critical.spec.ts |
| SET-05 | As a user, I can toggle between imperial/metric | :x: | - |

### 8.3 Training Days
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| SET-06 | As a user, I can change my training days | :x: | - |

### 8.4 Data Management
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| SET-07 | As a user, I can manually sync my data | :x: | - |
| SET-08 | As a user, I can export my data as JSON | :x: | - |
| SET-09 | As a user, I can import previously exported data | :x: | - |

---

## 9. Offline & Sync

### 9.1 Offline Mode
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| SYNC-01 | As a user, I see an offline indicator when disconnected | :white_check_mark: | core-journeys.spec.ts |
| SYNC-02 | As a user, I can log data while offline | :white_check_mark: | core-journeys.spec.ts |
| SYNC-03 | As a user, my data syncs when I reconnect | :white_check_mark: | core-journeys.spec.ts |
| SYNC-04 | As a user, my offline data persists after reconnection | :white_check_mark: | core-journeys.spec.ts |

---

## 10. Coach Features (Coaching Clients)

### 10.1 Coach Workouts
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| COACH-01 | As a coaching client, I see coach-assigned workouts | :x: | - |
| COACH-02 | As a coaching client, I can use my own workout instead | :x: | - |

### 10.2 Coach Macros
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| COACH-03 | As a coaching client, my macros are set by my coach | :x: | - |
| COACH-04 | As a coaching client, I see a notification when coach updates macros | :x: | - |

### 10.3 Weekly Check-In
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| COACH-05 | As a coaching client, I see a check-in banner on home | :x: | - |
| COACH-06 | As a coaching client, I can submit a weekly check-in form | :x: | - |
| COACH-07 | As a coaching client, form fields auto-populate with my metrics | :x: | - |

---

## 11. Coach Dashboard (Coach Role)

### 11.1 Dashboard Access
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| CDASH-01 | As a coach, I can access the coach dashboard | :white_check_mark: | auth-onboarding.spec.ts |
| CDASH-02 | As a coach, I see Clients/Templates/Check-ins tabs | :white_check_mark: | auth-onboarding.spec.ts |

### 11.2 Client Management
| ID | User Story | Status | Test File |
|----|------------|--------|-----------|
| CDASH-03 | As a coach, I can view my clients list | :x: | - |
| CDASH-04 | As a coach, I can assign a workout to a client | :x: | - |
| CDASH-05 | As a coach, I can update a client's macro targets | :x: | - |
| CDASH-06 | As a coach, I can view a client's check-in | :x: | - |
| CDASH-07 | As a coach, I can respond to a client's check-in | :x: | - |

---

## Coverage Summary

| Category | Total Stories | Covered | Partial | Not Covered |
|----------|---------------|---------|---------|-------------|
| Authentication | 12 | 5 | 0 | 7 |
| Onboarding | 11 | 9 | 1 | 1 |
| Home Screen | 11 | 6 | 2 | 3 |
| Workouts | 24 | 11 | 2 | 11 |
| Macros | 26 | 15 | 3 | 8 |
| Avatar | 7 | 0 | 0 | 7 |
| Achievements | 6 | 0 | 1 | 5 |
| Settings | 9 | 0 | 0 | 9 |
| Offline/Sync | 4 | 4 | 0 | 0 |
| Coach (Client) | 7 | 0 | 0 | 7 |
| Coach Dashboard | 7 | 2 | 0 | 5 |
| **TOTAL** | **124** | **52** | **9** | **63** |

**Current Coverage: 42% fully covered, 7% partial, 51% not covered**

---

## Priority Recommendations

### P0 - Critical (Core User Journeys)
- [ ] AVA-01: Avatar display with mood
- [ ] AVA-05: Rank-up celebration modal
- [ ] ACH-05: Badge unlocking flow
- [ ] SET-03: Weight logging
- [ ] WRK-14: Minimal workout logging

### P1 - High (Common User Actions)
- [ ] WRK-18-20: Rest timer functionality
- [ ] MAC-22-23: Macro calculator
- [ ] MAC-25-26: Delete logged meals
- [ ] SET-06: Change training days
- [ ] AUTH-04-05: Form validation errors

### P2 - Medium (Secondary Features)
- [ ] WRK-21-24: Workout customization
- [ ] MAC-20-21: Edit/delete saved meals
- [ ] SET-01-02: Profile updates
- [ ] SET-04-05: Weight history & units
- [ ] ACH-01-04: Badge viewing

### P3 - Low (Edge Cases & Admin)
- [ ] AUTH-09-10: Password reset flow
- [ ] SET-07-09: Data export/import
- [ ] COACH-*: All coaching features
- [ ] ONB-11: Onboarding persistence
