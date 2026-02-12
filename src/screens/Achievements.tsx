import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgressBar, EmptyState } from '@/components'
import { Card, CardContent } from '@/components/ui/card'
import { useAchievementsStore, Badge, BadgeRarity, RARITY_COLORS } from '@/stores'
import { LABELS } from '@/design/constants'
import {
  Trophy, Flame, Dumbbell, Beef, ArrowUp, Sparkles, Target, ChevronLeft, Check, Award,
  Zap, Star, Gem, Crown, Shield, Play, CheckCircle, LucideIcon
} from 'lucide-react'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/cn'

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Flame, Zap, Dumbbell, Shield, Crown, Beef, Target, Star, Sparkles,
  ArrowUp, Gem, Play, CheckCircle, Trophy, Award
}

// Helper to render badge icon
function BadgeIcon({ iconName, size = 24, className = '' }: { iconName: string; size?: number; className?: string }) {
  const IconComponent = ICON_MAP[iconName] || Award
  return <IconComponent size={size} className={className} />
}

const RARITY_ORDER: BadgeRarity[] = ['legendary', 'epic', 'rare', 'common']

const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
}

const RARITY_BG: Record<BadgeRarity, string> = {
  common: 'from-secondary/20 to-secondary/10',
  rare: 'from-info/20 to-info/10',
  epic: 'from-primary/20 to-primary/10',
  legendary: 'from-warning/20 to-warning/10'
}

const RARITY_TEXT: Record<BadgeRarity, string> = {
  common: 'text-muted-foreground',
  rare: 'text-info',
  epic: 'text-primary',
  legendary: 'text-warning'
}

const RARITY_GLOW: Record<BadgeRarity, string> = {
  common: '',
  rare: '',
  epic: 'shadow-lg shadow-primary/20',
  legendary: 'shadow-lg shadow-warning/30'
}

type CategoryFilter = 'all' | 'streak' | 'workout' | 'nutrition' | 'level' | 'special'

interface BadgeCardProps {
  badge: Badge
  earned: boolean
  earnedAt?: number
  progress: { current: number; required: number; percentage: number }
  index: number
}

