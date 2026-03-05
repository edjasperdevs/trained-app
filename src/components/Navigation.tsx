import { NavLink, useLocation } from 'react-router-dom'
import { Home, Dumbbell, Flame, User, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { motion } from 'framer-motion'
import { haptics } from '@/lib/haptics'

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/workouts', label: 'Workout', icon: Dumbbell },
  { path: '/macros', label: 'Fuel', icon: Flame },
  { path: '/avatar', label: 'Profile', icon: User },
]

export function Navigation() {
  const location = useLocation()

  return (
    <nav aria-label="Main navigation" data-testid="navigation" className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path

          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className="flex flex-col items-center justify-center w-16 h-full relative"
              onClick={() => {
                if (!isActive) {
                  haptics.light()
                }
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-[1px] h-[3px] bg-primary w-10 rounded-full"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="flex items-center justify-center"
              >
                <item.icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    'transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              </motion.div>
              <span className={cn(
                'text-[10px] mt-1 transition-colors duration-200 font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
