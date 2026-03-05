import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLocalDateString, getLocalDaysDifference } from '../lib/dateUtils'
import type { Archetype } from '@/design/constants'

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type TrainingDays = 3 | 4 | 5
export type Goal = 'cut' | 'recomp' | 'maintain' | 'bulk'
export type Gender = 'male' | 'female'
export type UnitSystem = 'imperial' | 'metric'

export interface WeightEntry {
  date: string
  weight: number
}

export interface UserProfile {
  username: string
  gender: Gender
  fitnessLevel: FitnessLevel
  trainingDaysPerWeek: TrainingDays
  weight: number
  height: number // in inches (stored internally)
  age: number
  goal: Goal
  archetype: Archetype
  createdAt: number
  currentStreak: number
  longestStreak: number
  lastCheckInDate: string | null
  streakPaused: boolean
  onboardingComplete: boolean
  units: UnitSystem
  goalWeight?: number // Target weight in lbs (internal storage)
}

export interface WeightTrendData {
  change: number
  direction: 'up' | 'down' | 'same'
  weeklyRate: number // lbs per week
  daysTracked: number
}

export interface ProjectedGoalData {
  targetWeight: number
  currentWeight: number
  projectedDate: Date | null
  weeksRemaining: number | null
  isAchieved: boolean
  direction: 'losing' | 'gaining' | 'maintaining'
}

interface UserStore {
  profile: UserProfile | null
  weightHistory: WeightEntry[]
  setProfile: (profile: Partial<UserProfile>) => void
  initProfile: (data: Omit<UserProfile, 'createdAt' | 'currentStreak' | 'longestStreak' | 'lastCheckInDate' | 'streakPaused' | 'onboardingComplete'>) => void
  completeOnboarding: () => void
  updateStreak: (didCheckIn: boolean) => void
  logWeight: (weight: number) => void
  setWeightHistory: (history: WeightEntry[]) => void
  getTodayWeight: () => WeightEntry | null
  getWeightHistory: (days?: number) => WeightEntry[]
  getWeightTrend: () => WeightTrendData | null
  getWeeklyAverage: (weeksAgo?: number) => number | null
  getRateOfChange: () => { value: number; period: 'week'; direction: 'losing' | 'gaining' | 'maintaining' } | null
  getProjectedGoalDate: () => ProjectedGoalData | null
  setGoalWeight: (weight: number | null) => void
  resetProgress: () => void
  exportData: () => string
  importData: (data: string) => boolean
}

