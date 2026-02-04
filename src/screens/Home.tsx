import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
import { useTheme, getStandingOrder } from '@/themes'
import { CheckInModal } from './CheckInModal'
import { XPClaimModal } from './XPClaimModal'

export function Home() {
  const navigate = useNavigate()
  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'

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
      return getStandingOrder(theme, 'missed')
    }
    if (!todayWorkout) {
      return getStandingOrder(theme, 'rest')
    }
    if (canClaimXP) {
      return getStandingOrder(theme, 'claim')
    }
    return getStandingOrder(theme, 'training')
  }, [theme, profile?.streakPaused, todayWorkout, canClaimXP])

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
      label: todayWorkout ? `Complete ${todayWorkout.name}` : (isTrained ? 'Recovery Day' : 'Rest Day'),
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
      label: theme.labels.checkIn,
      xp: XP_VALUES.CHECK_IN,
      completed: false,
      icon: CheckCircle2
    }
  ]

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <div className={`${isTrained ? 'bg-surface' : 'bg-gradient-to-b from-white/[0.02] to-transparent'} pt-8 pb-6 px-4`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`text-text-secondary text-sm ${isTrained ? 'uppercase tracking-wider text-xs' : ''}`}>
              {isTrained ? 'Welcome back,' : 'Welcome back,'}
            </p>
            <h1 className={`text-2xl font-bold ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
              {profile?.username || (isTrained ? 'Trainee' : 'Champion')}
            </h1>
          </div>
          {profile?.currentStreak ? (
            <StreakBadge />
          ) : null}
        </div>

        {/* Standing Order / Motivational message */}
        <p className={`text-text-secondary text-sm ${isTrained ? '' : 'italic'}`}>{message}</p>
      </div>

      <div className="px-4 space-y-6">
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
                className={`cursor-pointer ${
                  isTrained
                    ? 'border-l-[3px] border-l-primary'
                    : 'bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border-accent-primary'
                }`}
                onClick={() => setShowCheckIn(true)}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={isTrained ? undefined : { scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Sparkles size={28} className="text-primary" />
                  </motion.div>
                  <div className="flex-1">
                    <p className={`font-bold text-lg ${isTrained ? 'font-heading uppercase tracking-wide text-base' : ''}`}>
                      {isTrained ? 'Daily Report Pending' : 'Daily Check-in'}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {isTrained
                        ? `Complete your ${theme.labels.checkIn.toLowerCase()} to earn ${theme.labels.xp}`
                        : `Log today's progress and earn ${theme.labels.xp}`}
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
                    <p className={`font-bold text-success ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
                      {isTrained ? 'Report Submitted.' : 'Build deployed.'}
                    </p>
                    <p className="text-sm text-text-secondary">
                      +{todayLog?.total || 0} {theme.labels.xp} {isTrained ? 'earned' : 'committed'}
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
                className={`cursor-pointer ${
                  isTrained
                    ? 'border-l-[3px] border-l-warning'
                    : 'bg-gradient-to-r from-accent-secondary/20 to-accent-primary/20 border-accent-secondary'
                }`}
                onClick={() => setShowClaimModal(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={isTrained ? undefined : {
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Gift size={28} className={isTrained ? 'text-warning' : 'text-accent-secondary'} />
                    </motion.div>
                    <div>
                      <p className={`font-bold text-lg ${isTrained ? 'font-heading uppercase tracking-wide text-base' : ''}`}>
                        {isTrained ? 'Reward Ritual Ready' : 'Weekly Release Ready'}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {pendingXP} {theme.labels.xp} {isTrained ? 'awaiting claim' : 'ready to deploy'}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={isTrained ? undefined : { scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Button variant="secondary">
                      {isTrained ? 'CLAIM' : 'DEPLOY'}
                    </Button>
                  </motion.div>
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
                <p className={`text-warning font-semibold ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
                  {isTrained ? 'Safe Word Activated' : 'System downtime detected'}
                </p>
                <p className="text-sm text-text-secondary">
                  {isTrained
                    ? 'You missed yesterday. Report in today to maintain your streak.'
                    : 'You missed yesterday. Check in today to restore uptime.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Today's Quests / Daily Assignments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-lg font-bold ${isTrained ? 'font-heading uppercase tracking-wide text-base' : ''}`}>
              {theme.labels.dailyQuests}
            </h2>
            <span className="text-sm text-text-secondary font-mono">
              +{potentialXP} {theme.labels.xp} possible
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
                      className={`w-8 h-8 flex items-center justify-center ${
                        isTrained ? 'rounded' : 'rounded-lg'
                      } ${
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
                        +{quest.xp} {theme.labels.xp}
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
                  <div className={`w-8 h-8 flex items-center justify-center bg-warning/20 ${isTrained ? 'rounded' : 'rounded-lg'}`}>
                    <Flame size={18} className="text-warning" />
                  </div>
                  <div className="flex-1">
                    <p>{isTrained ? 'Obedience Bonus' : 'Streak Bonus'} ({profile.currentStreak} days)</p>
                  </div>
                  <span className="text-sm font-mono font-bold text-warning">
                    +{streakBonus} {theme.labels.xp}
                  </span>
                </div>
              </Card>
            ) : null}
          </div>
        </div>

        {/* Macro Progress / Protocol Compliance */}
        {macroProgress && (
          <div>
            <h2 className={`text-lg font-bold mb-3 ${isTrained ? 'font-heading uppercase tracking-wide text-base' : ''}`}>
              {isTrained ? 'Protocol Compliance' : 'Macro Progress'}
            </h2>
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
          </div>
        )}

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
                <p className={`font-bold text-success ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
                  {isTrained ? 'Daily Report Complete' : "Today's Build Complete"}
                </p>
                <p className="text-sm text-text-secondary">
                  +{todayLog?.total || 0} {theme.labels.xp} {isTrained ? 'earned' : 'committed'}
                  {pendingXP > 0 && ` • ${pendingXP} ${theme.labels.xp} ${isTrained ? 'pending claim' : 'pending release'}`}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <motion.div
            animate={isTrained ? undefined : {
              boxShadow: [
                '0 0 0 0 rgba(245, 158, 11, 0)',
                '0 0 0 8px rgba(245, 158, 11, 0.2)',
                '0 0 0 0 rgba(245, 158, 11, 0)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`mt-6 ${isTrained ? '' : 'rounded-xl'}`}
          >
            <Button
              onClick={() => setShowCheckIn(true)}
              fullWidth
              size="lg"
            >
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={isTrained ? undefined : { rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Sparkles size={20} />
                </motion.span>
                {isTrained ? 'Submit Daily Report' : 'Daily Check-in'}
              </span>
            </Button>
          </motion.div>
        )}
      </div>

      {/* Check-In Modal */}
      <CheckInModal
        isOpen={showCheckIn}
        onClose={(didCheckIn) => {
          setShowCheckIn(false)
          if (didCheckIn) {
            setJustCheckedIn(true)
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
