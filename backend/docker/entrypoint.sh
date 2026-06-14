#!/bin/sh
set -e

# IMPORTANT: `php artisan serve` propagates the .env FILE into its subprocess,
# which would override real environment variables. On a production host (Render)
# the DB_* and APP_KEY come from injected env vars, so we must NOT create a local
# .env there (it would shadow them with .env.example's local-MySQL defaults).
# Locally (docker-compose), there are no injected vars, so we synthesize one.
if [ ! -f .env ] && [ "$APP_ENV" != "production" ]; then
  cp .env.example .env
fi

# Generate an app key only when one isn't already provided (env var on prod, or
# a fresh local .env). Skips on Render where APP_KEY is set.
if [ -z "$APP_KEY" ] && ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
  php artisan key:generate --force
fi

# Wait for the database, then migrate. `migrate` exits non-zero until reachable.
echo "Waiting for database to become available..."
until php artisan migrate --force 2>/dev/null; do
  echo "  database not ready — retrying in 3s"
  sleep 3
done

# Seeders are idempotent (updateOrCreate), so re-running on each boot is safe.
php artisan db:seed --force || true

# Render (and most PaaS) inject $PORT; default to 8000 for local docker-compose.
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
