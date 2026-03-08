/**
 * Home Dashboard E2E tests.
 *
 * Covers userflow feature 3.3: Home Dashboard
 * - Greeting with username displayed
 * - Protocol orders (action cards) visible
 * - Rank card with DP progress
 * - Context-aware cards (check-in visibility based on state)
 */
import { test as baseTest, expect as baseExpect } from '@playwright/test'
import { test, expect } from '../fixtures/base'
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

/** Wait for app */
async function waitForApp(page: import('@playwright/test').Page) {
    await page.waitForSelector('[aria-label="Main navigation"], nav', {
        timeout: 15000,
    })
}

// ============================================================
// HOME-01: Home screen shows greeting with username
// ============================================================
baseTest('HOME-01: home -- greeting with username displayed', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/')
    await waitForApp(page)

    await baseExpect(page.locator('[data-testid="home-screen"]')).toBeVisible({ timeout: 10000 })

    // Seeded user has username 'E2ETestUser' — greeting should display callsign
    await baseExpect(page.getByText(/E2ETESTUSER/i)).toBeVisible({ timeout: 5000 })
})

// ============================================================
// HOME-02: Protocol orders section visible
// ============================================================
baseTest('HOME-02: home -- protocol orders section is visible', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/')
    await waitForApp(page)

    await baseExpect(page.locator('[data-testid="home-screen"]')).toBeVisible({ timeout: 10000 })

    // Protocol Orders section should have action cards
    // Common cards: "Check In", "Workout", "Daily Report"
    await baseExpect(
        page.getByText(/Protocol Orders|Orders|Check In|Daily/i).first()
    ).toBeVisible({ timeout: 5000 })
})

// ============================================================
// HOME-03: Rank card displays DP
// ============================================================
baseTest('HOME-03: home -- rank card shows DP progress', async ({ page }) => {
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/')
    await waitForApp(page)

    await baseExpect(page.locator('[data-testid="home-screen"]')).toBeVisible({ timeout: 10000 })

    // Seeded DP is 1800, rank 3 — verify rank or DP text visible
    await baseExpect(
        page.getByText(/Rank|DP|1,?800/i).first()
    ).toBeVisible({ timeout: 5000 })
})

// ============================================================
// HOME-04: Check-in button hidden when already checked in today
// ============================================================
baseTest('HOME-04: home -- check-in button hidden when already checked in', async ({ page }) => {
    // Default seed has lastCheckInDate set to today, so user already checked in
    await seedAllStores(page)
    await disableAnimations(page)
    await page.goto('/')
    await waitForApp(page)

    await baseExpect(page.locator('[data-testid="home-screen"]')).toBeVisible({ timeout: 10000 })

    // The check-in button should NOT be visible (already checked in today)
    await baseExpect(page.locator('[data-testid="home-checkin-button"]')).not.toBeVisible({ timeout: 3000 })
})

// ============================================================
// HOME-05: Check-in button visible when not checked in today
// ============================================================
baseTest('HOME-05: home -- check-in button visible when not checked in', async ({ page }) => {
    await seedAllStores(page)

    // Override user store: set lastCheckInDate to yesterday
    await page.addInitScript(() => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const key = 'gamify-gains-user'
        const stored = localStorage.getItem(key)
        if (stored) {
            const data = JSON.parse(stored)
            data.state.profile.lastCheckInDate = yesterdayStr
            localStorage.setItem(key, JSON.stringify(data))
        }
    })

    await disableAnimations(page)
    await page.goto('/')
    await waitForApp(page)

    await baseExpect(page.locator('[data-testid="home-screen"]')).toBeVisible({ timeout: 10000 })

    // The check-in button should be visible
    await baseExpect(page.locator('[data-testid="home-checkin-button"]')).toBeVisible({ timeout: 5000 })
})
