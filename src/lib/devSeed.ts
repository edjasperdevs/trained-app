/**
 * Dev-only utility to populate localStorage with realistic test data.
 * Usage: import and call seedTestData() from browser console or a dev route.
 */

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

  for (let i = 20; i >= 0; i--) {
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
const level = calcLevel(xpData.totalXP)
function getEvolutionStage(lvl: number) {
  if (lvl < 1) return 0
  if (lvl < 2) return 1
  if (lvl < 4) return 2
  if (lvl < 6) return 3
  if (lvl < 9) return 4
  if (lvl < 15) return 5
  if (lvl < 22) return 6
  if (lvl < 30) return 7
  if (lvl < 40) return 8
  if (lvl < 50) return 9
  if (lvl < 70) return 10
  if (lvl < 85) return 11
  return 12
}

const avatarStore = {
  state: {
    baseCharacter: 'dominant',
    evolutionStage: getEvolutionStage(level),
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
  console.log(`   Level: ${level} | XP: ${xpData.totalXP}`)
  console.log(`   Workouts: ${workoutStore.state.workoutLogs.length}`)
  console.log(`   Macro days: ${macroStore.state.dailyLogs.length}`)
  console.log(`   Badges: ${achievementsStore.state.earnedBadges.length}`)
  console.log(`   Weight entries: ${userStore.state.weightHistory.length}`)
  console.log('   Reload the page to see changes.')
}

// --- Mock Coach Data (for dev bypass) ---

export interface MockClientSummary {
  client_id: string
  status: 'pending' | 'active' | 'inactive'
  username: string
  email: string
  current_streak: number
  longest_streak: number
  last_check_in_date: string | null
  goal: string
  onboarding_complete: boolean
  current_level: number
  total_xp: number
  latest_weight: number | null
  latest_weight_date: string | null
  workouts_last_7_days: number
}

const mockClients: MockClientSummary[] = [
  {
    client_id: 'mock-client-sarah',
    status: 'active',
    username: 'SarahLifts',
    email: 'sarah@example.com',
    current_streak: 15,
    longest_streak: 22,
    last_check_in_date: toISO(today),
    goal: 'cut',
    onboarding_complete: true,
    current_level: 12,
    total_xp: 8450,
    latest_weight: 142.3,
    latest_weight_date: toISO(today),
    workouts_last_7_days: 5,
  },
  {
    client_id: 'mock-client-mike',
    status: 'active',
    username: 'MikeG',
    email: 'mike@example.com',
    current_streak: 3,
    longest_streak: 18,
    last_check_in_date: toISO(daysAgo(2)),
    goal: 'bulk',
    onboarding_complete: true,
    current_level: 7,
    total_xp: 3200,
    latest_weight: 198.5,
    latest_weight_date: toISO(daysAgo(2)),
    workouts_last_7_days: 2,
  },
  {
    client_id: 'mock-client-jake',
    status: 'active',
    username: 'JakeR',
    email: 'jake@example.com',
    current_streak: 0,
    longest_streak: 9,
    last_check_in_date: toISO(daysAgo(5)),
    goal: 'recomp',
    onboarding_complete: true,
    current_level: 4,
    total_xp: 1100,
    latest_weight: 175.0,
    latest_weight_date: toISO(daysAgo(6)),
    workouts_last_7_days: 0,
  },
  {
    client_id: 'mock-client-newbie',
    status: 'pending',
    username: 'FreshStart',
    email: 'newbie@example.com',
    current_streak: 0,
    longest_streak: 0,
    last_check_in_date: null,
    goal: 'cut',
    onboarding_complete: false,
    current_level: 0,
    total_xp: 0,
    latest_weight: null,
    latest_weight_date: null,
    workouts_last_7_days: 0,
  },
]

// Profile that can be "found" via add-client email search
const mockFindableProfile = {
  id: 'mock-client-alex',
  username: 'AlexK',
  email: 'alex@example.com',
}

function buildMockWeightData(clientId: string) {
  const configs: Record<string, { start: number; trend: number; days: number }> = {
    'mock-client-sarah': { start: 148, trend: -0.15, days: 30 },
    'mock-client-mike': { start: 195, trend: 0.12, days: 20 },
    'mock-client-jake': { start: 176, trend: -0.05, days: 14 },
  }
  const cfg = configs[clientId]
  if (!cfg) return []

  return Array.from({ length: cfg.days }, (_, i) => ({
    date: toISO(daysAgo(cfg.days - 1 - i)),
    weight: Math.round((cfg.start + i * cfg.trend + (Math.random() * 0.8 - 0.4)) * 10) / 10,
  }))
}

function buildMockMacroData(clientId: string) {
  const configs: Record<string, { protein: number; calories: number; carbs: number; fats: number; adherence: number; days: number; set_by: 'self' | 'coach'; set_by_coach_id: string | null }> = {
    'mock-client-sarah': { protein: 130, calories: 1800, carbs: 200, fats: 60, adherence: 0.85, days: 14, set_by: 'coach', set_by_coach_id: 'mock-coach-id' },
    'mock-client-mike': { protein: 200, calories: 3000, carbs: 350, fats: 80, adherence: 0.6, days: 14, set_by: 'self', set_by_coach_id: null },
    'mock-client-jake': { protein: 160, calories: 2200, carbs: 250, fats: 70, adherence: 0.3, days: 10, set_by: 'self', set_by_coach_id: null },
  }
  const cfg = configs[clientId]
  if (!cfg) return { logs: [], targets: null }

  const logs = Array.from({ length: cfg.days }, (_, i) => {
    const hit = Math.random() < cfg.adherence
    return {
      date: toISO(daysAgo(cfg.days - 1 - i)),
      protein: hit ? cfg.protein + Math.floor(Math.random() * 20 - 10) : Math.floor(cfg.protein * 0.6),
      calories: hit ? cfg.calories + Math.floor(Math.random() * 200 - 100) : Math.floor(cfg.calories * 0.65),
    }
  })

  return {
    logs,
    targets: {
      protein: cfg.protein,
      calories: cfg.calories,
      carbs: cfg.carbs,
      fats: cfg.fats,
      set_by: cfg.set_by,
      set_by_coach_id: cfg.set_by_coach_id,
    }
  }
}

function buildMockActivityData(clientId: string) {
  const activities: {
    id: string
    date: string
    type: 'workout' | 'weight' | 'xp'
    description: string
    detail?: string
    xpAmount?: number
    xpSource?: string
    workoutType?: string
  }[] = []

  const workoutTypes = ['push', 'pull', 'legs', 'upper']
  const xpSources = ['workout', 'protein', 'calories', 'checkin'] as const

  const dayCount = clientId === 'mock-client-sarah' ? 14 : clientId === 'mock-client-mike' ? 10 : 6

  for (let i = 0; i < dayCount; i++) {
    const date = toISO(daysAgo(i))
    const wType = workoutTypes[i % 4]

    if (i % 2 === 0) {
      activities.push({
        id: `w-${clientId}-${i}`,
        date,
        type: 'workout',
        description: `${wType.charAt(0).toUpperCase() + wType.slice(1)} workout`,
        detail: `${45 + Math.floor(Math.random() * 20)} min`,
        workoutType: wType,
      })
    }

    if (i % 3 === 0) {
      activities.push({
        id: `wt-${clientId}-${i}`,
        date,
        type: 'weight',
        description: 'Logged weight',
        detail: `${(170 + Math.random() * 10).toFixed(1)} lbs`,
      })
    }

    const src = xpSources[i % 4]
    activities.push({
      id: `xp-${clientId}-${i}`,
      date,
      type: 'xp',
      description: src === 'workout' ? 'Workout completed' : src === 'protein' ? 'Hit protein target' : src === 'calories' ? 'Hit calorie target' : 'Daily check-in',
      xpAmount: src === 'workout' ? 100 : src === 'checkin' ? 25 : 50,
      xpSource: src,
    })
  }

  return activities
}

export function getMockClients(): MockClientSummary[] {
  return [...mockClients]
}

export function getMockClientDetails(clientId: string) {
  return {
    weightData: buildMockWeightData(clientId),
    macroData: buildMockMacroData(clientId),
    activityData: buildMockActivityData(clientId),
  }
}

export function getMockProfileByEmail(email: string): { id: string } | null {
  // Check existing clients
  const existing = mockClients.find(c => c.email === email)
  if (existing) return { id: existing.client_id }

  // Check findable profile
  if (email === mockFindableProfile.email) return { id: mockFindableProfile.id }

  return null
}

export function addMockClient(clientId: string): MockClientSummary | null {
  if (clientId === mockFindableProfile.id) {
    const newClient: MockClientSummary = {
      client_id: mockFindableProfile.id,
      status: 'active',
      username: mockFindableProfile.username,
      email: mockFindableProfile.email,
      current_streak: 0,
      longest_streak: 0,
      last_check_in_date: null,
      goal: 'recomp',
      onboarding_complete: true,
      current_level: 2,
      total_xp: 350,
      latest_weight: 165,
      latest_weight_date: toISO(daysAgo(3)),
      workouts_last_7_days: 1,
    }
    mockClients.push(newClient)
    return newClient
  }
  return null
}

export function removeMockClient(clientId: string): boolean {
  const idx = mockClients.findIndex(c => c.client_id === clientId)
  if (idx !== -1) {
    mockClients.splice(idx, 1)
    return true
  }
  return false
}

export function clearTestData() {
  const keys = [
    'gamify-gains-user', 'gamify-gains-workouts', 'gamify-gains-macros',
    'gamify-gains-xp', 'gamify-gains-avatar', 'gamify-gains-achievements',
    'gamify-gains-access', 'gamify-gains-reminders',
  ]
  keys.forEach(k => localStorage.removeItem(k))
  console.log('🗑️ All test data cleared. Reload the page.')
}
