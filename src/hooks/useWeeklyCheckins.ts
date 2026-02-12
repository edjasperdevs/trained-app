import { useState, useCallback, useRef, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import type { WeeklyCheckin } from '@/lib/database.types'
import { mockWeeklyCheckins } from '@/lib/devSeed'
import { getLocalDateString } from '@/lib/dateUtils'

const devBypass = import.meta.env.VITE_DEV_BYPASS === 'true'

// Cache pattern (matches useCoachTemplates)
const checkinCache = new Map<string, { data: WeeklyCheckin[]; fetchedAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function isCacheValid(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < CACHE_TTL
}

// Mutable mock store for dev bypass
const devCheckins: WeeklyCheckin[] = [...mockWeeklyCheckins]

/**
 * Get the Monday of the current week in local timezone.
 * Returns YYYY-MM-DD string. week_of is always a Monday.
 */
export function getCurrentMonday(): string {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day // If Sunday, go back 6 days; otherwise go to Monday
  const monday = new Date(now)
  monday.setDate(monday.getDate() + diff)
  return getLocalDateString(monday)
}

/** Pending check-in with client info attached (for coach view) */
export interface PendingCheckin extends WeeklyCheckin {
  client_username: string | null
  client_email: string | null
}

export function useWeeklyCheckins() {
  const [pendingCheckins, setPendingCheckins] = useState<PendingCheckin[]>([])
  const [clientCheckins, setClientCheckins] = useState<WeeklyCheckin[]>([])
  const [myCheckins, setMyCheckins] = useState<WeeklyCheckin[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // ==========================================
  // Client functions
  // ==========================================

  const submitCheckin = useCallback(async (
    formData: Partial<WeeklyCheckin>,
    autoData: Partial<WeeklyCheckin>
  ): Promise<{ error: string | null }> => {
    try {
      if (devBypass) {
        const weekOf = getCurrentMonday()
        const existingIdx = devCheckins.findIndex(
          c => c.client_id === 'mock-client-sarah' && c.week_of === weekOf
        )
        const checkin: WeeklyCheckin = {
          id: existingIdx !== -1 ? devCheckins[existingIdx].id : `checkin-${Date.now()}`,
          created_at: existingIdx !== -1 ? devCheckins[existingIdx].created_at : new Date().toISOString(),
          updated_at: new Date().toISOString(),
          client_id: 'mock-client-sarah',
          coach_id: 'mock-coach-id',
          week_of: weekOf,
          status: 'submitted',
          water_intake: null,
          caffeine_intake: null,
          hunger_level: null,
          slip_ups: null,
          refeed_date: null,
          digestion: null,
          training_progress: null,
          training_feedback: null,
          recovery_soreness: null,
          sleep_quality: null,
          sleep_hours: null,
          stress_level: null,
          stressors: null,
          mental_health: null,
          injuries: null,
          cycle_status: null,
          side_effects: null,
          bloodwork_date: null,
          open_feedback: null,
          auto_weight_current: null,
          auto_weight_weekly_avg: null,
          auto_weight_change: null,
          auto_step_avg: null,
          auto_macro_hit_rate: null,
          auto_cardio_sessions: null,
          auto_workouts_completed: null,
          coach_response: null,
          reviewed_at: null,
          ...formData,
          ...autoData,
        }
        if (existingIdx !== -1) {
          devCheckins[existingIdx] = checkin
        } else {
          devCheckins.unshift(checkin)
        }
        return { error: null }
      }

      const client = getSupabaseClient()
      const { data: { user } } = await client.auth.getUser()
      if (!user) return { error: 'Not authenticated' }

      // Look up coach_id from coach_clients
      const { data: relationship } = await client
        .from('coach_clients')
        .select('coach_id')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .single()

      const weekOf = getCurrentMonday()

      const { error: upsertError } = await client
        .from('weekly_checkins')
        .upsert(
          {
            client_id: user.id,
            coach_id: relationship?.coach_id || null,
            week_of: weekOf,
            status: 'submitted' as const,
            ...formData,
            ...autoData,
          },
          { onConflict: 'client_id,week_of' }
        )

      if (upsertError) return { error: upsertError.message }

      // Invalidate cache
      checkinCache.delete(`my-${user.id}`)
      return { error: null }
    } catch (err) {
      console.error('Error submitting check-in:', err)
      return { error: err instanceof Error ? err.message : 'Failed to submit check-in' }
    }
  }, [])

  const fetchMyCheckins = useCallback(async (): Promise<WeeklyCheckin[]> => {
    setIsLoading(true)
    setError(null)

    try {
      if (devBypass) {
        // Return check-ins for mock client sarah (simulating logged-in client)
        const mine = devCheckins
          .filter(c => c.client_id === 'mock-client-sarah')
          .sort((a, b) => b.week_of.localeCompare(a.week_of))
        if (mountedRef.current) {
          setMyCheckins(mine)
        }
        return mine
      }

      const client = getSupabaseClient()
      const { data: { user } } = await client.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check cache
      const cacheKey = `my-${user.id}`
      const cached = checkinCache.get(cacheKey)
      if (cached && isCacheValid(cached.fetchedAt)) {
        if (mountedRef.current) {
          setMyCheckins(cached.data)
        }
        return cached.data
      }

      const { data, error: fetchError } = await client
        .from('weekly_checkins')
        .select('*')
        .eq('client_id', user.id)
        .order('week_of', { ascending: false })
        .limit(10)

      if (fetchError) throw fetchError

      const result = (data || []) as WeeklyCheckin[]
      checkinCache.set(cacheKey, { data: result, fetchedAt: Date.now() })

      if (mountedRef.current) {
        setMyCheckins(result)
      }
      return result
    } catch (err) {
      console.error('Error fetching my check-ins:', err)
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load check-ins')
      }
      return []
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const hasCheckinForCurrentWeek = useCallback(async (): Promise<boolean> => {
    try {
      const monday = getCurrentMonday()

      if (devBypass) {
        return devCheckins.some(
          c => c.client_id === 'mock-client-sarah' && c.week_of === monday
        )
      }

      const client = getSupabaseClient()
      const { data: { user } } = await client.auth.getUser()
      if (!user) return false

      const { data, error: fetchError } = await client
        .from('weekly_checkins')
        .select('id')
        .eq('client_id', user.id)
        .eq('week_of', monday)
        .maybeSingle()

      if (fetchError) {
        console.error('Error checking current week check-in:', fetchError)
        return false
      }

      return data !== null
    } catch (err) {
      console.error('Error checking current week check-in:', err)
      return false
    }
  }, [])

  /** Check if current user has an active coach relationship */
  const isCoachingClient = useCallback(async (): Promise<boolean> => {
    try {
      if (devBypass) return true

      const client = getSupabaseClient()
      const { data: { user } } = await client.auth.getUser()
      if (!user) return false

      const { data } = await client
        .from('coach_clients')
        .select('id')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      return data !== null
    } catch {
      return false
    }
  }, [])

  // ==========================================
  // Coach functions
  // ==========================================

  const fetchPendingCheckins = useCallback(async (): Promise<PendingCheckin[]> => {
    setIsLoading(true)
    setError(null)

    try {
      if (devBypass) {
        const pending = devCheckins
          .filter(c => c.status === 'submitted')
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map(c => {
            // Attach mock client info
            const clientNames: Record<string, { username: string; email: string }> = {
              'mock-client-sarah': { username: 'SarahLifts', email: 'sarah@example.com' },
              'mock-client-mike': { username: 'MikeG', email: 'mike@example.com' },
              'mock-client-jake': { username: 'JakeR', email: 'jake@example.com' },
            }
            const info = clientNames[c.client_id] || { username: null, email: null }
            return {
              ...c,
              client_username: info.username,
              client_email: info.email,
            }
          })
        if (mountedRef.current) {
          setPendingCheckins(pending)
        }
        return pending
      }

      const client = getSupabaseClient()

      const { data, error: fetchError } = await client
        .from('weekly_checkins')
        .select(`
          *,
          profiles!weekly_checkins_client_id_fkey(username, email)
        `)
        .eq('status', 'submitted')
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      const result: PendingCheckin[] = (data || []).map((row: Record<string, unknown>) => {
        const profiles = row.profiles as { username: string | null; email: string | null } | null
        return {
          ...(row as unknown as WeeklyCheckin),
          client_username: profiles?.username || null,
          client_email: profiles?.email || null,
        }
      })

      if (mountedRef.current) {
        setPendingCheckins(result)
      }
      return result
    } catch (err) {
      console.error('Error fetching pending check-ins:', err)
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load pending check-ins')
      }
      return []
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const fetchClientCheckins = useCallback(async (clientId: string): Promise<WeeklyCheckin[]> => {
    setIsLoading(true)
    setError(null)

    try {
      if (devBypass) {
        const checkins = devCheckins
          .filter(c => c.client_id === clientId)
          .sort((a, b) => b.week_of.localeCompare(a.week_of))
        if (mountedRef.current) {
          setClientCheckins(checkins)
        }
        return checkins
      }

      const client = getSupabaseClient()

      // Check cache
      const cacheKey = `client-${clientId}`
      const cached = checkinCache.get(cacheKey)
      if (cached && isCacheValid(cached.fetchedAt)) {
        if (mountedRef.current) {
          setClientCheckins(cached.data)
        }
        return cached.data
      }

      const { data, error: fetchError } = await client
        .from('weekly_checkins')
        .select('*')
        .eq('client_id', clientId)
        .order('week_of', { ascending: false })

      if (fetchError) throw fetchError

      const result = (data || []) as WeeklyCheckin[]
      checkinCache.set(cacheKey, { data: result, fetchedAt: Date.now() })

      if (mountedRef.current) {
        setClientCheckins(result)
      }
      return result
    } catch (err) {
      console.error('Error fetching client check-ins:', err)
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load client check-ins')
      }
      return []
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const submitReview = useCallback(async (
    checkinId: string,
    coachResponse: string
  ): Promise<{ error: string | null }> => {
    try {
      if (devBypass) {
        const idx = devCheckins.findIndex(c => c.id === checkinId)
        if (idx !== -1) {
          devCheckins[idx] = {
            ...devCheckins[idx],
            status: 'reviewed',
            coach_response: coachResponse,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
        return { error: null }
      }

      const client = getSupabaseClient()

      const { error: updateError } = await client
        .from('weekly_checkins')
        .update({
          coach_response: coachResponse,
          status: 'reviewed' as const,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', checkinId)

      if (updateError) return { error: updateError.message }

      // Invalidate all caches (pending list + client-specific)
      checkinCache.clear()
      return { error: null }
    } catch (err) {
      console.error('Error submitting review:', err)
      return { error: err instanceof Error ? err.message : 'Failed to submit review' }
    }
  }, [])

  return {
    pendingCheckins,
    clientCheckins,
    myCheckins,
    isLoading,
    error,
    submitCheckin,
    fetchMyCheckins,
    hasCheckinForCurrentWeek,
    isCoachingClient,
    fetchPendingCheckins,
    fetchClientCheckins,
    submitReview,
  }
}
