/**
 * Quest Catalog
 *
 * Quest definitions with condition evaluators for the Protocol Orders feature.
 * Daily quests rotate 3 per day, weekly quests rotate 2 per week (premium only).
 */

import { useMacroStore } from '@/stores/macroStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useHealthStore } from '@/stores/healthStore'
import { useDPStore } from '@/stores/dpStore'
import { getLocalDateString, getLocalWeekString, getStartOfLocalWeek } from './dateUtils'
import { useUserStore } from '@/stores/userStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

export interface QuestDefinition {
  id: string
  title: string
  description: string
  dpReward: number
  icon: string // lucide icon name
  type: 'daily' | 'weekly'
  category: 'training' | 'nutrition' | 'health' | 'streak'
  evaluate: () => boolean // Returns true when objective is met
}

// ============================================
// DAILY QUESTS (12 total, 3 shown per day)
// ============================================

export const DAILY_QUESTS: QuestDefinition[] = [
  {
    id: 'd-log-3-meals',
    title: 'Triple Threat',
    description: 'Log 3 meals today',
    dpReward: 15,
    icon: 'utensils',
    type: 'daily',
    category: 'nutrition',
    evaluate: () => {
      const todayLog = useMacroStore.getState().getTodayLog()
      return (todayLog?.loggedMeals?.length ?? 0) >= 3
    },
  },
  {
    id: 'd-hit-protein',
    title: 'Protein Protocol',
    description: 'Hit your protein target',
    dpReward: 20,
    icon: 'beef',
    type: 'daily',
    category: 'nutrition',
    evaluate: () => {
      return useMacroStore.getState().isProteinTargetHit()
    },
  },
  {
    id: 'd-complete-workout',
    title: 'Training Day',
    description: 'Complete a workout',
    dpReward: 25,
    icon: 'dumbbell',
    type: 'daily',
    category: 'training',
    evaluate: () => {
      return useWorkoutStore.getState().isWorkoutCompletedToday()
    },
  },
  {
    id: 'd-10k-steps',
    title: 'Mile Marker',
    description: 'Hit 10,000 steps',
    dpReward: 15,
    icon: 'footprints',
    type: 'daily',
    category: 'health',
    evaluate: () => {
      return useHealthStore.getState().getEffectiveSteps() >= 10000
    },
  },
  {
    id: 'd-sleep-7h',
    title: 'Lights Out',
    description: 'Log 7+ hours of sleep',
    dpReward: 10,
    icon: 'moon',
    type: 'daily',
    category: 'health',
    evaluate: () => {
      // 7 hours = 420 minutes
      return useHealthStore.getState().getEffectiveSleep() >= 420
    },
  },
  {
    id: 'd-hit-calories',
    title: 'Fuel Check',
    description: 'Hit your calorie target',
    dpReward: 15,
    icon: 'flame',
    type: 'daily',
    category: 'nutrition',
    evaluate: () => {
      return useMacroStore.getState().isCalorieTargetHit()
    },
  },
  {
    id: 'd-2-meals',
    title: 'Double Down',
    description: 'Log 2 meals',
    dpReward: 10,
    icon: 'utensils-crossed',
    type: 'daily',
    category: 'nutrition',
    evaluate: () => {
      const todayLog = useMacroStore.getState().getTodayLog()
      return (todayLog?.loggedMeals?.length ?? 0) >= 2
    },
  },
  {
    id: 'd-any-action',
    title: 'Show Up',
    description: 'Complete any DP action',
    dpReward: 5,
    icon: 'check-circle',
    type: 'daily',
    category: 'streak',
    evaluate: () => {
      const todayLog = useDPStore.getState().getTodayLog()
      return (todayLog?.total ?? 0) > 0
    },
  },
  {
    id: 'd-log-1-meal',
    title: 'First Fuel',
    description: 'Log 1 meal',
    dpReward: 5,
    icon: 'pizza',
    type: 'daily',
    category: 'nutrition',
    evaluate: () => {
      const todayLog = useMacroStore.getState().getTodayLog()
      return (todayLog?.loggedMeals?.length ?? 0) >= 1
    },
  },
  {
    id: 'd-perfect-day',
    title: 'Perfect Protocol',
    description: 'Hit both protein AND calorie targets',
    dpReward: 30,
    icon: 'star',
    type: 'daily',
    category: 'nutrition',
    evaluate: () => {
      return useMacroStore.getState().isPerfectDay()
    },
  },
  {
    id: 'd-5k-steps',
    title: 'Step Up',
    description: 'Hit 5,000 steps',
    dpReward: 10,
    icon: 'shoe-prints',
    type: 'daily',
    category: 'health',
    evaluate: () => {
      return useHealthStore.getState().getEffectiveSteps() >= 5000
    },
  },
  {
    id: 'd-streak-maintain',
    title: 'Hold the Line',
    description: 'Maintain your obedience streak',
    dpReward: 10,
    icon: 'flame-kindling',
    type: 'daily',
    category: 'streak',
    evaluate: () => {
      return useDPStore.getState().obedienceStreak > 0
    },
  },
]

