import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAchievementsStore, Badge } from '@/stores'
import {
  Trophy, Flame, Dumbbell, Beef, ArrowUp, Sparkles, Target,
  Zap, Star, Gem, Crown, Shield, Play, CheckCircle, Award, Lock, LucideIcon
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

interface HexBadgeProps {
  badge: Badge
  earned: boolean
  index: number
}

function HexBadge({ badge, earned, index }: HexBadgeProps) {
  return (
    <div
      className="flex flex-col items-center animate-in fade-in duration-300"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Hexagonal Badge */}
      <div className={cn(
        'relative w-20 h-[92px] flex items-center justify-center',
        earned && 'drop-shadow-[0_0_12px_rgba(212,168,83,0.4)]'
      )}>
        {/* Hexagon shape using clip-path */}
        <div
          className={cn(
            'absolute inset-0 transition-all duration-300',
            earned
              ? 'bg-gradient-to-b from-primary/30 to-primary/10'
              : 'bg-surface'
          )}
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}
        />
        {/* Hexagon border */}
        <div
          className={cn(
            'absolute inset-[2px] transition-all duration-300',
            earned
              ? 'bg-gradient-to-b from-primary to-gold-dim'
              : 'bg-surface-elevated'
          )}
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}
        />
        {/* Inner hexagon */}
        <div
          className={cn(
            'absolute inset-[4px] flex items-center justify-center transition-all duration-300',
            earned
              ? 'bg-gradient-to-b from-surface-elevated to-surface'
              : 'bg-background'
          )}
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}
        >
          {earned ? (
            <BadgeIcon
              iconName={badge.icon}
              size={28}
              className="text-primary"
            />
          ) : (
            <Lock size={20} className="text-muted-foreground/50" />
          )}
        </div>
      </div>

      {/* Badge Name */}
      <p className={cn(
        'text-xs font-medium text-center mt-2 leading-tight',
        earned ? 'text-foreground' : 'text-muted-foreground/60'
      )}>
        {badge.name}
      </p>
      <p className={cn(
        'text-[10px] text-center mt-0.5',
        earned ? 'text-muted-foreground' : 'text-muted-foreground/40'
      )}>
        {badge.description.split('.')[0]}
      </p>
    </div>
  )
}

export function Achievements() {
  const navigate = useNavigate()
  const [, setFilter] = useState<string>('all')

  useEffect(() => {
    analytics.achievementsViewed()
  }, [])

  const getAllBadges = useAchievementsStore((state) => state.getAllBadges)
  const getEarnedBadges = useAchievementsStore((state) => state.getEarnedBadges)
  const hasEarnedBadge = useAchievementsStore((state) => state.hasEarnedBadge)
  const getBadgeProgress = useAchievementsStore((state) => state.getBadgeProgress)

  const allBadges = getAllBadges()
  const earnedBadges = getEarnedBadges()

  // Sort badges: earned first, then by progress
  const sortedBadges = [...allBadges].sort((a, b) => {
    const aEarned = hasEarnedBadge(a.id)
    const bEarned = hasEarnedBadge(b.id)

    if (aEarned && !bEarned) return -1
    if (!aEarned && bEarned) return 1

    // Sort unearned by progress
    const aProgress = getBadgeProgress(a.id).percentage
    const bProgress = getBadgeProgress(b.id).percentage
    return bProgress - aProgress
  })

  const totalEarned = earnedBadges.length
  const totalBadges = allBadges.length

  // Find closest badge to unlock
  const closestBadge = allBadges
    .filter(b => !hasEarnedBadge(b.id))
    .map(b => ({ badge: b, progress: getBadgeProgress(b.id) }))
    .sort((a, b) => b.progress.percentage - a.progress.percentage)[0]

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="pt-14 pb-6 px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-heading uppercase tracking-[0.15em] text-primary">
            Trophy Room
          </h1>
          <span className="text-sm text-muted-foreground font-mono">
            {totalEarned} / {totalBadges}
            <span className="ml-1 text-xs">Earned</span>
          </span>
        </div>

        {/* Trophy Hero */}
        <div className="flex flex-col items-center py-8">
          {/* Trophy with glow effect */}
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150" />

            {/* Trophy container */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Laurel wreath effect using gradients */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
              <div className="absolute inset-2 rounded-full border border-primary/20" />

              {/* Main trophy icon */}
              <Trophy size={64} className="text-primary drop-shadow-[0_0_20px_rgba(212,168,83,0.5)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Closest to Unlock */}
      {closestBadge && closestBadge.progress.percentage > 20 && (
        <div className="px-6 mb-6">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Closest to Unlock
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BadgeIcon iconName={closestBadge.badge.icon} size={24} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{closestBadge.badge.name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${closestBadge.progress.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-primary font-mono">
                    {closestBadge.progress.current}/{closestBadge.progress.required}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marks of Devotion Section */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-heading uppercase tracking-[0.1em] text-muted-foreground">
            Marks of Devotion
          </h2>
          <button
            onClick={() => navigate('/achievements/all')}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            View All
          </button>
        </div>

        {/* Hexagonal Badge Grid */}
        <div className="grid grid-cols-3 gap-4">
          {sortedBadges.slice(0, 12).map((badge, index) => (
            <HexBadge
              key={badge.id}
              badge={badge}
              earned={hasEarnedBadge(badge.id)}
              index={index}
            />
          ))}
        </div>

        {/* Show more if there are more badges */}
        {sortedBadges.length > 12 && (
          <button
            onClick={() => setFilter('all')}
            className="w-full mt-6 py-3 text-sm text-muted-foreground hover:text-primary transition-colors border border-border rounded-xl"
          >
            View All {totalBadges} Badges
          </button>
        )}
      </div>
    </div>
  )
}
