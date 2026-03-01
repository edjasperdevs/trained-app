/**
 * Stage 4: Tempered
 * Muscular definition
 * Ranks 12-14
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

export function Stage4({ size = 'md', className = '' }: StageProps) {
  const dimension = SIZE_MAP[size]

  return (
    <svg
      viewBox="0 0 100 100"
      width={dimension}
      height={dimension}
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Tempered avatar - Stage 4"
    >
      {/* Head */}
      <circle cx="50" cy="14" r="12" />
      {/* Neck - thicker */}
      <rect x="44" y="26" width="12" height="5" rx="2" />
      {/* Traps */}
      <path d="M38 28 L44 26 L44 32 L38 34 Z" />
      <path d="M62 28 L56 26 L56 32 L62 34 Z" />
      {/* Shoulders - broad and round */}
      <ellipse cx="28" cy="36" rx="10" ry="8" />
      <ellipse cx="72" cy="36" rx="10" ry="8" />
      {/* Chest - developed */}
      <path d="M34 32 L66 32 L66 42 L62 50 L38 50 L34 42 Z" />
      {/* Core - defined */}
      <rect x="40" y="50" width="20" height="14" rx="3" />
      {/* Arms - muscular */}
      <ellipse cx="22" cy="44" rx="7" ry="10" />
      <ellipse cx="78" cy="44" rx="7" ry="10" />
      {/* Forearms */}
      <rect x="17" y="52" width="8" height="14" rx="4" />
      <rect x="75" y="52" width="8" height="14" rx="4" />
      {/* Legs - powerful */}
      <path d="M38 64 L46 64 L48 90 L36 90 Z" />
      <path d="M54 64 L62 64 L64 90 L52 90 Z" />
    </svg>
  )
}
