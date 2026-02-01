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
  primary: 'bg-accent-primary text-black hover:bg-accent-primary/90 glow-gold font-bold',
  secondary: 'bg-accent-secondary text-white hover:bg-accent-secondary/90 glow-green',
  ghost: 'glass text-gray-300 hover:bg-white/10',
  danger: 'bg-accent-danger text-white hover:bg-accent-danger/90'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
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
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        rounded-xl font-semibold transition-all duration-150
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
