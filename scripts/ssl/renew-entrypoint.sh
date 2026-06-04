#!/bin/sh
# Auto-renew Let's Encrypt certs; reload Nginx via Docker API (no shared PID namespace).
set -e

WEBROOT="/var/www/certbot"
SLEEP_SECONDS="${CERTBOT_RENEW_INTERVAL:-43200}"
NGINX_CONTAINER="${NGINX_CONTAINER_NAME:-elewen_nginx}"
RELOAD_HOOK="/tmp/certbot-reload-nginx.sh"

cat > "$RELOAD_HOOK" <<EOF
#!/bin/sh
if [ -S /var/run/docker.sock ]; then
  if command -v curl >/dev/null 2>&1; then
    curl -sf --unix-socket /var/run/docker.sock \\
      -X POST "http://localhost/containers/${NGINX_CONTAINER}/kill?signal=HUP" >/dev/null \\
      && echo "[certbot] sent HUP to ${NGINX_CONTAINER}" \\
      || echo "[certbot] docker reload failed for ${NGINX_CONTAINER}"
  else
    echo "[certbot] curl missing; run: docker compose exec nginx nginx -s reload"
  fi
else
  echo "[certbot] docker.sock not mounted; run: docker compose exec nginx nginx -s reload"
fi
EOF
chmod +x "$RELOAD_HOOK"

renew_once() {
  if [ "${CERTBOT_DRY_RUN:-0}" = "1" ]; then
    echo "[certbot] renew (dry-run)..."
    certbot renew --webroot -w "$WEBROOT" --dry-run
  else
    echo "[certbot] renew..."
    certbot renew --webroot -w "$WEBROOT" --quiet --deploy-hook "$RELOAD_HOOK"
  fi
}

echo "[certbot] renewal loop started (interval=${SLEEP_SECONDS}s, dry_run=${CERTBOT_DRY_RUN:-0})"
while true; do
  renew_once || echo "[certbot] renew failed; will retry later."
  sleep "$SLEEP_SECONDS"
done
