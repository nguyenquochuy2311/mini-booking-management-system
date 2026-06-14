// Central config for the E2E suite. Everything is overridable via env so the
// same suite can point at a local-MySQL-backed API or a TiDB-backed one.

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000/api'
export const FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? 'http://localhost:5173'

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'password',
}

// The SPA persists the Sanctum token here; global-setup writes a storageState
// with this key so authenticated specs start signed in.
export const LOCALSTORAGE_TOKEN_KEY = 'booking_token'
export const STORAGE_STATE = '.auth/admin.json'

// CRITICAL for the shared (real TiDB) database: every booking the suite creates
// carries this prefix in `user_name`, so cleanup only ever deletes our own rows
// and never clobbers pre-existing/other data.
export const E2E_USER_PREFIX = 'e2e-'

// Seeded rooms and their capacities.
export const ROOMS: Record<string, number> = {
  Alpha: 4,
  Bravo: 8,
  Charlie: 12,
  Boardroom: 20,
}
