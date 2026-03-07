import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLocalDateString, getStartOfLocalWeek, getLocalWeekString } from '../lib/dateUtils'
import { useDPStore } from './dpStore'
import { useWorkoutStore } from './workoutStore'

export interface WeeklyStats {
  dpEarned: number
  compliancePercentage: number
  streak: number
  workoutsCompleted: number
  proteinDaysHit: number
  bestWorkoutDP: number
}

interface WeeklyReportStore {
  lastShownWeekStart: string | null
  lastShownDate: string | null

  getWeeklyStats: () => WeeklyStats
  shouldShowReport: () => boolean
  markReportShown: () => void
}

/** Get ISO date string for most recent Sunday (week start) */
function getWeekStartDate(): string {
  return getLocalWeekString()
}

export const useWeeklyReportStore = create<WeeklyReportStore>()(
  persist(
    (set, get) => ({
      lastShownWeekStart: null,
      lastShownDate: null,

      getWeeklyStats: () => {
        const dpStore = useDPStore.getState()
        const workoutStore = useWorkoutStore.getState()

        // Get the past 7 days (Sunday - Saturday)
        const weekStart = getStartOfLocalWeek()
        const weekStartStr = getLocalDateString(weekStart)

        // Calculate week end (6 days after week start to include Sunday-Saturday)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        const weekEndStr = getLocalDateString(weekEnd)

        // Aggregate DP from dailyLogs for the week
        let dpEarned = 0
        let daysWithDPAction = 0
        let proteinDaysHit = 0
        let bestWorkoutDP = 0

        dpStore.dailyLogs.forEach(log => {
          if (log.date >= weekStartStr && log.date <= weekEndStr) {
            dpEarned += log.total

            // Count days with at least one DP action
            if (log.total > 0) {
              daysWithDPAction++
            }

            // Count days where protein > 0
            if (log.protein > 0) {
              proteinDaysHit++
            }

            // Track highest single day training DP
            if (log.training > 0) {
              const dailyTrainingDP = log.training * 50 // training DP value
              if (dailyTrainingDP > bestWorkoutDP) {
                bestWorkoutDP = dailyTrainingDP
              }
            }
          }
        })

        // Count completed workouts in the date range
        const workoutsCompleted = workoutStore.workoutLogs.filter(
          log => log.completed && log.date >= weekStartStr && log.date <= weekEndStr
        ).length

        // Compliance percentage (days with DP action / 7) * 100
        const compliancePercentage = (daysWithDPAction / 7) * 100

        // Current streak from dpStore
        const streak = dpStore.obedienceStreak

        return {
          dpEarned,
          compliancePercentage,
          streak,
          workoutsCompleted,
          proteinDaysHit,
          bestWorkoutDP,
        }
      },

      shouldShowReport: () => {
        const today = new Date()
        const dayOfWeek = today.getDay()

        // Only show on Sunday (day 0)
        if (dayOfWeek !== 0) {
          return false
        }

        const currentWeekStart = getWeekStartDate()
        const { lastShownWeekStart } = get()

        // Show if we haven't shown this week yet
        return lastShownWeekStart !== currentWeekStart
      },

      markReportShown: () => {
        const currentWeekStart = getWeekStartDate()
        const today = getLocalDateString()

        set({
          lastShownWeekStart: currentWeekStart,
          lastShownDate: today,
        })
      },
    }),
    {
      name: 'trained-weekly-report',
    }
  )
)
