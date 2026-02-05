import { motion } from 'motion/react'
import { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const buttonVariants = cva(
  'rounded transition-all duration-150 flex items-center justify-center gap-2',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-text-on-primary hover:bg-primary-hover font-heading uppercase tracking-widest font-semibold',
        secondary:
          'bg-transparent border border-border text-text-primary hover:bg-secondary hover:border-secondary',
        ghost:
          'bg-surface text-text-primary hover:bg-surface-elevated border border-border',
        danger: 'bg-error text-text-on-primary hover:opacity-90',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-6 py-3.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: ReactNode
  onClick?: () => void
  fullWidth?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  className,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      className={cn(
        buttonVariants({ variant, size }),
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </motion.button>
  )
}
