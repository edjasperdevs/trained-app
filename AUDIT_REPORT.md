# WellTrained App: Full Audit Report

**Date:** March 7, 2026
**Repository:** `edjasperdevs/trained-app`
**Stack:** Vite + React + TypeScript + Capacitor (iOS) + Supabase + RevenueCat
**Bundle ID:** `fitness.welltrained.app`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Complete Feature Inventory and User Flows](#3-complete-feature-inventory-and-user-flows)
4. [Pain Points and UX Issues](#4-pain-points-and-ux-issues)
5. [Security Audit](#5-security-audit)
6. [iOS App Store Readiness](#6-ios-app-store-readiness)
7. [QA Coverage and Recommendations](#7-qa-coverage-and-recommendations)
8. [Asset Review](#8-asset-review)
9. [Code Quality Observations](#9-code-quality-observations)
10. [Priority Action Items](#10-priority-action-items)

---

## 1. Executive Summary

The WellTrained app is a fitness and discipline tracking platform built with a Capacitor-wrapped React SPA, backed by Supabase for authentication, database, and edge functions. The app uses a distinctive RPG-style progression system (Discipline Points, ranks, archetypes) that aligns with the WellTrained brand identity. RevenueCat handles subscription management, and the app integrates with Apple HealthKit for step and sleep tracking.

The codebase is well-organized and demonstrates solid engineering fundamentals: Row Level Security is enabled on all database tables, an audit log exists for sensitive operations, rate limiting is implemented, and the offline-first sync architecture is thoughtfully designed. However, several issues need resolution before a successful iOS App Store submission, and a number of user experience pain points could be addressed to improve retention and polish.

This report documents every user-facing feature with its step-by-step flow, catalogs security findings, assesses App Store readiness against Apple's current guidelines, and provides prioritized recommendations for QA, assets, and code quality.

---

## 2. Architecture Overview

The app is structured as a single-page React application compiled by Vite, wrapped in Capacitor for native iOS distribution, and deployed to Vercel for the web version. Below is a summary of the technology stack and its role in the system.

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | React 18 + TypeScript | UI rendering and component architecture |
| Build Tool | Vite 6 | Development server and production bundling |
| CSS Framework | Tailwind CSS 4 | Utility-first styling with custom design tokens |
| State Management | Zustand (with persist middleware) | Client-side state with localStorage persistence |
| Native Wrapper | Capacitor 7.5 | iOS native bridge for HealthKit, push notifications, camera, haptics |
| Backend | Supabase (PostgreSQL + Edge Functions) | Auth, database, RLS, serverless functions |
| Subscriptions | RevenueCat | In-app purchase management and entitlement checking |
| Analytics | Plausible | Privacy-friendly event tracking |
| Error Tracking | Sentry | Production error capture and performance monitoring |
| Routing | React Router v6 | Client-side navigation with lazy-loaded routes |
| Animations | Framer Motion | Page transitions and micro-interactions |

The navigation structure uses a bottom tab bar with four primary destinations: **Home**, **Workouts**, **Macros**, and **Settings**. The **Avatar** screen is accessible from the Home screen rather than the tab bar directly. An **Achievements** screen, **Progress** screen, **Recruit** screen, and **Locked Protocol** screen are accessible through navigation links within other screens.

---

## 3. Complete Feature Inventory and User Flows

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

---

## 4. Pain Points and UX Issues

### 4.1 Workout Name Overflow

The "Today" workout card on the Workouts screen has a layout issue where long workout names (e.g., "Push (Chest/Shoulders/Triceps)") collide with the "Start Workout" button. The text is not properly truncated or wrapped, causing visual overlap. This is documented in the repository's `screenshots/workout_name_smooshed.PNG` file.

**Recommendation:** Add `text-overflow: ellipsis` with `overflow: hidden` to the workout name container, or reduce the font size for the subtitle. Alternatively, move the "Start Workout" button below the title instead of inline.

### 4.2 Dual Onboarding Systems

The codebase contains two complete onboarding implementations: the original `Onboarding.tsx` (1,017 lines) and the newer `onboarding-v2/` directory (8 separate screen files). The v2 onboarding is the one wired into the active routing via `OnboardingStack.tsx`, while the original is only accessible via a dev bypass route. This creates maintenance burden and potential confusion.

**Recommendation:** Remove the legacy `Onboarding.tsx` file entirely once v2 is confirmed stable. It adds dead code to the bundle.

### 4.3 Weight Tracking Buried in Settings

Weight logging and goal weight configuration are located inside the Settings screen rather than having their own dedicated section. For a fitness app where weight tracking is a core activity, this placement is unintuitive. Users expect to find body metrics alongside their macro and workout data.

**Recommendation:** Consider moving weight tracking to the Progress screen or creating a dedicated "Body" section accessible from the Home dashboard or tab bar.

### 4.4 No Offline Indicator for Users

While the app has a `SyncStatusIndicator` component and offline detection logic, the user-facing feedback for offline state could be more prominent. The sync indicator shows a small icon, but users may not understand that their data is being saved locally and will sync later.

**Recommendation:** Add a banner or toast notification when the app goes offline, clearly stating "You're offline. Your data is saved locally and will sync when you reconnect."

### 4.5 Recovery Day Compliance Gap

The daily check-in requires 5/5 compliance for the share card to appear, but on recovery days (no workout scheduled), the user cannot achieve 5/5 because the workout item cannot be checked. The code comments acknowledge this: "On recovery days, user cannot achieve 5/5, so share button should NOT appear." This means users on rest days are penalized in terms of shareability and potentially streak maintenance.

**Recommendation:** Adjust the compliance calculation on rest days to be 4/4 (excluding workout), or auto-check the workout item on rest days with a "Recovery Day" label.

### 4.6 External Image URLs in Onboarding

The legacy onboarding screen references archetype images via long `lh3.googleusercontent.com` URLs. These are external dependencies that could break if the hosting changes. The v2 onboarding does not appear to have this issue, but the legacy code is still in the bundle.

**Recommendation:** If the legacy onboarding is retained for any reason, replace external URLs with local assets.

### 4.7 MealPlan AI Feature Disabled

The `MealPlanScreen` and its route (`/protocol-ai`) are commented out with `TODO: Re-enable for v2 launch`. The edge functions `generate-meal-plan` and `refine-meal-plan` exist but the feature is not accessible to users. This is fine for launch, but the dead code should be clearly flagged.

**Recommendation:** Either remove the disabled route comments and associated imports to reduce bundle size, or document a clear timeline for re-enabling the feature.

---

## 5. Security Audit

### 5.1 Strengths

The security posture of the application is generally strong for a fitness app at this stage. The following measures are already in place:

**Row Level Security (RLS)** is enabled on every table in the database. Each table has policies that restrict reads and writes to the authenticated user's own data. This is the single most important security measure for a Supabase application, and it is correctly implemented.

**Rate limiting** is enforced via a `rate_limits` table and a `check_rate_limit` database function. The `delete-account` and other sensitive edge functions use this to prevent abuse.

**Role escalation prevention** is implemented via a database trigger (`prevent_role_escalation`) that blocks any attempt to set `is_admin` or `role` fields through the client API.

**Audit logging** exists for sensitive operations. The `audit_log` table records account deletions and other critical actions, and the user_id is set to null on deletion (preserving the log while removing PII linkage).

**Input validation** is handled by a dedicated `validation.ts` module with sanitization functions for strings, numbers, and structured data.

**RevenueCat webhook signature verification** is implemented in the webhook handler edge function, preventing forged subscription events.

**Account deletion** follows a thorough process: storage cleanup, data deletion from 16+ tables in dependency order, session revocation, and auth user deletion.

### 5.2 Issues Requiring Attention

| Issue | Severity | Description |
|-------|----------|-------------|
| Dev fallback access code | **High** | When `VITE_SUPABASE_URL` is not configured, the access code validator accepts any 8+ character string. This fallback must be removed or gated behind a build-time flag before production deployment. |
| `aps-environment` set to `development` | **High** | The `App.entitlements` file has `aps-environment` set to `development`. This must be changed to `production` for the App Store build, or push notifications will not work in production. |
| Google OAuth Client ID in Info.plist | **Medium** | The Google OAuth client ID (`809336881982-...`) is hardcoded in `Info.plist`. While iOS client IDs are generally considered semi-public, it is better practice to use a reversed client ID scheme and ensure the server-side validation is strict. |
| `apple-app-site-association` placeholder | **Medium** | The AASA file contains `XXXXXXXXXX` as the Apple Team ID. This must be replaced with the actual Team ID for universal links (password reset, referral deep links) to function. |
| PrivacyInfo.xcprivacy incomplete | **Medium** | The `NSPrivacyCollectedDataTypes` array is empty. The app collects health data (steps, sleep), fitness data (workouts, macros), email addresses, and usage data. All of these must be declared. |
| No HTTPS enforcement in Capacitor config | **Low** | The Capacitor config does not explicitly set `server.androidScheme` to `https`. While iOS defaults to HTTPS, this should be explicitly configured. |
| .DS_Store files in repository | **Low** | Seven `.DS_Store` files are committed to the repository. These are macOS metadata files that can leak directory structure information. |

### 5.3 Data Privacy Considerations

The app collects the following categories of user data, all of which must be declared in the App Store Connect privacy nutrition label:

| Data Category | Specific Data | Linked to Identity | Used for Tracking |
|--------------|---------------|--------------------|--------------------|
| Health & Fitness | Steps, sleep duration, workout logs, body weight | Yes | No |
| Contact Info | Email address | Yes | No |
| Identifiers | User ID | Yes | No |
| Usage Data | App interaction events (Plausible) | No | No |
| Purchases | Subscription status (RevenueCat) | Yes | No |
| Photos | Progress photos (coaching clients) | Yes | No |
| User Content | Meal logs, food preferences, check-in notes | Yes | No |

---

## 6. iOS App Store Readiness

### 6.1 Compliance Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| App built with current Xcode and SDK | **Needs verification** | Podfile targets iOS 14.0 minimum; Apple requires iOS 18 SDK by April 2026 |
| Bundle ID registered | **Done** | `fitness.welltrained.app` |
| App icon (1024x1024) | **Done** | `resources/icon.png` exists with WellTrained branding |
| Splash screen | **Needs improvement** | `resources/splash.png` is a dim green glow on black; could be more branded |
| Privacy policy URL | **Partially done** | In-app privacy policy exists at `/privacy`; needs a publicly accessible URL for App Store Connect |
| Terms of Service | **Done** | In-app at `/terms` |
| HealthKit usage description | **Done** | `NSHealthShareUsageDescription` in Info.plist |
| Camera usage description | **Done** | `NSCameraUsageDescription` in Info.plist |
| Photo library usage description | **Done** | `NSPhotoLibraryUsageDescription` in Info.plist |
| Push notification entitlement | **Needs fix** | `aps-environment` must be changed to `production` |
| PrivacyInfo.xcprivacy | **Needs fix** | `NSPrivacyCollectedDataTypes` is empty; must declare all collected data |
| Apple-app-site-association | **Needs fix** | Team ID placeholder must be replaced |
| Account deletion | **Done** | Full deletion flow via edge function |
| Restore purchases button | **Done** | Available in Settings and Paywall |
| In-app purchase via Apple IAP | **Done** | RevenueCat handles all purchases through StoreKit |
| Medical/health disclaimer | **Needs addition** | Only exists in Terms of Service; should be visible during onboarding |
| Age rating | **Needs configuration** | Must be set in App Store Connect; fitness content is generally 4+ |
| App Store screenshots | **Not found** | No App Store marketing screenshots in the repository |
| App Store description | **Not found** | No App Store metadata files in the repository |

### 6.2 Critical App Store Blockers

The following items will likely cause rejection if not addressed before submission:

**1. PrivacyInfo.xcprivacy must declare collected data.** Apple requires all apps to accurately declare the data types they collect. The current file has an empty `NSPrivacyCollectedDataTypes` array, but the app collects health data, email, fitness metrics, and more. This will trigger an automatic rejection.

**2. Push notification entitlement must be set to production.** The `aps-environment` value of `development` will cause push notifications to fail in the production App Store build. Apple may also flag this during review.

**3. Apple Team ID in AASA file.** The placeholder `XXXXXXXXXX` in the `apple-app-site-association` file will prevent universal links from working. While this may not cause outright rejection, it will break password reset and referral deep links.

**4. Health disclaimer visibility.** Apple's Guideline 1.4 (Physical Harm) requires fitness apps to include appropriate disclaimers. The current disclaimer is buried in the Terms of Service. A visible disclaimer during onboarding or first launch would strengthen the submission.

### 6.3 Recommended Pre-Submission Steps

First, update the Xcode project to build with the latest stable iOS SDK. Apple's deadline for requiring apps to be built with the iOS 18 SDK (or later) is approaching, and submitting with an older SDK will result in rejection.

Second, prepare all App Store Connect metadata: app name, subtitle, description, keywords, screenshots for all required device sizes (6.7" and 6.1" iPhones at minimum), and an app preview video if possible.

Third, complete a full TestFlight beta cycle with at least 5 external testers to catch device-specific issues before submission.

Fourth, ensure the privacy nutrition label in App Store Connect matches the data types declared in `PrivacyInfo.xcprivacy` and the actual data collection behavior of the app.

Fifth, test the complete purchase flow end-to-end in the sandbox environment, including subscription, restoration, and cancellation.

---

## 7. QA Coverage and Recommendations

### 7.1 Current Test Coverage

The repository includes a Playwright-based E2E test suite with 7 test files totaling 2,386 lines of test code. The existing test coverage is focused on the following areas:

| Test File | Lines | Coverage Area |
|-----------|-------|---------------|
| `smoke.spec.ts` | 45 | Basic app loading and navigation |
| `auth-onboarding.spec.ts` | 515 | Authentication and onboarding flows |
| `core-journeys.spec.ts` | 343 | Primary user journeys |
| `p0-critical.spec.ts` | 376 | Critical path testing |
| `workout-features.spec.ts` | 338 | Workout logging and customization |
| `food-search.spec.ts` | 143 | Food search and selection |
| `meal-persistence.spec.ts` | 482 | Meal logging and data persistence |
| `favorites.spec.ts` | 144 | Saved meals / favorites |

A `MANUAL_QA.md` document also exists with detailed manual testing checklists organized by feature area.

### 7.2 Gaps in Test Coverage

The following features lack automated test coverage and should be prioritized:

**Subscription flow** cannot be fully tested in E2E without RevenueCat sandbox configuration, but the UI states (loading, error, success) should be tested with mocked responses.

**Account deletion** is a critical flow that should have at least a UI-level test verifying the confirmation dialog appears and the correct edge function is called.

**Locked Protocol** creation, daily compliance logging, and milestone detection are untested.

**Share card generation** should be tested to ensure the DOM-to-image capture works correctly across different screen sizes.

**Offline mode** behavior (data persistence, sync indicator, reconnection sync) should be tested by simulating network disconnection.

### 7.3 QA Recommendations

Implement a pre-release checklist that covers the following device-specific scenarios:

| Scenario | Test Method |
|----------|-------------|
| iPhone SE (small screen) | Verify all layouts, especially workout name overflow |
| iPhone 15 Pro Max (large screen) | Verify content doesn't float or misalign |
| iOS 16 (minimum supported) | Verify backward compatibility |
| iOS 18 (latest) | Verify no deprecation warnings |
| Dark mode (default) | Already the primary theme |
| Dynamic Type (accessibility) | Verify text scales without breaking layout |
| VoiceOver | Verify all interactive elements have labels |
| Slow network (3G) | Verify loading states and timeouts |
| No network | Verify offline mode and sync recovery |
| First launch (clean install) | Verify onboarding flow end-to-end |
| Upgrade from previous version | Verify data migration and persistence |

---

## 8. Asset Review

### 8.1 App Icon

The app icon (`resources/icon.png`) features the WellTrained "W" logo with a running figure silhouette in neon green on a dark background. The icon is clean and recognizable at small sizes. It meets Apple's requirement for a 1024x1024 single-layer icon without transparency.

**Assessment:** Good. No changes needed for submission.

### 8.2 Splash Screen

The splash screen (`resources/splash.png`) is a dark background with a subtle green glow in the center. It lacks the WellTrained logo or any text. While minimalist, it may appear as a loading error to users who expect to see branding during app launch.

**Recommendation:** Add the WellTrained logo or "W" mark to the splash screen center. The animated splash screen component (`AnimatedSplashScreen`) in the code handles the transition, but the native splash (shown before the web view loads) should also be branded.

### 8.3 Avatar Assets

The avatar system includes 25 illustrations (5 archetypes x 5 stages) totaling 3.3 MB. Individual files range from 96 KB to 184 KB, which is reasonable for illustration-quality PNGs. The art style is consistent: cartoon/comic-style male figures that progress from casual/uncertain (stage 1) to confident/muscular (stage 5).

**Assessment:** The illustrations are well-executed and consistent. Consider adding WebP versions for faster loading on web, though the PNG sizes are acceptable for a native app.

### 8.4 Oversized Assets

The `public/` directory contains two problematic files:

| File | Size | Issue |
|------|------|-------|
| `public/icon-only.png` | 3.1 MB | Identical to `WT Logo.png`; far too large for a web asset |
| `public/WT Logo.png` | 3.1 MB | Should be optimized or replaced with a smaller version |
| `public/icon-only.png.bak` | 37 KB | Backup file that should not be in the repository |

**Recommendation:** Optimize both logo files to under 100 KB using lossy PNG compression or convert to WebP. Remove the `.bak` file. These files are served as static assets and the 3.1 MB size will significantly impact initial page load on the web version.

### 8.5 Repository Hygiene

Seven `.DS_Store` files are committed to the repository. These macOS metadata files serve no purpose in version control and can leak directory structure information.

**Recommendation:** Add `.DS_Store` to `.gitignore` (if not already present) and remove existing files with `find . -name '.DS_Store' -delete && git add -A && git commit -m "Remove .DS_Store files"`.

---

## 9. Code Quality Observations

### 9.1 Strengths

The codebase demonstrates several positive engineering practices. The Zustand stores are cleanly separated by domain (user, DP, macros, workouts, avatar, health, sync, subscription, access, referral, locked, achievements, onboarding). Each store uses the `persist` middleware for offline resilience, and the sync layer handles bidirectional data flow with Supabase.

TypeScript is used throughout with reasonable type safety. The `validation.ts` module provides centralized input sanitization. Error boundaries wrap the app to prevent white-screen crashes. Lazy loading with `React.lazy` and `Suspense` is applied to all route-level components, which will help with initial load performance.

The design system is documented in `DESIGN.md` with clear color tokens, typography scales, and component patterns. The use of Tailwind CSS 4 with custom design tokens (`--color-primary`, `--color-ember`, etc.) provides consistency.

### 9.2 Areas for Improvement

**Legacy code coexistence.** The old `Onboarding.tsx` (1,017 lines) sits alongside the new `onboarding-v2/` directory. The old file is only accessible via a dev bypass, but it still contributes to the bundle size and maintenance surface area.

**Hardcoded constants.** The steps goal (10,000) and sleep goal (420 minutes / 7 hours) are hardcoded in `CheckInModal.tsx`. These should be configurable per user or at least defined in a shared constants file.

**Component file sizes.** Several screen components are quite large: `Settings.tsx` and the legacy `Onboarding.tsx` each exceed 1,000 lines. Breaking these into smaller sub-components would improve maintainability.

**TODO comments.** Two `TODO: Re-enable for v2 launch` comments in `App.tsx` reference the disabled MealPlan feature. These should be tracked in a proper issue tracker rather than code comments.

---

## 10. Priority Action Items

The following table summarizes all findings organized by priority. **P0** items are blockers for App Store submission. **P1** items are strongly recommended before launch. **P2** items are improvements that can be addressed post-launch.

| Priority | Category | Item | Effort |
|----------|----------|------|--------|
| **P0** | App Store | Populate `NSPrivacyCollectedDataTypes` in PrivacyInfo.xcprivacy | Small |
| **P0** | App Store | Change `aps-environment` from `development` to `production` in App.entitlements | Small |
| **P0** | App Store | Replace Team ID placeholder (`XXXXXXXXXX`) in apple-app-site-association | Small |
| **P0** | Security | Remove dev fallback in access code validation (accepts any 8+ char code) | Small |
| **P0** | App Store | Prepare App Store Connect metadata (screenshots, description, privacy label) | Medium |
| **P0** | App Store | Verify build compiles with latest Xcode and iOS SDK | Medium |
| **P1** | UX | Add visible health/medical disclaimer during onboarding | Small |
| **P1** | UX | Fix workout name overflow on the Today card | Small |
| **P1** | Assets | Optimize `icon-only.png` and `WT Logo.png` (3.1 MB each) | Small |
| **P1** | Assets | Improve splash screen with WellTrained branding | Small |
| **P1** | Security | Remove `.DS_Store` files and add to `.gitignore` | Small |
| **P1** | UX | Address recovery day compliance gap (4/4 vs 5/5) | Medium |
| **P1** | App Store | Host privacy policy at a public URL (not just in-app) | Small |
| **P1** | QA | Complete TestFlight beta cycle with external testers | Medium |
| **P1** | Code | Remove legacy `Onboarding.tsx` (dead code) | Small |
| **P2** | UX | Move weight tracking out of Settings to a dedicated section | Medium |
| **P2** | UX | Add prominent offline mode indicator | Small |
| **P2** | QA | Add E2E tests for subscription flow, account deletion, locked protocol | Large |
| **P2** | Code | Extract hardcoded fitness constants to a shared config | Small |
| **P2** | Code | Break large components (Settings, legacy Onboarding) into sub-components | Medium |
| **P2** | Assets | Generate WebP versions of avatar illustrations for web | Small |
| **P2** | Code | Remove `.bak` file from public directory | Small |
| **P2** | Feature | Re-enable or fully remove MealPlan AI feature code | Medium |

---

*This audit was conducted through static analysis of the repository source code, configuration files, documentation, and assets. A live device testing pass is recommended as a follow-up to validate findings and catch runtime-specific issues.*
