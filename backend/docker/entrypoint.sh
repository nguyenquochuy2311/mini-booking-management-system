#!/bin/sh
set -e

# IMPORTANT: `php artisan serve` propagates the .env FILE into its subprocess,
# overriding real env vars. On a production host (Render) DB_*/APP_KEY come from
# injected env vars, so we must NOT create a local .env there.
if [ "$APP_ENV" = "production" ]; then
  if [ -z "$APP_KEY" ]; then
    echo "FATAL: APP_KEY env var is required in production (php artisan key:generate --show)." >&2
    exit 1
  fi
else
  # Local (docker-compose): synthesise an env + key for zero-config startup.
  [ -f .env ] || cp .env.example .env
  grep -q '^APP_KEY=base64:' .env || php artisan key:generate --force
fi

# Wait for the database, then migrate. Errors are surfaced (not hidden) so the
# real cause shows up in the logs; give up after ~60s with a clear message.
echo "Waiting for database to become available..."
attempt=0
until php artisan migrate --force 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 20 ]; then
    echo "FATAL: database unreachable / migrations failed after 20 attempts (see error above)." >&2
    echo "  → Check DB_HOST/DB_PORT/DB_DATABASE/DB_USERNAME/DB_PASSWORD, and MYSQL_ATTR_SSL_CA for TiDB (TLS required)." >&2
    exit 1
  fi
  echo "  not ready — retry ${attempt}/20 in 3s"
  sleep 3
done

# Seeders are idempotent (updateOrCreate), so re-running on each boot is safe.
php artisan db:seed --force || true

# Render (and most PaaS) inject $PORT; default to 8000 for local docker-compose.
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
