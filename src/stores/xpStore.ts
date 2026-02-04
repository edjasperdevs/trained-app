import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLocalDateString, getLocalWeekString, isLocalSunday, getDaysSince } from '../lib/dateUtils'

export interface WeeklyHistory {
  weekOf: string
  xpEarned: number
  levelReached: number
}

export interface DailyXP {
  date: string
  workout: boolean
  protein: boolean
  calories: boolean
  checkIn: boolean
  perfectDay: boolean
  streakBonus: number
  total: number
  claimed: boolean
}

interface XPStore {
  totalXP: number
  currentLevel: number
  pendingXP: number
  weeklyHistory: WeeklyHistory[]
  dailyLogs: DailyXP[]
  lastClaimDate: string | null

  // XP Values
  XP_VALUES: {
    WORKOUT: number
    PROTEIN: number
    CALORIES: number
    CHECK_IN: number
    PERFECT_DAY: number
    STREAK_PER_DAY: number
  }
  MAX_LEVEL: number

  // Actions
  completeOnboarding: () => { newLevel: number }
  logDailyXP: (data: Omit<DailyXP, 'total' | 'claimed'>) => number
  claimWeeklyXP: () => { xpClaimed: number; leveledUp: boolean; newLevel: number }
  calculateLevel: (xp: number) => number
  getXPForNextLevel: () => number
  getCurrentLevelProgress: () => number
  getTodayLog: () => DailyXP | null
  getPendingXPBreakdown: () => {
    total: number
    days: DailyXP[]
  }
  canClaimXP: () => boolean
  resetXP: () => void
  exportData: () => string
  importData: (data: string) => boolean
}

const XP_VALUES = {
  WORKOUT: 100,
  PROTEIN: 50,
  CALORIES: 50,
  CHECK_IN: 25,
  PERFECT_DAY: 25,
  STREAK_PER_DAY: 10,
}

const MAX_LEVEL = 99

// Progressive XP curve - fast early, slower later
// Level 0→1 happens at onboarding (0 XP needed)
// Level 1→2: 100 XP, Level 2→3: 150 XP, etc.
const getXPForLevel = (level: number): number => {
  if (level <= 1) return 0
  if (level === 2) return 100
  if (level === 3) return 150
  if (level === 4) return 250
  if (level === 5) return 400
  if (level === 6) return 600
  if (level === 7) return 800
  if (level === 8) return 1000
  if (level === 9) return 1200
  if (level === 10) return 1400
  // After level 10, increase by 200 each level, capped at 2500
  return Math.min(1400 + (level - 10) * 200, 2500)
}

// Get cumulative XP needed to reach a level
const getCumulativeXP = (level: number): number => {
  let total = 0
  for (let i = 2; i <= level; i++) {
    total += getXPForLevel(i)
  }
  return total
}

// Calculate level from total XP
const calculateLevelFromXP = (totalXP: number): number => {
  let level = 1
  let cumulativeXP = 0

  while (level < MAX_LEVEL) {
    const xpForNext = getXPForLevel(level + 1)
    if (cumulativeXP + xpForNext > totalXP) break
    cumulativeXP += xpForNext
    level++
  }

  return level
}

const calculateDailyTotal = (data: Omit<DailyXP, 'total' | 'claimed'>): number => {
  let total = 0
  if (data.workout) total += XP_VALUES.WORKOUT
  if (data.protein) total += XP_VALUES.PROTEIN
  if (data.calories) total += XP_VALUES.CALORIES
  if (data.checkIn) total += XP_VALUES.CHECK_IN
  if (data.perfectDay) total += XP_VALUES.PERFECT_DAY
  total += data.streakBonus
  return total
}

