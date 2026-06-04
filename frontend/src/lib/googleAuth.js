/**
 * Strapi server-side Google OAuth — browser must hit Strapi, not the Vite dev server.
 * Flow: /api/connect/google → Google → /api/connect/google/callback → FRONTEND/auth/callback
 */
export function getStrapiBaseUrl() {
  return (import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '')
}

export function getGoogleConnectUrl() {
  return `${getStrapiBaseUrl()}/api/connect/google`
}

export function startGoogleSignIn(originPath = '/login') {
  sessionStorage.setItem('elewen_auth_origin', originPath)
  window.location.assign(getGoogleConnectUrl())
}
