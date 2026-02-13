/**
 * E2E localStorage seeding utilities.
 *
 * Seeds Zustand persist stores in the browser before the page loads,
 * so the app hydrates with pre-authenticated state.
 *
 * Adapted from src/lib/devSeed.ts -- uses static values instead of
 * dynamic date math for deterministic test data.
 */
import type { Page } from '@playwright/test'

export const STORE_KEYS = {
  user: 'gamify-gains-user',
  workouts: 'gamify-gains-workouts',
  macros: 'gamify-gains-macros',
  xp: 'gamify-gains-xp',
  avatar: 'gamify-gains-avatar',
  achievements: 'gamify-gains-achievements',
  access: 'gamify-gains-access',
  reminders: 'gamify-gains-reminders',
} as const

/**
 * Seed a single Zustand persist store in localStorage.
 * Uses page.addInitScript so the data is present BEFORE any page script runs.
 */
export async function seedStore(
  page: Page,
  key: string,
  state: Record<string, unknown>,
  version = 0
) {
  const envelope = JSON.stringify({ state, version })
  await page.addInitScript(
    ({ key, envelope }) => {
      localStorage.setItem(key, envelope)
    },
    { key, envelope }
  )
}

/**
 * Seed ALL 8 Zustand stores with realistic test data.
 * Must be called BEFORE page.goto() for Zustand to hydrate from localStorage.
 */
