/**
 * Strapi REST client helpers shared by the Express API.
 *
 * Notes:
 * - Content API collection/single-type endpoints use `/api/...`
 * - Auth endpoints (`/auth/local`, `/auth/local/register`, etc.) expect raw JSON bodies
 * - Content create/update endpoints expect `{ data: ... }`
 */
 
const BASE = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337'
const SERVER_TOKEN = import.meta.env.VITE_STRAPI_ADMIN_TOKEN || import.meta.env.VITE_STRAPI_API_TOKEN || null

export const USE_FALLBACK = import.meta.env.VITE_USE_FALLBACK === 'true'
 
const normalizePath = (path, { prefixApi = true } = {}) => {
  if (!path.startsWith('/')) return prefixApi ? `/api/${path}` : `/${path}`
  if (path.startsWith('/api/')) return path
  return prefixApi ? `/api${path}` : path
}
 
const buildHeaders = extraHeaders => {
  const headers = { ...extraHeaders }
  if (SERVER_TOKEN) {
    headers.Authorization = `Bearer ${SERVER_TOKEN}`
  }
  return headers
}
 
const makeStrapiError = async (res, fallbackMessage) => {
  let payload = null
  let text = ''
 
  try {
    payload = await res.json()
  } catch {
    text = await res.text().catch(() => '')
  }
 
  const strapiError = payload?.error ?? payload ?? null
  const message = strapiError?.message || text || fallbackMessage
  const error = new Error(message)
  error.status = res.status
  error.strapiError = strapiError
  return error
}
 
const requestJson = async (
  path,
  { method = 'GET', headers = {}, body, prefixApi = true } = {}
) => {
  const res = await fetch(`${BASE}${normalizePath(path, { prefixApi })}`, {
    method,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
 
  if (!res.ok) {
    throw await makeStrapiError(res, `${method} ${path} failed`)
  }
 
  return res.json()
}
 
// ---------------- GET ----------------
export async function strapiGet(path, params = {}) {
  const url = new URL(normalizePath(path), BASE)
 
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v))
    }
  })
 
  const res = await fetch(url.toString())
 
  if (!res.ok) {
    throw await makeStrapiError(res, `GET ${path} failed`)
  }
 
  return res.json()
}
 
// ---------------- POST ----------------
export async function strapiPost(path, body) {
  return requestJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}
 
// ---------------- ADMIN PUT ----------------
export async function strapiAdminPut(path, body) {
  return requestJson(path, {
    method: 'PUT',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body,
  })
}
 
// ---------------- SERVER GET ----------------
export async function strapiServerGet(path) {
  return requestJson(path, {
    headers: buildHeaders(),
    prefixApi: !path.startsWith('/api/'),
  })
}
 
// ---------------- SERVER POST ----------------
export async function strapiServerPost(path, body) {
  return requestJson(path, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body,
    prefixApi: !path.startsWith('/api/'),
  })
}
 
// ---------------- SERVER PUT ----------------
export async function strapiServerPut(path, body) {
  return requestJson(path, {
    method: 'PUT',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body,
    prefixApi: !path.startsWith('/api/'),
  })
}
 
// ---------------- GET ME ----------------
export async function strapiGetMe(jwt) {
  const res = await fetch(`${BASE}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  })
 
  if (!res.ok) throw await makeStrapiError(res, 'Failed to fetch user')
  return res.json()
}
 
// ---------------- FIND USER BY EMAIL ----------------
export async function strapiFindUserByEmail(email) {
  const res = await fetch(`${BASE}/api/users?filters[email][$eq]=${encodeURIComponent(email)}`, {
    headers: buildHeaders(),
  })
 
  if (!res.ok) {
    throw await makeStrapiError(res, 'Failed to find user by email')
  }
 
  const data = await res.json()
  return data?.[0] ?? null
}
 
// ---------------- CREATE USER ----------------
export async function strapiCreateUser(body) {
  return requestJson('/api/users', {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body,
    prefixApi: false,
  })
}
 
 