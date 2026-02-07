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
      <div className="text-center py-8 text-muted-foreground">
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
    if (amount >= 100) return 'text-secondary'
    if (amount >= 50) return 'text-primary'
    return 'text-success'
  }

  return (
    <div className="space-y-4">
      {grouped.map((group, groupIndex) => (
        <div
          key={group.date}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${groupIndex * 50}ms` }}
        >
          <p className="text-xs font-semibold text-muted-foreground mb-2">{group.label}</p>
          <div className="space-y-2">
            {group.items.map((activity, itemIndex) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 bg-muted/50 rounded-lg p-2 animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ animationDelay: `${groupIndex * 50 + itemIndex * 20}ms` }}
              >
                <span className="text-lg">{getActivityIcon(activity)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{activity.description}</p>
                  {activity.detail && (
                    <p className="text-xs text-muted-foreground">{activity.detail}</p>
                  )}
                </div>
                {activity.xpAmount && (
                  <span className={`text-sm font-digital ${getXPColor(activity.xpAmount)}`}>
                    +{activity.xpAmount} XP
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
