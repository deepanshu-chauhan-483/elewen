#!/usr/bin/env node
/**
 * Verify Google OAuth is enabled in Strapi DB. Run: npm run check:google
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

const client = new pg.Client({ connectionString })
await client.connect()

const { rows: grantRows } = await client.query(
  "SELECT value FROM strapi_core_store_settings WHERE key = 'plugin_users-permissions_grant'"
)
const { rows: advRows } = await client.query(
  "SELECT value FROM strapi_core_store_settings WHERE key = 'plugin_users-permissions_advanced'"
)

const grant = grantRows[0]?.value
  ? typeof grantRows[0].value === 'string'
    ? JSON.parse(grantRows[0].value)
    : grantRows[0].value
  : null
const advanced = advRows[0]?.value
  ? typeof advRows[0].value === 'string'
    ? JSON.parse(advRows[0].value)
    : advRows[0].value
  : null

const g = grant?.google
const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
const expectedRedirect = `${frontend}/auth/callback`
let ok = true

console.log('Expected Google redirect URI (Google Cloud Console):', CALLBACK)
console.log('(Run "npm run show:google-redirect" while Strapi is up to print the exact URI Google receives.)')
console.log('')
console.log('Do NOT add http://localhost:1337/api/connect/google — only the /callback URL below.')
console.log('')

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('FAIL: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing in strapi/.env')
  ok = false
} else {
  console.log('OK: Google credentials present in strapi/.env')
}

if (!g) {
  console.error('FAIL: grant.google missing in database — restart Strapi (bootstrap will create it) or run npm run sync:google')
  ok = false
} else {
  if (!g.enabled) {
    console.error('FAIL: grant.google.enabled is false')
    ok = false
  } else {
    console.log('OK: grant.google.enabled = true')
  }
  const oauthCb = g.callbackUrl
  if (oauthCb !== CALLBACK) {
    console.error('FAIL: grant.google.callbackUrl mismatch (Google Console redirect URI)')
    console.error('  DB:     ', oauthCb || '(empty)')
    console.error('  .env:   ', CALLBACK)
    ok = false
  } else {
    console.log('OK: OAuth callback URL matches .env')
  }

  const grantFrontendCb = g.callback
  if (grantFrontendCb === oauthCb || grantFrontendCb === CALLBACK) {
    console.error('FAIL: grant.google.callback must be the frontend URL, not the Strapi OAuth callback')
    console.error('  DB callback:     ', grantFrontendCb || '(empty)')
    console.error('  expected:        ', expectedRedirect)
    console.error('  Run: npm run sync:google')
    ok = false
  } else if (grantFrontendCb !== expectedRedirect) {
    console.warn('WARN: grant.google.callback:', grantFrontendCb || '(missing)')
    console.warn('      expected:            ', expectedRedirect)
    console.warn('      Run: npm run sync:google')
  } else {
    console.log('OK: grant.google.callback →', grantFrontendCb)
  }
  if (!g.key || !g.secret) {
    console.error('FAIL: grant.google key/secret empty in DB')
    ok = false
  } else {
    console.log('OK: grant.google key/secret set in DB')
  }
}

const redirect = advanced?.default_redirect_url
if (redirect !== expectedRedirect) {
  console.warn('WARN: default_redirect_url:', redirect || '(missing)')
  console.warn('      expected:            ', expectedRedirect)
  console.warn('      Restart Strapi to sync from FRONTEND_URL')
} else {
  console.log('OK: post-login redirect →', redirect)
}

console.log('')
console.log('OAuth flow (correct URLs):')
console.log('  1. Click Continue with Google →', `${process.env.PUBLIC_URL || 'http://localhost:1337'}/api/connect/google`)
console.log('  2. Google account picker (accounts.google.com)')
console.log('  3. Google → Strapi callback →', CALLBACK)
console.log('  4. Strapi → frontend →', expectedRedirect)

await client.end()
process.exit(ok ? 0 : 1)
