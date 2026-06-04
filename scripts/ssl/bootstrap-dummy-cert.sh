#!/usr/bin/env bash
# Create a 1-day dummy cert so Nginx can start (required before init-letsencrypt or first deploy).
# Run on VPS from project root: bash scripts/ssl/bootstrap-dummy-cert.sh
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

CERT_NAME="${CERTBOT_CERT_NAME:-elewen.co.in}"

echo "Creating dummy certificate in volume (cert name: ${CERT_NAME})..."
docker compose --profile manual run --rm --entrypoint sh certbot -c "
  set -e
  mkdir -p /etc/letsencrypt/live/${CERT_NAME}
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/${CERT_NAME}/privkey.pem \
    -out /etc/letsencrypt/live/${CERT_NAME}/fullchain.pem \
    -subj '/CN=localhost'
"

echo "Starting Nginx..."
docker compose up -d nginx
echo "Check: docker compose ps nginx"
echo "Next (real HTTPS): bash scripts/ssl/init-letsencrypt.sh"
