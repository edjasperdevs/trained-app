/**
 * Custom Playwright test fixture with seededPage.
 *
 * seededPage: A Page that has all Zustand stores pre-seeded in localStorage
 * before the page loads, so the app starts in a pre-authenticated state.
 * Animations are disabled via CSS override.
 */
import { test as base, type Page } from '@playwright/test'
import { seedAllStores } from '../helpers/storage'

type Fixtures = {
  seededPage: Page
}

export const test = base.extend<Fixtures>({
  seededPage: async ({ page }, use) => {
    // Seed all Zustand stores BEFORE page loads
    await seedAllStores(page)

    // Disable animations and transitions for deterministic tests
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
      // Inject as soon as <head> exists
      if (document.head) {
        document.head.appendChild(style)
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          document.head.appendChild(style)
        })
      }
    })

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
