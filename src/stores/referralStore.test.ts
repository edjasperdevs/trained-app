import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useReferralStore } from './referralStore'

// Mock supabase and auth
vi.mock('@/lib/supabase', () => ({ supabase: null }))
vi.mock('./authStore', () => ({
    useAuthStore: { getState: () => ({ user: null }) },
}))
vi.mock('./userStore', () => ({
    useUserStore: { getState: () => ({ profile: { username: 'TESTUSER' } }) },
}))

describe('referralStore', () => {
    beforeEach(() => {
        useReferralStore.setState({
            referralCode: null,
            recruits: [],
            isLoading: false,
            capturedReferralCode: null,
        })
    })

    // =========================================================
    // getReferralLink
    // =========================================================
    describe('getReferralLink', () => {
        it('should return empty string when no referral code', () => {
            expect(useReferralStore.getState().getReferralLink()).toBe('')
        })

        it('should construct correct URL with code', () => {
            useReferralStore.setState({ referralCode: 'JASPER-A1B2' })
            expect(useReferralStore.getState().getReferralLink()).toBe(
                'https://app.welltrained.fitness/join/JASPER-A1B2'
            )
        })
    })

    // =========================================================
    // pendingCount / completedCount / totalDPEarned
    // =========================================================
    describe('computed helpers', () => {
        beforeEach(() => {
            useReferralStore.setState({
                recruits: [
                    { id: 'r1', callsign: 'ALPHA', rank: 2, status: 'pending', dpEarned: 0, createdAt: '2026-01-01', completedAt: null },
                    { id: 'r2', callsign: 'BRAVO', rank: 5, status: 'completed', dpEarned: 100, createdAt: '2026-01-02', completedAt: '2026-01-15' },
                    { id: 'r3', callsign: 'CHARLIE', rank: 1, status: 'pending', dpEarned: 0, createdAt: '2026-01-03', completedAt: null },
                    { id: 'r4', callsign: 'DELTA', rank: 8, status: 'completed', dpEarned: 150, createdAt: '2026-01-04', completedAt: '2026-01-20' },
                ],
            })
        })

        it('should count pending recruits', () => {
            expect(useReferralStore.getState().pendingCount()).toBe(2)
        })

        it('should count completed recruits', () => {
            expect(useReferralStore.getState().completedCount()).toBe(2)
        })

        it('should sum DP earned from all recruits', () => {
            expect(useReferralStore.getState().totalDPEarned()).toBe(250)
        })

        it('should return 0 for empty recruits', () => {
            useReferralStore.setState({ recruits: [] })
            expect(useReferralStore.getState().pendingCount()).toBe(0)
            expect(useReferralStore.getState().completedCount()).toBe(0)
            expect(useReferralStore.getState().totalDPEarned()).toBe(0)
        })
    })

    // =========================================================
    // setCapturedCode / clearCapturedCode
    // =========================================================
    describe('setCapturedCode', () => {
        it('should store a valid CALLSIGN-XXXX code uppercased', () => {
            useReferralStore.getState().setCapturedCode('jasper-a1b2')
            expect(useReferralStore.getState().capturedReferralCode).toBe('JASPER-A1B2')
        })

        it('should reject code without hyphen', () => {
            useReferralStore.getState().setCapturedCode('JASPERA1B2')
            expect(useReferralStore.getState().capturedReferralCode).toBeNull()
        })

        it('should reject empty string', () => {
            useReferralStore.getState().setCapturedCode('')
            expect(useReferralStore.getState().capturedReferralCode).toBeNull()
        })

        it('should reject code with invalid suffix length', () => {
            useReferralStore.getState().setCapturedCode('JASPER-AB')
            expect(useReferralStore.getState().capturedReferralCode).toBeNull()
        })
    })

    describe('clearCapturedCode', () => {
        it('should clear the captured code', () => {
            useReferralStore.setState({ capturedReferralCode: 'JASPER-A1B2' })
            useReferralStore.getState().clearCapturedCode()
            expect(useReferralStore.getState().capturedReferralCode).toBeNull()
        })
    })

    // =========================================================
    // reset
    // =========================================================
    describe('reset', () => {
        it('should return store to initial state', () => {
            useReferralStore.setState({
                referralCode: 'JASPER-A1B2',
                recruits: [{ id: 'r1', callsign: 'ALPHA', rank: 2, status: 'pending', dpEarned: 0, createdAt: '2026-01-01', completedAt: null }],
                isLoading: true,
                capturedReferralCode: 'FOO-1234',
            })

            useReferralStore.getState().reset()

            const state = useReferralStore.getState()
            expect(state.referralCode).toBeNull()
            expect(state.recruits).toHaveLength(0)
            expect(state.isLoading).toBe(false)
            expect(state.capturedReferralCode).toBeNull()
        })
    })

    // =========================================================
    // persist key
    // =========================================================
    describe('persist key', () => {
        it('should use trained-referral as storage key', () => {
            const persistOptions = (useReferralStore as any).persist
            const name = persistOptions?.getOptions?.()?.name
            expect(name).toBe('trained-referral')
        })
    })
})
