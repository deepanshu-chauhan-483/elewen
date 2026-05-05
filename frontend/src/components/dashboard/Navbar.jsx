import { Link, useNavigate } from 'react-router-dom'
import { DASHBOARD } from '../../constants/dashboard'
import { useDashboardLogout, useDashboardNotificationCount, useDashboardSession } from '../../hooks/useDashboardData'
import { getInitials } from './dashboardUtils'

function SearchBar() {
  return (
    <div className="flex w-[300px] items-center gap-2 rounded-full bg-[#F0F0F0] px-4 py-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20L17 17" />
      </svg>
      <input
        type="text"
        placeholder="Search"
        className="w-full bg-transparent text-sm text-[#2E2E2E] outline-none"
      />
    </div>
  )
}

function NotificationBell({ count }) {
  return (
    <div className="relative">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C68B1E" strokeWidth="1.8">
        <path d="M15 17H5.5a1 1 0 0 1-.8-1.6L6 13.5V10a6 6 0 0 1 12 0v3.5l1.3 1.9A1 1 0 0 1 18.5 17H15" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-[#591902] px-1.5 text-center text-[10px] leading-5 text-white">
          {count}
        </span>
      ) : null}
    </div>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const { data: session } = useDashboardSession()
  const { data: notificationCount = 0 } = useDashboardNotificationCount()
  const logoutMutation = useDashboardLogout()

  const displayName = [session?.profile?.first_name, session?.profile?.last_name]
    .filter(Boolean)
    .join(' ')
  const fallbackName = [session?.user?.first_name, session?.user?.last_name].filter(Boolean).join(' ')
  const name = displayName || fallbackName || session?.user?.email || 'Customer'

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-6"
      style={{
        height: DASHBOARD.NAVBAR_HEIGHT,
        left: DASHBOARD.SIDEBAR_WIDTH,
        backgroundColor: DASHBOARD.COLORS.NAVBAR_BG,
        borderBottom: `1px solid ${DASHBOARD.COLORS.NAVBAR_BORDER}`,
      }}
    >
      <SearchBar />

      <div className="flex items-center gap-4">
        <Link to="/" className="text-sm text-[#111827]">
          Back to Website
        </Link>

        <button
          type="button"
          onClick={async () => {
            await logoutMutation.mutateAsync()
            navigate('/', { replace: true })
          }}
          className="rounded-full bg-[#C6A15B] px-4 py-2 text-sm text-white"
        >
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </button>

        <NotificationBell count={notificationCount} />

        {session?.profile?.photoUrl ? (
          <img
            src={session.profile.photoUrl}
            alt={name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D1D5DB] text-xs font-medium text-[#374151]">
            {getInitials(name) || 'CU'}
          </div>
        )}
      </div>
    </header>
  )
}
