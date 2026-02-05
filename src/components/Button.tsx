// TODO(phase-03): Refactor to use cn() + CVA variants
import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useTheme } from '@/themes'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
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
  className = ''
}: ButtonProps) {
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

  // Theme-aware variant classes
  const getVariantClasses = () => {
    if (isTrained) {
      switch (variant) {
        case 'primary':
          return 'bg-primary text-text-on-primary hover:bg-primary-hover font-heading uppercase tracking-widest font-semibold'
        case 'secondary':
          return 'bg-transparent border border-border text-text-primary hover:bg-secondary hover:border-secondary'
        case 'ghost':
          return 'bg-surface text-text-primary hover:bg-surface-elevated border border-border'
        case 'danger':
          return 'bg-error text-text-on-primary hover:opacity-90'
        default:
          return ''
      }
    } else {
      // GYG styling
      switch (variant) {
        case 'primary':
          return 'bg-primary text-text-on-primary hover:bg-primary-hover glow-primary font-bold'
        case 'secondary':
          return 'bg-secondary text-white hover:bg-secondary-hover'
        case 'ghost':
          return 'glass text-text-secondary hover:bg-white/10'
        case 'danger':
          return 'bg-error text-white hover:opacity-90'
        default:
          return ''
      }
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: isTrained ? 'px-6 py-3.5 text-base' : 'px-6 py-3 text-lg'
  }

  const borderRadius = isTrained ? 'rounded' : 'rounded-xl'

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      className={`
        ${getVariantClasses()}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${borderRadius}
        transition-all duration-150
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
