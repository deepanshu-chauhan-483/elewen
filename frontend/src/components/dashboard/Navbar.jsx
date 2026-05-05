import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DASHBOARD } from '../../constants/dashboard'
import {
  useDashboardLogout,
  useDashboardNotificationCount,
  useDashboardNotifications,
  useDashboardMarkAllNotificationsRead,
  useDashboardMarkNotificationRead,
  useDashboardSession,
} from '../../hooks/useDashboardData'
import { getInitials } from './dashboardUtils'

function SearchBar() {
  return (
    <div className="flex w-[300px] items-center gap-2 rounded-full bg-[#F0F0F0] px-4 py-2">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6B7280"
        strokeWidth="1.8"
      >
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
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C68B1E"
        strokeWidth="1.8"
      >
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
  navigate,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end px-6 pt-20">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-[#E4DED8] bg-white shadow-[0_18px_60px_rgba(17,24,39,0.16)]">
        <div className="flex items-center justify-between border-b border-[#EFE7E1] px-5 py-4">
          <div>
            <h2 className="text-base font-medium text-[#2E2E2E]">Notifications</h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              {unreadCount > 0 ? `${unreadCount} unread updates` : 'You are all caught up'}
            </p>
          </div>

          <div className="flex items-center gap-3">
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
              className="text-lg leading-none text-[#6B7280]"
              aria-label="Close notifications"
            >
              x
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-3 py-3">
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

export default function Navbar() {
  const navigate = useNavigate()
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const { data: session } = useDashboardSession()
  const { data: notificationCount = 0 } = useDashboardNotificationCount()
  const { data: notificationData, isLoading: notificationsLoading } = useDashboardNotifications({
    limit: 12,
  })
  const markReadMutation = useDashboardMarkNotificationRead()
  const markAllReadMutation = useDashboardMarkAllNotificationsRead()
  const logoutMutation = useDashboardLogout()

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

  return (
    <>
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

          <button
            type="button"
            onClick={() => setIsNotificationModalOpen(true)}
            className="rounded-full p-1 transition hover:bg-[#F3EADF]"
            aria-label="Open notifications"
          >
            <NotificationBell count={unreadCount} />
          </button>

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

      <NotificationModal
        open={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={notificationsLoading}
        markReadMutation={markReadMutation}
        markAllReadMutation={markAllReadMutation}
        navigate={navigate}
      />
    </>
  )
}
