import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TrainingDays } from './userStore'

export type WorkoutType = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'rest'

export interface ExerciseSet {
  weight: number
  reps: number
  completed: boolean
  skipped?: boolean
}

export interface Exercise {
  id: string
  name: string
  targetSets: number
  targetReps: string
  sets: ExerciseSet[]
  notes?: string
}

export interface WorkoutLog {
  id: string
  date: string
  workoutType: WorkoutType
  dayNumber: number
  weekNumber: number
  exercises: Exercise[]
  completed: boolean
  xpAwarded: boolean
  startTime?: number
  endTime?: number
  isMinimal?: boolean // Minimum viable workout
  notes?: string // What they did for minimal workout
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // Sun=0, Mon=1, ..., Sat=6

export interface CustomExercise {
  id: string
  name: string
  targetSets: number
  targetReps: string
}

export interface WorkoutCustomization {
  workoutType: WorkoutType
  exercises: CustomExercise[]
}

export interface WorkoutPlan {
  trainingDays: TrainingDays
  selectedDays: DayOfWeek[] // Which days of the week user works out
  schedule: {
    day: number
    type: WorkoutType
    name: string
  }[]
}

interface WorkoutStore {
  currentPlan: WorkoutPlan | null
  workoutLogs: WorkoutLog[]
  currentWeek: number
  customizations: WorkoutCustomization[]

  // Actions
  setPlan: (trainingDays: TrainingDays, selectedDays?: DayOfWeek[]) => void
  setWorkoutDays: (days: DayOfWeek[]) => void
  getTodayWorkout: () => { type: WorkoutType; name: string; dayNumber: number } | null
  getWorkoutForDay: (dayOfWeek: number) => { type: WorkoutType; name: string } | null
  startWorkout: (type: WorkoutType, dayNumber: number) => string
  startMinimalWorkout: (notes: string) => string
  updateWorkoutNotes: (workoutId: string, notes: string) => void
  logSet: (workoutId: string, exerciseId: string, setIndex: number, data: Partial<ExerciseSet>) => void
  completeWorkout: (workoutId: string) => void
  markXPAwarded: (workoutId: string) => void
  getCurrentWorkout: () => WorkoutLog | null
  getWorkoutHistory: (limit?: number) => WorkoutLog[]
  getExerciseHistory: (exerciseName: string, limit?: number) => { date: string; sets: ExerciseSet[] }[]
  isWorkoutCompletedToday: () => boolean
  resetWorkouts: () => void
  exportData: () => string
  importData: (data: string) => boolean

