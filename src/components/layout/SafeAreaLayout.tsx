import { ReactNode } from 'react'

interface SafeAreaLayoutProps {
  children: ReactNode
  className?: string
}

/**
 * SafeAreaLayout component that ensures content respects device safe areas
 * (notch, dynamic island, home indicator, etc.)
 *
 * Use this wrapper for all full-screen content to prevent UI from being
 * covered by system UI elements.
 */
export function SafeAreaLayout({ children, className = '' }: SafeAreaLayoutProps) {
  return (
    <div className={`min-h-screen pt-safe pb-safe ${className}`}>
      {children}
    </div>
  )
}