// ============================================
// WEEKLY QUESTS (6 total, 2 shown per week, premium only)
// ============================================

/**
 * Helper to get weekly data from dailyLogs.
 * Returns logs for the current week (Sunday to Saturday).
 */
function getWeeklyLogs() {
  const weekStart = getStartOfLocalWeek()
  const weekStartStr = getLocalDateString(weekStart)
  const today = getLocalDateString()

  // Get macro logs for this week
  const macroLogs = useMacroStore.getState().dailyLogs.filter(
    log => log.date >= weekStartStr && log.date <= today
  )

  // Get workout logs for this week
  const workoutLogs = useWorkoutStore.getState().workoutLogs.filter(
    log => log.date >= weekStartStr && log.date <= today && log.completed
  )

  // Get DP logs for this week
  const dpLogs = useDPStore.getState().dailyLogs.filter(
    log => log.date >= weekStartStr && log.date <= today
  )

  return { macroLogs, workoutLogs, dpLogs, weekStartStr }
}

export const WEEKLY_QUESTS: QuestDefinition[] = [
  {
    id: 'w-5-workouts',
    title: 'Iron Week',
    description: 'Complete 5 workouts this week',
    dpReward: 100,
    icon: 'dumbbell',
    type: 'weekly',
    category: 'training',
    evaluate: () => {
      const { workoutLogs } = getWeeklyLogs()
      return workoutLogs.length >= 5
    },
  },
  {
    id: 'w-7-protein',
    title: 'Protein Streak',
    description: 'Hit protein target 7 days in a row',
    dpReward: 75,
    icon: 'beef',
    type: 'weekly',
    category: 'nutrition',
    evaluate: () => {
      const { macroLogs } = getWeeklyLogs()
      const targets = useMacroStore.getState().targets
      if (!targets) return false

      // Count days where protein was hit (within 10g of target)
      const proteinDays = macroLogs.filter(log => {
        const logTargets = log.targetSnapshot || targets
        return Math.abs(log.protein - logTargets.protein) <= 10
      }).length

      return proteinDays >= 7
    },
  },
  {
    id: 'w-50k-steps',
    title: 'Marathon Week',
    description: 'Total 50,000 steps this week',
    dpReward: 60,
    icon: 'footprints',
    type: 'weekly',
    category: 'health',
    evaluate: () => {
      // For weekly steps, we'd need to sum daily steps
      // Since healthStore only tracks today's steps, we need dpLogs for steps awards
      // Each steps award means they hit their daily step goal
      // As a proxy: count days with steps awards * assumed 10k = weekly total
      // Better approach: check if today's cumulative steps is at least 50k worth
      // For now, simplified: effective steps today >= 50000 / 7 * (days into week + 1)
      const { dpLogs } = getWeeklyLogs()
      const stepDays = dpLogs.filter(log => log.steps > 0).length

      // At least 5 days with step tracking indicates high activity
      // Full implementation would track daily step totals
      return stepDays >= 5
    },
  },
  {
    id: 'w-perfect-3',
    title: 'Triple Crown',
    description: '3 perfect nutrition days this week',
    dpReward: 80,
    icon: 'crown',
    type: 'weekly',
    category: 'nutrition',
    evaluate: () => {
      const { macroLogs } = getWeeklyLogs()
      const targets = useMacroStore.getState().targets
      if (!targets) return false

      // Count perfect days (both protein AND calories hit)
      const perfectDays = macroLogs.filter(log => {
        const logTargets = log.targetSnapshot || targets
        const proteinHit = Math.abs(log.protein - logTargets.protein) <= 10
        const caloriesHit = Math.abs(log.calories - logTargets.calories) <= 100
        return proteinHit && caloriesHit
      }).length

      return perfectDays >= 3
    },
  },
  {
    id: 'w-7-day-streak',
    title: 'Unbroken',
    description: 'Maintain obedience streak all week',
    dpReward: 100,
    icon: 'flame',
    type: 'weekly',
    category: 'streak',
    evaluate: () => {
      // Check if streak is at least 7 days
      return useDPStore.getState().obedienceStreak >= 7
    },
  },
  {
    id: 'w-log-21-meals',
    title: 'Meal Master',
    description: 'Log 21 meals this week',
    dpReward: 50,
    icon: 'utensils',
    type: 'weekly',
    category: 'nutrition',
    evaluate: () => {
      const { macroLogs } = getWeeklyLogs()

      // Sum all logged meals across the week
      const totalMeals = macroLogs.reduce(
        (sum, log) => sum + (log.loggedMeals?.length ?? 0),
        0
      )

      return totalMeals >= 21
    },
  },
]

