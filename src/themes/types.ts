// Theme type definitions

export interface DesignTokens {
  // Core backgrounds
  colorBackground: string
  colorSurface: string
  colorSurfaceElevated: string
  colorBorder: string

  // Primary accent
  colorPrimary: string
  colorPrimaryHover: string
  colorPrimaryMuted: string

  // Secondary accent
  colorSecondary: string
  colorSecondaryHover: string

  // Text
  colorTextPrimary: string
  colorTextSecondary: string
  colorTextAccent: string
  colorTextOnPrimary: string

  // Status colors
  colorSuccess: string
  colorWarning: string
  colorError: string
  colorInfo: string

  // XP/Progress
  colorXPBar: string
  colorXPBarBg: string
  colorStreakActive: string
  colorStreakInactive: string

  // Typography
  fontHeading: string
  fontBody: string
  fontMono: string

  // Sizing
  borderRadius: string
  borderRadiusLg: string
  borderRadiusCard: string
  spacingUnit: string

  // Shadows
  shadowCard: string
  shadowModal: string
  shadowGlow: string
}

export interface ThemeLabels {
  xp: string
  xpFull: string
  level: string
  streak: string
  streakSaver: string
  dailyQuests: string
  checkIn: string
  weeklyXPClaim: string
  achievements: string
  reminders: string
  motivationalMessages: string
  coach: string
  client: string
  coachDashboard: string
  macroAdherence: string
  activityFeed: string
  minimalWorkout: string
  neverMissTwice: string
  avatarClasses: {
    warrior: string
    mage: string
    rogue: string
  }
}

export interface StandingOrderCategories {
  discipline: string[]
  selfCare: string[]
  growth: string[]
  reward: string[]
}

export interface AppTheme {
  id: 'trained' | 'gyg'
  name: string
  labels: ThemeLabels
  avatarStages: string[]
  tokens: DesignTokens
  standingOrders: StandingOrderCategories
}

export type ThemeId = 'trained' | 'gyg'
