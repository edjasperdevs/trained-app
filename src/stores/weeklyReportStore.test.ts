import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWeeklyReportStore } from './weeklyReportStore'
import { useDPStore } from './dpStore'
import { useWorkoutStore } from './workoutStore'
import { getLocalDateString, getStartOfLocalWeek } from '../lib/dateUtils'

describe('weeklyReportStore', () => {
    beforeEach(() => {
        vi.useRealTimers()
        useWeeklyReportStore.setState({
            lastShownWeekStart: null,
            lastShownDate: null,
        })
        useDPStore.setState({ dailyLogs: [], obedienceStreak: 0 })
        useWorkoutStore.setState({ workoutLogs: [] })
    })

    // =========================================================
    // getWeeklyStats
    // =========================================================
    describe('getWeeklyStats', () => {
        it('should return all zeroes with empty data', () => {
            const stats = useWeeklyReportStore.getState().getWeeklyStats()
            expect(stats.dpEarned).toBe(0)
            expect(stats.workoutsCompleted).toBe(0)
            expect(stats.proteinDaysHit).toBe(0)
            expect(stats.compliancePercentage).toBe(0)
        })

        it('should aggregate DP from dailyLogs within current week', () => {
            const weekStart = getStartOfLocalWeek()
            const weekStartStr = getLocalDateString(weekStart)

            // Add a daily log for the week start
            const dayAfterStart = new Date(weekStart)
            dayAfterStart.setDate(dayAfterStart.getDate() + 1)
            const dayAfterStr = getLocalDateString(dayAfterStart)

            useDPStore.setState({
                dailyLogs: [
                    { date: weekStartStr, training: 1, meals: 2, protein: 1, steps: 0, sleep: 0, total: 80 },
                    { date: dayAfterStr, training: 0, meals: 1, protein: 0, steps: 0, sleep: 0, total: 15 },
                ],
                obedienceStreak: 3,
            })

            const stats = useWeeklyReportStore.getState().getWeeklyStats()
            expect(stats.dpEarned).toBe(95) // 80 + 15
            expect(stats.streak).toBe(3)
        })

        it('should count completed workouts within the week', () => {
            const weekStart = getStartOfLocalWeek()
            const weekStartStr = getLocalDateString(weekStart)

            useWorkoutStore.setState({
                workoutLogs: [
                    { id: 'w1', date: weekStartStr, workoutType: 'push', dayNumber: 1, weekNumber: 1, exercises: [], completed: true, xpAwarded: true, startTime: 0, endTime: 0 },
                    { id: 'w2', date: weekStartStr, workoutType: 'pull', dayNumber: 2, weekNumber: 1, exercises: [], completed: false, xpAwarded: false, startTime: 0, endTime: 0 },
                ],
            })

            const stats = useWeeklyReportStore.getState().getWeeklyStats()
            expect(stats.workoutsCompleted).toBe(1) // Only completed ones
        })

        it('should exclude logs from outside the current week', () => {
            useDPStore.setState({
                dailyLogs: [
                    { date: '2025-01-01', training: 1, meals: 1, protein: 1, steps: 0, sleep: 0, total: 50 },
                ],
                obedienceStreak: 0,
            })

            const stats = useWeeklyReportStore.getState().getWeeklyStats()
            expect(stats.dpEarned).toBe(0)
        })
    })

    // =========================================================
    // shouldShowReport
    // =========================================================
    describe('shouldShowReport', () => {
        it('should return false on non-Sunday', () => {
            // Force to a Monday
            const monday = new Date('2026-03-09T12:00:00') // Monday
            vi.setSystemTime(monday)
            expect(useWeeklyReportStore.getState().shouldShowReport()).toBe(false)
        })

        it('should return true on Sunday if not already shown this week', () => {
            const sunday = new Date('2026-03-08T12:00:00') // Sunday
            vi.setSystemTime(sunday)
            expect(useWeeklyReportStore.getState().shouldShowReport()).toBe(true)
        })

        it('should return false on Sunday if already shown this week', () => {
            const sunday = new Date('2026-03-08T12:00:00')
            vi.setSystemTime(sunday)

            // Mark as shown
            useWeeklyReportStore.getState().markReportShown()
            expect(useWeeklyReportStore.getState().shouldShowReport()).toBe(false)
        })
    })

    // =========================================================
    // markReportShown
    // =========================================================
    describe('markReportShown', () => {
        it('should record the current week start and date', () => {
            const sunday = new Date('2026-03-08T12:00:00')
            vi.setSystemTime(sunday)

            useWeeklyReportStore.getState().markReportShown()

            const state = useWeeklyReportStore.getState()
            expect(state.lastShownWeekStart).toBeTruthy()
            expect(state.lastShownDate).toBeTruthy()
        })
    })

    // =========================================================
    // persist key
    // =========================================================
    describe('persist key', () => {
        it('should use trained-weekly-report as storage key', () => {
            const persistOptions = (useWeeklyReportStore as any).persist
            const name = persistOptions?.getOptions?.()?.name
            expect(name).toBe('trained-weekly-report')
        })
    })
})
