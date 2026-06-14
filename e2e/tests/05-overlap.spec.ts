import { test, expect } from '../src/fixtures'
import {
  before,
  contains,
  inside,
  nextWindow,
  straddleEnd,
  straddleStart,
  toUtcIso,
  type TimeWindow,
} from '../src/helpers/time'

// Existing booking occupies window `w`. Each case derives a candidate window and
// asserts whether the UI accepts it. This is the overlap matrix as browser flows.
const conflictCases: Array<{ id: string; name: string; derive: (w: TimeWindow) => TimeWindow }> = [
  { id: 'P5-OVL-IDENTICAL', name: 'identical window', derive: (w) => w },
  { id: 'P5-OVL-INSIDE', name: 'new fully inside existing', derive: inside },
  { id: 'P5-OVL-CONTAINS', name: 'new fully contains existing', derive: contains },
  { id: 'P5-OVL-EDGE-START', name: 'new straddles existing start', derive: straddleStart },
  { id: 'P5-OVL-EDGE-END', name: 'new straddles existing end', derive: straddleEnd },
]

test.describe('Phase 5 — Overlap rules (browser-visible)', () => {
  for (const c of conflictCases) {
    test(`${c.id} ${c.name} → rejected with overlap error`, async ({ bookingPage, api, makeBooking, e2eName }) => {
      const rooms = await api.getRooms()
      const alpha = rooms.find((r) => r.name === 'Alpha')!
      const w = nextWindow()
      await makeBooking({ room_id: alpha.id, start_time: toUtcIso(w.startUtc), end_time: toUtcIso(w.endUtc) })

      const conflict = c.derive(w)
      await bookingPage.goto()
      await bookingPage.selectRoom('Alpha')
      await bookingPage.submitBooking(e2eName, conflict)

      await expect(bookingPage.startError()).toBeVisible()
      await expect(bookingPage.nameInput()).toHaveValue(e2eName) // not reset ⇒ rejected
      // Data check: only the arranged booking exists; the conflict created nothing.
      const mine = (await api.getRoomBookings(alpha.id)).filter((b) => b.user_name === e2eName)
      expect(mine).toHaveLength(1)
    })
  }

  test('P5-OVL-BTB-BEFORE back-to-back ending exactly at existing start is allowed', async ({
    bookingPage,
    api,
    makeBooking,
    e2eName,
  }) => {
    const rooms = await api.getRooms()
    const alpha = rooms.find((r) => r.name === 'Alpha')!
    const w = nextWindow()
    await makeBooking({ room_id: alpha.id, start_time: toUtcIso(w.startUtc), end_time: toUtcIso(w.endUtc) })

    const adjacent = before(w)
    await bookingPage.goto()
    await bookingPage.selectRoom('Alpha')
    await bookingPage.submitBooking(e2eName, adjacent)

    await expect(bookingPage.startError()).toBeHidden()
    await expect(bookingPage.nameInput()).toHaveValue('')
  })

  test('P5-OVL-OTHER-ROOM the same window in a different room does not conflict', async ({
    bookingPage,
    api,
    makeBooking,
    e2eName,
  }) => {
    const rooms = await api.getRooms()
    const alpha = rooms.find((r) => r.name === 'Alpha')!
    const w = nextWindow()
    await makeBooking({ room_id: alpha.id, start_time: toUtcIso(w.startUtc), end_time: toUtcIso(w.endUtc) })

    await bookingPage.goto()
    await bookingPage.selectRoom('Bravo')
    await bookingPage.submitBooking(e2eName, w)

    await expect(bookingPage.startError()).toBeHidden()
    await expect(bookingPage.nameInput()).toHaveValue('')
  })
})
