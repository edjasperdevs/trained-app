import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAchievementsStore } from './achievementsStore'
import { useUserStore } from './userStore'
import { useWorkoutStore } from './workoutStore'
import { useDPStore } from './dpStore'
import { useMacroStore } from './macroStore'

describe('achievementsStore', () => {
    beforeEach(() => {
        vi.useRealTimers()
        // Reset achievements store
        useAchievementsStore.setState({
            earnedBadges: [],
            lastChecked: null,
        })

        // Set up dependent stores with clean state
        useUserStore.setState({
            profile: {
                username: 'TEST',
                gender: 'male',
                fitnessLevel: 'intermediate',
                trainingDaysPerWeek: 4,
                weight: 185,
                height: 70,
                age: 28,
                goal: 'recomp',
                archetype: 'bro',
                createdAt: Date.now(),
                currentStreak: 0,
                longestStreak: 0,
                lastCheckInDate: null,
                streakPaused: false,
                onboardingComplete: true,
                units: 'imperial',
            },
            weightHistory: [],
        })

        useWorkoutStore.setState({ workoutLogs: [] })
        useDPStore.setState({ totalDP: 0, currentRank: 1, dailyLogs: [] })
        useMacroStore.setState({ targets: null, dailyLogs: [] })
    })

    // =========================================================
    // getAllBadges
    // =========================================================
    describe('getAllBadges', () => {
        it('should return all badge definitions', () => {
            const badges = useAchievementsStore.getState().getAllBadges()
            expect(badges.length).toBeGreaterThan(0)
        })

        it('should have badges from all 5 categories', () => {
            const badges = useAchievementsStore.getState().getAllBadges()
            const categories = new Set(badges.map(b => b.category))
            expect(categories).toContain('streak')
            expect(categories).toContain('workout')
            expect(categories).toContain('nutrition')
            expect(categories).toContain('level')
            expect(categories).toContain('special')
        })

        it('should have unique IDs for all badges', () => {
            const badges = useAchievementsStore.getState().getAllBadges()
            const ids = badges.map(b => b.id)
            expect(new Set(ids).size).toBe(ids.length)
        })
    })

    // =========================================================
    // checkAndAwardBadges
    // =========================================================
    describe('checkAndAwardBadges', () => {
        it('should award first-workout badge when 1 workout exists', () => {
            useWorkoutStore.setState({
                workoutLogs: [{
                    id: 'w1', date: '2026-01-01', workoutType: 'push', dayNumber: 1,
                    weekNumber: 1, exercises: [], completed: true, xpAwarded: true,
                    startTime: 0, endTime: 0,
                }],
            })

            const newBadges = useAchievementsStore.getState().checkAndAwardBadges()
            expect(newBadges).toContain('first-workout')
        })

        it('should award streak-7 badge when streak is 7+', () => {
            useUserStore.getState().setProfile({ currentStreak: 7 })

            const newBadges = useAchievementsStore.getState().checkAndAwardBadges()
            expect(newBadges).toContain('streak-7')
        })

        it('should not double-award badges', () => {
            useUserStore.getState().setProfile({ currentStreak: 7 })

            const first = useAchievementsStore.getState().checkAndAwardBadges()
            expect(first).toContain('streak-7')

            const second = useAchievementsStore.getState().checkAndAwardBadges()
            expect(second).not.toContain('streak-7')

            // Only one entry
            const earned = useAchievementsStore.getState().earnedBadges.filter(b => b.badgeId === 'streak-7')
            expect(earned).toHaveLength(1)
        })

        it('should award level badge based on DP rank', () => {
            useDPStore.setState({ currentRank: 5 })

            const newBadges = useAchievementsStore.getState().checkAndAwardBadges()
            expect(newBadges).toContain('level-10') // rank 5 = level-10 badge requirement
        })

        it('should set lastChecked after checking', () => {
            useAchievementsStore.getState().checkAndAwardBadges()
            expect(useAchievementsStore.getState().lastChecked).not.toBeNull()
        })
    })

    // =========================================================
    // getBadgeProgress
    // =========================================================
    describe('getBadgeProgress', () => {
        it('should return current/required/percentage for a valid badge', () => {
            useUserStore.getState().setProfile({ currentStreak: 3 })

            const progress = useAchievementsStore.getState().getBadgeProgress('streak-7')
            expect(progress.current).toBe(3)
            expect(progress.required).toBe(7)
            expect(progress.percentage).toBeCloseTo(42.857, 1)
        })

        it('should cap percentage at 100', () => {
            useUserStore.getState().setProfile({ currentStreak: 50 })

            const progress = useAchievementsStore.getState().getBadgeProgress('streak-7')
            expect(progress.percentage).toBe(100)
        })

        it('should return zeros for unknown badge', () => {
            const progress = useAchievementsStore.getState().getBadgeProgress('nonexistent')
            expect(progress).toEqual({ current: 0, required: 0, percentage: 0 })
        })
    })

    // =========================================================
    // hasEarnedBadge
    // =========================================================
    describe('hasEarnedBadge', () => {
        it('should return false when badge not earned', () => {
            expect(useAchievementsStore.getState().hasEarnedBadge('streak-7')).toBe(false)
        })

        it('should return true when badge is earned', () => {
            useAchievementsStore.setState({
                earnedBadges: [{ badgeId: 'streak-7', earnedAt: Date.now() }],
            })
            expect(useAchievementsStore.getState().hasEarnedBadge('streak-7')).toBe(true)
        })
    })

    // =========================================================
    // getEarnedBadges / getAvailableBadges
    // =========================================================
    describe('getEarnedBadges / getAvailableBadges', () => {
        it('should return earned badges with full details', () => {
            useAchievementsStore.setState({
                earnedBadges: [{ badgeId: 'streak-7', earnedAt: 1000 }],
            })

            const earned = useAchievementsStore.getState().getEarnedBadges()
            expect(earned).toHaveLength(1)
            expect(earned[0].id).toBe('streak-7')
            expect(earned[0].name).toBe('Iron Will')
            expect(earned[0].earnedAt).toBe(1000)
        })

        it('should exclude earned badges from available list', () => {
            useAchievementsStore.setState({
                earnedBadges: [{ badgeId: 'streak-7', earnedAt: 1000 }],
            })

            const available = useAchievementsStore.getState().getAvailableBadges()
            expect(available.find(b => b.id === 'streak-7')).toBeUndefined()
        })

        it('should sort earned badges by most recent first', () => {
            useAchievementsStore.setState({
                earnedBadges: [
                    { badgeId: 'streak-7', earnedAt: 1000 },
                    { badgeId: 'first-workout', earnedAt: 5000 },
                ],
            })

            const earned = useAchievementsStore.getState().getEarnedBadges()
            expect(earned[0].id).toBe('first-workout')
            expect(earned[1].id).toBe('streak-7')
        })
    })

    // =========================================================
    // persist key
    // =========================================================
    describe('persist key', () => {
        it('should use gamify-gains-achievements as storage key', () => {
            const persistOptions = (useAchievementsStore as any).persist
            const name = persistOptions?.getOptions?.()?.name
            expect(name).toBe('gamify-gains-achievements')
        })
    })
})
