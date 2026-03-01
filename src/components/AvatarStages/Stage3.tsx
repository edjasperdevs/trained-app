/**
 * Stage 3: Conditioned
 * Athletic build emerging
 * Ranks 8-11
 */

interface StageProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_MAP = {
  sm: 64,
  md: 96,
  lg: 128,
  xl: 192,
}

export function Stage3({ size = 'md', className = '' }: StageProps) {
  const dimension = SIZE_MAP[size]

  return (
    <svg
      viewBox="0 0 100 100"
      width={dimension}
      height={dimension}
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Conditioned avatar - Stage 3"
    >
      {/* Head */}
      <circle cx="50" cy="16" r="12" />
      {/* Neck */}
      <rect x="46" y="28" width="8" height="4" rx="1" />
      {/* Shoulders - broader */}
      <path d="M32 34 L68 34 L64 42 L36 42 Z" />
      {/* Chest - V-taper emerging */}
      <path d="M36 42 L64 42 L60 56 L40 56 Z" />
      {/* Core */}
      <rect x="42" y="56" width="16" height="10" rx="2" />
      {/* Arms - more muscular */}
      <ellipse cx="26" cy="40" rx="8" ry="6" />
      <ellipse cx="74" cy="40" rx="8" ry="6" />
      {/* Forearms */}
      <rect x="18" y="44" width="6" height="14" rx="3" />
      <rect x="76" y="44" width="6" height="14" rx="3" />
      {/* Legs - athletic */}
      <path d="M40 66 L44 66 L46 90 L38 90 Z" />
      <path d="M56 66 L60 66 L62 90 L54 90 Z" />
    </svg>
  )
}
