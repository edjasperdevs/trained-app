import { motion } from 'framer-motion'
import type { ActivityItem } from '@/hooks/useClientDetails'

interface ClientActivityFeedProps {
  activities: ActivityItem[]
}

interface GroupedActivities {
  label: string
  date: string
  items: ActivityItem[]
}

export function ClientActivityFeed({ activities }: ClientActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <span className="text-3xl block mb-2">📭</span>
        <p className="text-sm">No recent activity</p>
      </div>
    )
  }

  // Group activities by date
  const grouped: GroupedActivities[] = []
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  for (const activity of activities) {
    const existingGroup = grouped.find(g => g.date === activity.date)
    if (existingGroup) {
      existingGroup.items.push(activity)
    } else {
      let label = new Date(activity.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
      if (activity.date === today) label = 'Today'
      else if (activity.date === yesterday) label = 'Yesterday'

      grouped.push({
        label,
        date: activity.date,
        items: [activity]
      })
    }
  }

  const getActivityIcon = (activity: ActivityItem): string => {
    switch (activity.type) {
      case 'workout':
        switch (activity.workoutType) {
          case 'push': return '💪'
          case 'pull': return '🏋️'
          case 'legs': return '🦵'
          case 'upper': return '👆'
          case 'lower': return '👇'
          default: return '🏃'
        }
      case 'weight':
        return '⚖️'
      case 'xp':
        switch (activity.xpSource) {
          case 'workout': return '🏆'
          case 'protein': return '🥩'
          case 'calories': return '🔥'
          case 'checkin': return '✅'
          case 'claim': return '🎁'
          default: return '⭐'
        }
      default:
        return '📝'
    }
  }

  const getXPColor = (amount: number): string => {
    if (amount >= 100) return 'text-accent-secondary'
    if (amount >= 50) return 'text-accent-primary'
    return 'text-accent-success'
  }

  return (
    <div className="space-y-4">
      {grouped.map((group, groupIndex) => (
        <motion.div
          key={group.date}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.05 }}
        >
          <p className="text-xs font-semibold text-text-secondary mb-2">{group.label}</p>
          <div className="space-y-2">
            {group.items.map((activity, itemIndex) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.05 + itemIndex * 0.02 }}
                className="flex items-center gap-3 bg-bg-card/50 rounded-lg p-2"
              >
                <span className="text-lg">{getActivityIcon(activity)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{activity.description}</p>
                  {activity.detail && (
                    <p className="text-xs text-text-secondary">{activity.detail}</p>
                  )}
                </div>
                {activity.xpAmount && (
                  <span className={`text-sm font-digital ${getXPColor(activity.xpAmount)}`}>
                    +{activity.xpAmount} XP
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
