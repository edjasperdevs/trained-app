import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { getLocalDateString, getLocalDaysDifference } from '@/lib/dateUtils'

export type ProtocolType = 'continuous' | 'day_lock'
export type ProtocolStatus = 'active' | 'ended' | 'broken'

export interface LockedProtocol {
  id: string
  userId: string
  status: ProtocolStatus
  protocolType: ProtocolType
  goalDays: number
  startDate: string
  endDate: string | null
  longestStreak: number
  createdAt: string
}

interface LockedState {
  activeProtocol: LockedProtocol | null
  currentStreak: number
  longestStreak: number
  totalDPEarned: number
  hasLoggedToday: boolean
  isLoading: boolean
  milestonesReached: number[] // array of milestone days achieved (7, 14, 21, 30, 60, 90)

  // Actions
  fetchProtocol: () => Promise<void>
  startProtocol: (protocolType: ProtocolType, goalDays: number) => Promise<void>
  logCompliance: () => Promise<{ dpAwarded: number; milestoneReached: number | null }>
  endProtocol: () => Promise<void>
  checkMilestones: () => number | null // returns milestone day if just reached
  resetStreak: () => void
}

const MILESTONES = [7, 14, 21, 30, 60, 90]
const MILESTONE_DP: Record<number, number> = {
  7: 50,
  14: 100,
  21: 150,
  30: 250,
  60: 500,
  90: 750,
}

