/**
 * Dev-only utility to populate localStorage with realistic test data.
 * Usage: import and call seedTestData() from browser console or a dev route.
 */

import type { WeeklyCheckin } from '@/lib/database.types'

const today = new Date()
const toISO = (d: Date) => d.toISOString().split('T')[0]
const daysAgo = (n: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d
}
const id = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// --- User Profile ---
const userStore = {
  state: {
    profile: {
      username: 'TestUser',
      gender: 'male' as const,
      fitnessLevel: 'intermediate' as const,
      trainingDaysPerWeek: 4 as const,
      weight: 185,
      height: 70,
      age: 28,
      goal: 'recomp' as const,
      avatarBase: 'dominant' as const,
      createdAt: daysAgo(45).getTime(),
      currentStreak: 7,
      longestStreak: 14,
      lastCheckInDate: toISO(today),
      streakPaused: false,
      onboardingComplete: true,
      units: 'imperial' as const,
      goalWeight: 180,
    },
    weightHistory: Array.from({ length: 30 }, (_, i) => ({
      date: toISO(daysAgo(29 - i)),
      weight: 188 - (i * 0.1) + (Math.random() * 0.6 - 0.3),
    })).map(e => ({ ...e, weight: Math.round(e.weight * 10) / 10 })),
  },
  version: 0,
}

// --- Workout Store ---
function buildWorkoutLogs() {
  const logs = []
  const workoutTypes = ['push', 'pull', 'legs', 'upper'] as const

  for (let i = 20; i >= 1; i--) {
    // Skip some days for realism (rest days)
    if (i % 3 === 2) continue

    const type = workoutTypes[i % workoutTypes.length]
    const isMinimal = i === 15 // one minimal workout for variety
    const wId = id()

    if (isMinimal) {
      logs.push({
        id: wId,
        date: toISO(daysAgo(i)),
        workoutType: type,
        dayNumber: (i % 4) + 1,
        weekNumber: Math.floor(i / 7) + 1,
        exercises: [],
        completed: true,
        xpAwarded: true,
        startTime: daysAgo(i).getTime(),
        endTime: daysAgo(i).getTime() + 15 * 60000,
        isMinimal: true,
        notes: '20 pushups, 3 min plank, stretching',
      })
    } else {
      const exercises = getExercisesForWorkout(type).map(ex => ({
        id: id(),
        name: ex.name,
        targetSets: ex.sets,
        targetReps: ex.reps,
        sets: Array.from({ length: ex.sets }, (_, si) => ({
          weight: ex.baseWeight + Math.floor(i * 0.5) + (si === ex.sets - 1 ? -5 : 0),
          reps: 8 + Math.floor(Math.random() * 4),
          completed: true,
          skipped: false,
        })),
      }))

      logs.push({
        id: wId,
        date: toISO(daysAgo(i)),
        workoutType: type,
        dayNumber: (i % 4) + 1,
        weekNumber: Math.floor(i / 7) + 1,
        exercises,
        completed: true,
        xpAwarded: true,
        startTime: daysAgo(i).getTime(),
        endTime: daysAgo(i).getTime() + 55 * 60000,
      })
    }
  }
  return logs
}

function getExercisesForWorkout(type: string) {
  const exercises: Record<string, { name: string; sets: number; reps: string; baseWeight: number }[]> = {
    push: [
      { name: 'Bench Press', sets: 4, reps: '6-10', baseWeight: 155 },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8-12', baseWeight: 55 },
      { name: 'Cable Flyes', sets: 3, reps: '10-15', baseWeight: 30 },
      { name: 'Overhead Press', sets: 3, reps: '8-10', baseWeight: 95 },
      { name: 'Lateral Raises', sets: 3, reps: '12-15', baseWeight: 20 },
    ],
    pull: [
      { name: 'Barbell Rows', sets: 4, reps: '6-10', baseWeight: 145 },
      { name: 'Lat Pulldowns', sets: 3, reps: '8-12', baseWeight: 120 },
      { name: 'Face Pulls', sets: 3, reps: '12-15', baseWeight: 40 },
      { name: 'Barbell Curls', sets: 3, reps: '8-12', baseWeight: 65 },
      { name: 'Hammer Curls', sets: 3, reps: '10-12', baseWeight: 30 },
    ],
    legs: [
      { name: 'Squats', sets: 4, reps: '6-10', baseWeight: 205 },
      { name: 'Romanian Deadlifts', sets: 3, reps: '8-12', baseWeight: 165 },
      { name: 'Leg Press', sets: 3, reps: '10-12', baseWeight: 270 },
      { name: 'Leg Curls', sets: 3, reps: '10-15', baseWeight: 90 },
      { name: 'Calf Raises', sets: 4, reps: '12-15', baseWeight: 135 },
    ],
    upper: [
      { name: 'Dumbbell Press', sets: 4, reps: '8-10', baseWeight: 65 },
      { name: 'Cable Rows', sets: 3, reps: '10-12', baseWeight: 110 },
      { name: 'Dumbbell Shoulder Press', sets: 3, reps: '8-12', baseWeight: 45 },
      { name: 'Chin-ups', sets: 3, reps: '6-10', baseWeight: 0 },
      { name: 'Tricep Pushdowns', sets: 3, reps: '10-15', baseWeight: 50 },
    ],
  }
  return exercises[type] || exercises.push
}

