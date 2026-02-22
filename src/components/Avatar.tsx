import { useAvatarStore } from '@/stores'
import { LABELS } from '@/design/constants'
import { cn } from '@/lib/cn'
import { Sword, Wand2, Moon, LucideIcon } from 'lucide-react'

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

// Character base icon representations
const CHARACTER_BASES: Record<string, { icon: LucideIcon; color: string }> = {
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
  const { currentMood, baseCharacter, recentReaction } = useAvatarStore()

  const iconSize = sizeClasses[size].icon
  const CharacterIcon = CHARACTER_BASES[baseCharacter]?.icon || Sword

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
          className={CHARACTER_BASES[baseCharacter]?.color || 'text-muted-foreground'}
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
