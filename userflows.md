## Complete Feature Inventory and User Flows

### 3.1 Authentication Flow

The app supports three authentication methods: email/password, Apple Sign-In, and Google Sign-In. The authentication state gates all access to the main app.

**Flow: Sign Up with Email**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Welcome Screen (`/onboarding/welcome`) | User taps "Begin Protocol" |
| 2 | Value Screen (`/onboarding/value`) | User sees the value proposition and continues |
| 3 | Profile Screen (`/onboarding/profile`) | User enters name, selects units (imperial/metric), training days, and fitness level |
| 4 | Goal Screen (`/onboarding/goal`) | User selects fitness goal (build muscle, lose fat, get stronger, improve fitness) |
| 5 | Archetype Screen (`/onboarding/archetype`) | User selects archetype (Bro, Himbo, Brute, Pup, Bull) |
| 6 | Macros Screen (`/onboarding/macros`) | Auto-calculated macros displayed based on profile; user can adjust |
| 7 | Paywall Screen (`/onboarding/paywall`) | User sees subscription options (monthly/annual) or continues free |
| 8 | Final Screen (`/onboarding/final`) | Onboarding complete; user is directed to the main app |

Alternatively, if the user taps "Already have an account?" from the Welcome Screen, they are routed to `/auth` where they can sign in with email, Apple, or Google.

**Flow: Sign In (Returning User)**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Sign In Screen (`/auth/signin`) | User enters email and password, or taps Apple/Google sign-in |
| 2 | Home Screen (`/`) | If `onboardingComplete` is true, user lands on the Home dashboard |

**Flow: Password Reset**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Sign In Screen | User taps "Forgot password?" |
| 2 | Forgot Password Screen (`/auth/forgot-password`) | User enters email address |
| 3 | Email Inbox | User receives reset link |
| 4 | Reset Password Screen (`/reset-password`) | User sets new password (deep link supported) |

### 3.2 Access Gate (Ebook Code Validation)

Before reaching the main app, users may encounter an access gate that requires a license key from the ebook purchase. This is a separate gating mechanism from the subscription paywall.

**Flow: Enter Access Code**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Access Gate Screen | User sees prompt to enter license key from ebook |
| 2 | Access Gate Screen | User types alphanumeric code (auto-uppercased) |
| 3 | Access Gate Screen | Code validated via Supabase RPC (`validate_access_code`) |
| 4 | Access Gate Screen | On success, green checkmark animation appears |
| 5 | Main App | User taps "Continue" to enter the app |

If the user does not have a code, a help section explains how to obtain one. There is also a link to contact support via email.

### 3.3 Home Dashboard

The Home screen serves as the command center, displaying protocol orders (action cards) and a rank/DP summary.

**Flow: View Home Dashboard**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Home Screen (`/`) | User sees greeting with callsign (e.g., "Welcome back, JASPER") |
| 2 | Home Screen | Protocol Orders section shows actionable cards based on current state |
| 3 | Home Screen | Cards may include: Daily Check-in, Workout Scheduled, Weekly Check-in Due, Daily Report Pending |
| 4 | Home Screen | Rank card at bottom shows current rank, DP progress bar, and rank name |

The protocol orders are context-aware. For example, the "Workout Scheduled" card only appears on training days, and the "Weekly Check-in Due" card only appears for coaching clients.

### 3.4 Daily Check-In (Compliance Report)

The daily check-in is the core engagement loop. Users confirm completion of five daily protocol items and earn Discipline Points.

**Flow: Complete Daily Check-In**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Home Screen | User taps "Check In" on the Daily Check-in card |
| 2 | Check-In Modal | Modal slides up showing five compliance items: Workout, Protein Target, Meal Plan, Steps (10K), Sleep (7h) |
| 3 | Check-In Modal | Items auto-populate from HealthKit (steps, sleep) and workout/macro logs |
| 4 | Check-In Modal | User toggles each item on/off to confirm compliance |
| 5 | Check-In Modal | User taps "Submit Report" |
| 6 | Check-In Modal | DP animations play showing points earned per item |
| 7 | Check-In Modal | If 5/5 compliance, a "Share" button appears |
| 8 | Check-In Modal | If a new badge is unlocked, Badge Unlock Modal appears |
| 9 | Check-In Modal | If rank increases, Rank Up Modal appears with celebration |

**DP Values by Item:**

| Action | Base DP | Archetype Bonus |
|--------|---------|-----------------|
| Workout Completed | 10 | Himbo/Brute/Bull: +50% |
| Protein Target Hit | 10 | Brute: +50% |
| Meal Plan Followed | 10 | None |
| 10K+ Steps | 10 | Pup: +100% |
| 7h+ Sleep | 10 | Pup: +100% |
| Streak Bonus (7+ days) | +5 | Bull: enhanced |

### 3.5 Share Compliance Card

When a user achieves full 5/5 compliance, they can share a branded card to social media.

