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
  | 'locked'           // +15 DP/day for daily compliance
  | 'locked_milestone' // milestone bonus (50-750 DP)

export const DP_VALUES: Record<DPAction, number> = {
  training: 50,
  meal: 15,
  protein: 25,
  steps: 10,
  sleep: 10,
  locked: 15,           // daily compliance bonus
  locked_milestone: 0,  // variable, handled separately
}

// Locked Protocol milestone DP values
const LOCKED_MILESTONE_DP: Record<number, number> = {
  7: 50,
  14: 100,
  21: 150,
  30: 250,
  60: 500,
  90: 750,
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
  // Share gating state
  lastShareWorkoutDate: string | null
  lastShareComplianceDate: string | null
  lastRankUpShareClaimed: string | null
  // Referral DP tracking
  referralDPAwarded: string[] // recruit IDs that have already triggered DP award
  // Locked Protocol share gating
  lastLockedStartShareProtocolId: string | null // protocol ID that was shared
  lastLockedMilestoneShareMilestones: number[] // milestone days that were shared

  awardDP: (action: DPAction) => { dpAwarded: number; rankedUp: boolean; newRank: number }
  getRankInfo: () => { name: string; rank: number; dpForNext: number; progress: number }
  checkObedienceStreak: () => void
  getTodayLog: () => DailyDP | null
  resetDP: () => void
  // Share DP actions
  awardShareWorkoutDP: () => void
  awardShareComplianceDP: () => void
  awardShareRankUpDP: (rankName: string) => void
  // Referral DP action
  awardReferralDP: (recruitId: string) => { dpAwarded: number; rankedUp: boolean; newRank: number }
  // Locked Protocol DP actions (bypass daily cap)
  awardLockedDP: () => { dpAwarded: number; rankedUp: boolean; newRank: number }
  awardLockedMilestoneDP: (milestone: number) => { dpAwarded: number; rankedUp: boolean; newRank: number }
  // Locked Protocol share DP actions
  awardLockedStartShareDP: (protocolId: string) => void
  awardLockedMilestoneShareDP: (milestone: number) => void
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
  // Share gating state
  lastShareWorkoutDate: null as string | null,
  lastShareComplianceDate: null as string | null,
  lastRankUpShareClaimed: null as string | null,
  // Referral DP tracking
  referralDPAwarded: [] as string[],
  // Locked Protocol share gating
  lastLockedStartShareProtocolId: null as string | null,
  lastLockedMilestoneShareMilestones: [] as number[],
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

        // Update daily log (only for standard trackable actions)
        type TrackableAction = 'training' | 'meal' | 'protein' | 'steps' | 'sleep'
        const trackableActions: TrackableAction[] = ['training', 'meal', 'protein', 'steps', 'sleep']
        const isTrackable = trackableActions.includes(action as TrackableAction)

        let newDailyLogs = state.dailyLogs
        if (isTrackable) {
          const actionKey = action === 'meal' ? 'meals' : (action as keyof Omit<DailyDP, 'date' | 'total' | 'meals'>)
          const updatedLog: DailyDP = {
            ...todayLog,
            [actionKey]: todayLog[actionKey] + 1,
            total: todayLog.total + dpValue,
          }

          // Update daily logs array
          const existingIndex = state.dailyLogs.findIndex(log => log.date === today)
          newDailyLogs = existingIndex >= 0
            ? state.dailyLogs.map((log, i) => i === existingIndex ? updatedLog : log)
            : [...state.dailyLogs, updatedLog]
        }

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
        set({ ...INITIAL_STATE, dailyLogs: [], referralDPAwarded: [], lastLockedMilestoneShareMilestones: [] })
      },

      awardShareWorkoutDP: () => {
        const today = getLocalDateString()
        const { lastShareWorkoutDate } = get()
        if (lastShareWorkoutDate === today) return // already claimed today

        const newTotalDP = get().totalDP + 5
        const oldRank = get().currentRank
        const newRank = calculateRank(newTotalDP)

        set({
          totalDP: newTotalDP,
          currentRank: newRank,
          lastCelebratedRank: newRank > oldRank ? newRank : get().lastCelebratedRank,
          lastShareWorkoutDate: today,
        })

        // Fire DP toast
        try {
          getGlobalShowDPToast()?.(5, 'share_workout')
        } catch { /* non-critical */ }
      },

      awardShareComplianceDP: () => {
        const today = getLocalDateString()
        const { lastShareComplianceDate } = get()
        if (lastShareComplianceDate === today) return // already claimed today

        const newTotalDP = get().totalDP + 5
        const oldRank = get().currentRank
        const newRank = calculateRank(newTotalDP)

        set({
          totalDP: newTotalDP,
          currentRank: newRank,
          lastCelebratedRank: newRank > oldRank ? newRank : get().lastCelebratedRank,
          lastShareComplianceDate: today,
        })

        // Fire DP toast
        try {
          getGlobalShowDPToast()?.(5, 'share_compliance')
        } catch { /* non-critical */ }
      },

      awardShareRankUpDP: (rankName: string) => {
        const { lastRankUpShareClaimed } = get()
        if (lastRankUpShareClaimed === rankName) return // already claimed for this rank

        const newTotalDP = get().totalDP + 10
        const oldRank = get().currentRank
        const newRank = calculateRank(newTotalDP)

        set({
          totalDP: newTotalDP,
          currentRank: newRank,
          lastCelebratedRank: newRank > oldRank ? newRank : get().lastCelebratedRank,
          lastRankUpShareClaimed: rankName,
        })

        // Fire DP toast
        try {
          getGlobalShowDPToast()?.(10, 'share_rankup')
        } catch { /* non-critical */ }
      },

      awardReferralDP: (recruitId: string) => {
        const state = get()

        // Prevent duplicate awards for same recruit
        if (state.referralDPAwarded.includes(recruitId)) {
          return { dpAwarded: 0, rankedUp: false, newRank: state.currentRank }
        }

        const dpValue = 100 // Fixed reward for recruit completion
        const newTotalDP = state.totalDP + dpValue
        const oldRank = state.currentRank
        const newRank = calculateRank(newTotalDP)
        const rankedUp = newRank > oldRank

        set({
          totalDP: newTotalDP,
          currentRank: newRank,
          lastCelebratedRank: rankedUp ? newRank : state.lastCelebratedRank,
          referralDPAwarded: [...state.referralDPAwarded, recruitId],
        })

        // Fire DP toast notification
        try {
          getGlobalShowDPToast()?.(dpValue, 'referral')
        } catch { /* non-critical */ }

        return { dpAwarded: dpValue, rankedUp, newRank }
      },

      awardLockedDP: () => {
        const state = get()
        const dpValue = 15 // Fixed daily bonus, no archetype modifier
        const newTotalDP = state.totalDP + dpValue
        const oldRank = state.currentRank
        const newRank = calculateRank(newTotalDP)
        const rankedUp = newRank > oldRank

        set({
          totalDP: newTotalDP,
          currentRank: newRank,
          lastCelebratedRank: rankedUp ? newRank : state.lastCelebratedRank,
        })

        // Fire DP toast notification
        try {
          getGlobalShowDPToast()?.(dpValue, 'locked')
        } catch { /* non-critical */ }

        return { dpAwarded: dpValue, rankedUp, newRank }
      },

      awardLockedMilestoneDP: (milestone: number) => {
        const state = get()
        const dpValue = LOCKED_MILESTONE_DP[milestone] || 0
        if (dpValue === 0) {
          return { dpAwarded: 0, rankedUp: false, newRank: state.currentRank }
        }

        const newTotalDP = state.totalDP + dpValue
        const oldRank = state.currentRank
        const newRank = calculateRank(newTotalDP)
        const rankedUp = newRank > oldRank

        set({
          totalDP: newTotalDP,
          currentRank: newRank,
          lastCelebratedRank: rankedUp ? newRank : state.lastCelebratedRank,
        })

        // Fire DP toast notification
        try {
          getGlobalShowDPToast()?.(dpValue, 'locked_milestone')
        } catch { /* non-critical */ }

        return { dpAwarded: dpValue, rankedUp, newRank }
      },

      awardLockedStartShareDP: (protocolId: string) => {
        const { lastLockedStartShareProtocolId } = get()
        if (lastLockedStartShareProtocolId === protocolId) return // already shared this protocol

        const newTotalDP = get().totalDP + 10
        const oldRank = get().currentRank
        const newRank = calculateRank(newTotalDP)

        set({
          totalDP: newTotalDP,
          currentRank: newRank,
          lastCelebratedRank: newRank > oldRank ? newRank : get().lastCelebratedRank,
          lastLockedStartShareProtocolId: protocolId,
        })

        // Fire DP toast
        try {
          getGlobalShowDPToast()?.(10, 'share_locked_start')
        } catch { /* non-critical */ }
      },

      awardLockedMilestoneShareDP: (milestone: number) => {
        const { lastLockedMilestoneShareMilestones } = get()
        if (lastLockedMilestoneShareMilestones.includes(milestone)) return // already shared this milestone

        const newTotalDP = get().totalDP + 10
        const oldRank = get().currentRank
        const newRank = calculateRank(newTotalDP)

        set({
          totalDP: newTotalDP,
          currentRank: newRank,
          lastCelebratedRank: newRank > oldRank ? newRank : get().lastCelebratedRank,
          lastLockedMilestoneShareMilestones: [...lastLockedMilestoneShareMilestones, milestone],
        })

        // Fire DP toast
        try {
          getGlobalShowDPToast()?.(10, 'share_locked_milestone')
        } catch { /* non-critical */ }
      },
    }),
    {
      name: 'trained-dp',
      onRehydrateStorage: () => (state) => {
        // Recalculate currentRank from totalDP after hydration to fix any stale rank values
        if (state) {
          const correctRank = calculateRank(state.totalDP)
          if (state.currentRank !== correctRank) {
            // Use setTimeout to defer the update until after hydration completes
            setTimeout(() => {
              useDPStore.setState({ currentRank: correctRank })
            }, 0)
          }
        }
      },
    }
  )
)
