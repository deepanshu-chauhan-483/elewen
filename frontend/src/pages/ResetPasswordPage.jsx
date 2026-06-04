import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { getFieldErrors } from '../lib/formErrors'
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

const EyeIcon = ({ hidden }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {hidden ? (
      <>
        <path
          d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
          fill="currentColor"
        />
        <path d="M2 2L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ) : (
      <path
        d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
        fill="currentColor"
      />
    )}
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
  const code = searchParams.get('code') || searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function handleSubmit(e) {
    e.preventDefault()

    if (password !== confirm) {
      setFieldErrors({ confirm: 'Passwords do not match.' })
      setErrorMsg('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setFieldErrors({ password: 'Password must be at least 8 characters.' })
      setErrorMsg('Password must be at least 8 characters.')
      return
    }
    if (!code) {
      setErrorMsg('Invalid or missing reset link. Please request a new one.')
      return
    }

    setStatus('loading')
    setErrorMsg('')
    setFieldErrors({})

    try {
      await authResetPassword({ code, password, passwordConfirmation: confirm })
      setStatus('success')
    } catch (err) {
      const nextFieldErrors = getFieldErrors(err, { passwordConfirmation: 'confirm' })
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors)
        setStatus('idle')
        return
      }
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
            className="w-full h-[44px] flex justify-center items-center bg-[#CDB17E] text-[#FAFAFA] text-[14px] min-[540px]:text-[16px] font-normal leading-[150%] rounded-[56px] hover:bg-[#b89e6e] transition-colors"
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
          className="flex min-w-0 w-full flex-col gap-[16px] min-[540px]:gap-[24px]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <div className="flex flex-col gap-[8px] w-full min-w-0">
            <label className="text-[#364022] text-[13px] min-[540px]:text-[16px] font-medium leading-[150%]">
              New password
            </label>
            <div className="relative w-full min-w-0">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setFieldErrors(prev => ({ ...prev, password: '' }))
                  setErrorMsg('')
                }}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                required
                className="w-full min-w-0 h-[40px] px-[16px] py-[8px] pr-10 bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[14px] min-[540px]:text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFAC9B] hover:text-[#364022] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon hidden={!showPassword} />
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="text-[#C62828] text-[12px] leading-[150%]">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-[8px] w-full min-w-0">
            <label className="text-[#364022] text-[13px] min-[540px]:text-[16px] font-medium leading-[150%]">
              Confirm password
            </label>
            <div className="relative w-full min-w-0">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => {
                  setConfirm(e.target.value)
                  setFieldErrors(prev => ({ ...prev, confirm: '' }))
                  setErrorMsg('')
                }}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
                className="w-full min-w-0 h-[40px] px-[16px] py-[8px] pr-10 bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[14px] min-[540px]:text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFAC9B] hover:text-[#364022] transition-colors"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                <EyeIcon hidden={!showConfirm} />
              </button>
            </div>
            {fieldErrors.confirm ? (
              <p className="text-[#C62828] text-[12px] leading-[150%]">{fieldErrors.confirm}</p>
            ) : null}
          </div>
        </div>

        <div
          className="flex min-w-0 w-full flex-col items-stretch gap-[16px] pt-5"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {errorMsg && <p className="text-[#C62828] text-[12px] leading-[150%]">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full h-[44px] flex justify-center items-center bg-[#CDB17E] text-[#FAFAFA] text-[14px] min-[540px]:text-[16px] font-medium leading-[150%] rounded-[56px] hover:bg-[#b89e6e] transition-colors disabled:opacity-50 disabled:pointer-events-none"
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
