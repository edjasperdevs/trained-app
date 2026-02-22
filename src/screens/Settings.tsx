import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { WeightChart, ProgressBar } from '@/components'
import { PartyPopper, ChevronDown, UtensilsCrossed, CheckCircle2, Gift, Dumbbell, TrendingDown, TrendingUp, Minus, BarChart3, ChevronRight, CheckCircle, Award } from 'lucide-react'
import { analytics } from '@/lib/analytics'
import {
  useUserStore,
  useXPStore,
  useMacroStore,
  useWorkoutStore,
  useAvatarStore,
  useAuthStore,
  useRemindersStore,
  useAchievementsStore,
  toast,
  DayOfWeek,
  ReminderType,
  UnitSystem
} from '@/stores'
import { LABELS } from '@/design/constants'
import { formatWeight, getWeightUnit, toDisplayWeight, toInternalWeight } from '@/lib/units'
import { friendlyError } from '@/lib/errors'
import { isCoach as checkIsCoach } from '@/lib/supabase'
import { getLocalDateString } from '@/lib/dateUtils'
import { isObject, isValidMacroTargets, isValidWorkoutLog, isValidXPState, isValidDailyLog, isArray } from '@/lib/validation'
import { cn } from '@/lib/cn'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const selectClasses = 'h-9 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

