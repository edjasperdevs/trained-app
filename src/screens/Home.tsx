import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, XPDisplay, ProgressBar, ReminderList, WeeklySummary, NearestBadges, StreakDisplay, StreakBadge } from '@/components'
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
import { cn } from '@/lib/cn'
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
    <div data-testid="home-screen" className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card pt-8 pb-6 px-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-sm text-xs">
              Welcome back,
            </p>
            <h1 className="text-2xl font-bold">
              {profile?.username || 'Trainee'}
            </h1>
          </div>
          {profile?.currentStreak ? (
            <div data-testid="home-streak-display"><StreakBadge /></div>
          ) : null}
        </div>

        {/* Standing Order / Motivational message */}
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>

      <div className="px-5 space-y-6">
        {/* Active Reminders */}
        {activeReminders.length > 0 && !hasCheckedInToday && (
          <ReminderList maxReminders={2} />
        )}

        {/* Check-In Reminder Banner */}
        {!hasCheckedInToday && !justCheckedIn && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <Card
              className="py-0 cursor-pointer border-l-[3px] border-l-primary"
              onClick={() => setShowCheckIn(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Sparkles size={28} className="text-primary" />
                  <div className="flex-1">
                    <p className="font-bold text-base">
                      Daily Report Pending
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {`Complete your ${LABELS.checkIn.toLowerCase()} to earn ${LABELS.xp}`}
                    </p>
                  </div>
                  <div className="animate-bounce">
                    <ChevronRight size={20} className="text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Check-In Success Banner */}
        {justCheckedIn && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <Card className="py-0 bg-success/20 border-success">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <Trophy size={28} className="text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-success">
                      Report Submitted.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      +{todayLog?.total || 0} {LABELS.xp} earned
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Avatar & XP Section */}
        <Card className="py-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-6">
              <div data-testid="home-level-display">
                <Avatar size="lg" showMood showLevel level={currentLevel} />
              </div>
              <div className="flex-1" data-testid="home-xp-display">
                <XPDisplay showPending />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <WeeklySummary />

        {/* Weekly XP Claim Banner */}
        {canClaimXP && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <Card
              className="py-0 cursor-pointer border-l-[3px] border-l-warning"
              onClick={() => setShowClaimModal(true)}
              data-testid="home-claim-xp-button"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift size={28} className="text-warning" />
                    <div>
                      <p className="font-bold text-base">
                        Reward Ritual Ready
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pendingXP} {LABELS.xp} awaiting claim
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary">
                    CLAIM
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Streak Calendar */}
        <StreakDisplay />

        {/* "Never Miss Twice" / "Safe Word Recovery" warning */}
        {profile?.streakPaused && (
          <Card className="py-0 bg-warning/10 border-warning/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-warning" />
                <div>
                  <p className="text-warning font-semibold">
                    Safe Word Activated
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You missed yesterday. Report in today to maintain your streak.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Quests / Daily Assignments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold uppercase tracking-wide">
              {LABELS.dailyQuests}
            </h2>
            <span className="text-sm text-muted-foreground font-mono">
              +{potentialXP} {LABELS.xp} possible
            </span>
          </div>

          <div className="space-y-3">
            {quests.map((quest, index) => (
              <div
                key={quest.id}
                className="animate-in fade-in slide-in-from-left-4 duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className={cn('py-0', quest.completed && 'opacity-60')}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 flex items-center justify-center rounded',
                          quest.completed ? 'bg-success/20' : 'bg-muted'
                        )}
                      >
                        {quest.completed ? (
                          <Check size={18} className="text-success" />
                        ) : (
                          <quest.icon size={18} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={cn(quest.completed && 'line-through text-muted-foreground')}>
                          {quest.label}
                        </p>
                      </div>
                      {quest.xp > 0 && !quest.isRest && (
                        <span className={cn(
                          'text-sm font-mono font-bold',
                          quest.completed ? 'text-success' : 'text-primary'
                        )}>
                          +{quest.xp} {LABELS.xp}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* Streak Bonus */}
            {profile?.currentStreak ? (
              <Card className="py-0 bg-warning/10 border-warning/20">
                <CardContent className="p-3">
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
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        {/* Macro Progress / Protocol Compliance */}
        <div data-sentry-mask>
          <h2 className="text-base font-bold mb-3 uppercase tracking-wide">
            Protocol Compliance
          </h2>
          {macroProgress ? (
            <Card className="py-0">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Protein</span>
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
                      <span className="text-muted-foreground">Calories</span>
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
              </CardContent>
            </Card>
          ) : (
            <Card className="py-0">
              <CardContent className="p-4">
                <button
                  onClick={() => navigate('/macros')}
                  className="w-full flex items-center gap-3 py-2 text-left"
                >
                  <div className="w-10 h-10 bg-muted flex items-center justify-center rounded">
                    <Beef size={20} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      No intake logged
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Log your intake to track compliance.
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              </CardContent>
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
          <Card className="py-0 mt-6 bg-success/10 border-success/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-3 py-2">
                <CheckCircle2 size={24} className="text-success" />
                <div className="text-center">
                  <p className="font-bold text-success">
                    Daily Report Complete
                  </p>
                  <p className="text-sm text-muted-foreground">
                    +{todayLog?.total || 0} {LABELS.xp} earned
                    {pendingXP > 0 && ` • ${pendingXP} ${LABELS.xp} pending claim`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6">
            <Button
              onClick={() => setShowCheckIn(true)}
              className="w-full"
              size="lg"
              data-testid="home-checkin-button"
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
