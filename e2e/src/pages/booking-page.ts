import type { Locator, Page } from '@playwright/test'
import { toLocalInput, type TimeWindow } from '../helpers/time'

/**
 * Page Object for the single-screen booking app. All selectors are data-testid
 * based (stable against copy/markup changes). Locators are returned lazily so
 * Playwright's web-first assertions can auto-wait.
 */
export class BookingPage {
  constructor(private readonly page: Page) {}

  async goto() {
    // domcontentloaded (not full 'load') so 3rd-party room/hero images never gate the test.
    await this.page.goto('/', { waitUntil: 'domcontentloaded' })
  }

  async reload() {
    await this.page.reload({ waitUntil: 'domcontentloaded' })
  }

  // --- Auth / header ---
  loginForm = (): Locator => this.page.getByTestId('login-form')
  emailInput = (): Locator => this.page.getByTestId('login-email-input')
  passwordInput = (): Locator => this.page.getByTestId('login-password-input')
  loginSubmit = (): Locator => this.page.getByTestId('login-submit')
  loginError = (): Locator => this.page.getByTestId('login-error')
  authStatus = (): Locator => this.page.getByTestId('auth-status')
  logoutButton = (): Locator => this.page.getByTestId('logout-button')

  async login(email: string, password: string) {
    await this.emailInput().fill(email)
    await this.passwordInput().fill(password)
    await this.loginSubmit().click()
  }

  async logout() {
    await this.logoutButton().click()
  }

  // --- Rooms ---
  roomList = (): Locator => this.page.getByTestId('room-list')
  roomItems = (): Locator => this.page.getByTestId('room-item')
  room = (name: string): Locator =>
    this.page.locator(`[data-testid="room-item"][data-room-name="${name}"]`)

  async selectRoom(name: string) {
    await this.room(name).click()
  }

  // The main panel heading ("Bookings" / "Bookings · <room>"). Named to avoid
  // colliding with the "Rooms" aside heading (also an h2).
  heading = (): Locator => this.page.getByRole('heading', { name: /Bookings/ })

  // --- Booking list ---
  listPlaceholder = (): Locator => this.page.getByTestId('booking-list-placeholder')
  listEmpty = (): Locator => this.page.getByTestId('booking-list-empty')
  bookingItems = (): Locator => this.page.getByTestId('booking-item')
  bookingItem = (id: number | string): Locator =>
    this.page.locator(`[data-testid="booking-item"][data-booking-id="${id}"]`)
  deleteButtons = (): Locator => this.page.getByTestId('booking-delete-button')

  async deleteBookingRow(id: number | string) {
    await this.bookingItem(id).getByTestId('booking-delete-button').click()
  }

  // --- Booking form ---
  form = (): Locator => this.page.getByTestId('booking-form')
  nameInput = (): Locator => this.page.getByTestId('booking-name-input')
  startInput = (): Locator => this.page.getByTestId('booking-start-input')
  endInput = (): Locator => this.page.getByTestId('booking-end-input')
  submit = (): Locator => this.page.getByTestId('booking-submit')
  nameError = (): Locator => this.page.getByTestId('booking-name-error')
  startError = (): Locator => this.page.getByTestId('booking-start-error')
  endError = (): Locator => this.page.getByTestId('booking-end-error')
  formError = (): Locator => this.page.getByTestId('booking-form-error')

  async fillBooking(userName: string, w: TimeWindow) {
    await this.nameInput().fill(userName)
    await this.startInput().fill(toLocalInput(w.startUtc))
    await this.endInput().fill(toLocalInput(w.endUtc))
  }

  async submitBooking(userName: string, w: TimeWindow) {
    await this.fillBooking(userName, w)
    await this.submit().click()
  }

  /** Read the SPA's persisted auth token from localStorage. */
  async storedToken(): Promise<string | null> {
    return this.page.evaluate(() => window.localStorage.getItem('booking_token'))
  }

  /** Overwrite the persisted auth token (used to simulate a stale/invalid token). */
  async setStoredToken(value: string): Promise<void> {
    await this.page.evaluate((v) => window.localStorage.setItem('booking_token', v), value)
  }
}