const workoutStore = {
  state: {
    currentPlan: {
      trainingDays: 4,
      selectedDays: [1, 2, 4, 5],
      schedule: [
        { day: 0, type: 'rest', name: 'Rest Day', dayNumber: 0 },
        { day: 1, type: 'push', name: 'Push Day', dayNumber: 1 },
        { day: 2, type: 'pull', name: 'Pull Day', dayNumber: 2 },
        { day: 3, type: 'rest', name: 'Rest Day', dayNumber: 0 },
        { day: 4, type: 'legs', name: 'Leg Day', dayNumber: 3 },
        { day: 5, type: 'upper', name: 'Upper Day', dayNumber: 4 },
        { day: 6, type: 'rest', name: 'Rest Day', dayNumber: 0 },
      ],
    },
    workoutLogs: buildWorkoutLogs(),
    currentWeek: 4,
    customizations: [],
  },
  version: 0,
}

// --- Macro Store ---
function buildMacroLogs() {
  const logs = []
  for (let i = 14; i >= 0; i--) {
    const protein = 160 + Math.floor(Math.random() * 40)
    const carbs = 200 + Math.floor(Math.random() * 60)
    const fats = 60 + Math.floor(Math.random() * 20)
    const calories = protein * 4 + carbs * 4 + fats * 9

    const meals = [
      { mealNumber: 1, protein: Math.floor(protein * 0.3), carbs: Math.floor(carbs * 0.3), fats: Math.floor(fats * 0.25), calories: Math.floor(calories * 0.28), logged: true },
      { mealNumber: 2, protein: Math.floor(protein * 0.25), carbs: Math.floor(carbs * 0.25), fats: Math.floor(fats * 0.3), calories: Math.floor(calories * 0.27), logged: true },
      { mealNumber: 3, protein: Math.floor(protein * 0.3), carbs: Math.floor(carbs * 0.3), fats: Math.floor(fats * 0.25), calories: Math.floor(calories * 0.28), logged: true },
      { mealNumber: 4, protein: Math.floor(protein * 0.15), carbs: Math.floor(carbs * 0.15), fats: Math.floor(fats * 0.2), calories: Math.floor(calories * 0.17), logged: i > 2 },
    ]

    const loggedMeals = [
      { id: id(), name: 'Eggs & Oats', protein: meals[0].protein, carbs: meals[0].carbs, fats: meals[0].fats, calories: meals[0].calories, timestamp: daysAgo(i).getTime() + 8 * 3600000 },
      { id: id(), name: 'Chicken & Rice', protein: meals[1].protein, carbs: meals[1].carbs, fats: meals[1].fats, calories: meals[1].calories, timestamp: daysAgo(i).getTime() + 12 * 3600000 },
      { id: id(), name: 'Salmon & Veggies', protein: meals[2].protein, carbs: meals[2].carbs, fats: meals[2].fats, calories: meals[2].calories, timestamp: daysAgo(i).getTime() + 18 * 3600000 },
    ]

    if (i > 2) {
      loggedMeals.push({ id: id(), name: 'Protein Shake', protein: meals[3].protein, carbs: meals[3].carbs, fats: meals[3].fats, calories: meals[3].calories, timestamp: daysAgo(i).getTime() + 21 * 3600000 })
    }

    logs.push({
      date: toISO(daysAgo(i)),
      protein, calories, carbs, fats,
      meals,
      loggedMeals,
      targetSnapshot: { protein: 180, calories: 2400, carbs: 240, fats: 70 },
    })
  }
  return logs
}

