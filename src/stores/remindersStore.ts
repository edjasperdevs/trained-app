import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMacroStore } from './macroStore'
import { useWorkoutStore } from './workoutStore'
import { useDPStore } from './dpStore'
import { getLocalDateString } from '../lib/dateUtils'

export interface NotificationTimePreference {
  hour: number   // 0-23
  minute: number // 0-59
}

export interface NotificationPreferences {
  checkIn: { enabled: boolean; time: NotificationTimePreference }
  workout: { enabled: boolean; time: NotificationTimePreference }
  logMacros: { enabled: boolean; time: NotificationTimePreference }
  claimXP: { enabled: boolean; time: NotificationTimePreference }
  weeklyCheckIn: { enabled: boolean; time: NotificationTimePreference }
  streakProtection: { enabled: boolean; time: NotificationTimePreference }
  weeklyReport: { enabled: boolean; time: NotificationTimePreference }
  lockedProtocol: {
    enabled: boolean
    time: NotificationTimePreference               // default: 21:00 (Continuous) or 07:00 (Day Lock)
    protocolType: 'continuous' | 'day_lock'        // synced from active protocol
    eveningReminder: {
      enabled: boolean                             // Day Lock only, default: false
      time: NotificationTimePreference             // default: 21:00
    }
  }
}

export type ReminderType = 'logMacros' | 'checkIn' | 'claimXP' | 'workout'

export interface ReminderPreferences {
  logMacros: boolean
  checkIn: boolean
  claimXP: boolean
  workout: boolean
}

export interface ActiveReminder {
  type: ReminderType
  title: string
  description: string
  icon: string
  action: string
  route: string
}

interface RemindersStore {
  preferences: ReminderPreferences
  dismissedToday: ReminderType[]
  lastDismissDate: string | null
  notificationPreferences: NotificationPreferences

  // Actions
  setPreference: (type: ReminderType, enabled: boolean) => void
  dismissReminder: (type: ReminderType) => void
  setNotificationPreference: (key: keyof NotificationPreferences, enabled: boolean) => void
  setNotificationTime: (key: keyof NotificationPreferences, hour: number, minute: number) => void
  shouldShowLogMacrosReminder: () => boolean
  shouldShowCheckInReminder: () => boolean
  shouldShowClaimXPReminder: () => boolean
  shouldShowWorkoutReminder: () => boolean
  getActiveReminders: () => ActiveReminder[]
  resetDismissals: () => void
  // Locked Protocol setters
  setLockedProtocolEnabled: (enabled: boolean) => void
  setLockedProtocolTime: (hour: number, minute: number) => void
  setLockedProtocolType: (type: 'continuous' | 'day_lock') => void
  setLockedEveningReminderEnabled: (enabled: boolean) => void
  setLockedEveningReminderTime: (hour: number, minute: number) => void
}

const REMINDER_CONFIGS: Record<ReminderType, Omit<ActiveReminder, 'type'>> = {
  logMacros: {
    title: 'Log Macros',
    description: "Track your nutrition for today.",
    icon: 'Beef',
    action: 'Log',
    route: '/macros'
  },
  checkIn: {
    title: 'Daily Check-in',
    description: "Complete your daily check-in.",
    icon: 'CheckCircle',
    action: 'Check In',
    route: '/'
  },
  claimXP: {
    title: 'Weekly Reward Ready',
    description: "Your weekly reward is ready to claim.",
    icon: 'Gift',
    action: 'Claim',
    route: '/'
  },
  workout: {
    title: 'Workout Scheduled',
    description: "Time to train.",
    icon: 'Dumbbell',
    action: 'Start',
    route: '/workouts'
  }
}

