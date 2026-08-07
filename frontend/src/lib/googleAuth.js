/**
 * Strapi server-side Google OAuth — browser must hit Strapi on its real host.
 * Flow: Strapi /api/connect/google → Google → Strapi callback → FRONTEND/auth/callback
 *
 * Never start OAuth via relative `/cms` proxy: Set-Cookie would be on the site host,
 * while Google returns to strapi.* and OAuth state is lost (fails on some browsers).
 *
 * Post-login redirect comes from Strapi plugin store (default_redirect_url), synced via
 * FRONTEND_URL on bootstrap — do not pass ?callback= here.
 */

function stripTrailingSlash(url = '') {
  return String(url).replace(/\/$/, '')
}

/** Absolute Strapi origin for OAuth only (not CMS asset reads). */
export function getStrapiOAuthBaseUrl() {
  const configured = stripTrailingSlash(import.meta.env.VITE_STRAPI_URL ?? '')
  const proxyTarget = stripTrailingSlash(import.meta.env.VITE_STRAPI_PROXY_TARGET ?? '')

  if (/^https?:\/\//i.test(configured)) {
    return configured
  }
  if (/^https?:\/\//i.test(proxyTarget)) {
    return proxyTarget
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'elewen.co.in' || host === 'www.elewen.co.in') {
      return 'https://strapi.elewen.co.in'
    }
  }

  return configured && !configured.startsWith('/') ? configured : 'http://localhost:1337'
}

/** @deprecated use getStrapiOAuthBaseUrl for Google; kept for any CMS callers */
export function getStrapiBaseUrl() {
  return getStrapiOAuthBaseUrl()
}

export function getGoogleConnectUrl() {
  return `${getStrapiOAuthBaseUrl()}/api/connect/google`
}

/**
 * Canonicalize www → apex before OAuth so Strapi FRONTEND_URL callback
 * (usually https://elewen.co.in/auth/callback) stays on the same origin as sessionStorage.
 */
function maybeCanonicalizeHostThenContinue(originPath, redirectPath) {
  if (typeof window === 'undefined') return false

  const { protocol, hostname, port } = window.location
  if (!hostname.startsWith('www.')) return false

  const apex = hostname.slice(4)
  const portPart = port ? `:${port}` : ''
  const pathOnly = String(originPath || '/login').split('?')[0] || '/login'
  const params = new URLSearchParams()
  if (redirectPath) params.set('redirect', redirectPath)
  params.set('google', '1')
  window.location.assign(`${protocol}//${apex}${portPart}${pathOnly}?${params.toString()}`)
  return true
}

export function startGoogleSignIn(originPath = '/login', redirectPath = '') {
  if (maybeCanonicalizeHostThenContinue(originPath, redirectPath)) {
    return
  }

  sessionStorage.setItem('elewen_auth_origin', originPath)
  try {
    // Backup for browsers that drop sessionStorage across the OAuth hop.
    localStorage.setItem('elewen_auth_origin', originPath)
    if (redirectPath) {
      localStorage.setItem('elewen_auth_redirect', redirectPath)
    } else {
      localStorage.removeItem('elewen_auth_redirect')
    }
  } catch {
    // ignore quota / private mode
  }

  if (redirectPath) {
    sessionStorage.setItem('elewen_auth_redirect', redirectPath)
  } else {
    sessionStorage.removeItem('elewen_auth_redirect')
  }

  window.location.assign(getGoogleConnectUrl())
}

export function readStoredAuthOrigin(fallback = '/login') {
  return (
    sessionStorage.getItem('elewen_auth_origin') ||
    localStorage.getItem('elewen_auth_origin') ||
    fallback
  )
}

export function readStoredAuthRedirect(fallback = '/') {
  return (
    sessionStorage.getItem('elewen_auth_redirect') ||
    localStorage.getItem('elewen_auth_redirect') ||
    fallback
  )
}

export function clearStoredAuthNavigation() {
  sessionStorage.removeItem('elewen_auth_origin')
  sessionStorage.removeItem('elewen_auth_redirect')
  try {
    localStorage.removeItem('elewen_auth_origin')
    localStorage.removeItem('elewen_auth_redirect')
  } catch {
    // ignore
  }
}

export function getGoogleAuthErrorMessage(authError = '') {
  switch (String(authError)) {
    case 'local_account_use_password':
      return 'This email is already registered with password login. Please sign in with your password.'
    case 'rate_limited':
      return 'Too many sign-in attempts. Please wait a minute and try Google again.'
    case 'oauth_denied':
      return 'Google sign-in was cancelled. You can try again or use email and password.'
    case 'oauth_error':
      return 'Google could not complete sign-in (provider error). Try again, or use email and password.'
    case 'google_failed':
      return 'Google sign-in could not be completed. Try another browser, disable tracking blockers, or use email and password.'
    default:
      return ''
  }
}
