#!/usr/bin/env node
/**
 * Standalone Cloudinary → Cloudflare R2 migration
 *
 * Usage:
 *   npm run migrate:dry-run          # inventory only, no uploads/DB writes
 *   npm run migrate:execute          # download, upload, update DB
 *   node migrate.mjs --execute --limit 5
 *
 * Env: loads ../../.env and ../../strapi/.env (strapi wins for DB_*)
 *      MIGRATION_DATABASE_URL overrides DB connection
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

const CLOUDINARY_HOST = 'res.cloudinary.com'
const REPORT_DIR = path.join(__dirname, 'reports')
const BACKUP_DIR = path.join(__dirname, 'backups')

// ─── CLI ───────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run') || !args.includes('--execute')
const LIMIT = (() => {
  const i = args.indexOf('--limit')
  return i >= 0 ? Number.parseInt(args[i + 1], 10) : 0
})()
const SCAN_TEXT = args.includes('--scan-text')

if (args.includes('--help')) {
  console.log(`
Elewen Cloudinary → R2 migration

  node migrate.mjs --dry-run              Preview counts (default)
  node migrate.mjs --execute              Run full migration
  node migrate.mjs --execute --limit 10   Process first 10 Strapi files only
  node migrate.mjs --execute --scan-text        Also sweep JSON/text columns (slower)

Reports: scripts/cloudinary-to-r2-migration/reports/
Backups: scripts/cloudinary-to-r2-migration/backups/
`)
  process.exit(0)
}

// ─── Env ───────────────────────────────────────────────────────
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  dotenv.config({ path: filePath, override: true })
}

loadEnvFile(path.join(ROOT, '.env'))
loadEnvFile(path.join(ROOT, 'strapi', '.env'))

function requireEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env: ${name}`)
  return v
}

function getDatabaseUrl() {
  if (process.env.MIGRATION_DATABASE_URL) return process.env.MIGRATION_DATABASE_URL

  const host = process.env.DATABASE_HOST || '127.0.0.1'
  const port = process.env.DATABASE_PORT || '15432'
  const user = process.env.DATABASE_USERNAME || process.env.DB_USER || 'postgres'
  const password = process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres'
  const database = process.env.DATABASE_NAME || process.env.DB_NAME || 'elewen'

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
}

function getR2PublicBase() {
  return requireEnv('R2_PUBLIC_URL').replace(/\/+$/, '')
}

function getR2RootPath() {
  return (process.env.R2_ROOT_PATH || 'uploads').replace(/^\/+|\/+$/g, '')
}

function buildObjectKey(hash, ext) {
  const safeHash = String(hash || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_')
  const safeExt = ext && String(ext).startsWith('.') ? String(ext) : ext ? `.${ext}` : ''
  return `${getR2RootPath()}/${safeHash}${safeExt}`
}

function buildPublicUrl(objectKey) {
  return `${getR2PublicBase()}/${objectKey}`
}

// ─── Cloudinary URL helpers ────────────────────────────────────
function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes(CLOUDINARY_HOST)
}

/** Strip transformation segments so we fetch the best-effort original asset */
function cloudinaryDeliveryUrl(url) {
  if (!isCloudinaryUrl(url)) return url
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/')
    const uploadIdx = parts.indexOf('upload')
    if (uploadIdx === -1) return url

    const after = parts.slice(uploadIdx + 1)
    let i = 0
    // skip transformation tokens until version (v123) or folder segment
    while (i < after.length && !/^v\d+$/i.test(after[i]) && after[i].includes('_')) i++
    if (i < after.length && /^v\d+$/i.test(after[i])) i++
    const rest = after.slice(i)
    if (!rest.length) return url
    u.pathname = [...parts.slice(0, uploadIdx + 1), ...rest].join('/')
    return u.toString()
  } catch {
    return url.replace(/\/upload\/[^/]+\//, '/upload/')
  }
}

function collectUrlsFromFormats(formats) {
  const urls = new Set()
  if (!formats || typeof formats !== 'object') return urls
  for (const value of Object.values(formats)) {
    if (value?.url && isCloudinaryUrl(value.url)) urls.add(value.url)
  }
  return urls
}

function replaceUrlsInValue(value, urlMap) {
  if (typeof value === 'string') {
    let out = value
    for (const [oldUrl, newUrl] of urlMap.entries()) {
      if (out.includes(oldUrl)) out = out.split(oldUrl).join(newUrl)
    }
    return out
  }
  if (Array.isArray(value)) return value.map((v) => replaceUrlsInValue(v, urlMap))
  if (value && typeof value === 'object') {
    const next = {}
    for (const [k, v] of Object.entries(value)) next[k] = replaceUrlsInValue(v, urlMap)
    return next
  }
  return value
}

