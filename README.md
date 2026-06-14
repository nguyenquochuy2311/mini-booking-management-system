# Mini Booking Management System

A small room-booking API and SPA. Browse rooms and their bookings publicly;
authenticated admins create and delete bookings, with server-enforced overlap
prevention.

- **Backend:** Laravel 13 (PHP 8.3), Sanctum token auth, Pest tests.
- **Frontend:** React 19 + Vite, Axios, React Hook Form, Context API.
- **Database:** MySQL 8 locally (Docker); TiDB Cloud Serverless in production —
  same `mysql` driver and migrations for both.

---

## How to run

### Option A — Backend via Docker (recommended, self-contained)

Spins up the Laravel API + a local MySQL 8, runs migrations + seeders
automatically, and serves on port 8000.

```bash
cd backend
docker compose up --build        # API on http://localhost:8000
```

Then run the frontend:

```bash
cd frontend
cp .env.example .env             # VITE_API_BASE_URL=http://localhost:8000/api
npm install
npm run dev                      # SPA on http://localhost:5173
```

Open http://localhost:5173, log in with the seeded admin, pick a room, create a
booking (try an overlapping one to see the 422), and delete one.

**Seeded admin:** `admin@example.com` / `password`

> The Docker stack is intentionally **self-contained**: it always uses its own
> local MySQL and never reads your `backend/.env`. This avoids `php artisan serve`
> leaking a TiDB `.env` into the container (see *Design decisions*).

### Option B — Run the backend against TiDB directly (no Docker DB)

`backend/.env` is configured for TiDB Cloud. With a local PHP 8.3 + Composer:

```bash
cd backend
composer install
php artisan key:generate         # if APP_KEY is empty
php artisan migrate --seed       # runs against TiDB (see backend/.env)
php artisan serve                # API on http://localhost:8000
```

### Tests

```bash
cd backend
php artisan test                 # Pest feature tests — run on sqlite :memory:
```

Tests never touch MySQL/TiDB (`phpunit.xml` pins `DB_CONNECTION=sqlite`,
`DB_DATABASE=:memory:`), so they are fast and safe to run anywhere.

---

## Deploy to Render

A `render.yaml` blueprint at the repo root deploys **both** services:
`mini-booking-api` (Laravel/Docker → TiDB) and `mini-booking-web` (React static
site). The backend container migrates **and seeds** on boot (idempotent), so the
TiDB database is provisioned automatically on first deploy.

**Steps:**

1. Push to GitHub, then in Render: **New → Blueprint** and pick the repo.
2. Set the backend (`mini-booking-api`) secret env vars:
   - `APP_KEY` — generate with `cd backend && php artisan key:generate --show`
   - `DB_HOST` `gateway01.<region>.prod.aws.tidbcloud.com`, `DB_DATABASE`,
     `DB_USERNAME` (`<prefix>.root`), `DB_PASSWORD` — from TiDB Cloud
     (`DB_PORT` and the SSL CA are already set in the blueprint)
   - `APP_URL` — the api service URL once known
3. Deploy. The entrypoint runs `migrate --seed` against TiDB automatically.
4. Wire the two services together (two URLs only known after first deploy):
   - On `mini-booking-web`: set `VITE_API_BASE_URL=https://<api-host>/api`, redeploy.
   - On `mini-booking-api`: set `FRONTEND_URL=https://<web-host>` (CORS), redeploy.

