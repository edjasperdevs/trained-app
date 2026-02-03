import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, XPDisplay, Card, Button, ProgressBar, ReminderList, WeeklySummary, NearestBadges } from '@/components'
import { Flame, Dumbbell, Beef, Zap, CheckCircle2, Gift, Sparkles, ChevronRight, Trophy, AlertTriangle, Check } from 'lucide-react'
import {
  useUserStore,
  useXPStore,
  useWorkoutStore,
  useMacroStore,
  useAvatarStore,
  useRemindersStore
} from '@/stores'
import { CheckInModal } from './CheckInModal'
import { XPClaimModal } from './XPClaimModal'

const MOTIVATIONAL_MESSAGES = [
  "Your body is a system. Optimize it.",
  "Consistency is just a cron job you don't skip.",
  "Progressive overload: version control for your muscles.",
  "You don't need motivation. You need a system.",
  "Ship the workout. Refactor later.",
  "Today's session is a commit. Don't break the build.",
  "Discipline is just automated decision-making.",
  "Your future physique is in production. Keep deploying.",
  "Rest days are garbage collection. They're not optional.",
  "The best program is the one you actually execute.",
  "Streak alive? That's uptime, baby.",
  "Motivation is a runtime error. Systems are compiled.",
  "Debug your diet. Optimize your training. Ship results.",
  "One more set is just one more iteration.",
  "Your PR is a release candidate. Push it to production.",
  "Treat every workout like a sprint retrospective. What improved?",
  "The gym doesn't have a staging environment. Every rep is production.",
  "You're not grinding. You're compiling.",
  "Abs are made in the kitchen. Like microservices, not monoliths.",
  "Your body responds to consistent inputs. Be deterministic."
]

// Get days until next Sunday
function getDaysUntilSunday(): number {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday
  if (dayOfWeek === 0) return 0 // Today is Sunday
  return 7 - dayOfWeek
}

// Get last 7 days for streak calendar
function getLast7Days(): { date: string; dayLetter: string }[] {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push({
      date: date.toISOString().split('T')[0],
      dayLetter: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)
    })
  }
  return days
}

