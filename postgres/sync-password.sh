#!/bin/sh
set -e

# Start Postgres normally (handles first-time init, then runs the server).
docker-entrypoint.sh postgres &
PG_PID=$!

# Self-heal: the postgres_data volume may have been initialized long ago with a
# different POSTGRES_PASSWORD than the one currently in .env. Once Postgres is
# accepting connections, force the role password to match the current
# $POSTGRES_PASSWORD so migrate/api/strapi (which build DATABASE_URL from the
# same DB_PASSWORD) never hit "P1000: Authentication failed" again, even after
# .env changes or container recreation.
(
  until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q 2>/dev/null; do
    sleep 1
  done
  escaped=$(printf '%s' "$POSTGRES_PASSWORD" | sed "s/'/''/g")
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "ALTER USER \"$POSTGRES_USER\" WITH PASSWORD '$escaped';" >/dev/null 2>&1 || true
) &

wait "$PG_PID"
