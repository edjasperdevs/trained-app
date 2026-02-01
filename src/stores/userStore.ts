import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type TrainingDays = 3 | 4 | 5
export type Goal = 'cut' | 'recomp' | 'maintain' | 'bulk'
export type AvatarBase = 'warrior' | 'mage' | 'rogue'
export type Gender = 'male' | 'female'

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
  height: number // in inches
  age: number
  goal: Goal
  avatarBase: AvatarBase
  createdAt: number
  currentStreak: number
  longestStreak: number
  lastCheckInDate: string | null
  streakPaused: boolean
  onboardingComplete: boolean
}

interface UserStore {
  profile: UserProfile | null
  weightHistory: WeightEntry[]
  setProfile: (profile: Partial<UserProfile>) => void
  initProfile: (data: Omit<UserProfile, 'createdAt' | 'currentStreak' | 'longestStreak' | 'lastCheckInDate' | 'streakPaused' | 'onboardingComplete'>) => void
  completeOnboarding: () => void
  updateStreak: (didCheckIn: boolean) => void
  logWeight: (weight: number) => void
  getTodayWeight: () => WeightEntry | null
  getWeightHistory: (days?: number) => WeightEntry[]
  getWeightTrend: () => { change: number; direction: 'up' | 'down' | 'same' } | null
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
  avatarBase: 'warrior',
  createdAt: Date.now(),
  currentStreak: 0,
  longestStreak: 0,
  lastCheckInDate: null,
  streakPaused: false,
  onboardingComplete: false,
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

        const today = new Date().toISOString().split('T')[0]
        const lastCheckIn = profile.lastCheckInDate

        if (!didCheckIn) {
          // User missed today - check if we need to pause or reset streak
          if (lastCheckIn) {
            const lastDate = new Date(lastCheckIn)
            const todayDate = new Date(today)
            const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

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
          const lastDate = new Date(lastCheckIn)
          const todayDate = new Date(today)
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

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
        const today = new Date().toISOString().split('T')[0]
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

      getTodayWeight: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().weightHistory.find(e => e.date === today) || null
      },

      getWeightHistory: (days = 30) => {
        const history = get().weightHistory
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)
        const cutoffStr = cutoffDate.toISOString().split('T')[0]

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

        if (recent.length === 0 || previous.length === 0) {
          // Just compare first and last
          if (sorted.length >= 2) {
            const change = sorted[0].weight - sorted[sorted.length - 1].weight
            return {
              change: Math.round(change * 10) / 10,
              direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'same'
            }
          }
          return null
        }

        const recentAvg = recent.reduce((sum, e) => sum + e.weight, 0) / recent.length
        const previousAvg = previous.reduce((sum, e) => sum + e.weight, 0) / previous.length
        const change = recentAvg - previousAvg

        return {
          change: Math.round(change * 10) / 10,
          direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'same'
        }
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
