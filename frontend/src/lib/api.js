/**
 * Custom Express API client (Week 3+ features).
 *
 * Handles: bookings, payments, cart, planner lead submissions,
 * messaging, support tickets, notifications.
 *
 * Base URL: VITE_API_URL (default localhost:4000, proxied via nginx in prod)
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const AUTH_EVENT = 'elewen-auth-change'

let refreshPromise = null

function setStoredJwt(jwt) {
  if (!jwt) return
  localStorage.setItem('elewen_jwt', jwt)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

function clearStoredJwt() {
  localStorage.removeItem('elewen_jwt')
  window.dispatchEvent(new Event(AUTH_EVENT))
}

async function refreshJwt() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async res => {
        if (!res.ok) {
          const msg = await res.text().catch(() => '')
          throw new Error(`API ${res.status} on POST /auth/refresh: ${msg}`)
        }

        const data = await res.json()
        if (!data?.jwt) {
          throw new Error('API refresh did not return a jwt')
        }

        setStoredJwt(data.jwt)
        return data.jwt
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

async function request(method, path, body, opts = {}) {
  const { _retried = false, headers: extraHeaders = {}, ...restOpts } = opts
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include', // send/receive HttpOnly refresh cookie
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...restOpts,
  })

  const hasBearerToken = typeof extraHeaders.Authorization === 'string'
  const canRefresh = hasBearerToken && path !== '/auth/refresh' && !_retried

  if (res.status === 401 && canRefresh) {
    try {
      const nextJwt = await refreshJwt()
      return request(method, path, body, {
        ...restOpts,
        _retried: true,
        headers: {
          ...extraHeaders,
          Authorization: `Bearer ${nextJwt}`,
        },
      })
    } catch (refreshErr) {
      clearStoredJwt()
      throw refreshErr
    }
  }

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`API ${res.status} on ${method} ${path}: ${msg}`)
  }

  return res.json()
}

export const apiGet = (path, opts) => request('GET', path, null, opts)
export const apiPost = (path, body, opts) => request('POST', path, body, opts)
export const apiPut = (path, body, opts) => request('PUT', path, body, opts)
export const apiDel = (path, opts) => request('DELETE', path, null, opts)

/* ── Auth ─────────────────────────────────────────────────────────────────── */

export const authRegister = body => apiPost('/auth/register', body)
export const authLogin = body => apiPost('/auth/login', body)
export const authLogout = () => apiPost('/auth/logout')
export const authRefresh = () => apiPost('/auth/refresh')
export const authMe = token => apiGet('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
export const authForgotPassword = email => apiPost('/auth/forgot-password', { email })
export const authResetPassword = body => apiPost('/auth/reset-password', body)
export const authGoogleSession = access_token => apiPost('/auth/google/session', { access_token })

/* -- Cart ------------------------------------------------------------------- */

export const cartGet = token => apiGet('/cart', { headers: { Authorization: `Bearer ${token}` } })
export const cartAddItem = (token, body) =>
  apiPost('/cart/items', body, { headers: { Authorization: `Bearer ${token}` } })
export const cartUpdateItem = (token, itemId, body) =>
  apiPut(`/cart/items/${itemId}`, body, { headers: { Authorization: `Bearer ${token}` } })
export const cartRemoveItem = (token, itemId) =>
  apiDel(`/cart/items/${itemId}`, { headers: { Authorization: `Bearer ${token}` } })
export const cartUpdate = (token, body) =>
  request('PATCH', '/cart', body, { headers: { Authorization: `Bearer ${token}` } })
export const cartApplyCoupon = (token, body) =>
  apiPost('/cart/coupon', body, { headers: { Authorization: `Bearer ${token}` } })
export const cartRemoveCoupon = token =>
  apiDel('/cart/coupon', { headers: { Authorization: `Bearer ${token}` } })

/* ── Consultation ─────────────────────────────────────────────────────────── */

/**
 * Submit a Book a Consultation enquiry.
 * Maps to POST /consultations in the Express API.
 *
 * @param {Object} body
 * @param {string} body.full_name
 * @param {string} body.email
 * @param {string} body.phone
 * @param {string} [body.event_type]
 * @param {string} [body.event_date]
 * @param {string} [body.guest_count]
 * @param {string} [body.city]
 * @param {string} [body.budget_range]
 * @param {string} [body.vision_notes]
 */
export function submitConsultation(body) {
  return apiPost('/consultations', body)
}

/* ── Planner Lead ─────────────────────────────────────────────────────────── */

/**
 * Submit an in-house planner enquiry.
 * Maps to POST /planner-leads in the Express API.
 *
 * @param {Object} lead
 * @param {string} lead.full_name
 * @param {string} lead.email
 * @param {string} lead.phone
 * @param {string} lead.city
 * @param {string} lead.event_type
 * @param {string} lead.event_date
 * @param {string} lead.guest_count
 * @param {string} lead.venue_type
 * @param {string[]} lead.support_types   - e.g. ['Decor & Styling', 'Catering']
 * @param {string} lead.vision_notes
 */
export function submitPlannerLead(lead) {
  return apiPost('/planner-leads', lead)
}