**Flow: Share Daily Protocol Card**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Check-In Modal (post-submit) | User taps "Share" button (only visible on 5/5 days) |
| 2 | System | App captures the ComplianceShareCard component as a PNG image |
| 3 | System | On native iOS, the native share sheet opens with the image and text |
| 4 | System | On web, the image downloads directly |
| 5 | System | DP is awarded for sharing (tracked to prevent double-awards) |

Additional share card types exist for **Rank Up**, **Workout Completion**, **Weekly Report**, **Locked Protocol Start**, and **Locked Protocol Milestones**.

### 3.6 Workout Tracking

The workout system provides template-based training plans with exercise logging.

**Flow: Start and Log a Workout**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Home Screen | User taps "Start" on the Workout Scheduled card, OR navigates to Workouts tab |
| 2 | Workouts Screen (`/workouts`) | "Today" section shows the scheduled workout type (e.g., Push) with "Start Workout" button |
| 3 | Workouts Screen | User taps "Start Workout" |
| 4 | Workouts Screen | Exercise list expands showing all exercises for that workout type |
| 5 | Workouts Screen | For each exercise, user sees sets with weight and reps fields |
| 6 | Workouts Screen | User enters weight and reps for each set, tapping the checkmark to confirm |
| 7 | Workouts Screen | After completing all exercises, user taps "Finish Workout" |
| 8 | Workouts Screen | Workout is logged with timestamp, exercises, and sets |
| 9 | System | A share card option appears for the completed workout |

**Flow: Customize Workout Templates**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Workouts Screen | User scrolls to "Customize Workouts" section |
| 2 | Workouts Screen | Five workout type cards shown: Push, Pull, Legs, Upper, Lower |
| 3 | Workouts Screen | User taps the edit icon on a workout type |
| 4 | Workout Editor | User can add, remove, or reorder exercises |
| 5 | Workout Editor | User can set exercise name, target sets, and target reps |
| 6 | Workout Editor | Changes save automatically |

**Flow: Quick Compliance Log (No Workout Details)**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Workouts Screen | User taps "Log quick compliance instead" under the Today card |
| 2 | System | Workout marked as completed without detailed set/rep logging |

### 3.7 Macro and Nutrition Tracking

The Macros screen handles daily nutrition logging with food search, meal logging, and target tracking.

**Flow: Log a Meal**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Macros Tab (`/macros`) | User sees daily macro summary (calories, protein, carbs, fat) with progress rings |
| 2 | Macros Screen | User taps "Log Meal" or the "+" button |
| 3 | Food Search | Search modal opens; user types food name |
| 4 | Food Search | Results appear from food database API (FatSecret or similar) |
| 5 | Food Search | User selects a food item |
| 6 | Food Search | User adjusts quantity and unit (grams, oz, serving) |
| 7 | Food Search | User taps "Add" to log the food |
| 8 | Macros Screen | Macro totals update in real time |

**Flow: Use Saved Meals**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Macros Screen | User taps "Saved Meals" or favorites section |
| 2 | Saved Meals List | User sees previously saved meal combinations |
| 3 | Saved Meals List | User taps a saved meal to quick-log it |
| 4 | Macros Screen | All items from the saved meal are added to today's log |

### 3.8 Avatar and Rank Progression

The Avatar screen displays the user's evolving character based on their archetype and rank progression.

**Flow: View Avatar and Rank**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Home Screen or Avatar tab | User navigates to Avatar Screen (`/avatar`) |
| 2 | Avatar Screen | Large animated avatar displayed (evolves through 5 stages based on rank) |
| 3 | Avatar Screen | Current archetype shown with bonus description |
| 4 | Avatar Screen | Rank progress bar with current DP and DP needed for next rank |
| 5 | Avatar Screen | Obedience streak counter displayed |
| 6 | Avatar Screen | Navigation links to Progress, Achievements, and Settings |

The avatar has a mood system (happy, neutral, sad, hyped, neglected) that reacts to user engagement patterns. There are 5 archetypes (Bro, Himbo, Brute, Pup, Bull) each with 5 visual stages, totaling 25 unique avatar illustrations.

### 3.9 Achievements and Badges

**Flow: View Achievements**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Avatar Screen or Home | User taps Achievements link |
| 2 | Achievements Screen (`/achievements`) | Grid of badges displayed, earned badges highlighted |
| 3 | Achievements Screen | User can tap a badge to see its description and unlock criteria |

Badges are awarded automatically based on milestones (e.g., first workout, 7-day streak, rank ups).

### 3.10 Locked Protocol (Commitment Challenge)

The Locked Protocol is a premium feature where users commit to a multi-day discipline challenge.

**Flow: Start a Locked Protocol**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Home Screen or navigation link | User navigates to Locked Protocol Screen (`/locked`) |
| 2 | Locked Protocol Screen | User selects protocol type: "Continuous" (no breaks) or "Day Lock" (daily check-in) |
| 3 | Locked Protocol Screen | User selects goal duration (7, 14, 21, 30, 60, or 90 days) |
| 4 | Locked Protocol Screen | User taps "Start Protocol" |
| 5 | Locked Protocol Screen | Share card option appears for protocol start |
| 6 | Daily (during protocol) | User logs daily compliance from the Locked Protocol screen |
| 7 | System | Milestone DP bonuses awarded at 7, 14, 21, 30, 60, 90 days |
| 8 | System | Share cards available at each milestone |

