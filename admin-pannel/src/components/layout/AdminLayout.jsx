import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getStoredAdminJwt } from '../../lib/api'
import { getInitials } from '../../lib/formatters'
import { ActionButton } from '../ui/AdminUI'
import { useAdminLogout, useAdminSession } from '../../hooks/useAdminData'

const navigation = [
  { to: '/overview', label: 'Overview' },
  { to: '/sample-taste', label: 'Sample Taste Booking' },
  { to: '/bookings', label: 'Booking Management' },
  { to: '/tracker', label: 'Booking Status Tracker' },
  { to: '/vendors', label: 'Vendor Management' },
  { to: '/messages', label: 'Message Box' },
  { to: '/payments', label: 'Payment Management' },
  { to: '/support', label: 'Help & Support' },
  { to: '/alerts', label: 'System Alerts' },
]

function routeTitle(pathname) {
  const item = navigation.find(entry => pathname.startsWith(entry.to))
  return item?.label ?? 'Admin Panel'
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const token = getStoredAdminJwt()
  const logoutMutation = useAdminLogout()
  const sessionQuery = useAdminSession()
  const title = useMemo(() => routeTitle(location.pathname), [location.pathname])

  useEffect(() => {
    if (!token) {
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
      navigate(`/login?redirect=${redirect}`, { replace: true })
    }
  }, [location.pathname, location.search, navigate, token])

  useEffect(() => {
    if (sessionQuery.error?.code === 'AUTH_REQUIRED') {
      navigate('/login', { replace: true })
    }
  }, [navigate, sessionQuery.error])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  if (!token) return null

  if (sessionQuery.error && !String(sessionQuery.error?.message ?? '').includes('403')) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_20px_60px_rgba(62,39,35,0.12)]">
          <p className="text-lg font-medium text-[#2B211B]">
            The admin session could not be restored.
          </p>
          <p className="mt-2 text-sm text-[#6F6257]">Please sign in again to continue.</p>
        </div>
      </div>
    )
  }

  if (String(sessionQuery.error?.message ?? '').includes('403')) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-xl rounded-[28px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_20px_60px_rgba(62,39,35,0.12)]">
          <p className="text-lg font-medium text-[#2B211B]">
            This account does not have admin access.
          </p>
          <p className="mt-2 text-sm leading-6 text-[#6F6257]">
            Add the email to <code>ADMIN_EMAILS</code>, map the user ID in{' '}
            <code>ADMIN_USER_IDS</code>, or link the same email to an active Strapi admin user.
          </p>
          <ActionButton
            className="mt-5"
            onClick={async () => {
              await logoutMutation.mutateAsync()
              navigate('/login', { replace: true })
            }}
          >
            Sign Out
          </ActionButton>
        </div>
      </div>
    )
  }

  const session = sessionQuery.data
  const adminName = [session?.user?.first_name, session?.user?.last_name].filter(Boolean).join(' ')
  const displayName = adminName || session?.user?.email || 'Admin'

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F2F2F2] md:flex">
      <div
        className={`fixed inset-0 z-30 bg-black/30 transition md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`fixed inset-0 z-40 flex h-screen w-screen flex-col bg-[#591902] transition-transform duration-300 md:left-0 md:top-0 md:h-screen md:w-[260px] md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-[63px] items-center justify-between bg-[#FAFAFA] px-6 md:hidden">
          <h1 className="admin-serif text-3xl text-[#591902]">ELEWEN</h1>
          <button type="button" aria-label="Close sidebar" onClick={() => setMobileOpen(false)}>
            <span className="text-xl text-[#591902]">x</span>
          </button>
        </div>

        <div className="hidden h-[66px] border-r border-[#591902] bg-[#FAFAFA] py-4 pl-5 md:block">
          <h1 className="admin-serif text-3xl text-[#591902]">ELEWEN</h1>
        </div>

        <div className="px-4 pt-6">
          <p className="px-4 text-[11px] uppercase tracking-[0.2em] text-[#E7D2C4]">
            Admin Dashboard
          </p>
        </div>

        <nav className="mt-3 flex flex-col gap-1 px-4">
          {navigation.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center rounded-xl px-4 py-3 text-sm transition-all ${
                  isActive ? 'bg-[#E7E0DA] text-[#591902]' : 'text-[#FAFAFA] md:text-[#FAFAFA]'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#E7E0DA' : 'transparent',
                color: isActive ? '#591902' : '#FAFAFA',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex  min-h-screen w-full flex-col bg-[#F2F2F2] md:ml-[260px] md:flex-1">
        <header className="fixed left-0 right-0 top-0 z-20 h-[68px] border-b border-[#E4DED8] bg-[#FAFAFA] px-4 py-3 sm:px-6 md:left-[260px]">
  <div className="flex h-full w-full items-center justify-between">
    {/* LEFT SIDE */}
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="group flex flex-col gap-1 p-0.5 md:hidden"
      >
        <span className="h-0.5 w-7 bg-[#262626]" />
        <span className="h-0.5 w-5 bg-[#262626]" />
      </button>

      {/* Search */}
      <div className="hidden items-center rounded-full bg-[#F0F0F0] lg:flex lg:w-[300px]">
        <div className="flex w-full items-center gap-2 px-3 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#591902] text-[#FAFAFA]">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </span>

          <span className="text-[13px] font-medium tracking-wide text-[#262626]">
            Search
          </span>
        </div>
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="hidden md:flex items-center gap-5">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D9D9D9] text-[10px] font-medium text-white">
          {getInitials(displayName)}
        </div>

        <div>
          <p className="text-sm font-medium text-[#2E2E2E]">{displayName}</p>

          <p className="text-xs uppercase tracking-[0.18em] text-[#8C7D70]">
            {session?.user?.adminRole ||
              session?.user?.roleName ||
              (session?.user?.isStrapiAdmin ? 'Strapi Admin' : 'Operations')}
          </p>
        </div>
      </div>

      {/* Sign Out */}
      <ActionButton
        tone="gold"
        onClick={async () => {
          await logoutMutation.mutateAsync()
          navigate('/login', { replace: true })
        }}
      >
        {logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}
      </ActionButton>
    </div>
  </div>
</header>

        <main
          className="flex flex-1 flex-col overflow-y-auto pb-20 md:min-h-0"
          style={{ marginTop: '68px', backgroundColor: '#F2F2F2' }}
        >
          <div className="flex flex-1 flex-col px-6 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
