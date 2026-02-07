/**
 * Auth and onboarding E2E tests.
 *
 * These tests run against the chromium-auth Playwright project which
 * starts a Vite dev server on port 5174 WITHOUT VITE_DEV_BYPASS.
 * This means AccessGate, Auth, and Onboarding screens render naturally.
 * Supabase auth calls are mocked via page.route().
 *
 * E2E-05: New user -- access gate -> sign up -> onboarding -> home
 * E2E-06: Existing user -- sign in -> home with seeded data
 */
import { test, expect } from '@playwright/test'
import { mockSupabaseSignUp, mockSupabaseSignIn } from '../helpers/supabase-mocks'
import { seedAllStores } from '../helpers/storage'

test.describe('Auth and Onboarding Journeys', () => {
  test('E2E-05: new user -- access gate -> sign up -> onboarding -> home', async ({ page }) => {
    // Set up Supabase mocks BEFORE navigation
    await mockSupabaseSignUp(page)

    // Navigate to app -- no seeded data, no VITE_DEV_BYPASS
    // App should show AccessGate because hasAccess is false
    await page.goto('/')

    // --- ACCESS GATE ---
    await expect(page.locator('[data-testid="access-gate"]')).toBeVisible({ timeout: 15000 })

    // Enter a valid access code (8+ chars triggers dev fallback validation)
    await page.locator('[data-testid="access-code-input"]').fill('TESTCODE1234')
    await page.locator('[data-testid="access-submit-button"]').click()

    // After code validation, the accessStore sets hasAccess=true which may cause
    // AppContent to unmount AccessGate before the success modal renders.
    // Handle both scenarios: if modal appears, click "Begin"; otherwise proceed to Auth.
    const successModal = page.getByText('Access Granted')
    const authScreen = page.locator('[data-testid="auth-screen"]')

    // Wait for either the success modal or the auth screen
    await expect(successModal.or(authScreen)).toBeVisible({ timeout: 10000 })

    // If the success modal is visible, click "Begin" to proceed
    if (await successModal.isVisible()) {
      await page.getByRole('button', { name: /begin/i }).click()
    }

    // --- AUTH SCREEN (signup mode) ---
    await expect(authScreen).toBeVisible({ timeout: 10000 })

    // Auth defaults to signup mode -- verify "Create Account" card title visible
    await expect(page.locator('[data-testid="auth-submit-button"]')).toBeVisible()

    // Fill email
    await page.locator('[data-testid="auth-email-input"]').fill('e2e@test.com')

    // Fill password
    await page.locator('[data-testid="auth-password-input"]').fill('TestPassword123!')

    // Fill confirm password (no data-testid, use label)
    await page.getByLabel(/confirm password/i).fill('TestPassword123!')

    // Click submit
    await page.locator('[data-testid="auth-submit-button"]').click()

    // --- ONBOARDING ---
    // After mock signup returns session, App.tsx renders Onboarding
    await expect(page.locator('[data-testid="onboarding-screen"]')).toBeVisible({ timeout: 15000 })

    // Step 1 (Welcome): Click "Start" button
    await page.getByRole('button', { name: /start/i }).click()

    // Step 2 (Name): Fill username and continue
    await expect(page.locator('[data-testid="onboarding-username-input"]')).toBeVisible({ timeout: 5000 })
    await page.locator('[data-testid="onboarding-username-input"]').fill('E2ENewUser')
    await page.locator('[data-testid="onboarding-next-button"]').click()

    // Step 3 (Gender): Select male and continue
    await expect(page.locator('[data-testid="onboarding-gender-male"]')).toBeVisible({ timeout: 5000 })
    await page.locator('[data-testid="onboarding-gender-male"]').click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 4 (Fitness): Select first option (Uninitiated/beginner) and continue
    await expect(page.getByText('Training experience')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /uninitiated/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 5 (Days): Select 3 days and continue
    await expect(page.locator('[data-testid="onboarding-training-days-3"]')).toBeVisible({ timeout: 5000 })
    await page.locator('[data-testid="onboarding-training-days-3"]').click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 6 (Schedule): Days auto-selected from step 5, just continue
    await expect(page.getByText('Select your training days')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 7 (Goal): Fill stats and select goal
    await expect(page.locator('[data-testid="onboarding-weight-input"]')).toBeVisible({ timeout: 5000 })

    // Height: fill feet input with 5, inches input with 10 (= 70 inches total)
    // The goal step is inside [data-testid="onboarding-step-7"]
    const goalStep = page.locator('[data-testid="onboarding-step-7"]')
    await goalStep.locator('[data-testid="onboarding-height-input"]').fill('5')
    // The inches input is the second number input in the step (no testid)
    await goalStep.locator('input[type="number"]').nth(1).fill('10')

    // Weight
    await page.locator('[data-testid="onboarding-weight-input"]').fill('180')

    // Age
    await page.locator('[data-testid="onboarding-age-input"]').fill('28')

    // Select recomp goal
    await page.locator('[data-testid="onboarding-goal-recomp"]').click()

    // Continue
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 8 (Avatar): Select first avatar option (The Dom/me) and continue
    await expect(page.getByText('Choose your persona')).toBeVisible({ timeout: 5000 })
    // The default selection is 'dominant' (The Dom/me) -- click it to confirm
    await page.getByRole('button', { name: /dom\/me/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 9 (Features): Just continue
    await expect(page.getByText('How the protocol works')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 10 (Tutorial): Click "Begin" to finish onboarding
    await expect(page.getByText('Protocol initialized')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /begin/i }).click()

    // After finishOnboarding() sets onboardingComplete=true in the user store,
    // App.tsx re-renders and skips the Onboarding route, going directly to Home.
    // The evolution step may briefly render or may be skipped entirely by the
    // parent re-render. Handle both scenarios:
    const evolutionBeginButton = page.getByRole('button', { name: /begin/i })
    const homeScreen = page.locator('[data-testid="home-screen"]')

    // Wait for either evolution step or home screen
    await expect(evolutionBeginButton.or(homeScreen)).toBeVisible({ timeout: 15000 })

    // If evolution step appeared, click "Begin" to proceed to Home
    if (await evolutionBeginButton.isVisible()) {
      await evolutionBeginButton.click()
    }

    // --- HOME SCREEN ---
    await expect(page.locator('[data-testid="home-screen"]')).toBeVisible({ timeout: 15000 })

    // Verify username is displayed
    await expect(page.getByText('E2ENewUser')).toBeVisible()

    // Verify navigation is visible
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible()
  })

  test('E2E-06: existing user -- sign in -> home with seeded data', async ({ page }) => {
    // Set up Supabase mocks BEFORE navigation
    await mockSupabaseSignIn(page)

    // Seed all stores (access with hasAccess:true, user with onboardingComplete:true, etc.)
    // This must be called BEFORE page.goto() since it uses page.addInitScript
    await seedAllStores(page)

    // Navigate to app
    await page.goto('/')

    // App has hasAccess:true (seeded) but Supabase user is null (no session)
    // So it shows Auth screen
    await expect(page.locator('[data-testid="auth-screen"]')).toBeVisible({ timeout: 15000 })

    // Auth defaults to signup mode -- switch to login
    await page.locator('[data-testid="auth-toggle-mode"]').click()

    // Verify we're in login mode
    await expect(page.getByText('Sign In', { exact: true }).first()).toBeVisible()

    // Fill email
    await page.locator('[data-testid="auth-email-input"]').fill('e2e@test.com')

    // Fill password
    await page.locator('[data-testid="auth-password-input"]').fill('TestPassword123!')

    // Click submit
    await page.locator('[data-testid="auth-submit-button"]').click()

    // After mock sign-in returns session, app finds seeded profile with
    // onboardingComplete:true and renders Home screen
    await expect(page.locator('[data-testid="home-screen"]')).toBeVisible({ timeout: 15000 })

    // Verify seeded username is displayed
    await expect(page.getByText('E2ETestUser')).toBeVisible()

    // Verify XP display is visible
    await expect(page.locator('[data-testid="home-xp-display"]')).toBeVisible()

    // Verify level display is visible
    await expect(page.locator('[data-testid="home-level-display"]')).toBeVisible()

    // Verify streak display is visible
    await expect(page.locator('[data-testid="home-streak-display"]')).toBeVisible()
  })
})
