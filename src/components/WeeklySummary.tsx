import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useXPStore, useWorkoutStore, useMacroStore, useUserStore } from '@/stores'
import { LABELS } from '@/design/constants'
import { Dumbbell, CheckCircle2, Target, Star, Zap, Flame } from 'lucide-react'
import { cn } from '@/lib/cn'

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
    <Card className="py-0">
      <CardContent className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Weekly Summary
        </h3>
        <span className="text-xs text-muted-foreground">
          Day {daysSoFar} of 7
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Workouts */}
        <div
          className={cn(
            'p-3 bg-muted rounded',
            'animate-in fade-in zoom-in-90 duration-300'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Workouts</span>
          </div>
          <p className="text-xl font-bold font-mono">
            {stats.workoutsCompleted}
            <span className="text-sm text-muted-foreground font-normal">
              /{stats.workoutsPlanned}
            </span>
          </p>
        </div>

        {/* Check-ins */}
        <div
          className={cn(
            'p-3 bg-muted rounded',
            'animate-in fade-in zoom-in-90 duration-300 delay-75'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Reports</span>
          </div>
          <p className="text-xl font-bold font-mono">
            {stats.daysLogged}
            <span className="text-sm text-muted-foreground font-normal">
              /{daysSoFar}
            </span>
          </p>
        </div>

        {/* Protein Days */}
        <div
          className={cn(
            'p-3 bg-muted rounded',
            'animate-in fade-in zoom-in-90 duration-300 delay-100'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Protein Days</span>
          </div>
          <p className="text-xl font-bold font-mono text-primary">
            {stats.proteinDaysHit}
          </p>
        </div>

        {/* Perfect Days */}
        <div
          className={cn(
            'p-3 bg-muted rounded',
            'animate-in fade-in zoom-in-90 duration-300 delay-150'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Star size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Full Compliance</span>
          </div>
          <p className="text-xl font-bold font-mono text-warning">
            {stats.perfectDays}
          </p>
        </div>
      </div>

      {/* XP Summary */}
      <div
        className={cn(
          'mt-3 pt-3 border-t border-border flex items-center justify-between',
          'animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200'
        )}
      >
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Weekly {LABELS.xp}</span>
        </div>
        <span className="font-bold font-mono text-secondary">
          +{stats.xpEarned} {LABELS.xp}
        </span>
      </div>

      {/* Streak */}
      {stats.currentStreak > 0 && (
        <div
          className={cn(
            'mt-2 flex items-center justify-between',
            'animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300'
          )}
        >
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{LABELS.streak}</span>
          </div>
          <span className="font-bold font-mono text-warning">
            {stats.currentStreak} days
          </span>
        </div>
      )}
      </CardContent>
    </Card>
  )
}
