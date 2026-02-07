import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import type { XPSource, WorkoutType } from '@/lib/database.types'
import { getMockClientDetails } from '@/lib/devSeed'

const devBypass = import.meta.env.VITE_DEV_BYPASS === 'true'

export interface WeightData {
  date: string
  weight: number
}

export interface MacroLogData {
  date: string
  protein: number
  calories: number
}

export interface MacroTargets {
  protein: number
  calories: number
}

export interface MacroAdherence {
  logs: MacroLogData[]
  targets: MacroTargets | null
}

export interface ActivityItem {
  id: string
  date: string
  type: 'workout' | 'weight' | 'xp'
  description: string
  detail?: string
  xpAmount?: number
  xpSource?: XPSource
  workoutType?: WorkoutType
}

interface ClientDetailsCache {
  weight: { data: WeightData[]; fetchedAt: number } | null
  macros: { data: MacroAdherence; fetchedAt: number } | null
  activity: { data: ActivityItem[]; fetchedAt: number } | null
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const clientCache = new Map<string, ClientDetailsCache>()

function getCache(clientId: string): ClientDetailsCache {
  if (!clientCache.has(clientId)) {
    clientCache.set(clientId, { weight: null, macros: null, activity: null })
  }
  return clientCache.get(clientId)!
}

function isCacheValid(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < CACHE_TTL
}

export function useClientDetails(clientId: string | null) {
  const [weightData, setWeightData] = useState<WeightData[]>([])
  const [macroData, setMacroData] = useState<MacroAdherence>({ logs: [], targets: null })
  const [activityData, setActivityData] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentClientRef = useRef<string | null>(null)

  const fetchClientWeight = useCallback(async (id: string, days: number = 30): Promise<WeightData[]> => {
    const cache = getCache(id)
    if (cache.weight && isCacheValid(cache.weight.fetchedAt)) {
      return cache.weight.data
    }

    const client = getSupabaseClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    const { data, error } = await client
      .from('weight_logs')
      .select('date, weight')
      .eq('user_id', id)
      .gte('date', cutoffStr)
      .order('date', { ascending: true })

    if (error) throw error

    const result: WeightData[] = (data || []).map(d => ({
      date: d.date,
      weight: d.weight
    }))

    cache.weight = { data: result, fetchedAt: Date.now() }
    return result
  }, [])

  const fetchClientMacros = useCallback(async (id: string, days: number = 14): Promise<MacroAdherence> => {
    const cache = getCache(id)
    if (cache.macros && isCacheValid(cache.macros.fetchedAt)) {
      return cache.macros.data
    }

    const client = getSupabaseClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    const [logsResult, targetsResult] = await Promise.all([
      client
        .from('daily_macro_logs')
        .select('date, protein, calories')
        .eq('user_id', id)
        .gte('date', cutoffStr)
        .order('date', { ascending: true }),
      client
        .from('macro_targets')
        .select('protein, calories')
        .eq('user_id', id)
        .single()
    ])

    if (logsResult.error) throw logsResult.error

    const logs: MacroLogData[] = (logsResult.data || []).map(d => ({
      date: d.date,
      protein: d.protein,
      calories: d.calories
    }))

    const targets: MacroTargets | null = targetsResult.data
      ? { protein: targetsResult.data.protein, calories: targetsResult.data.calories }
      : null

    const result: MacroAdherence = { logs, targets }
    cache.macros = { data: result, fetchedAt: Date.now() }
    return result
  }, [])

  const fetchClientActivity = useCallback(async (id: string, limit: number = 15): Promise<ActivityItem[]> => {
    const cache = getCache(id)
    if (cache.activity && isCacheValid(cache.activity.fetchedAt)) {
      return cache.activity.data
    }

    const client = getSupabaseClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    const [workoutsResult, weightsResult, xpResult] = await Promise.all([
      client
        .from('workout_logs')
        .select('id, date, workout_type, duration_minutes, completed')
        .eq('user_id', id)
        .eq('completed', true)
        .gte('date', cutoffStr)
        .order('date', { ascending: false })
        .limit(limit),
      client
        .from('weight_logs')
        .select('id, date, weight')
        .eq('user_id', id)
        .gte('date', cutoffStr)
        .order('date', { ascending: false })
        .limit(limit),
      client
        .from('xp_logs')
        .select('id, date, source, amount')
        .eq('user_id', id)
        .gte('date', cutoffStr)
        .order('date', { ascending: false })
        .limit(limit)
    ])

    if (workoutsResult.error) throw workoutsResult.error
    if (weightsResult.error) throw weightsResult.error
    if (xpResult.error) throw xpResult.error

    const activities: ActivityItem[] = []

    // Add workouts
    for (const w of workoutsResult.data || []) {
      const workoutName = w.workout_type.charAt(0).toUpperCase() + w.workout_type.slice(1)
      activities.push({
        id: `workout-${w.id}`,
        date: w.date,
        type: 'workout',
        description: `${workoutName} workout`,
        detail: w.duration_minutes ? `${w.duration_minutes} min` : undefined,
        workoutType: w.workout_type
      })
    }

    // Add weights
    for (const w of weightsResult.data || []) {
      activities.push({
        id: `weight-${w.id}`,
        date: w.date,
        type: 'weight',
        description: 'Logged weight',
        detail: `${w.weight} lbs`
      })
    }

    // Add XP (excluding workout XP to avoid duplicates)
    for (const x of xpResult.data || []) {
      const sourceLabels: Record<XPSource, string> = {
        workout: 'Workout completed',
        protein: 'Hit protein target',
        calories: 'Hit calorie target',
        checkin: 'Daily check-in',
        claim: 'XP claimed'
      }
      activities.push({
        id: `xp-${x.id}`,
        date: x.date,
        type: 'xp',
        description: sourceLabels[x.source],
        xpAmount: x.amount,
        xpSource: x.source
      })
    }

    // Sort by date (newest first) and limit
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const result = activities.slice(0, limit)

    cache.activity = { data: result, fetchedAt: Date.now() }
    return result
  }, [])

  const fetchAll = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      if (devBypass) {
        const mock = getMockClientDetails(id)
        if (currentClientRef.current === id) {
          setWeightData(mock.weightData)
          setMacroData(mock.macroData)
          setActivityData(mock.activityData as ActivityItem[])
        }
        return
      }

      const [weight, macros, activity] = await Promise.all([
        fetchClientWeight(id),
        fetchClientMacros(id),
        fetchClientActivity(id)
      ])

      // Only update state if this is still the current client
      if (currentClientRef.current === id) {
        setWeightData(weight)
        setMacroData(macros)
        setActivityData(activity)
      }
    } catch (err) {
      console.error('Error fetching client details:', err)
      if (currentClientRef.current === id) {
        setError(err instanceof Error ? err.message : 'Failed to load client data')
      }
    } finally {
      if (currentClientRef.current === id) {
        setIsLoading(false)
      }
    }
  }, [fetchClientWeight, fetchClientMacros, fetchClientActivity])

  const refresh = useCallback(() => {
    if (clientId) {
      // Clear cache for this client
      clientCache.delete(clientId)
      fetchAll(clientId)
    }
  }, [clientId, fetchAll])

  useEffect(() => {
    currentClientRef.current = clientId

    if (clientId) {
      fetchAll(clientId)
    } else {
      setWeightData([])
      setMacroData({ logs: [], targets: null })
      setActivityData([])
      setError(null)
    }

    return () => {
      currentClientRef.current = null
    }
  }, [clientId, fetchAll])

  return {
    weightData,
    macroData,
    activityData,
    isLoading,
    error,
    refresh
  }
}
