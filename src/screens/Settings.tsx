import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button, Card, WeightChart } from '@/components'
import {
  useUserStore,
  useXPStore,
  useMacroStore,
  useWorkoutStore,
  useAvatarStore,
  useAuthStore,
  toast,
  DayOfWeek
} from '@/stores'
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

  const currentPlan = useWorkoutStore((state) => state.currentPlan)
  const setWorkoutDays = useWorkoutStore((state) => state.setWorkoutDays)

  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const isConfigured = useAuthStore((state) => state.isConfigured)

  const [showDangerZone, setShowDangerZone] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState('')
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [weightInput, setWeightInput] = useState('')
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

  const selectedDays = currentPlan?.selectedDays || []
  const trainingDays = profile?.trainingDaysPerWeek || 3

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
    const weight = Number(weightInput)
    if (weight <= 0 || weight >= 500) {
      toast.warning('Please enter a valid weight (1-499 lbs)')
      return
    }
    logWeight(weight)
    setWeightInput('')
    toast.success('Weight logged!')
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
      toast.success('Data exported successfully!')
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
      toast.success('Data imported successfully!')
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
        toast.info('Progress reset. Reloading...')
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
              <label className="text-xs text-gray-500 block mb-1">Username</label>
              <input
                type="text"
                value={profile?.username || ''}
                onChange={(e) => setProfile({ username: e.target.value })}
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Fitness Level</label>
              <select
                value={profile?.fitnessLevel || 'beginner'}
                onChange={(e) => setProfile({ fitnessLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Training Days per Week</label>
              <select
                value={profile?.trainingDaysPerWeek || 3}
                onChange={(e) => {
                  const days = Number(e.target.value) as 3 | 4 | 5
                  setProfile({ trainingDaysPerWeek: days })
                  useWorkoutStore.getState().setPlan(days)
                }}
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2"
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

        {/* Stats */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">YOUR STATS</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-secondary rounded-lg p-3 text-center">
              <p className="text-2xl font-bold font-digital text-accent-primary">
                {profile?.currentStreak || 0}
              </p>
              <p className="text-xs text-gray-500">Current Streak</p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-3 text-center">
              <p className="text-2xl font-bold font-digital text-accent-secondary">
                {profile?.longestStreak || 0}
              </p>
              <p className="text-xs text-gray-500">Longest Streak</p>
            </div>
          </div>
          {profile?.createdAt && (
            <p className="text-xs text-gray-500 text-center mt-4">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          )}
        </Card>

        {/* Weight Tracking */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400">WEIGHT TRACKING</h3>
            {weightTrend && (
              <div className={`flex items-center gap-1 text-sm ${
                weightTrend.direction === 'down' ? 'text-accent-success' :
                weightTrend.direction === 'up' ? 'text-accent-warning' :
                'text-gray-400'
              }`}>
                <span>
                  {weightTrend.direction === 'down' ? '↓' :
                   weightTrend.direction === 'up' ? '↑' : '→'}
                </span>
                <span className="font-digital">{Math.abs(weightTrend.change)} lbs</span>
              </div>
            )}
          </div>

          {/* Today's Weight Input */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={todayWeight ? String(todayWeight.weight) : String(profile?.weight || 150)}
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-3 py-2 font-digital"
                min={80}
                max={400}
                step={0.1}
              />
            </div>
            <Button onClick={handleLogWeight} disabled={!weightInput}>
              {todayWeight ? 'Update' : 'Log'}
            </Button>
          </div>

          {/* Today's status */}
          {todayWeight && (
            <div className="bg-bg-secondary rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-400">Today's weight</span>
              <span className="font-digital font-bold text-accent-primary">
                {todayWeight.weight} lbs
              </span>
            </div>
          )}

          {/* Chart Toggle */}
          {weightHistory.length > 1 && (
            <button
              onClick={() => setShowWeightChart(!showWeightChart)}
              className="w-full text-sm text-accent-primary flex items-center justify-center gap-2"
            >
              {showWeightChart ? 'Hide Chart' : 'Show Trend Chart'}
              <span className={`transition-transform ${showWeightChart ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          )}

          {/* Weight Chart */}
          {showWeightChart && weightHistory.length > 1 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 pt-4 border-t border-gray-800"
            >
              <WeightChart data={weightHistory} height={180} />
            </motion.div>
          )}

          {weightHistory.length === 0 && (
            <p className="text-xs text-gray-500 text-center">
              Log your weight daily to track your progress
            </p>
          )}
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
            <span className={`transition-transform ${showDangerZone ? 'rotate-180' : ''}`}>
              ▼
            </span>
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
                <span className="text-4xl block mb-4">✅</span>
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