If the user breaks the streak in "Continuous" mode, the protocol ends. "Day Lock" mode is more forgiving.

### 3.11 Recruit (Referral System)

**Flow: Invite a Friend**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Home or navigation | User navigates to Recruit Screen (`/recruit`) |
| 2 | Recruit Screen | User sees their unique referral code (CALLSIGN-XXXX format) |
| 3 | Recruit Screen | User taps "Share Invite" to share referral link |
| 4 | System | Native share sheet opens with referral URL |
| 5 | Recruit Screen | Recruit status cards show pending and completed referrals |

When a referred user signs up and reaches a certain rank, the referrer earns DP and potentially premium time.

### 3.12 Weekly Check-In (Coaching Clients)

This feature is only visible to users who are assigned a coach in the `coach_clients` table.

**Flow: Submit Weekly Check-In**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Home Screen | "Weekly Check-in Due" card appears (if user has a coach and check-in is due) |
| 2 | Weekly Check-In Screen (`/weekly-checkin`) | Form with fields for weight, progress notes, photos |
| 3 | Weekly Check-In Screen | User fills out the form and optionally uploads progress photos |
| 4 | Weekly Check-In Screen | User taps "Submit" |
| 5 | System | Check-in data saved to `weekly_checkins` table |

### 3.13 Weekly Report

**Flow: View Weekly Report**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Home Screen | "Daily Report Pending" or weekly summary card appears |
| 2 | Weekly Report Screen (`/weekly-report`) | Summary of the week's compliance, DP earned, workouts completed |
| 3 | Weekly Report Screen | Share card option for the weekly summary |

### 3.14 Weight Tracking

**Flow: Log Weight**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Settings Screen (`/settings`) | User scrolls to Weight section |
| 2 | Settings Screen | User enters current weight in the input field |
| 3 | Settings Screen | User taps "Log" button |
| 4 | Settings Screen | Weight chart updates with new data point |
| 5 | Settings Screen | Trend line, rate of change, and projected goal date update |

**Flow: Set Goal Weight**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Settings Screen | User enters goal weight |
| 2 | Settings Screen | User taps "Set Goal" |
| 3 | Settings Screen | Projected goal date calculates based on current trend |

### 3.15 HealthKit Integration

**Flow: Connect HealthKit**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Post-Onboarding (iOS only) | Health Permission Screen appears |
| 2 | Health Permission Screen | User sees explanation of what data will be read (steps, sleep) |
| 3 | Health Permission Screen | User taps "Allow" |
| 4 | iOS System Dialog | Native HealthKit permission dialog appears |
| 5 | System | If granted, steps and sleep auto-populate in the daily check-in |

If the user denies HealthKit permission, they can manually enter steps and sleep values.

### 3.16 Notifications

**Flow: Configure Notifications**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Settings Screen | User scrolls to Notifications section |
| 2 | Settings Screen | Toggle switches for: Morning reminder, Workout reminder, Evening check-in |
| 3 | Settings Screen | Time pickers for each notification type |
| 4 | System | Local notifications scheduled via Capacitor Local Notifications plugin |

Push notifications are also supported via the `device_tokens` table and `send-push` edge function, with APNS integration.

### 3.17 Subscription Management

**Flow: Subscribe to Premium**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Paywall Screen (onboarding) or Settings | User sees monthly and annual pricing options |
| 2 | Paywall Screen | User taps a plan |
| 3 | iOS System | Apple In-App Purchase sheet appears |
| 4 | System | RevenueCat processes the purchase and grants "premium" entitlement |
| 5 | System | Premium features unlock (pro archetypes, locked protocols, etc.) |

**Flow: Restore Purchases**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Settings Screen or Paywall | User taps "Restore Purchases" |
| 2 | System | RevenueCat checks Apple receipt and restores entitlements |

### 3.18 Data Export

**Flow: Export All Data**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Settings Screen | User scrolls to Data section |
| 2 | Settings Screen | User taps "Export Data" |
| 3 | System | JSON file generated with all user data (profile, DP, macros, workouts, avatar) |
| 4 | System | Native share sheet opens with the JSON file |

### 3.19 Account Deletion

**Flow: Delete Account**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Settings Screen | User scrolls to Danger Zone section |
| 2 | Settings Screen | User taps "Delete Account" |
| 3 | Confirmation Dialog | Warning message explains permanent deletion |
| 4 | System | Edge function `delete-account` executes: deletes storage files, all user data from 16+ tables, revokes sessions, deletes auth user |
| 5 | System | User is signed out and redirected to auth screen |

### 3.20 Progress Screen

**Flow: View Progress**

| Step | Screen | Action |
|------|--------|--------|
| 1 | Avatar Screen or navigation | User taps Progress link |
| 2 | Progress Screen (`/progress`) | Charts and statistics for workout history, macro adherence, weight trend |


