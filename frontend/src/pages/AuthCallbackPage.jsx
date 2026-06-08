import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { authGoogleSession, setStoredJwt } from '../lib/api'

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

    if (!access_token) {
      navigate('/?auth=error', { replace: true })
      return
    }

    authGoogleSession(access_token)
      .then(({ jwt, user }) => {
        setStoredJwt(jwt)
        localStorage.setItem('elewen_user', JSON.stringify(user))
        sessionStorage.removeItem('elewen_auth_origin')
        navigate('/', { replace: true })
      })
      .catch(error => {
        const origin = sessionStorage.getItem('elewen_auth_origin') || '/login'
        const { code } = parseAuthErrorDetails(error)
        sessionStorage.removeItem('elewen_auth_origin')

        if (code === 'LOCAL_ACCOUNT_USE_PASSWORD') {
          navigate(`${origin}?authError=local_account_use_password`, { replace: true })
          return
        }

        if (code === 'RATE_LIMITED' || error?.status === 429) {
          navigate(`${origin}?authError=rate_limited`, { replace: true })
          return
        }

        navigate(`${origin}?authError=google_failed`, { replace: true })
      })
  }, [searchParams, location.hash, navigate])

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <div style={styles.spinner} />
        <p style={styles.text}>Signing you in…</p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #2a2a2a',
    borderTop: '3px solid #c9a96e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  text: {
    color: '#888',
    fontSize: '0.95rem',
  },
}