const macroStore = {
  state: {
    targets: { protein: 180, calories: 2400, carbs: 240, fats: 70 },
    mealPlan: [
      { name: 'Meal 1 (Breakfast)', protein: 45, carbs: 60, fats: 18, calories: 578 },
      { name: 'Meal 2 (Lunch)', protein: 45, carbs: 60, fats: 20, calories: 600 },
      { name: 'Meal 3 (Dinner)', protein: 55, carbs: 70, fats: 18, calories: 658 },
      { name: 'Meal 4 (Snack)', protein: 35, carbs: 50, fats: 14, calories: 470 },
    ],
    dailyLogs: buildMacroLogs(),
    savedMeals: [
      {
        id: id(), name: 'Post-Workout Shake', createdAt: daysAgo(30).getTime(), usageCount: 12,
        protein: 50, carbs: 40, fats: 5, calories: 405,
        ingredients: [
          { id: id(), name: 'Whey Protein', quantity: 2, unit: 'serving' as const, protein: 50, carbs: 6, fats: 3, calories: 250 },
          { id: id(), name: 'Banana', quantity: 1, unit: 'serving' as const, protein: 1, carbs: 27, fats: 0, calories: 105 },
          { id: id(), name: 'Peanut Butter', quantity: 15, unit: 'g' as const, protein: 4, carbs: 3, fats: 8, calories: 94 },
        ],
      },
      {
        id: id(), name: 'Chicken Rice Bowl', createdAt: daysAgo(25).getTime(), usageCount: 8,
        protein: 48, carbs: 55, fats: 12, calories: 520,
        ingredients: [
          { id: id(), name: 'Chicken Breast', quantity: 200, unit: 'g' as const, protein: 42, carbs: 0, fats: 6, calories: 220 },
          { id: id(), name: 'White Rice', quantity: 150, unit: 'g' as const, protein: 4, carbs: 50, fats: 0, calories: 195 },
          { id: id(), name: 'Broccoli', quantity: 100, unit: 'g' as const, protein: 3, carbs: 7, fats: 0, calories: 34 },
        ],
      },
    ],
    activityLevel: 'moderate',
  },
  version: 2,
}

// --- XP Store ---
function buildXPLogs() {
  const logs = []
  let totalXP = 0

  for (let i = 30; i >= 0; i--) {
    const isRestDay = i % 3 === 2
    const workout = !isRestDay
    const protein = Math.random() > 0.2
    const calories = Math.random() > 0.3
    const checkIn = Math.random() > 0.1
    const perfectDay = workout && protein && calories && checkIn
    const streakBonus = Math.min(i > 20 ? 0 : 7, 14) * 10

    const dayXP =
      (workout ? 100 : 0) +
      (protein ? 50 : 0) +
      (calories ? 50 : 0) +
      (checkIn ? 25 : 0) +
      (perfectDay ? 25 : 0) +
      streakBonus

    totalXP += dayXP

    logs.push({
      date: toISO(daysAgo(i)),
      workout, protein, calories, checkIn, perfectDay,
      streakBonus,
      total: dayXP,
      claimed: i > 0,
    })
  }

  return { logs, totalXP }
}

const xpData = buildXPLogs()

// Calculate level from XP (100 XP per level for first levels, scaling up)
function calcLevel(totalXP: number) {
  let level = 0
  let xpNeeded = 100
  let remaining = totalXP
  while (remaining >= xpNeeded && level < 99) {
    remaining -= xpNeeded
    level++
    xpNeeded = Math.floor(100 * (1 + level * 0.1))
  }
  return level
}

const xpStore = {
  state: {
    totalXP: xpData.totalXP,
    currentLevel: calcLevel(xpData.totalXP),
    pendingXP: xpData.logs[xpData.logs.length - 1]?.claimed ? 0 : xpData.logs[xpData.logs.length - 1]?.total || 0,
    weeklyHistory: [
      { weekOf: toISO(daysAgo(21)), xpEarned: 1450, levelReached: calcLevel(xpData.totalXP) - 3 },
      { weekOf: toISO(daysAgo(14)), xpEarned: 1620, levelReached: calcLevel(xpData.totalXP) - 2 },
      { weekOf: toISO(daysAgo(7)), xpEarned: 1580, levelReached: calcLevel(xpData.totalXP) - 1 },
      { weekOf: toISO(daysAgo(0)), xpEarned: 820, levelReached: calcLevel(xpData.totalXP) },
    ],
    dailyLogs: xpData.logs,
    lastClaimDate: toISO(daysAgo(1)),
  },
  version: 0,
}

