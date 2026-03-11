import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import { useUserStore } from './userStore'
import type { ReferralStatus } from '@/lib/database.types'

export interface Recruit {
  id: string
  callsign: string | null
  rank: number
  status: ReferralStatus
  dpEarned: number
  createdAt: string
  completedAt: string | null
}

interface ReferralStore {
  referralCode: string | null
  recruits: Recruit[]
  isLoading: boolean
  capturedReferralCode: string | null // Code captured from deep link (pre-signup)

  // Actions
  fetchReferralCode: () => Promise<string>
  fetchRecruits: () => Promise<void>
  getReferralLink: () => string
  setCapturedCode: (code: string) => void // Store captured code
  clearCapturedCode: () => void
  attributeReferral: () => Promise<void> // Create referral record post-signup
  grantReferralPremium: () => Promise<void> // Trigger 7-day premium grant for referred user
  checkRecruitCompletion: () => Promise<void> // Check pending recruits for completion

  // Computed helpers
  pendingCount: () => number
  completedCount: () => number
  totalDPEarned: () => number

  // Reset
  reset: () => void
}

/**
 * Generate a 4-character alphanumeric suffix (A-Z, 0-9)
 */
function generateSuffix(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return suffix
}

const INITIAL_STATE = {
  referralCode: null as string | null,
  recruits: [] as Recruit[],
  isLoading: false,
  capturedReferralCode: null as string | null,
}

