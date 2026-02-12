import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMacroStore } from './macroStore'
import { useWorkoutStore } from './workoutStore'
import { useXPStore } from './xpStore'
import { getLocalDateString } from '../lib/dateUtils'

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

  // Actions
  setPreference: (type: ReminderType, enabled: boolean) => void
  dismissReminder: (type: ReminderType) => void
  shouldShowLogMacrosReminder: () => boolean
  shouldShowCheckInReminder: () => boolean
  shouldShowClaimXPReminder: () => boolean
  shouldShowWorkoutReminder: () => boolean
  getActiveReminders: () => ActiveReminder[]
  resetDismissals: () => void
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
    description: "Claim your points before Sunday ends.",
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

      setPreference: (type, enabled) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [type]: enabled
          }
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

        const todayLog = useXPStore.getState().getTodayLog()
        return !todayLog?.checkIn
      },

      shouldShowClaimXPReminder: () => {
        const { preferences, dismissedToday, lastDismissDate } = get()
        if (!preferences.claimXP) return false

        const today = getLocalDateString()
        if (lastDismissDate === today && dismissedToday.includes('claimXP')) return false

        // Check if it's Sunday
        const isSunday = new Date().getDay() === 0
        if (!isSunday) return false

        // Check if there's pending XP
        const canClaim = useXPStore.getState().canClaimXP()
        return canClaim
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

        // Then XP claim (Sunday only)
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
      }
    }),
    {
      name: 'gamify-gains-reminders'
    }
  )
)
