import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAdminLogin } from '../hooks/useAdminData'

function WatermarkLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute right-[-120px] top-[-80px] h-[520px] w-[520px] rounded-full bg-[#F4EFE5] opacity-60 blur-2xl" />
      <div className="absolute right-[60px] top-[120px] h-[420px] w-[420px] rounded-full border border-[#E8E1D6] opacity-40" />
      <div className="absolute left-[30%] top-[-10%] h-[160%] w-[18%] rotate-[-34deg] rounded-full bg-[#F4EFE5] opacity-40" />
    </div>
  )
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const loginMutation = useAdminLogin()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[#FAF7F2]">
      <div className="hidden p-5 lg:flex lg:flex-[1.08]">
        <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(248,242,233,0.2),_transparent_42%),linear-gradient(180deg,_rgba(43,27,18,0.74),_rgba(27,16,10,0.88))]">
          <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(205,177,126,0.24),transparent_45%,rgba(255,255,255,0.08))]" />
          <div className="absolute right-[-50px] top-[-40px] h-[280px] w-[280px] rounded-full border border-white/10" />
          <div className="absolute bottom-[-120px] left-[-60px] h-[300px] w-[300px] rounded-full bg-white/6 blur-2xl" />

          <div className="relative z-10 flex h-full flex-col justify-end p-10 text-white">
            <div>
              <h1
                className="max-w-[420px] text-[72px] leading-[0.92] text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Welcome
                <br />
                Back
                <br />
                Admin
              </h1>

              <p className="mt-4 max-w-[500px] text-[16px] text-white/85">
                Review bookings, payouts, approvals, support activity, and operational alerts from
                one focused workspace.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-y-auto">
        <WatermarkLayer />

        <div className="relative z-10 flex w-full flex-col px-4 py-6 min-[540px]:p-6">
          <div className="mx-auto flex min-h-full w-full max-w-[700px] flex-col">
            <div className="flex flex-col items-center">
              <div className="mb-6 text-center">
                <h2
                  className="text-[42px] text-[#364022] lg:text-[64px]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Admin Login
                </h2>
                <p className="mt-2 text-sm text-[#727355] lg:text-base">
                  Sign in with an account that already has admin access enabled.
                </p>
              </div>

              <form
                className="flex w-full flex-col gap-[16px] min-[540px]:gap-[24px]"
                onSubmit={async event => {
                  event.preventDefault()
                  await loginMutation.mutateAsync(form)
                  navigate(params.get('redirect') || '/overview', { replace: true })
                }}
              >
                <div className="flex w-full flex-col gap-[8px]">
                  <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={event =>
                      setForm(current => ({ ...current, email: event.target.value }))
                    }
                    placeholder="Enter your email"
                    required
                    className="h-[40px] w-full rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[8px] text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                  />
                </div>

                <div className="flex w-full flex-col gap-[8px]">
                  <label className="text-[13px] font-medium leading-[150%] text-[#364022] min-[540px]:text-[16px]">
                    Password
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={event =>
                        setForm(current => ({ ...current, password: event.target.value }))
                      }
                      placeholder="Enter your password"
                      required
                      className="h-[40px] w-full rounded-[6px] border border-[rgba(45,45,45,0.25)] bg-[#F8F4ED] px-[16px] py-[8px] pr-10 text-[14px] text-[#364022] placeholder:text-[#BFAC9B] transition-colors focus:border-[#CDB17E] focus:outline-none min-[540px]:text-[16px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(current => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFAC9B] transition-colors hover:text-[#364022]"
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
                        <path
                          d="M2 2L22 22"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex w-full items-center justify-end pt-[2px]">
                    <span className="text-[12px] leading-[150%] text-[#364022]/70">
                      Admin access is checked after sign-in
                    </span>
                  </div>
                </div>

                {loginMutation.error ? (
                  <p className="rounded-[6px] bg-[#C62828]/10 px-[16px] py-[10px] text-[13px] leading-[150%] text-[#C62828]">
                    {String(loginMutation.error.message).includes('403')
                      ? 'This account signed in successfully but does not have admin access yet.'
                      : 'Login failed. Please verify your credentials and admin access mapping.'}
                  </p>
                ) : null}

                <div className="flex w-full flex-col items-center gap-[16px]">
                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="flex h-[44px] w-full items-center justify-center rounded-[56px] bg-[#CDB17E] text-[14px] font-medium leading-[150%] text-[#FAFAFA] transition-colors hover:bg-[#b89e6e] disabled:pointer-events-none disabled:opacity-50 min-[540px]:text-[16px]"
                  >
                    {loginMutation.isPending ? 'Signing In...' : 'Sign in'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
