// Design constants extracted from Trained theme
// Values copied (not imported) to decouple from theme system

export const LABELS = {
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
    dominant: 'The Dom/me',
    switch: 'The Switch',
    submissive: 'The Sub',
  },
} as const

export const AVATAR_STAGES: string[] = [
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
]

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
    "You've been putting in the work. Sunday's coming.",
    "Delayed gratification hits different when you've earned it.",
    "The reward ritual exists because you've earned something worth claiming.",
    'Every DP earned is proof that the system works.',
    "Your avatar didn't evolve by accident. You built that.",
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
