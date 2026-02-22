# Phase 15: Local Notifications + Engagement - Research

**Researched:** 2026-02-22
**Domain:** Capacitor local notifications scheduling, iOS app badge management, Zustand notification preferences
**Confidence:** HIGH

## Summary

Phase 15 adds client-side local notification scheduling and app badge management on top of the Phase 14 remote push infrastructure. The `@capacitor/local-notifications` plugin (v7.0.5 for Capacitor 7.x) provides iOS `UNCalendarNotificationTrigger`-backed scheduling with full `weekday` + `hour` + `minute` support via its `ScheduleOn` interface. This means daily reminders (check-in, workout, macros) and weekly reminders (XP claim on Sunday, check-in submission on Saturday) can all be expressed as repeating calendar triggers without any server involvement.

The existing `remindersStore.ts` already has a `ReminderPreferences` interface with boolean toggles for `logMacros`, `checkIn`, `claimXP`, and `workout`. This store needs to be extended with configurable times (hour/minute per notification type) and the actual scheduling/cancellation logic that bridges preferences to the Capacitor local notifications API. The Settings screen already renders toggle switches for these four reminder types -- it needs time pickers added alongside each toggle.

For app icon badges, `@capawesome/capacitor-badge` (v7.0.1, peer dep `@capacitor/core >=7.0.0`) provides a simple `set()`/`clear()` API that wraps `UNUserNotificationCenter.setBadgeCount()` on iOS. Badge count should be computed from two sources: (1) pending daily check-in (from `remindersStore.shouldShowCheckInReminder()`), and (2) unread coach responses (from `localStorage.getItem('trained-latest-checkin')` where `status === 'reviewed'` and a new `lastSeenCoachResponse` timestamp). The streak-at-risk notification (ENGAGE-01) is a special daily check at a configurable evening time that reads `userStore.profile.lastCheckInDate` and fires only if the user hasn't checked in today.

**Primary recommendation:** Extend the existing `remindersStore` with time preferences and a `scheduleAllNotifications()` function that cancels all pending local notifications, then re-schedules based on current preferences. Call this function on app launch, after preference changes, and after workout day changes. Use stable notification IDs (1-6 for the six types) so cancellation is deterministic. Install `@capawesome/capacitor-badge` for badge management and update the badge count on app foreground/background transitions.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@capacitor/local-notifications` | ^7.0.5 | Schedule repeating local notifications via iOS UNCalendarNotificationTrigger | Official Capacitor plugin; ScheduleOn supports weekday+hour+minute; iOS native implementation confirmed in source |
| `@capawesome/capacitor-badge` | ^7.0.1 | Get/set/clear app icon badge count | Only maintained Capacitor 7-compatible badge plugin; wraps UNUserNotificationCenter.setBadgeCount on iOS |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@capacitor/push-notifications` | ^7.0.5 (already installed) | Push permission check (badge permission is included in push permission) | Already granted via Phase 14; no additional permission request needed |
| `@capacitor/app` | ^7.1.2 (already installed) | appStateChange listener for badge update on foreground | Already wired in App.tsx |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@capawesome/capacitor-badge` | Native badge via `@capacitor/local-notifications` badge field | Local notifications only set badge on notification delivery, not programmatically. Badge plugin allows setting count at any time. |
| `@capawesome/capacitor-badge` | `@nicccey/capacitor-native-settings` + direct UNUserNotificationCenter bridge | Would require a custom native plugin for badge; badge plugin already exists and is maintained |
| Extending `remindersStore` | New `notificationStore` | Reminders store already has the preference shape, toggle logic, and Settings UI wiring. Extending is simpler than creating a new store. |

**Installation:**
```bash
npm install @capacitor/local-notifications@^7.0.5 @capawesome/capacitor-badge@^7.0.1
npx cap sync
```

## Architecture Patterns

### Recommended Project Structure

```
src/
  stores/
    remindersStore.ts    # EXTEND: add time prefs, scheduling logic, badge count
  lib/
    notifications.ts     # NEW: thin wrapper around LocalNotifications schedule/cancel
    badge.ts             # NEW: thin wrapper around Badge set/clear with pending count computation
  screens/
    Settings.tsx         # MODIFY: add time pickers for each notification type
  App.tsx                # MODIFY: call scheduleAllNotifications on launch, update badge on foreground
