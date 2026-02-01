import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/workouts', label: 'Workouts', icon: '🏋️' },
  { path: '/macros', label: 'Macros', icon: '🍽️' },
  { path: '/avatar', label: 'Avatar', icon: '👤' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export function Navigation() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-lg border-t border-gray-800 safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center w-16 h-full relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 w-8 h-1 bg-accent-primary rounded-full"
                />
              )}
              <span className="text-xl">{item.icon}</span>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'text-accent-primary' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
