import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { authResetPassword } from '../lib/api'

const NewPasswordIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="27" stroke="#727355" strokeWidth="1.5" />
    <path
      d="M20 26V21.5C20 17.91 22.91 15 26.5 15H29.5C33.09 15 36 17.91 36 21.5V26"
      stroke="#727355"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <rect x="18" y="26" width="20" height="14" rx="2.5" stroke="#727355" strokeWidth="1.6" />
    <circle cx="28" cy="33" r="2" fill="#727355" />
    <circle cx="20.5" cy="42" r="1.8" fill="#727355" />
    <circle cx="25.5" cy="42" r="1.8" fill="#727355" />
    <circle cx="30.5" cy="42" r="1.8" fill="#727355" />
    <circle cx="35.5" cy="42" r="1.8" fill="#727355" />
  </svg>
)

const PasswordResetSuccessIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="27" stroke="#727355" strokeWidth="1.5" />
    <path
      d="M14 28L23 37L42 18"
      stroke="#727355"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    if (password !== confirm) {
      setErrorMsg('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.')
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
    } catch {
      setStatus('error')
      setErrorMsg('Reset link is invalid or has expired. Please request a new one.')
    }
  }

  if (status === 'success') {
    return (
      <AuthLayout
        activeTab="login"
        headerPrefix={<PasswordResetSuccessIcon />}
        title="Password reset!"
        subtitle="You've successfully created a new password, click below to login."
        footer={null}
      >
        <div
          className="flex min-w-0 w-full flex-col items-stretch gap-[16px]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <Link
            to="/login"
            className="w-full h-[44px] flex justify-center items-center bg-[#CDB17E] text-[#FAFAFA] text-[16px] font-normal leading-[150%] rounded-[56px] hover:bg-[#b89e6e] transition-colors"
          >
            Log in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      activeTab="login"
      headerPrefix={<NewPasswordIcon />}
      title="Set new password"
      subtitle="Enter your new password below."
      footer={null}
    >
      <form onSubmit={handleSubmit} className="contents">
        <div
          className="flex min-w-0 w-full flex-col gap-[24px]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <div className="flex flex-col gap-[8px] w-full min-w-0">
            <label className="text-[#364022] text-[16px] font-medium leading-[150%]">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              required
              className="w-full min-w-0 h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-[8px] w-full min-w-0">
            <label className="text-[#364022] text-[16px] font-medium leading-[150%]">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              className="w-full min-w-0 h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
            />
          </div>
        </div>

        <div
          className="flex min-w-0 w-full flex-col items-stretch gap-[16px]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {errorMsg && <p className="text-[#C62828] text-[12px] leading-[150%]">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full h-[44px] flex justify-center items-center bg-[#CDB17E] text-[#FAFAFA] text-[16px] font-medium leading-[150%] rounded-[56px] hover:bg-[#b89e6e] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {status === 'loading' ? 'Updating...' : 'Update password'}
          </button>

          <Link
            to="/login"
            className="w-full flex justify-center items-center gap-[10px] text-[#364022] text-[12px] leading-[150%]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="-rotate-90">
              <path
                d="M12 4L12 20M12 20L6 14M12 20L18 14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
