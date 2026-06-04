# Cloudinary → R2 migration (standalone)

Migrates Strapi media and API file URLs from Cloudinary to Cloudflare R2 without touching application code.

## Prerequisites

- Node.js 20+
- Postgres running (local: `127.0.0.1:15432` or set `MIGRATION_DATABASE_URL`)
- Root `.env` with `R2_*` and DB credentials (loads `../../.env` + `../../strapi/.env`)
- Cloudflare R2 API token with **Object Read & Write** on bucket `elewen-media`
- R2 bucket **public access** enabled for `R2_PUBLIC_URL` (`*.r2.dev` or custom domain)

## Install

```bash
cd scripts/cloudinary-to-r2-migration
npm install
```

## Run

```bash
# 1. Preview (no uploads, no DB writes)
npm run migrate:dry-run

# 2. Test on 5 files
node migrate.mjs --execute --limit 5

# 3. Full migration
npm run migrate:execute
```

## Options

| Flag | Description |
|------|-------------|
| `--dry-run` | Default — inventory and counts only |
| `--execute` | Download, upload to R2, update DB |
| `--limit N` | Process only N Strapi `files` rows |
| `--scan-text` | Also replace Cloudinary URLs in JSON/text columns (slower) |

## What it updates

- `files` — `url`, `formats`, `provider` → `aws-s3`
- `api.booking_files` — `fileUrl`
- `api.message_attachments` — `fileUrl`
- Optional sweep of `public` / `api` text & json columns containing old URLs

## Outputs

- `reports/migration-<timestamp>.json` — full stats and URL map
- `backups/<hash><ext>` — local copy of each downloaded file

## Safety

- Idempotent: skips R2 upload if object key already exists
- Always run `--dry-run` first
- Take a `pg_dump` before `--execute`

## Custom DB URL

```bash
set MIGRATION_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:15432/elewen
npm run migrate:execute
```
