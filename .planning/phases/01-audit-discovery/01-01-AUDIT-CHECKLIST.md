# Trained App - Full User Journey Audit Checklist

**Plan:** 01-01
**Date:** 2026-02-04
**Tester:** [Name]
**Device/Browser:** [e.g., iPhone 15 Safari, Chrome 120 macOS]

---

## Instructions

1. Test each item in order - this follows the real user journey
2. Mark checkbox when tested: `[x]` = pass, `[ ]` = fail/not tested
3. Record actual behavior in "Actual Result" field
4. If bug found, create entry in 01-01-BUG-LOG.md and reference here (e.g., BUG-001)

---

## 1. Access Gate

| # | Test Item | Expected Behavior | Actual Result | Bug Ref |
|---|-----------|-------------------|---------------|---------|
| 1.1 | [ ] Valid code entry | Entering valid access code grants access to app | | |
| 1.2 | [ ] Invalid code handling | Invalid code shows clear error message | | |
| 1.3 | [ ] Empty submission | Empty code field shows validation error | | |
| 1.4 | [ ] Code persistence | After granting access, code should persist across sessions | | |

---

## 2. Authentication

| # | Test Item | Expected Behavior | Actual Result | Bug Ref |
|---|-----------|-------------------|---------------|---------|
| 2.1 | [ ] Sign up - email/password | New account creation works | | |
| 2.2 | [ ] Sign up - validation | Email format and password requirements enforced | | |
| 2.3 | [ ] Sign in - valid credentials | Existing account login works | | |
| 2.4 | [ ] Sign in - invalid credentials | Wrong password shows error message | | |
| 2.5 | [ ] Password reset request | Password reset email flow initiates | | |
| 2.6 | [ ] Session persistence | User stays logged in across browser refresh | | |
| 2.7 | [ ] Sign out | Sign out clears session and returns to login | | |

---

## 3. Onboarding Flow (8 Steps)

| # | Test Item | Expected Behavior | Actual Result | Bug Ref |
|---|-----------|-------------------|---------------|---------|
| 3.1 | [ ] Step 1: Name entry | First name captured correctly | | |
| 3.2 | [ ] Step 2: Gender selection | Gender options display, selection saves | | |
| 3.3 | [ ] Step 3: Body stats (height) | Height input with proper units | | |
| 3.4 | [ ] Step 4: Body stats (weight) | Weight input with proper units | | |
| 3.5 | [ ] Step 5: Fitness level | Fitness level options display, selection saves | | |
| 3.6 | [ ] Step 6: Training days | Day selection UI works correctly | | |
| 3.7 | [ ] Step 7: Goal selection | Goal options display, selection saves | | |
| 3.8 | [ ] Step 8: Avatar selection | Avatar picker works correctly | | |
| 3.9 | [ ] Progress indicator | Progress shown through onboarding steps | | |
| 3.10 | [ ] Back navigation | Can go back to previous steps | | |
| 3.11 | [ ] Skip handling | Skip behavior is clear and consistent | | |
| 3.12 | [ ] Data persistence | Onboarding data saved correctly after completion | | |

---

## 4. Home Screen / Dashboard

| # | Test Item | Expected Behavior | Actual Result | Bug Ref |
|---|-----------|-------------------|---------------|---------|
| 4.1 | [ ] Daily quests display | Today's quests show correctly | | |
| 4.2 | [ ] Quest completion tracking | Quest progress updates accurately | | |
| 4.3 | [ ] Streak display | Current streak shows correctly | | |
| 4.4 | [ ] Streak calculation | Streak increments/resets appropriately | | |
| 4.5 | [ ] Reminder display | Scheduled reminders shown if configured | | |
| 4.6 | [ ] Motivational message | Message displays (if feature exists) | | |
| 4.7 | [ ] Navigation to other screens | All nav links/buttons work | | |
| 4.8 | [ ] User name display | User's name shown correctly | | |

---

## 5. Workout Flow

