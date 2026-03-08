import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLockedStore, MILESTONES, MILESTONE_DP, getNextMilestone } from './lockedStore'

// Mock supabase so we can test local state logic without network calls
vi.mock('@/lib/supabase', () => ({
    supabase: null,
}))

// Mock dpStore's awardLockedDP / awardLockedMilestoneDP
vi.mock('./dpStore', () => ({
    useDPStore: {
        getState: () => ({
            awardLockedDP: vi.fn().mockReturnValue({ dpAwarded: 15, rankedUp: false }),
            awardLockedMilestoneDP: vi.fn().mockReturnValue({ dpAwarded: 50, rankedUp: false }),
        }),
    },
}))

describe('lockedStore', () => {
    beforeEach(() => {
        useLockedStore.setState({
            activeProtocol: null,
            currentStreak: 0,
            longestStreak: 0,
            totalDPEarned: 0,
            hasLoggedToday: false,
            isLoading: false,
            milestonesReached: [],
        })
    })

    // =========================================================
    // MILESTONES constants
    // =========================================================
    describe('constants', () => {
        it('should define milestones in ascending order', () => {
            expect(MILESTONES).toEqual([7, 14, 21, 30, 60, 90])
        })

        it('should have DP values for every milestone', () => {
            for (const m of MILESTONES) {
                expect(MILESTONE_DP[m]).toBeDefined()
                expect(MILESTONE_DP[m]).toBeGreaterThan(0)
            }
        })

        it('should have increasing DP values', () => {
            for (let i = 1; i < MILESTONES.length; i++) {
                expect(MILESTONE_DP[MILESTONES[i]]).toBeGreaterThan(MILESTONE_DP[MILESTONES[i - 1]])
            }
        })
    })

    // =========================================================
    // checkMilestones
    // =========================================================
    describe('checkMilestones', () => {
        it('should return null at streak 0', () => {
            expect(useLockedStore.getState().checkMilestones()).toBeNull()
        })

        it('should return 7 when streak reaches 7', () => {
            useLockedStore.setState({ currentStreak: 7, milestonesReached: [] })
            expect(useLockedStore.getState().checkMilestones()).toBe(7)
        })

        it('should skip already-reached milestones', () => {
            useLockedStore.setState({ currentStreak: 14, milestonesReached: [7] })
            expect(useLockedStore.getState().checkMilestones()).toBe(14)
        })

        it('should return null when all milestones reached for current streak', () => {
            useLockedStore.setState({ currentStreak: 14, milestonesReached: [7, 14] })
            expect(useLockedStore.getState().checkMilestones()).toBeNull()
        })

        it('should return first unreached milestones when streak exceeds multiple', () => {
            useLockedStore.setState({ currentStreak: 30, milestonesReached: [] })
            // Should return the first unreached milestone the streak qualifies for
            expect(useLockedStore.getState().checkMilestones()).toBe(7)
        })
    })

    // =========================================================
    // resetStreak
    // =========================================================
    describe('resetStreak', () => {
        it('should reset currentStreak to 0', () => {
            useLockedStore.setState({ currentStreak: 15 })
            useLockedStore.getState().resetStreak()
            expect(useLockedStore.getState().currentStreak).toBe(0)
        })
    })

    // =========================================================
    // logCompliance (local state only — supabase is null so it will throw)
    // =========================================================
    describe('logCompliance', () => {
        it('should return zero award when no active protocol', async () => {
            const result = await useLockedStore.getState().logCompliance()
            expect(result).toEqual({ dpAwarded: 0, milestoneReached: null, rankedUp: false })
        })

        it('should return zero award when already logged today', async () => {
            useLockedStore.setState({
                activeProtocol: {
                    id: 'p1', userId: 'u1', status: 'active', protocolType: 'continuous',
                    goalDays: 30, startDate: '2026-03-01', endDate: null, longestStreak: 0,
                    createdAt: '2026-03-01',
                },
                hasLoggedToday: true,
            })

            const result = await useLockedStore.getState().logCompliance()
            expect(result).toEqual({ dpAwarded: 0, milestoneReached: null, rankedUp: false })
        })
    })

    // =========================================================
    // getNextMilestone (exported utility)
    // =========================================================
    describe('getNextMilestone', () => {
        it('should return 7 for streak 0 with no milestones reached', () => {
            expect(getNextMilestone(0, [])).toBe(7)
        })

        it('should return 14 when streak is 7 and 7 already reached', () => {
            expect(getNextMilestone(7, [7])).toBe(14)
        })

        it('should return 90 when all but last are reached', () => {
            expect(getNextMilestone(60, [7, 14, 21, 30, 60])).toBe(90)
        })

        it('should return null when all milestones reached', () => {
            expect(getNextMilestone(100, [7, 14, 21, 30, 60, 90])).toBeNull()
        })

        it('should skip milestones below current streak', () => {
            expect(getNextMilestone(20, [])).toBe(21)
        })
    })

    // =========================================================
    // persist key
    // =========================================================
    describe('persist key', () => {
        it('should use trained-locked-protocol as storage key', () => {
            const persistOptions = (useLockedStore as any).persist
            const name = persistOptions?.getOptions?.()?.name
            expect(name).toBe('trained-locked-protocol')
        })
    })
})
