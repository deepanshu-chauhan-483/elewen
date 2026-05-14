import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ActionButton, InputField, Panel } from '../components/ui/AdminUI'
import { useAdminLogin } from '../hooks/useAdminData'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const loginMutation = useAdminLogin()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[36px] border border-white/70 bg-[#2C1F18] p-8 text-white shadow-[0_30px_90px_rgba(25,15,10,0.32)]">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#D1B9A4]">Elewen Operations</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em]">Admin Panel</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#E3D7CE]">
            Monitor bookings, sample tastings, vendors, messages, payouts, support tickets, and live alerts from one standalone workspace.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              'Overview with live KPIs and urgent alerts',
              'Booking and sample flow actions with backend wiring',
              'Vendor approval and payout handling',
              'Support, messages, coupons, and settings',
            ].map(item => (
              <div key={item} className="rounded-[26px] border border-white/10 bg-white/6 px-4 py-4 text-sm text-[#E9DED7]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <Panel
          title="Sign In"
          subtitle="Use an authenticated account that is mapped to admin access in the Express admin guard."
        >
          <form
            className="space-y-4"
            onSubmit={async event => {
              event.preventDefault()
              await loginMutation.mutateAsync(form)
              navigate(params.get('redirect') || '/overview', { replace: true })
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2B211B]">Email</label>
              <InputField
                type="email"
                value={form.email}
                onChange={event => setForm(current => ({ ...current, email: event.target.value }))}
                placeholder="ops@elewen.com"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2B211B]">Password</label>
              <InputField
                type="password"
                value={form.password}
                onChange={event =>
                  setForm(current => ({ ...current, password: event.target.value }))
                }
                placeholder="Enter your password"
                required
                className="w-full"
              />
            </div>

            {loginMutation.error ? (
              <div className="rounded-2xl border border-[#F3C8C4] bg-[#FFF3F2] px-4 py-3 text-sm text-[#8A2E26]">
                {String(loginMutation.error.message).includes('403')
                  ? 'This account signed in successfully but does not have admin access yet.'
                  : 'Login failed. Please verify your credentials and admin access mapping.'}
              </div>
            ) : null}

            <ActionButton
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full"
            >
              {loginMutation.isPending ? 'Signing In...' : 'Enter Admin Panel'}
            </ActionButton>
          </form>

          <div className="mt-5 rounded-2xl bg-[#FBF7F4] px-4 py-4 text-sm leading-6 text-[#6F6257]">
            <p>Log in with a normal website account that has <code>is_admin = true</code> in Strapi.</p>
            <p className="mt-2">
              Recommended setup: create the user from your main frontend signup flow, then open that user in Strapi and set <code>is_admin</code> to true.
            </p>
            <p className="mt-2">
              Optional fallback: <code>ADMIN_EMAILS</code> and <code>ADMIN_USER_IDS</code> still work, but the preferred method is the Strapi user admin fields.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
