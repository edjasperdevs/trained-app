// Gamify Your Gains (RPG) theme configuration

import type { AppTheme } from './types'

export const gygTheme: AppTheme = {
  id: 'gyg',
  name: 'Gamify Your Gains',

  labels: {
    xp: 'XP',
    xpFull: 'Experience Points',
    level: 'Level',
    streak: 'Streak',
    streakSaver: 'Streak Saver',
    dailyQuests: 'Daily Quests',
    checkIn: 'Daily Check-In',
    weeklyXPClaim: 'Weekly XP Claim',
    achievements: 'Achievement Badges',
    reminders: 'Smart Reminders',
    motivationalMessages: 'Motivational Messages',
    coach: 'Coach',
    client: 'Client',
    coachDashboard: 'Coach Dashboard',
    macroAdherence: 'Macro Adherence',
    activityFeed: 'Activity Feed',
    minimalWorkout: 'Quick Workout',
    neverMissTwice: 'Never Miss Twice',
    avatarClasses: {
      dominant: 'Warrior',
      switch: 'Mage',
      submissive: 'Rogue',
    },
  },

  avatarStages: [
    'Egg',
    'Hatchling',
    'Juvenile',
    'Adolescent',
    'Young Adult',
    'Adult',
    'Mature',
    'Elder',
    'Ancient',
    'Mythic',
    'Legendary',
    'Transcendent',
    'Ascended',
  ],

  tokens: {
    // Core backgrounds - original GYG dark theme
    colorBackground: '#0a0a0a',
    colorSurface: '#111111',
    colorSurfaceElevated: '#1a1a1a',
    colorBorder: 'rgba(255, 255, 255, 0.1)',

    // Primary accent - Gold/Amber
    colorPrimary: '#F59E0B',
    colorPrimaryHover: '#D97706',
    colorPrimaryMuted: 'rgba(245, 158, 11, 0.15)',

    // Secondary - Army Green
    colorSecondary: '#5C6B4A',
    colorSecondaryHover: '#6B7A59',

    // Text
    colorTextPrimary: '#ffffff',
    colorTextSecondary: 'rgba(255, 255, 255, 0.6)',
    colorTextAccent: '#F59E0B',
    colorTextOnPrimary: '#000000',

    // Status
    colorSuccess: '#22c55e',
    colorWarning: '#D97706',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',

    // XP/Progress
    colorXPBar: '#F59E0B',
    colorXPBarBg: 'rgba(255, 255, 255, 0.1)',
    colorStreakActive: '#F59E0B',
    colorStreakInactive: 'rgba(255, 255, 255, 0.1)',

    // Typography
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', monospace",

    // Sizing - more rounded for RPG feel
    borderRadius: '8px',
    borderRadiusLg: '12px',
    borderRadiusCard: '16px',
    spacingUnit: '4px',

    // Shadows - glowy for RPG
    shadowCard: '0 4px 16px rgba(0,0,0,0.3)',
    shadowModal: '0 8px 32px rgba(0,0,0,0.5)',
    shadowGlow: '0 0 20px rgba(245, 158, 11, 0.3)',
  },

  standingOrders: {
    discipline: [
      'Every rep brings you closer to your goals.',
      'Champions are made when no one is watching.',
      'Your future self will thank you.',
      'Small steps lead to big gains.',
      'The grind never stops.',
      'Push through the plateau.',
      'Stronger every day.',
      'No shortcuts to greatness.',
      'Trust the process.',
      'Victory loves preparation.',
    ],
    selfCare: [
      'Rest is part of the training.',
      'Fuel your body right.',
      'Recovery is where growth happens.',
      'Sleep is a superpower.',
      'Hydration is key.',
      'Listen to your body.',
      'Balance builds longevity.',
      'Take care of your temple.',
    ],
    growth: [
      'Progress, not perfection.',
      'Every day is a new opportunity.',
      'Learn from yesterday, improve today.',
      "Setbacks are setups for comebacks.",
      "You're stronger than you think.",
      'Embrace the challenge.',
      'Growth happens outside your comfort zone.',
      'Keep moving forward.',
    ],
    reward: [
      "You've earned this.",
      'Hard work pays off.',
      'Celebrate your wins.',
      'Level up achieved.',
      'Your dedication shows.',
      'Keep stacking those gains.',
    ],
  },
}
