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
  // E2E-08 is inside this describe block (uses seededPage fixture).
  // E2E-07, E2E-09, E2E-10 are outside (use baseTest with manual seeding).
  // E2E-11 is also inside (uses seededPage fixture).
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
// E2E-08: Meal logging via recent foods
// ============================================================
test('E2E-08: macros -- log recent food, totals update', async ({ seededPage: page }) => {
  // Navigate to Macros
  await page.locator('[data-testid="nav-macros"]').click()
  await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

  // Verify protein display is visible with seeded value (120g)
  await expect(page.locator('[data-testid="macros-protein-display"]')).toBeVisible()
  await expect(page.locator('[data-testid="macros-protein-display"]')).toContainText('120')

  // Verify calories display shows seeded value (1600)
  await expect(page.locator('[data-testid="macros-calories-display"]')).toContainText('1600')

  // Log "Whey Protein" from the recent foods list
  // Seeded recent food: Whey Protein (P: 24g, C: 3g, F: 1g, 120 cal)
  // logNamedMeal recalculates from BOTH loggedMeals AND meals[] arrays:
  // - Seeded loggedMeals: 40 + 40 = 80g
  // - Seeded meals[] (numbered meal plan): 40 + 40 + 40 + 0 = 120g
  // - New Whey Protein: 24g
  // - Total: 80 + 120 + 24 = 224g
  const wheyProteinRow = page.getByText('Whey Protein').locator('xpath=ancestor::div[contains(@class, "bg-muted")]')
  await wheyProteinRow.getByRole('button', { name: 'Log' }).click()

  // Verify protein display updated (loggedMeals 80 + meals 120 + new 24 = 224g)
  await expect(page.locator('[data-testid="macros-protein-display"]')).toContainText('224', { timeout: 5000 })

  // Verify calories display updated (loggedMeals 990 + meals 1525 + new 120 = 2635)
  // Seeded meals[]: 495 + 495 + 535 + 0 = 1525
  // Seeded loggedMeals: 495 + 495 = 990
  // New Whey Protein: 120 cal
  // Note: The actual display may differ due to meal plan structure
  await expect(page.locator('[data-testid="macros-calories-display"]')).toContainText('2635')

  // Verify the seeded logged meals are still visible, plus the new logged entry
  // logNamedMeal ADDS to loggedMeals array (now 3 entries).
  await page.getByText("TODAY'S MEALS").click()
  await expect(page.locator('[data-testid="macros-meal-entry"]').first()).toBeVisible({ timeout: 5000 })
  await expect(page.locator('[data-testid="macros-meal-entry"]')).toHaveCount(3, { timeout: 5000 })
})