const initialProfile: UserProfile = {
  username: '',
  gender: 'male',
  fitnessLevel: 'beginner',
  trainingDaysPerWeek: 3,
  weight: 150,
  height: 68, // 5'8" default
  age: 25,
  goal: 'maintain',
  archetype: 'bro',
  createdAt: Date.now(),
  currentStreak: 0,
  longestStreak: 0,
  lastCheckInDate: null,
  streakPaused: false,
  onboardingComplete: false,
  units: 'imperial',
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: null,
      weightHistory: [],

      setProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null
      })),

      initProfile: (data) => set({
        profile: {
          ...initialProfile,
          ...data,
          createdAt: Date.now(),
          currentStreak: 0,
          longestStreak: 0,
          lastCheckInDate: null,
          streakPaused: false,
          onboardingComplete: false,
        }
      }),

      completeOnboarding: () => set((state) => ({
        profile: state.profile ? { ...state.profile, onboardingComplete: true } : null
      })),

      updateStreak: (didCheckIn: boolean) => {
        const profile = get().profile
        if (!profile) return

        // Use local timezone for all date comparisons
        const today = getLocalDateString()
        const lastCheckIn = profile.lastCheckInDate

        if (!didCheckIn) {
          // User missed today - check if we need to pause or reset streak
          if (lastCheckIn) {
            const diffDays = getLocalDaysDifference(lastCheckIn, today)

            if (diffDays >= 2) {
              // Two consecutive misses - reset streak
              set((state) => ({
                profile: state.profile ? {
                  ...state.profile,
                  currentStreak: 0,
                  streakPaused: false
                } : null
              }))
            } else if (diffDays === 1) {
              // First miss - pause streak ("Never Miss Twice")
              set((state) => ({
                profile: state.profile ? {
                  ...state.profile,
                  streakPaused: true
                } : null
              }))
            }
          }
          return
        }

        // User checked in
        let newStreak = profile.currentStreak

        if (lastCheckIn === today) {
          // Already checked in today
          return
        }

        if (lastCheckIn) {
          const diffDays = getLocalDaysDifference(lastCheckIn, today)

          if (diffDays === 1 || (diffDays === 2 && profile.streakPaused)) {
            // Consecutive day or recovering from paused streak
            newStreak = profile.currentStreak + 1
          } else if (diffDays > 2) {
            // Too many days missed - restart
            newStreak = 1
          } else {
            newStreak = profile.currentStreak + 1
          }
        } else {
          // First ever check-in
          newStreak = 1
        }

        const newLongest = Math.max(profile.longestStreak, newStreak)

        set((state) => ({
          profile: state.profile ? {
            ...state.profile,
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastCheckInDate: today,
            streakPaused: false
          } : null
        }))
      },

      logWeight: (weight: number) => {
        const today = getLocalDateString()
        const existingIndex = get().weightHistory.findIndex(e => e.date === today)

        if (existingIndex >= 0) {
          // Update existing entry for today
          set((state) => ({
            weightHistory: state.weightHistory.map((e, i) =>
              i === existingIndex ? { ...e, weight } : e
            )
          }))
        } else {
          // Add new entry
          set((state) => ({
            weightHistory: [...state.weightHistory, { date: today, weight }]
          }))
        }

        // Also update profile weight to the latest
        set((state) => ({
          profile: state.profile ? { ...state.profile, weight } : null
        }))
      },

      setWeightHistory: (history: WeightEntry[]) => {
        set({ weightHistory: history })
      },

      getTodayWeight: () => {
        const today = getLocalDateString()
        return get().weightHistory.find(e => e.date === today) || null
      },

      getWeightHistory: (days = 30) => {
        const history = get().weightHistory
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)
        const cutoffStr = getLocalDateString(cutoffDate)

        return history
          .filter(e => e.date >= cutoffStr)
          .sort((a, b) => a.date.localeCompare(b.date))
      },

      getWeightTrend: () => {
        const history = get().weightHistory
        if (history.length < 2) return null

        // Compare last 7 days average to previous 7 days
        const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date))
        const recent = sorted.slice(0, 7)
        const previous = sorted.slice(7, 14)

        // Calculate days tracked
        const daysTracked = sorted.length

        if (recent.length === 0 || previous.length === 0) {
          // Just compare first and last
          if (sorted.length >= 2) {
            const change = sorted[0].weight - sorted[sorted.length - 1].weight
            const firstDate = new Date(sorted[sorted.length - 1].date)
            const lastDate = new Date(sorted[0].date)
            const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)))
            const weeklyRate = (change / daysDiff) * 7

            return {
              change: Math.round(change * 10) / 10,
              direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'same' as const,
              weeklyRate: Math.round(weeklyRate * 10) / 10,
              daysTracked
            }
          }
          return null
        }

        const recentAvg = recent.reduce((sum, e) => sum + e.weight, 0) / recent.length
        const previousAvg = previous.reduce((sum, e) => sum + e.weight, 0) / previous.length
        const change = recentAvg - previousAvg
        const weeklyRate = change // Already comparing 7-day periods

        return {
          change: Math.round(change * 10) / 10,
          direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'same' as const,
          weeklyRate: Math.round(weeklyRate * 10) / 10,
          daysTracked
        }
      },

      getWeeklyAverage: (weeksAgo = 0) => {
        const history = get().weightHistory
        if (history.length === 0) return null

        const today = new Date()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay() - (weeksAgo * 7))
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)

        const startStr = startOfWeek.toISOString().split('T')[0]
        const endStr = endOfWeek.toISOString().split('T')[0]

        const weekEntries = history.filter(e => e.date >= startStr && e.date < endStr)
        if (weekEntries.length === 0) return null

        const avg = weekEntries.reduce((sum, e) => sum + e.weight, 0) / weekEntries.length
        return Math.round(avg * 10) / 10
      },

      getRateOfChange: () => {
        const trend = get().getWeightTrend()
        if (!trend) return null

        const direction = trend.weeklyRate < -0.25 ? 'losing'
          : trend.weeklyRate > 0.25 ? 'gaining'
          : 'maintaining'

        return {
          value: Math.abs(trend.weeklyRate),
          period: 'week' as const,
          direction
        }
      },

      getProjectedGoalDate: () => {
        const profile = get().profile
        if (!profile?.goalWeight) return null

        const currentWeight = profile.weight
        const targetWeight = profile.goalWeight
        const trend = get().getWeightTrend()

        // Check if goal already achieved
        const isAchieved = Math.abs(currentWeight - targetWeight) < 1

        if (isAchieved) {
          return {
            targetWeight,
            currentWeight,
            projectedDate: null,
            weeksRemaining: null,
            isAchieved: true,
            direction: 'maintaining' as const
          }
        }

        // Determine direction needed
        const needToLose = currentWeight > targetWeight
        const weightDiff = Math.abs(currentWeight - targetWeight)

        if (!trend || trend.daysTracked < 7) {
          // Not enough data for projection
          return {
            targetWeight,
            currentWeight,
            projectedDate: null,
            weeksRemaining: null,
            isAchieved: false,
            direction: needToLose ? 'losing' : 'gaining' as const
          }
        }

        const weeklyRate = trend.weeklyRate
        const isMovingTowardGoal = needToLose ? weeklyRate < 0 : weeklyRate > 0

        if (!isMovingTowardGoal || Math.abs(weeklyRate) < 0.1) {
          // Not moving toward goal or plateau
          return {
            targetWeight,
            currentWeight,
            projectedDate: null,
            weeksRemaining: null,
            isAchieved: false,
            direction: weeklyRate < -0.25 ? 'losing' : weeklyRate > 0.25 ? 'gaining' : 'maintaining' as const
          }
        }

        // Calculate projected date
        const weeksRemaining = weightDiff / Math.abs(weeklyRate)

        // Cap at 2 years (104 weeks)
        if (weeksRemaining > 104) {
          return {
            targetWeight,
            currentWeight,
            projectedDate: null,
            weeksRemaining: null,
            isAchieved: false,
            direction: needToLose ? 'losing' : 'gaining' as const
          }
        }

        const projectedDate = new Date()
        projectedDate.setDate(projectedDate.getDate() + Math.ceil(weeksRemaining * 7))

        return {
          targetWeight,
          currentWeight,
          projectedDate,
          weeksRemaining: Math.round(weeksRemaining * 10) / 10,
          isAchieved: false,
          direction: needToLose ? 'losing' : 'gaining' as const
        }
      },

      setGoalWeight: (weight) => {
        set((state) => ({
          profile: state.profile ? { ...state.profile, goalWeight: weight || undefined } : null
        }))
      },

      resetProgress: () => set({ profile: null, weightHistory: [] }),

      exportData: () => {
        const state = get()
        return JSON.stringify({ user: state.profile }, null, 2)
      },

      importData: (data: string) => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.user) {
            set({ profile: parsed.user })
            return true
          }
          return false
        } catch {
          return false
        }
      }
    }),
    {
      name: 'gamify-gains-user',
    }
  )
)
