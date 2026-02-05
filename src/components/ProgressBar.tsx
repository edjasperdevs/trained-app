import { motion } from 'motion/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const progressBarVariants = cva(
  'h-full rounded-sm',
  {
    variants: {
      color: {
        primary: 'bg-xp-bar',
        secondary: 'bg-secondary',
        success: 'bg-success',
        warning: 'bg-warning',
        gradient: 'bg-gradient-to-r from-primary to-primary-hover',
      },
    },
    defaultVariants: {
      color: 'primary',
    },
  }
)

const progressTrackVariants = cva(
  'w-full bg-xp-bar-bg rounded-sm overflow-hidden',
  {
    variants: {
      size: {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
        xl: 'h-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

interface ProgressBarProps
  extends VariantProps<typeof progressBarVariants>,
    VariantProps<typeof progressTrackVariants> {
  progress: number
  maxProgress?: number
  showLabel?: boolean
  label?: string
  animate?: boolean
}

export function ProgressBar({
  progress,
  maxProgress = 100,
  showLabel = false,
  label,
  color = 'primary',
  size = 'md',
  animate = true,
}: ProgressBarProps) {
  const percentage = Math.min((progress / maxProgress) * 100, 100)

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-text-secondary mb-1.5">
          <span>{label}</span>
          <span className="font-mono">{Math.round(progress)}/{maxProgress}</span>
        </div>
      )}
      <div className={cn(progressTrackVariants({ size }))}>
        <motion.div
          className={cn(progressBarVariants({ color }))}
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