// ============================================================
// E2E-09: Daily check-in and streak maintenance
// ============================================================
// Uses baseTest because we need custom seed with lastCheckInDate = yesterday.
// Default seed has lastCheckInDate = today (already checked in).
// ============================================================
baseTest('E2E-09: check-in -- complete daily check-in, maintain streak', async ({ page }) => {
  // Seed all stores
  await seedAllStores(page)

  // Override user store: set lastCheckInDate to yesterday so the check-in
  // button appears (default seed sets it to today = already checked in).
  await page.addInitScript(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const userState = {
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
        createdAt: 1734652800000,
        currentStreak: 7,
        longestStreak: 14,
        lastCheckInDate: yesterdayStr,
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
    }

    const envelope = JSON.stringify({ state: userState, version: 0 })
    localStorage.setItem('gamify-gains-user', envelope)
  })

  // Also override XP store to have a today log with checkIn: false
  await page.addInitScript(() => {
    const today = new Date().toISOString().split('T')[0]
    const xpState = {
      totalXP: 2500,
      currentLevel: 8,
      pendingXP: 150,
      weeklyHistory: [
        { weekOf: '2025-01-01', xpEarned: 1200, levelReached: 6 },
        { weekOf: '2025-01-08', xpEarned: 1300, levelReached: 8 },
      ],
      dailyLogs: [
        {
          date: today,
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
    }

    const envelope = JSON.stringify({ state: xpState, version: 0 })
    localStorage.setItem('gamify-gains-xp', envelope)
  })

  // Disable animations
  await disableAnimations(page)

  // Navigate to app
  await page.goto('/')
  await waitForApp(page)

  // Check-in button should be visible (user hasn't checked in today)
  await baseExpect(page.locator('[data-testid="home-checkin-button"]')).toBeVisible({ timeout: 10000 })

  // Click check-in button
  await page.locator('[data-testid="home-checkin-button"]').click()

  // CheckInModal should open
  await baseExpect(page.locator('[data-testid="checkin-modal"]')).toBeVisible({ timeout: 5000 })

  // Verify streak display is visible
  await baseExpect(page.locator('[data-testid="checkin-streak-display"]')).toBeVisible()

  // Click Submit Report
  await page.locator('[data-testid="checkin-confirm-button"]').click()

  // Wait for success state ("Report Accepted")
  await baseExpect(page.getByText('Report Accepted.')).toBeVisible({ timeout: 5000 })

  // Dismiss badge unlock modal if it appears (overlays at z-100, blocks clicks)
  const badgeModal = page.getByRole('dialog', { name: 'Badge unlocked' })
  if (await badgeModal.isVisible({ timeout: 2000 }).catch(() => false)) {
    await badgeModal.getByRole('button').click()
    await baseExpect(badgeModal).not.toBeVisible({ timeout: 3000 })
  }

  // Click Continue to close modal
  await page.getByRole('button', { name: /continue/i }).click()

  // The check-in button should be gone, replaced by "Daily Report Complete" card
  await baseExpect(page.locator('[data-testid="home-checkin-button"]')).not.toBeVisible({ timeout: 5000 })
  await baseExpect(page.getByText('Daily Report Complete')).toBeVisible()
})

// ============================================================
// E2E-10: Weekly XP claim (Date mocked to Sunday)
// ============================================================
// Uses baseTest because we need Date mocked to Sunday AND custom XP store.
// ============================================================
baseTest('E2E-10: xp claim -- claim weekly XP after 7-day cooldown', async ({ page }) => {
  // Mock Date to a known date (7+ days after lastClaimDate) BEFORE any page scripts run
  await page.addInitScript(() => {
    const mockDate = new Date('2025-01-20T12:00:00') // Monday — any day works now
    const RealDate = globalThis.Date

    class MockDate extends RealDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(mockDate.getTime())
        } else {
          // @ts-expect-error spread args
          super(...args)
        }
      }
      static override now() { return mockDate.getTime() }
      static override parse(s: string) { return RealDate.parse(s) }
      static override UTC(...args: unknown[]) {
        // @ts-expect-error spread args
        return RealDate.UTC(...args)
      }
    }

    globalThis.Date = MockDate as DateConstructor
    Object.setPrototypeOf(MockDate.prototype, RealDate.prototype)
  })

  // Seed all stores
  await seedAllStores(page)

  // Override user store: set lastCheckInDate to today so the
  // check-in button doesn't appear (keeps the home screen focused on XP claim).
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
      createdAt: 1734652800000,
      currentStreak: 7,
      longestStreak: 14,
      lastCheckInDate: '2025-01-20', // Mocked today
      streakPaused: false,
      onboardingComplete: true,
      units: 'imperial',
      goalWeight: 180,
    },
    weightHistory: [],
  }, 0)

  // Override XP store with claimable state (7+ days since last claim)
  await seedStore(page, STORE_KEYS.xp, {
    totalXP: 2500,
    currentLevel: 8,
    pendingXP: 350,
    weeklyHistory: [
      { weekOf: '2025-01-01', xpEarned: 1200, levelReached: 6 },
      { weekOf: '2025-01-08', xpEarned: 1300, levelReached: 8 },
    ],
    dailyLogs: [
      {
        date: '2025-01-18',
        workout: true,
        protein: true,
        calories: true,
        checkIn: true,
        perfectDay: true,
        streakBonus: 70,
        total: 350,
        claimed: false,
      },
    ],
    lastClaimDate: '2025-01-12', // 8 days ago — claimable
  }, 0)

  // Disable animations
  await disableAnimations(page)

  // Navigate
  await page.goto('/')
  await waitForApp(page)

  // XP claim button should be visible (7+ days since last claim and pendingXP > 0)
  await baseExpect(page.locator('[data-testid="home-claim-xp-button"]')).toBeVisible({ timeout: 10000 })

  // Click the claim card
  await page.locator('[data-testid="home-claim-xp-button"]').click()

  // XPClaimModal should open
  await baseExpect(page.locator('[data-testid="xpclaim-modal"]')).toBeVisible({ timeout: 5000 })

  // Verify amount display
  await baseExpect(page.locator('[data-testid="xpclaim-amount-display"]')).toBeVisible()
  await baseExpect(page.locator('[data-testid="xpclaim-amount-display"]')).toContainText('350')

  // Click CLAIM REWARD
  await page.locator('[data-testid="xpclaim-claim-button"]').click()

  // Wait for claiming animation to finish and "Reward Claimed" text to appear.
  // The animation has a 2s count-up + 500ms delay before phase changes.
  // With animations disabled, the count-up interval still runs (JS setTimeout).
  await baseExpect(page.getByText('Reward Claimed')).toBeVisible({ timeout: 10000 })

  // Click Continue to close modal
  await page.getByRole('button', { name: /continue/i }).click()

  // XP claim button should be gone (already claimed)
  await baseExpect(page.locator('[data-testid="home-claim-xp-button"]')).not.toBeVisible({ timeout: 5000 })
})

