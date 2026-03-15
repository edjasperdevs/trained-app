import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { EvolvingAvatar, RankUpModal, AnimatedPage, ProtocolOrders, ProgressBar, WeeklySummary, StreakDisplay, NearestBadges, StaggerList, StaggerItem, AppHeader } from '@/components'
import { HealthCard } from '@/components/HealthCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import { Sparkles, ChevronRight, Trophy, AlertTriangle, ClipboardCheck, Target, Activity, LineChart, Flame, Beef, Bell, X } from 'lucide-react'
import {
  useUserStore,
  useDPStore,
  useHealthStore,
  useMacroStore,
  useNotificationStore
} from '@/stores'
import { getLocalDateString, getLocalDaysDifference } from '@/lib/dateUtils'
import { haptics } from '@/lib/haptics'
import { CheckInModal } from './CheckInModal'
import { WeeklyReportModal } from './WeeklyReportModal'
import { WeeklyReportScreen } from './WeeklyReportScreen'
import { useWeeklyCheckins } from '@/hooks/useWeeklyCheckins'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useQuestStore } from '@/stores/questStore'
import { useWeeklyReportStore } from '@/stores/weeklyReportStore'

// Circular progress ring component
function DPRing({ progress, dpToNext }: { progress: number; dpToNext: number }) {
  const radius = 70
  const stroke = 6
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress * circumference)

  return (
    <div className="relative w-[160px] h-[160px] flex items-center justify-center">
      <svg width="160" height="160" className="transform -rotate-90">
        {/* Background ring */}
        <circle
          stroke="rgba(212, 168, 83, 0.15)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx="80"
          cy="80"
        />
        {/* Progress ring */}
        <circle
          stroke="#D4A853"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx="80"
          cy="80"
          className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(212,168,83,0.5)]"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-mono text-foreground">
          {dpToNext.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground mt-1">
          DP to Rank Up
        </span>
      </div>
    </div>
  )
}

