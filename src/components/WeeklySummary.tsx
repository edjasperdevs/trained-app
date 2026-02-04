import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card } from './Card'
import { useXPStore, useWorkoutStore, useMacroStore, useUserStore } from '@/stores'
import { useTheme } from '@/themes'
import { Dumbbell, CheckCircle2, Target, Star, Zap, Flame } from 'lucide-react'

interface WeeklyStats {
  workoutsCompleted: number
  workoutsPlanned: number
  proteinDaysHit: number
  calorieDaysHit: number
  perfectDays: number
  xpEarned: number
  currentStreak: number
  daysLogged: number
}

function getStartOfWeek(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day
  const startOfWeek = new Date(now.setDate(diff))
  startOfWeek.setHours(0, 0, 0, 0)
  return startOfWeek
}

function getDaysSoFar(): number {
  return new Date().getDay() + 1 // Sunday = 1, Monday = 2, etc.
}

export function WeeklySummary() {
  const dailyLogs = useXPStore((state) => state.dailyLogs)
  const workoutLogs = useWorkoutStore((state) => state.workoutLogs)
  const currentPlan = useWorkoutStore((state) => state.currentPlan)
  const macroLogs = useMacroStore((state) => state.dailyLogs)
  const targets = useMacroStore((state) => state.targets)
  const profile = useUserStore((state) => state.profile)

  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const stats: WeeklyStats = useMemo(() => {
    const startOfWeek = getStartOfWeek()
    const startStr = startOfWeek.toISOString().split('T')[0]

    // Workouts this week
    const thisWeekWorkouts = workoutLogs.filter(
      (log) => log.date >= startStr && log.completed
    )

    // Planned workouts based on currentPlan
    const daysSoFar = getDaysSoFar()
    let workoutsPlanned = 0
    if (currentPlan) {
      for (let i = 0; i < daysSoFar; i++) {
        const scheduled = currentPlan.schedule.find((s) => s.day === i)
        if (scheduled && scheduled.type !== 'rest') {
          workoutsPlanned++
        }
      }
    }

    // Macro days hit
    let proteinDaysHit = 0
    let calorieDaysHit = 0
    let perfectDays = 0

    if (targets) {
      macroLogs
        .filter((log) => log.date >= startStr)
        .forEach((log) => {
          const proteinHit = Math.abs(log.protein - targets.protein) <= 10
          const caloriesHit = Math.abs(log.calories - targets.calories) <= 100

          if (proteinHit) proteinDaysHit++
          if (caloriesHit) calorieDaysHit++
          if (proteinHit && caloriesHit) perfectDays++
        })
    }

    // XP earned this week
    const xpEarned = dailyLogs
      .filter((log) => log.date >= startStr)
      .reduce((sum, log) => sum + (log.total || 0), 0)

    // Days logged (check-ins)
    const daysLogged = dailyLogs.filter(
      (log) => log.date >= startStr && log.checkIn
    ).length

    return {
      workoutsCompleted: thisWeekWorkouts.length,
      workoutsPlanned,
      proteinDaysHit,
      calorieDaysHit,
      perfectDays,
      xpEarned,
      currentStreak: profile?.currentStreak || 0,
      daysLogged
    }
  }, [dailyLogs, workoutLogs, currentPlan, macroLogs, targets, profile])

  const daysSoFar = getDaysSoFar()

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold text-text-secondary ${isTrained ? 'uppercase tracking-wider font-heading' : ''}`}>
          {isTrained ? 'WEEKLY SUMMARY' : 'SPRINT SUMMARY'}
        </h3>
        <span className="text-xs text-text-secondary">
          Day {daysSoFar} of 7
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Workouts */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-3 ${isTrained ? 'bg-surface-elevated rounded' : 'bg-surface rounded-lg'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell size={16} className="text-text-secondary" />
            <span className="text-xs text-text-secondary">Workouts</span>
          </div>
          <p className="text-xl font-bold font-mono">
            {stats.workoutsCompleted}
            <span className="text-sm text-text-secondary font-normal">
              /{stats.workoutsPlanned}
            </span>
          </p>
        </motion.div>

        {/* Check-ins */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className={`p-3 ${isTrained ? 'bg-surface-elevated rounded' : 'bg-surface rounded-lg'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-text-secondary" />
            <span className="text-xs text-text-secondary">{isTrained ? 'Reports' : 'Check-ins'}</span>
          </div>
          <p className="text-xl font-bold font-mono">
            {stats.daysLogged}
            <span className="text-sm text-text-secondary font-normal">
              /{daysSoFar}
            </span>
          </p>
        </motion.div>

        {/* Protein Days */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`p-3 ${isTrained ? 'bg-surface-elevated rounded' : 'bg-surface rounded-lg'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-text-secondary" />
            <span className="text-xs text-text-secondary">Protein Days</span>
          </div>
          <p className="text-xl font-bold font-mono text-primary">
            {stats.proteinDaysHit}
          </p>
        </motion.div>

        {/* Perfect Days */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className={`p-3 ${isTrained ? 'bg-surface-elevated rounded' : 'bg-surface rounded-lg'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Star size={16} className="text-text-secondary" />
            <span className="text-xs text-text-secondary">{isTrained ? 'Full Compliance' : 'Perfect Days'}</span>
          </div>
          <p className="text-xl font-bold font-mono text-warning">
            {stats.perfectDays}
          </p>
        </motion.div>
      </div>

      {/* XP Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-3 pt-3 border-t border-border flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-text-secondary" />
          <span className="text-sm text-text-secondary">{isTrained ? 'Weekly' : 'Sprint'} {theme.labels.xp}</span>
        </div>
        <span className="font-bold font-mono text-secondary">
          +{stats.xpEarned} {theme.labels.xp}
        </span>
      </motion.div>

      {/* Streak */}
      {stats.currentStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-2 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-text-secondary" />
            <span className="text-sm text-text-secondary">{isTrained ? theme.labels.streak : 'Uptime'}</span>
          </div>
          <span className="font-bold font-mono text-warning">
            {stats.currentStreak} days
          </span>
        </motion.div>
      )}
    </Card>
  )
}