```

### Pattern 1: Notification Scheduling via ScheduleOn

**What:** Use `ScheduleOn` with `weekday` + `hour` + `minute` for repeating calendar-based notifications
**When to use:** For all six notification types (daily and weekly)

```typescript
// Source: capacitor-plugins/local-notifications/src/definitions.ts (GitHub)
import { LocalNotifications, Weekday } from '@capacitor/local-notifications'

// Daily check-in reminder at user's configured time (e.g. 8:00 AM every day)
await LocalNotifications.schedule({
  notifications: [
    {
      id: 1, // Stable ID for check-in reminder
      title: 'Daily Check-in',
      body: 'Complete your daily check-in to maintain your streak.',
      schedule: {
        on: { hour: 8, minute: 0 },
        // When only hour+minute are set (no weekday/day), iOS creates a
        // UNCalendarNotificationTrigger that fires daily at that time
        // with repeats: true (plugin sets this when using 'on')
      },
      extra: { route: '/' },
    },
  ],
})

// Weekly XP claim reminder on Sundays at 10:00 AM
await LocalNotifications.schedule({
  notifications: [
    {
      id: 4, // Stable ID for XP claim
      title: 'Weekly Reward Ready',
      body: 'Your weekly reward is ready to claim!',
      schedule: {
        on: { weekday: Weekday.Sunday, hour: 10, minute: 0 },
        // weekday + hour + minute creates a weekly repeating trigger
      },
      extra: { route: '/' },
    },
  ],
})
```

### Pattern 2: Cancel-and-Reschedule on Preference Change

**What:** Cancel all pending notifications, then re-schedule only enabled ones
**When to use:** After any preference toggle or time change in Settings, after workout day changes, on app launch

```typescript
// src/lib/notifications.ts
import { LocalNotifications } from '@capacitor/local-notifications'
import { isNative } from '@/lib/platform'

// Stable notification IDs (deterministic cancel/reschedule)
export const NOTIFICATION_IDS = {
  DAILY_CHECKIN: 1,
  WORKOUT: 2,      // One per workout day: 20, 21, 22, 23, 24, 25, 26
  MACRO_LOGGING: 3,
  XP_CLAIM: 4,
  WEEKLY_CHECKIN: 5,
  STREAK_AT_RISK: 6,
} as const

export async function cancelAllScheduled(): Promise<void> {
  if (!isNative()) return
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel(pending)
  }
}

export async function scheduleAllNotifications(
  prefs: NotificationPreferences
): Promise<void> {
  if (!isNative()) return

  await cancelAllScheduled()

  const notifications = []

  if (prefs.checkIn.enabled) {
    notifications.push({
      id: NOTIFICATION_IDS.DAILY_CHECKIN,
      title: 'Daily Check-in',
      body: 'Complete your daily check-in to maintain your streak.',
      schedule: { on: { hour: prefs.checkIn.hour, minute: prefs.checkIn.minute } },
      extra: { route: '/' },
    })
  }

  // ... build remaining notifications based on prefs

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}
```

### Pattern 3: Workout Day-Specific Scheduling

**What:** Schedule workout reminders only on the user's selected training days
**When to use:** When building the workout reminder notifications

```typescript
// Use workoutStore.currentPlan.selectedDays to schedule per-day notifications
import { Weekday } from '@capacitor/local-notifications'

// Map DayOfWeek (0=Sun...6=Sat) to Capacitor Weekday enum (1=Sun...7=Sat)
const toCapWeekday = (day: number): Weekday => (day + 1) as Weekday

// For each selected workout day, schedule a separate notification
const workoutDays = workoutStore.currentPlan?.selectedDays || []
for (const day of workoutDays) {
  notifications.push({
    id: 20 + day, // IDs 20-26 for workout days (Sun=20, Mon=21, etc.)
    title: 'Workout Day',
    body: "Time to train. Let's go.",
    schedule: {
      on: {
        weekday: toCapWeekday(day),
        hour: prefs.workout.hour,
        minute: prefs.workout.minute,
      },
    },
    extra: { route: '/workouts' },
  })
}
```

### Pattern 4: Badge Count Computation

**What:** Calculate badge count from pending actions and update iOS badge
**When to use:** On app foreground, after completing actions, periodically

```typescript
// src/lib/badge.ts
import { Badge } from '@capawesome/capacitor-badge'
import { isNative } from '@/lib/platform'

