#!/usr/bin/env bash
# Run on the production VPS from repo root: bash scripts/check-smtp-production.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== 1) SMTP vars in ~/elewen/.env (password hidden) ==="
if grep -q '^SMTP_' .env 2>/dev/null; then
  grep '^SMTP_\|^RESEND_' .env | sed 's/^\(SMTP_PASS=\).*/\1***hidden***/; s/^\(RESEND_API_KEY=\).*/\1***hidden***/'
else
  echo "ERROR: No SMTP_* lines in .env — Docker never sees strapi/.env on the server."
  echo "       Copy SMTP_* from your local strapi/.env into ~/elewen/.env"
fi

echo ""
echo "=== 2) SMTP vars inside running Strapi container ==="
docker compose exec strapi sh -c '
  echo "SMTP_PROVIDER=${SMTP_PROVIDER:-gmail}"
  echo "SMTP_USER=${SMTP_USER:-(empty)}"
  echo "SMTP_FROM=${SMTP_FROM:-(empty)}"
  echo "SMTP_HOST=${SMTP_HOST:-(empty)}"
  echo "SMTP_PORT=${SMTP_PORT:-(empty)}"
  echo "SMTP_PASS length: ${#SMTP_PASS}"
  if [ -z "${SMTP_PASS:-}" ]; then
    echo "ERROR: SMTP_PASS is empty inside the container."
    exit 1
  fi
'

echo ""
echo "=== 3) Outbound port 587 (Gmail / Resend) ==="
docker compose exec strapi node -e "
const net = require('net');
const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT || 587);
const s = net.createConnection(port, host, () => { console.log('OK: can reach', host + ':' + port); s.end(); });
s.setTimeout(10000, () => { console.error('FAIL: timeout', host + ':' + port); process.exit(1); });
s.on('error', (e) => { console.error('FAIL:', e.message); process.exit(1); });
"

echo ""
echo "=== 4) Strapi SMTP send test ==="
docker compose exec strapi npm run test:smtp

echo ""
echo "If step 4 passes, recreate Strapi and test signup:"
echo "  docker compose up -d strapi --force-recreate"
echo "  docker compose exec strapi npm run sync:email"
echo "  docker compose exec strapi npm run sync:email-templates"
