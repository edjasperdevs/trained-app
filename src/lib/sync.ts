/**
 * Data Sync Service
 *
 * Handles syncing local store data with Supabase when user is authenticated.
 * The app works offline-first - local storage is the source of truth,
 * and changes are synced to the cloud when connected.
 */

import { supabase, getSupabaseClient } from './supabase'
import { useSyncStore } from '@/stores/syncStore'
import { toast } from '@/stores/toastStore'

// ==========================================
// Retry Logic with Exponential Backoff
// ==========================================

interface RetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

/**
 * Wraps an async function with exponential backoff retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 500, maxDelayMs = 5000 } = options
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 100,
        maxDelayMs
      )

      if (import.meta.env.DEV) console.log(`[Sync] Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms:`, lastError.message)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Wrapper for sync functions that returns error object instead of throwing
 */
async function withRetryResult<T>(
  fn: () => Promise<{ error: string | null; data?: T }>
): Promise<{ error: string | null; data?: T }> {
  try {
    return await withRetry(async () => {
      const result = await fn()
      // If the function itself returns an error, don't retry
      if (result.error && !result.error.includes('Not configured') && !result.error.includes('Not authenticated')) {
        // Only retry on network/server errors, not on logical errors
        throw new Error(result.error)
      }
      return result
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
import { useUserStore } from '@/stores/userStore'
import { useMacroStore } from '@/stores/macroStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useXPStore } from '@/stores/xpStore'
// import { useAvatarStore } from '@/stores/avatarStore' // Disabled until table created
import type { Json } from './database.types'

// ==========================================
// Profile Sync
// ==========================================

export async function syncProfileToCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const profile = useUserStore.getState().profile
  if (!profile) return { error: 'No local profile' }

  // Use upsert to handle both new users and existing users (BUG-012 fix)
  // Note: email is required by the schema, get it from auth user
  const { error } = await client
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email || '',  // Required field
      username: profile.username,
      gender: profile.gender,
      fitness_level: profile.fitnessLevel,
      training_days_per_week: profile.trainingDaysPerWeek,
      weight: profile.weight,
      height: profile.height,
      age: profile.age,
      goal: profile.goal,
      avatar_base: profile.avatarBase,
      current_streak: profile.currentStreak,
      longest_streak: profile.longestStreak,
      last_check_in_date: profile.lastCheckInDate,
      streak_paused: profile.streakPaused,
      onboarding_complete: profile.onboardingComplete
    }, {
      onConflict: 'id'
    })

  if (error) {
    if (import.meta.env.DEV) console.error('[Sync] Profile sync failed:', error.message)
  }

  return { error: error?.message || null }
}

export async function loadProfileFromCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return { error: error.message }
  if (!data) return { error: 'No profile found' }

  // Only load if cloud data exists and is more complete
  if (data.onboarding_complete) {
    useUserStore.getState().setProfile({
      username: data.username || '',
      gender: data.gender || 'male',
      fitnessLevel: data.fitness_level || 'beginner',
      trainingDaysPerWeek: (data.training_days_per_week as 3 | 4 | 5) || 3,
      weight: data.weight || 150,
      height: data.height || 68,
      age: data.age || 25,
      goal: data.goal || 'maintain',
      avatarBase: data.avatar_base || 'dominant',
      currentStreak: data.current_streak || 0,
      longestStreak: data.longest_streak || 0,
      lastCheckInDate: data.last_check_in_date,
      streakPaused: data.streak_paused || false,
      onboardingComplete: data.onboarding_complete
    })
  }

  return { error: null }
}

// ==========================================
// Weight Logs Sync
// ==========================================

export async function syncWeightLogsToCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const weightHistory = useUserStore.getState().weightHistory

  // Upsert all weight logs
  for (const entry of weightHistory) {
    await client
      .from('weight_logs')
      .upsert({
        user_id: user.id,
        date: entry.date,
        weight: entry.weight
      }, {
        onConflict: 'user_id,date'
      })
  }

  return { error: null }
}

export async function loadWeightLogsFromCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await client
    .from('weight_logs')
    .select('date, weight')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  if (error) return { error: error.message }

  // Merge cloud data with local (cloud data takes precedence for same date)
  const localHistory = useUserStore.getState().weightHistory
  const cloudDates = new Set((data || []).map(d => d.date))
  const mergedHistory = [
    ...(data || []).map(d => ({ date: d.date, weight: d.weight })),
    ...localHistory.filter(l => !cloudDates.has(l.date))
  ].sort((a, b) => a.date.localeCompare(b.date))

  // Update local store with merged data
  // Note: This requires adding a setWeightHistory method to userStore
  // For now, we'll just sync local to cloud

  return { error: null, data: mergedHistory }
}

// ==========================================
// Macro Data Sync
// ==========================================

export async function syncMacroTargetsToCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { targets, activityLevel } = useMacroStore.getState()
  if (!targets) return { error: 'No targets set' }

  const { error } = await client
    .from('macro_targets')
    .upsert({
      user_id: user.id,
      protein: targets.protein,
      calories: targets.calories,
      carbs: targets.carbs,
      fats: targets.fats,
      activity_level: activityLevel
    }, {
      onConflict: 'user_id'
    })

  return { error: error?.message || null }
}

