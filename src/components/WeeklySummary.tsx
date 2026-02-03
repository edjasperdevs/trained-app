import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card } from './Card'
import { useXPStore, useWorkoutStore, useMacroStore, useUserStore } from '@/stores'

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
        <h3 className="text-sm font-semibold text-gray-400">SPRINT SUMMARY</h3>
        <span className="text-xs text-gray-500">
          Day {daysSoFar} of 7
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Workouts */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-bg-secondary rounded-lg p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🏋️</span>
            <span className="text-xs text-gray-500">Workouts</span>
          </div>
          <p className="text-xl font-bold font-digital">
            {stats.workoutsCompleted}
            <span className="text-sm text-gray-500 font-normal">
              /{stats.workoutsPlanned}
            </span>
          </p>
        </motion.div>

        {/* Check-ins */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-bg-secondary rounded-lg p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">✅</span>
            <span className="text-xs text-gray-500">Check-ins</span>
          </div>
          <p className="text-xl font-bold font-digital">
            {stats.daysLogged}
            <span className="text-sm text-gray-500 font-normal">
              /{daysSoFar}
            </span>
          </p>
        </motion.div>

        {/* Protein Days */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-bg-secondary rounded-lg p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🥩</span>
            <span className="text-xs text-gray-500">Protein Days</span>
          </div>
          <p className="text-xl font-bold font-digital text-accent-primary">
            {stats.proteinDaysHit}
          </p>
        </motion.div>

        {/* Perfect Days */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-bg-secondary rounded-lg p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⭐</span>
            <span className="text-xs text-gray-500">Perfect Days</span>
          </div>
          <p className="text-xl font-bold font-digital text-accent-warning">
            {stats.perfectDays}
          </p>
        </motion.div>
      </div>

      {/* XP Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm text-gray-400">Sprint XP</span>
        </div>
        <span className="font-bold font-digital text-accent-secondary">
          +{stats.xpEarned} XP
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
            <span className="text-lg">🔥</span>
            <span className="text-sm text-gray-400">Uptime</span>
          </div>
          <span className="font-bold font-digital text-accent-warning">
            {stats.currentStreak} days
          </span>
        </motion.div>
      )}
    </Card>
  )
}
