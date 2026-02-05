import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card, ProgressBar, EmptyState } from '@/components'
import { useAchievementsStore, Badge, BadgeRarity, RARITY_COLORS } from '@/stores'
import { useTheme } from '@/themes'
import {
  Trophy, Flame, Dumbbell, Beef, ArrowUp, Sparkles, Target, ChevronLeft, Check, Award,
  Zap, Star, Gem, Crown, Shield, Play, CheckCircle, LucideIcon
} from 'lucide-react'

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
  common: 'text-text-secondary',
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

// Categories are now generated inside the component to access theme

interface BadgeCardProps {
  badge: Badge
  earned: boolean
  earnedAt?: number
  progress: { current: number; required: number; percentage: number }
  index: number
}

function BadgeCard({ badge, earned, earnedAt, progress, index }: BadgeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        relative p-4 rounded-xl border-2 transition-all
        ${earned ? RARITY_COLORS[badge.rarity] : 'border-border/50'}
        ${earned ? `bg-gradient-to-br ${RARITY_BG[badge.rarity]}` : 'bg-bg-card/50'}
        ${earned ? RARITY_GLOW[badge.rarity] : ''}
      `}
    >
      {/* Rarity Label */}
      <div className="absolute top-2 right-2">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${earned ? RARITY_TEXT[badge.rarity] : 'text-text-secondary'}`}>
          {RARITY_LABELS[badge.rarity]}
        </span>
      </div>

      <div className="flex items-start gap-4">
        {/* Badge Icon */}
        <div className={`relative ${!earned && 'grayscale opacity-40'}`}>
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center
            ${earned ? `bg-gradient-to-br ${RARITY_BG[badge.rarity]}` : 'bg-bg-secondary'}
          `}>
            <BadgeIcon
              iconName={badge.icon}
              size={28}
              className={earned ? RARITY_TEXT[badge.rarity] : 'text-text-secondary'}
            />
          </div>
          {earned && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent-success rounded-full flex items-center justify-center">
              <Check size={12} className="text-text-on-primary" />
            </div>
          )}
        </div>

        {/* Badge Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold ${!earned && 'text-text-secondary'}`}>
            {badge.name}
          </h3>
          <p className={`text-sm mt-0.5 ${earned ? 'text-text-secondary' : 'text-text-secondary'}`}>
            {badge.description}
          </p>

          {/* Progress or Earned Date */}
          {earned ? (
            <p className="text-xs text-text-secondary mt-2">
              Unlocked {new Date(earnedAt!).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          ) : (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary">Progress</span>
                <span className={`font-medium ${progress.percentage >= 80 ? 'text-accent-success' : 'text-text-secondary'}`}>
                  {progress.current} / {progress.required}
                </span>
              </div>
              <ProgressBar
                progress={progress.percentage}
                size="sm"
                color={progress.percentage >= 80 ? 'green' : progress.percentage >= 50 ? 'cyan' : 'purple'}
              />
              {progress.percentage >= 80 && (
                <p className="text-xs text-accent-success mt-1 font-medium flex items-center gap-1">
                  Almost there! <Flame size={12} />
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function Achievements() {
  const navigate = useNavigate()
  const { theme, themeId } = useTheme()
  const isTrained = themeId === 'trained'
  const [filter, setFilter] = useState<CategoryFilter>('all')

  const getAllBadges = useAchievementsStore((state) => state.getAllBadges)
  const getEarnedBadges = useAchievementsStore((state) => state.getEarnedBadges)
  const hasEarnedBadge = useAchievementsStore((state) => state.hasEarnedBadge)
  const getBadgeProgress = useAchievementsStore((state) => state.getBadgeProgress)

  // Generate categories with theme-aware labels
  const categories: { id: CategoryFilter; label: string; icon: typeof Trophy }[] = [
    { id: 'all', label: 'All', icon: isTrained ? Award : Trophy },
    { id: 'streak', label: isTrained ? 'Obedience' : 'Streak', icon: Flame },
    { id: 'workout', label: isTrained ? 'Training' : 'Workout', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Beef },
    { id: 'level', label: theme.labels.level, icon: ArrowUp },
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
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* Header */}
      <div className={`pt-8 pb-6 px-4 ${isTrained ? 'bg-surface' : 'bg-gradient-to-b from-bg-secondary to-bg-primary'}`}>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className={`w-10 h-10 bg-surface-elevated flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors ${isTrained ? 'rounded' : 'rounded-full'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isTrained ? 'font-heading uppercase tracking-wide' : ''}`}>
              {theme.labels.achievements}
            </h1>
            <p className="text-text-secondary text-sm">
              {isTrained ? 'Track your marks of devotion' : 'Track your progress'}
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border-accent-primary/20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center">
                <Trophy size={36} className="text-accent-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-accent-primary text-bg-primary text-xs font-bold px-2 py-0.5 rounded-full">
                {percentComplete}%
              </div>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">
                {totalEarned} <span className="text-text-secondary font-normal">/ {totalBadges}</span>
              </p>
              <p className="text-sm text-text-secondary mb-2">Badges Earned</p>
              <ProgressBar progress={percentComplete} size="md" color="gradient" />
            </div>
          </div>
        </Card>
      </div>

      <div className="px-4 space-y-6">
        {/* Rarity Breakdown */}
        <div className="grid grid-cols-4 gap-2">
          {(['legendary', 'epic', 'rare', 'common'] as BadgeRarity[]).map(rarity => (
            <div
              key={rarity}
              className={`p-3 rounded-lg bg-gradient-to-br ${RARITY_BG[rarity]} border ${
                earnedByRarity[rarity] > 0 ? RARITY_COLORS[rarity] : 'border-border/30'
              }`}
            >
              <p className={`text-xs font-semibold uppercase ${RARITY_TEXT[rarity]}`}>
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
          <Card className="border-accent-primary/30">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-accent-primary" />
              <h3 className="font-semibold text-sm text-text-secondary">CLOSEST TO UNLOCK</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-bg-secondary flex items-center justify-center">
                <BadgeIcon iconName={closestBadge.badge.icon} size={24} className="text-accent-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{closestBadge.badge.name}</p>
                <p className="text-xs text-text-secondary">{closestBadge.badge.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1">
                    <ProgressBar progress={closestBadge.progress.percentage} size="sm" color="cyan" />
                  </div>
                  <span className="text-xs text-accent-primary font-medium">
                    {closestBadge.progress.current}/{closestBadge.progress.required}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categories.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${filter === cat.id
                    ? 'bg-accent-primary text-bg-primary shadow-lg shadow-accent-primary/20'
                    : 'bg-bg-card text-text-secondary hover:text-text-primary'}
                `}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
                {filter === cat.id && (
                  <span className="ml-1 bg-bg-primary/20 px-1.5 py-0.5 rounded text-xs">
                    {filteredBadges.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Badges List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
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
          </AnimatePresence>
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
