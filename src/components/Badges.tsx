import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './Card'
import { ProgressBar } from './ProgressBar'
import { useAchievementsStore, RARITY_COLORS, Badge, BadgeRarity } from '@/stores'

const RARITY_BG: Record<BadgeRarity, string> = {
  common: 'bg-gray-500/10',
  rare: 'bg-blue-500/10',
  epic: 'bg-accent-secondary/10',
  legendary: 'bg-accent-primary/10'
}

interface BadgeCardProps {
  badge: Badge
  earned: boolean
  earnedAt?: number
  showProgress?: boolean
}

function BadgeCard({ badge, earned, earnedAt, showProgress = false }: BadgeCardProps) {
  const getBadgeProgress = useAchievementsStore((state) => state.getBadgeProgress)
  const progress = getBadgeProgress(badge.id)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative p-3 rounded-lg border-2 transition-all
        ${earned ? RARITY_COLORS[badge.rarity] : 'border-gray-700 opacity-60'}
        ${earned ? RARITY_BG[badge.rarity] : 'bg-bg-card'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`text-3xl ${!earned && 'grayscale opacity-50'}`}>
          {badge.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${!earned && 'text-gray-500'}`}>
            {badge.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {badge.description}
          </p>
          {earned && earnedAt && (
            <p className="text-xs text-gray-600 mt-1">
              Earned {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
          {!earned && showProgress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{progress.current}/{progress.required}</span>
                <span>{Math.round(progress.percentage)}%</span>
              </div>
              <ProgressBar
                progress={progress.percentage}
                size="sm"
                color={badge.rarity === 'legendary' ? 'gradient' : badge.rarity === 'epic' ? 'purple' : 'cyan'}
              />
            </div>
          )}
        </div>
      </div>
      {earned && (
        <div className="absolute -top-1 -right-1">
          <span className="text-sm">✓</span>
        </div>
      )}
    </motion.div>
  )
}

type CategoryFilter = 'all' | 'streak' | 'workout' | 'nutrition' | 'level' | 'special'

export function BadgesSection() {
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const [showAll, setShowAll] = useState(false)

  const earnedBadges = useAchievementsStore((state) => state.getEarnedBadges())
  const checkAndAwardBadges = useAchievementsStore((state) => state.checkAndAwardBadges)
  const hasEarnedBadge = useAchievementsStore((state) => state.hasEarnedBadge)
  const getAllBadges = useAchievementsStore((state) => state.getAllBadges)

  // Check for new badges on mount
  useEffect(() => {
    checkAndAwardBadges()
  }, [checkAndAwardBadges])

  const allBadges = getAllBadges()
  const filteredBadges = filter === 'all'
    ? allBadges
    : allBadges.filter(b => b.category === filter)

  const displayBadges = showAll ? filteredBadges : filteredBadges.slice(0, 6)

  const categories: { id: CategoryFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '🏆' },
    { id: 'streak', label: 'Streak', icon: '🔥' },
    { id: 'workout', label: 'Workout', icon: '🏋️' },
    { id: 'nutrition', label: 'Nutrition', icon: '🥩' },
    { id: 'level', label: 'Level', icon: '⬆️' },
  ]

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400">ACHIEVEMENTS</h3>
        <span className="text-xs text-gray-500">
          {earnedBadges.length}/{allBadges.length} earned
        </span>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
              ${filter === cat.id
                ? 'bg-accent-primary text-bg-primary'
                : 'bg-bg-secondary text-gray-400 hover:text-white'}
            `}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 gap-2">
        <AnimatePresence mode="popLayout">
          {displayBadges.map((badge) => {
            const earned = hasEarnedBadge(badge.id)
            const earnedData = earnedBadges.find(b => b.id === badge.id)
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                earned={earned}
                earnedAt={earnedData?.earnedAt}
                showProgress={!earned}
              />
            )
          })}
        </AnimatePresence>
      </div>

      {/* Show More/Less */}
      {filteredBadges.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 text-sm text-accent-primary flex items-center justify-center gap-1"
        >
          {showAll ? 'Show Less' : `Show All (${filteredBadges.length})`}
          <span className={`transition-transform ${showAll ? 'rotate-180' : ''}`}>▼</span>
        </button>
      )}

      {/* No badges message */}
      {filteredBadges.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No badges in this category yet
        </div>
      )}
    </Card>
  )
}

// Compact badge display for showing recent achievements
export function RecentBadges({ limit = 3 }: { limit?: number }) {
  const earnedBadges = useAchievementsStore((state) => state.getEarnedBadges())
  const recentBadges = earnedBadges.slice(0, limit)

  if (recentBadges.length === 0) return null

  return (
    <div className="flex gap-2">
      {recentBadges.map((badge) => (
        <motion.div
          key={badge.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`
            w-10 h-10 rounded-lg border-2 flex items-center justify-center
            ${RARITY_COLORS[badge.rarity]} ${RARITY_BG[badge.rarity]}
          `}
          title={`${badge.name}: ${badge.description}`}
        >
          <span className="text-lg">{badge.icon}</span>
        </motion.div>
      ))}
    </div>
  )
}

// Show badges closest to being unlocked (for Home screen)
export function NearestBadges({ limit = 3, onViewAll }: { limit?: number; onViewAll?: () => void }) {
  const getAllBadges = useAchievementsStore((state) => state.getAllBadges)
  const hasEarnedBadge = useAchievementsStore((state) => state.hasEarnedBadge)
  const getBadgeProgress = useAchievementsStore((state) => state.getBadgeProgress)
  const getEarnedBadges = useAchievementsStore((state) => state.getEarnedBadges)

  const allBadges = getAllBadges()
  const earnedBadges = getEarnedBadges()

  // Get unearned badges sorted by progress
  const nearestBadges = allBadges
    .filter(b => !hasEarnedBadge(b.id))
    .map(badge => ({
      badge,
      progress: getBadgeProgress(badge.id)
    }))
    .filter(b => b.progress.percentage > 0)
    .sort((a, b) => b.progress.percentage - a.progress.percentage)
    .slice(0, limit)

  if (nearestBadges.length === 0 && earnedBadges.length === 0) return null

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <span className="font-bold">Achievements</span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-accent-primary font-medium"
          >
            View All →
          </button>
        )}
      </div>

      {/* Progress summary */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-700/50">
        <div className="flex -space-x-2">
          {earnedBadges.slice(0, 4).map((badge, i) => (
            <div
              key={badge.id}
              className={`w-8 h-8 rounded-full border-2 border-bg-card flex items-center justify-center text-sm ${RARITY_BG[badge.rarity]}`}
              style={{ zIndex: 4 - i }}
            >
              {badge.icon}
            </div>
          ))}
        </div>
        <span className="text-sm text-gray-400">
          <span className="text-white font-semibold">{earnedBadges.length}</span> of {allBadges.length} earned
        </span>
      </div>

      {/* Nearest badges */}
      {nearestBadges.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Almost Unlocked</p>
          {nearestBadges.map(({ badge, progress }) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${RARITY_BG[badge.rarity]}`}>
                {badge.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{badge.name}</p>
                  <span className="text-xs text-gray-500 ml-2">
                    {progress.current}/{progress.required}
                  </span>
                </div>
                <ProgressBar
                  progress={progress.percentage}
                  size="sm"
                  color={progress.percentage >= 80 ? 'green' : 'cyan'}
                />
              </div>
            </motion.div>
          ))}
        </div>
      ) : earnedBadges.length > 0 ? (
        <p className="text-sm text-gray-500 text-center py-2">
          Keep going to unlock more badges!
        </p>
      ) : null}
    </Card>
  )
}