// --- Avatar Store ---
const avatarStore = {
  state: {
    baseCharacter: 'dominant',
    currentMood: 'happy',
    accessories: [],
    lastInteraction: Date.now(),
    recentReaction: null,
  },
  version: 0,
}

// --- Achievements Store ---
const achievementsStore = {
  state: {
    earnedBadges: [
      { badgeId: 'first-rep', earnedAt: daysAgo(30).getTime() },
      { badgeId: 'day-one', earnedAt: daysAgo(30).getTime() },
      { badgeId: 'iron-will', earnedAt: daysAgo(14).getTime() },
      { badgeId: 'warming-up', earnedAt: daysAgo(10).getTime() },
      { badgeId: 'well-fueled', earnedAt: daysAgo(8).getTime() },
      { badgeId: 'rising', earnedAt: daysAgo(7).getTime() },
    ],
    lastChecked: Date.now(),
  },
  version: 0,
}

// --- Access Store ---
const accessStore = {
  state: {
    hasAccess: true,
    licenseKey: 'TEST-DEV-KEY-1234',
    accessGrantedAt: daysAgo(45).toISOString(),
    email: 'test@example.com',
    instanceId: 'dev-instance-001',
  },
  version: 2,
}

// --- Reminders Store ---
const remindersStore = {
  state: {
    preferences: {
      logMacros: true,
      checkIn: true,
      claimXP: true,
      workout: true,
    },
    dismissedToday: [],
    lastDismissDate: null,
  },
  version: 0,
}

export function seedTestData() {
  localStorage.setItem('gamify-gains-user', JSON.stringify(userStore))
  localStorage.setItem('gamify-gains-workouts', JSON.stringify(workoutStore))
  localStorage.setItem('gamify-gains-macros', JSON.stringify(macroStore))
  localStorage.setItem('gamify-gains-xp', JSON.stringify(xpStore))
  localStorage.setItem('gamify-gains-avatar', JSON.stringify(avatarStore))
  localStorage.setItem('gamify-gains-achievements', JSON.stringify(achievementsStore))
  localStorage.setItem('gamify-gains-access', JSON.stringify(accessStore))
  localStorage.setItem('gamify-gains-reminders', JSON.stringify(remindersStore))

  console.log('✅ Test data seeded!')
  console.log(`   Level: ${calcLevel(xpData.totalXP)} | XP: ${xpData.totalXP}`)
  console.log(`   Workouts: ${workoutStore.state.workoutLogs.length}`)
  console.log(`   Macro days: ${macroStore.state.dailyLogs.length}`)
  console.log(`   Badges: ${achievementsStore.state.earnedBadges.length}`)
  console.log(`   Weight entries: ${userStore.state.weightHistory.length}`)
  console.log('   Reload the page to see changes.')
}

// --- Mock Weekly Check-ins (for dev bypass) ---

function getCurrentMondayStr(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(monday.getDate() + diff)
  return toISO(monday)
}

function getMondayWeeksAgo(weeks: number): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(monday.getDate() + diff - weeks * 7)
  return toISO(monday)
}