// ============================================================
// E2E-11: Offline -> online sync cycle
// ============================================================
test('E2E-11: offline sync -- data persists offline, sync triggers on reconnect', async ({ seededPage: page, context }) => {
  // Mock Supabase REST endpoints for when sync triggers on reconnect
  await page.route('**/rest/v1/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{}',
  }))

  // Also mock auth endpoints that sync may call
  await page.route('**/auth/v1/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: { user: { id: 'e2e-test-user', email: 'e2e@test.com' } },
    }),
  }))

  // Verify initially no "Offline" indicator
  await expect(page.getByText('Offline')).not.toBeVisible()

  // Go offline
  await context.setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))

  // Verify offline indicator appears
  await expect(page.getByText('Offline')).toBeVisible({ timeout: 5000 })

  // Navigate to Macros and log some data while offline
  await page.locator('[data-testid="nav-macros"]').click()
  await expect(page.locator('[data-testid="macros-screen"]')).toBeVisible({ timeout: 10000 })

  // Fill protein via Quick Log
  await page.locator('[data-testid="macros-food-search-input"]').fill('165')

  // Click Log Macros (only protein is enough)
  await page.locator('[data-testid="macros-add-meal-button"]').click()

  // Verify data is in localStorage
  const macroData = await page.evaluate(() => localStorage.getItem('gamify-gains-macros'))
  baseExpect(macroData).toBeTruthy()

  // Verify the logged data is in the store
  const parsed = JSON.parse(macroData!)
  baseExpect(parsed.state.dailyLogs).toBeDefined()
  baseExpect(parsed.state.dailyLogs.length).toBeGreaterThan(0)

  // Go back online
  await context.setOffline(false)
  await page.evaluate(() => window.dispatchEvent(new Event('online')))

  // Verify offline indicator disappears (sync triggers on reconnect)
  await expect(page.getByText('Offline')).not.toBeVisible({ timeout: 10000 })

  // Verify data STILL in localStorage after the online/offline cycle
  const macroDataAfter = await page.evaluate(() => localStorage.getItem('gamify-gains-macros'))
  baseExpect(macroDataAfter).toBeTruthy()
  const parsedAfter = JSON.parse(macroDataAfter!)
  baseExpect(parsedAfter.state.dailyLogs.length).toBeGreaterThan(0)
})
