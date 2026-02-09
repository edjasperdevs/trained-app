/**
 * E2E tests for workout UI features added in this session:
 *
 * E2E-12: Warmup set -- each exercise starts with a labeled warmup set
 * E2E-13: Input labels -- weight/reps inputs have "lbs" and "reps" labels
 * E2E-14: Placeholder carry-forward -- completing a set pre-fills the next set's placeholders
 * E2E-15: Exercise reorder -- move exercises up/down during active workout
 */
import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { seedAllStores, seedStore, STORE_KEYS } from '../helpers/storage'

/** Inject CSS to disable animations */
async function disableAnimations(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const style = document.createElement('style')
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
    if (document.head) {
      document.head.appendChild(style)
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.head.appendChild(style)
      })
    }
  })
}

/** Wait for the app to be ready */
async function waitForApp(page: import('@playwright/test').Page) {
  await page.waitForSelector('[aria-label="Main navigation"], nav', {
    timeout: 15000,
  })
}

/** Seed stores with every-day schedule so tests pass regardless of day */
async function seedWithEveryDaySchedule(page: import('@playwright/test').Page) {
  await seedAllStores(page)
  await seedStore(page, STORE_KEYS.workouts, {
    currentPlan: {
      trainingDays: 4,
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      schedule: [
        { day: 0, type: 'push', name: 'Push Day', dayNumber: 1 },
        { day: 1, type: 'pull', name: 'Pull Day', dayNumber: 2 },
        { day: 2, type: 'legs', name: 'Leg Day', dayNumber: 3 },
        { day: 3, type: 'upper', name: 'Upper Day', dayNumber: 4 },
        { day: 4, type: 'push', name: 'Push Day', dayNumber: 1 },
        { day: 5, type: 'pull', name: 'Pull Day', dayNumber: 2 },
        { day: 6, type: 'legs', name: 'Leg Day', dayNumber: 3 },
      ],
    },
    workoutLogs: [],
    currentWeek: 1,
    customizations: [],
  }, 0)
}

/** Navigate to workouts and start a workout */
async function startWorkout(page: import('@playwright/test').Page) {
  await page.locator('[data-testid="nav-workouts"]').click()
  await baseExpect(page.locator('[data-testid="workouts-screen"]')).toBeVisible({ timeout: 10000 })
  await baseExpect(page.locator('[data-testid="workouts-start-button"]')).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="workouts-start-button"]').click()
  await baseExpect(page.locator('[data-testid="workouts-exercise-card"]').first()).toBeVisible({ timeout: 10000 })
}

// ============================================================
// E2E-12: Warmup set
// ============================================================
baseTest('E2E-12: warmup set -- each exercise has a labeled warmup set', async ({ page }) => {
  await seedWithEveryDaySchedule(page)
  await disableAnimations(page)
  await page.goto('/')
  await waitForApp(page)
  await startWorkout(page)

  // First exercise is expanded by default
  const firstCard = page.locator('[data-testid="workouts-exercise-card"]').first()

  // Should have a "Warmup" label
  await baseExpect(firstCard.getByText('Warmup')).toBeVisible()

  // The warmup set should be the first row, followed by "Set 1"
  await baseExpect(firstCard.getByText('Set 1')).toBeVisible()

  // Warmup set should have weight and reps inputs
  const weightInputs = firstCard.locator('[data-testid="workouts-set-weight-input"]')
  const repsInputs = firstCard.locator('[data-testid="workouts-set-reps-input"]')
  const weightCount = await weightInputs.count()
  const repsCount = await repsInputs.count()

  // Should have at least 2 rows (warmup + at least 1 working set)
  baseExpect(weightCount).toBeGreaterThanOrEqual(2)
  baseExpect(repsCount).toBeGreaterThanOrEqual(2)
})

// ============================================================
// E2E-13: Input labels
// ============================================================
baseTest('E2E-13: input labels -- weight and reps inputs have lbs/reps labels', async ({ page }) => {
  await seedWithEveryDaySchedule(page)
  await disableAnimations(page)
  await page.goto('/')
  await waitForApp(page)
  await startWorkout(page)

  const firstCard = page.locator('[data-testid="workouts-exercise-card"]').first()

  // Should have "lbs" and "reps" labels
  await baseExpect(firstCard.getByText('lbs').first()).toBeVisible()
  await baseExpect(firstCard.getByText('reps').first()).toBeVisible()
})

// ============================================================
// E2E-14: Placeholder carry-forward
// ============================================================
baseTest('E2E-14: placeholder carry-forward -- completing set 1 pre-fills set 2 placeholder', async ({ page }) => {
  await seedWithEveryDaySchedule(page)
  await disableAnimations(page)
  await page.goto('/')
  await waitForApp(page)
  await startWorkout(page)

  const firstCard = page.locator('[data-testid="workouts-exercise-card"]').first()

  // Fill the warmup set first (index 0) and complete it
  await firstCard.locator('[data-testid="workouts-set-weight-input"]').nth(0).fill('65')
  await firstCard.locator('[data-testid="workouts-set-reps-input"]').nth(0).fill('10')
  await firstCard.locator('[data-testid="workouts-set-checkbox"]').first().click()

  // Fill Set 1 (index 1) with weight and reps
  await firstCard.locator('[data-testid="workouts-set-weight-input"]').nth(1).fill('135')
  await firstCard.locator('[data-testid="workouts-set-reps-input"]').nth(1).fill('8')
  await firstCard.locator('[data-testid="workouts-set-checkbox"]').first().click()

  // Set 2 (index 2) should now have placeholder "135" for weight
  const set2Weight = firstCard.locator('[data-testid="workouts-set-weight-input"]').nth(2)
  await baseExpect(set2Weight).toHaveAttribute('placeholder', '135')

  // Set 2 should have placeholder "8" for reps
  const set2Reps = firstCard.locator('[data-testid="workouts-set-reps-input"]').nth(2)
  await baseExpect(set2Reps).toHaveAttribute('placeholder', '8')
})

// ============================================================
// E2E-15: Exercise reorder
// ============================================================
baseTest('E2E-15: exercise reorder -- move exercise up and down during workout', async ({ page }) => {
  await seedWithEveryDaySchedule(page)
  await disableAnimations(page)
  await page.goto('/')
  await waitForApp(page)
  await startWorkout(page)

  const exerciseCards = page.locator('[data-testid="workouts-exercise-card"]')

  // Get the names of the first two exercises
  const firstName = await exerciseCards.nth(0).locator('p.font-semibold').textContent()
  const secondName = await exerciseCards.nth(1).locator('p.font-semibold').textContent()

  // Click the down arrow on the first exercise to move it down
  await exerciseCards.nth(0).locator('[data-testid="workouts-move-down"]').click()

  // After reorder, the first exercise should now be what was the second
  const newFirstName = await exerciseCards.nth(0).locator('p.font-semibold').textContent()
  const newSecondName = await exerciseCards.nth(1).locator('p.font-semibold').textContent()

  baseExpect(newFirstName).toBe(secondName)
  baseExpect(newSecondName).toBe(firstName)

  // Now move it back up
  await exerciseCards.nth(1).locator('[data-testid="workouts-move-up"]').click()

  // Should be back to original order
  const restoredFirstName = await exerciseCards.nth(0).locator('p.font-semibold').textContent()
  const restoredSecondName = await exerciseCards.nth(1).locator('p.font-semibold').textContent()

  baseExpect(restoredFirstName).toBe(firstName)
  baseExpect(restoredSecondName).toBe(secondName)
})
