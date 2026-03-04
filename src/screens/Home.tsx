import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EvolvingAvatar, DPDisplay, ProgressBar, WeeklySummary, NearestBadges, StreakDisplay, StreakBadge, RankUpModal, ProtocolOrders, AnimatedPage, StaggerList, StaggerItem } from '@/components'
import { HealthCard } from '@/components/HealthCard'
import { useQuestStore } from '@/stores/questStore'
import { motion } from 'framer-motion'
import { Flame, Beef, CheckCircle2, Sparkles, ChevronRight, Trophy, AlertTriangle, ClipboardCheck, Activity, LineChart, Target } from 'lucide-react'
import { springs } from '@/lib/animations'
import {
  useUserStore,
  useDPStore,
  useWorkoutStore,
  useMacroStore,
  useHealthStore
} from '@/stores'
import { getStandingOrder, LABELS } from '@/design/constants'
import { getLocalDateString, getLocalDaysDifference } from '@/lib/dateUtils'
import { haptics } from '@/lib/haptics'
import { CheckInModal } from './CheckInModal'
import { useWeeklyCheckins } from '@/hooks/useWeeklyCheckins'

export function Home() {
  const navigate = useNavigate()

  // PERF-02: Use granular selectors for reactive state
  const profile = useUserStore((state) => state.profile)
  // currentRank is now read internally by EvolvingAvatar component
  const obedienceStreak = useDPStore((state) => state.obedienceStreak)

  // PERF-02: Access non-reactive functions via getState()
  const { getTodayLog } = useDPStore.getState()
  const { getTodayWorkout } = useWorkoutStore.getState()
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

  // Fetch today's health data on mount
  useEffect(() => {
    useHealthStore.getState().fetchTodayHealth()
  }, [])

  // Check if user has already checked in today (training > 0 means they logged something)
  const todayLog = getTodayLog()
  const hasCheckedInToday = (todayLog?.total || 0) > 0

  const todayWorkout = getTodayWorkout()

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

  // Check for quest completion on mount (triggers completion detection when user visits Home)
  useEffect(() => {
    useQuestStore.getState().checkAndCompleteQuests()
  }, [])

  return (
    <AnimatedPage>
      <div data-testid="home-screen" className="min-h-screen pb-20">
        {/* Header */}
        <motion.div
          className="bg-card pt-14 pb-6 px-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
        >
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
              <motion.div
                data-testid="home-streak-display"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...springs.bouncy, delay: 0.3 }}
              >
                <StreakBadge />
              </motion.div>
            ) : null}
          </div>
          {/* Standing Order / Motivational message */}
          <p className="text-muted-foreground text-sm">{message}</p>
        </motion.div>

        {/* Global Action Items (Stays above tabs) */}
        <div className="px-5 pt-6 space-y-4">
          {/* Weekly Check-in Due Banner (coaching clients only) */}
          {hasCoach && weeklyCheckinDue === true && (
            <Card
              className="py-0 cursor-pointer border-l-[3px] border-l-secondary shadow-sm"
              onClick={() => navigate('/checkin')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <ClipboardCheck size={28} className="text-secondary" />
                  <div className="flex-1">
                    <p className="font-bold text-base">Weekly Check-in Due</p>
                    <p className="text-sm text-muted-foreground">Submit your weekly check-in for your coach</p>
                  </div>
                  <ChevronRight size={20} className="text-secondary" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check-In Reminder Banner */}
          {!hasCheckedInToday && !justCheckedIn && (
            <Card
              className="py-0 cursor-pointer overflow-hidden relative border border-primary/20 bg-card/80 backdrop-blur-sm shadow-[0_0_20px_rgba(200,255,0,0.1)] transition-all hover:shadow-[0_0_30px_rgba(200,255,0,0.2)] hover:border-primary/40 rounded-2xl"
              onClick={() => setShowCheckIn(true)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(200,255,0,0.2)]">
                    <Sparkles size={24} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading uppercase tracking-wide text-lg font-bold text-foreground">Daily Report Pending</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Complete your report to earn {LABELS.xp}</p>
                  </div>
                  <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                    <ChevronRight size={24} className="text-primary" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check-In Success Banner */}
          {justCheckedIn && (
            <Card className="py-0 bg-success/20 border-success">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Trophy size={28} className="text-success" />
                  <div className="flex-1">
                    <p className="font-bold text-success">Report Submitted.</p>
                    <p className="text-sm text-muted-foreground">+{todayLog?.total || 0} {LABELS.xp} earned today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Safe Word Recovery warning */}
          {profile?.streakPaused && (
            <Card className="py-0 bg-warning/10 border-warning/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={24} className="text-warning" />
                  <div>
                    <p className="text-warning font-semibold">Safe Word Activated</p>
                    <p className="text-sm text-muted-foreground">You missed yesterday. Report in today to maintain your streak.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Avatar & Rank Section */}
          <motion.div
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]/60 backdrop-blur-xl mt-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            whileTap={{ scale: 0.99 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            <div className="p-5 relative z-10">
              <div className="flex items-center gap-6">
                <div data-testid="home-level-display" className="drop-shadow-[0_0_15px_rgba(200,255,0,0.3)]">
                  <EvolvingAvatar size="lg" />
                </div>
                <div className="flex-1 text-center" data-testid="home-xp-display">
                  <DPDisplay />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabbed Interface */}
        <div className="px-5 pt-8">
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-[#1A1C1E]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-2 h-16 shadow-inner">
              <TabsTrigger value="today" className="flex items-center justify-center gap-2 h-12 rounded-xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-none transition-all duration-300">
                <Target size={18} />
                <span className="text-sm">Today</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center justify-center gap-2 h-12 rounded-xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-none transition-all duration-300">
                <Activity size={18} />
                <span className="text-sm">Health</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center justify-center gap-2 h-12 rounded-xl data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-none transition-all duration-300">
                <LineChart size={18} />
                <span className="text-sm">Stats</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="outline-none">
              <StaggerList className="space-y-6">
                {/* Protocol Orders */}
                <StaggerItem><ProtocolOrders /></StaggerItem>

                {/* Macro Progress / Protocol Compliance */}
                <StaggerItem data-sentry-mask>
                  <h2 className="text-sm font-heading font-bold mb-4 uppercase tracking-widest text-muted-foreground">Protocol Compliance</h2>
                  {macroProgress ? (
                    <Card className="py-0 border-white/5 bg-white/5 backdrop-blur-md rounded-2xl">
                      <CardContent className="p-5">
                        <div className="space-y-5">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-foreground/80 font-heading uppercase tracking-wider text-xs font-bold">Protein</span>
                              <span className="font-mono text-primary font-bold drop-shadow-[0_0_8px_rgba(200,255,0,0.5)]">{macroProgress.protein.current}g / {macroProgress.protein.target}g</span>
                            </div>
                            <ProgressBar progress={macroProgress.protein.percentage} color={proteinHit ? 'success' : 'primary'} size="md" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-foreground/80 font-heading uppercase tracking-wider text-xs font-bold">Calories</span>
                              <span className="font-mono text-primary font-bold drop-shadow-[0_0_8px_rgba(200,255,0,0.5)]">{macroProgress.calories.current} / {macroProgress.calories.target}</span>
                            </div>
                            <ProgressBar progress={macroProgress.calories.percentage} color={caloriesHit ? 'success' : 'primary'} size="md" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="py-0 border-white/5 bg-white/5 backdrop-blur-md rounded-2xl">
                      <CardContent className="p-5">
                        <button
                          onClick={() => navigate('/macros')}
                          className="w-full flex items-center gap-4 py-2 text-left group"
                        >
                          <div className="w-12 h-12 bg-black/40 border border-white/10 flex items-center justify-center rounded-xl group-hover:border-primary/50 transition-colors">
                            <Beef size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-base group-hover:text-primary transition-colors">No intake logged</p>
                            <p className="text-sm text-muted-foreground mt-0.5">Log your intake to track compliance.</p>
                          </div>
                          <ChevronRight size={20} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </button>
                      </CardContent>
                    </Card>
                  )}
                </StaggerItem>

                {/* Check-In Button / Success Widget */}
                {hasCheckedInToday ? (
                  <StaggerItem>
                    <Card className="py-0 mt-6 bg-success/10 border-success/30 border-2 rounded-2xl shadow-[0_0_20px_rgba(76,175,80,0.15)]">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center gap-3 py-2">
                          <div className="w-14 h-14 bg-success/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={32} className="text-success" />
                          </div>
                          <div className="text-center mt-2">
                            <p className="font-heading uppercase text-xl font-bold text-success tracking-wide">Daily Report Complete</p>
                            <p className="text-sm text-success/80 mt-1 font-mono">+{todayLog?.total || 0} {LABELS.xp} EARNED TODAY</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ) : (
                  <StaggerItem>
                    <div className="pt-6 pb-6 mt-4">
                      <Button
                        onClick={() => setShowCheckIn(true)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading uppercase tracking-widest text-lg h-16 rounded-2xl shadow-[0_0_25px_rgba(200,255,0,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_35px_rgba(200,255,0,0.35)]"
                        size="lg"
                        data-testid="home-checkin-button"
                      >
                        <span className="flex items-center justify-center gap-3">
                          <Sparkles size={24} />
                          Submit Daily Report
                        </span>
                      </Button>
                    </div>
                  </StaggerItem>
                )}
              </StaggerList>
            </TabsContent>

            <TabsContent value="health" className="outline-none">
              <StaggerList className="space-y-4">
                <StaggerItem><HealthCard /></StaggerItem>
              </StaggerList>
            </TabsContent>

            <TabsContent value="stats" className="outline-none">
              <StaggerList className="space-y-4">
                {/* Streak count banner if streak > 0 */}
                {obedienceStreak > 0 && (
                  <StaggerItem>
                    <Card className="py-0 bg-warning/10 border-warning/20">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center bg-warning/20 rounded">
                            <Flame size={18} className="text-warning" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-warning">{LABELS.streak}: {obedienceStreak} days</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                )}
                <StaggerItem><WeeklySummary /></StaggerItem>
                <StaggerItem><StreakDisplay /></StaggerItem>
                <StaggerItem><NearestBadges limit={3} onViewAll={() => navigate('/achievements')} /></StaggerItem>
              </StaggerList>
            </TabsContent>
          </Tabs>
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
    </AnimatedPage>
  )
}
