/**
 * Strapi REST client helpers shared by the Express API.
 *
 * Notes:
 * - Content API collection/single-type endpoints use `/api/...`
 * - Auth endpoints (`/auth/local`, `/auth/local/register`, etc.) expect raw JSON bodies
 * - Content create/update endpoints expect `{ data: ... }`
 */

import { withCache, cacheDel, cacheDelPattern, TTL } from './cache.js'

const getBaseCandidates = () => {
  // ponytail: never use VITE_STRAPI_URL here — root/docker .env sets it to production
  // and Docker API would skip local Strapi when the internal strapi hostname is down.
  const configured = [process.env.STRAPI_URL, 'http://localhost:1337']
    .map(value => String(value ?? '').trim())
    .filter(Boolean)

  return [...new Set(configured)]
}

// Public package/coupon reads for hybrid local: auth on local Strapi, catalog on prod CMS.
const getContentBaseCandidates = () => {
  const configured = [
    process.env.STRAPI_CONTENT_URL,
    process.env.STRAPI_URL,
    'http://localhost:1337',
  ]
    .map(value => String(value ?? '').trim())
    .filter(Boolean)

  return [...new Set(configured)]
}

const getBase = () => getBaseCandidates()[0] || 'http://localhost:1337'
const getServerToken = () => process.env.STRAPI_ADMIN_TOKEN || process.env.STRAPI_API_TOKEN || null

const shouldRetryContentBase = error => !error?.status || error.status === 403 || error.status === 404

const normalizePath = (path, { prefixApi = true } = {}) => {
  if (!path.startsWith('/')) return prefixApi ? `/api/${path}` : `/${path}`
  if (path.startsWith('/api/')) return path
  return prefixApi ? `/api${path}` : path
}

