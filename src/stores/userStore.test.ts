import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUserStore } from './userStore'
import { getLocalDateString } from '../lib/dateUtils'

describe('userStore', () => {
  beforeEach(() => {
    vi.useRealTimers()
    useUserStore.setState({
      profile: null,
      weightHistory: [],
    })
  })

  // =========================================================
  // setProfile
  // =========================================================
  describe('setProfile', () => {
    it('should do nothing when profile is null', () => {
      useUserStore.getState().setProfile({ username: 'UPDATED' })
      expect(useUserStore.getState().profile).toBeNull()
    })

    it('should merge partial updates into existing profile', () => {
      useUserStore.getState().initProfile({
        username: 'JASPER',
        gender: 'male',
        fitnessLevel: 'intermediate',
        trainingDaysPerWeek: 4,
        weight: 185,
        height: 70,
        age: 28,
        goal: 'recomp',
        archetype: 'bro',
        units: 'imperial',
      })

      useUserStore.getState().setProfile({ username: 'UPDATED', weight: 190 })

      const profile = useUserStore.getState().profile!
      expect(profile.username).toBe('UPDATED')
      expect(profile.weight).toBe(190)
      // Unchanged fields preserved
      expect(profile.fitnessLevel).toBe('intermediate')
    })
  })

  // =========================================================
  // initProfile
  // =========================================================
  describe('initProfile', () => {
    it('should create a profile with defaults for computed fields', () => {
      useUserStore.getState().initProfile({
        username: 'TEST',
        gender: 'male',
        fitnessLevel: 'beginner',
        trainingDaysPerWeek: 3,
        weight: 150,
        height: 68,
        age: 25,
        goal: 'maintain',
        archetype: 'bro',
        units: 'imperial',
      })

      const profile = useUserStore.getState().profile!
      expect(profile.username).toBe('TEST')
      expect(profile.currentStreak).toBe(0)
      expect(profile.longestStreak).toBe(0)
      expect(profile.lastCheckInDate).toBeNull()
      expect(profile.streakPaused).toBe(false)
      expect(profile.onboardingComplete).toBe(false)
    })
  })

  // =========================================================
  // completeOnboarding
  // =========================================================
  describe('completeOnboarding', () => {
    it('should set onboardingComplete to true', () => {
      useUserStore.getState().initProfile({
        username: 'ONBOARD',
        gender: 'male',
        fitnessLevel: 'beginner',
        trainingDaysPerWeek: 3,
        weight: 150,
        height: 68,
        age: 25,
        goal: 'maintain',
        archetype: 'bro',
        units: 'imperial',
      })

      useUserStore.getState().completeOnboarding()
      expect(useUserStore.getState().profile!.onboardingComplete).toBe(true)
    })

    it('should do nothing when profile is null', () => {
      useUserStore.getState().completeOnboarding()
      expect(useUserStore.getState().profile).toBeNull()
    })
  })

  // =========================================================
  // updateStreak
  // =========================================================
  describe('updateStreak', () => {
    function initWithStreak(streak: number, lastCheckInDate: string | null, paused = false) {
      useUserStore.getState().initProfile({
        username: 'STREAK',
        gender: 'male',
        fitnessLevel: 'intermediate',
        trainingDaysPerWeek: 4,
        weight: 185,
        height: 70,
        age: 28,
        goal: 'recomp',
        archetype: 'bro',
        units: 'imperial',
      })
      useUserStore.getState().setProfile({
        currentStreak: streak,
        longestStreak: streak,
        lastCheckInDate,
        streakPaused: paused,
      })
    }

    it('should start streak at 1 on first check-in', () => {
      initWithStreak(0, null)
      useUserStore.getState().updateStreak(true)

      const p = useUserStore.getState().profile!
      expect(p.currentStreak).toBe(1)
      expect(p.lastCheckInDate).toBe(getLocalDateString())
    })

    it('should increment streak on consecutive day', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = getLocalDateString(yesterday)

      initWithStreak(5, yesterdayStr)
      useUserStore.getState().updateStreak(true)

      expect(useUserStore.getState().profile!.currentStreak).toBe(6)
    })

    it('should not change streak if already checked in today', () => {
      const today = getLocalDateString()
      initWithStreak(3, today)
      useUserStore.getState().updateStreak(true)

      expect(useUserStore.getState().profile!.currentStreak).toBe(3)
    })

    it('should reset streak after 2+ day gap', () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      initWithStreak(10, getLocalDateString(threeDaysAgo))
      useUserStore.getState().updateStreak(true)

      expect(useUserStore.getState().profile!.currentStreak).toBe(1)
    })

    it('should recover from paused streak within 2-day window', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      initWithStreak(5, getLocalDateString(twoDaysAgo), true)
      useUserStore.getState().updateStreak(true)

      expect(useUserStore.getState().profile!.currentStreak).toBe(6)
      expect(useUserStore.getState().profile!.streakPaused).toBe(false)
    })

    it('should pause streak on first miss (didCheckIn = false)', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      initWithStreak(5, getLocalDateString(yesterday))
      useUserStore.getState().updateStreak(false)

      expect(useUserStore.getState().profile!.streakPaused).toBe(true)
      expect(useUserStore.getState().profile!.currentStreak).toBe(5) // Not reset yet
    })

    it('should reset streak on two consecutive misses', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      initWithStreak(5, getLocalDateString(twoDaysAgo))
      useUserStore.getState().updateStreak(false)

      expect(useUserStore.getState().profile!.currentStreak).toBe(0)
    })

    it('should update longestStreak when current exceeds it', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      initWithStreak(10, getLocalDateString(yesterday))
      useUserStore.getState().setProfile({ longestStreak: 5 })
      useUserStore.getState().updateStreak(true)

      expect(useUserStore.getState().profile!.longestStreak).toBe(11)
    })
  })

  // =========================================================
  // logWeight
  // =========================================================
  describe('logWeight', () => {
    beforeEach(() => {
      useUserStore.getState().initProfile({
        username: 'WEIGHT',
        gender: 'male',
        fitnessLevel: 'beginner',
        trainingDaysPerWeek: 3,
        weight: 150,
        height: 68,
        age: 25,
        goal: 'cut',
        archetype: 'bro',
        units: 'imperial',
      })
    })

    it('should add a new weight entry', () => {
      useUserStore.getState().logWeight(185)

      const history = useUserStore.getState().weightHistory
      expect(history).toHaveLength(1)
      expect(history[0].weight).toBe(185)
      expect(history[0].date).toBe(getLocalDateString())
    })

    it('should update existing entry for the same day', () => {
      useUserStore.getState().logWeight(185)
      useUserStore.getState().logWeight(184)

      const history = useUserStore.getState().weightHistory
      expect(history).toHaveLength(1)
      expect(history[0].weight).toBe(184)
    })

    it('should also update profile weight', () => {
      useUserStore.getState().logWeight(192)
      expect(useUserStore.getState().profile!.weight).toBe(192)
    })
  })

  // =========================================================
  // getWeightTrend
  // =========================================================
  describe('getWeightTrend', () => {
    it('should return null with fewer than 2 entries', () => {
      useUserStore.setState({ weightHistory: [{ date: '2026-01-01', weight: 185 }] })
      expect(useUserStore.getState().getWeightTrend()).toBeNull()
    })

    it('should detect a downward trend', () => {
      useUserStore.setState({
        weightHistory: [
          { date: '2026-01-01', weight: 190 },
          { date: '2026-01-15', weight: 185 },
        ]
      })
      const trend = useUserStore.getState().getWeightTrend()!
      expect(trend.direction).toBe('down')
      expect(trend.change).toBeLessThan(0)
    })

    it('should detect an upward trend', () => {
      useUserStore.setState({
        weightHistory: [
          { date: '2026-01-01', weight: 170 },
          { date: '2026-01-15', weight: 178 },
        ]
      })
      const trend = useUserStore.getState().getWeightTrend()!
      expect(trend.direction).toBe('up')
      expect(trend.change).toBeGreaterThan(0)
    })

    it('should detect same/flat trend within 0.5 lbs', () => {
      useUserStore.setState({
        weightHistory: [
          { date: '2026-01-01', weight: 185 },
          { date: '2026-01-15', weight: 185.3 },
        ]
      })
      const trend = useUserStore.getState().getWeightTrend()!
      expect(trend.direction).toBe('same')
    })
  })

  // =========================================================
  // getProjectedGoalDate
  // =========================================================
  describe('getProjectedGoalDate', () => {
    it('should return null when no goal weight is set', () => {
      useUserStore.getState().initProfile({
        username: 'PROJ',
        gender: 'male',
        fitnessLevel: 'beginner',
        trainingDaysPerWeek: 3,
        weight: 185,
        height: 68,
        age: 25,
        goal: 'cut',
        archetype: 'bro',
        units: 'imperial',
      })
      expect(useUserStore.getState().getProjectedGoalDate()).toBeNull()
    })

    it('should report achieved when current ≈ goal', () => {
      useUserStore.getState().initProfile({
        username: 'PROJ',
        gender: 'male',
        fitnessLevel: 'beginner',
        trainingDaysPerWeek: 3,
        weight: 180,
        height: 68,
        age: 25,
        goal: 'cut',
        archetype: 'bro',
        units: 'imperial',
      })
      useUserStore.getState().setGoalWeight(180.5)

      const result = useUserStore.getState().getProjectedGoalDate()!
      expect(result.isAchieved).toBe(true)
    })
  })

  // =========================================================
  // setGoalWeight
  // =========================================================
  describe('setGoalWeight', () => {
    it('should set goal weight on profile', () => {
      useUserStore.getState().initProfile({
        username: 'GOAL',
        gender: 'male',
        fitnessLevel: 'beginner',
        trainingDaysPerWeek: 3,
        weight: 185,
        height: 68,
        age: 25,
        goal: 'cut',
        archetype: 'bro',
        units: 'imperial',
      })

      useUserStore.getState().setGoalWeight(170)
      expect(useUserStore.getState().profile!.goalWeight).toBe(170)
    })

    it('should clear goal weight with null', () => {
      useUserStore.getState().initProfile({
        username: 'GOAL',
        gender: 'male',
        fitnessLevel: 'beginner',
        trainingDaysPerWeek: 3,
        weight: 185,
        height: 68,
        age: 25,
        goal: 'cut',
        archetype: 'bro',
        units: 'imperial',
      })
      useUserStore.getState().setGoalWeight(170)
      useUserStore.getState().setGoalWeight(null)
      expect(useUserStore.getState().profile!.goalWeight).toBeUndefined()
    })
  })

  // =========================================================
  // exportData / importData
  // =========================================================
  describe('exportData / importData', () => {
    it('should round-trip profile data', () => {
      useUserStore.getState().initProfile({
        username: 'EXPORT',
        gender: 'male',
        fitnessLevel: 'advanced',
        trainingDaysPerWeek: 5,
        weight: 200,
        height: 72,
        age: 30,
        goal: 'bulk',
        archetype: 'brute',
        units: 'imperial',
      })

      const exported = useUserStore.getState().exportData()
      useUserStore.setState({ profile: null })

      const result = useUserStore.getState().importData(exported)
      expect(result).toBe(true)
      expect(useUserStore.getState().profile!.username).toBe('EXPORT')
      expect(useUserStore.getState().profile!.fitnessLevel).toBe('advanced')
    })

    it('should reject invalid JSON', () => {
      const result = useUserStore.getState().importData('not valid json')
      expect(result).toBe(false)
    })

    it('should reject JSON without user key', () => {
      const result = useUserStore.getState().importData('{"foo":"bar"}')
      expect(result).toBe(false)
    })
  })

  // =========================================================
  // resetProgress
  // =========================================================
  describe('resetProgress', () => {
    it('should clear both profile and weightHistory', () => {
      useUserStore.getState().initProfile({
        username: 'RESET',
        gender: 'male',
        fitnessLevel: 'beginner',
        trainingDaysPerWeek: 3,
        weight: 150,
        height: 68,
        age: 25,
        goal: 'maintain',
        archetype: 'bro',
        units: 'imperial',
      })
      useUserStore.getState().logWeight(155)

      useUserStore.getState().resetProgress()

      expect(useUserStore.getState().profile).toBeNull()
      expect(useUserStore.getState().weightHistory).toHaveLength(0)
    })
  })

  // =========================================================
  // persist key
  // =========================================================
  describe('persist key', () => {
    it('should use gamify-gains-user as storage key', () => {
      const persistOptions = (useUserStore as any).persist
      const name = persistOptions?.getOptions?.()?.name
      expect(name).toBe('gamify-gains-user')
    })
  })
})
