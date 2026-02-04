// Theme provider, context, and hook

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { AppTheme, ThemeId, DesignTokens } from './types'
import { trainedTheme } from './trained'
import { gygTheme } from './gyg'

// Export types
export type { AppTheme, ThemeId, ThemeLabels, DesignTokens, StandingOrderCategories } from './types'

// Theme registry
const themes: Record<ThemeId, AppTheme> = {
  trained: trainedTheme,
  gyg: gygTheme,
}

// Get default theme from env or fallback to 'trained'
const getDefaultTheme = (): ThemeId => {
  const envTheme = import.meta.env.VITE_DEFAULT_THEME as string | undefined
  if (envTheme === 'gyg') return 'gyg'
  return 'trained'
}

// Local storage key
const THEME_STORAGE_KEY = 'app-theme'

// Get initial theme from localStorage or default
const getInitialTheme = (): ThemeId => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null
    if (stored && themes[stored]) {
      return stored
    }
  }
  return getDefaultTheme()
}

// Context type
interface ThemeContextValue {
  theme: AppTheme
  themeId: ThemeId
  setTheme: (id: ThemeId) => void
  toggleTheme: () => void
}

// Create context
const ThemeContext = createContext<ThemeContextValue | null>(null)

// CSS variable injection
const injectCSSVariables = (tokens: DesignTokens) => {
  const root = document.documentElement

  // Core colors
  root.style.setProperty('--color-background', tokens.colorBackground)
  root.style.setProperty('--color-surface', tokens.colorSurface)
  root.style.setProperty('--color-surface-elevated', tokens.colorSurfaceElevated)
  root.style.setProperty('--color-border', tokens.colorBorder)

  // Primary
  root.style.setProperty('--color-primary', tokens.colorPrimary)
  root.style.setProperty('--color-primary-hover', tokens.colorPrimaryHover)
  root.style.setProperty('--color-primary-muted', tokens.colorPrimaryMuted)

  // Secondary
  root.style.setProperty('--color-secondary', tokens.colorSecondary)
  root.style.setProperty('--color-secondary-hover', tokens.colorSecondaryHover)

  // Text
  root.style.setProperty('--color-text-primary', tokens.colorTextPrimary)
  root.style.setProperty('--color-text-secondary', tokens.colorTextSecondary)
  root.style.setProperty('--color-text-accent', tokens.colorTextAccent)
  root.style.setProperty('--color-text-on-primary', tokens.colorTextOnPrimary)

  // Status
  root.style.setProperty('--color-success', tokens.colorSuccess)
  root.style.setProperty('--color-warning', tokens.colorWarning)
  root.style.setProperty('--color-error', tokens.colorError)
  root.style.setProperty('--color-info', tokens.colorInfo)

  // XP/Progress
  root.style.setProperty('--color-xp-bar', tokens.colorXPBar)
  root.style.setProperty('--color-xp-bar-bg', tokens.colorXPBarBg)
  root.style.setProperty('--color-streak-active', tokens.colorStreakActive)
  root.style.setProperty('--color-streak-inactive', tokens.colorStreakInactive)

  // Typography
  root.style.setProperty('--font-heading', tokens.fontHeading)
  root.style.setProperty('--font-body', tokens.fontBody)
  root.style.setProperty('--font-mono', tokens.fontMono)

  // Sizing
  root.style.setProperty('--border-radius', tokens.borderRadius)
  root.style.setProperty('--border-radius-lg', tokens.borderRadiusLg)
  root.style.setProperty('--border-radius-card', tokens.borderRadiusCard)
  root.style.setProperty('--spacing-unit', tokens.spacingUnit)

  // Shadows
  root.style.setProperty('--shadow-card', tokens.shadowCard)
  root.style.setProperty('--shadow-modal', tokens.shadowModal)
  root.style.setProperty('--shadow-glow', tokens.shadowGlow)
}

// Provider component
interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeId
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<ThemeId>(() => defaultTheme || getInitialTheme())
  const theme = themes[themeId]

  // Inject CSS variables when theme changes
  useEffect(() => {
    injectCSSVariables(theme.tokens)
    localStorage.setItem(THEME_STORAGE_KEY, themeId)

    // Also update body class for theme-specific styling
    document.body.classList.remove('theme-trained', 'theme-gyg')
    document.body.classList.add(`theme-${themeId}`)
  }, [theme, themeId])

  const setTheme = useCallback((id: ThemeId) => {
    if (themes[id]) {
      setThemeId(id)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeId((current) => (current === 'trained' ? 'gyg' : 'trained'))
  }, [])

  const value: ThemeContextValue = {
    theme,
    themeId,
    setTheme,
    toggleTheme,
  }

  return React.createElement(ThemeContext.Provider, { value }, children)
}

// Hook to access theme
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Utility: Get a random standing order based on context
export function getStandingOrder(
  theme: AppTheme,
  context: 'training' | 'rest' | 'missed' | 'claim' | 'default' = 'default'
): string {
  const { standingOrders } = theme
  let pool: string[]

  switch (context) {
    case 'training':
      pool = standingOrders.discipline
      break
    case 'rest':
      pool = [...standingOrders.selfCare, ...standingOrders.growth]
      break
    case 'missed':
      pool = standingOrders.growth
      break
    case 'claim':
      pool = standingOrders.reward
      break
    default:
      pool = [
        ...standingOrders.discipline,
        ...standingOrders.selfCare,
        ...standingOrders.growth,
        ...standingOrders.reward,
      ]
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

// Export themes for direct access if needed
export { trainedTheme, gygTheme, themes }
