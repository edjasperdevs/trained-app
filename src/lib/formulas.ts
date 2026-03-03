import { Gender, Goal } from '@/stores'

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'

export const MacroCalculator = {
    calculateDailyMacros: (weight: number, height: number, age: number, gender: Gender, goal: Goal, activity: ActivityLevel) => {
        const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725
        }

        const GOAL_CALORIE_ADJUSTMENTS: Record<Goal, number> = {
            cut: -500,
            recomp: -200,
            maintain: 0,
            bulk: 300
        }

        const weightKg = weight * 0.453592
        const heightCm = height * 2.54
        const genderAdjustment = gender === 'male' ? 5 : -161
        const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + genderAdjustment

        const multiplier = ACTIVITY_MULTIPLIERS[activity] || 1.55
        const tdee = bmr * multiplier
        const adjustment = GOAL_CALORIE_ADJUSTMENTS[goal] || 0
        const adjustedCalories = Math.round(tdee + adjustment)

        const protein = Math.round(weight * 1)
        const fatCalories = adjustedCalories * 0.27
        const fats = Math.round(fatCalories / 9)
        const proteinCalories = protein * 4
        const carbCalories = adjustedCalories - proteinCalories - fatCalories
        const carbs = Math.round(carbCalories / 4)

        return { protein, calories: adjustedCalories, carbs, fats }
    }
}
