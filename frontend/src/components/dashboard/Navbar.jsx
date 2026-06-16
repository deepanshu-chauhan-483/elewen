import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DASHBOARD } from '../../constants/dashboard'
import { useDashboardSearch } from './useDashboardSearch'
import { useToast } from '../common/useToast'
import {
  useDashboardClearAllNotifications,
  useDashboardLogout,
  useDashboardNotificationCount,
  useDashboardNotifications,
  useDashboardMarkAllNotificationsRead,
  useDashboardMarkNotificationRead,
  useDashboardSession,
} from '../../hooks/useDashboardData'
import { getInitials } from './dashboardUtils'

const SearchIcon = () => (
  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
)

const ArrowLeftIcon = ({ className = 'h-4 w-4', stroke = '#1C1C1C' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.6667 8.00065H3.33341M3.33341 8.00065L8.00008 3.33398M3.33341 8.00065L8.00008 12.6673"
      stroke={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const LogoutIcon = ({ className = 'h-4 w-4', stroke = '#FAFAFA' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.66667 8H14M14 8L11.3333 10.6667M14 8L11.3333 5.33333M14 4.22933V3.33333C14 2.97971 13.8595 2.64057 13.6095 2.39052C13.3594 2.14048 13.0203 2 12.6667 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V11.7707"
      stroke={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const BellIcon = () => (
  <svg width="29" height="30" viewBox="0 0 29 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.268 27C10.4435 27.304 10.696 27.5565 11 27.732C11.3041 27.9075 11.6489 27.9999 12 27.9999C12.3511 27.9999 12.6959 27.9075 13 27.732C13.304 27.5565 13.5565 27.304 13.732 27M3.262 21.326C3.13137 21.4692 3.04516 21.6472 3.01386 21.8385C2.98256 22.0298 3.00752 22.226 3.08571 22.4034C3.1639 22.5807 3.29194 22.7316 3.45426 22.8375C3.61658 22.9434 3.80618 22.9999 4 23H20C20.1938 23.0001 20.3834 22.9438 20.5459 22.8381C20.7083 22.7324 20.8365 22.5817 20.9149 22.4045C20.9933 22.2273 21.0185 22.0311 20.9874 21.8398C20.9564 21.6485 20.8704 21.4703 20.74 21.327C19.41 19.956 18 18.499 18 14C18 12.4087 17.3679 10.8826 16.2426 9.75736C15.1174 8.63214 13.5913 8 12 8C10.4087 8 8.88258 8.63214 7.75736 9.75736C6.63214 10.8826 6 12.4087 6 14C6 18.499 4.589 19.956 3.262 21.326Z"
      stroke="#1C1C1C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const NotificationBadge = ({ count }) => {
  const unread = Number(count ?? 0)
  if (unread <= 0) return null

  const label = unread > 99 ? '99+' : String(unread)

  return (
    <span
      className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#591902] px-1 text-[10px] font-semibold leading-none text-white"
      aria-hidden="true"
    >
      {label}
    </span>
  )
}

const DashboardModalCloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M15 5L5 15M5 5L15 15"
      stroke="#1C1C1C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function NotificationBellButton({ unreadCount, onClick, className = '' }) {
  const unread = Number(unreadCount ?? 0)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full text-[#262626] transition-colors hover:bg-[#F3F3F3] ${className}`}
    >
      <BellIcon />
      <NotificationBadge count={unread} />
    </button>
  )
}

const MobileSearchIcon = () => (
  <svg
    className="h-[26px] w-[26px]"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M17.5 17.5L13.8833 13.8833M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const MenuIcon = () => (
  <>
    <div className="h-0.5 w-7 bg-[#262626]" />
    <div className="h-0.5 w-5 bg-[#262626]" />
  </>
)

function SearchBar() {
  const { searchTerm, setSearchTerm } = useDashboardSearch()

  return (
    <label className="hidden items-center gap-2 rounded-full bg-[#F0F0F0] md:flex md:w-[300px]">
      <div className="flex w-full items-center gap-2 rounded-full px-2 py-1 backdrop-blur-md transition-all">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#591902] text-[#FAFAFA]">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          placeholder="Search"
          className="w-full bg-transparent text-[13px] font-medium tracking-wide text-[#262626] placeholder:text-[#7A7A7A] outline-none"
        />
      </div>
    </label>
  )
}

const ActionButton = ({ children, to, onClick, className = '', ariaLabel, disabled = false }) => {
  const sharedClassName =
    'inline-flex h-8 items-center justify-center gap-1 rounded-[8px] px-2 text-[13px] font-medium transition-colors lg:px-3 lg:text-sm'

  if (to) {
    return (
      <Link to={to} aria-label={ariaLabel} className={`${sharedClassName} ${className}`}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`${sharedClassName} ${className}`}
    >
      {children}
    </button>
  )
}

const UserMenu = ({ unreadCount, onOpenNotifications, avatarNode }) => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const logoutMutation = useDashboardLogout()

  const handleLogout = async () => {
    if (logoutMutation.isPending) return
    sessionStorage.setItem('elewen_logout_redirect_home', 'true')
    await logoutMutation.mutateAsync()
    showToast({ message: 'Logout successful.' })
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-w-0 items-center justify-end gap-2 lg:gap-3">
      <div className="flex min-w-0 items-center justify-end gap-2 lg:gap-3">
        <ActionButton
          to="/"
          ariaLabel="Back to website"
          className="bg-[#F3F3F3] text-[#262626] hover:bg-[#E8E8E8] md:min-w-[118px] lg:min-w-[133px]"
        >
          <ArrowLeftIcon />
          <span className="whitespace-nowrap">Back to Website</span>
        </ActionButton>

        <ActionButton
          onClick={handleLogout}
          ariaLabel="Logout"
          disabled={logoutMutation.isPending}
          className="bg-[#CDB17E] text-[#FAFAFA] hover:bg-[#C6AB7F] disabled:cursor-not-allowed disabled:opacity-70 md:min-w-[72px] lg:min-w-[78px]"
        >
          <span className="whitespace-nowrap">
            {logoutMutation.isPending ? 'Logging out' : 'Logout'}
          </span>
          <LogoutIcon />
        </ActionButton>
      </div>

      <div className="flex shrink-0 items-center gap-2 lg:gap-3">
        <NotificationBellButton unreadCount={unreadCount} onClick={onOpenNotifications} />

        <Link
          to="/user-dashboard/profile"
          aria-label="Open profile"
          className="flex shrink-0 items-center justify-center rounded-full"
        >
          {avatarNode}
        </Link>
      </div>
    </div>
  )
}

const MobileBottomActions = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const logoutMutation = useDashboardLogout()

  const handleLogout = async () => {
    if (logoutMutation.isPending) return
    sessionStorage.setItem('elewen_logout_redirect_home', 'true')
    await logoutMutation.mutateAsync()
    showToast({ message: 'Logout successful.' })
    navigate('/', { replace: true })
  }

  return (
    <div className="fixed h-[63px] inset-x-0 bottom-0 z-30 bg-[#222815] px-5 py-4 md:hidden ">
      <div className="flex items-center justify-between gap-3">
        <ActionButton
          onClick={handleLogout}
          ariaLabel="Logout"
          disabled={logoutMutation.isPending}
          className="h-[40px] max-w-[80px] rounded-[12px] bg-[#D4BA8E] px-3 text-[12px] font-medium text-[#FAFAFA] hover:bg-[#c7aa76] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="whitespace-nowrap">
            {logoutMutation.isPending ? 'Logging out' : 'Logout'}
          </span>
          <LogoutIcon className="h-3 w-3 shrink-0" />
        </ActionButton>

        <ActionButton
          to="/"
          ariaLabel="Back to website"
          className="h-[40px] max-w-[133px] rounded-[12px] bg-[#F3F3F3] px-3 text-[12px] font-medium text-[#262626] hover:bg-[#E8E8E8]"
        >
          <ArrowLeftIcon className="h-3 w-3 shrink-0" />
          <span className="whitespace-nowrap">Back to Website</span>
        </ActionButton>
      </div>
    </div>
  )
}

const Navbar = ({ onMobileMenuOpen }) => {
  const navigate = useNavigate()
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const { data: session } = useDashboardSession()
  const { data: notificationCount = 0 } = useDashboardNotificationCount()
  const { data: notificationData, isLoading: notificationsLoading } = useDashboardNotifications({
    limit: 12,
  })
  const markReadMutation = useDashboardMarkNotificationRead()
  const markAllReadMutation = useDashboardMarkAllNotificationsRead()
  const clearAllNotificationsMutation = useDashboardClearAllNotifications()

  const displayName = [session?.profile?.first_name, session?.profile?.last_name]
    .filter(Boolean)
    .join(' ')
  const fallbackName = [session?.user?.first_name, session?.user?.last_name]
    .filter(Boolean)
    .join(' ')
  const name = displayName || fallbackName || session?.user?.email || 'Customer'
  const notifications = useMemo(
    () => notificationData?.notifications ?? [],
    [notificationData?.notifications]
  )
  const unreadCount = Number(notificationData?.unreadCount ?? notificationCount ?? 0)
  const avatarNode = session?.profile?.photoUrl ? (
    <img
      src={session.profile.photoUrl}
      alt={name}
      className="h-8 w-8 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D9D9D9] text-[10px] font-medium text-white">
      {getInitials(name) || 'CU'}
    </div>
  )

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-20 flex h-[68px] w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 md:left-[260px] md:w-auto md:gap-4"
        style={{
          minHeight: DASHBOARD.NAVBAR_HEIGHT,
          backgroundColor: DASHBOARD.COLORS.NAVBAR_BG,
          borderBottom: `1px solid ${DASHBOARD.COLORS.NAVBAR_BORDER}`,
        }}
      >
        <div className="flex items-center md:hidden">
          <Link to="/" aria-label="Go to homepage">
            <h1 className="text-3xl text-[#1C1C1C]">ELEWEN</h1>
          </Link>
        </div>

        <div className="hidden min-w-0 md:block md:flex-1 md:max-w-[40%] lg:max-w-[320px]">
          <SearchBar />
        </div>

        <div className="hidden shrink-0 md:block">
          <UserMenu
            unreadCount={unreadCount}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
            avatarNode={avatarNode}
          />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            aria-label="Search"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#262626] transition-colors hover:bg-[#F3F3F3]"
          >
            <MobileSearchIcon />
          </button>

          <NotificationBellButton
            unreadCount={unreadCount}
            onClick={() => setIsNotificationModalOpen(true)}
            className="shrink-0 hover:bg-transparent"
          />

          <Link
            to="/user-dashboard/profile"
            aria-label="Open profile"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          >
            {avatarNode}
          </Link>

          <button
            type="button"
            aria-label="Open sidebar"
            onClick={onMobileMenuOpen}
            className="group flex h-10 w-10 shrink-0 flex-col items-end justify-center gap-1 rounded-full transition-colors hover:bg-[#F3F3F3]"
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      <MobileBottomActions />
      <NotificationModal
        open={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={notificationsLoading}
        markReadMutation={markReadMutation}
        markAllReadMutation={markAllReadMutation}
        clearAllNotificationsMutation={clearAllNotificationsMutation}
        navigate={navigate}
      />
    </>
  )
}

export default Navbar

function formatNotificationTime(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function resolveNotificationLink(linkUrl) {
  const url = String(linkUrl ?? '').trim()
  if (!url) return ''

  const bookingMatch = url.match(/^\/dashboard\/bookings\/([^/?#]+)/i)
  if (bookingMatch?.[1]) {
    return `/user-dashboard/details?bookingId=${bookingMatch[1]}`
  }

  if (url.startsWith('/dashboard')) {
    return url.replace(/^\/dashboard/i, '/user-dashboard')
  }

  return url
}

function NotificationModal({
  open,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  markReadMutation,
  markAllReadMutation,
  clearAllNotificationsMutation,
  navigate,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end px-6 pt-20 hide-scrollbar">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden="true" />

      <div
        className="relative z-10 w-full max-w-md rounded-[28px] border border-[#E4DED8] bg-white shadow-[0_18px_60px_rgba(17,24,39,0.16)] hide-scrollbar"
        data-lenis-prevent
        data-denis-prevent
      >
        <div className="flex items-center hide-scrollbar justify-between border-b border-[#EFE7E1] px-5 py-4">
          <div>
            <h2 className="text-base font-medium text-[#2E2E2E]">Notifications</h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              {unreadCount > 0 ? `${unreadCount} unread updates` : 'You are all caught up'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => clearAllNotificationsMutation.mutate()}
              disabled={!notifications.length || clearAllNotificationsMutation.isPending}
              className="text-xs font-medium text-[#591902] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {clearAllNotificationsMutation.isPending ? 'Clearing...' : 'Clear all'}
            </button>
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={!unreadCount || markAllReadMutation.isPending}
              className="text-xs font-medium text-[#591902] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-2 text-[#957960] transition hover:bg-[#F3EEE8]"
              aria-label="Close notifications"
            >
              <DashboardModalCloseIcon />
            </button>
          </div>
        </div>

        <div
          className="hide-scrollbar max-h-[52vh] overflow-y-auto px-3 py-3"
          data-lenis-prevent
          data-denis-prevent
        >
          {isLoading ? (
            <div className="rounded-2xl bg-[#F7F5F2] px-4 py-6 text-sm text-[#6B7280]">
              Loading notifications...
            </div>
          ) : notifications.length ? (
            <div className="space-y-3">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={async () => {
                    if (!notification.isRead) {
                      await markReadMutation.mutateAsync(notification.id)
                    }

                    const nextPath = resolveNotificationLink(notification.linkUrl)
                    if (nextPath) {
                      navigate(nextPath)
                      onClose()
                    }
                  }}
                  className={`block w-full rounded-2xl border px-4 py-3 text-left transition ${
                    notification.isRead
                      ? 'border-[#E8E1DA] bg-[#FAFAFA]'
                      : 'border-[#E7D2C4] bg-[#FFF8F2]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#2E2E2E]">{notification.title}</p>
                      {notification.message ? (
                        <p className="mt-1 text-sm text-[#6B7280]">{notification.message}</p>
                      ) : null}
                      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[#9CA3AF]">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>

                    {!notification.isRead ? (
                      <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#C68B1E]" />
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#F7F5F2] px-4 py-6 text-sm text-[#6B7280]">
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// export default function Navbar() {
//   const navigate = useNavigate()
//   const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
//   const { data: session } = useDashboardSession()
//   const { data: notificationCount = 0 } = useDashboardNotificationCount()
//   const { data: notificationData, isLoading: notificationsLoading } = useDashboardNotifications({
//     limit: 12,
//   })
//   const markReadMutation = useDashboardMarkNotificationRead()
//   const markAllReadMutation = useDashboardMarkAllNotificationsRead()
//   const logoutMutation = useDashboardLogout()

//   const displayName = [session?.profile?.first_name, session?.profile?.last_name]
//     .filter(Boolean)
//     .join(' ')
//   const fallbackName = [session?.user?.first_name, session?.user?.last_name]
//     .filter(Boolean)
//     .join(' ')
//   const name = displayName || fallbackName || session?.user?.email || 'Customer'
//   const notifications = useMemo(
//     () => notificationData?.notifications ?? [],
//     [notificationData?.notifications]
//   )
//   const unreadCount = Number(notificationData?.unreadCount ?? notificationCount ?? 0)

//   return (
//     <>
//       <header
//         className="fixed top-0 right-0 z-20 flex items-center justify-between px-6"
//         style={{
//           height: DASHBOARD.NAVBAR_HEIGHT,
//           left: DASHBOARD.SIDEBAR_WIDTH,
//           backgroundColor: DASHBOARD.COLORS.NAVBAR_BG,
//           borderBottom: `1px solid ${DASHBOARD.COLORS.NAVBAR_BORDER}`,
//         }}
//       >
//         <SearchBar />

//         <div className="flex items-center gap-4">
//           <Link to="/" className="text-sm text-[#111827]">
//             Back to Website
//           </Link>

//           <button
//             type="button"
//             onClick={async () => {
//               await logoutMutation.mutateAsync()
//               navigate('/', { replace: true })
//             }}
//             className="rounded-full bg-[#C6A15B] px-4 py-2 text-sm text-white"
//           >
//             {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
//           </button>

//           <button
//             type="button"
//             onClick={() => setIsNotificationModalOpen(true)}
//             className="rounded-full p-1 transition hover:bg-[#F3EADF]"
//             aria-label="Open notifications"
//           >
//             <NotificationBell count={unreadCount} />
//           </button>

//           {session?.profile?.photoUrl ? (
//             <img
//               src={session.profile.photoUrl}
//               alt={name}
//               className="h-9 w-9 rounded-full object-cover"
//             />
//           ) : (
//             <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D1D5DB] text-xs font-medium text-[#374151]">
//               {getInitials(name) || 'CU'}
//             </div>
//           )}
//         </div>
//       </header>

//       <NotificationModal
//         open={isNotificationModalOpen}
//         onClose={() => setIsNotificationModalOpen(false)}
//         notifications={notifications}
//         unreadCount={unreadCount}
//         isLoading={notificationsLoading}
//         markReadMutation={markReadMutation}
//         markAllReadMutation={markAllReadMutation}
//         navigate={navigate}
//       />
//     </>
//   )
// }