export const mockWeeklyCheckins: WeeklyCheckin[] = [
  {
    id: 'checkin-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_id: 'mock-client-sarah',
    coach_id: 'mock-coach-id',
    week_of: getCurrentMondayStr(),
    status: 'submitted',
    water_intake: '1 gallon daily',
    caffeine_intake: '2 cups coffee, 1 pre-workout',
    hunger_level: 3,
    slip_ups: 'Had pizza on Friday night, otherwise clean',
    refeed_date: null,
    digestion: 'Good overall, slight bloating after dairy',
    training_progress: 'Hit a PR on bench press - 135x6!',
    training_feedback: 'Feeling strong on push days, pull days are dragging',
    recovery_soreness: 'Glutes still sore from Wednesday leg day',
    sleep_quality: 4,
    sleep_hours: 7.5,
    stress_level: 2,
    stressors: 'Work deadline next week but manageable',
    mental_health: 'Feeling motivated, good energy levels',
    injuries: null,
    cycle_status: 'Normal, day 14',
    side_effects: null,
    bloodwork_date: null,
    open_feedback: 'Can we add more hamstring work?',
    auto_weight_current: 142.3,
    auto_weight_weekly_avg: 142.8,
    auto_weight_change: -0.5,
    auto_step_avg: null,
    auto_macro_hit_rate: 85,
    auto_cardio_sessions: null,
    auto_workouts_completed: 5,
    coach_response: null,
    reviewed_at: null,
  },
  {
    id: 'checkin-002',
    created_at: daysAgo(7).toISOString(),
    updated_at: daysAgo(5).toISOString(),
    client_id: 'mock-client-mike',
    coach_id: 'mock-coach-id',
    week_of: getMondayWeeksAgo(1),
    status: 'reviewed',
    water_intake: 'About half a gallon',
    caffeine_intake: '3 energy drinks',
    hunger_level: 4,
    slip_ups: 'Missed two meals on Tuesday, made up calories with junk',
    refeed_date: null,
    digestion: 'No issues',
    training_progress: 'Squats felt heavy, deloaded to 185',
    training_feedback: 'Low energy this week, might be the sleep',
    recovery_soreness: 'Lower back tight after deadlifts',
    sleep_quality: 2,
    sleep_hours: 5.5,
    stress_level: 4,
    stressors: 'Moving apartments, very chaotic schedule',
    mental_health: 'Stressed but pushing through',
    injuries: 'Minor lower back tightness, monitoring',
    cycle_status: null,
    side_effects: null,
    bloodwork_date: null,
    open_feedback: null,
    auto_weight_current: 198.5,
    auto_weight_weekly_avg: 198.2,
    auto_weight_change: 0.8,
    auto_step_avg: null,
    auto_macro_hit_rate: 45,
    auto_cardio_sessions: null,
    auto_workouts_completed: 2,
    coach_response: 'Good progress on the bulk. Keep protein high. Let\'s address that sleep -- try cutting energy drinks after 2pm. For the lower back, add some bird-dogs before deadlifts.',
    reviewed_at: daysAgo(5).toISOString(),
  },
  {
    id: 'checkin-003',
    created_at: daysAgo(14).toISOString(),
    updated_at: daysAgo(12).toISOString(),
    client_id: 'mock-client-jake',
    coach_id: 'mock-coach-id',
    week_of: getMondayWeeksAgo(2),
    status: 'reviewed',
    water_intake: 'Barely any, maybe 3 glasses',
    caffeine_intake: '1 coffee',
    hunger_level: 2,
    slip_ups: 'Ate out most days, didn\'t track',
    refeed_date: null,
    digestion: 'Fine',
    training_progress: 'Didn\'t make it to the gym',
    training_feedback: 'No training this week',
    recovery_soreness: 'N/A',
    sleep_quality: 3,
    sleep_hours: 6.0,
    stress_level: 4,
    stressors: 'Family stuff, lost motivation',
    mental_health: 'Struggling to stay consistent, feeling guilty',
    injuries: null,
    cycle_status: null,
    side_effects: null,
    bloodwork_date: null,
    open_feedback: 'I know I need to do better. Just hard to find the groove.',
    auto_weight_current: 175.0,
    auto_weight_weekly_avg: 175.4,
    auto_weight_change: 1.2,
    auto_step_avg: null,
    auto_macro_hit_rate: 15,
    auto_cardio_sessions: null,
    auto_workouts_completed: 0,
    coach_response: 'Let\'s talk about getting back on track. No guilt -- we all have off weeks. Here\'s what I want you to focus on this week: just 2 workouts, drink more water, and log at least 3 meals. Small wins.',
    reviewed_at: daysAgo(12).toISOString(),
  },
]

export function getMockWeeklyCheckins(): WeeklyCheckin[] {
  return [...mockWeeklyCheckins]
}

export function clearTestData() {
  const keys = [
    'gamify-gains-user', 'gamify-gains-workouts', 'gamify-gains-macros',
    'gamify-gains-xp', 'gamify-gains-avatar', 'gamify-gains-achievements',
    'gamify-gains-access', 'gamify-gains-reminders', 'gamify-gains-dp',
    'gamify-gains-subscription',
  ]
  keys.forEach(k => localStorage.removeItem(k))
  console.log('🗑️ All test data cleared. Reload the page.')
}

