import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'admin',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8080',
      },
      testMatch: ['admin.spec.ts', 'time-entries-admin.spec.ts', 'stats-admin.spec.ts'],
    },
    {
      name: 'worker',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8081',
      },
      testMatch: 'worker.spec.ts',
    },
  ],
});