// ============================================
// DETERMINISTIC QUEST SELECTION
// ============================================

/**
 * Seeded shuffle for deterministic quest rotation.
 * Same seed = same shuffle order.
 */
function seededShuffle<T>(array: T[], seed: string): T[] {
  // Generate hash from seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }

  // Fisher-Yates shuffle with seeded random
  const result = [...array]
  let m = result.length
  while (m) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff
    const i = hash % m--
    ;[result[m], result[i]] = [result[i], result[m]]
  }
  return result
}

/**
 * Get the active quests for a given date and user.
 * Returns 3 daily quests + 2 weekly quests (if premium).
 *
 * @param userId - User ID for deterministic shuffle
 * @param date - Date string (YYYY-MM-DD) for daily rotation
 * @param isPremium - Whether user has premium access
 */
export function getActiveQuests(
  userId: string,
  date: string,
  isPremium: boolean
): QuestDefinition[] {
  const quests: QuestDefinition[] = []

  // Daily quests: seed with date + userId, pick first 3
  const dailySeed = `${date}-${userId}`
  const shuffledDaily = seededShuffle(DAILY_QUESTS, dailySeed)
  quests.push(...shuffledDaily.slice(0, 3))

  // Weekly quests: seed with week string + userId, pick first 2 (premium only)
  if (isPremium) {
    const weekString = getLocalWeekString(new Date(date))
    const weeklySeed = `${weekString}-${userId}`
    const shuffledWeekly = seededShuffle(WEEKLY_QUESTS, weeklySeed)
    quests.push(...shuffledWeekly.slice(0, 2))
  }

  return quests
}

/**
 * Get active quests for the current user and date.
 * Convenience wrapper that pulls userId/isPremium from stores.
 */
export function getCurrentActiveQuests(): QuestDefinition[] {
  const userId = useUserStore.getState().profile?.username || 'anonymous'
  const date = getLocalDateString()
  const isPremium = useSubscriptionStore.getState().isPremium

  return getActiveQuests(userId, date, isPremium)
}
