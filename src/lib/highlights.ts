import type { WeeklyStats } from '@/stores/weeklyReportStore'

export interface Highlight {
  type: 'protein' | 'pr' | 'streak' | 'workouts' | 'compliance' | 'dp' | 'locked'
  title: string
  description: string
  icon: string // Lucide icon name
}

export interface LockedProtocolData {
  isActive: boolean
  currentStreak: number
  totalDPEarned: number
}

/**
 * Generate highlights based on weekly performance metrics.
 * Always returns at least one highlight.
 */
export function generateHighlights(
  stats: WeeklyStats,
  longestStreak: number,
  lockedProtocol?: LockedProtocolData
): Highlight[] {
  const highlights: Highlight[] = []

  // Locked Protocol highlight (shows first when active)
  if (lockedProtocol?.isActive && lockedProtocol.currentStreak > 0) {
    highlights.push({
      type: 'locked',
      title: `Locked Protocol: Day ${lockedProtocol.currentStreak}`,
      description: `${lockedProtocol.totalDPEarned} DP earned from compliance`,
      icon: 'Lock',
    })
  }

  // 1. Protein Protocol Mastered
  if (stats.proteinDaysHit >= 5) {
    highlights.push({
      type: 'protein',
      title: 'Protein Protocol Mastered',
      description: `Hit protein target ${stats.proteinDaysHit}/7 days`,
      icon: 'Beef',
    })
  }

  // 2. Week-Long Streak
  if (stats.streak >= 7) {
    highlights.push({
      type: 'streak',
      title: 'Week-Long Streak',
      description: `${stats.streak} consecutive days of discipline`,
      icon: 'Flame',
    })
  }

  // 3. New Streak Record
  if (stats.streak > longestStreak) {
    highlights.push({
      type: 'streak',
      title: 'New Streak Record',
      description: 'Beat your previous best',
      icon: 'Trophy',
    })
  }

  // 4. Training Machine
  if (stats.workoutsCompleted >= 4) {
    highlights.push({
      type: 'workouts',
      title: 'Training Machine',
      description: `Completed ${stats.workoutsCompleted} workouts this week`,
      icon: 'Dumbbell',
    })
  }

  // 5. Perfect Week
  if (stats.compliancePercentage === 100) {
    highlights.push({
      type: 'compliance',
      title: 'Perfect Week',
      description: '100% protocol compliance',
      icon: 'CheckCircle',
    })
  }

  // 6. DP Domination
  if (stats.dpEarned >= 500) {
    highlights.push({
      type: 'dp',
      title: 'DP Domination',
      description: `Earned ${stats.dpEarned}+ Discipline Points`,
      icon: 'Zap',
    })
  }

  // If no specific milestones hit, return a generic "Week Complete" highlight with top stat
  if (highlights.length === 0) {
    // Find the user's best stat
    let topStat = ''
    let topValue = ''

    if (stats.dpEarned > 0) {
      topStat = 'DP Earned'
      topValue = `${stats.dpEarned} points`
    } else if (stats.workoutsCompleted > 0) {
      topStat = 'Workouts'
      topValue = `${stats.workoutsCompleted} completed`
    } else if (stats.streak > 0) {
      topStat = 'Streak'
      topValue = `${stats.streak} days`
    } else if (stats.proteinDaysHit > 0) {
      topStat = 'Protein Days'
      topValue = `${stats.proteinDaysHit}/7`
    } else {
      topStat = 'Week'
      topValue = 'Complete'
    }

    highlights.push({
      type: 'dp',
      title: 'Week Complete',
      description: `${topStat}: ${topValue}`,
      icon: 'Calendar',
    })
  }

  return highlights
}
