// Design constants extracted from Trained theme
// Values copied (not imported) to decouple from theme system

import type { DPAction } from '@/stores/dpStore'

// Archetype System
export type Archetype = 'bro' | 'himbo' | 'brute' | 'pup' | 'bull'

export interface ArchetypeInfo {
  name: string
  tagline: string
  icon: string // lucide-react icon name
  isPremium: boolean
  description: string
  boosts: string
}

export const ARCHETYPE_INFO: Record<Archetype, ArchetypeInfo> = {
  bro: {
    name: 'Bro',
    tagline: 'Balanced Discipline',
    icon: 'User',
    isPremium: false,
    description: 'The well-rounded generalist. No specialty, no weakness. You earn DP through consistent effort across all disciplines.',
    boosts: 'No modifier bonuses',
  },
  himbo: {
    name: 'Himbo',
    tagline: 'Training Obsessed',
    icon: 'Dumbbell',
    isPremium: true,
    description: 'The gym is your temple. You live for the pump and the grind. Training is your primary focus.',
    boosts: '+50% training DP',
  },
  brute: {
    name: 'Brute',
    tagline: 'Nutrition Machine',
    icon: 'Beef',
    isPremium: true,
    description: 'Fuel is everything. You track every macro, every meal. Nutrition discipline defines your protocol.',
    boosts: '+50% protein/meal DP',
  },
  pup: {
    name: 'Pup',
    tagline: 'Lifestyle Master',
    icon: 'Heart',
    isPremium: true,
    description: 'Health extends beyond the gym. Steps, sleep, and daily habits are your focus areas.',
    boosts: '+100% steps/sleep DP',
  },
  bull: {
    name: 'Bull',
    tagline: 'Consistency King',
    icon: 'TrendingUp',
    isPremium: true,
    description: 'Streaks are your currency. You never break the chain. Consistency compounds your rewards.',
    boosts: 'Streak bonuses (coming v2.1)',
  },
}

export const ARCHETYPE_MODIFIERS: Record<Archetype, Partial<Record<DPAction, number>>> = {
  bro: {},
  himbo: { training: 1.5 },
  brute: { meal: 1.5, protein: 1.5 },
  pup: { steps: 2.0, sleep: 2.0 },
  bull: {}, // Deferred to v2.1
}

// DP values duplicated from dpStore to avoid circular import
const DP_VALUES: Record<DPAction, number> = {
  training: 50,
  meal: 15,
  protein: 25,
  steps: 10,
  sleep: 10,
}

/**
 * Calculate modified DP for a given action and archetype.
 * Used for UI display to show bonus DP amounts.
 */
export function getModifiedDP(action: DPAction, archetype: Archetype): number {
  const base = DP_VALUES[action]
  const modifier = ARCHETYPE_MODIFIERS[archetype]?.[action] || 1
  return Math.round(base * modifier)
}

export const LABELS = {
  xp: 'DP',
  xpFull: 'Discipline Points',
  level: 'Rank',
  streak: 'Obedience Streak',
  streakSaver: 'Safe Word',
  dailyQuests: 'Daily Assignments',
  checkIn: 'Daily Report',
  weeklyXPClaim: 'Weekly Reward',
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
    dominant: 'The Dom/me',
    switch: 'The Switch',
    submissive: 'The Sub',
  },
} as const

export const STANDING_ORDERS = {
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
    "You've been putting in the work. Time to collect.",
    "Delayed gratification hits different when you've earned it.",
    "The reward exists because you've earned something worth claiming.",
    'Every DP earned is proof that the system works.',
    "Your rank didn't climb by accident. You built that.",
    'Rank is a record of every day you chose to show up.',
    'The work is the point. The reward is the proof.',
  ],
} as const

/** Get a random standing order based on context */
export function getStandingOrder(
  context: 'training' | 'rest' | 'missed' | 'claim' | 'default' = 'default'
): string {
  let pool: readonly string[]

  switch (context) {
    case 'training':
      pool = STANDING_ORDERS.discipline
      break
    case 'rest':
      pool = [...STANDING_ORDERS.selfCare, ...STANDING_ORDERS.growth]
      break
    case 'missed':
      pool = STANDING_ORDERS.growth
      break
    case 'claim':
      pool = STANDING_ORDERS.reward
      break
    default:
      pool = [
        ...STANDING_ORDERS.discipline,
        ...STANDING_ORDERS.selfCare,
        ...STANDING_ORDERS.growth,
        ...STANDING_ORDERS.reward,
      ]
  }

  return pool[Math.floor(Math.random() * pool.length)]
}
