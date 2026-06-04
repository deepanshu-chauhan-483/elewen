#!/usr/bin/env node
/**
 * Force-update Google OAuth in Strapi plugin store (fixes redirect_uri_mismatch).
 * Run from strapi/: node scripts/sync-google-oauth-db.mjs
 */
import pg from 'pg'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const CALLBACK =
  process.env.GOOGLE_REDIRECT_URI ||
  `${(process.env.PUBLIC_URL || 'http://localhost:1337').replace(/\/$/, '')}/api/connect/google/callback`

const connectionString =
  process.env.MIGRATION_DATABASE_URL ||
  `postgresql://${process.env.DATABASE_USERNAME || 'postgres'}:${process.env.DATABASE_PASSWORD || 'postgres'}@${process.env.DATABASE_HOST || '127.0.0.1'}:${process.env.DATABASE_PORT || '15432'}/${process.env.DATABASE_NAME || 'elewen'}`

const STORE_KEY = 'plugin_users-permissions_grant'

const client = new pg.Client({ connectionString })
await client.connect()

const { rows } = await client.query(
  'SELECT id, key, value FROM strapi_core_store_settings WHERE key = $1',
  [STORE_KEY]
)

if (!rows.length) {
  console.error(`No row found for key ${STORE_KEY}. Start Strapi once, enable Google in admin, then re-run.`)
  await client.end()
  process.exit(1)
}

const row = rows[0]
const grant = typeof row.value === 'string' ? JSON.parse(row.value) : row.value

const before = grant?.google?.callbackUrl || grant?.google?.callback || '(missing)'
const previousGoogle = grant?.google && typeof grant.google === 'object' ? grant.google : {}

grant.google = {
  enabled: true,
  icon: 'google',
  ...previousGoogle,
  key: process.env.GOOGLE_CLIENT_ID || previousGoogle.key || '',
  secret: process.env.GOOGLE_CLIENT_SECRET || previousGoogle.secret || '',
  callbackUrl: CALLBACK,
  callback: CALLBACK,
  scope: previousGoogle.scope?.length ? previousGoogle.scope : ['email', 'profile'],
}

await client.query('UPDATE strapi_core_store_settings SET value = $1::jsonb WHERE id = $2', [
  JSON.stringify(grant),
  row.id,
])

console.log('Google OAuth synced in database.')
console.log('  before:', before)
console.log('  after: ', CALLBACK)
console.log('\nAdd this EXACT URI in Google Cloud Console → OAuth client → Authorized redirect URIs:')
console.log(' ', CALLBACK)

await client.end()
