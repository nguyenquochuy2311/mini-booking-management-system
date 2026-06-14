import { test, expect } from '../src/fixtures'
import { ROOMS } from '../src/helpers/constants'

test.describe('Phase 2 — Browse rooms', () => {
  test('P2-ROOM-01 all seeded rooms render with their capacity', async ({ bookingPage }) => {
    await bookingPage.goto()
    for (const [name, capacity] of Object.entries(ROOMS)) {
      await expect(bookingPage.room(name)).toBeVisible()
      await expect(bookingPage.room(name)).toContainText(`Seats ${capacity}`)
    }
  })

  test('P2-ROOM-03 selecting a room applies the active state', async ({ bookingPage }) => {
    await bookingPage.goto()
    await bookingPage.selectRoom('Alpha')
    await expect(bookingPage.room('Alpha')).toHaveAttribute('data-active', 'true')
  })

  test('P2-ROOM-04 switching rooms moves the active state and updates the heading', async ({ bookingPage }) => {
    await bookingPage.goto()
    await bookingPage.selectRoom('Alpha')
    await expect(bookingPage.room('Alpha')).toHaveAttribute('data-active', 'true')

    await bookingPage.selectRoom('Bravo')
    await expect(bookingPage.room('Bravo')).toHaveAttribute('data-active', 'true')
    await expect(bookingPage.room('Alpha')).toHaveAttribute('data-active', 'false')
    await expect(bookingPage.heading()).toContainText('Bravo')
  })

  test.describe('logged out', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('P2-ROOM-02 rooms are browsable while logged out (public)', async ({ bookingPage }) => {
      await bookingPage.goto()
      await expect(bookingPage.roomList()).toBeVisible()
      await expect(bookingPage.room('Alpha')).toBeVisible()
      await expect(bookingPage.loginForm()).toBeVisible()
    })
  })
})
