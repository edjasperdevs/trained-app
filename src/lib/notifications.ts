import { LocalNotifications } from '@capacitor/local-notifications'
import { Weekday } from '@capacitor/local-notifications'
import type { LocalNotificationSchema } from '@capacitor/local-notifications'
import { isNative } from '@/lib/platform'
import type { NotificationPreferences } from '@/stores/remindersStore'

/**
 * Stable notification IDs.
 * Workout days use IDs 20 + JS dayOfWeek (0=Sun..6=Sat), i.e. 20-26.
 */
export const NOTIFICATION_IDS = {
  DAILY_CHECKIN: 1,
  MACRO_LOGGING: 3,
  XP_CLAIM: 4,
  WEEKLY_CHECKIN: 5,
  STREAK_AT_RISK: 6,
  REST_TIMER: 100,
} as const

/**
 * Convert JS Date dayOfWeek (0=Sun, 1=Mon, ..., 6=Sat)
 * to Capacitor Weekday enum (1=Sun, 2=Mon, ..., 7=Sat).
 */
export const toCapWeekday = (jsDay: number): Weekday => (jsDay + 1) as Weekday

/**
 * Cancel all pending local notifications.
 * Uses cancel-and-reschedule pattern: always cancel before scheduling.
 */
export async function cancelAllScheduled(): Promise<void> {
  if (!isNative()) return

  try {
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending)
    }
  } catch {
    // Non-blocking -- ignore errors on cancel
  }
}

/**
 * Schedule all local notifications based on user preferences and workout days.
 *
 * @param prefs - Notification preferences with enabled flags and time settings
 * @param workoutDays - Array of JS dayOfWeek values (0=Sun..6=Sat) for workout reminders
 */
export async function scheduleAllNotifications(
  prefs: NotificationPreferences,
  workoutDays: number[]
): Promise<void> {
  if (!isNative()) return

  await cancelAllScheduled()

  const notifications: LocalNotificationSchema[] = []

  // Daily check-in reminder
  if (prefs.checkIn.enabled) {
    notifications.push({
      id: NOTIFICATION_IDS.DAILY_CHECKIN,
      title: 'Daily Check-in',
      body: 'Complete your daily check-in to maintain your streak.',
      schedule: { on: { hour: prefs.checkIn.time.hour, minute: prefs.checkIn.time.minute } },
      extra: { route: '/' },
    })
  }

  // Per-day workout reminders (id: 20 + dayOfWeek)
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

  // Macro logging reminder
  if (prefs.logMacros.enabled) {
    notifications.push({
      id: NOTIFICATION_IDS.MACRO_LOGGING,
      title: 'Log Your Macros',
      body: 'Track your nutrition before the day ends.',
      schedule: { on: { hour: prefs.logMacros.time.hour, minute: prefs.logMacros.time.minute } },
      extra: { route: '/macros' },
    })
  }

  // Weekly XP claim reminder (Sunday)
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

  // Weekly check-in reminder (Saturday)
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

  // Streak-at-risk evening reminder (daily)
  if (prefs.streakProtection.enabled) {
    notifications.push({
      id: NOTIFICATION_IDS.STREAK_AT_RISK,
      title: "Don't Break Your Streak",
      body: 'You still have time to check in today.',
      schedule: {
        on: {
          hour: prefs.streakProtection.time.hour,
          minute: prefs.streakProtection.time.minute,
        },
      },
      extra: { route: '/' },
    })
  }

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications })
    } catch {
      // Non-blocking -- scheduling may fail if permissions not granted
    }
  }
}

/**
 * Show an immediate local notification.
 * Useful for in-app events like rest timer completion.
 */
export async function showImmediateNotification(
  title: string,
  body: string,
  id: number = NOTIFICATION_IDS.REST_TIMER
): Promise<void> {
  if (!isNative()) {
    // Fallback to web Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
    return
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { at: new Date(Date.now() + 100) }, // Immediate (100ms from now)
        },
      ],
    })
  } catch {
    // Non-blocking
  }
}

/**
 * Show rest timer complete notification.
 */
export async function notifyRestTimerComplete(): Promise<void> {
  await showImmediateNotification(
    'Rest Complete',
    'Time to start your next set!',
    NOTIFICATION_IDS.REST_TIMER
  )
}