export async function updateBadgeCount(count: number): Promise<void> {
  if (!isNative()) return
  if (count <= 0) {
    await Badge.clear()
  } else {
    await Badge.set({ count })
  }
}

// Compute pending action count:
// 1. Daily check-in not done today → +1
// 2. Unread coach response (status=reviewed, not yet seen) → +1
export function computePendingActions(): number {
  let count = 0

  // Check if daily check-in is pending
  const todayLog = useXPStore.getState().getTodayLog()
  if (!todayLog?.checkIn) count++

  // Check for unread coach response
  const latestCheckin = localStorage.getItem('trained-latest-checkin')
  if (latestCheckin) {
    const parsed = JSON.parse(latestCheckin)
    const lastSeen = localStorage.getItem('trained-last-seen-coach-response')
    if (parsed.status === 'reviewed' && parsed.reviewed_at && parsed.reviewed_at !== lastSeen) {
      count++
    }
  }

  return count
}
```

### Pattern 5: Streak-at-Risk Evening Notification

**What:** Schedule a single daily notification that fires in the evening to warn about streak loss
**When to use:** For ENGAGE-01 requirement

```typescript
// The streak-at-risk notification is a standard daily local notification
// at a configured evening time (default 8:00 PM). The notification fires
// regardless, but the user can toggle it off.
//
// Alternative considered: Only schedule if user hasn't checked in yet.
// Problem: We'd need to reschedule every time the user checks in or misses,
// which adds complexity. Better to always fire at the evening time --
// the user either sees it as a helpful reminder or dismisses it.
// If they've already checked in, the notification content can reflect that
// by checking at schedule time, but iOS local notifications are static
// (content is set at schedule time, not delivery time).
//
// DECISION: Schedule always, use generic encouraging copy. The in-app
// reminders already handle the "already done" case by hiding.