| # | Test Item | Expected Behavior | Actual Result | Bug Ref |
|---|-----------|-------------------|---------------|---------|
| 5.1 | [ ] Workout selection | Can browse/select available workouts | | |
| 5.2 | [ ] Start workout | Workout starts with clear UI | | |
| 5.3 | [ ] Exercise display | Current exercise shows with instructions | | |
| 5.4 | [ ] Set logging | Can log weight/reps for each set | | |
| 5.5 | [ ] Rest timer | Rest timer between sets works | | |
| 5.6 | [ ] Exercise navigation | Can move between exercises | | |
| 5.7 | [ ] Exercise customization | Can swap/modify exercises if supported | | |
| 5.8 | [ ] Workout completion | Completing workout shows summary | | |
| 5.9 | [ ] Workout history | Completed workout saved to history | | |
| 5.10 | [ ] Progress tracking | Personal bests/progress tracked | | |
| 5.11 | [ ] Mid-workout exit | Exiting mid-workout handles gracefully | | |

---

## 6. Macro Tracking

| # | Test Item | Expected Behavior | Actual Result | Bug Ref |
|---|-----------|-------------------|---------------|---------|
| 6.1 | [ ] Quick log macros | Can quickly log protein/carbs/fat/calories | | |
| 6.2 | [ ] Food search | Search for foods by name | | |
| 6.3 | [ ] Food selection | Select food from search results | | |
| 6.4 | [ ] Portion adjustment | Can adjust serving size/portions | | |
| 6.5 | [ ] Save custom meal | Can save frequently eaten meals | | |
| 6.6 | [ ] Load saved meal | Can quickly add saved meals | | |
| 6.7 | [ ] Daily totals | Daily macro totals calculate correctly | | |
| 6.8 | [ ] Goal progress | Progress toward macro goals shown | | |
| 6.9 | [ ] Edit/delete entries | Can modify or remove logged foods | | |
| 6.10 | [ ] Meal time categories | Can categorize by breakfast/lunch/dinner | | |

---

## 7. Check-in & XP System

| # | Test Item | Expected Behavior | Actual Result | Bug Ref |
|---|-----------|-------------------|---------------|---------|
| 7.1 | [ ] Daily check-in | Check-in button/flow works | | |
| 7.2 | [ ] XP award | XP awarded after check-in | | |
| 7.3 | [ ] XP display | Current XP total shown correctly | | |
| 7.4 | [ ] Weekly XP claim | Weekly XP claim process works | | |
| 7.5 | [ ] XP history | Can view XP history/awards | | |
| 7.6 | [ ] Level progression | Level updates when XP thresholds reached | | |
| 7.7 | [ ] Achievements | Achievements unlock when earned | | |
| 7.8 | [ ] Multiple check-ins | Handles multiple daily check-ins correctly | | |

---

## 8. Settings

| # | Test Item | Expected Behavior | Actual Result | Bug Ref |
|---|-----------|-------------------|---------------|---------|
| 8.1 | [ ] Access settings | Settings screen accessible | | |
| 8.2 | [ ] Weight logging | Can log new weight measurements | | |
| 8.3 | [ ] Weight history | Weight history displayed | | |
| 8.4 | [ ] Unit preferences | Can change units (lb/kg, etc.) | | |
| 8.5 | [ ] Notification settings | Can configure push notifications | | |
| 8.6 | [ ] Data export | Can export user data | | |
| 8.7 | [ ] Data import | Can import user data | | |
| 8.8 | [ ] Account deletion | Account deletion option available | | |
| 8.9 | [ ] Sign out | Sign out works from settings | | |
| 8.10 | [ ] Profile editing | Can edit name, avatar, goals | | |

---

## 9. PWA Installation

