import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Avatar, XPDisplay, Card, Button, ProgressBar, ReminderList, WeeklySummary, NearestBadges, StreakDisplay, StreakBadge } from '@/components'
import { Flame, Dumbbell, Beef, Zap, CheckCircle2, Gift, Sparkles, ChevronRight, Trophy, AlertTriangle, Check } from 'lucide-react'
import {
  useUserStore,
  useXPStore,
  useWorkoutStore,
  useMacroStore,
  useAvatarStore,
  useRemindersStore
} from '@/stores'
import { getStandingOrder, LABELS } from '@/design/constants'
import { haptics } from '@/lib/haptics'
import { CheckInModal } from './CheckInModal'
import { XPClaimModal } from './XPClaimModal'

export function Home() {
  const navigate = useNavigate()

  const profile = useUserStore((state) => state.profile)
  const { currentLevel, pendingXP, XP_VALUES, getTodayLog } = useXPStore()
  const { getTodayWorkout, isWorkoutCompletedToday } = useWorkoutStore()
  const { targets, isProteinTargetHit, isCalorieTargetHit, getTodayProgress } = useMacroStore()
  // triggerReaction is handled in XPClaimModal
  useAvatarStore()
  const canClaimXP = useXPStore((state) => state.canClaimXP())
  const activeReminders = useRemindersStore((state) => state.getActiveReminders())

  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [justCheckedIn, setJustCheckedIn] = useState(false)

  // Check if user has already checked in today
  const todayLog = getTodayLog()
  const hasCheckedInToday = todayLog?.checkIn || false

  const todayWorkout = getTodayWorkout()
  const workoutCompleted = isWorkoutCompletedToday()

  // Get a contextual standing order/motivational message
  const message = useMemo(() => {
    // Determine context for message selection
    if (profile?.streakPaused) {
      return getStandingOrder('missed')
    }
    if (!todayWorkout) {
      return getStandingOrder('rest')
    }
    if (canClaimXP) {
      return getStandingOrder('claim')
    }
    return getStandingOrder('training')
  }, [profile?.streakPaused, todayWorkout, canClaimXP])

  // Reset justCheckedIn after animation
  useEffect(() => {
    if (justCheckedIn) {
      const timer = setTimeout(() => setJustCheckedIn(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [justCheckedIn])

  const proteinHit = isProteinTargetHit()
  const caloriesHit = isCalorieTargetHit()
  const macroProgress = getTodayProgress()

  // Calculate potential XP for today
  const streakBonus = (profile?.currentStreak || 0) * XP_VALUES.STREAK_PER_DAY
  const potentialXP = [
    todayWorkout && !workoutCompleted ? XP_VALUES.WORKOUT : 0,
    !proteinHit ? XP_VALUES.PROTEIN : 0,
    !caloriesHit ? XP_VALUES.CALORIES : 0,
    XP_VALUES.CHECK_IN,
    proteinHit && caloriesHit ? XP_VALUES.PERFECT_DAY : 0,
    streakBonus
  ].reduce((a, b) => a + b, 0)

  const quests = [
    {
      id: 'workout',
      label: todayWorkout ? `Complete ${todayWorkout.name}` : 'Recovery Day',
      xp: todayWorkout ? XP_VALUES.WORKOUT : 0,
      completed: workoutCompleted || !todayWorkout,
      icon: Dumbbell,
      isRest: !todayWorkout
    },
    {
      id: 'protein',
      label: `Hit Protein (${targets?.protein || 0}g)`,
      xp: XP_VALUES.PROTEIN,
      completed: proteinHit,
      icon: Beef
    },
    {
      id: 'calories',
      label: `Hit Calories (${targets?.calories.toLocaleString() || 0})`,
      xp: XP_VALUES.CALORIES,
      completed: caloriesHit,
      icon: Zap
    },
    {
      id: 'checkin',
      label: LABELS.checkIn,
      xp: XP_VALUES.CHECK_IN,
      completed: false,
      icon: CheckCircle2
    }
  ]

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <div className="bg-surface pt-8 pb-6 px-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-text-secondary text-sm text-xs">
              Welcome back,
            </p>
            <h1 className="text-2xl font-bold">
              {profile?.username || 'Trainee'}
            </h1>
          </div>
          {profile?.currentStreak ? (
            <StreakBadge />
          ) : null}
        </div>

        {/* Standing Order / Motivational message */}
        <p className="text-text-secondary text-sm">{message}</p>
      </div>

      <div className="px-5 space-y-6">
        {/* Active Reminders */}
        {activeReminders.length > 0 && !hasCheckedInToday && (
          <ReminderList maxReminders={2} />
        )}

        {/* Check-In Reminder Banner */}
        <AnimatePresence>
          {!hasCheckedInToday && !justCheckedIn && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card
                className="cursor-pointer border-l-[3px] border-l-primary"
                onClick={() => setShowCheckIn(true)}
              >
                <div className="flex items-center gap-4">
                  <Sparkles size={28} className="text-primary" />
                  <div className="flex-1">
                    <p className="font-bold text-base">
                      Daily Report Pending
                    </p>
                    <p className="text-sm text-text-secondary">
                      {`Complete your ${LABELS.checkIn.toLowerCase()} to earn ${LABELS.xp}`}
                    </p>
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ChevronRight size={20} className="text-primary" />
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Check-In Success Banner */}
        <AnimatePresence>
          {justCheckedIn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="bg-success/20 border-success">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Trophy size={28} className="text-success" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="font-bold text-success">
                      Report Submitted.
                    </p>
                    <p className="text-sm text-text-secondary">
                      +{todayLog?.total || 0} {LABELS.xp} earned
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar & XP Section */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5" />
          <div className="relative flex items-center gap-6">
            <Avatar size="lg" showMood showLevel level={currentLevel} />
            <div className="flex-1">
              <XPDisplay showPending />
            </div>
          </div>
        </Card>

        {/* Weekly Summary */}
        <WeeklySummary />

        {/* Weekly XP Claim Banner */}
        <AnimatePresence>
          {canClaimXP && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card
                className="cursor-pointer border-l-[3px] border-l-warning"
                onClick={() => setShowClaimModal(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift size={28} className="text-warning" />
                    <div>
                      <p className="font-bold text-base">
                        Reward Ritual Ready
                      </p>
                      <p className="text-sm text-text-secondary">
                        {pendingXP} {LABELS.xp} awaiting claim
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary">
                    CLAIM
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Streak Calendar */}
        <StreakDisplay />

        {/* "Never Miss Twice" / "Safe Word Recovery" warning */}
        {profile?.streakPaused && (
          <Card className="bg-warning/10 border-warning/30">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-warning" />
              <div>
                <p className="text-warning font-semibold">
                  Safe Word Activated
                </p>
                <p className="text-sm text-text-secondary">
                  You missed yesterday. Report in today to maintain your streak.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Today's Quests / Daily Assignments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold uppercase tracking-wide">
              {LABELS.dailyQuests}
            </h2>
            <span className="text-sm text-text-secondary font-mono">
              +{potentialXP} {LABELS.xp} possible
            </span>
          </div>

          <div className="space-y-3">
            {quests.map((quest) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: quests.indexOf(quest) * 0.1 }}
              >
                <Card
                  className={`${quest.completed ? 'opacity-60' : ''}`}
                  padding="sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded ${
                        quest.completed
                          ? 'bg-success/20'
                          : 'bg-surface-elevated'
                      }`}
                    >
                      {quest.completed ? (
                        <Check size={18} className="text-success" />
                      ) : (
                        <quest.icon size={18} className="text-text-secondary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={quest.completed ? 'line-through text-text-secondary' : ''}>
                        {quest.label}
                      </p>
                    </div>
                    {quest.xp > 0 && !quest.isRest && (
                      <span className={`text-sm font-mono font-bold ${
                        quest.completed ? 'text-success' : 'text-primary'
                      }`}>
                        +{quest.xp} {LABELS.xp}
                      </span>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Streak Bonus */}
            {profile?.currentStreak ? (
              <Card className="bg-warning/10 border-warning/20" padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-warning/20 rounded">
                    <Flame size={18} className="text-warning" />
                  </div>
                  <div className="flex-1">
                    <p>Obedience Bonus ({profile.currentStreak} days)</p>
                  </div>
                  <span className="text-sm font-mono font-bold text-warning">
                    +{streakBonus} {LABELS.xp}
                  </span>
                </div>
              </Card>
            ) : null}
          </div>
        </div>

        {/* Macro Progress / Protocol Compliance */}
        <div>
          <h2 className="text-base font-bold mb-3 uppercase tracking-wide">
            Protocol Compliance
          </h2>
          {macroProgress ? (
            <Card>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">Protein</span>
                    <span className="font-mono">
                      {macroProgress.protein.current}g / {macroProgress.protein.target}g
                    </span>
                  </div>
                  <ProgressBar
                    progress={macroProgress.protein.percentage}
                    color={proteinHit ? 'success' : 'primary'}
                    size="md"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">Calories</span>
                    <span className="font-mono">
                      {macroProgress.calories.current} / {macroProgress.calories.target}
                    </span>
                  </div>
                  <ProgressBar
                    progress={macroProgress.calories.percentage}
                    color={caloriesHit ? 'success' : 'primary'}
                    size="md"
                  />
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <button
                onClick={() => navigate('/macros')}
                className="w-full flex items-center gap-3 py-2 text-left"
              >
                <div className="w-10 h-10 bg-surface-elevated flex items-center justify-center rounded">
                  <Beef size={20} className="text-text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    No intake logged
                  </p>
                  <p className="text-xs text-text-secondary">
                    Log your intake to track compliance.
                  </p>
                </div>
                <ChevronRight size={16} className="text-text-secondary" />
              </button>
            </Card>
          )}
        </div>

        {/* Achievements */}
        <NearestBadges
          limit={3}
          onViewAll={() => navigate('/achievements')}
        />

        {/* Check-In Button */}
        {hasCheckedInToday ? (
          <Card className="mt-6 bg-success/10 border-success/30">
            <div className="flex items-center justify-center gap-3 py-2">
              <CheckCircle2 size={24} className="text-success" />
              <div className="text-center">
                <p className="font-bold text-success">
                  Daily Report Complete
                </p>
                <p className="text-sm text-text-secondary">
                  +{todayLog?.total || 0} {LABELS.xp} earned
                  {pendingXP > 0 && ` • ${pendingXP} ${LABELS.xp} pending claim`}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="mt-6">
            <Button
              onClick={() => setShowCheckIn(true)}
              fullWidth
              size="lg"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles size={20} />
                Submit Daily Report
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* Check-In Modal */}
      <CheckInModal
        isOpen={showCheckIn}
        onClose={(didCheckIn) => {
          setShowCheckIn(false)
          if (didCheckIn) {
            setJustCheckedIn(true)
            haptics.success()
          }
        }}
      />

      {/* XP Claim Modal */}
      <XPClaimModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />
    </div>
  )
}
