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
import { captureError } from './sentry'
import { getLocalDateString } from './dateUtils'

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
import { useDPStore } from '@/stores/dpStore'
// import { useAvatarStore } from '@/stores/avatarStore' // Disabled until table created
import type { Json, PrescribedExercise } from './database.types'
import type { User } from '@supabase/supabase-js'

// PERF-03: Sync context to cache user and reduce redundant getUser() calls
interface SyncContext {
  user: User
  client: ReturnType<typeof getSupabaseClient>
}

/**
 * Get sync context (user + client) for use across multiple sync operations.
 * Caches the user to avoid redundant auth calls.
 */
async function getSyncContext(): Promise<SyncContext | null> {
  if (!supabase) return null

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null

  return { user, client }
}

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
    const cloudProfile = {
      username: data.username || '',
      gender: (data.gender || 'male') as 'male' | 'female',
      fitnessLevel: (data.fitness_level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
      trainingDaysPerWeek: (data.training_days_per_week as 3 | 4 | 5) || 3,
      weight: data.weight || 150,
      height: data.height || 68,
      age: data.age || 25,
      goal: (data.goal || 'maintain') as 'cut' | 'recomp' | 'maintain' | 'bulk',
      avatarBase: (data.avatar_base || 'dominant') as 'dominant' | 'switch' | 'submissive',
      archetype: ((data as Record<string, unknown>).archetype || 'bro') as 'bro' | 'himbo' | 'brute' | 'pup' | 'bull',
      currentStreak: data.current_streak || 0,
      longestStreak: data.longest_streak || 0,
      lastCheckInDate: data.last_check_in_date,
      streakPaused: data.streak_paused || false,
      onboardingComplete: data.onboarding_complete,
    }
    const localProfile = useUserStore.getState().profile
    if (localProfile) {
      // Merge into existing local profile
      useUserStore.getState().setProfile(cloudProfile)
    } else {
      // No local profile — set full profile from cloud (setProfile would no-op on null)
      useUserStore.setState({
        profile: {
          ...cloudProfile,
          createdAt: new Date(data.created_at || Date.now()).getTime(),
          units: 'imperial',
        }
      })
    }
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

  // Batch upsert all weight logs
  if (weightHistory.length > 0) {
    const { error } = await client
      .from('weight_logs')
      .upsert(
        weightHistory.map(entry => ({
          user_id: user.id,
          date: entry.date,
          weight: entry.weight
        })),
        { onConflict: 'user_id,date' }
      )
    if (error) return { error: error.message }
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
  useUserStore.getState().setWeightHistory(mergedHistory)

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

  const { targets, activityLevel, setBy, setByCoachId } = useMacroStore.getState()
  if (!targets) return { error: 'No targets set' }

  const { error } = await client
    .from('macro_targets')
    .upsert({
      user_id: user.id,
      protein: targets.protein,
      calories: targets.calories,
      carbs: targets.carbs,
      fats: targets.fats,
      activity_level: activityLevel,
      set_by: setBy,
      set_by_coach_id: setByCoachId,
    }, {
      onConflict: 'user_id'
    })

  return { error: error?.message || null }
}

export async function syncDailyMacroLogToCloud(date: string, ctx?: SyncContext) {
  if (!supabase) return { error: 'Not configured' }

  // PERF-03: Use provided context or fetch fresh
  const context = ctx || await getSyncContext()
  if (!context) return { error: 'Not authenticated' }
  const { user, client } = context

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

  // PERF-03: Batch upsert all meals instead of sequential upserts
  const meals = todayLog.loggedMeals || []
  if (meals.length > 0) {
    await client
      .from('logged_meals')
      .upsert(
        meals.map(meal => ({
          id: meal.id,
          user_id: user.id,
          date: todayLog.date,
          name: meal.name,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          calories: meal.calories
        }))
      )
  }

  return { error: null }
}

export async function syncSavedMealsToCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const savedMeals = useMacroStore.getState().savedMeals

  // Batch upsert all saved meals
  if (savedMeals.length > 0) {
    const { error } = await client
      .from('saved_meals')
      .upsert(
        savedMeals.map(meal => ({
          id: meal.id,
          user_id: user.id,
          name: meal.name,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          calories: meal.calories,
          usage_count: meal.usageCount,
          ingredients: meal.ingredients as unknown as Json
        }))
      )
    if (error) return { error: error.message }
  }

  return { error: null }
}