{
  id: NOTIFICATION_IDS.STREAK_AT_RISK,
  title: 'Don\'t Break Your Streak',
  body: 'You still have time to check in today.',
  schedule: { on: { hour: 20, minute: 0 } }, // 8 PM daily
  extra: { route: '/' },
}
```

### Anti-Patterns to Avoid

- **Scheduling notifications without canceling first:** Always cancel all pending before rescheduling. Duplicate schedules with the same ID silently add new triggers without removing old ones on some versions.
- **Using `every` instead of `on`:** The `every: 'day'` option doesn't allow setting the hour/minute. Use `on: { hour, minute }` for daily and `on: { weekday, hour, minute }` for weekly.
- **Dynamic notification content based on app state:** iOS local notification content is set at schedule time, not delivery time. You cannot check "has user checked in?" at notification delivery. Content must be generic.
- **Scheduling more than 64 notifications:** iOS caps pending notifications at 64. This phase uses at most ~13 (1 check-in + 7 workout days max + 1 macros + 1 XP + 1 weekly checkin + 1 streak + 1 spare), well within the limit.
- **Setting badge count from notification payload:** Don't set badge via the notification's `badge` field for local notifications. Use the Badge plugin to set it programmatically based on computed pending actions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Repeating notification scheduling | Custom timer + manual notification triggers | `@capacitor/local-notifications` with `ScheduleOn` | iOS UNCalendarNotificationTrigger handles repeats natively, survives app kill |
| App icon badge count | Custom native bridge to UNUserNotificationCenter | `@capawesome/capacitor-badge` | Handles iOS 16 (applicationIconBadgeNumber) vs iOS 17+ (setBadgeCount) difference |
| Notification permission check | Custom permission flow | Reuse Phase 14's push permission (includes local notification permission) | Push permission request grants local notification permission too on iOS |
| Notification ID management | UUID-based IDs | Stable integer IDs (1-26 range) | Deterministic cancel/reschedule; integer IDs are required by the plugin |

**Key insight:** Local notifications on iOS are entirely client-side -- they survive app kill, device reboot, and don't need a server. The scheduling logic is a pure function of user preferences + workout days, making it testable and deterministic. The only coordination needed is calling `scheduleAllNotifications()` at the right moments.

## Common Pitfalls

### Pitfall 1: Push Permission Already Covers Local Notifications

**What goes wrong:** Developer calls `LocalNotifications.requestPermissions()` separately, creating a redundant permission prompt.
**Why it happens:** Confusion between push and local notification permissions on iOS.
**How to avoid:** On iOS, `PushNotifications.requestPermissions()` grants permission for ALL notification types (alerts, sounds, badges, local notifications). Since Phase 14 already requests push permission, local notifications are already authorized. Just call `LocalNotifications.checkPermissions()` to verify, never `requestPermissions()` again.
**Warning signs:** User sees duplicate "Allow Notifications?" prompts.

### Pitfall 2: ScheduleOn Weekday Enum Off-by-One

**What goes wrong:** Notifications fire on the wrong day of the week.
**Why it happens:** Capacitor's `Weekday` enum uses 1=Sunday through 7=Saturday (matching iOS `DateComponents.weekday`). JavaScript's `Date.getDay()` uses 0=Sunday through 6=Saturday. Off-by-one if you pass JS day numbers directly.
**How to avoid:** Create a mapping function: `const toCapWeekday = (jsDay: number): Weekday => (jsDay + 1) as Weekday`. The app's `DayOfWeek` type in `workoutStore` uses 0-6 (JS convention), so always convert.
**Warning signs:** Workout reminders on rest days, no reminders on training days.

### Pitfall 3: Notifications Not Rescheduled After Preference Changes

**What goes wrong:** User changes notification time in Settings, but notifications still fire at old time.
**Why it happens:** Scheduled iOS notifications are immutable after scheduling. Changing a preference in the store doesn't automatically update the OS notification schedule.
**How to avoid:** Call `scheduleAllNotifications()` after every preference change (time or toggle). The function cancels all pending and re-schedules from current state.
**Warning signs:** "I changed my reminder time but it still goes off at the old time."

### Pitfall 4: Badge Count Not Cleared on App Open

**What goes wrong:** User opens the app, sees the badge is still showing "2" even though they've completed all pending actions.
**Why it happens:** Badge count is set when the app computes it, but not cleared when the user opens the app and completes actions.
**How to avoid:** Recompute and update badge count on three triggers: (1) app foreground (appStateChange), (2) after check-in completion, (3) after viewing coach response. Set `autoClear: false` in Badge config -- we want manual control.
**Warning signs:** Stale badge count confuses users into thinking there are pending actions.

### Pitfall 5: Notification Tap Navigation When App Is Killed

**What goes wrong:** User taps a local notification to open the app, but doesn't navigate to the intended screen.
**Why it happens:** The `localNotificationActionPerformed` listener may not fire reliably on cold start if listeners aren't registered early enough in the app lifecycle.
**How to avoid:** Register `LocalNotifications.addListener('localNotificationActionPerformed', ...)` as early as possible in the app lifecycle (same pattern as push notification listeners in App.tsx). Use the `extra.route` field for navigation.
**Warning signs:** Tapping notification opens app to home screen instead of the intended route.

### Pitfall 6: Workout Days Change Without Rescheduling

**What goes wrong:** User changes workout days in Settings, but workout reminders still fire on old days.
**Why it happens:** `setWorkoutDays()` in `workoutStore` doesn't trigger notification rescheduling.
**How to avoid:** After `setWorkoutDays()`, call `scheduleAllNotifications()`. Either wire this in the Settings component or subscribe to workoutStore changes.
**Warning signs:** Workout reminders on rest days after schedule change.

## Code Examples

### Extended RemindersStore Types

```typescript
// Extend existing remindersStore.ts
export interface NotificationTimePreference {
  hour: number   // 0-23
  minute: number // 0-59
}

