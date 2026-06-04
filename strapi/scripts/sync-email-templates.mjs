#!/usr/bin/env node
/**
 * Sync forgot-password email template + reset URL from strapi/.env
 * Run: npm run sync:email-templates
 */
import pg from 'pg'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
const resetUrl = `${frontendUrl}/reset-password`
const senderEmail = process.env.SMTP_FROM || 'onboarding@resend.dev'
const senderName = process.env.SMTP_FROM_NAME || 'Elewen'

const resetPasswordEmailBody =
  '<p>We heard that you lost your password. Sorry about that!</p>' +
  '<p>But don’t worry! You can use the following link to reset your password:</p>' +
  '<p><a href="<%= URL %>?code=<%= TOKEN %>">Reset your password</a></p>' +
  '<p><%= URL %>?code=<%= TOKEN %></p>' +
  '<p>Thanks.</p>'

const connectionString = `postgresql://${process.env.DATABASE_USERNAME || 'postgres'}:${process.env.DATABASE_PASSWORD || 'postgres'}@${process.env.DATABASE_HOST || '127.0.0.1'}:${process.env.DATABASE_PORT || '15432'}/${process.env.DATABASE_NAME || 'elewen'}`

const client = new pg.Client({ connectionString })
await client.connect()

const { rows: advRows } = await client.query(
  "SELECT id, value FROM strapi_core_store_settings WHERE key = 'plugin_users-permissions_advanced'"
)
const advanced = JSON.parse(advRows[0].value)
advanced.email_reset_password = resetUrl
await client.query('UPDATE strapi_core_store_settings SET value = $1::jsonb WHERE id = $2', [
  JSON.stringify(advanced),
  advRows[0].id,
])

const { rows: emailRows } = await client.query(
  "SELECT id, value FROM strapi_core_store_settings WHERE key = 'plugin_users-permissions_email'"
)
const templates = JSON.parse(emailRows[0].value)
templates.reset_password = {
  ...templates.reset_password,
  options: {
    ...templates.reset_password?.options,
    object: 'Reset your Elewen password',
    message: resetPasswordEmailBody,
    from: { name: senderName, email: senderEmail },
    response_email: process.env.SMTP_REPLY_TO || senderEmail,
  },
}
await client.query('UPDATE strapi_core_store_settings SET value = $1::jsonb WHERE id = $2', [
  JSON.stringify(templates),
  emailRows[0].id,
])

console.log('Forgot-password email synced.')
console.log('  Reset link base (URL in email):', resetUrl)
console.log('  Example link:                 ', `${resetUrl}?code=<token>`)
console.log('  From:                         ', senderEmail)

await client.end()
