/**
 * Core journey E2E tests -- verifies the 5 launch-critical user flows.
 *
 * E2E-07: Full workout logging (start, fill sets, complete)
 * E2E-08: Meal logging via Quick Log (protein/calories, totals update)
 * E2E-09: Daily check-in and streak maintenance
 * E2E-10: Weekly XP claim (Date mocked to Sunday)
 * E2E-11: Offline -> online sync cycle (data persists, sync triggers)
 *
 * Tests that need custom seed data use baseTest with manual seeding.
 * Tests that work with default seeds use the seededPage fixture.
 */
import { test, expect } from '../fixtures/base'
import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { seedAllStores, seedStore, STORE_KEYS } from '../helpers/storage'

/** Inject CSS to disable animations (same as seededPage fixture) */
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

/** Wait for the app to be ready (nav visible) */
async function waitForApp(page: import('@playwright/test').Page) {
  await page.waitForSelector('[aria-label="Main navigation"], nav', {
    timeout: 15000,
  })
}

test.describe('Core Journey Tests', () => {
  // ============================================================
  // E2E-07: Full workout logging flow
  // ============================================================
  // Uses baseTest because we need a custom workout schedule where
  // every day is a training day (avoids day-of-week failures).
  // ============================================================
})

baseTest('E2E-07: workout -- start, log sets, complete workout', async ({ page }) => {
  // Seed all stores first
  await seedAllStores(page)

  // Override workout store: make ALL 7 days training days so the test
  // passes regardless of what day it runs on.
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

  // Disable animations
  await disableAnimations(page)

  // Navigate
  await page.goto('/')
  await waitForApp(page)

  // Go to Workouts screen
  await page.locator('[data-testid="nav-workouts"]').click()
  await baseExpect(page.locator('[data-testid="workouts-screen"]')).toBeVisible({ timeout: 10000 })

  // Start button should be visible (every day is a training day)
  await baseExpect(page.locator('[data-testid="workouts-start-button"]')).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="workouts-start-button"]').click()

  // Exercise cards should appear
  await baseExpect(page.locator('[data-testid="workouts-exercise-card"]').first()).toBeVisible({ timeout: 10000 })

  // Count exercises -- the 4-day templates have 5 exercises with 2 sets each
  const exerciseCards = page.locator('[data-testid="workouts-exercise-card"]')
  const exerciseCount = await exerciseCards.count()
  baseExpect(exerciseCount).toBeGreaterThan(0)

  // For each exercise, complete all sets.
  // After clicking "Done" on a set, the button changes to a checkmark.
  // So we always fill the FIRST visible weight/reps inputs and click
  // the FIRST visible Done button, since completed sets lose their inputs.
  for (let exIdx = 0; exIdx < exerciseCount; exIdx++) {
    const card = exerciseCards.nth(exIdx)

    // Expand exercise card by clicking on it (first exercise is already expanded)
    if (exIdx > 0) {
      await card.locator('button').first().click()
    }

    // Wait for exercise content to be visible
    await baseExpect(card.locator('[data-testid="workouts-set-weight-input"]').first()).toBeVisible({ timeout: 5000 })

    // Count how many sets this exercise has
    const setCount = await card.locator('[data-testid="workouts-set-weight-input"]').count()

    for (let setIdx = 0; setIdx < setCount; setIdx++) {
      // After completing a set, its weight/reps inputs become dimmed and
      // the Done button becomes a checkmark. The remaining uncompleted sets
      // still have their inputs. We always target the FIRST uncompleted set's inputs.
      // Weight inputs for completed sets still exist in DOM (just opacity reduced),
      // so we need to target specifically the ones that still have a Done button.
      const doneButton = card.locator('[data-testid="workouts-set-checkbox"]').first()
      await baseExpect(doneButton).toBeVisible({ timeout: 5000 })

      // The Done button's parent row has the weight and reps inputs.
      // Find the set row that contains this Done button -- use the nth uncompleted set.
      // Since completed sets don't have Done buttons, the first Done button
      // corresponds to the first uncompleted set.
      // Get all weight inputs and fill the one matching the current uncompleted set index.
      // Actually, since completed set inputs still exist, we fill by absolute index.
      await card.locator('[data-testid="workouts-set-weight-input"]').nth(setIdx).fill('135')
      await card.locator('[data-testid="workouts-set-reps-input"]').nth(setIdx).fill('8')

      // Click the first available Done button (always the first uncompleted set)
      await doneButton.click()
    }
  }

  // Complete button should now be enabled
  await baseExpect(page.locator('[data-testid="workouts-complete-button"]')).toBeEnabled({ timeout: 5000 })

  // Click complete
  await page.locator('[data-testid="workouts-complete-button"]').click()

  // After completion, the active workout view disappears and the start button
  // should either show "Done!" or the workout card should show a completion state.
  // The workout is now completed for today, so we should see the "Done!" indicator.
  await baseExpect(page.getByText('Done!')).toBeVisible({ timeout: 10000 })
})

// ============================================================
// E2E-08: Meal logging via Quick Log
// ============================================================
test('E2E-08: macros -- log meal via Quick Log, totals update', async ({ seededPage: page }) => {
  // Navigate to Macros
  await page.locator('[data-testid="nav-macros"]').click()
  await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

  // Verify protein display is visible with seeded value (120g)
  await expect(page.locator('[data-testid="macros-protein-display"]')).toBeVisible()
  await expect(page.locator('[data-testid="macros-protein-display"]')).toContainText('120')

  // Verify calories display shows seeded value (1600)
  await expect(page.locator('[data-testid="macros-calories-display"]')).toContainText('1600')

  // Fill Quick Log protein -- logQuickMacros REPLACES daily totals (not additive)
  await page.locator('[data-testid="macros-food-search-input"]').fill('155')

  // Fill Quick Log calories -- the label element is not programmatically linked
  // via htmlFor/id. Locate via xpath: the calories input is in the same grid as
  // the protein input, in the adjacent grid column.
  const caloriesInput = page.locator('[data-testid="macros-food-search-input"]')
    .locator('xpath=ancestor::div[contains(@class, "grid")]')
    .locator('input')
    .nth(1)
  await caloriesInput.fill('2100')

  // Click Log Macros
  await expect(page.locator('[data-testid="macros-add-meal-button"]')).toBeEnabled()
  await page.locator('[data-testid="macros-add-meal-button"]').click()

  // Verify protein display updated to the new value (155g)
  await expect(page.locator('[data-testid="macros-protein-display"]')).toContainText('155')

  // Verify calories display updated to the new value (2100)
  await expect(page.locator('[data-testid="macros-calories-display"]')).toContainText('2100')

  // Verify the seeded logged meals are still visible
  // Quick Log updates daily totals but does NOT add to loggedMeals.
  // The 2 seeded meals should still be shown.
  await page.getByText("TODAY'S MEALS").click()
  await expect(page.locator('[data-testid="macros-meal-entry"]').first()).toBeVisible({ timeout: 5000 })
  await expect(page.locator('[data-testid="macros-meal-entry"]')).toHaveCount(2, { timeout: 5000 })
})
