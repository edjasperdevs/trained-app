/**
 * Custom Playwright test fixtures.
 *
 * authenticatedPage: Logs in via the Auth screen UI for real auth tests.
 * seededPage: Seeds localStorage for tests that need controlled state (requires VITE_DEV_BYPASS).
 *
 * Both fixtures disable animations for deterministic tests.
 */
import { test as base, type Page } from '@playwright/test'
import { seedAllStores } from '../helpers/storage'

// Test credentials from environment
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'qa-tester@trained.app'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'QATest2024!'

type Fixtures = {
  authenticatedPage: Page
  seededPage: Page
}

/** Inject CSS to disable animations */
async function disableAnimations(page: Page) {
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

export const test = base.extend<Fixtures>({
  /**
   * Page that logs in via real Supabase auth.
   * Use for tests that should run against real backend.
   */
  authenticatedPage: async ({ page }, use) => {
    await disableAnimations(page)

    // Navigate to the app
    await page.goto('/')

    // Wait for auth screen to load
    await page.waitForSelector('[data-testid="auth-screen"]', { timeout: 15000 })

    // Click "Sign In" from splash screen
    await page.click('text=Already a member?')

    // Fill in credentials
    await page.fill('input#email', TEST_EMAIL)
    await page.fill('input#password', TEST_PASSWORD)

    // Submit login form
    await page.click('button:has-text("Sign In")')

    // Wait for the app to render (main content visible after login)
    await page.waitForSelector('[aria-label="Main navigation"], nav', {
      timeout: 30000,
    })

    await use(page)
  },

  /**
   * Page with localStorage pre-seeded with test data.
   * Requires VITE_DEV_BYPASS=true to skip auth gates.
   * Use for tests that need controlled, predictable state.
   */
  seededPage: async ({ page }, use) => {
    // Seed all Zustand stores BEFORE page loads
    await seedAllStores(page)

    await disableAnimations(page)

    // Navigate to the app
    await page.goto('/')

    // Wait for the app to render (main content visible)
    await page.waitForSelector('[aria-label="Main navigation"], nav', {
      timeout: 15000,
    })

    await use(page)
  },
})

export { expect } from '@playwright/test'
