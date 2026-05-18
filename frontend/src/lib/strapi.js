/**
 * Strapi v5 REST client.
 *
 * Response shape: { data: [...flatObjects], meta: { pagination } }
 * (v5 no longer wraps items in { attributes }; fields are flat on the object.)
 *
 * Usage:
 *   import { strapiGet } from '../lib/strapi'
 *   const { data } = await strapiGet('/packages', { populate: '*' })
 */

const BASE = import.meta.env.VITE_STRAPI_URL ?? '/cms'

/**
 * When VITE_USE_FALLBACK=true, all hooks skip the Strapi fetch and return
 * placeholder data immediately. Useful for UI dev without a running CMS.
 */
export const USE_FALLBACK = import.meta.env.VITE_USE_FALLBACK === 'true'

/**
 * GET /api/<path> with optional query params.
 * Throws on non-2xx.
 */
export async function strapiGet(path, params = {}) {
  const url = new URL(`/api${path}`, BASE)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })

  const res = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Strapi ${res.status} on GET ${path}`)
  }

  return res.json() // { data, meta }
}

/**
 * POST /api/<path> — used for Strapi collection create endpoints
 * (e.g. planner lead submissions if stored in Strapi).
 */
export async function strapiPost(path, body) {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: body }), // Strapi v5 wraps body in { data }
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`Strapi ${res.status} on POST ${path}: ${msg}`)
  }

  return res.json()
}
