/**
 * Stage 1: Initiate
 * Simple thin figure outline - the beginning of the journey
 * Ranks 1-3
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

export function Stage1({ size = 'md', className = '' }: StageProps) {
  const dimension = SIZE_MAP[size]

  return (
    <svg
      viewBox="0 0 100 100"
      width={dimension}
      height={dimension}
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Initiate avatar - Stage 1"
    >
      {/* Head - small circle */}
      <circle cx="50" cy="18" r="10" />
      {/* Body - thin rectangle */}
      <rect x="46" y="30" width="8" height="30" rx="2" />
      {/* Arms - thin lines */}
      <rect x="32" y="35" width="14" height="5" rx="2" />
      <rect x="54" y="35" width="14" height="5" rx="2" />
      {/* Legs - thin rectangles */}
      <rect x="43" y="62" width="6" height="28" rx="2" />
      <rect x="51" y="62" width="6" height="28" rx="2" />
    </svg>
  )
}