// --- Test Personas for Manual QA Testing ---

type TestPersona = 'newbie' | 'veteran' | 'premium_himbo' | 'premium_brute' |
  'premium_pup' | 'premium_bull' | 'female_user' | 'metric_user' |
  'streak_master' | 'struggling'

interface PersonaConfig {
  username: string
  gender: 'male' | 'female'
  archetype: 'bro' | 'himbo' | 'brute' | 'pup' | 'bull'
  goal: 'cut' | 'bulk' | 'maintain' | 'recomp'
  units: 'imperial' | 'metric'
  trainingDays: 3 | 4 | 5
  weight: number // in lbs (internal)
  height: number // in inches (internal)
  age: number
  totalDP: number
  currentStreak: number
  longestStreak: number
  isPremium: boolean
  workoutCount: number
  daysActive: number
  badgeCount: number
}

const PERSONA_CONFIGS: Record<TestPersona, PersonaConfig> = {
  newbie: {
    username: 'NewRecruit',
    gender: 'male',
    archetype: 'bro',
    goal: 'maintain',
    units: 'imperial',
    trainingDays: 3,
    weight: 170,
    height: 69,
    age: 25,
    totalDP: 150,
    currentStreak: 2,
    longestStreak: 2,
    isPremium: false,
    workoutCount: 2,
    daysActive: 3,
    badgeCount: 2,
  },
  veteran: {
    username: 'VeteranTrainee',
    gender: 'male',
    archetype: 'bro',
    goal: 'recomp',
    units: 'imperial',
    trainingDays: 4,
    weight: 185,
    height: 71,
    age: 32,
    totalDP: 6200,
    currentStreak: 14,
    longestStreak: 28,
    isPremium: false,
    workoutCount: 45,
    daysActive: 60,
    badgeCount: 12,
  },
  premium_himbo: {
    username: 'GymBro_Elite',
    gender: 'male',
    archetype: 'himbo',
    goal: 'bulk',
    units: 'imperial',
    trainingDays: 5,
    weight: 195,
    height: 72,
    age: 27,
    totalDP: 3500,
    currentStreak: 10,
    longestStreak: 21,
    isPremium: true,
    workoutCount: 30,
    daysActive: 35,
    badgeCount: 8,
  },
  premium_brute: {
    username: 'MacroMaster',
    gender: 'male',
    archetype: 'brute',
    goal: 'cut',
    units: 'metric',
    trainingDays: 4,
    weight: 200,
    height: 70,
    age: 29,
    totalDP: 4100,
    currentStreak: 7,
    longestStreak: 14,
    isPremium: true,
    workoutCount: 25,
    daysActive: 40,
    badgeCount: 9,
  },
  premium_pup: {
    username: 'CardioKing',
    gender: 'male',
    archetype: 'pup',
    goal: 'maintain',
    units: 'metric',
    trainingDays: 3,
    weight: 165,
    height: 68,
    age: 26,
    totalDP: 2800,
    currentStreak: 12,
    longestStreak: 18,
    isPremium: true,
    workoutCount: 18,
    daysActive: 30,
    badgeCount: 7,
  },
  premium_bull: {
    username: 'ConsistencyChamp',
    gender: 'male',
    archetype: 'bull',
    goal: 'bulk',
    units: 'imperial',
    trainingDays: 5,
    weight: 210,
    height: 74,
    age: 30,
    totalDP: 5000,
    currentStreak: 21,
    longestStreak: 35,
    isPremium: true,
    workoutCount: 40,
    daysActive: 50,
    badgeCount: 11,
  },
  female_user: {
    username: 'FitQueen',
    gender: 'female',
    archetype: 'bro',
    goal: 'cut',
    units: 'imperial',
    trainingDays: 4,
    weight: 140,
    height: 64,
    age: 28,
    totalDP: 1800,
    currentStreak: 5,
    longestStreak: 12,
    isPremium: false,
    workoutCount: 15,
    daysActive: 25,
    badgeCount: 6,
  },
  metric_user: {
    username: 'MetricMike',
    gender: 'male',
    archetype: 'bro',
    goal: 'bulk',
    units: 'metric',
    trainingDays: 4,
    weight: 176, // ~80kg
    height: 71, // ~180cm
    age: 24,
    totalDP: 2500,
    currentStreak: 8,
    longestStreak: 15,
    isPremium: false,
    workoutCount: 20,
    daysActive: 28,
    badgeCount: 7,
  },
  streak_master: {
    username: 'StreakLegend',
    gender: 'male',
    archetype: 'bro',
    goal: 'maintain',
    units: 'imperial',
    trainingDays: 4,
    weight: 180,
    height: 70,
    age: 35,
    totalDP: 8500,
    currentStreak: 45,
    longestStreak: 45,
    isPremium: false,
    workoutCount: 55,
    daysActive: 75,
    badgeCount: 15,
  },
  struggling: {
    username: 'GettingBackUp',
    gender: 'male',
    archetype: 'bro',
    goal: 'cut',
    units: 'imperial',
    trainingDays: 3,
    weight: 195,
    height: 69,
    age: 31,
    totalDP: 900,
    currentStreak: 0,
    longestStreak: 7,
    isPremium: false,
    workoutCount: 8,
    daysActive: 20,
    badgeCount: 3,
  },
}

