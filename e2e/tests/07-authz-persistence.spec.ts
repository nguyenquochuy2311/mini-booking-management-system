import { test, expect } from '../src/fixtures'
import { nextWindow, toUtcIso } from '../src/helpers/time'

test.describe('Phase 7 — Authorization, visibility & persistence', () => {
  test('P7-AUTH-02/03/05 logout hides mutate affordances and resets the view', async ({
    bookingPage,
    api,
    makeBooking,
  }) => {
    const rooms = await api.getRooms()
    const alpha = rooms.find((r) => r.name === 'Alpha')!
    const w = nextWindow()
    const booking = await makeBooking({
      room_id: alpha.id,
      start_time: toUtcIso(w.startUtc),
      end_time: toUtcIso(w.endUtc),
    })

    await bookingPage.goto()
    await bookingPage.selectRoom('Alpha')
    // Authenticated: form + delete are available, the booking is shown.
    await expect(bookingPage.form()).toBeVisible()
    await expect(bookingPage.bookingItem(booking.id).getByTestId('booking-delete-button')).toBeVisible()

    await bookingPage.logout()
    // Logged out: mutate affordances disappear AND the view resets (room
    // deselected), so no logged-in-session data lingers.
    await expect(bookingPage.form()).toBeHidden()
    await expect(bookingPage.deleteButtons()).toHaveCount(0)
    await expect(bookingPage.bookingItem(booking.id)).toBeHidden()
    await expect(bookingPage.listPlaceholder()).toBeVisible()
  })

  test('P7-PERSIST-02 authenticated capabilities survive a reload', async ({ bookingPage }) => {
    await bookingPage.goto()
    await bookingPage.selectRoom('Alpha')
    await expect(bookingPage.form()).toBeVisible()

    await bookingPage.reload()
    await expect(bookingPage.authStatus()).toBeVisible()
    await bookingPage.selectRoom('Alpha') // selection is not persisted; re-select
    await expect(bookingPage.form()).toBeVisible()
  })

  // A stale/expired token must not grant write access: it is validated on load
  // (GET /api/user → 401) and the UI falls back to logged-out / read-only.
  test('P7-AUTH-04 a stale token is rejected on load (read-only fallback)', async ({
    bookingPage,
    api,
    makeBooking,
  }) => {
    const rooms = await api.getRooms()
    const alpha = rooms.find((r) => r.name === 'Alpha')!
    const w = nextWindow()
    const booking = await makeBooking({
      room_id: alpha.id,
      start_time: toUtcIso(w.startUtc),
      end_time: toUtcIso(w.endUtc),
    })

    await bookingPage.goto()
    await bookingPage.setStoredToken('1|stale-invalid-token')
    await bookingPage.reload()

    // Boot validation rejects the token → logged-out, token cleared.
    await expect(bookingPage.loginForm()).toBeVisible()
    await expect(bookingPage.authStatus()).toBeHidden()
    await expect.poll(() => bookingPage.storedToken()).toBeNull()

    // Still browsable (read-only), but no write affordances.
    await bookingPage.selectRoom('Alpha')
    await expect(bookingPage.bookingItem(booking.id)).toBeVisible()
    await expect(bookingPage.deleteButtons()).toHaveCount(0)
    await expect(bookingPage.form()).toBeHidden()
  })

  test.describe('logged out', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('P7-AUTH-01 logged-out users see no Delete buttons and no create form', async ({
      bookingPage,
      api,
      makeBooking,
    }) => {
      const rooms = await api.getRooms()
      const alpha = rooms.find((r) => r.name === 'Alpha')!
      const w = nextWindow()
      const booking = await makeBooking({
        room_id: alpha.id,
        start_time: toUtcIso(w.startUtc),
        end_time: toUtcIso(w.endUtc),
      })

      await bookingPage.goto()
      await bookingPage.selectRoom('Alpha')
      await expect(bookingPage.bookingItem(booking.id)).toBeVisible()
      await expect(bookingPage.deleteButtons()).toHaveCount(0)
      await expect(bookingPage.form()).toBeHidden()
    })
  })
})
