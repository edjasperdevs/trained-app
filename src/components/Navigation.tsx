import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Dumbbell, UtensilsCrossed, User, Settings, LucideIcon } from 'lucide-react'
import { useTheme } from '@/themes'

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/workouts', label: 'Workouts', icon: Dumbbell },
  { path: '/macros', label: 'Macros', icon: UtensilsCrossed },
  { path: '/avatar', label: 'Avatar', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function Navigation() {
  const location = useLocation()
  const { themeId } = useTheme()
  const isTrained = themeId === 'trained'

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path

          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center w-16 h-full relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className={`absolute -top-0.5 h-0.5 bg-primary ${isTrained ? 'w-10' : 'w-8 rounded-full shadow-lg shadow-primary/30'}`}
                />
              )}
              <motion.div
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={isActive ? 'text-primary' : 'text-text-secondary'}
                />
              </motion.div>
              <span className={`text-[10px] mt-0.5 transition-colors duration-150 tracking-wider ${
                isTrained ? 'uppercase font-medium' : 'font-medium'
              } ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