export async function syncUserFoodsToCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { recentFoods, favoriteFoods } = useMacroStore.getState()

  // Build unified list: favorites get is_favorite=true, non-favorited recents get false
  const favoriteIds = new Set(favoriteFoods.map(f => f.id))
  const foodMap = new Map<string, typeof recentFoods[number] & { is_favorite: boolean }>()

  for (const food of favoriteFoods) {
    foodMap.set(food.id, { ...food, is_favorite: true })
  }
  for (const food of recentFoods) {
    if (!foodMap.has(food.id)) {
      foodMap.set(food.id, { ...food, is_favorite: favoriteIds.has(food.id) })
    }
  }

  const foods = Array.from(foodMap.values())
  if (foods.length > 0) {
    const { error } = await client
      .from('user_foods')
      .upsert(
        foods.map(food => ({
          id: food.id,
          user_id: user.id,
          name: food.name,
          brand: food.brand || null,
          protein: food.protein,
          carbs: food.carbs,
          fats: food.fats,
          calories: food.calories,
          serving_size: food.servingSize,
          serving_description: food.servingDescription,
          quantity: food.quantity,
          unit: food.unit,
          is_favorite: food.is_favorite,
          logged_at: food.loggedAt
        }))
      )
    if (error) return { error: error.message }
  }

  return { error: null }
}

export async function loadSavedMealsFromCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await client
    .from('saved_meals')
    .select('*')
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  const cloudMeals = (data || []).map(row => ({
    id: row.id,
    name: row.name,
    ingredients: Array.isArray(row.ingredients) ? row.ingredients as unknown as import('@/stores/macroStore').MealIngredient[] : [],
    protein: row.protein,
    carbs: row.carbs,
    fats: row.fats,
    calories: row.calories,
    createdAt: new Date(row.created_at).getTime(),
    usageCount: row.usage_count
  }))

  // Merge: cloud wins on matching ID, local-only preserved
  const localMeals = useMacroStore.getState().savedMeals
  const cloudIds = new Set(cloudMeals.map(m => m.id))
  const merged = [
    ...cloudMeals,
    ...localMeals.filter(m => !cloudIds.has(m.id))
  ]

  useMacroStore.getState().setSavedMeals(merged)
  return { error: null }
}

export async function loadUserFoodsFromCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await client
    .from('user_foods')
    .select('*')
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  type RecentFood = import('@/stores/macroStore').RecentFood

  const mapRow = (row: NonNullable<typeof data>[number]): RecentFood => ({
    id: row.id,
    name: row.name,
    brand: row.brand || undefined,
    protein: row.protein,
    carbs: row.carbs,
    fats: row.fats,
    calories: row.calories,
    servingSize: row.serving_size,
    servingDescription: row.serving_description,
    quantity: row.quantity,
    unit: row.unit as RecentFood['unit'],
    loggedAt: row.logged_at
  })

  const rows = data || []

  // Partition: favorites and recents
  const cloudFavorites = rows.filter(r => r.is_favorite).map(mapRow)
  const cloudRecents = [...rows]
    .sort((a, b) => b.logged_at - a.logged_at)
    .slice(0, 5)
    .map(mapRow)

  // Merge with local: cloud wins on matching ID
  const localState = useMacroStore.getState()

  const cloudFavIds = new Set(cloudFavorites.map(f => f.id))
  const mergedFavorites = [
    ...cloudFavorites,
    ...localState.favoriteFoods.filter(f => !cloudFavIds.has(f.id))
  ]

  const cloudRecentIds = new Set(cloudRecents.map(f => f.id))
  const mergedRecents = [
    ...cloudRecents,
    ...localState.recentFoods.filter(f => !cloudRecentIds.has(f.id))
  ].sort((a, b) => b.loggedAt - a.loggedAt).slice(0, 5)

  useMacroStore.setState({ favoriteFoods: mergedFavorites, recentFoods: mergedRecents })
  return { error: null }
}

