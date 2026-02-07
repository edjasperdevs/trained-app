# Funnel Definitions

Reference document for Plausible funnel analysis in Trained. Defines three user funnels that map to events in the [event inventory](./EVENTS.md). Funnels are configured in the Plausible dashboard, not in code.

## Funnel 1: Signup to First Workout

Tracks the new user journey from account creation through completing their first workout. The primary activation funnel -- measures how effectively the app converts signups into active users.

| Step | Plausible Event | Description |
|------|----------------|-------------|
| 1 | Signup Completed | User creates account |
| 2 | Onboarding Completed | User finishes onboarding wizard |
| 3 | Workout Started | User starts their first workout |
| 4 | Workout Completed | User finishes their first workout |

**Key metric:** Step 1 to Step 4 conversion rate. A low Step 2 to Step 3 drop-off indicates the onboarding wizard effectively prepares users to train. A high Step 3 to Step 4 drop-off suggests workouts may be too long or unclear.

## Funnel 2: Signup to Habit Formation (7-Day Retention)

Tracks whether new users develop a daily check-in habit, measured by reaching a 7-day streak. The retention funnel -- measures how well the gamification system drives repeat engagement.

| Step | Plausible Event | Description |
|------|----------------|-------------|
| 1 | Signup Completed | User creates account |
| 2 | Onboarding Completed | User finishes onboarding |
| 3 | Check-In Completed | First daily check-in (streak = 1) |
| 4 | XP Claimed | First weekly XP claim |
| 5 | Check-In Completed | Check-in at streak >= 7 (7-day retention) |

**Important limitation:** Steps 3 and 5 use the same Plausible event name (`Check-In Completed`) with different property values (`streak: 1` vs `streak: 7+`). Plausible's built-in funnel feature matches events by name only, not by property value. This means Plausible will count any `Check-In Completed` event for both steps, making the built-in funnel view inaccurate for this specific funnel.

**Recommended approach:** Instead of using Plausible's built-in funnel feature for this funnel, analyze it by:
1. Filtering the `Check-In Completed` goal by the `streak` custom property in the Plausible dashboard
2. Comparing the count of `streak: 1` events (new users checking in) vs `streak: 7` events (retained users)
3. Using the ratio as the effective conversion rate for habit formation

## Funnel 3: Daily Engagement Loop

Tracks a single session's engagement depth -- whether users complete the full daily loop of nutrition logging, working out, and checking in. The engagement funnel -- measures daily session completeness.

| Step | Plausible Event | Description |
|------|----------------|-------------|
| 1 | App Opened | User opens the app |
| 2 | Meal Logged | User logs nutrition |
| 3 | Workout Completed | User finishes workout |
| 4 | Check-In Completed | User completes daily report |

**Key metric:** Step 1 to Step 4 completion rate. Users who complete all four steps in a session are fully engaged. Drop-offs between steps indicate which feature area needs attention (nutrition vs training vs gamification).

## Dashboard Configuration

Funnels are configured in the Plausible web dashboard, not in application code.

### Prerequisites

1. **Create Goals first.** Every event referenced by a funnel step must exist as a Custom Event Goal in Plausible (Settings > Goals > Add Goal > Custom Event). See the [Plausible Dashboard Checklist](./EVENTS.md#plausible-dashboard-checklist) for the full list of 22 goals to create.

2. **Events must be firing.** Goals only populate once the application sends matching events. Wire the 15 missing events (see [Event Inventory](./EVENTS.md#complete-event-inventory)) before expecting funnel data.

### Creating Funnels

1. Go to **Settings > Funnels** in the Plausible dashboard
2. Click **Add Funnel**
3. Name the funnel (e.g., "Signup to First Workout")
4. Add steps in order, selecting the corresponding Goal for each step
5. Save

### Plausible Funnel Rules

- Each funnel requires **2 to 8 steps**
- Each step maps to exactly one Goal (event)
- Funnels are **strict-ordered**: Plausible only counts a user as progressing through the funnel if they triggered events in the defined sequence
- Steps match by **event name only**, not by property values (relevant for Funnel 2 -- see limitation note above)
- Funnel data is calculated from the date the funnel is created; it is not retroactive

### Post-Launch Setup Order

1. Create all 22 Custom Event Goals (from EVENTS.md checklist)
2. Create Funnel 1: Signup to First Workout (4 steps)
3. Create Funnel 3: Daily Engagement Loop (4 steps)
4. For Funnel 2: Use property filtering on Check-In Completed instead of built-in funnel feature