// ─── S3 / R2 ───────────────────────────────────────────────────
function createS3Client() {
  const accountId = requireEnv('R2_ACCOUNT_ID')
  return new S3Client({
    region: process.env.R2_REGION || 'auto',
    endpoint:
      process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
    forcePathStyle: process.env.R2_FORCE_PATH_STYLE !== 'false',
  })
}

async function objectExists(s3, bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (e) {
    const status = e.$metadata?.httpStatusCode
    // R2 often returns 403 for missing keys on HEAD — treat as not found
    if (e.name === 'NotFound' || status === 404 || status === 403) return false
    throw e
  }
}

async function downloadBuffer(url) {
  const res = await fetch(cloudinaryDeliveryUrl(url), {
    redirect: 'follow',
    headers: { 'User-Agent': 'elewen-migration/1.0' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (!buf.length) throw new Error(`Empty response for ${url}`)
  return { buffer: buf, contentType: res.headers.get('content-type') }
}

async function uploadToR2(s3, bucket, key, buffer, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    })
  )
}

async function testR2WriteAccess(s3, bucket) {
  const key = `${getR2RootPath()}/.migration-preflight-${Date.now()}.txt`
  await uploadToR2(s3, bucket, key, Buffer.from('elewen-migration-ok'), 'text/plain')
  return key
}

// ─── DB ────────────────────────────────────────────────────────
async function tableExists(client, qualifiedName) {
  const [schema, table] = qualifiedName.includes('.')
    ? qualifiedName.split('.')
    : ['public', qualifiedName]
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = $1 AND table_name = $2`,
    [schema, table]
  )
  return rows.length > 0
}

async function fetchStrapiFiles(client, limit) {
  const sql = `
    SELECT id, document_id, url, formats, hash, ext, mime, name, provider
    FROM files
    WHERE url ILIKE '%cloudinary%'
       OR provider ILIKE '%cloudinary%'
       OR formats::text ILIKE '%cloudinary%'
    ORDER BY id
    ${limit > 0 ? `LIMIT ${limit}` : ''}
  `
  const { rows } = await client.query(sql)
  return rows
}

async function countCloudinaryInApi(client, table) {
  if (!(await tableExists(client, table))) return 0
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS c FROM ${table} WHERE "fileUrl" ILIKE '%cloudinary%'`
  )
  return rows[0]?.c ?? 0
}

