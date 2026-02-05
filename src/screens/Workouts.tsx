import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, ProgressBar, EmptyState } from '@/components'
import { useWorkoutStore, useXPStore, useAvatarStore, useAchievementsStore, toast, WorkoutType, WorkoutLog } from '@/stores'
import { useTheme } from '@/themes'
import { analytics } from '@/lib/analytics'
import { haptics } from '@/lib/haptics'
import { Clock, Dumbbell } from 'lucide-react'

export function Workouts() {
  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const {
    currentPlan,
    getTodayWorkout,
    getCurrentWorkout,
    startWorkout,
    startMinimalWorkout,
    logSet,
    completeWorkout,
    endWorkoutEarly,
    addExerciseToWorkout,
    markXPAwarded,
    getWorkoutHistory,
    isWorkoutCompletedToday,
    getExercisesForType,
    customizations,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercise,
    resetToDefaults
  } = useWorkoutStore()

  const { logDailyXP, XP_VALUES, getTodayLog } = useXPStore()
  const { triggerReaction } = useAvatarStore()
  const { checkAndAwardBadges, getAllBadges } = useAchievementsStore()

  const [activeWorkout, setActiveWorkout] = useState<WorkoutLog | null>(getCurrentWorkout())
  const [showHistory, setShowHistory] = useState(false)
  const [showMinimalModal, setShowMinimalModal] = useState(false)
  const [minimalNotes, setMinimalNotes] = useState('')
  const [editingWorkoutType, setEditingWorkoutType] = useState<WorkoutType | null>(null)
  const [newExercise, setNewExercise] = useState({ name: '', targetSets: '3', targetReps: '8-12' })
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [editExercise, setEditExercise] = useState({ name: '', targetSets: '', targetReps: '' })

  const todayWorkout = getTodayWorkout()
  const isCompleted = isWorkoutCompletedToday()
  const workoutHistory = getWorkoutHistory(10)
  const allBadges = getAllBadges()

  // Check for badges and show toast notifications
  const checkBadgesWithToast = () => {
    const newBadgeIds = checkAndAwardBadges()
    if (newBadgeIds.length > 0) {
      const badge = allBadges.find(b => b.id === newBadgeIds[0])
      if (badge) {
        toast.success(`🏆 Badge Unlocked: ${badge.name}!`, 5000)
      }
    }
  }

  const handleStartWorkout = () => {
    if (!todayWorkout) return
    startWorkout(todayWorkout.type, todayWorkout.dayNumber)
    setActiveWorkout(getCurrentWorkout())
    analytics.workoutStarted(todayWorkout.type)
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
    checkBadgesWithToast()
    analytics.quickWorkoutLogged()
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
    checkBadgesWithToast()

    // Track workout completion with duration
    const duration = activeWorkout.startTime && activeWorkout.endTime
      ? Math.round((Date.now() - activeWorkout.startTime) / 60000)
      : 0
    analytics.workoutCompleted(activeWorkout.workoutType, duration)

    haptics.success()
    setActiveWorkout(null)
  }

  const handleEndWorkoutEarly = () => {
    if (!activeWorkout) return

    // Check if at least one set was completed
    const completedSets = activeWorkout.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
      0
    )

    if (completedSets === 0) {
      if (!window.confirm('You haven\'t completed any sets. End workout anyway?')) {
        return
      }
    }

    endWorkoutEarly(activeWorkout.id)
    markXPAwarded(activeWorkout.id)

    // Still award XP for showing up
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
    checkBadgesWithToast()
    toast.success('Workout committed. Partial deploy counts.')

    const duration = activeWorkout.startTime
      ? Math.round((Date.now() - activeWorkout.startTime) / 60000)
      : 0
    analytics.workoutCompleted(activeWorkout.workoutType, duration)

    setActiveWorkout(null)
  }

  const handleAddExerciseToWorkout = (exercise: { name: string; targetSets: number; targetReps: string }) => {
    if (!activeWorkout) return
    addExerciseToWorkout(activeWorkout.id, exercise)
    setActiveWorkout(getCurrentWorkout())
    toast.success(`${exercise.name} added to session`)
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
    haptics.light()
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
      <div className={`pt-8 pb-6 px-4 ${isTrained ? 'bg-surface' : 'bg-bg-secondary'}`}>
        <h1 className={`text-2xl font-bold mb-2 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
          {isTrained ? 'Training' : 'Workouts'}
        </h1>
        {currentPlan && (
          <p className="text-text-secondary">
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
            onEndEarly={handleEndWorkoutEarly}
            onAddExercise={handleAddExerciseToWorkout}
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
                    <div className="mt-4 pt-4 border-t border-border">
                      <button
                        onClick={() => setShowMinimalModal(true)}
                        className={`
                          w-full flex items-center justify-center gap-2 py-2.5 px-4
                          text-sm font-medium transition-all
                          ${isTrained
                            ? 'border border-border text-text-secondary hover:border-primary hover:text-primary'
                            : 'bg-surface-elevated text-text-secondary hover:text-primary'
                          }
                          rounded-lg
                        `}
                      >
                        <Clock size={16} />
                        {isTrained
                          ? `Log ${theme.labels.minimalWorkout.toLowerCase()} instead`
                          : 'Short on time? Log quick workout'}
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
                    <p className={`text-xl font-bold ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
                      {isTrained ? 'Recovery Day' : 'Rest Day'}
                    </p>
                    <p className="text-text-secondary">
                      {isTrained ? 'Recovery is part of the protocol' : 'Recovery is part of the process'}
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Customize Workouts */}
            {currentPlan && (
              <div>
                <h2 className="text-lg font-bold mb-3">Customize Workouts</h2>
                <div className="grid grid-cols-2 gap-2">
                  {getUniqueWorkoutTypes(currentPlan.schedule).map((type) => {
                    const isCustomized = customizations.some(c => c.workoutType === type && c.exercises.length > 0)
                    return (
                      <button
                        key={type}
                        onClick={() => setEditingWorkoutType(type)}
                        className="flex items-center gap-2 p-3 rounded-lg bg-bg-card hover:bg-bg-secondary transition-colors"
                      >
                        <span className="text-xl">{getWorkoutEmoji(type)}</span>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-sm capitalize">{type}</p>
                          <p className="text-xs text-gray-500">
                            {isCustomized ? 'Customized' : 'Default'}
                          </p>
                        </div>
                        <span className="text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

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
                            <p className={`font-semibold capitalize ${isTrained ? 'font-heading uppercase tracking-wide text-sm' : ''}`}>
                              {log.isMinimal ? theme.labels.minimalWorkout : log.workoutType}
                            </p>
                            <p className="text-xs text-text-secondary">
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
                <EmptyState
                  icon={Dumbbell}
                  title="No workouts yet"
                  description="Start your first workout to begin tracking progress and earning XP."
                  action={{ label: "Start Workout", onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                />
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
            className={`bg-surface p-6 w-full max-w-md ${isTrained ? 'rounded-lg' : 'rounded-xl'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={`text-xl font-bold mb-2 ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
              {theme.labels.minimalWorkout}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {isTrained
                ? `Short on time? Log what you did instead. You'll still earn ${theme.labels.xp} for staying compliant!`
                : `Short on time? Log what you did instead. You'll still earn ${theme.labels.xp} for staying active!`}
            </p>

            <textarea
              value={minimalNotes}
              onChange={(e) => setMinimalNotes(e.target.value)}
              placeholder="What did you do? (e.g., 20 pushups, 5 min walk, stretching...)"
              className={`w-full h-32 bg-surface-elevated border border-border p-3 text-sm resize-none mb-4 ${isTrained ? 'rounded' : 'rounded-lg'}`}
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
                Log {theme.labels.minimalWorkout} (+{XP_VALUES.WORKOUT} {theme.labels.xp})
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Exercise Editor Modal */}
      {editingWorkoutType && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setEditingWorkoutType(null)
            setNewExercise({ name: '', targetSets: '3', targetReps: '8-12' })
            setEditingExerciseId(null)
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-bg-secondary rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getWorkoutEmoji(editingWorkoutType)}</span>
                <h2 className="text-xl font-bold capitalize">{editingWorkoutType} Exercises</h2>
              </div>
              <button
                onClick={() => {
                  setEditingWorkoutType(null)
                  setNewExercise({ name: '', targetSets: '3', targetReps: '8-12' })
                  setEditingExerciseId(null)
                }}
                className="text-gray-500 hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Current Exercises */}
            <div className="space-y-2 mb-4">
              {getExercisesForType(editingWorkoutType).map((exercise, index, arr) => {
                const customization = customizations.find(c => c.workoutType === editingWorkoutType)
                const customExercise = customization?.exercises[index]
                const exerciseId = customExercise?.id || `default-${editingWorkoutType}-${index}`
                const isEditing = editingExerciseId === exerciseId

                return (
                  <div
                    key={exerciseId}
                    className="bg-bg-card rounded-lg p-3"
                  >
                    {isEditing ? (
                      /* Inline Edit Mode */
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editExercise.name}
                          onChange={(e) => setEditExercise(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-bg-secondary border border-gray-700 rounded px-2 py-1 text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editExercise.targetSets}
                            onChange={(e) => setEditExercise(prev => ({ ...prev, targetSets: e.target.value }))}
                            className="w-16 bg-bg-secondary border border-gray-700 rounded px-2 py-1 text-sm text-center"
                            placeholder="Sets"
                          />
                          <span className="text-gray-500 self-center">×</span>
                          <input
                            type="text"
                            value={editExercise.targetReps}
                            onChange={(e) => setEditExercise(prev => ({ ...prev, targetReps: e.target.value }))}
                            className="flex-1 bg-bg-secondary border border-gray-700 rounded px-2 py-1 text-sm"
                            placeholder="Reps"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingExerciseId(null)}
                            className="flex-1 text-sm text-gray-400 py-1"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              updateExercise(editingWorkoutType, exerciseId, {
                                name: editExercise.name,
                                targetSets: Number(editExercise.targetSets) || 3,
                                targetReps: editExercise.targetReps || '8-12'
                              })
                              setEditingExerciseId(null)
                            }}
                            className="flex-1 text-sm text-accent-primary py-1 font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="flex items-center gap-2">
                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => index > 0 && reorderExercise(editingWorkoutType, index, index - 1)}
                            disabled={index === 0}
                            className={`text-xs px-1 ${index === 0 ? 'text-gray-700' : 'text-gray-500 hover:text-white'}`}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => index < arr.length - 1 && reorderExercise(editingWorkoutType, index, index + 1)}
                            disabled={index === arr.length - 1}
                            className={`text-xs px-1 ${index === arr.length - 1 ? 'text-gray-700' : 'text-gray-500 hover:text-white'}`}
                          >
                            ▼
                          </button>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{exercise.name}</p>
                          <p className="text-xs text-gray-500">
                            {exercise.targetSets} sets × {exercise.targetReps}
                          </p>
                        </div>
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingExerciseId(exerciseId)
                            setEditExercise({
                              name: exercise.name,
                              targetSets: String(exercise.targetSets),
                              targetReps: exercise.targetReps
                            })
                          }}
                          className="text-gray-500 hover:text-accent-primary p-1"
                          title="Edit exercise"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => removeExercise(editingWorkoutType, exerciseId)}
                          className="text-gray-500 hover:text-accent-danger p-1"
                          title="Remove exercise"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add New Exercise */}
            <div className="border-t border-gray-700 pt-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">ADD EXERCISE</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Exercise name"
                  className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2"
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Sets</label>
                    <input
                      type="number"
                      value={newExercise.targetSets}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, targetSets: e.target.value }))}
                      className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2 font-digital"
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Reps</label>
                    <input
                      type="text"
                      value={newExercise.targetReps}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, targetReps: e.target.value }))}
                      placeholder="e.g., 8-12"
                      className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (newExercise.name.trim()) {
                      addExercise(editingWorkoutType, {
                        name: newExercise.name,
                        targetSets: Number(newExercise.targetSets) || 3,
                        targetReps: newExercise.targetReps || '8-12'
                      })
                      setNewExercise({ name: '', targetSets: '3', targetReps: '8-12' })
                    }
                  }}
                  fullWidth
                  disabled={!newExercise.name.trim()}
                >
                  Add Exercise
                </Button>
              </div>
            </div>

            {/* Reset Button */}
            {customizations.some(c => c.workoutType === editingWorkoutType) && (
              <button
                onClick={() => {
                  if (window.confirm(`Reset ${editingWorkoutType} exercises to defaults?`)) {
                    resetToDefaults(editingWorkoutType)
                  }
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-accent-danger py-2"
              >
                Reset to Defaults
              </button>
            )}
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
  onComplete,
  onEndEarly,
  onAddExercise
}: {
  workout: WorkoutLog
  progress: number
  onUpdateSet: (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: number) => void
  onCompleteSet: (exerciseId: string, setIndex: number) => void
  onSkipSet: (exerciseId: string, setIndex: number) => void
  onUncompleteSet: (exerciseId: string, setIndex: number) => void
  onComplete: () => void
  onEndEarly: () => void
  onAddExercise: (exercise: { name: string; targetSets: number; targetReps: string }) => void
}) {
  const getExerciseHistory = useWorkoutStore((state) => state.getExerciseHistory)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(
    workout.exercises[0]?.id || null
  )
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExerciseForm, setNewExerciseForm] = useState({ name: '', targetSets: '2', targetReps: '8-12' })

  // Get last workout data for an exercise
  const getLastWorkout = (exerciseName: string) => {
    const history = getExerciseHistory(exerciseName, 1)
    if (history.length === 0 || history[0].sets.length === 0) return null

    // Find the best (heaviest) set from last workout
    const lastSets = history[0].sets
    const bestSet = lastSets.reduce((best, set) => {
      if (!best || set.weight > best.weight) return set
      if (set.weight === best.weight && set.reps > best.reps) return set
      return best
    }, lastSets[0])

    return {
      date: history[0].date,
      bestWeight: bestSet.weight,
      bestReps: bestSet.reps,
      sets: lastSets
    }
  }

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
          const lastWorkout = getLastWorkout(exercise.name)

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
                    <div className="px-4 pb-4 border-t border-gray-800 pt-3">
                      {/* Previous Performance */}
                      {lastWorkout && (
                        <div className="mb-4 p-3 bg-bg-secondary/50 rounded-lg border border-gray-700/50">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowHistoryFor(exercise.name)
                              }}
                              className="text-left hover:opacity-80 transition-opacity"
                            >
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                Last Workout <span className="text-accent-primary">→ View History</span>
                              </p>
                              <p className="text-sm">
                                <span className="text-accent-primary font-digital font-bold">{lastWorkout.bestWeight}</span>
                                <span className="text-gray-400"> lbs × </span>
                                <span className="text-accent-primary font-digital font-bold">{lastWorkout.bestReps}</span>
                                <span className="text-gray-400"> reps</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {new Date(lastWorkout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {lastWorkout.sets.length > 1 && ` • ${lastWorkout.sets.length} sets`}
                              </p>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                // Pre-fill all sets with last workout's weight
                                exercise.sets.forEach((set, idx) => {
                                  if (!set.completed && !set.skipped && set.weight === 0) {
                                    const lastSet = lastWorkout.sets[idx] || lastWorkout.sets[0]
                                    if (lastSet) {
                                      onUpdateSet(exercise.id, idx, 'weight', lastSet.weight)
                                    }
                                  }
                                })
                              }}
                              className="text-xs bg-accent-primary/20 text-accent-primary px-3 py-1.5 rounded-lg hover:bg-accent-primary/30 transition-colors"
                            >
                              Use Weight
                            </button>
                          </div>
                          {/* Show all sets from last time */}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {lastWorkout.sets.map((s, i) => (
                              <span key={i} className="text-xs text-gray-500 bg-bg-card px-2 py-0.5 rounded">
                                {s.weight}×{s.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Current Sets */}
                      <div className="space-y-3">
                        {exercise.sets.map((set, setIndex) => {
                          const lastSet = lastWorkout?.sets[setIndex]
                          const isImprovement = lastSet && set.completed &&
                            (set.weight > lastSet.weight || (set.weight === lastSet.weight && set.reps > lastSet.reps))

                          return (
                            <div
                              key={setIndex}
                              className={`${set.completed || set.skipped ? 'opacity-60' : ''}`}
                            >
                              {/* Last workout hint for this set */}
                              {lastSet && !set.completed && !set.skipped && (
                                <div className="text-xs text-gray-600 mb-1 ml-10">
                                  Last: {lastSet.weight} × {lastSet.reps}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 w-10">
                                  Set {setIndex + 1}
                                </span>
                                <div className="relative">
                                  <input
                                    type="number"
                                    placeholder={lastSet ? String(lastSet.weight) : '0'}
                                    value={set.weight || ''}
                                    onChange={(e) => onUpdateSet(exercise.id, setIndex, 'weight', Number(e.target.value))}
                                    className="w-16 bg-bg-secondary border border-gray-700 rounded px-2 py-1 text-center font-digital text-sm placeholder:text-gray-600"
                                  />
                                </div>
                                <span className="text-gray-500 text-sm">×</span>
                                <input
                                  type="number"
                                  placeholder={lastSet ? String(lastSet.reps) : '0'}
                                  value={set.reps || ''}
                                  onChange={(e) => onUpdateSet(exercise.id, setIndex, 'reps', Number(e.target.value))}
                                  className="w-14 bg-bg-secondary border border-gray-700 rounded px-2 py-1 text-center font-digital text-sm placeholder:text-gray-600"
                                />
                              {set.completed ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onUncompleteSet(exercise.id, setIndex)}
                                    className="text-accent-success hover:text-accent-primary transition-colors px-2"
                                    title="Click to edit"
                                  >
                                    ✓
                                  </button>
                                  {isImprovement && (
                                    <span className="text-xs text-accent-warning" title="Personal Record!">
                                      🔥
                                    </span>
                                  )}
                                </div>
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
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )
        })}
      </div>

      {/* Add Exercise Button */}
      <button
        onClick={() => setShowAddExercise(true)}
        className="w-full p-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-accent-primary hover:text-accent-primary transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-xl">+</span>
        <span>Add Exercise</span>
      </button>

      {/* Action Buttons */}
      <div className="space-y-3">
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

        {/* End Early Button */}
        {!allSetsComplete && (
          <button
            onClick={onEndEarly}
            className="w-full py-3 text-sm text-gray-400 hover:text-accent-warning transition-colors"
          >
            End Workout Early
          </button>
        )}
      </div>

      {/* Add Exercise Modal */}
      <AnimatePresence>
        {showAddExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddExercise(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-secondary rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Add Exercise</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Exercise Name</label>
                  <input
                    type="text"
                    value={newExerciseForm.name}
                    onChange={(e) => setNewExerciseForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Bicep Curls"
                    className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Sets</label>
                    <input
                      type="number"
                      value={newExerciseForm.targetSets}
                      onChange={(e) => setNewExerciseForm(prev => ({ ...prev, targetSets: e.target.value }))}
                      className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2 font-digital"
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Reps</label>
                    <input
                      type="text"
                      value={newExerciseForm.targetReps}
                      onChange={(e) => setNewExerciseForm(prev => ({ ...prev, targetReps: e.target.value }))}
                      placeholder="e.g., 8-12"
                      className="w-full bg-bg-card border border-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAddExercise(false)
                    setNewExerciseForm({ name: '', targetSets: '2', targetReps: '8-12' })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={() => {
                    if (newExerciseForm.name.trim()) {
                      onAddExercise({
                        name: newExerciseForm.name.trim(),
                        targetSets: Number(newExerciseForm.targetSets) || 2,
                        targetReps: newExerciseForm.targetReps || '8-12'
                      })
                      setShowAddExercise(false)
                      setNewExerciseForm({ name: '', targetSets: '2', targetReps: '8-12' })
                    }
                  }}
                  disabled={!newExerciseForm.name.trim()}
                >
                  Add to Workout
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise History Modal */}
      <AnimatePresence>
        {showHistoryFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHistoryFor(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-secondary rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{showHistoryFor}</h2>
                  <p className="text-sm text-gray-400">Exercise History</p>
                </div>
                <button
                  onClick={() => setShowHistoryFor(null)}
                  className="text-gray-500 hover:text-gray-300 text-xl"
                >
                  ✕
                </button>
              </div>

              <ExerciseHistoryView exerciseName={showHistoryFor} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ExerciseHistoryView({ exerciseName }: { exerciseName: string }) {
  const getExerciseHistory = useWorkoutStore((state) => state.getExerciseHistory)
  const history = getExerciseHistory(exerciseName, 10)

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">📊</span>
        <p className="text-gray-400">No history yet</p>
        <p className="text-sm text-gray-500">Complete this exercise to start tracking progress</p>
      </div>
    )
  }

  // Calculate PR (personal record)
  let prWeight = 0
  let prReps = 0
  let prDate = ''

  history.forEach(h => {
    h.sets.forEach(s => {
      if (s.weight > prWeight || (s.weight === prWeight && s.reps > prReps)) {
        prWeight = s.weight
        prReps = s.reps
        prDate = h.date
      }
    })
  })

  // Calculate progress trend
  const firstWorkout = history[history.length - 1]
  const lastWorkout = history[0]
  const firstBestWeight = Math.max(...firstWorkout.sets.map(s => s.weight))
  const lastBestWeight = Math.max(...lastWorkout.sets.map(s => s.weight))
  const weightChange = lastBestWeight - firstBestWeight

  return (
    <div className="space-y-4">
      {/* PR Card */}
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏆</span>
          <div>
            <p className="text-xs text-yellow-400 uppercase tracking-wider">Personal Record</p>
            <p className="text-2xl font-bold font-digital">
              {prWeight} <span className="text-gray-400 text-sm">lbs</span> × {prReps} <span className="text-gray-400 text-sm">reps</span>
            </p>
            <p className="text-xs text-gray-500">
              {new Date(prDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      {history.length > 1 && (
        <div className="flex gap-3">
          <div className="flex-1 bg-bg-card rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Workouts</p>
            <p className="text-xl font-bold font-digital">{history.length}</p>
          </div>
          <div className="flex-1 bg-bg-card rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Progress</p>
            <p className={`text-xl font-bold font-digital ${weightChange > 0 ? 'text-accent-success' : weightChange < 0 ? 'text-accent-warning' : 'text-gray-400'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange} lbs
            </p>
          </div>
        </div>
      )}

      {/* History List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">RECENT SESSIONS</h3>
        <div className="space-y-2">
          {history.map((session) => {
            const bestSet = session.sets.reduce((best, s) =>
              s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best
            , session.sets[0])
            const isPR = bestSet.weight === prWeight && bestSet.reps === prReps

            return (
              <div
                key={session.date}
                className={`p-3 rounded-lg ${isPR ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-bg-card'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {new Date(session.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  {isPR && <span className="text-xs text-yellow-400">PR 🏆</span>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {session.sets.map((s, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-1 rounded ${
                        s.weight === bestSet.weight && s.reps === bestSet.reps
                          ? 'bg-accent-primary/20 text-accent-primary'
                          : 'bg-bg-secondary text-gray-400'
                      }`}
                    >
                      {s.weight}×{s.reps}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
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

function getUniqueWorkoutTypes(schedule: { type: WorkoutType }[]): WorkoutType[] {
  const types = new Set<WorkoutType>()
  schedule.forEach(s => {
    if (s.type !== 'rest') {
      types.add(s.type)
    }
  })
  return Array.from(types)
}
