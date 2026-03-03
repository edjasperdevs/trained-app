import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { motion } from 'framer-motion'
import { springs } from '@/lib/animations'

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
}: ProgressBarProps) {
  const percentage = Math.min((progress / maxProgress) * 100, 100)

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{label}</span>
          <span className="font-mono">{Math.round(progress)}/{maxProgress}</span>
        </div>
      )}
      <div className={cn(progressTrackVariants({ size }), 'relative overflow-hidden')}>
        <motion.div
          className={cn(progressBarVariants({ color }), 'absolute top-0 left-0 bottom-0')}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={springs.gentle}
        />
        {/* Glow effect at leading edge when progressing */}
        {percentage > 0 && percentage < 100 && (
          <motion.div
            className="absolute top-0 bottom-0 w-2 bg-white/30 blur-[2px]"
            initial={{ left: 0 }}
            animate={{ left: `calc(${percentage}% - 8px)` }}
            transition={springs.gentle}
          />
        )}
        {/* Subtle shimmer on full bar */}
        {percentage >= 100 && (
          <motion.div
            className="absolute top-0 right-0 bottom-0 w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
            initial={{ x: '-200%' }}
            animate={{ x: '300%' }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: 'linear',
              repeatDelay: 2
            }}
          />
        )}
      </div>
    </div>
  )
}
