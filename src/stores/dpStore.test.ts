import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDPStore, DP_VALUES } from './dpStore'
import { getLocalDateString } from '../lib/dateUtils'

describe('dpStore', () => {
  beforeEach(() => {
    vi.useRealTimers()
    // Reset store to initial state
    useDPStore.setState({
      totalDP: 0,
      currentRank: 1,
      obedienceStreak: 0,
      longestObedienceStreak: 0,
      lastActionDate: null,
      lastCelebratedRank: 1,
      dailyLogs: [],
    })
  })

  describe('DP_VALUES constants', () => {
    it('should have correct DP values', () => {
      expect(DP_VALUES.training).toBe(50)
      expect(DP_VALUES.meal).toBe(15)
      expect(DP_VALUES.protein).toBe(25)
      expect(DP_VALUES.steps).toBe(10)
      expect(DP_VALUES.sleep).toBe(10)
    })
  })

  describe('awardDP basic', () => {
    it('should add training DP to totalDP', () => {
      const { awardDP } = useDPStore.getState()

      awardDP('training')

      expect(useDPStore.getState().totalDP).toBe(50)
      expect(useDPStore.getState().currentRank).toBe(1) // Still Initiate at 50 DP
    })

    it('should return correct result object', () => {
      const { awardDP } = useDPStore.getState()

      const result = awardDP('training')

      expect(result).toEqual({ dpAwarded: 50, rankedUp: false, newRank: 1 })
    })
  })

  describe('rank progression', () => {
    it('should advance to rank 2 at 200 DP', () => {
      const { awardDP } = useDPStore.getState()

      // Award 200 DP total (4 training sessions = 4 * 50 = 200)
      awardDP('training')
      awardDP('training')
      awardDP('training')
      awardDP('training')

      expect(useDPStore.getState().totalDP).toBe(200)
      expect(useDPStore.getState().currentRank).toBe(2) // Novice threshold = 200
    })

    it('should detect rank-up when crossing threshold', () => {
      // Set to 150 DP
      useDPStore.setState({ totalDP: 150, currentRank: 1, lastCelebratedRank: 1 })

      const { awardDP } = useDPStore.getState()
      const result = awardDP('training') // +50 => 200 total => Novice

      expect(result).toEqual({ dpAwarded: 50, rankedUp: true, newRank: 2 })
    })

    it('should reach rank 15 (Master) at 65000 DP', () => {
      useDPStore.setState({ totalDP: 65000, currentRank: 14, lastCelebratedRank: 14 })

      // Recalculate rank by awarding 0-value (use a meal, but set totalDP high first)
      // Actually let's just set totalDP and then award to trigger recalculation
      const { awardDP } = useDPStore.getState()
      const result = awardDP('meal') // +15 => 65015 total

      expect(useDPStore.getState().currentRank).toBe(15) // Master
    })
  })

  describe('getRankInfo', () => {
    it('should return correct rank info at 300 DP', () => {
      useDPStore.setState({ totalDP: 300, currentRank: 2 })

      const { getRankInfo } = useDPStore.getState()
      const info = getRankInfo()

      expect(info.name).toBe('Novice')
      expect(info.rank).toBe(2)
      // dpForNext: 500 - 300 = 200 (next threshold minus totalDP)
      expect(info.dpForNext).toBe(200)
      // progress: (300 - 200) / (500 - 200) = 100 / 300 = 0.333...
      expect(info.progress).toBeCloseTo(1 / 3, 2)
    })

    it('should return progress=1 and dpForNext=0 at max rank', () => {
      useDPStore.setState({ totalDP: 70000, currentRank: 15 })

      const { getRankInfo } = useDPStore.getState()
      const info = getRankInfo()

      expect(info.progress).toBe(1)
      expect(info.dpForNext).toBe(0)
      expect(info.name).toBe('Master')
    })
  })

  describe('daily logs', () => {
    it('should create a daily log entry after awarding DP', () => {
      const { awardDP } = useDPStore.getState()

      awardDP('training')

      const { dailyLogs } = useDPStore.getState()
      const today = getLocalDateString()

      expect(dailyLogs.length).toBe(1)
      expect(dailyLogs[0].date).toBe(today)
      expect(dailyLogs[0].training).toBe(1)
      expect(dailyLogs[0].total).toBe(50)
    })

    it('should accumulate in same daily log for multiple awards on same day', () => {
      const { awardDP } = useDPStore.getState()

      awardDP('training')
      awardDP('meal')
      awardDP('protein')

      const { dailyLogs } = useDPStore.getState()

      expect(dailyLogs.length).toBe(1)
      expect(dailyLogs[0].training).toBe(1)
      expect(dailyLogs[0].meals).toBe(1)
      expect(dailyLogs[0].protein).toBe(1)
      expect(dailyLogs[0].total).toBe(50 + 15 + 25) // 90
    })
  })

  describe('meal cap', () => {
    it('should cap meals at 3 per day', () => {
      const { awardDP } = useDPStore.getState()

      const r1 = awardDP('meal') // +15
      const r2 = awardDP('meal') // +15
      const r3 = awardDP('meal') // +15
      const r4 = awardDP('meal') // should be +0 (capped)

      expect(r1.dpAwarded).toBe(15)
      expect(r2.dpAwarded).toBe(15)
      expect(r3.dpAwarded).toBe(15)
      expect(r4.dpAwarded).toBe(0)

      expect(useDPStore.getState().totalDP).toBe(45) // 3 * 15 = 45, not 60
    })
  })

  describe('obedience streak', () => {
    it('should start streak at 1 on first action', () => {
      const { awardDP } = useDPStore.getState()

      awardDP('training')

      expect(useDPStore.getState().obedienceStreak).toBe(1)
    })

    it('should increment streak for consecutive day', () => {
      vi.useFakeTimers()
      const yesterday = new Date('2026-02-26T12:00:00')
      vi.setSystemTime(yesterday)

      const { awardDP } = useDPStore.getState()
      awardDP('training')
      expect(useDPStore.getState().obedienceStreak).toBe(1)

      // Move to next day
      const today = new Date('2026-02-27T12:00:00')
      vi.setSystemTime(today)

      useDPStore.getState().awardDP('training')
      expect(useDPStore.getState().obedienceStreak).toBe(2)
    })

    it('should reset streak when a day is missed', () => {
      vi.useFakeTimers()
      const twoDaysAgo = new Date('2026-02-25T12:00:00')
      vi.setSystemTime(twoDaysAgo)

      const { awardDP } = useDPStore.getState()
      awardDP('training')
      expect(useDPStore.getState().obedienceStreak).toBe(1)

      // Skip a day, move to 2 days later
      const today = new Date('2026-02-27T12:00:00')
      vi.setSystemTime(today)

      useDPStore.getState().awardDP('training')
      expect(useDPStore.getState().obedienceStreak).toBe(1) // Reset, not 2
    })

    it('should not change streak for same-day awards', () => {
      const { awardDP } = useDPStore.getState()

      awardDP('training')
      expect(useDPStore.getState().obedienceStreak).toBe(1)

      awardDP('meal')
      expect(useDPStore.getState().obedienceStreak).toBe(1) // Same day, unchanged
    })

    it('should track longest streak', () => {
      vi.useFakeTimers()

      // Build a 5-day streak
      for (let i = 0; i < 5; i++) {
        vi.setSystemTime(new Date(`2026-02-${20 + i}T12:00:00`))
        useDPStore.getState().awardDP('training')
      }

      expect(useDPStore.getState().obedienceStreak).toBe(5)
      expect(useDPStore.getState().longestObedienceStreak).toBe(5)

      // Skip a day and reset
      vi.setSystemTime(new Date('2026-02-26T12:00:00'))
      useDPStore.getState().awardDP('training')

      expect(useDPStore.getState().obedienceStreak).toBe(1) // Reset
      expect(useDPStore.getState().longestObedienceStreak).toBe(5) // Longest preserved
    })
  })

  describe('lastCelebratedRank', () => {
    it('should update lastCelebratedRank after rank-up', () => {
      useDPStore.setState({ totalDP: 150, currentRank: 1, lastCelebratedRank: 1 })

      const { awardDP } = useDPStore.getState()
      awardDP('training') // +50 => 200 => rank 2

      expect(useDPStore.getState().lastCelebratedRank).toBe(2)
    })
  })

  describe('resetDP', () => {
    it('should reset all state to initial values', () => {
      // Set some state
      useDPStore.setState({
        totalDP: 5000,
        currentRank: 7,
        obedienceStreak: 10,
        longestObedienceStreak: 15,
        lastActionDate: '2026-02-27',
        lastCelebratedRank: 7,
        dailyLogs: [{ date: '2026-02-27', training: 1, meals: 0, protein: 0, steps: 0, sleep: 0, total: 50 }],
      })

      useDPStore.getState().resetDP()

      const state = useDPStore.getState()
      expect(state.totalDP).toBe(0)
      expect(state.currentRank).toBe(1)
      expect(state.obedienceStreak).toBe(0)
      expect(state.longestObedienceStreak).toBe(0)
      expect(state.lastActionDate).toBeNull()
      expect(state.lastCelebratedRank).toBe(1)
      expect(state.dailyLogs).toHaveLength(0)
    })
  })

  describe('persist key', () => {
    it('should use trained-dp as storage key', () => {
      // The persist middleware stores under the configured name.
      // We verify by checking the store's persist API.
      const persistOptions = (useDPStore as any).persist
      // Access the name from the persist API
      const name = persistOptions?.getOptions?.()?.name
      expect(name).toBe('trained-dp')
    })
  })
})
