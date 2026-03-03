import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLocalDateString, getLocalDaysDifference } from '../lib/dateUtils'
import { useUserStore } from './userStore'
import { ARCHETYPE_MODIFIERS } from '@/design/constants'

// Lazy import to avoid circular dep — App.tsx exports this after mount
function getGlobalShowDPToast() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).__dpToastFn as ((amount: number, action: string) => void) | undefined
  } catch {
    return undefined
  }
}

export type DPAction = 'training' | 'meal' | 'protein' | 'steps' | 'sleep'

export const DP_VALUES: Record<DPAction, number> = {
  training: 50,
  meal: 15,
  protein: 25,
  steps: 10,
  sleep: 10,
}

// Master spec rank table — ~24-27 weeks to Master rank at consistent daily activity
export const RANKS = [
  { rank: 0, name: 'Uninitiated', threshold: 0 },
  { rank: 1, name: 'Initiate', threshold: 250 },
  { rank: 2, name: 'Compliant', threshold: 750 },
  { rank: 3, name: 'Obedient', threshold: 1500 },
  { rank: 4, name: 'Disciplined', threshold: 2250 },
  { rank: 5, name: 'Conditioned', threshold: 3000 },
  { rank: 6, name: 'Proven', threshold: 3750 },
  { rank: 7, name: 'Hardened', threshold: 4750 },
  { rank: 8, name: 'Forged', threshold: 5750 },
  { rank: 9, name: 'Trusted', threshold: 6750 },
  { rank: 10, name: 'Enforcer', threshold: 7750 },
  { rank: 11, name: 'Seasoned', threshold: 9000 },
  { rank: 12, name: 'Elite', threshold: 10250 },
  { rank: 13, name: 'Apex', threshold: 11500 },
  { rank: 14, name: 'Sovereign', threshold: 13000 },
  { rank: 15, name: 'Master', threshold: 14750 },
]

const MEAL_CAP_PER_DAY = 3

export interface DailyDP {
  date: string
  training: number   // count of training awards today
  meals: number      // count of meal awards today (cap at 3)
  protein: number    // count of protein awards today
  steps: number      // count of steps awards today
  sleep: number      // count of sleep awards today
  total: number      // total DP earned today
}

interface DPStore {
  totalDP: number
  currentRank: number
  obedienceStreak: number
  longestObedienceStreak: number
  lastActionDate: string | null
  lastCelebratedRank: number
  dailyLogs: DailyDP[]

  awardDP: (action: DPAction) => { dpAwarded: number; rankedUp: boolean; newRank: number }
  getRankInfo: () => { name: string; rank: number; dpForNext: number; progress: number }
  checkObedienceStreak: () => void
  getTodayLog: () => DailyDP | null
  resetDP: () => void
}

/** Calculate rank from totalDP using the rank threshold table */
function calculateRank(totalDP: number): number {
  let rank = 1
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalDP >= RANKS[i].threshold) {
      rank = RANKS[i].rank
      break
    }
  }
  return rank
}

const INITIAL_STATE = {
  totalDP: 0,
  currentRank: 0,
  obedienceStreak: 0,
  longestObedienceStreak: 0,
  lastActionDate: null as string | null,
  lastCelebratedRank: 0,
  dailyLogs: [] as DailyDP[],
}

