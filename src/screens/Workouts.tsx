import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProgressBar, EmptyState, Confetti, AppHeader } from '@/components'
import { RankUpModal } from '@/components'
import { useWorkoutStore, useAvatarStore, useAchievementsStore, useUserStore, toast, WorkoutType, WorkoutLog } from '@/stores'
import { useDPStore, DP_VALUES } from '@/stores/dpStore'
import { LABELS } from '@/design/constants'
import { analytics } from '@/lib/analytics'
import { haptics } from '@/lib/haptics'
import { sounds } from '@/lib/sounds'
import { notifyRestTimerComplete } from '@/lib/notifications'
import { confirmAction } from '@/lib/confirm'
import { scheduleSync } from '@/lib/sync'
import { getLocalDateString } from '@/lib/dateUtils'
import { cn } from '@/lib/cn'
import { motion } from 'framer-motion'
import { springs } from '@/lib/animations'
import { Clock, Dumbbell, ShieldCheck, Timer, Pencil, Moon, Check, ArrowUpRight, ChevronLeft, RotateCcw } from 'lucide-react'
import { ShareBottomSheet } from '@/components/share/ShareBottomSheet'
import { ShareCardWrapper } from '@/components/share/ShareCardWrapper'
import { WorkoutShareCard } from '@/components/share/WorkoutShareCard'
import { shareWorkoutCard } from '@/lib/shareCard'
import { getAvatarStage } from '@/lib/avatarUtils'

