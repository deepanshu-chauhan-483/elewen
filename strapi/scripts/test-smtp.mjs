/**
 * Test email from strapi/.env — run: npm run test:smtp
 *
 * Gmail: SMTP_PROVIDER=gmail + SMTP_USER + SMTP_PASS (App Password)
 * Resend: SMTP_PROVIDER=resend + RESEND_API_KEY (uses HTTPS API to avoid SMTP port blocks)
 */
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { buildSmtpTransportOptions } = require('../config/email-smtp.js')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '../.env')
// Docker: use compose env vars. Local: load strapi/.env (dotenv does not override existing env).
dotenv.config({ path: envPath })

const get = key => process.env[key] ?? ''
const providerName = String(process.env.SMTP_PROVIDER || '').toLowerCase()

if (process.env.RESEND_API_KEY && providerName !== 'gmail') {
  const from = process.env.SMTP_FROM || 'onboarding@resend.dev'
  const to = process.env.SMTP_TEST_TO || from

  try {
    console.log('Email provider: resend')
    console.log('Transport: HTTPS API')
    console.log('RESEND_API_KEY set:', true, 'length:', process.env.RESEND_API_KEY.length)
    console.log('Sending test email to', to, 'from', from)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: 'Elewen Resend test',
        text: 'If you receive this, sign-up confirmation emails can use Resend HTTPS.',
        reply_to: process.env.SMTP_REPLY_TO || undefined,
      }),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(
        payload?.message || payload?.error || `Resend failed with HTTP ${response.status}`
      )
    }

    console.log('Sent:', payload?.id || '(no id returned)')
    console.log('Resend is configured correctly.')
    process.exit(0)
  } catch (e) {
    console.error('\nResend failed:', e.message)
    process.exit(1)
  }
}

if (!process.env.SMTP_PASS && !process.env.RESEND_API_KEY) {
  console.error(
    'SMTP_PASS / RESEND_API_KEY not set in environment.\n' +
      'Production: add SMTP_* to ~/elewen/.env (root), then: docker compose up -d strapi --force-recreate\n' +
      'Local: set values in strapi/.env'
  )
  process.exit(1)
}
const smtp = buildSmtpTransportOptions(get)
const { provider, host, port, secure, requireTLS, auth } = smtp

console.log('SMTP provider:', provider)
if (provider === 'gmail') {
  console.log('SMTP_USER:', auth.user)
  console.log('SMTP_PASS length:', auth.pass.length)
  if (auth.pass.length !== 16) {
    console.warn('Warning: Gmail app passwords are usually exactly 16 characters.')
  }
} else {
  console.log('RESEND_API_KEY set:', Boolean(auth.pass), 'length:', auth.pass.length)
}
console.log('SMTP_HOST:', host, 'port:', port)

if (!auth.pass || (provider === 'gmail' && !auth.user)) {
  console.error(
    provider === 'resend'
      ? 'Missing RESEND_API_KEY in strapi/.env — sign up at https://resend.com'
      : 'Missing SMTP_USER or SMTP_PASS in strapi/.env'
  )
  process.exit(1)
}

const transport = nodemailer.createTransport({
  host,
  port,
  secure,
  requireTLS,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  auth,
})

const timeoutMs = 25000
const withTimeout = (promise, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])

const from = process.env.SMTP_FROM || (provider === 'resend' ? 'onboarding@resend.dev' : auth.user)
const to = process.env.SMTP_TEST_TO || auth.user || from

try {
  console.log(`Connecting (${provider}, up to 25s)...`)
  await withTimeout(transport.verify(), 'SMTP verify')
  console.log('SMTP verify OK')

  console.log('Sending test email to', to, 'from', from)
  const info = await withTimeout(
    transport.sendMail({
      from,
      to,
      subject: 'Elewen SMTP test',
      text: 'If you receive this, sign-up confirmation emails will work.',
    }),
    'sendMail'
  )
  console.log('Sent:', info.messageId)
  console.log('SMTP is configured correctly.')
  process.exit(0)
} catch (e) {
  console.error('\nSMTP failed:', e.message)
  if (String(e.message).includes('535') || String(e.message).includes('BadCredentials')) {
    console.error(`
Gmail rejected the app password (535). Your .env format is fine — Google does not accept this password.

Do ONE of the following:

A) New Gmail App Password (must be created in Google, not typed from memory)
   1. Sign in as ${auth.user} at https://mail.google.com
   2. Open https://myaccount.google.com/apppasswords
      - If you do not see "App passwords", enable 2-Step Verification first.
      - If still missing, your Workspace admin may block app passwords.
   3. Remove old "Elewen" app passwords, create a NEW one, copy the 16 characters once.
   4. strapi/.env: SMTP_PASS=paste_new_16_chars_only  (do not reuse oytm…)
   5. npm run test:smtp

B) Use Resend instead (works without Gmail app passwords)
   1. https://resend.com → API Keys → create key
   2. strapi/.env:
      SMTP_PROVIDER=resend
      RESEND_API_KEY=re_xxxxxxxx
      SMTP_FROM=onboarding@resend.dev
   3. npm run test:smtp
   4. Restart Strapi
`)
  }
  process.exit(1)
}
