/**
 * ArchetypeCard Component
 *
 * Displays an individual archetype option with name, tagline, boosts,
 * premium badge, and locked state overlay.
 */

import { User, Dumbbell, Beef, Heart, TrendingUp, Lock, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Archetype } from '@/design/constants'
import { ARCHETYPE_INFO } from '@/design/constants'

interface ArchetypeCardProps {
  archetype: Archetype
  selected: boolean
  locked: boolean
  onSelect: () => void
}

// Map icon names from ARCHETYPE_INFO to lucide-react icons
const ICON_MAP: Record<string, LucideIcon> = {
  User,
  Dumbbell,
  Beef,
  Heart,
  TrendingUp,
}

export function ArchetypeCard({ archetype, selected, locked, onSelect }: ArchetypeCardProps) {
  const info = ARCHETYPE_INFO[archetype]
  const Icon = ICON_MAP[info.icon] || User

  return (
    <button
      onClick={onSelect}
      disabled={locked}
      className={cn(
        'w-full text-left p-4 rounded-xl border-2 bg-card transition-colors relative',
        selected && 'border-primary',
        locked && 'opacity-60 cursor-not-allowed',
        !selected && !locked && 'border-transparent hover:bg-muted/50'
      )}
    >
      {/* Lock overlay for locked archetypes */}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
          <Lock size={24} className="text-muted-foreground" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
          selected ? 'bg-primary/20' : 'bg-muted'
        )}>
          <Icon size={24} className={selected ? 'text-primary' : 'text-muted-foreground'} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-lg">{info.name}</p>
            {info.isPremium && (
              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
                Premium
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{info.tagline}</p>
          <p className="text-xs text-primary font-medium">{info.boosts}</p>
        </div>
      </div>
    </button>
  )
}
