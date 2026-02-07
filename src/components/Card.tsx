import { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const cardVariants = cva(
  'rounded-md transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'bg-card border border-border',
        elevated: 'bg-muted border border-border shadow-card',
        subtle: 'bg-card/50 border border-border/50',
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
  const classes = cn(
    cardVariants({ variant, padding }),
    hover && 'card-hover cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5 transition-transform',
    onClick && 'text-left w-full active:scale-[0.98] transition-transform',
    className
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        role={role}
        aria-checked={ariaChecked}
        aria-label={ariaLabel}
        aria-disabled={ariaDisabled}
        className={classes}
      >
        {children}
      </button>
    )
  }

  return (
    <div
      role={role}
      aria-checked={ariaChecked}
      aria-label={ariaLabel}
      aria-disabled={ariaDisabled}
      className={classes}
    >
      {children}
    </div>
  )
}
