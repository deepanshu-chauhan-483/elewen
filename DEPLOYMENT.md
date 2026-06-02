# Elewen — Docker deployment guide

One `docker-compose.yml` runs every service: Postgres, Redis, API, Strapi, website, admin panel, Nginx (HTTPS), and automatic Let's Encrypt renewal.

## Architecture

| Service | Container | Host port | Public URL |
|---------|-----------|-----------|------------|
| Website | `elewen_frontend` | `5173` | https://elewen.co.in |
| API | `elewen_api` | `3000` | https://api.elewen.co.in |
| Admin panel | `elewen_admin_panel` | `5174` | https://admin.elewen.co.in |
| Strapi CMS | `elewen_strapi` | `1337` | https://strapi.elewen.co.in |
| Nginx | `elewen_nginx` | `80`, `443` | all domains above |
| Certbot renew | `elewen_certbot_renew` | — | auto-renew + reload Nginx |
| Postgres | `elewen_postgres` | `15432` | internal |
| Redis | `elewen_redis` | `6379` | internal |

HTTP (`:80`) only serves ACME challenges and **redirects to HTTPS**.

---

## 1. Prerequisites (production VPS)

- Ubuntu 22.04+ (or similar Linux) with Docker Engine + Compose plugin
- DNS **A records** pointing to your server IP:
  - `elewen.co.in`, `www.elewen.co.in`
  - `api.elewen.co.in`
  - `admin.elewen.co.in`
  - `strapi.elewen.co.in`
- Ports **80** and **443** open in the firewall
- Email for Let's Encrypt (`CERTBOT_EMAIL` in `.env`)

---

## 2. Configure environment

```bash
cp .env.docker.example .env
nano .env
```

Production URLs (defaults in `.env.docker.example`):

```env
PUBLIC_SITE_URL=https://elewen.co.in
PUBLIC_API_URL=https://api.elewen.co.in
PUBLIC_STRAPI_URL=https://strapi.elewen.co.in
PUBLIC_ADMIN_URL=https://admin.elewen.co.in
PUBLIC_URL=https://strapi.elewen.co.in
FRONTEND_URL=https://elewen.co.in
GOOGLE_REDIRECT_URI=https://api.elewen.co.in/auth/google/callback

CERTBOT_EMAIL=admin@elewen.co.in
CERTBOT_CERT_NAME=elewen.co.in
CERTBOT_STAGING=0
CERTBOT_DRY_RUN=0
```

Set all secrets (JWT, Strapi keys, SMTP, Razorpay, R2, Google).

---

## 3. Build and start the stack

```bash
docker compose down --remove-orphans
docker compose up --build -d
```

Wait until API, Strapi, frontend, and admin are healthy. Nginx will not serve real HTTPS until certificates exist (see next step).

---

## 4. Free SSL (Let's Encrypt)

### 4.1 Test with dry-run first (recommended)

On the server, from the project root:

```bash
chmod +x scripts/ssl/*.sh
export CERTBOT_DRY_RUN=1
export CERTBOT_STAGING=1
bash scripts/ssl/init-letsencrypt.sh
```

This uses Let's Encrypt **staging** + **dry-run**: no real certificates are stored. Fix any DNS/firewall errors before continuing.

### 4.2 Issue real certificates

```bash
export CERTBOT_DRY_RUN=0
export CERTBOT_STAGING=0
bash scripts/ssl/init-letsencrypt.sh
```

The script will:

1. Create a short-lived dummy cert so Nginx can start
2. Start Nginx on ports 80/443
3. Run Certbot `certonly` (webroot) for all five domains on one certificate
4. Reload Nginx with the real certificate

### 4.3 Automatic renewal

The `certbot-renew` service runs in the background and:

- Every **12 hours** runs `certbot renew`
- Reloads Nginx after a successful renewal (`kill -HUP` via shared PID with Nginx)

To test renewal without changing certs:

```bash
CERTBOT_DRY_RUN=1 docker compose up -d certbot-renew
# or one-shot:
CERTBOT_DRY_RUN=1 bash scripts/ssl/renew-once.sh
```

For a real one-shot renewal:

```bash
bash scripts/ssl/renew-once.sh
```

---

## 5. Rebuild frontend/admin after URL changes

Vite bakes API/CMS URLs at **build time**:

```bash
docker compose build frontend admin-panel --no-cache
docker compose up -d frontend admin-panel nginx
```

---

## 6. Verify URLs

| App | URL |
|-----|-----|
| Website | https://elewen.co.in |
| API | https://api.elewen.co.in |
| API docs | https://api.elewen.co.in/api-docs |
| Admin panel | https://admin.elewen.co.in |
| Strapi admin | https://strapi.elewen.co.in/admin |

Direct ports (debug only, no SSL): `localhost:5173`, `:3000`, `:5174`, `:1337`.

---

## 7. Strapi first-time setup

1. Open https://strapi.elewen.co.in/admin
2. Create the first admin user
3. Settings → API Tokens → create **Full access** token
4. Set `STRAPI_API_TOKEN` in `.env`
5. `docker compose restart api`

---

## 8. Local development (Windows, no SSL)

Use `RUNNING.md` for Postgres/Redis + `npm run dev` on each app.

Do **not** run local Vite on `5173` while Strapi `develop` is running (port conflict → `426 Upgrade Required`).

For local Docker **without** HTTPS, use direct ports (`5173`, `3000`, etc.) and skip Nginx, or point hosts to your VPS.

---

## 9. Common commands

```bash
docker compose ps
docker compose logs -f nginx
docker compose logs -f certbot-renew
docker compose down
docker compose down -v   # wipes DB volumes
```

---

## 10. Troubleshooting

### Nginx exits: cannot load certificate

Certificates are missing. Run `bash scripts/ssl/init-letsencrypt.sh` (section 4).

### Certbot rate limit / failed validation

- Confirm DNS A records resolve to this server: `dig +short api.elewen.co.in`
- Port 80 must reach Nginx (`curl -I http://elewen.co.in/.well-known/acme-challenge/test`)
- Use `CERTBOT_STAGING=1` while testing

### CORS errors

Add every browser origin (http + https) to `CORS_ORIGIN` in `.env`, then:

```bash
docker compose restart strapi api
```

### Mixed content (browser blocks HTTP API from HTTPS site)

Ensure `PUBLIC_API_URL` and `PUBLIC_STRAPI_URL` use `https://` and rebuild frontend.

---

## 11. GitHub Actions

- **CI**: tests + Docker image builds with production Vite URLs.
- **Deploy**: SSH + `docker compose up`; run SSL init once on the server after first deploy.

Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`.

---

## 12. File reference

| File | Purpose |
|------|---------|
| `docker-compose.yml` | All services + certbot-renew |
| `nginx/nginx.conf` | HTTPS vhosts + HTTP→HTTPS redirect |
| `scripts/ssl/init-letsencrypt.sh` | First-time certificate (supports dry-run) |
| `scripts/ssl/renew-once.sh` | Manual renewal |
| `scripts/ssl/renew-entrypoint.sh` | Auto-renew loop in `certbot-renew` |
| `.env.docker.example` | Production `.env` template |
