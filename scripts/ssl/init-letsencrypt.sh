#!/usr/bin/env bash
# Obtain (or dry-run) Let's Encrypt certificates for elewen.co.in stack.
# Run on the Linux VPS from project root: bash scripts/ssl/init-letsencrypt.sh
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL in .env (e.g. admin@elewen.co.in)}"

CERT_NAME="${CERTBOT_CERT_NAME:-elewen.co.in}"
DOMAINS=(
  elewen.co.in
  www.elewen.co.in
  api.elewen.co.in
  admin.elewen.co.in
  strapi.elewen.co.in
)

STAGING_ARG=""
if [ "${CERTBOT_STAGING:-0}" = "1" ]; then
  STAGING_ARG="--staging"
  echo "Using Let's Encrypt STAGING (fake certs, higher rate limits for tests)."
fi

DRY_RUN_ARG=""
if [ "${CERTBOT_DRY_RUN:-0}" = "1" ]; then
  DRY_RUN_ARG="--dry-run"
  echo "DRY RUN: no certificates will be saved."
fi

echo "Creating dummy certificate so Nginx can start with SSL paths..."
docker compose run --rm --entrypoint sh certbot -c "
  set -e
  mkdir -p /etc/letsencrypt/live/${CERT_NAME}
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/${CERT_NAME}/privkey.pem \
    -out /etc/letsencrypt/live/${CERT_NAME}/fullchain.pem \
    -subj '/CN=localhost'
"

echo "Starting Nginx..."
docker compose up -d nginx

DOMAIN_FLAGS=""
for d in "${DOMAINS[@]}"; do
  DOMAIN_FLAGS="$DOMAIN_FLAGS -d $d"
done

echo "Requesting certificate from Let's Encrypt..."
# shellcheck disable=SC2086
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  --email "$CERTBOT_EMAIL" \
  --cert-name "$CERT_NAME" \
  --agree-tos \
  --no-eff-email \
  $STAGING_ARG \
  $DRY_RUN_ARG \
  $DOMAIN_FLAGS

if [ "${CERTBOT_DRY_RUN:-0}" = "1" ]; then
  echo "Dry run finished. Re-run with CERTBOT_DRY_RUN=0 for real certificates."
  exit 0
fi

echo "Reloading Nginx with real certificates..."
docker compose exec nginx nginx -s reload

echo "Done. HTTPS URLs:"
echo "  https://elewen.co.in"
echo "  https://api.elewen.co.in"
echo "  https://admin.elewen.co.in"
echo "  https://strapi.elewen.co.in"
