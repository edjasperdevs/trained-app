export { useUserStore } from './userStore'
export type { UserProfile, FitnessLevel, TrainingDays, Goal, AvatarBase, Gender, WeightEntry } from './userStore'

export { useAuthStore } from './authStore'

export { useXPStore } from './xpStore'
export type { WeeklyHistory, DailyXP } from './xpStore'

export { useMacroStore } from './macroStore'
export type { MacroTargets, MealPlan, DailyMacroLog, SavedMeal, LoggedMeal } from './macroStore'

export { useWorkoutStore } from './workoutStore'
export type { WorkoutType, ExerciseSet, Exercise, WorkoutLog, WorkoutPlan, DayOfWeek } from './workoutStore'

export { useAvatarStore, EVOLUTION_STAGES } from './avatarStore'
export type { EvolutionStage, AvatarMood, EvolutionInfo } from './avatarStore'

export { useToastStore, toast } from './toastStore'
export type { Toast, ToastType } from './toastStore'
