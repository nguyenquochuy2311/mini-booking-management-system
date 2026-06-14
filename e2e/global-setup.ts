import { request as pwRequest } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { ApiClient } from './src/helpers/api'
import { FRONTEND_URL, LOCALSTORAGE_TOKEN_KEY, ROOMS, STORAGE_STATE } from './src/helpers/constants'

/**
 * Runs once before the suite:
 *   1. Assert the API is reachable and the admin can log in.
 *   2. Assert the seeded rooms exist.
 *   3. Sweep any leftover e2e-owned bookings from previous runs.
 *   4. Write an authenticated storageState (localStorage token) for the SPA,
 *      so authenticated specs start signed in without re-logging-in each time.
 */
export default async function globalSetup() {
  const ctx = await pwRequest.newContext()

  let api: ApiClient
  try {
    api = await ApiClient.login(ctx)
  } catch (error) {
    throw new Error(
      `\n[E2E global-setup] Could not reach the API or log in as admin.\n` +
        `→ Start the Laravel API first (pointed at your chosen DB) and make sure it is seeded.\n` +
        `  TiDB:        cd backend && docker run --rm -p 8000:8000 -v "$PWD":/app -w /app booking-php php artisan serve --host=0.0.0.0 --port=8000\n` +
        `  Local MySQL: cd backend && docker compose up\n` +
        `Underlying error: ${(error as Error).message}\n`,
    )
  }

  const rooms = await api.getRooms()
  const names = new Set(rooms.map((r) => r.name))
  const missing = Object.keys(ROOMS).filter((n) => !names.has(n))
  if (missing.length > 0) {
    throw new Error(
      `[E2E global-setup] Missing seeded rooms: ${missing.join(', ')}. Run: php artisan db:seed`,
    )
  }

  const removed = await api.sweepE2eBookings()
  if (removed > 0) {
    console.log(`[E2E global-setup] swept ${removed} leftover e2e booking(s) from a previous run`)
  }

  const origin = new URL(FRONTEND_URL).origin
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true })
  fs.writeFileSync(
    STORAGE_STATE,
    JSON.stringify(
      {
        cookies: [],
        origins: [{ origin, localStorage: [{ name: LOCALSTORAGE_TOKEN_KEY, value: api.authToken }] }],
      },
      null,
      2,
    ),
  )

  await ctx.dispose()
}
