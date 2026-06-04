#!/usr/bin/env node
/** Apply STRAPI_EMAIL_CONFIRMATION from strapi/.env to plugin store */
import pg from 'pg'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const emailConfirmation = process.env.STRAPI_EMAIL_CONFIRMATION !== 'false'

const connectionString = `postgresql://${process.env.DATABASE_USERNAME || 'postgres'}:${process.env.DATABASE_PASSWORD || 'postgres'}@${process.env.DATABASE_HOST || '127.0.0.1'}:${process.env.DATABASE_PORT || '15432'}/${process.env.DATABASE_NAME || 'elewen'}`

const client = new pg.Client({ connectionString })
await client.connect()
const { rows } = await client.query(
  "SELECT id, value FROM strapi_core_store_settings WHERE key = 'plugin_users-permissions_advanced'"
)
const advanced = JSON.parse(rows[0].value)
advanced.email_confirmation = emailConfirmation
await client.query('UPDATE strapi_core_store_settings SET value = $1::jsonb WHERE id = $2', [
  JSON.stringify(advanced),
  rows[0].id,
])
console.log(`email_confirmation set to ${emailConfirmation}`)
await client.end()
