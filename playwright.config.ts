import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Smoke tests use real auth to verify login flow works
      testMatch: /smoke\.spec\.ts/,
    },
    {
      name: 'chromium-bypass',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5174',
      },
      // Tests that need seeded data use dev bypass
      testMatch: /(core-journeys|p0-critical|workout-features|favorites|food-search)\.spec\.ts/,
    },
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5174',
      },
      // Auth/onboarding tests mock Supabase and need bypass for access gate
      testMatch: /(auth-onboarding|meal-persistence)\.spec\.ts/,
    },
  ],

  webServer: [
    {
      // Real auth server - no bypass, uses real Supabase from .env
      command: 'npx vite --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
    {
      // Bypass server - for seeded tests and auth mocking
      command: 'npx vite --port 5174',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      env: { VITE_DEV_BYPASS: 'true' },
    },
  ],
})
