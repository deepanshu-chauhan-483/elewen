import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authResetPassword } from '../lib/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const code = searchParams.get('code')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()

    if (password !== confirm) {
      setErrorMsg('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters')
      return
    }
    if (!code) {
      setErrorMsg('Invalid or missing reset link. Please request a new one.')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      await authResetPassword({ code, password, passwordConfirmation: confirm })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg('Reset link is invalid or has expired. Please request a new one.')
    }
  }

  if (status === 'success') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Password updated</h2>
          <p style={styles.sub}>Your password has been changed successfully.</p>
          <button style={styles.btn} onClick={() => navigate('/')}>
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Set new password</h2>
        <p style={styles.sub}>Enter your new password below.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>New password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            required
            style={styles.input}
          />

          <label style={styles.label}>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            required
            style={styles.input}
          />

          {errorMsg && <p style={styles.error}>{errorMsg}</p>}

          <button type="submit" disabled={status === 'loading'} style={styles.btn}>
            {status === 'loading' ? 'Updating…' : 'Update password'}
          </button>
        </form>
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
    padding: '2rem',
  },
  card: {
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
  },
  heading: {
    color: '#f5f0e8',
    fontFamily: 'serif',
    fontSize: '1.75rem',
    marginBottom: '0.5rem',
  },
  sub: {
    color: '#888',
    fontSize: '0.95rem',
    marginBottom: '1.75rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  label: {
    color: '#aaa',
    fontSize: '0.85rem',
    marginBottom: '0.2rem',
  },
  input: {
    background: '#1e1e1e',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#f5f0e8',
    fontSize: '1rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  error: {
    color: '#e57373',
    fontSize: '0.88rem',
    margin: '0.25rem 0',
  },
  btn: {
    marginTop: '0.5rem',
    background: '#c9a96e',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '8px',
    padding: '0.85rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
}
