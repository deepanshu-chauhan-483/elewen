#!/bin/sh
# Auto-renew Let's Encrypt certs every 12 hours (reloads Nginx via shared PID namespace).
set -e

WEBROOT="/var/www/certbot"
SLEEP_SECONDS="${CERTBOT_RENEW_INTERVAL:-43200}"

renew_once() {
  if [ "${CERTBOT_DRY_RUN:-0}" = "1" ]; then
    echo "[certbot] renew (dry-run)..."
    certbot renew --webroot -w "$WEBROOT" --dry-run
  else
    echo "[certbot] renew..."
    certbot renew --webroot -w "$WEBROOT" --quiet --deploy-hook "kill -HUP 1"
  fi
}

echo "[certbot] renewal loop started (interval=${SLEEP_SECONDS}s, dry_run=${CERTBOT_DRY_RUN:-0})"
while true; do
  renew_once || echo "[certbot] renew failed; will retry later."
  sleep "$SLEEP_SECONDS"
done
