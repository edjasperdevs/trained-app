import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, ProgressBar } from '@/components'
import { useWorkoutStore, useXPStore, useAvatarStore, WorkoutType, WorkoutLog } from '@/stores'

export function Workouts() {
  const {
    currentPlan,
    getTodayWorkout,
    getCurrentWorkout,
    startWorkout,
    startMinimalWorkout,
    logSet,
    completeWorkout,
    markXPAwarded,
    getWorkoutHistory,
    isWorkoutCompletedToday
  } = useWorkoutStore()

  const { logDailyXP, XP_VALUES, getTodayLog } = useXPStore()
  const { triggerReaction } = useAvatarStore()

  const [activeWorkout, setActiveWorkout] = useState<WorkoutLog | null>(getCurrentWorkout())
  const [showHistory, setShowHistory] = useState(false)
  const [showMinimalModal, setShowMinimalModal] = useState(false)
  const [minimalNotes, setMinimalNotes] = useState('')

  const todayWorkout = getTodayWorkout()
  const isCompleted = isWorkoutCompletedToday()
  const workoutHistory = getWorkoutHistory(10)

  const handleStartWorkout = () => {
    if (!todayWorkout) return
    startWorkout(todayWorkout.type, todayWorkout.dayNumber)
    setActiveWorkout(getCurrentWorkout())
  }

  const handleMinimalWorkout = () => {
    if (!minimalNotes.trim()) return

    const workoutId = startMinimalWorkout(minimalNotes)
    markXPAwarded(workoutId)

    // Log XP for workout
    const todayLog = getTodayLog()
    logDailyXP({
      date: new Date().toISOString().split('T')[0],
      workout: true,
      protein: todayLog?.protein || false,
      calories: todayLog?.calories || false,
      checkIn: todayLog?.checkIn || false,
      perfectDay: todayLog?.perfectDay || false,
      streakBonus: todayLog?.streakBonus || 0
    })

    triggerReaction('checkIn')
    setShowMinimalModal(false)
    setMinimalNotes('')
  }

  const handleCompleteWorkout = () => {
    if (!activeWorkout) return

    completeWorkout(activeWorkout.id)
    markXPAwarded(activeWorkout.id)

    // Log XP for workout
    const todayLog = getTodayLog()
    logDailyXP({
      date: new Date().toISOString().split('T')[0],
      workout: true,
      protein: todayLog?.protein || false,
      calories: todayLog?.calories || false,
      checkIn: todayLog?.checkIn || false,
      perfectDay: todayLog?.perfectDay || false,
      streakBonus: todayLog?.streakBonus || 0
    })

    triggerReaction('checkIn')
    setActiveWorkout(null)
  }

  const handleUpdateSet = (
    exerciseId: string,
    setIndex: number,
    field: 'weight' | 'reps',
    value: number
  ) => {
    if (!activeWorkout) return
    logSet(activeWorkout.id, exerciseId, setIndex, { [field]: value })
    // Refresh active workout
    setActiveWorkout(getCurrentWorkout())
  }

  const handleCompleteSet = (exerciseId: string, setIndex: number) => {
    if (!activeWorkout) return
    logSet(activeWorkout.id, exerciseId, setIndex, { completed: true, skipped: false })
    setActiveWorkout(getCurrentWorkout())
  }

  const handleSkipSet = (exerciseId: string, setIndex: number) => {
    if (!activeWorkout) return
    logSet(activeWorkout.id, exerciseId, setIndex, { completed: false, skipped: true })
    setActiveWorkout(getCurrentWorkout())
  }

  const handleUncompleteSet = (exerciseId: string, setIndex: number) => {
    if (!activeWorkout) return
    logSet(activeWorkout.id, exerciseId, setIndex, { completed: false, skipped: false })
    setActiveWorkout(getCurrentWorkout())
  }

  // Calculate workout progress
  const getWorkoutProgress = () => {
    if (!activeWorkout) return 0
    const totalSets = activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
    const completedSets = activeWorkout.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed || s.skipped).length,
      0
    )
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <div className="bg-bg-secondary pt-8 pb-6 px-4">
        <h1 className="text-2xl font-bold mb-2">Workouts</h1>
        {currentPlan && (
          <p className="text-gray-400">
            {currentPlan.trainingDays}-Day Split
          </p>
        )}
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Active Workout */}
        {activeWorkout ? (
          <ActiveWorkoutView
            workout={activeWorkout}
            progress={getWorkoutProgress()}
            onUpdateSet={handleUpdateSet}
            onCompleteSet={handleCompleteSet}
            onSkipSet={handleSkipSet}
            onUncompleteSet={handleUncompleteSet}
            onComplete={handleCompleteWorkout}
          />
        ) : (
          <>
            {/* Today's Workout */}
            <div>
              <h2 className="text-lg font-bold mb-3">Today</h2>
              {todayWorkout ? (
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold">{todayWorkout.name}</p>
                      <p className="text-sm text-gray-400">
                        Day {todayWorkout.dayNumber} of your week
                      </p>
                    </div>
                    {isCompleted ? (
                      <div className="flex items-center gap-2 text-accent-success">
                        <span className="text-2xl">✓</span>
                        <span className="font-semibold">Done!</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button onClick={handleStartWorkout}>
                          Start Workout
                        </Button>
                      </div>
                    )}
                  </div>
                  {!isCompleted && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <button
                        onClick={() => setShowMinimalModal(true)}
                        className="text-sm text-gray-400 hover:text-accent-primary transition-colors"
                      >
                        Short on time? Log a quick workout instead
                      </button>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <p className="text-sm text-gray-400">
                        +{XP_VALUES.WORKOUT} XP earned
                      </p>
                    </div>
                  )}
                </Card>
              ) : (
                <Card>
                  <div className="text-center py-4">
                    <span className="text-4xl mb-3 block">😴</span>
                    <p className="text-xl font-bold">Rest Day</p>
                    <p className="text-gray-400">Recovery is part of the process</p>
                  </div>
                </Card>
              )}
            </div>

            {/* Week Overview */}
            <div>
              <h2 className="text-lg font-bold mb-3">This Week</h2>
              <div className="grid grid-cols-7 gap-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                  const workout = currentPlan?.schedule.find(s => s.day === index)
                  const isToday = new Date().getDay() === index
                  const isPast = new Date().getDay() > index

                  return (
                    <div
                      key={index}
                      className={`
                        aspect-square rounded-lg flex flex-col items-center justify-center text-xs
                        ${isToday ? 'bg-accent-primary/20 border border-accent-primary' : 'bg-bg-card'}
                        ${isPast && workout?.type !== 'rest' ? 'opacity-60' : ''}
                      `}
                    >
                      <span className="text-gray-500 mb-1">{day}</span>
                      <span className="text-lg">
                        {workout?.type === 'rest' ? '😴' : getWorkoutEmoji(workout?.type || 'rest')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">Recent Workouts</h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-accent-primary text-sm"
                >
                  {showHistory ? 'Hide' : 'Show All'}
                </button>
              </div>

              <AnimatePresence>
                {(showHistory ? workoutHistory : workoutHistory.slice(0, 3)).map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="mb-2" padding="sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{log.isMinimal ? '⚡' : getWorkoutEmoji(log.workoutType)}</span>
                          <div>
                            <p className="font-semibold capitalize">
                              {log.isMinimal ? 'Quick Workout' : log.workoutType}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(log.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-accent-success text-sm">✓ Complete</p>
                          <p className="text-xs text-gray-500">
                            {log.isMinimal
                              ? 'Minimal'
                              : `${log.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)} sets`}
                          </p>
                        </div>
                      </div>
                      {log.isMinimal && log.notes && (
                        <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-800 italic">
                          "{log.notes}"
                        </p>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {workoutHistory.length === 0 && (
                <Card className="text-center py-6">
                  <p className="text-gray-400">No workouts logged yet</p>
                  <p className="text-sm text-gray-500">Complete your first workout to see it here</p>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {/* Minimal Workout Modal */}
      {showMinimalModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowMinimalModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-bg-secondary rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">Quick Workout</h2>
            <p className="text-sm text-gray-400 mb-4">
              Short on time? Log what you did instead. You'll still earn XP for staying active!
            </p>

            <textarea
              value={minimalNotes}
              onChange={(e) => setMinimalNotes(e.target.value)}
              placeholder="What did you do? (e.g., 20 pushups, 5 min walk, stretching...)"
              className="w-full h-32 bg-bg-card border border-gray-700 rounded-lg p-3 text-sm resize-none mb-4"
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowMinimalModal(false)
                  setMinimalNotes('')
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={handleMinimalWorkout}
                disabled={!minimalNotes.trim()}
              >
                Log Quick Workout (+{XP_VALUES.WORKOUT} XP)
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

function ActiveWorkoutView({
  workout,
  progress,
  onUpdateSet,
  onCompleteSet,
  onSkipSet,
  onUncompleteSet,
  onComplete
}: {
  workout: WorkoutLog
  progress: number
  onUpdateSet: (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: number) => void
  onCompleteSet: (exerciseId: string, setIndex: number) => void
  onSkipSet: (exerciseId: string, setIndex: number) => void
  onUncompleteSet: (exerciseId: string, setIndex: number) => void
  onComplete: () => void
}) {
  const [expandedExercise, setExpandedExercise] = useState<string | null>(
    workout.exercises[0]?.id || null
  )

  const allSetsComplete = workout.exercises.every(ex =>
    ex.sets.every(s => s.completed || s.skipped)
  )

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xl font-bold capitalize">{workout.workoutType} Day</p>
            <p className="text-sm text-gray-400">Week {workout.weekNumber}, Day {workout.dayNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-digital text-accent-primary">
              {Math.round(progress)}%
            </p>
          </div>
        </div>
        <ProgressBar progress={progress} color="gradient" size="lg" />
      </Card>

      {/* Exercises */}
      <div className="space-y-3">
        {workout.exercises.map((exercise, exIndex) => {
          const isExpanded = expandedExercise === exercise.id
          const completedSets = exercise.sets.filter(s => s.completed || s.skipped).length
          const isComplete = completedSets === exercise.sets.length

          return (
            <Card key={exercise.id} padding="none">
              <button
                onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${isComplete ? 'text-accent-success' : 'text-gray-500'}`}>
                    {isComplete ? '✓' : exIndex + 1}
                  </span>
                  <div className="text-left">
                    <p className={`font-semibold ${isComplete ? 'text-accent-success' : ''}`}>
                      {exercise.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {exercise.targetSets} sets × {exercise.targetReps} reps
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {completedSets}/{exercise.sets.length}
                  </span>
                  <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className={`flex items-center gap-2 ${set.completed || set.skipped ? 'opacity-60' : ''}`}
                        >
                          <span className="text-sm text-gray-500 w-10">
                            Set {setIndex + 1}
                          </span>
                          <input
                            type="number"
                            placeholder="lbs"
                            value={set.weight || ''}
                            onChange={(e) => onUpdateSet(exercise.id, setIndex, 'weight', Number(e.target.value))}
                            className="w-16 bg-bg-secondary border border-gray-700 rounded px-2 py-1 text-center font-digital text-sm"
                          />
                          <span className="text-gray-500 text-sm">×</span>
                          <input
                            type="number"
                            placeholder="reps"
                            value={set.reps || ''}
                            onChange={(e) => onUpdateSet(exercise.id, setIndex, 'reps', Number(e.target.value))}
                            className="w-14 bg-bg-secondary border border-gray-700 rounded px-2 py-1 text-center font-digital text-sm"
                          />
                          {set.completed ? (
                            <button
                              onClick={() => onUncompleteSet(exercise.id, setIndex)}
                              className="text-accent-success hover:text-accent-primary transition-colors px-2"
                              title="Click to edit"
                            >
                              ✓
                            </button>
                          ) : set.skipped ? (
                            <button
                              onClick={() => onUncompleteSet(exercise.id, setIndex)}
                              className="text-gray-500 hover:text-accent-primary transition-colors px-2 text-sm"
                              title="Click to undo skip"
                            >
                              Skip
                            </button>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onCompleteSet(exercise.id, setIndex)}
                              >
                                Done
                              </Button>
                              <button
                                onClick={() => onSkipSet(exercise.id, setIndex)}
                                className="text-xs text-gray-500 hover:text-gray-300 px-2"
                              >
                                Skip
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )
        })}
      </div>

      {/* Complete Button */}
      <Button
        onClick={onComplete}
        fullWidth
        size="lg"
        disabled={!allSetsComplete}
        className={allSetsComplete ? 'animate-pulse' : ''}
      >
        {allSetsComplete ? 'Complete Workout (+100 XP)' : 'Complete All Sets First'}
      </Button>
    </div>
  )
}

function getWorkoutEmoji(type: WorkoutType): string {
  const emojis: Record<WorkoutType, string> = {
    push: '🏋️',
    pull: '🦾',
    legs: '🦵',
    upper: '💪',
    lower: '🦵',
    rest: '😴'
  }
  return emojis[type] || '🏋️'
}