// ==========================================
// Macro Log Loading (added for loadAllFromCloud)
// ==========================================

export async function loadMacroLogsFromCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Load last 90 days of macro logs (matches PERF-01 pruning window)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)
  const cutoffStr = cutoffDate.toISOString().split('T')[0]

  const { data, error } = await client
    .from('daily_macro_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', cutoffStr)
    .order('date', { ascending: false })

  if (error) return { error: error.message }

  type DailyMacroLog = import('@/stores/macroStore').DailyMacroLog

  // Also load logged meals for these dates
  const dates = (data || []).map(d => d.date)
  const { data: mealsData } = dates.length > 0 ? await client
    .from('logged_meals')
    .select('*')
    .eq('user_id', user.id)
    .in('date', dates) : { data: [] }

  // Group meals by date
  const mealsByDate = new Map<string, typeof mealsData>()
  for (const meal of (mealsData || [])) {
    const existing = mealsByDate.get(meal.date) || []
    existing.push(meal)
    mealsByDate.set(meal.date, existing)
  }

  const cloudLogs: DailyMacroLog[] = (data || []).map(row => ({
    date: row.date,
    protein: row.protein,
    calories: row.calories,
    carbs: row.carbs,
    fats: row.fats,
    // Meal plan not stored in cloud - provide empty array (local generates fresh)
    meals: [],
    loggedMeals: (mealsByDate.get(row.date) || []).map(m => ({
      id: m.id,
      name: m.name,
      protein: m.protein,
      carbs: m.carbs,
      fats: m.fats,
      calories: m.calories,
      timestamp: new Date(m.created_at).getTime()
    }))
  }))

  // Merge with local: cloud wins on matching date
  const localLogs = useMacroStore.getState().dailyLogs
  const cloudDates = new Set(cloudLogs.map(l => l.date))
  const mergedLogs = [
    ...cloudLogs,
    ...localLogs.filter(l => !cloudDates.has(l.date))
  ].sort((a, b) => b.date.localeCompare(a.date))

  useMacroStore.setState({ dailyLogs: mergedLogs })
  return { error: null }
}

// ==========================================
// Workout Log Loading (added for loadAllFromCloud)
// ==========================================

export async function loadWorkoutLogsFromCloud() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Load last 90 days of workout logs (matches PERF-01 pruning window)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)
  const cutoffStr = cutoffDate.toISOString().split('T')[0]

  const { data, error } = await client
    .from('workout_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', cutoffStr)
    .order('date', { ascending: false })

  if (error) return { error: error.message }

  type WorkoutLog = import('@/stores/workoutStore').WorkoutLog
  type Exercise = import('@/stores/workoutStore').Exercise
  type WorkoutType = import('@/stores/workoutStore').WorkoutType

  const cloudLogs: WorkoutLog[] = (data || []).map(row => ({
    id: row.id,
    date: row.date,
    workoutType: row.workout_type as WorkoutType,
    dayNumber: 1, // Default, not stored in cloud
    weekNumber: 1, // Default, not stored in cloud
    exercises: (row.exercises as unknown as Exercise[]) || [],
    completed: row.completed,
    xpAwarded: row.xp_awarded,
    startTime: row.created_at ? new Date(row.created_at).getTime() : undefined,
    endTime: row.duration_minutes
      ? (row.created_at ? new Date(row.created_at).getTime() + row.duration_minutes * 60000 : undefined)
      : undefined,
    assignmentId: row.assignment_id || undefined
  }))

  // Merge with local: cloud wins on matching ID
  const localLogs = useWorkoutStore.getState().workoutLogs
  const cloudIds = new Set(cloudLogs.map(l => l.id))
  const mergedLogs = [
    ...cloudLogs,
    ...localLogs.filter(l => !cloudIds.has(l.id))
  ].sort((a, b) => b.date.localeCompare(a.date))

  useWorkoutStore.setState({ workoutLogs: mergedLogs })
  return { error: null }
}

