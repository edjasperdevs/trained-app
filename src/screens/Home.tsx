import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, DPDisplay, ProgressBar, ReminderList, WeeklySummary, NearestBadges, StreakDisplay, StreakBadge } from '@/components'
import { RankUpModal } from '@/components'
import { Flame, Dumbbell, Beef, CheckCircle2, Sparkles, ChevronRight, Trophy, AlertTriangle, Check, ClipboardCheck } from 'lucide-react'
import {
  useUserStore,
  useDPStore,
  useWorkoutStore,
  useMacroStore,
  useRemindersStore
} from '@/stores'
import { DP_VALUES } from '@/stores/dpStore'
import { getStandingOrder, LABELS } from '@/design/constants'
import { getLocalDateString, getLocalDaysDifference } from '@/lib/dateUtils'
import { haptics } from '@/lib/haptics'
import { cn } from '@/lib/cn'
import { CheckInModal } from './CheckInModal'
import { useWeeklyCheckins } from '@/hooks/useWeeklyCheckins'

export function Home() {
  const navigate = useNavigate()

  // PERF-02: Use granular selectors for reactive state
  const profile = useUserStore((state) => state.profile)
  const currentRank = useDPStore((state) => state.currentRank)
  const obedienceStreak = useDPStore((state) => state.obedienceStreak)
  const targets = useMacroStore((state) => state.targets)

  // PERF-02: Selectors for computed values that depend on state
  const activeReminders = useRemindersStore((state) => state.getActiveReminders)()

  // PERF-02: Access non-reactive functions via getState()
  const { getTodayLog } = useDPStore.getState()
  const { getTodayWorkout, isWorkoutCompletedToday } = useWorkoutStore.getState()
  const { isProteinTargetHit, isCalorieTargetHit, getTodayProgress } = useMacroStore.getState()

  const [showCheckIn, setShowCheckIn] = useState(false)
  const [justCheckedIn, setJustCheckedIn] = useState(false)
  const [weeklyCheckinDue, setWeeklyCheckinDue] = useState<boolean | null>(null)
  const [hasCoach, setHasCoach] = useState(false)
  const [rankUpData, setRankUpData] = useState<{ oldRank: number; newRank: number; rankName: string } | null>(null)

  // Check if user is a coaching client and if weekly check-in is due
  const { hasCheckinForCurrentWeek, isCoachingClient } = useWeeklyCheckins()
  useEffect(() => {
    let cancelled = false
    isCoachingClient().then(isClient => {
      if (cancelled) return
      setHasCoach(isClient)
      if (isClient) {
        hasCheckinForCurrentWeek().then(hasCheckin => {
          if (cancelled) return
          setWeeklyCheckinDue(!hasCheckin)
        }).catch(() => { /* offline — leave banner hidden */ })
      }
    }).catch(() => { /* offline — leave coach features hidden */ })
    return () => { cancelled = true }
  }, [hasCheckinForCurrentWeek, isCoachingClient])

  // Streak validation on mount: reset stale streak if > 1 day since last action
  useEffect(() => {
    const { lastActionDate, obedienceStreak } = useDPStore.getState()
    if (lastActionDate && obedienceStreak > 0) {
      const today = getLocalDateString()
      const daysDiff = getLocalDaysDifference(lastActionDate, today)
      if (daysDiff > 1) {
        useDPStore.setState({ obedienceStreak: 0 })
      }
    }
  }, [])

  // Check if user has already checked in today (training > 0 means they logged something)
  const todayLog = getTodayLog()
  const hasCheckedInToday = (todayLog?.total || 0) > 0

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
    return getStandingOrder('training')
  }, [profile?.streakPaused, todayWorkout])

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

  // Calculate potential DP for today
  const potentialDP = [
    todayWorkout && !workoutCompleted ? DP_VALUES.training : 0,
    !proteinHit ? DP_VALUES.protein : 0,
  ].reduce((a, b) => a + b, 0)

  const quests = [
    {
      id: 'workout',
      label: todayWorkout ? `Complete ${todayWorkout.name}` : 'Recovery Day',
      dp: todayWorkout ? DP_VALUES.training : 0,
      completed: workoutCompleted || !todayWorkout,
      icon: Dumbbell,
      isRest: !todayWorkout
    },
    {
      id: 'protein',
      label: `Hit Protein (${targets?.protein || 0}g)`,
      dp: DP_VALUES.protein,
      completed: proteinHit,
      icon: Beef
    },
    {
      id: 'report',
      label: LABELS.checkIn,
      dp: 0,
      completed: hasCheckedInToday,
      icon: CheckCircle2
    }
  ]

  return (
    <div data-testid="home-screen" className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card pt-8 pb-6 px-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-xs">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold">
              {profile?.username || 'Trainee'}
            </h1>
          </div>
          {obedienceStreak > 0 ? (
            <div data-testid="home-streak-display"><StreakBadge /></div>
          ) : null}
        </div>

        {/* Standing Order / Motivational message */}
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* Active Reminders (exclude checkIn — Home has its own check-in prompt) */}
        {activeReminders.filter(r => r.type !== 'checkIn').length > 0 && !hasCheckedInToday && (
          <ReminderList maxReminders={2} excludeTypes={['checkIn']} />
        )}

        {/* Weekly Check-in Due Banner (coaching clients only) */}
        {hasCoach && weeklyCheckinDue === true && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <Card
              className="py-0 cursor-pointer border-l-[3px] border-l-secondary"
              onClick={() => navigate('/checkin')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <ClipboardCheck size={28} className="text-secondary" />
                  <div className="flex-1">
                    <p className="font-bold text-base">
                      Weekly Check-in Due
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Submit your weekly check-in for your coach
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>
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
                      Complete your daily report to earn {LABELS.xp}
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
                      +{todayLog?.total || 0} {LABELS.xp} earned today
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Avatar & Rank Section */}
        <Card className="py-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
          <CardContent className="p-4 relative">
            <div className="flex items-start gap-6">
              <div data-testid="home-level-display">
                <Avatar size="lg" showMood showLevel level={currentRank} />
              </div>
              <div className="flex-1" data-testid="home-xp-display">
                <DPDisplay />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <WeeklySummary />

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
              +{potentialDP} {LABELS.xp} possible
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
                      {quest.dp > 0 && !quest.isRest && (
                        <span className={cn(
                          'text-sm font-mono font-bold',
                          quest.completed ? 'text-success' : 'text-primary'
                        )}>
                          +{quest.dp} {LABELS.xp}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* Streak Display */}
            {obedienceStreak > 0 ? (
              <Card className="py-0 bg-warning/10 border-warning/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-warning/20 rounded">
                      <Flame size={18} className="text-warning" />
                    </div>
                    <div className="flex-1">
                      <p>{LABELS.streak}: {obedienceStreak} days</p>
                    </div>
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
                    +{todayLog?.total || 0} {LABELS.xp} earned today
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

      {/* Rank Up Modal */}
      {rankUpData && (
        <RankUpModal
          oldRank={rankUpData.oldRank}
          newRank={rankUpData.newRank}
          rankName={rankUpData.rankName}
          onClose={() => setRankUpData(null)}
        />
      )}

    </div>
  )
}
