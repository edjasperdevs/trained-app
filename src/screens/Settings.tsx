import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button, Card, WeightChart, ProgressBar } from '@/components'
import { Trophy, PartyPopper, ChevronDown, UtensilsCrossed, CheckCircle2, Gift, Dumbbell, TrendingDown, TrendingUp, Minus, BarChart3, ChevronRight, CheckCircle } from 'lucide-react'
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
import { formatWeight, getWeightUnit, toDisplayWeight, toInternalWeight } from '@/lib/units'
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
      link.download = `gamify-gains-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Data exported')
    } catch {
      toast.error('Failed to export data')
    }
  }

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importData)

      // Validate the import has expected structure
      if (!parsed.version && !parsed.user && !parsed.xp) {
        toast.error('Invalid backup file format')
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
    } catch {
      setImportStatus('error')
      toast.error('Invalid JSON format')
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
      } catch {
        toast.error('Failed to reset progress')
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <div className="bg-bg-secondary pt-8 pb-6 px-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">PROFILE</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Username</label>
              <input
                type="text"
                value={profile?.username || ''}
                onChange={(e) => setProfile({ username: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-2.5"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Fitness Level</label>
              <select
                value={profile?.fitnessLevel || 'beginner'}
                onChange={(e) => setProfile({ fitnessLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                className="w-full glass-input rounded-xl px-4 py-2.5"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Training Days per Week</label>
              <select
                value={profile?.trainingDaysPerWeek || 3}
                onChange={(e) => {
                  const days = Number(e.target.value) as 3 | 4 | 5
                  setProfile({ trainingDaysPerWeek: days })
                  useWorkoutStore.getState().setPlan(days)
                }}
                className="w-full glass-input rounded-xl px-4 py-2.5"
              >
                <option value={3}>3 Days</option>
                <option value={4}>4 Days</option>
                <option value={5}>5 Days</option>
              </select>
            </div>

            {/* Workout Days Selector */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">
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
                            ? 'bg-bg-secondary text-gray-400 hover:bg-gray-700'
                            : 'bg-bg-secondary text-gray-600 cursor-not-allowed'}
                      `}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {selectedDays.length} of {trainingDays} days selected
              </p>
            </div>
          </div>
        </Card>

        {/* Units */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">UNITS</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setProfile({ units: 'imperial' })}
              className={`flex-1 p-4 rounded-xl border transition-all duration-150 ${
                profile?.units === 'imperial'
                  ? 'border-accent-primary bg-accent-primary/10 shadow-lg shadow-accent-primary/10'
                  : 'glass-subtle border-transparent hover:bg-white/10'
              }`}
            >
              <p className="font-semibold">Imperial</p>
              <p className="text-xs text-gray-500">lbs, ft/in</p>
            </button>
            <button
              onClick={() => setProfile({ units: 'metric' })}
              className={`flex-1 p-4 rounded-xl border transition-all duration-150 ${
                profile?.units === 'metric'
                  ? 'border-accent-primary bg-accent-primary/10 shadow-lg shadow-accent-primary/10'
                  : 'glass-subtle border-transparent hover:bg-white/10'
              }`}
            >
              <p className="font-semibold">Metric</p>
              <p className="text-xs text-gray-500">kg, cm</p>
            </button>
          </div>
        </Card>

        {/* Stats */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">YOUR STATS</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-subtle rounded-xl p-4 text-center">
              <p className="text-3xl font-bold font-digital text-accent-primary">
                {profile?.currentStreak || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Current Streak</p>
            </div>
            <div className="glass-subtle rounded-xl p-4 text-center">
              <p className="text-3xl font-bold font-digital text-accent-secondary">
                {profile?.longestStreak || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Longest Streak</p>
            </div>
          </div>
          {profile?.createdAt && (
            <p className="text-xs text-gray-500 text-center mt-4">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          )}
        </Card>

        {/* Achievements */}
        <AchievementsCard onViewAll={() => navigate('/achievements')} />

        {/* Weight Tracking */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400">WEIGHT TRACKING</h3>
            {rateOfChange && (
              <div className={`flex items-center gap-1.5 text-sm px-2 py-1 rounded-lg ${
                rateOfChange.direction === 'losing' ? 'bg-accent-success/10 text-accent-success' :
                rateOfChange.direction === 'gaining' ? 'bg-accent-primary/10 text-accent-primary' :
                'bg-white/5 text-gray-400'
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
                className="w-full glass-input rounded-xl px-4 py-2.5 pr-12 font-digital"
                min={units === 'metric' ? 35 : 80}
                max={units === 'metric' ? 180 : 400}
                step={0.1}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
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
            <div className="glass-subtle rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Current</p>
              <p className="font-digital font-bold text-xl text-white">
                {formatWeight(profile?.weight || 0, units)}
              </p>
              {todayWeight && (
                <p className="text-xs text-gray-500 mt-1">Updated today</p>
              )}
            </div>

            {/* Goal Weight */}
            <div className="glass-subtle rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Goal</p>
              {profile?.goalWeight ? (
                <>
                  <p className="font-digital font-bold text-xl text-accent-primary">
                    {formatWeight(profile.goalWeight, units)}
                  </p>
                  <button
                    onClick={() => setGoalWeight(null)}
                    className="text-xs text-gray-500 hover:text-accent-danger mt-1"
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
                    className="w-full bg-transparent border-b border-gray-600 focus:border-accent-primary outline-none font-digital text-lg py-1"
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
                    <p className="text-sm text-gray-400">You've reached your target weight</p>
                  </div>
                </div>
              ) : projectedGoal.projectedDate ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Projected Goal Date</p>
                    <p className="font-bold text-lg">
                      {projectedGoal.projectedDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">~{projectedGoal.weeksRemaining} weeks</p>
                    <p className="text-sm text-accent-primary font-digital">
                      {Math.abs(toDisplayWeight(projectedGoal.currentWeight - projectedGoal.targetWeight, units)).toFixed(1)} {getWeightUnit(units)} to go
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <BarChart3 size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">
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
            <p className="text-xs text-gray-500 text-center py-2">
              Log your weight daily to track your progress
            </p>
          )}
        </Card>

        {/* Reminders */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">REMINDERS</h3>
          <p className="text-xs text-gray-500 mb-4">
            Show reminder cards on the home screen to help you stay on track.
          </p>
          <div className="space-y-2">
            {([
              { key: 'logMacros' as ReminderType, label: 'Log Macros', description: 'When no food logged today', icon: UtensilsCrossed },
              { key: 'checkIn' as ReminderType, label: 'Daily Check-In', description: 'When not checked in', icon: CheckCircle2 },
              { key: 'claimXP' as ReminderType, label: 'Claim XP', description: 'On Sunday with pending XP', icon: Gift },
              { key: 'workout' as ReminderType, label: 'Workout', description: 'When workout scheduled but not done', icon: Dumbbell }
            ]).map(({ key, label, description, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setReminderPreference(key, !reminderPreferences[key])}
                className="w-full flex items-center justify-between p-3 rounded-xl glass-subtle hover:bg-white/10 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-gray-400" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full transition-all duration-150 flex items-center ${
                  reminderPreferences[key] ? 'bg-accent-primary justify-end' : 'bg-white/10 justify-start'
                }`}>
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`w-5 h-5 rounded-full mx-0.5 ${reminderPreferences[key] ? 'bg-black' : 'bg-white/50'}`}
                  />
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Data Management */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">DATA MANAGEMENT</h3>
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
              <p className="text-sm text-gray-400">
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
          <Card className="border border-accent-primary/30">
            <h3 className="text-sm font-semibold text-accent-primary mb-4">COACH MODE</h3>
            <p className="text-sm text-gray-400 mb-4">
              You have coach privileges. View and manage your clients from the dashboard.
            </p>
            <Button
              fullWidth
              onClick={() => navigate('/coach')}
            >
              Open Coach Dashboard
            </Button>
          </Card>
        )}

        {/* Account */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">ACCOUNT</h3>
          {user ? (
            <div className="space-y-4">
              <div className="bg-bg-secondary rounded-lg p-3">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="font-medium truncate">{user.email}</p>
              </div>
              <p className="text-xs text-gray-500">
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
              <p className="text-sm text-gray-400">
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
            <p className="text-sm text-gray-400">Gamify Your Gains</p>
            <p className="text-xs text-gray-500">Version 1.0.0</p>
            <p className="text-xs text-gray-600 mt-2">Made for hyperfocusers</p>
          </div>
        </Card>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
                <p className="text-sm text-gray-400 mb-4">
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
                  className="w-full h-32 bg-bg-card border border-gray-700 rounded-lg p-3 text-sm font-mono resize-none mb-4"
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
    common: 'bg-gray-500/20',
    rare: 'bg-blue-500/20',
    epic: 'bg-purple-500/20',
    legendary: 'bg-yellow-500/20'
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400">ACHIEVEMENTS</h3>
        <button
          onClick={onViewAll}
          className="text-xs text-accent-primary font-medium flex items-center gap-1"
        >
          View All
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center relative">
          <Trophy size={28} className="text-accent-primary" />
          <div className="absolute -bottom-1 -right-1 bg-accent-primary text-bg-primary text-xs font-bold px-1.5 py-0.5 rounded-full">
            {percentComplete}%
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xl font-bold">
            {earnedBadges.length} <span className="text-gray-500 font-normal text-base">/ {allBadges.length}</span>
          </p>
          <p className="text-sm text-gray-400 mb-2">Badges Earned</p>
          <ProgressBar progress={percentComplete} size="sm" color="gradient" />
        </div>
      </div>

      {/* Recent badges */}
      {earnedBadges.length > 0 && (
        <div className="flex gap-2">
          {earnedBadges.slice(0, 5).map((badge) => (
            <div
              key={badge.id}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${rarityBg[badge.rarity]}`}
              title={badge.name}
            >
              {badge.icon}
            </div>
          ))}
          {earnedBadges.length > 5 && (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm bg-bg-secondary text-gray-400">
              +{earnedBadges.length - 5}
            </div>
          )}
        </div>
      )}

      {earnedBadges.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-2">
          Complete check-ins and workouts to earn badges!
        </p>
      )}
    </Card>
  )
}
