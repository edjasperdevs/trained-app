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
      testIgnore: /auth-onboarding\.spec\.ts/,
    },
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5174',
      },
      testMatch: /auth-onboarding\.spec\.ts/,
    },
  ],

  webServer: [
    {
      command: 'npx vite --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      env: { VITE_DEV_BYPASS: 'true' },
    },
    {
      command: 'npx vite --port 5174',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_SUPABASE_URL: 'http://fake-supabase.test',
        VITE_SUPABASE_ANON_KEY: 'fake-anon-key-for-e2e',
      },
    },
  ],
})
