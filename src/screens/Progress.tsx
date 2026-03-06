import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useAchievementsStore } from '@/stores'
import { Trophy, ChevronRight, Dumbbell, Award, TrendingUp } from 'lucide-react'
import { AnimatedPage, StaggerList, StaggerItem } from '@/components'
import { motion } from 'framer-motion'
import { springs } from '@/lib/animations'

// Get the last N weeks of dates
function getWeekDates(numWeeks: number): Date[][] {
  const weeks: Date[][] = []
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday

  // Start from the beginning of the current week (Monday)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - ((dayOfWeek + 6) % 7)) // Adjust to Monday

  for (let w = 0; w < numWeeks; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() - (w * 7) + d)
      week.push(date)
    }
    weeks.unshift(week) // Add to beginning so oldest is first
  }

  return weeks
}

// Format date as YYYY-MM-DD for comparison
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

interface PRData {
  exerciseName: string
  weight: number
  date: string
}

export function Progress() {
  const navigate = useNavigate()
  const workoutLogs = useWorkoutStore((s) => s.workoutLogs)
  const getAllBadges = useAchievementsStore((s) => s.getAllBadges)
  const hasEarnedBadge = useAchievementsStore((s) => s.hasEarnedBadge)

  // Calculate weekly volume (total weight lifted per week)
  const weeklyVolume = useMemo(() => {
    const volumes: { week: string; volume: number }[] = []
    const now = new Date()

    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (w * 7) - now.getDay() + 1) // Monday
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      let totalVolume = 0
      workoutLogs.forEach(log => {
        const logDate = new Date(log.date)
        if (logDate >= weekStart && logDate <= weekEnd) {
          log.exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
              if (set.completed && !set.warmup) {
                totalVolume += set.weight * set.reps
              }
            })
          })
        }
      })

      volumes.push({
        week: `Wk ${8 - w}`,
        volume: totalVolume
      })
    }

    return volumes
  }, [workoutLogs])

  // Find PRs (personal records) - highest weight for main lifts
  const personalRecords = useMemo(() => {
    const prs: Map<string, PRData> = new Map()
    const mainLifts = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Incline Press']

    workoutLogs.forEach(log => {
      log.exercises.forEach(exercise => {
        // Check if this is a main lift or similar
        const matchedLift = mainLifts.find(lift =>
          exercise.name.toLowerCase().includes(lift.toLowerCase()) ||
          lift.toLowerCase().includes(exercise.name.toLowerCase().split(' ')[0])
        )

        if (matchedLift || true) { // Track all exercises for now
          exercise.sets.forEach(set => {
            if (set.completed && !set.warmup && set.weight > 0) {
              const current = prs.get(exercise.name)
              if (!current || set.weight > current.weight) {
                prs.set(exercise.name, {
                  exerciseName: exercise.name,
                  weight: set.weight,
                  date: log.date
                })
              }
            }
          })
        }
      })
    })

    // Sort by weight and take top 4
    return Array.from(prs.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 4)
  }, [workoutLogs])

  // Generate heatmap data (12 weeks)
  const heatmapWeeks = useMemo(() => {
    const weeks = getWeekDates(12)
    const workoutDates = new Set(workoutLogs.map(log => log.date))

    return weeks.map(week =>
      week.map(date => ({
        date: formatDate(date),
        trained: workoutDates.has(formatDate(date)),
        isFuture: date > new Date()
      }))
    )
  }, [workoutLogs])

  // Get earned badges
  const badges = useMemo(() => {
    const allBadges = getAllBadges()
    return allBadges
      .filter(b => hasEarnedBadge(b.id))
      .slice(0, 3)
  }, [getAllBadges, hasEarnedBadge])

  // Calculate max volume for chart scaling
  const maxVolume = Math.max(...weeklyVolume.map(w => w.volume), 1000)

  return (
    <AnimatedPage>
      <div className="min-h-screen pb-24 bg-background">
        {/* Header */}
        <motion.div
          className="pt-14 pb-6 px-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
        >
          <div className="flex items-center justify-center gap-3">
            <TrendingUp size={20} className="text-primary" />
            <h1 className="text-lg font-heading uppercase tracking-[0.2em] text-primary font-bold">
              Your Progress
            </h1>
          </div>
        </motion.div>

        {/* Training Volume Chart */}
        <StaggerList className="px-6 pb-6">
          <StaggerItem>
            <div className="bg-surface border border-border rounded-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              <h2 className="text-sm font-heading font-bold text-foreground mb-1">
                Training Volume <span className="text-muted-foreground font-normal">(8 Weeks)</span>
              </h2>

              {/* Simple area chart */}
              <div className="h-32 mt-4 flex items-end gap-1">
                {weeklyVolume.map((week, i) => {
                  const height = maxVolume > 0 ? (week.volume / maxVolume) * 100 : 0
                  const isCurrentWeek = i === weeklyVolume.length - 1
                  return (
                    <motion.div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      style={{ transformOrigin: 'bottom' }}
                    >
                      <div
                        className={`w-full bg-gradient-to-t from-primary/40 to-primary rounded-t transition-all duration-500 ${
                          isCurrentWeek ? 'shadow-[0_0_12px_rgba(212,168,83,0.5)]' : ''
                        }`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <span className={`text-[9px] ${isCurrentWeek ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                        {week.week}
                      </span>
                    </motion.div>
                  )
                })}
              </div>

              {/* Y-axis labels */}
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
                <span>0</span>
                <span>{Math.round(maxVolume / 2 / 1000)}k lbs</span>
                <span>{Math.round(maxVolume / 1000)}k lbs</span>
              </div>
            </div>
          </StaggerItem>
        </StaggerList>

        {/* Personal Records */}
        {personalRecords.length > 0 && (
          <div className="px-6 pb-6">
            <h2 className="text-xs font-heading font-bold mb-3 uppercase tracking-widest text-muted-foreground">
              Personal Records
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {personalRecords.slice(0, 2).map((pr, i) => (
                <motion.div
                  key={i}
                  className="bg-surface border border-primary/20 rounded-xl p-4 shadow-[0_0_15px_rgba(212,168,83,0.1)]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center shadow-[0_0_8px_rgba(212,168,83,0.3)]">
                      <Trophy size={16} className="text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium truncate flex-1">
                      {pr.exerciseName.length > 12 ? pr.exerciseName.slice(0, 12) + '...' : pr.exerciseName}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {pr.weight} <span className="text-sm font-normal text-muted-foreground">lbs</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Heatmap */}
        <div className="px-6 pb-6">
          <motion.div
            className="bg-surface border border-border rounded-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-heading font-bold text-foreground mb-4">
              Consistency <span className="text-muted-foreground font-normal">(12 Weeks)</span>
            </h2>

            {/* Day labels */}
            <div className="flex gap-1 mb-2">
              <div className="w-4" /> {/* Spacer */}
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
              {heatmapWeeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex gap-1">
                  <div className="w-4 text-[8px] text-muted-foreground flex items-center font-mono">
                    {weekIdx === 0 || weekIdx === 6 || weekIdx === 11 ? `W${weekIdx + 1}` : ''}
                  </div>
                  {week.map((day, dayIdx) => (
                    <motion.div
                      key={dayIdx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: weekIdx * 0.02 + dayIdx * 0.01 }}
                      className={`flex-1 aspect-square rounded-sm transition-colors ${
                        day.isFuture
                          ? 'bg-transparent border border-border/30'
                          : day.trained
                            ? 'bg-primary shadow-[0_0_6px_rgba(212,168,83,0.5)]'
                            : 'bg-surface-elevated'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-primary shadow-[0_0_4px_rgba(212,168,83,0.4)]" />
                <span>Trained</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-surface-elevated" />
                <span>Rest</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Marks of Devotion */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-heading font-bold uppercase tracking-widest text-muted-foreground">
              Marks of Devotion
            </h2>
            <button
              onClick={() => navigate('/achievements')}
              className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group"
            >
              View All
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {badges.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-16 h-[72px] relative flex items-center justify-center drop-shadow-[0_0_12px_rgba(212,168,83,0.4)]">
                    {/* Hexagon shape */}
                    <div
                      className="absolute inset-0 bg-gradient-to-b from-primary to-gold-dim"
                      style={{
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                      }}
                    />
                    <div
                      className="absolute inset-[2px] bg-surface flex items-center justify-center"
                      style={{
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                      }}
                    >
                      <Award size={24} className="text-primary" />
                    </div>
                  </div>
                  <p className="text-[10px] text-foreground text-center mt-2 font-medium leading-tight">
                    {badge.name}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="bg-surface border border-border rounded-xl p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Dumbbell size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Keep training to earn badges</p>
            </motion.div>
          )}
        </div>
      </div>
    </AnimatedPage>
  )
}
