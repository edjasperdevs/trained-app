import { motion } from 'motion/react'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
  variant?: 'default' | 'elevated' | 'subtle'
  role?: string
  'aria-checked'?: boolean
  'aria-label'?: string
  'aria-disabled'?: boolean
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
}

export function Card({
  children,
  className = '',
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

  const getVariantClasses = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-surface-elevated border border-border'
      case 'subtle':
        return 'bg-surface/50 border border-border/50'
      default:
        return 'bg-surface border border-border'
    }
  }

  return (
    <Component
      onClick={onClick}
      role={role}
      aria-checked={ariaChecked}
      aria-label={ariaLabel}
      aria-disabled={ariaDisabled}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`
        ${getVariantClasses()}
        rounded-md
        ${paddingClasses[padding]}
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${onClick ? 'text-left w-full' : ''}
        transition-colors duration-150
        ${className}
      `}
    >
      {children}
    </Component>
  )
}
