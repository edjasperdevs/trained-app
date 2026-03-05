import { useDPStore } from '@/stores'
import { LABELS } from '@/design/constants'
import { ProgressBar } from './ProgressBar'
import { CountUp } from './CountUp'
import { cn } from '@/lib/cn'

interface DPDisplayProps {
  compact?: boolean
}

export function DPDisplay({ compact = false }: DPDisplayProps) {
  const totalDP = useDPStore((s) => s.totalDP)
  const currentRank = useDPStore((s) => s.currentRank)
  const rankInfo = useDPStore((s) => s.getRankInfo)()

  const isMaxRank = currentRank >= 15

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-primary font-bold font-mono">
          {LABELS.level} {currentRank}
        </span>
        <div className="w-20">
          <ProgressBar progress={rankInfo.progress * 100} size="sm" color="gradient" />
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      {/* Rank name */}
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {rankInfo.name}
      </p>

      {/* Rank number */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="text-2xl font-bold text-primary font-display">
          {LABELS.level} {currentRank}
        </span>
        {isMaxRank && (
          <span className="text-xs bg-primary-muted text-primary px-2 py-0.5 font-semibold rounded">
            MAX
          </span>
        )}
      </div>

      {/* Total DP */}
      <p className={cn('font-mono text-primary text-sm mb-3')}>
        <CountUp to={totalDP} /> {LABELS.dp}
      </p>

      {/* Progress Bar */}
      <div className="mb-2">
        <ProgressBar
          progress={rankInfo.progress * 100}
          color="gradient"
          size="lg"
        />
      </div>

      {/* DP to next rank */}
      {isMaxRank ? (
        <p className="text-xs text-primary font-mono font-semibold">MAX RANK</p>
      ) : (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="font-mono">{Math.round(rankInfo.progress * 100)}%</span>
          <span className="font-mono">{rankInfo.dpForNext.toLocaleString()} {LABELS.dp} to next rank</span>
        </div>
      )}
    </div>
  )
}
