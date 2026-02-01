import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  XP_PER_LEVEL: number
  MAX_LEVEL: number

  // Actions
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

const XP_PER_LEVEL = 1000
const MAX_LEVEL = 99

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
      currentLevel: 1,
      pendingXP: 0,
      weeklyHistory: [],
      dailyLogs: [],
      lastClaimDate: null,

      XP_VALUES,
      XP_PER_LEVEL,
      MAX_LEVEL,

      logDailyXP: (data) => {
        const today = new Date().toISOString().split('T')[0]
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
        const newLevel = Math.min(Math.floor(newTotalXP / XP_PER_LEVEL) + 1, MAX_LEVEL)
        const leveledUp = newLevel > oldLevel

        const today = new Date().toISOString().split('T')[0]
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekOf = weekStart.toISOString().split('T')[0]

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
        return Math.min(Math.floor(xp / XP_PER_LEVEL) + 1, MAX_LEVEL)
      },

      getXPForNextLevel: () => {
        const state = get()
        if (state.currentLevel >= MAX_LEVEL) return 0
        return state.currentLevel * XP_PER_LEVEL - state.totalXP
      },

      getCurrentLevelProgress: () => {
        const state = get()
        const xpInCurrentLevel = state.totalXP % XP_PER_LEVEL
        return (xpInCurrentLevel / XP_PER_LEVEL) * 100
      },

      getTodayLog: () => {
        const today = new Date().toISOString().split('T')[0]
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
        const today = new Date()
        const isSunday = today.getDay() === 0
        const state = get()
        const lastClaim = state.lastClaimDate

        if (!isSunday) return false
        if (!lastClaim) return state.pendingXP > 0

        const lastClaimDate = new Date(lastClaim)
        const daysSinceLastClaim = Math.floor(
          (today.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        return daysSinceLastClaim >= 7 && state.pendingXP > 0
      },

      resetXP: () => set({
        totalXP: 0,
        currentLevel: 1,
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
