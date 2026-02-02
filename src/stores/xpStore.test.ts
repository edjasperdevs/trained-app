import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useXPStore } from './xpStore'

describe('xpStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useXPStore.setState({
      totalXP: 0,
      currentLevel: 0,
      pendingXP: 0,
      weeklyHistory: [],
      dailyLogs: [],
      lastClaimDate: null
    })
  })

  describe('XP_VALUES', () => {
    it('should have correct XP values', () => {
      const { XP_VALUES } = useXPStore.getState()

      expect(XP_VALUES.WORKOUT).toBe(100)
      expect(XP_VALUES.PROTEIN).toBe(50)
      expect(XP_VALUES.CALORIES).toBe(50)
      expect(XP_VALUES.CHECK_IN).toBe(25)
      expect(XP_VALUES.PERFECT_DAY).toBe(25)
      expect(XP_VALUES.STREAK_PER_DAY).toBe(10)
    })
  })

  describe('completeOnboarding', () => {
    it('should set level to 1', () => {
      const { completeOnboarding } = useXPStore.getState()

      const result = completeOnboarding()

      expect(result.newLevel).toBe(1)
      expect(useXPStore.getState().currentLevel).toBe(1)
    })
  })

  describe('logDailyXP', () => {
    it('should calculate XP for workout', () => {
      const { logDailyXP, XP_VALUES } = useXPStore.getState()

      const total = logDailyXP({
        date: '2024-01-15',
        workout: true,
        protein: false,
        calories: false,
        checkIn: false,
        perfectDay: false,
        streakBonus: 0
      })

      expect(total).toBe(XP_VALUES.WORKOUT)
      expect(useXPStore.getState().pendingXP).toBe(XP_VALUES.WORKOUT)
    })

    it('should calculate XP for all daily activities', () => {
      const { logDailyXP, XP_VALUES } = useXPStore.getState()

      const total = logDailyXP({
        date: '2024-01-15',
        workout: true,
        protein: true,
        calories: true,
        checkIn: true,
        perfectDay: true,
        streakBonus: 30 // 3 day streak
      })

      const expected = XP_VALUES.WORKOUT + XP_VALUES.PROTEIN + XP_VALUES.CALORIES +
                       XP_VALUES.CHECK_IN + XP_VALUES.PERFECT_DAY + 30
      expect(total).toBe(expected)
      expect(useXPStore.getState().pendingXP).toBe(expected)
    })

    it('should update existing log for same day', () => {
      const { logDailyXP, XP_VALUES } = useXPStore.getState()

      // First log
      logDailyXP({
        date: new Date().toISOString().split('T')[0],
        workout: true,
        protein: false,
        calories: false,
        checkIn: false,
        perfectDay: false,
        streakBonus: 0
      })

      expect(useXPStore.getState().pendingXP).toBe(XP_VALUES.WORKOUT)

      // Update same day
      logDailyXP({
        date: new Date().toISOString().split('T')[0],
        workout: true,
        protein: true,
        calories: false,
        checkIn: false,
        perfectDay: false,
        streakBonus: 0
      })

      // Should update, not add
      expect(useXPStore.getState().pendingXP).toBe(XP_VALUES.WORKOUT + XP_VALUES.PROTEIN)
      expect(useXPStore.getState().dailyLogs).toHaveLength(1)
    })

    it('should add new log for different day', () => {
      const { logDailyXP } = useXPStore.getState()

      logDailyXP({
        date: '2024-01-15',
        workout: true,
        protein: false,
        calories: false,
        checkIn: false,
        perfectDay: false,
        streakBonus: 0
      })

      logDailyXP({
        date: '2024-01-16',
        workout: true,
        protein: false,
        calories: false,
        checkIn: false,
        perfectDay: false,
        streakBonus: 0
      })

      expect(useXPStore.getState().dailyLogs).toHaveLength(2)
    })
  })

  describe('claimWeeklyXP', () => {
    beforeEach(() => {
      // Start at level 1
      useXPStore.getState().completeOnboarding()

      // Add some pending XP
      useXPStore.getState().logDailyXP({
        date: '2024-01-15',
        workout: true,
        protein: true,
        calories: true,
        checkIn: true,
        perfectDay: true,
        streakBonus: 0
      })
    })

    it('should claim pending XP and add to total', () => {
      const { claimWeeklyXP, XP_VALUES } = useXPStore.getState()
      const pendingBefore = useXPStore.getState().pendingXP

      const result = claimWeeklyXP()

      expect(result.xpClaimed).toBe(pendingBefore)
      expect(useXPStore.getState().totalXP).toBe(pendingBefore)
      expect(useXPStore.getState().pendingXP).toBe(0)
    })

    it('should mark all daily logs as claimed', () => {
      const { claimWeeklyXP } = useXPStore.getState()

      claimWeeklyXP()

      const logs = useXPStore.getState().dailyLogs
      expect(logs.every(log => log.claimed)).toBe(true)
    })

    it('should update lastClaimDate', () => {
      const { claimWeeklyXP } = useXPStore.getState()

      claimWeeklyXP()

      expect(useXPStore.getState().lastClaimDate).toBe(
        new Date().toISOString().split('T')[0]
      )
    })

    it('should add to weekly history', () => {
      const { claimWeeklyXP } = useXPStore.getState()
      const pendingXP = useXPStore.getState().pendingXP

      claimWeeklyXP()

      const history = useXPStore.getState().weeklyHistory
      expect(history).toHaveLength(1)
      expect(history[0].xpEarned).toBe(pendingXP)
    })
  })

  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      const { calculateLevel } = useXPStore.getState()
      expect(calculateLevel(0)).toBe(1)
    })

    it('should return level 2 for 100+ XP', () => {
      const { calculateLevel } = useXPStore.getState()
      expect(calculateLevel(100)).toBe(2)
      expect(calculateLevel(149)).toBe(2)
    })

    it('should return level 3 for 250+ XP', () => {
      const { calculateLevel } = useXPStore.getState()
      // 100 (lvl 2) + 150 (lvl 3) = 250
      expect(calculateLevel(250)).toBe(3)
    })

    it('should handle high XP values', () => {
      const { calculateLevel, MAX_LEVEL } = useXPStore.getState()
      // Very high XP should cap at MAX_LEVEL
      expect(calculateLevel(1000000)).toBe(MAX_LEVEL)
    })
  })

  describe('getXPForNextLevel', () => {
    it('should return XP needed for next level', () => {
      useXPStore.setState({ currentLevel: 1, totalXP: 0 })
      const { getXPForNextLevel } = useXPStore.getState()

      // Need 100 XP for level 2
      expect(getXPForNextLevel()).toBe(100)
    })

    it('should account for current XP', () => {
      useXPStore.setState({ currentLevel: 1, totalXP: 50 })
      const { getXPForNextLevel } = useXPStore.getState()

      // Need 100 XP for level 2, have 50, so need 50 more
      expect(getXPForNextLevel()).toBe(50)
    })

    it('should return 0 at max level', () => {
      const { MAX_LEVEL } = useXPStore.getState()
      useXPStore.setState({ currentLevel: MAX_LEVEL, totalXP: 1000000 })

      const { getXPForNextLevel } = useXPStore.getState()
      expect(getXPForNextLevel()).toBe(0)
    })
  })

  describe('getCurrentLevelProgress', () => {
    it('should return 0 for level 0', () => {
      useXPStore.setState({ currentLevel: 0, totalXP: 0 })
      const { getCurrentLevelProgress } = useXPStore.getState()

      expect(getCurrentLevelProgress()).toBe(0)
    })

    it('should return 50 when halfway through level', () => {
      // Level 1 to 2 needs 100 XP
      useXPStore.setState({ currentLevel: 1, totalXP: 50 })
      const { getCurrentLevelProgress } = useXPStore.getState()

      expect(getCurrentLevelProgress()).toBe(50)
    })

    it('should return close to 100 when almost at next level', () => {
      // Level 1 to 2 needs 100 XP
      useXPStore.setState({ currentLevel: 1, totalXP: 99 })
      const { getCurrentLevelProgress } = useXPStore.getState()

      expect(getCurrentLevelProgress()).toBe(99)
    })
  })

  describe('getTodayLog', () => {
    it('should return null when no log exists', () => {
      const { getTodayLog } = useXPStore.getState()
      expect(getTodayLog()).toBeNull()
    })

    it('should return today\'s log when it exists', () => {
      const { logDailyXP, getTodayLog } = useXPStore.getState()

      logDailyXP({
        date: new Date().toISOString().split('T')[0],
        workout: true,
        protein: false,
        calories: false,
        checkIn: false,
        perfectDay: false,
        streakBonus: 0
      })

      const todayLog = getTodayLog()
      expect(todayLog).not.toBeNull()
      expect(todayLog?.workout).toBe(true)
    })
  })

  describe('getPendingXPBreakdown', () => {
    it('should return unclaimed logs', () => {
      const { logDailyXP, getPendingXPBreakdown } = useXPStore.getState()

      logDailyXP({
        date: '2024-01-15',
        workout: true,
        protein: false,
        calories: false,
        checkIn: false,
        perfectDay: false,
        streakBonus: 0
      })

      const breakdown = getPendingXPBreakdown()
      expect(breakdown.days).toHaveLength(1)
      expect(breakdown.total).toBe(100)
    })

    it('should not include claimed logs', () => {
      const { logDailyXP, claimWeeklyXP, getPendingXPBreakdown } = useXPStore.getState()

      logDailyXP({
        date: '2024-01-15',
        workout: true,
        protein: false,
        calories: false,
        checkIn: false,
        perfectDay: false,
        streakBonus: 0
      })

      claimWeeklyXP()

      const breakdown = getPendingXPBreakdown()
      expect(breakdown.days).toHaveLength(0)
      expect(breakdown.total).toBe(0)
    })
  })

  describe('canClaimXP', () => {
    it('should return false if not Sunday', () => {
      // Mock a non-Sunday (Monday)
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00')) // Monday noon local time

      useXPStore.setState({ pendingXP: 100, lastClaimDate: null })
      const { canClaimXP } = useXPStore.getState()

      expect(canClaimXP()).toBe(false)

      vi.useRealTimers()
    })

    it('should return true on Sunday with pending XP and no previous claim', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-21T12:00:00')) // Sunday noon local time

      useXPStore.setState({ pendingXP: 100, lastClaimDate: null })
      const { canClaimXP } = useXPStore.getState()

      expect(canClaimXP()).toBe(true)

      vi.useRealTimers()
    })

    it('should return false on Sunday with no pending XP', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-21T12:00:00')) // Sunday noon local time

      useXPStore.setState({ pendingXP: 0, lastClaimDate: null })
      const { canClaimXP } = useXPStore.getState()

      expect(canClaimXP()).toBe(false)

      vi.useRealTimers()
    })

    it('should return false if claimed within last 7 days', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-21T12:00:00')) // Sunday noon local time

      useXPStore.setState({
        pendingXP: 100,
        lastClaimDate: '2024-01-17' // Less than 7 days ago (Wednesday)
      })
      const { canClaimXP } = useXPStore.getState()

      expect(canClaimXP()).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('resetXP', () => {
    it('should reset all XP data', () => {
      useXPStore.setState({
        totalXP: 1000,
        currentLevel: 5,
        pendingXP: 200,
        weeklyHistory: [{ weekOf: '2024-01-07', xpEarned: 500, levelReached: 3 }],
        dailyLogs: [{
          date: '2024-01-15',
          workout: true,
          protein: true,
          calories: true,
          checkIn: true,
          perfectDay: true,
          streakBonus: 0,
          total: 250,
          claimed: false
        }],
        lastClaimDate: '2024-01-14'
      })

      useXPStore.getState().resetXP()

      const state = useXPStore.getState()
      expect(state.totalXP).toBe(0)
      expect(state.currentLevel).toBe(0)
      expect(state.pendingXP).toBe(0)
      expect(state.weeklyHistory).toHaveLength(0)
      expect(state.dailyLogs).toHaveLength(0)
      expect(state.lastClaimDate).toBeNull()
    })
  })

  describe('level progression', () => {
    it('should level up when claiming enough XP', () => {
      useXPStore.getState().completeOnboarding() // Level 1

      // Add 100 XP (enough for level 2)
      useXPStore.getState().logDailyXP({
        date: '2024-01-15',
        workout: true, // 100 XP
        protein: false,
        calories: false,
        checkIn: false,
        perfectDay: false,
        streakBonus: 0
      })

      const result = useXPStore.getState().claimWeeklyXP()

      expect(result.leveledUp).toBe(true)
      expect(result.newLevel).toBe(2)
      expect(useXPStore.getState().currentLevel).toBe(2)
    })

    it('should not level up with insufficient XP', () => {
      useXPStore.getState().completeOnboarding() // Level 1

      // Add 25 XP (not enough for level 2)
      useXPStore.getState().logDailyXP({
        date: '2024-01-15',
        workout: false,
        protein: false,
        calories: false,
        checkIn: true, // 25 XP
        perfectDay: false,
        streakBonus: 0
      })

      const result = useXPStore.getState().claimWeeklyXP()

      expect(result.leveledUp).toBe(false)
      expect(result.newLevel).toBe(1)
    })
  })
})
