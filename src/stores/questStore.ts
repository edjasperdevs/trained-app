/**
 * Quest Store
 *
 * Manages quest state: rotation, completion tracking, and bonus DP awards.
 * Quests rotate daily (3) and weekly (2, premium only).
 * Completing a quest awards bonus DP once per period.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLocalDateString, getLocalWeekString } from '../lib/dateUtils'
import { useUserStore } from './userStore'
import { useSubscriptionStore } from './subscriptionStore'
import { useDPStore } from './dpStore'
import {
  type QuestDefinition,
  DAILY_QUESTS,
  WEEKLY_QUESTS,
} from '../lib/questCatalog'

export interface CompletedQuest {
  questId: string
  period: string // date string for daily, week string for weekly
  dpAwarded: number
  completedAt: string // ISO timestamp
}

interface QuestStore {
  completedQuests: CompletedQuest[]

  // Actions
  getActiveQuests: () => QuestDefinition[]
  checkAndCompleteQuests: () => void
  isQuestCompleted: (questId: string, period: string) => boolean
  getCompletedToday: () => string[]
  getCompletedThisWeek: () => string[]
  resetQuests: () => void
}

/**
 * Seeded shuffle for deterministic quest rotation.
 * Same seed = same shuffle order.
 */
function seededShuffle<T>(array: T[], seed: string): T[] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash
  }

  const result = [...array]
  let m = result.length
  while (m) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff
    const i = hash % m--
    ;[result[m], result[i]] = [result[i], result[m]]
  }
  return result
}

const INITIAL_STATE = {
  completedQuests: [] as CompletedQuest[],
}

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      /**
       * Get today's active quests.
       * Returns 3 daily + 2 weekly (if premium) quests for the current user.
       */
      getActiveQuests: () => {
        const userId = useUserStore.getState().profile?.username || 'anonymous'
        const date = getLocalDateString()
        const isPremium = useSubscriptionStore.getState().isPremium

        const quests: QuestDefinition[] = []

        // Daily quests: seed with date + userId, pick first 3
        const dailySeed = `${date}-${userId}`
        const shuffledDaily = seededShuffle(DAILY_QUESTS, dailySeed)
        quests.push(...shuffledDaily.slice(0, 3))

        // Weekly quests: seed with week string + userId, pick first 2 (premium only)
        if (isPremium) {
          const weekString = getLocalWeekString()
          const weeklySeed = `${weekString}-${userId}`
          const shuffledWeekly = seededShuffle(WEEKLY_QUESTS, weeklySeed)
          quests.push(...shuffledWeekly.slice(0, 2))
        }

        return quests
      },

      /**
       * Check all active quests and award DP for newly completed ones.
       * Should be called when user completes actions that may fulfill quest conditions.
       */
      checkAndCompleteQuests: () => {
        const state = get()
        const activeQuests = state.getActiveQuests()
        const today = getLocalDateString()
        const weekString = getLocalWeekString()
        const now = new Date().toISOString()

        const newCompletions: CompletedQuest[] = []

        for (const quest of activeQuests) {
          // Determine the period for this quest
          const period = quest.type === 'daily' ? today : weekString

          // Check if already completed for this period
          if (state.isQuestCompleted(quest.id, period)) {
            continue
          }

          // Evaluate the quest condition
          if (quest.evaluate()) {
            // Quest newly completed - award bonus DP
            // Direct add to totalDP (not through awardDP to avoid archetype modifiers on quest bonuses)
            const dpStore = useDPStore.getState()
            const newTotalDP = dpStore.totalDP + quest.dpReward

            // Update totalDP directly (bypass awardDP to skip modifiers)
            useDPStore.setState({ totalDP: newTotalDP })

            // Track completion
            newCompletions.push({
              questId: quest.id,
              period,
              dpAwarded: quest.dpReward,
              completedAt: now,
            })

            if (import.meta.env.DEV) {
              console.log(`[Quest] Completed: ${quest.title} (+${quest.dpReward} DP)`)
            }
          }
        }

        if (newCompletions.length > 0) {
          set((s) => ({
            completedQuests: [...s.completedQuests, ...newCompletions],
          }))
        }
      },

      /**
       * Check if a quest has been completed for a specific period.
       */
      isQuestCompleted: (questId: string, period: string) => {
        return get().completedQuests.some(
          (c) => c.questId === questId && c.period === period
        )
      },

      /**
       * Get IDs of quests completed today (daily quests).
       */
      getCompletedToday: () => {
        const today = getLocalDateString()
        return get()
          .completedQuests.filter((c) => c.period === today)
          .map((c) => c.questId)
      },

      /**
       * Get IDs of quests completed this week (weekly quests).
       */
      getCompletedThisWeek: () => {
        const weekString = getLocalWeekString()
        return get()
          .completedQuests.filter((c) => c.period === weekString)
          .map((c) => c.questId)
      },

      /**
       * Reset all quest state.
       */
      resetQuests: () => {
        set({ ...INITIAL_STATE, completedQuests: [] })
      },
    }),
    {
      name: 'trained-quests',
    }
  )
)
