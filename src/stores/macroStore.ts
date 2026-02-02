import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Goal, Gender } from './userStore'

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
}

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'

interface MacroStore {
  targets: MacroTargets | null
  mealPlan: MealPlan[]
  dailyLogs: DailyMacroLog[]
  savedMeals: SavedMeal[]
  activityLevel: ActivityLevel

  // Actions
  calculateMacros: (weight: number, height: number, age: number, gender: Gender, goal: Goal, activity: ActivityLevel) => void
  generateMealPlan: () => void
  logMeal: (mealNumber: number, macros: { protein: number; carbs: number; fats: number; calories: number }) => void
  logNamedMeal: (name: string, macros: { protein: number; carbs: number; fats: number; calories: number }) => void
  logQuickMacros: (macros: Partial<MacroTargets>) => void
  saveMeal: (name: string, ingredients: MealIngredient[]) => void
  editSavedMeal: (id: string, updates: Partial<Omit<SavedMeal, 'id' | 'createdAt'>>) => void
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

export const useMacroStore = create<MacroStore>()(
  persist(
    (set, get) => ({
      targets: null,
      mealPlan: [],
      dailyLogs: [],
      savedMeals: [],
      activityLevel: 'moderate',

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
          activityLevel: activity
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

      logMeal: (mealNumber, macros) => {
        const today = new Date().toISOString().split('T')[0]
        const existingLog = get().dailyLogs.find(log => log.date === today)

        if (existingLog) {
          const updatedMeals = existingLog.meals.map(meal =>
            meal.mealNumber === mealNumber
              ? { ...meal, ...macros, logged: true }
              : meal
          )

          // Check if meal exists, if not add it
          if (!updatedMeals.find(m => m.mealNumber === mealNumber)) {
            updatedMeals.push({ mealNumber, ...macros, logged: true })
          }

          const totals = updatedMeals.reduce(
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
                ? { ...log, ...totals, meals: updatedMeals }
                : log
            )
          }))
        } else {
          const newLog: DailyMacroLog = {
            date: today,
            ...macros,
            meals: [{ mealNumber, ...macros, logged: true }],
            loggedMeals: []
          }
          set((state) => ({
            dailyLogs: [...state.dailyLogs, newLog]
          }))
        }
      },

      logNamedMeal: (name, macros) => {
        const today = new Date().toISOString().split('T')[0]
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
          const newLog: DailyMacroLog = {
            date: today,
            ...macros,
            meals: [],
            loggedMeals: [newMeal]
          }
          set((state) => ({
            dailyLogs: [...state.dailyLogs, newLog]
          }))
        }
      },

      logQuickMacros: (macros) => {
        const today = new Date().toISOString().split('T')[0]
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
          set((state) => ({
            dailyLogs: [
              ...state.dailyLogs,
              {
                date: today,
                protein: macros.protein ?? 0,
                calories: macros.calories ?? 0,
                carbs: macros.carbs ?? 0,
                fats: macros.fats ?? 0,
                meals: [],
                loggedMeals: []
              }
            ]
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

      editSavedMeal: (id, updates) => {
        set((state) => ({
          savedMeals: state.savedMeals.map(meal =>
            meal.id === id ? { ...meal, ...updates } : meal
          )
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
        const today = new Date().toISOString().split('T')[0]
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
        const today = new Date().toISOString().split('T')[0]
        return get().dailyLogs.find(log => log.date === today) || null
      },

      getTodayProgress: () => {
        const targets = get().targets
        const todayLog = get().getTodayLog()

        if (!targets) return null

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
        const targets = get().targets
        const todayLog = get().getTodayLog()
        if (!targets || !todayLog) return false
        // Within 10g of goal
        return Math.abs(todayLog.protein - targets.protein) <= 10
      },

      isCalorieTargetHit: () => {
        const targets = get().targets
        const todayLog = get().getTodayLog()
        if (!targets || !todayLog) return false
        // Within 100 cal of goal
        return Math.abs(todayLog.calories - targets.calories) <= 100
      },

      isPerfectDay: () => {
        return get().isProteinTargetHit() && get().isCalorieTargetHit()
      },

      setActivityLevel: (level) => set({ activityLevel: level }),

      resetMacros: () => set({
        targets: null,
        mealPlan: [],
        dailyLogs: []
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
          if (parsed.macros) {
            set({
              targets: parsed.macros.targets || null,
              mealPlan: parsed.macros.mealPlan || [],
              dailyLogs: parsed.macros.dailyLogs || [],
              activityLevel: parsed.macros.activityLevel || 'moderate'
            })
            return true
          }
          return false
        } catch {
          return false
        }
      }
    }),
    {
      name: 'gamify-gains-macros',
    }
  )
)