export function Home() {
  const navigate = useNavigate()
  const profile = useUserStore((state) => state.profile)
  const { currentLevel, pendingXP, XP_VALUES, dailyLogs, getTodayLog } = useXPStore()
  const { getTodayWorkout, isWorkoutCompletedToday } = useWorkoutStore()
  const { targets, isProteinTargetHit, isCalorieTargetHit, getTodayProgress } = useMacroStore()
  // triggerReaction is handled in XPClaimModal
  useAvatarStore()
  const canClaimXP = useXPStore((state) => state.canClaimXP())
  const activeReminders = useRemindersStore((state) => state.getActiveReminders())

  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [justCheckedIn, setJustCheckedIn] = useState(false)
  const [message] = useState(() =>
    MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
  )

  // Check if user has already checked in today
  const todayLog = getTodayLog()
  const hasCheckedInToday = todayLog?.checkIn || false
  const daysUntilClaim = getDaysUntilSunday()
  const last7Days = getLast7Days()

  // Reset justCheckedIn after animation
  useEffect(() => {
    if (justCheckedIn) {
      const timer = setTimeout(() => setJustCheckedIn(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [justCheckedIn])

  // Check which days in the last 7 had check-ins
  const checkInDays = new Set(
    dailyLogs
      .filter(log => log.checkIn)
      .map(log => log.date)
  )

  const todayWorkout = getTodayWorkout()
  const workoutCompleted = isWorkoutCompletedToday()
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
      label: todayWorkout ? `Complete ${todayWorkout.name}` : 'Rest Day',
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
      label: 'Daily Check-In',
      xp: XP_VALUES.CHECK_IN,
      completed: false,
      icon: CheckCircle2
    }
  ]

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-white/[0.02] to-transparent pt-8 pb-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-500 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold">{profile?.username || 'Champion'}</h1>
          </div>
          {profile?.currentStreak ? (
            <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Flame size={18} className="text-accent-primary" />
              <span className="text-accent-primary font-bold font-digital">
                {profile.currentStreak}
              </span>
              <span className="text-gray-400 text-sm">day streak</span>
            </div>
          ) : null}
        </div>

        {/* Motivational message */}
        <p className="text-gray-600 text-sm italic">{message}</p>
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
                className="bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border-accent-primary cursor-pointer"
                onClick={() => setShowCheckIn(true)}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Sparkles size={28} className="text-accent-primary" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">Daily standup pending</p>
                    <p className="text-sm text-gray-400">
                      Log today's progress and earn XP
                    </p>
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ChevronRight size={20} className="text-accent-primary" />
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
              <Card className="bg-accent-success/20 border-accent-success">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Trophy size={28} className="text-accent-success" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="font-bold text-accent-success">Build deployed.</p>
                    <p className="text-sm text-gray-400">
                      +{todayLog?.total || 0} XP committed
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
                className="bg-gradient-to-r from-accent-secondary/20 to-accent-primary/20 border-accent-secondary cursor-pointer"
                onClick={() => setShowClaimModal(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Gift size={28} className="text-accent-secondary" />
                    </motion.div>
                    <div>
                      <p className="font-bold text-lg">Weekly Release Ready</p>
                      <p className="text-sm text-gray-400">
                        {pendingXP} XP ready to deploy
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Button variant="secondary">
                      DEPLOY
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Streak Calendar */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-accent-primary" />
              <span className="font-bold">
                {profile?.currentStreak || 0} Day Uptime
              </span>
            </div>
            {pendingXP > 0 && (
              <span className="text-xs text-gray-400">
                {daysUntilClaim === 0 ? 'Deploy today!' : `${daysUntilClaim}d until release`}
              </span>
            )}
          </div>
          <div className="flex justify-between">
            {last7Days.map((day, index) => {
              const isToday = index === 6
              const hasCheckIn = checkInDays.has(day.date)

              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{day.dayLetter}</span>
                  <motion.div
                    initial={isToday && hasCheckIn ? { scale: 0 } : false}
                    animate={{ scale: 1 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                      ${hasCheckIn
                        ? 'bg-accent-success text-white'
                        : isToday
                          ? 'bg-bg-card border-2 border-accent-primary border-dashed'
                          : 'bg-bg-card text-gray-600'
                      }
                    `}
                  >
                    {hasCheckIn ? '✓' : isToday ? '?' : '·'}
                  </motion.div>
                </div>
              )
            })}
          </div>
          {profile?.longestStreak && profile.longestStreak > (profile?.currentStreak || 0) && (
            <p className="text-xs text-gray-500 text-center mt-3">
              Best: {profile.longestStreak} days
            </p>
          )}
        </Card>

        {/* "Never Miss Twice" warning */}
        {profile?.streakPaused && (
          <Card className="bg-accent-warning/10 border-accent-warning/30">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-accent-warning" />
              <div>
                <p className="text-accent-warning font-semibold">System downtime detected</p>
                <p className="text-sm text-gray-400">
                  You missed yesterday. Check in today to restore uptime.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Today's Quests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Today's Quests</h2>
            <span className="text-sm text-gray-400 font-digital">
              +{potentialXP} XP possible
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
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        quest.completed
                          ? 'bg-accent-success/20'
                          : 'bg-bg-secondary'
                      }`}
                    >
                      {quest.completed ? (
                        <Check size={18} className="text-accent-success" />
                      ) : (
                        <quest.icon size={18} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={quest.completed ? 'line-through text-gray-500' : ''}>
                        {quest.label}
                      </p>
                    </div>
                    {quest.xp > 0 && !quest.isRest && (
                      <span className={`text-sm font-digital font-bold ${
                        quest.completed ? 'text-accent-success' : 'text-accent-primary'
                      }`}>
                        +{quest.xp} XP
                      </span>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Streak Bonus */}
            {profile?.currentStreak ? (
              <Card className="bg-accent-warning/10 border-accent-warning/20" padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-warning/20">
                    <Flame size={18} className="text-accent-warning" />
                  </div>
                  <div className="flex-1">
                    <p>Streak Bonus ({profile.currentStreak} days)</p>
                  </div>
                  <span className="text-sm font-digital font-bold text-accent-warning">
                    +{streakBonus} XP
                  </span>
                </div>
              </Card>
            ) : null}
          </div>
        </div>

        {/* Quick Stats */}
        {macroProgress && (
          <div>
            <h2 className="text-lg font-bold mb-3">Macro Progress</h2>
            <Card>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Protein</span>
                    <span className="font-digital">
                      {macroProgress.protein.current}g / {macroProgress.protein.target}g
                    </span>
                  </div>
                  <ProgressBar
                    progress={macroProgress.protein.percentage}
                    color={proteinHit ? 'green' : 'cyan'}
                    size="md"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Calories</span>
                    <span className="font-digital">
                      {macroProgress.calories.current} / {macroProgress.calories.target}
                    </span>
                  </div>
                  <ProgressBar
                    progress={macroProgress.calories.percentage}
                    color={caloriesHit ? 'green' : 'purple'}
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
          <Card className="mt-6 bg-accent-success/10 border-accent-success/30">
            <div className="flex items-center justify-center gap-3 py-2">
              <CheckCircle2 size={24} className="text-accent-success" />
              <div className="text-center">
                <p className="font-bold text-accent-success">Today's Build Complete</p>
                <p className="text-sm text-gray-400">
                  +{todayLog?.total || 0} XP committed
                  {pendingXP > 0 && ` • ${pendingXP} XP pending release`}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(245, 158, 11, 0)',
                '0 0 0 8px rgba(245, 158, 11, 0.2)',
                '0 0 0 0 rgba(245, 158, 11, 0)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mt-6 rounded-xl"
          >
            <Button
              onClick={() => setShowCheckIn(true)}
              fullWidth
              size="lg"
            >
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Sparkles size={20} />
                </motion.span>
                Run Daily Standup
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
