#!/usr/bin/env bash
# Manual one-shot renewal (optionally dry-run). Run from project root on the server.
set -euo pipefail
cd "$(dirname "$0")/../.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ "${CERTBOT_DRY_RUN:-0}" = "1" ]; then
  echo "Running certbot renew --dry-run..."
  docker compose run --rm certbot renew --webroot -w /var/www/certbot --dry-run
else
  echo "Running certbot renew..."
  docker compose run --rm certbot renew --webroot -w /var/www/certbot
  docker compose exec nginx nginx -s reload
fi

echo "Renewal complete."
