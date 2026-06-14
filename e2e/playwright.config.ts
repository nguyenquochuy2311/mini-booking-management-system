import { defineConfig, devices } from '@playwright/test'
import { FRONTEND_URL, STORAGE_STATE } from './src/helpers/constants'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './tests',

  // Shared, mutable database → never parallelise writes. Single worker keeps the
  // per-room overlap checks deterministic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,

  reporter: [['list'], ['html', { open: 'never' }]],
  // Generous to absorb remote-TiDB latency: the dev server opens a fresh TLS
  // connection to TiDB Cloud per request (no pooling), so a login/write can take
  // a few seconds.
  timeout: 60_000,
  expect: { timeout: 15_000 },

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  use: {
    baseURL: FRONTEND_URL,
    // Authenticated by default; logged-out specs override storageState.
    storageState: STORAGE_STATE,
    // Pinned so datetime-local → UTC conversion is reproducible everywhere.
    timezoneId: 'Asia/Singapore',
    locale: 'en-SG',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Auto-start the Vite SPA. The Laravel API + DB are an external prerequisite
  // (global-setup fails loudly with remediation if they are not up).
  webServer: {
    command: 'npm --prefix ../frontend run dev -- --port 5173 --strictPort',
    url: FRONTEND_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
