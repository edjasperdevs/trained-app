import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Goal, Gender } from './userStore'
import { isValidMacroTargets, isValidActivityLevel, isValidDailyLog, isArray } from '@/lib/validation'
import { getLocalDateString } from '../lib/dateUtils'

export interface MacroTargets {
  protein: number
  calories: number
  carbs: number
  fats: number
}

export interface MealPlan {
  name: string
  protein: number
  carbs: number
  fats: number
  calories: number
}

export interface LoggedMeal {
  id: string
  name: string
  protein: number
  carbs: number
  fats: number
  calories: number
  timestamp: number
}

export interface RecentFood {
  id: string
  name: string
  brand?: string
  protein: number
  carbs: number
  fats: number
  calories: number
  servingSize: number
  servingDescription: string
  quantity: number
  unit: 'g' | 'oz' | 'serving'
  loggedAt: number
}

export interface MealIngredient {
  id: string
  name: string
  brand?: string
  quantity: number
  unit: 'g' | 'oz' | 'serving'
  protein: number   // calculated for this quantity
  carbs: number
  fats: number
  calories: number
}

export interface SavedMeal {
  id: string
  name: string
  ingredients: MealIngredient[]  // Array of ingredients
  // Totals (calculated from ingredients)
  protein: number
  carbs: number
  fats: number
  calories: number
  createdAt: number
  usageCount: number
}

export interface DailyMacroLog {
  date: string
  protein: number
  calories: number
  carbs: number
  fats: number
  meals: {
    mealNumber: number
    protein: number
    carbs: number
    fats: number
    calories: number
    logged: boolean
  }[]
  loggedMeals: LoggedMeal[]
  // Snapshot of targets when day's first meal was logged (BUG-005 fix)
  targetSnapshot?: MacroTargets
}

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'

interface MacroStore {
  targets: MacroTargets | null
  mealPlan: MealPlan[]
  dailyLogs: DailyMacroLog[]
  savedMeals: SavedMeal[]
  recentFoods: RecentFood[]
  favoriteFoods: RecentFood[]
  activityLevel: ActivityLevel
  setBy: 'self' | 'coach'
  setByCoachId: string | null
  coachMacroUpdated: boolean

  // Actions
  addRecentFood: (food: RecentFood) => void
  toggleFavoriteFood: (food: RecentFood) => void
  calculateMacros: (weight: number, height: number, age: number, gender: Gender, goal: Goal, activity: ActivityLevel) => void
  generateMealPlan: () => void
  logNamedMeal: (name: string, macros: { protein: number; carbs: number; fats: number; calories: number }) => void
  logQuickMacros: (macros: Partial<MacroTargets>) => void
  saveMeal: (name: string, ingredients: MealIngredient[]) => void
  deleteSavedMeal: (id: string) => void
  getSavedMeals: () => SavedMeal[]
  getTodayMeals: () => LoggedMeal[]
  deleteLoggedMeal: (id: string) => void
  getTodayLog: () => DailyMacroLog | null
  getTodayProgress: () => {
    protein: { current: number; target: number; percentage: number }
    calories: { current: number; target: number; percentage: number }
    carbs: { current: number; target: number; percentage: number }
    fats: { current: number; target: number; percentage: number }
  } | null
  isProteinTargetHit: () => boolean
  isCalorieTargetHit: () => boolean
  isPerfectDay: () => boolean
  setSavedMeals: (meals: SavedMeal[]) => void
  setCoachTargets: (targets: MacroTargets, coachId: string) => void
  dismissCoachMacroUpdated: () => void
  setActivityLevel: (level: ActivityLevel) => void
  resetMacros: () => void
  exportData: () => string
  importData: (data: string) => boolean
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725
}

const GOAL_CALORIE_ADJUSTMENTS: Record<Goal, number> = {
  cut: -500,
  recomp: -200, // Slight deficit to favor fat loss while building muscle
  maintain: 0,
  bulk: 300
}

// PERF-01: Prune logs older than 90 days to prevent unbounded localStorage growth
const PRUNE_DAYS = 90
const pruneOldLogs = (logs: DailyMacroLog[]): DailyMacroLog[] => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - PRUNE_DAYS)
  const cutoffStr = cutoffDate.toISOString().split('T')[0]
  return logs.filter(log => log.date >= cutoffStr)
}

