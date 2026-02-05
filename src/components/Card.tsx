import { motion } from 'motion/react'
import { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const cardVariants = cva(
  'rounded-md transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'bg-surface border border-border',
        elevated: 'bg-surface-elevated border border-border shadow-card',
        subtle: 'bg-surface/50 border border-border/50',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
)

interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  role?: string
  'aria-checked'?: boolean
  'aria-label'?: string
  'aria-disabled'?: boolean
}

export function Card({
  children,
  className,
  onClick,
  hover = false,
  padding = 'md',
  variant = 'default',
  role,
  'aria-checked': ariaChecked,
  'aria-label': ariaLabel,
  'aria-disabled': ariaDisabled,
}: CardProps) {
  const Component = onClick ? motion.button : motion.div

  return (
    <Component
      onClick={onClick}
      role={role}
      aria-checked={ariaChecked}
      aria-label={ariaLabel}
      aria-disabled={ariaDisabled}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        cardVariants({ variant, padding }),
        hover && 'card-hover cursor-pointer',
        onClick && 'text-left w-full',
        className
      )}
    >
      {children}
    </Component>
  )
}