  // Customization actions
  getExercisesForType: (type: WorkoutType) => Omit<Exercise, 'id' | 'sets'>[]
  setCustomExercises: (type: WorkoutType, exercises: CustomExercise[]) => void
  addExercise: (type: WorkoutType, exercise: Omit<CustomExercise, 'id'>) => void
  updateExercise: (type: WorkoutType, id: string, updates: Partial<Omit<CustomExercise, 'id'>>) => void
  removeExercise: (type: WorkoutType, id: string) => void
  reorderExercise: (type: WorkoutType, fromIndex: number, toIndex: number) => void
  resetToDefaults: (type: WorkoutType) => void
}

// Exercise templates for each workout type
const WORKOUT_TEMPLATES: Record<WorkoutType, Omit<Exercise, 'id' | 'sets'>[]> = {
  push: [
    { name: 'Bench Press', targetSets: 3, targetReps: '6-8' },
    { name: 'Overhead Press', targetSets: 3, targetReps: '8-10' },
    { name: 'Incline Dumbbell Press', targetSets: 2, targetReps: '8-12' },
    { name: 'Cable Flyes', targetSets: 2, targetReps: '12-15' },
    { name: 'Tricep Pushdowns', targetSets: 3, targetReps: '10-12' },
    { name: 'Lateral Raises', targetSets: 3, targetReps: '12-15' }
  ],
  pull: [
    { name: 'Barbell Rows', targetSets: 3, targetReps: '6-8' },
    { name: 'Lat Pulldowns', targetSets: 3, targetReps: '8-10' },
    { name: 'Seated Cable Rows', targetSets: 2, targetReps: '10-12' },
    { name: 'Face Pulls', targetSets: 3, targetReps: '12-15' },
    { name: 'Barbell Curls', targetSets: 2, targetReps: '8-10' },
    { name: 'Hammer Curls', targetSets: 2, targetReps: '10-12' }
  ],
  legs: [
    { name: 'Squats', targetSets: 3, targetReps: '6-8' },
    { name: 'Romanian Deadlifts', targetSets: 3, targetReps: '8-10' },
    { name: 'Leg Press', targetSets: 3, targetReps: '10-12' },
    { name: 'Leg Curls', targetSets: 2, targetReps: '10-12' },
    { name: 'Leg Extensions', targetSets: 2, targetReps: '12-15' },
    { name: 'Calf Raises', targetSets: 4, targetReps: '12-15' }
  ],
  upper: [
    { name: 'Bench Press', targetSets: 3, targetReps: '6-8' },
    { name: 'Barbell Rows', targetSets: 3, targetReps: '6-8' },
    { name: 'Overhead Press', targetSets: 2, targetReps: '8-10' },
    { name: 'Lat Pulldowns', targetSets: 2, targetReps: '10-12' },
    { name: 'Dumbbell Curls', targetSets: 2, targetReps: '10-12' },
    { name: 'Tricep Extensions', targetSets: 2, targetReps: '10-12' }
  ],
  lower: [
    { name: 'Squats', targetSets: 3, targetReps: '6-8' },
    { name: 'Romanian Deadlifts', targetSets: 3, targetReps: '8-10' },
    { name: 'Bulgarian Split Squats', targetSets: 2, targetReps: '10-12' },
    { name: 'Leg Curls', targetSets: 2, targetReps: '10-12' },
    { name: 'Leg Extensions', targetSets: 2, targetReps: '12-15' },
    { name: 'Calf Raises', targetSets: 3, targetReps: '12-15' }
  ],
  rest: []
}

const generateExercises = (type: WorkoutType, customizations: WorkoutCustomization[]): Exercise[] => {
  const customization = customizations.find(c => c.workoutType === type)
  const template = customization && customization.exercises.length > 0
    ? customization.exercises
    : WORKOUT_TEMPLATES[type]

  return template.map((ex, index) => ({
    name: ex.name,
    targetSets: ex.targetSets,
    targetReps: ex.targetReps,
    id: `${type}-${index}-${Date.now()}`,
    sets: Array.from({ length: ex.targetSets }, () => ({
      weight: 0,
      reps: 0,
      completed: false
    }))
  }))
}

// Get workout types for a given number of training days
const getWorkoutTypes = (trainingDays: TrainingDays): WorkoutType[] => {
  switch (trainingDays) {
    case 3:
      return ['push', 'pull', 'legs']
    case 4:
      return ['upper', 'lower', 'upper', 'lower']
    case 5:
      return ['push', 'pull', 'legs', 'upper', 'lower']
    default:
      return ['push', 'pull', 'legs']
  }
}

// Get workout name for type
const getWorkoutName = (type: WorkoutType): string => {
  const names: Record<WorkoutType, string> = {
    push: 'Push Day',
    pull: 'Pull Day',
    legs: 'Leg Day',
    upper: 'Upper Body',
    lower: 'Lower Body',
    rest: 'Rest'
  }
  return names[type]
}

// Build schedule from selected days
const buildSchedule = (trainingDays: TrainingDays, selectedDays: DayOfWeek[]): WorkoutPlan['schedule'] => {
  const workoutTypes = getWorkoutTypes(trainingDays)
  const schedule: WorkoutPlan['schedule'] = []

  // Map each day of the week
  for (let day = 0; day <= 6; day++) {
    const workoutIndex = selectedDays.indexOf(day as DayOfWeek)
    if (workoutIndex !== -1 && workoutIndex < workoutTypes.length) {
      const type = workoutTypes[workoutIndex]
      schedule.push({ day, type, name: getWorkoutName(type) })
    } else {
      schedule.push({ day, type: 'rest', name: 'Rest' })
    }
  }

  return schedule
}

// Default workout days for each training frequency
const getDefaultDays = (trainingDays: TrainingDays): DayOfWeek[] => {
  switch (trainingDays) {
    case 3:
      return [1, 3, 5] // Mon, Wed, Fri
    case 4:
      return [1, 2, 4, 5] // Mon, Tue, Thu, Fri
    case 5:
      return [1, 2, 3, 4, 5] // Mon-Fri
    default:
      return [1, 3, 5]
  }
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      workoutLogs: [],
      currentWeek: 1,
      customizations: [],

      setPlan: (trainingDays: TrainingDays, selectedDays?: DayOfWeek[]) => {
        const days = selectedDays || getDefaultDays(trainingDays)
        const schedule = buildSchedule(trainingDays, days)

        set({
          currentPlan: { trainingDays, selectedDays: days, schedule }
        })
      },

      setWorkoutDays: (days: DayOfWeek[]) => {
        const currentPlan = get().currentPlan
        if (!currentPlan) return

        const schedule = buildSchedule(currentPlan.trainingDays, days)
        set({
          currentPlan: { ...currentPlan, selectedDays: days, schedule }
        })
      },

      getTodayWorkout: () => {
        const plan = get().currentPlan
        if (!plan) return null

        const dayOfWeek = new Date().getDay()
        const scheduled = plan.schedule.find(s => s.day === dayOfWeek)

        if (!scheduled || scheduled.type === 'rest') return null

        const trainingDaysThisWeek = get().workoutLogs.filter(log => {
          const logDate = new Date(log.date)
          const today = new Date()
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - today.getDay())
          return logDate >= startOfWeek && log.completed
        }).length

        return {
          type: scheduled.type,
          name: scheduled.name,
          dayNumber: trainingDaysThisWeek + 1
        }
      },