**Seeding TiDB manually** (e.g. from your machine, using `backend/.env`'s TiDB creds):

```bash
cd backend
php artisan migrate --seed --force   # rooms + admin (admin@example.com / password) + sample bookings
```

> Production note: `APP_ENV=production` is set on Render, so the entrypoint does
> **not** synthesise a local `.env` — the injected env vars (TiDB) are used
> directly. (Avoids `php artisan serve` shadowing real env with `.env.example`.)

---

## API docs

Base URL: `/api`. All responses are JSON. Resource payloads are wrapped in a
`data` key (Laravel API Resources). Datetimes are **ISO-8601, UTC**.

| Method | Path | Auth | Body | Success | Errors |
|---|---|---|---|---|---|
| `POST` | `/api/login` | public | `{email, password}` | `200 {token, user}` | `422` invalid credentials |
| `GET` | `/api/rooms` | public | – | `200 {data: Room[]}` | – |
| `GET` | `/api/rooms/{room}/bookings` | public | – | `200 {data: Booking[]}` | `404` room not found |
| `POST` | `/api/bookings` | `auth:sanctum` | `{room_id, user_name, start_time, end_time}` | `201 {data: Booking}` | `401`, `422` validation/overlap |
| `DELETE` | `/api/bookings/{booking}` | `auth:sanctum` | – | `204` | `401`, `404` booking not found |
| `POST` | `/api/logout` | `auth:sanctum` | – | `204` | `401` |

Authenticated requests send `Authorization: Bearer <token>`.

**Example**

```bash
# 1. Log in
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"email":"admin@example.com","password":"password"}' | jq -r .token)

# 2. Create a booking
curl -X POST http://localhost:8000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"room_id":1,"user_name":"Jane","start_time":"2026-08-01T10:00:00Z","end_time":"2026-08-01T11:00:00Z"}'
```

**Overlap rule.** Two bookings on the same room conflict iff
`existing.start_time < new.end_time AND existing.end_time > new.start_time`.
The strict inequalities mean **back-to-back bookings are allowed** (one ending at
10:00 and another starting at 10:00 do not conflict). The check runs entirely in
the database via a `select exists(...)` query — bookings are never loaded into PHP.

---

## Design decisions & trade-offs

**Layered architecture.** Every write path flows
`Controller → Form Request → Service → Repository → Resource`:

- **Controllers** are thin — they validate via a Form Request, call a Service,
  and return a Resource. No query builder in a controller.
- **Form Requests** (`StoreBookingRequest`, `LoginRequest`) validate field shape
  only (`required`, types, `exists`, `after:start_time`).
- **`BookingService`** owns the business invariant (overlap) and throws
  `ValidationException`, so the API still returns a clean field-keyed `422`.
- **Repositories** (`BookingRepository`, `RoomRepository`, `UserRepository`) own
  every query — including the auth lookup — keeping data access isolated and unit-
  testable in one layer. The overlap query accepts an optional `excludeId` so a
  future update endpoint could reuse it.

**Concurrency-safe overlap.** A naive check-then-insert can race: two simultaneous
requests both pass the overlap check, then both insert. `BookingService::create`
runs inside a transaction and takes a `lockForUpdate` on the room row first, so
bookings for the same room serialize through the check. MySQL has no exclusion
constraint (unlike Postgres), so a pessimistic room lock is the pragmatic fix.

**"Laravel latest LTS".** Laravel dropped the LTS model after v6, so the current
stable **13.x** is used.

**Auth scope maps to the domain.** `GET` endpoints are public (anyone browses
rooms/bookings); `POST`/`DELETE` require `auth:sanctum` (only admins mutate).
This is deliberate rather than protecting everything or nothing.

**Performance.** A composite index on `bookings (room_id, start_time, end_time)`
backs both the overlap `select exists(...)` and the per-room booking list, which
is a single indexed query (`$room->bookings()`).

**Security touches.**
- **Brute-force protection:** `POST /api/login` is throttled (`throttle:login`, a
  named limiter keyed by email + IP) — see `AppServiceProvider`.
- **Defensive headers:** a `SecurityHeaders` middleware adds `X-Content-Type-
  Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy` to every API
  response.
- **CORS pinned:** `config/cors.php` allows only `FRONTEND_URL` (not `*`).
- **No enumeration:** login returns one generic credential error for both unknown
  email and wrong password; passwords are bcrypt-hashed (`hashed` cast).
- **Mass assignment** is locked to explicit `$fillable`; all access is Eloquent
  (parameterized — no SQLi surface); Sanctum tokens are stored hashed at rest.
- **Trade-off:** the SPA holds the token in `localStorage` (XSS-readable) for
  simplicity; a higher-assurance build would use Sanctum's httpOnly-cookie SPA
  auth. The 401 interceptor clears a stale token (UI reflects it on next reload).

**Dual database, one codebase.** The same `mysql` driver and migrations target
both local MySQL 8 and TiDB Cloud Serverless. The only difference is TLS: TiDB
requires it, local MySQL does not. `config/database.php` wraps the SSL CA in
`array_filter`, so an empty `MYSQL_ATTR_SSL_CA` is dropped (local) and a set value
enables TLS (TiDB) — no branching on the database.

**Why the Docker stack is self-contained (a real gotcha I hit).**
`php artisan serve` passes the `.env` file's values into its dev-server
subprocess, which then override the container's environment variables for HTTP
requests. With a bind-mounted TiDB `.env`, that made `docker-compose up` silently
talk to TiDB even though the compose file pointed at local MySQL (CLI `artisan`
commands, which don't go through `serve`, used the correct local MySQL — a
confusing split). The fix: bake the code into the image and generate `.env` from
`.env.example` (local defaults) at boot, so the local stack is deterministic. The
trade-off is no live code reload in the container; for active development run the
backend directly (Option B). Production uses real env vars on Render, where this
does not apply.

**Caching & queues** are out of scope. Session/cache/queue are kept off the
database driver (`file`/`sync`) so the schema stays focused on the domain. Where
they would slot in: cache the public `GET /api/rooms` response; move any future
notification/side-effect work behind a queue.

---

## Assumptions

- **Timezone:** all datetimes are stored and returned in **UTC** (ISO-8601). The
  frontend converts the browser's local `datetime-local` input to UTC before
  sending.
- **Single admin role:** one seeded admin (`admin@example.com` / `password`)
  represents the "admin" actor. There is no multi-role/permission system.
- **No update endpoint:** the brief's prose mentions admins "editing" bookings,
  but the explicit endpoint list has none — so only the four listed endpoints are
  implemented (see *Future work*).
- **Booking ownership:** any authenticated admin may delete any booking; bookings
  are not scoped to a user.
- **TiDB `AUTO_INCREMENT`** may skip values (IDs are allocated per node in
  batches). Nothing here depends on ID ordering, so this is harmless.

---

## Future work

- **`PUT /api/bookings/{id}`** — an edit endpoint would follow the same
  `Request → Service → Repository → Resource` path; `BookingRepository::overlaps`
  already takes `excludeId` to ignore the booking being edited.
- **Available-slot computation** — derive free windows per room/day (only listing
  is required today).
- **Caching** the public rooms list and **queueing** any future async work.
- **Broader test coverage** (unit tests for the service/repository in isolation)
  and **CI** (run `pest` + `pint` + `eslint`/`vite build` on every push).
- **Frontend polish** — optimistic updates, loading skeletons, nicer date pickers.

---

## Project layout

```
backend/    Laravel 13 API (layered: Controller → Request → Service → Repository → Resource)
frontend/   React 19 + Vite SPA (Axios client, Context, React Hook Form)
```
