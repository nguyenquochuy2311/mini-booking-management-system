# E2E tests (Playwright)

Real-browser end-to-end tests for the Mini Booking app. They drive the **React
SPA** in Chromium, which talks to the **Laravel API**, which talks to the
**database** — the full stack, no mocking.

## The pattern

```
e2e/
├── playwright.config.ts      # single worker, tz-pinned, auto-starts the SPA, global setup/teardown
├── global-setup.ts           # assert API+seed reachable, sweep leftover e2e rows, write admin storageState
├── global-teardown.ts        # final sweep of e2e-owned rows
├── src/
│   ├── helpers/
│   │   ├── constants.ts      # URLs, admin creds, e2e namespace, seeded rooms
│   │   ├── time.ts           # deterministic far-future windows + overlap derivations + tz-correct datetime-local
│   │   └── api.ts            # ApiClient: arrange/cleanup state out-of-band; namespaced sweep
│   ├── pages/
│   │   └── booking-page.ts   # Page Object (all selectors are data-testid based)
│   └── fixtures.ts           # test extends: bookingPage, api (worker), e2eName, makeBooking, auto cleanup
└── tests/                    # one spec file per phase
    ├── 00-smoke.spec.ts
    ├── 01-auth.spec.ts
    ├── 02-rooms.spec.ts
    ├── 03-bookings-view.spec.ts
    ├── 04-create.spec.ts
    ├── 05-overlap.spec.ts
    ├── 06-delete.spec.ts
    └── 07-authz-persistence.spec.ts
```

### Phases (scenario IDs map 1:1 to test titles)

| Phase | File | Covers |
|---|---|---|
| 0 Smoke | `00-smoke` | App loads, seeded rooms render, API reachable |
| 1 Authentication | `01-auth` | Prefilled login, success/failure, logout, token persists across reload, client-side required |
| 2 Browse rooms | `02-rooms` | Rooms + capacities, active selection, room switching, public browsing |
| 3 View bookings | `03-bookings-view` | Select-a-room / empty placeholders, room-scoped lists, public read-only |
| 4 Create & validation | `04-create` | Form visibility gating, happy-path create, required fields, end-before-start, back-to-back allowed |
| 5 Overlap rules | `05-overlap` | Full overlap matrix (identical/inside/contains/edge-start/edge-end → rejected; back-to-back & other-room → allowed) |
| 6 Delete | `06-delete` | Delete removes the row; deleting one leaves the rest |
| 7 Authz & persistence | `07-authz-persistence` | Logout hides mutate affordances, logged-out has none, capabilities survive reload, stale-token 401 handling |

## Determinism on a shared database

These tests are written to run safely against a **shared, real database** (e.g.
TiDB Cloud), which is the hard part. The guarantees:

- **Namespaced data.** Every booking the suite creates carries a `user_name`
  prefixed `e2e-`. Cleanup only ever deletes rows with that prefix — it never
  touches pre-existing data. (`global-setup` sweeps leftovers, an `auto` fixture
  cleans per-test, `global-teardown` is a final safety net.)
- **Far-future unique windows.** `time.ts` hands out 1-hour windows anchored in
  2099, striding one day per call, so no two tests (or real data) can collide.
- **Single worker.** `workers: 1` serializes writes so the per-room overlap check
  is never raced.
- **Assert on the specific row**, never on counts or locale-formatted strings:
  rows are located by `data-booking-id` (captured from the API), success/reject is
  read from form reset vs. the overlap field-error.
- **Timezone pinned** to `Asia/Singapore` in config *and* mirrored in `time.ts`,
  so the SPA's `datetime-local → UTC` conversion is reproducible on any machine.

## Running

1. **Start the API** (external prerequisite), pointed at your chosen DB:

   ```bash
   # Against TiDB (uses backend/.env):
   cd backend && docker run --rm -p 8000:8000 -e PHP_CLI_SERVER_WORKERS=4 \
     -v "$PWD":/app -w /app booking-php php artisan serve --host=0.0.0.0 --port=8000

   # …or against local MySQL via docker-compose:
   cd backend && docker compose up

   # …or against an already-running local MySQL container (fastest — ~18× faster
   # than TiDB). Create an isolated DB once, then serve with APP_ENV=e2elocal
   # (see backend/.env.e2elocal, which points at host.docker.internal:3306):
   docker exec <mysql-container> mysql -uroot -p<pw> -e "CREATE DATABASE IF NOT EXISTS booking"
   cd backend && docker run --rm -e APP_ENV=e2elocal -v "$PWD":/app -w /app booking-php php artisan migrate --seed --force
   cd backend && docker run -d --name booking-e2e-api -p 8000:8000 -e APP_ENV=e2elocal \
     -e PHP_CLI_SERVER_WORKERS=20 -v "$PWD":/app -w /app booking-php \
     php artisan serve --host=0.0.0.0 --port=8000
   ```

   The suite is DB-agnostic — only the backend's connection differs. TiDB ≈ 12.5 min
   (remote TLS per request), local MySQL ≈ 41 s.

2. **Run the suite** (Playwright auto-starts the Vite SPA on :5173):

   ```bash
   cd e2e
   npm install
   npx playwright install chromium   # first time only
   npm test                          # headless
   npm run test:headed               # watch it in a browser
   npm run report                    # open the HTML report
   ```

`global-setup` fails loudly with remediation if the API/seed isn't reachable.

## Configuration

All optional (defaults in `src/helpers/constants.ts`); override via env or `.env`:

| Var | Default |
|---|---|
| `E2E_API_URL` | `http://localhost:8000/api` |
| `E2E_FRONTEND_URL` | `http://localhost:5173` |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | `admin@example.com` / `password` |

## Notes / findings

- **P7-AUTH-04** documents a real UX gap discovered during design: the Axios 401
  interceptor clears the stale token, but the header only reflects logged-out
  after a reload (no mid-session auto-fallback). The test asserts the *actual*
  behavior and flags it; an improvement would be to surface logged-out state
  immediately on a 401.
- Busy-state spinners and exact locale date strings are intentionally **not**
  asserted (low value + flaky); behavior is verified via form reset / error hooks
  and `data-booking-id` instead.
