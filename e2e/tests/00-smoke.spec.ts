import { test, expect } from '../src/fixtures'
import { ROOMS } from '../src/helpers/constants'

test.describe('Phase 0 — Smoke', () => {
  test('app loads, seeded rooms render, API reachable', async ({ bookingPage, api }) => {
    await bookingPage.goto()
    await expect(bookingPage.roomList()).toBeVisible()

    for (const name of Object.keys(ROOMS)) {
      await expect(bookingPage.room(name)).toBeVisible()
    }

    const rooms = await api.getRooms()
    expect(rooms.length).toBeGreaterThanOrEqual(Object.keys(ROOMS).length)
  })
})
