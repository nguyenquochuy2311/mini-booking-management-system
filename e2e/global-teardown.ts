import { request as pwRequest } from '@playwright/test'
import { ApiClient } from './src/helpers/api'

/** Best-effort safety net: remove any e2e-owned bookings left after the run. */
export default async function globalTeardown() {
  try {
    const ctx = await pwRequest.newContext()
    const api = await ApiClient.login(ctx)
    const removed = await api.sweepE2eBookings()
    if (removed > 0) {
      console.log(`[E2E global-teardown] swept ${removed} e2e booking(s)`)
    }
    await ctx.dispose()
  } catch {
    // The API may already be down; nothing else to do.
  }
}
