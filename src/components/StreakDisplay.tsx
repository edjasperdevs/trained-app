import { motion } from 'motion/react'
import { useXPStore, useUserStore } from '@/stores'
import { Card } from './Card'
import { Flame, Lock } from 'lucide-react'

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

// Get days until next Sunday
function getDaysUntilSunday(): number {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday
  if (dayOfWeek === 0) return 0 // Today is Sunday
  return 7 - dayOfWeek
}

export function StreakDisplay({ showCard = true }: StreakDisplayProps) {
  const profile = useUserStore((state) => state.profile)
  const { dailyLogs, pendingXP } = useXPStore()

  const last7Days = getLast7Days()
  const daysUntilClaim = getDaysUntilSunday()

  // Check which days in the last 7 had check-ins
  const checkInDays = new Set(
    dailyLogs
      .filter(log => log.checkIn)
      .map(log => log.date)
  )

  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-primary" />
          <span className="font-bold">
            {profile?.currentStreak || 0} Day
          </span>
        </div>
        {pendingXP > 0 && (
          <span className="text-xs text-text-secondary">
            {daysUntilClaim === 0
              ? 'Claim today.'
              : `${daysUntilClaim}d until claim`
            }
          </span>
        )}
      </div>

      <div className="flex justify-between">
        {last7Days.map((day, index) => {
          const isToday = index === 6
          const hasCheckIn = checkInDays.has(day.date)
          const isGraceDay = profile?.streakPaused && index === 5 // Yesterday was missed

          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <span className="text-xs text-text-secondary">
                {day.dayLetter}
              </span>
              <motion.div
                initial={isToday && hasCheckIn ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                className={`
                  w-8 h-8 rounded-sm
                  flex items-center justify-center text-sm relative
                  ${hasCheckIn
                    ? 'bg-streak-active text-text-on-primary'
                    : isGraceDay
                      ? 'bg-warning text-text-on-primary'
                      : isToday
                        ? 'bg-surface border-2 border-primary border-dashed'
                        : 'bg-streak-inactive text-text-secondary'
                  }
                `}
              >
                {hasCheckIn ? (
                  '✓'
                ) : isGraceDay ? (
                  <Lock size={12} />
                ) : isToday ? (
                  '?'
                ) : (
                  ''
                )}
              </motion.div>
            </div>
          )
        })}
      </div>

      {profile?.longestStreak && profile.longestStreak > (profile?.currentStreak || 0) && (
        <p className="text-xs text-text-secondary text-center mt-3">
          Record: {profile.longestStreak} days
        </p>
      )}
    </>
  )

  if (!showCard) {
    return <div>{content}</div>
  }

  return <Card>{content}</Card>
}

// Compact inline streak badge
export function StreakBadge() {
  const profile = useUserStore((state) => state.profile)

  if (!profile?.currentStreak) return null

  return (
    <div className="px-3 py-1.5 flex items-center gap-1.5 bg-surface border border-border rounded">
      <Flame size={18} className="text-primary" />
      <span className="text-primary font-bold font-mono">
        {profile.currentStreak}
      </span>
    </div>
  )
}
