/**
 * Strapi admin HMR defaults to port 5173 (same as website Vite) → "426 Upgrade Required".
 * Patch @strapi/strapi to start HMR on 5175 instead (runs on postinstall).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STRAPI_PKG = path.resolve(__dirname, '../node_modules/@strapi/strapi/dist/src/node/vite')

const OLD = 'const HMR_DEFAULT_PORT = 5173;'
const NEW =
  "const HMR_DEFAULT_PORT = Number(process.env.STRAPI_ADMIN_HMR_PORT || 5175);"

for (const file of ['watch.mjs', 'watch.js']) {
  const target = path.join(STRAPI_PKG, file)
  if (!fs.existsSync(target)) {
    console.warn(`[patch-strapi-hmr] skip missing ${file}`)
    continue
  }
  const text = fs.readFileSync(target, 'utf8')
  if (text.includes(NEW)) {
    console.log(`[patch-strapi-hmr] already patched ${file}`)
    continue
  }
  if (!text.includes(OLD)) {
    console.warn(`[patch-strapi-hmr] pattern not found in ${file} — Strapi version may have changed`)
    continue
  }
  fs.writeFileSync(target, text.replace(OLD, NEW))
  console.log(`[patch-strapi-hmr] patched ${file} → HMR port 5175`)
}