function BadgeCard({ badge, earned, earnedAt, progress, index }: BadgeCardProps) {
  return (
    <div
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300',
        earned ? RARITY_COLORS[badge.rarity] : 'border-border/50',
        earned ? `bg-gradient-to-br ${RARITY_BG[badge.rarity]}` : 'bg-card/50',
        earned && RARITY_GLOW[badge.rarity]
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Rarity Label */}
      <div className="absolute top-2 right-2">
        <span className={cn('text-[10px] font-semibold', earned ? RARITY_TEXT[badge.rarity] : 'text-muted-foreground')}>
          {RARITY_LABELS[badge.rarity]}
        </span>
      </div>

      <div className="flex items-start gap-4">
        {/* Badge Icon */}
        <div className={cn('relative', !earned && 'grayscale opacity-40')}>
          <div className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center',
            earned ? `bg-gradient-to-br ${RARITY_BG[badge.rarity]}` : 'bg-card'
          )}>
            <BadgeIcon
              iconName={badge.icon}
              size={28}
              className={earned ? RARITY_TEXT[badge.rarity] : 'text-muted-foreground'}
            />
          </div>
          {earned && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
              <Check size={12} className="text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Badge Info */}
        <div className="flex-1 min-w-0">
          <h3 className={cn('font-bold', !earned && 'text-muted-foreground')}>
            {badge.name}
          </h3>
          <p className={cn('text-sm mt-0.5', earned ? 'text-muted-foreground' : 'text-muted-foreground')}>
            {badge.description}
          </p>

          {/* Progress or Earned Date */}
          {earned ? (
            <p className="text-xs text-muted-foreground mt-2">
              Unlocked {new Date(earnedAt!).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          ) : (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className={cn('font-medium', progress.percentage >= 80 ? 'text-success' : 'text-muted-foreground')}>
                  {progress.current} / {progress.required}
                </span>
              </div>
              <ProgressBar
                progress={progress.percentage}
                size="sm"
                color={progress.percentage >= 80 ? 'success' : progress.percentage >= 50 ? 'primary' : 'secondary'}
              />
              {progress.percentage >= 80 && (
                <p className="text-xs text-success mt-1 font-medium flex items-center gap-1">
                  Almost there! <Flame size={12} />
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Achievements() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<CategoryFilter>('all')

  useEffect(() => {
    analytics.achievementsViewed()
  }, [])

  const getAllBadges = useAchievementsStore((state) => state.getAllBadges)
  const getEarnedBadges = useAchievementsStore((state) => state.getEarnedBadges)
  const hasEarnedBadge = useAchievementsStore((state) => state.hasEarnedBadge)
  const getBadgeProgress = useAchievementsStore((state) => state.getBadgeProgress)

  // Generate categories with Trained labels
  const categories: { id: CategoryFilter; label: string; icon: typeof Trophy }[] = [
    { id: 'all', label: 'All', icon: Award },
    { id: 'streak', label: 'Obedience', icon: Flame },
    { id: 'workout', label: 'Training', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Beef },
    { id: 'level', label: LABELS.level, icon: ArrowUp },
    { id: 'special', label: 'Special', icon: Sparkles },
  ]

  const allBadges = getAllBadges()
  const earnedBadges = getEarnedBadges()

  // Filter badges
  const filteredBadges = filter === 'all'
    ? allBadges
    : allBadges.filter(b => b.category === filter)

  // Sort: earned first (by rarity), then unearned (by progress)
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    const aEarned = hasEarnedBadge(a.id)
    const bEarned = hasEarnedBadge(b.id)

    if (aEarned && !bEarned) return -1
    if (!aEarned && bEarned) return 1

    if (aEarned && bEarned) {
      // Sort earned by rarity
      return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
    }

    // Sort unearned by progress (closest first)
    const aProgress = getBadgeProgress(a.id).percentage
    const bProgress = getBadgeProgress(b.id).percentage
    return bProgress - aProgress
  })

  // Stats
  const totalEarned = earnedBadges.length
  const totalBadges = allBadges.length
  const percentComplete = Math.round((totalEarned / totalBadges) * 100)

  // Count by rarity
  const earnedByRarity = {
    legendary: earnedBadges.filter(b => b.rarity === 'legendary').length,
    epic: earnedBadges.filter(b => b.rarity === 'epic').length,
    rare: earnedBadges.filter(b => b.rarity === 'rare').length,
    common: earnedBadges.filter(b => b.rarity === 'common').length,
  }

  const totalByRarity = {
    legendary: allBadges.filter(b => b.rarity === 'legendary').length,
    epic: allBadges.filter(b => b.rarity === 'epic').length,
    rare: allBadges.filter(b => b.rarity === 'rare').length,
    common: allBadges.filter(b => b.rarity === 'common').length,
  }

  // Find closest badge to unlock
  const closestBadge = allBadges
    .filter(b => !hasEarnedBadge(b.id))
    .map(b => ({ badge: b, progress: getBadgeProgress(b.id) }))
    .sort((a, b) => b.progress.percentage - a.progress.percentage)[0]

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="pt-8 pb-6 px-5 bg-card">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-10 h-10 bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {LABELS.achievements}
            </h1>
            <p className="text-muted-foreground text-sm">
              Track your marks of devotion
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="py-0 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center">
                  <Trophy size={36} className="text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {percentComplete}%
                </div>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">
                  {totalEarned} <span className="text-muted-foreground font-normal">/ {totalBadges}</span>
                </p>
                <p className="text-sm text-muted-foreground mb-2">Badges Earned</p>
                <ProgressBar progress={percentComplete} size="md" color="gradient" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-5 space-y-6">
        {/* Rarity Breakdown */}
        <div className="grid grid-cols-4 gap-2">
          {(['legendary', 'epic', 'rare', 'common'] as BadgeRarity[]).map(rarity => (
            <div
              key={rarity}
              className={cn(
                'p-3 rounded-lg bg-gradient-to-br border',
                RARITY_BG[rarity],
                earnedByRarity[rarity] > 0 ? RARITY_COLORS[rarity] : 'border-border/30'
              )}
            >
              <p className={cn('text-xs font-semibold', RARITY_TEXT[rarity])}>
                {RARITY_LABELS[rarity]}
              </p>
              <p className="text-lg font-bold mt-1">
                {earnedByRarity[rarity]}/{totalByRarity[rarity]}
              </p>
            </div>
          ))}
        </div>

        {/* Closest to Unlock */}
        {closestBadge && closestBadge.progress.percentage > 0 && (
          <Card className="py-0 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="text-primary" />
                <h3 className="font-semibold text-sm text-muted-foreground">CLOSEST TO UNLOCK</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <BadgeIcon iconName={closestBadge.badge.icon} size={24} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{closestBadge.badge.name}</p>
                  <p className="text-xs text-muted-foreground">{closestBadge.badge.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1">
                      <ProgressBar progress={closestBadge.progress.percentage} size="sm" color="primary" />
                    </div>
                    <span className="text-xs text-primary font-medium">
                      {closestBadge.progress.current}/{closestBadge.progress.required}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5" role="radiogroup" aria-label="Filter badges by category">
          {categories.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                role="radio"
                aria-checked={filter === cat.id}
                onClick={() => setFilter(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  filter === cat.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
                {filter === cat.id && (
                  <span className="ml-1 bg-primary-foreground/20 px-1.5 py-0.5 rounded text-xs">
                    {filteredBadges.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Badges List */}
        <div className="space-y-3">
          {sortedBadges.map((badge, index) => {
            const earned = hasEarnedBadge(badge.id)
            const earnedData = earnedBadges.find(b => b.id === badge.id)
            const progress = getBadgeProgress(badge.id)

            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                earned={earned}
                earnedAt={earnedData?.earnedAt}
                progress={progress}
                index={index}
              />
            )
          })}
        </div>

        {/* Empty State */}
        {sortedBadges.length === 0 && (
          <EmptyState
            icon={Trophy}
            title="No badges here yet"
            description="Keep training, checking in, and tracking nutrition to unlock badges in this category."
          />
        )}
      </div>
    </div>
  )
}
