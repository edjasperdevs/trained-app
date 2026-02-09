import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWorkoutStore } from './workoutStore'

describe('workoutStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useWorkoutStore.setState({
      currentPlan: null,
      workoutLogs: [],
      currentWeek: 1,
      customizations: []
    })
  })

  describe('setPlan', () => {
    it('should set a 3-day workout plan with default days', () => {
      const { setPlan, currentPlan } = useWorkoutStore.getState()

      setPlan(3)

      const plan = useWorkoutStore.getState().currentPlan
      expect(plan).not.toBeNull()
      expect(plan?.trainingDays).toBe(3)
      expect(plan?.selectedDays).toEqual([1, 3, 5]) // Mon, Wed, Fri
      expect(plan?.schedule).toHaveLength(7) // Full week
    })

    it('should set a 4-day workout plan with default days', () => {
      const { setPlan } = useWorkoutStore.getState()

      setPlan(4)

      const plan = useWorkoutStore.getState().currentPlan
      expect(plan?.trainingDays).toBe(4)
      expect(plan?.selectedDays).toEqual([1, 2, 4, 5]) // Mon, Tue, Thu, Fri
    })

    it('should set a 5-day workout plan with default days', () => {
      const { setPlan } = useWorkoutStore.getState()

      setPlan(5)

      const plan = useWorkoutStore.getState().currentPlan
      expect(plan?.trainingDays).toBe(5)
      expect(plan?.selectedDays).toEqual([1, 2, 3, 4, 5]) // Mon-Fri
    })

    it('should allow custom selected days', () => {
      const { setPlan } = useWorkoutStore.getState()

      setPlan(3, [0, 2, 4]) // Sun, Tue, Thu

      const plan = useWorkoutStore.getState().currentPlan
      expect(plan?.selectedDays).toEqual([0, 2, 4])
    })
  })

  describe('startWorkout', () => {
    beforeEach(() => {
      // Set up a plan first
      useWorkoutStore.getState().setPlan(5)
    })

    it('should start a new workout and return its ID', () => {
      const { startWorkout } = useWorkoutStore.getState()

      const workoutId = startWorkout('push', 1)

      expect(workoutId).toContain('workout-')

      const logs = useWorkoutStore.getState().workoutLogs
      expect(logs).toHaveLength(1)
      expect(logs[0].workoutType).toBe('push')
      expect(logs[0].dayNumber).toBe(1)
      expect(logs[0].completed).toBe(false)
    })

    it('should generate exercises for the workout', () => {
      const { startWorkout } = useWorkoutStore.getState()

      startWorkout('push', 1)

      const workout = useWorkoutStore.getState().workoutLogs[0]
      expect(workout.exercises.length).toBeGreaterThan(0)

      // Each exercise should have sets
      workout.exercises.forEach(exercise => {
        expect(exercise.sets.length).toBeGreaterThan(0)
        expect(exercise.name).toBeTruthy()
        expect(exercise.targetReps).toBeTruthy()
      })
    })

    it('should set startTime on the workout', () => {
      const { startWorkout } = useWorkoutStore.getState()
      const beforeStart = Date.now()

      startWorkout('push', 1)

      const workout = useWorkoutStore.getState().workoutLogs[0]
      expect(workout.startTime).toBeDefined()
      expect(workout.startTime).toBeGreaterThanOrEqual(beforeStart)
    })
  })

  describe('logSet', () => {
    let workoutId: string
    let exerciseId: string

    beforeEach(() => {
      useWorkoutStore.getState().setPlan(5)
      workoutId = useWorkoutStore.getState().startWorkout('push', 1)
      exerciseId = useWorkoutStore.getState().workoutLogs[0].exercises[0].id
    })

    it('should update weight for a set', () => {
      const { logSet } = useWorkoutStore.getState()

      logSet(workoutId, exerciseId, 0, { weight: 135 })

      const workout = useWorkoutStore.getState().workoutLogs[0]
      expect(workout.exercises[0].sets[0].weight).toBe(135)
    })

    it('should update reps for a set', () => {
      const { logSet } = useWorkoutStore.getState()

      logSet(workoutId, exerciseId, 0, { reps: 10 })

      const workout = useWorkoutStore.getState().workoutLogs[0]
      expect(workout.exercises[0].sets[0].reps).toBe(10)
    })

    it('should mark a set as completed', () => {
      const { logSet } = useWorkoutStore.getState()

      logSet(workoutId, exerciseId, 0, { completed: true })

      const workout = useWorkoutStore.getState().workoutLogs[0]
      expect(workout.exercises[0].sets[0].completed).toBe(true)
    })

    it('should mark a set as skipped', () => {
      const { logSet } = useWorkoutStore.getState()

      logSet(workoutId, exerciseId, 0, { skipped: true })

      const workout = useWorkoutStore.getState().workoutLogs[0]
      expect(workout.exercises[0].sets[0].skipped).toBe(true)
    })
  })

  describe('addExerciseToWorkout', () => {
    let workoutId: string

    beforeEach(() => {
      useWorkoutStore.getState().setPlan(5)
      workoutId = useWorkoutStore.getState().startWorkout('push', 1)
    })

    it('should add a new exercise to an active workout', () => {
      const { addExerciseToWorkout } = useWorkoutStore.getState()
      const initialCount = useWorkoutStore.getState().workoutLogs[0].exercises.length

      addExerciseToWorkout(workoutId, {
        name: 'Bicep Curls',
        targetSets: 3,
        targetReps: '10-12'
      })

      const workout = useWorkoutStore.getState().workoutLogs[0]
      expect(workout.exercises.length).toBe(initialCount + 1)

      const newExercise = workout.exercises[workout.exercises.length - 1]
      expect(newExercise.name).toBe('Bicep Curls')
      expect(newExercise.targetSets).toBe(3)
      expect(newExercise.targetReps).toBe('10-12')
      // 3 working sets + 1 warmup set
      expect(newExercise.sets).toHaveLength(4)
      expect(newExercise.sets[0].warmup).toBe(true)
      expect(newExercise.sets.filter(s => !s.warmup)).toHaveLength(3)
    })
  })

  describe('completeWorkout', () => {
    let workoutId: string

    beforeEach(() => {
      useWorkoutStore.getState().setPlan(5)
      workoutId = useWorkoutStore.getState().startWorkout('push', 1)
    })

    it('should mark a workout as completed', () => {
      const { completeWorkout } = useWorkoutStore.getState()

      completeWorkout(workoutId)

      const workout = useWorkoutStore.getState().workoutLogs[0]
      expect(workout.completed).toBe(true)
    })

    it('should set endTime on the workout', () => {
      const { completeWorkout } = useWorkoutStore.getState()
      const beforeComplete = Date.now()

      completeWorkout(workoutId)

      const workout = useWorkoutStore.getState().workoutLogs[0]
      expect(workout.endTime).toBeDefined()
      expect(workout.endTime).toBeGreaterThanOrEqual(beforeComplete)
    })
  })

  describe('endWorkoutEarly', () => {
    let workoutId: string

    beforeEach(() => {
      useWorkoutStore.getState().setPlan(5)
      workoutId = useWorkoutStore.getState().startWorkout('push', 1)
    })

    it('should mark a workout as completed even if not all sets done', () => {
      const { endWorkoutEarly } = useWorkoutStore.getState()

      endWorkoutEarly(workoutId)

      const workout = useWorkoutStore.getState().workoutLogs[0]
      expect(workout.completed).toBe(true)
      expect(workout.endTime).toBeDefined()
    })
  })

  describe('getExerciseHistory', () => {
    beforeEach(() => {
      useWorkoutStore.getState().setPlan(5)

      // Create a completed workout with data
      const workoutId = useWorkoutStore.getState().startWorkout('push', 1)
      const exerciseId = useWorkoutStore.getState().workoutLogs[0].exercises[0].id

      useWorkoutStore.getState().logSet(workoutId, exerciseId, 0, { weight: 135, reps: 8, completed: true })
      useWorkoutStore.getState().logSet(workoutId, exerciseId, 1, { weight: 135, reps: 8, completed: true })
      useWorkoutStore.getState().completeWorkout(workoutId)
    })

    it('should return exercise history for a given exercise name', () => {
      const { getExerciseHistory, workoutLogs } = useWorkoutStore.getState()
      const exerciseName = workoutLogs[0].exercises[0].name

      const history = getExerciseHistory(exerciseName, 5)

      expect(history).toHaveLength(1)
      expect(history[0].sets).toHaveLength(2)
      expect(history[0].sets[0].weight).toBe(135)
      expect(history[0].sets[0].reps).toBe(8)
    })

    it('should return empty array for unknown exercise', () => {
      const { getExerciseHistory } = useWorkoutStore.getState()

      const history = getExerciseHistory('Unknown Exercise', 5)

      expect(history).toHaveLength(0)
    })
  })

  describe('isWorkoutCompletedToday', () => {
    beforeEach(() => {
      useWorkoutStore.getState().setPlan(5)
    })

    it('should return false when no workout completed today', () => {
      const { isWorkoutCompletedToday } = useWorkoutStore.getState()

      expect(isWorkoutCompletedToday()).toBe(false)
    })

    it('should return true when workout completed today', () => {
      const workoutId = useWorkoutStore.getState().startWorkout('push', 1)
      useWorkoutStore.getState().completeWorkout(workoutId)

      const { isWorkoutCompletedToday } = useWorkoutStore.getState()

      expect(isWorkoutCompletedToday()).toBe(true)
    })
  })

  describe('workout templates', () => {
    it('should generate correct exercises for 3-day plan', () => {
      useWorkoutStore.getState().setPlan(3)

      // Day A - Push + Quads
      useWorkoutStore.getState().startWorkout('push', 1)
      const dayA = useWorkoutStore.getState().workoutLogs[0]
      expect(dayA.exercises.some(e => e.name.includes('Squat'))).toBe(true)
      expect(dayA.exercises.some(e => e.name.includes('Incline Press'))).toBe(true)
    })

    it('should generate correct exercises for 5-day plan', () => {
      useWorkoutStore.getState().setPlan(5)

      // Day 1 - Push
      useWorkoutStore.getState().startWorkout('push', 1)
      const pushDay = useWorkoutStore.getState().workoutLogs[0]
      expect(pushDay.exercises.some(e => e.name.includes('Incline') && e.name.includes('Press'))).toBe(true)
      expect(pushDay.exercises.some(e => e.name.includes('Tricep'))).toBe(true)
    })
  })

  describe('customizations', () => {
    beforeEach(() => {
      useWorkoutStore.getState().setPlan(5)
    })

    it('should add a custom exercise to a workout type', () => {
      const { addExercise, getExercisesForType } = useWorkoutStore.getState()

      addExercise('push', {
        name: 'Custom Press',
        targetSets: 4,
        targetReps: '6-8'
      })

      const exercises = useWorkoutStore.getState().getExercisesForType('push')
      expect(exercises.some(e => e.name === 'Custom Press')).toBe(true)
    })

    it('should remove a custom exercise', () => {
      const { addExercise, removeExercise, customizations } = useWorkoutStore.getState()

      addExercise('push', {
        name: 'To Remove',
        targetSets: 3,
        targetReps: '8-10'
      })

      const customization = useWorkoutStore.getState().customizations.find(c => c.workoutType === 'push')
      const exerciseToRemove = customization?.exercises.find(e => e.name === 'To Remove')

      if (exerciseToRemove) {
        useWorkoutStore.getState().removeExercise('push', exerciseToRemove.id)
      }

      const exercises = useWorkoutStore.getState().getExercisesForType('push')
      expect(exercises.some(e => e.name === 'To Remove')).toBe(false)
    })

    it('should reset customizations to defaults', () => {
      const { addExercise, resetToDefaults, customizations } = useWorkoutStore.getState()

      addExercise('push', {
        name: 'Custom Exercise',
        targetSets: 3,
        targetReps: '8-10'
      })

      expect(useWorkoutStore.getState().customizations.length).toBeGreaterThan(0)

      useWorkoutStore.getState().resetToDefaults('push')

      const pushCustomization = useWorkoutStore.getState().customizations.find(c => c.workoutType === 'push')
      expect(pushCustomization).toBeUndefined()
    })
  })

  describe('warmup sets', () => {
    beforeEach(() => {
      useWorkoutStore.getState().setPlan(5)
    })

    it('should generate a warmup set as the first set of each exercise', () => {
      useWorkoutStore.getState().startWorkout('push', 1)
      const workout = useWorkoutStore.getState().workoutLogs[0]

      workout.exercises.forEach(exercise => {
        expect(exercise.sets[0].warmup).toBe(true)
        expect(exercise.sets[0].weight).toBe(0)
        expect(exercise.sets[0].reps).toBe(0)
        expect(exercise.sets[0].completed).toBe(false)
      })
    })

    it('should have working sets after the warmup set', () => {
      useWorkoutStore.getState().startWorkout('push', 1)
      const workout = useWorkoutStore.getState().workoutLogs[0]

      workout.exercises.forEach(exercise => {
        const workingSets = exercise.sets.filter(s => !s.warmup)
        expect(workingSets.length).toBe(exercise.targetSets)
        workingSets.forEach(set => {
          expect(set.warmup).toBeFalsy()
        })
      })
    })

    it('should include warmup set in added exercises', () => {
      const workoutId = useWorkoutStore.getState().startWorkout('push', 1)
      useWorkoutStore.getState().addExerciseToWorkout(workoutId, {
        name: 'New Exercise',
        targetSets: 3,
        targetReps: '8-12'
      })

      const workout = useWorkoutStore.getState().workoutLogs[0]
      const added = workout.exercises[workout.exercises.length - 1]
      expect(added.sets[0].warmup).toBe(true)
      expect(added.sets.filter(s => !s.warmup)).toHaveLength(3)
    })
  })

  describe('reorderWorkoutExercise', () => {
    let workoutId: string

    beforeEach(() => {
      useWorkoutStore.getState().setPlan(5)
      workoutId = useWorkoutStore.getState().startWorkout('push', 1)
    })

    it('should move an exercise down', () => {
      const before = useWorkoutStore.getState().workoutLogs[0].exercises
      const firstName = before[0].name
      const secondName = before[1].name

      useWorkoutStore.getState().reorderWorkoutExercise(workoutId, 0, 1)

      const after = useWorkoutStore.getState().workoutLogs[0].exercises
      expect(after[0].name).toBe(secondName)
      expect(after[1].name).toBe(firstName)
    })

    it('should move an exercise up', () => {
      const before = useWorkoutStore.getState().workoutLogs[0].exercises
      const firstName = before[0].name
      const secondName = before[1].name

      useWorkoutStore.getState().reorderWorkoutExercise(workoutId, 1, 0)

      const after = useWorkoutStore.getState().workoutLogs[0].exercises
      expect(after[0].name).toBe(secondName)
      expect(after[1].name).toBe(firstName)
    })

    it('should preserve all exercises after reorder', () => {
      const before = useWorkoutStore.getState().workoutLogs[0].exercises
      const originalNames = before.map(e => e.name).sort()

      useWorkoutStore.getState().reorderWorkoutExercise(workoutId, 0, 2)

      const after = useWorkoutStore.getState().workoutLogs[0].exercises
      const afterNames = after.map(e => e.name).sort()
      expect(afterNames).toEqual(originalNames)
    })

    it('should not affect other workouts', () => {
      // Manually add a second workout with a distinct ID
      useWorkoutStore.setState((state) => ({
        workoutLogs: [
          ...state.workoutLogs,
          {
            id: 'other-workout',
            date: '2025-01-01',
            workoutType: 'pull' as const,
            dayNumber: 2,
            weekNumber: 1,
            exercises: [
              { id: 'ex-a', name: 'Exercise A', targetSets: 2, targetReps: '8', sets: [] },
              { id: 'ex-b', name: 'Exercise B', targetSets: 2, targetReps: '8', sets: [] },
            ],
            completed: false,
            xpAwarded: false,
          },
        ],
      }))

      const pullBefore = useWorkoutStore.getState().workoutLogs
        .find(w => w.id === 'other-workout')!.exercises.map(e => e.name)

      // Reorder the first (push) workout
      useWorkoutStore.getState().reorderWorkoutExercise(workoutId, 0, 1)

      // Other workout should be unchanged
      const pullAfter = useWorkoutStore.getState().workoutLogs
        .find(w => w.id === 'other-workout')!.exercises.map(e => e.name)
      expect(pullAfter).toEqual(pullBefore)
    })
  })

  describe('resetWorkouts', () => {
    it('should reset all workout data', () => {
      useWorkoutStore.getState().setPlan(5)
      useWorkoutStore.getState().startWorkout('push', 1)

      useWorkoutStore.getState().resetWorkouts()

      const state = useWorkoutStore.getState()
      expect(state.currentPlan).toBeNull()
      expect(state.workoutLogs).toHaveLength(0)
      expect(state.currentWeek).toBe(1)
      expect(state.customizations).toHaveLength(0)
    })
  })
})
