import { Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import { springs } from '@/lib/animations'

// Laurel wreath SVG component
function LaurelLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor">
      <path d="M8 16c-2-3-3-7-2-11 1 3 3 6 5 8-1-3-1-7 1-10 0 4 1 7 4 9-2-3-2-6-1-9 1 3 3 5 5 7"
            strokeWidth="0" opacity="0.9"/>
      <path d="M24 16c2-3 3-7 2-11-1 3-3 6-5 8 1-3 1-7-1-10 0 4-1 7-4 9 2-3 2-6 1-9-1 3-3 5-5 7"
            strokeWidth="0" opacity="0.9"/>
      <circle cx="16" cy="28" r="2"/>
    </svg>
  )
}

interface AppHeaderProps {
  onNotificationPress?: () => void
}

export function AppHeader({ onNotificationPress }: AppHeaderProps) {
  return (
    <motion.div
      className="pt-14 pb-4 px-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
    >
      <div className="flex items-center justify-between">
        <LaurelLogo className="w-6 h-6 text-primary" />
        <span className="text-sm font-heading uppercase tracking-[0.2em] text-primary font-bold">
          WellTrained
        </span>
        <button
          onClick={onNotificationPress}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} className="text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  )
}
