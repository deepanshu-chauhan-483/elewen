/**
 * Strapi server-side Google OAuth — browser must hit Strapi, not the Vite dev server.
 * Flow: /api/connect/google → Google → /api/connect/google/callback → FRONTEND/auth/callback
 *
 * Post-login redirect comes from Strapi plugin store (default_redirect_url), synced via
 * FRONTEND_URL on bootstrap or `npm run sync:google` — do not pass ?callback= here.
 */
export function getStrapiBaseUrl() {
  return (import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '')
}

export function getGoogleConnectUrl() {
  return `${getStrapiBaseUrl()}/api/connect/google`
}

export function startGoogleSignIn(originPath = '/login', redirectPath = '') {
  sessionStorage.setItem('elewen_auth_origin', originPath)
  if (redirectPath) {
    sessionStorage.setItem('elewen_auth_redirect', redirectPath)
  } else {
    sessionStorage.removeItem('elewen_auth_redirect')
  }
  window.location.assign(getGoogleConnectUrl())
}