// ==========================================
// Workout Sync
// ==========================================

export async function syncWorkoutLogToCloud(workoutId: string, ctx?: SyncContext) {
  if (!supabase) return { error: 'Not configured' }

  // PERF-03: Use provided context or fetch fresh
  const context = ctx || await getSyncContext()
  if (!context) return { error: 'Not authenticated' }
  const { user, client } = context

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
      xp_awarded: workout.xpAwarded,
      assignment_id: workout.assignmentId || null
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

  // V2: Read from dpStore, map to existing user_xp table columns
  const dpState = useDPStore.getState()

  const { error } = await client
    .from('user_xp')
    .upsert({
      user_id: user.id,
      total_xp: dpState.totalDP,
      current_level: dpState.currentRank,
      pending_xp: 0,           // V2 has no pending concept
      last_claim_date: null     // V2 has no weekly claim
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
// Directional Sync Functions
// ==========================================

/**
 * Push client-owned data to Supabase.
 * Skips macro targets when set_by = 'coach' to prevent overwriting coach-set values.
 * PERF-03: Uses cached context, parallel operations, and batch upserts.
 */
export async function pushClientData() {
  if (!supabase) return { error: 'Not configured' }

  // PERF-03: Get context once, reuse for all operations
  const ctx = await getSyncContext()
  if (!ctx) return { error: 'Not authenticated' }

  // PERF-03: Run independent operations in parallel
  const [profileResult, weightLogsResult, savedMealsResult, userFoodsResult, xpResult] = await Promise.all([
    withRetryResult(syncProfileToCloud),
    withRetryResult(syncWeightLogsToCloud),
    withRetryResult(syncSavedMealsToCloud),
    withRetryResult(syncUserFoodsToCloud),
    withRetryResult(syncXPToCloud),
  ])

  const results: Record<string, { error: string | null }> = {
    profile: profileResult,
    weightLogs: weightLogsResult,
    savedMeals: savedMealsResult,
    userFoods: userFoodsResult,
    xp: xpResult,
  }

  // Only push macro targets if client-owned
  const { setBy } = useMacroStore.getState()
  if (setBy !== 'coach') {
    results.macroTargets = await withRetryResult(syncMacroTargetsToCloud)
  }

  // Sync today's macro log with context (daily logs are always client-owned)
  const today = getLocalDateString()
  await withRetryResult(() => syncDailyMacroLogToCloud(today, ctx))

  // PERF-03: Batch upsert recent workouts instead of sequential calls
  const recentWorkouts = useWorkoutStore.getState().workoutLogs.slice(-10)
  if (recentWorkouts.length > 0) {
    const workoutRows = recentWorkouts.map(workout => {
      const durationMinutes = workout.startTime && workout.endTime
        ? Math.round((workout.endTime - workout.startTime) / 60000)
        : null
      return {
        id: workout.id,
        user_id: ctx.user.id,
        date: workout.date,
        workout_type: workout.workoutType,
        completed: workout.completed,
        duration_minutes: durationMinutes,
        exercises: workout.exercises as unknown as Json,
        xp_awarded: workout.xpAwarded,
        assignment_id: workout.assignmentId || null
      }
    })

    await withRetryResult(async () => {
      const { error } = await ctx.client
        .from('workout_logs')
        .upsert(workoutRows)
      return { error: error?.message || null }
    })
  }

  if (import.meta.env.DEV) console.log('[Sync] Push client data results:', results)
  return results
}

/**
 * Pull coach-set data from Supabase.
 * Currently handles macro_targets with set_by = 'coach'.
 * Structured to be extended for additional coach-owned data in later phases.
 */
export async function pullCoachData() {
  if (!supabase) return { error: 'Not configured' }

  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Pull all coach data in parallel (3 independent queries)
  const today = getLocalDateString()

  const [macroResult, assignmentResult, checkinResult] = await Promise.all([
    client
      .from('macro_targets')
      .select('protein, calories, carbs, fats, activity_level, set_by, set_by_coach_id')
      .eq('user_id', user.id)
      .single(),
    client
      .from('assigned_workouts')
      .select('id, date, exercises, notes, template_id')
      .eq('client_id', user.id)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(7),
    client
      .from('weekly_checkins')
      .select('id, week_of, status, coach_response, reviewed_at')
      .eq('client_id', user.id)
      .order('week_of', { ascending: false })
      .limit(1)
      .single(),
  ])

  // Process macro targets
  const { data: macroData, error: macroError } = macroResult
  if (!macroError && macroData && macroData.set_by === 'coach') {
    useMacroStore.getState().setCoachTargets(
      {
        protein: macroData.protein,
        calories: macroData.calories,
        carbs: macroData.carbs,
        fats: macroData.fats,
      },
      macroData.set_by_coach_id || ''
    )
    if (import.meta.env.DEV) console.log('[Sync] Pulled coach-set macro targets')
  } else if (!macroError && macroData && macroData.set_by === 'self') {
    const store = useMacroStore.getState()
    if (store.setBy === 'coach') {
      useMacroStore.setState({ setBy: 'self', setByCoachId: null })
    }
  }

  // Process assigned workouts
  const { data: assignments } = assignmentResult
  if (assignments && assignments.length > 0) {
    const todayAssignment = assignments.find(a => a.date === today)
    if (todayAssignment) {
      useWorkoutStore.getState().setAssignedWorkout({
        assignmentId: todayAssignment.id,
        exercises: todayAssignment.exercises as unknown as PrescribedExercise[],
        date: todayAssignment.date,
        coachNotes: todayAssignment.notes || undefined,
      })
    } else {
      useWorkoutStore.getState().setAssignedWorkout(null)
    }
  } else {
    useWorkoutStore.getState().setAssignedWorkout(null)
  }

  // Process latest check-in
  const { data: latestCheckin } = checkinResult
  if (latestCheckin) {
    localStorage.setItem('trained-latest-checkin', JSON.stringify({
      id: latestCheckin.id,
      week_of: latestCheckin.week_of,
      status: latestCheckin.status,
      coach_response: latestCheckin.coach_response,
      reviewed_at: latestCheckin.reviewed_at,
    }))
  }

  if (import.meta.env.DEV) console.log('[Sync] Pull coach data complete')
  return { error: null }
}

// ==========================================
// Full Sync (Initial load or manual sync)
// ==========================================

/** @deprecated Use pushClientData() + pullCoachData() instead */
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
  const today = getLocalDateString()
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
  // Run independent operations in parallel for better performance
  const [profileResult, weightLogsResult, savedMealsResult, userFoodsResult, macroLogsResult, workoutLogsResult] = await Promise.all([
    withRetryResult(loadProfileFromCloud),
    withRetryResult(loadWeightLogsFromCloud),
    withRetryResult(loadSavedMealsFromCloud),
    withRetryResult(loadUserFoodsFromCloud),
    withRetryResult(loadMacroLogsFromCloud),
    withRetryResult(loadWorkoutLogsFromCloud),
  ])

  const results = {
    profile: profileResult,
    weightLogs: weightLogsResult,
    savedMeals: savedMealsResult,
    userFoods: userFoodsResult,
    macroLogs: macroLogsResult,
    workoutLogs: workoutLogsResult,
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
      await pushClientData()
      store.setStatus('synced')
      store.setPendingChanges(false)
      store.setLastSyncedAt(new Date().toISOString())
    } catch (error) {
      store.setStatus('error')
      store.setPendingChanges(true)
      if (error instanceof Error) {
        captureError(error, { context: 'scheduleSync' })
      }
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
    await pushClientData()
    store.setStatus('synced')
    store.setPendingChanges(false)
    store.setLastSyncedAt(new Date().toISOString())
  } catch (error) {
    store.setStatus('error')
    if (error instanceof Error) {
      captureError(error, { context: 'flushPendingSync' })
    }
  }
}
