import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TrainingDays } from './userStore'
import { PrescribedExercise } from '@/lib/database.types'

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
    dayNumber: number // The workout day number (1, 2, 3, etc.) for template selection
  }[]
}

export interface AssignedWorkoutState {
  assignmentId: string
  exercises: PrescribedExercise[]
  date: string
  coachNotes?: string
}

interface WorkoutStore {
  currentPlan: WorkoutPlan | null
  workoutLogs: WorkoutLog[]
  currentWeek: number
  customizations: WorkoutCustomization[]
  assignedWorkout: AssignedWorkoutState | null

  // Actions
  setAssignedWorkout: (workout: AssignedWorkoutState | null) => void
  setPlan: (trainingDays: TrainingDays, selectedDays?: DayOfWeek[]) => void
  setWorkoutDays: (days: DayOfWeek[]) => void
  getTodayWorkout: () => { type: WorkoutType; name: string; dayNumber: number } | null
  getWorkoutForDay: (dayOfWeek: number) => { type: WorkoutType; name: string } | null
  startWorkout: (type: WorkoutType, dayNumber: number) => string
  startMinimalWorkout: (notes: string) => string
  updateWorkoutNotes: (workoutId: string, notes: string) => void
  logSet: (workoutId: string, exerciseId: string, setIndex: number, data: Partial<ExerciseSet>) => void
  addExerciseToWorkout: (workoutId: string, exercise: { name: string; targetSets: number; targetReps: string }) => void
  completeWorkout: (workoutId: string) => void
  endWorkoutEarly: (workoutId: string) => void
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

// ============================================
// OPTION A: 3-Day Full Body (~45 min each)
// Best for: Beginners, chaotic schedules
// ============================================
const THREE_DAY_TEMPLATES: Record<string, Omit<Exercise, 'id' | 'sets'>[]> = {
  // Day A: Push + Quads
  'day-a': [
    { name: 'Squat Variation', targetSets: 2, targetReps: '6-10', notes: 'Goblet, leg press, or hack squat' },
    { name: 'Incline Press', targetSets: 2, targetReps: '6-10', notes: 'Barbell, dumbbell, or machine' },
    { name: 'Horizontal Row', targetSets: 2, targetReps: '8-12', notes: 'Cable row or chest-supported row' },
    { name: 'Leg Extension', targetSets: 2, targetReps: '10-15', notes: 'Seat back for more quad stretch' },
    { name: 'Lateral Raises', targetSets: 2, targetReps: '12-15', notes: 'Cable or dumbbell' }
  ],
  // Day B: Pull + Hinge
  'day-b': [
    { name: 'Romanian Deadlift', targetSets: 2, targetReps: '6-10', notes: 'Barbell or dumbbell' },
    { name: 'Pull-ups or Pulldown', targetSets: 2, targetReps: '6-10', notes: 'Weighted if possible' },
    { name: 'Leg Curl', targetSets: 2, targetReps: '10-15', notes: 'Seated or lying' },
    { name: 'Overhead Press', targetSets: 2, targetReps: '8-12', notes: 'Barbell, dumbbell, or machine' },
    { name: 'Bicep Curls', targetSets: 2, targetReps: '10-12', notes: 'Any variation' }
  ],
  // Day C: Full Body
  'day-c': [
    { name: 'Leg Press or Squat', targetSets: 2, targetReps: '8-12', notes: 'Different variation than Day A' },
    { name: 'Chest Press or Dips', targetSets: 2, targetReps: '8-12', notes: 'Machine, dumbbell, or bodyweight' },
    { name: 'Barbell Row', targetSets: 2, targetReps: '8-12', notes: 'Or dumbbell row' },
    { name: 'Hip Thrust', targetSets: 2, targetReps: '10-15', notes: 'Barbell or machine' },
    { name: 'Tricep Extension', targetSets: 2, targetReps: '10-15', notes: 'Overhead cable or pushdowns' }
  ]
}

// ============================================
// OPTION B: 4-Day Upper/Lower (~50 min each)
// Best for: Intermediate lifters
// ============================================
const FOUR_DAY_TEMPLATES: Record<string, Omit<Exercise, 'id' | 'sets'>[]> = {
  // Day 1: Upper (Push Focus)
  'upper-push': [
    { name: 'Incline Press', targetSets: 2, targetReps: '6-10', notes: 'Barbell or dumbbell' },
    { name: 'Overhead Press', targetSets: 2, targetReps: '8-12', notes: 'Seated or standing' },
    { name: 'Cable Row', targetSets: 2, targetReps: '8-12', notes: 'Seated or standing' },
    { name: 'Lateral Raises', targetSets: 2, targetReps: '12-15', notes: 'Cable (high pulley) preferred' },
    { name: 'Tricep Pushdowns', targetSets: 2, targetReps: '10-15', notes: 'Cable' }
  ],
  // Day 2: Lower (Quad Focus)
  'lower-quad': [
    { name: 'Squat Variation', targetSets: 2, targetReps: '6-10', notes: 'Back squat, hack squat, or pendulum' },
    { name: 'Leg Press', targetSets: 2, targetReps: '10-12', notes: 'Feet lower for more quad' },
    { name: 'Leg Extension', targetSets: 2, targetReps: '10-15', notes: 'Seat back, slow eccentric' },
    { name: 'Walking Lunges', targetSets: 2, targetReps: '10/leg', notes: 'Dumbbell or bodyweight' },
    { name: 'Standing Calf Raises', targetSets: 2, targetReps: '10-15', notes: 'Full stretch at bottom' }
  ],
  // Day 3: Upper (Pull Focus)
  'upper-pull': [
    { name: 'Pull-ups or Pulldown', targetSets: 2, targetReps: '6-10', notes: 'Add weight when possible' },
    { name: 'Chest-Supported Row', targetSets: 2, targetReps: '8-12', notes: 'T-bar or dumbbell' },
    { name: 'Incline Dumbbell Press', targetSets: 2, targetReps: '8-12', notes: 'Lower incline than Day 1' },
    { name: 'Rear Delt Flyes', targetSets: 2, targetReps: '12-15', notes: 'Pec deck reverse or cable' },
    { name: 'Bicep Curls', targetSets: 2, targetReps: '10-12', notes: 'Preacher or incline' }
  ],
  // Day 4: Lower (Hinge Focus)
  'lower-hinge': [
    { name: 'Romanian Deadlift', targetSets: 2, targetReps: '6-10', notes: 'Barbell preferred' },
    { name: 'Hip Thrust', targetSets: 2, targetReps: '10-12', notes: 'Barbell or machine' },
    { name: 'Leg Curl', targetSets: 2, targetReps: '10-15', notes: 'Seated (more hamstring growth)' },
    { name: 'Hip Abduction', targetSets: 2, targetReps: '12-15', notes: 'Machine, hips extended' },
    { name: 'Seated Calf Raises', targetSets: 2, targetReps: '15-20', notes: 'Deep stretch' }
  ]
}

// ============================================
// OPTION C: 5-Day Split (~45-50 min each)
// Best for: Dedicated lifters with stable schedules
// ============================================
const FIVE_DAY_TEMPLATES: Record<string, Omit<Exercise, 'id' | 'sets'>[]> = {
  // Day 1: Push (Chest/Shoulders/Triceps)
  'push': [
    { name: 'Incline Barbell Press', targetSets: 2, targetReps: '6-8', notes: 'Last set to failure' },
    { name: 'Pec Deck or Cable Fly', targetSets: 2, targetReps: '10-12', notes: 'Deep stretch' },
    { name: 'Seated Overhead Press', targetSets: 2, targetReps: '8-10', notes: 'Barbell or dumbbell' },
    { name: 'Cable Lateral Raise', targetSets: 2, targetReps: '12-15', notes: 'High pulley, sweep across' },
    { name: 'Overhead Tricep Extension', targetSets: 2, targetReps: '10-12', notes: 'Full stretch' }
  ],
  // Day 2: Pull (Back/Biceps/Rear Delts)
  'pull': [
    { name: 'Weighted Pull-ups', targetSets: 2, targetReps: '6-8', notes: 'Add weight when possible' },
    { name: 'Chest-Supported Row', targetSets: 2, targetReps: '8-10', notes: 'T-bar or dumbbell' },
    { name: 'Pendlay Row (Deficit)', targetSets: 2, targetReps: '6-8', notes: 'Stand on plate' },
    { name: 'Reverse Pec Deck', targetSets: 2, targetReps: '12-15', notes: 'Rear delts' },
    { name: 'Preacher Curl', targetSets: 2, targetReps: '8-12', notes: 'Slow eccentric' }
  ],
  // Day 3: Legs (Quad Focus)
  'legs-quad': [
    { name: 'Lying Leg Curl', targetSets: 2, targetReps: '10-12', notes: 'FIRST - warms up knees' },
    { name: 'Pendulum or Hack Squat', targetSets: 2, targetReps: '6-10', notes: 'Deep, full ROM' },
    { name: 'Leg Press', targetSets: 2, targetReps: '10-12', notes: 'Feet low for quads' },
    { name: 'Leg Extension', targetSets: 2, targetReps: '10-15', notes: 'Seat back, slow eccentric' },
    { name: 'Standing Calf Raise', targetSets: 2, targetReps: '10-12', notes: 'Deep stretch at bottom' }
  ],
  // Day 4: Upper (Chest/Back Focus)
  'upper': [
    { name: 'Incline Dumbbell Press', targetSets: 2, targetReps: '8-10', notes: 'Different angle than Day 1' },
    { name: 'Lat Pulldown', targetSets: 2, targetReps: '8-10', notes: 'Wide grip, pull to chest' },
    { name: 'Cable Row', targetSets: 2, targetReps: '10-12', notes: 'Squeeze shoulder blades' },
    { name: 'Weighted Dips', targetSets: 2, targetReps: '8-12', notes: 'Lean forward for chest' },
    { name: 'Dumbbell Lateral Raise', targetSets: 2, targetReps: '12-15', notes: 'Alternate with cable' }
  ],
  // Day 5: Legs (Hinge Focus) + Arms
  'legs-hinge': [
    { name: 'Romanian Deadlift', targetSets: 2, targetReps: '6-8', notes: 'Bar close, neutral spine' },
    { name: 'Hip Thrust', targetSets: 2, targetReps: '10-12', notes: 'Pause and squeeze at top' },
    { name: 'Seated Leg Curl', targetSets: 2, targetReps: '10-12', notes: 'Better than lying for growth' },
    { name: 'Hip Abduction', targetSets: 2, targetReps: '12-15', notes: 'Hips extended/bridged' },
    { name: 'Incline Dumbbell Curl', targetSets: 2, targetReps: '10-12', notes: 'Full stretch' },
    { name: 'Tricep Extension', targetSets: 2, targetReps: '10-12', notes: 'Cable or dumbbell' }
  ]
}

// Legacy templates for backward compatibility
const WORKOUT_TEMPLATES: Record<WorkoutType, Omit<Exercise, 'id' | 'sets'>[]> = {
  push: FIVE_DAY_TEMPLATES['push'],
  pull: FIVE_DAY_TEMPLATES['pull'],
  legs: FIVE_DAY_TEMPLATES['legs-quad'],
  upper: FIVE_DAY_TEMPLATES['upper'],
  lower: FIVE_DAY_TEMPLATES['legs-hinge'],
  rest: []
}

// Get workout template based on training days and day number
const getTemplateForDay = (trainingDays: TrainingDays, dayNumber: number): Omit<Exercise, 'id' | 'sets'>[] => {
  switch (trainingDays) {
    case 3:
      const threeDayKeys = ['day-a', 'day-b', 'day-c']
      return THREE_DAY_TEMPLATES[threeDayKeys[(dayNumber - 1) % 3]] || []
    case 4:
      const fourDayKeys = ['upper-push', 'lower-quad', 'upper-pull', 'lower-hinge']
      return FOUR_DAY_TEMPLATES[fourDayKeys[(dayNumber - 1) % 4]] || []
    case 5:
      const fiveDayKeys = ['push', 'pull', 'legs-quad', 'upper', 'legs-hinge']
      return FIVE_DAY_TEMPLATES[fiveDayKeys[(dayNumber - 1) % 5]] || []
    default:
      return []
  }
}

const generateExercises = (type: WorkoutType, customizations: WorkoutCustomization[], trainingDays?: TrainingDays, dayNumber?: number): Exercise[] => {
  // First check for customizations
  const customization = customizations.find(c => c.workoutType === type)

  let template: Omit<Exercise, 'id' | 'sets'>[]

  if (customization && customization.exercises.length > 0) {
    template = customization.exercises
  } else if (trainingDays && dayNumber) {
    // Use the proper template based on training days
    template = getTemplateForDay(trainingDays, dayNumber)
  } else {
    // Fallback to legacy templates
    template = WORKOUT_TEMPLATES[type]
  }

  return template.map((ex, index) => ({
    name: ex.name,
    targetSets: ex.targetSets,
    targetReps: ex.targetReps,
    notes: ex.notes,
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
      // 3-Day Full Body: Day A, Day B, Day C (using push/pull/legs as type identifiers)
      return ['push', 'pull', 'legs']
    case 4:
      // 4-Day Upper/Lower
      return ['upper', 'lower', 'upper', 'lower']
    case 5:
      // 5-Day Split: Push, Pull, Legs (Quad), Upper, Legs (Hinge)
      return ['push', 'pull', 'legs', 'upper', 'lower']
    default:
      return ['push', 'pull', 'legs']
  }
}

// Get workout name based on training days and day number
const getWorkoutNameForPlan = (trainingDays: TrainingDays, dayNumber: number): string => {
  switch (trainingDays) {
    case 3:
      const threeDayNames = ['Day A: Push + Quads', 'Day B: Pull + Hinge', 'Day C: Full Body']
      return threeDayNames[(dayNumber - 1) % 3]
    case 4:
      const fourDayNames = ['Upper (Push Focus)', 'Lower (Quad Focus)', 'Upper (Pull Focus)', 'Lower (Hinge Focus)']
      return fourDayNames[(dayNumber - 1) % 4]
    case 5:
      const fiveDayNames = ['Push (Chest/Shoulders/Triceps)', 'Pull (Back/Biceps/Rear Delts)', 'Legs (Quad Focus)', 'Upper (Chest/Back)', 'Legs (Hinge Focus) + Arms']
      return fiveDayNames[(dayNumber - 1) % 5]
    default:
      return `Day ${dayNumber}`
  }
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
      const dayNumber = workoutIndex + 1
      schedule.push({ day, type, name: getWorkoutNameForPlan(trainingDays, dayNumber), dayNumber })
    } else {
      schedule.push({ day, type: 'rest', name: 'Rest', dayNumber: 0 })
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
      assignedWorkout: null,

      setAssignedWorkout: (workout) => set({ assignedWorkout: workout }),

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

        // Use the schedule's dayNumber for correct template selection
        // This ensures mid-week signups get the right workout
        return {
          type: scheduled.type,
          name: scheduled.name,
          dayNumber: scheduled.dayNumber
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
        const plan = get().currentPlan
        const trainingDays = plan?.trainingDays

        const newWorkout: WorkoutLog = {
          id,
          date: today,
          workoutType: type,
          dayNumber,
          weekNumber: get().currentWeek,
          exercises: generateExercises(type, get().customizations, trainingDays, dayNumber),
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
        // Validate set data to prevent corrupted workout history
        const validatedData: Partial<ExerciseSet> = { ...data }

        // Reps must be positive (or 0 for uncompleted sets)
        if (validatedData.reps !== undefined) {
          validatedData.reps = Math.max(0, Math.round(validatedData.reps))
          // Cap at reasonable maximum (1000 reps)
          validatedData.reps = Math.min(validatedData.reps, 1000)
        }

        // Weight must be non-negative (0 for bodyweight exercises)
        if (validatedData.weight !== undefined) {
          validatedData.weight = Math.max(0, validatedData.weight)
          // Cap at reasonable maximum (2000 lbs)
          validatedData.weight = Math.min(validatedData.weight, 2000)
        }

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
                            i === setIndex ? { ...s, ...validatedData } : s
                          )
                        }
                      : ex
                  )
                }
              : workout
          )
        }))
      },

      addExerciseToWorkout: (workoutId, exercise) => {
        const newExercise: Exercise = {
          id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: exercise.name,
          targetSets: exercise.targetSets,
          targetReps: exercise.targetReps,
          sets: Array.from({ length: exercise.targetSets }, () => ({
            weight: 0,
            reps: 0,
            completed: false
          }))
        }

        set((state) => ({
          workoutLogs: state.workoutLogs.map(workout =>
            workout.id === workoutId
              ? { ...workout, exercises: [...workout.exercises, newExercise] }
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

      endWorkoutEarly: (workoutId) => {
        // Mark workout as completed even if not all sets are done
        // This allows users to end early while still getting credit
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
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { assignedWorkout, ...persisted } = state
        return persisted
      },
    }
  )
)
