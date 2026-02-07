import { useAvatarStore, EVOLUTION_STAGES } from '@/stores'
import { AVATAR_STAGES, LABELS } from '@/design/constants'
import { cn } from '@/lib/cn'
import {
  Circle, Zap, Sprout, Footprints, Dumbbell, Sword, Shield, Flame,
  Trophy, Sparkles, Star, Crown, Wand2, Moon, LucideIcon
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

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Circle, Zap, Sprout, Footprints, Dumbbell, Sword, Shield, Flame,
  Trophy, Bolt: Zap, Sparkles, Star, Crown, Wand2, Moon
}

// Character base icon representations
const CHARACTER_BASES = {
  dominant: { icon: Sword, color: 'text-destructive' },
  switch: { icon: Wand2, color: 'text-primary' },
  submissive: { icon: Moon, color: 'text-info' }
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
  const { evolutionStage, currentMood, baseCharacter, recentReaction } = useAvatarStore()

  const stageName = AVATAR_STAGES[evolutionStage - 1] || AVATAR_STAGES[0]
  const stageInfo = EVOLUTION_STAGES.find(s => s.stage === evolutionStage) || EVOLUTION_STAGES[0]

  const iconSize = sizeClasses[size].icon

  // Get the icon component for the current evolution stage
  const iconName = stageInfo.emoji
  const AvatarIcon = ICON_MAP[iconName] || Circle
  const CharacterIcon = CHARACTER_BASES[baseCharacter].icon

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Glow effect for higher levels */}
      {evolutionStage >= 6 && (
        <div
          className={cn(
            'absolute inset-0 blur-xl opacity-20 rounded-lg',
            evolutionStage >= 9 ? 'bg-warning' : 'bg-primary'
          )}
        />
      )}

      {/* Main avatar container */}
      <div
        className={cn(
          sizeClasses[size].container,
          'relative flex items-center justify-center bg-card border-2 rounded-lg transition-transform',
          evolutionStage >= 9 ? 'border-warning' : evolutionStage >= 6 ? 'border-primary' : 'border-border',
          showMood && moodClasses[currentMood]
        )}
      >
        {/* Avatar icon */}
        <div className="relative">
          <AvatarIcon
            size={iconSize}
            className={cn(
              evolutionStage >= 9 ? 'text-warning' : evolutionStage >= 6 ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          {/* Character accent for higher evolutions */}
          {evolutionStage >= 9 && (
            <CharacterIcon
              size={iconSize * 0.35}
              className={cn('absolute -bottom-1 -right-1', CHARACTER_BASES[baseCharacter].color)}
            />
          )}
        </div>
      </div>

      {/* Reaction bubble */}
      {recentReaction && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card px-3 py-1 text-sm whitespace-nowrap border border-border rounded animate-in fade-in zoom-in-90 duration-200">
          {recentReaction}
        </div>
      )}

      {/* Stage name and level */}
      {showLevel && (
        <div className="mt-2 text-center">
          <p className="text-sm text-primary font-semibold">
            {stageName}
          </p>
          {level && (
            <p className="text-xs text-muted-foreground">
              {LABELS.level} {level}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
