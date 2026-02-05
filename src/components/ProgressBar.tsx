import { motion } from 'motion/react'
import { useTheme } from '@/themes'

interface ProgressBarProps {
  progress: number
  maxProgress?: number
  showLabel?: boolean
  label?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'gold' | 'green' | 'cyan' | 'purple' | 'gradient'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
}

export function ProgressBar({
  progress,
  maxProgress = 100,
  showLabel = false,
  label,
  color = 'primary',
  size = 'md',
  animate = true
}: ProgressBarProps) {
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const percentage = Math.min((progress / maxProgress) * 100, 100)

  // Map legacy colors to theme colors
  const getColorClass = () => {
    switch (color) {
      case 'primary':
      case 'gold':
      case 'cyan':
        return 'bg-xp-bar'
      case 'secondary':
      case 'green':
      case 'purple':
        return 'bg-secondary'
      case 'success':
        return 'bg-success'
      case 'warning':
        return 'bg-warning'
      case 'gradient':
        return isTrained
          ? 'bg-gradient-to-r from-primary to-primary-hover'
          : 'bg-gradient-to-r from-primary to-secondary'
      default:
        return 'bg-xp-bar'
    }
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4'  // Featured size for home screen rank bar
  }

  const borderRadius = isTrained ? 'rounded-sm' : 'rounded-full'

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-text-secondary mb-1.5">
          <span>{label}</span>
          <span className="font-mono">{Math.round(progress)}/{maxProgress}</span>
        </div>
      )}
      <div className={`w-full bg-xp-bar-bg ${borderRadius} overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`h-full ${borderRadius} ${getColorClass()}`}
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
