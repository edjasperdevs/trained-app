import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useUserStore } from './userStore'
import { useWorkoutStore } from './workoutStore'
import { useXPStore } from './xpStore'
import { useMacroStore } from './macroStore'

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: BadgeRarity
  category: 'streak' | 'workout' | 'nutrition' | 'level' | 'special'
  requirement: number
  checkProgress: () => number
}

export interface EarnedBadge {
  badgeId: string
  earnedAt: number
}

interface AchievementsStore {
  earnedBadges: EarnedBadge[]
  lastChecked: number | null

  // Actions
  checkAndAwardBadges: () => string[]
  getBadgeProgress: (badgeId: string) => { current: number; required: number; percentage: number }
  hasEarnedBadge: (badgeId: string) => boolean
  getEarnedBadges: () => (Badge & { earnedAt: number })[]
  getAvailableBadges: () => Badge[]
  getAllBadges: () => Badge[]
}

// Badge definitions
const createBadges = (): Badge[] => [
  // Streak badges
  {
    id: 'streak-7',
    name: 'Iron Pipeline',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    rarity: 'common',
    category: 'streak',
    requirement: 7,
    checkProgress: () => useUserStore.getState().profile?.currentStreak || 0
  },
  {
    id: 'streak-30',
    name: '99.9% Uptime',
    description: 'Maintain a 30-day streak',
    icon: '🔥',
    rarity: 'rare',
    category: 'streak',
    requirement: 30,
    checkProgress: () => useUserStore.getState().profile?.currentStreak || 0
  },
  {
    id: 'streak-100',
    name: 'Always On',
    description: 'Maintain a 100-day streak',
    icon: '💯',
    rarity: 'legendary',
    category: 'streak',
    requirement: 100,
    checkProgress: () => useUserStore.getState().profile?.currentStreak || 0
  },

  // Workout badges
  {
    id: 'workouts-10',
    name: 'First Commit',
    description: 'Complete 10 workouts',
    icon: '🏋️',
    rarity: 'common',
    category: 'workout',
    requirement: 10,
    checkProgress: () => useWorkoutStore.getState().workoutLogs.filter(w => w.completed).length
  },
  {
    id: 'workouts-25',
    name: 'Stable Build',
    description: 'Complete 25 workouts',
    icon: '💪',
    rarity: 'common',
    category: 'workout',
    requirement: 25,
    checkProgress: () => useWorkoutStore.getState().workoutLogs.filter(w => w.completed).length
  },
  {
    id: 'workouts-50',
    name: 'Production Ready',
    description: 'Complete 50 workouts',
    icon: '🦾',
    rarity: 'rare',
    category: 'workout',
    requirement: 50,
    checkProgress: () => useWorkoutStore.getState().workoutLogs.filter(w => w.completed).length
  },
  {
    id: 'workouts-100',
    name: 'Beast Mode',
    description: 'Complete 100 workouts',
    icon: '👑',
    rarity: 'epic',
    category: 'workout',
    requirement: 100,
    checkProgress: () => useWorkoutStore.getState().workoutLogs.filter(w => w.completed).length
  },

  // Nutrition badges
  {
    id: 'protein-7',
    name: 'Data-Fed',
    description: 'Hit protein target 7 days',
    icon: '🥩',
    rarity: 'common',
    category: 'nutrition',
    requirement: 7,
    checkProgress: () => {
      const targets = useMacroStore.getState().targets
      if (!targets) return 0
      return useMacroStore.getState().dailyLogs.filter(
        log => Math.abs(log.protein - targets.protein) <= 10
      ).length
    }
  },
  {
    id: 'protein-30',
    name: 'Optimized Inputs',
    description: 'Hit protein target 30 days',
    icon: '🎯',
    rarity: 'rare',
    category: 'nutrition',
    requirement: 30,
    checkProgress: () => {
      const targets = useMacroStore.getState().targets
      if (!targets) return 0
      return useMacroStore.getState().dailyLogs.filter(
        log => Math.abs(log.protein - targets.protein) <= 10
      ).length
    }
  },
  {
    id: 'perfect-7',
    name: 'Zero Bugs',
    description: 'Achieve 7 perfect macro days',
    icon: '⭐',
    rarity: 'rare',
    category: 'nutrition',
    requirement: 7,
    checkProgress: () => {
      const targets = useMacroStore.getState().targets
      if (!targets) return 0
      return useMacroStore.getState().dailyLogs.filter(log => {
        const proteinHit = Math.abs(log.protein - targets.protein) <= 10
        const caloriesHit = Math.abs(log.calories - targets.calories) <= 100
        return proteinHit && caloriesHit
      }).length
    }
  },
  {
    id: 'perfect-30',
    name: 'Clean Architecture',
    description: 'Achieve 30 perfect macro days',
    icon: '🌟',
    rarity: 'epic',
    category: 'nutrition',
    requirement: 30,
    checkProgress: () => {
      const targets = useMacroStore.getState().targets
      if (!targets) return 0
      return useMacroStore.getState().dailyLogs.filter(log => {
        const proteinHit = Math.abs(log.protein - targets.protein) <= 10
        const caloriesHit = Math.abs(log.calories - targets.calories) <= 100
        return proteinHit && caloriesHit
      }).length
    }
  },

  // Level badges
  {
    id: 'level-5',
    name: 'v0.5 Released',
    description: 'Reach level 5',
    icon: '⬆️',
    rarity: 'common',
    category: 'level',
    requirement: 5,
    checkProgress: () => useXPStore.getState().currentLevel
  },
  {
    id: 'level-10',
    name: 'v1.0 Stable',
    description: 'Reach level 10',
    icon: '🌟',
    rarity: 'rare',
    category: 'level',
    requirement: 10,
    checkProgress: () => useXPStore.getState().currentLevel
  },
  {
    id: 'level-25',
    name: 'Senior Dev',
    description: 'Reach level 25',
    icon: '💎',
    rarity: 'epic',
    category: 'level',
    requirement: 25,
    checkProgress: () => useXPStore.getState().currentLevel
  },
  {
    id: 'level-50',
    name: '10x Engineer',
    description: 'Reach level 50',
    icon: '👑',
    rarity: 'legendary',
    category: 'level',
    requirement: 50,
    checkProgress: () => useXPStore.getState().currentLevel
  },

  // Special badges
  {
    id: 'first-workout',
    name: 'Hello World',
    description: 'Complete your first workout',
    icon: '🎉',
    rarity: 'common',
    category: 'special',
    requirement: 1,
    checkProgress: () => useWorkoutStore.getState().workoutLogs.filter(w => w.completed).length
  },
  {
    id: 'first-checkin',
    name: 'Init',
    description: 'Complete your first check-in',
    icon: '✨',
    rarity: 'common',
    category: 'special',
    requirement: 1,
    checkProgress: () => useXPStore.getState().dailyLogs.filter(l => l.checkIn).length
  }
]

