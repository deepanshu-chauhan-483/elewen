#!/usr/bin/env node
/**
 * Force-update Google OAuth + post-login redirect in Strapi plugin store.
 * Run from strapi/: npm run sync:google
 */
import pg from 'pg'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const publicUrl = (process.env.PUBLIC_URL || 'http://localhost:1337').replace(/\/$/, '')
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')

const GOOGLE_CALLBACK =
  process.env.GOOGLE_REDIRECT_URI || `${publicUrl}/api/connect/google/callback`

const FRONTEND_AUTH_CALLBACK = `${frontendUrl}/auth/callback`

const connectionString =
  process.env.MIGRATION_DATABASE_URL ||
  `postgresql://${process.env.DATABASE_USERNAME || 'postgres'}:${process.env.DATABASE_PASSWORD || 'postgres'}@${process.env.DATABASE_HOST || '127.0.0.1'}:${process.env.DATABASE_PORT || '15432'}/${process.env.DATABASE_NAME || 'elewen'}`

const client = new pg.Client({ connectionString })
await client.connect()

const { rows: grantRows } = await client.query(
  'SELECT id, key, value FROM strapi_core_store_settings WHERE key = $1',
  ['plugin_users-permissions_grant']
)

if (!grantRows.length) {
  console.error('No grant row found. Start Strapi once, enable Google in admin, then re-run.')
  await client.end()
  process.exit(1)
}

const grantRow = grantRows[0]
const grant = typeof grantRow.value === 'string' ? JSON.parse(grantRow.value) : grantRow.value
const beforeCallback = grant?.google?.callbackUrl || grant?.google?.callback || '(missing)'
const previousGoogle = grant?.google && typeof grant.google === 'object' ? grant.google : {}

grant.google = {
  enabled: true,
  icon: 'google',
  ...previousGoogle,
  key: process.env.GOOGLE_CLIENT_ID || previousGoogle.key || '',
  secret: process.env.GOOGLE_CLIENT_SECRET || previousGoogle.secret || '',
  callbackUrl: GOOGLE_CALLBACK,
  // Grant redirects here after Google OAuth — frontend, not Strapi connect callback
  callback: FRONTEND_AUTH_CALLBACK,
  scope: previousGoogle.scope?.length ? previousGoogle.scope : ['email', 'profile'],
}

await client.query('UPDATE strapi_core_store_settings SET value = $1::jsonb WHERE id = $2', [
  JSON.stringify(grant),
  grantRow.id,
])

const { rows: advancedRows } = await client.query(
  'SELECT id, key, value FROM strapi_core_store_settings WHERE key = $1',
  ['plugin_users-permissions_advanced']
)

let beforeRedirect = '(missing)'
if (advancedRows.length) {
  const advancedRow = advancedRows[0]
  const advanced =
    typeof advancedRow.value === 'string' ? JSON.parse(advancedRow.value) : advancedRow.value

  beforeRedirect = advanced?.default_redirect_url || '(missing)'

  const nextAdvanced = {
    ...advanced,
    default_redirect_url: FRONTEND_AUTH_CALLBACK,
    email_reset_password: `${frontendUrl}/reset-password`,
    email_confirmation_redirection: `${frontendUrl}/login?confirmed=true`,
  }

  await client.query('UPDATE strapi_core_store_settings SET value = $1::jsonb WHERE id = $2', [
    JSON.stringify(nextAdvanced),
    advancedRow.id,
  ])
}

console.log('Google OAuth synced in database.')
console.log('  OAuth redirect URI (Google Console + grant.callbackUrl):')
console.log('    before:', beforeCallback)
console.log('    after: ', GOOGLE_CALLBACK)
console.log('  Grant post-OAuth redirect (grant.callback → frontend):')
console.log('    after: ', FRONTEND_AUTH_CALLBACK)
console.log('  Post-login redirect (advanced.default_redirect_url):')
console.log('    before:', beforeRedirect)
console.log('    after: ', FRONTEND_AUTH_CALLBACK)
console.log('\nAdd this EXACT URI in Google Cloud Console → OAuth client → Authorized redirect URIs:')
console.log(' ', GOOGLE_CALLBACK)
console.log('\nEnsure strapi/.env has:')
console.log(`  FRONTEND_URL=${frontendUrl}`)

await client.end()
