# Running Elewen locally (no Docker for apps)

> **Run everything in Docker (Nginx + domains):** see [DEPLOYMENT.md](./DEPLOYMENT.md) - `docker compose up --build -d`

## 1. Prerequisites
- Node.js 20+ and npm (already installed)
- Docker Desktop (only for Postgres + Redis)

## 2. Start database and Redis

From project root (Elewen/):

```bash
# Windows (recommended — also stops Docker Strapi/API that block local ports)
powershell -File scripts/local-dev-infra.ps1

# macOS / Linux
bash scripts/local-dev-infra.sh

# Or manually:
docker compose stop strapi api frontend admin-panel migrate
docker compose up -d postgres redis
```

> **Important:** Do **not** run `docker compose up -d` (full stack) for local UI work.
> Root `.env` uses production URLs (`https://strapi.elewen.co.in`). Docker Strapi on port 1337
> redirects the admin to production and blocks CORS from `http://localhost:5173`.
> DigitalOcean keeps using root `.env` + full compose — this does not change production.

This starts:
- Postgres on localhost:15432 (db: elewen, user: postgres, pass: postgres)
- Redis on localhost:6379

## 3. Environment files

Each service has its own .env file:
- api/.env
- frontend/.env
- admin-pannel/.env
- strapi/.env

They are already configured for local development (localhost URLs, DB on port 15432).

## 4. Start Strapi (CMS)

In a new terminal:

```bash
cd strapi
npm install   # first time only
npm run develop
```

Strapi runs at: http://localhost:1337

See [DEV_PORTS.md](./DEV_PORTS.md) for port layout (do not use `npx strapi develop` - it conflicts with the frontend on port 5173).

## 5. Start API

In another terminal:

```bash
cd api
npm install        # first time only
npm run prisma:generate
npm run migrate:deploy
npm run dev        # starts http://localhost:3000
```

## 6. Start frontend (customer app)

In another terminal:

```bash
cd frontend
npm install   # first time only
npm run dev   # opens http://localhost:5173
```

**Test with DigitalOcean Strapi media (packages/images uploaded on prod only):**

```bash
cd frontend
copy .env.local.example .env.local
npm run dev
```

This proxies `/cms` → `https://strapi.elewen.co.in` so package images load locally. Production is not changed. Delete `.env.local` to switch back to local Strapi.

## 7. Start admin panel

In another terminal:

```bash
cd admin-pannel
npm install   # first time only
npm run dev   # opens http://localhost:5174
```

## 8. URLs summary

- Strapi CMS:        http://localhost:1337
- API (Express):     http://localhost:3000
- Frontend (Vite):   http://localhost:5173
- Admin panel:       http://localhost:5174

## 9. Notes

- API now reads env only from api/.env (not root .env).
- Strapi uses Postgres (not sqlite) and connects via strapi/.env.
- Frontend and admin-panel both use Vite_* variables from their own .env files.