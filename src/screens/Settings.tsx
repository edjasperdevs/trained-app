import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Button, Card, WeightChart, ProgressBar } from '@/components'
import { PartyPopper, ChevronDown, UtensilsCrossed, CheckCircle2, Gift, Dumbbell, TrendingDown, TrendingUp, Minus, BarChart3, ChevronRight, CheckCircle, Award } from 'lucide-react'
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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

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
        evolutionStage: avatarData.evolutionStage,
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
      link.download = `trained-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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
      if (!parsed.version && !parsed.user && !parsed.xp) {
        toast.error('This doesn\'t look like a Trained backup file. Make sure you\'re importing a file exported from Trained.')
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
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <div className="pt-8 pb-6 px-5 bg-surface">
        <h1 className="text-2xl font-bold">
          Settings
        </h1>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Profile Section */}
        <Card>
          <h3 className="text-sm font-semibold text-text-secondary mb-4">PROFILE</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary block mb-1.5">Username</label>
              <input
                type="text"
                value={profile?.username || ''}
                onChange={(e) => setProfile({ username: e.target.value })}
                className="input-base"
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary block mb-1.5">Fitness Level</label>
              <select
                value={profile?.fitnessLevel || 'beginner'}
                onChange={(e) => setProfile({ fitnessLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                className="input-base"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-text-secondary block mb-1.5">Training Days per Week</label>
              <select
                value={profile?.trainingDaysPerWeek || 3}
                onChange={(e) => {
                  const days = Number(e.target.value) as 3 | 4 | 5
                  setProfile({ trainingDaysPerWeek: days })
                  useWorkoutStore.getState().setPlan(days)
                }}
                className="input-base"
              >
                <option value={3}>3 Days</option>
                <option value={4}>4 Days</option>
                <option value={5}>5 Days</option>
              </select>
            </div>

            {/* Workout Days Selector */}
            <div>
              <label className="text-xs text-text-secondary block mb-2">
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
                      className={`
                        flex-1 py-2 rounded-lg text-xs font-medium transition-colors
                        ${isSelected
                          ? 'bg-accent-primary text-bg-primary hover:bg-accent-primary/80'
                          : canAdd
                            ? 'bg-bg-secondary text-text-secondary hover:bg-surface-elevated'
                            : 'bg-bg-secondary text-text-secondary cursor-not-allowed'}
                      `}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-text-secondary mt-2">
                {selectedDays.length} of {trainingDays} days selected
              </p>
            </div>
          </div>
        </Card>

        {/* Units */}
        <Card>
          <h3 className="text-sm font-semibold text-text-secondary mb-4">UNITS</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setProfile({ units: 'imperial' })}
              className={`flex-1 p-4 rounded-xl border transition-all duration-150 ${
                profile?.units === 'imperial'
                  ? 'border-accent-primary bg-accent-primary/10 shadow-lg shadow-accent-primary/10'
                  : 'bg-surface border-border hover:bg-surface-elevated'
              }`}
            >
              <p className="font-semibold">Imperial</p>
              <p className="text-xs text-text-secondary">lbs, ft/in</p>
            </button>
            <button
              onClick={() => setProfile({ units: 'metric' })}
              className={`flex-1 p-4 rounded-xl border transition-all duration-150 ${
                profile?.units === 'metric'
                  ? 'border-accent-primary bg-accent-primary/10 shadow-lg shadow-accent-primary/10'
                  : 'bg-surface border-border hover:bg-surface-elevated'
              }`}
            >
              <p className="font-semibold">Metric</p>
              <p className="text-xs text-text-secondary">kg, cm</p>
            </button>
          </div>
        </Card>

        {/* Stats */}
        <Card>
          <h3 className="text-sm font-semibold text-text-secondary mb-4">YOUR STATS</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <p className="text-3xl font-bold font-digital text-accent-primary">
                {profile?.currentStreak || 0}
              </p>
              <p className="text-xs text-text-secondary mt-1">Current Streak</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <p className="text-3xl font-bold font-digital text-accent-secondary">
                {profile?.longestStreak || 0}
              </p>
              <p className="text-xs text-text-secondary mt-1">Longest Streak</p>
            </div>
          </div>
          {profile?.createdAt && (
            <p className="text-xs text-text-secondary text-center mt-4">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          )}
        </Card>

        {/* Achievements */}
        <AchievementsCard onViewAll={() => navigate('/achievements')} />

        {/* Weight Tracking */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary">WEIGHT TRACKING</h3>
            {rateOfChange && (
              <div className={`flex items-center gap-1.5 text-sm px-2 py-1 rounded-lg ${
                rateOfChange.direction === 'losing' ? 'bg-accent-success/10 text-accent-success' :
                rateOfChange.direction === 'gaining' ? 'bg-accent-primary/10 text-accent-primary' :
                'bg-glass-light text-text-secondary'
              }`}>
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
              <input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={String(toDisplayWeight(todayWeight?.weight || profile?.weight || 150, units))}
                className="input-base pr-12 font-digital"
                min={units === 'metric' ? 35 : 80}
                max={units === 'metric' ? 180 : 400}
                step={0.1}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
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
            <div className="bg-surface border border-border rounded-xl p-3">
              <p className="text-xs text-text-secondary mb-1">Current</p>
              <p className="font-digital font-bold text-xl text-text-primary">
                {formatWeight(profile?.weight || 0, units)}
              </p>
              {todayWeight && (
                <p className="text-xs text-text-secondary mt-1">Updated today</p>
              )}
            </div>

            {/* Goal Weight */}
            <div className="bg-surface border border-border rounded-xl p-3">
              <p className="text-xs text-text-secondary mb-1">Goal</p>
              {profile?.goalWeight ? (
                <>
                  <p className="font-digital font-bold text-xl text-accent-primary">
                    {formatWeight(profile.goalWeight, units)}
                  </p>
                  <button
                    onClick={() => setGoalWeight(null)}
                    className="text-xs text-text-secondary hover:text-accent-danger mt-1"
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
                    className="w-full bg-transparent border-b border-border focus:border-accent-primary outline-none font-digital text-lg py-1"
                  />
                  {goalWeightInput && (
                    <button
                      onClick={handleSetGoalWeight}
                      className="text-accent-primary text-sm font-medium"
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
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-4 mb-4 ${
                projectedGoal.isAchieved
                  ? 'bg-accent-success/10 border border-accent-success/30'
                  : 'bg-accent-primary/10 border border-accent-primary/30'
              }`}
            >
              {projectedGoal.isAchieved ? (
                <div className="flex items-center gap-3">
                  <PartyPopper size={24} className="text-accent-success" />
                  <div>
                    <p className="font-bold text-accent-success">Goal Achieved!</p>
                    <p className="text-sm text-text-secondary">You've reached your target weight</p>
                  </div>
                </div>
              ) : projectedGoal.projectedDate ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Projected Goal Date</p>
                    <p className="font-bold text-lg">
                      {projectedGoal.projectedDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary">~{projectedGoal.weeksRemaining} weeks</p>
                    <p className="text-sm text-accent-primary font-digital">
                      {Math.abs(toDisplayWeight(projectedGoal.currentWeight - projectedGoal.targetWeight, units)).toFixed(1)} {getWeightUnit(units)} to go
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <BarChart3 size={20} className="text-text-secondary" />
                  <div>
                    <p className="text-sm text-text-secondary">
                      {weightTrend && weightTrend.daysTracked < 7
                        ? `Log ${7 - weightTrend.daysTracked} more days to see projected date`
                        : 'Keep tracking to see your projected goal date'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Chart Toggle */}
          {weightHistory.length > 1 && (
            <button
              onClick={() => setShowWeightChart(!showWeightChart)}
              aria-expanded={showWeightChart}
              className="w-full text-sm text-accent-primary flex items-center justify-center gap-2 py-2"
            >
              {showWeightChart ? 'Hide Chart' : 'Show Trend Chart'}
              <ChevronDown
                size={16}
                className={`text-accent-primary transition-transform duration-150 ${showWeightChart ? 'rotate-180' : ''}`}
              />
            </button>
          )}

          {/* Weight Chart */}
          {showWeightChart && weightHistory.length > 1 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <WeightChart
                data={weightHistory}
                height={200}
                goalWeight={profile?.goalWeight}
                showGoalLine={!!profile?.goalWeight}
                unit={getWeightUnit(units)}
              />
            </motion.div>
          )}

          {weightHistory.length === 0 && (
            <p className="text-xs text-text-secondary text-center py-2">
              Log your weight daily to track your progress
            </p>
          )}
        </Card>

        {/* Reminders */}
        <Card>
          <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">
            Protocol Reminders
          </h3>
          <p className="text-xs text-text-secondary mb-4">
            Show protocol reminders on the home screen to help maintain discipline.
          </p>
          <div className="space-y-2">
            {([
              { key: 'logMacros' as ReminderType, label: 'Log Protocol', description: 'When no food logged today', icon: UtensilsCrossed },
              { key: 'checkIn' as ReminderType, label: LABELS.checkIn, description: 'When report not submitted', icon: CheckCircle2 },
              { key: 'claimXP' as ReminderType, label: `Claim ${LABELS.xp}`, description: `On Sunday with pending ${LABELS.xp}`, icon: Gift },
              { key: 'workout' as ReminderType, label: 'Training', description: 'When training scheduled but not done', icon: Dumbbell }
            ]).map(({ key, label, description, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setReminderPreference(key, !reminderPreferences[key])}
                className="w-full flex items-center justify-between p-3 transition-all duration-150 rounded bg-surface-elevated hover:bg-surface-elevated/80"
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-text-secondary" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-text-secondary">{description}</p>
                  </div>
                </div>
                <div className={`w-11 h-6 transition-all duration-150 flex items-center rounded ${
                  reminderPreferences[key] ? 'bg-primary justify-end' : 'bg-surface justify-start'
                }`}>
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`w-5 h-5 mx-0.5 rounded-sm ${reminderPreferences[key] ? 'bg-text-on-primary' : 'bg-text-secondary/50'}`}
                  />
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Data Management */}
        <Card>
          <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">
            Data Management
          </h3>
          <div className="space-y-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={handleExport}
            >
              Export Progress
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowImportModal(true)}
            >
              Import Progress
            </Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="border-accent-danger/30">
          <button
            onClick={() => setShowDangerZone(!showDangerZone)}
            aria-expanded={showDangerZone}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-sm font-semibold text-accent-danger">DANGER ZONE</h3>
            <ChevronDown
              size={16}
              className={`text-accent-danger transition-transform ${showDangerZone ? 'rotate-180' : ''}`}
            />
          </button>

          {showDangerZone && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 space-y-3"
            >
              <p className="text-sm text-text-secondary">
                This will permanently delete all your progress including XP, workout history, and avatar evolution.
              </p>
              <Button
                variant="danger"
                fullWidth
                onClick={handleResetProgress}
              >
                Reset All Progress
              </Button>
            </motion.div>
          )}
        </Card>

        {/* Coach Dashboard */}
        {isCoach && (
          <Card className="border border-primary/30">
            <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">
              Dom/me Mode
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {`You have ${LABELS.coach.toLowerCase()} privileges. View and manage your ${LABELS.client.toLowerCase()}s from the dashboard.`}
            </p>
            <Button
              fullWidth
              onClick={() => navigate('/coach')}
            >
              Open {LABELS.coachDashboard}
            </Button>
          </Card>
        )}

        {/* Account */}
        <Card>
          <h3 className="text-sm font-semibold text-text-secondary mb-4">ACCOUNT</h3>
          {user ? (
            <div className="space-y-4">
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-xs text-text-secondary">Signed in as</p>
                <p className="font-medium truncate">{user.email}</p>
              </div>
              <p className="text-xs text-text-secondary">
                Your data syncs automatically when connected to the internet.
              </p>
              <Button
                variant="ghost"
                fullWidth
                onClick={async () => {
                  await signOut()
                  navigate('/auth')
                }}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                {isConfigured
                  ? 'Sign in to sync your data across devices and enable coach features.'
                  : 'Running in local-only mode. Your data is saved on this device.'}
              </p>
              {isConfigured && (
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => navigate('/auth')}
                >
                  Sign In / Create Account
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* About */}
        <Card padding="sm">
          <div className="text-center">
            <p className="text-sm text-text-secondary font-heading font-semibold">
              Trained
            </p>
            <p className="text-xs text-text-secondary">Version 1.0.0</p>
            <p className="text-xs text-text-secondary/60 mt-2">
              Structure creates freedom
            </p>
          </div>
        </Card>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Import progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowImportModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-bg-secondary rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Import Progress</h2>

            {importStatus === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle size={40} className="mx-auto mb-4 text-accent-success" />
                <p className="text-accent-success font-bold">Import Successful!</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-text-secondary mb-4">
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
                  fullWidth
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-4"
                >
                  Choose File
                </Button>

                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Or paste JSON data here..."
                  className="input-base h-32 text-sm font-mono resize-none mb-4"
                />

                {importStatus === 'error' && (
                  <p className="text-accent-danger text-sm mb-4">
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
                    fullWidth
                    onClick={handleImport}
                    disabled={!importData}
                  >
                    Import
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
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
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          {LABELS.achievements}
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs text-primary font-medium flex items-center gap-1"
        >
          View All
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-surface-elevated flex items-center justify-center relative rounded-lg">
          <Award size={28} className="text-primary" />
          <div className="absolute -bottom-1 -right-1 bg-primary text-text-on-primary text-xs font-bold px-1.5 py-0.5 rounded">
            {percentComplete}%
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xl font-bold">
            {earnedBadges.length} <span className="text-text-secondary font-normal text-base">/ {allBadges.length}</span>
          </p>
          <p className="text-sm text-text-secondary mb-2">Marks Earned</p>
          <ProgressBar progress={percentComplete} size="sm" color="primary" />
        </div>
      </div>

      {/* Recent badges */}
      {earnedBadges.length > 0 && (
        <div className="flex gap-2">
          {earnedBadges.slice(0, 5).map((badge) => (
            <div
              key={badge.id}
              className={`w-10 h-10 flex items-center justify-center text-lg rounded ${rarityBg[badge.rarity]}`}
              title={badge.name}
            >
              <Award size={18} />
            </div>
          ))}
          {earnedBadges.length > 5 && (
            <div className="w-10 h-10 flex items-center justify-center text-sm bg-surface-elevated text-text-secondary rounded">
              +{earnedBadges.length - 5}
            </div>
          )}
        </div>
      )}

      {earnedBadges.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-2">
          Complete reports and training to earn marks!
        </p>
      )}
    </Card>
  )
}
