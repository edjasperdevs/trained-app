import { useState, useEffect } from 'react'
import {
  Award, Trophy, ChevronDown, Flame, Dumbbell, Target, TrendingUp,
  Zap, Beef, Star, Sparkles, ArrowUp, Gem, Crown, Shield, Play, CheckCircle, LucideIcon
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBar } from './ProgressBar'
import { useAchievementsStore, RARITY_COLORS, Badge, BadgeRarity } from '@/stores'
import { LABELS } from '@/design/constants'
import { cn } from '@/lib/cn'

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Flame, Zap, Dumbbell, Shield, Crown, Beef, Target, Star, Sparkles,
  ArrowUp, Gem, Play, CheckCircle, Trophy, Award
}

const RARITY_BG: Record<BadgeRarity, string> = {
  common: 'bg-muted',
  rare: 'bg-info/10',
  epic: 'bg-primary-muted',
  legendary: 'bg-warning/10'
}

// Helper to render badge icon
function BadgeIcon({ iconName, size = 20, className = '' }: { iconName: string; size?: number; className?: string }) {
  const IconComponent = ICON_MAP[iconName] || Award
  return <IconComponent size={size} className={className} />
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
    <div
      className={cn(
        'relative p-3 border-2 transition-all rounded animate-in fade-in zoom-in-90 duration-300',
        earned ? RARITY_COLORS[badge.rarity] : 'border-border opacity-60',
        earned ? RARITY_BG[badge.rarity] : 'bg-card'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(!earned && 'grayscale opacity-50')}>
          <BadgeIcon
            iconName={badge.icon}
            size={28}
            className={earned ? 'text-primary' : 'text-muted-foreground'}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm', !earned && 'text-muted-foreground')}>
            {badge.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {badge.description}
          </p>
          {earned && earnedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Earned {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
          {!earned && showProgress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{progress.current}/{progress.required}</span>
                <span>{Math.round(progress.percentage)}%</span>
              </div>
              <ProgressBar
                progress={progress.percentage}
                size="sm"
                color={badge.rarity === 'legendary' ? 'gradient' : 'primary'}
              />
            </div>
          )}
        </div>
      </div>
      {earned && (
        <div className="absolute -top-1 -right-1">
          <span className="text-sm text-primary">&#10003;</span>
        </div>
      )}
    </div>
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

  const categories: { id: CategoryFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Trophy size={14} /> },
    { id: 'streak', label: 'Streak', icon: <Flame size={14} /> },
    { id: 'workout', label: 'Workout', icon: <Dumbbell size={14} /> },
    { id: 'nutrition', label: 'Nutrition', icon: <Target size={14} /> },
    { id: 'level', label: 'Rank', icon: <TrendingUp size={14} /> },
  ]

  return (
    <Card className="py-0">
      <CardContent className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {LABELS.achievements}
        </h3>
        <span className="text-xs text-muted-foreground">
          {earnedBadges.length}/{allBadges.length} earned
        </span>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors rounded',
              filter === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 gap-2">
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
      </div>

      {/* Show More/Less */}
      {filteredBadges.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 text-sm text-primary flex items-center justify-center gap-1"
        >
          {showAll ? 'Show Less' : `Show All (${filteredBadges.length})`}
          <ChevronDown size={16} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* No badges message */}
      {filteredBadges.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No badges in this category yet
        </div>
      )}
      </CardContent>
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
        <div
          key={badge.id}
          className={cn(
            'w-10 h-10 border-2 flex items-center justify-center rounded animate-in zoom-in-0 duration-300',
            RARITY_COLORS[badge.rarity],
            RARITY_BG[badge.rarity]
          )}
          title={`${badge.name}: ${badge.description}`}
        >
          <BadgeIcon iconName={badge.icon} size={18} />
        </div>
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
    <Card className="py-0">
      <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-muted-foreground" />
          <span className="font-bold">
            {LABELS.achievements}
          </span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary font-medium"
          >
            View All &rarr;
          </button>
        )}
      </div>

      {/* Progress summary */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <div className="flex -space-x-2">
          {earnedBadges.slice(0, 4).map((badge, i) => (
            <div
              key={badge.id}
              className={cn('w-8 h-8 border-2 border-card flex items-center justify-center text-sm rounded', RARITY_BG[badge.rarity])}
              style={{ zIndex: 4 - i }}
            >
              <BadgeIcon iconName={badge.icon} size={14} />
            </div>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{earnedBadges.length}</span> of {allBadges.length} earned
        </span>
      </div>

      {/* Nearest badges */}
      {nearestBadges.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-semibold">
            Almost Earned
          </p>
          {nearestBadges.map(({ badge, progress }) => (
            <div
              key={badge.id}
              className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <div className={cn('w-10 h-10 flex items-center justify-center rounded', RARITY_BG[badge.rarity])}>
                <BadgeIcon iconName={badge.icon} size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium truncate">
                    {badge.name}
                  </p>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    {progress.current}/{progress.required}
                  </span>
                </div>
                <ProgressBar
                  progress={progress.percentage}
                  size="sm"
                  color={progress.percentage >= 80 ? 'success' : 'primary'}
                />
              </div>
            </div>
          ))}
        </div>
      ) : earnedBadges.length > 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          Continue following the protocol to earn more.
        </p>
      ) : null}
      </CardContent>
    </Card>
  )
}