export const useRemindersStore = create<RemindersStore>()(
  persist(
    (set, get) => ({
      preferences: {
        logMacros: true,
        checkIn: true,
        claimXP: true,
        workout: true
      },
      dismissedToday: [],
      lastDismissDate: null,
      notificationPreferences: {
        checkIn: { enabled: true, time: { hour: 8, minute: 0 } },
        workout: { enabled: true, time: { hour: 7, minute: 0 } },
        logMacros: { enabled: true, time: { hour: 19, minute: 0 } },
        claimXP: { enabled: true, time: { hour: 10, minute: 0 } },
        weeklyCheckIn: { enabled: false, time: { hour: 10, minute: 0 } },
        streakProtection: { enabled: true, time: { hour: 20, minute: 0 } },
        weeklyReport: { enabled: true, time: { hour: 19, minute: 0 } },
        lockedProtocol: {
          enabled: true,
          time: { hour: 21, minute: 0 },  // 9pm default for Continuous
          protocolType: 'continuous',
          eveningReminder: {
            enabled: false,
            time: { hour: 21, minute: 0 },
          },
        },
      },

      setPreference: (type, enabled) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [type]: enabled
          }
        }))
      },

      setNotificationPreference: (key, enabled) => {
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            [key]: { ...state.notificationPreferences[key], enabled },
          },
        }))
      },

      setNotificationTime: (key, hour, minute) => {
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            [key]: { ...state.notificationPreferences[key], time: { hour, minute } },
          },
        }))
      },

      dismissReminder: (type) => {
        const today = getLocalDateString()
        set((state) => {
          // Reset dismissals if it's a new day
          if (state.lastDismissDate !== today) {
            return {
              dismissedToday: [type],
              lastDismissDate: today
            }
          }
          return {
            dismissedToday: [...state.dismissedToday, type],
            lastDismissDate: today
          }
        })
      },

      shouldShowLogMacrosReminder: () => {
        const { preferences, dismissedToday, lastDismissDate } = get()
        if (!preferences.logMacros) return false

        const today = getLocalDateString()
        if (lastDismissDate === today && dismissedToday.includes('logMacros')) return false

        const todayLog = useMacroStore.getState().getTodayLog()
        // Show reminder if no macros logged today (0 or no log at all)
        return !todayLog || (todayLog.protein === 0 && todayLog.calories === 0)
      },

      shouldShowCheckInReminder: () => {
        const { preferences, dismissedToday, lastDismissDate } = get()
        if (!preferences.checkIn) return false

        const today = getLocalDateString()
        if (lastDismissDate === today && dismissedToday.includes('checkIn')) return false

        // V2: check if any DP action was performed today (training > 0 or protein > 0)
        const todayLog = useDPStore.getState().getTodayLog()
        return !todayLog || (todayLog.training === 0 && todayLog.protein === 0 && todayLog.meals === 0)
      },

      shouldShowClaimXPReminder: () => {
        // V2: DP accrues immediately -- no weekly claim gate
        // Keep the reminder structure but always return false
        return false
      },

      shouldShowWorkoutReminder: () => {
        const { preferences, dismissedToday, lastDismissDate } = get()
        if (!preferences.workout) return false

        const today = getLocalDateString()
        if (lastDismissDate === today && dismissedToday.includes('workout')) return false

        const todayWorkout = useWorkoutStore.getState().getTodayWorkout()
        const isCompleted = useWorkoutStore.getState().isWorkoutCompletedToday()

        // Show reminder if there's a workout scheduled but not completed
        return todayWorkout !== null && !isCompleted
      },

      getActiveReminders: () => {
        const state = get()
        const reminders: ActiveReminder[] = []

        // Check-in reminder comes first (most important for streak)
        if (state.shouldShowCheckInReminder()) {
          reminders.push({ type: 'checkIn', ...REMINDER_CONFIGS.checkIn })
        }

        // Then XP claim (when cooldown has passed)
        if (state.shouldShowClaimXPReminder()) {
          reminders.push({ type: 'claimXP', ...REMINDER_CONFIGS.claimXP })
        }

        // Then workout
        if (state.shouldShowWorkoutReminder()) {
          reminders.push({ type: 'workout', ...REMINDER_CONFIGS.workout })
        }

        // Finally macros
        if (state.shouldShowLogMacrosReminder()) {
          reminders.push({ type: 'logMacros', ...REMINDER_CONFIGS.logMacros })
        }

        return reminders
      },

      resetDismissals: () => {
        set({
          dismissedToday: [],
          lastDismissDate: null
        })
      },

      setLockedProtocolEnabled: (enabled: boolean) => {
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            lockedProtocol: { ...state.notificationPreferences.lockedProtocol, enabled },
          },
        }))
      },

      setLockedProtocolTime: (hour: number, minute: number) => {
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            lockedProtocol: {
              ...state.notificationPreferences.lockedProtocol,
              time: { hour, minute },
            },
          },
        }))
      },

      setLockedProtocolType: (type: 'continuous' | 'day_lock') => {
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            lockedProtocol: { ...state.notificationPreferences.lockedProtocol, protocolType: type },
          },
        }))
      },

      setLockedEveningReminderEnabled: (enabled: boolean) => {
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            lockedProtocol: {
              ...state.notificationPreferences.lockedProtocol,
              eveningReminder: {
                ...state.notificationPreferences.lockedProtocol.eveningReminder,
                enabled,
              },
            },
          },
        }))
      },

      setLockedEveningReminderTime: (hour: number, minute: number) => {
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            lockedProtocol: {
              ...state.notificationPreferences.lockedProtocol,
              eveningReminder: {
                ...state.notificationPreferences.lockedProtocol.eveningReminder,
                time: { hour, minute },
              },
            },
          },
        }))
      },
    }),
    {
      name: 'gamify-gains-reminders'
    }
  )
)