export function Workouts() {
  // PERF-02: Use granular selectors for reactive state only
  const currentPlan = useWorkoutStore((s) => s.currentPlan)
  const customizations = useWorkoutStore((s) => s.customizations)
  const assignedWorkout = useWorkoutStore((s) => s.assignedWorkout)

  // PERF-02: Access non-reactive functions via getState() to avoid re-renders
  const {
    getTodayWorkout,
    getCurrentWorkout,
    startWorkout,
    startMinimalWorkout,
    logSet,
    completeWorkout,
    endWorkoutEarly,
    addExerciseToWorkout,
    reorderWorkoutExercise,
    markXPAwarded,
    getWorkoutHistory,
    isWorkoutCompletedToday,
    getExercisesForType,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercise,
    resetToDefaults,
    setAssignedWorkout,
    getWeekWorkouts
  } = useWorkoutStore.getState()

  const { triggerReaction } = useAvatarStore.getState()
  const { checkAndAwardBadges, getAllBadges } = useAchievementsStore.getState()

  const [activeWorkout, setActiveWorkout] = useState<WorkoutLog | null>(getCurrentWorkout())
  const [showHistory, setShowHistory] = useState(false)
  const [showMinimalModal, setShowMinimalModal] = useState(false)
  const [minimalNotes, setMinimalNotes] = useState('')
  const [editingWorkoutType, setEditingWorkoutType] = useState<WorkoutType | null>(null)
  const [newExercise, setNewExercise] = useState({ name: '', targetSets: '3', targetReps: '8-12' })
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [editExercise, setEditExercise] = useState({ name: '', targetSets: '', targetReps: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rankUpData, setRankUpData] = useState<{ oldRank: number; newRank: number; rankName: string } | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [viewingWorkoutLog, setViewingWorkoutLog] = useState<WorkoutLog | null>(null)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [sharePhoto, setSharePhoto] = useState<string | undefined>()
  const [isSharing, setIsSharing] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  // Get user profile for share card
  const profile = useUserStore((s) => s.profile)

  const todayWorkout = getTodayWorkout()
  const isCompleted = isWorkoutCompletedToday()
  const workoutHistory = getWorkoutHistory(10)
  const allBadges = getAllBadges()
  const today = getLocalDateString()
  const hasAssignment = assignedWorkout && assignedWorkout.date === today
  const weekWorkouts = getWeekWorkouts()
  const otherWorkouts = weekWorkouts.filter(w => !w.isToday && !w.completed)

  // Check for badges and show toast notifications
  const checkBadgesWithToast = () => {
    const newBadgeIds = checkAndAwardBadges()
    if (newBadgeIds.length > 0) {
      newBadgeIds.forEach(id => {
        const b = allBadges.find(badge => badge.id === id)
        if (b) {
          analytics.badgeEarned(b.name, b.rarity)
        }
      })
      const badge = allBadges.find(b => b.id === newBadgeIds[0])
      if (badge) {
        toast.success(`🏆 Badge Unlocked: ${badge.name}!`, 5000)
      }
    }
  }

  const handleStartWorkout = (overrideType?: WorkoutType, overrideDayNumber?: number) => {
    const type = overrideType || todayWorkout?.type || 'push'
    const dayNumber = overrideDayNumber || todayWorkout?.dayNumber || 1
    if (!overrideType && !todayWorkout && !hasAssignment) return
    startWorkout(type, dayNumber)
    setActiveWorkout(getCurrentWorkout())
    analytics.workoutStarted(type)
  }

  const handleShareWorkout = async (_withPhoto: boolean, photoDataUrl?: string) => {
    setIsSharing(true)
    setSharePhoto(photoDataUrl)

    // Wait for next render to ensure card is populated with photo
    await new Promise(resolve => setTimeout(resolve, 100))

    if (shareCardRef.current) {
      const dpStoreState = useDPStore.getState()
      const rankInfo = dpStoreState.getRankInfo()

      // Get today's completed workout
      const todayLog = getWorkoutHistory(1)[0]
      const setsCompleted = todayLog?.exercises.reduce(
        (acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0
      ) || 0

      await shareWorkoutCard(
        shareCardRef.current,
        todayLog?.workoutType || 'Workout',
        setsCompleted,
        DP_VALUES.training,
        rankInfo.name
      )
    }

    setIsSharing(false)
    setShowShareSheet(false)
    setSharePhoto(undefined)
  }

  const handleMinimalWorkout = () => {
    if (isSubmitting) return
    if (!minimalNotes.trim()) return
    setIsSubmitting(true)

    const workoutId = startMinimalWorkout(minimalNotes)
    markXPAwarded(workoutId)

    // Award DP for training
    const result = useDPStore.getState().awardDP('training')
    if (result.rankedUp) {
      const rankInfo = useDPStore.getState().getRankInfo()
      setRankUpData({ oldRank: result.newRank - 1, newRank: result.newRank, rankName: rankInfo.name })
    }

    triggerReaction('checkIn')
    checkBadgesWithToast()
    analytics.quickWorkoutLogged()
    setShowMinimalModal(false)
    setMinimalNotes('')
  }

  const handleCompleteWorkout = () => {
    if (isSubmitting) return
    if (!activeWorkout) return
    setIsSubmitting(true)

    completeWorkout(activeWorkout.id)
    markXPAwarded(activeWorkout.id)

    // Award DP for training
    const result = useDPStore.getState().awardDP('training')
    if (result.rankedUp) {
      const rankInfo = useDPStore.getState().getRankInfo()
      setRankUpData({ oldRank: result.newRank - 1, newRank: result.newRank, rankName: rankInfo.name })
    }

    triggerReaction('checkIn')
    checkBadgesWithToast()

    // Track workout completion with duration
    const duration = activeWorkout.startTime && activeWorkout.endTime
      ? Math.round((Date.now() - activeWorkout.startTime) / 60000)
      : 0
    analytics.workoutCompleted(activeWorkout.workoutType, duration)

    haptics.success()
    setShowCelebration(true)
    setTimeout(() => {
      setShowCelebration(false)
      setActiveWorkout(null)
    }, 2500)
    // Trigger incremental sync
    scheduleSync()
  }

  const handleEndWorkoutEarly = async () => {
    if (isSubmitting) return
    if (!activeWorkout) return

    // Check if at least one set was completed
    const completedSets = activeWorkout.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
      0
    )

    if (completedSets === 0) {
      if (!await confirmAction('You haven\'t completed any sets. End workout anyway?', 'End Workout')) {
        return
      }
    }

    setIsSubmitting(true)

    endWorkoutEarly(activeWorkout.id)
    markXPAwarded(activeWorkout.id)

    // Still award DP for showing up
    const result = useDPStore.getState().awardDP('training')
    if (result.rankedUp) {
      const rankInfo = useDPStore.getState().getRankInfo()
      setRankUpData({ oldRank: result.newRank - 1, newRank: result.newRank, rankName: rankInfo.name })
    }

    triggerReaction('checkIn')
    checkBadgesWithToast()
    toast.success('Workout committed. Partial deploy counts.')

    const duration = activeWorkout.startTime
      ? Math.round((Date.now() - activeWorkout.startTime) / 60000)
      : 0
    analytics.workoutCompleted(activeWorkout.workoutType, duration)

    // Trigger incremental sync
    scheduleSync()
    setActiveWorkout(null)
  }

  const handleReorderExercise = (fromIndex: number, toIndex: number) => {
    if (!activeWorkout) return
    reorderWorkoutExercise(activeWorkout.id, fromIndex, toIndex)
    setActiveWorkout(getCurrentWorkout())
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
    <div data-testid="workouts-screen" className="min-h-screen pb-20 bg-background">
      <Confetti trigger={showCelebration} duration={3000} />
      <AppHeader />

      {/* Page Title */}
      <div className="px-6 pb-5">
        <h1 className="text-[26px] font-heading font-bold uppercase tracking-wide text-foreground leading-tight">
          {activeWorkout ? `${activeWorkout.workoutType} Day` : 'Training'}
        </h1>
        {currentPlan && !activeWorkout && (
          <p className="text-[13px] text-muted-foreground mt-1">
            {currentPlan.trainingDays}-Day Split
          </p>
        )}
      </div>

      <div className="px-6 space-y-7">
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
            onReorderExercise={handleReorderExercise}
            isSubmitting={isSubmitting}
          />
        ) : (
          <>
            {/* TODAY */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-primary mb-2">Today</p>
              {todayWorkout || hasAssignment ? (
                <>
                  {/* Today Card */}
                  <div className="relative rounded-lg overflow-hidden border border-primary/30" style={{ backgroundColor: '#161616' }}>
                    {/* Gold left accent line */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />

                    <div className="p-4 pl-5">
                      {hasAssignment && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <ShieldCheck size={14} className="text-primary" />
                          <span className="text-xs text-primary font-medium">
                            Assigned by Coach
                          </span>
                        </div>
                      )}

                      {/* Main content row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[17px] font-bold text-foreground leading-tight">
                            {hasAssignment ? 'Coach Workout' : (
                              <>
                                <span className="capitalize">{todayWorkout?.type}</span>
                                {todayWorkout?.name && todayWorkout.name !== todayWorkout.type && (
                                  <span className="text-muted-foreground font-normal"> ({todayWorkout.name})</span>
                                )}
                              </>
                            )}
                          </p>
                          <p className="text-[13px] text-muted-foreground mt-1">
                            {hasAssignment
                              ? `${assignedWorkout?.exercises.length} exercises prescribed`
                              : `Day ${todayWorkout?.dayNumber} of your week`}
                          </p>
                        </div>
                        {isCompleted && (
                          <div className="flex items-center gap-1.5 text-success flex-shrink-0">
                            <Check size={16} strokeWidth={2.5} />
                            <span className="font-semibold text-[15px]">Done!</span>
                          </div>
                        )}
                        {!isCompleted && (
                          <Button onClick={() => handleStartWorkout()} data-testid="workouts-start-button" size="sm" className="flex-shrink-0">
                            Start Workout
                          </Button>
                        )}
                      </div>

                      {/* Prescribed exercises preview */}
                      {hasAssignment && !isCompleted && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                          {assignedWorkout?.exercises.map((ex, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-foreground">{ex.name}</span>
                              <span className="text-muted-foreground text-xs">
                                {ex.targetSets} x {ex.targetReps}
                                {ex.targetWeight ? ` @ ${ex.targetWeight} lbs` : ''}
                              </span>
                            </div>
                          ))}
                          {assignedWorkout?.coachNotes && (
                            <div className="mt-2 p-2.5 bg-primary/10 rounded-lg">
                              <p className="text-xs text-primary">
                                <span className="font-semibold">Coach notes:</span> {assignedWorkout!.coachNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons when not completed */}
                      {!isCompleted && (
                        <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                          {hasAssignment && todayWorkout && (
                            <button
                              onClick={() => setAssignedWorkout(null)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all border border-border text-muted-foreground hover:border-primary hover:text-primary rounded-lg"
                            >
                              <Dumbbell size={16} />
                              Do your own workout instead
                            </button>
                          )}
                          <button
                            onClick={() => setShowMinimalModal(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all border border-border text-muted-foreground hover:border-primary hover:text-primary rounded-lg"
                          >
                            <Clock size={16} />
                            {`Log ${LABELS.minimalWorkout.toLowerCase()} instead`}
                          </button>
                        </div>
                      )}

                      {/* DP earned when completed */}
                      {isCompleted && (
                        <div className="mt-3">
                          <div className="flex justify-end">
                            <span className="text-[13px] text-primary flex items-center gap-1 font-medium">
                              +{DP_VALUES.training} {LABELS.dp} earned
                              <ArrowUpRight size={14} />
                            </span>
                          </div>
                          {/* Share Protocol button */}
                          <button
                            onClick={() => setShowShareSheet(true)}
                            className="w-full mt-3 py-2.5 text-[13px] font-heading uppercase tracking-widest text-primary border border-primary/30 rounded-lg hover:border-primary/50 transition-colors"
                          >
                            Share Protocol
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {!isCompleted && otherWorkouts.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => setShowWorkoutPicker(!showWorkoutPicker)}
                        className="w-full flex items-center justify-between py-2.5 px-4 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg border border-border"
                        data-testid="workout-picker-toggle"
                      >
                        <span>Choose a different workout</span>
                        <span className={`transition-transform duration-200 ${showWorkoutPicker ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {showWorkoutPicker && (
                        <div className="mt-2 space-y-2" data-testid="workout-picker-list">
                          {otherWorkouts.map(w => (
                            <Card key={w.day} className="py-0">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-sm">{w.name}</p>
                                    <p className="text-xs text-muted-foreground">Day {w.dayNumber}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStartWorkout(w.type, w.dayNumber)}
                                    data-testid="workout-picker-start"
                                  >
                                    Start
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {weekWorkouts.filter(w => !w.isToday && w.completed).map(w => (
                            <Card key={w.day} className="py-0 opacity-50">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-sm">{w.name}</p>
                                    <p className="text-xs text-muted-foreground">Day {w.dayNumber}</p>
                                  </div>
                                  <span className="text-sm text-success" data-testid="workout-picker-done">✓ Done</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="relative bg-surface border border-border rounded-xl overflow-hidden">
                  {/* Gold left accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-foreground/30" />

                  <div className="p-6 pl-7 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <RotateCcw size={24} className="text-muted-foreground" />
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      Recovery Day
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Recovery is part of the protocol
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CUSTOMIZE WORKOUTS */}
            {currentPlan && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-3">Customize Workouts</p>
                <div className="grid grid-cols-2 gap-3">
                  {getUniqueWorkoutTypes(currentPlan.schedule).map((type) => {
                    const isCustomized = customizations.some(c => c.workoutType === type && c.exercises.length > 0)
                    return (
                      <button
                        key={type}
                        onClick={() => setEditingWorkoutType(type)}
                        className="rounded-lg p-4 text-left transition-all group border border-primary/30 hover:border-primary/50"
                        style={{ backgroundColor: '#161616' }}
                      >
                        {/* Top row: icon + pencil */}
                        <div className="flex items-center justify-between mb-3">
                          {/* Dumbbell icon in outlined circle */}
                          <div className="w-10 h-10 rounded-full border border-primary/80 flex items-center justify-center">
                            <Dumbbell size={18} className="text-primary" />
                          </div>
                          {/* Edit icon */}
                          <Pencil size={14} className="text-primary/60 group-hover:text-primary transition-colors" />
                        </div>

                        <p className="font-semibold text-[15px] text-foreground capitalize">{type}</p>
                        <p className="text-[13px] text-muted-foreground mt-0.5">
                          {isCustomized ? 'Customized' : 'Default'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* THIS WEEK */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-4">This Week</p>
              <div className="flex justify-between gap-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                  const workout = currentPlan?.schedule.find(s => s.day === index)
                  const todayDOW = new Date().getDay()
                  const isToday = todayDOW === index
                  const isPast = !isToday && (todayDOW === 0 ? index !== 0 : index < todayDOW)
                  const isCoachDay = isToday && hasAssignment
                  const isRestDay = workout?.type === 'rest'
                  const weekWorkout = weekWorkouts.find(w => w.day === index)
                  const isDone = weekWorkout?.completed

                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex-1 flex flex-col items-center justify-between py-2.5 rounded-xl transition-all',
                        isToday
                          ? 'bg-primary/30 border-2 border-primary shadow-[0_0_15px_rgba(212,168,83,0.4)]'
                          : 'border border-border/50',
                        isPast && !isDone && !isRestDay && 'opacity-40'
                      )}
                      style={{
                        backgroundColor: isToday ? undefined : '#1a1a1a',
                        minHeight: '72px'
                      }}
                    >
                      {/* Day label inside box */}
                      <span className={cn(
                        "text-[13px] font-medium",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}>
                        {day}
                      </span>

                      {/* Icon */}
                      {isCoachDay ? (
                        <ShieldCheck size={20} className="text-primary" />
                      ) : isRestDay ? (
                        <Moon size={18} className="text-muted-foreground" />
                      ) : (
                        <Dumbbell size={20} className={cn(
                          isToday || isDone ? 'text-primary' : 'text-muted-foreground/70'
                        )} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RECENT WORKOUTS */}
            <div data-testid="workouts-history">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Recent Workouts</p>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-[13px] text-primary font-medium hover:text-primary/80 transition-colors"
                >
                  {showHistory ? 'Hide' : 'Show All'}
                </button>
              </div>

              <div className="space-y-2.5">
                {(showHistory ? workoutHistory : workoutHistory.slice(0, 3)).map((log, index) => (
                  <button
                    key={log.id}
                    onClick={() => setViewingWorkoutLog(log)}
                    className="w-full text-left animate-in fade-in slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="rounded-lg p-4 border border-primary/30 hover:border-primary/50 transition-colors" style={{ backgroundColor: '#161616' }}>
                      <div className="flex items-center gap-4">
                        {/* Filled gold circular icon */}
                        <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(212,168,83,0.25)]">
                          <Dumbbell size={20} className="text-background" />
                        </div>

                        {/* Workout info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold capitalize text-foreground text-[15px]">
                            {log.isMinimal ? LABELS.minimalWorkout : log.workoutType}
                          </p>
                          <p className="text-[13px] text-muted-foreground mt-0.5">
                            {new Date(log.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-success text-[13px] flex items-center gap-1.5 justify-end font-medium">
                            <Check size={14} strokeWidth={2.5} />
                            Complete
                          </p>
                          <p className="text-[13px] text-muted-foreground mt-0.5">
                            {log.isMinimal
                              ? 'Minimal'
                              : `${log.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)} sets`}
                          </p>
                        </div>
                      </div>

                      {log.isMinimal && log.notes && (
                        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 italic">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {workoutHistory.length === 0 && (
                <EmptyState
                  icon={Dumbbell}
                  title="No workouts yet"
                  description={`Start your first workout to begin tracking progress and earning ${LABELS.dp}.`}
                  action={{ label: "Start Workout", onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Minimal Workout Modal */}
      {showMinimalModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log minimal workout"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowMinimalModal(false)}
        >
          <div
            className="bg-card p-6 w-full max-w-md rounded-lg animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">
              {LABELS.minimalWorkout}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Short on time? Log what you did instead. You'll still earn {LABELS.dp} for staying compliant!
            </p>

            <Textarea
              value={minimalNotes}
              onChange={(e) => setMinimalNotes(e.target.value)}
              placeholder="What did you do? (e.g., 20 pushups, 5 min walk, stretching...)"
              className="h-32 text-sm resize-none mb-4"
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
                className="flex-1"
                onClick={handleMinimalWorkout}
                disabled={!minimalNotes.trim() || isSubmitting}
              >
                Log {LABELS.minimalWorkout} (+{DP_VALUES.training} {LABELS.dp})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rank Up Modal */}
      {rankUpData && (
        <RankUpModal
          oldRank={rankUpData.oldRank}
          newRank={rankUpData.newRank}
          rankName={rankUpData.rankName}
          onClose={() => setRankUpData(null)}
        />
      )}

      {/* Exercise Editor Modal */}
      {editingWorkoutType && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit workout exercises"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setEditingWorkoutType(null)
            setNewExercise({ name: '', targetSets: '3', targetReps: '8-12' })
            setEditingExerciseId(null)
          }}
        >
          <div
            className="bg-card rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
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
                className="text-muted-foreground hover:text-foreground"
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
                    className="bg-card rounded-lg p-3"
                  >
                    {isEditing ? (
                      /* Inline Edit Mode */
                      <div className="space-y-2">
                        <Input
                          type="text"
                          value={editExercise.name}
                          onChange={(e) => setEditExercise(prev => ({ ...prev, name: e.target.value }))}
                          className="text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={editExercise.targetSets}
                            onChange={(e) => setEditExercise(prev => ({ ...prev, targetSets: e.target.value }))}
                            className="w-16 text-sm text-center"
                            aria-label="Sets"
                            placeholder="Sets"
                          />
                          <span className="text-muted-foreground self-center">×</span>
                          <Input
                            type="text"
                            value={editExercise.targetReps}
                            onChange={(e) => setEditExercise(prev => ({ ...prev, targetReps: e.target.value }))}
                            className="flex-1 text-sm"
                            aria-label="Reps"
                            placeholder="Reps"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingExerciseId(null)}
                            className="flex-1 text-sm text-muted-foreground py-1"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (!editExercise.name.trim()) return
                              updateExercise(editingWorkoutType, exerciseId, {
                                name: editExercise.name.trim(),
                                targetSets: Number(editExercise.targetSets) || 3,
                                targetReps: editExercise.targetReps || '8-12'
                              })
                              setEditingExerciseId(null)
                            }}
                            disabled={!editExercise.name.trim()}
                            className="flex-1 text-sm text-primary py-1 font-semibold"
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
                            aria-label={`Move ${exercise.name} up`}
                            className={`text-xs px-1 ${index === 0 ? 'text-muted-foreground/30' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => index < arr.length - 1 && reorderExercise(editingWorkoutType, index, index + 1)}
                            disabled={index === arr.length - 1}
                            aria-label={`Move ${exercise.name} down`}
                            className={`text-xs px-1 ${index === arr.length - 1 ? 'text-muted-foreground/30' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            ▼
                          </button>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{exercise.name}</p>
                          <p className="text-xs text-muted-foreground">
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
                          className="text-muted-foreground hover:text-primary p-1"
                          aria-label={`Edit ${exercise.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => removeExercise(editingWorkoutType, exerciseId)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          aria-label={`Remove ${exercise.name}`}
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
            <div className="border-t border-border pt-4 mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">ADD EXERCISE</h3>
              <div className="space-y-3">
                <Input
                  type="text"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Exercise name"
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Sets</label>
                    <Input
                      type="number"
                      value={newExercise.targetSets}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, targetSets: e.target.value }))}
                      className="font-digital"
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Reps</label>
                    <Input
                      type="text"
                      value={newExercise.targetReps}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, targetReps: e.target.value }))}
                      placeholder="e.g., 8-12"
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
                  className="w-full"
                  disabled={!newExercise.name.trim()}
                >
                  Add Exercise
                </Button>
              </div>
            </div>

            {/* Reset Button */}
            {customizations.some(c => c.workoutType === editingWorkoutType) && (
              <button
                onClick={async () => {
                  if (await confirmAction(`Reset ${editingWorkoutType} exercises to defaults?`, 'Reset Exercises')) {
                    resetToDefaults(editingWorkoutType)
                  }
                }}
                className="w-full text-center text-sm text-muted-foreground hover:text-destructive py-2"
              >
                Reset to Defaults
              </button>
            )}
          </div>
        </div>
      )}

      {/* Workout Log Detail Modal */}
      {viewingWorkoutLog && (
        <WorkoutLogModal
          log={viewingWorkoutLog}
          onClose={() => setViewingWorkoutLog(null)}
        />
      )}

      {/* Share Bottom Sheet */}
      <ShareBottomSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        onShare={handleShareWorkout}
        isLoading={isSharing}
      />

      {/* Off-screen share card for PNG capture */}
      <ShareCardWrapper cardRef={shareCardRef}>
        <WorkoutShareCard
          workoutName={todayWorkout?.name || todayWorkout?.type || 'Workout'}
          setsCompleted={(() => {
            const log = getWorkoutHistory(1)[0]
            return log?.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0) || 0
          })()}
          topLift={(() => {
            const log = getWorkoutHistory(1)[0]
            let topLift = 'Training'
            let topWeight = 0
            log?.exercises.forEach(ex => {
              ex.sets.forEach(set => {
                if (set.completed && set.weight > topWeight) {
                  topWeight = set.weight
                  topLift = `${ex.name} x${set.reps}`
                }
              })
            })
            return topLift
          })()}
          dpEarned={DP_VALUES.training}
          rankName={useDPStore.getState().getRankInfo().name}
          avatarStage={getAvatarStage(useDPStore.getState().currentRank) as 1 | 2 | 3 | 4 | 5}
          archetype={profile?.archetype || 'bro'}
          callsign={profile?.username || 'Initiate'}
          userPhoto={sharePhoto}
        />
      </ShareCardWrapper>
    </div>
  )
}

function WorkoutLogModal({ log, onClose }: { log: WorkoutLog; onClose: () => void }) {
  // Get all logs of the same workout type to show day tabs
  const workoutLogs = useWorkoutStore((s) => s.workoutLogs)
  const sameTypeLogs = workoutLogs
    .filter(l => l.workoutType === log.workoutType && !l.isMinimal)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const [selectedLog, setSelectedLog] = useState(log)

  // Calculate PRs for this workout type
  const exercisePRs = new Map<string, number>()
  workoutLogs.forEach(l => {
    l.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed && set.weight > 0) {
          const currentPR = exercisePRs.get(ex.name) || 0
          if (set.weight > currentPR) {
            exercisePRs.set(ex.name, set.weight)
          }
        }
      })
    })
  })

  const formatDayLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/90 z-50 flex flex-col animate-in fade-in duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/30">
        <button onClick={onClose} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-lg font-heading font-bold uppercase tracking-wide text-foreground">
          {selectedLog.workoutType} Day {selectedLog.dayNumber ? String.fromCharCode(64 + selectedLog.dayNumber) : ''}
        </h1>
        <div className="w-10" />
      </div>

      {/* Day Tabs */}
      {sameTypeLogs.length > 1 && (
        <div className="flex gap-2 px-4 py-3">
          {sameTypeLogs.map((l) => {
            const isSelected = l.id === selectedLog.id
            return (
              <button
                key={l.id}
                onClick={() => setSelectedLog(l)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-semibold transition-all',
                  isSelected
                    ? 'bg-primary text-background'
                    : 'bg-surface-elevated text-muted-foreground hover:text-foreground'
                )}
              >
                {formatDayLabel(l.date)}
              </button>
            )
          })}
        </div>
      )}

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {selectedLog.exercises.map((exercise) => {
          const isPR = exercise.sets.some(s => s.completed && s.weight === exercisePRs.get(exercise.name))

          return (
            <div
              key={exercise.id}
              className="rounded-xl p-4 border border-primary/30"
              style={{ backgroundColor: '#161616' }}
            >
              {/* Exercise Header */}
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-[17px] font-bold text-foreground">
                  {exercise.name}
                </h3>
                {isPR && (
                  <span className="px-2 py-0.5 bg-primary text-background text-[11px] font-bold rounded uppercase">
                    PR
                  </span>
                )}
              </div>

              {/* Sets */}
              <div className="space-y-1.5">
                {exercise.sets.filter(s => !s.warmup && s.completed).map((set, idx) => {
                  const isSetPR = set.weight === exercisePRs.get(exercise.name)
                  return (
                    <p
                      key={idx}
                      className={cn(
                        'text-[15px]',
                        isSetPR ? 'text-primary font-semibold' : 'text-foreground'
                      )}
                    >
                      {set.reps} × {set.weight} lbs
                      {isSetPR && <span className="text-primary ml-2">PR</span>}
                    </p>
                  )
                })}
                {exercise.sets.filter(s => !s.warmup && s.completed).length === 0 && (
                  <p className="text-[15px] text-muted-foreground italic">No sets completed</p>
                )}
              </div>
            </div>
          )
        })}

        {selectedLog.isMinimal && selectedLog.notes && (
          <div
            className="rounded-xl p-4 border border-border"
            style={{ backgroundColor: '#161616' }}
          >
            <h3 className="text-[15px] font-semibold text-foreground mb-2">Notes</h3>
            <p className="text-[15px] text-muted-foreground italic">"{selectedLog.notes}"</p>
          </div>
        )}
      </div>

    </div>
  )
}