// Calculate rank from total DP
function getRankFromDP(totalDP: number): number {
  const thresholds = [0, 250, 750, 1500, 2250, 3000, 3750, 4750, 5750, 6750, 7750, 9000, 10250, 11500, 13000, 14750]
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalDP >= thresholds[i]) return i
  }
  return 0
}

function buildPersonaUserStore(config: PersonaConfig) {
  const weightHistory = Array.from({ length: Math.min(config.daysActive, 30) }, (_, i) => ({
    date: toISO(daysAgo(Math.min(config.daysActive, 30) - 1 - i)),
    weight: config.weight + (Math.random() * 2 - 1),
  })).map(e => ({ ...e, weight: Math.round(e.weight * 10) / 10 }))

  return {
    state: {
      profile: {
        username: config.username,
        gender: config.gender,
        fitnessLevel: config.trainingDays === 5 ? 'advanced' : config.trainingDays === 4 ? 'intermediate' : 'beginner',
        trainingDaysPerWeek: config.trainingDays,
        weight: config.weight,
        height: config.height,
        age: config.age,
        goal: config.goal,
        avatarBase: 'dominant' as const,
        archetype: config.archetype,
        createdAt: daysAgo(config.daysActive).getTime(),
        currentStreak: config.currentStreak,
        longestStreak: config.longestStreak,
        lastCheckInDate: config.currentStreak > 0 ? toISO(today) : toISO(daysAgo(3)),
        streakPaused: config.currentStreak === 0 && config.longestStreak > 0,
        onboardingComplete: true,
        units: config.units,
        goalWeight: config.goal === 'cut' ? config.weight - 15 : config.goal === 'bulk' ? config.weight + 10 : undefined,
      },
      weightHistory,
    },
    version: 0,
  }
}

function buildPersonaDPStore(config: PersonaConfig) {
  const rank = getRankFromDP(config.totalDP)
  return {
    state: {
      totalDP: config.totalDP,
      currentRank: rank,
      obedienceStreak: config.currentStreak,
      longestStreak: config.longestStreak,
      lastActionDate: config.currentStreak > 0 ? toISO(today) : toISO(daysAgo(3)),
      dailyLog: {
        date: toISO(today),
        training: 0,
        meals: 0,
        protein: 0,
        steps: 0,
        sleep: 0,
      },
    },
    version: 0,
  }
}

function buildPersonaSubscriptionStore(config: PersonaConfig) {
  return {
    state: {
      isPremium: config.isPremium,
      entitlementId: config.isPremium ? 'premium' : null,
      purchaseDate: config.isPremium ? daysAgo(config.daysActive).toISOString() : null,
      expirationDate: config.isPremium ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
    },
    version: 0,
  }
}