export const useLockedStore = create<LockedState>()(
  persist(
    (set, get) => ({
      activeProtocol: null,
      currentStreak: 0,
      longestStreak: 0,
      totalDPEarned: 0,
      hasLoggedToday: false,
      isLoading: false,
      milestonesReached: [],

      fetchProtocol: async () => {
        if (!supabase) return
        set({ isLoading: true })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          // Fetch active protocol
          const { data: protocol } = await supabase
            .from('locked_protocols')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

          if (!protocol) {
            set({ activeProtocol: null, currentStreak: 0, hasLoggedToday: false, isLoading: false })
            return
          }

          // Fetch logs for this protocol to calculate streak
          const { data: logs } = await supabase
            .from('locked_logs')
            .select('log_date, dp_awarded')
            .eq('protocol_id', protocol.id)
            .order('log_date', { ascending: false })

          const today = getLocalDateString()
          const hasLoggedToday = logs?.some(log => log.log_date === today) ?? false
          const totalDPEarned = logs?.reduce((sum, log) => sum + log.dp_awarded, 0) ?? 0

          // Calculate current streak
          let currentStreak = 0
          if (logs && logs.length > 0) {
            const sortedDates = logs.map(l => l.log_date).sort().reverse()
            let checkDate = today

            // If logged today, start from today
            // If not logged today, streak is still valid if logged yesterday
            if (hasLoggedToday) {
              currentStreak = 1
              checkDate = sortedDates[0]
              for (let i = 1; i < sortedDates.length; i++) {
                const diff = getLocalDaysDifference(sortedDates[i], checkDate)
                if (diff === 1) {
                  currentStreak++
                  checkDate = sortedDates[i]
                } else {
                  break
                }
              }
            } else {
              // Check if yesterday was logged
              const yesterday = new Date()
              yesterday.setDate(yesterday.getDate() - 1)
              const yesterdayStr = yesterday.toISOString().split('T')[0]
              if (sortedDates[0] === yesterdayStr) {
                currentStreak = 1
                checkDate = sortedDates[0]
                for (let i = 1; i < sortedDates.length; i++) {
                  const diff = getLocalDaysDifference(sortedDates[i], checkDate)
                  if (diff === 1) {
                    currentStreak++
                    checkDate = sortedDates[i]
                  } else {
                    break
                  }
                }
              }
            }
          }

          // Calculate milestones reached
          const milestonesReached = MILESTONES.filter(m => currentStreak >= m)

          set({
            activeProtocol: {
              id: protocol.id,
              userId: protocol.user_id,
              status: protocol.status as ProtocolStatus,
              protocolType: protocol.protocol_type as ProtocolType,
              goalDays: protocol.goal_days,
              startDate: protocol.start_date,
              endDate: protocol.end_date,
              longestStreak: protocol.longest_streak,
              createdAt: protocol.created_at,
            },
            currentStreak,
            longestStreak: Math.max(currentStreak, protocol.longest_streak),
            totalDPEarned,
            hasLoggedToday,
            milestonesReached,
            isLoading: false,
          })
        } catch (error) {
          console.error('Error fetching locked protocol:', error)
          set({ isLoading: false })
        }
      },

      startProtocol: async (protocolType: ProtocolType, goalDays: number) => {
        if (!supabase) throw new Error('Supabase not configured')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const today = getLocalDateString()

        const { data, error } = await supabase
          .from('locked_protocols')
          .insert({
            user_id: user.id,
            status: 'active',
            protocol_type: protocolType,
            goal_days: goalDays,
            start_date: today,
          })
          .select()
          .single()

        if (error) throw error

        set({
          activeProtocol: {
            id: data.id,
            userId: data.user_id,
            status: data.status as ProtocolStatus,
            protocolType: data.protocol_type as ProtocolType,
            goalDays: data.goal_days,
            startDate: data.start_date,
            endDate: data.end_date,
            longestStreak: data.longest_streak,
            createdAt: data.created_at,
          },
          currentStreak: 0,
          hasLoggedToday: false,
          totalDPEarned: 0,
          milestonesReached: [],
        })
      },

      logCompliance: async () => {
        const state = get()
        if (!state.activeProtocol || state.hasLoggedToday) {
          return { dpAwarded: 0, milestoneReached: null }
        }

        if (!supabase) throw new Error('Supabase not configured')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const today = getLocalDateString()
        const dpAwarded = 15 // Daily bonus

        const { error } = await supabase
          .from('locked_logs')
          .insert({
            protocol_id: state.activeProtocol.id,
            user_id: user.id,
            log_date: today,
            dp_awarded: dpAwarded,
          })

        if (error) throw error

        const newStreak = state.currentStreak + 1
        const newLongestStreak = Math.max(newStreak, state.longestStreak)

        // Update longest_streak in DB if needed
        if (newLongestStreak > state.longestStreak) {
          await supabase
            .from('locked_protocols')
            .update({ longest_streak: newLongestStreak })
            .eq('id', state.activeProtocol.id)
        }

        // Check for milestone
        const milestoneReached = MILESTONES.find(
          m => newStreak === m && !state.milestonesReached.includes(m)
        ) ?? null

        const newMilestonesReached = milestoneReached
          ? [...state.milestonesReached, milestoneReached]
          : state.milestonesReached

        set({
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          hasLoggedToday: true,
          totalDPEarned: state.totalDPEarned + dpAwarded,
          milestonesReached: newMilestonesReached,
        })

        return { dpAwarded, milestoneReached }
      },

      endProtocol: async () => {
        const state = get()
        if (!state.activeProtocol) return
        if (!supabase) throw new Error('Supabase not configured')

        await supabase
          .from('locked_protocols')
          .update({
            status: 'ended',
            end_date: getLocalDateString(),
            longest_streak: state.longestStreak,
          })
          .eq('id', state.activeProtocol.id)

        set({
          activeProtocol: null,
          currentStreak: 0,
          hasLoggedToday: false,
          totalDPEarned: 0,
          milestonesReached: [],
        })
      },

      checkMilestones: () => {
        const { currentStreak, milestonesReached } = get()
        return MILESTONES.find(m => currentStreak >= m && !milestonesReached.includes(m)) ?? null
      },

      resetStreak: () => {
        set({ currentStreak: 0 })
      },
    }),
    {
      name: 'trained-locked-protocol',
      partialize: (state) => ({
        milestonesReached: state.milestonesReached,
      }),
    }
  )
)

export { MILESTONES, MILESTONE_DP }
