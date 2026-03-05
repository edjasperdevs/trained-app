import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components'
import { useDPStore, RANKS } from '@/stores/dpStore'
import { LABELS } from '@/design/constants'
import { Trophy, Dumbbell, Utensils, Beef, Footprints, Moon, X, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface WeeklyReportModalProps {
  isOpen: boolean
  onClose: () => void
}

const ACTION_ICONS: Record<string, typeof Dumbbell> = {
  training: Dumbbell,
  meals: Utensils,
  protein: Beef,
  steps: Footprints,
  sleep: Moon,
}

const ACTION_LABELS: Record<string, string> = {
  training: 'Training',
  meals: 'Meals',
  protein: 'Protein',
  steps: 'Steps',
  sleep: 'Sleep',
}

export function WeeklyReportModal({ isOpen, onClose }: WeeklyReportModalProps) {
  const { dailyLogs, totalDP, currentRank } = useDPStore()
  const rankInfo = useDPStore((s) => s.getRankInfo)()

  // Calculate weekly DP breakdown
  const weeklyData = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]

    // Filter logs from last 7 days
    const recentLogs = dailyLogs.filter(log => log.date >= weekAgoStr)

    // Calculate totals by action type
    const breakdown = {
      training: 0,
      meals: 0,
      protein: 0,
      steps: 0,
      sleep: 0,
    }

    let totalWeeklyDP = 0
    const dailyBreakdown: { date: string; total: number }[] = []

    recentLogs.forEach(log => {
      // For each action, multiply count by base DP value
      // Note: This is approximate since archetype modifiers may vary
      breakdown.training += log.training * 50
      breakdown.meals += log.meals * 15
      breakdown.protein += log.protein * 25
      breakdown.steps += log.steps * 10
      breakdown.sleep += log.sleep * 10
      totalWeeklyDP += log.total
      dailyBreakdown.push({ date: log.date, total: log.total })
    })

    // Sort by date descending
    dailyBreakdown.sort((a, b) => b.date.localeCompare(a.date))

    return {
      breakdown,
      totalWeeklyDP,
      dailyBreakdown,
      daysLogged: recentLogs.length,
    }
  }, [dailyLogs])

  // Get rank name
  const rankName = RANKS.find(r => r.rank === currentRank)?.name || 'Unknown'

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-surface border border-border rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-surface-elevated p-6 text-center border-b border-border">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X size={18} className="text-muted-foreground" />
            </button>

            <div className="mb-4">
              <Trophy size={48} className="mx-auto text-primary" />
            </div>
            <h2 className="text-xl font-heading font-bold uppercase tracking-widest text-primary">
              Weekly Report
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your {LABELS.dp} earned in the last 7 days
            </p>
          </div>

          {/* Total DP */}
          <div className="p-6 text-center border-b border-border">
            <p className="text-5xl font-bold font-mono text-primary">
              {weeklyData.totalWeeklyDP.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {LABELS.dp} earned this week
            </p>
          </div>

          {/* Breakdown by Action */}
          <div className="p-6 border-b border-border">
            <h3 className="text-xs font-heading uppercase tracking-widest text-muted-foreground mb-4">
              Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(weeklyData.breakdown)
                .filter(([, value]) => value > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([action, dp]) => {
                  const Icon = ACTION_ICONS[action] || TrendingUp
                  return (
                    <div key={action} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon size={16} className="text-primary" />
                        </div>
                        <span className="text-sm font-medium">{ACTION_LABELS[action]}</span>
                      </div>
                      <span className="font-mono text-primary font-bold">
                        +{dp} {LABELS.dp}
                      </span>
                    </div>
                  )
                })}
              {Object.values(weeklyData.breakdown).every(v => v === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity logged this week
                </p>
              )}
            </div>
          </div>

          {/* Daily Breakdown */}
          {weeklyData.dailyBreakdown.length > 0 && (
            <div className="p-6 border-b border-border">
              <h3 className="text-xs font-heading uppercase tracking-widest text-muted-foreground mb-4">
                Daily Activity
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {weeklyData.dailyBreakdown.map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="font-mono text-primary font-semibold">
                      +{day.total} {LABELS.dp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Rank Status */}
          <div className="p-6">
            <Card className="py-0 bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Current Rank
                    </p>
                    <p className="text-lg font-bold text-primary">{rankName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Total {LABELS.dp}
                    </p>
                    <p className="font-mono font-bold text-lg">
                      {totalDP.toLocaleString()}
                    </p>
                  </div>
                </div>
                {rankInfo.dpForNext > 0 && (
                  <>
                    <ProgressBar
                      progress={rankInfo.progress * 100}
                      size="md"
                      color="primary"
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {Math.ceil(rankInfo.dpForNext).toLocaleString()} {LABELS.dp} to next rank
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Close Button */}
          <div className="p-6 pt-0">
            <Button onClick={onClose} className="w-full" size="lg">
              Continue
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