const BADGES = createBadges()

const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: 'border-gray-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500'
}

export const useAchievementsStore = create<AchievementsStore>()(
  persist(
    (set, get) => ({
      earnedBadges: [],
      lastChecked: null,

      checkAndAwardBadges: () => {
        const { earnedBadges } = get()
        const earnedIds = new Set(earnedBadges.map(b => b.badgeId))
        const newlyEarned: string[] = []

        BADGES.forEach(badge => {
          if (earnedIds.has(badge.id)) return

          const progress = badge.checkProgress()
          if (progress >= badge.requirement) {
            newlyEarned.push(badge.id)
          }
        })

        if (newlyEarned.length > 0) {
          set((state) => ({
            earnedBadges: [
              ...state.earnedBadges,
              ...newlyEarned.map(id => ({ badgeId: id, earnedAt: Date.now() }))
            ],
            lastChecked: Date.now()
          }))
        } else {
          set({ lastChecked: Date.now() })
        }

        return newlyEarned
      },

      getBadgeProgress: (badgeId: string) => {
        const badge = BADGES.find(b => b.id === badgeId)
        if (!badge) return { current: 0, required: 0, percentage: 0 }

        const current = badge.checkProgress()
        return {
          current,
          required: badge.requirement,
          percentage: Math.min((current / badge.requirement) * 100, 100)
        }
      },

      hasEarnedBadge: (badgeId: string) => {
        return get().earnedBadges.some(b => b.badgeId === badgeId)
      },

      getEarnedBadges: () => {
        const { earnedBadges } = get()
        return earnedBadges
          .map(eb => {
            const badge = BADGES.find(b => b.id === eb.badgeId)
            if (!badge) return null
            return { ...badge, earnedAt: eb.earnedAt }
          })
          .filter((b): b is Badge & { earnedAt: number } => b !== null)
          .sort((a, b) => b.earnedAt - a.earnedAt)
      },

      getAvailableBadges: () => {
        const earnedIds = new Set(get().earnedBadges.map(b => b.badgeId))
        return BADGES.filter(b => !earnedIds.has(b.id))
      },

      getAllBadges: () => BADGES
    }),
    {
      name: 'gamify-gains-achievements'
    }
  )
)

export { RARITY_COLORS }
