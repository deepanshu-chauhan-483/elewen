#!/usr/bin/env node
/**
 * Shows the exact redirect_uri Strapi sends to Google (paste into Google Cloud Console).
 * Run while Strapi is up: npm run show:google-redirect
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const strapiBase = (process.env.PUBLIC_URL || 'http://localhost:1337').replace(/\/$/, '')
const connectUrl = `${strapiBase}/api/connect/google`

console.log('Fetching:', connectUrl)
console.log('(Strapi must be running)\n')

try {
  const res = await fetch(connectUrl, { redirect: 'manual' })
  const location = res.headers.get('location')
  if (!location) {
    console.error('No redirect — status', res.status)
    const body = await res.text().catch(() => '')
    if (body) console.error(body.slice(0, 500))
    process.exit(1)
  }

  console.log('Google OAuth URL (first 120 chars):', location.slice(0, 120) + '…\n')

  const googleUrl = new URL(location, connectUrl)
  const redirectUri = googleUrl.searchParams.get('redirect_uri')

  if (!redirectUri) {
    console.log('Full Location header:\n', location)
    process.exit(1)
  }

  console.log('═══ ADD THIS EXACT URI in Google Cloud Console ═══')
  console.log('Credentials → OAuth 2.0 Client ID → Authorized redirect URIs:\n')
  console.log(redirectUri)
  console.log('\n═══ Common mistakes (cause redirect_uri_mismatch) ═══')
  console.log('  ✗ http://localhost:1337/api/connect/google          (missing /callback)')
  console.log('  ✗ http://127.0.0.1:1337/api/connect/google/callback   (use localhost, not 127.0.0.1)')
  console.log('  ✗ trailing slash on the URI')
  console.log('  ✗ wrong OAuth client (must match GOOGLE_CLIENT_ID in strapi/.env)')
  console.log('\nClient ID in strapi/.env:', process.env.GOOGLE_CLIENT_ID || '(missing)')
} catch (e) {
  console.error('Failed:', e.message)
  console.error('Start Strapi first: npm run develop')
  process.exit(1)
}