export interface NotificationPreferences {
  checkIn: { enabled: boolean; time: NotificationTimePreference }     // Default 8:00
  workout: { enabled: boolean; time: NotificationTimePreference }     // Default 7:00
  logMacros: { enabled: boolean; time: NotificationTimePreference }   // Default 19:00
  claimXP: { enabled: boolean; time: NotificationTimePreference }     // Default 10:00 (Sunday)
  weeklyCheckIn: { enabled: boolean; time: NotificationTimePreference } // Default 10:00 (Saturday)
  streakProtection: { enabled: boolean; time: NotificationTimePreference } // Default 20:00
}
```

### Notification Scheduling Function

```typescript
// src/lib/notifications.ts
import { LocalNotifications, Weekday } from '@capacitor/local-notifications'
import { isNative } from '@/lib/platform'

const toCapWeekday = (jsDay: number): Weekday => (jsDay + 1) as Weekday

export const NOTIFICATION_IDS = {
  DAILY_CHECKIN: 1,
  MACRO_LOGGING: 3,
  XP_CLAIM: 4,
  WEEKLY_CHECKIN: 5,
  STREAK_AT_RISK: 6,
  // Workout days: 20 + dayOfWeek (20-26)
} as const

export async function scheduleAllNotifications(
  prefs: NotificationPreferences,
  workoutDays: number[]
): Promise<void> {
  if (!isNative()) return

  // Cancel everything first
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel(pending)
  }

  const notifications: LocalNotificationSchema[] = []

  // 1. Daily check-in reminder
  if (prefs.checkIn.enabled) {
    notifications.push({
      id: NOTIFICATION_IDS.DAILY_CHECKIN,
      title: 'Daily Check-in',
      body: 'Complete your daily check-in to maintain your streak.',
      schedule: { on: { hour: prefs.checkIn.time.hour, minute: prefs.checkIn.time.minute } },
      extra: { route: '/' },
    })
  }

  // 2. Workout reminders (one per selected training day)
  if (prefs.workout.enabled) {
    for (const day of workoutDays) {
      notifications.push({
        id: 20 + day,
        title: 'Workout Day',
        body: "Time to train. Let's go.",
        schedule: {
          on: {
            weekday: toCapWeekday(day),
            hour: prefs.workout.time.hour,
            minute: prefs.workout.time.minute,
          },
        },
        extra: { route: '/workouts' },
      })
    }
  }

  // 3. Evening macro logging reminder
  if (prefs.logMacros.enabled) {
    notifications.push({
      id: NOTIFICATION_IDS.MACRO_LOGGING,
      title: 'Log Your Macros',
      body: "Track your nutrition before the day ends.",
      schedule: { on: { hour: prefs.logMacros.time.hour, minute: prefs.logMacros.time.minute } },
      extra: { route: '/macros' },
    })
  }

  // 4. Weekly XP claim reminder (Sundays)
  if (prefs.claimXP.enabled) {
    notifications.push({
      id: NOTIFICATION_IDS.XP_CLAIM,
      title: 'Weekly Reward Ready',
      body: 'Your weekly reward is ready to claim!',
      schedule: {
        on: {
          weekday: Weekday.Sunday,
          hour: prefs.claimXP.time.hour,
          minute: prefs.claimXP.time.minute,
        },
      },
      extra: { route: '/' },
    })
  }

  // 5. Weekly check-in submission reminder (Saturdays)
  if (prefs.weeklyCheckIn.enabled) {
    notifications.push({
      id: NOTIFICATION_IDS.WEEKLY_CHECKIN,
      title: 'Weekly Check-in',
      body: 'Submit your weekly check-in before the week ends.',
      schedule: {
        on: {
          weekday: Weekday.Saturday,
          hour: prefs.weeklyCheckIn.time.hour,
          minute: prefs.weeklyCheckIn.time.minute,
        },
      },
      extra: { route: '/checkin' },
    })
  }

  // 6. Streak-at-risk evening notification
  if (prefs.streakProtection.enabled) {
    notifications.push({
      id: NOTIFICATION_IDS.STREAK_AT_RISK,
      title: "Don't Break Your Streak",
      body: 'You still have time to check in today.',
      schedule: { on: { hour: prefs.streakProtection.time.hour, minute: prefs.streakProtection.time.minute } },
      extra: { route: '/' },
    })
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}
```

### Badge Management

```typescript
// src/lib/badge.ts
import { Badge } from '@capawesome/capacitor-badge'
import { isNative } from '@/lib/platform'
import { useXPStore } from '@/stores/xpStore'

