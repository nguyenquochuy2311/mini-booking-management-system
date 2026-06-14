import { test, expect } from '../src/fixtures'
import { ADMIN } from '../src/helpers/constants'

// This whole phase exercises the logged-out → logged-in transition, so it runs
// without the default authenticated storageState.
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Phase 1 — Authentication', () => {
  test('P1-AUTH-01 login form is shown and prefilled when logged out', async ({ bookingPage }) => {
    await bookingPage.goto()
    await expect(bookingPage.loginForm()).toBeVisible()
    await expect(bookingPage.emailInput()).toHaveValue(ADMIN.email)
    await expect(bookingPage.authStatus()).toBeHidden()
  })

  test('P1-AUTH-02 successful login toggles the header to signed-in', async ({ bookingPage }) => {
    await bookingPage.goto()
    await bookingPage.login(ADMIN.email, ADMIN.password)
    await expect(bookingPage.authStatus()).toBeVisible()
    await expect(bookingPage.logoutButton()).toBeVisible()
    await expect(bookingPage.loginForm()).toBeHidden()
  })

  test('P1-AUTH-03 wrong password shows an inline error and stays logged out', async ({ bookingPage }) => {
    await bookingPage.goto()
    await bookingPage.login(ADMIN.email, 'wrong-password')
    await expect(bookingPage.loginError()).toBeVisible()
    await expect(bookingPage.loginForm()).toBeVisible()
    await expect(bookingPage.authStatus()).toBeHidden()
  })

  test('P1-AUTH-07 logout reverts the header to the login form', async ({ bookingPage }) => {
    await bookingPage.goto()
    await bookingPage.login(ADMIN.email, ADMIN.password)
    await expect(bookingPage.authStatus()).toBeVisible()
    await bookingPage.logout()
    await expect(bookingPage.loginForm()).toBeVisible()
    await expect(bookingPage.authStatus()).toBeHidden()
  })

  test('P1-AUTH-08 empty credentials are blocked client-side (no login happens)', async ({ bookingPage }) => {
    await bookingPage.goto()
    await bookingPage.emailInput().fill('')
    await bookingPage.passwordInput().fill('')
    await bookingPage.loginSubmit().click()
    await expect(bookingPage.loginForm()).toBeVisible()
    await expect(bookingPage.authStatus()).toBeHidden()
  })

  test('P1-PERSIST-01 token persists across a full page reload', async ({ bookingPage }) => {
    await bookingPage.goto()
    await bookingPage.login(ADMIN.email, ADMIN.password)
    await expect(bookingPage.authStatus()).toBeVisible()
    await bookingPage.reload()
    await expect(bookingPage.authStatus()).toBeVisible()
  })
})
