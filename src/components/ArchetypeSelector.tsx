/**
 * ArchetypeSelector Component
 *
 * Renders all 5 archetype options with premium gating.
 * Bro is always selectable; other archetypes require premium.
 */

import type { Archetype } from '@/design/constants'
import { ARCHETYPE_INFO } from '@/design/constants'
import { ArchetypeCard } from './ArchetypeCard'

interface ArchetypeSelectorProps {
  selected: Archetype
  isPremium: boolean
  onSelect: (archetype: Archetype) => void
}

const ARCHETYPE_ORDER: Archetype[] = ['bro', 'himbo', 'brute', 'pup', 'bull']

export function ArchetypeSelector({ selected, isPremium, onSelect }: ArchetypeSelectorProps) {
  return (
    <div className="space-y-3">
      {ARCHETYPE_ORDER.map((archetype) => {
        const info = ARCHETYPE_INFO[archetype]
        const isLocked = info.isPremium && !isPremium

        return (
          <ArchetypeCard
            key={archetype}
            archetype={archetype}
            selected={selected === archetype}
            locked={isLocked}
            onSelect={() => !isLocked && onSelect(archetype)}
          />
        )
      })}
    </div>
  )
}
