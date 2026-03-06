import { useEffect } from 'react'
import { useAchievementsStore, Badge } from '@/stores'
import {
  Trophy, Flame, Dumbbell, Beef, ArrowUp, Sparkles, Target,
  Zap, Star, Gem, Crown, Shield, Play, CheckCircle, Award, Lock,
  Utensils, Link, type LucideIcon
} from 'lucide-react'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/cn'

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Flame, Zap, Dumbbell, Shield, Crown, Beef, Star, Sparkles,
  ArrowUp, Gem, Play, CheckCircle, Trophy, Award, Utensils, Link, Target
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
  // Hexagon with slightly rounded appearance (polygon approximation)
  const hexClip = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'

  return (
    <div
      className="flex flex-col items-center animate-in fade-in duration-300"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Hexagonal Badge */}
      <div className={cn(
        'relative w-[88px] h-[100px] flex items-center justify-center',
        earned && 'drop-shadow-[0_0_20px_rgba(212,168,83,0.5)]'
      )}>
        {/* Outer glow for earned badges */}
        {earned && (
          <div
            className="absolute inset-[-4px] bg-primary/20 blur-md"
            style={{ clipPath: hexClip }}
          />
        )}

        {/* Hexagon border/frame */}
        <div
          className={cn(
            'absolute inset-0 transition-all duration-300',
            earned
              ? 'bg-gradient-to-b from-primary via-gold to-gold-dim'
              : 'bg-gradient-to-b from-border to-surface'
          )}
          style={{ clipPath: hexClip }}
        />

        {/* Inner hexagon background */}
        <div
          className={cn(
            'absolute inset-[3px] transition-all duration-300',
            earned
              ? 'bg-gradient-to-b from-surface-elevated via-surface to-background'
              : 'bg-gradient-to-b from-surface to-background'
          )}
          style={{ clipPath: hexClip }}
        />

        {/* Icon container */}
        <div className="relative z-10 flex items-center justify-center">
          {earned ? (
            <BadgeIcon
              iconName={badge.icon}
              size={32}
              className="text-primary drop-shadow-[0_0_8px_rgba(212,168,83,0.6)]"
            />
          ) : (
            <Lock size={24} className="text-muted-foreground/40" />
          )}
        </div>
      </div>

      {/* Badge Name */}
      <p className={cn(
        'text-xs font-heading text-center mt-2 leading-tight tracking-wide',
        earned ? 'text-foreground' : 'text-muted-foreground/50'
      )}>
        {badge.name}
      </p>
      <p className={cn(
        'text-[10px] text-center mt-0.5',
        earned ? 'text-muted-foreground' : 'text-muted-foreground/30'
      )}>
        {badge.description.split('.')[0]}
      </p>
    </div>
  )
}

export function Achievements() {
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

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="pt-14 px-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-heading uppercase tracking-[0.15em] text-foreground">
            Trophy Room
          </h1>
          <span className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{totalEarned}</span>
            <span className="mx-1">/</span>
            <span>{totalBadges}</span>
            <span className="ml-1.5 text-xs">Earned</span>
          </span>
        </div>
      </div>

      {/* Trophy Hero with warm gradient background */}
      <div className="relative mx-6 mb-8">
        {/* Gradient background container */}
        <div className="relative overflow-hidden rounded-2xl">
          {/* Radial gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center top, rgba(212,168,83,0.25) 0%, rgba(154,122,58,0.1) 40%, transparent 70%)'
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(200,121,65,0.15) 0%, transparent 60%)'
            }}
          />

          {/* Trophy content */}
          <div className="relative flex flex-col items-center py-10">
            {/* Trophy with decorative elements */}
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-primary/30 blur-[40px] rounded-full scale-[2]" />

              {/* Laurel wreath container */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Left laurel branch */}
                <svg
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 text-primary opacity-80"
                  width="40"
                  height="80"
                  viewBox="0 0 40 80"
                  fill="none"
                >
                  <path
                    d="M35 75C30 70 28 60 28 50C28 40 30 30 35 20C32 25 25 32 22 42C19 52 20 65 25 75"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <ellipse cx="30" cy="15" rx="6" ry="10" fill="currentColor" opacity="0.6" transform="rotate(-20 30 15)" />
                  <ellipse cx="26" cy="28" rx="5" ry="9" fill="currentColor" opacity="0.6" transform="rotate(-10 26 28)" />
                  <ellipse cx="24" cy="42" rx="5" ry="9" fill="currentColor" opacity="0.6" transform="rotate(0 24 42)" />
                  <ellipse cx="24" cy="56" rx="5" ry="9" fill="currentColor" opacity="0.6" transform="rotate(10 24 56)" />
                  <ellipse cx="28" cy="68" rx="5" ry="8" fill="currentColor" opacity="0.6" transform="rotate(20 28 68)" />
                </svg>

                {/* Right laurel branch */}
                <svg
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 text-primary opacity-80"
                  width="40"
                  height="80"
                  viewBox="0 0 40 80"
                  fill="none"
                >
                  <path
                    d="M5 75C10 70 12 60 12 50C12 40 10 30 5 20C8 25 15 32 18 42C21 52 20 65 15 75"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <ellipse cx="10" cy="15" rx="6" ry="10" fill="currentColor" opacity="0.6" transform="rotate(20 10 15)" />
                  <ellipse cx="14" cy="28" rx="5" ry="9" fill="currentColor" opacity="0.6" transform="rotate(10 14 28)" />
                  <ellipse cx="16" cy="42" rx="5" ry="9" fill="currentColor" opacity="0.6" transform="rotate(0 16 42)" />
                  <ellipse cx="16" cy="56" rx="5" ry="9" fill="currentColor" opacity="0.6" transform="rotate(-10 16 56)" />
                  <ellipse cx="12" cy="68" rx="5" ry="8" fill="currentColor" opacity="0.6" transform="rotate(-20 12 68)" />
                </svg>

                {/* Main trophy icon */}
                <Trophy
                  size={72}
                  className="relative text-primary drop-shadow-[0_0_30px_rgba(212,168,83,0.6)]"
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marks of Devotion Section */}
      <div className="px-6">
        {/* Section header with decorative elements */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <h2 className="text-sm font-heading uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
            Marks of Devotion
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Hexagonal Badge Grid */}
        <div className="grid grid-cols-3 gap-y-6 gap-x-2 justify-items-center">
          {sortedBadges.map((badge, index) => (
            <HexBadge
              key={badge.id}
              badge={badge}
              earned={hasEarnedBadge(badge.id)}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
