# Event Naming Convention and Inventory

Reference document for all Plausible analytics events in Trained. Establishes the naming convention all events must follow and provides a complete inventory of every event defined in `src/lib/analytics.ts`.

## Event Naming Convention

All analytics events follow these three rules:

| Aspect | Convention | Examples |
|--------|-----------|----------|
| **Event names** | Title Case with Spaces | `Workout Started`, `Check-In Completed`, `Meal Logged` |
| **Property keys** | snake_case | `workout_type`, `duration_minutes`, `training_days` |
| **Property values** | Lowercase strings or numbers | `'push'`, `42`, `'manual'` |

### Rules in Detail

1. **Event names** use Title Case with Spaces. Each word is capitalized and separated by a single space. Hyphens are allowed within compound words (e.g., `Check-In`). No underscores, no camelCase, no kebab-case.

2. **Property keys** use snake_case. All lowercase, words separated by underscores. This matches the existing Plausible convention and avoids confusion with event names.

3. **Property values** are either lowercase strings (e.g., `'manual'`, `'push'`, `'saved'`) or numbers (e.g., `42`, `3`). Boolean values are also accepted by the Plausible API. No Title Case in property values.

### Convention Verification

All 22 events in `analytics.ts` have been verified to follow this convention. No deviations found.

## Complete Event Inventory

All 22 events defined in `src/lib/analytics.ts`, listed by category.

| # | Method | Event Name | Properties | Wired In | Status |
|---|--------|-----------|------------|----------|--------|
| **Onboarding** | | | | | |
| 1 | `onboardingStarted()` | Onboarding Started | _(none)_ | Not wired | Missing |
| 2 | `onboardingCompleted(days)` | Onboarding Completed | `training_days: number` | `Onboarding.tsx` | Wired |
| **Workouts** | | | | | |
| 3 | `workoutStarted(type)` | Workout Started | `workout_type: string` | `Workouts.tsx` | Wired |
| 4 | `workoutCompleted(type, duration)` | Workout Completed | `workout_type: string`, `duration_minutes: number` | `Workouts.tsx` (2 call sites) | Wired |
| 5 | `quickWorkoutLogged()` | Quick Workout Logged | _(none)_ | `Workouts.tsx` | Wired |
| **Nutrition** | | | | | |
| 6 | `mealLogged(source)` | Meal Logged | `source: 'manual' \| 'search' \| 'saved'` | Not wired | Missing |
| 7 | `mealSaved()` | Meal Saved | _(none)_ | Not wired | Missing |
| 8 | `proteinTargetHit()` | Protein Target Hit | _(none)_ | Not wired | Missing |
| 9 | `calorieTargetHit()` | Calorie Target Hit | _(none)_ | Not wired | Missing |
| **Gamification** | | | | | |
| 10 | `checkInCompleted(streak)` | Check-In Completed | `streak: number` | `CheckInModal.tsx` | Wired |
| 11 | `xpClaimed(amount)` | XP Claimed | `amount: number` | `XPClaimModal.tsx` | Wired |
| 12 | `levelUp(level)` | Level Up | `level: number` | `XPClaimModal.tsx` | Wired |
| 13 | `badgeEarned(badge, rarity)` | Badge Earned | `badge: string`, `rarity: string` | Not wired | Missing |
| 14 | `avatarEvolved(stage)` | Avatar Evolved | `stage: number` | Not wired | Missing |
| **Engagement** | | | | | |
| 15 | `appOpened()` | App Opened | _(none)_ | Not wired | Missing |
| 16 | `settingsViewed()` | Settings Viewed | _(none)_ | Not wired | Missing |
| 17 | `achievementsViewed()` | Achievements Viewed | _(none)_ | Not wired | Missing |
| 18 | `dataExported()` | Data Exported | _(none)_ | Not wired | Missing |
| **Auth** | | | | | |
| 19 | `signupCompleted()` | Signup Completed | _(none)_ | Not wired | Missing |
| 20 | `loginCompleted()` | Login Completed | _(none)_ | Not wired | Missing |
| **Coach** | | | | | |
| 21 | `coachDashboardViewed()` | Coach Dashboard Viewed | _(none)_ | Not wired | Missing |
| 22 | `clientViewed()` | Client Viewed | _(none)_ | Not wired | Missing |

**Summary:** 7 wired (8 call sites, since `workoutCompleted` has 2), 15 missing. The 15 missing events are defined in `analytics.ts` but have no call sites in any screen component.

## Plausible Dashboard Checklist

After deployment, each event name below must be created as a Custom Event Goal in the Plausible dashboard (**Settings > Goals > Add Goal > Custom Event**). Events will not appear in the dashboard until their corresponding goal exists.

1. Onboarding Started
2. Onboarding Completed
3. Workout Started
4. Workout Completed
5. Quick Workout Logged
6. Meal Logged
7. Meal Saved
8. Protein Target Hit
9. Calorie Target Hit
10. Check-In Completed
11. XP Claimed
12. Level Up
13. Badge Earned
14. Avatar Evolved
15. App Opened
16. Settings Viewed
17. Achievements Viewed
18. Data Exported
19. Signup Completed
20. Login Completed
21. Coach Dashboard Viewed
22. Client Viewed

**Note:** This is a manual step done in the Plausible web dashboard, not in code. Goals must be created before events will be visible in analytics reports. Custom properties (e.g., `workout_type`, `streak`) will automatically appear once their parent goal is configured and events start flowing.
