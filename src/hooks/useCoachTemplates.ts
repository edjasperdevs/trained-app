import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import type { WorkoutTemplate, AssignedWorkout, PrescribedExercise, Json } from '@/lib/database.types'
import { mockWorkoutTemplates, mockAssignedWorkouts } from '@/lib/devSeed'

const devBypass = import.meta.env.VITE_DEV_BYPASS === 'true'

// Cache pattern (matches useClientDetails)
const templateCache = new Map<string, { data: WorkoutTemplate[]; fetchedAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function isCacheValid(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < CACHE_TTL
}

// Mutable mock store for dev bypass
const devTemplates: WorkoutTemplate[] = [...mockWorkoutTemplates]
const devAssignments: AssignedWorkout[] = [...mockAssignedWorkouts]

export function useCoachTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchTemplates = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      if (devBypass) {
        if (mountedRef.current) {
          setTemplates([...devTemplates])
        }
        return
      }

      // Check cache
      const cacheKey = 'coach-templates'
      const cached = templateCache.get(cacheKey)
      if (cached && isCacheValid(cached.fetchedAt)) {
        if (mountedRef.current) {
          setTemplates(cached.data)
        }
        return
      }

      const client = getSupabaseClient()
      const { data: { user } } = await client.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: fetchError } = await client
        .from('workout_templates')
        .select('*')
        .eq('coach_id', user.id)
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      const result: WorkoutTemplate[] = (data || []).map(row => ({
        id: row.id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        coach_id: row.coach_id,
        name: row.name,
        exercises: (row.exercises as unknown as PrescribedExercise[]) || [],
      }))

      templateCache.set(cacheKey, { data: result, fetchedAt: Date.now() })

      if (mountedRef.current) {
        setTemplates(result)
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const createTemplate = useCallback(async (
    name: string,
    exercises: PrescribedExercise[]
  ): Promise<WorkoutTemplate | null> => {
    try {
      if (devBypass) {
        const newTemplate: WorkoutTemplate = {
          id: `tmpl-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          coach_id: 'mock-coach-id',
          name,
          exercises,
        }
        devTemplates.unshift(newTemplate)
        if (mountedRef.current) {
          setTemplates([...devTemplates])
        }
        return newTemplate
      }

      const client = getSupabaseClient()
      const { data: { user } } = await client.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: insertError } = await client
        .from('workout_templates')
        .insert({
          coach_id: user.id,
          name,
          exercises: JSON.parse(JSON.stringify(exercises)) as Json,
        })
        .select()
        .single()

      if (insertError) throw insertError

      const result: WorkoutTemplate = {
        id: data.id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        coach_id: data.coach_id,
        name: data.name,
        exercises: (data.exercises as unknown as PrescribedExercise[]) || [],
      }

      // Invalidate cache
      templateCache.delete('coach-templates')

      if (mountedRef.current) {
        setTemplates(prev => [result, ...prev])
      }

      return result
    } catch (err) {
      console.error('Error creating template:', err)
      return null
    }
  }, [])

  const updateTemplate = useCallback(async (
    id: string,
    updates: { name?: string; exercises?: PrescribedExercise[] }
  ): Promise<void> => {
    try {
      if (devBypass) {
        const idx = devTemplates.findIndex(t => t.id === id)
        if (idx !== -1) {
          if (updates.name !== undefined) devTemplates[idx].name = updates.name
          if (updates.exercises !== undefined) devTemplates[idx].exercises = updates.exercises
          devTemplates[idx].updated_at = new Date().toISOString()
          if (mountedRef.current) {
            setTemplates([...devTemplates])
          }
        }
        return
      }

      const client = getSupabaseClient()
      const updatePayload: { name?: string; exercises?: Json } = {}
      if (updates.name !== undefined) updatePayload.name = updates.name
      if (updates.exercises !== undefined) updatePayload.exercises = JSON.parse(JSON.stringify(updates.exercises)) as Json

      const { error: updateError } = await client
        .from('workout_templates')
        .update(updatePayload)
        .eq('id', id)

      if (updateError) throw updateError

      // Invalidate cache
      templateCache.delete('coach-templates')

      // Update local state
      if (mountedRef.current) {
        setTemplates(prev => prev.map(t =>
          t.id === id
            ? { ...t, ...updates, updated_at: new Date().toISOString() }
            : t
        ))
      }
    } catch (err) {
      console.error('Error updating template:', err)
      throw err
    }
  }, [])

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      if (devBypass) {
        const idx = devTemplates.findIndex(t => t.id === id)
        if (idx !== -1) {
          devTemplates.splice(idx, 1)
          if (mountedRef.current) {
            setTemplates([...devTemplates])
          }
        }
        return
      }

      const client = getSupabaseClient()
      const { error: deleteError } = await client
        .from('workout_templates')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Invalidate cache
      templateCache.delete('coach-templates')

      if (mountedRef.current) {
        setTemplates(prev => prev.filter(t => t.id !== id))
      }
    } catch (err) {
      console.error('Error deleting template:', err)
      throw err
    }
  }, [])

  const checkExistingAssignment = useCallback(async (
    clientId: string,
    date: string
  ): Promise<AssignedWorkout | null> => {
    try {
      if (devBypass) {
        const existing = devAssignments.find(
          a => a.client_id === clientId && a.date === date
        )
        return existing
          ? { ...existing, exercises: [...existing.exercises] }
          : null
      }

      const client = getSupabaseClient()
      const { data, error: fetchError } = await client
        .from('assigned_workouts')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', date)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!data) return null

      return {
        id: data.id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        coach_id: data.coach_id,
        client_id: data.client_id,
        template_id: data.template_id,
        date: data.date,
        exercises: (data.exercises as unknown as PrescribedExercise[]) || [],
        notes: data.notes,
      }
    } catch (err) {
      console.error('Error checking existing assignment:', err)
      return null
    }
  }, [])

  const assignWorkout = useCallback(async (
    clientId: string,
    date: string,
    exercises: PrescribedExercise[],
    templateId?: string,
    notes?: string
  ): Promise<{ error: string | null; isOverwrite?: boolean }> => {
    try {
      // Snapshot exercises at assignment time
      const exerciseSnapshot = exercises.map(e => ({ ...e }))

      if (devBypass) {
        const existingIdx = devAssignments.findIndex(
          a => a.client_id === clientId && a.date === date
        )
        const isOverwrite = existingIdx !== -1

        const assignment: AssignedWorkout = {
          id: isOverwrite ? devAssignments[existingIdx].id : `assign-${Date.now()}`,
          created_at: isOverwrite ? devAssignments[existingIdx].created_at : new Date().toISOString(),
          updated_at: new Date().toISOString(),
          coach_id: 'mock-coach-id',
          client_id: clientId,
          template_id: templateId || null,
          date,
          exercises: exerciseSnapshot,
          notes: notes || null,
        }

        if (isOverwrite) {
          devAssignments[existingIdx] = assignment
        } else {
          devAssignments.push(assignment)
        }

        return { error: null, isOverwrite }
      }

      const client = getSupabaseClient()
      const { data: { user } } = await client.auth.getUser()
      if (!user) return { error: 'Not authenticated' }

      const { error: upsertError } = await client
        .from('assigned_workouts')
        .upsert(
          {
            coach_id: user.id,
            client_id: clientId,
            date,
            exercises: JSON.parse(JSON.stringify(exerciseSnapshot)) as Json,
            template_id: templateId || null,
            notes: notes || null,
          },
          { onConflict: 'client_id,date' }
        )

      if (upsertError) {
        return { error: upsertError.message }
      }

      return { error: null }
    } catch (err) {
      console.error('Error assigning workout:', err)
      return { error: err instanceof Error ? err.message : 'Failed to assign workout' }
    }
  }, [])

  const fetchClientAssignments = useCallback(async (
    clientId: string,
    startDate: string,
    endDate: string
  ): Promise<AssignedWorkout[]> => {
    try {
      if (devBypass) {
        return devAssignments
          .filter(a =>
            a.client_id === clientId &&
            a.date >= startDate &&
            a.date <= endDate
          )
          .map(a => ({ ...a, exercises: [...a.exercises] }))
          .sort((a, b) => a.date.localeCompare(b.date))
      }

      const client = getSupabaseClient()
      const { data, error: fetchError } = await client
        .from('assigned_workouts')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (fetchError) throw fetchError

      return (data || []).map(row => ({
        id: row.id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        coach_id: row.coach_id,
        client_id: row.client_id,
        template_id: row.template_id,
        date: row.date,
        exercises: (row.exercises as unknown as PrescribedExercise[]) || [],
        notes: row.notes,
      }))
    } catch (err) {
      console.error('Error fetching client assignments:', err)
      return []
    }
  }, [])

  const deleteAssignment = useCallback(async (id: string): Promise<void> => {
    try {
      if (devBypass) {
        const idx = devAssignments.findIndex(a => a.id === id)
        if (idx !== -1) {
          devAssignments.splice(idx, 1)
        }
        return
      }

      const client = getSupabaseClient()
      const { error: deleteError } = await client
        .from('assigned_workouts')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
    } catch (err) {
      console.error('Error deleting assignment:', err)
      throw err
    }
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    assignWorkout,
    checkExistingAssignment,
    fetchClientAssignments,
    deleteAssignment,
  }
}
