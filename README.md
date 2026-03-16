# Elewen — Event Management Platform

Full-stack event management platform built with **Strapi CMS + React + Node.js/Express + PostgreSQL + Docker**.

## Stack

| Layer | Technology | Port |
|---|---|---|
| CMS & Admin | Strapi v5 | 1337 |
| Custom API | Node.js + Express | 3000 |
| Frontend | React 18 + Vite + Tailwind | 5173 |
| Database | PostgreSQL 16 | 5432 |
| Reverse Proxy | Nginx | 80 |

## Quick Start

1. Ensure Docker Desktop is running.
2. Copy the environment file:

```bash
cp .env.example .env
```

3. Start the full stack:

```bash
docker compose up --build
```

4. Services available at:
   - Frontend: http://localhost:5173
   - Strapi Admin: http://localhost:1337/admin
   - Express API: http://localhost:3000
   - Nginx proxy: http://localhost:80

## Project Structure

```
elewen/
  api/              # Node.js + Express custom business logic API
    prisma/
      schema.prisma # Custom API database models (api schema)
      migrations/   # Prisma migration history — commit these to git
    src/
      server.js
  strapi/           # Strapi CMS — content types, admin panel, CMS APIs
    src/
  frontend/         # React 18 + Vite + Tailwind SPA
    src/
  nginx/            # Reverse proxy config
  docker-compose.yml
  .env              # Environment variables (never commit)
  .env.example      # Template — copy to .env
```

## Database Architecture

Two services share one PostgreSQL database (`elewen`) via separate schemas:

| Schema | Owner | Tables |
|---|---|---|
| `public` | Strapi | All Strapi/CMS tables (users, packages, events, vendors, content, etc.) |
| `api` | Prisma / Express | Custom business logic tables (bookings, payments, carts, messaging, etc.) |

## Environment Variables

See `.env.example`. Key variables:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/elewen?schema=api
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=elewen
JWT_SECRET=...
STRAPI_JWT_SECRET=...
```

## Prisma Migrations

> All migration commands must be run via Docker so they connect to the postgres container. Direct host connection to Docker Desktop postgres is unreliable on Windows.

**Create a new migration after editing `api/prisma/schema.prisma`:**

```bash
docker compose run --rm migrate npx prisma migrate dev --name <describe_change>
```

Examples:

```bash
docker compose run --rm migrate npx prisma migrate dev --name add_booking_feedback
docker compose run --rm migrate npx prisma migrate dev --name add_vendor_rating
```

**Apply migrations in production (runs automatically on `docker compose up`):**

```bash
docker compose run --rm migrate
```

**Open Prisma Studio (visual DB browser):**

```bash
docker compose run --rm -p 5555:5555 migrate npx prisma studio
```

**Regenerate Prisma Client after schema changes:**

```bash
docker compose run --rm migrate npx prisma generate
```

## Development

All services run via Docker. For hot-reload on code changes:

```bash
docker compose up
```

Source volumes are mounted for live reload:
- `./api/src` → Express API (nodemon)
- `./strapi/src` → Strapi content types
- `./frontend/src` → Vite HMR
- `./api/prisma` → Prisma schema + migrations

## Checks

```bash
curl http://localhost:3000/health
curl http://localhost:3000/healthz
```

## Production Notes

- Use a managed PostgreSQL (RDS, Supabase, Neon, etc.) — update `DATABASE_URL` and Strapi DB vars.
- Multi-stage Docker builds are already configured for production.
- Apply migrations before starting the API: `docker compose run --rm migrate` (runs automatically in compose).