export const useReferralStore = create<ReferralStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      fetchReferralCode: async (): Promise<string> => {
        const user = useAuthStore.getState().user
        if (!user || !supabase) {
          return ''
        }

        set({ isLoading: true })

        try {
          // Query profiles for existing referral_code
          const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('referral_code, username')
            .eq('id', user.id)
            .single()

          if (fetchError) {
            console.error('Error fetching referral code:', fetchError)
            set({ isLoading: false })
            return ''
          }

          // If code exists, return it
          if (profile?.referral_code) {
            set({ referralCode: profile.referral_code, isLoading: false })
            return profile.referral_code
          }

          // Generate new code
          const username = profile?.username || useUserStore.getState().profile?.username || 'USER'
          const baseName = username.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'USER'
          const newCode = `${baseName}-${generateSuffix()}`

          // Update profiles with new code
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ referral_code: newCode })
            .eq('id', user.id)

          if (updateError) {
            console.error('Error saving referral code:', updateError)
            set({ isLoading: false })
            return ''
          }

          set({ referralCode: newCode, isLoading: false })
          return newCode
        } catch (error) {
          console.error('Error in fetchReferralCode:', error)
          set({ isLoading: false })
          return ''
        }
      },

      fetchRecruits: async (): Promise<void> => {
        const user = useAuthStore.getState().user
        if (!user || !supabase) {
          return
        }

        set({ isLoading: true })

        try {
          // Query referrals where user is the referrer
          // Join with profiles to get recruit username (callsign) and user_xp for rank
          const { data: referrals, error } = await supabase
            .from('referrals')
            .select(`
              id,
              created_at,
              status,
              completed_at,
              dp_awarded,
              recruit_id,
              profiles!referrals_recruit_id_fkey (
                username
              ),
              user_xp!inner (
                current_level
              )
            `)
            .eq('referrer_id', user.id)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Error fetching recruits:', error)
            set({ isLoading: false })
            return
          }

          // Map to Recruit interface
          const recruits: Recruit[] = (referrals || []).map((r) => {
            // Handle joined data (profiles and user_xp may be null or arrays)
            const profileData = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
            const xpData = Array.isArray(r.user_xp) ? r.user_xp[0] : r.user_xp

            return {
              id: r.id,
              callsign: profileData?.username || null,
              rank: xpData?.current_level || 0,
              status: r.status as ReferralStatus,
              dpEarned: r.dp_awarded,
              createdAt: r.created_at,
              completedAt: r.completed_at,
            }
          })

          set({ recruits, isLoading: false })
        } catch (error) {
          console.error('Error in fetchRecruits:', error)
          set({ isLoading: false })
        }
      },

      getReferralLink: (): string => {
        const code = get().referralCode
        if (!code) return ''
        return `https://app.welltrained.fitness/join/${code}`
      },

      pendingCount: (): number => {
        return get().recruits.filter(r => r.status === 'pending').length
      },

      completedCount: (): number => {
        return get().recruits.filter(r => r.status === 'completed').length
      },

      totalDPEarned: (): number => {
        return get().recruits.reduce((sum, r) => sum + r.dpEarned, 0)
      },

      setCapturedCode: (code: string): void => {
        // Validate code format (contains hyphen, alphanumeric)
        if (!code || !code.includes('-')) {
          console.warn('[referralStore] Invalid referral code format:', code)
          return
        }
        // Check alphanumeric pattern (CALLSIGN-XXXX format)
        const isValidFormat = /^[A-Z0-9]+-[A-Z0-9]{4}$/i.test(code)
        if (!isValidFormat) {
          console.warn('[referralStore] Invalid referral code format:', code)
          return
        }
        set({ capturedReferralCode: code.toUpperCase() })
      },

      clearCapturedCode: (): void => {
        set({ capturedReferralCode: null })
      },

      attributeReferral: async (): Promise<void> => {
        const { capturedReferralCode } = get()
        if (!capturedReferralCode || !supabase) {
          return
        }

        const user = useAuthStore.getState().user
        if (!user) {
          console.warn('[referralStore] No user for referral attribution')
          return
        }

        try {
          // Query profiles to find referrer by referral_code
          const { data: referrerProfile, error: referrerError } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', capturedReferralCode)
            .single()

          if (referrerError || !referrerProfile) {
            console.warn('[referralStore] Referrer not found for code:', capturedReferralCode)
            get().clearCapturedCode()
            return
          }

          // Don't allow self-referral
          if (referrerProfile.id === user.id) {
            console.warn('[referralStore] Self-referral not allowed')
            get().clearCapturedCode()
            return
          }

          // Insert into referrals table
          const { error: insertError } = await supabase
            .from('referrals')
            .insert({
              referrer_id: referrerProfile.id,
              recruit_id: user.id,
              referral_code_used: capturedReferralCode,
              status: 'pending',
            })

          if (insertError) {
            // Handle duplicate gracefully (user already referred)
            if (insertError.code === '23505') {
              console.log('[referralStore] User already has a referral record')
            } else {
              console.error('[referralStore] Error creating referral:', insertError)
            }
          }

          // Clear captured code after successful insert or handled duplicate
          get().clearCapturedCode()
        } catch (error) {
          console.error('[referralStore] Error in attributeReferral:', error)
        }
      },

      grantReferralPremium: async (): Promise<void> => {
        const user = useAuthStore.getState().user
        if (!user || !supabase) {
          return
        }

        try {
          // Fire-and-forget call to Edge Function
          const { error } = await supabase.functions.invoke('grant-referral-premium', {
            body: { userId: user.id },
          })

          if (error) {
            console.error('[referralStore] Grant premium error:', error)
          } else {
            console.log('[referralStore] Promotional premium grant initiated')
            // Refresh subscription state to pick up new entitlement
            const { useSubscriptionStore } = await import('./subscriptionStore')
            useSubscriptionStore.getState().checkEntitlements()
          }
        } catch (error) {
          console.error('[referralStore] Grant premium error:', error)
        }
      },

      checkRecruitCompletion: async (): Promise<void> => {
        const user = useAuthStore.getState().user
        if (!user || !supabase) {
          return
        }

        try {
          // Call Edge Function to check for completed recruits
          // Pass empty body to ensure POST request with auth headers
          const { data, error } = await supabase.functions.invoke('check-recruit-completion', {
            body: {},
          })

          if (error) {
            console.error('[referralStore] Check completion error:', error)
            return
          }

          // Award DP for each completed recruit
          if (data?.completed && data.completed.length > 0) {
            const { useDPStore } = await import('./dpStore')
            for (const recruitId of data.completed) {
              const result = useDPStore.getState().awardReferralDP(recruitId)
              if (result.dpAwarded > 0) {
                console.log('[referralStore] Awarded referral DP for recruit:', recruitId)
              }
            }

            // Refresh recruits list to show updated status
            get().fetchRecruits()
          }
        } catch (error) {
          console.error('[referralStore] Check completion error:', error)
        }
      },

      reset: () => {
        set({ ...INITIAL_STATE })
      },
    }),
    {
      name: 'trained-referral',
      partialize: (state) => ({
        // Persist capturedReferralCode so it survives app restart before signup completes
        capturedReferralCode: state.capturedReferralCode,
      }),
    }
  )
)
