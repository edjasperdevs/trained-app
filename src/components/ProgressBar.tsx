import { motion } from 'framer-motion'

interface ProgressBarProps {
  progress: number
  maxProgress?: number
  showLabel?: boolean
  label?: string
  color?: 'gold' | 'green' | 'cyan' | 'purple' | 'gradient' | 'success'
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

const colorClasses = {
  gold: 'bg-accent-primary',
  green: 'bg-accent-secondary',
  cyan: 'bg-accent-primary',      // Map legacy cyan to gold
  purple: 'bg-accent-secondary',  // Map legacy purple to green
  gradient: 'progress-gradient',
  success: 'bg-accent-success'
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3'
}

export function ProgressBar({
  progress,
  maxProgress = 100,
  showLabel = false,
  label,
  color = 'gradient',
  size = 'md',
  animate = true
}: ProgressBarProps) {
  const percentage = Math.min((progress / maxProgress) * 100, 100)

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{label}</span>
          <span className="font-digital">{Math.round(progress)}/{maxProgress}</span>
        </div>
      )}
      <div className={`w-full bg-white/5 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`h-full rounded-full ${colorClasses[color]}`}
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
