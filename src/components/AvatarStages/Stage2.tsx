/**
 * Stage 2: Disciplined
 * Slightly more defined, shoulders visible
 * Ranks 4-7
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

export function Stage2({ size = 'md', className = '' }: StageProps) {
  const dimension = SIZE_MAP[size]

  return (
    <svg
      viewBox="0 0 100 100"
      width={dimension}
      height={dimension}
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Disciplined avatar - Stage 2"
    >
      {/* Head - slightly larger */}
      <circle cx="50" cy="18" r="11" />
      {/* Shoulders - visible trapezoid shape */}
      <path d="M38 30 L62 30 L58 38 L42 38 Z" />
      {/* Torso - slightly wider */}
      <rect x="44" y="38" width="12" height="24" rx="2" />
      {/* Arms - slightly thicker */}
      <rect x="28" y="32" width="16" height="7" rx="3" />
      <rect x="56" y="32" width="16" height="7" rx="3" />
      {/* Legs - slightly wider */}
      <rect x="42" y="64" width="7" height="26" rx="2" />
      <rect x="51" y="64" width="7" height="26" rx="2" />
    </svg>
  )
}
