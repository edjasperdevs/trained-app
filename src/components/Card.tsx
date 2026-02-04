import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useTheme } from '@/themes'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
  variant?: 'default' | 'elevated' | 'subtle'
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
  variant = 'default'
}: CardProps) {
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

  const Component = onClick ? motion.button : motion.div

  // Theme-aware variant classes
  const getVariantClasses = () => {
    if (isTrained) {
      switch (variant) {
        case 'elevated':
          return 'bg-surface-elevated border border-border'
        case 'subtle':
          return 'bg-surface/50 border border-border/50'
        default:
          return 'bg-surface border border-border'
      }
    } else {
      // GYG uses glassmorphism
      switch (variant) {
        case 'elevated':
          return 'glass-elevated'
        case 'subtle':
          return 'glass-subtle'
        default:
          return 'glass'
      }
    }
  }

  const borderRadius = isTrained ? 'rounded-md' : 'rounded-2xl'

  return (
    <Component
      onClick={onClick}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`
        ${getVariantClasses()}
        ${borderRadius}
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
