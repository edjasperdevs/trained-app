import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useDPStore, useWorkoutStore, useMacroStore } from '@/stores'
import { LABELS } from '@/design/constants'
import { Dumbbell, Target, Zap, Flame, Utensils } from 'lucide-react'
import { cn } from '@/lib/cn'

interface WeeklyStats {
  workoutsCompleted: number
  workoutsPlanned: number
  proteinDaysHit: number
  mealsDaysLogged: number
  dpEarned: number
  obedienceStreak: number
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
  const dailyLogs = useDPStore((state) => state.dailyLogs)
  const obedienceStreak = useDPStore((state) => state.obedienceStreak)
  const workoutLogs = useWorkoutStore((state) => state.workoutLogs)
  const currentPlan = useWorkoutStore((state) => state.currentPlan)
  const macroLogs = useMacroStore((state) => state.dailyLogs)
  const targets = useMacroStore((state) => state.targets)

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

    // Protein days hit (protein > 0 in dpStore daily log)
    const thisWeekDPLogs = dailyLogs.filter((log) => log.date >= startStr)
    const proteinDaysHit = thisWeekDPLogs.filter(log => log.protein > 0).length

    // Meal days logged (meals > 0)
    const mealsDaysLogged = thisWeekDPLogs.filter(log => log.meals > 0).length

    // DP earned this week
    const dpEarned = thisWeekDPLogs.reduce((sum, log) => sum + (log.total || 0), 0)

    return {
      workoutsCompleted: thisWeekWorkouts.length,
      workoutsPlanned,
      proteinDaysHit,
      mealsDaysLogged,
      dpEarned,
      obedienceStreak,
    }
  }, [dailyLogs, workoutLogs, currentPlan, macroLogs, targets, obedienceStreak])

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
            <span className="text-xs text-muted-foreground">Training</span>
          </div>
          <p className="text-xl font-bold font-mono">
            {stats.workoutsCompleted}
            <span className="text-sm text-muted-foreground font-normal">
              /{stats.workoutsPlanned}
            </span>
          </p>
        </div>

        {/* Meals Logged */}
        <div
          className={cn(
            'p-3 bg-muted rounded',
            'animate-in fade-in zoom-in-90 duration-300 delay-75'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Utensils size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Meals Logged</span>
          </div>
          <p className="text-xl font-bold font-mono">
            {stats.mealsDaysLogged}
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

        {/* Streak */}
        <div
          className={cn(
            'p-3 bg-muted rounded',
            'animate-in fade-in zoom-in-90 duration-300 delay-150'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{LABELS.streak}</span>
          </div>
          <p className="text-xl font-bold font-mono text-warning">
            {stats.obedienceStreak}
          </p>
        </div>
      </div>

      {/* DP Summary */}
      <div
        className={cn(
          'mt-3 pt-3 border-t border-border flex items-center justify-between',
          'animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200'
        )}
      >
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Weekly {LABELS.dp}</span>
        </div>
        <span className="font-bold font-mono text-primary">
          +{stats.dpEarned} {LABELS.dp}
        </span>
      </div>
      </CardContent>
    </Card>
  )
}