async function updateApiFileUrls(client, table, urlMap, stats) {
  if (!(await tableExists(client, table))) return
  for (const [oldUrl, newUrl] of urlMap.entries()) {
    if (!isCloudinaryUrl(oldUrl)) continue
    if (DRY_RUN) {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS c FROM ${table} WHERE "fileUrl" = $1`,
        [oldUrl]
      )
      stats.dbRowsWouldUpdate += rows[0]?.c ?? 0
      continue
    }
    const res = await client.query(
      `UPDATE ${table} SET "fileUrl" = $1 WHERE "fileUrl" = $2`,
      [newUrl, oldUrl]
    )
    stats.dbRowsUpdated += res.rowCount ?? 0
  }
}

function sqlEscapeLiteral(value) {
  return String(value).replace(/'/g, "''")
}

async function scanTextColumns(client, urlMap, stats) {
  const pairs = [...urlMap.entries()].filter(([old]) => isCloudinaryUrl(old))
  if (!pairs.length) return

  const { rows: columns } = await client.query(`
    SELECT table_schema, table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema IN ('public', 'api')
      AND data_type IN ('text', 'character varying', 'json', 'jsonb')
      AND table_name NOT IN ('files')
  `)

  for (const col of columns) {
    const qualified = `"${col.table_schema}"."${col.table_name}"`
    const colName = `"${col.column_name}"`
    const textExpr = `${colName}::text`

    const { rows: countRows } = await client.query(
      `SELECT COUNT(*)::int AS c FROM ${qualified} WHERE ${textExpr} ILIKE '%cloudinary%'`
    )
    const affected = countRows[0]?.c ?? 0
    if (!affected) continue

    if (DRY_RUN) {
      stats.textColumnsWouldUpdate += affected
      console.log(`  would update ${affected} rows in ${col.table_schema}.${col.table_name}.${col.column_name}`)
      continue
    }

    let replaceExpr = colName
    if (col.data_type === 'jsonb' || col.data_type === 'json') {
      replaceExpr = `${colName}::text`
    }
    for (const [oldUrl, newUrl] of pairs) {
      replaceExpr = `REPLACE(${replaceExpr}, '${sqlEscapeLiteral(oldUrl)}', '${sqlEscapeLiteral(newUrl)}')`
    }
    const cast =
      col.data_type === 'jsonb' ? '::jsonb' : col.data_type === 'json' ? '::json' : ''

    const res = await client.query(
      `UPDATE ${qualified} SET ${colName} = (${replaceExpr})${cast} WHERE ${textExpr} ILIKE '%cloudinary%'`
    )
    stats.textColumnsUpdated += res.rowCount ?? 0
    if (res.rowCount > 0) {
      console.log(`  updated ${res.rowCount} rows in ${col.table_schema}.${col.table_name}.${col.column_name}`)
    }
  }
}

function formatError(err) {
  if (!err) return 'Unknown error'
  const parts = [
    err.message,
    err.name,
    err.Code,
    err.code,
    err.$metadata?.httpStatusCode ? `HTTP ${err.$metadata.httpStatusCode}` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' | ') : String(err)
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true })
  fs.mkdirSync(BACKUP_DIR, { recursive: true })

  const stats = {
    mode: DRY_RUN ? 'dry-run' : 'execute',
    startedAt: new Date().toISOString(),
    strapiFilesFound: 0,
    uniqueCloudinaryUrls: 0,
    downloaded: 0,
    uploadedToR2: 0,
    skippedAlreadyOnR2: 0,
    downloadErrors: 0,
    uploadErrors: 0,
    r2PreflightOk: false,
    strapiFilesUpdated: 0,
    dbRowsUpdated: 0,
    dbRowsWouldUpdate: 0,
    textColumnsUpdated: 0,
    textColumnsWouldUpdate: 0,
    errors: [],
  }

  const urlMap = new Map()
  const fileReport = []

  console.log(`\n=== Elewen Cloudinary → R2 migration [${stats.mode}] ===\n`)

  const databaseUrl = getDatabaseUrl()
  const bucket = requireEnv('R2_BUCKET_NAME')
  const s3 = DRY_RUN ? null : createS3Client()

  if (!DRY_RUN) {
    try {
      await testR2WriteAccess(s3, bucket)
      stats.r2PreflightOk = true
      console.log(`R2 preflight OK (bucket: ${bucket})\n`)
    } catch (err) {
      throw new Error(
        `R2 write test failed (${formatError(err)}). ` +
          'Ensure the API token has Object Read & Write on bucket "' +
          bucket +
          '" and R2_ACCOUNT_ID / keys in .env are correct.'
      )
    }
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  })

  await client.connect()
  console.log(`Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`)

  const strapiFiles = await fetchStrapiFiles(client, LIMIT)
  stats.strapiFilesFound = strapiFiles.length
  console.log(`Strapi files with Cloudinary: ${strapiFiles.length}`)

  const apiBookingCount = await countCloudinaryInApi(client, 'api.booking_files')
  const apiMessageCount = await countCloudinaryInApi(client, 'api.message_attachments')
  console.log(`API booking_files with Cloudinary: ${apiBookingCount}`)
  console.log(`API message_attachments with Cloudinary: ${apiMessageCount}`)

  const allCloudinaryUrls = new Set()
  for (const row of strapiFiles) {
    if (isCloudinaryUrl(row.url)) allCloudinaryUrls.add(row.url)
    for (const u of collectUrlsFromFormats(row.formats)) allCloudinaryUrls.add(u)
  }

  // Also collect URLs from API tables not linked to files
  for (const table of ['api.booking_files', 'api.message_attachments']) {
    if (!(await tableExists(client, table))) continue
    const { rows } = await client.query(
      `SELECT DISTINCT "fileUrl" FROM ${table} WHERE "fileUrl" ILIKE '%cloudinary%'`
    )
    for (const r of rows) if (r.fileUrl) allCloudinaryUrls.add(r.fileUrl)
  }

  stats.uniqueCloudinaryUrls = allCloudinaryUrls.size
  console.log(`Unique Cloudinary URLs (inventory): ${allCloudinaryUrls.size}\n`)

  for (const row of strapiFiles) {
    const objectKey = buildObjectKey(row.hash, row.ext)
    const targetPublicUrl = buildPublicUrl(objectKey)
    const entry = {
      fileId: row.id,
      documentId: row.document_id,
      name: row.name,
      hash: row.hash,
      objectKey,
      targetPublicUrl,
      status: 'pending',
    }

    try {
      const sourceUrl = isCloudinaryUrl(row.url) ? row.url : [...allCloudinaryUrls][0]
      if (!isCloudinaryUrl(sourceUrl)) {
        entry.status = 'skipped_no_cloudinary_url'
        fileReport.push(entry)
        continue
      }

      const deliveryUrl = cloudinaryDeliveryUrl(sourceUrl)

      if (!DRY_RUN) {
        const exists = await objectExists(s3, bucket, objectKey)
        if (!exists) {
          const { buffer, contentType } = await downloadBuffer(deliveryUrl)
          stats.downloaded++
          const backupName = `${row.hash || row.id}${row.ext || ''}`
          fs.writeFileSync(path.join(BACKUP_DIR, backupName), buffer)
          try {
            await uploadToR2(s3, bucket, objectKey, buffer, contentType)
            stats.uploadedToR2++
          } catch (uploadErr) {
            stats.uploadErrors++
            throw uploadErr
          }
        } else {
          stats.skippedAlreadyOnR2++
        }
      }

      // Map every cloudinary URL for this asset to the new R2 public URL
      const perFileUrls = new Set([row.url, ...collectUrlsFromFormats(row.formats)])
      for (const old of perFileUrls) {
        if (isCloudinaryUrl(old)) urlMap.set(old, targetPublicUrl)
      }
      if (isCloudinaryUrl(row.url)) urlMap.set(row.url, targetPublicUrl)

      const newFormats = row.formats
        ? replaceUrlsInValue(
            typeof row.formats === 'string' ? JSON.parse(row.formats) : row.formats,
            urlMap
          )
        : null

      if (!DRY_RUN) {
        await client.query(
          `UPDATE files
           SET url = $1,
               formats = $2::jsonb,
               provider = 'aws-s3',
               provider_metadata = NULL
           WHERE id = $3`,
          [targetPublicUrl, newFormats ? JSON.stringify(newFormats) : null, row.id]
        )
        stats.strapiFilesUpdated++
        entry.status = 'updated'
      } else {
        entry.status = 'would_update'
        stats.strapiFilesUpdated++
      }

      fileReport.push(entry)
      console.log(
        `${DRY_RUN ? '[dry-run]' : '[ok]'} file #${row.id} → ${targetPublicUrl}`
      )
    } catch (err) {
      const msg = formatError(err)
      entry.status = 'error'
      entry.error = msg
      stats.errors.push({ fileId: row.id, error: msg })
      fileReport.push(entry)
      console.error(`[error] file #${row.id}: ${msg}`)
    }
  }

  // API tables
  await updateApiFileUrls(client, 'api.booking_files', urlMap, stats)
  await updateApiFileUrls(client, 'api.message_attachments', urlMap, stats)

  if (SCAN_TEXT) {
    console.log('\nScanning text/json columns for leftover Cloudinary URLs...')
    await scanTextColumns(client, urlMap, stats)
  }

  await client.end()

  const report = {
    ...stats,
    finishedAt: new Date().toISOString(),
    r2PublicBase: getR2PublicBase(),
    r2RootPath: getR2RootPath(),
    urlMappings: [...urlMap.entries()].map(([from, to]) => ({ from, to })),
    files: fileReport,
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(REPORT_DIR, `migration-${stamp}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('\n=== Summary ===')
  console.log(`Strapi files found (Cloudinary):     ${stats.strapiFilesFound}`)
  console.log(`Unique Cloudinary URLs:              ${stats.uniqueCloudinaryUrls}`)
  console.log(`Downloaded from Cloudinary:          ${stats.downloaded}`)
  console.log(`Uploaded to R2:                      ${stats.uploadedToR2}`)
  console.log(`Skipped (already on R2):             ${stats.skippedAlreadyOnR2}`)
  console.log(`Strapi files updated in DB:        ${stats.strapiFilesUpdated}`)
  console.log(
    `API / other DB rows updated:         ${DRY_RUN ? stats.dbRowsWouldUpdate : stats.dbRowsUpdated}`
  )
  if (SCAN_TEXT) {
    console.log(
      `Text/JSON rows touched:              ${DRY_RUN ? stats.textColumnsWouldUpdate : stats.textColumnsUpdated}`
    )
  }
  console.log(`Download errors:                     ${stats.downloadErrors}`)
  console.log(`Upload errors:                       ${stats.uploadErrors}`)
  console.log(`Total file errors:                   ${stats.errors.length}`)
  console.log(`Report: ${reportPath}`)

  if (DRY_RUN) {
    console.log('\nNo changes were made. Run with --execute to apply.\n')
  }
}

main().catch((err) => {
  console.error('\nMigration failed:', err)
  process.exit(1)
})
