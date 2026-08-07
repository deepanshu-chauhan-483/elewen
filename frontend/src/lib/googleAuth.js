/**
 * Strapi server-side Google OAuth — browser must hit Strapi on its real origin.
 * Flow: Strapi /api/connect/google → Google → Strapi callback → FRONTEND/auth/callback
 *
 * Never start OAuth through the Vite `/cms` proxy: OAuth state cookies would be set on the
 * frontend host and then missing when Google returns to strapi.*.
 */

const PROD_STRAPI_FALLBACK = 'https://strapi.elewen.co.in'
const LOCAL_STRAPI_FALLBACK = 'http://localhost:1337'

function stripTrailingSlash(value = '') {
  return String(value).replace(/\/$/, '')
}

function isAbsoluteHttpUrl(value = '') {
  return /^https?:\/\//i.test(String(value).trim())
}

/** Absolute Strapi origin for Google OAuth only (never relative `/cms`). */
export function getGoogleStrapiBaseUrl() {
  const configured = stripTrailingSlash(
    import.meta.env.VITE_GOOGLE_STRAPI_URL ||
      import.meta.env.VITE_STRAPI_PROXY_TARGET ||
      import.meta.env.VITE_STRAPI_URL ||
      ''
  )

  if (isAbsoluteHttpUrl(configured)) {
    return configured
  }

  // Relative `/cms` (local proxy) — OAuth must go to the real Strapi host.
  if (import.meta.env.DEV) {
    return LOCAL_STRAPI_FALLBACK
  }

  return PROD_STRAPI_FALLBACK
}

/** General CMS base (may be `/cms` for proxied reads). Prefer getGoogleStrapiBaseUrl for OAuth. */
export function getStrapiBaseUrl() {
  return stripTrailingSlash(import.meta.env.VITE_STRAPI_URL ?? LOCAL_STRAPI_FALLBACK)
}

export function getGoogleConnectUrl() {
  return `${getGoogleStrapiBaseUrl()}/api/connect/google`
}

export function getGoogleAuthErrorMessage(authError = '') {
  switch (String(authError)) {
    case 'local_account_use_password':
      return 'This email is already registered with password login. Please sign in with your password (not Google).'
    case 'rate_limited':
      return 'Too many sign-in attempts. Please wait a minute and try Google again.'
    case 'google_denied':
      return 'Google sign-in was cancelled or denied. Please try again, or sign in with email and password.'
    case 'google_missing_token':
      return 'Google sign-in did not return a session. Check that pop-ups/trackers are not blocking redirects, then try again.'
    case 'google_failed':
      return 'Google sign-in could not be completed. Try Chrome/Incognito, disable tracker blockers, or use email and password.'
    default:
      return ''
  }
}

/** If user is on www.*, bounce to apex so Strapi FRONTEND_URL callback matches this origin. */
function ensureApexHostForOAuth(originPath, redirectPath) {
  if (typeof window === 'undefined') return false
  const { protocol, hostname } = window.location
  if (!hostname.startsWith('www.')) return false

  const apex = hostname.replace(/^www\./, '')
  const pathOnly = String(originPath || '/login').split('?')[0] || '/login'
  const params = new URLSearchParams()
  params.set('google', '1')
  if (redirectPath) params.set('redirect', redirectPath)
  window.location.assign(`${protocol}//${apex}${pathOnly}?${params.toString()}`)
  return true
}

export function startGoogleSignIn(originPath = '/login', redirectPath = '') {
  if (ensureApexHostForOAuth(originPath, redirectPath)) return

  sessionStorage.setItem('elewen_auth_origin', originPath)
  if (redirectPath) {
    sessionStorage.setItem('elewen_auth_redirect', redirectPath)
  } else {
    sessionStorage.removeItem('elewen_auth_redirect')
  }
  window.location.assign(getGoogleConnectUrl())
}