export const useXPStore = create<XPStore>()(
  persist(
    (set, get) => ({
      totalXP: 0,
      currentLevel: 0,
      pendingXP: 0,
      weeklyHistory: [],
      dailyLogs: [],
      lastClaimDate: null,

      XP_VALUES,
      MAX_LEVEL,

      completeOnboarding: () => {
        // Level up from 0 to 1 when onboarding completes
        set({ currentLevel: 1 })
        return { newLevel: 1 }
      },

      logDailyXP: (data) => {
        const today = getLocalDateString()
        const existingLog = get().dailyLogs.find(log => log.date === today)

        const total = calculateDailyTotal(data)
        const newLog: DailyXP = { ...data, total, claimed: false }

        if (existingLog) {
          // Update existing log
          const oldTotal = existingLog.total
          set((state) => ({
            dailyLogs: state.dailyLogs.map(log =>
              log.date === today ? newLog : log
            ),
            pendingXP: state.pendingXP - oldTotal + total
          }))
        } else {
          // Add new log
          set((state) => ({
            dailyLogs: [...state.dailyLogs, newLog],
            pendingXP: state.pendingXP + total
          }))
        }

        return total
      },

      claimWeeklyXP: () => {
        const state = get()
        const xpToClaim = state.pendingXP
        const newTotalXP = state.totalXP + xpToClaim
        const oldLevel = state.currentLevel
        const newLevel = calculateLevelFromXP(newTotalXP)
        const leveledUp = newLevel > oldLevel

        // Use local timezone for date tracking
        const today = getLocalDateString()
        const weekOf = getLocalWeekString()

        set((state) => ({
          totalXP: newTotalXP,
          currentLevel: newLevel,
          pendingXP: 0,
          lastClaimDate: today,
          dailyLogs: state.dailyLogs.map(log => ({ ...log, claimed: true })),
          weeklyHistory: [
            ...state.weeklyHistory,
            { weekOf, xpEarned: xpToClaim, levelReached: newLevel }
          ]
        }))

        return { xpClaimed: xpToClaim, leveledUp, newLevel }
      },

      calculateLevel: (xp: number) => {
        return calculateLevelFromXP(xp)
      },

      getXPForNextLevel: () => {
        const state = get()
        if (state.currentLevel >= MAX_LEVEL) return 0
        const xpNeededForNextLevel = getCumulativeXP(state.currentLevel + 1)
        return xpNeededForNextLevel - state.totalXP
      },

      getCurrentLevelProgress: () => {
        const state = get()
        if (state.currentLevel === 0) return 0
        const xpForCurrentLevel = getCumulativeXP(state.currentLevel)
        const xpForNextLevel = getCumulativeXP(state.currentLevel + 1)
        const xpInCurrentLevel = state.totalXP - xpForCurrentLevel
        const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel
        return (xpInCurrentLevel / xpNeededForLevel) * 100
      },

      getTodayLog: () => {
        const today = getLocalDateString()
        return get().dailyLogs.find(log => log.date === today) || null
      },

      getPendingXPBreakdown: () => {
        const logs = get().dailyLogs.filter(log => !log.claimed)
        return {
          total: logs.reduce((sum, log) => sum + log.total, 0),
          days: logs
        }
      },

      canClaimXP: () => {
        // Use local timezone for Sunday check and day calculations
        if (!isLocalSunday()) return false

        const state = get()
        const lastClaim = state.lastClaimDate

        if (!lastClaim) return state.pendingXP > 0

        const daysSinceLastClaim = getDaysSince(lastClaim)
        return daysSinceLastClaim >= 7 && state.pendingXP > 0
      },

      resetXP: () => set({
        totalXP: 0,
        currentLevel: 0,
        pendingXP: 0,
        weeklyHistory: [],
        dailyLogs: [],
        lastClaimDate: null
      }),

      exportData: () => {
        const state = get()
        return JSON.stringify({
          xp: {
            totalXP: state.totalXP,
            currentLevel: state.currentLevel,
            pendingXP: state.pendingXP,
            weeklyHistory: state.weeklyHistory,
            dailyLogs: state.dailyLogs,
            lastClaimDate: state.lastClaimDate
          }
        }, null, 2)
      },

      importData: (data: string) => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.xp) {
            set({
              totalXP: parsed.xp.totalXP || 0,
              currentLevel: parsed.xp.currentLevel || 1,
              pendingXP: parsed.xp.pendingXP || 0,
              weeklyHistory: parsed.xp.weeklyHistory || [],
              dailyLogs: parsed.xp.dailyLogs || [],
              lastClaimDate: parsed.xp.lastClaimDate || null
            })
            return true
          }
          return false
        } catch {
          return false
        }
      }
    }),
    {
      name: 'gamify-gains-xp',
    }
  )
)