      getWorkoutForDay: (dayOfWeek: number) => {
        const plan = get().currentPlan
        if (!plan) return null

        const scheduled = plan.schedule.find(s => s.day === dayOfWeek)
        if (!scheduled) return null

        return { type: scheduled.type, name: scheduled.name }
      },

      startWorkout: (type: WorkoutType, dayNumber: number) => {
        const id = `workout-${Date.now()}`
        const today = new Date().toISOString().split('T')[0]

        const newWorkout: WorkoutLog = {
          id,
          date: today,
          workoutType: type,
          dayNumber,
          weekNumber: get().currentWeek,
          exercises: generateExercises(type, get().customizations),
          completed: false,
          xpAwarded: false,
          startTime: Date.now()
        }

        set((state) => ({
          workoutLogs: [...state.workoutLogs, newWorkout]
        }))

        return id
      },

      startMinimalWorkout: (notes: string) => {
        const id = `workout-${Date.now()}`
        const today = new Date().toISOString().split('T')[0]
        const todayWorkout = get().getTodayWorkout()

        const newWorkout: WorkoutLog = {
          id,
          date: today,
          workoutType: todayWorkout?.type || 'push',
          dayNumber: todayWorkout?.dayNumber || 1,
          weekNumber: get().currentWeek,
          exercises: [],
          completed: true,
          xpAwarded: false,
          startTime: Date.now(),
          endTime: Date.now(),
          isMinimal: true,
          notes
        }

        set((state) => ({
          workoutLogs: [...state.workoutLogs, newWorkout]
        }))

        return id
      },