export const useDPStore = create<DPStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      awardDP: (action: DPAction) => {
        const state = get()
        const today = getLocalDateString()

        // Get archetype and apply modifier
        const archetype = useUserStore.getState().profile?.archetype || 'bro'
        const baseDP = DP_VALUES[action]
        const modifier = ARCHETYPE_MODIFIERS[archetype]?.[action] || 1
        const dpValue = Math.round(baseDP * modifier)

        // Find or create today's log
        let todayLog = state.dailyLogs.find(log => log.date === today)
        if (!todayLog) {
          todayLog = { date: today, training: 0, meals: 0, protein: 0, steps: 0, sleep: 0, total: 0 }
        }

        // Check meal cap (enforced before modifier - cap is on count, not DP)
        if (action === 'meal' && todayLog.meals >= MEAL_CAP_PER_DAY) {
          return { dpAwarded: 0, rankedUp: false, newRank: state.currentRank }
        }

        // Calculate new totalDP with modified DP value
        const newTotalDP = state.totalDP + dpValue
        const oldRank = state.currentRank
        const newRank = calculateRank(newTotalDP)
        const rankedUp = newRank > oldRank

        // Update daily log
        const actionKey = action === 'meal' ? 'meals' : action
        const updatedLog: DailyDP = {
          ...todayLog,
          [actionKey]: todayLog[actionKey] + 1,
          total: todayLog.total + dpValue,
        }

        // Update daily logs array
        const existingIndex = state.dailyLogs.findIndex(log => log.date === today)
        const newDailyLogs = existingIndex >= 0
          ? state.dailyLogs.map((log, i) => i === existingIndex ? updatedLog : log)
          : [...state.dailyLogs, updatedLog]

        // Update obedience streak
        let newStreak = state.obedienceStreak
        let newLongestStreak = state.longestObedienceStreak
        const lastActionDate = state.lastActionDate

        if (lastActionDate !== today) {
          // New day action
          if (!lastActionDate) {
            // First ever action
            newStreak = 1
          } else {
            const daysDiff = getLocalDaysDifference(lastActionDate, today)
            if (daysDiff === 1) {
              // Consecutive day
              newStreak = state.obedienceStreak + 1
            } else {
              // Gap > 1 day
              newStreak = 1
            }
          }
          newLongestStreak = Math.max(newLongestStreak, newStreak)
        }
        // If same day, streak doesn't change

        set({
          totalDP: newTotalDP,
          currentRank: newRank,
          lastCelebratedRank: rankedUp ? newRank : state.lastCelebratedRank,
          dailyLogs: newDailyLogs,
          lastActionDate: today,
          obedienceStreak: newStreak,
          longestObedienceStreak: newLongestStreak,
        })

        // Fire DP toast notification
        try {
          getGlobalShowDPToast()?.(dpValue, action)
        } catch { /* non-critical */ }

        return { dpAwarded: dpValue, rankedUp, newRank }
      },

      getRankInfo: () => {
        const { totalDP, currentRank } = get()
        const currentRankEntry = RANKS.find(r => r.rank === currentRank)
        const nextRankEntry = RANKS.find(r => r.rank === currentRank + 1)

        const name = currentRankEntry?.name || 'Unknown'

        if (!nextRankEntry) {
          // At max rank
          return { name, rank: currentRank, dpForNext: 0, progress: 1 }
        }

        const currentThreshold = currentRankEntry?.threshold || 0
        const nextThreshold = nextRankEntry.threshold
        const dpForNext = nextThreshold - totalDP
        const rangeTotal = nextThreshold - currentThreshold
        const progress = rangeTotal > 0 ? (totalDP - currentThreshold) / rangeTotal : 0

        return { name, rank: currentRank, dpForNext, progress }
      },

      checkObedienceStreak: () => {
        const state = get()
        const today = getLocalDateString()
        const lastActionDate = state.lastActionDate

        if (lastActionDate === today) return // Already counted today

        let newStreak: number
        if (!lastActionDate) {
          newStreak = 1
        } else {
          const daysDiff = getLocalDaysDifference(lastActionDate, today)
          if (daysDiff === 1) {
            newStreak = state.obedienceStreak + 1
          } else {
            newStreak = 1
          }
        }

        set({
          obedienceStreak: newStreak,
          longestObedienceStreak: Math.max(state.longestObedienceStreak, newStreak),
          lastActionDate: today,
        })
      },

      getTodayLog: () => {
        const today = getLocalDateString()
        return get().dailyLogs.find(log => log.date === today) || null
      },

      resetDP: () => {
        set({ ...INITIAL_STATE, dailyLogs: [] })
      },
    }),
    {
      name: 'trained-dp',
    }
  )
)
