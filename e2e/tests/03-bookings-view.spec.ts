import { test, expect } from '../src/fixtures'
import { nextWindow, toUtcIso } from '../src/helpers/time'

test.describe('Phase 3 — View bookings & empty states', () => {
  test('P3-VIEW-01 the first room is auto-selected on load', async ({ bookingPage, api }) => {
    const rooms = await api.getRooms() // ordered by name → first is the default
    const first = rooms[0]
    await bookingPage.goto()
    await expect(bookingPage.room(first.name)).toHaveAttribute('data-active', 'true')
    await expect(bookingPage.heading()).toContainText(first.name)
  })

  test('P3-VIEW-02 a room with no bookings shows the empty state', async ({ bookingPage, api }) => {
    const rooms = await api.getRooms()
    const board = rooms.find((r) => r.name === 'Boardroom')!
    const existing = await api.getRoomBookings(board.id)
    test.skip(existing.length > 0, 'Boardroom already has bookings on the shared DB')

    await bookingPage.goto()
    await bookingPage.selectRoom('Boardroom')
    await expect(bookingPage.listEmpty()).toBeVisible()
  })

  test('P3-VIEW-03/04 a created booking shows under its own room only', async ({
    bookingPage,
    api,
    makeBooking,
    e2eName,
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
    await expect(bookingPage.bookingItem(booking.id)).toContainText(e2eName)

    // Room-scoped: the same booking must not appear under a different room.
    await bookingPage.selectRoom('Bravo')
    await expect(bookingPage.bookingItem(booking.id)).toBeHidden()
  })

  test.describe('logged out viewing', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('P3-VIEW-05 bookings are visible but no Delete buttons appear', async ({
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
    })
  })
})