      updateWorkoutNotes: (workoutId: string, notes: string) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.map(workout =>
            workout.id === workoutId
              ? { ...workout, notes }
              : workout
          )
        }))
      },

      logSet: (workoutId, exerciseId, setIndex, data) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.map(workout =>
            workout.id === workoutId
              ? {
                  ...workout,
                  exercises: workout.exercises.map(ex =>
                    ex.id === exerciseId
                      ? {
                          ...ex,
                          sets: ex.sets.map((s, i) =>
                            i === setIndex ? { ...s, ...data } : s
                          )
                        }
                      : ex
                  )
                }
              : workout
          )
        }))
      },

      completeWorkout: (workoutId) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.map(workout =>
            workout.id === workoutId
              ? { ...workout, completed: true, endTime: Date.now() }
              : workout
          )
        }))
      },

      markXPAwarded: (workoutId) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.map(workout =>
            workout.id === workoutId
              ? { ...workout, xpAwarded: true }
              : workout
          )
        }))
      },

      getCurrentWorkout: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().workoutLogs.find(
          log => log.date === today && !log.completed
        ) || null
      },

      getWorkoutHistory: (limit = 10) => {
        return [...get().workoutLogs]
          .filter(log => log.completed)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit)
      },

      getExerciseHistory: (exerciseName: string, limit = 5) => {
        const logs = get().workoutLogs
          .filter(log => log.completed)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const history: { date: string; sets: ExerciseSet[] }[] = []

        for (const log of logs) {
          const exercise = log.exercises.find(
            ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
          )
          if (exercise) {
            history.push({
              date: log.date,
              sets: exercise.sets.filter(s => s.completed)
            })
            if (history.length >= limit) break
          }
        }

        return history
      },

      isWorkoutCompletedToday: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().workoutLogs.some(
          log => log.date === today && log.completed
        )
      },

      resetWorkouts: () => set({
        currentPlan: null,
        workoutLogs: [],
        currentWeek: 1,
        customizations: []
      }),

      exportData: () => {
        const state = get()
        return JSON.stringify({
          workouts: {
            currentPlan: state.currentPlan,
            workoutLogs: state.workoutLogs,
            currentWeek: state.currentWeek,
            customizations: state.customizations
          }
        }, null, 2)
      },

      importData: (data: string) => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.workouts) {
            set({
              currentPlan: parsed.workouts.currentPlan || null,
              workoutLogs: parsed.workouts.workoutLogs || [],
              currentWeek: parsed.workouts.currentWeek || 1,
              customizations: parsed.workouts.customizations || []
            })
            return true
          }
          return false
        } catch {
          return false
        }
      },

      // Customization actions
      getExercisesForType: (type: WorkoutType) => {
        const customization = get().customizations.find(c => c.workoutType === type)
        if (customization && customization.exercises.length > 0) {
          return customization.exercises.map(ex => ({
            name: ex.name,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps
          }))
        }
        return WORKOUT_TEMPLATES[type]
      },

      setCustomExercises: (type: WorkoutType, exercises: CustomExercise[]) => {
        set((state) => {
          const existing = state.customizations.findIndex(c => c.workoutType === type)
          if (existing >= 0) {
            const updated = [...state.customizations]
            updated[existing] = { workoutType: type, exercises }
            return { customizations: updated }
          }
          return {
            customizations: [...state.customizations, { workoutType: type, exercises }]
          }
        })
      },

      addExercise: (type: WorkoutType, exercise: Omit<CustomExercise, 'id'>) => {
        const newExercise: CustomExercise = {
          ...exercise,
          id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }

        set((state) => {
          const existing = state.customizations.find(c => c.workoutType === type)
          if (existing) {
            return {
              customizations: state.customizations.map(c =>
                c.workoutType === type
                  ? { ...c, exercises: [...c.exercises, newExercise] }
                  : c
              )
            }
          }
          // Create new customization with defaults + new exercise
          const defaultExercises: CustomExercise[] = WORKOUT_TEMPLATES[type].map((ex, i) => ({
            id: `default-${type}-${i}`,
            name: ex.name,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps
          }))
          return {
            customizations: [
              ...state.customizations,
              { workoutType: type, exercises: [...defaultExercises, newExercise] }
            ]
          }
        })
      },

      updateExercise: (type: WorkoutType, id: string, updates: Partial<Omit<CustomExercise, 'id'>>) => {
        set((state) => ({
          customizations: state.customizations.map(c =>
            c.workoutType === type
              ? {
                  ...c,
                  exercises: c.exercises.map(ex =>
                    ex.id === id ? { ...ex, ...updates } : ex
                  )
                }
              : c
          )
        }))
      },

      removeExercise: (type: WorkoutType, id: string) => {
        set((state) => ({
          customizations: state.customizations.map(c =>
            c.workoutType === type
              ? { ...c, exercises: c.exercises.filter(ex => ex.id !== id) }
              : c
          )
        }))
      },

      resetToDefaults: (type: WorkoutType) => {
        set((state) => ({
          customizations: state.customizations.filter(c => c.workoutType !== type)
        }))
      },

      reorderExercise: (type: WorkoutType, fromIndex: number, toIndex: number) => {
        set((state) => {
          const customization = state.customizations.find(c => c.workoutType === type)
          if (!customization) {
            // Create customization from defaults first
            const defaultExercises: CustomExercise[] = WORKOUT_TEMPLATES[type].map((ex, i) => ({
              id: `default-${type}-${i}`,
              name: ex.name,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps
            }))
            const exercises = [...defaultExercises]
            const [moved] = exercises.splice(fromIndex, 1)
            exercises.splice(toIndex, 0, moved)
            return {
              customizations: [...state.customizations, { workoutType: type, exercises }]
            }
          }

          const exercises = [...customization.exercises]
          const [moved] = exercises.splice(fromIndex, 1)
          exercises.splice(toIndex, 0, moved)

          return {
            customizations: state.customizations.map(c =>
              c.workoutType === type ? { ...c, exercises } : c
            )
          }
        })
      }
    }),
    {
      name: 'gamify-gains-workouts',
    }
  )
)
