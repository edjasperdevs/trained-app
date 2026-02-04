// Trained (BDSM/Discipline) theme configuration

import type { AppTheme } from './types'

export const trainedTheme: AppTheme = {
  id: 'trained',
  name: 'Trained',

  labels: {
    xp: 'DP',
    xpFull: 'Discipline Points',
    level: 'Rank',
    streak: 'Obedience Streak',
    streakSaver: 'Safe Word',
    dailyQuests: 'Daily Assignments',
    checkIn: 'Daily Report',
    weeklyXPClaim: 'Weekly Reward Ritual',
    achievements: 'Marks of Devotion',
    reminders: 'Protocol Reminders',
    motivationalMessages: 'Standing Orders',
    coach: 'Dom/me',
    client: 'Sub',
    coachDashboard: 'Dom/me Dashboard',
    macroAdherence: 'Protocol Compliance',
    activityFeed: 'Behavior Log',
    minimalWorkout: 'Quick Compliance',
    neverMissTwice: 'Safe Word Recovery',
    avatarClasses: {
      warrior: 'The Dom/me',
      mage: 'The Switch',
      rogue: 'The Sub',
    },
  },

  avatarStages: [
    'Uninitiated',
    'Novice',
    'Trainee',
    'Pledged',
    'Collared',
    'Devoted',
    'Bound',
    'Proven',
    'Mastered',
    'Dominant',
    'Sovereign',
    'Ascended',
    'Unchained',
  ],

  tokens: {
    // Core backgrounds
    colorBackground: '#0A0A0A',
    colorSurface: '#141414',
    colorSurfaceElevated: '#1C1C1C',
    colorBorder: '#2A2A2A',

    // Primary accent - deep blood red
    colorPrimary: '#8B1A1A',
    colorPrimaryHover: '#A52222',
    colorPrimaryMuted: 'rgba(139,26,26,0.15)',

    // Secondary - gunmetal
    colorSecondary: '#4A4A4A',
    colorSecondaryHover: '#5C5C5C',

    // Text
    colorTextPrimary: '#E8E8E8',
    colorTextSecondary: '#888888',
    colorTextAccent: '#8B1A1A',
    colorTextOnPrimary: '#FFFFFF',

    // Status
    colorSuccess: '#2D5A27',
    colorWarning: '#8B6914',
    colorError: '#8B1A1A',
    colorInfo: '#3A5A7A',

    // XP/Progress
    colorXPBar: '#8B1A1A',
    colorXPBarBg: '#1C1C1C',
    colorStreakActive: '#8B1A1A',
    colorStreakInactive: '#2A2A2A',

    // Typography
    fontHeading: "'Oswald', sans-serif",
    fontBody: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', monospace",

    // Sizing
    borderRadius: '4px',
    borderRadiusLg: '6px',
    borderRadiusCard: '6px',
    spacingUnit: '4px',

    // Shadows
    shadowCard: '0 2px 8px rgba(0,0,0,0.4)',
    shadowModal: '0 8px 32px rgba(0,0,0,0.6)',
    shadowGlow: '0 0 20px rgba(139,26,26,0.2)',
  },

  standingOrders: {
    discipline: [
      "The protocol doesn't care about your feelings. Follow it anyway.",
      'Discipline is choosing between what you want now and what you want most.',
      'You earned yesterday. Now earn today.',
      "Consistency isn't glamorous. It's powerful.",
      'Show up. Report in. Get it done.',
      'The only easy day was yesterday.',
      "Your rank isn't given. It's taken.",
      'You said you would. So do it.',
      'Obedience to the process is freedom from the outcome.',
      "You don't rise to the occasion. You fall to your training.",
      'The protocol works. Trust it.',
      'Structure creates freedom. Follow the structure.',
      'Every day you show up is a day you chose this.',
      "The grind doesn't stop. Neither do you.",
      'Discipline today. Freedom tomorrow.',
    ],
    selfCare: [
      'Taking care of yourself is taking care of something worth protecting.',
      "Sleep. Water. Protein. These aren't suggestions — they're standing orders.",
      "You can't serve from an empty tank. Maintain yourself first.",
      'Your body is the instrument. Keep it tuned.',
      'Dehydrated and exhausted is not a protocol. Fix it.',
      "Rest is earned, not defaulted to. But when it's earned — take it.",
      'Taking your vitamins is not optional. Neither is taking care of yourself.',
      'A well-maintained body performs better. In every context.',
      "Self-sufficiency is not the opposite of submission. It's the foundation of it.",
      'Eat. Sleep. Train. Report. Repeat.',
    ],
    growth: [
      "You don't have to be perfect. You have to be consistent.",
      'Progress over perfection. Always.',
      "You missed yesterday. That doesn't define today. Show up.",
      'Three out of four assignments completed is not failure. It is discipline.',
      'Perfection is not the goal. Growth is the goal.',
      "Weak moments pass. Regret doesn't.",
      "You're not here to be flawless. You're here to be better than yesterday.",
      "The protocol has room for mistakes. That's what Safe Words are for.",
      'Falling short is human. Getting back up is trained.',
      "Don't compare your protocol to anyone else's. Run your own.",
    ],
    reward: [
      "You've been putting in the work. Sunday's coming.",
      "Delayed gratification hits different when you've earned it.",
      "The reward ritual exists because you've earned something worth claiming.",
      'Every DP earned is proof that the system works.',
      "Your avatar didn't evolve by accident. You built that.",
      'Rank is a record of every day you chose to show up.',
      'The work is the point. The reward is the proof.',
    ],
  },
}
