/**
 * Data Validation Utilities (BUG-020 fix)
 *
 * Provides type guards and validation functions for imported data
 * to prevent corrupted data from being loaded into the app.
 */

// ==========================================
// Type Guards
// ==========================================

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// ==========================================
// Macro Validation
// ==========================================

export interface MacroTargetsShape {
  protein: number
  calories: number
  carbs: number
  fats: number
}

export function isValidMacroTargets(value: unknown): value is MacroTargetsShape {
  if (!isObject(value)) return false
  return (
    isNumber(value.protein) && value.protein >= 0 && value.protein <= 1000 &&
    isNumber(value.calories) && value.calories >= 0 && value.calories <= 10000 &&
    isNumber(value.carbs) && value.carbs >= 0 && value.carbs <= 2000 &&
    isNumber(value.fats) && value.fats >= 0 && value.fats <= 1000
  )
}

export function isValidActivityLevel(value: unknown): value is 'sedentary' | 'light' | 'moderate' | 'active' {
  return value === 'sedentary' || value === 'light' || value === 'moderate' || value === 'active'
}

export function isValidDailyLog(value: unknown): boolean {
  if (!isObject(value)) return false
  return (
    isString(value.date) &&
    isNumber(value.protein) &&
    isNumber(value.calories) &&
    isNumber(value.carbs) &&
    isNumber(value.fats) &&
    isArray(value.meals)
  )
}

// ==========================================
// Workout Validation
// ==========================================

export function isValidWorkoutLog(value: unknown): boolean {
  if (!isObject(value)) return false
  return (
    isString(value.id) &&
    isString(value.date) &&
    isString(value.workoutType) &&
    isBoolean(value.completed) &&
    isArray(value.exercises)
  )
}

// ==========================================
// XP Validation
// ==========================================

export function isValidXPState(value: unknown): boolean {
  if (!isObject(value)) return false
  return (
    isNumber(value.totalXP) && value.totalXP >= 0 &&
    isNumber(value.currentLevel) && value.currentLevel >= 0 &&
    isNumber(value.pendingXP) && value.pendingXP >= 0
  )
}

// ==========================================
// Avatar Validation
// ==========================================

export function isValidAvatarBase(value: unknown): value is 'dominant' | 'switch' | 'submissive' {
  return value === 'dominant' || value === 'switch' || value === 'submissive'
}

export function isValidEvolutionStage(value: unknown): value is number {
  return isNumber(value) && value >= 0 && value <= 12
}

export function isValidMood(value: unknown): value is 'happy' | 'neutral' | 'sad' | 'hyped' | 'neglected' {
  return value === 'happy' || value === 'neutral' || value === 'sad' || value === 'hyped' || value === 'neglected'
}

// ==========================================
// Generic Validation Helper
// ==========================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateImportData(
  data: unknown,
  validators: { field: string; check: (value: unknown) => boolean }[]
): ValidationResult {
  const errors: string[] = []

  if (!isObject(data)) {
    return { valid: false, errors: ['Data must be an object'] }
  }

  for (const { field, check } of validators) {
    const value = (data as Record<string, unknown>)[field]
    if (value !== undefined && !check(value)) {
      errors.push(`Invalid value for field: ${field}`)
    }
  }

  return { valid: errors.length === 0, errors }
}