export function Home() {
  const navigate = useNavigate()

  const profile = useUserStore((state) => state.profile)
  const { currentRank, totalDP, obedienceStreak } = useDPStore()
  const rankInfo = useDPStore((s) => s.getRankInfo)()

  const { getTodayLog } = useDPStore.getState()
  const { isProteinTargetHit, isCalorieTargetHit, getTodayProgress } = useMacroStore.getState()
  const shouldShowReport = useWeeklyReportStore((state) => state.shouldShowReport)
  const markReportShown = useWeeklyReportStore((state) => state.markReportShown)

  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showWeeklyReport, setShowWeeklyReport] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showWeeklyReportFull, setShowWeeklyReportFull] = useState(false)
  const [justCheckedIn, setJustCheckedIn] = useState(false)
  const [weeklyCheckinDue, setWeeklyCheckinDue] = useState<boolean | null>(null)
  const [hasCoach, setHasCoach] = useState(false)
  const [rankUpData, setRankUpData] = useState<{ oldRank: number; newRank: number; rankName: string } | null>(null)

  const { hasCheckinForCurrentWeek, isCoachingClient } = useWeeklyCheckins()

  // Notifications
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications)
  const dismissNotification = useNotificationStore((s) => s.dismissNotification)

  useEffect(() => {
    let cancelled = false
    isCoachingClient().then(isClient => {
      if (cancelled) return
      setHasCoach(isClient)
      if (isClient) {
        hasCheckinForCurrentWeek().then(hasCheckin => {
          if (cancelled) return
          setWeeklyCheckinDue(!hasCheckin)
        }).catch(() => {})
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [hasCheckinForCurrentWeek, isCoachingClient])

  // Streak validation
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

  // Fetch health data
  useEffect(() => {
    useHealthStore.getState().fetchTodayHealth()
  }, [])

  // Quest completion check
  useEffect(() => {
    useQuestStore.getState().checkAndCompleteQuests()
  }, [])

  // Fetch notifications
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Check for weekly report trigger on mount and after DP actions
  useEffect(() => {
    const checkWeeklyReport = () => {
      if (shouldShowReport()) {
        setShowWeeklyReportFull(true)
      }
    }

    // Check on mount
    checkWeeklyReport()

    // Also check when dpStore state changes (after a DP action)
    const unsubscribe = useDPStore.subscribe(() => {
      checkWeeklyReport()
    })

    return () => unsubscribe()
  }, [shouldShowReport])

  // Handle deep link from push notification
  useEffect(() => {
    const deepLinkFlag = sessionStorage.getItem('showWeeklyReport')
    if (deepLinkFlag === 'true') {
      sessionStorage.removeItem('showWeeklyReport')
      setShowWeeklyReportFull(true)
    }
  }, [])

  const todayLog = getTodayLog()
  const hasCheckedInToday = (todayLog?.total || 0) > 0

  const proteinHit = isProteinTargetHit()
  const caloriesHit = isCalorieTargetHit()
  const macroProgress = getTodayProgress()

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  // Format date
  const dateString = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  // Calculate weekly DP (Monday through Sunday)
  const weeklyDP = useMemo(() => {
    const logs = useDPStore.getState().dailyLogs
    const now = new Date()

    // Get Monday of current week
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - daysFromMonday)
    monday.setHours(0, 0, 0, 0)
    const mondayStr = monday.toISOString().split('T')[0]

    return logs
      .filter(log => log.date >= mondayStr)
      .reduce((sum, log) => sum + (log.total || 0), 0)
  }, [totalDP])

  useEffect(() => {
    if (justCheckedIn) {
      const timer = setTimeout(() => setJustCheckedIn(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [justCheckedIn])

  return (
    <AnimatedPage>
      <div data-testid="home-screen" className="min-h-screen pb-24 bg-background">
        <AppHeader onNotificationPress={() => setShowNotifications(true)} notificationCount={unreadCount} />

        {/* Greeting */}
        <div className="px-6 pb-4">
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, <span className="text-primary">{profile?.username || 'Champion'}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{dateString}</p>
        </div>

        {/* Alert Banners */}
        <div className="px-6 space-y-3">
          {/* Weekly Check-in Due */}
          {hasCoach && weeklyCheckinDue === true && (
            <Card
              className="py-0 cursor-pointer border-primary/30 bg-surface"
              onClick={() => navigate('/checkin')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ClipboardCheck size={20} className="text-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Weekly Check-in Due</p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Safe Word warning */}
          {profile?.streakPaused && (
            <Card className="py-0 bg-warning/10 border-warning/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="text-warning" />
                  <p className="text-sm text-warning">Safe Word Active — report in to maintain streak</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check-in Success */}
          {justCheckedIn && (
            <Card className="py-0 bg-success/20 border-success/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy size={20} className="text-success" />
                  <p className="text-sm text-success font-medium">+{todayLog?.total || 0} DP earned</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Avatar + DP Ring Section */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Avatar - Left side, large */}
            <div className="relative">
              {/* Dramatic multi-layer glow behind avatar - also breathes */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/20 blur-[100px] rounded-full"
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-ember/30 blur-[80px] rounded-full"
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.45, 0.3] }}
                transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, delay: 0.5 }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-primary/40 blur-[50px] rounded-full"
                animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.55, 0.4] }}
                transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[150px] bg-ember/50 blur-[30px] rounded-full"
                animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.7, 0.5] }}
                transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, delay: 0.8 }}
              />
              <motion.div
                className="relative z-10"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
              >
                <EvolvingAvatar size="xl" />
              </motion.div>
            </div>

            {/* DP Ring - Right side */}
            <DPRing
              progress={rankInfo.progress}
              dpToNext={Math.ceil(rankInfo.dpForNext)}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-3">
            {/* Streak */}
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">
                Streak
              </p>
              <p className="text-xl font-bold text-foreground">
                {obedienceStreak} <span className="text-sm font-normal text-muted-foreground">Days</span>
              </p>
            </div>
            {/* Weekly DP */}
            <button
              onClick={() => {
                setShowWeeklyReport(true)
                haptics.light()
              }}
              className="bg-primary/5 border border-primary/40 rounded-xl p-4 text-center transition-all active:scale-[0.97] active:bg-primary/10"
            >
              <p className="text-[10px] uppercase tracking-widest text-primary/70 mb-1 font-medium">
                Weekly DP ›
              </p>
              <p className="text-xl font-bold font-mono text-primary">
                {weeklyDP.toLocaleString()}
              </p>
            </button>
            {/* Rank */}
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">
                Rank
              </p>
              <p className="text-xl font-bold text-foreground">
                {currentRank}
              </p>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="px-5 pb-6">
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-surface border border-border rounded-xl p-1.5 h-14">
              <TabsTrigger value="today" className="flex items-center justify-center gap-2 h-10 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:font-bold transition-all">
                <Target size={16} />
                <span className="text-sm">Today</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center justify-center gap-2 h-10 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:font-bold transition-all">
                <Activity size={16} />
                <span className="text-sm">Health</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center justify-center gap-2 h-10 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:font-bold transition-all">
                <LineChart size={16} />
                <span className="text-sm">Stats</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="outline-none">
              <StaggerList className="space-y-5">
                {/* Daily Report CTA */}
                {!hasCheckedInToday ? (
                  <StaggerItem>
                    <button
                      onClick={() => setShowCheckIn(true)}
                      className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-heading uppercase tracking-widest text-base py-4 rounded-xl shadow-[0_0_20px_rgba(212,168,83,0.25)] transition-all hover:shadow-[0_0_30px_rgba(212,168,83,0.35)] active:scale-[0.98]"
                      data-testid="home-checkin-button"
                    >
                      <span className="flex items-center justify-center gap-3">
                        <Sparkles size={20} />
                        Submit Daily Report
                      </span>
                    </button>
                  </StaggerItem>
                ) : (
                  <StaggerItem>
                    <Card className="py-0 bg-success/10 border-success/30 rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Trophy size={20} className="text-success" />
                          <div>
                            <p className="font-medium text-success">Daily Report Complete</p>
                            <p className="text-xs text-success/70 font-mono">+{todayLog?.total || 0} DP earned today</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                )}

                {/* Protocol Orders */}
                <StaggerItem><ProtocolOrders /></StaggerItem>

                {/* Macro Progress */}
                <StaggerItem data-sentry-mask>
                  <h2 className="text-xs font-heading font-bold mb-3 uppercase tracking-widest text-muted-foreground">Protocol Compliance</h2>
                  {macroProgress ? (
                    <Card className="py-0 border-border bg-surface rounded-xl">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground text-xs uppercase tracking-wider">Protein</span>
                              <span className="font-mono text-primary font-bold">{macroProgress.protein.current}g / {macroProgress.protein.target}g</span>
                            </div>
                            <ProgressBar progress={macroProgress.protein.percentage} color={proteinHit ? 'success' : 'primary'} size="md" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground text-xs uppercase tracking-wider">Calories</span>
                              <span className="font-mono text-primary font-bold">{macroProgress.calories.current} / {macroProgress.calories.target}</span>
                            </div>
                            <ProgressBar progress={macroProgress.calories.percentage} color={caloriesHit ? 'success' : 'primary'} size="md" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="py-0 border-border bg-surface rounded-xl">
                      <CardContent className="p-4">
                        <button
                          onClick={() => navigate('/macros')}
                          className="w-full flex items-center gap-3 text-left group"
                        >
                          <div className="w-10 h-10 bg-surface-elevated border border-border flex items-center justify-center rounded-lg group-hover:border-primary/50 transition-colors">
                            <Beef size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium group-hover:text-primary transition-colors">No intake logged</p>
                            <p className="text-xs text-muted-foreground">Log intake to track compliance</p>
                          </div>
                          <ChevronRight size={18} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </button>
                      </CardContent>
                    </Card>
                  )}
                </StaggerItem>
              </StaggerList>
            </TabsContent>

            <TabsContent value="health" className="outline-none">
              <StaggerList className="space-y-4">
                <StaggerItem><HealthCard /></StaggerItem>
              </StaggerList>
            </TabsContent>

            <TabsContent value="stats" className="outline-none">
              <StaggerList className="space-y-4">
                {obedienceStreak > 0 && (
                  <StaggerItem>
                    <Card className="py-0 bg-primary/10 border-primary/20 rounded-xl">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Flame size={18} className="text-primary" />
                          <p className="font-medium text-primary">{obedienceStreak} day streak</p>
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

        {/* Weekly Report Modal */}
        <WeeklyReportModal
          isOpen={showWeeklyReport}
          onClose={() => setShowWeeklyReport(false)}
          onViewFullReport={() => setShowWeeklyReportFull(true)}
        />

        {/* Weekly Report Full Screen (triggered on Sunday after DP action) */}
        {showWeeklyReportFull && (
          <WeeklyReportScreen
            onClose={() => {
              markReportShown()
              setShowWeeklyReportFull(false)
            }}
          />
        )}

        {/* Notifications Sheet */}
        <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
          <SheetContent side="top" className="pt-14">
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
            </SheetHeader>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell size={32} className="mb-3 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="px-4 py-2 space-y-2">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex gap-3 p-4 bg-surface border border-border rounded-xl">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-elevated transition-colors flex-shrink-0"
                      aria-label="Dismiss"
                    >
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AnimatedPage>
  )
}
