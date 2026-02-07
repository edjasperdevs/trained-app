import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAchievementsStore, Badge, BadgeRarity } from '@/stores/achievementsStore'
import { LABELS } from '@/design/constants'
import { Award, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'

interface BadgeUnlockModalProps {
  badgeIds: string[]
  onClose: () => void
}

const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
}

const RARITY_TEXT: Record<BadgeRarity, string> = {
  common: 'text-muted-foreground',
  rare: 'text-info',
  epic: 'text-primary',
  legendary: 'text-warning'
}

const RARITY_BG: Record<BadgeRarity, string> = {
  common: 'bg-muted border-border',
  rare: 'bg-info/10 border-info/30',
  epic: 'bg-primary-muted border-primary/30',
  legendary: 'bg-warning/10 border-warning/30'
}

function BadgeDisplay({ badge, index }: { badge: Badge; index: number }) {
  const [showSparkles, setShowSparkles] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowSparkles(true), 300 + index * 500)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <div
      className="flex flex-col items-center animate-in zoom-in-0 duration-500"
    >
      {/* Badge container */}
      <div className="relative">
        {/* Sparkles */}
        {showSparkles && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-in fade-in zoom-in-0 duration-500"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-${60 + Math.random() * 40}px)`,
                  animationDelay: `${i * 100}ms`
                }}
              >
                <Sparkles size={16} className="text-primary" />
              </div>
            ))}
          </div>
        )}

        {/* Badge icon */}
        <div
          className={cn(
            'relative w-24 h-24 flex items-center justify-center border-2 rounded-lg',
            RARITY_BG[badge.rarity]
          )}
        >
          <Award size={48} className={RARITY_TEXT[badge.rarity]} />
        </div>
      </div>

      {/* Badge info */}
      <div
        className="mt-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300 delay-500"
      >
        <p className={cn('text-xs font-semibold', RARITY_TEXT[badge.rarity])}>
          {RARITY_LABELS[badge.rarity]}
        </p>
        <h3 className="text-xl font-bold mt-1 font-heading">{badge.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
      </div>
    </div>
  )
}

export function BadgeUnlockModal({ badgeIds, onClose }: BadgeUnlockModalProps) {
  const getAllBadges = useAchievementsStore((state) => state.getAllBadges)
  const [currentIndex, setCurrentIndex] = useState(0)

  const allBadges = getAllBadges()
  const badges = badgeIds
    .map(id => allBadges.find(b => b.id === id))
    .filter((b): b is Badge => b !== null)

  if (badges.length === 0) return null

  const currentBadge = badges[currentIndex]
  const hasMore = currentIndex < badges.length - 1

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onClose()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Badge unlocked"
      className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[100] flex items-center justify-center overflow-hidden animate-in fade-in duration-300"
    >
      {/* Content */}
      <div
        className="w-full max-w-sm mx-4 text-center animate-in zoom-in-90 duration-500"
      >
        {/* Header */}
        <div
          className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300 delay-100"
        >
          <p className="text-sm font-semibold text-primary">
            {LABELS.achievements.replace('s', '')} Unlocked
          </p>
        </div>

        {/* Badge display */}
        <BadgeDisplay
          key={currentBadge.id}
          badge={currentBadge}
          index={0}
        />

        {/* Progress indicator for multiple badges */}
        {badges.length > 1 && (
          <div
            className="flex justify-center gap-2 mt-6 animate-in fade-in duration-300 delay-700"
          >
            {badges.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 transition-colors rounded-sm',
                  i === currentIndex ? 'bg-primary' : 'bg-border'
                )}
              />
            ))}
          </div>
        )}

        {/* Button */}
        <div
          className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-1000"
        >
          <Button onClick={handleNext} className="w-full" size="lg">
            {hasMore ? (
              <span className="flex items-center justify-center gap-2">
                NEXT
                <ChevronRight size={18} />
              </span>
            ) : (
              'CONTINUE'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
