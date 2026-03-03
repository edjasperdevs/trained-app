/**
 * Validation schemas for Edge Function inputs/outputs.
 * Uses manual validation since Zod isn't easily available in Deno.
 */

interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Meal Plan Schema
// ─────────────────────────────────────────────────────────────────────────────

export interface MealIngredient {
  name: string
  amount: string
}

export interface Meal {
  name: string
  protein: number
  carbs: number
  fats: number
  calories: number
  ingredients: MealIngredient[]
  instructions: string
}

export interface MealPlan {
  meals: Meal[]
  daily_totals?: {
    protein: number
    carbs: number
    fats: number
    calories: number
  }
}

/**
 * Sanitize a string to prevent XSS
 */
function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Validate a single ingredient
 */
function validateIngredient(ingredient: unknown): ValidationResult<MealIngredient> {
  if (!ingredient || typeof ingredient !== 'object') {
    return { success: false, error: 'Ingredient must be an object' }
  }

  const ing = ingredient as Record<string, unknown>

  if (typeof ing.name !== 'string' || ing.name.length === 0) {
    return { success: false, error: 'Ingredient name is required' }
  }
  if (typeof ing.amount !== 'string') {
    return { success: false, error: 'Ingredient amount is required' }
  }

  return {
    success: true,
    data: {
      name: sanitizeString(ing.name.trim().slice(0, 100)),
      amount: sanitizeString(ing.amount.trim().slice(0, 50)),
    },
  }
}

/**
 * Validate and sanitize a single meal
 */
function validateMeal(meal: unknown, index: number): ValidationResult<Meal> {
  if (!meal || typeof meal !== 'object') {
    return { success: false, error: `Meal ${index} must be an object` }
  }

  const m = meal as Record<string, unknown>

  // Validate name
  if (typeof m.name !== 'string' || m.name.length === 0) {
    return { success: false, error: `Meal ${index} name is required` }
  }

  // Validate numeric fields
  const numericFields = ['protein', 'carbs', 'fats', 'calories'] as const
  for (const field of numericFields) {
    const value = m[field]
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { success: false, error: `Meal ${index} ${field} must be a number` }
    }
    if (value < 0 || value > 10000) {
      return { success: false, error: `Meal ${index} ${field} is out of range (0-10000)` }
    }
  }

  // Validate ingredients
  if (!Array.isArray(m.ingredients)) {
    return { success: false, error: `Meal ${index} ingredients must be an array` }
  }

  const validatedIngredients: MealIngredient[] = []
  for (let i = 0; i < m.ingredients.length; i++) {
    const ingredientResult = validateIngredient(m.ingredients[i])
    if (!ingredientResult.success) {
      return { success: false, error: `Meal ${index}, ${ingredientResult.error}` }
    }
    validatedIngredients.push(ingredientResult.data!)
  }

  // Validate instructions
  if (typeof m.instructions !== 'string') {
    return { success: false, error: `Meal ${index} instructions must be a string` }
  }

  return {
    success: true,
    data: {
      name: sanitizeString(m.name.trim().slice(0, 100)),
      protein: Math.round(m.protein as number),
      carbs: Math.round(m.carbs as number),
      fats: Math.round(m.fats as number),
      calories: Math.round(m.calories as number),
      ingredients: validatedIngredients,
      instructions: sanitizeString((m.instructions as string).trim().slice(0, 2000)),
    },
  }
}

/**
 * Validate and sanitize a complete meal plan from AI response
 */
export function validateMealPlan(data: unknown): ValidationResult<MealPlan> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Meal plan must be an object' }
  }

  const plan = data as Record<string, unknown>

  // Validate meals array
  if (!Array.isArray(plan.meals)) {
    return { success: false, error: 'Meal plan must contain a meals array' }
  }

  if (plan.meals.length === 0) {
    return { success: false, error: 'Meal plan must contain at least one meal' }
  }

  if (plan.meals.length > 10) {
    return { success: false, error: 'Meal plan cannot contain more than 10 meals' }
  }

  const validatedMeals: Meal[] = []
  for (let i = 0; i < plan.meals.length; i++) {
    const mealResult = validateMeal(plan.meals[i], i + 1)
    if (!mealResult.success) {
      return { success: false, error: mealResult.error }
    }
    validatedMeals.push(mealResult.data!)
  }

  // Validate daily totals if present
  let dailyTotals: MealPlan['daily_totals'] = undefined
  if (plan.daily_totals && typeof plan.daily_totals === 'object') {
    const totals = plan.daily_totals as Record<string, unknown>
    const fields = ['protein', 'carbs', 'fats', 'calories'] as const

    dailyTotals = {} as NonNullable<MealPlan['daily_totals']>
    for (const field of fields) {
      const value = totals[field]
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 50000) {
        dailyTotals[field] = Math.round(value)
      } else {
        // Calculate from meals if missing or invalid
        dailyTotals[field] = validatedMeals.reduce((sum, meal) => sum + meal[field], 0)
      }
    }
  }

  return {
    success: true,
    data: {
      meals: validatedMeals,
      daily_totals: dailyTotals,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Swap Request Schema
// ─────────────────────────────────────────────────────────────────────────────

export interface SwapRequest {
  planId: string
  mealIndex: number
  comments: string
}

export function validateSwapRequest(data: unknown): ValidationResult<SwapRequest> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Request body must be an object' }
  }

  const req = data as Record<string, unknown>

  if (typeof req.planId !== 'string' || req.planId.length === 0) {
    return { success: false, error: 'Plan ID is required' }
  }

  if (typeof req.mealIndex !== 'number' || !Number.isInteger(req.mealIndex)) {
    return { success: false, error: 'Meal index must be an integer' }
  }

  if (req.mealIndex < 0 || req.mealIndex > 9) {
    return { success: false, error: 'Meal index out of range' }
  }

  if (typeof req.comments !== 'string') {
    return { success: false, error: 'Comments must be a string' }
  }

  return {
    success: true,
    data: {
      planId: req.planId.trim(),
      mealIndex: req.mealIndex,
      comments: sanitizeString(req.comments.trim().slice(0, 500)),
    },
  }
}
