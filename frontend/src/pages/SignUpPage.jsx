import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { useToast } from '../components/common/useToast'
import { getFieldErrors, getGlobalErrorMessage } from '../lib/formErrors'
import { authRegister, setStoredJwt } from '../lib/api'
import { startGoogleSignIn } from '../lib/googleAuth'

const CheckEmailIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="27" stroke="#727355" strokeWidth="1.5" />
    <path
      d="M14 28l9 9 19-19"
      stroke="#727355"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function SignUpPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [emailPending, setEmailPending] = useState(false)
  const [confirmationResent, setConfirmationResent] = useState(false)
  const submittingRef = useRef(false)
  const authError = searchParams.get('authError') || ''
  const authErrorMessage =
    authError === 'local_account_use_password'
      ? 'This email is already registered with password login. Please sign in with your password.'
      : authError === 'rate_limited'
        ? 'Too many sign-in attempts. Please wait a minute and try Google again.'
        : authError === 'google_failed'
          ? 'Google sign-in could not be completed. Please try again.'
          : ''

  async function handleSubmit(e) {
    e.preventDefault()
    if (!agreed || submittingRef.current) return
    setError('')
    setFieldErrors({})
    submittingRef.current = true
    setLoading(true)
    try {
      const data = await authRegister({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
      })
      if (data.pending) {
        setConfirmationResent(Boolean(data.resent))
        showToast({
          message: data.resent
            ? 'Confirmation email sent again. Check your inbox.'
            : 'Check your email to confirm your account before logging in.',
        })
        setEmailPending(true)
        return
      }
      localStorage.setItem('elewen_user', JSON.stringify(data.user))
      setStoredJwt(data.jwt)
      showToast({ message: 'Sign up successful.' })
      navigate('/', { replace: true })
    } catch (err) {
      const nextFieldErrors = getFieldErrors(err, {
        first_name: 'firstName',
        last_name: 'lastName',
      })

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors)
      } else if (err.status === 409) {
        setError('An account with this email already exists.')
      } else if (err.response?.code === 'EMAIL_SEND_FAILED') {
        setError(
          'Your account may have been created, but the confirmation email could not be sent. Ask your admin to fix SMTP (run: cd strapi && npm run test:smtp), then try signing up again or use resend from login.'
        )
      } else {
        setError(getGlobalErrorMessage(err, 'Registration failed. Please try again.'))
      }
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  if (emailPending) {
    return (
      <AuthLayout
        activeTab="signup"
        headerPrefix={<CheckEmailIcon />}
        title="Check your email"
        subtitle={
          confirmationResent
            ? `We sent another confirmation link to ${email}. Click it to activate your account, then log in.`
            : `We sent a confirmation link to ${email}. Click it to activate your account, then log in.`
        }
        footer={null}
      >
        <div
          className="flex flex-col items-center w-full gap-[16px]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <Link
            to="/login"
            className="w-full h-[44px] flex justify-center items-center bg-[#CDB17E] text-[#FAFAFA] text-[14px] min-[540px]:text-[16px] font-medium leading-[150%] rounded-[56px] hover:bg-[#b89e6e] transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      activeTab="signup"
      title="Sign Up Account"
      subtitle="Explore the collection. Your seamless event is just a few clicks away!"
      footer={
        <p
          className="text-[#364022] text-[12px] leading-[150%] mb-3"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Already have an account?{' '}
          <Link to="/login" className="font-bold hover:underline">
            Login.
          </Link>
        </p>
      }
    >
      {authErrorMessage ? (
        <p className="text-[#C62828] text-[12px] leading-[150%]">{authErrorMessage}</p>
      ) : null}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full gap-[16px] min-[540px]:gap-[24px]"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <div className="flex gap-[16px] w-full">
          <div className="flex flex-col gap-[8px] flex-1">
            <label className="text-[#364022] text-[13px] min-[540px]:text-[16px] font-medium leading-[150%]">
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={e => {
                setFirstName(e.target.value)
                setFieldErrors(prev => ({ ...prev, firstName: '' }))
              }}
              placeholder="Name"
              required
              className="w-full h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[14px] min-[540px]:text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
            />
            {fieldErrors.firstName ? (
              <p className="text-[#C62828] text-[12px] leading-[150%]">{fieldErrors.firstName}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-[8px] flex-1">
            <label className="text-[#364022] text-[13px] min-[540px]:text-[16px] font-medium leading-[150%]">
              Last name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={e => {
                setLastName(e.target.value)
                setFieldErrors(prev => ({ ...prev, lastName: '' }))
              }}
              placeholder="Name"
              required
              className="w-full h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[14px] min-[540px]:text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
            />
            {fieldErrors.lastName ? (
              <p className="text-[#C62828] text-[12px] leading-[150%]">{fieldErrors.lastName}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[#364022] text-[13px] min-[540px]:text-[16px] font-medium leading-[150%]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              setFieldErrors(prev => ({ ...prev, email: '' }))
            }}
            placeholder="email@"
            required
            className="w-full h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[14px] min-[540px]:text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
          />
          {fieldErrors.email ? (
            <p className="text-[#C62828] text-[12px] leading-[150%]">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[#364022] text-[13px] min-[540px]:text-[16px] font-medium leading-[150%]">
            Phone number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => {
              setPhone(e.target.value)
              setFieldErrors(prev => ({ ...prev, phone: '' }))
            }}
            placeholder="Enter your phone number"
            required
            className="w-full h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[14px] min-[540px]:text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors"
          />
          {fieldErrors.phone ? (
            <p className="text-[#C62828] text-[12px] leading-[150%]">{fieldErrors.phone}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[#364022] text-[13px] min-[540px]:text-[16px] font-medium leading-[150%]">
            Password
          </label>
          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                setFieldErrors(prev => ({ ...prev, password: '' }))
              }}
              placeholder="Enter your password"
              required
              className="w-full h-[40px] px-[16px] py-[8px] bg-[#F8F4ED] border border-[rgba(45,45,45,0.25)] rounded-[6px] text-[14px] min-[540px]:text-[16px] text-[#364022] placeholder:text-[#BFAC9B] focus:outline-none focus:border-[#CDB17E] transition-colors pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFAC9B] hover:text-[#364022] transition-colors"
              aria-label="Toggle password visibility"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
                  fill="currentColor"
                />
                <path d="M2 2L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-[#727355] text-[12px] leading-[150%]">
            Must be at least 8 characters.
          </p>
          {fieldErrors.password ? (
            <p className="text-[#C62828] text-[12px] leading-[150%]">{fieldErrors.password}</p>
          ) : null}

          <div className="flex items-center gap-[8px] w-full pt-[2px]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="w-[12px] h-[12px] border border-[rgba(45,45,45,0.5)] rounded-[2px] accent-[#CDB17E]"
            />
            <span className="text-[#364022] text-[12px] leading-[150%]">
              I agree with{' '}
              <a href="/legalpages" className="font-bold hover:underline">
                Terms
              </a>{' '}
              &{' '}
              <a href="/privacy" className="font-bold hover:underline">
                Privacy
              </a>
            </span>
          </div>
        </div>

        {error && <p className="text-[#C62828] text-[12px] leading-[150%]">{error}</p>}

        <div className="flex flex-col items-center w-full gap-[16px]">
          <button
            type="submit"
            disabled={loading || !agreed}
            className="w-full h-[44px] flex justify-center items-center bg-[#CDB17E] text-[#FAFAFA] text-[14px] min-[540px]:text-[16px] font-medium leading-[150%] rounded-[56px] hover:bg-[#b89e6e] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Signing up…' : 'Sign up'}
          </button>
          <span className="text-[#364022] text-[12px] leading-[150%] uppercase tracking-widest">
            OR
          </span>
          <button
            type="button"
            onClick={() => startGoogleSignIn('/signup')}
            className="w-full h-[44px] flex justify-center items-center gap-[16px] bg-transparent border border-[#1C1C1C] text-[#1C1C1C] text-[14px] min-[540px]:text-[16px] font-normal leading-[150%] rounded-[56px] hover:bg-gray-50 transition-colors"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z"
                fill="#4285F4"
              />
              <path
                d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.58C14.72 18.24 13.48 18.64 12 18.64C9.13 18.64 6.71 16.7 5.84 14.11H2.15V16.97C3.97 20.59 7.71 23 12 23Z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.11C5.62 13.45 5.49 12.74 5.49 12C5.49 11.26 5.62 10.55 5.84 9.89V7.03H2.15C1.4 8.53 0.98 10.22 0.98 12C0.98 13.78 1.4 15.47 2.15 16.97L5.84 14.11Z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.36C13.62 5.36 15.06 5.92 16.2 7.01L19.36 3.85C17.46 2.08 14.97 1 12 1C7.71 1 3.97 3.41 2.15 7.03L5.84 9.89C6.71 7.3 9.13 5.36 12 5.36Z"
                fill="#EA4335"
              />
            </svg>
            Sign up with Google
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}
