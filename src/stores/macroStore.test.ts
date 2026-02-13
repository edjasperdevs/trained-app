import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMacroStore } from './macroStore'

describe('macroStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useMacroStore.setState({
      targets: null,
      mealPlan: [],
      dailyLogs: [],
      savedMeals: [],
      recentFoods: [],
      favoriteFoods: [],
      activityLevel: 'moderate'
    })
  })

  describe('calculateMacros', () => {
    it('should calculate macros for a male on a cut', () => {
      const { calculateMacros } = useMacroStore.getState()

      // 180 lbs, 70 inches (5'10"), 30 years old, male, cut, moderate activity
      calculateMacros(180, 70, 30, 'male', 'cut', 'moderate')

      const { targets } = useMacroStore.getState()
      expect(targets).not.toBeNull()
      expect(targets?.protein).toBe(180) // 1g per lb
      expect(targets?.calories).toBeLessThan(2500) // Should be in deficit
      expect(targets?.carbs).toBeGreaterThan(0)
      expect(targets?.fats).toBeGreaterThan(0)
    })

    it('should calculate macros for a female on a bulk', () => {
      const { calculateMacros } = useMacroStore.getState()

      // 130 lbs, 64 inches (5'4"), 25 years old, female, bulk, active
      calculateMacros(130, 64, 25, 'female', 'bulk', 'active')

      const { targets } = useMacroStore.getState()
      expect(targets).not.toBeNull()
      expect(targets?.protein).toBe(130) // 1g per lb
      expect(targets?.calories).toBeGreaterThan(2000) // Should be in surplus
    })

    it('should generate meal plan after calculating macros', () => {
      const { calculateMacros } = useMacroStore.getState()

      calculateMacros(180, 70, 30, 'male', 'maintain', 'moderate')

      const { mealPlan } = useMacroStore.getState()
      expect(mealPlan).toHaveLength(5)
      expect(mealPlan[0].name).toBe('Meal 1 (Breakfast)')
      expect(mealPlan[4].name).toBe('Meal 5 (Evening)')
    })

    it('should apply different activity level multipliers', () => {
      const { calculateMacros } = useMacroStore.getState()

      // Calculate with sedentary
      calculateMacros(180, 70, 30, 'male', 'maintain', 'sedentary')
      const sedentaryCalories = useMacroStore.getState().targets?.calories

      // Reset and calculate with active
      useMacroStore.setState({ targets: null, mealPlan: [] })
      calculateMacros(180, 70, 30, 'male', 'maintain', 'active')
      const activeCalories = useMacroStore.getState().targets?.calories

      expect(activeCalories).toBeGreaterThan(sedentaryCalories!)
    })
  })

  describe('generateMealPlan', () => {
    it('should not generate meal plan without targets', () => {
      const { generateMealPlan } = useMacroStore.getState()

      generateMealPlan()

      const { mealPlan } = useMacroStore.getState()
      expect(mealPlan).toHaveLength(0)
    })

    it('should distribute macros across 5 meals', () => {
      useMacroStore.setState({
        targets: { protein: 180, calories: 2500, carbs: 250, fats: 80 }
      })

      const { generateMealPlan } = useMacroStore.getState()
      generateMealPlan()

      const { mealPlan, targets } = useMacroStore.getState()
      expect(mealPlan).toHaveLength(5)

      // Check total protein is approximately equal to target
      const totalProtein = mealPlan.reduce((sum, meal) => sum + meal.protein, 0)
      expect(totalProtein).toBeCloseTo(targets!.protein, -1) // Within 10
    })
  })

  describe('logNamedMeal', () => {
    it('should log a named meal with timestamp', () => {
      const { logNamedMeal } = useMacroStore.getState()
      const beforeTime = Date.now()

      logNamedMeal('Chicken and Rice', { protein: 50, carbs: 60, fats: 10, calories: 530 })

      const todayLog = useMacroStore.getState().getTodayLog()
      expect(todayLog?.loggedMeals).toHaveLength(1)
      expect(todayLog?.loggedMeals[0].name).toBe('Chicken and Rice')
      expect(todayLog?.loggedMeals[0].timestamp).toBeGreaterThanOrEqual(beforeTime)
    })

    it('should accumulate multiple named meals', () => {
      const { logNamedMeal } = useMacroStore.getState()

      logNamedMeal('Breakfast', { protein: 30, carbs: 40, fats: 10, calories: 370 })
      logNamedMeal('Lunch', { protein: 40, carbs: 50, fats: 15, calories: 495 })

      const todayLog = useMacroStore.getState().getTodayLog()
      expect(todayLog?.loggedMeals).toHaveLength(2)
      expect(todayLog?.protein).toBe(70)
      expect(todayLog?.calories).toBe(865)
    })
  })

  describe('logQuickMacros', () => {
    it('should log partial macros', () => {
      const { logQuickMacros } = useMacroStore.getState()

      logQuickMacros({ protein: 25 })

      const todayLog = useMacroStore.getState().getTodayLog()
      expect(todayLog?.protein).toBe(25)
      expect(todayLog?.calories).toBe(0)
    })

    it('should update existing log values', () => {
      const { logQuickMacros } = useMacroStore.getState()

      logQuickMacros({ protein: 25, calories: 200 })
      logQuickMacros({ protein: 50 })

      const todayLog = useMacroStore.getState().getTodayLog()
      expect(todayLog?.protein).toBe(50)
      expect(todayLog?.calories).toBe(200) // Unchanged
    })
  })

  describe('saveMeal', () => {
    it('should save a meal with ingredients', () => {
      const { saveMeal, getSavedMeals } = useMacroStore.getState()

      saveMeal('My Chicken Bowl', [
        { id: '1', name: 'Chicken', quantity: 200, unit: 'g', protein: 50, carbs: 0, fats: 5, calories: 245 },
        { id: '2', name: 'Rice', quantity: 150, unit: 'g', protein: 4, carbs: 45, fats: 0, calories: 196 }
      ])

      const savedMeals = useMacroStore.getState().getSavedMeals()
      expect(savedMeals).toHaveLength(1)
      expect(savedMeals[0].name).toBe('My Chicken Bowl')
      expect(savedMeals[0].protein).toBe(54) // 50 + 4
      expect(savedMeals[0].calories).toBe(441) // 245 + 196
      expect(savedMeals[0].ingredients).toHaveLength(2)
    })
  })

  describe('deleteSavedMeal', () => {
    it('should delete a saved meal', () => {
      useMacroStore.getState().saveMeal('To Delete', [
        { id: '1', name: 'Ingredient', quantity: 100, unit: 'g', protein: 10, carbs: 10, fats: 5, calories: 125 }
      ])
      const mealId = useMacroStore.getState().savedMeals[0].id

      useMacroStore.getState().deleteSavedMeal(mealId)

      expect(useMacroStore.getState().savedMeals).toHaveLength(0)
    })
  })

  describe('getSavedMeals', () => {
    it('should return meals sorted by usage count', () => {
      // Save two meals
      useMacroStore.getState().saveMeal('Meal A', [
        { id: '1', name: 'Ing', quantity: 100, unit: 'g', protein: 10, carbs: 10, fats: 5, calories: 125 }
      ])
      useMacroStore.getState().saveMeal('Meal B', [
        { id: '2', name: 'Ing', quantity: 100, unit: 'g', protein: 10, carbs: 10, fats: 5, calories: 125 }
      ])

      // Update usage count for Meal B via setState (editSavedMeal was removed as dead code)
      const mealBId = useMacroStore.getState().savedMeals[1].id
      useMacroStore.setState((state) => ({
        savedMeals: state.savedMeals.map(m =>
          m.id === mealBId ? { ...m, usageCount: 5 } : m
        )
      }))

      const sorted = useMacroStore.getState().getSavedMeals()
      expect(sorted[0].name).toBe('Meal B') // Higher usage count first
    })
  })

  describe('getTodayMeals', () => {
    it('should return empty array when no meals logged', () => {
      const meals = useMacroStore.getState().getTodayMeals()
      expect(meals).toHaveLength(0)
    })

    it('should return logged meals for today', () => {
      useMacroStore.getState().logNamedMeal('Breakfast', { protein: 30, carbs: 40, fats: 10, calories: 370 })
      useMacroStore.getState().logNamedMeal('Lunch', { protein: 40, carbs: 50, fats: 15, calories: 495 })

      const meals = useMacroStore.getState().getTodayMeals()
      expect(meals).toHaveLength(2)
    })
  })

  describe('deleteLoggedMeal', () => {
    it('should delete a logged meal and update totals', () => {
      useMacroStore.getState().logNamedMeal('Breakfast', { protein: 30, carbs: 40, fats: 10, calories: 370 })
      useMacroStore.getState().logNamedMeal('Lunch', { protein: 40, carbs: 50, fats: 15, calories: 495 })

      const mealId = useMacroStore.getState().getTodayLog()!.loggedMeals[0].id
      useMacroStore.getState().deleteLoggedMeal(mealId)

      const todayLog = useMacroStore.getState().getTodayLog()
      expect(todayLog?.loggedMeals).toHaveLength(1)
      expect(todayLog?.protein).toBe(40) // Only Lunch remains
      expect(todayLog?.calories).toBe(495)
    })
  })

  describe('getTodayProgress', () => {
    it('should return null when no targets set', () => {
      const progress = useMacroStore.getState().getTodayProgress()
      expect(progress).toBeNull()
    })

    it('should return progress percentages', () => {
      useMacroStore.setState({
        targets: { protein: 180, calories: 2500, carbs: 250, fats: 80 }
      })
      useMacroStore.getState().logNamedMeal('Meal', { protein: 90, carbs: 125, fats: 40, calories: 1250 })

      const progress = useMacroStore.getState().getTodayProgress()
      expect(progress?.protein.percentage).toBe(50)
      expect(progress?.calories.percentage).toBe(50)
      expect(progress?.protein.current).toBe(90)
      expect(progress?.protein.target).toBe(180)
    })

    it('should cap percentage at 100', () => {
      useMacroStore.setState({
        targets: { protein: 180, calories: 2500, carbs: 250, fats: 80 }
      })
      useMacroStore.getState().logNamedMeal('Big Meal', { protein: 200, carbs: 300, fats: 100, calories: 3000 })

      const progress = useMacroStore.getState().getTodayProgress()
      expect(progress?.protein.percentage).toBe(100) // Capped
      expect(progress?.protein.current).toBe(200) // Actual value not capped
    })
  })

  describe('isProteinTargetHit', () => {
    beforeEach(() => {
      useMacroStore.setState({
        targets: { protein: 180, calories: 2500, carbs: 250, fats: 80 }
      })
    })

    it('should return false when no meals logged', () => {
      expect(useMacroStore.getState().isProteinTargetHit()).toBe(false)
    })

    it('should return true when within 10g of target', () => {
      useMacroStore.getState().logNamedMeal('Meal', { protein: 175, carbs: 0, fats: 0, calories: 700 })
      expect(useMacroStore.getState().isProteinTargetHit()).toBe(true)
    })

    it('should return true when exactly at target', () => {
      useMacroStore.getState().logNamedMeal('Meal', { protein: 180, carbs: 0, fats: 0, calories: 720 })
      expect(useMacroStore.getState().isProteinTargetHit()).toBe(true)
    })

    it('should return false when more than 10g away', () => {
      useMacroStore.getState().logNamedMeal('Meal', { protein: 160, carbs: 0, fats: 0, calories: 640 })
      expect(useMacroStore.getState().isProteinTargetHit()).toBe(false)
    })
  })

  describe('isCalorieTargetHit', () => {
    beforeEach(() => {
      useMacroStore.setState({
        targets: { protein: 180, calories: 2500, carbs: 250, fats: 80 }
      })
    })

    it('should return false when no meals logged', () => {
      expect(useMacroStore.getState().isCalorieTargetHit()).toBe(false)
    })

    it('should return true when within 100 cal of target', () => {
      useMacroStore.getState().logNamedMeal('Meal', { protein: 0, carbs: 0, fats: 0, calories: 2450 })
      expect(useMacroStore.getState().isCalorieTargetHit()).toBe(true)
    })

    it('should return false when more than 100 cal away', () => {
      useMacroStore.getState().logNamedMeal('Meal', { protein: 0, carbs: 0, fats: 0, calories: 2000 })
      expect(useMacroStore.getState().isCalorieTargetHit()).toBe(false)
    })
  })

  describe('isPerfectDay', () => {
    beforeEach(() => {
      useMacroStore.setState({
        targets: { protein: 180, calories: 2500, carbs: 250, fats: 80 }
      })
    })

    it('should return false when neither target hit', () => {
      useMacroStore.getState().logNamedMeal('Meal', { protein: 50, carbs: 0, fats: 0, calories: 500 })
      expect(useMacroStore.getState().isPerfectDay()).toBe(false)
    })

    it('should return false when only protein hit', () => {
      useMacroStore.getState().logNamedMeal('Meal', { protein: 180, carbs: 0, fats: 0, calories: 500 })
      expect(useMacroStore.getState().isPerfectDay()).toBe(false)
    })

    it('should return true when both targets hit', () => {
      useMacroStore.getState().logNamedMeal('Meal', { protein: 180, carbs: 250, fats: 80, calories: 2500 })
      expect(useMacroStore.getState().isPerfectDay()).toBe(true)
    })
  })

  describe('addRecentFood', () => {
    it('should add a food to recents', () => {
      const food = {
        id: 'food-1', name: 'Chicken Breast', protein: 31, carbs: 0, fats: 3.6, calories: 165,
        servingSize: 100, servingDescription: '100g', quantity: 100, unit: 'g' as const, loggedAt: Date.now(),
      }

      useMacroStore.getState().addRecentFood(food)

      expect(useMacroStore.getState().recentFoods).toHaveLength(1)
      expect(useMacroStore.getState().recentFoods[0].name).toBe('Chicken Breast')
    })

    it('should deduplicate by name+brand (case-insensitive)', () => {
      const food1 = {
        id: 'food-1', name: 'Chicken Breast', brand: 'Tyson', protein: 31, carbs: 0, fats: 3.6, calories: 165,
        servingSize: 100, servingDescription: '100g', quantity: 100, unit: 'g' as const, loggedAt: Date.now(),
      }
      const food2 = {
        id: 'food-2', name: 'chicken breast', brand: 'tyson', protein: 31, carbs: 0, fats: 3.6, calories: 165,
        servingSize: 100, servingDescription: '100g', quantity: 100, unit: 'g' as const, loggedAt: Date.now() + 1000,
      }

      useMacroStore.getState().addRecentFood(food1)
      useMacroStore.getState().addRecentFood(food2)

      expect(useMacroStore.getState().recentFoods).toHaveLength(1)
      expect(useMacroStore.getState().recentFoods[0].id).toBe('food-2') // Most recent wins
    })

    it('should cap at 5 recent foods', () => {
      for (let i = 0; i < 7; i++) {
        useMacroStore.getState().addRecentFood({
          id: `food-${i}`, name: `Food ${i}`, protein: 10, carbs: 10, fats: 5, calories: 125,
          servingSize: 1, servingDescription: '1 serving', quantity: 1, unit: 'serving', loggedAt: Date.now() + i,
        })
      }

      expect(useMacroStore.getState().recentFoods).toHaveLength(5)
      expect(useMacroStore.getState().recentFoods[0].name).toBe('Food 6') // Most recent first
    })
  })

  describe('toggleFavoriteFood', () => {
    const food = {
      id: 'fav-1', name: 'Greek Yogurt', protein: 17, carbs: 6, fats: 0.7, calories: 100,
      servingSize: 170, servingDescription: '1 container', quantity: 1, unit: 'serving' as const, loggedAt: Date.now(),
    }

    it('should add a food to favorites', () => {
      useMacroStore.getState().toggleFavoriteFood(food)

      expect(useMacroStore.getState().favoriteFoods).toHaveLength(1)
      expect(useMacroStore.getState().favoriteFoods[0].name).toBe('Greek Yogurt')
    })

    it('should remove a food from favorites when toggled again', () => {
      useMacroStore.getState().toggleFavoriteFood(food)
      expect(useMacroStore.getState().favoriteFoods).toHaveLength(1)

      useMacroStore.getState().toggleFavoriteFood(food)
      expect(useMacroStore.getState().favoriteFoods).toHaveLength(0)
    })

    it('should match by id, not name', () => {
      const food2 = { ...food, id: 'fav-2', name: 'Greek Yogurt' }

      useMacroStore.getState().toggleFavoriteFood(food)
      useMacroStore.getState().toggleFavoriteFood(food2)

      expect(useMacroStore.getState().favoriteFoods).toHaveLength(2)
    })

    it('should not have an upper limit on favorites', () => {
      for (let i = 0; i < 10; i++) {
        useMacroStore.getState().toggleFavoriteFood({
          ...food, id: `fav-${i}`, name: `Food ${i}`,
        })
      }

      expect(useMacroStore.getState().favoriteFoods).toHaveLength(10)
    })
  })

  describe('setActivityLevel', () => {
    it('should update activity level', () => {
      useMacroStore.getState().setActivityLevel('active')
      expect(useMacroStore.getState().activityLevel).toBe('active')

      useMacroStore.getState().setActivityLevel('sedentary')
      expect(useMacroStore.getState().activityLevel).toBe('sedentary')
    })
  })

  describe('resetMacros', () => {
    it('should reset targets, meal plan, and daily logs', () => {
      useMacroStore.setState({
        targets: { protein: 180, calories: 2500, carbs: 250, fats: 80 },
        mealPlan: [{ name: 'Meal 1', protein: 40, carbs: 50, fats: 15, calories: 500 }],
        dailyLogs: [{
          date: '2024-01-15',
          protein: 100,
          calories: 1500,
          carbs: 150,
          fats: 50,
          meals: [],
          loggedMeals: []
        }]
      })

      useMacroStore.getState().resetMacros()

      const state = useMacroStore.getState()
      expect(state.targets).toBeNull()
      expect(state.mealPlan).toHaveLength(0)
      expect(state.dailyLogs).toHaveLength(0)
    })
  })

  describe('exportData and importData', () => {
    it('should export data as JSON string', () => {
      useMacroStore.setState({
        targets: { protein: 180, calories: 2500, carbs: 250, fats: 80 },
        activityLevel: 'active'
      })

      const exported = useMacroStore.getState().exportData()
      const parsed = JSON.parse(exported)

      expect(parsed.macros.targets.protein).toBe(180)
      expect(parsed.macros.activityLevel).toBe('active')
    })

    it('should import valid data', () => {
      const data = JSON.stringify({
        macros: {
          targets: { protein: 200, calories: 3000, carbs: 300, fats: 100 },
          activityLevel: 'light',
          mealPlan: [],
          dailyLogs: []
        }
      })

      const result = useMacroStore.getState().importData(data)

      expect(result).toBe(true)
      expect(useMacroStore.getState().targets?.protein).toBe(200)
      expect(useMacroStore.getState().activityLevel).toBe('light')
    })

    it('should return false for invalid data', () => {
      const result = useMacroStore.getState().importData('invalid json')
      expect(result).toBe(false)
    })

    it('should return false for data without macros key', () => {
      const result = useMacroStore.getState().importData(JSON.stringify({ other: 'data' }))
      expect(result).toBe(false)
    })
  })
})