export function Settings() {
  const navigate = useNavigate()
  const profile = useUserStore((state) => state.profile)
  const setProfile = useUserStore((state) => state.setProfile)
  const logWeight = useUserStore((state) => state.logWeight)
  const getTodayWeight = useUserStore((state) => state.getTodayWeight)
  const getWeightHistory = useUserStore((state) => state.getWeightHistory)
  const getWeightTrend = useUserStore((state) => state.getWeightTrend)
  const getRateOfChange = useUserStore((state) => state.getRateOfChange)
  const getProjectedGoalDate = useUserStore((state) => state.getProjectedGoalDate)
  const setGoalWeight = useUserStore((state) => state.setGoalWeight)

  const currentPlan = useWorkoutStore((state) => state.currentPlan)
  const setWorkoutDays = useWorkoutStore((state) => state.setWorkoutDays)

  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const isConfigured = useAuthStore((state) => state.isConfigured)

  const reminderPreferences = useRemindersStore((state) => state.preferences)
  const setReminderPreference = useRemindersStore((state) => state.setPreference)

  const [showDangerZone, setShowDangerZone] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState('')
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [weightInput, setWeightInput] = useState('')
  const [goalWeightInput, setGoalWeightInput] = useState('')
  const [showWeightChart, setShowWeightChart] = useState(false)
  const [isCoach, setIsCoach] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      checkIsCoach().then(setIsCoach)
    }
  }, [user])

  useEffect(() => {
    analytics.settingsViewed()
  }, [])

  const todayWeight = getTodayWeight()
  const weightHistory = getWeightHistory(30)
  const weightTrend = getWeightTrend()
  const rateOfChange = getRateOfChange()
  const projectedGoal = getProjectedGoalDate()

  const selectedDays = currentPlan?.selectedDays || []
  const trainingDays = profile?.trainingDaysPerWeek || 3
  const units: UnitSystem = profile?.units || 'imperial'

  const toggleDay = (day: DayOfWeek) => {
    const isSelected = selectedDays.includes(day)
    let newDays: DayOfWeek[]

    if (isSelected) {
      // Always allow deselecting
      newDays = selectedDays.filter(d => d !== day)
    } else {
      // Add day if we have room
      if (selectedDays.length < trainingDays) {
        newDays = [...selectedDays, day].sort((a, b) => a - b)
      } else {
        return // Can't add, already at max
      }
    }

    setWorkoutDays(newDays)
  }

  const handleLogWeight = () => {
    const inputValue = Number(weightInput)
    const maxValue = units === 'metric' ? 225 : 500
    const minValue = units === 'metric' ? 20 : 50

    if (inputValue <= 0 || inputValue >= maxValue || inputValue < minValue) {
      toast.warning(`Please enter a valid weight (${minValue}-${maxValue - 1} ${getWeightUnit(units)})`)
      return
    }

    // Convert to internal storage (lbs) if using metric
    const weightInLbs = toInternalWeight(inputValue, units)
    logWeight(weightInLbs)
    setWeightInput('')
    toast.success('Weight logged')
  }

  const handleSetGoalWeight = () => {
    const inputValue = Number(goalWeightInput)
    const maxValue = units === 'metric' ? 225 : 500
    const minValue = units === 'metric' ? 20 : 50

    if (inputValue <= 0 || inputValue >= maxValue || inputValue < minValue) {
      toast.warning(`Please enter a valid goal weight (${minValue}-${maxValue - 1} ${getWeightUnit(units)})`)
      return
    }

    const weightInLbs = toInternalWeight(inputValue, units)
    setGoalWeight(weightInLbs)
    setGoalWeightInput('')
    toast.success('Goal weight configured')
  }

  const handleExport = () => {
    // Gather all data from stores
    const userData = useUserStore.getState()
    const xpData = useXPStore.getState()
    const macroData = useMacroStore.getState()
    const workoutData = useWorkoutStore.getState()
    const avatarData = useAvatarStore.getState()

    const exportObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: userData.profile,
      weightHistory: userData.weightHistory,
      xp: {
        totalXP: xpData.totalXP,
        currentLevel: xpData.currentLevel,
        pendingXP: xpData.pendingXP,
        weeklyHistory: xpData.weeklyHistory,
        dailyLogs: xpData.dailyLogs,
        lastClaimDate: xpData.lastClaimDate
      },
      macros: {
        targets: macroData.targets,
        mealPlan: macroData.mealPlan,
        dailyLogs: macroData.dailyLogs,
        activityLevel: macroData.activityLevel
      },
      workouts: {
        currentPlan: workoutData.currentPlan,
        workoutLogs: workoutData.workoutLogs,
        currentWeek: workoutData.currentWeek
      },
      avatar: {
        baseCharacter: avatarData.baseCharacter,
        currentMood: avatarData.currentMood,
        accessories: avatarData.accessories,
        lastInteraction: avatarData.lastInteraction
      }
    }

    try {
      const dataStr = JSON.stringify(exportObj, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `trained-backup-${getLocalDateString()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      analytics.dataExported()
      URL.revokeObjectURL(url)
      toast.success('Data exported')
    } catch (error) {
      toast.error(friendlyError('export your data', error))
    }
  }

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importData)

      // Validate the import has expected structure
      if (!isObject(parsed) || (!parsed.version && !parsed.user && !parsed.xp)) {
        toast.error('This doesn\'t look like a Trained backup file. Make sure you\'re importing a file exported from Trained.')
        setImportStatus('error')
        return
      }

      // Validate individual sections before importing
      const errors: string[] = []

      if (parsed.xp && !isValidXPState(parsed.xp)) {
        errors.push('XP data')
      }
      if (parsed.macros && isObject(parsed.macros)) {
        if (parsed.macros.targets && !isValidMacroTargets(parsed.macros.targets)) {
          errors.push('macro targets')
        }
        if (parsed.macros.dailyLogs && isArray(parsed.macros.dailyLogs)) {
          const invalidLogs = (parsed.macros.dailyLogs as unknown[]).filter(l => !isValidDailyLog(l))
          if (invalidLogs.length > 0) errors.push('macro daily logs')
        }
      }
      if (parsed.workouts && isObject(parsed.workouts)) {
        if (parsed.workouts.workoutLogs && isArray(parsed.workouts.workoutLogs)) {
          const invalidLogs = (parsed.workouts.workoutLogs as unknown[]).filter(l => !isValidWorkoutLog(l))
          if (invalidLogs.length > 0) errors.push('workout logs')
        }
      }

      if (errors.length > 0) {
        toast.error(`Invalid data in: ${errors.join(', ')}. Import cancelled.`)
        setImportStatus('error')
        return
      }

      if (parsed.user) {
        useUserStore.getState().setProfile(parsed.user)
      }
      if (parsed.xp) {
        useXPStore.getState().importData(JSON.stringify({ xp: parsed.xp }))
      }
      if (parsed.macros) {
        useMacroStore.getState().importData(JSON.stringify({ macros: parsed.macros }))
      }
      if (parsed.workouts) {
        useWorkoutStore.getState().importData(JSON.stringify({ workouts: parsed.workouts }))
      }
      if (parsed.avatar) {
        useAvatarStore.getState().importData(JSON.stringify({ avatar: parsed.avatar }))
      }

      setImportStatus('success')
      toast.success('Data imported')
      setTimeout(() => {
        setShowImportModal(false)
        setImportStatus('idle')
        setImportData('')
      }, 2000)
    } catch (error) {
      setImportStatus('error')
      toast.error('The file couldn\'t be read. Make sure it\'s a valid Trained backup file (.json).')
    }
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setImportData(content)
    }
    reader.readAsText(file)
  }

  const handleResetProgress = () => {
    if (window.confirm('Are you sure? This will delete ALL your progress and cannot be undone.')) {
      try {
        useUserStore.getState().resetProgress()
        useXPStore.getState().resetXP()
        useMacroStore.getState().resetMacros()
        useWorkoutStore.getState().resetWorkouts()
        useAvatarStore.getState().resetAvatar()
        toast.info('System reset. Reloading...')
        setTimeout(() => window.location.reload(), 1000)
      } catch (error) {
        toast.error(friendlyError('reset your progress', error))
      }
    }
  }

  return (
    <div data-testid="settings-screen" className="min-h-screen pb-20">
      {/* Header */}
      <div className="pt-8 pb-6 px-5 bg-card">
        <h1 className="text-2xl font-bold">
          Settings
        </h1>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Profile Section */}
        <Card className="py-0">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">PROFILE</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Username</label>
                <Input
                  type="text"
                  value={profile?.username || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val.length <= 30) setProfile({ username: val })
                  }}
                  maxLength={30}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Fitness Level</label>
                <select
                  value={profile?.fitnessLevel || 'beginner'}
                  onChange={(e) => setProfile({ fitnessLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                  className={selectClasses}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Training Days per Week</label>
                <select
                  value={profile?.trainingDaysPerWeek || 3}
                  onChange={(e) => {
                    const days = Number(e.target.value) as 3 | 4 | 5
                    setProfile({ trainingDaysPerWeek: days })
                    useWorkoutStore.getState().setPlan(days)
                  }}
                  className={selectClasses}
                >
                  <option value={3}>3 Days</option>
                  <option value={4}>4 Days</option>
                  <option value={5}>5 Days</option>
                </select>
              </div>

              {/* Workout Days Selector */}
              <div>
                <label className="text-xs text-muted-foreground block mb-2">
                  Which days do you workout? (select {trainingDays})
                </label>
                <div className="flex gap-1">
                  {DAY_NAMES.map((name, index) => {
                    const isSelected = selectedDays.includes(index as DayOfWeek)
                    const canAdd = selectedDays.length < trainingDays

                    return (
                      <button
                        key={name}
                        onClick={() => toggleDay(index as DayOfWeek)}
                        disabled={!isSelected && !canAdd}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                            : canAdd
                              ? 'bg-card text-muted-foreground hover:bg-muted'
                              : 'bg-card text-muted-foreground cursor-not-allowed'
                        )}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedDays.length} of {trainingDays} days selected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Units */}
        <Card className="py-0">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">UNITS</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setProfile({ units: 'imperial' })}
                className={cn(
                  'flex-1 p-4 rounded-xl border transition-all duration-150',
                  profile?.units === 'imperial'
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                    : 'bg-card border-border hover:bg-muted'
                )}
              >
                <p className="font-semibold">Imperial</p>
                <p className="text-xs text-muted-foreground">lbs, ft/in</p>
              </button>
              <button
                onClick={() => setProfile({ units: 'metric' })}
                className={cn(
                  'flex-1 p-4 rounded-xl border transition-all duration-150',
                  profile?.units === 'metric'
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                    : 'bg-card border-border hover:bg-muted'
                )}
              >
                <p className="font-semibold">Metric</p>
                <p className="text-xs text-muted-foreground">kg, cm</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="py-0">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">YOUR STATS</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-3xl font-bold font-digital text-primary">
                  {profile?.currentStreak || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Current Streak</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-3xl font-bold font-digital text-secondary">
                  {profile?.longestStreak || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Longest Streak</p>
              </div>
            </div>
            {profile?.createdAt && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <AchievementsCard onViewAll={() => navigate('/achievements')} />

        {/* Weight Tracking */}
        <Card className="py-0" data-sentry-mask>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground">WEIGHT TRACKING</h3>
              {rateOfChange && (
                <div className={cn(
                  'flex items-center gap-1.5 text-sm px-2 py-1 rounded-lg',
                  rateOfChange.direction === 'losing' ? 'bg-success/10 text-success' :
                  rateOfChange.direction === 'gaining' ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground'
                )}>
                  {rateOfChange.direction === 'losing' ? (
                    <TrendingDown size={16} />
                  ) : rateOfChange.direction === 'gaining' ? (
                    <TrendingUp size={16} />
                  ) : (
                    <Minus size={16} />
                  )}
                  <span className="font-digital font-semibold">
                    {toDisplayWeight(rateOfChange.value, units)} {getWeightUnit(units)}/wk
                  </span>
                </div>
              )}
            </div>

            {/* Today's Weight Input */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Input
                  type="number"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={String(toDisplayWeight(todayWeight?.weight || profile?.weight || 150, units))}
                  className="pr-12 font-digital"
                  min={units === 'metric' ? 20 : 50}
                  max={units === 'metric' ? 225 : 500}
                  step={0.1}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {getWeightUnit(units)}
                </span>
              </div>
              <Button onClick={handleLogWeight} disabled={!weightInput}>
                {todayWeight ? 'Update' : 'Log'}
              </Button>
            </div>

            {/* Current & Goal Weight Display */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Current Weight */}
              <div className="bg-card border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Current</p>
                <p className="font-digital font-bold text-xl text-foreground">
                  {formatWeight(profile?.weight || 0, units)}
                </p>
                {todayWeight && (
                  <p className="text-xs text-muted-foreground mt-1">Updated today</p>
                )}
              </div>

              {/* Goal Weight */}
              <div className="bg-card border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Goal</p>
                {profile?.goalWeight ? (
                  <>
                    <p className="font-digital font-bold text-xl text-primary">
                      {formatWeight(profile.goalWeight, units)}
                    </p>
                    <button
                      onClick={() => setGoalWeight(null)}
                      className="text-xs text-muted-foreground hover:text-destructive mt-1"
                    >
                      Clear goal
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={goalWeightInput}
                      onChange={(e) => setGoalWeightInput(e.target.value)}
                      placeholder="Set goal"
                      className="w-full bg-transparent border-b border-border focus:border-primary outline-none font-digital text-lg py-1"
                    />
                    {goalWeightInput && (
                      <button
                        onClick={handleSetGoalWeight}
                        className="text-primary text-sm font-medium"
                      >
                        Set
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Projected Goal Date */}
            {projectedGoal && profile?.goalWeight && (
              <div
                className={cn(
                  'rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300',
                  projectedGoal.isAchieved
                    ? 'bg-success/10 border border-success/30'
                    : 'bg-primary/10 border border-primary/30'
                )}
              >
                {projectedGoal.isAchieved ? (
                  <div className="flex items-center gap-3">
                    <PartyPopper size={24} className="text-success" />
                    <div>
                      <p className="font-bold text-success">Goal Achieved!</p>
                      <p className="text-sm text-muted-foreground">You've reached your target weight</p>
                    </div>
                  </div>
                ) : projectedGoal.projectedDate ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Projected Goal Date</p>
                      <p className="font-bold text-lg">
                        {projectedGoal.projectedDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">~{projectedGoal.weeksRemaining} weeks</p>
                      <p className="text-sm text-primary font-digital">
                        {Math.abs(toDisplayWeight(projectedGoal.currentWeight - projectedGoal.targetWeight, units)).toFixed(1)} {getWeightUnit(units)} to go
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <BarChart3 size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {weightTrend && weightTrend.daysTracked < 7
                          ? `Log ${7 - weightTrend.daysTracked} more days to see projected date`
                          : 'Keep tracking to see your projected goal date'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chart Toggle */}
            {weightHistory.length > 1 && (
              <button
                onClick={() => setShowWeightChart(!showWeightChart)}
                aria-expanded={showWeightChart}
                className="w-full text-sm text-primary flex items-center justify-center gap-2 py-2"
              >
                {showWeightChart ? 'Hide Chart' : 'Show Trend Chart'}
                <ChevronDown
                  size={16}
                  className={cn('text-primary transition-transform duration-150', showWeightChart && 'rotate-180')}
                />
              </button>
            )}

            {/* Weight Chart */}
            <div className={cn(
              'overflow-hidden transition-all duration-300',
              showWeightChart && weightHistory.length > 1
                ? 'max-h-[500px] opacity-100 mt-4 pt-4 border-t border-border'
                : 'max-h-0 opacity-0'
            )}>
              <WeightChart
                data={weightHistory}
                height={200}
                goalWeight={profile?.goalWeight}
                showGoalLine={!!profile?.goalWeight}
                unit={getWeightUnit(units)}
              />
            </div>

            {weightHistory.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Log your weight daily to track your progress
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card className="py-0">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
              Protocol Reminders
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Show protocol reminders on the home screen to help maintain discipline.
            </p>
            <div className="space-y-2">
              {([
                { key: 'logMacros' as ReminderType, label: 'Log Protocol', description: 'When no food logged today', icon: UtensilsCrossed },
                { key: 'checkIn' as ReminderType, label: LABELS.checkIn, description: 'When report not submitted', icon: CheckCircle2 },
                { key: 'claimXP' as ReminderType, label: `Claim ${LABELS.xp}`, description: `When pending ${LABELS.xp} is ready to claim`, icon: Gift },
                { key: 'workout' as ReminderType, label: 'Training', description: 'When training scheduled but not done', icon: Dumbbell }
              ]).map(({ key, label, description, icon: Icon }) => (
                <button
                  key={key}
                  role="switch"
                  aria-checked={reminderPreferences[key]}
                  onClick={() => setReminderPreference(key, !reminderPreferences[key])}
                  className="w-full flex items-center justify-between p-3 transition-all duration-150 rounded bg-muted hover:bg-muted/80"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <div className={cn(
                    'w-11 h-6 transition-all duration-300 flex items-center rounded',
                    reminderPreferences[key] ? 'bg-primary justify-end' : 'bg-card justify-start'
                  )}>
                    <div
                      className={cn(
                        'w-5 h-5 mx-0.5 rounded-sm transition-all duration-300',
                        reminderPreferences[key] ? 'bg-primary-foreground' : 'bg-muted-foreground/50'
                      )}
                    />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="py-0">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
              Data Management
            </h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleExport}
                data-testid="settings-export-button"
              >
                Export Progress
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowImportModal(true)}
              >
                Import Progress
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="py-0 border-destructive/30">
          <CardContent className="p-4">
            <button
              onClick={() => setShowDangerZone(!showDangerZone)}
              aria-expanded={showDangerZone}
              className="w-full flex items-center justify-between"
            >
              <h3 className="text-sm font-semibold text-destructive">DANGER ZONE</h3>
              <ChevronDown
                size={16}
                className={cn('text-destructive transition-transform', showDangerZone && 'rotate-180')}
              />
            </button>

            <div className={cn(
              'overflow-hidden transition-all duration-300',
              showDangerZone ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            )}>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all your progress including XP, workout history, and avatar evolution.
                </p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleResetProgress}
                >
                  Reset All Progress
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coach Dashboard */}
        {isCoach && (
          <Card className="py-0 border-primary/30">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">
                Dom/me Mode
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {`You have ${LABELS.coach.toLowerCase()} privileges. View and manage your ${LABELS.client.toLowerCase()}s from the dashboard.`}
              </p>
              <Button
                className="w-full"
                onClick={() => navigate('/coach')}
              >
                Open {LABELS.coachDashboard}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account */}
        <Card className="py-0">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">ACCOUNT</h3>
            {user ? (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-3" data-sentry-mask>
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="font-medium truncate">{user.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your data syncs automatically when connected to the internet.
                </p>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={async () => {
                    await signOut()
                    navigate('/auth')
                  }}
                  data-testid="settings-signout-button"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {isConfigured
                    ? 'Sign in to sync your data across devices and enable coach features.'
                    : 'Running in local-only mode. Your data is saved on this device.'}
                </p>
                {isConfigured && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate('/auth')}
                  >
                    Sign In / Create Account
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* About */}
        <Card className="py-0">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm font-heading font-semibold">
                <span className="text-white">Well</span><span className="text-primary">Trained</span>
              </p>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                Structure creates freedom
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Import progress"
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="bg-card rounded-xl p-6 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Import Progress</h2>

            {importStatus === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle size={40} className="mx-auto mb-4 text-success" />
                <p className="text-success font-bold">Import Successful!</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a backup file or paste the JSON data below.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />

                <Button
                  variant="ghost"
                  className="w-full mb-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>

                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Or paste JSON data here..."
                  className="h-32 text-sm font-mono resize-none mb-4"
                />

                {importStatus === 'error' && (
                  <p className="text-destructive text-sm mb-4">
                    Invalid data format. Please check your backup file.
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowImportModal(false)
                      setImportData('')
                      setImportStatus('idle')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleImport}
                    disabled={!importData}
                  >
                    Import
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Achievements Summary Card
function AchievementsCard({ onViewAll }: { onViewAll: () => void }) {
  const getAllBadges = useAchievementsStore((state) => state.getAllBadges)
  const getEarnedBadges = useAchievementsStore((state) => state.getEarnedBadges)

  const allBadges = getAllBadges()
  const earnedBadges = getEarnedBadges()
  const percentComplete = Math.round((earnedBadges.length / allBadges.length) * 100)

  const rarityBg: Record<string, string> = {
    common: 'bg-secondary/20',
    rare: 'bg-info/20',
    epic: 'bg-primary/20',
    legendary: 'bg-warning/20'
  }

  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {LABELS.achievements}
          </h3>
          <button
            onClick={onViewAll}
            className="text-xs text-primary font-medium flex items-center gap-1"
            data-testid="settings-achievements-link"
          >
            View All
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-muted flex items-center justify-center relative rounded-lg">
            <Award size={28} className="text-primary" />
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded">
              {percentComplete}%
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold">
              {earnedBadges.length} <span className="text-muted-foreground font-normal text-base">/ {allBadges.length}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-2">Marks Earned</p>
            <ProgressBar progress={percentComplete} size="sm" color="primary" />
          </div>
        </div>

        {/* Recent badges */}
        {earnedBadges.length > 0 && (
          <div className="flex gap-2">
            {earnedBadges.slice(0, 5).map((badge) => (
              <div
                key={badge.id}
                className={cn('w-10 h-10 flex items-center justify-center text-lg rounded', rarityBg[badge.rarity])}
                title={badge.name}
              >
                <Award size={18} />
              </div>
            ))}
            {earnedBadges.length > 5 && (
              <div className="w-10 h-10 flex items-center justify-center text-sm bg-muted text-muted-foreground rounded">
                +{earnedBadges.length - 5}
              </div>
            )}
          </div>
        )}

        {earnedBadges.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Complete reports and training to earn marks!
          </p>
        )}
      </CardContent>
    </Card>
  )
}
