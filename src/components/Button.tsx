import { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const buttonVariants = cva(
  'rounded transition-all duration-150 flex items-center justify-center gap-2',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-hover font-heading uppercase tracking-widest font-semibold',
        secondary:
          'bg-transparent border border-border text-foreground hover:bg-secondary hover:border-secondary',
        ghost:
          'bg-card text-foreground hover:bg-muted border border-border',
        danger: 'bg-error text-primary-foreground hover:opacity-90',
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
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        buttonVariants({ variant, size }),
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'active:scale-[0.97] hover:scale-[1.02] transition-transform',
        className
      )}
    >
      {children}
    </button>
  )
}