function buildPersonaAchievements(config: PersonaConfig) {
  const badges: { badgeId: string; earnedAt: number }[] = []

  // Always earned for active users
  if (config.workoutCount >= 1) badges.push({ badgeId: 'first-rep', earnedAt: daysAgo(config.daysActive - 1).getTime() })
  if (config.daysActive >= 1) badges.push({ badgeId: 'day-one', earnedAt: daysAgo(config.daysActive).getTime() })

  // Streak badges
  if (config.longestStreak >= 7) badges.push({ badgeId: 'iron-will', earnedAt: daysAgo(config.daysActive - 7).getTime() })
  if (config.longestStreak >= 30) badges.push({ badgeId: 'relentless', earnedAt: daysAgo(config.daysActive - 30).getTime() })

  // Workout badges
  if (config.workoutCount >= 10) badges.push({ badgeId: 'warming-up', earnedAt: daysAgo(config.daysActive - 14).getTime() })
  if (config.workoutCount >= 25) badges.push({ badgeId: 'building-momentum', earnedAt: daysAgo(config.daysActive - 30).getTime() })
  if (config.workoutCount >= 50) badges.push({ badgeId: 'battle-tested', earnedAt: daysAgo(config.daysActive - 50).getTime() })

  // Rank badges
  const rank = getRankFromDP(config.totalDP)
  if (rank >= 3) badges.push({ badgeId: 'rising', earnedAt: daysAgo(Math.floor(config.daysActive * 0.3)).getTime() })
  if (rank >= 5) badges.push({ badgeId: 'established', earnedAt: daysAgo(Math.floor(config.daysActive * 0.5)).getTime() })
  if (rank >= 8) badges.push({ badgeId: 'veteran', earnedAt: daysAgo(Math.floor(config.daysActive * 0.8)).getTime() })

  return {
    state: {
      earnedBadges: badges.slice(0, config.badgeCount),
      lastChecked: Date.now(),
    },
    version: 0,
  }
}

export function seedPersona(persona: TestPersona) {
  const config = PERSONA_CONFIGS[persona]
  if (!config) {
    console.error(`❌ Unknown persona: ${persona}`)
    console.log('Available personas:', Object.keys(PERSONA_CONFIGS).join(', '))
    return
  }

  clearTestData()

  const userStore = buildPersonaUserStore(config)
  const dpStore = buildPersonaDPStore(config)
  const subscriptionStore = buildPersonaSubscriptionStore(config)
  const achievements = buildPersonaAchievements(config)

  localStorage.setItem('gamify-gains-user', JSON.stringify(userStore))
  localStorage.setItem('gamify-gains-dp', JSON.stringify(dpStore))
  localStorage.setItem('gamify-gains-subscription', JSON.stringify(subscriptionStore))
  localStorage.setItem('gamify-gains-achievements', JSON.stringify(achievements))
  localStorage.setItem('gamify-gains-avatar', JSON.stringify({
    state: {
      baseCharacter: 'dominant',
      currentMood: config.currentStreak > 0 ? 'happy' : 'sad',
      accessories: [],
      lastInteraction: Date.now(),
      recentReaction: null,
    },
    version: 0,
  }))
  localStorage.setItem('gamify-gains-access', JSON.stringify({
    state: {
      hasAccess: true,
      licenseKey: `TEST-${persona.toUpperCase()}`,
      accessGrantedAt: daysAgo(config.daysActive).toISOString(),
      email: `${persona}@test.welltrained.app`,
      instanceId: `test-${persona}`,
    },
    version: 2,
  }))
  localStorage.setItem('gamify-gains-reminders', JSON.stringify(remindersStore))

  const rank = getRankFromDP(config.totalDP)
  console.log(`✅ Seeded persona: ${persona}`)
  console.log(`   Username: ${config.username}`)
  console.log(`   Archetype: ${config.archetype} ${config.isPremium ? '(PREMIUM)' : '(FREE)'}`)
  console.log(`   Goal: ${config.goal} | Units: ${config.units}`)
  console.log(`   Rank: ${rank} | DP: ${config.totalDP}`)
  console.log(`   Streak: ${config.currentStreak} (best: ${config.longestStreak})`)
  console.log(`   Workouts: ${config.workoutCount} | Days active: ${config.daysActive}`)
  console.log('   Reload the page to see changes.')
}

export function listPersonas() {
  console.log('📋 Available test personas:\n')
  Object.entries(PERSONA_CONFIGS).forEach(([name, config]) => {
    const rank = getRankFromDP(config.totalDP)
    console.log(`  ${name}`)
    console.log(`    ${config.archetype.toUpperCase()} | ${config.goal} | ${config.units}`)
    console.log(`    Rank ${rank} | ${config.totalDP} DP | Streak: ${config.currentStreak}`)
    console.log(`    ${config.isPremium ? '💎 Premium' : '🆓 Free'}\n`)
  })
  console.log('Usage: seedPersona("persona_name")')
}