| # | Test Item | Expected Behavior | Actual Result | Bug Ref |
|---|-----------|-------------------|---------------|---------|
| 9.1 | [ ] iOS Safari - Add to Home Screen | "Add to Home Screen" option available | | |
| 9.2 | [ ] iOS Safari - Install prompt | App suggests adding to home screen | | |
| 9.3 | [ ] iOS - Standalone mode | Launches without Safari chrome | | |
| 9.4 | [ ] iOS - App icon | Correct icon shows on home screen | | |
| 9.5 | [ ] iOS - Splash screen | Splash screen displays on launch | | |
| 9.6 | [ ] Android Chrome - Install prompt | Chrome shows install prompt/banner | | |
| 9.7 | [ ] Android Chrome - Add to Home Screen | Menu option works | | |
| 9.8 | [ ] Android - Standalone mode | Launches without browser chrome | | |
| 9.9 | [ ] Android - App icon | Correct icon shows on home screen | | |
| 9.10 | [ ] Android - Splash screen | Splash screen displays on launch | | |
| 9.11 | [ ] Service Worker registration | SW registered in DevTools | | |
| 9.12 | [ ] Manifest present | Web manifest correctly configured | | |

---

## 10. Offline Mode (5 Scenarios)

| # | Test Item | Expected Behavior | Actual Result | Bug Ref |
|---|-----------|-------------------|---------------|---------|
| 10.1 | [ ] Scenario 1: Fresh offline | Enable offline in DevTools, reload app - app shell loads | | |
| 10.2 | [ ] Scenario 1: Cached data | Previously loaded data still visible offline | | |
| 10.3 | [ ] Scenario 2: Offline data entry | Log workout/macros while offline | | |
| 10.4 | [ ] Scenario 2: Offline save indicator | Shows "saved locally" or similar message | | |
| 10.5 | [ ] Scenario 3: Return online | Go back online, data syncs automatically | | |
| 10.6 | [ ] Scenario 3: Sync confirmation | User informed when sync completes | | |
| 10.7 | [ ] Scenario 4: Mid-action offline | Start workout online, go offline mid-workout | | |
| 10.8 | [ ] Scenario 4: Continue offline | Can complete workout while offline | | |
| 10.9 | [ ] Scenario 5: Food search offline | Attempt food search offline | | |
| 10.10 | [ ] Scenario 5: Graceful degradation | Shows appropriate offline message | | |
| 10.11 | [ ] Network error handling | Network errors show user-friendly messages | | |

---

## 11. Data Persistence

| # | Test Item | Expected Behavior | Actual Result | Bug Ref |
|---|-----------|-------------------|---------------|---------|
| 11.1 | [ ] localStorage keys | Key data stored in localStorage (check DevTools) | | |
| 11.2 | [ ] User profile persistence | Profile data persists after refresh | | |
| 11.3 | [ ] Workout history persistence | Workout history persists after refresh | | |
| 11.4 | [ ] Macro log persistence | Macro logs persist after refresh | | |
| 11.5 | [ ] Settings persistence | User settings persist after refresh | | |
| 11.6 | [ ] Cross-session persistence | Data persists after closing and reopening browser | | |
| 11.7 | [ ] Data integrity | No data corruption or loss during normal use | | |
| 11.8 | [ ] Storage quota | App handles storage quota limits gracefully | | |

---

## Summary

| Section | Total Items | Passed | Failed | Not Tested |
|---------|-------------|--------|--------|------------|
| 1. Access Gate | 4 | | | |
| 2. Authentication | 7 | | | |
| 3. Onboarding | 12 | | | |
| 4. Home Screen | 8 | | | |
| 5. Workout Flow | 11 | | | |
| 6. Macro Tracking | 10 | | | |
| 7. Check-in & XP | 8 | | | |
| 8. Settings | 10 | | | |
| 9. PWA Install | 12 | | | |
| 10. Offline Mode | 11 | | | |
| 11. Data Persistence | 8 | | | |
| **TOTAL** | **101** | | | |

---

## Notes

[Add any general observations, patterns, or concerns here during testing]

---

*Checklist created: 2026-02-04*
*Last updated: [date]*