const buildHeaders = extraHeaders => {
  const headers = { ...extraHeaders }
  const serverToken = getServerToken()
  if (serverToken) {
    headers.Authorization = `Bearer ${serverToken}`
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

const shouldRetryWithNextBase = error => !error?.status

const requestJson = async (path, { method = 'GET', headers = {}, body, prefixApi = true } = {}) => {
  const normalizedPath = normalizePath(path, { prefixApi })
  let lastError = null

  for (const base of getBaseCandidates()) {
    try {
      const res = await fetch(`${base}${normalizedPath}`, {
        method,
        headers,
        ...(body !== undefined && { body: JSON.stringify(body) }),
      })

      if (!res.ok) {
        throw await makeStrapiError(res, `${method} ${path} failed`)
      }

      // Strapi often returns 204 or an empty body for DELETE and some user lookups.
      if (res.status === 204) return null

      const text = await res.text()
      if (!text.trim()) return null

      return JSON.parse(text)
    } catch (error) {
      if (!shouldRetryWithNextBase(error)) {
        throw error
      }

      lastError = error
    }
  }

  throw lastError ?? new Error(`${method} ${path} failed`)
}

const requestRaw = async (path, { method = 'GET', headers = {}, body, prefixApi = true } = {}) => {
  const normalizedPath = normalizePath(path, { prefixApi })
  let lastError = null

  for (const base of getBaseCandidates()) {
    try {
      const res = await fetch(`${base}${normalizedPath}`, {
        method,
        headers,
        ...(body !== undefined && { body }),
      })

      if (!res.ok) {
        throw await makeStrapiError(res, `${method} ${path} failed`)
      }

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        return res.json()
      }

      return res.text()
    } catch (error) {
      if (!shouldRetryWithNextBase(error)) {
        throw error
      }

      lastError = error
    }
  }

  throw lastError ?? new Error(`${method} ${path} failed`)
}

// ---------------- GET ----------------
export async function strapiGet(path, params = {}) {
  let lastError = null

  for (const base of getContentBaseCandidates()) {
    try {
      const url = new URL(normalizePath(path), base)

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
    } catch (error) {
      if (!shouldRetryContentBase(error)) {
        throw error
      }

      lastError = error
    }
  }

  throw lastError ?? new Error(`GET ${path} failed`)
}

// ---------------- POST ----------------
export async function strapiPost(path, body) {
  return requestJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

// ---------------- PUBLIC UPLOAD ----------------
export async function strapiUpload(path, formData) {
  return requestRaw(path, {
    method: 'POST',
    body: formData,
    prefixApi: !path.startsWith('/api/'),
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
export async function strapiServerGet(path, { skipCache = false } = {}) {
  if (skipCache) {
    return requestJson(path, {
      headers: buildHeaders(),
      prefixApi: !path.startsWith('/api/'),
    })
  }

  const key = `strapi:GET:${path}`
  return withCache(key, TTL.STRAPI, () =>
    requestJson(path, {
      headers: buildHeaders(),
      prefixApi: !path.startsWith('/api/'),
    })
  )
}

// Call after writes to Strapi so stale cache is cleared for that path
export async function invalidateStrapiCache(path) {
  await cacheDel(`strapi:GET:${path}`)
}

export async function invalidateStrapiCachePattern(pattern) {
  await cacheDelPattern(pattern)
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

// ---------------- SERVER DELETE ----------------
export async function strapiServerDelete(path) {
  return requestJson(path, {
    method: 'DELETE',
    headers: buildHeaders(),
    prefixApi: !path.startsWith('/api/'),
  })
}

// ---------------- SERVER UPLOAD ----------------
export async function strapiServerUpload(path, formData) {
  return requestRaw(path, {
    method: 'POST',
    headers: buildHeaders(),
    body: formData,
    prefixApi: !path.startsWith('/api/'),
  })
}

// ---------------- GET ME ----------------
export async function strapiGetMe(jwt) {
  let lastError = null

  for (const base of getBaseCandidates()) {
    try {
      const res = await fetch(`${base}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      })

      if (!res.ok) throw await makeStrapiError(res, 'Failed to fetch user')
      return res.json()
    } catch (error) {
      if (!shouldRetryWithNextBase(error)) {
        throw error
      }

      lastError = error
    }
  }

  throw lastError ?? new Error('Failed to fetch user')
}

// ---------------- GET USER BY ID ----------------
export async function strapiGetUserById(userId) {
  const parsedUserId = Number.parseInt(String(userId ?? ''), 10)
  if (!Number.isInteger(parsedUserId)) return null

  let lastError = null

  for (const base of getBaseCandidates()) {
    try {
      const query = new URLSearchParams({
        'filters[id][$eq]': String(parsedUserId),
        'pagination[pageSize]': '1',
      })

      const res = await fetch(`${base}/api/users?${query.toString()}`, {
        headers: buildHeaders(),
      })

      if (!res.ok) {
        throw await makeStrapiError(res, 'Failed to get user by id')
      }

      const payload = await res.json()
      const users = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : payload?.id != null
            ? [payload]
            : []

      return users[0] ?? null
    } catch (error) {
      if (!shouldRetryWithNextBase(error)) {
        throw error
      }

      lastError = error
    }
  }

  throw lastError ?? new Error('Failed to get user by id')
}

// ---------------- FIND USER BY EMAIL ----------------
export async function strapiFindUserByEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (!normalized) return null

  let lastError = null

  for (const base of getBaseCandidates()) {
    try {
      const query = new URLSearchParams({
        'filters[email][$eqi]': normalized,
        'pagination[pageSize]': '1',
      })

      const res = await fetch(`${base}/api/users?${query.toString()}`, {
        headers: buildHeaders(),
      })

      if (!res.ok) {
        throw await makeStrapiError(res, 'Failed to find user by email')
      }

      const payload = await res.json()
      const users = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : payload?.id != null
            ? [payload]
            : []

      return users[0] ?? null
    } catch (error) {
      if (!shouldRetryWithNextBase(error)) {
        throw error
      }

      lastError = error
    }
  }

  throw lastError ?? new Error('Failed to find user by email')
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

/**
 * Exchange a Google OAuth access_token for a Strapi user + JWT.
 * Uses the public users-permissions route (no admin API token required).
 */
export async function exchangeGoogleAccessTokenViaStrapi(accessToken) {
  let lastError = null
  const query = new URLSearchParams({ access_token: accessToken })

  for (const base of getBaseCandidates()) {
    try {
      const res = await fetch(`${base}/api/auth/google/callback?${query.toString()}`)

      if (!res.ok) {
        throw await makeStrapiError(res, 'Google Strapi OAuth callback failed')
      }

      return res.json()
    } catch (error) {
      if (!shouldRetryWithNextBase(error)) {
        throw error
      }

      lastError = error
    }
  }

  throw lastError ?? new Error('Google Strapi OAuth callback failed')
}
