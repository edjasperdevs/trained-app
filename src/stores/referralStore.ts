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

  // Actions
  fetchReferralCode: () => Promise<string>
  fetchRecruits: () => Promise<void>
  getReferralLink: () => string

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

      reset: () => {
        set({ ...INITIAL_STATE })
      },
    }),
    {
      name: 'trained-referral',
    }
  )
)
