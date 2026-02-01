import { motion } from 'framer-motion'
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

const variantClasses = {
  primary: 'bg-accent-primary text-bg-primary hover:bg-accent-primary/90 glow-cyan',
  secondary: 'bg-accent-secondary text-white hover:bg-accent-secondary/90 glow-purple',
  ghost: 'bg-transparent text-gray-300 hover:bg-bg-card border border-gray-700',
  danger: 'bg-accent-danger text-white hover:bg-accent-danger/90'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg'
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
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        rounded-lg font-semibold transition-all duration-200
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
