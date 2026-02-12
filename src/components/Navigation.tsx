import { NavLink, useLocation } from 'react-router-dom'
import { Home, Dumbbell, UtensilsCrossed, User, Settings, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

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

  // Hide navigation on standalone routes
  if (location.pathname === '/coach') return null

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
            >
              {isActive && (
                <div className="absolute -top-0.5 h-0.5 bg-primary w-10 rounded-full" />
              )}
              <item.icon
                size={22}
                strokeWidth={isActive ? 2 : 1.5}
                className={cn(
                  'transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span className={cn(
                'text-[10px] mt-0.5 transition-colors duration-150 font-medium',
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