export async function syncDailyMacroLogToCloud(date: string) {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const dailyLogs = useMacroStore.getState().dailyLogs
  const todayLog = dailyLogs.find(log => log.date === date)

  if (!todayLog) return { error: 'No log for this date' }

  // Sync daily totals
  await client
    .from('daily_macro_logs')
    .upsert({
      user_id: user.id,
      date: todayLog.date,
      protein: todayLog.protein,
      calories: todayLog.calories,
      carbs: todayLog.carbs,
      fats: todayLog.fats
    }, {
      onConflict: 'user_id,date'
    })

  // Sync individual meals
  for (const meal of todayLog.loggedMeals || []) {
    await client
      .from('logged_meals')
      .upsert({
        id: meal.id,
        user_id: user.id,
        date: todayLog.date,
        name: meal.name,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        calories: meal.calories
      })
  }

  return { error: null }
}

export async function syncSavedMealsToCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const savedMeals = useMacroStore.getState().savedMeals

  for (const meal of savedMeals) {
    await client
      .from('saved_meals')
      .upsert({
        id: meal.id,
        user_id: user.id,
        name: meal.name,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        calories: meal.calories,
        usage_count: meal.usageCount
      })
  }

  return { error: null }
}

// ==========================================
// Workout Sync
// ==========================================

export async function syncWorkoutLogToCloud(workoutId: string) {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const workoutLogs = useWorkoutStore.getState().workoutLogs
  const workout = workoutLogs.find(w => w.id === workoutId)

  if (!workout) return { error: 'Workout not found' }

  const durationMinutes = workout.startTime && workout.endTime
    ? Math.round((workout.endTime - workout.startTime) / 60000)
    : null

  const { error } = await client
    .from('workout_logs')
    .upsert({
      id: workout.id,
      user_id: user.id,
      date: workout.date,
      workout_type: workout.workoutType,
      completed: workout.completed,
      duration_minutes: durationMinutes,
      exercises: workout.exercises as unknown as Json,
      xp_awarded: workout.xpAwarded
    })

  return { error: error?.message || null }
}

// ==========================================
// XP Sync
// ==========================================

export async function syncXPToCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const xpState = useXPStore.getState()

  const { error } = await client
    .from('user_xp')
    .upsert({
      user_id: user.id,
      total_xp: xpState.totalXP,
      current_level: xpState.currentLevel,
      pending_xp: xpState.pendingXP,
      last_claim_date: xpState.lastClaimDate
    }, {
      onConflict: 'user_id'
    })

  return { error: error?.message || null }
}

// ==========================================
// Avatar Sync (BUG-016 fix)
// Note: Requires user_avatar table to be created in Supabase
// ==========================================

export async function syncAvatarToCloud() {
  // Avatar sync disabled until user_avatar table is created in Supabase
  // To enable: create user_avatar table with columns:
  // user_id (uuid, FK to auth.users), base_character, evolution_stage,
  // current_mood, accessories (jsonb), last_interaction (timestamp)
  return { error: null }
}

export async function loadAvatarFromCloud() {
  // Avatar sync disabled until user_avatar table is created in Supabase
  return { error: null }
}

// ==========================================
// Full Sync (Initial load or manual sync)
// ==========================================

export async function syncAllToCloud() {
  // Use retry wrapper for each sync operation
  const results = {
    profile: await withRetryResult(syncProfileToCloud),
    weightLogs: await withRetryResult(syncWeightLogsToCloud),
    macroTargets: await withRetryResult(syncMacroTargetsToCloud),
    savedMeals: await withRetryResult(syncSavedMealsToCloud),
    xp: await withRetryResult(syncXPToCloud)
    // avatar: Disabled until user_avatar table created
  }

  // Sync today's macro log
  const today = new Date().toISOString().split('T')[0]
  results.macroTargets = await withRetryResult(() => syncDailyMacroLogToCloud(today))

  // Sync recent workouts with retry
  const recentWorkouts = useWorkoutStore.getState().workoutLogs.slice(-10)
  for (const workout of recentWorkouts) {
    await withRetryResult(() => syncWorkoutLogToCloud(workout.id))
  }

  if (import.meta.env.DEV) console.log('Sync results:', results)
  return results
}

export async function loadAllFromCloud() {
  // Use retry wrapper for each load operation
  const results = {
    profile: await withRetryResult(loadProfileFromCloud),
    weightLogs: await withRetryResult(loadWeightLogsFromCloud)
    // avatar: Disabled until user_avatar table created
  }

  if (import.meta.env.DEV) console.log('Load results:', results)
  return results
}

// ==========================================
// Incremental Sync Scheduling
// ==========================================

let syncTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Schedule a debounced sync. Call after any user action that modifies data.
 * If offline, marks pending changes and shows "saved locally" toast.
 * If online, debounces 2 seconds then runs syncAllToCloud with retry.
 */
export function scheduleSync() {
  if (!supabase) return

  const { isOnline } = useSyncStore.getState()

  if (!isOnline) {
    useSyncStore.getState().setPendingChanges(true)
    toast.info('Saved locally. Will sync when online.')
    return
  }

  // Debounce: if user is rapid-firing actions, batch into one sync
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    const store = useSyncStore.getState()
    store.setStatus('syncing')
    try {
      await syncAllToCloud()
      store.setStatus('synced')
      store.setPendingChanges(false)
      store.setLastSyncedAt(new Date().toISOString())
    } catch {
      store.setStatus('error')
      store.setPendingChanges(true)
    }
  }, 2000)
}

/**
 * Flush any pending syncs immediately (e.g., on reconnection).
 * Skips debounce.
 */
export async function flushPendingSync() {
  if (!supabase) return
  if (syncTimer) { clearTimeout(syncTimer); syncTimer = null }

  const store = useSyncStore.getState()
  if (!store.pendingChanges) return

  store.setStatus('syncing')
  try {
    await syncAllToCloud()
    store.setStatus('synced')
    store.setPendingChanges(false)
    store.setLastSyncedAt(new Date().toISOString())
  } catch {
    store.setStatus('error')
  }
}