interface RestTimerState {
  active: boolean
  timeRemaining: number
  totalTime: number
  exerciseName: string
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
  onAddExercise,
  onReorderExercise,
  isSubmitting
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
  onReorderExercise: (fromIndex: number, toIndex: number) => void
  isSubmitting: boolean
}) {
  const { getRestTimeForExercise, setExerciseRestTime } = useWorkoutStore.getState()
  const getExerciseHistory = useWorkoutStore((state) => state.getExerciseHistory)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(
    workout.exercises[0]?.id || null
  )
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExerciseForm, setNewExerciseForm] = useState({ name: '', targetSets: '2', targetReps: '8-12' })
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null)
  const [showRestTimeModal, setShowRestTimeModal] = useState<string | null>(null)

  // Rest timer countdown effect
  useEffect(() => {
    if (!restTimer?.active || restTimer.timeRemaining <= 0) return

    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (!prev || prev.timeRemaining <= 1) {
          haptics.medium()
          sounds.chime()
          notifyRestTimerComplete()
          return null
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [restTimer?.active, restTimer?.timeRemaining])

  const startRestTimer = (exerciseName: string) => {
    const restTime = getRestTimeForExercise(exerciseName)
    setRestTimer({
      active: true,
      timeRemaining: restTime,
      totalTime: restTime,
      exerciseName
    })
  }

  const adjustRestTime = (delta: number) => {
    setRestTimer(prev => {
      if (!prev) return null
      const newTime = Math.max(0, prev.timeRemaining + delta)
      const newTotal = delta > 0 ? Math.max(prev.totalTime, newTime) : prev.totalTime
      return { ...prev, timeRemaining: newTime, totalTime: newTotal }
    })
  }

  const dismissRestTimer = () => {
    setRestTimer(null)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
      <div className="rounded-xl bg-surface border border-border p-5">
        {workout.assignmentId && (
          <div className="flex items-center gap-1.5 mb-3">
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-xs text-primary font-medium uppercase tracking-wide">
              Prescribed by Coach
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-heading uppercase tracking-wide">
              {workout.assignmentId ? 'Coach Workout' : `${workout.workoutType} Day`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Week {workout.weekNumber}, Day {workout.dayNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-digital text-primary">
              {Math.round(progress)}%
            </p>
          </div>
        </div>
        <ProgressBar progress={progress} color="gradient" size="lg" />
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {workout.exercises.map((exercise, exIndex) => {
          const isExpanded = expandedExercise === exercise.id
          const completedSets = exercise.sets.filter(s => s.completed || s.skipped).length
          const isComplete = completedSets === exercise.sets.length
          const lastWorkout = getLastWorkout(exercise.name)

          return (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: exIndex * 0.1, ...springs.bouncy }}
            >
              <div
                data-testid="workouts-exercise-card"
                className={cn(
                  "rounded-xl border transition-all",
                  isComplete ? "bg-primary/5 border-primary/30" : "bg-surface border-border",
                  isExpanded && "shadow-[0_0_15px_rgba(212,168,83,0.1)]"
                )}
              >
                <button
                  onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); onReorderExercise(exIndex, exIndex - 1) }}
                        className={`text-xs leading-none px-1 ${exIndex === 0 ? 'text-muted-foreground/30 pointer-events-none' : 'text-muted-foreground hover:text-primary'}`}
                        disabled={exIndex === 0}
                        data-testid="workouts-move-up"
                      >
                        ▲
                      </button>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-heading",
                        isComplete ? "bg-primary/20 text-primary" : "bg-surface-elevated text-muted-foreground"
                      )}>
                        {isComplete ? '✓' : exIndex + 1}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onReorderExercise(exIndex, exIndex + 1) }}
                        className={`text-xs leading-none px-1 ${exIndex === workout.exercises.length - 1 ? 'text-muted-foreground/30 pointer-events-none' : 'text-muted-foreground hover:text-primary'}`}
                        disabled={exIndex === workout.exercises.length - 1}
                        data-testid="workouts-move-down"
                      >
                        ▼
                      </button>
                    </div>
                    <div className="text-left">
                      <p className={cn(
                        "font-heading uppercase tracking-wide text-sm",
                        isComplete ? "text-primary" : "text-foreground"
                      )}>
                        {exercise.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {exercise.targetSets} sets × {exercise.targetReps} reps
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowRestTimeModal(exercise.name)
                          }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded bg-muted/50"
                        >
                          <Timer size={10} />
                          {formatTime(getRestTimeForExercise(exercise.name))}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {completedSets}/{exercise.sets.length}
                    </span>
                    <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                <div className={cn(
                  'overflow-hidden transition-all duration-300',
                  isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                )}>
                  <div className="px-4 pb-4 border-t border-border/50 pt-3">
                    {/* Previous Performance */}
                    {lastWorkout && (
                      <div className="mb-4 p-3 bg-surface-elevated rounded-xl border border-border/50">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowHistoryFor(exercise.name)
                            }}
                            className="text-left hover:opacity-80 transition-opacity"
                          >
                            <p className="text-xs text-muted-foreground mb-1">
                              Last Workout <span className="text-primary">→ View History</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-primary font-digital font-bold">{lastWorkout.bestWeight}</span>
                              <span className="text-muted-foreground"> lbs × </span>
                              <span className="text-primary font-digital font-bold">{lastWorkout.bestReps}</span>
                              <span className="text-muted-foreground"> reps</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
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
                            className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/30 transition-colors"
                          >
                            Use Weight
                          </button>
                        </div>
                        {/* Show all sets from last time */}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {lastWorkout.sets.map((s, i) => (
                            <span key={i} className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded">
                              {s.weight}×{s.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current Sets */}
                    <div className="space-y-3">
                      {exercise.sets.map((set, setIndex) => {
                        const workingSets = exercise.sets.filter(s => !s.warmup)
                        const workingSetIndex = set.warmup ? -1 : exercise.sets.slice(0, setIndex).filter(s => !s.warmup).length
                        const lastSet = set.warmup ? undefined : lastWorkout?.sets[workingSetIndex]
                        const prevSet = setIndex > 0 ? exercise.sets[setIndex - 1] : null
                        const firstWorkingSet = workingSets[0]
                        const isImprovement = lastSet && set.completed &&
                          (set.weight > lastSet.weight || (set.weight === lastSet.weight && set.reps > lastSet.reps))

                        // Warmup weight placeholder: 50% of first working set's weight (or last workout)
                        const warmupWeightHint = (() => {
                          if (!set.warmup) return undefined
                          if (firstWorkingSet?.weight) return String(Math.round(firstWorkingSet.weight * 0.5))
                          const lastFirstSet = lastWorkout?.sets[0]
                          if (lastFirstSet?.weight) return String(Math.round(lastFirstSet.weight * 0.5))
                          return '0'
                        })()

                        const weightPlaceholder = set.warmup
                          ? warmupWeightHint!
                          : prevSet?.weight ? String(prevSet.weight) : lastSet ? String(lastSet.weight) : '0'

                        const repsPlaceholder = set.warmup
                          ? '10'
                          : prevSet?.reps ? String(prevSet.reps) : lastSet ? String(lastSet.reps) : '0'

                        return (
                          <div
                            key={setIndex}
                            className={`${set.completed || set.skipped ? 'opacity-60' : ''}`}
                          >
                            {/* Last workout hint for this set */}
                            {lastSet && !set.completed && !set.skipped && (
                              <div className="text-xs text-muted-foreground mb-1 ml-10">
                                Last: {lastSet.weight} × {lastSet.reps}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className={`text-sm w-14 ${set.warmup ? 'text-warning italic' : 'text-muted-foreground'}`}>
                                {set.warmup ? 'Warmup' : `Set ${workingSetIndex + 1}`}
                              </span>
                              <div className="flex flex-col items-center">
                                <label className="text-[10px] text-muted-foreground mb-0.5">lbs</label>
                                <Input
                                  type="number"
                                  placeholder={weightPlaceholder}
                                  value={set.weight || ''}
                                  onChange={(e) => onUpdateSet(exercise.id, setIndex, 'weight', Number(e.target.value))}
                                  className="w-16 text-center font-digital text-sm"
                                  data-testid="workouts-set-weight-input"
                                />
                              </div>
                              <span className="text-muted-foreground text-sm mt-3">×</span>
                              <div className="flex flex-col items-center">
                                <label className="text-[10px] text-muted-foreground mb-0.5">reps</label>
                                <Input
                                  type="number"
                                  placeholder={repsPlaceholder}
                                  value={set.reps || ''}
                                  onChange={(e) => onUpdateSet(exercise.id, setIndex, 'reps', Number(e.target.value))}
                                  className="w-14 text-center font-digital text-sm"
                                  data-testid="workouts-set-reps-input"
                                />
                              </div>
                              {set.completed ? (
                                <motion.div
                                  className="flex items-center gap-1"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={springs.bouncy}
                                >
                                  <button
                                    onClick={() => onUncompleteSet(exercise.id, setIndex)}
                                    className="text-success hover:text-primary transition-colors px-2"
                                    title="Click to edit"
                                  >
                                    ✓
                                  </button>
                                  {isImprovement && (
                                    <span className="text-xs text-warning" role="img" aria-label="Personal record">
                                      🔥
                                    </span>
                                  )}
                                </motion.div>
                              ) : set.skipped ? (
                                <button
                                  onClick={() => onUncompleteSet(exercise.id, setIndex)}
                                  className="text-muted-foreground hover:text-primary transition-colors px-2 text-sm"
                                  title="Click to undo skip"
                                >
                                  Skip
                                </button>
                              ) : (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      onCompleteSet(exercise.id, setIndex)
                                      startRestTimer(exercise.name)
                                    }}
                                    data-testid="workouts-set-checkbox"
                                  >
                                    Done
                                  </Button>
                                  <button
                                    onClick={() => onSkipSet(exercise.id, setIndex)}
                                    className="text-xs text-muted-foreground hover:text-foreground px-2"
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
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Add Exercise Button */}
      <button
        onClick={() => setShowAddExercise(true)}
        className="w-full p-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-xl">+</span>
        <span className="uppercase tracking-wide text-sm">Add Exercise</span>
      </button>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Complete Button */}
        <Button
          onClick={onComplete}
          className={cn('w-full', allSetsComplete && 'animate-pulse')}
          size="lg"
          disabled={!allSetsComplete || isSubmitting}
          data-testid="workouts-complete-button"
        >
          {allSetsComplete ? `Complete Workout (+${DP_VALUES.training} ${LABELS.dp})` : 'Complete All Sets First'}
        </Button>

        {/* End Early Button */}
        {!allSetsComplete && (
          <button
            onClick={onEndEarly}
            disabled={isSubmitting}
            className="w-full py-3 text-sm text-muted-foreground hover:text-warning transition-colors"
          >
            End Workout Early
          </button>
        )}
      </div>

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add exercise"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAddExercise(false)}
        >
          <div
            className="bg-card rounded-xl p-6 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Add Exercise</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Exercise Name</label>
                <Input
                  type="text"
                  value={newExerciseForm.name}
                  onChange={(e) => setNewExerciseForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Bicep Curls"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">Sets</label>
                  <Input
                    type="number"
                    value={newExerciseForm.targetSets}
                    onChange={(e) => setNewExerciseForm(prev => ({ ...prev, targetSets: e.target.value }))}
                    className="font-digital"
                    min={1}
                    max={10}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">Reps</label>
                  <Input
                    type="text"
                    value={newExerciseForm.targetReps}
                    onChange={(e) => setNewExerciseForm(prev => ({ ...prev, targetReps: e.target.value }))}
                    placeholder="e.g., 8-12"
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
                className="flex-1"
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
          </div>
        </div>
      )}

      {/* Exercise History Modal */}
      {showHistoryFor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Exercise history"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowHistoryFor(null)}
        >
          <div
            className="bg-card rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{showHistoryFor}</h2>
                <p className="text-sm text-muted-foreground">Exercise History</p>
              </div>
              <button
                onClick={() => setShowHistoryFor(null)}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                ✕
              </button>
            </div>

            <ExerciseHistoryView exerciseName={showHistoryFor} />
          </div>
        </div>
      )}

      {/* Rest Timer Bar */}
      {restTimer && (
        <div
          className="fixed bottom-20 left-0 right-0 px-4 z-40"
          onClick={dismissRestTimer}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={springs.bouncy}
            className="bg-card border border-border rounded-xl p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bar that shrinks */}
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '100%' }}
                animate={{ width: `${(restTimer.timeRemaining / restTimer.totalTime) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Timer display and controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  adjustRestTime(-15)
                }}
                className="w-12 h-10 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm transition-colors"
              >
                -15
              </button>
              <div className="text-center">
                <span className="text-3xl font-mono font-bold text-primary">
                  {formatTime(restTimer.timeRemaining)}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Tap to dismiss
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  adjustRestTime(15)
                }}
                className="w-12 h-10 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm transition-colors"
              >
                +15
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rest Time Settings Modal */}
      {showRestTimeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Set rest time"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowRestTimeModal(null)}
        >
          <div
            className="bg-card rounded-xl p-6 w-full max-w-sm animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Timer size={20} className="text-primary" />
              <h2 className="text-lg font-bold">Rest Time</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Set rest time for {showRestTimeModal}
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[60, 90, 120, 180].map((seconds) => {
                const currentRestTime = getRestTimeForExercise(showRestTimeModal)
                const isSelected = currentRestTime === seconds
                return (
                  <button
                    key={seconds}
                    onClick={() => {
                      setExerciseRestTime(showRestTimeModal, seconds)
                      setShowRestTimeModal(null)
                    }}
                    className={cn(
                      'py-3 rounded-lg text-sm font-semibold transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    )}
                  >
                    {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                  </button>
                )
              })}
            </div>

            <Button
              variant="ghost"
              onClick={() => setShowRestTimeModal(null)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ExerciseHistoryView({ exerciseName }: { exerciseName: string }) {
  const getExerciseHistory = useWorkoutStore((state) => state.getExerciseHistory)
  const history = getExerciseHistory(exerciseName, 10)

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block" role="img" aria-hidden="true">📊</span>
        <p className="text-muted-foreground">No history yet</p>
        <p className="text-sm text-muted-foreground">Complete this exercise to start tracking progress</p>
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
          <span className="text-3xl" role="img" aria-label="Trophy">🏆</span>
          <div>
            <p className="text-xs text-yellow-400 font-semibold">Personal Record</p>
            <p className="text-2xl font-bold font-digital">
              {prWeight} <span className="text-muted-foreground text-sm">lbs</span> × {prReps} <span className="text-muted-foreground text-sm">reps</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(prDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      {history.length > 1 && (
        <div className="flex gap-3">
          <div className="flex-1 bg-card rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Workouts</p>
            <p className="text-xl font-bold font-digital">{history.length}</p>
          </div>
          <div className="flex-1 bg-card rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className={`text-xl font-bold font-digital ${weightChange > 0 ? 'text-success' : weightChange < 0 ? 'text-warning' : 'text-muted-foreground'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange} lbs
            </p>
          </div>
        </div>
      )}

      {/* History List */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">RECENT SESSIONS</h3>
        <div className="space-y-2">
          {history.map((session) => {
            const bestSet = session.sets.reduce((best, s) =>
              s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best
              , session.sets[0])
            const isPR = bestSet.weight === prWeight && bestSet.reps === prReps

            return (
              <div
                key={session.date}
                className={`p-3 rounded-lg ${isPR ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-card'}`}
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
                      className={`text-xs px-2 py-1 rounded ${s.weight === bestSet.weight && s.reps === bestSet.reps
                        ? 'bg-primary/20 text-primary'
                        : 'bg-card text-muted-foreground'
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
