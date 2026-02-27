import { useDPStore, useUserStore } from '@/stores'
import { LABELS } from '@/design/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Flame, Lock } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StreakDisplayProps {
  showCard?: boolean
}

// Get last 7 days for streak calendar
function getLast7Days(): { date: string; dayLetter: string }[] {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push({
      date: date.toISOString().split('T')[0],
      dayLetter: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)
    })
  }
  return days
}

export function StreakDisplay({ showCard = true }: StreakDisplayProps) {
  const profile = useUserStore((state) => state.profile)
  const obedienceStreak = useDPStore((state) => state.obedienceStreak)
  const longestObedienceStreak = useDPStore((state) => state.longestObedienceStreak)
  const dailyLogs = useDPStore((state) => state.dailyLogs)

  const last7Days = getLast7Days()

  // Check which days in the last 7 had any DP activity (total > 0 means active day)
  const activeDays = new Set(
    dailyLogs
      .filter(log => log.total > 0)
      .map(log => log.date)
  )

  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-primary" />
          <span className="font-bold">
            {obedienceStreak} Day {LABELS.streak.split(' ').pop()}
          </span>
        </div>
      </div>

      <div className="flex justify-between">
        {last7Days.map((day, index) => {
          const isToday = index === 6
          const hasActivity = activeDays.has(day.date)
          const isGraceDay = profile?.streakPaused && index === 5 // Yesterday was missed

          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {day.dayLetter}
              </span>
              <div
                className={cn(
                  'w-8 h-8 rounded-sm flex items-center justify-center text-sm relative',
                  isToday && hasActivity && 'animate-in zoom-in-50 duration-300',
                  hasActivity
                    ? 'bg-streak-active text-primary-foreground'
                    : isGraceDay
                      ? 'bg-warning text-primary-foreground'
                      : isToday
                        ? 'bg-card border-2 border-primary border-dashed'
                        : 'bg-streak-inactive text-muted-foreground'
                )}
              >
                {hasActivity ? (
                  '\u2713'
                ) : isGraceDay ? (
                  <Lock size={12} />
                ) : isToday ? (
                  '?'
                ) : (
                  ''
                )}
              </div>
            </div>
          )
        })}
      </div>

      {longestObedienceStreak > obedienceStreak && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Record: {longestObedienceStreak} days
        </p>
      )}
    </>
  )

  if (!showCard) {
    return <div>{content}</div>
  }

  return <Card className="py-0"><CardContent className="p-4">{content}</CardContent></Card>
}

// Compact inline streak badge
export function StreakBadge() {
  const obedienceStreak = useDPStore((state) => state.obedienceStreak)

  if (!obedienceStreak) return null

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="px-3 py-1.5 flex items-center gap-1.5 bg-card border border-border rounded">
        <Flame size={18} className="text-primary" />
        <span className="text-primary font-bold font-mono">
          {obedienceStreak}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</span>
    </div>
  )
}
