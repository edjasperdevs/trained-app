import { motion } from 'motion/react'
import { ReactNode } from 'react'

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
  const getVariantClasses = () => {
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
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3.5 text-base'
  }

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
        rounded
        transition-all duration-150
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