export async function updateBadge(): Promise<void> {
  if (!isNative()) return

  const count = computePendingActions()
  if (count <= 0) {
    await Badge.clear()
  } else {
    await Badge.set({ count })
  }
}

export function computePendingActions(): number {
  let count = 0

  // Pending daily check-in
  const todayLog = useXPStore.getState().getTodayLog()
  if (!todayLog?.checkIn) count++

  // Unread coach response
  try {
    const stored = localStorage.getItem('trained-latest-checkin')
    const lastSeen = localStorage.getItem('trained-last-seen-coach-response')
    if (stored) {
      const checkin = JSON.parse(stored)
      if (checkin.status === 'reviewed' && checkin.reviewed_at && checkin.reviewed_at !== lastSeen) {
        count++
      }
    }
  } catch {
    // Ignore parse errors
  }

  return count
}

export function markCoachResponseSeen(): void {
  try {
    const stored = localStorage.getItem('trained-latest-checkin')
    if (stored) {
      const checkin = JSON.parse(stored)
      if (checkin.reviewed_at) {
        localStorage.setItem('trained-last-seen-coach-response', checkin.reviewed_at)
      }
    }
  } catch {
    // Ignore
  }
}
```

### Local Notification Action Listener (App.tsx)

```typescript
// Add alongside existing push notification listeners in App.tsx
import { LocalNotifications } from '@capacitor/local-notifications'