export async function seedAllStores(page: Page) {
  // Access store -- grants access to app
  await seedStore(page, STORE_KEYS.access, {
    hasAccess: true,
    licenseKey: 'TEST-E2E-KEY',
    accessGrantedAt: '2025-12-20T00:00:00.000Z',
    email: 'e2e@test.com',
    instanceId: 'e2e-instance-001',
  }, 2)

  // User store -- profile with onboardingComplete
  await seedStore(page, STORE_KEYS.user, {
    profile: {
      username: 'E2ETestUser',
      gender: 'male',
      fitnessLevel: 'intermediate',
      trainingDaysPerWeek: 4,
      weight: 185,
      height: 70,
      age: 28,
      goal: 'recomp',
      avatarBase: 'dominant',
      createdAt: 1734652800000, // 2024-12-20
      currentStreak: 7,
      longestStreak: 14,
      lastCheckInDate: new Date().toISOString().split('T')[0],
      streakPaused: false,
      onboardingComplete: true,
      units: 'imperial',
      goalWeight: 180,
    },
    weightHistory: [
      { date: '2025-01-01', weight: 188.0 },
      { date: '2025-01-02', weight: 187.8 },
      { date: '2025-01-03', weight: 187.5 },
    ],
  }, 0)

  // Workout store -- basic plan + one completed workout
  await seedStore(page, STORE_KEYS.workouts, {
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
    workoutLogs: [
      {
        id: 'e2e-workout-1',
        date: '2025-01-02',
        workoutType: 'push',
        dayNumber: 1,
        weekNumber: 1,
        exercises: [
          {
            id: 'e2e-ex-1',
            name: 'Bench Press',
            targetSets: 4,
            targetReps: '6-10',
            sets: [
              { weight: 155, reps: 8, completed: true, skipped: false },
              { weight: 155, reps: 8, completed: true, skipped: false },
              { weight: 155, reps: 7, completed: true, skipped: false },
              { weight: 155, reps: 6, completed: true, skipped: false },
            ],
          },
        ],
        completed: true,
        xpAwarded: true,
        startTime: 1735833600000,
        endTime: 1735836900000,
      },
    ],
    currentWeek: 2,
    customizations: [],
  }, 0)

  // Macro store -- targets + one day of logs
  await seedStore(page, STORE_KEYS.macros, {
    targets: { protein: 180, calories: 2400, carbs: 240, fats: 70 },
    mealPlan: [
      { name: 'Meal 1 (Breakfast)', protein: 45, carbs: 60, fats: 18, calories: 578 },
      { name: 'Meal 2 (Lunch)', protein: 45, carbs: 60, fats: 20, calories: 600 },
      { name: 'Meal 3 (Dinner)', protein: 55, carbs: 70, fats: 18, calories: 658 },
      { name: 'Meal 4 (Snack)', protein: 35, carbs: 50, fats: 14, calories: 470 },
    ],
    dailyLogs: [
      {
        date: new Date().toISOString().split('T')[0],
        protein: 120,
        calories: 1600,
        carbs: 160,
        fats: 45,
        meals: [
          { mealNumber: 1, protein: 40, carbs: 50, fats: 15, calories: 495, logged: true },
          { mealNumber: 2, protein: 40, carbs: 50, fats: 15, calories: 495, logged: true },
          { mealNumber: 3, protein: 40, carbs: 60, fats: 15, calories: 535, logged: false },
          { mealNumber: 4, protein: 0, carbs: 0, fats: 0, calories: 0, logged: false },
        ],
        loggedMeals: [
          { id: 'e2e-meal-1', name: 'Eggs & Oats', protein: 40, carbs: 50, fats: 15, calories: 495, timestamp: Date.now() - 3600000 },
          { id: 'e2e-meal-2', name: 'Chicken & Rice', protein: 40, carbs: 50, fats: 15, calories: 495, timestamp: Date.now() - 1800000 },
        ],
        targetSnapshot: { protein: 180, calories: 2400, carbs: 240, fats: 70 },
      },
    ],
    savedMeals: [
      {
        id: 'e2e-saved-1',
        name: 'Post-Workout Shake',
        createdAt: 1734652800000,
        usageCount: 5,
        protein: 50,
        carbs: 40,
        fats: 5,
        calories: 405,
        ingredients: [
          { id: 'e2e-ing-1', name: 'Whey Protein', quantity: 2, unit: 'serving', protein: 50, carbs: 6, fats: 3, calories: 250 },
          { id: 'e2e-ing-2', name: 'Banana', quantity: 1, unit: 'serving', protein: 1, carbs: 27, fats: 0, calories: 105 },
        ],
      },
    ],
    recentFoods: [
      {
        id: 'e2e-recent-1', name: 'Oatmeal', brand: 'Quaker', protein: 5, carbs: 27, fats: 3, calories: 150,
        servingSize: 40, servingDescription: '1/2 cup dry', quantity: 1, unit: 'serving',
        loggedAt: Date.now() - 7200000,
      },
      {
        id: 'e2e-recent-2', name: 'Whey Protein', brand: 'ON', protein: 24, carbs: 3, fats: 1, calories: 120,
        servingSize: 31, servingDescription: '1 scoop', quantity: 1, unit: 'serving',
        loggedAt: Date.now() - 3600000,
      },
    ],
    favoriteFoods: [],
    activityLevel: 'moderate',
  }, 4)

  // XP store -- some accumulated XP
  await seedStore(page, STORE_KEYS.xp, {
    totalXP: 2500,
    currentLevel: 8,
    pendingXP: 150,
    weeklyHistory: [
      { weekOf: '2025-01-01', xpEarned: 1200, levelReached: 6 },
      { weekOf: '2025-01-08', xpEarned: 1300, levelReached: 8 },
    ],
    dailyLogs: [
      {
        date: new Date().toISOString().split('T')[0],
        workout: false,
        protein: false,
        calories: false,
        checkIn: false,
        perfectDay: false,
        streakBonus: 70,
        total: 150,
        claimed: false,
      },
    ],
    lastClaimDate: '2025-01-08',
  }, 0)

  // Avatar store
  await seedStore(page, STORE_KEYS.avatar, {
    baseCharacter: 'dominant',
    evolutionStage: 5,
    currentMood: 'happy',
    accessories: [],
    lastInteraction: Date.now(),
    recentReaction: null,
  }, 0)

  // Achievements store
  await seedStore(page, STORE_KEYS.achievements, {
    earnedBadges: [
      { badgeId: 'first-rep', earnedAt: 1734652800000 },
      { badgeId: 'day-one', earnedAt: 1734652800000 },
    ],
    lastChecked: Date.now(),
  }, 0)

  // Reminders store
  await seedStore(page, STORE_KEYS.reminders, {
    preferences: {
      logMacros: true,
      checkIn: true,
      claimXP: true,
      workout: true,
    },
    dismissedToday: [],
    lastDismissDate: null,
  }, 0)
}

/**
 * Clear all gamify-gains-* keys from localStorage.
 */
export async function clearAllStores(page: Page) {
  await page.addInitScript(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('gamify-gains-'))
    keys.forEach(k => localStorage.removeItem(k))
  })
}
