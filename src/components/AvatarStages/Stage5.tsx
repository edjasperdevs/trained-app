/**
 * Stage 5: Master
 * Full impressive silhouette - the pinnacle
 * Rank 15
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

export function Stage5({ size = 'md', className = '' }: StageProps) {
  const dimension = SIZE_MAP[size]

  return (
    <svg
      viewBox="0 0 100 100"
      width={dimension}
      height={dimension}
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Master avatar - Stage 5"
    >
      {/* Head */}
      <circle cx="50" cy="12" r="11" />
      {/* Neck - thick */}
      <rect x="42" y="23" width="16" height="6" rx="2" />
      {/* Traps - prominent */}
      <path d="M34 26 L42 23 L42 32 L32 36 Z" />
      <path d="M66 26 L58 23 L58 32 L68 36 Z" />
      {/* Shoulders - massive and round */}
      <ellipse cx="24" cy="36" rx="12" ry="10" />
      <ellipse cx="76" cy="36" rx="12" ry="10" />
      {/* Chest - fully developed with definition */}
      <path d="M30 30 L70 30 L70 44 L66 54 L34 54 L30 44 Z" />
      {/* Chest separation line */}
      <line x1="50" y1="34" x2="50" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      {/* Core - chiseled */}
      <rect x="38" y="54" width="24" height="12" rx="3" />
      {/* Ab lines */}
      <line x1="50" y1="54" x2="50" y2="66" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      {/* Arms - massive */}
      <ellipse cx="18" cy="44" rx="9" ry="12" />
      <ellipse cx="82" cy="44" rx="9" ry="12" />
      {/* Forearms - thick */}
      <rect x="12" y="54" width="10" height="16" rx="5" />
      <rect x="78" y="54" width="10" height="16" rx="5" />
      {/* Legs - powerful pillars */}
      <path d="M36 66 L48 66 L50 92 L34 92 Z" />
      <path d="M52 66 L64 66 L66 92 L50 92 Z" />
    </svg>
  )
}
