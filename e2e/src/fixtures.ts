import { test as base, expect, request as pwRequest } from '@playwright/test'
import { ApiClient, type BookingInput } from './helpers/api'
import { BookingPage } from './pages/booking-page'
import { E2E_USER_PREFIX } from './helpers/constants'

type WorkerFixtures = {
  api: ApiClient
}

type TestFixtures = {
  bookingPage: BookingPage
  /** Unique e2e-namespaced user_name for this test (used for create + cleanup). */
  e2eName: string
  /** Arrange a booking out-of-band; always created with the test's e2eName. */
  makeBooking: (input: Omit<BookingInput, 'user_name'> & { user_name?: string }) => ReturnType<ApiClient['createBooking']>
  /** Auto fixture: after each test, remove every row carrying this test's e2eName. */
  cleanup: void
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // One admin API client per worker (single worker → one login per run).
  api: [
    async ({}, use) => {
      // Generous timeout so transient dev-server queueing doesn't fail cleanup.
      const ctx = await pwRequest.newContext({ timeout: 30_000 })
      const api = await ApiClient.login(ctx)
      await use(api)
      await ctx.dispose()
    },
    { scope: 'worker' },
  ],

  bookingPage: async ({ page }, use) => {
    await use(new BookingPage(page))
  },

  e2eName: async ({}, use, testInfo) => {
    await use(`${E2E_USER_PREFIX}${testInfo.testId}`)
  },

  // Arrange a booking out-of-band, tagged with this test's e2eName.
  makeBooking: async ({ api, e2eName }, use) => {
    await use((input) => api.createBooking({ user_name: e2eName, ...input }))
  },

  // Auto cleanup: after every test, delete all rows carrying this test's
  // e2eName (covers BOTH API- and UI-created bookings). Because tests run
  // single-worker and each cleans its own rows, no e2e rows leak between tests —
  // so reused far-future windows can never collide.
  cleanup: [
    async ({ api, e2eName }, use) => {
      await use()
      await api.deleteByUserName(e2eName)
    },
    { auto: true },
  ],
})

export { expect }
