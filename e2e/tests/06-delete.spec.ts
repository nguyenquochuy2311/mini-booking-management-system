import { test, expect } from '../src/fixtures'
import { nextWindow, toUtcIso } from '../src/helpers/time'

test.describe('Phase 6 — Delete booking', () => {
  test('P6-DEL-01 delete removes the booking from the list', async ({ bookingPage, api, makeBooking }) => {
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

    await bookingPage.deleteBookingRow(booking.id)
    await expect(bookingPage.bookingItem(booking.id)).toBeHidden()
  })

  test('P6-DEL-02 deleting one booking leaves the others intact', async ({ bookingPage, api, makeBooking }) => {
    const rooms = await api.getRooms()
    const alpha = rooms.find((r) => r.name === 'Alpha')!
    const w1 = nextWindow()
    const w2 = nextWindow()
    const b1 = await makeBooking({ room_id: alpha.id, start_time: toUtcIso(w1.startUtc), end_time: toUtcIso(w1.endUtc) })
    const b2 = await makeBooking({ room_id: alpha.id, start_time: toUtcIso(w2.startUtc), end_time: toUtcIso(w2.endUtc) })

    await bookingPage.goto()
    await bookingPage.selectRoom('Alpha')
    await expect(bookingPage.bookingItem(b1.id)).toBeVisible()
    await expect(bookingPage.bookingItem(b2.id)).toBeVisible()

    await bookingPage.deleteBookingRow(b1.id)
    await expect(bookingPage.bookingItem(b1.id)).toBeHidden()
    await expect(bookingPage.bookingItem(b2.id)).toBeVisible()
  })
})
