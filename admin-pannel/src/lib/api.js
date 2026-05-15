const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const STORAGE_KEY = 'elewen_admin_jwt'
const AUTH_EVENT = 'elewen-admin-auth-change'

let refreshPromise = null

function createAuthRequiredError(message = 'AUTH_REQUIRED') {
  const error = new Error(message)
  error.code = 'AUTH_REQUIRED'
  return error
}

function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null
    const [, payload = ''] = token.split('.')
    if (!payload) return null
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

function isJwtLike(token) {
  return typeof token === 'string' && token.split('.').length === 3
}

function isJwtExpired(token, skewMs = 30 * 1000) {
  const payload = decodeJwtPayload(token)
  const expSeconds = Number(payload?.exp ?? 0)

  if (!expSeconds) return false
  return Date.now() >= expSeconds * 1000 - skewMs
}

export function getStoredAdminJwt() {
  const token = localStorage.getItem(STORAGE_KEY) || ''

  if (!token) return ''
  if (!isJwtLike(token)) {
    clearStoredAdminJwt()
    return ''
  }

  return token
}

export function setStoredAdminJwt(jwt) {
  if (!jwt) return
  localStorage.setItem(STORAGE_KEY, jwt)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function clearStoredAdminJwt() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

async function refreshAdminJwt() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async res => {
        if (!res.ok) {
          const message = await res.text().catch(() => '')
          throw createAuthRequiredError(`API ${res.status} on POST /auth/refresh: ${message}`)
        }

        const data = await res.json()
        if (!data?.jwt) {
          throw createAuthRequiredError('Refresh did not return jwt')
        }

        setStoredAdminJwt(data.jwt)
        return data.jwt
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export async function getValidStoredAdminJwt() {
  const token = getStoredAdminJwt()
  if (!token) return ''
  if (!isJwtExpired(token)) return token

  try {
    return await refreshAdminJwt()
  } catch {
    clearStoredAdminJwt()
    return ''
  }
}

function withQuery(path, params = {}) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.set(key, String(value))
  })

  const query = search.toString()
  return query ? `${path}?${query}` : path
}

async function request(method, path, body, opts = {}) {
  const { _retried = false, headers: extraHeaders = {}, ...rest } = opts
  const authHeader = extraHeaders.Authorization
  const bearerToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...rest,
  })

  const hasBearerToken = typeof authHeader === 'string'
  const canRefresh = hasBearerToken && path !== '/auth/refresh' && !_retried

  if (res.status === 401 && canRefresh) {
    try {
      const nextJwt = await refreshAdminJwt()
      return request(method, path, body, {
        ...rest,
        _retried: true,
        headers: {
          ...extraHeaders,
          Authorization: `Bearer ${nextJwt}`,
        },
      })
    } catch (refreshErr) {
      throw createAuthRequiredError(refreshErr.message)
    }
  }

  if (!res.ok) {
    const message = await res.text().catch(() => '')
    if (res.status === 401) {
      throw createAuthRequiredError(`API ${res.status} on ${method} ${path}: ${message}`)
    }

    const error = new Error(`API ${res.status} on ${method} ${path}: ${message}`)
    error.status = res.status
    throw error
  }

  return res.json()
}

export const authLogin = body => request('POST', '/auth/login', body)
export const authLogout = () => request('POST', '/auth/logout')
export const adminSession = token =>
  request('GET', '/admin/session', null, { headers: { Authorization: `Bearer ${token}` } })

export const adminOverview = token =>
  request('GET', '/admin/overview', null, { headers: { Authorization: `Bearer ${token}` } })

export const adminBookings = (token, params = {}) =>
  request('GET', withQuery('/admin/bookings', params), null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminBooking = (token, bookingId) =>
  request('GET', `/admin/bookings/${bookingId}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminUpdateBookingStatus = (token, bookingId, body) =>
  request('PATCH', `/admin/bookings/${bookingId}/status`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminAddBookingNote = (token, bookingId, body) =>
  request('POST', `/admin/bookings/${bookingId}/notes`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminSampleTastes = (token, params = {}) =>
  request('GET', withQuery('/admin/sample-taste', params), null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminUpdateSampleTasteStatus = (token, sampleId, body) =>
  request('PATCH', `/admin/sample-taste/${sampleId}/status`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminVendors = (token, params = {}) =>
  request('GET', withQuery('/admin/vendors', params), null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminVendorWorkspace = token =>
  request('GET', '/admin/vendors/workspace', null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminUpdateVendor = (token, vendorId, body) =>
  request('PATCH', `/admin/vendors/${vendorId}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminVendorAssignments = (token, params = {}) =>
  request('GET', withQuery('/admin/vendor-assignments', params), null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminCreateVendorAssignment = (token, body) =>
  request('POST', '/admin/vendor-assignments', body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminUpdateVendorAssignment = (token, assignmentId, body) =>
  request('PATCH', `/admin/vendor-assignments/${assignmentId}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminMessageThreads = (token, params = {}) =>
  request('GET', withQuery('/admin/messages/threads', params), null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminMessageThread = (token, bookingId) =>
  request('GET', `/admin/messages/threads/${bookingId}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminSendMessage = (token, body) =>
  request('POST', '/admin/messages', body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminPaymentSummary = token =>
  request('GET', '/admin/payments/summary', null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminPayments = (token, params = {}) =>
  request('GET', withQuery('/admin/payments', params), null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminPaymentWorkspace = token =>
  request('GET', '/admin/payments/workspace', null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminRefunds = (token, params = {}) =>
  request('GET', withQuery('/admin/refunds', params), null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminProcessRefund = (token, refundId, body) =>
  request('PATCH', `/admin/refunds/${refundId}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminVendorPayouts = (token, params = {}) =>
  request('GET', withQuery('/admin/vendor-payouts', params), null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminCreateVendorPayout = (token, body) =>
  request('POST', '/admin/vendor-payouts', body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminUpdateVendorPayout = (token, payoutId, body) =>
  request('PATCH', `/admin/vendor-payouts/${payoutId}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminCoupons = (token, params = {}) =>
  request('GET', withQuery('/admin/coupons', params), null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminCreateCoupon = (token, body) =>
  request('POST', '/admin/coupons', body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminUpdateCoupon = (token, couponId, body) =>
  request('PATCH', `/admin/coupons/${couponId}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminSettings = token =>
  request('GET', '/admin/settings', null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminUpdateSettings = (token, body) =>
  request('PATCH', '/admin/settings', body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminSupportTickets = (token, params = {}) =>
  request('GET', withQuery('/admin/support', params), null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminSupportTicket = (token, ticketId) =>
  request('GET', `/admin/support/${ticketId}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminUpdateSupportTicket = (token, ticketId, body) =>
  request('PATCH', `/admin/support/${ticketId}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminAddSupportMessage = (token, ticketId, body) =>
  request('POST', `/admin/support/${ticketId}/messages`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminAlerts = (token, params = {}) =>
  request('GET', withQuery('/admin/alerts', params), null, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const adminUpdateAlert = (token, alertId, body) =>
  request('PATCH', `/admin/alerts/${alertId}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })
