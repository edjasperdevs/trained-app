import { useAvatarStore, useDPStore } from '@/stores'
import { LABELS } from '@/design/constants'
import type { Archetype } from '@/design/constants'
import { cn } from '@/lib/cn'
import {
  User, Dumbbell, Beef, Heart, TrendingUp,
  Swords, ShieldAlert, Flame, Crown,
  LucideIcon
} from 'lucide-react'

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showMood?: boolean
  showLevel?: boolean
  level?: number
}

const sizeClasses = {
  sm: { container: 'w-16 h-16', icon: 24 },
  md: { container: 'w-24 h-24', icon: 40 },
  lg: { container: 'w-32 h-32', icon: 56 },
  xl: { container: 'w-48 h-48', icon: 80 }
}

// Character archetype icon representations per stage (1-5)
const CHARACTER_STAGES: Record<Archetype, { icons: LucideIcon[]; color: string }> = {
  bro: {
    icons: [User, Swords, ShieldAlert, Flame, Crown],
    color: 'text-primary'
  },
  himbo: {
    icons: [Dumbbell, Swords, ShieldAlert, Flame, Crown],
    color: 'text-destructive'
  },
  brute: {
    icons: [Beef, Swords, ShieldAlert, Flame, Crown],
    color: 'text-warning'
  },
  pup: {
    icons: [Heart, Swords, ShieldAlert, Flame, Crown],
    color: 'text-info'
  },
  bull: {
    icons: [TrendingUp, Swords, ShieldAlert, Flame, Crown],
    color: 'text-success'
  }
}

function getStageForRank(rank: number): number {
  if (rank < 4) return 0 // Stage 1
  if (rank < 8) return 1 // Stage 2
  if (rank < 12) return 2 // Stage 3
  if (rank < 15) return 3 // Stage 4
  return 4 // Stage 5
}

// Mood CSS classes
const moodClasses: Record<string, string> = {
  happy: 'animate-bounce-subtle',
  hyped: 'animate-pulse-slow',
  sad: '',
  neutral: '',
  neglected: 'opacity-70'
}

export function Avatar({
  size = 'lg',
  showMood = true,
  showLevel = false,
  level
}: AvatarProps) {
  const { currentMood, baseCharacter, recentReaction } = useAvatarStore()
  const { currentRank } = useDPStore()

  const iconSize = sizeClasses[size].icon
  const stage = getStageForRank(currentRank)
  const characterDef = CHARACTER_STAGES[baseCharacter as Archetype] || CHARACTER_STAGES.bro
  const CharacterIcon = characterDef.icons[stage]


  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Main avatar container */}
      <div
        className={cn(
          sizeClasses[size].container,
          'relative flex items-center justify-center bg-card border-2 rounded-lg transition-transform border-border',
          showMood && moodClasses[currentMood]
        )}
      >
        <CharacterIcon
          size={iconSize}
          className={characterDef.color}
        />
      </div>

      {/* Reaction bubble */}
      {recentReaction && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card px-3 py-1 text-sm whitespace-nowrap border border-border rounded animate-in fade-in zoom-in-90 duration-200">
          {recentReaction}
        </div>
      )}

      {/* Level label */}
      {showLevel && level && (
        <div className="mt-2 text-center">
          <p className="text-sm text-primary font-semibold">
            {LABELS.level} {level}
          </p>
        </div>
      )}
    </div>
  )
}
