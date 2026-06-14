import { test, expect } from '../src/fixtures'
import { after, nextWindow, toLocalInput, toUtcIso } from '../src/helpers/time'

test.describe('Phase 4 — Create booking & validation', () => {
  test('P4-CREATE-01 create form is available when authenticated (room auto-selected)', async ({ bookingPage }) => {
    await bookingPage.goto()
    // Authenticated + a room is auto-selected on load → the create form is shown.
    await expect(bookingPage.form()).toBeVisible()
  })

  test('P4-CREATE-02 create a valid booking — it appears in the list and the form resets', async ({
    bookingPage,
    api,
    e2eName,
  }) => {
    const rooms = await api.getRooms()
    const alpha = rooms.find((r) => r.name === 'Alpha')!
    const w = nextWindow()

    await bookingPage.goto()
    await bookingPage.selectRoom('Alpha')
    await bookingPage.submitBooking(e2eName, w)

    // Success ⇒ form resets and no overlap error.
    await expect(bookingPage.nameInput()).toHaveValue('')
    await expect(bookingPage.startError()).toBeHidden()

    // Tie the UI back to data: the row exists and is rendered.
    const created = await api.findBooking(alpha.id, toUtcIso(w.startUtc), e2eName)
    expect(created).toBeTruthy()
    await expect(bookingPage.bookingItem(created!.id)).toBeVisible()
  })

  test('P5-VAL-01 required fields block submission', async ({ bookingPage }) => {
    await bookingPage.goto()
    await bookingPage.selectRoom('Alpha')
    await bookingPage.submit().click()
    await expect(bookingPage.nameError()).toBeVisible()
    await expect(bookingPage.startError()).toBeVisible()
    await expect(bookingPage.endError()).toBeVisible()
  })

  test('P5-VAL-02 end time before start time shows an end-time error', async ({ bookingPage, api, e2eName }) => {
    await api.getRooms()
    const w = nextWindow()
    await bookingPage.goto()
    await bookingPage.selectRoom('Alpha')
    await bookingPage.nameInput().fill(e2eName)
    // Swap so end < start.
    await bookingPage.startInput().fill(toLocalInput(w.endUtc))
    await bookingPage.endInput().fill(toLocalInput(w.startUtc))
    await bookingPage.submit().click()
    await expect(bookingPage.endError()).toBeVisible()
  })

  test('P4-CREATE-05 back-to-back booking (new.start == existing.end) is allowed', async ({
    bookingPage,
    api,
    makeBooking,
    e2eName,
  }) => {
    const rooms = await api.getRooms()
    const alpha = rooms.find((r) => r.name === 'Alpha')!
    const w = nextWindow()
    await makeBooking({ room_id: alpha.id, start_time: toUtcIso(w.startUtc), end_time: toUtcIso(w.endUtc) })

    const adjacent = after(w) // starts exactly when the existing one ends
    await bookingPage.goto()
    await bookingPage.selectRoom('Alpha')
    await bookingPage.submitBooking(e2eName, adjacent)

    await expect(bookingPage.nameInput()).toHaveValue('') // reset ⇒ accepted
    await expect(bookingPage.startError()).toBeHidden()
    const created = await api.findBooking(alpha.id, toUtcIso(adjacent.startUtc), e2eName)
    expect(created).toBeTruthy()
  })
})
