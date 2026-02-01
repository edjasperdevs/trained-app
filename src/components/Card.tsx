import { motion } from 'framer-motion'
import { ReactNode } from 'react'

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

const variantClasses = {
  default: 'glass',
  elevated: 'glass-elevated',
  subtle: 'glass-subtle'
}

export function Card({
  children,
  className = '',
  onClick,
  hover = false,
  padding = 'md',
  variant = 'default'
}: CardProps) {
  const Component = onClick ? motion.button : motion.div

  return (
    <Component
      onClick={onClick}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`
        ${variantClasses[variant]} rounded-2xl
        ${paddingClasses[padding]}
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${onClick ? 'text-left w-full' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  )
}
