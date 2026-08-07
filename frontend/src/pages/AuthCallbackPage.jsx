import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { authGoogleSession, setStoredJwt } from '../lib/api'
import CmsPageLoader from '../components/common/CmsPageLoader'
import {
  clearStoredAuthNavigation,
  readStoredAuthOrigin,
  readStoredAuthRedirect,
} from '../lib/googleAuth'

function parseAuthErrorDetails(error) {
  if (error?.response?.code) {
    return {
      code: String(error.response.code),
      error: String(error.response.error ?? error.message ?? ''),
    }
  }

  if (error?.status === 429) {
    return { code: 'RATE_LIMITED', error: error.message }
  }

  const message = String(error?.message ?? '')
  const jsonMatch = message.match(/\{.*\}$/)

  if (!jsonMatch) {
    return { code: '', error: '' }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    const nested = parsed?.error
    return {
      code: String(parsed?.code ?? (nested?.name === 'RateLimitError' ? 'RATE_LIMITED' : '')),
      error: String(parsed?.error ?? nested?.message ?? ''),
    }
  } catch {
    return { code: '', error: '' }
  }
}

function appendAuthError(path, authError) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}authError=${encodeURIComponent(authError)}`
}

function normalizeRedirectTarget(target) {
  if (!target || typeof target !== 'string') return '/'
  if (!target.startsWith('/') || target.startsWith('//')) return '/'
  if (target.startsWith('/login')) return '/'
  return target
}

function mapProviderError(error, errorDescription) {
  const code = String(error ?? '').toLowerCase()
  const description = String(errorDescription ?? '').toLowerCase()
  if (code === 'access_denied' || description.includes('access_denied')) {
    return 'oauth_denied'
  }
  if (code || description) return 'oauth_error'
  return 'google_failed'
}

/**
 * Handles the Google OAuth redirect from Strapi.
 *
 * Strapi redirects here after Google auth:
 *   /auth/callback?access_token=<strapi-jwt>
 *
 * This page exchanges that token for a session (refresh cookie + user),
 * stores the JWT, then redirects to home (or wherever the user came from).
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const hashValue = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
    const hashParams = new URLSearchParams(hashValue)
    const access_token = searchParams.get('access_token') || hashParams.get('access_token')
    const providerError = searchParams.get('error') || hashParams.get('error')
    const errorDescription =
      searchParams.get('error_description') || hashParams.get('error_description')

    const failToOrigin = authError => {
      const origin = readStoredAuthOrigin('/login')
      clearStoredAuthNavigation()
      navigate(appendAuthError(origin, authError), { replace: true })
    }

    if (providerError || errorDescription) {
      failToOrigin(mapProviderError(providerError, errorDescription))
      return
    }

    if (!access_token) {
      failToOrigin('google_failed')
      return
    }

    authGoogleSession(access_token)
      .then(({ jwt, user }) => {
        localStorage.setItem('elewen_user', JSON.stringify(user))
        setStoredJwt(jwt)
        const redirect = normalizeRedirectTarget(readStoredAuthRedirect('/'))
        clearStoredAuthNavigation()
        navigate(redirect, { replace: true })
      })
      .catch(error => {
        const { code } = parseAuthErrorDetails(error)

        if (code === 'LOCAL_ACCOUNT_USE_PASSWORD') {
          failToOrigin('local_account_use_password')
          return
        }

        if (code === 'RATE_LIMITED' || error?.status === 429) {
          failToOrigin('rate_limited')
          return
        }

        failToOrigin('google_failed')
      })
  }, [searchParams, location.hash, navigate])

  return <CmsPageLoader label="Signing you in" />
}
