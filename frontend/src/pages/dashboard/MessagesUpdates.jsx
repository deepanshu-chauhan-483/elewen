import { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPageIntro,
  SectionCard,
} from '../../components/dashboard/DashboardUI'
import {
  useDashboardBookings,
  useDashboardClearAllNotifications,
  useDashboardMarkAllNotificationsRead,
  useDashboardMarkNotificationRead,
  useDashboardNotifications,
  // useDashboardSession,
  useDashboardThread,
} from '../../hooks/useDashboardData'
// import { formatDashboardDate } from '../../components/dashboard/dashboardUtils'
import EmptyBooking from '../../components/dashboard/EmptyBooking'

export default function MessagesUpdates() {
  const navigate = useNavigate()
  // const { data: session } = useDashboardSession()
  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    error: bookingsError,
  } = useDashboardBookings('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedBookingId = searchParams.get('bookingId') || ''
  // const [draft, setDraft] = useState('')
  const { data: notificationData, isLoading: notificationsLoading } = useDashboardNotifications({
    limit: 100,
  })
  const markReadMutation = useDashboardMarkNotificationRead()
  const markAllReadMutation = useDashboardMarkAllNotificationsRead()
  const clearAllNotificationsMutation = useDashboardClearAllNotifications()

  useEffect(() => {
    if (!bookings.length) return
    if (selectedBookingId && bookings.some(booking => booking.id === selectedBookingId)) return

    const next = new URLSearchParams(searchParams)
    next.set('bookingId', bookings[0].id)
    setSearchParams(next, { replace: true })
  }, [bookings, searchParams, selectedBookingId, setSearchParams])

  const {
    // data: thread,
    // isLoading: threadLoading,
    error: threadError,
  } = useDashboardThread(selectedBookingId)
  // const sendMessageMutation = useDashboardSendMessage()

  // const selectedBooking = useMemo(
  //   () => bookings.find(booking => booking.id === selectedBookingId) ?? null,
  //   [bookings, selectedBookingId]
  // )
  // const activeBookings = useMemo(
  //   () => bookings.filter(booking => booking.bookingCategory !== 'previous'),
  //   [bookings]
  // )
  // const previousBookings = useMemo(
  //   () => bookings.filter(booking => booking.bookingCategory === 'previous'),
  //   [bookings]
  // )
  const notifications = useMemo(
    () => notificationData?.notifications ?? [],
    [notificationData?.notifications]
  )
  const unreadNotificationCount = Number(notificationData?.unreadCount ?? 0)
  // const isReadOnlyThread = selectedBooking?.bookingCategory === 'previous'

  if (bookingsLoading) {
    return <DashboardLoadingState title="Loading booking messages..." />
  }

  if (bookingsError || threadError) {
    return <DashboardErrorState title="We could not load your message threads." />
  }

  if (bookings.length === 0) {
    return (
      <EmptyBooking
        title="No booking conversations yet"
        body="Once you have a booking, your planner updates and direct messages will appear here."
        actionLabel="Explore Packages"
        actionTo="/package-listing"
      />
    )
  }

  // const handleSubmit = async event => {
  //   event.preventDefault()
  //   if (!draft.trim() || !thread?.id || !selectedBookingId) return

  //   await sendMessageMutation.mutateAsync({
  //     threadId: thread.id,
  //     bookingId: selectedBookingId,
  //     messageText: draft.trim(),
  //   })

  //   setDraft('')
  // }

  return (
    <div className="">
      <DashboardPageIntro
        title="Messages & Updates"
        subtitle="Stay in touch with your event team and keep every booking conversation in one place."
        meta={`${bookings.length} conversations / ${notifications.length} notifications`}
      />

      <>
        <SectionCard>
          {notificationsLoading ? (
            <DashboardLoadingState title="Loading notifications..." />
          ) : notifications.length ? (
            <div className="space-y-3">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => clearAllNotificationsMutation.mutate()}
                  disabled={!notifications.length || clearAllNotificationsMutation.isPending}
                  className="text-sm font-medium text-[#8F2D1F] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {clearAllNotificationsMutation.isPending ? 'Clearing...' : 'Clear all'}
                </button>
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={!unreadNotificationCount || markAllReadMutation.isPending}
                  className="text-sm font-medium text-[#591902] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {markAllReadMutation.isPending ? 'Marking...' : 'Mark all read'}
                </button>
              </div>

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
                    }
                  }}
                  className={`block w-full rounded-2xl border px-4 py-4 text-left transition ${
                    notification.isRead
                      ? 'border-[#E8E1DA] bg-white'
                      : 'border-[#E7D2C4] bg-[#FFF8F2]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#2E2E2E]">
                        {notification.title || 'Notification'}
                      </p>
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
            <DashboardEmptyState
              title="No notifications yet"
              body="New booking alerts and planner updates will appear here automatically."
            />
          )}
        </SectionCard>
      </>
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