export const useMacroStore = create<MacroStore>()(
  persist(
    (set, get) => ({
      targets: null,
      mealPlan: [],
      dailyLogs: [],
      savedMeals: [],
      recentFoods: [],
      favoriteFoods: [],
      activityLevel: 'moderate',
      setBy: 'self',
      setByCoachId: null,
      coachMacroUpdated: false,

      addRecentFood: (food) => {
        set((state) => {
          // Deduplicate by name+brand (case-insensitive)
          const key = `${food.name.toLowerCase()}|${(food.brand || '').toLowerCase()}`
          const filtered = state.recentFoods.filter((f) => {
            const fKey = `${f.name.toLowerCase()}|${(f.brand || '').toLowerCase()}`
            return fKey !== key
          })
          return { recentFoods: [food, ...filtered].slice(0, 5) }
        })
      },

      toggleFavoriteFood: (food) => {
        set((state) => {
          const exists = state.favoriteFoods.some((f) => f.id === food.id)
          if (exists) {
            return { favoriteFoods: state.favoriteFoods.filter((f) => f.id !== food.id) }
          }
          return { favoriteFoods: [...state.favoriteFoods, food] }
        })
      },

      calculateMacros: (weight: number, height: number, age: number, gender: Gender, goal: Goal, activity: ActivityLevel) => {
        // Mifflin-St Jeor Equation for BMR
        // Male:   BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) + 5
        // Female: BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) − 161
        const weightKg = weight * 0.453592 // lbs to kg
        const heightCm = height * 2.54 // inches to cm
        const genderAdjustment = gender === 'male' ? 5 : -161
        const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + genderAdjustment
        const tdee = bmr * ACTIVITY_MULTIPLIERS[activity]
        const adjustedCalories = Math.round(tdee + GOAL_CALORIE_ADJUSTMENTS[goal])

        // Protein: 1g per lb of bodyweight (standard recommendation)
        const protein = Math.round(weight * 1)

        // Fat: 25-30% of calories
        const fatCalories = adjustedCalories * 0.27
        const fats = Math.round(fatCalories / 9)

        // Carbs: remaining calories
        const proteinCalories = protein * 4
        const carbCalories = adjustedCalories - proteinCalories - fatCalories
        const carbs = Math.round(carbCalories / 4)

        set({
          targets: { protein, calories: adjustedCalories, carbs, fats },
          activityLevel: activity,
          setBy: 'self',
          setByCoachId: null,
        })

        // Generate meal plan after setting targets
        get().generateMealPlan()
      },

      generateMealPlan: () => {
        const targets = get().targets
        if (!targets) return

        // 5 meals: 4 balanced + 1 evening (higher fat)
        const mealPlan: MealPlan[] = [
          {
            name: 'Meal 1 (Breakfast)',
            protein: Math.round(targets.protein * 0.2),
            carbs: Math.round(targets.carbs * 0.25),
            fats: Math.round(targets.fats * 0.15),
            calories: Math.round(targets.calories * 0.2)
          },
          {
            name: 'Meal 2 (Mid-Morning)',
            protein: Math.round(targets.protein * 0.2),
            carbs: Math.round(targets.carbs * 0.2),
            fats: Math.round(targets.fats * 0.15),
            calories: Math.round(targets.calories * 0.18)
          },
          {
            name: 'Meal 3 (Lunch)',
            protein: Math.round(targets.protein * 0.25),
            carbs: Math.round(targets.carbs * 0.25),
            fats: Math.round(targets.fats * 0.2),
            calories: Math.round(targets.calories * 0.25)
          },
          {
            name: 'Meal 4 (Pre/Post Workout)',
            protein: Math.round(targets.protein * 0.2),
            carbs: Math.round(targets.carbs * 0.2),
            fats: Math.round(targets.fats * 0.15),
            calories: Math.round(targets.calories * 0.17)
          },
          {
            name: 'Meal 5 (Evening)',
            protein: Math.round(targets.protein * 0.15),
            carbs: Math.round(targets.carbs * 0.1),
            fats: Math.round(targets.fats * 0.35),
            calories: Math.round(targets.calories * 0.2)
          }
        ]

        set({ mealPlan })
      },

      logNamedMeal: (name, macros) => {
        const today = getLocalDateString()
        const existingLog = get().dailyLogs.find(log => log.date === today)
        const newMeal: LoggedMeal = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          ...macros,
          timestamp: Date.now()
        }

        if (existingLog) {
          const updatedLoggedMeals = [...(existingLog.loggedMeals || []), newMeal]
          const totals = updatedLoggedMeals.reduce(
            (acc, meal) => ({
              protein: acc.protein + meal.protein,
              carbs: acc.carbs + meal.carbs,
              fats: acc.fats + meal.fats,
              calories: acc.calories + meal.calories
            }),
            { protein: 0, carbs: 0, fats: 0, calories: 0 }
          )

          // Also add any existing numbered meals
          const numberedMealTotals = existingLog.meals.reduce(
            (acc, meal) => ({
              protein: acc.protein + meal.protein,
              carbs: acc.carbs + meal.carbs,
              fats: acc.fats + meal.fats,
              calories: acc.calories + meal.calories
            }),
            { protein: 0, carbs: 0, fats: 0, calories: 0 }
          )

          set((state) => ({
            dailyLogs: state.dailyLogs.map(log =>
              log.date === today
                ? {
                    ...log,
                    protein: totals.protein + numberedMealTotals.protein,
                    calories: totals.calories + numberedMealTotals.calories,
                    carbs: totals.carbs + numberedMealTotals.carbs,
                    fats: totals.fats + numberedMealTotals.fats,
                    loggedMeals: updatedLoggedMeals
                  }
                : log
            )
          }))
        } else {
          // Capture target snapshot for the day when first meal is logged
          const targets = get().targets
          const newLog: DailyMacroLog = {
            date: today,
            ...macros,
            meals: [],
            loggedMeals: [newMeal],
            targetSnapshot: targets ? { ...targets } : undefined
          }
          set((state) => ({
            dailyLogs: pruneOldLogs([...state.dailyLogs, newLog])
          }))
        }
      },

      logQuickMacros: (macros) => {
        const today = getLocalDateString()
        const existingLog = get().dailyLogs.find(log => log.date === today)

        if (existingLog) {
          set((state) => ({
            dailyLogs: state.dailyLogs.map(log =>
              log.date === today
                ? {
                    ...log,
                    protein: macros.protein ?? log.protein,
                    calories: macros.calories ?? log.calories,
                    carbs: macros.carbs ?? log.carbs,
                    fats: macros.fats ?? log.fats
                  }
                : log
            )
          }))
        } else {
          // Capture target snapshot for the day when first macro is logged
          const targets = get().targets
          set((state) => ({
            dailyLogs: pruneOldLogs([
              ...state.dailyLogs,
              {
                date: today,
                protein: macros.protein ?? 0,
                calories: macros.calories ?? 0,
                carbs: macros.carbs ?? 0,
                fats: macros.fats ?? 0,
                meals: [],
                loggedMeals: [],
                targetSnapshot: targets ? { ...targets } : undefined
              }
            ])
          }))
        }
      },

      saveMeal: (name, ingredients) => {
        // Calculate totals from ingredients
        const totals = ingredients.reduce(
          (acc, ing) => ({
            protein: acc.protein + ing.protein,
            carbs: acc.carbs + ing.carbs,
            fats: acc.fats + ing.fats,
            calories: acc.calories + ing.calories
          }),
          { protein: 0, carbs: 0, fats: 0, calories: 0 }
        )

        const newSavedMeal: SavedMeal = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          ingredients,
          ...totals,
          createdAt: Date.now(),
          usageCount: 0
        }
        set((state) => ({
          savedMeals: [...state.savedMeals, newSavedMeal]
        }))
      },

      deleteSavedMeal: (id) => {
        set((state) => ({
          savedMeals: state.savedMeals.filter(m => m.id !== id)
        }))
      },

      getSavedMeals: () => {
        // Return sorted by usage count (most used first)
        return [...get().savedMeals].sort((a, b) => b.usageCount - a.usageCount)
      },

      getTodayMeals: () => {
        const todayLog = get().getTodayLog()
        return todayLog?.loggedMeals || []
      },

      deleteLoggedMeal: (id) => {
        const today = getLocalDateString()
        const existingLog = get().dailyLogs.find(log => log.date === today)
        if (!existingLog) return

        const updatedLoggedMeals = existingLog.loggedMeals.filter(m => m.id !== id)
        const totals = updatedLoggedMeals.reduce(
          (acc, meal) => ({
            protein: acc.protein + meal.protein,
            carbs: acc.carbs + meal.carbs,
            fats: acc.fats + meal.fats,
            calories: acc.calories + meal.calories
          }),
          { protein: 0, carbs: 0, fats: 0, calories: 0 }
        )

        // Also add any existing numbered meals
        const numberedMealTotals = existingLog.meals.reduce(
          (acc, meal) => ({
            protein: acc.protein + meal.protein,
            carbs: acc.carbs + meal.carbs,
            fats: acc.fats + meal.fats,
            calories: acc.calories + meal.calories
          }),
          { protein: 0, carbs: 0, fats: 0, calories: 0 }
        )

        set((state) => ({
          dailyLogs: state.dailyLogs.map(log =>
            log.date === today
              ? {
                  ...log,
                  protein: totals.protein + numberedMealTotals.protein,
                  calories: totals.calories + numberedMealTotals.calories,
                  carbs: totals.carbs + numberedMealTotals.carbs,
                  fats: totals.fats + numberedMealTotals.fats,
                  loggedMeals: updatedLoggedMeals
                }
              : log
          )
        }))
      },

      getTodayLog: () => {
        const today = getLocalDateString()
        return get().dailyLogs.find(log => log.date === today) || null
      },

      getTodayProgress: () => {
        const currentTargets = get().targets
        const todayLog = get().getTodayLog()

        if (!currentTargets) return null

        // Use the day's target snapshot if available (for consistency if targets changed mid-day)
        // Fall back to current targets if no snapshot exists (backwards compatibility)
        const targets = todayLog?.targetSnapshot || currentTargets

        const current = todayLog || { protein: 0, calories: 0, carbs: 0, fats: 0 }

        return {
          protein: {
            current: current.protein,
            target: targets.protein,
            percentage: Math.min((current.protein / targets.protein) * 100, 100)
          },
          calories: {
            current: current.calories,
            target: targets.calories,
            percentage: Math.min((current.calories / targets.calories) * 100, 100)
          },
          carbs: {
            current: current.carbs,
            target: targets.carbs,
            percentage: Math.min((current.carbs / targets.carbs) * 100, 100)
          },
          fats: {
            current: current.fats,
            target: targets.fats,
            percentage: Math.min((current.fats / targets.fats) * 100, 100)
          }
        }
      },

      isProteinTargetHit: () => {
        const currentTargets = get().targets
        const todayLog = get().getTodayLog()
        if (!currentTargets || !todayLog) return false
        // Use snapshot targets for consistency if available
        const targets = todayLog.targetSnapshot || currentTargets
        // Within 10g of goal
        return Math.abs(todayLog.protein - targets.protein) <= 10
      },

      isCalorieTargetHit: () => {
        const currentTargets = get().targets
        const todayLog = get().getTodayLog()
        if (!currentTargets || !todayLog) return false
        // Use snapshot targets for consistency if available
        const targets = todayLog.targetSnapshot || currentTargets
        // Within 100 cal of goal
        return Math.abs(todayLog.calories - targets.calories) <= 100
      },

      isPerfectDay: () => {
        return get().isProteinTargetHit() && get().isCalorieTargetHit()
      },

      setSavedMeals: (meals) => set({ savedMeals: meals }),

      setCoachTargets: (targets, coachId) => {
        set({
          targets,
          setBy: 'coach',
          setByCoachId: coachId,
          coachMacroUpdated: true,
        })
        // Regenerate meal plan with new targets
        get().generateMealPlan()
      },

      dismissCoachMacroUpdated: () => set({ coachMacroUpdated: false }),

      setActivityLevel: (level) => set({ activityLevel: level }),

      resetMacros: () => set({
        targets: null,
        mealPlan: [],
        dailyLogs: [],
        setBy: 'self',
        setByCoachId: null,
      }),

      exportData: () => {
        const state = get()
        return JSON.stringify({
          macros: {
            targets: state.targets,
            mealPlan: state.mealPlan,
            dailyLogs: state.dailyLogs,
            activityLevel: state.activityLevel
          }
        }, null, 2)
      },

      importData: (data: string) => {
        try {
          const parsed = JSON.parse(data)
          if (!parsed.macros) return false

          const macros = parsed.macros

          // Validate targets if provided (BUG-020 fix)
          if (macros.targets !== null && macros.targets !== undefined) {
            if (!isValidMacroTargets(macros.targets)) {
              if (import.meta.env.DEV) console.error('[Import] Invalid macro targets structure')
              return false
            }
          }

          // Validate activity level
          if (macros.activityLevel && !isValidActivityLevel(macros.activityLevel)) {
            if (import.meta.env.DEV) console.error('[Import] Invalid activity level')
            return false
          }

          // Validate daily logs array
          if (macros.dailyLogs && isArray(macros.dailyLogs)) {
            const validLogs = macros.dailyLogs.filter(isValidDailyLog)
            if (import.meta.env.DEV && validLogs.length !== macros.dailyLogs.length) {
              console.warn(`[Import] Filtered out ${macros.dailyLogs.length - validLogs.length} invalid daily logs`)
            }
            macros.dailyLogs = validLogs
          }

          set({
            targets: macros.targets || null,
            mealPlan: isArray(macros.mealPlan) ? macros.mealPlan : [],
            dailyLogs: isArray(macros.dailyLogs) ? macros.dailyLogs : [],
            activityLevel: macros.activityLevel || 'moderate'
          })
          return true
        } catch (err) {
          if (import.meta.env.DEV) console.error('[Import] Failed to parse macro data:', err)
          return false
        }
      }
    }),
    {
      name: 'gamify-gains-macros',
      version: 4, // Bump version when schema changes (BUG-008 fix)
      // Validate and migrate data on load
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>

        // v3 → v4: add favoriteFoods
        if (version < 4) {
          if (!isArray(state.favoriteFoods)) {
            state.favoriteFoods = []
          }
        }

        // v2 → v3: add recentFoods
        if (version < 3) {
          if (!isArray(state.recentFoods)) {
            state.recentFoods = []
          }
        }

        // If coming from version 0 or 1, validate the data structure
        if (version < 2) {
          if (import.meta.env.DEV) console.log('[Macros] Migrating from version', version)

          // Validate targets
          if (state.targets !== null && state.targets !== undefined) {
            if (!isValidMacroTargets(state.targets)) {
              if (import.meta.env.DEV) console.warn('[Macros] Invalid targets found during migration, resetting')
              state.targets = null
            }
          }

          // Validate activity level
          if (state.activityLevel && !isValidActivityLevel(state.activityLevel)) {
            if (import.meta.env.DEV) console.warn('[Macros] Invalid activity level found during migration, resetting')
            state.activityLevel = 'moderate'
          }

          // Validate daily logs
          if (state.dailyLogs && isArray(state.dailyLogs)) {
            const validLogs = (state.dailyLogs as unknown[]).filter(isValidDailyLog)
            if (import.meta.env.DEV && validLogs.length !== (state.dailyLogs as unknown[]).length) {
              console.warn(`[Macros] Filtered ${(state.dailyLogs as unknown[]).length - validLogs.length} invalid logs`)
            }
            state.dailyLogs = validLogs
          } else {
            state.dailyLogs = []
          }

          // Ensure arrays
          if (!isArray(state.mealPlan)) {
            state.mealPlan = []
          }
          if (!isArray(state.savedMeals)) {
            state.savedMeals = []
          }
        }

        return state as unknown as MacroStore
      },
      // Log hydration errors
      onRehydrateStorage: () => {
        return (state, error) => {
          if (import.meta.env.DEV) {
            if (error) {
              console.error('[Macros] Failed to rehydrate from storage:', error)
            } else if (state) {
              console.log('[Macros] Hydrated from storage')
            }
          }
        }
      }
    }
  )
)