useEffect(() => {
  if (!isNative()) return

  const listener = LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (action) => {
      const route = action.notification.extra?.route as string | undefined
      if (route) {
        navigate(route)
      }
    }
  )

  return () => { listener.then(l => l.remove()) }
}, [navigate])
```

### Time Picker UI for Settings

```typescript
// Inline time picker component for notification settings
function TimePicker({
  hour,
  minute,
  onChange,
}: {
  hour: number
  minute: number
  onChange: (hour: number, minute: number) => void
}) {
  // Format as HH:MM for input[type=time]
  const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  return (
    <input
      type="time"
      value={value}
      onChange={(e) => {
        const [h, m] = e.target.value.split(':').map(Number)
        onChange(h, m)
      }}
      className="bg-transparent text-sm text-primary font-digital border-none outline-none"
    />
  )
}
```

### Capacitor Config Addition

```typescript
// capacitor.config.ts -- ADD to plugins section
Badge: {
  persist: true,
  autoClear: false, // We manage badge count manually
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| UILocalNotification | UNUserNotificationCenter (UNCalendarNotificationTrigger) | iOS 10 (2016) | Modern API with calendar-based repeating triggers |
| UIApplication.applicationIconBadgeNumber | UNUserNotificationCenter.setBadgeCount() | iOS 16 (2022) | Async API, old property deprecated in iOS 17 |
| Capacitor 6 local-notifications | @capacitor/local-notifications 7.0.5 | Capacitor 7 GA | Same API surface, updated peer dependency |
| @robingenz/capacitor-badge | @capawesome/capacitor-badge | Renamed package | Same author (Robin Genz), moved to capawesome organization |

**Deprecated/outdated:**
- `UIApplication.applicationIconBadgeNumber`: Deprecated in iOS 17. The badge plugin abstracts this.
- `UILocalNotification` (pre-iOS 10): Long deprecated. Capacitor uses `UNUserNotificationCenter` exclusively.
- `@robingenz/capacitor-badge`: Old package name, now `@capawesome/capacitor-badge`.

## Open Questions

1. **Notification Content Personalization**
   - What we know: iOS local notification content is static (set at schedule time). We cannot dynamically check "did the user check in today?" at notification delivery time.
   - What's unclear: Whether the streak-at-risk notification should still fire if the user already checked in that day.
   - Recommendation: Always fire the streak-at-risk notification at the scheduled evening time. The content is generic ("You still have time to check in today"). Users who've already checked in will see it but it's harmless. The alternative (cancel/reschedule on each check-in) adds fragile state management. The user can disable the notification type entirely if they find it annoying.

2. **Badge Count Update Frequency**
   - What we know: Badge count can be updated on app foreground via `appStateChange`. It should also update after completing actions (check-in, viewing coach response).
   - What's unclear: Whether badge should also update on notification delivery (possible via notification content extension, but complex).
   - Recommendation: Update badge count at three points: (1) app launch, (2) app foreground resume, (3) after completing/viewing pending actions. Don't try to update badge from notification delivery -- it requires a Notification Service Extension which is over-engineered for this use case.

3. **Coexistence with Remote Push Notifications**
   - What we know: Phase 14 configured `presentationOptions: ['badge', 'sound', 'alert']` which includes badge. Remote push payloads from `send-push` Edge Function set `aps.badge: 1`.
   - What's unclear: Whether remote push badge count will conflict with locally-managed badge count.
   - Recommendation: Update the `send-push` Edge Function to NOT set `aps.badge` in the payload (remove the `badge: 1` from the APNs payload). Let the client-side badge management be the single source of truth. The remote push should only trigger alert+sound.

4. **Weekly Check-in Reminder Visibility**
   - What we know: LOCAL-05 says "weekly check-in submission reminder on Saturdays." But only coaching clients (those with an active coach_clients relationship) submit weekly check-ins.
   - What's unclear: Whether this notification should be enabled by default for all users or only for coaching clients.
   - Recommendation: Only show/enable the weekly check-in notification toggle in Settings if the user is a coaching client (check via `isCoachingClient()`). Default it to enabled for coaching clients, hidden for non-coached users.

## Sources

### Primary (HIGH confidence)
- [capacitor-plugins/local-notifications/src/definitions.ts](https://github.com/ionic-team/capacitor-plugins/blob/main/local-notifications/src/definitions.ts) -- ScheduleOn interface with weekday, hour, minute confirmed
- [capacitor-plugins/local-notifications/ios/.../LocalNotificationsPlugin.swift](https://github.com/ionic-team/capacitor-plugins/blob/main/local-notifications/ios/Sources/LocalNotificationsPlugin/LocalNotificationsPlugin.swift) -- iOS native implementation maps weekday to DateComponents.weekday, creates UNCalendarNotificationTrigger with repeats:true
- npm: `@capacitor/local-notifications@7.0.5` -- peer dependency `@capacitor/core >=7.0.0` (verified via `npm view`)
- npm: `@capawesome/capacitor-badge@7.0.1` -- peer dependency `@capacitor/core >=7.0.0` (verified via `npm view`)
- [Apple: setBadgeCount(_:withCompletionHandler:)](https://developer.apple.com/documentation/usernotifications/unusernotificationcenter/setbadgecount(_:withcompletionhandler:)) -- iOS 16+ badge API
- Codebase: `src/stores/remindersStore.ts` -- existing ReminderPreferences, shouldShow* methods, Zustand persist
- Codebase: `src/lib/push.ts` -- existing push permission and listener patterns
- Codebase: `capacitor.config.ts` -- existing PushNotifications presentationOptions config
- Codebase: `src/App.tsx` -- existing appStateChange listener, push listener initialization patterns

### Secondary (MEDIUM confidence)
- [Capacitor Local Notifications docs](https://capacitorjs.com/docs/apis/local-notifications) -- API reference for schedule, cancel, getPending, listeners
- [capawesome/capacitor-badge README](https://github.com/capawesome-team/capacitor-badge/blob/main/README.md) -- get/set/clear/increase/decrease API, persist/autoClear config
- [Apple Developer Forums: 64 notification limit](https://developer.apple.com/forums/thread/811171) -- iOS caps pending local notifications at 64

### Tertiary (LOW confidence)
- [ionic-team/capacitor-plugins Issue #129](https://github.com/ionic-team/capacitor-plugins/issues/129) -- weekday support feature request (now implemented, confirmed in source)
- [ionic-team/capacitor Issue #2561](https://github.com/ionic-team/capacitor/issues/2561) -- repeating notification cancellation gotchas

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Both plugins verified via npm (versions, peer deps), source code reviewed for scheduling implementation
- Architecture: HIGH -- Extends existing patterns (remindersStore, push listeners, appStateChange). No novel architecture needed.
- Pitfalls: HIGH -- Weekday enum offset verified in source, 64-notification limit documented by Apple, permission coexistence confirmed (push permission covers local)

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable domain, no fast-moving changes expected)
